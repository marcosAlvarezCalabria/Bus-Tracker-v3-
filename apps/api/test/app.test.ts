import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import type { AppEnv } from "../src/config/env.js";

const env: AppEnv = {
  PORT: 3001,
  NODE_ENV: "test",
  NTA_API_KEY: "test-key",
  NTA_API_HEADER_NAME: "Ocp-Apim-Subscription-Key",
  UPSTREAM_VEHICLES_URL: "https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json",
  GTFS_STATIC_URL: "https://www.transportforireland.ie/transitData/Data/GTFS_Realtime.zip",
  CORS_ORIGIN: "http://localhost:5173",
  CACHE_TTL_MS: 10_000
};

describe("createApp", () => {
  it("returns the health payload", async () => {
    const app = createApp(env);

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});

