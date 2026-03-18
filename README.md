# Launchpad Monorepo

Launchpad is a demo app for eCommerce brands that want the energy of a premium product drop without the usual scramble to design and build a landing page from scratch. A merchant describes a release in plain English, Launchpad uses Codex to generate a fully themed single-file landing page, and the merchant can keep iterating with natural-language prompts until the page feels launch-ready.

The interesting part is the workflow compression. Instead of bouncing between a copy doc, a designer, a frontend engineer, and a marketing tool, Launchpad turns a short product brief into a page with mood, urgency, and structure: hero copy, countdown, product story, and a notify form. It is built to make AI feel less like a toy prompt box and more like a fast creative production tool.

Example use cases:

- A streetwear brand needs a last-minute launch page for a capsule drop happening this weekend.
- A sneaker reseller wants multiple visual directions for the same release before choosing what to publish.
- A creator-led merch launch wants a high-drama page that can be regenerated as the campaign angle changes.
- A hackathon team wants a concrete, visual demo of Codex generating polished customer-facing output instead of backend snippets.

Why it feels compelling:

- The output is immediately visible and easy to judge.
- The app connects AI generation to a real merchant workflow instead of a one-off text response.
- It gives non-technical users leverage over landing page creation with simple iteration prompts.

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

2. Configure the frontend API URL:

```bash
cp .env.example .env
```

3. Run the dev server:

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
