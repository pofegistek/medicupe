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

Интерфейс открывается с Pages даже при проблемах VPS, но без backend не работают сохранение отметок и история.

## Пользователи и приватность

- Данные календаря ухода, вкладки `Добавки` и истории разделяются по `telegram user id`.
- Backend берет пользователя только из проверенного `Telegram WebApp initData`.
- Один пользователь не видит отметки другого.

## Разделы Mini App

- `Сегодня` - отметки ухода (утро/вечер).
- `Добавки` - отдельные отметки добавок (утро/день/вечер).
- `Календарь` - дни с активностью (уход и/или добавки).
- `История` - по дням с блоками `Уход` и `Добавки`.
- `Процедуры` - справочник процедур ухода.

## Локальный запуск

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
- `ADMIN_TELEGRAM_IDS` (опционально, через запятую для нескольких админов)
- `MINI_APP_URL`
- `BACKEND_PUBLIC_URL`
- `DATABASE_URL`
- `VITE_API_BASE_URL`
- `VITE_BASE_PATH`
- `CORS_ALLOWED_ORIGINS` (список origin через запятую для backend CORS)
- `TELEGRAM_AUTH_MAX_AGE_SECONDS` (макс. возраст `initData` для anti-replay)
- `API_RATE_LIMIT_WINDOW_MS` / `API_RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_WINDOW_MS` / `AUTH_RATE_LIMIT_MAX`

## Безопасность API

- Публичный URL API не считается секретом; защита строится на валидации Telegram `initData`.
- Все персональные endpoint'ы (`calendar`, `supplements`, `history`) требуют Bearer-токен, выпущенный из валидного `initData`.
- Backend не принимает `userId` от frontend и всегда определяет пользователя по проверенному Telegram контексту.
- Добавлена проверка свежести `auth_date` (`TELEGRAM_AUTH_MAX_AGE_SECONDS`), чтобы снизить риск replay старых токенов.
- Добавлен базовый rate limiting для публичного API и отдельный лимит для `/api/auth/telegram`.

## Mini App URL в боте

- `/miniapp` и `/start` используют кнопку `Открыть Mini App`.
- URL берется только из `MINI_APP_URL`.
- Если URL не настроен или небезопасный, бот не показывает ссылку и пишет понятное сообщение.

## Что будет при падении VPS

- Frontend на GitHub Pages: откроется.
- Calendar/API/Bot/Admin: недоступны до восстановления VPS.
- В UI показывается понятная русская ошибка API, без белого экрана.

## GitHub Pages URL

Для репозитория `pofegistek/medicupe` URL:

`https://pofegistek.github.io/medicupe/`
