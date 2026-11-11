import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().optional(),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  DATABASE_URL_TEST: z.string().optional(),
  DATABASE_URL_E2E: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .catch("http://localhost:3000"),
  SESSION_PEPPER: z
    .string()
    .min(16)
    .default("pocket-theory-dev-session-pepper-2026-default"),
  DEMO_MODE: z.enum(["0", "1"]).default("1"),
  ALLOW_PROD_SEED: z.enum(["0", "1"]).default("0"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  EMAIL_FROM: z.string().default("orders@pockettheory.example"),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  if (
    parsed.data.NODE_ENV === "production" &&
    parsed.data.DEMO_MODE === "0" &&
    parsed.data.SESSION_PEPPER ===
      "pocket-theory-dev-session-pepper-2026-default"
  ) {
    throw new Error(
      "SESSION_PEPPER must be explicitly configured when DEMO_MODE=0 in production.",
    );
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function resetEnvCacheForTests(): void {
  cachedEnv = null;
}

export function isDemoMode(): boolean {
  return getEnv().DEMO_MODE === "1";
}

export function getSiteUrl(): string {
  return getEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
}

export function hasLiveRazorpay(): boolean {
  const env = getEnv();
  return Boolean(
    env.RAZORPAY_KEY_ID?.trim() && env.RAZORPAY_KEY_SECRET?.trim(),
  );
}

export function hasLiveStripe(): boolean {
  const env = getEnv();
  return Boolean(env.STRIPE_SECRET_KEY?.trim());
}
