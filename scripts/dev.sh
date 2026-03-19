#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
FRONTEND_API_URL="${FRONTEND_API_URL:-http://127.0.0.1:${BACKEND_PORT}}"

if [[ ! -f "$BACKEND_DIR/.venv/bin/activate" ]]; then
  echo "Missing backend virtualenv at backend/.venv." >&2
  echo "Create it first with: cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt" >&2
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Missing frontend dependencies at frontend/node_modules." >&2
  echo "Install them first with: cd frontend && npm install" >&2
  exit 1
fi

cleanup() {
  local exit_code=$?

  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi

  wait >/dev/null 2>&1 || true
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

echo "Starting Launchpad backend on http://127.0.0.1:${BACKEND_PORT}"
(
  cd "$BACKEND_DIR"
  . .venv/bin/activate
  exec uvicorn app.main:app --reload --host 127.0.0.1 --port "$BACKEND_PORT"
) &
BACKEND_PID=$!

echo "Starting Launchpad frontend on http://127.0.0.1:${FRONTEND_PORT}"
(
  cd "$FRONTEND_DIR"
  export VITE_API_URL="$FRONTEND_API_URL"
  exec npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

echo "Frontend API target: $FRONTEND_API_URL"
echo "Press Ctrl+C to stop both processes."

wait -n "$BACKEND_PID" "$FRONTEND_PID"
