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

------------------------------------------------------------------------

## 4. Contractor Routes

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
