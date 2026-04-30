import { Router } from "express";

import type { VehicleFeedService } from "../services/vehicle-feed.service.js";

export const createPublicRouter = (vehicleFeedService: VehicleFeedService) => {
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

  return publicRouter;
};
