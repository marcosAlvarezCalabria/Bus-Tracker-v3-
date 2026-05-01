import { afterEach, describe, expect, it, vi } from "vitest";

import { VehicleFeedService } from "../src/services/vehicle-feed.service.js";

describe("VehicleFeedService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches vehicles from the upstream API in development", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "vehicle-1",
          routeShortName: "401",
          stopId: null,
          lat: 53.274,
          lng: -9.049,
          delaySeconds: null
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    const service = new VehicleFeedService({
      PORT: 3001,
      NODE_ENV: "development",
      ARRIVALS_UPSTREAM_URL: "https://api.wwwmarcos-alvarez.com",
      CORS_ORIGIN: "http://localhost:5173",
      CACHE_TTL_MS: 10_000
    });

    const vehicles = await service.getVehicles("401");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0].toString()).toBe(
      "https://api.wwwmarcos-alvarez.com/vehicles?route=401"
    );
    expect(vehicles).toEqual([
      {
        id: "vehicle-1",
        routeShortName: "401",
        stopId: null,
        lat: 53.274,
        lng: -9.049,
        delaySeconds: null
      }
    ]);
  });

  it("queries the database in production", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          vehicleId: "vehicle-1",
          lat: 53.274,
          lng: -9.049,
          bearing: null,
          routeId: "route-401",
          tripId: "trip-1",
          routeShortName: "401"
        }
      ]
    });

    const service = new VehicleFeedService(
      {
        PORT: 3001,
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/galway_bus",
        ARRIVALS_UPSTREAM_URL: "https://api.wwwmarcos-alvarez.com",
        CORS_ORIGIN: "http://localhost:5173",
        CACHE_TTL_MS: 10_000
      },
      { query }
    );

    const vehicles = await service.getVehicles("401");

    expect(query).toHaveBeenCalledOnce();
    expect(query.mock.calls[0]?.[0]).toContain("LEFT JOIN trips t ON vp.trip_id = t.trip_id");
    expect(query.mock.calls[0]?.[0]).toContain("LEFT JOIN routes r ON t.route_id = r.route_id");
    expect(query.mock.calls[0]?.[0]).toContain("INTERVAL '6 minutes'");
    expect(query.mock.calls[0]?.[1]).toEqual(["401"]);
    expect(vehicles).toEqual([
      {
        id: "vehicle-1",
        routeShortName: "401",
        stopId: null,
        lat: 53.274,
        lng: -9.049,
        delaySeconds: null
      }
    ]);
  });
});
