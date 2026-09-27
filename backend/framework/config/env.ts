import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  API_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().default("*"),
  SWAGGER_ENABLED: z
    .string()
    .optional()
    .transform((v) => {
      if (v !== undefined) return v === "true" || v === "1";
      return process.env.NODE_ENV !== "production";
    }),

  DATABASE_URL: z.string().url(),

  ACCESS_SECRET: z.string().min(16),
  REFRESH_SECRET: z.string().min(16),
  ACCESS_EXPIRY: z.string().default("15m"),
  REFRESH_EXPIRY: z.string().default("7d"),

  UPLOAD_DIR: z.string().default("uploads"),
  UPLOAD_MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024),
  UPLOAD_MAX_AVATAR_SIZE: z.coerce.number().default(2 * 1024 * 1024),

  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("jadara"),
  MINIO_USE_SSL: z
    .string()
    .optional()
    .transform((v) => {
      if (v !== undefined) return v === "true" || v === "1";
      return false;
    }),

  FRONTEND_URL: z
    .string()
    .url()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  // Local Postfix relay (Postfix handles the upstream SMTP auth)
  SMTP_HOST: z.string().default("127.0.0.1"),
  SMTP_PORT: z.coerce.number().int().default(25),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  SMTP_FROM: z.string().default("Jadara <benallouaziz1414@gmail.com>"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
