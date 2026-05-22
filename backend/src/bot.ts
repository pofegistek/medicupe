import { Markup, Telegraf } from "telegraf";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { ensureDefaultProcedures } from "./seed.js";

const bot = new Telegraf(config.telegramBotToken);
const adminId = config.adminTelegramId;

type PendingAction =
  | { type: "edit_description"; procedureId: number }
  | { type: "edit_note"; procedureId: number };

const pendingByUser = new Map<string, PendingAction>();

function isAdmin(telegramId: string) {
  return telegramId === adminId;
}

async function sendProceduresList(chatId: number) {
  const procedures = await prisma.procedure.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const rows = procedures.map((p: { id: number; name: string }) => [
    Markup.button.callback(p.name, `proc:${p.id}`)
  ]);
  await bot.telegram.sendMessage(chatId, "Список процедур:", Markup.inlineKeyboard(rows));
}

bot.start(async (ctx) => {
  const userId = String(ctx.from?.id || "");
  if (!isAdmin(userId)) {
    await ctx.reply("Доступ запрещен.");
    return;
  }
  await ctx.reply(
    "Админ-панель Medicube. Доступные команды:\n/procedures - список процедур\n/miniapp - ссылка на Mini App"
  );
});

bot.command("miniapp", async (ctx) => {
  const userId = String(ctx.from?.id || "");
  if (!isAdmin(userId)) return ctx.reply("Доступ запрещен.");
  await ctx.reply(`Mini App: ${config.miniAppUrl || "не указан MINI_APP_URL"}`);
});

bot.command("procedures", async (ctx) => {
  const userId = String(ctx.from?.id || "");
  if (!isAdmin(userId)) return ctx.reply("Доступ запрещен.");
  await sendProceduresList(ctx.chat.id);
});

bot.action(/proc:(\d+)/, async (ctx) => {
  const userId = String(ctx.from?.id || "");
  if (!isAdmin(userId)) return ctx.answerCbQuery("Нет доступа");

  const procedureId = Number(ctx.match[1]);
  const p = await prisma.procedure.findUnique({ where: { id: procedureId } });
  if (!p) return ctx.reply("Процедура не найдена");

  await ctx.reply(
    `Процедура: ${p.name}\nТип: ${p.type}\nВидимость: ${p.isVisible ? "включена" : "скрыта"}\n\nОписание:\n${p.description || "—"}\n\nЗаметка:\n${p.note || "—"}`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Изменить описание", `edit_desc:${p.id}`)],
      [Markup.button.callback("Изменить заметку", `edit_note:${p.id}`)],
      [Markup.button.callback(p.isVisible ? "Скрыть" : "Показать", `toggle:${p.id}`)]
    ])
  );
});

bot.action(/edit_desc:(\d+)/, async (ctx) => {
  const userId = String(ctx.from?.id || "");
  if (!isAdmin(userId)) return ctx.answerCbQuery("Нет доступа");
  const procedureId = Number(ctx.match[1]);
  pendingByUser.set(userId, { type: "edit_description", procedureId });
  await ctx.reply("Отправьте новый текст описания следующим сообщением.");
});

bot.action(/edit_note:(\d+)/, async (ctx) => {
  const userId = String(ctx.from?.id || "");
  if (!isAdmin(userId)) return ctx.answerCbQuery("Нет доступа");
  const procedureId = Number(ctx.match[1]);
  pendingByUser.set(userId, { type: "edit_note", procedureId });
  await ctx.reply("Отправьте новую заметку следующим сообщением.");
});

bot.action(/toggle:(\d+)/, async (ctx) => {
  const userId = String(ctx.from?.id || "");
  if (!isAdmin(userId)) return ctx.answerCbQuery("Нет доступа");
  const procedureId = Number(ctx.match[1]);

  const p = await prisma.procedure.findUnique({ where: { id: procedureId } });
  if (!p) return ctx.reply("Процедура не найдена");

  await prisma.procedure.update({
    where: { id: procedureId },
    data: { isVisible: !p.isVisible }
  });

  await ctx.reply(`Готово: процедура ${p.name} теперь ${!p.isVisible ? "видима" : "скрыта"}.`);
  if (ctx.chat) {
    await sendProceduresList(ctx.chat.id);
  }
});

bot.on("text", async (ctx) => {
  const userId = String(ctx.from?.id || "");
  if (!isAdmin(userId)) return;

  const pending = pendingByUser.get(userId);
  if (!pending) return;

  const text = ctx.message.text.trim();
  if (!text) {
    await ctx.reply("Пустой текст не сохранен.");
    return;
  }

  if (pending.type === "edit_description") {
    await prisma.procedure.update({ where: { id: pending.procedureId }, data: { description: text } });
    await ctx.reply("Описание обновлено.");
  } else {
    await prisma.procedure.update({ where: { id: pending.procedureId }, data: { note: text } });
    await ctx.reply("Заметка обновлена.");
  }

  pendingByUser.delete(userId);
  if (ctx.chat) {
    await sendProceduresList(ctx.chat.id);
  }
});

async function start() {
  await ensureDefaultProcedures();
  await bot.launch();
  console.log("Medicube admin bot started");
}

start().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
