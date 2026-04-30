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

export type Vehicle = z.infer<typeof vehicleSchema>;
export type VehicleList = z.infer<typeof vehicleListSchema>;
