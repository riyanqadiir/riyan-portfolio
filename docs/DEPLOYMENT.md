# Deployment (Vercel)

## Overview

One Vercel project deploys everything:

1. **Frontend** — static files from `frontend/build`
2. **API** — single serverless function at `api/index.ts` (all `/api/*` routes)

Root `vercel.json` controls install, build, output, rewrites, and function settings.

Vercel Hobby allows **12 serverless functions** per deployment. This repo uses **1** — a single `api/index.ts` router that handles every `/api/*` route via a `vercel.json` rewrite:

```json
{ "source": "/api/(.*)", "destination": "/api/index?path=$1" }
```

Catch-all files like `[[...slug]].ts` only work in **Next.js**, not in plain Vercel serverless projects. Do not split routes into multiple `api/**/*.ts` files unless you upgrade to Pro.

| Route | Handled by |
|-------|------------|
| `GET /api/health` | `api/index.ts` → `backend/handlers/health.ts` |
| `POST /api/contact` | `api/index.ts` → `backend/handlers/contact.ts` |
| `POST /api/auth/login` | `api/index.ts` → `backend/handlers/auth.ts` |
| `/api/projects/*` | `api/index.ts` → `backend/handlers/projects.ts` |
| `/api/expertise/*` | `api/index.ts` → `backend/handlers/expertise.ts` |
| `/api/timeline/*` | `api/index.ts` → `backend/handlers/timeline.ts` |
| `/api/resume/*` | `api/index.ts` → `backend/handlers/resume.ts` |
| `/api/profile-photo/*` | `api/index.ts` → `backend/handlers/profile-photo.ts` |

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
GET  /api/projects      →       /api/index?path=projects
POST /api/auth/login    →       /api/index?path=auth/login
POST /api/resume/upload →       /api/index?path=resume/upload
```

Rewrites in `vercel.json`:

- `/api/(.*)` → `/api/index?path=$1` (single serverless function)
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
| `pattern ... doesn't match any Serverless Functions inside the api directory` | API must use root `api/index.ts`, not `backend/api/` or multiple route files |
| API returns 404 on production | Confirm Root Directory is `.`, rewrite is `/api/(.*)` → `/api/index?path=$1`, and env vars are set |
| Build succeeds but CMS fails | Check Vercel env vars match `backend/.env.example` |

## Optional: split frontend and backend

Not recommended for this repo. If you deploy API separately:

1. New Vercel project with handlers in `api/`
2. Set `REACT_APP_API_URL` in frontend and update fetch calls

The unified root deploy is simpler and already configured.
