export const DAY_PARTS = ["morning", "evening"] as const;
export const SUPPLEMENT_DAY_PARTS = ["morning", "day", "evening"] as const;

export const PROCEDURE_AVAILABILITY: Record<string, Array<(typeof DAY_PARTS)[number]>> = {
  "air-shot": ["morning", "evening"],
  booster: ["morning", "evening"],
  mc: ["morning", "evening"],
  "derma-shot": ["evening"],
  retinol: ["evening"]
};

export const DEFAULT_PROCEDURES = [
  {
    slug: "air-shot",
    name: "Air Shot",
    description: "Базовый режим для мягкой стимуляции кожи.",
    note: "Описание можно изменить через админ-бота.",
    type: "режим устройства",
    sortOrder: 1
  },
  {
    slug: "booster",
    name: "Booster",
    description: "Режим для усиления ухода и проникновения средств.",
    note: "Описание можно изменить через админ-бота.",
    type: "режим устройства",
    sortOrder: 2
  },
  {
    slug: "mc",
    name: "MC Mode",
    description: "Режим комплексного воздействия по вашему плану.",
    note: "Описание можно изменить через админ-бота.",
    type: "режим устройства",
    sortOrder: 3
  },
  {
    slug: "derma-shot",
    name: "Derma Shot",
    description: "Режим точечной работы с зонами ухода.",
    note: "Описание можно изменить через админ-бота.",
    type: "режим устройства",
    sortOrder: 4
  },
  {
    slug: "retinol",
    name: "Ретинол",
    description: "Отдельное средство ухода, отмечается как самостоятельный шаг.",
    note: "Описание можно изменить через админ-бота.",
    type: "средство ухода",
    sortOrder: 5
  }
] as const;

export const DEFAULT_SUPPLEMENTS = [
  { slug: "omega-3", name: "Омега-3", sortOrder: 1 },
  { slug: "vitamin-d", name: "Витамин D", sortOrder: 2 },
  { slug: "b12", name: "B12", sortOrder: 3 },
  { slug: "b9", name: "B9", sortOrder: 4 },
  { slug: "collagen", name: "Коллаген", sortOrder: 5 },
  { slug: "psyllium", name: "Псиллиум", sortOrder: 6 },
  { slug: "iron", name: "Железо", sortOrder: 7 },
  { slug: "magnesium", name: "Магний", sortOrder: 8 }
] as const;

export const SUPPLEMENT_AVAILABILITY: Record<string, Array<(typeof SUPPLEMENT_DAY_PARTS)[number]>> = {
  "omega-3": ["morning", "day"],
  "vitamin-d": ["morning", "day"],
  b12: ["morning", "day"],
  b9: ["morning", "day"],
  collagen: ["morning", "day"],
  psyllium: ["morning", "day"],
  iron: ["morning", "day"],
  magnesium: ["evening"]
};
