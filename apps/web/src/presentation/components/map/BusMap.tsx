import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type StyleSpecification
} from "maplibre-gl";
import type { Feature, FeatureCollection, Point } from "geojson";

import type { BusPosition, Stop } from "../../../domain/types";
import { getStops, getVehiclesByRoute } from "../../../infrastructure/api";

interface BusMapProps {
  selectedRoute: string | null;
  onStopClick: (stopId: string) => void;
  userLocation: { lat: number; lng: number } | null;
}

type StopFeatureProperties = {
  stopId: string;
  stopName: string;
};

type BusFeatureProperties = {
  routeShortName: string;
  vehicleId: string;
};

type UserLocationFeatureProperties = {
  kind: "user-location";
};

const GALWAY_CENTER: [number, number] = [-9.0568, 53.2707];
const ANIMATION_DURATION_MS = 1000;
const REFRESH_INTERVAL_MS = 4000;

const baseMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    }
  },
  layers: [{ id: "osm-layer", type: "raster", source: "osm" }]
};

const emptyBusesCollection = (): FeatureCollection<Point, BusFeatureProperties> => ({
  type: "FeatureCollection",
  features: []
});

const createUserLocationCollection = (
  userLocation: { lat: number; lng: number } | null
): FeatureCollection<Point, UserLocationFeatureProperties> => ({
  type: "FeatureCollection",
  features: userLocation
    ? [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [userLocation.lng, userLocation.lat]
          },
          properties: {
            kind: "user-location"
          }
        }
      ]
    : []
});

const createStopsCollection = (
  stops: Stop[]
): FeatureCollection<Point, StopFeatureProperties> => ({
  type: "FeatureCollection",
  features: stops.map<Feature<Point, StopFeatureProperties>>((stop) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [stop.lon, stop.lat]
    },
    properties: {
      stopId: stop.id,
      stopName: stop.name
    }
  }))
});

const createBusesCollection = (
  vehicles: BusPosition[],
  coordinatesByVehicleId?: Map<string, [number, number]>
): FeatureCollection<Point, BusFeatureProperties> => ({
  type: "FeatureCollection",
  features: vehicles.map<Feature<Point, BusFeatureProperties>>((vehicle) => {
    const vehicleId = resolveVehicleId(vehicle);
    const coordinates = coordinatesByVehicleId?.get(vehicleId) ?? [vehicle.lng, vehicle.lat];

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates
      },
      properties: {
        routeShortName: vehicle.routeShortName,
        vehicleId
      }
    };
  })
});

const resolveVehicleId = (bus: BusPosition): string =>
  bus.vehicleId ?? bus.id ?? `${bus.lat}-${bus.lng}`;

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceInMeters = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) => {
  const earthRadius = 6_371_000;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const getNearbyStops = (stops: Stop[], userLocation: { lat: number; lng: number }): Stop[] =>
  stops
    .map((stop) => ({
      stop,
      distance: getDistanceInMeters(userLocation, { lat: stop.lat, lng: stop.lon })
    }))
    .filter(({ distance }) => distance <= 1200)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 25)
    .map(({ stop }) => stop);

export const BusMap = ({ selectedRoute, onStopClick, userLocation }: BusMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onStopClickRef = useRef(onStopClick);
  const stopsLoadedRef = useRef(false);
  const allStopsRef = useRef<Stop[]>([]);
  const previousPositionsRef = useRef<Map<string, [number, number]>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onStopClickRef.current = onStopClick;
  }, [onStopClick]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: baseMapStyle,
      center: GALWAY_CENTER,
      zoom: 13
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      if (!map.getSource("stops-source")) {
        map.addSource("stops-source", {
          type: "geojson",
          data: createStopsCollection([])
        });
      }

      if (!map.getLayer("stops-layer")) {
        map.addLayer({
          id: "stops-layer",
          type: "circle",
          source: "stops-source",
          paint: {
            "circle-color": "#660033",
            "circle-radius": 6,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5
          }
        });
      }

      if (!map.getSource("buses-source")) {
        map.addSource("buses-source", {
          type: "geojson",
          data: emptyBusesCollection()
        });
      }

      if (!map.getSource("user-location-source")) {
        map.addSource("user-location-source", {
          type: "geojson",
          data: createUserLocationCollection(null)
        });
      }

      if (!map.getLayer("buses-layer")) {
        map.addLayer({
          id: "buses-layer",
          type: "symbol",
          source: "buses-source",
          layout: {
            "text-field": ["get", "routeShortName"],
            "text-size": 12,
            "text-allow-overlap": true,
            "text-ignore-placement": true
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#660033",
            "text-halo-width": 8,
            "text-halo-blur": 0.5
          }
        });
      }

      if (!map.getLayer("user-location-layer")) {
        map.addLayer({
          id: "user-location-layer",
          type: "circle",
          source: "user-location-source",
          paint: {
            "circle-color": "#ffaacc",
            "circle-radius": 8,
            "circle-stroke-color": "#660033",
            "circle-stroke-width": 3
          }
        });
      }

      map.on("click", "stops-layer", (event) => {
        const feature = event.features?.[0];

        if (!feature) {
          return;
        }

        const properties = feature.properties as Record<string, unknown> | null;
        const stopId = properties?.stopId;

        if (typeof stopId === "string" && stopId.length > 0) {
          onStopClickRef.current(stopId);
        }
      });

      map.on("mouseenter", "stops-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "stops-layer", () => {
        map.getCanvas().style.cursor = "";
      });

      setMapReady(true);
    });

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }

      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady || !map.isStyleLoaded()) {
      return;
    }

    const busesSource = map.getSource("buses-source");

    if (!busesSource || !("setData" in busesSource)) {
      return;
    }

    const source = busesSource as GeoJSONSource;

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (selectedRoute === null) {
      previousPositionsRef.current = new Map();
      source.setData(emptyBusesCollection());
      return;
    }

    const applyVehiclePositions = (vehicles: BusPosition[]) => {
      const nextPositions = new Map<string, [number, number]>();

      for (const vehicle of vehicles) {
        nextPositions.set(resolveVehicleId(vehicle), [vehicle.lng, vehicle.lat]);
      }

      const previousPositions = previousPositionsRef.current;
      const shouldAnimate = vehicles.some((vehicle) =>
        previousPositions.has(resolveVehicleId(vehicle))
      );

      if (!shouldAnimate) {
        source.setData(createBusesCollection(vehicles, nextPositions));
        previousPositionsRef.current = nextPositions;
        return;
      }

      const startPositions = new Map(previousPositions);
      const startTime = performance.now();

      const animate = (frameTime: number) => {
        const progress = Math.min((frameTime - startTime) / ANIMATION_DURATION_MS, 1);
        const interpolatedPositions = new Map<string, [number, number]>();

        for (const vehicle of vehicles) {
          const vehicleId = resolveVehicleId(vehicle);
          const previous = startPositions.get(vehicleId);

          if (!previous) {
            interpolatedPositions.set(vehicleId, [vehicle.lng, vehicle.lat]);
            continue;
          }

          const interpolatedLng = previous[0] + (vehicle.lng - previous[0]) * progress;
          const interpolatedLat = previous[1] + (vehicle.lat - previous[1]) * progress;

          interpolatedPositions.set(vehicleId, [interpolatedLng, interpolatedLat]);
        }

        source.setData(createBusesCollection(vehicles, interpolatedPositions));

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
          return;
        }

        animationFrameRef.current = null;
      };

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
      previousPositionsRef.current = nextPositions;
    };

    const refreshVehicles = async () => {
      const vehicles = await getVehiclesByRoute(selectedRoute);
      applyVehiclePositions(vehicles);
    };

    void refreshVehicles();
    intervalRef.current = window.setInterval(() => {
      void refreshVehicles();
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [mapReady, selectedRoute]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady || !map.isStyleLoaded()) {
      return;
    }

    const stopsSource = map.getSource("stops-source");

    if (!stopsSource || !("setData" in stopsSource)) {
      return;
    }

    const source = stopsSource as GeoJSONSource;

    if (userLocation === null) {
      source.setData(createStopsCollection([]));
      return;
    }

    const applyNearbyStops = (stops: Stop[]) => {
      source.setData(createStopsCollection(getNearbyStops(stops, userLocation)));
    };

    if (stopsLoadedRef.current) {
      applyNearbyStops(allStopsRef.current);
      return;
    }

    void (async () => {
      const stops = await getStops();
      allStopsRef.current = stops;
      stopsLoadedRef.current = true;
      applyNearbyStops(stops);
    })();
  }, [mapReady, userLocation]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady || !map.isStyleLoaded()) {
      return;
    }

    const userLocationSource = map.getSource("user-location-source");

    if (!userLocationSource || !("setData" in userLocationSource)) {
      return;
    }

    (userLocationSource as GeoJSONSource).setData(createUserLocationCollection(userLocation));
  }, [mapReady, userLocation]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />;
};
