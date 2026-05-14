# Sprint 05-C — Conveyancer Enhanced: Full Lifecycle & System Architecture

A conveyancer becomes involved once a property sale moves from marketing → offer → legal transfer. Their role is to handle the **legal transfer of ownership (title)** from the seller to the buyer.

---

## Implementation Status (2026-03-13)

The following sprint-05-c features have been implemented as **sprint-05-b gap fills**:

| Feature | Tables | Service | Controller | Tests |
|---|---|---|---|---|
| Deadline management endpoints | `conveyancing.deadlines` (existing) | `CaseTasksService` (extended) | `ConveyancingCasesController` | Existing suite |
| Government department interactions | `conveyancing.government_interactions` ✅ | `GovernmentInteractionsService` ✅ | `ConveyancingCasesController` ✅ | `government-interactions.service.spec.ts` ✅ |
| Case lifecycle phase history (13-phase) | `conveyancing.case_lifecycle_history` ✅ | `GovernmentInteractionsService` ✅ | `ConveyancingCasesController` ✅ | `government-interactions.service.spec.ts` ✅ |
| Reports service + controller | — | `ReportsService` ✅ | `ReportsController` ✅ | `reports.service.spec.ts` ✅ |

**New migration:** `apps/api/prisma/migrations/20260313_sprint05c_conveyancing_gaps/migration.sql`

**New API endpoints:**
- `GET /api/v1/conveyancing/cases/:caseId/deadlines`
- `POST /api/v1/conveyancing/cases/:caseId/deadlines`
- `PATCH /api/v1/conveyancing/cases/:caseId/deadlines/:deadlineId/extend`
- `GET /api/v1/conveyancing/cases/:caseId/government-interactions`
- `POST /api/v1/conveyancing/cases/:caseId/government-interactions`
- `PATCH /api/v1/conveyancing/cases/:caseId/government-interactions/:interactionId`
- `GET /api/v1/conveyancing/cases/:caseId/lifecycle`
- `POST /api/v1/conveyancing/cases/:caseId/lifecycle/advance`
- `GET /api/v1/conveyancing/reports/turnaround`
- `GET /api/v1/conveyancing/reports/outstanding-tasks`
- `GET /api/v1/conveyancing/reports/fee-collection`
- `GET /api/v1/conveyancing/reports/caseload`

**Deferred (Phase 2+):** Full 170-table Deeds Office lodgement workflow (Part 5 Domain #11), CSV/PDF report export, AI Case Copilot integrations.

---

## Table of Contents

1. [Conveyancer Role Overview](#part-1-conveyancer-role-overview)
2. [Full Operational Workflow (75 Steps)](#part-2-full-conveyancing-workflow-75-steps)
3. [Enterprise Case Lifecycle (140 States)](#part-3-enterprise-case-lifecycle-140-states)
4. [System Architecture](#part-4-system-architecture)
5. [Enterprise Database Schema (170+ Tables)](#part-5-enterprise-database-schema-170-tables)
6. [Platform Scope](#part-6-platform-scope)

---

## Part 1: Conveyancer Role Overview

### Stage 1 — Property Is Listed for Sale

**Who is involved**
- Seller (owner)
- Real estate agent
- Brokerage

**What happens**
- Property is advertised
- Buyers view the property
- Offers are received

**Conveyancer involvement:** Usually none yet, although some sellers appoint a conveyancer early to prepare documents.

Possible early tasks:
- Confirm title deed details
- Check for bonds or restrictions
- Prepare draft sale documents

---

### Stage 2 — Offer to Purchase Is Signed _(Critical Entry Point)_

This is the moment conveyancers usually enter the process.

**Who appoints the conveyancer**
- Usually the **seller** appoints the conveyancer
- The **buyer** normally pays the conveyancing fees
- The signed Offer to Purchase (OTP) or Agreement of Sale will specify the conveyancer firm

**What the conveyancer receives**
- Signed sale agreement
- Seller details
- Buyer details
- Property details

---

### Stage 3 — Conveyancer Opens the Transfer File

The conveyancer opens a legal transfer file and starts collecting documents.

**From the Seller:**
- ID copies
- Marriage certificate (if applicable)
- Title deed
- Bond cancellation details
- Municipal clearance information

**From the Buyer:**
- ID copies
- FICA documents
- Deposit payment proof
- Bond approval (if financed)

---

### Stage 4 — Financial and Legal Checks

| Check | Description |
|---|---|
| **Title Deed Search** | Confirm the seller is the legal owner; check restrictions or servitudes |
| **Bond Cancellation** | If the seller has a mortgage, the bank appoints bond cancellation attorneys |
| **Bond Registration** | If the buyer takes a loan, the bank appoints bond attorneys |

Three legal processes often run **simultaneously**:
1. Transfer attorneys (seller's conveyancer)
2. Bond attorneys (buyer's bank)
3. Bond cancellation attorneys (seller's bank)

---

### Stage 5 — Clearance Certificates

Before transfer can occur, the conveyancer must obtain:

| Certificate | Notes |
|---|---|
| Municipal Clearance | Confirms property rates are paid |
| Tax Clearance | If required |
| Levy Clearance | If the property is in a complex |

> Without these certificates the property **cannot** transfer.

---

### Stage 6 — Drafting Transfer Documents

The conveyancer prepares:
- Transfer deed
- Affidavits
- Declarations
- Transfer duty forms
- Lodgement documents

Both buyer and seller must sign these documents.

---

### Stage 7 — Transfer Duty or VAT

The buyer must pay either:
- **Transfer duty** to the tax authority, _or_
- **VAT** (if applicable)

The conveyancer submits this to the tax authority and obtains a transfer duty receipt.

---

### Stage 8 — Lodgement at the Deeds Office

Once everything is ready, the conveyancer lodges at the Deeds Office:
- Transfer deed
- Bond documents
- Cancellation documents

All linked files must lodge together.

---

### Stage 9 — Examination Process

The Deeds Office checks:
- Legal correctness
- Title conditions
- Signatures
- Compliance with property law

> This takes several days.

---

### Stage 10 — Registration of Transfer

If everything is correct:
- Property is registered in the **buyer's name**
- Bonds are registered
- Old bonds are cancelled

> Ownership officially changes at this point.

---

### Stage 11 — Payment of Funds

After registration the conveyancer:
1. Receives funds from the buyer's bank
2. Pays off seller's bond
3. Pays estate agent commission
4. Pays seller the remaining balance

---

### Simple Transfer Timeline

```
Property listed
      ↓
Offer to Purchase signed
      ↓
Conveyancer appointed
      ↓
Documents + compliance
      ↓
Clearance certificates
      ↓
Deeds Office lodgement
      ↓
Transfer registered
      ↓
Seller receives funds
```

---

### System Modules Required

| Module | Purpose |
|---|---|
| Sale agreement management | Capture and track OTP |
| Case management | Track file throughout lifecycle |
| Document collection | Request and store all required documents |
| Compliance tracking | Certificates, FICA, KYC |
| Deeds office workflow | Lodgement and examination tracking |
| Payment disbursement | Trust accounting and fund release |
| Multi-party collaboration | Coordinate all stakeholders |

**Actors:** Seller, Buyer, Agent, Conveyancer, Bank, Municipality, Deeds Office

---

## Part 2: Full Conveyancing Workflow (75 Steps)

### Phase 1 — Sale Agreement Received

1. Estate agent submits signed Offer to Purchase (OTP)
2. Conveyancing firm is nominated in the agreement
3. Conveyancer receives instruction to attend to transfer
4. Conveyancer opens a new conveyancing file
5. Case reference number generated
6. Buyer and seller records created in the system
7. Property record created

### Phase 2 — Initial Legal Checks

8. Title deed search performed
9. Verify seller is the registered owner
10. Check property description and erf number
11. Identify servitudes or title restrictions
12. Check if property is sectional title or freehold
13. Identify any mortgage bonds registered

### Phase 3 — Seller Compliance Collection

> Seller must provide documentation.

14. Seller ID copies collected
15. Marriage status verified
16. Marriage certificate requested if applicable
17. Divorce order requested if applicable
18. Estate documents if seller is deceased estate
19. Company documents if seller is a company
20. Trust documents if seller is a trust

### Phase 4 — Buyer Compliance Collection

> Buyer must provide FICA documents.

21. Buyer ID copies collected
22. Buyer address verification obtained
23. Income or bank confirmation if required
24. Deposit confirmation obtained
25. FICA compliance verification completed

### Phase 5 — Financial Structure Confirmation

26. Confirm purchase price
27. Confirm deposit amount
28. Confirm whether buyer requires a mortgage bond

**If bond required:**

29. Buyer applies for mortgage with bank
30. Bank approves bond
31. Bank appoints bond attorneys

### Phase 6 — Bond Cancellation _(Seller Side)_

> If seller has a mortgage.

32. Seller provides bond account number
33. Conveyancer requests bond cancellation figures from bank
34. Bank appoints bond cancellation attorneys
35. Cancellation attorneys prepare bond cancellation documents

### Phase 7 — Municipal and Compliance Certificates

> Before transfer can occur the property must be cleared.

36. Request municipal rates clearance figures
37. Seller pays municipal clearance amounts
38. Municipality issues clearance certificate

Additional compliance certificates may be required:

39. Electrical compliance certificate
40. Plumbing compliance certificate
41. Gas compliance certificate
42. Beetle certificate (in some regions)

### Phase 8 — Sectional Title Clearance _(If applicable)_

43. Request levy clearance from body corporate
44. Seller pays outstanding levies
45. Body corporate issues clearance certificate

### Phase 9 — Transfer Duty

46. Conveyancer calculates transfer duty
47. Buyer pays transfer duty
48. Conveyancer submits transfer duty declaration to tax authority
49. Tax authority issues transfer duty receipt

### Phase 10 — Drafting Transfer Documents

50. Draft transfer deed
51. Draft power of attorney to transfer
52. Draft affidavits and declarations
53. Draft property transfer forms

### Phase 11 — Client Signing

54. Seller signs transfer documents
55. Buyer signs transfer documents
56. Buyer signs bond documents (if applicable)

### Phase 12 — Preparation for Lodgement

> All must be ready simultaneously.

57. Transfer documents finalized
58. Bond documents finalized
59. Bond cancellation documents finalized

### Phase 13 — Lodgement at Deeds Office

60. Conveyancer lodges transfer documents
61. Bond attorneys lodge bond documents
62. Cancellation attorneys lodge cancellation documents

> These files become **linked** in the deeds office system.

### Phase 14 — Deeds Office Examination

63. Junior examiner reviews file
64. Senior examiner reviews file
65. Registrar approval
66. _(If errors occur)_ File rejected and returned for correction

### Phase 15 — Registration

67. Property transfer is registered
68. Buyer becomes legal owner
69. Mortgage bond is registered
70. Seller's bond is cancelled

### Phase 16 — Financial Settlement

71. Bank releases mortgage funds
72. Conveyancer receives funds
73. Seller bond is paid off
74. Estate agent commission paid
75. Remaining funds paid to seller

---

### Parties Involved

**Internal Legal Roles**
- Conveyancer
- Conveyancing secretary
- Filing clerk
- Accounts department

**External Stakeholders**
- Seller, Buyer, Real estate agent
- Buyer's bank, Seller's bank
- Municipality, Tax authority, Deeds office, Body corporate

---

### What a Conveyancing Case System Must Track

| Category | Items to Track |
|---|---|
| **Legal Status** | Instruction received, documents collected, transfer duty paid, lodgement status, registration status |
| **Financial Status** | Deposit received, transfer duty paid, clearance payments, commission payments |
| **Document Status** | Sale agreement, compliance certificates, transfer documents, bond documents |

---

### AI Opportunities

| AI Component | Function |
|---|---|
| **Document Reader** | Extract data from sale agreements, title deeds, compliance certificates |
| **Compliance Checker** | Verify missing documents, expired certificates, regulatory compliance |
| **Workflow Manager** | Automatically move files through workflow stages |
| **Client Assistant** | Answer "When will my property transfer?" and "What documents are still outstanding?" |

---

## Part 3: Enterprise Case Lifecycle (140 States)

A conveyancing system should track each file as a **state machine**, where the case moves through workflow stages independently.

### Phase 1 — Case Intake _(States 1–12)_

| State | Description |
|---|---|
| 1 | Sale agreement received |
| 2 | Instruction accepted |
| 3 | Conveyancer assigned |
| 4 | Case file created |
| 5 | Property record created |
| 6 | Buyer record created |
| 7 | Seller record created |
| 8 | Estate agent record linked |
| 9 | Initial file checklist generated |
| 10 | Case priority assigned |
| 11 | Initial risk check |
| 12 | Case activated |

### Phase 2 — Legal Verification _(States 13–25)_

| State | Description |
|---|---|
| 13 | Title deed search requested |
| 14 | Title deed retrieved |
| 15 | Title verification in progress |
| 16 | Ownership confirmed |
| 17 | Property restrictions identified |
| 18 | Servitudes identified |
| 19 | Zoning verification |
| 20 | Property classification confirmed |
| 21 | Sectional title verification (if applicable) |
| 22 | Mortgage bond search |
| 23 | Legal risk analysis |
| 24 | Legal verification completed |
| 25 | Legal approval granted |

### Phase 3 — Seller Compliance _(States 26–40)_

| State | Description |
|---|---|
| 26 | Seller onboarding started |
| 27 | Seller identity verification |
| 28 | Seller FICA verification |
| 29 | Marriage regime verification |
| 30 | Spouse consent required (if applicable) |
| 31 | Divorce documentation verification |
| 32 | Estate authority verification (if deceased estate) |
| 33 | Company documentation verification |
| 34 | Trust documentation verification |
| 35 | Seller tax verification |
| 36 | Seller declaration forms issued |
| 37 | Seller documents received |
| 38 | Seller documents reviewed |
| 39 | Seller compliance approved |
| 40 | Seller compliance completed |

### Phase 4 — Buyer Compliance _(States 41–55)_

| State | Description |
|---|---|
| 41 | Buyer onboarding started |
| 42 | Buyer identity verification |
| 43 | Buyer FICA verification |
| 44 | Buyer address verification |
| 45 | Buyer financial verification |
| 46 | Deposit payment verification |
| 47 | Mortgage requirement identified |
| 48 | Buyer declarations issued |
| 49 | Buyer documentation received |
| 50 | Buyer documentation reviewed |
| 51 | Buyer compliance approval |
| 52 | Buyer compliance completed |
| 53 | Buyer financial approval |
| 54 | Buyer compliance archived |
| 55 | Buyer cleared for transfer |

### Phase 5 — Financial Structure _(States 56–68)_

| State | Description |
|---|---|
| 56 | Purchase price confirmed |
| 57 | Deposit requirement confirmed |
| 58 | Deposit payment tracking started |
| 59 | Deposit received |
| 60 | Mortgage application submitted |
| 61 | Mortgage approval pending |
| 62 | Mortgage approved |
| 63 | Bank instructions received |
| 64 | Bond attorney appointed |
| 65 | Financial compliance review |
| 66 | Financial risk review |
| 67 | Financial structure finalized |
| 68 | Finance stage completed |

### Phase 6 — Bond Cancellation _(States 69–78)_

| State | Description |
|---|---|
| 69 | Existing bond identified |
| 70 | Bond account verification |
| 71 | Bond cancellation requested |
| 72 | Bank cancellation figures issued |
| 73 | Cancellation attorneys appointed |
| 74 | Cancellation documents drafted |
| 75 | Seller signs cancellation documents |
| 76 | Cancellation documents approved |
| 77 | Bond cancellation ready for lodgement |
| 78 | Bond cancellation prepared |

### Phase 7 — Compliance Certificates _(States 79–90)_

| State | Description |
|---|---|
| 79 | Municipal clearance requested |
| 80 | Municipal figures received |
| 81 | Seller payment requested |
| 82 | Municipal payment completed |
| 83 | Municipal clearance issued |
| 84 | Electrical certificate received |
| 85 | Plumbing certificate received |
| 86 | Gas certificate received |
| 87 | Sectional title levy clearance |
| 88 | Compliance verification review |
| 89 | Compliance approved |
| 90 | Compliance stage completed |

### Phase 8 — Transfer Duty _(States 91–98)_

| State | Description |
|---|---|
| 91 | Transfer duty calculation |
| 92 | Buyer payment requested |
| 93 | Buyer payment received |
| 94 | Transfer duty declaration submitted |
| 95 | Tax authority review |
| 96 | Transfer duty receipt issued |
| 97 | Tax compliance approved |
| 98 | Tax stage completed |

### Phase 9 — Transfer Document Preparation _(States 99–110)_

| State | Description |
|---|---|
| 99 | Transfer deed drafted |
| 100 | Power of attorney drafted |
| 101 | Transfer affidavits drafted |
| 102 | Transfer forms completed |
| 103 | Seller signing scheduled |
| 104 | Seller signing completed |
| 105 | Buyer signing scheduled |
| 106 | Buyer signing completed |
| 107 | Document verification review |
| 108 | Transfer pack assembled |
| 109 | Pre-lodgement checklist completed |
| 110 | Ready for lodgement |

### Phase 10 — Deeds Office Lodgement _(States 111–118)_

| State | Description |
|---|---|
| 111 | Lodgement scheduled |
| 112 | Transfer documents lodged |
| 113 | Bond documents lodged |
| 114 | Bond cancellation documents lodged |
| 115 | Deeds office examination stage 1 |
| 116 | Deeds office examination stage 2 |
| 117 | Registrar approval |
| 118 | Registration scheduled |

### Phase 11 — Registration _(States 119–123)_

| State | Description |
|---|---|
| 119 | Transfer registered |
| 120 | Bond registered |
| 121 | Seller bond cancelled |
| 122 | Ownership updated |
| 123 | Registration confirmed |

### Phase 12 — Financial Settlement _(States 124–132)_

| State | Description |
|---|---|
| 124 | Bank releases funds |
| 125 | Conveyancer receives funds |
| 126 | Seller bond settled |
| 127 | Agent commission paid |
| 128 | Transfer costs reconciled |
| 129 | Seller payment authorized |
| 130 | Seller funds transferred |
| 131 | Financial reconciliation completed |
| 132 | Financial stage closed |

### Phase 13 — Case Closure _(States 133–140)_

| State | Description |
|---|---|
| 133 | Registration documents archived |
| 134 | Title deed delivery scheduled |
| 135 | Client notification sent |
| 136 | File audit review |
| 137 | Compliance verification final |
| 138 | File archived |
| 139 | Case closed |
| 140 | Case analytics recorded |

---

## Part 4: System Architecture

### Core System Layers

| Layer | Purpose |
|---|---|
| Case Lifecycle Engine | Controls workflow states |
| Document Management Engine | Tracks all legal documents |
| Financial Ledger | Tracks all payments |
| Compliance Engine | Ensures regulatory requirements |
| External Integrations | Banks, municipalities, government systems |
| AI Automation Layer | Document extraction, workflow predictions, compliance alerts |

### Recommended Architecture

```
Frontend
   ↓
API Gateway
   ↓
┌────────────────────────────────────────┐
│  Case Management Service               │
│  Workflow Engine                       │
│  Document Service                      │
│  Finance Service                       │
│  AI Agent Service                      │
│  Notification Service                  │
└────────────────────────────────────────┘
   ↓
PostgreSQL Cluster
Object Storage  (documents)
Search Index
```

### AI Agent Opportunities

| Agent | Function |
|---|---|
| **File Progress Agent** | Predicts when a transfer will register |
| **Document Extraction Agent** | Extracts data from sale agreements, title deeds, certificates |
| **Compliance Agent** | Flags missing or expiring requirements |
| **Communication Agent** | Automatically updates buyer, seller, and agent |

---

## Part 5: Enterprise Database Schema (170+ Tables)

### 1. Core Case Management _(20 tables)_

```
cases                  case_types             case_statuses
case_states            case_state_history     case_priorities
case_tags              case_assignments       case_teams
case_activity_log      case_notes             case_attachments
case_events            case_alerts            case_reminders
case_checklists        case_checklist_items   case_dependencies
case_audit_log         case_metrics           case_closure_reports
```

**Purpose:** Track lifecycle states, monitor workflow progress, store internal activity.

---

### 2. Parties & Participants _(11 tables)_

```
parties                party_types            party_roles
party_relationships    party_contacts         party_addresses
party_identification   party_verification     party_documents
party_notes            party_communication_preferences
```

**Examples of parties:** buyer, seller, estate agent, conveyancer, bank, municipality, body corporate, tax authority.

---

### 3. Property Data _(14 tables)_

```
properties             property_types         property_status
property_titles        property_title_conditions  property_servitudes
property_zoning        property_sections      property_complexes
property_body_corporates  property_history   property_documents
property_images        property_geodata
```

**Stores:** property title info, zoning, restrictions, sectional title information.

---

### 4. Sale Agreement Management _(10 tables)_

```
sale_agreements        sale_agreement_parties     sale_agreement_conditions
sale_agreement_clauses sale_agreement_dates       sale_agreement_documents
sale_agreement_status  sale_agreement_amendments  sale_agreement_signatures
sale_agreement_versions
```

**Tracks:** purchase price, suspensive conditions, deposits, deadlines.

---

### 5. Compliance & FICA _(11 tables)_

```
compliance_cases       compliance_requirements    compliance_status
compliance_documents   compliance_reviews         compliance_flags
compliance_audits      fica_records               fica_documents
fica_verification      fica_risk_scores
```

**Used for:** identity verification, anti-money laundering, regulatory compliance.

---

### 6. Document Management _(12 tables)_

```
documents              document_types         document_templates
document_versions      document_signatures    document_metadata
document_storage       document_permissions   document_reviews
document_status        document_requests      document_workflows
```

**Examples:** title deeds, transfer deeds, affidavits, compliance certificates.

---

### 7. Transfer Duty & Taxes _(7 tables)_

```
tax_cases                    transfer_duty_calculations   transfer_duty_payments
transfer_duty_submissions    transfer_duty_receipts       tax_authority_responses
tax_documents
```

**Tracks:** tax calculation, submission, receipt from tax authority.

---

### 8. Financial Accounting _(17 tables)_

```
accounts               account_types          trust_accounts
transactions           transaction_types      transaction_status
transaction_allocations  payments             payment_methods
payment_references     invoices               invoice_items
receipts               refunds                financial_reconciliations
commission_payments    commission_structures
```

**Tracks:** deposits, agent commissions, seller payouts, legal fees.

---

### 9. Mortgage Bonds _(11 tables)_

```
mortgage_bonds         bond_applications      bond_approvals
bond_attorneys         bond_documents         bond_conditions
bond_disbursements     bond_registrations     bond_cancellations
bond_accounts          bond_settlement_figures
```

---

### 10. Municipal & Clearance Certificates _(10 tables)_

```
clearance_requests              municipal_clearance_figures
municipal_clearance_payments    municipal_clearance_certificates
levy_clearance_requests         levy_clearance_certificates
compliance_certificates         certificate_types
certificate_expiry_tracking
```

**Certificates include:** electrical, plumbing, gas, levy clearance.

---

### 11. Deeds Office Workflow _(12 tables)_

```
lodgements             lodgement_batches      lodgement_documents
lodgement_status       lodgement_links        deeds_examinations
deeds_examiners        deeds_rejections       deeds_notes
registration_events    registration_records   title_updates
```

**Tracks:** deeds office submission, examination stages, registration.

---

### 12. Communication System _(10 tables)_

```
communications         communication_threads  communication_messages
communication_types    email_logs             sms_logs
notification_events    notification_templates notification_deliveries
client_portal_messages
```

---

### 13. Workflow Engine _(11 tables)_

```
workflow_definitions   workflow_states        workflow_transitions
workflow_rules         workflow_triggers      workflow_conditions
workflow_actions       workflow_logs          workflow_automations
workflow_sla           workflow_escalations
```

---

### 14. AI Automation Layer _(10 tables)_

```
ai_agents              ai_tasks               ai_task_results
ai_predictions         ai_document_extractions  ai_compliance_flags
ai_case_risk_scores    ai_notifications       ai_training_data
ai_feedback
```

**AI functions:** document extraction, compliance prediction, transfer delay prediction, automated communication.

---

### 15. Reporting & Analytics _(10 tables)_

```
reports                report_definitions     report_runs
report_filters         dashboards             dashboard_widgets
analytics_events       performance_metrics    firm_statistics
case_statistics
```

---

### 16. System Administration _(10 tables)_

```
users                  user_roles             permissions
role_permissions       teams                  offices
departments            api_keys               integration_connections
audit_logs
```

---

### Schema Summary

| Domain | Tables |
|---|---|
| Case management | 20 |
| Parties | 11 |
| Property | 14 |
| Sale agreements | 10 |
| Compliance | 11 |
| Documents | 12 |
| Taxes | 7 |
| Finance | 17 |
| Bonds | 11 |
| Clearances | 10 |
| Deeds office | 12 |
| Communications | 10 |
| Workflow | 11 |
| AI | 10 |
| Analytics | 10 |
| Admin | 10 |
| **Total** | **~176 tables** |

---

## Part 6: Platform Scope

A complete conveyancing platform requires **150–250 screens** covering:

| Module | Description |
|---|---|
| Case intake | Opening new transfer files |
| Sale agreement management | OTP capture and tracking |
| Document collection | Request, upload, and verify documents |
| Compliance tracking | FICA, certificates, regulatory status |
| Deeds office workflow | Lodgement, examination, and registration |
| Financial accounting | Trust accounts, disbursements, reconciliation |
| Communication portal | Multi-party messaging and notifications |
| Reporting dashboard | Firm-level analytics and KPIs |
| AI control panels | Agent monitoring, predictions, automation overrides |
