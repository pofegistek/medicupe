import { prisma } from "./db.js";
import { DAY_PARTS, PROCEDURE_AVAILABILITY } from "./constants.js";

export type DayPart = (typeof DAY_PARTS)[number];

export function isProcedureAllowedForDayPart(slug: string, dayPart: DayPart) {
  const allowed = PROCEDURE_AVAILABILITY[slug];
  if (!allowed) return true;
  return allowed.includes(dayPart);
}

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
      if (!isProcedureAllowedForDayPart(proc.slug, dayPart)) continue;
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
  dayPart: DayPart,
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

export async function getHistory(userId: number, limit = 30) {
  const [entries, procedures] = await Promise.all([
    prisma.dayEntry.findMany({
      where: { userId, completed: true },
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
      take: 500
    }),
    prisma.procedure.findMany()
  ]);

  const procedureById = new Map<number, { name: string; slug: string }>();
  for (const p of procedures) {
    procedureById.set(p.id, { name: p.name, slug: p.slug });
  }

  const dateMap = new Map<string, { date: string; morning: string[]; evening: string[] }>();

  for (const item of entries) {
    const proc = procedureById.get(item.procedureId);
    if (!proc) continue;

    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, { date: item.date, morning: [], evening: [] });
    }

    const day = dateMap.get(item.date)!;
    if (item.dayPart === "morning") day.morning.push(proc.name);
    if (item.dayPart === "evening") day.evening.push(proc.name);
  }

  return Array.from(dateMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, Math.max(1, Math.min(limit, 120)));
}
