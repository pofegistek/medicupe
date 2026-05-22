# PROJECT STATUS - Medicube

## Что сделано

- Создан и развивается проект в `/medicube`.
- Реализованы:
  - Mini App (Сегодня, Календарь, Процедуры)
  - Backend API
  - SQLite + Prisma
  - Telegram-бот админки
- Бот обновлен:
  - `/miniapp` и `/start` используют кнопку `Открыть Mini App`
  - URL берется только из `MINI_APP_URL`
  - при невалидном/пустом URL показывается безопасное сообщение
  - IP не показывается в сообщениях бота
- Добавлен workflow для GitHub Pages:
  - `.github/workflows/deploy-pages.yml`
- Frontend подготовлен для Pages:
  - настраиваемый `base` через `VITE_BASE_PATH`
  - fallback-ошибки при недоступном API

## Что проверено

- Локальный git history и ветка `main` есть.
- Remote настроен.
- Секреты не должны попадать в tracked файлы (`.env` игнорируется).
- На VPS контейнеры собирались и запускались.

## Что осталось

- Завершить push в GitHub (текущий remote отвечает `Repository not found`).
- Включить GitHub Pages в репозитории.
- Настроить production HTTPS для backend API на домене.
- Обновить `.env` на VPS под финальные URL.
- Проверить Mini App в Telegram после `/setmenubutton`.

## Что нужно от владельца

- Подтвердить правильный URL репозитория и доступ для push.
- Подтвердить домен для production API (`https://api...`).
- Подтвердить, что в BotFather будет установлен URL GitHub Pages.

## Ручные действия

### GitHub

- Проверить репозиторий и права на push.
- Включить Pages (`Settings -> Pages -> Source: GitHub Actions`).
- Добавить Actions Variable: `VITE_API_BASE_URL`.

### Telegram / BotFather

- `/setmenubutton` -> URL GitHub Pages Mini App.

### VPS

- Держать только backend/bot/db.
- Настроить HTTPS reverse proxy для API.

