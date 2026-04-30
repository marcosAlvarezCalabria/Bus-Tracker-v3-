import { describe, expect, it } from "vitest";

import { vehicleListSchema } from "./index.js";

describe("vehicleListSchema", () => {
  it("accepts nullable coordinates", () => {
    const payload = vehicleListSchema.parse([
      {
        id: "vehicle-1",
        routeShortName: "401",
        stopId: "8460B001",
        lat: null,
        lng: null,
        delaySeconds: null
      }
    ]);

    expect(payload[0]?.stopId).toBe("8460B001");
  });
});
