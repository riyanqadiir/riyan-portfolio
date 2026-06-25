# Local Development

## Prerequisites

- Node.js 24+ (matches `"engines": { "node": "24.x" }` in root `package.json`)
- npm
- MongoDB Atlas cluster (or local MongoDB)
- AWS S3 bucket with `PutObject` / `GetObject` for `projects/*`, `resumes/*`, `profiles/*`
- Brevo account for contact form (optional until you test contact)

## 1. Install dependencies

```bash
npm install                    # root — API bundling deps
cd frontend && npm install
cd ../backend && npm install
```

## 2. Configure environment

Copy the example env file into **backend/** (not the repo root):

```bash
cp backend/.env.example backend/.env
```

**Required for full functionality:**

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB — use `/portfolio` as the database name |
| `JWT_SECRET` | Secret for signing admin JWTs |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin login |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 uploads |
| `AWS_REGION` / `AWS_S3_BUCKET` | S3 bucket config |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` | Contact form email |

> Never commit `backend/.env`. It is gitignored.

**No frontend `.env` is required.** Optional: `REACT_APP_API_URL` in `frontend/.env` to override the dev proxy target (default `http://localhost:3001`).

## 3. Start development servers

### Two terminals (recommended)

**Terminal 1 — Backend (port 3001):**

```bash
cd backend
npm run dev
```

Uses `scripts/dev-server.ts` — loads handlers from root `api/` and shared code from `backend/lib/`.

**Terminal 2 — Frontend (port 3000):**

```bash
cd frontend
npm start
```

The frontend proxies `/api/*` to `http://localhost:3001` via `frontend/src/setupProxy.js`.

### Alternative — Vercel dev (full-stack simulation)

From the repo root (requires [Vercel CLI](https://vercel.com/docs/cli)):

```bash
vercel dev
```

Uses root `vercel.json` — closer to production, but slower than the two-terminal setup.

## 4. Verify everything works

| Check | URL / Action |
|-------|----------------|
| Portfolio loads | http://localhost:3000 |
| API health | http://localhost:3001/api/health |
| Projects via proxy | http://localhost:3000/api/projects |
| Admin login | http://localhost:3000/admin |
| Project image upload | Admin → Projects → Upload Image |
| Resume upload | Admin → Resume → Upload PDF |
| Profile photo | Admin → Profile Photo → Upload image |
| Contact form | Homepage → Contact section |

## Project structure reminder

```
api/          ← route handlers (same files Vercel deploys)
backend/      ← lib/, models/, dev server, .env
frontend/     ← React app
```

When editing API behavior:

- Change request/response logic in `api/<route>.ts`
- Change shared business logic in `backend/lib/`
- Change schemas in `backend/models/`

Restart `npm run dev` in `backend/` after adding new routes to `scripts/dev-server.ts`.

## Troubleshooting

### API calls return 404 in the browser

- Ensure backend is running on port 3001
- Kill stale process: `lsof -ti :3001 | xargs kill`
- Restart frontend after changing `setupProxy.js`

### `Invalid JSON body` on file upload (local dev)

The dev server must skip JSON parsing for multipart routes (`/api/projects/upload`, `/api/resume/upload`, `/api/profile-photo/upload`). This is configured in `backend/scripts/dev-server.ts`.

### MongoDB connection fails

- Confirm `MONGO_URI` uses database name `portfolio`
- Whitelist your IP in MongoDB Atlas → Network Access

### S3 upload fails (`AccessDenied`)

- Bucket is **private** — the app uses presigned URLs (this is correct)
- Verify IAM policy covers `projects/*`, `resumes/*`, `profiles/*`
- Confirm `AWS_S3_BUCKET` matches the bucket your IAM user can access

### JWT / 401 on admin actions

- Log out and log back in
- Ensure `JWT_SECRET` is unchanged between restarts

### Port 3001 already in use

```bash
lsof -ti :3001 | xargs kill
cd backend && npm run dev
```
