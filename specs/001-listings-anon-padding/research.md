# Research: Listings Page Anonymous Mode Padding Alignment

**Feature**: 001-listings-anon-padding  
**Date**: 2026-04-14  
**Status**: Complete — all unknowns resolved during specification and clarification

---

## Research Tasks

All technical questions were resolved during the clarification session
(see `specs/001-listings-anon-padding/spec.md` → Clarifications).
No external research was required.

---

## Decision Log

### Decision 1 — Auth state detection pattern (SSR safety)

**Decision**: Use `useState(true)` (anonymous as default) + `useEffect` to detect real auth state via `getAccessToken()`.

**Rationale**:
- `Listings.tsx` is a `'use client'` component but Next.js 14 still server-renders it.
  `localStorage` is unavailable during SSR. Calling `getAccessToken()` inline in JSX
  would produce different output on server vs client → React hydration mismatch error.
- Defaulting to `isAnonymous = true` means the server-rendered HTML and the initial
  client paint both use the anonymous (wider) padding — no layout shift for the 
  overwhelming majority of visitors to `/listings` who are not logged in.
- The authenticated narrow padding (`px-4 md:px-8`) is applied after the first
  `useEffect` fires in the browser for signed-in users — a sub-50 ms transition
  invisible in normal usage.

**Alternatives considered**:
- `useState(false)` (authenticated default) — rejected: would flash narrow padding for
  anonymous visitors before switching, a visible layout shift.
- `suppressHydrationWarning` + inline call — rejected: leaks React console warnings and
  couples layout to a runtime hazard.
- Route-level split (separate component per route) — rejected: violates FR-002's
  requirement that the fix lives inside the `Listings` component, not at the page level.
  Also rejected by Constitution Principle VIII (no new components without ≥2 uses).

**Precedent in codebase**: The existing `useEffect` at line ~1097 of `Listings.tsx`
already follows this exact pattern for `currentUserId` and `currentCompanyId`.

---

### Decision 2 — Scope of padding change (search bar only vs full page)

**Decision**: Both the Forest Command Zone (dark search bar, line ~1977) and the
results area (Results Header ~3092, results wrapper ~3253) receive updated horizontal
padding in anonymous mode.

**Rationale**:
- User Story 1 in the spec explicitly states "the Forest Command Zone search bar
  **and all listing cards below it**" should align.
- Applying the new padding only to the dark bar while the results cards remain 
  narrower would create a visible horizontal misalignment — the bar would be wider
  than the cards it leads into.
- Full-page consistency matches the homepage's approach: the "Built for everyone in
  the deal" section uses a single `container mx-auto` wrapper that governs all
  content within it, not just the first visible element.

**Alternatives considered**:
- Search bar only — rejected: creates visible padding inconsistency between the dark
  header and the white results area below.
- Wrapping the entire `<div className="bg-[#F2E8D5] min-h-screen">` in a container —
  rejected: would require restructuring ~3,700 lines of JSX and risks unknown side
  effects on inner absolutely-positioned elements.

---

### Decision 3 — `container mx-auto` on Forest Command Zone vs inner content wrapper

**Decision**: Apply `container mx-auto px-6 lg:px-12` directly to the existing
Forest Command Zone div (the one with `style={{ background: '#1A3C28' }}`).

**Rationale**:
- The spec FR-002 is explicit: "the outermost horizontal padding... MUST match
  `container mx-auto px-6 lg:px-12`" — these are the exact classes to apply.
- This constrains the dark-green band to the Tailwind container max-width in
  anonymous mode, producing the same framed, editorially-contained look as the
  homepage section. This is the intended brand-consistency effect.
- Adding an inner wrapper div to keep the background full-width while only
  constraining content would (a) require a new DOM element (complexity) and
  (b) not match what FR-002 specifies (the spec targets the outermost container,
  not an inner child).

**Trade-off documented**: The dark band is no longer edge-to-edge for anonymous
visitors. This is accepted per spec — the public marketing experience is intentionally
framed. Authenticated users are unaffected (FR-003).

---

### Decision 4 — Results area: `container mx-auto` vs `px-6 lg:px-12` only

**Decision**: The results wrapper (`flex-1 overflow-auto`) and Results Header use
`px-6 lg:px-12` for horizontal padding — NOT `container mx-auto`.

**Rationale**:
- The results wrapper is a flex child. `mx-auto` on a flex child in a flex container
  has no centering effect (the parent `display: flex` overrides it).
- `container` adds `max-width` at breakpoints, which would clip the results section
  differently from the Forest Command Zone container above — visual mismatch.
- `px-6 lg:px-12` alone produces the correct horizontal inset, aligning the cards'
  left and right edges with the search bar content.

---

### Decision 5 — No new Tailwind classes

**Decision**: All classes used (`container`, `mx-auto`, `px-6`, `lg:px-12`) already
exist in `apps/web/src/views/PublicHome.tsx` at line 730. No new design tokens or
custom CSS needed.

**Rationale**: Satisfies SC-004 and Constitution Principle VIII (no style token duplication).

---

## Summary Table

| Question | Answer | Spec Section Updated |
|---|---|---|
| SSR/hydration default state | `useState(true)` (anonymous), set in `useEffect` | FR-001, Assumptions |
| Scope of padding change | Full page — search bar + results area | FR-005 → FR-006 added |
| Apply `container mx-auto` to Forest Command Zone? | Yes — constrains dark band in anon mode | FR-002, plan.md design |
| Results area: use `container mx-auto`? | No — use `px-6 lg:px-12` only (flex child) | plan.md Padding Class Map |
| New Tailwind classes needed? | No — all classes from `PublicHome.tsx` | SC-004 |
