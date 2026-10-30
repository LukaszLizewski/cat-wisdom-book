# 🐾 Cat's Book of Wisdom

A fully-local, single-container web app for saving, browsing, and
semantically searching cat aphorisms. Built as a 10xDevs certification
project — see `docs/PRD.md` for the product spec and `docs/ARCHITECTURE.md`
for technical design decisions.

- **Frontend**: React + TypeScript + Vite (`frontend/`)
- **Backend**: Node.js + Express, `better-sqlite3` for SQLite (`backend/`)
- **Semantic search**: local ONNX embeddings (all-MiniLM-L6-v2) via
  `@xenova/transformers` (transformers.js, WASM ONNX runtime — no native
  build step), with a deterministic hashing fallback when no model is
  installed
- **E2E tests**: Playwright (`e2e/`)

## Quick start (Docker, recommended)

```bash
docker compose up --build
```

Then open http://localhost:8080. Data persists in `./data` (SQLite file)
and `./models` (ONNX model files) via bind mounts.

**First-time setup on Linux/macOS:** the container runs as a non-root
user (`appuser`, uid 999) for security, so make sure the mounted folders
are writable by it before the first run:

```bash
mkdir -p data models
chmod 777 data models
```

**Behind a corporate TLS-inspecting proxy:** if `docker compose up --build`
fails during the npm dependency download step with an error like
`certificate_unknown` / `unable to find valid certification path`, your
network is intercepting HTTPS traffic from Docker containers with an
internal CA. Export your organization's root CA certificate and place it
(as a `.crt` file) in `docker/certs/` before building — the Dockerfile
will automatically trust it in both the frontend and backend npm install
stages. This folder is gitignored; nothing you place there is ever
committed.

By default there is no ONNX model installed, so semantic search uses a
low-quality fallback embedder (full-text search is unaffected). To enable
real semantic search:

```bash
./scripts/download-model.sh
docker compose up --build
```

## Local development (without Docker)

Backend:
```bash
cd backend
npm install
npm start
```

Frontend (separate terminal, proxies `/api` to `localhost:8080`):
```bash
cd frontend
npm install
npm run dev
```

## Running tests

```bash
# Backend unit tests
cd backend && npm test

# Frontend build/lint
cd frontend && npm run build && npm run lint

# End-to-end certification scenario (requires the app running on :8080)
cd e2e && npm install && npx playwright install --with-deps chromium
npx playwright test
```

## Project structure

```
backend/    Express API + embedded better-sqlite3 persistence
frontend/   React SPA (built into backend's public/ dir for the
            production Docker image)
e2e/        Playwright end-to-end tests
scripts/    Utility scripts (e.g. ONNX model export)
docs/       PRD, architecture, test plan, roadmap
data/       (gitignored) runtime SQLite database
models/     (gitignored) runtime ONNX model files
```

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical architecture and rationale
- [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) — test strategy
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — scope and future work
