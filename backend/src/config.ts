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
  dbProvider: process.env.DB_PROVIDER || "sqlite",
  telegramWebAppBotToken: process.env.TELEGRAM_WEBAPP_BOT_TOKEN as string,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN as string,
  adminTelegramIds
};
