# Quickstart: Verifying the Anonymous Padding Change

**Feature**: 001-listings-anon-padding  
**Date**: 2026-04-14

---

## Prerequisites

```bash
# From repo root
docker-compose up -d          # Postgres + API
npm run dev --workspace=apps/web
# Web app available at http://localhost:3000
```

---

## Visual Verification

### 1 — Anonymous View (primary change)

1. Open a private/incognito browser window (clears any stored auth token).
2. Navigate to `http://localhost:3000/listings`.
3. Open DevTools → Elements, select the dark-green Forest Command Zone wrapper.
4. Confirm it has class `container mx-auto px-6 lg:px-12 pt-8`.
5. At a 1440 px viewport, measure the left inset (DevTools ruler or
   `getBoundingClientRect().left`) — it should equal the left inset of the
   "Built for everyone in the deal" section on `http://localhost:3000`.

### 2 — Authenticated View (must be unchanged)

1. Log in and navigate to `http://localhost:3000/app/listings`.
2. Select the same Forest Command Zone wrapper.
3. Confirm it still has class `px-4 md:px-8 pt-8` — no container, no `mx-auto`.

### 3 — Results Area Alignment Check

1. In the anonymous (incognito) view, trigger a search (enter a location, click Search).
2. Confirm the results cards' left edge aligns with the search bar content's left edge.
3. In DevTools, select the Results Header and confirm `px-6 lg:px-12` is present.

---

## Automated Tests

```bash
# Run only the new feature tests
npm run test --workspace=apps/web -- --testPathPattern="Listings.anon-padding"

# Run the full web test suite (must all pass)
npm run test --workspace=apps/web

# TypeScript check (no pipe truncation)
npx tsc --noEmit -p apps/web/tsconfig.json
```

### Expected test output

```
PASS  src/__tests__/Listings.anon-padding.test.tsx
  Listings anonymous padding
    ✓ renders container mx-auto px-6 lg:px-12 for anonymous visitors (default state)
    ✓ renders px-4 md:px-8 for authenticated visitors (after useEffect)
    ✓ isAnonymous state defaults to true before useEffect fires
```

---

## Rollback

The change is a single-file edit in `apps/web/src/views/Listings.tsx`.
To revert:

```bash
git diff apps/web/src/views/Listings.tsx   # review the delta
git checkout apps/web/src/views/Listings.tsx  # revert to prior version
```

No database migrations, no environment variable changes, no dependency additions —
rollback is instant and safe.
