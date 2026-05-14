# Platform Navigation Routing Map

------------------------------------------------------------------------

## 1. Public (Unauthenticated)

/ ├── /pricing ├── /about ├── /trust ├── /contact ├── /login ├──
/register ├── /forgot-password └── /reset-password

------------------------------------------------------------------------

## 2. Authenticated App Root

/app ├── /dashboard ├── /notifications ├── /messages └── /settings

------------------------------------------------------------------------

## 3. Buyer Routes

Base: /app/buyer

/app/buyer ├── /dashboard ├── /properties │ ├── / │ ├── /map │ ├──
/saved │ └── /:propertyId │ ├── /overview │ ├── /documents │ ├──
/ownership │ ├── /risk │ └── /make-offer ├── /transactions │ └──
/:transactionId │ ├── /timeline │ ├── /documents │ ├── /escrow │ ├──
/communication │ └── /completion ├── /build │ ├──
/contractors/:contractorId │ ├── /boq/:boqId │ ├── /rfq/:rfqId │ └──
/projects/:projectId ├── /compliance │ ├── /inspections │ └──
/certificates └── /lifecycle ├── /maintenance ├── /warranty ├── /rental
└── /roi

Current implemented marketplace routes (web app):

- `/app/listings` → Listings page
- `/app/property/:propertyId` → Property detail (`PropertyDetailEnhanced`)
- `/service-providers` → Service provider marketplace (`ServiceProviderMarketplace`)
- `/agent-profile/:agentId` → Agent profile (`AgentProfile`)
- Navigation flow: selecting a property from listings (cards and map pins) opens `/app/property/:propertyId`
- Comparison and agent listing actions also navigate to `/app/property/:propertyId`
- Agent profile can receive a `back` query path to return users to the originating property detail screen (e.g. `/agent-profile/:agentId?back=/app/property/:propertyId`)

Current implemented account routes (web app):

- `/change-password` → Authenticated password change
- `/role-setup` → Post-registration role setup flow (canonical)
- `/profile-setup` → Legacy alias to `role-setup` for backward compatibility

Current implemented company management routes (web app):

- `/company/dashboard` → Company dashboard (`CompanyDashboard`) — stats, activity feed, quick actions
- `/company/profile` → Company profile & verification (`CompanyProfile`)
- `/company/users` → Member management table (`CompanyUserManagement`)
- `/company/users/invite` → Invite member form (`CompanyInviteUser`)
- `/company/admins` → Admin management (`CompanyAdminManagement`)
- `/company/permissions` → Permission matrix editor (`CompanyPermissions`)
- `/company/activities` → Activity / audit log (`CompanyActivityLogs`)
- `/company/revoked-pool` → Revoked-member orphaned task pool (`CompanyRevokedPool`)

All `/company/*` routes are protected by the authenticated shell (shared left navbar + top header). Routes outside this prefix that share the word "company" — `/company-context-select` and `/company-registration` — are **not** included. `/company-registration` renders inside the shell; `/company-context-select` is a **standalone** screen with no shell and no top HomeNavbar.

**Authenticated shell route policy (`AUTH_SHELL_ROUTE_PREFIXES`):**

The following route prefixes render inside the shared shell (left sidebar + top header) when the user is authenticated. Defined in `apps/web/src/lib/route-policy.ts`.

| Prefix | Description |
|---|---|
| `/app` | Core app (dashboard, listings, property detail) |
| `/admin` | Platform admin |
| `/agent` | Agent views |
| `/agent-profile` | Agent public profile |
| `/ai-design-studio` | AI Design Studio |
| `/boq-workspace` | BOQ Workspace |
| `/buyer` | Buyer views |
| `/buyer-dashboard` | Buyer dashboard |
| `/buyer-flow` | Buyer guided flow |
| `/buyer-workspace` | Buyer workspace |
| `/change-password` | Authenticated password change |
| `/company` | All company management (`/company/*`) |
| `/company-registration` | New company registration |
| `/company-role-selector` | Role selector (post-login role picker) |
| `/construction` | Construction / Project Management |
| `/contractor-supplier-marketplace` | Contractor & supplier marketplace |
| `/conveyancer` | Conveyancer views |
| `/escrow` | Escrow & financial |
| `/fraud-report` | Fraud reporting |
| `/inspection-verification` | Inspection & verification |
| `/invitations` | Invitation acceptance |
| `/kyc-upload` | KYC document upload |
| `/logistics-delivery-marketplace` | Logistics & delivery marketplace |
| `/profile-dashboard` | Profile / account dashboard |
| `/profile-setup` | Legacy alias for role setup |
| `/properties` | Property listings / search |
| `/property-lifecycle` | Property lifecycle |
| `/risk-analytics` | Risk & analytics |
| `/role-selection` | Post-login role selection |
| `/role-setup` | Post-registration role setup |
| `/service-providers` | Service providers marketplace |
| `/workspace` | Property workspace |

**No-navbar routes (`NO_NAVBAR_ROUTES`):**

The top `HomeNavbar` is suppressed entirely (regardless of auth state) on these standalone pages. Defined in `apps/web/src/lib/route-policy.ts`.

| Route | Reason |
|---|---|
| `/login` | Standalone auth page — branded with PropertyOS logo only |
| `/company-context-select` | Standalone company picker — branded with PropertyOS logo only |

**Company context selector (standalone, no shell, no HomeNavbar):**

- `/company-context-select` → Multi-company picker (`CompanyContextSelect`) — shown after login when `requires_context_selection = true`, and accessible mid-session via the sidebar "Switch Company / Role" action. Displays the PropertyOS logo (matching login page branding) instead of a shell header.
- `/company-registration` → New company registration form (`CompanyRegistration`) — renders inside the authenticated shell.

**Self company context — sidebar navigation:**

When the authenticated user's active company is the built-in Self system company (`slug === 'self'`), the left sidebar renders a personal navigation set. Real-company contexts render the company navigation set.

| Context | Navigation items |
|---|---|
| **Self** | My Dashboard · Listings · Service Providers · Project Management · Safety · Analytics |
| **Company** | My Dashboard · Listings · Home · Agent Dashboard · Safety · Analytics |

After selecting Self from the company picker, the user is redirected to `/app/my-dashboard` (not `/company/dashboard`). Direct navigation to `/company/dashboard` while a Self context is active also redirects to `/app/my-dashboard`.



------------------------------------------------------------------------

## 4. Service Provider Routes

Base: /app/contractor

/app/contractor ├── /dashboard ├── /marketplace │ ├── /rfqs │ ├──
/rfqs/:rfqId │ └── /contracts/:contractId ├── /projects/:projectId │ ├──
/overview │ ├── /milestones │ ├── /boq │ ├── /documents │ ├── /progress
│ └── /inspection-requests ├── /procurement │ ├── /suppliers │ ├──
/orders │ └── /deliveries ├── /performance │ ├── /ratings │ ├──
/analytics │ └── /risk-score └── /profile

------------------------------------------------------------------------

## 5. Supplier Routes

Base: /app/supplier

/app/supplier ├── /dashboard ├── /catalog │ ├── / │ ├── /new │ └──
/:productId ├── /orders │ ├── / │ ├── /:orderId │ └── /quotes/:quoteId
├── /inventory ├── /analytics └── /profile

------------------------------------------------------------------------

## 6. Logistics Routes

Base: /app/logistics

/app/logistics ├── /dashboard ├── /jobs │ ├── /available │ ├──
/active/:jobId │ └── /history ├── /tracking/:deliveryId ├── /fleet │ ├──
/vehicles │ └── /drivers ├── /performance └── /profile

------------------------------------------------------------------------

## 7. Inspector Routes

Base: /app/inspector

/app/inspector ├── /dashboard ├── /inspections │ ├── /scheduled │ └──
/:inspectionId │ ├── /checklist │ ├── /photos │ ├── /notes │ └── /result
├── /certificates └── /history

------------------------------------------------------------------------

## 8. Finance & Escrow (Shared)

Base: /app/finance

/app/finance ├── /escrow/:escrowId │ ├── /overview │ ├── /transactions │
├── /approvals │ └── /release ├── /ledger ├── /statements └──
/commissions

------------------------------------------------------------------------

## 9. AI Layer

Base: /app/ai

/app/ai ├── /assistant ├── /design │ ├── /new │ └── /:designId │ ├── /2d
│ ├── /3d │ ├── /budget │ ├── /compliance │ └── /export ├──
/document-analysis/:analysisId └── /history

------------------------------------------------------------------------

## 10. Admin Routes

Base: /admin

/admin ├── /dashboard ├── /users/:userId ├── /properties ├──
/verifications │ ├── /users │ ├── /contractors │ └── /properties ├──
/transactions ├── /fraud │ ├── /alerts │ └── /cases/:caseId ├──
/analytics ├── /integrations └── /system
