import crypto from "crypto";
import { config } from "./config.js";

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

const encoder = new TextEncoder();

function safeParseInitData(initData: string): URLSearchParams {
  return new URLSearchParams(initData);
}

export function verifyTelegramInitData(initDataRaw: string): TelegramUser {
  const params = safeParseInitData(initDataRaw);
  const hash = params.get("hash");
  const authDate = params.get("auth_date");
  const userRaw = params.get("user");

  if (!hash || !authDate || !userRaw) {
    throw new Error("Некорректные init data");
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(config.telegramWebAppBotToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) {
    throw new Error("Подпись Telegram init data не прошла проверку");
  }

  const user = JSON.parse(userRaw) as TelegramUser;
  if (!user.id) {
    throw new Error("Telegram user id не найден");
  }

  return user;
}

export function verifyBearerToken(bearer: string): TelegramUser {
  const raw = Buffer.from(bearer, "base64url").toString("utf-8");
  return verifyTelegramInitData(raw);
}

export function encodeInitDataToToken(initData: string): string {
  return Buffer.from(encoder.encode(initData)).toString("base64url");
}
