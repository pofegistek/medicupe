import { prisma } from "./db.js";
import { DEFAULT_PROCEDURES, DEFAULT_SUPPLEMENTS } from "./constants.js";

export async function ensureDefaultProcedures() {
  for (const item of DEFAULT_PROCEDURES) {
    await prisma.procedure.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        type: item.type,
        sortOrder: item.sortOrder,
        isVisible: true
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        note: item.note,
        type: item.type,
        sortOrder: item.sortOrder,
        isVisible: true
      }
    });
  }
}

export async function ensureDefaultSupplements() {
  for (const item of DEFAULT_SUPPLEMENTS) {
    await prisma.supplement.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        sortOrder: item.sortOrder,
        isVisible: true
      },
      create: {
        slug: item.slug,
        name: item.name,
        sortOrder: item.sortOrder,
        isVisible: true
      }
    });
  }
}
