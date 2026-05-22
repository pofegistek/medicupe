import dotenv from "dotenv";

dotenv.config();

const required = [
  "DATABASE_URL",
  "TELEGRAM_WEBAPP_BOT_TOKEN",
  "TELEGRAM_BOT_TOKEN"
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

function parseAdminIds() {
  const single = process.env.ADMIN_TELEGRAM_ID || "";
  const many = process.env.ADMIN_TELEGRAM_IDS || "";
  const merged = `${single},${many}`
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(merged));
}

const adminTelegramIds = parseAdminIds();
if (adminTelegramIds.length === 0) {
  throw new Error("Missing env var: ADMIN_TELEGRAM_ID or ADMIN_TELEGRAM_IDS");
}

export const config = {
  port: Number(process.env.PORT || 8080),
  nodeEnv: process.env.NODE_ENV || "development",
  miniAppUrl: process.env.MINI_APP_URL || "",
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || "",
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ||
    "https://pofegistek.github.io,http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  telegramAuthMaxAgeSeconds: Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || 86400),
  apiRateLimitWindowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60000),
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX || 120),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  dbProvider: process.env.DB_PROVIDER || "sqlite",
  telegramWebAppBotToken: process.env.TELEGRAM_WEBAPP_BOT_TOKEN as string,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN as string,
  adminTelegramIds
};
