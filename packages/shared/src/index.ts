import { z } from "zod";

export const vehicleSchema = z.object({
  id: z.string(),
  routeShortName: z.string(),
  stopId: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  delaySeconds: z.number().int().nullable()
});

export const vehicleFeedSchema = z.object({
  updatedAt: z.string().datetime(),
  vehicles: z.array(vehicleSchema)
});

export type Vehicle = z.infer<typeof vehicleSchema>;
export type VehicleFeed = z.infer<typeof vehicleFeedSchema>;

