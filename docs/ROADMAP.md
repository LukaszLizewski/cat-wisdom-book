# Roadmap — Cat's Book of Wisdom

## MVP (this certification submission)
- Profile management: create profile, login with PIN, change PIN
- Wisdom library: browse, view details, system + own wisdom
- CRUD on own wisdom entries
- Home page with random "Wisdom of the moment"
- Full-text search
- Semantic search (local embeddings, cosine similarity)
- Seed data: 100 Polish cat aphorisms
- Single Docker container, docker-compose, external volumes for data
  and model
- 1 E2E test (certification scenario) + backend unit/integration tests
- GitHub Actions CI: build + test (backend, frontend, E2E)

## Phase 2 — Personalization
- Favorites (mark/unmark wisdom, filter by favorites)
- Categories (structured tagging + browse-by-category UI)
- "Wisdom of the Day" (deterministic daily pick instead of pure random)
- Basic usage statistics (most viewed/favorited)

## Phase 3 — Engagement / Games
- Hangman using wisdom words
- "Guess the missing word" mini-game
- Wisdom quiz mode

## Phase 4 — Local AI expansion
- "Ask the Cat" — local RAG over the wisdom collection
- Local LLM support (still no paid/cloud services) for conversational
  discovery on top of the existing embedding index

## Guiding principle
If a feature doesn't help a user find, save, or discover wisdom, it
doesn't belong in the current phase — push it later or drop it.
