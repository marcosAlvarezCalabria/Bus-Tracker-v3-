import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

import { createApp } from "./app.js";
import { parseEnv } from "./config/env.js";
import { logger } from "./lib/logger.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  resolve(process.cwd(), "apps/api/.env"),
  resolve(process.cwd(), ".env"),
  resolve(currentDirectory, "../.env")
];
const envPath = envCandidates.find((candidate) => existsSync(candidate));

if (envPath) {
  dotenv.config({ path: envPath });
}

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
