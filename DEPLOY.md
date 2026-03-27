# Деплой PizzaWeb: Neon + Render + Vercel

Стек проекта:
- **Backend** — NestJS + TypeORM + PostgreSQL
- **Frontend** — React + Vite + VK Bridge
- **БД** — PostgreSQL (Neon)

---

## 1. Neon (База данных)

### 1.1. Создать проект

1. Зайти на [neon.tech](https://neon.tech) и зарегистрироваться.
2. Нажать **"New Project"**.
3. Указать имя проекта (например, `pizza-nyam`), выбрать регион (рекомендуется `US East` или ближайший к серверу Render).
4. Нажать **"Create Project"**.

### 1.2. Получить строку подключения

После создания проекта Neon покажет **Connection string**. Она выглядит так:

```
postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
```

Скопировать и сохранить — она понадобится для Render.

> Строку можно найти позже: Dashboard > проект > **Connection Details** > выбрать формат "Connection string".

### 1.3. Таблицы

Таблицы создавать вручную **не нужно** — TypeORM создаст их автоматически при первом запуске бэкенда (включена опция `synchronize: true`).

---

## 2. Render (Backend)

### 2.1. Создать Web Service

1. Зайти на [render.com](https://render.com) и зарегистрироваться.
2. Нажать **"New" → "Web Service"**.
3. Подключить репозиторий: `https://github.com/kutuzich/vk-mini-app-pizza-nyam`.

### 2.2. Настроить сервис

Заполнить параметры:

| Параметр | Значение |
|---|---|
| **Name** | `pizza-nyam-api` (любое) |
| **Region** | Тот же, что и у Neon |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | Free |

### 2.3. Переменные окружения

В разделе **"Environment Variables"** добавить:

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | Строка подключения из Neon (из шага 1.2) |
| `JWT_SECRET` | Любая длинная случайная строка (например, сгенерировать через `openssl rand -base64 48`) |
| `CORS_ORIGIN` | URL фронтенда на Vercel (добавить после деплоя фронта, например `https://pizza-nyam.vercel.app`) |
| `VK_BOT_TOKEN` | Токен бота ВКонтакте |
| `VK_APP_ID` | ID VK Mini App |
| `VK_APP_SECRET` | Секретный ключ VK приложения |
| `VK_REDIRECT_URI` | `https://<ваш-render-домен>.onrender.com/api/auth/vk/callback` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

### 2.4. Деплой

Нажать **"Create Web Service"**. Render автоматически:
1. Установит зависимости (`npm install`)
2. Соберёт проект (`npm run build`)
3. Запустит сервер (`node dist/main`)

Дождаться статуса **"Live"**. URL сервиса будет вида: `https://pizza-nyam-api.onrender.com`

### 2.5. Наполнить базу (seed)

После успешного деплоя нужно наполнить БД тестовыми данными. Перейти в раздел **"Shell"** сервиса на Render и выполнить:

```bash
npm run seed
```

Это создаст категории и 16 пицц в базе.

> Альтернативный вариант — запустить seed локально, указав в `.env` строку подключения Neon.

---

## 3. Vercel (Frontend)

### 3.1. Импортировать проект

1. Зайти на [vercel.com](https://vercel.com) и зарегистрироваться.
2. Нажать **"Add New" → "Project"**.
3. Импортировать репозиторий: `kutuzich/vk-mini-app-pizza-nyam`.

### 3.2. Настроить проект

| Параметр | Значение |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (подставится автоматически) |
| **Output Directory** | `dist` (подставится автоматически) |

### 3.3. Переменные окружения

В разделе **"Environment Variables"** добавить:

| Переменная | Значение |
|---|---|
| `VITE_API_URL` | `https://pizza-nyam-api.onrender.com/api` (URL бэкенда из шага 2.4 + `/api`) |

> Важно: переменные Vite должны начинаться с `VITE_`, иначе они не попадут в клиентский код.

### 3.4. Деплой

Нажать **"Deploy"**. После сборки фронтенд будет доступен по адресу вида: `https://pizza-nyam.vercel.app`

---

## 4. Связать всё вместе

После того как оба сервиса задеплоены:

### 4.1. Обновить CORS на Render

Вернуться в Render → Settings → Environment → обновить переменную:

```
CORS_ORIGIN=https://pizza-nyam.vercel.app
```

(Подставить реальный домен Vercel.)

Render автоматически перезапустит сервис.

### 4.2. Обновить VK Redirect URI

Обновить переменную `VK_REDIRECT_URI` на Render, указав продакшен-домен:

```
VK_REDIRECT_URI=https://pizza-nyam-api.onrender.com/api/auth/vk/callback
```

### 4.3. Настроить VK Mini App

В настройках VK Mini App ([vk.com/apps](https://vk.com/apps) → ваше приложение → Настройки):

- **URL приложения** — указать URL фронтенда на Vercel.

---

## 5. Проверка

1. Открыть URL бэкенда в браузере — должен ответить (например, 404 или welcome message).
2. Открыть URL фронтенда — должно загрузиться приложение.
3. Проверить, что фронтенд получает данные (список пицц) от API.
4. Проверить авторизацию через VK.

---

## Возможные проблемы

| Проблема | Решение |
|---|---|
| Бэкенд не стартует | Проверить логи в Render → Logs. Частая причина — неправильный `DATABASE_URL` |
| CORS ошибки в консоли | Убедиться, что `CORS_ORIGIN` точно совпадает с доменом Vercel (без `/` на конце) |
| Фронтенд не получает данные | Проверить `VITE_API_URL` — должен быть полный URL с `/api` |
| База пустая | Выполнить `npm run seed` через Shell на Render |
| Free Render засыпает | На бесплатном тарифе сервис засыпает через 15 мин неактивности. Первый запрос после сна занимает ~30 сек |
| Загрузка картинок не работает | На бесплатном Render файловая система эфемерна — загруженные файлы пропадут при рестарте. Для продакшена использовать S3/Cloudinary |
