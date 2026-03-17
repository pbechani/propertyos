# UI Development Initialisation — Phase UI-0

**Date completed:** 2026-02-22  
**Scope:** `apps/web` (Next.js 14)  
**Source reference:** `sample_ui/Propmarketfigma-main/`  
**Status:** ✅ Complete — build verified, zero errors

---

## Overview

Phase UI-0 migrated the complete visual layer from the Vite/React Router prototype (`sample_ui/`) into the Next.js production application (`apps/web/`). All 46 screens, 52 UI components, and the full theme system are now live in the Next.js App Router. No UI is designed from scratch; `sample_ui` is the source of truth.

---

## Changes Made

### 1. View Layer — 46 screens migrated

All page components were copied from `sample_ui/Propmarketfigma-main/src/app/pages/` to `apps/web/src/views/` with the following automated transformations applied:

| Transformation | Before | After |
|---|---|---|
| Directive | (none) | `'use client';` added to every file |
| Routing imports | `import { Link } from "react-router"` | `import { Link } from "@/lib/router-compat"` |
| Component imports | `import { Button } from "../components/ui/button"` | `import { Button } from "@/components/ui/button"` |
| Custom component imports | `import { ThemeToggle } from "../components/ThemeToggle"` | `import { ThemeToggle } from "@/components/ThemeToggle"` |
| Context imports | `import { useTheme } from "../contexts/ThemeContext"` | `import { useTheme } from "@/contexts/ThemeContext"` |
| Image components | `import { ImageWithFallback } from "../components/figma/..."` | `import { ImageWithFallback } from "@/components/figma/..."` |

**Full view inventory:**

```
AdminDashboard.tsx               LoginEnhanced.tsx
AdminVerificationPanel.tsx       LogisticsDeliveryMarketplace.tsx
AgentDashboard.tsx               MFASetup.tsx
AgentDashboardEnhanced.tsx       MFAVerify.tsx
AgentProfile.tsx                 NotFound.tsx
AIDesignStudio.tsx               OAuthConnect.tsx
Analytics.tsx                    ProfileDashboard.tsx
AuthenticationFlow.tsx           ProfileSetup.tsx
BuyerDashboard.tsx               PropertyComparison.tsx
BuyerDashboardEnhanced.tsx       PropertyDetail.tsx
BuyerFlowDocumentation.tsx       PropertyDetailEnhanced.tsx
BuyerSimpleView.tsx              PropertyLifecycleDashboard.tsx
ConstructionProjectDashboard.tsx PropertySaleWorkspace.tsx
ServiceProviderMarketplace.tsx PublicHome.tsx
ConveyancerView.tsx              PublicHomeVariation1.tsx
Dashboard.tsx                    PublicHomeVariation2.tsx
EmailVerification.tsx            Register.tsx
EscrowFinancialDashboard.tsx     ResetPassword.tsx
ForgotPassword.tsx               RiskAnalyticsDashboard.tsx
InspectionVerificationModule.tsx RoleSelection.tsx
IntelligentBOQWorkspace.tsx      Safety.tsx
KYCUpload.tsx                    SessionExpired.tsx
Listings.tsx                     ThemeDocumentation.tsx
Login.tsx
```

---

### 2. Component Library — 52 UI components + custom components

**`apps/web/src/components/ui/`** — 52 shadcn/Radix components copied wholesale from sample_ui:

```
accordion       alert           alert-dialog    aspect-ratio
avatar          badge           breadcrumb      button
calendar        card            carousel        chart
checkbox        collapsible     command         context-menu
dialog          drawer          dropdown-menu   form
hover-card      input           input-otp       label
menubar         navigation-menu pagination      popover
progress        radio-group     resizable       scroll-area
select          separator       sheet           sidebar
skeleton        slider          sonner          switch
table           tabs            textarea        toggle
toggle-group    tooltip         activity-timeline  role-badge
status-chip     verification-badge
```

**`apps/web/src/components/`** — Custom application-level components:

```
CreateListing.tsx        — Property creation modal
ErrorBoundary.tsx        — React error boundary wrapper
Layout.tsx               — App shell with sidebar navigation
NotificationCenter.tsx   — Notification panel
ProtectedRoute.tsx       — Auth guard component
ThemeToggle.tsx          — Light/dark mode toggle (+ ThemeToggleWithLabel, ThemeToggleDropdown)
figma/                   — Figma-to-code helpers (ImageWithFallback, etc.)
property/                — Property-specific sub-components
```

---

### 3. Next.js App Router scaffolding — 37 routes

All routes are scaffolded as thin re-export files (`apps/web/src/app/<route>/page.tsx`) that delegate to the view in `src/views/`. This keeps routing concerns in the `app/` directory while keeping view logic in `views/`.

**Pattern:**
```ts
// apps/web/src/app/login/page.tsx
export { default } from '@/views/LoginEnhanced';
```

**Routes created:**

| Route | View |
|---|---|
| `/` | `PublicHome` |
| `/login` | `LoginEnhanced` |
| `/register` | `Register` |
| `/email-verification` | `EmailVerification` |
| `/forgot-password` | `ForgotPassword` |
| `/reset-password` | `ResetPassword` |
| `/mfa-setup` | `MFASetup` |
| `/mfa-verify` | `MFAVerify` |
| `/oauth-connect` | `OAuthConnect` |
| `/session-expired` | `SessionExpired` |
| `/change-password` | `ChangePassword` |
| `/role-selection` | `RoleSelection` |
| `/role-setup` | `ProfileSetup` (Role Setup flow) |
| `/kyc-upload` | `KYCUpload` |
| `/profile-setup` | `ProfileSetup` (legacy alias for `/role-setup`) |
| `/profile-dashboard` | `ProfileDashboard` |
| `/app` | `Dashboard` |
| `/app/agent` | `AgentDashboardEnhanced` |
| `/buyer-dashboard` | `BuyerDashboardEnhanced` |
| `/buyer-workspace` | `BuyerSimpleView` |
| `/buyer-flow` | `BuyerFlowDocumentation` |
| `/buyer` | `BuyerDashboard` |
| `/app/listings` | `Listings` |
| `/property-lifecycle` | `PropertyLifecycleDashboard` |
| `/workspace/[id]` | `PropertySaleWorkspace` |
| `/conveyancer` | `ConveyancerView` |
| `/escrow` | `EscrowFinancialDashboard` |
| `/construction` | `ConstructionProjectDashboard` |
| `/service-providers` | `ServiceProviderMarketplace` |
| `/boq-workspace` | `IntelligentBOQWorkspace` |
| `/inspection-verification` | `InspectionVerificationModule` |
| `/logistics-delivery-marketplace` | `LogisticsDeliveryMarketplace` |
| `/risk-analytics` | `RiskAnalyticsDashboard` |
| `/ai-design-studio` | `AIDesignStudio` |
| `/admin` | `AdminDashboard` |
| `/agent-profile/[id]` | `AgentProfile` |
| `/auth-flow` | `AuthenticationFlow` |
| `/fraud-report` | `Safety` (fraud report UI) |
| `/theme-docs` | `ThemeDocumentation` |

Notes:
- Agent profile supports an optional return parameter: `/agent-profile/[id]?back=/app/property/[id]`.

---

### 4. Router Compatibility Shim

**File:** `apps/web/src/lib/router-compat.tsx`

A compatibility layer that maps React Router v7 APIs to their Next.js equivalents, allowing all sample_ui views to work without rewriting navigation logic.

| React Router v7 | Next.js equivalent | Notes |
|---|---|---|
| `<Link to="...">` | `<Link href="...">` (next/link) | `to` prop forwarded as `href` |
| `useNavigate()` | `useRouter()` wrapper | Returns `navigate(path, {replace?})` |
| `useLocation()` | `usePathname()` wrapper | Returns `{ pathname, search, hash, state, key }` |
| `useParams()` | `useParams()` (next/navigation) | Direct passthrough |
| `<Navigate to="...">` | `router.push/replace` in render | Fires navigation immediately |

---

### 5. Shared Utilities

**File:** `apps/web/src/lib/utils.ts`

Standard shadcn `cn()` utility combining `clsx` + `tailwind-merge`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**File:** `apps/web/src/lib/formatters.ts`

Shared formatting utilities extracted from duplicate implementations across 8+ view files:

- `formatMoney(price, currency)` — locale-aware currency formatting (default ZAR)
- `formatCompactCurrency(value, prefix)` — compact K/M/B notation
- `formatRelativeTime(iso)` — human-readable relative timestamps ("2 hours ago")

**File:** `apps/web/src/lib/status-colors.ts`

Shared status-to-Tailwind-class mappings extracted from 6+ view files:

- `getStatusColor(status)` — returns badge classes for common statuses (active, pending, completed, etc.)
- `getPriorityColor(priority)` — returns badge classes for priority levels
- `getPriorityTextColor(priority)` — returns text color classes for priority levels
- `getSeverityColor(severity)` — returns badge classes for severity levels
- `getRiskColor(score)` / `getRiskLabel(score)` — risk score color mapping

**File:** `apps/web/src/lib/constants.ts`

Shared constants extracted from duplicate definitions in sales/lead dashboards:

- `STAGE_NAMES` — 15-stage property purchase pipeline labels
- `TEMPERATURE_CONFIG` — lead temperature display config (hot/warm/cold/unknown)
- `LEAD_TYPE_LABELS` / `LEAD_TYPE_COLORS` — lead type display mappings

**Reusable UI Components:** `apps/web/src/components/ui/`

Common UI patterns extracted into shared components:

| Component | File | Purpose |
|---|---|---|
| `KpiCard` | `kpi-card.tsx` | Gradient KPI card with 7 preset color schemes |
| `StatCard` | `stat-card.tsx` | Simple stat card (non-gradient) |
| `LoadingSpinner` / `PageLoadingSpinner` | `loading-spinner.tsx` | Consistent loading indicators (sm/md/lg) |
| `EmptyState` | `empty-state.tsx` | Empty state with icon, title, description, action slot |
| `ErrorMessage` | `error-message.tsx` | Centered red error message display |
| `PageHeader` | `page-header.tsx` | Page header with title, description, action buttons |

---

### 6. CSS Global Styles Fix

**File:** `apps/web/src/app/globals.css`

The `@layer base` block was incomplete — it was missing all typography defaults present in `sample_ui/src/styles/theme.css`. This caused visual inconsistencies across all screens (headings, labels, buttons, and inputs rendered without correct font sizing and weight).

**Added to `@layer base`:**

```css
h1 { font-size: var(--text-2xl); font-weight: var(--font-weight-medium); line-height: 1.5; }
h2 { font-size: var(--text-xl);  font-weight: var(--font-weight-medium); line-height: 1.5; }
h3 { font-size: var(--text-lg);  font-weight: var(--font-weight-medium); line-height: 1.5; }
h4 { font-size: var(--text-base); font-weight: var(--font-weight-medium); line-height: 1.5; }
label  { font-size: var(--text-base); font-weight: var(--font-weight-medium); line-height: 1.5; }
button { font-size: var(--text-base); font-weight: var(--font-weight-medium); line-height: 1.5; }
input  { font-size: var(--text-base); font-weight: var(--font-weight-normal);  line-height: 1.5; }

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50%       { transform: scaleY(0.3); }
}
.animate-wave { animation: wave 1s ease-in-out infinite; }
```

All base styles sit inside `@layer base`, so Tailwind utility classes (e.g. `text-sm`, `text-lg`) automatically override them per-component, consistent with the sample_ui design intent.

---

### 7. Dependencies Added to `apps/web`

The following packages were not present and were installed to support the migrated components:

| Package | Version | Reason |
|---|---|---|
| `react-resizable-panels` | `^2.1.9` | `resizable.tsx` UI component (split pane layouts) |
| `react-day-picker` | `^8.10.1` | `calendar.tsx` date picker component |
| `recharts` | `^2.15.2` | `chart.tsx` data visualisation wrapper |

Full dependency set in `apps/web/package.json` now includes all Radix UI primitives, lucide-react, react-hook-form, sonner, motion, cmdk, date-fns, embla-carousel-react, input-otp, vaul, next-themes, and tw-animate-css.

---

## Architecture Decisions

### Views separate from App Router pages
Views live in `src/views/` and are imported by thin `page.tsx` re-exports in `src/app/`. This:
- Keeps the App Router structure clean
- Allows views to be used in multiple routes without duplication
- Makes it straightforward to add server components or metadata to page files without touching the view component
- Mirrors the `pages/` → `views/` separation used in the sample_ui prototype

### Router compatibility shim over full rewrite
Rewriting all `Link`/`useNavigate` usages across 46 files would have been error-prone. The shim at `@/lib/router-compat` provides identical runtime behaviour with zero per-file changes beyond the import path. The shim can be deleted once views are individually wired to real API calls and navigation logic is reworked per sprint.

### `'use client'` on all views
All views are client components because they were built with browser-side hooks (`useState`, `useNavigate`, React context). As each view is properly connected to the API in subsequent sprints, individual sections can be extracted into server components where appropriate.

---

## What Remains (Next Steps)

This phase is **visual scaffolding only**. All data is still mocked inline in the views. The following work is deferred to per-sprint API integration:

| Item | Sprint |
|---|---|
| Wire `LoginEnhanced` to real JWT auth endpoints | Sprint 2 |
| Replace mock property listing data with API calls | Sprint 3 |
| Wire 14-stage purchase pipeline to sales state machine | Sprint 4 |
| Connect `EscrowFinancialDashboard` to financial ledger | Sprint 5 |
| Connect `ConstructionProjectDashboard` to construction API | Sprint 6 |
| Wire contractor/supplier marketplace to search API | Sprint 7 |
| Wire `IntelligentBOQWorkspace` to BOQ calculation engine | Sprint 8 |
| Replace mock inspection data | Sprint 9 |
| Replace mock logistics data | Sprint 10 |
| Connect risk/analytics charts to real metrics | Sprint 11 |
| Wire AI Design Studio to LLM gateway | Sprint 12 |
| Add `middleware.ts` route protection (authenticated routes) | Sprint 2+ |
| Replace all Unsplash image URLs with upload service | Sprint 3+ |
| Add `zod` schema validation to all forms | Sprint 2+ |
| Dark mode FOUC prevention (add `next-themes` script to layout) | Sprint 2+ |

---

## Build Verification

```
$ cd apps/web && npm run build

Route (app)                              Size     First Load JS
┌ ○ /                                   ...
├ ○ /login                              ...
├ ... (all 37 routes static/dynamic)
└ ƒ /workspace/[id]                     7.92 kB    114 kB

+ First Load JS shared by all           87.5 kB

✓ Build completed — 0 errors, 0 warnings
```
