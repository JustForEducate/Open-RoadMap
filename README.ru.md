# OpenRoadMap

**Модульный Roadmap в тактическом стиле**

Система управления задачами с 4 этапами, фото-галереей, drag-and-drop админкой и военным HUD-дизайном.

---

## Этапы

1. **В планах**
2. **В разработке**
3. **Готово ждёт релиз**
4. **Реализовано**

---

## Возможности

- Публичная страница — все видят roadmap без авторизации
- Админка (`/admin`) — управление задачами, загрузка фото
- Drag & Drop — перетаскивание задач между этапами
- Фото — загрузка и просмотр в модальном окне с навигацией
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

---

## Пароль админки

> ⚠️ **ВРЕМЕННЫЙ ПАРОЛЬ! Обязательно смените перед использованием!**

**Пароль:** `CHANGE_ME_NOW`

**Где сменить:**
`frontend/src/components/AdminAuth.jsx` — строка:
```js
const storedPassword = localStorage.getItem('adminPassword') || 'CHANGE_ME_NOW';
```

---

## Структура проекта

```
open-roadmap/
├── backend/
│   ├── server.js              # Точка входа Express
│   ├── database.js            # SQLite (локально) / PostgreSQL (на сервере)
│   ├── routes/items.js        # CRUD API
│   ├── middleware/upload.js   # Multer для фото
│   ├── uploads/               # Загруженные фото
│   └── render.yaml            # Конфиг Render
├── frontend/
│   ├── src/
│   │   ├── pages/             # PublicRoadmap, AdminLayout, Roadmap
│   │   ├── components/        # StageColumn, RoadmapCard, PhotoModal, ItemModal, AdminAuth
│   │   ├── api.js             # HTTP-клиент с VITE_API_BASE_URL
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
| `GET` | `/api/items` | Все элементы с фото |
| `POST` | `/api/items` | Создать `{title, description, stage}` |
| `PUT` | `/api/items/:id` | Обновить `{title?, description?, stage?}` |
| `DELETE` | `/api/items/:id` | Удалить элемент + его фото |
| `GET` | `/api/items/:id/photos` | Фото элемента |
| `POST` | `/api/items/:id/photos` | Загрузить фото (multipart) |
| `DELETE` | `/api/items/:id/photos/:photoId` | Удалить фото |
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
- ✏️ Редактирование названия, описания, этапа
- 🗑️ Удаление элемента
- Drag & Drop между этапами
- ➕ Добавление нового элемента
- ➕ Загрузка фото в галерею

---

## Деплой

### Render (Backend)

1. **New → Web Service** → подключите GitHub репозиторий
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `node server.js`
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

### Домен на Vercel

```
Settings → Domains → Add domain
Nameservers: ns1.vercel-dns.com / ns2.vercel-dns.com
```

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

- **Frontend:** React 18, Vite 6, React Router 6, Lucide Icons
- **Backend:** Node.js 20+, Express 4, Multer, SQL.js / pg
- **Design:** CSS Custom Properties, Orbitron + Share Tech Mono
- **Hosting:** Vercel (Frontend) + Render (Backend + PostgreSQL)
