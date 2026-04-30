import { describe, expect, it } from "vitest";

import { vehicleFeedSchema } from "./index.js";

describe("vehicleFeedSchema", () => {
  it("accepts nullable coordinates", () => {
    const payload = vehicleFeedSchema.parse({
      updatedAt: new Date().toISOString(),
      vehicles: [
        {
          id: "vehicle-1",
          routeShortName: "401",
          stopId: "8460B001",
          latitude: null,
          longitude: null,
          delaySeconds: null
        }
      ]
    });

    expect(payload.vehicles[0]?.stopId).toBe("8460B001");
  });
});
