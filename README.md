# Launchpad

Launchpad is a demo app for eCommerce teams that need a product-drop landing page fast. A merchant enters a drop brief, Launchpad generates a fully themed single-file HTML page with Codex, and the merchant can keep iterating with natural-language prompts until it is ready to publish.

The app is intentionally small enough to explain in an interview:

- React handles the merchant workflow.
- FastAPI owns auth, persistence, and page-generation orchestration.
- SQLite stores users, drops, prompt history, and generated HTML.
- A shared Codex MCP server stays alive for the lifetime of the backend process.

## What The App Does

Launchpad turns a product brief into a launch page with:

- a hero section and generated tagline
- a countdown timer to the drop date
- a product description section
- a client-side "Notify Me" email form
- responsive styling tuned to the merchant's requested vibe

Merchants can:

- sign up and log in
- create draft drops
- generate a first landing page version
- iterate on the page with follow-up prompts
- publish the final HTML to a public URL

## Demo Flow

1. Create an account or log in.
2. Create a drop with a name, description, vibe, and release date.
3. Click generate to send the drop brief to the backend.
4. The backend asks Codex for a self-contained HTML landing page and stores the result.
5. Review the preview, then submit another prompt to refine the design or copy.
6. Publish the drop when the page is ready.
7. Share the public drop URL, which serves the stored HTML directly.

## Architecture Overview

### Frontend

- Vite + React + TypeScript + Tailwind CSS v4
- React Router handles public and authenticated routes
- `AuthContext` stores the JWT token in `localStorage`
- `lib/api.ts` is a thin `fetch()` wrapper for JSON parsing and auth headers

### Backend

- FastAPI for the HTTP API
- Async SQLAlchemy + aiosqlite for persistence
- JWT auth with `python-jose`
- Password hashing with `passlib` + `bcrypt`
- Agents SDK + Codex MCP server for landing-page generation

### Data Flow

1. The browser calls FastAPI with a bearer token after login.
2. FastAPI reads and writes drop data in SQLite.
3. `POST /drops/{id}/generate` builds a prompt from the saved drop metadata.
4. The backend sends that prompt to a long-lived Agent connected to a long-lived Codex MCP server.
5. The generated HTML is validated, saved to the `drops.generated_html` column, and returned to the frontend.
6. Published pages are served from `GET /public/drops/{id}`.

## Auth, Persistence, And Codex Runtime

### Auth

- `POST /auth/signup` creates a user and returns a JWT.
- `POST /auth/login` returns a JWT for an existing user.
- Protected routes use `Authorization: Bearer <token>`.
- The frontend stores the token in `localStorage` and attaches it automatically in `apiFetch`.

### Persistence

- SQLite is the default database: `sqlite+aiosqlite:///./launchpad.db`
- SQLAlchemy models define `User` and `Drop`
- Tables are created automatically on backend startup with `Base.metadata.create_all`
- Generated HTML and prompt history are stored with the drop record so the demo has durable state

### Runtime Codex Integration

- FastAPI startup runs a lifespan hook in [`backend/app/main.py`](/home/jack/Documents/workspace/launchpad/backend/app/main.py)
- That lifespan hook initializes database tables and starts the shared Codex service
- The Codex service creates one `MCPServerStdio` process using `npx -y @openai/codex mcp-server`
- The service also creates one Agent with instructions to return a full single-file HTML document
- Requests reuse the same MCP server and Agent for the lifetime of the backend process
- On shutdown, the backend cleans up the MCP server instead of leaving orphaned subprocesses behind

This design keeps the interesting runtime story simple: the app does not spawn a fresh Codex process per request.

## Repository Layout

```text
launchpad/
  frontend/            # React app for merchants
  backend/             # FastAPI API, auth, persistence, Codex orchestration
  scripts/dev.sh       # Runs frontend + backend together
  Makefile             # Root convenience workflow
```

Notable backend files:

- [`backend/app/main.py`](/home/jack/Documents/workspace/launchpad/backend/app/main.py): FastAPI app, lifespan, CORS, health check
- [`backend/app/codex_service.py`](/home/jack/Documents/workspace/launchpad/backend/app/codex_service.py): shared Codex MCP server + Agent lifecycle
- [`backend/app/routers/auth.py`](/home/jack/Documents/workspace/launchpad/backend/app/routers/auth.py): signup, login, current-user endpoints
- [`backend/app/routers/drops.py`](/home/jack/Documents/workspace/launchpad/backend/app/routers/drops.py): drop CRUD, generate, publish, public HTML route

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- `npx` available on your PATH
- `OPENAI_API_KEY` set in `backend/.env` if you want `/generate` to work against live Codex

## Quick Start

### Reviewer First Run

```bash
make install
```

Then edit `backend/.env` and set at least:

```env
SECRET_KEY=replace-with-a-strong-secret
OPENAI_API_KEY=your-openai-api-key
```

Start both apps together:

```bash
make dev
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- Health check: `http://127.0.0.1:8000/health`

## Makefile Workflow

```bash
make help
make install
make dev
make dev-backend
make dev-frontend
make test
make test-backend
make test-frontend
```

`make install` creates `backend/.venv`, installs Python dependencies, installs frontend dependencies, and copies missing `.env` files from the examples.

## Manual Run

### Backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

## Testing

Backend tests hit the FastAPI app directly with `httpx.AsyncClient` and an in-memory SQLite database. They cover auth, drop CRUD, publish behavior, and HTML validation. Frontend tests use Vitest + Testing Library for key route and auth flows.

Run everything:

```bash
make test
```

Or run each side independently:

```bash
make test-backend
make test-frontend
```

## API Surface

```text
POST   /auth/signup
POST   /auth/login
GET    /auth/me

GET    /drops/
POST   /drops/
GET    /drops/{id}
PUT    /drops/{id}
DELETE /drops/{id}
POST   /drops/{id}/generate
POST   /drops/{id}/publish

GET    /public/drops/{id}
GET    /health
```

## Notes

- This is a hackathon-style demo, so the priority is clarity, working behavior, and visual polish.
- There is no migration system; tables are created on startup.
- Published landing pages are stored HTML documents, not templates rendered server-side.
- If `OPENAI_API_KEY` is missing, most of the app still works, but live landing-page generation will fail.
