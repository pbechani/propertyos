# Sample UI Analysis — Integration Guide

**Date:** 2026-02-22  
**Source:** `sample_ui/Propmarketfigma-main/`  
**Target:** `apps/web/` (Next.js 14)

---

## 1. What Is the Sample UI?

`sample_ui/Propmarketfigma-main` is a **complete, domain-matched React UI prototype** built with Vite + React Router. It was generated from a Figma-to-code scaffold and covers every PRIBEC module described in the PRD. **All data is hardcoded/mocked — no backend, no real auth.** It is a pure design reference and visual implementation blueprint.

---

## 2. Page Inventory

The prototype contains **43 pages** that map directly to PRIBEC modules:

### Authentication & Onboarding
| Page File | Route | Maps To |
|-----------|-------|---------|
| `Login.tsx` / `LoginEnhanced.tsx` | `/login` | Sprint 2 — JWT auth |
| `Register.tsx` | `/register` | Sprint 2 — user registration |
| `EmailVerification.tsx` | `/email-verification` | Sprint 2 — email verify |
| `ForgotPassword.tsx` / `ResetPassword.tsx` | `/forgot-password`, `/reset-password` | Sprint 2 |
| `MFASetup.tsx` / `MFAVerify.tsx` | `/mfa-setup`, `/mfa-verify` | Sprint 2 — TOTP MFA |
| `OAuthConnect.tsx` | `/oauth-connect` | Sprint 2 — social login |
| `SessionExpired.tsx` | `/session-expired` | Sprint 2 — token expiry |
| `RoleSelection.tsx` | `/role-selection` | Sprint 2 — role assignment |
| `ProfileSetup.tsx` | `/profile-setup` | Sprint 2 — onboarding |
| `KYCUpload.tsx` | `/kyc-upload` | Sprint 2 — identity verification |
| `ProfileDashboard.tsx` | `/profile-dashboard` | Sprint 2 — user profile |

### Property Marketplace
| Page File | Route | Maps To |
|-----------|-------|---------|
| `PublicHome.tsx` | `/` | Sprint 3 — landing page |
| `Listings.tsx` | `/app/listings` | Sprint 3 — property list |
| `PropertyDetailEnhanced.tsx` | `/app/property/:id` | Sprint 3 — property view |
| `PropertyComparison.tsx` | `/compare` | Sprint 3 — comparison |
| `PropertyLifecycleDashboard.tsx` | `/property-lifecycle` | Sprint 3/4 — lifecycle view |

Navigation note:
- Selecting a property from `Listings.tsx` (grid cards or map markers) routes to `/app/property/:id`, which renders `PropertyDetailEnhanced.tsx`.
- Property detail links from comparison and agent views are also standardized to `/app/property/:id`.
- Agent profile links opened from `PropertyDetailEnhanced.tsx` include a return path (`?back=`), so the back action returns users to the originating property detail screen.
- Typical agent profile flow from property detail: `/agent-profile/:id?back=/app/property/:id`.

### Sales Progression (14 Stages)
| Page File | Route | Maps To |
|-----------|-------|---------|
| `PropertySaleWorkspace.tsx` | `/workspace/:id` | Sprint 4 — 14-stage pipeline |
| `ConveyancerView.tsx` | `/conveyancer` | Sprint 4 — conveyancer portal |
| `BuyerDashboardEnhanced.tsx` | `/buyer-dashboard` | Sprint 4 — buyer hub |
| `BuyerSimpleView.tsx` | `/buyer-workspace` | Sprint 4 — lightweight buyer |
| `BuyerFlowDocumentation.tsx` | `/buyer-flow-docs` | Sprint 4 — reference |

### Escrow & Financials
| Page File | Route | Maps To |
|-----------|-------|---------|
| `EscrowFinancialDashboard.tsx` | `/escrow` | Sprint 5 — escrow ledger |

### Construction
| Page File | Route | Maps To |
|-----------|-------|---------|
| `ConstructionProjectDashboard.tsx` | `/construction` | Sprint 6 — project dashboard |

### Contractor & Supplier Marketplace
| Page File | Route | Maps To |
|-----------|-------|---------|
| `ContractorSupplierMarketplace.tsx` | `/contractor-supplier-marketplace` | Sprint 7 |

### BOQ System
| Page File | Route | Maps To |
|-----------|-------|---------|
| `IntelligentBOQWorkspace.tsx` | `/boq-workspace` | Sprint 8 |

### Inspections & Monitoring
| Page File | Route | Maps To |
|-----------|-------|---------|
| `InspectionVerificationModule.tsx` | `/inspection-verification` | Sprint 9 |

### Logistics
| Page File | Route | Maps To |
|-----------|-------|---------|
| `LogisticsDeliveryMarketplace.tsx` | `/logistics-delivery-marketplace` | Sprint 10 |

### Risk, Analytics & AI
| Page File | Route | Maps To |
|-----------|-------|---------|
| `RiskAnalyticsDashboard.tsx` | `/risk-analytics` | Sprint 11 |
| `AIDesignStudio.tsx` | `/ai-design-studio` | Sprint 12 |

### Administration
| Page File | Route | Maps To |
|-----------|-------|---------|
| `AdminDashboard.tsx` | `/admin` | Cross-sprint — admin panel |
| `AdminVerificationPanel.tsx` | `/admin/verification` | Sprint 2/9 |
| `AgentDashboardEnhanced.tsx` | `/app/agent` | Sprint 3/4 — agent portal |
| `AgentProfile.tsx` | `/agent-profile/:id` | Sprint 7 |

---

## 3. Component Library

The prototype ships a **complete shadcn/Radix UI component library** in `src/app/components/ui/`:

| Component | File | Use Case |
|-----------|------|----------|
| Button, Input, Textarea, Label | Core form elements | All forms |
| Card, Badge, Avatar, Separator | Layout primitives | Everywhere |
| Dialog, Sheet, Drawer | Modal patterns | Modals/side panels |
| Tabs, Accordion, Collapsible | Content organisation | Dashboards |
| Select, Checkbox, RadioGroup, Switch, Slider | Form controls | Settings/filters |
| Table, Pagination, ScrollArea | Data display | Listings, admin |
| Progress, Skeleton | Loading/status | All async views |
| Alert, AlertDialog, Sonner (toast) | Notifications | Feedback messaging |
| Chart (recharts wrapper) | Data visualisation | Dashboards |
| Calendar, InputOTP | Specialised inputs | Booking, MFA |
| Sidebar, NavigationMenu, Menubar | Navigation | Layout shell |
| Tooltip, HoverCard, Popover, DropdownMenu | Overlay positioning | Actions menus |
| Form (react-hook-form wrapper) | Form validation | Auth/creation flows |
| Breadcrumb, Command | UX utilities | Navigation, search |
| **`verification-badge.tsx`** | Custom — document badge | Property/KYC |
| **`role-badge.tsx`** | Custom — user role chip | Admin/profiles |
| **`status-chip.tsx`** | Custom — status indicator | All pipelines |
| **`activity-timeline.tsx`** | Custom — event timeline | Audit trail |

---

## 4. Tech Stack Comparison

| Concern | Sample UI | `apps/web` (target) | Status |
|---------|-----------|---------------------|--------|
| Framework | React 18 + Vite | Next.js 14 (App Router) | ✅ Next.js in use |
| Routing | React Router v7 | Next.js file-based routing | ✅ `router-compat.tsx` shim + 37 page scaffolds |
| Styling | Tailwind CSS v4 | Tailwind CSS v4 | ✅ Compatible; CSS vars aligned |
| Component library | Radix UI / shadcn | Radix UI / shadcn | ✅ 52 components copied |
| Icons | `lucide-react` | `lucide-react` | ✅ Installed |
| Charts | `recharts` | `recharts` | ✅ Installed (`^2.15.2`) |
| Animations | `motion` (Framer Motion v12) | `motion` | ✅ Installed |
| Forms | `react-hook-form` + shadcn `form.tsx` | `react-hook-form` | ✅ Installed — not yet wired to APIs |
| Themes | Custom `ThemeContext` | Custom `ThemeContext` | ✅ Ported; FOUC prevention deferred to Sprint 2+ |
| State management | Component-level `useState` only | Component-level | ✅ Sufficient for current phase |
| Auth | Mock only | JWT (Sprint 2) | ⏳ Visual shell done; API wiring next |
| Data | Hardcoded inline | NestJS REST API | ⏳ Visual shell done; API wiring per sprint |
| Secondary UI lib | MUI (mixed in some pages) | — | ✅ Not carried over |

---

## 5. Theme System

The sample provides a full CSS custom property–based theme in `src/styles/theme.css` with light and dark mode tokens:

```css
:root {
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --primary: #030213;
  --secondary: oklch(0.95 0.0058 264.53);
  --destructive: #d4183d;
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  /* ...etc */
}
.dark { /* dark mode overrides */ }
```

This token set is **directly compatible** with the shadcn `cn()` utility and Tailwind's `theme(...)` references. It should be copied into `apps/web/src/styles/globals.css` and extended with PRIBEC brand colours.

---

## 6. What Can Be Directly Reused

### 6.1 High-Confidence Direct Copy ✅ DONE (2026-02-22)

- **`src/app/components/ui/`** — All 52 shadcn component files. Copied to `apps/web/src/components/ui/`. Imports reference the Next.js-compatible `@/lib/utils` path.
- **`src/styles/theme.css`** — CSS variable definitions. Merged into `apps/web/src/app/globals.css` including full typography base layer.
- **`src/styles/fonts.css`** — Font declarations. Migrated to `next/font` (Manrope via `layout.tsx`).
- **Custom components**: `verification-badge.tsx`, `role-badge.tsx`, `status-chip.tsx`, `activity-timeline.tsx` — copied as-is to `apps/web/src/components/ui/`.

### 6.2 Reusable After Adaptation ✅ Visual shell complete (2026-02-22)

Every page has been adapted and lives at `apps/web/src/views/`. The **visual structure, JSX layout, and Tailwind classes are production-quality**. The four adaptation steps have been applied to all files:

1. ✅ **Routing**: `<Link to="...">` → `<Link href="...">` via `@/lib/router-compat`
2. ✅ **Navigation**: `useNavigate()` from `@/lib/router-compat` (wraps `useRouter`)
3. ⏳ **Data**: Mock inline arrays still present — replace with API calls per sprint
4. ⏳ **Auth**: Mock navigate handlers still present — replace with real JWT calls in Sprint 2

### 6.3 Do Not Carry Over

| Item | Reason |
|------|--------|
| MUI (`@mui/material`, `@mui/icons-material`) | Duplicate system; ~500 KB bundle cost; Radix/shadcn is the chosen standard |
| `next-themes` (unused in sample) | Wire it up properly in Next.js instead of the custom `ThemeContext` |
| `react-slick` | `embla-carousel-react` is already present and preferred |
| `react-dnd` / `react-popper` / `@popperjs/core` | No clear usage; Radix handles positioning |
| `PublicHomeVariation1.tsx`, `PublicHomeVariation2.tsx` | Dead code; `PublicHome.tsx` is the active version |
| Base vs "Enhanced" page duplicates | Always use the Enhanced version; discard originals |

---

## 7. Recommended Integration Strategy

### Phase A — Foundation Setup ✅ COMPLETE (2026-02-22)

All foundation work has been completed. See `design/sprints/ui_dev/init_dev.md` for the full change record.

**Summary of what was done:**
- 46 views migrated to `apps/web/src/views/` with `'use client'` + `@/` import paths
- 52 UI components + 8 custom components copied to `apps/web/src/components/`
- 37 Next.js App Router `page.tsx` scaffolds created
- `src/lib/router-compat.tsx` shim (React Router v7 → Next.js API mapping)
- `src/lib/utils.ts` with `cn()` helper
- Missing packages installed: `react-resizable-panels`, `react-day-picker`, `recharts`
- `globals.css` typography base layer completed (h1–h4, label, button, input defaults + wave animation)
- `npm run build` — passes with 0 errors

~~Install missing dependencies in `apps/web`:~~

```bash
# Already installed — do not re-run
```

~~Copy the UI component library:~~

```bash
# Already done
```

~~Merge theme tokens into global CSS:~~

```bash
# Already done
```

### Phase B — Per-Sprint Page Migration

For each sprint, the corresponding sample_ui page provides the **complete visual implementation**. Follow this per-page checklist:

```
[ ] Copy page file to apps/web/src/app/(routes)/<module>/page.tsx
[ ] Replace React Router <Link to=""> with Next.js <Link href="">
[ ] Replace useNavigate() with useRouter() from next/navigation
[ ] Replace useParams() with the Next.js page props pattern
[ ] Replace inline mock data const with a server component fetch or react-query hook
[ ] Remove MUI imports; confirm all component imports point to local ui/ folder
[ ] Add route protection via middleware.ts for authenticated pages
[ ] Validate forms with react-hook-form + zod schema (replacing bare onChange handlers)
```

### Phase C — Quality Gates (apply to every migrated page)

- Add `aria-label` to all icon-only buttons (identified in AUDIT.md §9.1)
- Ensure all colour references use CSS variable tokens, not hardcoded Tailwind greys
- Validate dark mode behaviour using `next-themes`
- Run Lighthouse accessibility audit (target: no WCAG AA failures)

---

## 8. Sprint-to-Page Mapping Reference

| Sprint | Key Page(s) to Migrate | Complexity |
|--------|------------------------|-----------|
| Sprint 2 — Identity & Auth | `LoginEnhanced`, `Register`, `MFASetup/Verify`, `KYCUpload`, `ProfileSetup`, `RoleSelection`, `AdminVerificationPanel` | Medium — auth mock → real JWT |
| Sprint 3 — Property Marketplace | `PublicHome`, `Listings`, `PropertyDetailEnhanced`, `AgentDashboardEnhanced`, `CreateListing` modal | Medium — listing API |
| Sprint 4 — Sales Progression | `PropertySaleWorkspace`, `BuyerDashboardEnhanced`, `ConveyancerView` | High — 14-stage state machine |
| Sprint 5 — Escrow & Payments | `EscrowFinancialDashboard` | High — financial ledger display |
| Sprint 6 — Construction | `ConstructionProjectDashboard` | High — recharts + offline indicators |
| Sprint 7 — Contractor/Supplier | `ContractorSupplierMarketplace`, `AgentProfile` | Medium |
| Sprint 8 — BOQ | `IntelligentBOQWorkspace` | High — dynamic calculations |
| Sprint 9 — Inspections | `InspectionVerificationModule` | Medium |
| Sprint 10 — Logistics | `LogisticsDeliveryMarketplace` | Medium |
| Sprint 11 — Risk & Analytics | `RiskAnalyticsDashboard` | Medium — recharts heavy |
| Sprint 12 — AI Design | `AIDesignStudio` | Low — UI shell only; AI backend deferred |

---

## 9. Known Issues to Fix During Migration

These are carried forward from the sample UI's own `AUDIT.md`:

| Priority | Issue | Status |
|----------|-------|--------|
| P0 | Auth is completely mock | ⏳ Wire to real JWT endpoints — Sprint 2 |
| P0 | No route protection | ⏳ Add `middleware.ts` — Sprint 2 |
| P1 | All data hardcoded | ⏳ Replace with API hooks per sprint |
| P1 | No code splitting | ✅ Next.js App Router handles this automatically |
| P1 | MUI co-present with Radix | ✅ Not carried over — Radix/shadcn only |
| P1 | Duplicate enhanced/base pages | ✅ Enhanced versions used; originals retained but not routed |
| P2 | Icon-only buttons lack `aria-label` | ⏳ Fix during each sprint's migration |
| P2 | Form inputs have no validation | ⏳ Add `zod` schema + `react-hook-form` per sprint |
| P2 | Dark mode FOUC | ⏳ Add inline script to `layout.tsx` — Sprint 2+ |
| P2 | CSS typography inconsistency | ✅ **Fixed** — `globals.css` base layer completed (2026-02-22) |
| P3 | Large single-file components (>400 lines) | ⏳ Break into sub-components when migrating each sprint |
| P3 | External Unsplash image URLs hardcoded | ⏳ Replace with upload service — Sprint 3+ |

---

## 10. Summary

The `sample_ui` prototype is a **high-value design asset** that provides complete visual implementations for every PRIBEC module. It is treated as the **UI source of truth** for `apps/web`.

**Phase UI-0 (2026-02-22) is complete:**
- The component library (`ui/` folder) and theme tokens are live in `apps/web`
- All 46 pages are live as Next.js App Router routes with routing shim in place
- `npm run build` passes with 0 errors

**Remaining work:** API integration and auth wiring, sprint-by-sprint. See `design/sprints/ui_dev/init_dev.md` for the full change record and `design/sprints/sprint-02-identity-auth.md` for next steps.
