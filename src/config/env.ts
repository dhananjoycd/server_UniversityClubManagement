import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const optionalString = z.string().min(1).optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default("https://xyztechclub.vercel.app"),
  CLIENT_URLS: z.string().optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url().default("https://xyztechclub.onrender.com"),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_FROM: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${parsedEnv.error.flatten().formErrors.join(", ")}`,
  );
}

const primaryClientUrl = parsedEnv.data.CLIENT_URL;
const allowedClientOrigins = Array.from(
  new Set(
    [primaryClientUrl, ...(parsedEnv.data.CLIENT_URLS?.split(",") ?? [])]
      .map((value) => value.trim())
      .filter(Boolean),
  ),
);

for (const origin of allowedClientOrigins) {
  z.string().url().parse(origin);
}

export const env = {
  ...parsedEnv.data,
  CLIENT_URL: primaryClientUrl,
  CLIENT_URLS: allowedClientOrigins,
};
