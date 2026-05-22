import { prisma } from "./db.js";
import { DAY_PARTS, PROCEDURE_AVAILABILITY, SUPPLEMENT_AVAILABILITY, SUPPLEMENT_DAY_PARTS } from "./constants.js";

export type DayPart = (typeof DAY_PARTS)[number];
export type SupplementDayPart = (typeof SUPPLEMENT_DAY_PARTS)[number];

export function isProcedureAllowedForDayPart(slug: string, dayPart: DayPart) {
  const allowed = PROCEDURE_AVAILABILITY[slug];
  if (!allowed) return true;
  return allowed.includes(dayPart);
}

export function isSupplementAllowedForDayPart(slug: string, dayPart: SupplementDayPart) {
  const allowed = SUPPLEMENT_AVAILABILITY[slug];
  if (!allowed) return false;
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

export async function getVisibleSupplements() {
  return prisma.supplement.findMany({
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

export async function getSupplementDayState(userId: number, date: string) {
  const supplements = await getVisibleSupplements();
  const entries = await prisma.supplementEntry.findMany({ where: { userId, date } });

  const payload: Record<string, Record<string, boolean>> = {
    morning: {},
    day: {},
    evening: {}
  };

  for (const dayPart of SUPPLEMENT_DAY_PARTS) {
    for (const supplement of supplements) {
      if (!isSupplementAllowedForDayPart(supplement.slug, dayPart)) continue;
      const entry = entries.find(
        (e: { dayPart: string; supplementId: number }) =>
          e.dayPart === dayPart && e.supplementId === supplement.id
      );
      payload[dayPart][String(supplement.id)] = Boolean(entry?.completed);
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

export async function setSupplementDayState(
  userId: number,
  date: string,
  dayPart: SupplementDayPart,
  supplementId: number,
  completed: boolean
) {
  return prisma.supplementEntry.upsert({
    where: {
      userId_date_dayPart_supplementId: { userId, date, dayPart, supplementId }
    },
    update: { completed },
    create: { userId, date, dayPart, supplementId, completed }
  });
}

export async function getMonthMarks(userId: number, month: string) {
  const [careItems, supplementItems] = await Promise.all([
    prisma.dayEntry.findMany({
      where: {
        userId,
        date: {
          startsWith: month
        },
        completed: true
      }
    }),
    prisma.supplementEntry.findMany({
      where: {
        userId,
        date: {
          startsWith: month
        },
        completed: true
      }
    })
  ]);

  const map: Record<
    string,
    { morning: number; day: number; evening: number; care: number; supplements: number; total: number }
  > = {};

  for (const item of careItems) {
    if (!map[item.date]) {
      map[item.date] = { morning: 0, day: 0, evening: 0, care: 0, supplements: 0, total: 0 };
    }
    if (item.dayPart === "morning") map[item.date].morning += 1;
    if (item.dayPart === "evening") map[item.date].evening += 1;
    map[item.date].care += 1;
    map[item.date].total += 1;
  }

  for (const item of supplementItems) {
    if (!map[item.date]) {
      map[item.date] = { morning: 0, day: 0, evening: 0, care: 0, supplements: 0, total: 0 };
    }
    if (item.dayPart === "morning") map[item.date].morning += 1;
    if (item.dayPart === "day") map[item.date].day += 1;
    if (item.dayPart === "evening") map[item.date].evening += 1;
    map[item.date].supplements += 1;
    map[item.date].total += 1;
  }

  return map;
}

export async function getHistory(userId: number, limit = 30) {
  const [entries, procedures, supplementEntries, supplements] = await Promise.all([
    prisma.dayEntry.findMany({
      where: { userId, completed: true },
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
      take: 800
    }),
    prisma.procedure.findMany(),
    prisma.supplementEntry.findMany({
      where: { userId, completed: true },
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
      take: 1200
    }),
    prisma.supplement.findMany()
  ]);

  const procedureById = new Map<number, { name: string; slug: string }>();
  for (const p of procedures) {
    procedureById.set(p.id, { name: p.name, slug: p.slug });
  }

  const supplementById = new Map<number, { name: string; slug: string }>();
  for (const s of supplements) {
    supplementById.set(s.id, { name: s.name, slug: s.slug });
  }

  const dateMap = new Map<
    string,
    {
      date: string;
      care: { morning: string[]; evening: string[] };
      supplements: { morning: string[]; day: string[]; evening: string[] };
    }
  >();

  for (const item of entries) {
    const proc = procedureById.get(item.procedureId);
    if (!proc) continue;

    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, {
        date: item.date,
        care: { morning: [], evening: [] },
        supplements: { morning: [], day: [], evening: [] }
      });
    }

    const day = dateMap.get(item.date)!;
    if (item.dayPart === "morning") day.care.morning.push(proc.name);
    if (item.dayPart === "evening") day.care.evening.push(proc.name);
  }

  for (const item of supplementEntries) {
    const supplement = supplementById.get(item.supplementId);
    if (!supplement) continue;

    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, {
        date: item.date,
        care: { morning: [], evening: [] },
        supplements: { morning: [], day: [], evening: [] }
      });
    }

    const day = dateMap.get(item.date)!;
    if (item.dayPart === "morning") day.supplements.morning.push(supplement.name);
    if (item.dayPart === "day") day.supplements.day.push(supplement.name);
    if (item.dayPart === "evening") day.supplements.evening.push(supplement.name);
  }

  return Array.from(dateMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, Math.max(1, Math.min(limit, 120)));
}
