.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend test test-backend test-frontend

PYTHON ?= python3
NPM ?= npm
BACKEND_DIR := backend
FRONTEND_DIR := frontend
BACKEND_VENV := $(BACKEND_DIR)/.venv
BACKEND_PIP := $(BACKEND_VENV)/bin/pip
BACKEND_HOST ?= 127.0.0.1
BACKEND_PORT ?= 8001
FRONTEND_HOST ?= 127.0.0.1
FRONTEND_PORT ?= 5173
FRONTEND_API_URL ?= http://$(BACKEND_HOST):$(BACKEND_PORT)

help:
	@printf "Launchpad workflow\n\n"
	@printf "  make install         Create backend venv, install Python deps, install frontend deps, and copy missing .env files\n"
	@printf "  make dev             Run backend and frontend together via scripts/dev.sh\n"
	@printf "  make dev-backend     Run FastAPI on $(BACKEND_HOST):$(BACKEND_PORT)\n"
	@printf "  make dev-frontend    Run Vite on $(FRONTEND_HOST):$(FRONTEND_PORT)\n"
	@printf "  make test            Run backend and frontend tests\n"
	@printf "  make test-backend    Run pytest in backend/\n"
	@printf "  make test-frontend   Run vitest in frontend/\n"

install: install-backend install-frontend
	@test -f $(BACKEND_DIR)/.env || cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env
	@test -f $(FRONTEND_DIR)/.env || cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env

install-backend:
	$(PYTHON) -m venv $(BACKEND_VENV)
	$(BACKEND_PIP) install -r $(BACKEND_DIR)/requirements.txt

install-frontend:
	$(NPM) --prefix $(FRONTEND_DIR) install

dev:
	BACKEND_PORT=$(BACKEND_PORT) FRONTEND_PORT=$(FRONTEND_PORT) FRONTEND_API_URL=$(FRONTEND_API_URL) ./scripts/dev.sh

dev-backend:
	cd $(BACKEND_DIR) && .venv/bin/uvicorn app.main:app --reload --host $(BACKEND_HOST) --port $(BACKEND_PORT)

dev-frontend:
	cd $(FRONTEND_DIR) && VITE_API_URL=$(FRONTEND_API_URL) $(NPM) run dev -- --host $(FRONTEND_HOST) --port $(FRONTEND_PORT)

test: test-backend test-frontend

test-backend:
	cd $(BACKEND_DIR) && .venv/bin/pytest -v

test-frontend:
	$(NPM) --prefix $(FRONTEND_DIR) test
