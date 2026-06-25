# Portfolio Architecture

This document explains how the monorepo is organized and how the pieces work together.

## Repository layout

```
react-portfolio-template/
├── frontend/                 # React (CRA) single-page app
│   ├── public/               # Favicons, SEO, legacy project images (GitSol, TaskMaster)
│   ├── src/                  # Components, styles, setupProxy.js
│   ├── package.json
│   └── tsconfig.json
│
├── api/                      # Single Vercel serverless function (Hobby plan)
│   └── index.ts              # Routes all /api/* via vercel.json rewrite
│
├── backend/                  # Shared server code + local dev (NOT deployed alone)
│   ├── handlers/             # Route logic (health, projects, resume, etc.)
│   ├── lib/                  # auth, db, s3, validators, request-body
│   ├── models/               # Mongoose schemas (Project, Expertise, Timeline, Resume, ProfilePhoto)
│   ├── scripts/dev-server.ts # Local API on port 3001
│   ├── .env                  # Local secrets (gitignored)
│   ├── .env.example
│   ├── package.json          # Local dev deps (tsx, dotenv)
│   └── tsconfig.json
│
├── docs/
├── package.json              # Root deps — used by Vercel to bundle api/ functions
├── vercel.json               # Build, rewrites, function config
└── README.md
```

### Why `api/` and `backend/`?

Vercel deploys serverless functions from the root `/api` directory. This project uses **one function** (`api/index.ts`) with a rewrite so all `/api/*` URLs work on the Hobby plan (12-function limit).

| Folder | Purpose | Deployed? |
|--------|---------|-----------|
| `api/index.ts` | Router: parse path → call handler → return response | **Yes** (1 function) |
| `backend/handlers/` | Business logic per resource (projects, resume, etc.) | **No** |
| `backend/lib/` + `models/` | DB, auth, S3, schemas | **No** |

Example import:

```typescript
// api/index.ts
import { handleProjectsRoot } from '../backend/handlers/projects';
import { connectDB } from '../backend/lib/db';
```

## High-level flow

```mermaid
flowchart TB
    subgraph Browser
        SPA[React SPA]
        Admin["/admin CMS"]
    end

    subgraph Vercel
        Static[frontend/build]
        API[api/index.ts — single function]
    end

    subgraph backend_lib[backend/ — shared code]
        Handlers[handlers/]
        Lib[lib/ + models/]
    end

    subgraph External
        MongoDB[(MongoDB Atlas /portfolio)]
        S3[(AWS S3 — private bucket)]
        Brevo[Brevo Email API]
    end

    SPA -->|GET /api/projects| API
    Admin -->|JWT-protected CRUD| API
    API --> Handlers
    Handlers --> Lib
    Lib --> MongoDB

    Lib --> S3
    Handlers --> Brevo

    Vercel --> Static
    Vercel --> API
```

## Local vs production routing

| Environment | How `/api/*` works |
|-------------|-------------------|
| **Local dev** | CRA `setupProxy.js` forwards `/api/*` → `http://localhost:3001` (`dev-server.ts` loads `api/index.ts`) |
| **Production** | `vercel.json` rewrites `/api/(.*)` → `/api/index?path=$1` — one serverless function |

No `REACT_APP_API_URL` is needed in production.

## Serverless design

`api/index.ts` exports a default `handler(req, res)` compatible with `@vercel/node`. It reads the path from `req.query.path` (set by the Vercel rewrite) and dispatches to `backend/handlers/*`:

- **Hobby-plan friendly** — only **1** serverless function for the entire API
- **No long-running server** on Vercel
- **Clear split** — router in `api/`, business logic in `backend/handlers/`

Local development uses `backend/scripts/dev-server.ts` instead of Vercel CLI (avoids recursive `vercel dev` issues).

## Authentication

| Concern | Implementation |
|---------|----------------|
| Admin credentials | `ADMIN_USERNAME` + `ADMIN_PASSWORD` env vars |
| Login | `POST /api/auth/login` → JWT |
| Protected routes | `Authorization: Bearer <token>` header |
| Token storage | `localStorage.adminToken` in the browser |
| Validation | Zod schemas in `backend/lib/validators.ts` |

Protected: all `POST`/`PUT`/`DELETE`/`PATCH` CMS routes, file uploads.

## Data layer

- **Database:** MongoDB Atlas, database name `portfolio`
- **Collections:** projects, expertise, timelines, resumes, profilephotos (Mongoose models)
- **Connection caching:** `backend/lib/db.ts` reuses Mongoose on warm invocations
- **Seed fallback:** `GET /api/projects` returns hardcoded seed data if DB is unreachable

## S3 storage (private bucket)

All uploads use presigned URLs — nothing is public-read on the bucket.

| Content | S3 prefix | CMS tab |
|---------|-----------|---------|
| Project images | `projects/` | Projects |
| Resume PDF | `resumes/portfolio-resume.pdf` | Resume |
| Profile photo | `profiles/portfolio-photo.{jpg\|png\|webp}` | Profile Photo |

Flow: upload → store S3 **key** in MongoDB → `GET` endpoints return presigned `imageUrl` / `previewUrl` / `downloadUrl`.

## Admin CMS tabs

| Tab | API |
|-----|-----|
| Projects | `/api/projects`, `/api/projects/upload` |
| Expertise | `/api/expertise` |
| Career History | `/api/timeline`, `/api/timeline/normalize` |
| Resume | `/api/resume`, `/api/resume/upload` |
| Profile Photo | `/api/profile-photo`, `/api/profile-photo/upload` |

## Contact form security

The Brevo API key lives **only** in server env vars. The React app calls `POST /api/contact` — the key never ships to the browser.

## Frontend routing

| URL | Purpose |
|-----|---------|
| `/` | Public portfolio |
| `/admin` | CMS login + content management |

Vercel rewrites non-`/api/*` paths to `index.html` for SPA support.

## Validation

Request bodies use **Zod** (not express-validator). Error format: `{ errors: [{ field, message }] }`.
