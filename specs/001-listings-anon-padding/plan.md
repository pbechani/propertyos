# Implementation Plan: Listings Page Anonymous Mode Padding Alignment

**Branch**: `feature/sprint-03-kickoff` | **Date**: 2026-04-14 | **Spec**: [specs/001-listings-anon-padding/spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-listings-anon-padding/spec.md`

## Summary

When an unauthenticated visitor opens `/listings`, the page should feel as refined and
spacious as the homepage's marketing sections. Currently the search bar and results grid
use narrow `px-4 md:px-8` padding — too tight for the public-facing brand experience. The
fix adds a single `isAnonymous` boolean state (defaulting to `true` for SSR safety), sets
it in the existing auth `useEffect`, and conditionally applies `container mx-auto px-6 lg:px-12`
to the Forest Command Zone and matching horizontal padding to the results area. No new
components, no new imports, no DB changes — ~12 lines of diff.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 14.2 (App Router)  
**Primary Dependencies**: React 18, Tailwind CSS v3, `@/lib/auth-session` (existing)  
**Storage**: N/A — no database changes  
**Testing**: Jest + React Testing Library (`apps/web`)  
**Target Platform**: Web — server-rendered then client-hydrated (`'use client'`)  
**Project Type**: web-app (UI-only change in a single view component)  
**Performance Goals**: Zero CLS / hydration mismatch; anonymous padding visible on first paint after `useEffect` (< 50 ms on fast connections)  
**Constraints**: SSR-safe — no `localStorage` access in JSX or at module scope; no new imports; no new Tailwind classes beyond those in `PublicHome.tsx`  
**Scale/Scope**: 1 file changed (`apps/web/src/views/Listings.tsx`), ~3,700-line component, ≤ 15-line diff

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Security by Design** — No secrets, no queries, no file uploads, no new auth paths. `getAccessToken()` is already in use. ✅ N/A
- [x] **II. Trust & Auditability** — No financial, KYC, or stage-transition data touched. ✅ N/A
- [x] **III. Modular Domain Isolation** — Pure UI change within `apps/web/src/views/`. No schema or cross-module call introduced. ✅
- [x] **IV. Test-Driven Quality** — Tests required: (a) snapshot: anonymous renders `container mx-auto px-6 lg:px-12`; (b) snapshot: authenticated renders `px-4 md:px-8`; (c) state default is `true` (anonymous) before `useEffect` fires. Existing tests must pass without modification.
- [x] **V. Offline-First Mobile** — Mobile not in scope for this change. ✅ N/A
- [x] **VI. Financial-Grade Reliability** — No financial data touched. ✅ N/A
- [x] **VII. Simplicity & Phased Extraction** — No new service, no new file, no new abstraction. Single conditional expression in existing JSX. ✅
- [x] **VIII. Component & Style Reuse** — No new component created. Searched `packages/ui/` and `apps/web/src/components/ui/` — no relevant padding wrapper exists. Reusing existing `getAccessToken()` and existing Tailwind classes (`container`, `mx-auto`, `px-6`, `lg:px-12`) already present in `PublicHome.tsx`. ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-listings-anon-padding/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/web/
└── src/
    └── views/
        └── Listings.tsx         ← ONLY file modified
            # Change 1: add isAnonymous state declaration (near line 685)
            # Change 2: set isAnonymous in existing auth useEffect (line ~1097)
            # Change 3: conditional class on Forest Command Zone div (line ~1977)
            # Change 4: conditional class on results wrapper (line ~3253)
            # Change 5: conditional class on Results Header (line ~3092)

    └── __tests__/
        └── Listings.anon-padding.test.tsx   ← NEW test file
```

**Structure Decision**: Single-file edit in the existing `apps/web` workspace. No new packages, no new components, no new directories beyond the test file.

## Complexity Tracking

No constitution violations. No entries required.

---

## Phase 0: Research

> All NEEDS CLARIFICATION items resolved. No external research required.

See [research.md](./research.md) for decision log.

---

## Phase 1: Design

### State Model

One new boolean state variable added to `Listings.tsx`:

```ts
// Defaults to true (anonymous) so the server render and initial client paint
// both use the anonymous padding — avoids React hydration mismatch.
const [isAnonymous, setIsAnonymous] = useState(true);
```

Set inside the existing auth `useEffect` (line ~1097) alongside the current
`setCurrentUserId` / `setCurrentCompanyId` calls:

```ts
useEffect(() => {
  const user = getStoredUser();
  setCurrentUserId(user?.id ?? null);
  setCurrentCompanyId(getActiveCompanyIdFromToken());
  setIsAnonymous(!getAccessToken());   // ← new line only
  // ... rest of effect unchanged (salesApi.getMySales)
}, []);
```

No new imports. `getAccessToken` is already imported at line 12.

### Design Decision — `container mx-auto` on the Forest Command Zone

The dark-green Forest Command Zone wrapper (`style={{ background: '#1A3C28' }}`)
currently spans the full viewport width. Applying `container mx-auto` to it in
anonymous mode constrains the dark band to the Tailwind container max-width,
matching how the homepage "Built for everyone in the deal" section works
(full-width section background, max-width content container inside).

**Trade-off accepted**: The dark band is no longer edge-to-edge for anonymous
visitors. This is intentional per spec — the public marketing experience should
feel contained and editorially framed, not browser-edge-to-edge raw. The
authenticated experience is unchanged (FR-003).

### Frontend Design Rationale (frontend-design skill)

- **Purpose**: Establish brand consistency between the unauthenticated public
  listings page and the homepage marketing sections.
- **Aesthetic direction**: Refined / luxury — contained, editorially framed
  layout with generous lateral breathing room at wider viewports. The `lg:px-12`
  value (~48px) creates a premium horizontal gutter that matches the homepage.
- **Key differentiation**: The `container` utility adds a responsive max-width
  breakpoint system (`max-w-sm` → `max-w-7xl`) ensuring the layout never
  stretches uncomfortably at ultra-wide viewports (2560px+).
- **Micro-detail**: At mobile (`px-6` = 24px), the content still has more
  breathing room than the current `px-4` (16px), subtly elevating the mobile
  first impression.

### Padding Class Map

| Element | Authenticated | Anonymous |
|---------|---------------|-----------|
| Forest Command Zone wrapper (line ~1977) | `px-4 md:px-8 pt-8` | `container mx-auto px-6 lg:px-12 pt-8` |
| Results area wrapper (line ~3253) | `flex-1 overflow-auto p-4 md:p-6` | `flex-1 overflow-auto px-6 lg:px-12 py-4 md:py-6` |
| Results Header (line ~3092) | `px-4 md:px-6 py-4` | `px-6 lg:px-12 py-4` |

> Note: `container mx-auto` is NOT applied to the results wrapper (it lives in a
> flex child context where `mx-auto` would be overridden by flex layout). Only
> `px-6 lg:px-12` is needed there for horizontal alignment.

### JSX Diff (all three touch points)

```tsx
// Touch point 1 — Forest Command Zone (line ~1977)
<div
  className={isAnonymous
    ? "container mx-auto px-6 lg:px-12 pt-8"
    : "px-4 md:px-8 pt-8"}
  style={{ background: '#1A3C28', position: 'relative', overflow: 'visible' }}
>

// Touch point 2 — Results Header (line ~3092)
<div className={`bg-card border-b border-border ${isAnonymous ? 'px-6 lg:px-12' : 'px-4 md:px-6'} py-4`}>

// Touch point 3 — Results area wrapper (line ~3253)
<div className={`flex-1 overflow-auto ${isAnonymous ? 'px-6 lg:px-12 py-4 md:py-6' : 'p-4 md:p-6'}`}>
```

### Contracts

No external interface changes. The `Listings` component accepts no props and
this change does not alter its public API. No contract documents required.

---

## Phase 1 Constitution Re-check

All 8 gates remain ✅ after Phase 1 design:

- The new `isAnonymous` state follows the existing `useState` pattern; no new
  abstractions or services introduced (Gates VII, VIII).
- No cross-module calls (Gate III).
- Test stubs documented above map directly to the 3 required test cases (Gate IV).

---

## Definition of Done

- [ ] `isAnonymous` state added and set in existing `useEffect`
- [ ] All 3 JSX touch points updated with conditional class logic
- [ ] New test file `Listings.anon-padding.test.tsx` passes (3 test cases)
- [ ] `npx tsc --noEmit -p apps/web/tsconfig.json` exits 0 (no truncation)
- [ ] `npm run test --workspace=apps/web` — all existing tests pass
- [ ] Manual verification: incognito `/listings` at 1440px matches homepage padding
- [ ] Manual verification: logged-in `/app/listings` is pixel-identical to before
- [ ] `CHANGELOG.md` updated under `### Changed` with anonymous padding alignment entry
