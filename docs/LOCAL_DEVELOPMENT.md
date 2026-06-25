# Local Development

## Prerequisites

- Node.js 18+
- npm
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel` or use the root devDependency)
- MongoDB Atlas cluster (or local MongoDB)
- AWS S3 bucket with `s3:PutObject` permission for your IAM user

## 1. Install Dependencies

Install each app separately:

```bash
cd frontend && npm install
cd ../backend && npm install
```

## 2. Configure Environment

Copy the example env file into **backend/** (not the repo root):

```bash
cp backend/.env.example backend/.env
```

**Required for full functionality:**

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection — use `/portfolio` as the database name |
| `JWT_SECRET` | Secret for signing admin JWTs |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin login credentials |
| `AWS_*` | S3 upload credentials |
| `BREVO_*` | Contact form email delivery |

> Never commit `backend/.env`. It is gitignored.

## 3. Start Development Servers

### Two terminals (recommended)

**Terminal 1 — Backend (port 3001):**

```bash
cd backend
npm install   # first time only
npm run dev
```

Uses `scripts/dev-server.ts` — a lightweight local server on port 3001. (Vercel CLI cannot be used as `npm run dev` because it recursively invokes itself.)

**Terminal 2 — Frontend (port 3000):**

```bash
cd frontend
npm start
```

The frontend proxies `/api/*` to `http://localhost:3001` via `frontend/src/setupProxy.js`.

### Alternative — Vercel dev (full-stack simulation)

From the repo root (requires [Vercel CLI](https://vercel.com/docs/cli) installed globally):

```bash
vercel dev
```

Uses root `vercel.json` to serve both the CRA dev server and API routes together, closer to production behavior.

## 4. Verify Everything Works

| Check | URL / Action |
|-------|----------------|
| Portfolio loads | http://localhost:3000 |
| API health | http://localhost:3001/api/health |
| Projects API | http://localhost:3000/api/projects |
| Admin login | http://localhost:3000/admin |
| Image upload | Admin → Add Project → Upload Image |

## Troubleshooting

### API calls return 404 in the browser

- Ensure the backend is running on port 3001
- Check `frontend/src/setupProxy.js` target URL
- Restart the frontend after changing proxy config

### MongoDB connection fails

- Confirm `MONGO_URI` uses database name `portfolio`
- Whitelist your IP in MongoDB Atlas → Network Access
- Check username/password in the connection string

### S3 upload fails

- Verify IAM user has `s3:PutObject` on the bucket
- Confirm bucket name and region match env vars
- Bucket must allow public read (bucket policy) OR use CloudFront for private buckets

### JWT / 401 on admin actions

- Log out and log back in to refresh the token
- Ensure `JWT_SECRET` is the same between restarts
