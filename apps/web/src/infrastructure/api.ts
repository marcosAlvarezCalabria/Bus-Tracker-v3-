import type { Arrival, BusPosition, Stop } from "../domain/types";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "/api";

type StopApiResponse = {
  id?: string;
  stopId?: string;
  name?: string;
  stopName?: string;
  lat: number;
  lon?: number;
  lng?: number;
  direction?: string;
};

type ArrivalApiResponse = {
  stopId?: string;
  routeId?: string;
  routeShortName: string;
  scheduledArrival?: string;
  scheduledArrivalTime?: number;
  predictedArrivalTime?: number;
  delaySeconds?: number | null;
};

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

const toUnixMilliseconds = (value?: string): number => {
  if (!value) {
    return Date.now();
  }

  const [hoursText = "0", minutesText = "0", secondsText = "0"] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMilliseconds(
    (hours * 60 * 60 + minutes * 60 + seconds) * 1000
  );

  return date.getTime();
};

export const searchStops = async (query: string): Promise<Stop[]> => {
  const payload = await fetchJson<StopApiResponse[]>(
    `/stops/search?q=${encodeURIComponent(query)}`
  );

  return payload.map((stop) => ({
    id: stop.id ?? stop.stopId ?? "",
    name: stop.name ?? stop.stopName ?? "",
    lat: stop.lat,
    lon: stop.lon ?? stop.lng ?? 0,
    direction: stop.direction
  }));
};

export const getArrivals = async (stopId: string): Promise<Arrival[]> => {
  const payload = await fetchJson<ArrivalApiResponse[]>(
    `/arrivals/${encodeURIComponent(stopId)}`
  );

  return payload.map((arrival) => {
    const scheduledArrivalTime =
      arrival.scheduledArrivalTime ?? toUnixMilliseconds(arrival.scheduledArrival);
    const predictedArrivalTime =
      typeof arrival.predictedArrivalTime === "number"
        ? arrival.predictedArrivalTime
        : typeof arrival.delaySeconds === "number"
          ? scheduledArrivalTime + arrival.delaySeconds * 1000
          : undefined;

    return {
      stopId,
      routeId: arrival.routeId ?? arrival.routeShortName,
      routeShortName: arrival.routeShortName,
      scheduledArrivalTime,
      predictedArrivalTime,
      delaySeconds: arrival.delaySeconds ?? undefined
    };
  });
};

export const getVehiclesByRoute = async (route: string): Promise<BusPosition[]> => {
  try {
    return await fetchJson<BusPosition[]>(`/vehicles?route=${encodeURIComponent(route)}`);
  } catch {
    return [];
  }
};

export const getStops = async (): Promise<Stop[]> => {
  try {
    const payload = await fetchJson<StopApiResponse[]>("/stops");

    return payload.map((stop) => ({
      id: stop.id ?? stop.stopId ?? "",
      name: stop.name ?? stop.stopName ?? "",
      lat: stop.lat,
      lon: stop.lon ?? stop.lng ?? 0,
      direction: stop.direction
    }));
  } catch {
    return [];
  }
};
