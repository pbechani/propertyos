# Sprint 06-D — AI Construction RFI Manager

## 1. What Is an RFI?

An **RFI (Request for Information)** is used in construction when someone needs clarification about plans, specifications, or site conditions before continuing work.

**Typical situation:**

1. Contractor finds something unclear in drawings.
2. Contractor submits an RFI.
3. Architect/Engineer answers.
4. Work continues based on the clarification.

**RFIs are critical because they:**

- Prevent mistakes
- Document decisions
- Reduce disputes
- Maintain project traceability

> Poor RFIs create delays, confusion, and legal risk.

---

## 2. Standard RFI Workflow

### Step 1 — Identify an Issue

Common triggers:

- Drawing unclear
- Conflicting dimensions
- Missing detail
- Material specification unclear

> **Example:** "Door size on drawing A2 conflicts with schedule."

### Step 2 — Gather Supporting Evidence

Include:

- Drawing reference
- Specification section
- Photos (if site issue)
- Sketch or markup

### Step 3 — Write the RFI Clearly

Good RFIs include:

| Field | Description |
|-------|-------------|
| RFI Number | Unique identifier |
| Title | Short summary of the issue |
| Description | Full context |
| Question | Specific clarification needed |
| Suggested Solution | Proposed resolution |
| Attachments | Drawings, photos, specs |
| Responsible Party | Who must respond |
| Due Date | Response deadline |

**Example RFI:**

```
Subject:              Door Frame Size Clarification
Issue:                Door schedule lists 900mm but drawing shows 1000mm.
Question:             Please confirm correct door frame size.
Suggested Resolution: Use 1000mm frame per drawing A2.
```

### Step 4 — Submit RFI

Send to:

- Architect
- Engineer
- Client representative

### Step 5 — Response

Recipients respond with:

- Clarification
- Revised drawing
- Instruction

### Step 6 — Log & Track

RFIs must be tracked through states: **Open → Answered → Closed**

---

## 3. App Concept: AI Construction RFI Manager

This app manages RFIs automatically with AI assistance.

> Think of it as: **"Linear + Jira + Notion for Construction RFIs"**

---

## 4. Core Users

| Role | Responsibility |
|------|----------------|
| **Contractor** | Creates RFIs |
| **Site Engineer** | Uploads photos / issues |
| **Architect** | Responds to RFIs |
| **Project Manager** | Tracks delays |
| **Client** | Views progress |

---

## 5. Main Modules

### 1. RFI Creation

**Screen:** Create RFI

**Fields:**

- Project
- RFI Number *(auto-generated)*
- Title
- Description
- Drawing Reference
- Specification Section
- Question
- Suggested Solution
- Priority
- Due Date
- Attachments

**AI assist:** User types `"Door size on drawing unclear"` → AI converts to a full professional RFI.

---

### 2. Drawing Markup Tool

Users can:

- Upload drawings
- Mark the problem area
- Add comments

**Markup tools:** Arrow, Circle, Text, Measurement, Highlight

---

### 3. RFI Inbox (Kanban Board)

| Draft | Submitted | Under Review | Answered | Closed | Rejected |
|-------|-----------|--------------|----------|--------|----------|

---

### 4. RFI Response Screen

Responder (architect/engineer) fills in:

- Response text
- Attachment
- Revised drawing
- Instruction

---

### 5. AI Smart Assistant

AI automatically:

- Writes RFIs from brief descriptions
- Suggests solutions
- Finds related drawings
- Detects conflicts

> **Example:** User uploads drawing → AI detects *"Dimension conflict between A1 and A2."*

---

### 6. RFI Timeline

Each RFI has an immutable history (like a Git commit log):

```
Created → Submitted → Viewed → Answered → Closed
```

---

### 7. Delay Impact Tracker

Calculates RFI impact on project schedule:

| Field | Value |
|-------|-------|
| RFI | #034 |
| Response Delay | 4 days |
| Affected Task | Interior Framing |

---

### 8. Construction Knowledge Base

AI learns from past RFIs.

> **Example search:** `"door clearance"` → Returns 12 similar RFIs, standard solution, and relevant drawings.

---

## 6. AI Features

### AI RFI Generator

| | |
|--|--|
| **Input** | `"Beam clashes with duct"` |
| **Output Title** | Beam and HVAC Clash – Grid C4 |
| **Output Description** | Structural beam conflicts with HVAC duct route. |
| **Output Question** | Please confirm whether duct should be rerouted or beam lowered. |

### AI Drawing Analyzer

- Upload PDF drawings
- AI detects: clashes, missing dimensions, spec conflicts

### AI Response Drafting

Engineer clicks **Generate Response** → AI suggests a draft answer.

### AI Delay Predictor

Predicts which open RFIs will delay the project and by how much.

---

## 7. Mobile App for Site Workers

Site workers can:

- 📷 Take a photo
- 📝 Create an RFI instantly

**Flow:** Take photo → Mark issue → Send RFI

---

## 8. Dashboard

### Project Manager Dashboard

**KPI Widgets:**

- Total RFIs
- Open RFIs
- Overdue RFIs
- Average response time
- RFIs by discipline

**Charts:**

- RFIs by discipline (Architectural, Structural, MEP)
- Response time trends
- Open vs. closed over time

---

## 9. Database Design

### Core Tables

```
projects
users
rfis
rfi_responses
attachments
drawings
rfi_comments
rfi_history
```

### rfis Table Schema

```sql
rfis (
  id                  UUID PRIMARY KEY,
  project_id          UUID REFERENCES projects(id),
  rfi_number          VARCHAR(20),
  title               TEXT NOT NULL,
  description         TEXT,
  question            TEXT NOT NULL,
  suggested_solution  TEXT,
  status              VARCHAR(20),  -- draft | submitted | under_review | answered | closed | rejected
  priority            VARCHAR(10),  -- low | medium | high | critical
  created_by          UUID REFERENCES users(id),
  assigned_to         UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  due_date            DATE
)
```

---

## 10. UI Screens

### Project Level

- Project Dashboard
- RFI List
- Drawings
- Documents
- Issues

### RFI Module

- Create RFI
- RFI Detail
- RFI Inbox *(Kanban)*
- RFI Timeline
- RFI Analytics

### AI Module

- AI Draft RFI
- AI Drawing Analysis
- AI RFI Search

---

## 11. Advanced Enterprise Features

| Feature | Description |
|---------|-------------|
| **Email Integration** | Send and receive RFIs via email |
| **BIM Integration** | Works with Revit, IFC, Navisworks |
| **Contract Integration** | Link RFIs to Variations, Change Orders, Claims |

---

## 12. Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, Next.js, Tailwind CSS |
| **Backend** | Node.js, NestJS, PostgreSQL, Redis |
| **AI** | LLM for writing RFIs, Vision AI for drawing analysis, Vector DB for RFI knowledge base |

---

## 13. Example User Flow

**Contractor notices an issue:**

1. Opens app
2. Creates RFI
3. Uploads drawing
4. AI writes description
5. Submits

**Architect receives it:**

1. Gets notification
2. Opens RFI
3. Writes response
4. Uploads revised drawing

**System automatically:**

1. Logs response time
2. Closes RFI
3. Updates schedule impact

---

## 14. Integration with the Construction Platform

This RFI module fits as a core feature within the broader construction PM system:

```
Construction PM System
 ├── Planning
 ├── Procurement
 ├── RFIs          ← this module
 ├── Submittals
 ├── Site Issues
 ├── Inspections
 ├── Change Orders
 └── Handover
```
