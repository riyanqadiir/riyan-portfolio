# Deployment (Vercel)

## Overview

The repo is configured for a **single Vercel project** that deploys:

1. The React frontend (`frontend/build`)
2. Serverless API functions (`backend/api/**/*.ts`)

Root `vercel.json` handles build commands, output directory, API rewrites, and SPA fallback.

## Deploy Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "your message"
git push origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory:** leave as `.` (repo root)
4. Vercel reads `vercel.json` automatically

### 3. Set Environment Variables

In Vercel → Project → Settings → Environment Variables, add all variables from `backend/.env.example`:

| Variable | Environments |
|----------|--------------|
| `MONGO_URI` | Production, Preview, Development |
| `JWT_SECRET` | Production, Preview, Development |
| `ADMIN_USERNAME` | Production, Preview |
| `ADMIN_PASSWORD` | Production, Preview |
| `AWS_ACCESS_KEY_ID` | Production, Preview |
| `AWS_SECRET_ACCESS_KEY` | Production, Preview |
| `AWS_REGION` | Production, Preview |
| `AWS_S3_BUCKET` | Production, Preview |
| `BREVO_API_KEY` | Production, Preview |
| `BREVO_SENDER_EMAIL` | Production, Preview |

Use strong, unique values for production — especially `JWT_SECRET` and `ADMIN_PASSWORD`.

### 4. Deploy

Vercel deploys on every push. After the first deploy:

- Portfolio: `https://<your-project>.vercel.app/`
- Admin: `https://<your-project>.vercel.app/admin`
- API health: `https://<your-project>.vercel.app/api/health`

## How Rewrites Work in Production

```
Browser request                    Vercel routing
─────────────────                  ──────────────
GET  /                    →        frontend/build/index.html
GET  /admin               →        frontend/build/index.html  (React Router)
GET  /api/projects        →        backend/api/projects/index.ts
POST /api/auth/login      →        backend/api/auth/login.ts
POST /api/projects/upload →        backend/api/projects/upload.ts
```

The rewrite rule `"source": "/api/(.*)" → "/backend/api/$1"` maps clean `/api/*` URLs to the function files under `backend/api/`.

## Standalone Backend Deploy (Optional)

If you ever want the API on a separate Vercel project:

1. Create a new Vercel project
2. Set **Root Directory** to `backend`
3. Add the same env vars
4. Set `REACT_APP_API_URL` in the frontend project to the backend URL

For most cases, the unified root deploy is simpler.

## MongoDB Atlas for Production

1. Use database name `portfolio` in `MONGO_URI`
2. Add `0.0.0.0/0` to Network Access (or Vercel's IP ranges)
3. Create a dedicated DB user with read/write on `portfolio` only

## Custom Domain

Vercel → Project → Settings → Domains → add your domain. No code changes needed; rewrites and API routes work on custom domains automatically.
