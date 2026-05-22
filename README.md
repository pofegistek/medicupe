# Medicube Telegram Mini App

Полноценное Telegram Mini App для личного трекинга процедур `Medicube AGE-R Booster Pro` и применения ретинола по дням.

## Что уже реализовано

- Mini App на русском языке с разделами:
  - `Сегодня`
  - `Календарь`
  - `Процедуры`
- Отметки `утро/вечер` по процедурам с сохранением в БД.
- Визуальные отметки в календаре по дням, где есть прогресс.
- Сохранение прогресса по `telegram user id`.
- Backend API с проверкой `Telegram WebApp initData`.
- Telegram-бот админки (доступ только для `ADMIN_TELEGRAM_ID`) для:
  - просмотра процедур;
  - редактирования описания;
  - редактирования заметки;
  - включения/скрытия процедуры.

## Структура

- `frontend/` - Telegram Mini App (React + Vite + TypeScript)
- `backend/` - API + Prisma + SQLite
- `backend/src/bot.ts` - админ-бот
- `docs/` - дополнительная документация
- `DEPLOY.md` - пошаговый деплой
- `PROJECT_STATUS.md` - актуальный статус

## Технологии

- Frontend: React, Vite, TypeScript
- Backend: Node.js, Express, TypeScript
- Bot: Telegraf
- DB: Prisma ORM + SQLite (с возможностью перейти на PostgreSQL)

## Локальный запуск

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

2. Заполните `.env` реальными значениями.

3. Установите зависимости:

```bash
npm install
npm --workspace backend install
npm --workspace frontend install
```

4. Создайте БД и Prisma клиент:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Запустите backend и frontend:

```bash
npm run dev
```

6. Отдельно запуск админ-бота:

```bash
npm run bot
```

## Важные переменные окружения

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBAPP_BOT_TOKEN`
- `ADMIN_TELEGRAM_ID`
- `MINI_APP_URL`
- `BACKEND_PUBLIC_URL`
- `DATABASE_URL`
- `VITE_API_BASE_URL`

## Миграция SQLite -> PostgreSQL

- В `backend/prisma/schema.prisma` поменять datasource provider на `postgresql`.
- В `.env` указать `DATABASE_URL=postgresql://...`.
- Перезапустить Prisma миграции в новой среде.
- Бизнес-логика и API остаются теми же.
