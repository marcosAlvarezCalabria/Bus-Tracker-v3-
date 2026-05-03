import { stopListSchema, type Stop } from "@bus-tracker/shared";
import { Pool } from "pg";

import type { AppEnv } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import { logger } from "../lib/logger.js";

type StopRow = {
  stopId: string | null;
  stopName: string | null;
  lat: number | null;
  lon: number | null;
};

export class StopsService {
  private readonly env: AppEnv;
  private readonly pool?: Pick<Pool, "query">;

  public constructor(env: AppEnv, pool?: Pick<Pool, "query">) {
    this.env = env;
    this.pool =
      pool ??
      (env.NODE_ENV === "production"
        ? new Pool({
            connectionString: env.DATABASE_URL
          })
        : undefined);
  }

  public async getStops(): Promise<Stop[]> {
    if (this.env.NODE_ENV !== "production") {
      return this.getStopsFromUpstream();
    }

    return this.getStopsFromDatabase();
  }

  private async getStopsFromUpstream(): Promise<Stop[]> {
    try {
      const baseUrl = this.env.ARRIVALS_UPSTREAM_URL.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/stops`);

      if (!response.ok) {
        const responseText = await response.text();

        logger.error({
          message: "Upstream stops request failed.",
          status: response.status,
          body: responseText
        });

        throw new HttpError(502, "Unable to fetch stops from upstream.");
      }

      const payload = (await response.json()) as Stop[];

      return stopListSchema.parse(payload);
    } catch (error) {
      logger.error(error);
      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(502, "Unable to fetch stops from upstream.");
    }
  }

  private async getStopsFromDatabase(): Promise<Stop[]> {
    try {
      if (!this.pool) {
        throw new HttpError(500, "Database pool is not configured.");
      }

      const result = await this.pool.query<StopRow>(
        `
SELECT
  stop_id    as "stopId",
  stop_name  as "stopName",
  stop_lat   as lat,
  stop_lon   as lon
FROM stops
WHERE stop_id LIKE '8240%'
ORDER BY stop_name
LIMIT 500
`
      );

      return stopListSchema.parse(
        result.rows
          .filter(
            (row) =>
              typeof row.stopId === "string" &&
              typeof row.stopName === "string" &&
              typeof row.lat === "number" &&
              typeof row.lon === "number"
          )
          .map((row) => ({
            stopId: row.stopId!.trim(),
            stopName: row.stopName!.trim(),
            lat: row.lat!,
            lon: row.lon!
          }))
      );
    } catch (error) {
      logger.error(error);
      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(502, "Unable to fetch stops from database.");
    }
  }
}
