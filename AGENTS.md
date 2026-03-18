# AGENTS.md

## Project Overview

Launchpad is a web application that lets eCommerce merchants create AI-generated landing pages for limited-edition product drops. Merchants describe their drop (name, description, vibe, date), and the app uses Codex programmatically (via the OpenAI Agents SDK + Codex MCP Server) to generate a fully themed, single-file HTML landing page. Merchants can iterate on the page with natural language prompts and publish it to a public URL.

This is a hackathon demo app. Prioritize working features, clean code, and visual polish over enterprise-grade architecture.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4 + react-router-dom
- **Backend:** Python FastAPI + SQLAlchemy (async) + aiosqlite (SQLite)
- **Auth:** JWT tokens (python-jose), passwords hashed with passlib/bcrypt
- **Codex Integration:** openai-agents SDK, Codex running as MCP server via `npx @openai/codex mcp-server`
- **Testing:** pytest + pytest-asyncio + httpx (backend), no frontend tests required

## Repository Structure

```
launchpad/
  frontend/
    src/
      components/       # Reusable UI components
      pages/            # Route-level page components
      context/          # React context providers (AuthContext)
      hooks/            # Custom hooks
      lib/              # API client, utilities
      App.tsx           # Router and layout
      main.tsx          # Entry point
    index.html
    vite.config.ts
    tailwind.config.ts
    package.json
  backend/
    app/
      __init__.py
      main.py           # FastAPI app, CORS, lifespan events
      config.py         # pydantic-settings, reads .env
      database.py       # SQLAlchemy async engine, session maker, Base
      models.py         # SQLAlchemy ORM models (User, Drop)
      schemas.py        # Pydantic request/response schemas
      auth.py           # JWT creation, verification, get_current_user dependency
      codex_service.py  # Agents SDK + Codex MCP server integration
      routers/
        __init__.py
        auth.py         # /auth/* endpoints
        drops.py        # /drops/* endpoints
    tests/
      conftest.py       # Fixtures: async client, test DB, test user
      test_auth.py
      test_drops.py
    requirements.txt
    .env.example
  README.md
  AGENTS.md
```

## Coding Conventions

### General
- Write clear, concise code. Prefer readability over cleverness.
- Use descriptive variable and function names.
- Keep functions focused and short (under ~40 lines where possible).
- Add brief docstrings to all API endpoint functions and service functions.
- Do not add inline comments unless the logic is genuinely non-obvious.

### Python (Backend)
- Use `async def` for all endpoint handlers and database operations.
- Use type hints on all function signatures.
- Use Pydantic models for all request/response validation (never pass raw dicts to/from the API).
- Use FastAPI's `Depends()` for dependency injection (database sessions, auth).
- Use `uuid4` for all primary keys (stored as strings in SQLite).
- Use a single `get_db` async generator dependency for session management.
- Do not use Alembic. Use `Base.metadata.create_all` on app startup via a lifespan event.
- Group imports: stdlib, third-party, local. One blank line between groups.
- Use `HTTPException` with clear detail messages for all error responses.

### TypeScript (Frontend)
- Use functional components exclusively.
- Use TypeScript interfaces (not `type` aliases) for component props and API response shapes.
- Colocate component-specific types in the same file.
- Use `fetch()` for API calls (no axios). Create a thin API client wrapper in `lib/api.ts` that handles the base URL, auth headers, and JSON parsing.
- Use Tailwind utility classes for all styling. Do not create separate CSS files.
- Prefer `const` over `let`. Never use `var`.
- Use early returns to reduce nesting.

### Naming
- Python: `snake_case` for functions, variables, files. `PascalCase` for classes.
- TypeScript: `camelCase` for functions and variables. `PascalCase` for components, interfaces, and types. Component files use `PascalCase.tsx`.
- API routes: lowercase, hyphenated where needed (e.g., `/drops/{id}/generate`).

## Design System

The app uses a dark, premium aesthetic that evokes the energy of a product drop.

- **Background:** Dark (slate-900 / slate-950 range)
- **Text:** White and slate-300 for secondary text
- **Accent:** A vibrant gradient (violet-500 to fuchsia-500) used sparingly for CTAs, active states, and highlights
- **Cards:** Slightly lighter dark surface (slate-800/slate-850) with subtle border (slate-700)
- **Border glow effect on preview iframes:** Use a box-shadow with a low-opacity accent color
- **Typography:** Bold, large headings. System font stack is fine.
- **Spacing:** Generous padding. Don't crowd elements.
- **Loading states:** Use skeleton/shimmer animations, not spinners, for content loading. Use a pulsing accent-colored border for the preview iframe while Codex is generating.

## API Design

- All protected endpoints require `Authorization: Bearer <token>` header.
- All endpoints return JSON.
- Use HTTP status codes correctly: 201 for creation, 404 for not found, 401 for unauthorized, 422 for validation errors.
- List endpoints return arrays directly (no pagination needed for a demo).
- The `POST /drops/{id}/generate` endpoint may take 15-30 seconds. Return a normal response (not streaming) with the generated HTML.

### Endpoint Summary

```
POST   /auth/signup              # Create account, return JWT
POST   /auth/login               # Authenticate, return JWT
GET    /auth/me                  # Get current user

GET    /drops/                   # List user's drops
POST   /drops/                   # Create new drop (draft)
GET    /drops/{id}               # Get drop detail
PUT    /drops/{id}               # Update drop metadata
DELETE /drops/{id}               # Delete drop
POST   /drops/{id}/generate      # Generate or iterate on landing page via Codex
POST   /drops/{id}/publish       # Set status to published

GET    /public/drops/{id}        # Get published drop's HTML (no auth)
```

## Codex Integration Details

The core programmatic Codex integration lives in `codex_service.py`. Here is how it works:

1. On app startup (via FastAPI lifespan), start a Codex MCP server using `MCPServerStdio` from the `openai-agents` package. The command is `npx -y @openai/codex mcp-server`. Keep a reference to this server for the app's lifetime.

2. Create an OpenAI Agent connected to the Codex MCP server. The agent's system instructions should tell it to use Codex to write a single-file HTML page (all CSS and JS inline) for a product drop landing page. The instructions should specify the page must include:
   - A hero section with the product name and a generated tagline
   - A countdown timer (JavaScript) counting down to the drop date
   - A product description section
   - A "Notify Me" email capture form (client-side only, no real backend needed)
   - Responsive layout
   - Styling that matches the specified vibe/aesthetic
   - The HTML must be completely self-contained (no external dependencies)

3. The `generate_landing_page` function takes the drop details and optionally the previous HTML plus an iteration prompt. It runs the agent and extracts the HTML from the Codex output. On iteration, the prompt includes the existing HTML and asks Codex to modify it according to the user's instructions.

4. Return the raw HTML string. The router saves it to the `generated_html` column.

**Important:** The Codex MCP server subprocess must be managed carefully. Start it once in the lifespan context manager and shut it down on app exit. Do not start a new process per request.

## Testing

- Use pytest with pytest-asyncio for all backend tests.
- Use httpx `AsyncClient` with `ASGITransport` to test the FastAPI app directly (no live server needed).
- Use an in-memory SQLite database for tests (separate from dev).
- Create fixtures for: async client, test database, authenticated user + token.
- Test auth flows: signup, login, bad credentials, protected route access.
- Test drop CRUD: create, list, get, ownership isolation.
- Do NOT write tests for the `/generate` endpoint (requires live Codex MCP server).
- Do NOT write frontend tests.
- Keep tests simple and readable. Each test should verify one behavior.

## Running the App

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then edit with a SECRET_KEY
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

### Running Tests
```bash
cd backend
pytest -v
```

## Things to Avoid

- Do not use Alembic or any migration tool. This is a demo app with SQLite.
- Do not use Redux or any state management library. React context is sufficient.
- Do not use axios. Use fetch.
- Do not add environment variables to the frontend beyond VITE_API_URL.
- Do not implement real email sending or payment processing.
- Do not over-engineer error handling. A simple try/except with HTTPException is fine.
- Do not create separate CSS files. Use Tailwind utilities inline.
- Do not use `any` type in TypeScript. Define proper interfaces.
