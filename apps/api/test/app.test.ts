import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import type { AppEnv } from "../src/config/env.js";
import type { VehicleFeedService } from "../src/services/vehicle-feed.service.js";

const env: AppEnv = {
  PORT: 3001,
  NODE_ENV: "test",
  NTA_API_KEY: "test-key",
  NTA_API_HEADER_NAME: "Ocp-Apim-Subscription-Key",
  UPSTREAM_VEHICLES_URL_DEV: "https://api.wwwmarcos-alvarez.com/vehicles",
  UPSTREAM_VEHICLES_URL_PROD: "https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json",
  UPSTREAM_VEHICLES_URL: "https://api.wwwmarcos-alvarez.com/vehicles",
  GTFS_STATIC_URL: "https://www.transportforireland.ie/transitData/Data/GTFS_Realtime.zip",
  CORS_ORIGIN: "http://localhost:5173",
  CACHE_TTL_MS: 10_000
};

const vehicleFeedServiceStub = {
  async getVehicles() {
    return [
      {
        id: "vehicle-1",
        routeShortName: "401",
        stopId: "8460B001",
        lat: 53.274,
        lng: -9.049,
        delaySeconds: null
      }
    ];
  }
} as VehicleFeedService;

describe("createApp", () => {
  it("returns the health payload with a timestamp", async () => {
    const app = createApp(env, { vehicleFeedService: vehicleFeedServiceStub });

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toBeTypeOf("string");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("returns vehicles at the root endpoint", async () => {
    const app = createApp(env, { vehicleFeedService: vehicleFeedServiceStub });

    const response = await request(app).get("/vehicles");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: "vehicle-1",
        routeShortName: "401",
        stopId: "8460B001",
        lat: 53.274,
        lng: -9.049,
        delaySeconds: null
      }
    ]);
  });
});
