# Quick Start — 5 Minute Guide

## What is this project?

A portfolio monorepo with three main parts:

| Folder | What it is | Runs on |
|--------|------------|---------|
| `frontend/` | React portfolio + `/admin` CMS | `localhost:3000` |
| `api/` | HTTP route handlers (deployed to Vercel) | same origin `/api/*` |
| `backend/` | Shared logic, models, local dev server | `localhost:3001` (dev only) |

Vercel deploys **frontend + api** from the repo root using `vercel.json`.

---

## How it fits together

```
Browser (localhost:3000)
    │
    ├── GET  /                    → React pages
    ├── GET  /admin               → CMS (projects, expertise, timeline, resume, photo)
    │
    └── /api/*                    → proxied to :3001 in dev, serverless on Vercel
            │
            ├── GET  /api/projects        → MongoDB
            ├── GET  /api/expertise       → MongoDB
            ├── GET  /api/timeline        → MongoDB
            ├── GET  /api/resume          → S3 presigned URLs
            ├── GET  /api/profile-photo   → S3 presigned URLs
            ├── POST /api/auth/login      → JWT
            ├── POST /api/projects/upload → S3
            ├── POST /api/resume/upload   → S3 (PDF)
            ├── POST /api/profile-photo/upload → S3 (image)
            └── POST /api/contact         → Brevo email
```

---

## First-time setup

```bash
# 1. Install root + frontend + backend deps
npm install
cd frontend && npm install
cd ../backend && npm install

# 2. Configure secrets (backend only — never commit .env)
cp backend/.env.example backend/.env
# Edit backend/.env — MongoDB, JWT, admin password, S3, Brevo
```

---

## Run locally (two terminals)

**Terminal 1 — Backend API:**

```bash
cd backend
npm run dev
```

Runs on port **3001**. Loads handlers from root `api/`.

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
| Build frontend | `npm run build` | `frontend/` |
| Type-check API | `npm run type-check` | `backend/` |

---

## What lives where?

```
frontend/
  src/components/       UI (Main, Project, Admin, Contact…)
  src/components/admin/ CMS sections (projects, expertise, timeline, resume, photo)
  src/setupProxy.js     Dev proxy: /api/* → localhost:3001
  public/               Favicons, SEO, legacy project images
  package.json

api/                    Route handlers (one file = one endpoint) — DEPLOYED
  projects/
  expertise/
  timeline/
  resume/
  profile-photo/
  auth/login.ts
  contact.ts
  health.ts

backend/                Shared code — NOT deployed alone
  lib/                  auth, db, s3, validators
  models/               Mongoose schemas
  scripts/dev-server.ts Local API server
  .env                  Secrets (gitignored)
  package.json

package.json            Root deps for Vercel API bundling
vercel.json             Deploy config
docs/                   Documentation
```

---

## Deploy to Vercel

1. Push repo to GitHub
2. Import in Vercel — Root Directory `.`, Framework Preset **Other**
3. Add env vars from `backend/.env.example` (backend only — no frontend vars)
4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

---

## Admin workflow

1. Go to `/admin`
2. Login with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `backend/.env`
3. Use tabs: **Projects**, **Expertise**, **Career History**, **Resume**, **Profile Photo**
4. Uploads go to S3; content saves to MongoDB
5. Public site loads everything via `/api/*`

---

## More reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) — `api/` vs `backend/` explained
- [API.md](./API.md) — all endpoints
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) — troubleshooting
