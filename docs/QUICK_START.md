# Quick Start — 5 Minute Guide

## What is this project?

Two separate apps in one repo:

| Folder | What it is | Runs on |
|--------|------------|---------|
| `frontend/` | React portfolio website + `/admin` dashboard | `localhost:3000` |
| `backend/` | Serverless API (login, projects, S3 upload, contact email) | `localhost:3001` |

Vercel deploys **both** from the repo root using `vercel.json` — you do not need a root `package.json` for that.

---

## How it fits together

```
Browser (localhost:3000)
    │
    ├── GET  /              → React pages (home, projects, contact)
    ├── GET  /admin         → Admin login + project editor
    │
    └── /api/*              → proxied to backend (:3001)
            │
            ├── GET  /api/projects        → MongoDB (public)
            ├── POST /api/auth/login      → JWT token
            ├── POST /api/projects/upload → AWS S3
            └── POST /api/contact         → Brevo email
```

---

## First-time setup

```bash
# 1. Install frontend deps
cd frontend && npm install

# 2. Install backend deps
cd ../backend && npm install

# 3. Configure secrets (backend only)
cp .env.example .env
# Edit backend/.env — MongoDB, JWT, admin password, S3, Brevo
```

---

## Run locally (two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm install   # first time only
npm run dev
```
Runs a local API server on port 3001 (no Vercel CLI needed).

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

Open http://localhost:3000 — admin at http://localhost:3000/admin

---

## Common commands

| Task | Command | Where |
|------|---------|-------|
| Start frontend | `npm start` | `frontend/` |
| Start backend | `npm run dev` | `backend/` |
| Build for production | `npm run build` | `frontend/` |
| Type-check API | `npm run type-check` | `backend/` |

---

## What lives where?

```
frontend/
  src/components/     UI (Main, Project, Admin, Contact…)
  src/setupProxy.js   Sends /api/* to backend in dev
  public/             Images, favicon, SEO files
  package.json        React dependencies only

backend/
  api/                One file = one API route (Vercel serverless)
  lib/                Shared code (auth, db, s3, validation)
  models/             MongoDB schemas
  .env                Your secrets (never commit)
  package.json        API dependencies only

docs/                 Full documentation
vercel.json           Deploy config (root — not a package file)
```

---

## Deploy to Vercel

1. Push repo to GitHub
2. Import project in Vercel (root directory = repo root)
3. Add env vars from `backend/.env.example` in Vercel dashboard
4. Deploy — `vercel.json` handles the rest

See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

---

## Admin workflow

1. Go to `/admin`
2. Login with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `backend/.env`
3. Add or edit projects
4. Upload image → goes to S3 → URL saved in MongoDB
5. Public site at `/` loads projects from `GET /api/projects`

---

## More reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) — deeper technical overview
- [API.md](./API.md) — all endpoints
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) — troubleshooting
