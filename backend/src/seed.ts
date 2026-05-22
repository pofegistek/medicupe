import { prisma } from "./db.js";
import { DEFAULT_PROCEDURES } from "./constants.js";

export async function ensureDefaultProcedures() {
  for (const item of DEFAULT_PROCEDURES) {
    await prisma.procedure.upsert({
      where: { slug: item.slug },
      update: {},
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
