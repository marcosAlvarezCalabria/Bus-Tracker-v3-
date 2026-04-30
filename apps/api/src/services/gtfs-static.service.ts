import AdmZip from "adm-zip";

import type { AppEnv } from "../config/env.js";
import { parseCsv } from "../lib/csv.js";

type RouteMapCache = {
  cachedAt: number;
  routes: Map<string, string>;
};

export class GtfsStaticService {
  private readonly env: AppEnv;
  private routeMapCache: RouteMapCache | null = null;

  public constructor(env: AppEnv) {
    this.env = env;
  }

  public async getRouteMap(): Promise<Map<string, string>> {
    const now = Date.now();

    if (
      this.routeMapCache !== null &&
      now - this.routeMapCache.cachedAt < this.env.CACHE_TTL_MS
    ) {
      return this.routeMapCache.routes;
    }

    const response = await fetch(this.env.GTFS_STATIC_URL);

    if (!response.ok) {
      throw new Error(`GTFS static request failed with status ${response.status}.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));
    const routesEntry = zip.getEntry("routes.txt");

    if (routesEntry === null) {
      throw new Error("routes.txt was not found in GTFS static ZIP.");
    }

    const rows = parseCsv(routesEntry.getData().toString("utf8"));
    const [header, ...records] = rows;
    const routeIdIndex = header?.indexOf("route_id") ?? -1;
    const routeShortNameIndex = header?.indexOf("route_short_name") ?? -1;

    if (routeIdIndex < 0 || routeShortNameIndex < 0) {
      throw new Error("routes.txt is missing route_id or route_short_name.");
    }

    const routes = new Map<string, string>();

    for (const record of records) {
      const routeId = record[routeIdIndex]?.trim();
      const routeShortName = record[routeShortNameIndex]?.trim();

      if (routeId && routeShortName) {
        routes.set(routeId, routeShortName);
      }
    }

    this.routeMapCache = {
      cachedAt: now,
      routes
    };

    return routes;
  }
}

