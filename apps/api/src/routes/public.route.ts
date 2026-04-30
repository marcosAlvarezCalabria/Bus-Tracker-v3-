import { Router } from "express";

import { HttpError } from "../lib/http-error.js";
import type { ArrivalsService } from "../services/arrivals.service.js";
import type { VehicleFeedService } from "../services/vehicle-feed.service.js";

export const createPublicRouter = (
  vehicleFeedService: VehicleFeedService,
  arrivalsService: ArrivalsService
) => {
  const publicRouter = Router();

  publicRouter.get("/vehicles", async (request, response, next) => {
    try {
      const route =
        typeof request.query.route === "string" ? request.query.route : undefined;
      const payload = await vehicleFeedService.getVehicles(route);

      response.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  });

  publicRouter.get("/arrivals/:stopId", async (request, response, next) => {
    try {
      const stopId = request.params.stopId?.trim();

      if (!stopId) {
        throw new HttpError(400, "stopId is required.");
      }

      const payload = await arrivalsService.getArrivals(stopId);

      response.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  });

  return publicRouter;
};
