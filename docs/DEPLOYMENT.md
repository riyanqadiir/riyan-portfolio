# Deployment (Vercel)

## Overview

One Vercel project deploys everything:

1. **Frontend** — static files from `frontend/build`
2. **API** — serverless functions from root `api/**/*.ts`

Root `vercel.json` controls install, build, output, rewrites, and function settings.

Vercel Hobby allows **12 serverless functions** per deployment. This repo uses **8** by grouping related routes into catch-all handlers:

| Function | Routes |
|----------|--------|
| `api/health.ts` | `GET /api/health` |
| `api/contact.ts` | `POST /api/contact` |
| `api/auth/login.ts` | `POST /api/auth/login` |
| `api/projects/[[...slug]].ts` | projects CRUD + upload |
| `api/expertise/[[...slug]].ts` | expertise CRUD |
| `api/timeline/[[...slug]].ts` | timeline CRUD + normalize |
| `api/resume/[[...slug]].ts` | resume GET + upload |
| `api/profile-photo/[[...slug]].ts` | profile photo GET + upload |

Shared business logic lives in `backend/handlers/` and `backend/lib/`.

## Vercel project settings

When importing or reviewing settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | `.` (repo root) |
| **Framework Preset** | **Other** (not Create React App) |
| **Build Command** | *(leave empty — uses `vercel.json`)* |
| **Output Directory** | *(leave empty — uses `vercel.json`)* |
| **Install Command** | *(leave empty — uses `vercel.json`)* |

Do **not** set Root Directory to `frontend/` — that skips the API.

## Deploy steps

### 1. Push to GitHub

```bash
git add .
git commit -m "your message"
git push origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Use the settings table above
4. Vercel reads root `vercel.json` automatically

### 3. Set environment variables

In **Vercel → Project → Settings → Environment Variables**, add all variables from `backend/.env.example`:

| Variable | Required | Environments |
|----------|----------|--------------|
| `MONGO_URI` | Yes | Production, Preview |
| `JWT_SECRET` | Yes | Production, Preview |
| `JWT_EXPIRES_IN` | Optional | Production, Preview |
| `ADMIN_USERNAME` | Yes | Production, Preview |
| `ADMIN_PASSWORD` | Yes | Production, Preview |
| `AWS_ACCESS_KEY_ID` | Yes | Production, Preview |
| `AWS_SECRET_ACCESS_KEY` | Yes | Production, Preview |
| `AWS_REGION` | Yes | Production, Preview |
| `AWS_S3_BUCKET` | Yes | Production, Preview |
| `BREVO_API_KEY` | Yes | Production, Preview |
| `BREVO_SENDER_EMAIL` | Yes | Production, Preview |

**No frontend env vars are required.** The React app uses relative `/api/*` URLs on the same domain.

Use strong, unique values in production — especially `JWT_SECRET` and `ADMIN_PASSWORD`.

### 4. Deploy

Vercel deploys on every push to the connected branch. After deploy:

| URL | Purpose |
|-----|---------|
| `https://<project>.vercel.app/` | Portfolio |
| `https://<project>.vercel.app/admin` | CMS |
| `https://<project>.vercel.app/api/health` | API health check |

## How routing works in production

```
Browser request                 Vercel routing
─────────────────               ──────────────
GET  /                  →       frontend/build/index.html
GET  /admin             →       frontend/build/index.html  (React Router)
GET  /api/projects      →       api/projects/index.ts
POST /api/auth/login    →       api/auth/login.ts
POST /api/resume/upload →       api/resume/upload.ts
```

Rewrites in `vercel.json`:

- `/api/(.*)` → `/api/$1` (serverless functions)
- everything else → `/index.html` (SPA)

## What gets installed on build

From `vercel.json`:

```json
"installCommand": "npm install && npm install --prefix frontend && npm install --prefix backend"
```

- **Root `package.json`** — dependencies for bundling `api/` functions on Vercel
- **`frontend/`** — React build
- **`backend/`** — optional; mainly for local dev, but installed for consistency

## MongoDB Atlas for production

1. Use database name `portfolio` in `MONGO_URI`
2. Allow network access (`0.0.0.0/0` or Vercel IP ranges)
3. Use a dedicated DB user with read/write on `portfolio` only

## AWS S3 IAM policy

Your IAM user needs `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on:

- `projects/*`
- `resumes/*`
- `profiles/*`

The bucket is private — the app serves files via presigned URLs.

## Custom domain

Vercel → Project → Settings → Domains → add your domain. No code changes needed.

## Troubleshooting deploy errors

| Error | Fix |
|-------|-----|
| `Function Runtimes must have a valid version` | Do not set `"runtime": "@vercel/node@3"` in `vercel.json` — use `"engines": { "node": "24.x" }` in `package.json` |
| `pattern ... doesn't match any Serverless Functions inside the api directory` | API handlers must live in root `api/`, not `backend/api/` |
| API returns 404 on production | Confirm Root Directory is `.` and env vars are set |
| Build succeeds but CMS fails | Check Vercel env vars match `backend/.env.example` |

## Optional: split frontend and backend

Not recommended for this repo. If you deploy API separately:

1. New Vercel project with handlers in `api/`
2. Set `REACT_APP_API_URL` in frontend and update fetch calls

The unified root deploy is simpler and already configured.
