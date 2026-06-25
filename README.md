# Riyan Qadir — Developer Portfolio

React frontend + Vercel serverless API with a full CMS admin dashboard, MongoDB, S3 uploads, and Brevo contact email.

🔗 **Live:** [riyan-portfolio.vercel.app](https://riyan-portfolio.vercel.app)

## Features

- Public portfolio (hero, projects, expertise, career timeline, contact)
- Admin CMS at `/admin` — projects, expertise, career history, resume (PDF), profile photo
- MongoDB for content, AWS S3 for images/resume/profile photo (presigned URLs)
- Single Vercel deployment (frontend + API on one domain)

## Repository structure

```
react-portfolio-template/
├── frontend/          React SPA (portfolio + /admin CMS)
├── api/               Vercel serverless route handlers (deployed)
├── backend/           Shared server logic, models, local dev (not deployed alone)
│   ├── lib/           Auth, DB, S3, validators, business logic
│   ├── models/        Mongoose schemas
│   ├── scripts/       Local dev server (port 3001)
│   └── .env           Local secrets (gitignored)
├── docs/              Documentation
├── package.json       Root deps for Vercel API bundling
└── vercel.json        Deploy config (must stay at repo root)
```

| Folder | Role |
|--------|------|
| `frontend/` | UI only — calls `/api/*` on the same origin |
| `api/` | Thin HTTP handlers — one file per route (Vercel requirement) |
| `backend/` | Shared library + local dev tooling — imported by `api/` handlers |

## Quick start

```bash
# Install (root + both apps)
npm install
cd frontend && npm install
cd ../backend && npm install

# Configure secrets
cp backend/.env.example backend/.env   # then edit

# Run (two terminals)
cd backend && npm run dev    # API on :3001
cd frontend && npm start     # UI on :3000
```

Open http://localhost:3000 — admin at http://localhost:3000/admin

**Full guide:** [`docs/QUICK_START.md`](./docs/QUICK_START.md)

## Deploy to Vercel

1. Import repo with **Root Directory** = `.` and **Framework Preset** = **Other**
2. Add env vars from `backend/.env.example` in the Vercel dashboard (no frontend env vars needed)
3. Push to `main` — `vercel.json` handles build + API routes

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for step-by-step instructions.

## Documentation

| Guide | What it covers |
|-------|----------------|
| [Quick Start](./docs/QUICK_START.md) | Setup and daily commands |
| [Architecture](./docs/ARCHITECTURE.md) | How `frontend/`, `api/`, and `backend/` connect |
| [Local Development](./docs/LOCAL_DEVELOPMENT.md) | Env vars and troubleshooting |
| [Deployment](./docs/DEPLOYMENT.md) | Vercel settings and env vars |
| [API](./docs/API.md) | All `/api/*` endpoints |

## Credits

Built by **Riyan Qadir**, based on the original concept by [Yuji Sato](https://github.com/yujisatojr/).
