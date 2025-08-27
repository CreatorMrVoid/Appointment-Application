import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES: z.string().optional(),
  JWT_REFRESH_EXPIRES: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);

export default env;


