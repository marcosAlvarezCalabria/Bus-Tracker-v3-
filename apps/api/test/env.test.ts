import { describe, expect, it } from "vitest";

import { parseEnv } from "../src/config/env.js";

describe("parseEnv", () => {
  it("parses a valid environment", () => {
    const env = parseEnv({
      PORT: "3001",
      NODE_ENV: "development",
      NTA_API_KEY: "key",
      NTA_API_HEADER_NAME: "Ocp-Apim-Subscription-Key",
      UPSTREAM_VEHICLES_URL: "https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json",
      GTFS_STATIC_URL: "https://www.transportforireland.ie/transitData/Data/GTFS_Realtime.zip",
      CORS_ORIGIN: "http://localhost:5173",
      CACHE_TTL_MS: "10000"
    });

    expect(env.PORT).toBe(3001);
    expect(env.CACHE_TTL_MS).toBe(10000);
  });

  it("throws when a required value is missing", () => {
    expect(() =>
      parseEnv({
        PORT: "3001",
        NODE_ENV: "development"
      })
    ).toThrow();
  });
});

