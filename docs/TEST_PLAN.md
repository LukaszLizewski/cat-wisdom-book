# Test Plan — Cat's Book of Wisdom

## 1. Scope
Cover the certification-mandated flow end-to-end, plus targeted unit
tests for the two pieces of real domain logic: access control (PIN
hashing/session) and semantic search (embedding similarity ranking).
This is a small hobby project — the plan intentionally stays lean.

## 2. Test Levels

### 2.1 Backend Unit Tests (JUnit 5 + Mockito)
- `AuthServiceTest`
  - creating a profile hashes the PIN (never stores plaintext)
  - login succeeds with correct PIN, fails with wrong PIN
  - login fails for unknown profile name
  - changing PIN invalidates the old PIN
- `WisdomServiceTest`
  - a user can create/update/delete only their own wisdom
  - a user cannot edit/delete another user's or system wisdom
  - system wisdom (owner_id = null) is visible to all users
- `SemanticSearchServiceTest`
  - cosine similarity ranks a semantically related quote above an
    unrelated one for a fixed pair of stub embedding vectors
    (deterministic vectors, no real model load, to keep the test fast
    and hermetic)
  - empty query / no wisdom returns an empty result, not an error

### 2.2 Backend Integration Tests (Node's built-in `node:test` + tmp SQLite file)
- Wisdom routes: create → list → get → update → delete via HTTP,
  asserting ownership rules and status codes (200/201/403/404).
- Auth routes: create profile → login → use bearer token on a
  protected endpoint → reject requests with missing/invalid token
  (401).

**Visibility status code convention** (covered explicitly by tests):
wisdom that is invisible to the requester (private, owned by someone
else) returns **404 Not Found** on GET/PUT/DELETE, never 403 — this
avoids leaking the existence of another user's private data. **403
Forbidden** is reserved for wisdom that *is* visible to the requester
(e.g. system wisdom with `owner_id = null`) but not owned by them, so
an edit/delete attempt is explicitly denied rather than hidden.

### 2.3 End-to-End Test (Playwright, required by certification)
One scenario, matching the certification test exactly:
1. Create Profile ("Aneta", PIN "1234")
2. Login with Profile + PIN
3. Create a new Wisdom entry ("Test wisdom ...")
4. Save it
5. Open the Wisdom list
6. Assert the created wisdom is visible in the list

Runs against the built app (docker-compose or `vite dev` + backend)
in CI headless Chromium.

## 3. Out of Scope for MVP
Load/performance testing, accessibility audit, cross-browser matrix,
visual regression — not required by the certification and would over-
invest relative to project size.

## 4. Definition of Done for Testing
- `mvn test` passes (unit + integration) in CI.
- `npx playwright test` passes the certification scenario in CI.
- CI pipeline fails the build if either suite fails.
