import { vehicleListSchema, type Vehicle } from "@bus-tracker/shared";

import type { AppEnv } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import { logger } from "../lib/logger.js";
import { GtfsStaticService } from "./gtfs-static.service.js";

type VehiclesCache = {
  cachedAt: number;
  vehicles: Vehicle[];
};

type UpstreamEntity = {
  id?: string;
  vehicle?: {
    trip?: {
      routeId?: string;
      route_id?: string;
    };
    vehicle?: {
      id?: string;
    };
    stopId?: string;
    stop_id?: string;
    position?: {
      latitude?: number;
      longitude?: number;
    };
  };
};

type UpstreamFeed = {
  entity?: UpstreamEntity[];
};

type NormalizedUpstreamVehicle = {
  id?: string;
  lat?: number | null;
  lng?: number | null;
  routeShortName?: string;
  stopId?: string | null;
  delaySeconds?: number | null;
};

export class VehicleFeedService {
  private readonly env: AppEnv;
  private readonly gtfsStaticService: GtfsStaticService;
  private vehiclesCache: VehiclesCache | null = null;

  public constructor(env: AppEnv, gtfsStaticService: GtfsStaticService) {
    this.env = env;
    this.gtfsStaticService = gtfsStaticService;
  }

  public async getVehicles(): Promise<Vehicle[]> {
    const now = Date.now();

    if (
      this.vehiclesCache !== null &&
      now - this.vehiclesCache.cachedAt < this.env.CACHE_TTL_MS
    ) {
      return this.vehiclesCache.vehicles;
    }

    const response = await fetch(this.env.UPSTREAM_VEHICLES_URL, {
      headers: this.buildHeaders()
    });

    if (!response.ok) {
      const responseText = await response.text();

      logger.error({
        message: "Upstream vehicles request failed.",
        status: response.status,
        body: responseText
      });

      throw new HttpError(502, "Unable to fetch vehicles from upstream.");
    }

    const payload = (await response.json()) as UpstreamFeed | NormalizedUpstreamVehicle[];
    const vehicles = Array.isArray(payload)
      ? this.parseNormalizedVehicles(payload)
      : await this.parseGtfsVehicles(payload);

    this.vehiclesCache = {
      cachedAt: now,
      vehicles
    };

    return vehicles;
  }

  private buildHeaders(): Headers {
    const headers = new Headers();
    const upstreamUrl = new URL(this.env.UPSTREAM_VEHICLES_URL);

    if (upstreamUrl.hostname === "api.nationaltransport.ie") {
      headers.set(this.env.NTA_API_HEADER_NAME, this.env.NTA_API_KEY);
      headers.set("x-api-key", this.env.NTA_API_KEY);
    }

    return headers;
  }

  private parseNormalizedVehicles(payload: NormalizedUpstreamVehicle[]): Vehicle[] {
    return vehicleListSchema.parse(
      payload
        .map((vehicle) => this.mapNormalizedVehicle(vehicle))
        .filter((vehicle): vehicle is Vehicle => vehicle !== null)
    );
  }

  private async parseGtfsVehicles(payload: UpstreamFeed): Promise<Vehicle[]> {
    const routeMap = await this.gtfsStaticService.getRouteMap();

    return vehicleListSchema.parse(
      (payload.entity ?? [])
        .map((entity) => this.mapVehicle(entity, routeMap))
        .filter((vehicle): vehicle is Vehicle => vehicle !== null)
    );
  }

  private mapNormalizedVehicle(vehicle: NormalizedUpstreamVehicle): Vehicle | null {
    const routeShortName = vehicle.routeShortName?.trim();

    if (!vehicle.id?.trim() || !routeShortName) {
      return null;
    }

    return {
      id: vehicle.id.trim(),
      routeShortName,
      stopId: vehicle.stopId?.trim() ?? null,
      lat: vehicle.lat ?? null,
      lng: vehicle.lng ?? null,
      delaySeconds: vehicle.delaySeconds ?? null
    };
  }

  private mapVehicle(entity: UpstreamEntity, routeMap: Map<string, string>): Vehicle | null {
    const routeId =
      entity.vehicle?.trip?.routeId?.trim() ?? entity.vehicle?.trip?.route_id?.trim();

    if (!routeId) {
      return null;
    }

    const routeShortName = routeMap.get(routeId);

    if (!routeShortName) {
      return null;
    }

    return {
      id: entity.vehicle?.vehicle?.id?.trim() || entity.id?.trim() || routeId,
      routeShortName,
      stopId: entity.vehicle?.stopId?.trim() ?? entity.vehicle?.stop_id?.trim() ?? null,
      lat: entity.vehicle?.position?.latitude ?? null,
      lng: entity.vehicle?.position?.longitude ?? null,
      delaySeconds: null
    };
  }
}
