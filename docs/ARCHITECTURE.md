# Architecture — Cat's Book of Wisdom

## 1. Overview
```
React (Vite, TS)  --HTTP/JSON-->  Node.js (Express)
                                        |
                                        +-- SQLite (better-sqlite3)
                                        |
                                        +-- Embedding Service (@xenova/transformers,
                                        |     all-MiniLM-L6-v2, WASM ONNX runtime, in-process)
                                        |
                                        +-- Semantic Search Service (cosine similarity,
                                              brute-force over in-memory/DB vectors)
```
Single Node.js process serves the REST API and, in production, the
built React static assets — one container, one process.

## 2. Backend (Node.js + Express, plain JavaScript/ESM)
- **Web**: `express` (REST routes, no server-side rendering).
- **Persistence**: `better-sqlite3` (a mature, synchronous native SQLite
  driver with prebuilt binaries) with a hand-written idempotent schema
  bootstrap (`src/db.js`) instead of a migration framework — a small,
  fixed schema doesn't need one at this scale.
- **Auth**: `bcryptjs` (pure JavaScript, no native compile step) for PIN
  hashing; a custom opaque bearer session token stored in a `sessions`
  table, validated by a lightweight Express middleware
  (`src/middleware/auth.js`).
- **Embeddings**: `@xenova/transformers` (transformers.js), which runs
  ONNX models fully in-process via a WASM ONNX Runtime backend — no
  native library compilation or engine-selection issues. Loads a
  pre-converted ONNX export of `all-MiniLM-L6-v2` (384-dim) laid out in
  the standard transformers.js local-model directory structure. Model
  files are mounted from `./models` (not baked into the image), so they
  can be swapped without rebuilding.
- **Search**:
  - Full-text: SQLite `FTS5` virtual table (bundled with better-sqlite3)
    over `text`, `author`, `category`, kept in sync via triggers.
  - Semantic: embeddings cached in the `wisdom.embedding` BLOB column,
    loaded at query time (small dataset, ~hundreds of rows — brute-force
    cosine similarity is O(n) and fast enough; no vector DB needed for
    MVP).

## 3. Frontend (React + Vite + TypeScript)
- Pages: Login/Create Profile, Home, Library (browse + full-text +
  semantic search), Wisdom Detail/Create/Edit, Change PIN.
- State: React Query for server state, minimal local component state.
- All copy in English; API calls in English-named functions/DTOs.
- Bearer token stored in memory + `localStorage` for session
  persistence across reloads.

## 4. Deployment
- Multi-stage `Dockerfile`: stage 1 builds the React app (`npm run
  build`), stage 2 installs backend npm dependencies (including the
  native `better-sqlite3` module), stage 3 is a slim Node.js runtime
  image containing only the installed `node_modules`, backend source,
  and the built React `dist/` (copied in as static assets under
  `public/`).
- `docker-compose.yml` mounts `./data:/app/data` (SQLite file) and
  `./models:/app/models` (ONNX model files) as volumes, so data and
  model files persist and are swappable outside the image.
- Single command startup: `docker compose up`.

## 5. Why these choices (rejected alternatives)
- **Node.js/Express over Java/Spring Boot** (this project's original
  stack): a single language/toolchain (npm) for the entire app avoids
  the dual Maven+npm multi-stage Docker build that doubled corporate
  proxy CA-trust exposure, and `@xenova/transformers`'s WASM ONNX
  backend avoids the native-library engine-selection issues that DJL
  (the Java ONNX binding) had. The certification's stack requirement is
  fully open ("known, documented, won't waste time on setup"), so this
  swap keeps the same scope while reducing build friction.
- **transformers.js (WASM ONNX) in-process** over a Python sidecar:
  keeps the "single container, single process" goal simple and avoids
  inter-process networking/lifecycle management for an MVP.
- **better-sqlite3 (plain SQL) over an ORM**: a small, well-understood
  schema doesn't need one; `better-sqlite3`'s synchronous API also
  keeps the codebase simple (no async/await needed for DB calls).
- **Custom opaque token over JWT/OAuth**: no need for stateless
  scaling or third-party identity for a single-user-per-profile local
  app; a `sessions` table row is simpler to reason about and revoke.
