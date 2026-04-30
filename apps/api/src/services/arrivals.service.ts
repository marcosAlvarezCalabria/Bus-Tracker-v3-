import { arrivalListSchema, type Arrival } from "@bus-tracker/shared";
import { Pool } from "pg";

import type { AppEnv } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import { logger } from "../lib/logger.js";

type ArrivalRow = {
  routeShortName: string | null;
  headsign: string | null;
  scheduledArrival: string | null;
  delaySeconds: number | null;
};

export class ArrivalsService {
  private readonly env: AppEnv;
  private readonly pool: Pick<Pool, "query">;

  public constructor(env: AppEnv, pool?: Pick<Pool, "query">) {
    this.env = env;
    this.pool =
      pool ??
      new Pool({
        connectionString: env.DATABASE_URL
      });
  }

  public async getArrivals(stopId: string): Promise<Arrival[]> {
    if (this.env.NODE_ENV !== "production") {
      return this.getArrivalsFromUpstream(stopId);
    }

    return this.getArrivalsFromDatabase(stopId);
  }

  private async getArrivalsFromUpstream(stopId: string): Promise<Arrival[]> {
    try {
      const baseUrl = this.env.ARRIVALS_UPSTREAM_URL.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/arrivals/${encodeURIComponent(stopId)}`);

      if (!response.ok) {
        const responseText = await response.text();

        logger.error({
          message: "Upstream arrivals request failed.",
          status: response.status,
          body: responseText
        });

        throw new HttpError(502, "Unable to fetch arrivals from upstream.");
      }

      const payload = (await response.json()) as Arrival[];

      return arrivalListSchema.parse(payload);
    } catch (error) {
      logger.error(error);
      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(502, "Unable to fetch arrivals from upstream.");
    }
  }

  private async getArrivalsFromDatabase(stopId: string): Promise<Arrival[]> {
    try {
      const result = await this.pool.query<ArrivalRow>(
        `
SELECT
  route_short_name as "routeShortName",
  headsign,
  scheduled_arrival as "scheduledArrival",
  delay_seconds as "delaySeconds"
FROM arrivals_current
WHERE stop_id = $1
ORDER BY scheduled_arrival
LIMIT 10
`,
        [stopId]
      );

      return arrivalListSchema.parse(
        result.rows
          .filter(
            (row) =>
              typeof row.routeShortName === "string" &&
              typeof row.headsign === "string" &&
              typeof row.scheduledArrival === "string"
          )
          .map((row) => ({
            routeShortName: row.routeShortName!.trim(),
            headsign: row.headsign!.trim(),
            scheduledArrival: row.scheduledArrival!.trim(),
            delaySeconds: row.delaySeconds
          }))
      );
    } catch (error) {
      logger.error(error);
      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(502, "Unable to fetch arrivals from database.");
    }
  }
}
