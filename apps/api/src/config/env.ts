import { z } from "zod";

const commonEnvSchema = {
  PORT: z.coerce.number().int().min(1).max(65535),
  ARRIVALS_UPSTREAM_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  CACHE_TTL_MS: z.coerce.number().int().positive()
};

const envSchema = z.discriminatedUnion("NODE_ENV", [
  z.object({
    ...commonEnvSchema,
    NODE_ENV: z.literal("production"),
    DATABASE_URL: z.string().url()
  }),
  z.object({
    ...commonEnvSchema,
    NODE_ENV: z.literal("development"),
    DATABASE_URL: z.string().url().optional()
  }),
  z.object({
    ...commonEnvSchema,
    NODE_ENV: z.literal("test"),
    DATABASE_URL: z.string().url().optional()
  })
]);

export type AppEnv = z.infer<typeof envSchema>;

export const parseEnv = (input: NodeJS.ProcessEnv): AppEnv => {
  return envSchema.parse(input);
};
