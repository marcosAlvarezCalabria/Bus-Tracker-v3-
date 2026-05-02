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
