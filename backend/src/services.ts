import { prisma } from "./db.js";
import { DAY_PARTS } from "./constants.js";

export async function ensureUser(telegramUserId: string) {
  return prisma.user.upsert({
    where: { telegramUserId },
    update: {},
    create: { telegramUserId }
  });
}

export async function getVisibleProcedures() {
  return prisma.procedure.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });
}

export async function getAllProcedures() {
  return prisma.procedure.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });
}

export async function getDayState(userId: number, date: string) {
  const procedures = await getVisibleProcedures();
  const entries = await prisma.dayEntry.findMany({ where: { userId, date } });

  const payload: Record<string, Record<string, boolean>> = {
    morning: {},
    evening: {}
  };

  for (const dayPart of DAY_PARTS) {
    for (const proc of procedures) {
      const entry = entries.find(
        (e: { dayPart: string; procedureId: number }) =>
          e.dayPart === dayPart && e.procedureId === proc.id
      );
      payload[dayPart][String(proc.id)] = Boolean(entry?.completed);
    }
  }

  return payload;
}

export async function setDayState(
  userId: number,
  date: string,
  dayPart: "morning" | "evening",
  procedureId: number,
  completed: boolean
) {
  return prisma.dayEntry.upsert({
    where: {
      userId_date_dayPart_procedureId: { userId, date, dayPart, procedureId }
    },
    update: { completed },
    create: { userId, date, dayPart, procedureId, completed }
  });
}

export async function getMonthMarks(userId: number, month: string) {
  const items = await prisma.dayEntry.findMany({
    where: {
      userId,
      date: {
        startsWith: month
      },
      completed: true
    }
  });

  const map: Record<string, { morning: number; evening: number }> = {};
  for (const item of items) {
    if (!map[item.date]) {
      map[item.date] = { morning: 0, evening: 0 };
    }
    if (item.dayPart === "morning") map[item.date].morning += 1;
    if (item.dayPart === "evening") map[item.date].evening += 1;
  }

  return map;
}
