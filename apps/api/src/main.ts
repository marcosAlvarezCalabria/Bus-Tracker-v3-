import { createServer } from "node:http";

import { createApp } from "./app.js";
import { parseEnv } from "./config/env.js";
import { logger } from "./lib/logger.js";

const bootstrap = async (): Promise<void> => {
  try {
    const env = parseEnv(process.env);
    const app = createApp(env);
    const server = createServer(app);

    server.listen(env.PORT, () => {
      logger.info(`API listening on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

void bootstrap();

