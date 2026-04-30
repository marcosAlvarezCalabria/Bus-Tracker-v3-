import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  ARRIVALS_UPSTREAM_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  CACHE_TTL_MS: z.coerce.number().int().positive()
});

export type AppEnv = z.infer<typeof envSchema>;

export const parseEnv = (input: NodeJS.ProcessEnv): AppEnv => {
  return envSchema.parse(input);
};
