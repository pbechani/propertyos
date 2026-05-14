# Tasks: Listings Page Anonymous Mode Padding Alignment

**Input**: Design documents from `specs/001-listings-anon-padding/`
**Feature**: `001-listings-anon-padding`
**Branch**: `feature/sprint-03-kickoff`
**Date**: 2026-04-14
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

**Total tasks**: 13 | **User stories**: 1 | **Files changed**: 2 (1 edit, 1 new)
**MVP scope**: All tasks (single user story — this IS the MVP)

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files or non-overlapping lines)
- **[US1]**: Belongs to User Story 1 (the only story)
- Setup / Polish phases have no story label
- Exact file paths included in every task description

---

## Phase 1: Baseline Verification

**Purpose**: Confirm the test suite is green before making any changes, so regressions are immediately detectable.

- [X] T001 Run `npm run test --workspace=apps/web` and confirm all existing tests pass — no file changes
  > **Result**: 2 pre-existing failing suites (unrelated to this feature): `auth-session.test.ts` (1 failure) and `OpenHouses.test.tsx` (6 failures). Baseline recorded — these must remain unchanged after implementation.

**Checkpoint**: Baseline confirmed. Implementation and test authoring can now begin.

---

## Phase 2: Foundational

> **Nothing required.** No new packages, no new imports, no configuration changes. `getAccessToken` is already imported at line 12 of `Listings.tsx`. Tailwind classes (`container`, `mx-auto`, `px-6`, `lg:px-12`) already exist in the project. Proceed directly to Phase 3.

---

## Phase 3: User Story 1 — Anonymous Visitor Sees Full-Width Aligned Layout (Priority: P1) 🎯 MVP

**Goal**: An unauthenticated visitor to `/listings` sees horizontal padding that
visually matches the "Built for everyone in the deal" section on the homepage.
Authenticated users are unaffected.

**Independent Test**: Open `/listings` in an incognito window at 1440 px desktop width.
The left edge of the "Forest Command Zone" search bar must be flush with the left edge
of the homepage role-selector cards. Use browser DevTools ruler or `getBoundingClientRect()`.

### Tests for User Story 1

> Tests are required — see Constitution Check Gate IV in plan.md. Write all three tests
> before implementation (TDD). They must FAIL until Phase 3 implementation tasks run.

- [X] T002 [US1] Create `apps/web/src/__tests__/Listings.anon-padding.test.tsx` and write test: mock `getAccessToken` (from `@/lib/auth-session`) to return `''`; render `<Listings />`; assert the Forest Command Zone wrapper has class `container mx-auto px-6 lg:px-12 pt-8` (validates that `useState(true)` default produces the observable anonymous state — SSR-safe; no timing dependency on `useEffect`)
- [X] T003 [US1] Add test in `apps/web/src/__tests__/Listings.anon-padding.test.tsx`: anonymous mode renders Forest Command Zone wrapper with class `container mx-auto px-6 lg:px-12 pt-8`; use `asFragment()` snapshot to assert no other class or style attribute differs from the baseline (enforces FR-005 negative constraint — nothing else changed)
- [X] T004 [US1] Add test in `apps/web/src/__tests__/Listings.anon-padding.test.tsx`: authenticated mode (mock `getAccessToken` returning a non-empty token string) renders Forest Command Zone wrapper with class `px-4 md:px-8 pt-8`; use `asFragment()` snapshot to assert the component is pixel-identical to the pre-change baseline (enforces SC-003)

### Implementation for User Story 1

> Complete T005 and T006 in order (T006 references the state added in T005).
> T007, T008, T009 all reference `isAnonymous` and can be applied simultaneously
> since they touch non-overlapping lines in the file.

- [X] T005 [US1] Add `const [isAnonymous, setIsAnonymous] = useState(true)` state declaration near line 685 in `apps/web/src/views/Listings.tsx` (after the `currentCompanyId` state line)
- [X] T006 [US1] Add `setIsAnonymous(!getAccessToken())` inside the existing auth `useEffect` at line ~1097 in `apps/web/src/views/Listings.tsx` (after `setCurrentCompanyId(...)`)
- [X] T007 [P] [US1] Replace Forest Command Zone `className="px-4 md:px-8 pt-8"` with conditional expression in `apps/web/src/views/Listings.tsx` (locate via `grep -n 'background.*1A3C28'`; ~line 1977)
  - Anonymous: `"container mx-auto px-6 lg:px-12 pt-8"`
  - Authenticated: `"px-4 md:px-8 pt-8"`
- [X] T008 [P] [US1] Replace Results Header horizontal padding classes in `apps/web/src/views/Listings.tsx` with `isAnonymous` conditional (locate via `grep -n 'bg-card border-b border-border'`; ~line 3092)
  - Anonymous: `px-6 lg:px-12`
  - Authenticated: `px-4 md:px-6`
- [X] T009 [P] [US1] Replace Results area wrapper `p-4 md:p-6` in `apps/web/src/views/Listings.tsx` with `isAnonymous` conditional (locate via `grep -n 'flex-1 overflow-auto'`; ~line 3253)
  - Anonymous: `px-6 lg:px-12 py-4 md:py-6`
  - Authenticated: `p-4 md:p-6`

**Checkpoint**: User Story 1 is fully implemented. Tests T002–T004 should now PASS.
Visual inspection of `/listings` (incognito) shows aligned padding at all viewports.

---

## Phase 4: Polish & Validation

**Purpose**: Type-safety confirmation, full test suite green, and manual sign-off.

- [X] T010 [P] Run `npx tsc --noEmit -p apps/web/tsconfig.json` (full output — no pipe truncation) and fix any TypeScript errors before proceeding
  > **Result**: 8 pre-existing errors in conveyancer pages and HomeNavbar (unrelated). Listings.tsx and test file: 0 errors.
- [X] T011 Run `npm run test --workspace=apps/web` and confirm all tests pass, including the three new tests in `apps/web/src/__tests__/Listings.anon-padding.test.tsx`
  > **Result**: 136 passing, 7 failing (same 2 pre-existing suites: auth-session.test.ts + OpenHouses.test.tsx). 3 new tests all PASS.
- [ ] T012 [P] Perform manual visual verification per steps 1–3 in `specs/001-listings-anon-padding/quickstart.md`: anonymous view, authenticated view, results-cards alignment check
- [X] T013 [P] Update `CHANGELOG.md` under `### Changed` (create the section if absent) with: *"Anonymous listings page (/listings) now uses homepage-aligned horizontal padding (container mx-auto px-6 lg:px-12)"*

**Checkpoint**: All 13 tasks complete. Feature ready for PR.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Baseline)  ──► Phase 3 (US1 Tests first, then Implementation)  ──► Phase 4 (Polish)
Phase 2 (Foundational)  ──► skipped, no work required
```

### Within Phase 3

```
T002  ──► T003  ──► T004       (tests, sequential — same new file)
                               │
T005  ──► T006                 │  (implementation — T006 depends on T005)
          │
          ├──► T007 ──┐
          ├──► T008 ──┤ (parallel after T006 — different line ranges)
          └──► T009 ──┘
```

### Tests ↔ Implementation Order

```
Write T002 → T003 → T004 (tests FAIL)
Run T005 → T006 → T007 → T008 → T009 (implementation)
Rerun tests (T002 → T004 now PASS)
```

---

## Parallel Opportunities

### Phase 3: US1 Implementation (after T005 + T006)

Three JSX touch points can be applied simultaneously since they are at non-overlapping
line ranges (~1977, ~3092, ~3253) in `Listings.tsx`:

| Task | Touch Point | Line | Dependency |
|------|------------|------|-----------|
| T007 | Forest Command Zone | ~1977 | T006 ✅ |
| T008 | Results Header | ~3092 | T006 ✅ |
| T009 | Results area wrapper | ~3253 | T006 ✅ |

### Phase 4: Polish

T010 (tsc) and T012 (manual verification) can run in parallel.
T011 (test suite) runs after T010 (fix type errors first).

---

## Implementation Strategy

> **This is a single-user-story feature. All tasks together constitute the MVP.**

1. **Baseline first** (T001) — know the starting state before touching any file
2. **Tests before code** (T002–T004) — three failing tests document exactly what success looks like
3. **State then effect then JSX** (T005 → T006 → T007/T008/T009) — follow the data flow; a state variable must exist before it can be read
4. **Validate end-to-end** (T010–T013) — TypeScript, automated tests, human eyes, and CHANGELOG in that order

---

## Definition of Done

See [plan.md — Definition of Done](./plan.md) for the authoritative checklist (includes CHANGELOG gate).
