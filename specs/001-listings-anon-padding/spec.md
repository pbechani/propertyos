# Feature Specification: Listings Page Anonymous Mode Padding Alignment

**Feature Branch**: `001-listings-anon-padding`
**Created**: 2026-04-13
**Status**: Draft
**Input**: User description: "Modify the listings page when displayed in anonymous mode. It should have the same padding left and right as the 'Built for everyone in the deal' section on the homepage."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Anonymous Visitor Sees Full-Width Aligned Layout (Priority: P1)

A visitor who is not logged in navigates to `/listings`. The listings page content
(the "Forest Command Zone" search bar and all listing cards below it) should be
horizontally centred and inset with the same left/right padding as the role-selector
section on the homepage — giving the page visual consistency with the rest of the
public marketing experience.

**Why this priority**: This is the only requirement. It establishes brand consistency
for the unauthenticated public experience, where first impressions matter most.

**Independent Test**: Open `/listings` in an incognito browser window (no auth
cookie). Measure the left padding of the search bar container at desktop width
and compare it to the left padding of the "Built for everyone in the deal" section
at the same viewport. They must be equal.

**Acceptance Scenarios**:

1. **Given** a visitor is not logged in, **When** they visit `/listings`,
   **Then** the outermost content container of the listings page uses
   `container mx-auto px-6 lg:px-12` (matching the homepage role-selector section),
   producing equal left/right margins that grow with viewport width.

2. **Given** a logged-in user visits `/listings` or `/app/listings`,
   **When** the page renders,
   **Then** the existing `px-4 md:px-8` padding is unchanged — the authenticated
   experience is not affected.

3. **Given** an anonymous visitor on a mobile viewport (< 768 px),
   **When** they view the listings page,
   **Then** the horizontal padding matches the mobile value used by the homepage
   role-selector section (`px-6`).

---

### Edge Cases

- What happens when `localStorage` is cleared mid-session so the auth token
  disappears? The `useEffect` that reads `getAccessToken()` has no dependency
  array, so it fires only once on mount. Mid-session token loss will **not**
  automatically re-apply anonymous padding — this is an accepted limitation.
  A full page reload will correctly restore the anonymous state.
- What if the viewport is between `md` and `lg` breakpoints? The homepage
  section applies `px-6` at all sizes below `lg`, so the listings page should
  do the same.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The listings page MUST track auth state via a `useState` hook
  initialised to anonymous (`true`), then detect the real auth state inside a
  `useEffect` by calling `getAccessToken()`. This avoids Next.js SSR/hydration
  mismatches (localStorage is unavailable on the server).
- **FR-002**: When the visitor is anonymous (no valid access token), the outermost
  horizontal padding of the entire page content area MUST match
  `container mx-auto px-6 lg:px-12` — the same Tailwind classes used on the
  "Built for everyone in the deal" section in `PublicHome.tsx`.
- **FR-003**: When the visitor is authenticated, the existing outer padding
  (`px-4 md:px-8`) MUST be preserved without change.
- **FR-004**: The auth-state detection MUST reuse the existing `getAccessToken()`
  helper from `@/lib/auth-session` — no new auth utilities may be introduced.
- **FR-005**: No visual change other than the horizontal padding values on the
  outermost container and the results area is permitted; all inner layout, colours,
  typography, and components remain identical.
- **FR-006**: When the visitor is anonymous, the results section wrapper
  (`<div className="flex-1 overflow-auto p-4 md:p-6">`) and Results Header
  container (`<div className="... px-4 md:px-6 py-4">`) MUST also adopt
  `px-6 lg:px-12` horizontal padding, so the listing cards align with the
  search bar edge across all viewport sizes.

### Key Entities

- **Anonymous visitor**: A browser session in which `getAccessToken()` returns
  `null` or an empty string.
- **Authenticated user**: A browser session in which `getAccessToken()` returns
  a non-empty JWT string.
- **Outer container**: The single `<div>` with `className="px-4 md:px-8 pt-8"`
  and `style={{ background: '#1A3C28', ... }}` at line 1977 of `Listings.tsx`.
- **Results area**: The results wrapper (`flex-1 overflow-auto p-4 md:p-6`) and
  Results Header (`bg-card border-b border-border px-4 md:px-6 py-4`) at lines
  ~3253 and ~3092 respectively — both receive updated horizontal padding in
  anonymous mode.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At a 1440 px desktop viewport, the left edge of the listings
  search bar in anonymous mode is visually flush with the left edge of the role
  cards on the homepage — measurable via browser DevTools ruler or Playwright
  `getBoundingClientRect()` comparison. Acceptable tolerance: identical Tailwind
  class string applied → identical computed value; no numeric pixel delta required.
- **SC-002**: The change introduces zero regressions: all existing unit and
  integration tests pass without modification.
- **SC-003**: The authenticated listings experience (`/app/listings`) is pixel-
  identical to before the change — verified by a snapshot or visual comparison test.
- **SC-004**: The implementation adds no new CSS classes or style tokens beyond
  those already present in the `PublicHome.tsx` role-selector container (`container`,
  `mx-auto`, `px-6`, `lg:px-12`) and the existing Tailwind config.

---

## Assumptions

- The "Built for everyone in the deal" section's container (`container mx-auto px-6 lg:px-12`)
  is the canonical padding reference. Any future change to that section's padding
  must be mirrored in the listings anonymous container as a separate task.
- `getAccessToken()` is called exclusively inside a `useEffect` (not inline in JSX),
  matching the existing auth-detection pattern already used at lines ~1097–1269 of
  `Listings.tsx`. The initial server-render always uses the anonymous padding class,
  preventing React hydration mismatches.
- Both `/listings` (public route) and `/app/listings` (authenticated route) render
  the same `Listings` view component. The fix MUST be applied inside the component
  itself using an auth check, not at the page/route level.
- No design-token or theming system changes are required; Tailwind utility classes
  are sufficient.

---

## Clarifications

### Session 2026-04-13

- Q: Does the padding alignment apply to only the dark search bar (Forest Command Zone, line 1977) or also to the results/cards area below it? → A: Both — full-page padding consistency (Option B). FR-006 added; results wrapper and Results Header also adopt `px-6 lg:px-12` horizontal padding in anonymous mode.
- Q: Which padding should be the server-rendered (initial) default given `getAccessToken()` cannot read localStorage during SSR? → A: Anonymous as default (Option A). FR-001 updated; `useState` initialises to anonymous, auth detected in `useEffect` — consistent with existing auth patterns in the component.
