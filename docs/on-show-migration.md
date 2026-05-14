# On Show Migration Design Doc

**Date:** 2025-07-15  
**Status:** Implemented  
**Author:** AI / GitHub Copilot

---

## Overview

Consolidate the 9 "Open Houses" sidebar sub-menu items into a single tabbed page at `/app/on-show`.  
Rename the sidebar nav item from "Open Houses" → "On Show".  
All existing deep-link routes redirect to the new page with the appropriate `?tab=` query parameter.

---

## Motivation

- The sidebar "Open Houses" group had 9 collapsible sub-links, cluttering the nav.
- All sub-pages are logically one feature area — a unified tabbed view reduces friction.
- Naming: "On Show" is the industry term agents use; "Open Houses" was too literal.

---

## Route Migration Table

| Old Route | New Route |
|---|---|
| `/app/open-houses` | `/app/on-show` |
| `/app/open-houses/dashboard` | `/app/on-show?tab=dashboard` |
| `/app/open-houses/properties` | `/app/on-show?tab=properties` |
| `/app/open-houses/events` | `/app/on-show?tab=on-show` |
| `/app/open-houses/leads` | `/app/on-show?tab=leads` |
| `/app/open-houses/marketing` | `/app/on-show?tab=marketing` |
| `/app/open-houses/workflows` | `/app/on-show?tab=workflows` |
| `/app/open-houses/tasks` | `/app/on-show?tab=tasks` |
| `/app/open-houses/analytics` | `/app/on-show?tab=analytics` |
| `/app/open-houses/settings` | `/app/on-show?tab=settings` |

---

## File Inventory

| File | Action | Notes |
|---|---|---|
| `apps/web/src/app/app/on-show/page.tsx` | **Create** | New hub page: forest header + KPI strip + 9 tabs |
| `apps/web/src/app/app/open-houses/page.tsx` | **Edit** | Redirect → `/app/on-show` |
| `apps/web/src/app/app/open-houses/dashboard/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=dashboard` |
| `apps/web/src/app/app/open-houses/properties/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=properties` |
| `apps/web/src/app/app/open-houses/events/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=on-show` |
| `apps/web/src/app/app/open-houses/leads/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=leads` |
| `apps/web/src/app/app/open-houses/marketing/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=marketing` |
| `apps/web/src/app/app/open-houses/workflows/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=workflows` |
| `apps/web/src/app/app/open-houses/tasks/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=tasks` |
| `apps/web/src/app/app/open-houses/analytics/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=analytics` |
| `apps/web/src/app/app/open-houses/settings/page.tsx` | **Edit** | Redirect → `/app/on-show?tab=settings` |
| `apps/web/src/components/AppSidebar.tsx` | **Edit** | Remove `openHousesNavigation`, `showOpenHouses`, both collapsible blocks; add single flat "On Show" link |
| `apps/web/src/views/open-houses/OHOpenHousesView.tsx` | **Edit** | H2 "Open Houses" → "On Show" |
| `apps/web/src/views/open-houses/OHDashboardView.tsx` | **Edit** | "Upcoming Open Houses" → "Upcoming On Show Events", error text |
| `apps/web/src/views/open-houses/OHMarketingView.tsx` | **Edit** | KPI label + empty state text |
| `apps/web/src/views/open-houses/OHAnalyticsView.tsx` | **Edit** | Chart title "Open Houses" → "On Show" |

---

## Sidebar Changes

### Removed
- `openHousesNavigation` const array (9 entries)
- `showOpenHouses` useState
- Desktop collapsible "Open Houses" `<div><button>…</button>{showOpenHouses && …}</div>`
- Mobile collapsible "Open Houses" `<div><button>…</button>{showOpenHouses && …}</div>`

### Added (both desktop and mobile)
Single flat `<Link href="/app/on-show">On Show</Link>` with `DoorOpen` icon,
matching the visual style of adjacent links.

---

## New Page Design

`/app/on-show/page.tsx` — `'use client'` + Suspense boundary for `useSearchParams()`

**Header:** Forest (`#1A3C28`) background, terra eyebrow label, Fraunces h1 "On Show", mono subtitle.  
**Decorative circles:** Terra blob top-right, egreen blob bottom-centre (matching calendar pattern).  
**KPI strip:** 5 cells — Active Properties (egreen), Events This Week (parchment), Leads Captured (gold), Active Workflows (parchment), Pending Tasks (amber).  
**Tab bar:** 9 horizontal tabs along the bottom of the forest header. Active: terra background. Inactive: transparent with muted parchment text.  
**Tab content:** Renders existing `OHDashboardView`, `OHPropertiesView`, `OHOpenHousesView`, etc. views unchanged — just wired into tabs.

---

## Backward Compatibility

All old `/app/open-houses/*` URLs remain valid and return `next/navigation` `redirect()` to the corresponding `?tab=` URL. No broken links.
