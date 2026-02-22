# Codebase Audit — PropmarketFigma

**Date:** 2026-02-22  
**Scope:** Full front-end codebase review — architecture, routing, dependencies, code quality, security, performance, and accessibility.

---

## 1. Project Overview

| Attribute | Detail |
|-----------|--------|
| Type | React 18 SPA (Figma / UI prototype) |
| Bundler | Vite 6 |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Component library | Radix UI / shadcn-style wrappers + MUI (dual systems) |
| Routing | React Router v7 |
| State management | Local component `useState` only — no global store |
| Backend | None — all data is hardcoded / mocked |
| Tests | None |

This is a **design prototype / Figma handoff scaffold**. Virtually all data is hardcoded and no real API, authentication, or persistence exists.

---

## 2. Critical Issues

### 2.1 Authentication is Non-Functional

`Login.tsx` and all related auth pages (`Register`, `ForgotPassword`, `ResetPassword`, `MFASetup`, `MFAVerify`) perform no real authentication. The login handler simply navigates to `/role-selection`:

```tsx
// src/app/pages/Login.tsx
const handleLogin = (e: FormEvent) => {
  e.preventDefault();
  // Mock login - redirect to role selection or dashboard
  navigate("/role-selection");
};
```

**Risk:** Any attempt to build on this scaffold could result in ships with zero auth security if the mock is not replaced.  
**Recommendation:** Integrate a real auth provider (e.g., Supabase, Auth0, Clerk, or a custom API) before any production use.

---

### 2.2 `react` and `react-dom` Declared as Optional Peer Dependencies

In `package.json`, `react` and `react-dom` are listed under `peerDependencies` as **optional**. This means they will **not** be automatically installed.

```json
"peerDependencies": {
  "react": "18.3.1",
  "react-dom": "18.3.1"
},
"peerDependenciesMeta": {
  "react": { "optional": true },
  "react-dom": { "optional": true }
}
```

This is a Figma Make scaffold artifact. For a standalone app they must be moved to `dependencies`.

---

### 2.3 Duplicate Routes

`src/app/routes.ts` defines the same paths twice — once inside the authenticated `/app` layout shell, and again at the top level without a layout:

| Duplicated Path | Inside `/app` | At Root Level |
|-----------------|---------------|---------------|
| `listings` | ✅ | ✅ |
| `property/:id` | ✅ | ✅ |
| `compare` | ✅ | ✅ |
| `safety` | ✅ | ✅ |

React Router will silently use the first matching route; this causes confusing behaviour and dead routes.

---

### 2.4 No Route-Level Authentication Guard

All routes are publicly accessible. There is no `<ProtectedRoute>` wrapper — anyone can visit `/admin`, `/admin/verification`, `/escrow`, or `/boq-workspace` directly.

---

### 2.5 No 404 / Catch-All Route

There is no `{ path: "*", Component: NotFound }` route defined. Unknown URLs silently render nothing.

---

## 3. Dependency Issues

### 3.1 Two Competing UI Libraries

Both **MUI (Material UI)** and **Radix UI / shadcn** are installed and used simultaneously. This adds ~500 KB+ to the bundle with no clear benefit.

| Library | Used in |
|---------|---------|
| `@mui/material`, `@mui/icons-material` | Some pages |
| `@radix-ui/*` (15+ primitives) | Most pages via `/ui/*.tsx` wrappers |

**Recommendation:** Standardise on one system (Radix/shadcn appears to be the primary choice) and remove MUI.

### 3.2 `next-themes` Installed but Unused

`next-themes` is listed as a dependency, but the project implements its own `ThemeContext.tsx`. The library is never imported anywhere.

### 3.3 Potentially Unused Packages

The following packages appear to have little or no usage in the current codebase and should be audited for removal:

- `react-dnd` / `react-dnd-html5-backend` — drag-and-drop; no clear usage found
- `react-popper` — superseded by Radix's built-in positioning
- `react-slick` — carousel; `embla-carousel-react` is also present (dual carousel libraries)
- `@popperjs/core` — Popper v2; already pulled in by react-popper

### 3.4 Version Pinning Strategy

All dependencies use exact versions (no `^` or `~`). While deterministic, this means security patches require manual updates. Consider using a lockfile-only strategy (`npm ci`/`pnpm install --frozen-lockfile`) combined with automated dependency update tooling (Dependabot / Renovate).

---

## 4. Routing & Navigation

### 4.1 Inconsistent Layout Wrapping

Most "app" pages (`buyer`, `conveyancer`, `escrow`, `construction`, `admin`, etc.) are **not** wrapped in the `<Layout>` component. Each page renders its own navigation/header independently, leading to duplicated UI code and inconsistent chrome across the app.

### 4.2 Commented-Out Imports (Dead Code)

`routes.ts` contains commented-out imports for two alternate `PublicHome` variants that are never used:

```ts
// import PublicHome from "./pages/PublicHome"; // Original
// import PublicHome from "./pages/PublicHomeVariation1"; // 🎨 Bold & Modern
import PublicHome from "./pages/PublicHome"; // ✨ Real Estate (ACTIVE)
```

`PublicHomeVariation1.tsx` and `PublicHomeVariation2.tsx` exist in the pages directory but are unreachable. They should either be deleted or converted to routes.

### 4.3 Enhanced vs Non-Enhanced Page Pairs

Several pages have both a base version and an "Enhanced" version (e.g., `AgentDashboard` / `AgentDashboardEnhanced`, `BuyerDashboard` / `BuyerDashboardEnhanced`, `Login` / `LoginEnhanced`, `PropertyDetail` / `PropertyDetailEnhanced`). The base versions are either unused or duplicated. These should be consolidated.

---

## 5. Code Quality

### 5.1 No TypeScript Configuration File Found

There is no `tsconfig.json` in the project root. Vite infers defaults, but strict mode and important compiler options (`strict`, `noUncheckedIndexedAccess`, `noImplicitAny`) are not enforced. This will allow silent type-unsafe code.

**Recommendation:** Add a `tsconfig.json` with at minimum `"strict": true`.

### 5.2 `any` Types in Production Code

`ErrorBoundary.tsx` uses `any` for the `errorInfo` parameter:

```tsx
componentDidCatch(error: Error, errorInfo: any) {
```

Should be typed as `React.ErrorInfo`.

### 5.3 `console.error` in Production Error Boundary

```tsx
componentDidCatch(error: Error, errorInfo: any) {
  console.error("Error caught by boundary:", error, errorInfo);
}
```

This should be replaced with a proper error tracking service (e.g., Sentry) before production.

### 5.4 Empty Guidelines File

`guidelines/Guidelines.md` contains only the scaffold template placeholder text — no actual project-specific guidelines have been filled in.

### 5.5 Hardcoded External Image URLs

`CreateListing.tsx` initialises state with hardcoded Unsplash URLs:

```tsx
const [uploadedImages, setUploadedImages] = useState([
  "https://images.unsplash.com/photo-1757439402115-c3c496fe81ec?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1560725855-0449b6a7f993?w=300&h=300&fit=crop",
]);
```

External image dependencies in component state will cause failures in offline or restricted environments.

---

## 6. Performance

### 6.1 No Route-Level Code Splitting

All ~40 page components are imported statically at the top of `routes.ts` and bundled into a single chunk. This means the user downloads the entire application on first load.

**Recommendation:** Use `React.lazy()` + `<Suspense>` for all page-level imports:

```ts
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
```

### 6.2 Large Pages

Several pages are very large single-file components with hundreds to nearly 1,000 lines of JSX:

| File | Lines (approx.) |
|------|-----------------|
| `RiskAnalyticsDashboard.tsx` | ~937 |
| `PropertySaleWorkspace.tsx` | ~767 |
| `AdminDashboard.tsx` | ~413 |

These should be decomposed into smaller sub-components kept in dedicated feature folders.

### 6.3 All Data Hardcoded in Component Bodies

Every page defines its mock data (`const stats = [...]`, `const pendingVerifications = [...]`, etc.) inline inside the component function. When real data fetching is added, these will need to be entirely rearchitected. Moving data to separate `*.data.ts` fixture files now would ease that transition.

---

## 7. Security

### 7.1 Admin Routes Publicly Accessible

`/admin` and `/admin/verification` are accessible without any authentication check. An attacker can view the full admin UI.

### 7.2 No Input Validation or Sanitisation

Form inputs (email, password, etc.) have no client-side validation beyond basic HTML `required` attributes. There is no use of `react-hook-form`'s validation rules (`zod`, `yup`) despite `react-hook-form` being installed.

### 7.3 No Content-Security Policy

There is no CSP meta tag in `index.html` and no server-side header configuration. This leaves the app open to XSS if user-generated content is ever rendered.

---

## 8. Dark Mode / Theming

### 8.1 Flash of Unstyled Content (FOUC)

`ThemeContext.tsx` initialises `theme` as `"light"` synchronously, then reads `localStorage` inside a `useEffect` (which only runs after the first render and paint). This will cause a visible flash from light to dark for users who have dark mode saved.

**Recommendation:** Apply the theme class server-side (or use an inline script in `index.html`) before React hydrates, or use `next-themes` which solves this correctly.

### 8.2 Mixed CSS Variable Systems

`theme.css` defines CSS variables using both hex (`#ffffff`) and `oklch()` colour representations. This is inconsistent and may cause issues with colour manipulation utilities.

### 8.3 Hardcoded Tailwind Colours in Layout

`Layout.tsx` uses hardcoded Tailwind classes (`bg-gray-50`, `bg-white`, `border-gray-200`) rather than the CSS custom property-based theme tokens (`bg-background`, `border-border`). This means the layout does not respond correctly to dark mode.

---

## 9. Accessibility

### 9.1 Icon-Only Buttons Lack Labels

Several icon-only buttons (e.g., the close `X` button in `CreateListing.tsx`, notification bell, mobile menu toggle) have no `aria-label`:

```tsx
<button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
  <X className="w-5 h-5" />
</button>
```

This is not accessible to screen reader users.

### 9.2 No Skip Navigation Link

There is no "skip to main content" link, which is required for keyboard navigation accessibility (WCAG 2.1 AA).

### 9.3 Colour Contrast

Some muted text classes (e.g., `text-gray-400` on white, `text-muted-foreground`) may not meet the WCAG 4.5:1 contrast ratio requirement for body text. A full contrast audit with a tool like Axe or Lighthouse is recommended.

---

## 10. Summary & Priority Recommendations

### P0 — Must Fix Before Production

1. Move `react` and `react-dom` from `peerDependencies` to `dependencies`.
2. Implement real authentication and add protected route guards.
3. Remove duplicate routes from `routes.ts`.
4. Add a `tsconfig.json` with `"strict": true`.

### P1 — High Priority

5. Add a `{ path: "*", Component: NotFound }` catch-all route.
6. Implement route-level code splitting (`React.lazy`).
7. Consolidate MUI and Radix/shadcn to a single UI system.
8. Remove or route the unused `PublicHomeVariation1/2` pages.
9. Fix dark mode FOUC.
10. Replace `console.error` in `ErrorBoundary` with a structured error tracker.

### P2 — Medium Priority

11. Fix `errorInfo: any` → `React.ErrorInfo`.
12. Add `aria-label` to all icon-only interactive elements.
13. Add client-side form validation using `react-hook-form` + schema validation.
14. Remove unused dependencies (`next-themes`, `react-slick`, `react-dnd` if not needed, `react-popper`).
15. Break large page files (>300 lines) into sub-components.
16. Replace hardcoded `bg-white`/`bg-gray-50` in Layout with theme-aware tokens.

### P3 — Nice to Have

17. Add Dependabot / Renovate for automated dependency updates.
18. Add a CSP meta tag.
19. Move hardcoded mock data out of component bodies into fixture files.
20. Fill in `guidelines/Guidelines.md` with real project conventions.
21. Delete or consolidate "enhanced" vs base page duplicates.
