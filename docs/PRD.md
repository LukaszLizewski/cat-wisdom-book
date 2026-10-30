# PRD — Cat's Book of Wisdom

## 1. Summary
A fully local web application for collecting, browsing and discovering
cat-themed aphorisms ("wisdom"). Users authenticate with a local
Profile + PIN. The app ships with a built-in (system) collection of
Polish cat wisdom and lets each user maintain their own private
collection. Its core differentiator is **semantic search**: users can
search wisdom by meaning, not just keywords, using a locally-run
embedding model (no paid/cloud AI services).

## 2. Goals
- Satisfy 10xDevs certification requirements (access control, CRUD,
  business logic, artifacts, test, CI/CD).
- Run entirely locally, no paid services, single Docker container.
- Small, achievable MVP; learn embeddings/semantic search practically.

## 3. Non-Goals (excluded from MVP)
Admin panel, user management/roles, password reset, email, cloud
hosting, Postgres/Redis, any hosted/generative LLM (GPT/Claude/Gemini/
Ollama), favorites, statistics, hangman/quiz games. See `ROADMAP.md`
for post-MVP phases.

## 4. Target User
A single person who enjoys short, funny/wise cat-themed quotes and
wants a private, offline pocket for their own quotes plus a built-in
seed collection. One user per profile; no admin, no multi-tenant
concerns beyond data isolation between profiles.

## 5. User Stories (MVP)
1. As a new user, I can create a Profile with a name and PIN.
2. As a returning user, I can log in with Profile + PIN.
3. As a user, I can change my PIN.
4. As a user, I can browse all wisdom I can see (system wisdom + my
   own wisdom).
5. As a user, I can view details of a single wisdom entry.
6. As a user, I can create, edit and delete my own wisdom entries
   (system wisdom is read-only for all users).
7. As a user, I land on a Home page showing a random "Wisdom of the
   moment" with a button to draw another one, browse the library, or
   search.
8. As a user, I can full-text search wisdom by keyword.
9. As a user, I can semantic-search wisdom by describing my situation
   in natural language (e.g. "I am tired of meetings today.") and receive the
   closest-matching wisdom by meaning (e.g. a quote about naps instead
   of meetings).

## 6. Data Model
**User**
- id, profile_name (unique), pin_hash (BCrypt), created_at

**Wisdom**
- id, text, author (nullable), category (nullable), owner_id
  (nullable — null = system wisdom, visible to everyone), embedding
  (float vector, stored as BLOB/JSON), created_at

**Session** (implementation detail, not user-facing)
- token, user_id, created_at, expires_at — simple opaque bearer token,
  no OAuth/JWT complexity needed for MVP.

## 7. Business Logic (the one sentence)
> The application recommends the wisdom entries whose text meaning is
> closest to a user's free-text query, by comparing embedding vectors
> with cosine similarity — no generative AI required.

## 8. Access Control
Profile + PIN is the entire auth mechanism. No password reset flow;
losing a PIN means creating a new profile or editing SQLite directly.
This is an intentional, documented MVP limitation.

## 9. API Surface (high level)
- `POST /api/profiles` — create profile
- `POST /api/auth/login` — login (profile_name + pin) → session token
- `POST /api/auth/change-pin` — change PIN (authenticated)
- `GET /api/wisdom` — list visible wisdom (system + own), supports
  `?q=` (full text) and pagination
- `GET /api/wisdom/{id}` — details
- `POST /api/wisdom` — create (owned by current user)
- `PUT /api/wisdom/{id}` — update (own wisdom only)
- `DELETE /api/wisdom/{id}` — delete (own wisdom only)
- `GET /api/wisdom/random` — one random wisdom
- `POST /api/search/semantic` — `{ query: string }` → ranked matches by
  cosine similarity

## 10. Success Criteria / Certification Scenario
Create Profile → Login → Create Wisdom → Save Wisdom → Open Wisdom
List → Verify Wisdom Exists. Automated as one Playwright E2E test.

## 11. Language Strategy
Code/schema/API/docs for AI: English. UI, validation messages, seed
data, categories: Polish.
