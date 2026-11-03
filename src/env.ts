import "dotenv/config";
import * as z from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  BASE_URL: z.string(),
  PORT: z.coerce.number().default(5000),
  NEXTJS_URL: z.string(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.prettifyError(parsed.error),
  );

  process.exit(1);
}

const ENV = parsed.data;

export default ENV;
