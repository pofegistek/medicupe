import dotenv from "dotenv";

dotenv.config();

const required = [
  "DATABASE_URL",
  "TELEGRAM_WEBAPP_BOT_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "ADMIN_TELEGRAM_ID"
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

export const config = {
  port: Number(process.env.PORT || 8080),
  nodeEnv: process.env.NODE_ENV || "development",
  miniAppUrl: process.env.MINI_APP_URL || "",
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || "",
  dbProvider: process.env.DB_PROVIDER || "sqlite",
  telegramWebAppBotToken: process.env.TELEGRAM_WEBAPP_BOT_TOKEN as string,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN as string,
  adminTelegramId: process.env.ADMIN_TELEGRAM_ID as string
};
