# PROJECT STATUS - Medicube

## Что сделано

- Frontend опубликован через GitHub Pages.
- Исправлена инициализация Telegram WebApp:
  - подключен официальный Telegram WebApp SDK в `frontend/index.html`;
  - добавлено ожидание контекста Telegram перед auth;
  - убрана ложная тревога при ранней инициализации.
- Обновлен UX входа:
  - внутри Telegram при наличии initData приложение авторизуется;
  - вне Telegram показывается нейтральное сообщение, не красная ошибка.
- Экран `Сегодня` обновлен:
  - показывает актуальную дату;
  - `Утро`: Air Shot, Booster, MC Mode;
  - `Вечер`: Air Shot, Booster, MC Mode, Derma Shot, Ретинол;
  - добавлены состояния загрузки/ошибки, пустых карточек без пояснения нет.
- Добавлена вкладка `История`:
  - показывает последние дни с отмеченными процедурами текущего пользователя;
  - раздельно `Утро`/`Вечер`.
- Backend обновлен:
  - добавлен `GET /api/calendar/history`;
  - добавлена серверная проверка доступности процедуры по времени суток;
  - правила утро/вечер не только визуальные, но и API-валидируемые.
- Разделение пользователей подтверждено в архитектуре:
  - записи фильтруются по `telegram user id` из проверенного initData;
  - данные между пользователями не смешиваются.

## Что проверено

- Локальный git: изменения сохранены.
- Проверено, что в tracked-файлах нет реальных секретов.
- Проверен текущий URL Pages: `https://pofegistek.github.io/medicupe/`.
- Проверено, что `MINI_APP_URL` на VPS установлен на URL GitHub Pages.

## Что осталось

- Для полноценных записей из Pages нужен production HTTPS backend API.
- После настройки HTTPS API нужно обновить `VITE_API_BASE_URL` в GitHub Actions Variables.
- Проверить живой сценарий в Telegram на телефоне после обновления frontend и backend.

## Что нужно от владельца

- Production домен для API (`https://api.<domain>`).
- Подтверждение CORS/HTTPS настроек reverse proxy.

## Ручные действия

### GitHub

- `Settings -> Secrets and variables -> Actions -> Variables`
- Добавить/обновить `VITE_API_BASE_URL=https://api.<domain>/api`

### BotFather

- `/setmenubutton` -> URL: `https://pofegistek.github.io/medicupe/`

### VPS

- Поддерживать backend/bot/db.
- Настроить HTTPS reverse proxy для API.
- Временный HTTPS tunnel для API поднят (Cloudflare Quick Tunnel), пригоден для теста, но не для постоянной работы.
