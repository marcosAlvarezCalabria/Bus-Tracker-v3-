import { Router } from "express";

import type { VehicleFeedService } from "../services/vehicle-feed.service.js";

export const createPublicRouter = (vehicleFeedService: VehicleFeedService) => {
  const publicRouter = Router();

  publicRouter.get("/vehicles", async (_request, response, next) => {
    try {
      const payload = await vehicleFeedService.getVehicles();

      response.status(200).json(payload);
    } catch (error) {
      next(error);
    }
  });

  return publicRouter;
};
