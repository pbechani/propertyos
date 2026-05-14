# Data Model: Listings Page Anonymous Mode Padding Alignment

**Feature**: 001-listings-anon-padding  
**Date**: 2026-04-14

---

## Overview

This feature introduces no new data entities, no database schema changes,
and no new API contracts. The only "model" is a transient UI state variable
scoped to the `Listings` React component.

---

## Component State Addition

### `isAnonymous: boolean`

| Property | Detail |
|---|---|
| **Owner** | `Listings` component — local state only |
| **Type** | `boolean` |
| **Initial value** | `true` (SSR-safe anonymous default) |
| **Source of truth** | `getAccessToken()` from `@/lib/auth-session` |
| **Lifetime** | Mount → unmount of the `Listings` component |
| **Persistence** | None — not written to `sessionStorage`, cookies, or the URL |
| **Reactivity** | Set once in the existing auth `useEffect` on mount; updates if auth state changes mid-session (e.g. token cleared) |

### State Transitions

```
Server render / initial paint
  isAnonymous = true (default)
        │
        ▼
useEffect fires (client only)
        │
        ├─ getAccessToken() returns non-empty string
        │       └─► isAnonymous = false  (authenticated padding applied)
        │
        └─ getAccessToken() returns null / empty
                └─► isAnonymous = true   (anonymous padding, no change)
```

### Derived UI Values

```ts
// Forest Command Zone className
isAnonymous
  ? "container mx-auto px-6 lg:px-12 pt-8"
  : "px-4 md:px-8 pt-8"

// Results Header className (horizontal padding only)
isAnonymous ? "px-6 lg:px-12" : "px-4 md:px-6"

// Results area wrapper className (horizontal padding only)
isAnonymous ? "px-6 lg:px-12 py-4 md:py-6" : "p-4 md:p-6"
```

---

## No New Entities

| Category | Status |
|---|---|
| PostgreSQL tables | None changed |
| TypeScript interfaces / types | None added |
| API request/response shapes | None changed |
| Events / RabbitMQ messages | None added |
| `localStorage` / `sessionStorage` keys | None added |
| Environment variables | None added |
| New React contexts | None added |
| New custom hooks | None added |
