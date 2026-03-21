# Sprint 05-D: Open House Management System

> **Module Overview:** Full lifecycle management for open house events — from preparation and marketing through lead capture, automation, AI-driven follow-up, and deployment architecture.

---

## Table of Contents

1. [Open House Preparation Workflow](#1-open-house-preparation-workflow)
2. [Screen-by-Screen UI Design & Figma Prompt Pack](#2-screen-by-screen-ui-design--figma-prompt-pack)
3. [Workflow Automation Builder](#3-workflow-automation-builder)
4. [200+ Screen Deep Expansion](#4-200-screen-deep-expansion)
5. [Backend Architecture & Database Schema](#5-backend-architecture--database-schema)
6. [Event Bus & Queue Infrastructure](#6-event-bus--queue-infrastructure)
7. [Multi-Tenant SaaS Architecture](#7-multi-tenant-saas-architecture)
8. [Real Estate Data Model Expansion](#8-real-estate-data-model-expansion)
9. [AI Agent Layer](#9-ai-agent-layer)
10. [Fine-Tuning & Custom Model Strategy](#10-fine-tuning--custom-model-strategy)
11. [Prompt Engineering System](#11-prompt-engineering-system)
12. [Agent-to-Agent Communication Protocols](#12-agent-to-agent-communication-protocols)
13. [Microservices Deployment](#13-microservices-deployment)
14. [Frontend Architecture](#14-frontend-architecture)
15. [MVP Build Plan (30–60 Days)](#15-mvp-build-plan-3060-days)
16. [Clickable Product Flow & User Journeys](#16-clickable-product-flow--user-journeys)

---

## 1. Open House Preparation Workflow

Preparing for an open house is one of the most operationally dense parts of a real estate agent's workflow. It combines marketing, property readiness, logistics, and buyer experience design.

### 1.1 Property Preparation (Physical Readiness)

**Cleaning & Maintenance**

- Deep cleaning (floors, windows, kitchens, bathrooms)
- Fix minor defects (leaky taps, cracked tiles, squeaky doors)
- Ensure all lights, appliances, and utilities work

**Staging**

- Declutter and depersonalize (remove family photos, excess furniture)
- Arrange furniture to maximize space and flow
- Add neutral décor (plants, cushions, artwork)

**Exterior / Curb Appeal**

- Lawn mowing, gardening, landscaping
- Clean driveway, entrance, and signage visibility
- Paint touch-ups if needed

### 1.2 Marketing Asset Creation

**Visual Content**

- Professional photography (interior + exterior)
- Video walkthroughs
- Drone shots (if applicable)
- Virtual tours (360°)

**Listing Content**

- Write compelling property description
- Highlight key selling points (location, features, amenities)
- Prepare brochures/flyers (printed + digital)

### 1.3 Marketing & Promotion

**Online Promotion**

- Upload listing to property portals
- Share on social media platforms
- Email campaigns to buyer database
- WhatsApp broadcasts (common in many markets)

**Offline Promotion**

- Install "For Sale" and "Open House" signage
- Directional signs on nearby roads
- Notify neighborhood (can attract word-of-mouth buyers)

### 1.4 Scheduling & Logistics

- Choose optimal date and time (e.g., weekends, mid-morning)
- Coordinate with seller/occupants
- Ensure property is accessible (keys, security, alarms)
- Prepare backup plans (weather, power outages)

### 1.5 Documentation & Compliance

- Property disclosure forms
- Mandate/listing agreement
- Compliance certificates (varies by country)
- Offer forms ready for interested buyers

### 1.6 Buyer Experience Preparation

**On-Site Setup**

- Sign-in sheet or digital registration system
- Printed brochures
- Feature sheets or spec sheets
- Light refreshments (optional but effective)

**Sales Preparation**

- Prepare talking points / property pitch
- Know comparable sales in the area
- Anticipate buyer questions (pricing, utilities, neighborhood)

### 1.7 Lead Capture System Setup

- CRM ready to capture visitor details
- QR codes for digital sign-in
- Follow-up automation (email/SMS sequences)
- Tag leads by interest level (hot/warm/cold)

### 1.8 Risk & Security Planning

- Remove or secure valuables
- Lock restricted areas
- Plan visitor flow (avoid overcrowding)
- Process for verifying serious buyers (optional)

### 1.9 AI & Tech Preparation

**AI-Driven Enhancements**

- AI-generated listing descriptions
- Predictive analytics for best open house timing
- Targeted ad optimization
- Chatbots answering buyer questions pre-event

**Smart Tools**

- Digital check-in apps
- Automated follow-up sequences
- Virtual staging tools
- Heatmaps (visitor attention tracking)

### 1.10 Pre-Event Final Walkthrough

- Turn on lights and open curtains
- Adjust temperature (comfortable environment)
- Eliminate odors (cooking, pets, dampness)
- Play soft background music (optional)
- Ensure everything is spotless

### System Design Insight

The entire preparation process can be modeled as an **Open House Preparation Workflow Engine** with:

- Task checklist automation
- Role-based assignments (agent, photographer, cleaner, stager)
- Timeline triggers (T-7 days, T-1 day, T-1 hour)
- AI suggestions per property type
- Integration with CRM + marketing channels

---

## 2. Screen-by-Screen UI Design & Figma Prompt Pack

### Overview

This module manages the full lifecycle of an open house: Preparation, Marketing, Execution, Lead capture, Follow-up.

**Design Modes:** Simple Mode (quick actions) | Advanced Mode (full workflow + analytics)

### Core Navigation Structure

- Dashboard
- Properties
- Open Houses
- Leads
- Marketing
- Tasks
- Analytics
- Settings

---

### Screen 1: Open House Dashboard

**Purpose:** Central command center

**UI Components:**
- Upcoming Open Houses (card list)
- Today's Schedule (timeline view)
- Lead Capture Summary
- Task Completion Progress
- Alerts (e.g., missing photos, low RSVPs)

> **Figma Prompt:** "Design a modern real estate dashboard with cards showing upcoming open houses, a timeline schedule, lead metrics, and task progress. Use clean grid layout, soft shadows, rounded cards, minimal color palette, toggle for simple vs advanced mode."

---

### Screen 2: Open House List View

**UI Components:**
- Table/Grid toggle
- Property image thumbnail
- Date & time
- Status badge (Draft / Scheduled / Live / Completed)
- RSVP count
- Actions (Edit, Duplicate, Cancel)

**Filters:** Date range | Status | Agent

> **Figma Prompt:** "Design a property open house list view with table and card toggle, filters on top, status badges, and quick action buttons. Clean SaaS UI style."

---

### Screen 3: Create Open House (Wizard)

**Step 1 — Select Property:** Search property, Quick preview card

**Step 2 — Schedule:** Date picker, Time slots, Duration

**Step 3 — Setup Experience:** Enable refreshments toggle, Virtual tour toggle, Guided tour option

**Step 4 — Marketing:** Auto-generate description (AI button), Select channels (portal, social, email)

**Step 5 — Review & Publish:** Summary screen

> **Figma Prompt:** "Design a multi-step wizard for creating an open house with progress bar, clean form layout, toggles, and AI generate buttons. Minimal and modern UI."

---

### Screen 4: Preparation Task Board

**UI Components:**
- Kanban board: To Do | In Progress | Completed
- Task types: Cleaning, Staging, Photography, Marketing
- Features: Assign users, Due dates, AI suggested tasks

> **Figma Prompt:** "Design a kanban task board for real estate preparation tasks with draggable cards, assignees, due dates, and status columns."

---

### Screen 5: Media Management Screen

**UI Components:** Upload area (drag & drop), Gallery grid, AI enhancement button, Tagging (kitchen, exterior, bedroom)

> **Figma Prompt:** "Design a media management interface with image grid, upload zone, tagging system, and AI enhance button."

---

### Screen 6: Marketing Campaign Builder

**Sections:** Audience targeting, Channel selection, Budget (optional ads), Preview (email/social post)

**AI Features:** Generate captions, Suggest audience

> **Figma Prompt:** "Design a campaign builder with audience filters, channel toggles, preview panel, and AI content generation buttons."

---

### Screen 7: Open House Detail Page

**Sections:** Property Overview | Schedule | Task Progress | Marketing Status | RSVP List | Notes

**Actions:** Edit | Share link | Duplicate

> **Figma Prompt:** "Design a detailed property open house page with tabs for overview, tasks, marketing, and RSVPs."

---

### Screen 8: Digital Sign-In Screen (Tablet Mode)

**UI Components:** Full-screen form, Name/phone/email fields, Buyer intent (dropdown), Consent checkbox, Large touch-friendly inputs

> **Figma Prompt:** "Design a tablet-friendly sign-in screen with large inputs, minimal distractions, and clean layout."

---

### Screen 9: Lead Management Screen

**UI Components:** Lead list, Tags (hot/warm/cold), Interaction timeline

**Actions:** Call | Email | Schedule viewing

> **Figma Prompt:** "Design a CRM-style lead management screen with list view, tags, and activity timeline."

---

### Screen 10: Follow-Up Automation Screen

**UI Components:** Workflow builder (if/then), Email/SMS templates, Timing delays

**Example Flow:** Day 0: Thank you message | Day 2: Reminder | Day 5: Offer prompt

> **Figma Prompt:** "Design a workflow automation builder with nodes and connections for follow-up sequences."

---

### Screen 11: Analytics Dashboard

**Metrics:** Attendance | Conversion rate | Leads generated | Marketing ROI

**Visuals:** Charts | Funnel view

> **Figma Prompt:** "Design an analytics dashboard with charts, conversion funnel, and KPI cards."

---

### Screen 12: Settings

**Sections:** Default templates | Notification preferences | Branding

> **Figma Prompt:** "Design a clean settings page with grouped sections and toggles."

---

### Advanced Mode Features

- AI recommendations panel
- Predictive attendance scoring
- Smart scheduling suggestions
- Heatmaps (visitor movement)

> **Figma Prompt:** "Design an advanced analytics panel with AI insights, predictions, and heatmaps in a modern UI."

---

### Design System Notes

| Category | Specification |
|----------|--------------|
| Style | Minimal, modern SaaS |
| Border radius | `2xl` (rounded corners) |
| Shadows | Soft |
| Layout | Grid |
| Base colors | White/Gray neutral |
| Accent | Brand color |

**Components:** Cards, Tabs, Modals, Toggles, Chips (tags)

---

## 3. Workflow Automation Builder

A well-designed Workflow Automation Builder turns the open house module into a revenue engine — a visual rule engine + automation orchestrator.

> **Core Concept:** "When X happens → do Y after Z time → under certain conditions"
>
> Use cases: Lead nurturing, follow-ups, internal task automation, notifications, deal acceleration.

### 3.1 Main Layout

| Area | Content |
|------|---------|
| Left Sidebar | Workflow list, Templates, Folders (Buyers/Sellers/Open Houses) |
| Center Canvas | Node-based visual editor (drag & drop) |
| Right Panel | Configure selected node (conditions, delays, templates) |
| Top Bar | Workflow name, Status (Draft/Active), Test/Publish buttons |

### 3.2 Node Types

**Trigger Nodes (Start):**
- Open House RSVP created
- Visitor signed in
- Open house ended
- Lead marked "Hot"
- No response after X days

**Condition Nodes (Logic):**
- If lead type = Buyer
- If budget > $100k
- If attended open house = Yes
- If email opened
- Output: YES → path A | NO → path B

**Delay Nodes (Timing):**
- Wait 2 hours / 1 day / until specific date

**Action Nodes:**

| Category | Actions |
|----------|---------|
| Communication | Send Email, Send SMS, Send WhatsApp |
| CRM | Tag lead, Assign agent, Create task |
| Sales | Schedule viewing, Send offer form, Notify agent |

**Loop / Smart Nodes:** Repeat until response, Stop if condition met, AI decision node

> **Figma Prompt:** "Design a modern workflow automation builder with a drag-and-drop node canvas, left sidebar for triggers/actions, and right configuration panel. Include connected nodes with lines, condition branching, and delay blocks. Clean SaaS UI, grid layout, soft shadows, rounded cards, and minimal color palette."

### 3.3 Example Workflows

**Workflow 1: Open House Follow-Up**
1. Trigger: Visitor signs in
2. Send "Thank You" SMS immediately
3. Wait 1 day → Send email with property brochure
4. Condition: If clicked → tag "Interested" | Else → send reminder
5. Wait 3 days → Notify agent to call

**Workflow 2: Hot Lead Acceleration**
1. Trigger: Lead tagged "Hot"
2. Assign senior agent
3. Send priority message
4. Schedule viewing automatically
5. Notify via push notification

**Workflow 3: Cold Lead Re-engagement**
1. Trigger: No activity for 14 days
2. Send "Still interested?" email
3. Offer similar properties
4. If no response → downgrade lead

### 3.4 Right Panel (Node Config UI)

**Email Node:** Template selector, Personalization variables (`{{name}}`, `{{property_address}}`), Send from (agent/team), Preview panel

**Condition Node:** Field selector, Operator (`=`, `>`, `contains`), Value input, Add multiple conditions (AND/OR)

### 3.5 AI-Powered Features

**AI Workflow Generator:** User describes goal → AI generates full workflow automatically.

**Smart Suggestions:** "Most agents send follow-up within 2 hours" | "Leads like this convert better with SMS first"

**Optimization Engine:** Suggest best send times, Suggest message improvements, Predict conversion probability

### 3.6 Testing & Debugging

- "Run Test Workflow" with simulated lead
- Step-by-step execution log
- Status per step: Success | Failed | Skipped

### 3.7 Analytics Per Workflow

- Conversion rate
- Drop-off points (where leads stop responding)
- Message open/click rates
- Time-to-conversion

### 3.8 Backend Architecture

| Component | Responsibility |
|-----------|---------------|
| Workflow Engine | Executes nodes sequentially, handles delays |
| Event Bus | Listens for triggers (`lead_created`) |
| Task Queue | Runs async jobs (emails, SMS) |
| State Manager | Tracks where each lead is in the workflow |

**Data Model:** `workflows` | `workflow_nodes` | `workflow_edges` | `workflow_runs` | `workflow_logs`

### 3.9 Advanced Features (Enterprise)

- Multi-workflow orchestration
- Cross-property workflows
- Team-based workflows
- SLA tracking (e.g., respond within 1 hour)
- A/B testing (two message variants)

---

## 4. 200+ Screen Deep Expansion

Full enterprise-grade expansion of the Workflow Automation Builder.

### Screen Group Index

| Group | Count |
|-------|-------|
| Workflow Builder Core | 25 |
| Templates & Library | 15 |
| Node Configuration | 30 |
| Testing & Debugging | 15 |
| Analytics & Optimization | 15 |
| Lead Journey Tracking | 10 |
| Mobile Experience | 25 |
| Edge Case Handling | 20 |
| Admin & Governance | 20 |
| Integrations & APIs | 15 |
| AI Control Center | 10 |
| **Total** | **200+** |

### Group 1: Workflow Builder Core (25 Screens)

1. Builder Home — 2. Empty State — 3. Workflow List (Table) — 4. Workflow List (Card) — 5. Create Workflow Modal — 6. Builder Canvas (Blank) — 7. Builder Canvas (Populated) — 8. Node Drag State — 9. Edge Connection State — 10. Multi-branch View — 11. Zoomed Out Map View — 12. Mini-map Navigation — 13. Node Context Menu — 14. Bulk Node Selection — 15. Copy/Paste Nodes — 16. Undo/Redo History Panel — 17. Workflow Settings Panel — 18. Save Draft State — 19. Publish Confirmation — 20. Version History Viewer — 21. Compare Versions — 22. Duplicate Workflow Screen — 23. Archive Workflow Screen — 24. Folder Management — 25. Search Workflows

### Group 2: Templates & Library (15 Screens)

1. Template Marketplace — 2. Template Preview — 3. Template Categories — 4. Template Filters — 5. Template Import — 6. Template Clone — 7. Template Editor — 8. Save as Template — 9. Team Templates — 10. Global Templates — 11. Recommended Templates (AI) — 12. Recently Used Templates — 13. Template Performance Stats — 14. Template Versioning — 15. Template Permissions

### Group 3: Node Configuration (30 Screens)

1. Email Node Config — 2. SMS Node Config — 3. WhatsApp Node Config — 4. Push Notification Config — 5. Task Creation Node — 6. Agent Assignment Node — 7. Tagging Node — 8. Condition Builder (Simple) — 9. Condition Builder (Advanced Logic) — 10. Delay Node Config — 11. Date/Time Trigger Config — 12. Webhook Node Config — 13. API Call Node Config — 14. CRM Update Node — 15. Property Recommendation Node — 16. Calendar Booking Node — 17. File Attachment Node — 18. Multi-condition AND/OR UI — 19. Nested Conditions UI — 20. Loop Node Config — 21. Exit Node Config — 22. AI Decision Node Config — 23. Personalization Variables Panel — 24. Template Editor Inline — 25. Preview Message Screen — 26. Error Handling Config — 27. Retry Logic Config — 28. Fallback Path Config — 29. Node Validation Errors — 30. Node Dependency Warnings

### Group 4: Testing & Debugging (15 Screens)

1. Test Workflow Setup — 2. Select Test Lead — 3. Simulation Run View — 4. Step Execution Timeline — 5. Node-by-Node Logs — 6. Error Highlight Mode — 7. Failed Node Details — 8. Retry Execution Screen — 9. Debug Mode Toggle — 10. Live Execution Monitor — 11. Historical Runs List — 12. Run Detail View — 13. Export Logs Screen — 14. Performance Timing View — 15. Simulation Comparison

### Group 5: Analytics & Optimization (15 Screens)

1. Workflow Overview Analytics — 2. Conversion Funnel View — 3. Drop-off Heatmap — 4. Message Performance — 5. Node Performance Ranking — 6. Time-to-Conversion Graph — 7. Channel Comparison (SMS vs Email) — 8. A/B Test Results — 9. Engagement Timeline — 10. ROI Dashboard — 11. Lead Quality Scoring Impact — 12. Cohort Analysis — 13. Geographic Performance — 14. Device Performance — 15. Optimization Suggestions (AI)

### Group 6: Lead Journey Tracking (10 Screens)

1. Lead Journey Timeline — 2. Workflow Path Visualization — 3. Multi-workflow Overlap View — 4. Interaction History — 5. Communication Log — 6. Lead State Transitions — 7. Engagement Score Evolution — 8. Manual Intervention Screen — 9. Lead Exit Reason Screen — 10. Re-entry Logic Screen

### Group 7: Mobile Experience (25 Screens)

1. Mobile Workflow List — 2. Mobile Builder (Simplified) — 3. Node Tap Interaction — 4. Mobile Node Config — 5. Mobile Notifications — 6. Push Alert Settings — 7. Mobile Analytics Snapshot — 8. Lead Quick Actions — 9. Voice Note Follow-up — 10. Offline Mode Screen — 11. Sync Conflict Screen — 12. Quick Template Send — 13. Mobile CRM View — 14. Swipe Actions (Lead) — 15. Mobile Task List — 16. Mobile Debug Alerts — 17. Mobile AI Suggestions — 18. Mobile Workflow Toggle On/Off — 19. Emergency Stop Workflow — 20. Mobile Activity Feed — 21. Mobile Lead Capture Integration — 22. QR Scan Entry — 23. Mobile Calendar Integration — 24. Mobile Reminder Alerts — 25. Mobile Settings

### Group 8: Edge Case Handling (20 Screens)

1. Duplicate Lead Detection — 2. Conflict Resolution UI — 3. Missing Data Handling — 4. Invalid Contact Info Screen — 5. Opt-out / Unsubscribe Flow — 6. GDPR/Privacy Consent Screen — 7. Timezone Conflict Handling — 8. Message Delivery Failure Screen — 9. Channel Fallback Logic View — 10. Workflow Loop Detection Warning — 11. Infinite Loop Prevention UI — 12. Rate Limit Handling Screen — 13. Bulk Failure Dashboard — 14. Partial Execution State — 15. Reconciliation Screen — 16. System Downtime Mode — 17. Retry Queue Monitor — 18. Manual Override Panel — 19. Escalation Workflow Trigger — 20. Dead Letter Queue Viewer

### Group 9: Admin & Governance (20 Screens)

1. Admin Workflow Dashboard — 2. User Permissions Matrix — 3. Role-Based Access Control — 4. Approval Queue — 5. Audit Log Viewer — 6. System Health Monitor — 7. Global Workflow Settings — 8. Tenant Management — 9. Usage Metrics Dashboard — 10. Compliance Report — 11. Workflow Export/Import — 12. Backup & Restore — 13. Rate Limit Controls — 14. Feature Flag Management — 15. API Key Management — 16. Notification Routing Rules — 17. Integration Health — 18. Error Escalation Rules — 19. Support Tools — 20. System Announcements

### Group 10: Integrations & APIs (15 Screens)

1. Integration Marketplace — 2. CRM Connectors — 3. Email Provider Config — 4. SMS Gateway Config — 5. WhatsApp Business Setup — 6. Webhook Config — 7. API Key Management — 8. OAuth Connections — 9. Data Sync Status — 10. Webhook Logs — 11. Payload Inspector — 12. Integration Health — 13. Custom Integration Builder — 14. Rate Limit Management — 15. Integration Analytics

### Group 11: AI Control Center (10 Screens)

1. AI Agent Dashboard — 2. Model Configuration — 3. Prompt Template Manager — 4. AI Decision Logs — 5. Confidence Score Viewer — 6. AI Suggestions Feed — 7. Model Performance Metrics — 8. Training Data Review — 9. Safety & Guardrails Config — 10. AI Cost Monitor

---

## 5. Backend Architecture & Database Schema

### 5.1 Architecture Layers

```
UI Layer (200+ screens)
       ↓
API Layer (CRUD + orchestration)
       ↓
Workflow Engine (execution brain)
       ↓
Event Bus (triggers)
       ↓
Task Queue (async jobs)
       ↓
Database Layer
```

### 5.2 Database Schema

#### Workflow Core

```sql
-- Workflows
workflows (
  id          UUID PRIMARY KEY,
  name        TEXT,
  description TEXT,
  status      TEXT CHECK (status IN ('draft','active','paused','archived')),
  version     INTEGER,
  created_by  UUID,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ
)

-- Nodes
workflow_nodes (
  id          UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  type        TEXT CHECK (type IN ('trigger','action','condition','delay','ai')),
  label       TEXT,
  config      JSONB,
  position_x  FLOAT,
  position_y  FLOAT,
  created_at  TIMESTAMPTZ
)

-- Edges
workflow_edges (
  id             UUID PRIMARY KEY,
  workflow_id    UUID REFERENCES workflows(id),
  source_node_id UUID REFERENCES workflow_nodes(id),
  target_node_id UUID REFERENCES workflow_nodes(id),
  condition      TEXT
)

-- Versions
workflow_versions (
  id             UUID PRIMARY KEY,
  workflow_id    UUID REFERENCES workflows(id),
  version_number INTEGER,
  snapshot       JSONB,
  created_at     TIMESTAMPTZ
)
```

#### Execution Engine

```sql
workflow_runs (
  id          UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  lead_id     UUID,
  status      TEXT CHECK (status IN ('running','completed','failed','stopped')),
  started_at  TIMESTAMPTZ,
  ended_at    TIMESTAMPTZ
)

workflow_run_steps (
  id            UUID PRIMARY KEY,
  run_id        UUID REFERENCES workflow_runs(id),
  node_id       UUID REFERENCES workflow_nodes(id),
  status        TEXT CHECK (status IN ('pending','success','failed','skipped')),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  output        JSONB,
  error_message TEXT
)

workflow_state (
  id              UUID PRIMARY KEY,
  run_id          UUID REFERENCES workflow_runs(id),
  current_node_id UUID,
  context_data    JSONB,
  updated_at      TIMESTAMPTZ
)
```

#### Event System

```sql
events (
  id         UUID PRIMARY KEY,
  type       TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ
)

event_subscriptions (
  id                UUID PRIMARY KEY,
  workflow_id       UUID REFERENCES workflows(id),
  event_type        TEXT,
  filter_conditions JSONB
)
```

#### Leads & CRM

```sql
leads (
  id         UUID PRIMARY KEY,
  name       TEXT,
  email      TEXT,
  phone      TEXT,
  status     TEXT CHECK (status IN ('new','warm','hot','cold')),
  source     TEXT,
  created_at TIMESTAMPTZ
)

lead_tags      (id, lead_id, tag)
lead_activities(id, lead_id, type, metadata JSONB, created_at)
```

#### Communication System

```sql
messages (
  id      UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  type    TEXT CHECK (type IN ('email','sms','whatsapp')),
  content TEXT,
  status  TEXT CHECK (status IN ('pending','sent','failed')),
  sent_at TIMESTAMPTZ
)

message_templates (id, name, type, content, variables JSONB)
```

#### Delay & Queue System

```sql
scheduled_jobs (
  id         UUID PRIMARY KEY,
  run_id     UUID REFERENCES workflow_runs(id),
  node_id    UUID REFERENCES workflow_nodes(id),
  execute_at TIMESTAMPTZ,
  status     TEXT CHECK (status IN ('pending','executed','failed'))
)

dead_letter_queue (id, job_id, reason, payload JSONB, created_at)
```

#### AI Layer

```sql
ai_workflow_suggestions (id, workflow_id, suggestion_type, content JSONB, created_at)
ai_decisions            (id, run_id, node_id, input_data JSONB, decision_output JSONB, confidence_score FLOAT)
```

#### Admin & Governance

```sql
users       (id, name, email, role)
permissions (id, role, resource, action)
audit_logs  (id, user_id, action, resource_type, resource_id UUID, timestamp)
```

### 5.3 API Design

```
# Workflow Management
POST   /api/workflows              Create Workflow
GET    /api/workflows              List Workflows
GET    /api/workflows/:id          Get Workflow (with nodes + edges)
PUT    /api/workflows/:id          Update Workflow
POST   /api/workflows/:id/publish  Publish Workflow

# Node & Edge Management
POST   /api/workflows/:id/nodes    Add Node
PUT    /api/nodes/:node_id         Update Node
DELETE /api/nodes/:node_id         Delete Node
POST   /api/workflows/:id/edges    Add Edge
DELETE /api/edges/:id              Delete Edge

# Execution
POST   /api/workflows/:id/run      Trigger Workflow (manual)
GET    /api/workflows/:id/runs     List Runs
GET    /api/runs/:run_id           Get Run Details

# Testing
POST   /api/workflows/:id/test

# Analytics
GET    /api/workflows/:id/analytics
GET    /api/workflows/:id/performance

# Event Ingestion
POST   /api/events
```

**Event payload example:**
```json
{
  "type": "open_house_signed_in",
  "payload": {
    "lead_id": "123",
    "property_id": "456"
  }
}
```

### 5.4 Workflow Execution Steps

1. Event arrives → stored in `events`
2. Match workflows via `event_subscriptions`
3. Create `workflow_run`
4. Execute first node → insert into `workflow_run_steps`
5. Traverse graph: Condition → branch | Delay → schedule job | Action → execute
6. Continue until: End node | Error | Stopped

---

## 6. Event Bus & Queue Infrastructure

### 6.1 Architecture

```
[Client Apps]
      ↓
[API Layer]
      ↓
[Event Bus]  <---> [Workflow Engine]
      ↓                    ↓
[Queue System]  -->  [Worker Nodes]
      ↓
[External Services (Email, SMS, CRM)]
```

**Recommended stack:** Kafka (high-scale) or Redis Streams (simpler)

### 6.2 Event Types

```
lead.created          lead.updated          lead.tagged
openhouse.created     openhouse.signed_in   openhouse.completed
message.sent          message.opened        message.clicked
offer.submitted       property.viewed
```

### 6.3 Event Structure

```json
{
  "id": "evt_123",
  "type": "openhouse.signed_in",
  "timestamp": "2026-03-19T10:00:00Z",
  "tenant_id": "agency_1",
  "payload": {
    "lead_id": "lead_123",
    "property_id": "prop_456"
  }
}
```

### 6.4 Queue Workers

| Worker | Responsibility |
|--------|---------------|
| Workflow Worker | Traverses nodes, handles logic |
| Communication Worker | Sends emails/SMS, handles retries |
| AI Worker | Runs AI decisions, optimizations |
| Scheduler Worker | Wakes delayed workflows |

**Job types:** `execute_node` | `send_email` | `send_sms` | `wait_delay` | `retry_failed_step` | `ai_decision`

### 6.5 Scaling Strategy

- Partition by `tenant_id`
- Horizontal worker scaling
- Retry queues + dead-letter queues

---

## 7. Multi-Tenant SaaS Architecture

### 7.1 Tenancy Model

**Recommended: Row-Level Multi-Tenancy** — every table includes `tenant_id`.

### 7.2 Tenant Hierarchy

```
Platform
 └── Agency (Tenant)
      ├── Office (optional)
      ├── Agents (users)
      ├── Listings
      ├── Workflows
      └── Leads
```

### 7.3 User Roles

| Role | Scope |
|------|-------|
| Super Admin | Platform-wide |
| Agency Admin | Tenant-wide |
| Manager | Office/team |
| Agent | Own leads/listings |
| Assistant | Limited access |

### 7.4 RBAC Tables

```sql
roles          (id, name)
permissions    (id, role, resource, action)
user_roles     (id, user_id, role_id)
```

### 7.5 Billing System

```sql
subscriptions (
  id           UUID PRIMARY KEY,
  tenant_id    UUID,
  plan         TEXT CHECK (plan IN ('starter','pro','enterprise')),
  status       TEXT,
  renewal_date DATE
)

usage_metrics (id, tenant_id, metric TEXT, value INTEGER)
features      (id, name, description)
tenant_features (id, tenant_id, feature_id, enabled BOOLEAN)
```

**Monetization:** Per agent pricing | Per workflow execution | Per message | AI usage credits

---

## 8. Real Estate Data Model Expansion

### 8.1 Core Tables

```sql
properties (
  id        UUID PRIMARY KEY,
  tenant_id UUID,
  title     TEXT,
  address   TEXT,
  price     NUMERIC,
  type      TEXT CHECK (type IN ('house','apartment','land')),
  status    TEXT CHECK (status IN ('listed','sold','pending')),
  agent_id  UUID
)

listings (
  id           UUID PRIMARY KEY,
  property_id  UUID REFERENCES properties(id),
  listing_type TEXT CHECK (listing_type IN ('sale','rent')),
  published_at TIMESTAMPTZ,
  status       TEXT
)

open_houses (
  id          UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  date        DATE,
  start_time  TIME,
  end_time    TIME,
  status      TEXT
)

open_house_visitors (
  id            UUID PRIMARY KEY,
  open_house_id UUID REFERENCES open_houses(id),
  lead_id       UUID REFERENCES leads(id),
  check_in_time TIMESTAMPTZ,
  feedback      TEXT
)

offers (
  id          UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  lead_id     UUID REFERENCES leads(id),
  amount      NUMERIC,
  status      TEXT CHECK (status IN ('submitted','accepted','rejected')),
  created_at  TIMESTAMPTZ
)

deals (
  id          UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  buyer_id    UUID,
  seller_id   UUID,
  stage       TEXT CHECK (stage IN ('offer','negotiation','contract','closed')),
  value       NUMERIC
)

legal_cases (
  id        UUID PRIMARY KEY,
  deal_id   UUID REFERENCES deals(id),
  lawyer_id UUID,
  status    TEXT,
  documents JSONB
)
```

### 8.2 Automation Trigger Mapping

| Event | Workflow Triggered |
|-------|-------------------|
| `property.created` | Marketing campaign starts |
| `open_house.created` | Invite leads |
| `openhouse.signed_in` | Follow-up sequence |
| `offer.submitted` | Notify agent + start closing pipeline |
| `deal.stage_changed` | Trigger next closing actions |

---

## 9. AI Agent Layer

### 9.1 Architecture

```
[User / Agent Dashboard]
          ↓
 [AI Command Center]
          ↓
   [AGENT ORCHESTRATOR]
    ↓        ↓        ↓
[Lead   ][Marketing][Deal  ]
[Agent  ][Agent    ][Agent ]
    ↓        ↓        ↓
  [Tools Layer / APIs / Workflow Engine]
          ↓
  [Database + Event Bus]
```

### 9.2 Core Agent Types

| Agent | Goal | Key Capabilities |
|-------|------|-----------------|
| Lead Qualification Agent | Convert raw leads to qualified prospects | Score quality, ask follow-up questions |
| Marketing Agent | Drive traffic to listings | Generate campaigns, optimize timing, A/B test |
| Open House Agent | Maximize attendance & conversions | Invite leads, remind, follow up after visit |
| Deal/Negotiation Agent | Move deals to closing | Suggest offer strategies, alert at critical moments |
| Conveyancing Agent | Manage legal process | Track documents, notify stakeholders, predict delays |
| AI Supervisor Agent | Oversee all agents | Assign tasks, resolve conflicts, global optimization |

### 9.3 Agent Loop

Each agent follows: **THINK → PLAN → ACT → LEARN**

**Decision Engine output:**
```json
{
  "action": "send_sms",
  "confidence": 0.92,
  "reason": "Lead opened email twice but didn't respond"
}
```

**Memory tables:**
```sql
agent_memory (id, agent_type, entity_id, memory_type TEXT CHECK (memory_type IN ('short','long')), content JSONB, created_at)
agent_tools  (id, name, description, input_schema JSONB, output_schema JSONB)
agent_actions(id, agent_type, entity_id, action, input_data JSONB, output_data JSONB, confidence FLOAT, created_at)
```

### 9.4 Orchestration

Agent receives `openhouse.signed_in` →
1. Lead Agent scores lead
2. Marketing Agent pauses ads
3. Deal Agent evaluates intent
4. Supervisor makes final decision → Send SMS + notify human agent

### 9.5 AI Command Center UI

- Agent status dashboard
- Live decisions feed with confidence scores
- Enable/disable agents
- Set risk level (conservative vs aggressive)
- Human approval thresholds

### 9.6 Safety & Guardrails

- Max messages per lead
- Approval required for high-risk actions
- Compliance filters (legal/ethical)
- Blacklist conditions

---

## 10. Fine-Tuning & Custom Model Strategy

> **First Principle:** Don't jump straight to fine-tuning. Use prompt engineering + RAG + structured decision layers first. Fine-tuning comes after these are solid.

### 10.1 Model Stack (Hybrid)

| Tier | Type | Handles |
|------|------|---------|
| 1 | General LLM (GPT-class) | Planning, reasoning, complex decisions |
| 2 | Retrieval Layer (RAG + Vector DB) | Property data, lead interactions, market insights |
| 3 | Fine-Tuned Specialists | Lead scoring, message generation, classification |
| 4 | Rules Engine (deterministic) | Compliance, guardrails, hard business rules |

### 10.2 High-ROI Fine-Tuning Use Cases

1. **Lead Classification Model** — Input: behavior signals | Output: Hot/Warm/Cold + conversion probability
2. **Message Personalization Model** — Learns tone, learns what converts, adapts to local language
3. **Next-Best-Action Model** — Input: lead state + property + history | Output: "Call now" / "Send SMS" / "Wait 2 days"
4. **Property Matching Model** — Input: lead preferences + behavior | Output: best property suggestions

### 10.3 Training Data

```json
{
  "lead_id": "123",
  "actions": ["email_sent", "sms_sent"],
  "response": "clicked_link",
  "converted": true,
  "time_to_convert": 3
}
```

> Your competitive advantage = your dataset.

### 10.4 Training Pipeline

```
Raw Data → Cleaning → Feature Engineering → Training → Evaluation → Deployment
```

**Model types:** XGBoost/LightGBM (structured data) | Fine-tuned LLM (text)

### 10.5 Fine-Tuning Format (Instruction Tuning)

```json
{
  "input": "Write a follow-up message for a buyer who attended an open house",
  "output": "Hi John, thanks for visiting 14 Acacia Road yesterday..."
}
```

**Strategy:** Start small (1k–10k examples) | Iterate frequently | Monitor performance

### 10.6 Online Learning Loop

1. Agent acts → user responds → outcome logged → model retrained periodically
2. Feedback signals: opened, clicked, replied, converted

### 10.7 Maturity Roadmap

| Phase | Capabilities |
|-------|-------------|
| Phase 1 (MVP) | No fine-tuning; prompts + RAG only |
| Phase 2 | Lead scoring model + message optimization model |
| Phase 3 (Advanced) | Multi-agent learning, reinforcement learning, fully autonomous decisions |

---

## 11. Prompt Engineering System

### 11.1 Prompt Stack Architecture

```
[System Prompt]
    + [Role Prompt]
    + [Task Prompt]
    + [Context Injection]
    + [Constraints / Guardrails]
    + [Output Schema]
```

### 11.2 System Prompt (Global Brain)

```
You are an AI real estate assistant operating within a professional property platform.

Goals:
- Maximize lead conversion
- Maintain professional tone
- Be concise and actionable

Rules:
- Never fabricate property details
- Respect user privacy
- Follow communication compliance rules
```

### 11.3 Role Prompts

**Lead Agent:**
```
You are a Lead Qualification Specialist.
Job: Identify intent level, ask clarifying questions, prioritize serious buyers.
Tone: Friendly, direct, not pushy.
```

**Marketing Agent:**
```
You are a Real Estate Marketing Expert.
Job: Generate high-converting campaigns, optimize engagement.
Tone: Persuasive but professional.
```

**Deal Agent:**
```
You are a Real Estate Negotiation Assistant.
Job: Move deals forward, recommend next steps.
```

### 11.4 Context Injection

```
Lead Name: John
Property: 3-bed house in Borrowdale
Budget: $150,000
Last Action: Attended open house
Engagement: Opened email but did not reply
```

### 11.5 Constraints Example

```
- Max 160 characters (SMS)
- Do not sound robotic
- Include call-to-action
- Do not expose internal system data
```

### 11.6 Output Schema

```json
{
  "message": "...",
  "tone": "friendly",
  "cta": "schedule_viewing"
}
```

### 11.7 Prompt Template Tables

```sql
prompt_templates (
  id            UUID PRIMARY KEY,
  name          TEXT,
  agent_type    TEXT,
  system_prompt TEXT,
  role_prompt   TEXT,
  task_template TEXT,
  constraints   TEXT,
  output_schema JSONB,
  version       INTEGER
)

prompt_versions (id, template_id, version, changes, performance_score FLOAT, created_at)

prompt_experiments (id, template_id, variant_a JSONB, variant_b JSONB, metric, winner)
```

### 11.8 Production Templates

**Open House Follow-Up (SMS):**
```
Write a short SMS to {{lead_name}} who visited {{property_address}}.
Encourage them to take the next step.
Constraints: Max 160 chars, friendly tone, include CTA.
```

**Lead Classification:**
```
Analyze the following lead data and classify intent level.
Data: {{lead_data}}
Output: { intent_level: "hot|warm|cold", reasoning: "..." }
```

**Next Best Action:**
```
Given the lead context below, recommend the next best action.
Context: {{lead_context}}
Output: { action: "...", reason: "...", urgency: "low|medium|high" }
```

### 11.9 Advanced Techniques

**Few-Shot Prompting:** Provide 2-3 examples before the actual task.

**Chain-of-Thought:** Let model reason internally without exposing the reasoning in output.

**Tool-Augmented Prompts:** Use `get_property_data()` / `get_lead_history()` to inject live data.

---

## 12. Agent-to-Agent Communication Protocols

### 12.1 Communication Models

| Model | Description |
|-------|-------------|
| **Event-Driven (Primary)** | Agents react to domain events on the event bus |
| **Direct Messaging** | One agent requests information/recommendation from another |
| **Shared Memory** | Agents read/write shared state to coordinate indirectly |

### 12.2 Message Protocol

**Request:**
```json
{
  "message_id": "msg_123",
  "from_agent": "lead_agent",
  "to_agent": "deal_agent",
  "type": "request",
  "intent": "evaluate_lead",
  "payload": { "lead_id": "123", "context": {} },
  "priority": "high",
  "timestamp": "2026-03-19T10:00:00Z"
}
```

**Response:**
```json
{
  "message_id": "msg_123",
  "status": "success",
  "response": {
    "recommendation": "schedule_viewing",
    "confidence": 0.91
  }
}
```

### 12.3 Collaboration Patterns

- **Sequential:** Lead Agent → Marketing Agent → Deal Agent
- **Parallel:** All agents act simultaneously, then merge results
- **Consensus:** Agents vote; Supervisor decides winner

### 12.4 Shared Memory

```sql
agent_shared_memory (
  id               UUID PRIMARY KEY,
  entity_type      TEXT,
  entity_id        UUID,
  key              TEXT,
  value            JSONB,
  updated_by_agent TEXT,
  updated_at       TIMESTAMPTZ
)
```

### 12.5 Conflict Resolution

| Strategy | Description |
|----------|-------------|
| Supervisor Override | Highest authority decides |
| Priority Rules | Deal Agent > Marketing Agent |
| Confidence Scoring | Higher confidence wins |

### 12.6 End-to-End Example

```
Event: openhouse.signed_in
→ Supervisor assigns:
    Lead Agent     → score lead
    Marketing Agent → stop active ads
    Deal Agent     → evaluate purchase intent
→ Lead Agent → Deal Agent: "Lead score = 0.9, next step?"
→ Deal Agent: "Schedule viewing immediately"
→ Supervisor: Send SMS + notify human agent
```

---

## 13. Microservices Deployment

### 13.1 High-Level Architecture

```
              [Load Balancer / API Gateway]
                          ↓
    [Workflow API]   [Agent API]   [CRM API]
                          ↓
              [EVENT BUS (Kafka/Redis)]
                          ↓
        [Workers]   [AI Services]   [Schedulers]
                          ↓
         [Postgres]   [Redis]   [Vector DB]
```

### 13.2 Services

| Service | Responsibilities |
|---------|-----------------|
| Workflow Service | Manage workflows, nodes, execution |
| Agent Service | Run AI agents, inter-agent communication |
| Event Service | Publish & consume events (wraps Kafka) |
| CRM Service | Leads, activities, messaging |
| Property Service | Listings, open houses |
| AI/ML Service | Model inference, prompt execution |
| Notification Service | Email, SMS, WhatsApp |
| Auth Service | Users, roles, permissions |

### 13.3 Docker Setup

**Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "run", "start"]
```

**docker-compose.yml (local dev):**
```yaml
version: "3.9"
services:
  api:
    build: .
    ports:
      - "3000:3000"
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: realestate
  redis:
    image: redis:7
  kafka:
    image: bitnami/kafka:latest
```

### 13.4 Kubernetes Deployment

**Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: workflow
  template:
    metadata:
      labels:
        app: workflow
    spec:
      containers:
        - name: workflow
          image: yourrepo/workflow:latest
          ports:
            - containerPort: 3000
```

**Service:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: workflow-service
spec:
  selector:
    app: workflow
  ports:
    - port: 80
      targetPort: 3000
```

### 13.5 CI/CD Pipeline

```
code push → run tests → docker build → push to registry → deploy to Kubernetes
```

### 13.6 Observability

| Tool | Purpose |
|------|---------|
| ELK Stack | Logging |
| Prometheus + Grafana | Metrics |
| OpenTelemetry | Distributed tracing |

### 13.7 Scaling

- Horizontal pod scaling
- HPA: `cpu > 70% → scale up`
- Queue-based scaling: more jobs → more workers

### 13.8 Cloud

**AWS (Recommended):** EKS + RDS (Postgres) + ElastiCache (Redis) + MSK (Kafka)

### 13.9 Zero-Downtime Deployment

Rolling updates | Blue/Green deployment | Canary releases

---

## 14. Frontend Architecture

### 14.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React (App Router or Vite SPA) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | React Query |
| Global UI state | Zustand |
| Forms | React Hook Form |
| Routing | React Router / Next.js App Router |
| Charts | Recharts |

### 14.2 Folder Structure

```
src/
├── app/                 # Routes / layouts
├── modules/
│   ├── workflows/
│   ├── agents/
│   ├── leads/
│   ├── properties/
│   ├── openhouse/
│   └── automation/
├── components/          # Shared UI components
│   ├── ui/              # Buttons, inputs, cards
│   ├── layout/          # Navbar, sidebar
│   ├── data/            # Tables, lists
│   └── charts/          # Analytics visuals
├── hooks/
├── store/               # Zustand stores
├── services/            # API clients
├── lib/                 # Utilities
├── types/
└── config/
```

### 14.3 Feature Module Structure

```
modules/automation/
├── components/
├── screens/
├── hooks/
├── store/
├── services/
├── types.ts
└── index.ts
```

### 14.4 State Management

**Server State (React Query):**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['workflows'],
  queryFn: getWorkflows
})
```

**Global UI State (Zustand):**
```typescript
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen }))
}))

export const useWorkflowStore = create((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  selectNode: (node) => set({ selectedNode: node })
}))
```

### 14.5 Data Flow

```
UI → Custom Hook → React Query → API Service → Backend
```

**API service example:**
```typescript
export const getWorkflows = async () => {
  const res = await api.get('/workflows')
  return res.data
}
```

### 14.6 Workflow Builder Component Tree

```
WorkflowBuilder
 ├── Toolbar
 ├── Canvas
 │    ├── Node
 │    └── Edge
 ├── InspectorPanel
 ├── MiniMap
 └── ContextMenu
```

### 14.7 Performance

```typescript
// Code splitting
const Builder = React.lazy(() => import('./WorkflowBuilder'))

// Memoization
export default React.memo(MyComponent)
```

### 14.8 Auth

```typescript
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### 14.9 Full App Tree

```
App
 ├── AuthProvider
 ├── QueryProvider
 └── Router
      └── Layout
           ├── Sidebar
           ├── Topbar
           └── Pages
                ├── Dashboard
                ├── Workflows
                ├── Builder
                ├── Leads
                ├── Properties
                └── Analytics
```

---

## 15. MVP Build Plan (30–60 Days)

### MVP Goal

Launch a usable AI-powered Open House + Lead Follow-up System.

**In scope:** Properties + Open Houses, Lead capture (digital sign-in), Basic CRM, Simple workflow automation, AI follow-ups, Dashboard

**Out of scope (later):** Advanced multi-agent system, Full automation builder, Complex analytics, Conveyancing, Multi-region infra

### Phase 1: Foundation (Days 1–10)

**Goal:** Working backend + basic frontend shell

- Setup Node.js + PostgreSQL + Redis
- Core tables: `users`, `properties`, `open_houses`, `leads`, `workflow_runs`, `messages`
- API: Auth, Properties CRUD, Open Houses CRUD, Lead capture, Send message
- Frontend: React + Tailwind + shadcn, Sidebar + Topbar + Routing

**Deliverables:** Login works ✅ | Create property ✅ | Create open house ✅

### Phase 2: Lead Capture + CRM (Days 11–20)

**Goal:** Capture and manage leads

- Digital Sign-In Screen (Name, Phone, Email, Interest level)
- Save leads, link to open house
- Lead list + Lead detail + Tagging (Hot/Warm/Cold)
- Basic activity tracking

**Deliverables:** Live lead capture ✅ | CRM view working ✅

### Phase 3: Workflow Automation (Days 21–35)

**Goal:** Automate follow-ups

- Simple Workflow Engine with triggers: `lead_created`, `openhouse_signed_in`
- Actions: send SMS, send email
- Hardcoded flows:
  ```
  IF lead_created        → send welcome message
  IF openhouse_signed_in → send follow-up after 1 day
  ```
- Queue system: Redis + BullMQ

**Deliverables:** Automated follow-ups working ✅

### Phase 4: AI Integration (Days 36–45)

**Goal:** Smart messaging

- Generate SMS/email content from LLM API
- Personalize with lead name + property details
- "Generate Message" button + preview before sending

**Example prompt:**
```
Write a short SMS for a buyer who visited a 3-bedroom house and hasn't responded.
```

**Deliverables:** AI-generated messages sending ✅

### Phase 5: Dashboard + Polish (Days 46–60)

**Goal:** Make it usable and presentable

- Dashboard: Total leads, Attendance, Messages sent, Conversion metric
- UX: Loading states, Error handling, Empty states
- Basic auth + roles (agent login, simple permissions)

**Final deliverables:**
- Create property ✅
- Schedule open house ✅
- Capture leads ✅
- Automated follow-up ✅
- AI-generated messages ✅
- Results on dashboard ✅

### MVP Architecture

| Layer | Choice |
|-------|--------|
| Backend | Monolith — Node.js + Postgres + Redis |
| Frontend | React + Zustand + React Query |
| AI | LLM API (no fine-tuning yet) |
| Deploy frontend | Vercel |
| Deploy backend | Railway / Render |

### Build Principles

1. **Ship ugly first** — Function over design
2. **Hardcode before abstracting** — Don't over-engineer workflows early
3. **AI as a feature, not a dependency** — System must work without AI

---

## 16. Clickable Product Flow & User Journeys

### Primary User Role

**Real Estate Agent** (primary MVP user)

---

### Flow 1: Create Property → Schedule Open House

```
Dashboard → Properties → Create Property → Property Detail
         → Create Open House → Open House Detail
```

1. **Dashboard** — CTA: "+ Add Property"
2. **Create Property** — Title, Address, Price, Description → Save
3. **Property Detail** — Overview tabs → "+ Schedule Open House"
4. **Create Open House** — Date, Time, Duration → Publish
5. **Open House Detail** — QR code displayed, visitor list empty

**End state:** Open house is live ✅

---

### Flow 2: Open House → Lead Capture (Tablet)

```
Open House Detail → Tablet Sign-In → Success Screen
```

6. **Tablet Sign-In** — Name, Phone, Email, Interest level → Submit
7. **Success Screen** — "Thank you for visiting!" + optional "Book a viewing"

**Background:** Lead created → `openhouse.signed_in` fired → Workflow triggered

**End state:** Lead stored + automation triggered ✅

---

### Flow 3: Lead → CRM Management

```
Dashboard → Leads → Lead List → Lead Detail → Update Status
```

8. **Lead List** — Table with Hot/Warm/Cold filter → Click lead
9. **Lead Detail** — Contact info, Activity timeline, Messages sent, Tag / Add note / Trigger message

**End state:** Agent understands lead status ✅

---

### Flow 4: Automated Follow-Up

```
Lead Created → Workflow Trigger → AI Message Generated → Sent → Logged
```

10. **Workflow Settings** — Auto follow-up toggle ON, Delay: immediate / 1 day
11. **Message Preview Modal** — AI-generated message, editable → Send
12. **Lead Timeline** — "SMS sent", "Email sent" appear in history

**End state:** Lead receives follow-up automatically ✅

---

### Flow 5: Dashboard → Insights

```
Dashboard → Metrics → Drill Down
```

13. **Dashboard** — Total leads, Attendance, Messages sent
14. **Open House Analytics** — Attendance count, Conversion rate
15. **Lead Conversion View** — Hot vs Cold distribution

**End state:** Agent sees performance ✅

---

### Complete Navigation Map

```
Dashboard
 ├── Properties
 │    ├── Create Property
 │    └── Property Detail
 │         ├── Create Open House
 │         └── Open House Detail
 ├── Open House
 │    └── Tablet Sign-In
 ├── Leads
 │    ├── Lead List
 │    └── Lead Detail
 ├── Automation
 │    └── Workflow Settings
 └── Analytics
```

---

### Figma Prototype Spec

**Pages:** Auth | Dashboard | Properties | Open House | Leads | Automation | Analytics

**Key Interactions:**
- Buttons → navigate between frames
- Forms → simulate submission
- Modals → message preview
- Tabs → switch views

> **Figma Prompt:** "Design a modern real estate SaaS app with flows for creating properties, scheduling open houses, capturing leads via tablet sign-in, viewing leads in a CRM, and sending AI-generated follow-ups. Include dashboard analytics, clean layout, sidebar navigation, rounded cards, and minimal color palette."

---

### Demo Script

1. Create a property
2. Schedule open house
3. Visitor signs in at the event
4. System auto-follows up with AI-generated message
5. View results on dashboard

---

*End of Sprint 05-D: Open House Management System*
