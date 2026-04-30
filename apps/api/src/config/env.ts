import { z } from "zod";

const rawEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NTA_API_KEY: z.string().min(1),
  NTA_API_HEADER_NAME: z.string().min(1),
  UPSTREAM_VEHICLES_URL_DEV: z.string().url(),
  UPSTREAM_VEHICLES_URL_PROD: z.string().url(),
  GTFS_STATIC_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  CACHE_TTL_MS: z.coerce.number().int().positive()
});

export type AppEnv = z.infer<typeof rawEnvSchema> & {
  UPSTREAM_VEHICLES_URL: string;
};

export const parseEnv = (input: NodeJS.ProcessEnv): AppEnv => {
  const env = rawEnvSchema.parse(input);

  return {
    ...env,
    UPSTREAM_VEHICLES_URL:
      env.NODE_ENV === "production"
        ? env.UPSTREAM_VEHICLES_URL_PROD
        : env.UPSTREAM_VEHICLES_URL_DEV
  };
};
