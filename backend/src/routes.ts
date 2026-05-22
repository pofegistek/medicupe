import { Router } from "express";
import { z } from "zod";
import { requireTelegramAuth } from "./authMiddleware.js";
import { prisma } from "./db.js";
import { encodeInitDataToToken, verifyTelegramInitData } from "./telegramAuth.js";
import {
  ensureUser,
  getDayState,
  getMonthMarks,
  getVisibleProcedures,
  setDayState
} from "./services.js";

const dayPartSchema = z.enum(["morning", "evening"]);

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.post("/auth/telegram", async (req, res) => {
  const schema = z.object({ initData: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "initData обязателен" });
  }

  try {
    const user = verifyTelegramInitData(parsed.data.initData);
    await ensureUser(String(user.id));
    return res.json({ token: encodeInitDataToToken(parsed.data.initData), user });
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }
});

router.use(requireTelegramAuth);

router.get("/procedures", async (_req, res) => {
  const procedures = await getVisibleProcedures();
  return res.json(procedures);
});

router.get("/calendar/day", async (req, res) => {
  const schema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "date должен быть YYYY-MM-DD" });
  }

  const appUser = await ensureUser(String(req.telegramUser!.id));
  const state = await getDayState(appUser.id, parsed.data.date);
  return res.json(state);
});

router.put("/calendar/day", async (req, res) => {
  const schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dayPart: dayPartSchema,
    procedureId: z.number().int().positive(),
    completed: z.boolean()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const procedure = await prisma.procedure.findUnique({ where: { id: parsed.data.procedureId } });
  if (!procedure || !procedure.isVisible) {
    return res.status(404).json({ error: "Процедура не найдена" });
  }

  const appUser = await ensureUser(String(req.telegramUser!.id));
  await setDayState(
    appUser.id,
    parsed.data.date,
    parsed.data.dayPart,
    parsed.data.procedureId,
    parsed.data.completed
  );

  return res.json({ ok: true });
});

router.get("/calendar/month", async (req, res) => {
  const schema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "month должен быть YYYY-MM" });
  }

  const appUser = await ensureUser(String(req.telegramUser!.id));
  const marks = await getMonthMarks(appUser.id, parsed.data.month);
  return res.json(marks);
});
