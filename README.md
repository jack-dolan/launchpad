# Launchpad Monorepo

This repository contains:

- `frontend/`: Vite + React + TypeScript + Tailwind CSS v4 + React Router
- `backend/`: FastAPI + async SQLAlchemy + SQLite + JWT auth

## Project Structure

```text
launchpad/
  frontend/
  backend/
```

## Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Run the dev server:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend runs on `http://localhost:5173` by default.

### Frontend Routes

- `/` (landing)
- `/login`
- `/signup`
- `/dashboard`
- `/drops/:id`

## Backend Setup

1. Create and activate a virtual environment:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Run the API:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend runs on `http://localhost:8000`.

- Health check: `GET /health`
- Auth routes: `POST /auth/signup`, `POST /auth/login`
- Drops routes: `GET/POST/PATCH/DELETE /drops`

## Notes

- No Alembic is used.
- Database tables are created automatically on startup via SQLAlchemy `create_all`.
- SQLite database file is created from `DATABASE_URL` (default: `sqlite+aiosqlite:///./launchpad.db`).
