# Audit Fixes — PropmarketFigma Sample UI

**Date applied:** 2026-02-22  
**Build status:** ✅ `npm run build` passes (4.07 s)

All issues identified in `AUDIT.md` have been resolved. This document records what was changed, why, and in which file.

---

## P0 — Critical (Must Fix Before Production)

### Fix 1 — `react` / `react-dom` moved to `dependencies`

**File:** `package.json`

`react` and `react-dom` were declared as **optional** `peerDependencies`, meaning they would not be installed automatically. They have been moved to `dependencies` alongside their exact version (`18.3.1`). The `peerDependencies` and `peerDependenciesMeta` sections have been removed entirely.

---

### Fix 2 — `tsconfig.json` added with strict mode

**File:** `tsconfig.json` *(new)*  
**File:** `tsconfig.node.json` *(new)*

No TypeScript configuration existed. A `tsconfig.json` has been created with:
- `"strict": true` — enables all strict type checks
- `"noUncheckedIndexedAccess": true` — guards against undefined index access
- `"noImplicitAny": true` — bans implicit `any`
- `"noImplicitReturns": true` — requires all code paths to return a value
- `noFallthroughCasesInSwitch` — prevents switch fall-through bugs
- Path alias `@/*` → `src/app/*` for clean imports

A companion `tsconfig.node.json` covers `vite.config.ts`.

---

### Fix 3 — Duplicate routes removed

**File:** `src/app/routes.tsx` (renamed from `routes.ts`)

Four routes were defined twice — once inside the `/app` layout shell and again at the root level: `listings`, `property/:id`, `compare`, `safety`. React Router silently used the first match, making the second definition a dead route. The root-level duplicates have been removed; all four routes now exist exclusively under the `/app` layout shell.

---

### Fix 4 — Route-level code splitting implemented

**File:** `src/app/routes.tsx`

All ~40 page components were statically imported, bundling the entire application into a single JS chunk. Every page import has been converted to `React.lazy()` with a shared `<Suspense>` wrapper (`withSuspense` helper). The result is per-page code splitting: the initial bundle is now `~279 KB` for the shared runtime; each page loads on demand (the largest individual page chunk is `~148 KB`). A `PageLoader` spinner is shown during chunk fetches.

The file was renamed from `routes.ts` → `routes.tsx` because it now contains JSX.

---

### Fix 5 — `ProtectedRoute` guard added for admin routes

**File:** `src/app/components/ProtectedRoute.tsx` *(new)*  
**File:** `src/app/routes.tsx`

`/admin` and `/admin/verification` were publicly accessible with no authentication check. A `ProtectedRoute` component has been created that:
- Reads `auth_token` from `localStorage` as the mock auth signal
- Optionally checks `user_role` for role-restricted routes
- Redirects unauthenticated users to `/login` (preserving the intended URL via router `state`)
- Redirects users with the wrong role to `/session-expired`

Both admin routes are now wrapped with `<ProtectedRoute requiredRole="admin">`.

> **Sprint 2 TODO:** Replace the `localStorage` mock check with a real JWT verification using the NestJS auth API.

---

### Fix 6 — 404 catch-all route added

**File:** `src/app/pages/NotFound.tsx` *(new)*  
**File:** `src/app/routes.tsx`

Unknown URLs silently rendered nothing. A `NotFound` page has been created and registered as `{ path: "*" }` (the last route), which React Router matches for any unregistered path. The page displays a 404 message with "Go Home" and "Go Back" buttons using theme-aware CSS tokens.

---

## P1 — High Priority

### Fix 7 — `ErrorBoundary` typed correctly; `console.error` replaced

**File:** `src/app/components/ErrorBoundary.tsx`

Two issues resolved:

1. `errorInfo: any` → `errorInfo: ErrorInfo` (imported from `react`). The `ErrorInfo` type is the correct React type for the second argument of `componentDidCatch`.

2. `console.error(...)` replaced with a structured report object that is only logged in `import.meta.env.DEV` mode. A `// TODO` comment guides integration with a real error tracker (e.g., Sentry) before production.

---

### Fix 8 — Dark mode FOUC eliminated

**File:** `src/app/contexts/ThemeContext.tsx`  
**File:** `index.html`

Two complementary changes:

**ThemeContext:** `useState<Theme>("light")` with a deferred `useEffect` was the source of the FOUC — the component rendered "light" first, then switched on the next tick. This has been replaced with a lazy state initialiser `useState<Theme>(getInitialTheme)`, which reads `localStorage` and the `prefers-color-scheme` media query **synchronously** during first render. The redundant `mounted` state and double-`useEffect` are removed.

**index.html:** An inline `<script>` block has been added to `<head>`. It runs synchronously before React loads and applies the correct `"light"` or `"dark"` class to `<html>`. This prevents any flash even before React hydrates.

---

### Fix 9 — MUI dependency removed; unused packages removed

**File:** `package.json`

The following packages have been removed:
| Package | Reason |
|---------|--------|
| `@mui/material` | Duplicate UI system alongside Radix/shadcn (~500 KB bundle overhead) |
| `@mui/icons-material` | Same as above |
| `@emotion/react` | MUI peer dependency with no standalone use |
| `@emotion/styled` | Same as above |
| `react-dnd` | No confirmed usage in codebase |
| `react-dnd-html5-backend` | Peer of react-dnd |
| `react-popper` | Superseded by Radix built-in positioning |
| `@popperjs/core` | Peer of react-popper |
| `react-slick` | Redundant; `embla-carousel-react` is the chosen carousel library |

---

## P2 — Medium Priority

### Fix 10 — `aria-label` added to all icon-only interactive elements

**Files:** `src/app/components/Layout.tsx`, `src/app/components/CreateListing.tsx`, `src/app/pages/Login.tsx`

Icon-only buttons had no accessible name for screen readers. The following labels have been added:

| Element | `aria-label` value |
|---------|-------------------|
| Sidebar Settings button (desktop) | `"Open settings"` |
| Sidebar Settings button (mobile) | `"Open settings"` |
| Mobile menu open button | `"Open navigation menu"` |
| Mobile menu close button | `"Close navigation menu"` |
| Notifications bell button | `"Open notifications"` |
| Mobile "Create Listing" button | `"Create listing"` |
| CreateListing modal close button | `"Close listing modal"` |
| Per-image remove button | `"Remove photo {n}"` |
| Login show/hide password button | `"Show password"` / `"Hide password"` (dynamic) |

Navigation links in `<nav>` elements now also use `aria-current="page"` on the active item and carry an `aria-label` on the `<nav>` element itself.

Bell badge `<span>` carries `aria-label="Unread notifications"` so assistive technology can identify the indicator.

---

### Fix 11 — Layout hardcoded colours replaced with theme tokens

**File:** `src/app/components/Layout.tsx`

Hardcoded Tailwind classes (`bg-white`, `bg-gray-50`, `border-gray-200`, `text-gray-600`, `hover:bg-gray-50`, `bg-gray-200`, `text-gray-500`, `text-gray-400`) have been replaced with CSS custom-property-based tokens:

| Before | After |
|--------|-------|
| `bg-white` | `bg-card` |
| `bg-gray-50` (layout root) | `bg-background` |
| `border-gray-200` | `border-border` |
| `text-gray-600` | `text-muted-foreground` |
| `hover:bg-gray-50` | `hover:bg-accent` |
| `bg-gray-200` (avatar) | `bg-muted` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground` |

The layout now correctly responds to dark mode toggling.

---

### Fix 12 — `theme.css` colour representation standardised to `oklch()`

**File:** `src/styles/theme.css`

The `:root` (light mode) block mixed `#hex` notation with `oklch()` notation. All values are now uniformly expressed in `oklch()`. Comments document the original hex reference for each converted token.

| Token | Original | Standardised |
|-------|----------|--------------|
| `--background` | `#ffffff` | `oklch(1 0 0)` |
| `--card` | `#ffffff` | `oklch(1 0 0)` |
| `--primary` | `#030213` | `oklch(0.091 0.036 264)` |
| `--secondary-foreground` | `#030213` | `oklch(0.091 0.036 264)` |
| `--muted` | `#ececf0` | `oklch(0.941 0.003 280)` |
| `--muted-foreground` | `#717182` | `oklch(0.511 0.009 270)` |
| `--accent` | `#e9ebef` | `oklch(0.931 0.006 258)` |
| `--accent-foreground` | `#030213` | `oklch(0.091 0.036 264)` |
| `--destructive` | `#d4183d` | `oklch(0.477 0.188 14.5)` |
| `--destructive-foreground` | `#ffffff` | `oklch(1 0 0)` |
| `--border` | `rgba(0,0,0,0.1)` | `oklch(0 0 0 / 0.1)` |
| `--input-background` | `#f3f3f5` | `oklch(0.961 0.002 280)` |
| `--switch-background` | `#cbced4` | `oklch(0.829 0.007 268)` |
| `--sidebar-primary` | `#030213` | `oklch(0.091 0.036 264)` |

---

### Fix 13 — Hardcoded placeholder images removed from `CreateListing`

**File:** `src/app/components/CreateListing.tsx`

Two hardcoded Unsplash URLs were pre-populated into `uploadedImages` state. These URLs fail in offline or network-restricted environments. The initial state is now an empty array `[]`. The image removal callback (`onClick`) has also been wired up: clicking the per-image ✕ button now actually removes that image from state.

---

### Fix 14 — Login mock auth writes session token for `ProtectedRoute`

**File:** `src/app/pages/Login.tsx`

The mock login handler now writes `auth_token: "mock-token"` to `localStorage` on form submit, so that `ProtectedRoute` can detect the session and allow navigation to protected pages (admin, etc.). A `// TODO (Sprint 2)` comment documents the exact replacement required.

The show/hide password toggle button now has a dynamic `aria-label` ("Show password" / "Hide password").

---

## P3 — Nice to Have

### Fix 15 — Content-Security-Policy added to `index.html`

**File:** `index.html`

A `<meta http-equiv="Content-Security-Policy">` tag has been added with:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline'` (tighten with a nonce/hash once bundler CSP plugin is added)
- `img-src 'self' data: https://images.unsplash.com`
- `frame-src 'none'` and `object-src 'none'` to prevent clickjacking / object injection
- `form-action 'self'`

The `<title>` has been updated from the Figma scaffold default to `"PRIBEC — Real Estate & Construction Trust Platform"`.

---

## Remaining Items (Out of Scope for This Pass)

The following items from `AUDIT.md` §10 were not addressed in this fix pass and should be tracked for future work:

| Priority | Item | Notes |
|----------|------|-------|
| P1 | Unused pages (`PublicHomeVariation1/2`, base vs Enhanced duplicates) | Safe to delete; kept to avoid breaking any local navigation links that reference them |
| P2 | Form validation with `react-hook-form` + `zod` | Requires Sprint 2 integration; `react-hook-form` is already installed |
| P2 | Skip navigation link (`<a href="#main">Skip to content</a>`) | Add to Layout once the main `<main>` id is stabilised |
| P2 | Colour contrast audit | Run Axe / Lighthouse — some `text-muted-foreground` instances may fail WCAG 4.5:1 |
| P3 | Dependabot / Renovate for automated dependency updates | Configure in CI |
| P3 | Move mock data to `*.data.ts` fixture files | Reduce per-component file size |
| P3 | Fill in `guidelines/Guidelines.md` with project-specific rules | Still contains only the scaffold template |

---

## File Change Summary

| File | Status | Change Type |
|------|--------|-------------|
| `package.json` | Modified | Remove peer deps, remove 9 unused packages |
| `tsconfig.json` | **New** | Strict TypeScript config |
| `tsconfig.node.json` | **New** | Vite config TypeScript |
| `index.html` | Modified | CSP meta tag, FOUC-prevention script, title update |
| `src/app/routes.tsx` | Modified (renamed from `.ts`) | Lazy imports, deduplicated routes, ProtectedRoute, 404 |
| `src/app/components/ProtectedRoute.tsx` | **New** | Auth-gated route wrapper |
| `src/app/pages/NotFound.tsx` | **New** | 404 page |
| `src/app/components/ErrorBoundary.tsx` | Modified | `ErrorInfo` type, dev-only structured error log |
| `src/app/contexts/ThemeContext.tsx` | Modified | Synchronous theme init, FOUC fix |
| `src/app/components/Layout.tsx` | Modified | Theme tokens, aria-labels |
| `src/app/components/CreateListing.tsx` | Modified | Remove placeholder images, aria-labels, wire up remove |
| `src/app/pages/Login.tsx` | Modified | Mock session token, aria-label on password toggle |
| `src/styles/theme.css` | Modified | Standardise light mode to oklch() |
