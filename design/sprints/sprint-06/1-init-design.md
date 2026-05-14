# Sprint 06 — Construction Project Management: Init Design

**Date:** 2026-03-13
**Source App:** `sample_ui/Constructionprojects-main/` (Vite + React Router 7 + Tailwind + shadcn/ui)
**Target App:** `apps/web/` (Next.js 14 App Router + Tailwind 4 + shadcn/ui)

---

## 1. Objective

Import the full Construction Project Management application from the sample UI into the Pribec web app so that:

1. It is accessible via a **"Construction"** item on the `AppSidebar` (under `selfNavigation`, already stubbed at `/construction`).
2. All existing functionality of the imported app is preserved — 37 pages, 9 data modules, all UI components.
3. The imported code is adapted to fit Pribec conventions (Next.js App Router, auth context, company context, API client, shared UI library).

---

## 2. Source App Inventory

### 2.1 Pages (37 total)

| # | Page Component | Source Route | Target Route (Next.js) |
|---|---------------|-------------|----------------------|
| 1 | `Dashboard` | `/` | `/construction` |
| 2 | `AdvancedDashboard` | `/advanced` | `/construction/advanced` |
| 3 | `ExecutiveSummary` | `/executive` | `/construction/executive` |
| 4 | `Projects` | `/projects` | `/construction/projects` |
| 5 | `CreateProject` | `/projects/new` | `/construction/projects/new` |
| 6 | `ProjectDetail` | `/projects/:id` | `/construction/projects/[id]` |
| 7 | `Tasks` | `/tasks` | `/construction/tasks` |
| 8 | `TaskDetail` | `/tasks/:id` | `/construction/tasks/[id]` |
| 9 | `Schedule` | `/schedule` | `/construction/schedule` |
| 10 | `UnifiedCalendar` | `/calendar` | `/construction/calendar` |
| 11 | `Contractors` | `/contractors` | `/construction/contractors` |
| 12 | `ContractorProfile` | `/contractors/:id` | `/construction/contractors/[id]` |
| 13 | `Budget` | `/budget` | `/construction/budget` |
| 14 | `FinancialDashboard` | `/financial` | `/construction/financial` |
| 15 | `InvoiceManagement` | `/invoices` | `/construction/invoices` |
| 16 | `Procurement` | `/procurement` | `/construction/procurement` |
| 17 | `PurchaseOrders` | `/purchase-orders` | `/construction/purchase-orders` |
| 18 | `Inventory` | `/inventory` | `/construction/inventory` |
| 19 | `DailySiteLog` | `/site-logs` | `/construction/site-logs` |
| 20 | `SitePhotoGallery` | `/site-photos` | `/construction/site-photos` |
| 21 | `Documents` | `/documents` | `/construction/documents` |
| 22 | `DocumentManagement` | `/document-management` | `/construction/document-management` |
| 23 | `RiskManagementDashboard` | `/risks` | `/construction/risks` |
| 24 | `ChangeOrderManagement` | `/change-orders` | `/construction/change-orders` |
| 25 | `AICommandCenter` | `/ai` | `/construction/ai` |
| 26 | `AIAgentDashboard` | `/ai-agent-dashboard` | `/construction/ai-agent-dashboard` |
| 27 | `Portfolio` | `/portfolio` | `/construction/portfolio` |
| 28 | `Reports` | `/reports` | `/construction/reports` |
| 29 | `ReportBuilder` | `/report-builder` | `/construction/report-builder` |
| 30 | `UserManagement` | `/user-management` | `/construction/user-management` |
| 31 | `MobileDashboard` | `/mobile-dashboard` | `/construction/mobile-dashboard` |
| 32 | `MobileSiteLog` | `/mobile-site-log` | `/construction/mobile-site-log` |
| 33 | `MobileApp` | `/mobile-app` | `/construction/mobile-app` |
| 34 | `ProjectSchedule` | `/project-schedule` | `/construction/project-schedule` |
| 35 | `NotificationsCenter` | `/notifications` | `/construction/notifications` |
| 36 | `SettingsConfiguration` | `/settings` | `/construction/settings` |
| 37 | `GlobalSearch` | `/search` | `/construction/search` |

### 2.2 Data Modules (9 files)

| File | Contents |
|------|----------|
| `data/mockData.ts` | Projects, tasks, contractors, budget, materials, notifications |
| `data/schedule.ts` | Gantt/schedule data, phases |
| `data/ai-agents.ts` | AI agent configs and insights |
| `data/invoices.ts` | Invoice records |
| `data/risks.ts` | Risk register data |
| `data/changeOrders.ts` | Change order records |
| `data/documents.ts` | Document folder/file data |
| `data/siteMonitoring.ts` | Site monitoring/IoT data |
| `data/users.ts` | User/role data |

### 2.3 Types

Single file `types/index.ts` — exports ~20 interfaces: `Project`, `Task`, `Contractor`, `PurchaseOrder`, `InventoryItem`, `FinancialData`, `Budget`, `Material`, `Risk`, `ChangeOrder`, `User`, `ScheduleTask`, `ProjectPhase`, `AIAgent`, `AIInsight`, `ChatMessage`, `AIAnalysis`, `DocumentFolder`, etc.

### 2.4 UI Components (50 shadcn/ui + 3 custom)

- **shadcn/ui (50):** accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip, utils, use-mobile
- **Custom (3):** `PermissionMatrix.tsx`, `SystemArchitecture.tsx`, `figma/ImageWithFallback.tsx`

### 2.5 Layout

`MainLayout.tsx` — full sidebar layout with 9 navigation groups, top header bar, user profile dropdown, notifications, search.

### 2.6 Key Dependencies (source app)

| Package | Source Version | Web App Has? |
|---------|---------------|-------------|
| react-router (v7) | 7.13.0 | No (uses Next.js App Router) |
| @mui/material | 7.3.5 | No |
| @mui/icons-material | 7.3.5 | No |
| recharts | 2.15.2 | Yes (2.15.2) |
| lucide-react | 0.487.0 | Yes (0.575.0) |
| react-dnd | 16.0.1 | No |
| react-dnd-html5-backend | 16.0.1 | No |
| react-slick | 0.31.0 | No |
| react-responsive-masonry | 2.7.1 | Yes |
| react-hook-form | 7.55.0 | Yes (7.71.2) |
| motion | 12.23.24 | Yes (12.34.3) |
| date-fns | 3.6.0 | Yes (4.1.0) |
| All @radix-ui/* | various | Yes (all present) |
| class-variance-authority | 0.7.1 | Yes |
| clsx | 2.1.1 | Yes |
| tailwind-merge | — | Yes |

---

## 3. Migration Strategy

### 3.1 Framework Adaptation: Vite + React Router → Next.js App Router

| Concern | Source (Vite) | Target (Next.js) | Action |
|---------|---------------|-------------------|--------|
| Routing | `react-router` `createBrowserRouter` | Next.js file-based routing | Create `app/construction/[route]/page.tsx` for each route |
| Navigation | `<Link to=...>` from `react-router` | `<Link href=...>` from `next/link` or `@/lib/router-compat` | Find-and-replace all `Link` imports |
| Route params | `useParams()` from `react-router` | `params` prop on page components | Replace `useParams()` with page props |
| Navigation | `useNavigate()` from `react-router` | `useRouter()` from `next/navigation` | Replace hook |
| Location | `useLocation()` from `react-router` | `usePathname()` from `next/navigation` | Replace hook |
| Layout | `MainLayout.tsx` with `<Outlet />` | Next.js `layout.tsx` with `{children}` | Create `app/construction/layout.tsx` |
| Client code | All components are client by default | Must add `'use client'` directive | Add directive to all interactive pages |

### 3.2 Layout Integration

**Do NOT use the source app's `MainLayout.tsx` as the shell.** The Pribec web app already has `AuthenticatedShell.tsx` + `AppSidebar.tsx` that provide the sidebar, header, notifications, and user profile. The construction module must render **inside** the existing shell.

**Create `apps/web/src/app/construction/layout.tsx`:**
- This layout provides the construction-specific **sub-navigation** (the 9 nav groups from the source `MainLayout.tsx`).
- Renders as a secondary sidebar or top-tab navigation within the main content area.
- Wraps children with any construction-specific context providers.

### 3.3 Sidebar Entry Point

The `AppSidebar.tsx` already has a "Project Management" entry in `selfNavigation` pointing to `/construction`:

```ts
{ name: 'Project Management', href: '/construction', icon: ClipboardList },
```

**Actions:**
1. Rename the sidebar entry from "Project Management" to **"Construction"** (or keep "Project Management" and add "Construction" as a separate item — user chose "Construction").
2. Update `href` to `/construction` (already correct).
3. Add a sub-menu or expandable section for key construction areas (optional, can be Phase 2).

### 3.4 Component Reuse vs. Copy

| Component Type | Strategy |
|---------------|----------|
| **shadcn/ui components** | Do NOT copy. The web app already has all 50+ shadcn/ui components in `components/ui/`. Point imports to `@/components/ui/`. |
| **Custom components** (`PermissionMatrix`, `SystemArchitecture`, `ImageWithFallback`) | Copy into `apps/web/src/components/construction/`. |
| **Page components** (37 pages) | Copy into `apps/web/src/views/construction/`. Convert from `react-router` to Next.js patterns. |
| **Data/mock files** | Copy into `apps/web/src/views/construction/data/` (temporary — will be replaced by API calls in later phases). |
| **Types** | Copy into `apps/web/src/views/construction/types/index.ts`. |

### 3.5 Dependency Additions

Packages that need to be **added** to `apps/web/package.json`:

| Package | Reason |
|---------|--------|
| `react-dnd` + `react-dnd-html5-backend` | Drag-and-drop in task boards, Gantt charts |
| `react-slick` | Photo gallery carousels |

Packages to **NOT add** (replace with existing alternatives):

| Source Package | Replacement |
|---------------|-------------|
| `@mui/material` + `@mui/icons-material` | Replace with shadcn/ui components + lucide-react icons |
| `react-router` | Remove entirely — use Next.js routing |

### 3.6 MUI Removal Plan

> **UPDATE (Implementation):** Grep analysis confirmed zero MUI imports exist in any `.tsx`/`.ts` file in the source app. Despite `@mui/material` being listed in the source `package.json`, no MUI components are actually used. This section was not needed during implementation.

~~The source app uses MUI in some pages alongside shadcn/ui. Every MUI usage must be replaced:~~

| MUI Component | shadcn/ui Replacement |
|--------------|----------------------|
| `<MuiButton>` | `<Button>` from `@/components/ui/button` |
| `<TextField>` | `<Input>` from `@/components/ui/input` |
| `<Select>` | `<Select>` from `@/components/ui/select` |
| `<Dialog>` / `<Modal>` | `<Dialog>` from `@/components/ui/dialog` |
| `<Tabs>` | `<Tabs>` from `@/components/ui/tabs` |
| `<Table>` | `<Table>` from `@/components/ui/table` |
| `<Chip>` | `<Badge>` from `@/components/ui/badge` |
| `<Tooltip>` | `<Tooltip>` from `@/components/ui/tooltip` |
| `<LinearProgress>` | `<Progress>` from `@/components/ui/progress` |
| `<Accordion>` | `<Accordion>` from `@/components/ui/accordion` |
| MUI icons (`@mui/icons-material/*`) | `lucide-react` equivalents |

---

## 4. File Structure (Target)

```
apps/web/src/
├── app/
│   └── construction/
│       ├── layout.tsx                    ← Construction sub-layout with internal nav
│       ├── page.tsx                      ← Dashboard (landing page)
│       ├── advanced/page.tsx
│       ├── executive/page.tsx
│       ├── projects/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       ├── tasks/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── schedule/page.tsx
│       ├── calendar/page.tsx
│       ├── contractors/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── budget/page.tsx
│       ├── financial/page.tsx
│       ├── invoices/page.tsx
│       ├── procurement/page.tsx
│       ├── purchase-orders/page.tsx
│       ├── inventory/page.tsx
│       ├── site-logs/page.tsx
│       ├── site-photos/page.tsx
│       ├── documents/page.tsx
│       ├── document-management/page.tsx
│       ├── risks/page.tsx
│       ├── change-orders/page.tsx
│       ├── ai/page.tsx
│       ├── ai-agent-dashboard/page.tsx
│       ├── portfolio/page.tsx
│       ├── reports/page.tsx
│       ├── report-builder/page.tsx
│       ├── user-management/page.tsx
│       ├── mobile-dashboard/page.tsx
│       ├── mobile-site-log/page.tsx
│       ├── mobile-app/page.tsx
│       ├── project-schedule/page.tsx
│       ├── notifications/page.tsx
│       ├── settings/page.tsx
│       └── search/page.tsx
│
├── views/
│   └── construction/
│       ├── Dashboard.tsx                 ← Converted page components
│       ├── AdvancedDashboard.tsx
│       ├── ExecutiveSummary.tsx
│       ├── Projects.tsx
│       ├── CreateProject.tsx
│       ├── ProjectDetail.tsx
│       ├── Tasks.tsx
│       ├── TaskDetail.tsx
│       ├── Schedule.tsx
│       ├── UnifiedCalendar.tsx
│       ├── Contractors.tsx
│       ├── ContractorProfile.tsx
│       ├── Budget.tsx
│       ├── FinancialDashboard.tsx
│       ├── InvoiceManagement.tsx
│       ├── Procurement.tsx
│       ├── PurchaseOrders.tsx
│       ├── Inventory.tsx
│       ├── DailySiteLog.tsx
│       ├── SitePhotoGallery.tsx
│       ├── Documents.tsx
│       ├── DocumentManagement.tsx
│       ├── RiskManagementDashboard.tsx
│       ├── ChangeOrderManagement.tsx
│       ├── AICommandCenter.tsx
│       ├── AIAgentDashboard.tsx
│       ├── Portfolio.tsx
│       ├── Reports.tsx
│       ├── ReportBuilder.tsx
│       ├── UserManagement.tsx
│       ├── MobileDashboard.tsx
│       ├── MobileSiteLog.tsx
│       ├── MobileApp.tsx
│       ├── ProjectSchedule.tsx
│       ├── NotificationsCenter.tsx
│       ├── SettingsConfiguration.tsx
│       ├── GlobalSearch.tsx
│       ├── data/                         ← Mock data (temporary)
│       │   ├── mockData.ts
│       │   ├── schedule.ts
│       │   ├── ai-agents.ts
│       │   ├── invoices.ts
│       │   ├── risks.ts
│       │   ├── changeOrders.ts
│       │   ├── documents.ts
│       │   ├── siteMonitoring.ts
│       │   └── users.ts
│       └── types/
│           └── index.ts
│
├── components/
│   └── construction/
│       ├── ConstructionSubNav.tsx        ← Internal sidebar/tab navigation
│       ├── PermissionMatrix.tsx
│       ├── SystemArchitecture.tsx
│       └── ImageWithFallback.tsx
```

---

## 5. Sidebar Configuration Change

In `apps/web/src/components/AppSidebar.tsx`, update `selfNavigation`:

```diff
- { name: 'Project Management', href: '/construction', icon: ClipboardList },
+ { name: 'Construction', href: '/construction', icon: HardHat },
```

Import `HardHat` from `lucide-react` (or keep `ClipboardList` if preferred).

---

## 6. Construction Sub-Navigation Design

The source app's `MainLayout.tsx` defines 9 navigation groups. These become the **construction-internal sub-navigation** rendered by `ConstructionSubNav.tsx` inside `construction/layout.tsx`:

| Group | Items |
|-------|-------|
| **Dashboards** | Dashboard, Advanced Dashboard, Executive Summary, Portfolio |
| **Project Management** | Projects, Tasks, Schedule, Project Schedule, Unified Calendar, Change Orders |
| **Financial** | Budget, Financial Dashboard, Invoices |
| **Procurement & Materials** | Procurement, Purchase Orders, Inventory |
| **Field Operations** | Contractors, Daily Site Logs, Site Photos |
| **Documents & Compliance** | Documents, Document Management, Risk Management |
| **AI & Intelligence** | AI Command Center, AI Agents |
| **Reports & Analytics** | Reports, Report Builder |
| **Administration** | User Management, Settings, Mobile App |

All `href` values are prefixed with `/construction/` (e.g., `/construction/projects`).

---

## 7. Auth & Context Integration

Every construction page must respect Pribec's auth and company context:

| Concern | How |
|---------|-----|
| **Authentication** | Pages render inside `AuthenticatedShell` (already handled by `app/layout.tsx` wrapping). Existing `ProtectedRoute` logic applies. |
| **Company Context** | The construction module reads `activeCompany` from the sidebar/context. Project ownership is scoped to the user's active company. |
| **User Roles** | Construction-specific roles (Project Owner, PM, Contractor) map to Pribec roles. The `ConstructionSubNav` conditionally shows/hides items based on role. |
| **API Client** | Replace mock data calls with `@/lib/api-client` when backend endpoints (Sprint 06 API from `sprint-06-construction-projects.md`) are ready. Mock data is kept as a fallback during Phase 1. |

---

## 8. Implementation Phases

### Phase 1: Scaffolding & Copy (this sprint init)
1. Create all route directories under `app/construction/`.
2. Copy page components into `views/construction/`, applying:
   - `'use client'` directive
   - Replace `react-router` imports with Next.js equivalents
   - Point `ui/*` imports to `@/components/ui/`
   - Replace MUI components with shadcn/ui equivalents
3. Copy data + types into `views/construction/data/` and `views/construction/types/`.
4. Copy custom components into `components/construction/`.
5. Create `construction/layout.tsx` with `ConstructionSubNav`.
6. Update `AppSidebar.tsx` — rename entry to "Construction".
7. Install `react-dnd`, `react-dnd-html5-backend`, `react-slick` if needed.
8. Verify all 37 routes render without errors.

### Phase 2: Polish & Theming
1. Ensure construction pages use Pribec's theme tokens (colors, spacing, typography).
2. Wire up the existing `ConstructionProjectDashboard.tsx` view (already at `/construction`) — either replace it with the richer imported Dashboard or merge functionality.
3. Ensure responsive behavior matches the rest of the app.
4. Add loading skeletons for pages that will later load from API.

### Phase 3: Backend Integration (future sprints)
1. Replace mock data with API calls per the endpoints in `sprint-06-construction-projects.md`.
2. Wire up project CRUD to the `construction.projects` schema.
3. Connect milestone payments to Sprint 05 escrow service.
4. Implement real file upload for progress entries & media.

---

## 9. Existing Code to Preserve

The current `apps/web/src/views/ConstructionProjectDashboard.tsx` is a simpler single-page construction view. Options:
- **Option A (recommended):** Replace `/construction` page.tsx export with the richer imported `Dashboard.tsx` and archive the old view.
- **Option B:** Keep the old view as a "quick overview" widget and integrate it into the imported Dashboard.

---

## 10. Risk & Considerations

| Risk | Mitigation |
|------|-----------|
| MUI components deeply embedded in page code | Systematic page-by-page conversion; grep for `@mui` to track progress |
| `react-router` hooks spread across all pages | Global find-replace with manual verification |
| Mock data diverges from actual API schema | Types file aligned with `sprint-06-construction-projects.md` schema; adapters added where needed |
| 102 source files is a large copy | Batch by category: UI components (skip — reuse existing), data, types, pages |
| Source uses Vite `@` alias → Next.js also uses `@` alias | No change needed; both alias to `src/` |

---

## 11. Acceptance Criteria

- [ ] Sidebar shows "Construction" menu item; clicking navigates to `/construction`
- [ ] `/construction` renders the full construction Dashboard page
- [ ] All 37 sub-routes accessible and rendering
- [ ] No `@mui/*` imports remain in construction code
- [ ] No `react-router` imports remain in construction code
- [ ] Construction sub-navigation allows moving between all sections
- [ ] Auth-protected: unauthenticated users redirected to login
- [ ] Existing web app functionality unchanged (no regressions)
- [ ] `npx tsc --noEmit` passes with no new errors
- [ ] All existing tests pass