import { Router } from "express";

import { vehicleFeedSchema } from "@bus-tracker/shared";

export const publicRouter = Router();

publicRouter.get("/vehicles", (_request, response) => {
  const payload = vehicleFeedSchema.parse({
    updatedAt: new Date().toISOString(),
    vehicles: []
  });

  response.status(200).json(payload);
});

