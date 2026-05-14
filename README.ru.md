# OpenRoadMap

**Модульный Roadmap в тактическом стиле**

Система управления задачами с 4 этапами, фото-галереей, drag-and-drop админкой и военным HUD-дизайном.

[**English version →**](README.md)

---

## Этапы

Подписи колонок **локализованы** (RU / EN). Язык интерфейса по умолчанию подстраивается под браузер; выбор языка — **выпадающий список в шапке** (флаги и коды RU/EN), значение сохраняется в браузере (`openRoadMapLocale`). Строка статуса в шапке (**«СИСТЕМА ОНЛАЙН»** и т.п.) **выровнена по центру** между логотипом и кнопками.

1. **В планах** / Planned  
2. **В разработке** / In Development  
3. **Готово ждёт релиз** / Ready for Release  
4. **Реализовано** / Released  

---

## Возможности

- Публичная страница — все видят roadmap без авторизации
- Админка (`/admin`) — управление задачами, загрузка фото
- **Интерфейс на русском и английском** — выпадающий список в шапке (🇷🇺 / 🇬🇧); подписи, кнопки и названия этапов следуют выбранному языку
- **Перевод для зрителя (RU → EN)** — в модальном окне карточки на главной и на странице `/item/:id` кнопка **«Показать перевод на английский»** запрашивает бэкенд; английский текст показывается **под** оригинальным заголовком и описанием (только просмотр, данные в базе не меняются). **«Скрыть перевод»** убирает блок
- **Обновление публичной дорожной карты** — кнопка в шапке перезагружает данные; после успешной загрузки показывается время **«Обновлено …»**
- **Страница элемента `/item/:id`** — такая же кнопка обновления и метка времени; данные элемента и вложенные фото берутся из **одного** ответа `GET /api/items` (без лишнего запроса за фото, если они уже в списке)
- **Модалка карточки на главной** — **«Скопировать ссылку»**, **«Открыть на отдельной странице»**; галерея дополнительно подтягивается с `GET /api/items/:id/photos` в фоне
- **Переход к содержимому** — первая ссылка при фокусе ведёт на `#main-content` (удобно с клавиатуры и для скринридеров)
- **Вход в админку** — видимая подпись к полю пароля, `autocomplete="current-password"`, переключатель **показать / скрыть пароль** (иконки глаза, `aria-pressed` и `aria-label`)
- **Редактирование задачи** — подсказка **Ctrl+Enter / Cmd+Enter** для сохранения
- **Выход из админки** — **подтверждение** в браузере перед выходом из режима редактирования
- Drag & Drop — перетаскивание задач между этапами
- Фото — загрузка и просмотр в модальном окне с навигацией; плейсхолдер **«Нет фото»** выровнен в полоске превью на карточке
- Тактический дизайн в стиле НАТО и игры Squad
- Поддержка SQLite (локально) и PostgreSQL (на сервере)

---

## Быстрый старт

```bash
# Backend
cd backend
npm install
npm start    # http://localhost:3001

# Frontend (в другом терминале)
cd frontend
npm install
npm run dev  # http://localhost:5173
```

Откройте http://localhost:5173

**HTTP-клиент:** в `frontend/src/api.js` функция `apiJson` использует **AbortController** и **таймаут 20 с** на запрос. При срабатывании в интерфейсе показывается локализованное сообщение о таймауте (`error.requestTimeout` в `i18n/translations.js`; дублирующий ключ `errorRequestTimeout` в `frontend/src/locales.js` для справки вне React).

**Перевод задач:** эндпоинт `POST /api/translate` обращается к внешнему API перевода с **бэкенда**. У машины, где запущен `npm start`, должен быть разрешён **исходящий HTTPS** (например, до MyMemory). Если перевод не работает, проверьте файрвол и прокси.

**Список элементов:** `GET /api/items` выполняет **два** SQL-запроса: все строки `items`, затем один `SELECT … FROM photos WHERE item_id IN (…)` — без N+1 и без параллельного `Promise.all` по каждому элементу (важно для пула соединений PostgreSQL).

---

## Пароль админки

> ⚠️ **ВРЕМЕННЫЙ ПАРОЛЬ! Обязательно смените перед использованием!**

**Пароль:** `CHANGE_ME_NOW`

**Где сменить:**
`frontend/src/components/AdminAuth.jsx` — строка:
```js
const storedPassword = localStorage.getItem('adminPassword') || 'CHANGE_ME_NOW';
```

У формы входа есть переключатель **показать / скрыть пароль** (не меняет пароль по умолчанию выше).

---

## Структура проекта

```
open-roadmap/
├── backend/
│   ├── server.js              # Точка входа Express
│   ├── database.js            # SQLite (локально) / PostgreSQL (на сервере)
│   ├── routes/items.js        # CRUD API
│   ├── routes/translate.js    # POST /api/translate (RU→EN и др.)
│   ├── middleware/upload.js   # Multer для фото
│   ├── uploads/               # Загруженные фото
│   └── render.yaml            # Конфиг Render
├── frontend/
│   ├── src/
│   │   ├── pages/             # PublicRoadmap, AdminLayout, Roadmap
│   │   ├── components/        # StageColumn, RoadmapCard, PhotoModal, ItemModal, AdminAuth, LanguageSwitcher
│   │   ├── context/           # ErrorContext, I18nContext
│   │   ├── i18n/translations.js
│   │   ├── locales.js         # Отдельные строки (например errorRequestTimeout); синхронизировать с i18n по смыслу
│   │   ├── formatTime.js      # Форматирование времени для подписи «обновлено»
│   │   ├── hooks/useStages.js
│   │   ├── hooks/usePublicItemTranslation.js
│   │   ├── stageDefinitions.js
│   │   ├── api.js             # apiJson: VITE_API_BASE_URL, таймаут 20 с, единые ошибки
│   │   └── App.jsx            # Роутинг (/ /admin /item/:id)
│   └── vercel.json            # Конфиг Vercel
├── database.sqlite            # SQLite БД (создаётся автоматически)
├── START.bat                  # Запуск серверов (Windows)
├── STOP.bat                   # Остановка (требуются права админа)
├── .gitignore
├── .env.example
├── README.ru.md               # Этот файл
├── README.md                  # English version
└── vercel.json
```

---

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|---------|
| `GET` | `/api/items` | Все элементы с фото (два запроса к БД: `items` + пакетный `photos` по `item_id IN (…)`) |
| `POST` | `/api/items` | Создать `{title, description, stage}` |
| `PUT` | `/api/items/:id` | Обновить `{title?, description?, stage?}` |
| `DELETE` | `/api/items/:id` | Удалить элемент + его фото |
| `GET` | `/api/items/:id/photos` | Фото элемента |
| `POST` | `/api/items/:id/photos` | Загрузить фото (multipart) |
| `DELETE` | `/api/items/:id/photos/:photoId` | Удалить фото |
| `POST` | `/api/translate` | Машинный перевод: тело `{ "texts": ["..."], "from": "ru", "to": "en" }` → `{ "texts": [...] }` |
| `GET` | `/api/health` | Статус сервера |

---

## Админка

| URL | Описание |
|-----|---------|
| `http://localhost:5173` | Публичный roadmap |
| `http://localhost:5173/admin` | Админ-панель (требуется пароль) |
| `http://localhost:5173/item/:id` | Просмотр элемента с фото |

**Функции админки:**
- Клик по карточке → модальное окно с галереей фото
- ✏️ Редактирование названия, описания, этапа (без автоподстановки машинного перевода в поля); **Ctrl+Enter / Cmd+Enter** — сохранить
- 🗑️ Удаление элемента
- Drag & Drop между этапами
- ➕ Добавление нового элемента
- ➕ Загрузка фото в галерею
- **Обновление** в шапке (со спиннером) и время **«Обновлено …»** после успешной синхронизации
- **Выход** — запрос подтверждения в браузере

**Публичный просмотр (без входа):**
- Открытие карточки на главной или страница `/item/:id` — **«Показать перевод на английский»** подгружает перевод; английский отображается **под** оригинальным заголовком и описанием. **«Скрыть перевод»** скрывает блок (запись в базе не меняется).
- **Обновление данных** на главной; в модалке карточки — **«Скопировать ссылку»** и **«Открыть на отдельной странице»** (на странице элемента — аналогичные действия)

---

## Деплой

### Render (Backend)

1. **New → Web Service** → подключите GitHub репозиторий
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `node server.js` (для `/api/translate` желателен исходящий интернет)
5. **New → PostgreSQL** → создайте базу данных
6. Скопируйте **Internal Database URL** → добавьте в Environment:
   - `DATABASE_URL` = скопированный URL

### Vercel (Frontend)

1. **Add New → Project** → импортируйте репозиторий
2. **Root Directory:** `frontend`
3. **Framework Preset:** `Vite`
4. **Environment Variables:**
   - `VITE_API_BASE_URL` = `https://open-roadmap-api.onrender.com`
5. **Deploy**

---

## База данных

| Режим | Движок | Условие |
|-------|--------|---------|
| Локальная разработка | SQLite (`sql.js`) | `DATABASE_URL` не задан |
| Production (Render) | PostgreSQL (`pg`) | `DATABASE_URL` задан |

---

## Переменные окружения

### Backend
```env
DATABASE_URL=postgresql://user:password@host:5432/openroadmap
PORT=3001
```

### Frontend
```env
VITE_API_BASE_URL=https://open-roadmap-api.onrender.com
VITE_APP_FOOTER=OpenRoadMap v1.0
```

---

## Управление (Windows)

```cmd
START.bat    # Запуск обоих серверов
STOP.bat     # Остановка (требуются права администратора)
```

---

## Технологии

- **Frontend:** React 18, Vite 6, React Router 6, Lucide Icons; i18n (RU/EN), `apiJson` с таймаутом 20 с
- **Backend:** Node.js 20+, Express 4, Multer, SQL.js / pg; пакетная выдача фото для списка; опциональный прокси перевода (`fetch` к внешнему API)
- **Design:** CSS Custom Properties, Orbitron + Share Tech Mono
- **Hosting:** Vercel (Frontend) + Render (Backend + PostgreSQL)
