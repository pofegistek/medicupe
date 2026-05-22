# DEPLOY Medicube

## 1. GitHub: код и Pages

1. Убедитесь, что репозиторий содержит код (`main` branch).
2. В репозитории откройте `Settings -> Pages`.
3. В `Build and deployment` выберите `Source: GitHub Actions`.
4. В `Settings -> Secrets and variables -> Actions -> Variables` добавьте:
   - `VITE_API_BASE_URL=https://api.your-domain.com/api`
5. После push в `main` workflow `Deploy Frontend to GitHub Pages` опубликует frontend.

Ожидаемый URL:
- `https://pofegistek.github.io/medicupe/`

## 2. BotFather

1. `/setmenubutton`
2. Выбрать бота
3. Вставить URL Mini App от GitHub Pages

## 3. VPS: backend + bot + db

1. Клонировать проект на VPS.
2. Создать `.env` в корне проекта (не в Git).
3. Заполнить минимум:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBAPP_BOT_TOKEN`
   - `ADMIN_TELEGRAM_ID`
   - `MINI_APP_URL=https://pofegistek.github.io/medicupe/`
   - `BACKEND_PUBLIC_URL=https://api.your-domain.com`
   - `DATABASE_URL=file:./prisma/dev.db`
4. Запустить:

```bash
docker compose up -d --build
```

## 4. HTTPS для backend (для Pages -> API)

### Рекомендуемый production

- Поднять домен, например `api.your-domain.com`
- Настроить reverse proxy + TLS (Caddy/Nginx + Let's Encrypt)
- Указать:
  - `BACKEND_PUBLIC_URL=https://api.your-domain.com`
  - GitHub variable `VITE_API_BASE_URL=https://api.your-domain.com/api`

### Временный тестовый вариант

- Возможен публичный HTTPS туннель (например Cloudflare Tunnel)
- Это временно, не production

## 5. Важно

- Не коммитить `.env`
- Не хранить токены/пароли в репозитории
- Не использовать IP сервера как `MINI_APP_URL`

