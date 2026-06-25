# Riyan Qadir — Developer Portfolio

React frontend + Vercel serverless backend with admin dashboard, MongoDB, and S3 image uploads.

🔗 **Live:** [riyan-portfolio.vercel.app](https://riyan-portfolio.vercel.app)

## Structure

```
frontend/     React app (portfolio + /admin)
backend/      Serverless API
docs/         Documentation
vercel.json   Deploy config (lives at root for Vercel)
```

Each folder has its **own** `package.json`. There is no root `package.json` — install and run commands inside `frontend/` or `backend/`.

## Quick Start

```bash
# Install
cd frontend && npm install
cd ../backend && npm install

# Configure
cp backend/.env.example backend/.env   # then edit with your credentials

# Run (two terminals)
cd backend && npm run dev    # port 3001
cd frontend && npm start     # port 3000
```

**Read the full guide:** [`docs/QUICK_START.md`](./docs/QUICK_START.md)

## Documentation

| Guide | What it covers |
|-------|----------------|
| [Quick Start](./docs/QUICK_START.md) | 5-minute overview |
| [Architecture](./docs/ARCHITECTURE.md) | How everything connects |
| [Local Development](./docs/LOCAL_DEVELOPMENT.md) | Env vars & troubleshooting |
| [Deployment](./docs/DEPLOYMENT.md) | Vercel setup |
| [API](./docs/API.md) | All `/api/*` endpoints |

## Credits

Built by **Riyan Qadir**, based on the original concept by [Yuji Sato](https://github.com/yujisatojr/).
