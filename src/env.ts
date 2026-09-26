import "dotenv/config";
import * as z from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  BASE_URL: z.string().default("http://localhost:3000"),
  PORT: z.coerce.number().default(5000),
  CORS_ORIGIN: z.string().default("*"),

  FRONTEND_URL: z.string().default("http://localhost:3000"),
  NEXTJS_INTERNAL_URL: z.string().default("http://localhost:3000"),
  INTERNAL_API_SECRET: z.string().default("secret"),

  DATABASE_URL: z.string().default("postgres://postgres:example@localhost:5432/postgres"),

  REDIS_URL: z.string().default("redis://localhost:6379"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.prettifyError(parsed.error)
  );

  process.exit(1);
}

const ENV = parsed.data;

export default ENV;