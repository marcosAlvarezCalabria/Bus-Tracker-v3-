import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import type { AppEnv } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.route.js";
import { createPublicRouter } from "./routes/public.route.js";
import { VehicleFeedService } from "./services/vehicle-feed.service.js";

type AppDependencies = {
  vehicleFeedService?: VehicleFeedService;
};

export const createApp = (env: AppEnv, dependencies: AppDependencies = {}) => {
  const app = express();
  const vehicleFeedService = dependencies.vehicleFeedService ?? new VehicleFeedService(env);

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: [env.CORS_ORIGIN],
      credentials: true
    })
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/", createPublicRouter(vehicleFeedService));

  app.use(errorHandler);

  return app;
};
