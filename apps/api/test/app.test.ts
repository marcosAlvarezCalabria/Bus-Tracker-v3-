import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import type { AppEnv } from "../src/config/env.js";
import type { Arrival, Vehicle } from "@bus-tracker/shared";
import type { ArrivalsService } from "../src/services/arrivals.service.js";
import type { VehicleFeedService } from "../src/services/vehicle-feed.service.js";

const env: AppEnv = {
  PORT: 3001,
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/galway_bus",
  ARRIVALS_UPSTREAM_URL: "https://api.wwwmarcos-alvarez.com",
  CORS_ORIGIN: ["http://localhost:5173", "https://bus-tracker-v3.pages.dev"],
  CACHE_TTL_MS: 10_000
};

const vehicleFeedServiceStub = {
  async getVehicles(route?: string): Promise<Vehicle[]> {
    if (route === "401") {
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

const arrivalsServiceStub = {
  async getArrivals(stopId: string): Promise<Arrival[]> {
    if (stopId === "8460B001") {
      return [
        {
          routeShortName: "401",
          headsign: "Eyre Square",
          scheduledArrival: "18:36:30",
          delaySeconds: 120
        }
      ];
    }

    return [];
  }
} as ArrivalsService;

describe("createApp", () => {
  it("returns the health payload with a timestamp", async () => {
    const app = createApp(env, {
      arrivalsService: arrivalsServiceStub,
      vehicleFeedService: vehicleFeedServiceStub
    });

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toBeTypeOf("string");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("returns vehicles at the root endpoint", async () => {
    const app = createApp(env, {
      arrivalsService: arrivalsServiceStub,
      vehicleFeedService: vehicleFeedServiceStub
    });

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

  it("passes the route filter through to the vehicle service", async () => {
    const app = createApp(env, {
      arrivalsService: arrivalsServiceStub,
      vehicleFeedService: vehicleFeedServiceStub
    });

    const response = await request(app).get("/vehicles?route=401");

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

  it("returns arrivals for a stop", async () => {
    const app = createApp(env, {
      arrivalsService: arrivalsServiceStub,
      vehicleFeedService: vehicleFeedServiceStub
    });

    const response = await request(app).get("/arrivals/8460B001");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        routeShortName: "401",
        headsign: "Eyre Square",
        scheduledArrival: "18:36:30",
        delaySeconds: 120
      }
    ]);
  });

  it("returns 400 when stopId is blank", async () => {
    const app = createApp(env, {
      arrivalsService: arrivalsServiceStub,
      vehicleFeedService: vehicleFeedServiceStub
    });

    const response = await request(app).get("/arrivals/%20");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "stopId is required." });
  });

  it("allows requests from the deployed frontend origin", async () => {
    const app = createApp(env, {
      arrivalsService: arrivalsServiceStub,
      vehicleFeedService: vehicleFeedServiceStub
    });

    const response = await request(app)
      .get("/vehicles")
      .set("Origin", "https://bus-tracker-v3.pages.dev");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://bus-tracker-v3.pages.dev"
    );
  });
});
