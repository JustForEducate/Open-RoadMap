# OpenRoadMap

**Modular Roadmap with Tactical HUD Design**

A task management system with 4 stages, photo gallery, drag-and-drop admin panel, and military-style interface inspired by NATO and the game Squad.

[**Русская версия →**](README.ru.md)

---

## Stages

Column titles are localized. Default UI language is **English**; **Russian** is available from the header switcher (choice is stored in the browser as `openRoadMapLocale`).

1. **Planned** / В планах  
2. **In Development** / В разработке  
3. **Ready for Release** / Готово ждёт релиз  
4. **Released** / Реализовано  

---

## Features

- Public page — everyone can view the roadmap without login
- Admin panel (`/admin`) — manage tasks and upload photos
- **Interface languages (RU / EN)** — toggle in the header; labels, buttons, and stage names follow the selection
- **Viewer translation (RU → EN)** — on the public roadmap card modal and on `/item/:id`, **Show English translation** requests the backend; the English text appears **below** the original title and description (read-only; does not change stored data). **Hide translation** clears it
- Drag & Drop — move tasks between stages
- Photos — upload and view in a modal gallery with navigation
- Tactical design inspired by NATO and Squad
- SQLite (local) and PostgreSQL (production) support

---

## Quick Start

```bash
# Backend
cd backend
npm install
npm start    # http://localhost:3001

# Frontend (in another terminal)
cd frontend
npm install
npm run dev  # http://localhost:5173
```

Open http://localhost:5173

**Translation:** the `POST /api/translate` endpoint calls an external translation API from the **backend**. The machine running `npm start` must allow **outbound HTTPS** (for example to MyMemory). If translation fails, check firewall and proxy settings.

---

## Admin Password

> ⚠️ **TEMPORARY PASSWORD! Change it before going live!**

**Password:** `CHANGE_ME_NOW`

**Where to change:**
`frontend/src/components/AdminAuth.jsx` — line:
```js
const storedPassword = localStorage.getItem('adminPassword') || 'CHANGE_ME_NOW';
```

---

## Project Structure

```
open-roadmap/
├── backend/
│   ├── server.js              # Express entry point
│   ├── database.js            # SQLite (local) / PostgreSQL (production)
│   ├── routes/items.js        # CRUD API
│   ├── routes/translate.js    # POST /api/translate (RU→EN, etc.)
│   ├── middleware/upload.js   # Multer for photo uploads
│   ├── uploads/               # Uploaded photos
│   └── render.yaml            # Render config
├── frontend/
│   ├── src/
│   │   ├── pages/             # PublicRoadmap, AdminLayout, Roadmap
│   │   ├── components/        # StageColumn, RoadmapCard, PhotoModal, ItemModal, AdminAuth, LanguageSwitcher
│   │   ├── context/           # ErrorContext, I18nContext
│   │   ├── i18n/translations.js
│   │   ├── hooks/useStages.js
│   │   ├── hooks/usePublicItemTranslation.js
│   │   ├── stageDefinitions.js
│   │   ├── api.js             # HTTP client with VITE_API_BASE_URL
│   │   └── App.jsx            # Router (/ /admin /item/:id)
│   └── vercel.json            # Vercel config
├── database.sqlite            # SQLite DB (auto-created)
├── START.bat                  # Start servers (Windows)
├── STOP.bat                   # Stop servers (requires admin rights)
├── .gitignore
├── .env.example
├── README.md                  # This file
├── README.ru.md               # Russian version
└── vercel.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/items` | Get all items with photos |
| `POST` | `/api/items` | Create `{title, description, stage}` |
| `PUT` | `/api/items/:id` | Update `{title?, description?, stage?}` |
| `DELETE` | `/api/items/:id` | Delete item + its photos |
| `GET` | `/api/items/:id/photos` | Get item photos |
| `POST` | `/api/items/:id/photos` | Upload photo (multipart) |
| `DELETE` | `/api/items/:id/photos/:photoId` | Delete photo |
| `POST` | `/api/translate` | Machine translation: body `{ "texts": ["..."], "from": "ru", "to": "en" }` → `{ "texts": [...] }` |
| `GET` | `/api/health` | Server health check |

---

## Admin Panel

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Public roadmap view |
| `http://localhost:5173/admin` | Admin panel (password required) |
| `http://localhost:5173/item/:id` | Item detail with photos gallery |

**Admin features:**
- Click on a card → modal gallery with photos
- ✏️ Edit title, description, stage (no automatic overwrite from machine translation)
- 🗑️ Delete item
- Drag & Drop between stages
- ➕ Add new item
- ➕ Upload photos to gallery

**Public view (no login):**
- Open a card on the home page, or open `/item/:id` — **Show English translation** loads machine translation; English appears **below** the original title and description. **Hide translation** clears it (data in the database is unchanged).

---

## Deployment

### Render (Backend)

1. **New → Web Service** → connect GitHub repository
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `node server.js` (outbound network recommended for `/api/translate`)
5. **New → PostgreSQL** → create database
6. Copy **Internal Database URL** → add to Environment:
   - `DATABASE_URL` = copied URL

### Vercel (Frontend)

1. **Add New → Project** → import repository
2. **Root Directory:** `frontend`
3. **Framework Preset:** `Vite`
4. **Environment Variables:**
   - `VITE_API_BASE_URL` = `https://open-roadmap-api.onrender.com`
5. **Deploy**

### Custom Domain on Vercel

---

## Database

| Mode | Engine | Condition |
|------|--------|-----------|
| Local development | SQLite (`sql.js`) | `DATABASE_URL` not set |
| Production (Render) | PostgreSQL (`pg`) | `DATABASE_URL` set |

---

## Environment Variables

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

## Running on Windows

```cmd
START.bat    # Start both servers
STOP.bat     # Stop servers (admin rights required)
```

---

## Tech Stack

- **Frontend:** React 18, Vite 6, React Router 6, Lucide Icons; UI i18n (RU/EN) via React context and dictionaries
- **Backend:** Node.js 20+, Express 4, Multer, SQL.js / pg; optional machine translation proxy (`fetch` to external API)
- **Design:** CSS Custom Properties, Orbitron + Share Tech Mono
- **Hosting:** Vercel (Frontend) + Render (Backend + PostgreSQL)
