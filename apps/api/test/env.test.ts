import { describe, expect, it } from "vitest";

import { parseEnv } from "../src/config/env.js";

describe("parseEnv", () => {
  it("parses a valid development environment without a database URL", () => {
    const env = parseEnv({
      PORT: "3001",
      NODE_ENV: "development",
      ARRIVALS_UPSTREAM_URL: "https://api.wwwmarcos-alvarez.com",
      CORS_ORIGIN: "http://localhost:5173",
      CACHE_TTL_MS: "10000"
    });

    expect(env.PORT).toBe(3001);
    expect(env.CACHE_TTL_MS).toBe(10000);
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.ARRIVALS_UPSTREAM_URL).toBe("https://api.wwwmarcos-alvarez.com");
  });

  it("parses the database URL in production", () => {
    const env = parseEnv({
      PORT: "3001",
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/galway_bus",
      ARRIVALS_UPSTREAM_URL: "https://api.wwwmarcos-alvarez.com",
      CORS_ORIGIN: "http://localhost:5173",
      CACHE_TTL_MS: "10000"
    });

    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/galway_bus");
  });

  it("throws when the production database URL is missing", () => {
    expect(() =>
      parseEnv({
        PORT: "3001",
        NODE_ENV: "production",
        ARRIVALS_UPSTREAM_URL: "https://api.wwwmarcos-alvarez.com",
        CORS_ORIGIN: "http://localhost:5173",
        CACHE_TTL_MS: "10000"
      })
    ).toThrow();
  });
});
