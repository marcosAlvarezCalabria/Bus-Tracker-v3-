import { z } from "zod";

const corsOriginSchema = z
  .string()
  .transform((value, context) => {
    const origins = value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (origins.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one CORS origin is required."
      });

      return z.NEVER;
    }

    for (const origin of origins) {
      const result = z.string().url().safeParse(origin);

      if (!result.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid CORS origin: ${origin}`
        });

        return z.NEVER;
      }
    }

    return origins;
  });

const commonEnvSchema = {
  PORT: z.coerce.number().int().min(1).max(65535),
  ARRIVALS_UPSTREAM_URL: z.string().url(),
  CORS_ORIGIN: corsOriginSchema,
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
