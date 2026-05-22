import { NextFunction, Request, Response } from "express";
import { verifyBearerToken, type TelegramUser } from "./telegramAuth.js";

declare global {
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
    }
  }
}

export function requireTelegramAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется авторизация Telegram" });
  }

  try {
    const token = authHeader.slice(7).trim();
    const user = verifyBearerToken(token);
    req.telegramUser = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }
}
