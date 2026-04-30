import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import type { AppEnv } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.route.js";
import { publicRouter } from "./routes/public.route.js";

export const createApp = (env: AppEnv) => {
  const app = express();

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
  app.use("/api", publicRouter);

  app.use(errorHandler);

  return app;
};

