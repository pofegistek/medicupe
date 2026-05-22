# Medicube Telegram Mini App

Мини-приложение Telegram для трекинга процедур `Medicube AGE-R Booster Pro` и ретинола по календарю.

## Что в проекте

- `frontend/` - Mini App (React + Vite + TypeScript)
- `backend/` - API + Prisma + SQLite
- `backend/src/bot.ts` - Telegram-бот (админ + кнопка Mini App)
- `.github/workflows/deploy-pages.yml` - автодеплой frontend в GitHub Pages

## Архитектура деплоя

- Frontend: GitHub Pages (HTTPS, публичный URL)
- Backend/API + Bot + DB: VPS

Это снижает риск полной недоступности интерфейса при проблемах VPS: UI открывается с Pages, но без VPS не работает сохранение данных.

## Быстрый локальный запуск

```bash
cp .env.example .env
npm install
npm --workspace backend install
npm --workspace frontend install
npm run prisma:generate
npm run prisma:migrate
npm run dev
# отдельно бот
npm run bot
```

## Переменные окружения

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBAPP_BOT_TOKEN`
- `ADMIN_TELEGRAM_ID`
- `MINI_APP_URL`
- `BACKEND_PUBLIC_URL`
- `DATABASE_URL`
- `VITE_API_BASE_URL`
- `VITE_BASE_PATH`

## Mini App URL в боте

- `/miniapp` и `/start` используют кнопку `Открыть Mini App`.
- URL берется только из `MINI_APP_URL`.
- Если URL не настроен или небезопасный, бот не показывает ссылку и пишет понятное сообщение.

## Что будет при падении VPS

- Frontend на GitHub Pages: откроется.
- Calendar/API/Bot/Admin: недоступны до восстановления VPS.
- В UI показывается ошибка API, без белого экрана.

## GitHub Pages URL

Для репозитория `pofegistek/medicupe` URL будет:

`https://pofegistek.github.io/medicupe/`

