# DEPLOY Medicube

## 1. GitHub: код и Pages

1. Убедитесь, что код в `main`.
2. `Settings -> Pages`.
3. `Build and deployment -> Source: GitHub Actions`.
4. `Settings -> Secrets and variables -> Actions -> Variables`:
   - `VITE_API_BASE_URL=https://api.your-domain.com/api`
5. После push в `main` workflow `Deploy Frontend to GitHub Pages` публикует frontend.

URL Mini App:
- `https://pofegistek.github.io/medicupe/`

## 2. BotFather

1. `/setmenubutton`
2. Выбрать бота
3. Вставить URL Mini App:
   - `https://pofegistek.github.io/medicupe/`

## 3. VPS: backend + bot + db

1. Клонировать проект.
2. Создать `.env` в корне (не коммитить).
3. Заполнить минимум:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBAPP_BOT_TOKEN`
   - `ADMIN_TELEGRAM_ID`
   - `MINI_APP_URL=https://pofegistek.github.io/medicupe/`
   - `BACKEND_PUBLIC_URL=https://api.your-domain.com`
   - `DATABASE_URL=file:./prisma/dev.db`
4. Запуск:

```bash
docker compose up -d --build
```

## 4. HTTPS для backend (Pages -> API)

### Рекомендуемый production

- Домен API: `api.your-domain.com`
- Reverse proxy + TLS (Caddy/Nginx + Let's Encrypt)
- Обновить:
  - `BACKEND_PUBLIC_URL=https://api.your-domain.com`
  - `VITE_API_BASE_URL=https://api.your-domain.com/api`

### Временный тестовый вариант

- HTTPS туннель (например Cloudflare Tunnel)
- Только как временное решение
- Для текущего временного запуска можно использовать URL вида:
  - `https://<random>.trycloudflare.com/api`
- Этот URL нестабилен и может измениться/исчезнуть, поэтому позже его нужно заменить на постоянный домен API.

## 5. Важно

- Не коммитить `.env`
- Не хранить токены/пароли/ключи в репозитории
- Не использовать IP VPS как `MINI_APP_URL`
