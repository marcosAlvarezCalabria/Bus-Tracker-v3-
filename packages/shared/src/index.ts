import { z } from "zod";

export const vehicleSchema = z.object({
  id: z.string(),
  routeShortName: z.string(),
  stopId: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  delaySeconds: z.number().int().nullable()
});

export const vehicleListSchema = z.array(vehicleSchema);

export const arrivalSchema = z.object({
  routeShortName: z.string(),
  headsign: z.string(),
  scheduledArrival: z.string(),
  delaySeconds: z.number().int().nullable()
});

export const arrivalListSchema = z.array(arrivalSchema);

export type Vehicle = z.infer<typeof vehicleSchema>;
export type VehicleList = z.infer<typeof vehicleListSchema>;
export type Arrival = z.infer<typeof arrivalSchema>;
export type ArrivalList = z.infer<typeof arrivalListSchema>;
