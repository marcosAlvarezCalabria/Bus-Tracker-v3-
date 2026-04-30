import { vehicleListSchema, type Vehicle } from "@bus-tracker/shared";
import { Pool } from "pg";

import type { AppEnv } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import { logger } from "../lib/logger.js";

type VehicleRow = {
  vehicleId: string | number;
  lat: number | null;
  lng: number | null;
  bearing: number | null;
  routeId: string | null;
  tripId: string | null;
  routeShortName: string | null;
};

export class VehicleFeedService {
  private readonly pool: Pick<Pool, "query">;

  public constructor(env: AppEnv, pool?: Pick<Pool, "query">) {
    this.pool =
      pool ??
      new Pool({
        connectionString: env.DATABASE_URL
      });
  }

  public async getVehicles(route?: string): Promise<Vehicle[]> {
    try {
      const normalizedRoute = route?.trim();
      const values: string[] = [];
      let query = `
SELECT
  vp.vehicle_id as "vehicleId",
  vp.latitude as lat,
  vp.longitude as lng,
  vp.bearing,
  vp.route_id as "routeId",
  vp.trip_id as "tripId",
  r.route_short_name as "routeShortName"
FROM vehicle_positions_galway vp
LEFT JOIN routes r ON vp.route_id = r.route_id
WHERE vp.observed_at > NOW() - INTERVAL '2 minutes'
`;

      if (normalizedRoute) {
        values.push(normalizedRoute);
        query += ` AND r.route_short_name = $1`;
      }

      query += `
ORDER BY vp.observed_at DESC;
`;

      const result = await this.pool.query<VehicleRow>(query, values);

      return vehicleListSchema.parse(
        result.rows
          .filter((row) => typeof row.routeShortName === "string" && row.routeShortName.trim())
          .map((row) => ({
            id: String(row.vehicleId),
            routeShortName: row.routeShortName!.trim(),
            stopId: null,
            lat: row.lat,
            lng: row.lng,
            delaySeconds: null
          }))
      );
    } catch (error) {
      logger.error(error);
      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(502, "Unable to fetch vehicles from database.");
    }
  }
}
