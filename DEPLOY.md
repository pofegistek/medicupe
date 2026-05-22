# DEPLOY Medicube (VPS)

Инструкция с простыми шагами для запуска Mini App и бота в продакшене.

## 1. Что сделать в GitHub

1. Создать новый репозиторий.
2. Загрузить проект `medicube`.
3. Убедиться, что `.env` не попал в репозиторий.
4. Проверить, что в репозитории есть:
   - `.env.example`
   - `.gitignore`
   - `README.md`
   - `DEPLOY.md`
   - `PROJECT_STATUS.md`

## 2. Что сделать у BotFather

1. Создать бота: `/newbot`.
2. Получить `TELEGRAM_BOT_TOKEN`.
3. Настроить Mini App:
   - `/setmenubutton`
   - выбрать бота
   - указать URL Mini App (`https://miniapp.example.com`)
4. Если используется отдельный бот для Mini App, убедиться, что токен указан в `TELEGRAM_WEBAPP_BOT_TOKEN`.

## 3. Что сделать на VPS

1. Установить Docker и Docker Compose.
2. Клонировать репозиторий.
3. Перейти в папку проекта `medicube`.
4. Создать `.env` рядом с `docker-compose.yml`.
5. Запустить:

```bash
docker compose up -d --build
```

6. Проверить сервисы:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f bot
```

## 4. Где хранить .env

- Только на сервере и локально у владельца.
- Не коммитить в Git.
- Рекомендуется хранить резервную копию в менеджере паролей/секретов.

## 5. Как проверить, что бот работает

1. Написать `/start` вашему боту.
2. С админского Telegram ID выполнить `/procedures`.
3. Попробовать изменить описание и заметку.
4. Проверить, что не-админ получает `Доступ запрещен`.

## 6. Как проверить, что Mini App открывается в Telegram

1. Открыть бота в Telegram.
2. Нажать кнопку меню (`Menu Button`) и открыть Mini App.
3. Убедиться, что показываются экраны:
   - Сегодня
   - Календарь
   - Процедуры
4. Поставить чекбокс, закрыть Mini App, открыть снова.
5. Убедиться, что отметка сохранилась.

## HTTPS

Mini App в Telegram должен открываться по `https://`.

Варианты:
- Nginx + Certbot
- Caddy
- Cloudflare Tunnel

Главное: домен Mini App и API должны быть доступны извне и иметь валидный TLS сертификат.

## Обновления после изменений

```bash
git pull
docker compose up -d --build
```

## Как не потерять БД и прогресс

SQLite файл находится в томе/папке `backend/prisma`.

Резервное копирование:
```bash
cp backend/prisma/dev.db /root/backups/medicube_dev_$(date +%F).db
```

Рекомендуется настроить ежедневный cron backup.
