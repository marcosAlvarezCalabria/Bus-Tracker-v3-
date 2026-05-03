export interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  direction?: string;
}

export interface Arrival {
  stopId: string;
  routeId: string;
  routeShortName: string;
  scheduledArrivalTime: number;
  predictedArrivalTime?: number;
  delaySeconds?: number;
}

export type DelayLevel = "on-time" | "warning" | "late";

export interface BusPosition {
  id?: string;
  vehicleId?: string;
  routeShortName: string;
  routeName?: string;
  routeId?: string;
  tripId?: string;
  lat: number;
  lng: number;
}
