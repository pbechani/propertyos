# Sprint 06-E: Mobile Construction App — Offline-First Sync & Real-Time Collaboration

> Architecture blueprint for the PRIBEC mobile construction management app, covering role-based UX,
> offline-first SQLite sync engine, WebSocket real-time updates, and CRDT-based collaborative editing.

---

## Table of Contents

**Part I — App Blueprint**

1. [Product Vision](#1-product-vision)
2. [User Roles & Mode Switching](#2-user-roles--mode-switching)
3. [Navigation Structure](#3-navigation-structure)
4. [Core Modules](#4-core-modules)
5. [UI/UX Design System](#5-uiux-design-system)
6. [AI Layer](#6-ai-layer)
7. [Backend Architecture](#7-backend-architecture)
8. [Permissions Model](#8-permissions-model)
9. [MVP Build Plan](#9-mvp-build-plan)

**Part II — Offline-First Architecture**

10. [Core Concept](#10-core-concept)
11. [Local Database (SQLite)](#11-local-database-sqlite)
12. [Sync Strategy](#12-sync-strategy)
13. [Conflict Resolution](#13-conflict-resolution)
14. [Sync Engine Design](#14-sync-engine-design)
15. [API Endpoints](#15-api-endpoints)
16. [Optimizations](#16-optimizations)
17. [Offline UX](#17-offline-ux)
18. [Edge Cases](#18-edge-cases)
19. [Technology Choices](#19-technology-choices)

**Part III — React Native Sync Engine (Code)**

20. [Folder Structure](#20-folder-structure)
21. [SQLite Setup](#21-sqlite-setup-databasets)
22. [Change Queue](#22-change-queue-syncqueuets)
23. [API Layer](#23-api-layer-syncapits)
24. [Conflict Resolver](#24-conflict-resolver-conflictresolverts)
25. [Sync Engine](#25-sync-engine-syncenginets)
26. [Auto-Sync Triggers](#26-auto-sync-triggers)
27. [Production Hardening](#27-production-hardening)

**Part IV — Backend Sync Processor**

28. [Backend Architecture](#28-backend-architecture)
29. [PostgreSQL Schema](#29-postgresql-schema)
30. [Controller](#30-controller-synccontrollerts)
31. [Sync Service](#31-sync-service-syncservicets)
32. [Sync Processor](#32-sync-processor-syncprocessorts)
33. [Conflict Resolution](#33-conflict-resolution-1)
34. [Input Validation](#34-input-validation-syncvalidatorts)
35. [Performance & Scaling](#35-performance--scaling)

**Part V — WebSocket Real-Time Layer**

36. [Real-Time Architecture](#36-real-time-architecture)
37. [WebSocket Server](#37-websocket-server-wsserverts)
38. [Presence System](#38-presence-system-presencets)
39. [Broadcasting Changes](#39-broadcasting-changes)
40. [Mobile Client](#40-mobile-websocket-client-wsclientts)
41. [Live Update Handlers](#41-live-update-handlers)
42. [Sync + WebSocket Rules](#42-sync--websocket-integration-rules)
43. [WebSocket Security](#43-websocket-security)
44. [WebSocket Scaling](#44-websocket-scaling)

**Part VI — CRDT Collaborative Editing**

45. [Why CRDT](#45-why-crdt)
46. [CRDT Strategy](#46-crdt-strategy)
47. [Document Model](#47-document-model)
48. [Task CRDT](#48-task-crdt)
49. [Real-Time Text Editing](#49-real-time-text-editing)
50. [CRDT + WebSocket Bridge](#50-crdt--websocket-bridge)
51. [CRDT Persistence](#51-crdt-persistence)
52. [Presence & Awareness](#52-presence--awareness)

**Part VII — Unified Architecture**

53. [System Diagram](#53-system-diagram)
54. [Data Flow Golden Rules](#54-data-flow-golden-rules)
55. [Unified Mobile Implementation](#55-unified-mobile-implementation)
56. [Unified Backend Implementation](#56-unified-backend-implementation)
57. [End-to-End Flow](#57-end-to-end-flow)

**Part VIII — Advanced: Field-Level CRDT, Multiplayer UI & Scale**

58. [Task-Specific CRDT](#58-task-specific-crdt)
59. [Multiplayer UI](#59-multiplayer-ui-cursors--selections)
60. [Scaling to Millions](#60-scaling-to-millions-kafka--sharded-crdt)

---

## Part I: Mobile App Blueprint

---

### 1. Product Vision

A mobile-first construction management platform where:

- **Homeowners** track progress simply
- **Project Managers** control execution deeply
- **Contractors** deliver work and get paid
- **Sponsors / Investors** monitor ROI and risk

> "Procore + Monday.com + Uber for construction"

---

### 2. User Roles & Mode Switching

Instead of separate apps, role-based mode switching tailors the experience per user.

| Role | Description |
|---|---|
| Homeowner | Simple, visual — track progress and approve payments |
| Project Manager | Full control — tasks, contractors, budget, risks |
| Contractor | Execution focus — assigned jobs, progress uploads, earnings |
| Sponsor / Investor | Financial overview — ROI, costs, risk alerts |

---

### 3. Navigation Structure

**Bottom tabs (universal — all roles):**

1. **Dashboard** — role-aware summary
2. **Tasks / Work** — task list or job queue depending on role
3. **Messages** — role-based chat
4. **Documents** — blueprints, contracts, permits
5. **More** — profile, settings, notifications

---

### 4. Core Modules

#### 4.1 Project Dashboard (Role-Aware)

**Homeowner View:**

- Progress bar (% completion)
- Budget used vs remaining
- Upcoming milestones
- Photo / video updates

**Project Manager View:**

- Task completion heatmap
- Delays and risk indicators
- Resource allocation
- Contractor performance

**Sponsor View:**

- ROI projection
- Cost vs valuation
- Risk alerts

---

#### 4.2 Task & Workflow Engine

The heart of the system.

**Features:**

- Task creation by PM
- Task dependencies (Task B depends on Task A)
- Gantt-like timeline view
- Task statuses: `Not Started` → `In Progress` → `Blocked` → `Completed`

**AI Layer:**

- Auto-generate tasks from a project description (e.g., "Build a 3-bedroom house")
- Predict delays from weather and contractor performance data

---

#### 4.3 Contractor Module

**Contractor App Experience:**

- View assigned jobs
- Upload progress (photos / videos)
- Submit quotations
- Request materials
- Log hours

**Key Features:**

- Availability toggle (Uber-style on/off)
- Ratings and reviews
- Smart job matching by location and skill

---

#### 4.4 On-Demand Workforce (Uber-Style)

When work is needed on short notice:

1. PM clicks **"Request Contractor"**
2. System finds nearby contractors and sends job request
3. Contractors accept or decline
4. Real-time tracking once accepted

---

#### 4.5 Budget & Cost Control

**Features:**

- Budget breakdown by category: Materials, Labor, Permits
- Real-time spend tracking
- Invoice management
- Payment approvals

**AI Features:**

- Detect cost overruns early
- Suggest cheaper material alternatives

---

#### 4.6 Document Management

**Document Types:** Blueprints, Contracts, Permits, Inspection reports

**Features:**

- Version control
- Digital signatures
- OCR extraction

---

#### 4.7 Communication Hub

- Role-based chat (PM ↔ Contractor, Owner ↔ PM)
- Voice notes
- File sharing

**AI Layer:**

- Auto-summarize conversations
- Extract action items

---

#### 4.8 Progress Tracking (Visual-First)

- Daily photo uploads
- Before/after comparisons
- Timeline playback view

**AI:**

- Detect if work matches plan
- Flag visual inconsistencies

---

#### 4.9 Risk & Issue Management

**Issue Reporting:** Delays, Defects, Safety risks

**AI:**

- Predict risk probability
- Suggest mitigation steps

---

#### 4.10 Reporting & Analytics

**For Sponsors:**

- ROI dashboards
- Project health score
- Timeline variance

**For Project Managers:**

- Contractor efficiency
- Task velocity metrics

---

### 5. UI/UX Design System

#### 5.1 Dual Mode UI

| Mode | Target Role | Style |
|---|---|---|
| Simple Mode | Homeowners | Big cards, minimal text, visual progress, plain-language |
| Advanced Mode | Project Managers | Tables, filters, deep analytics, multi-project view |

#### 5.2 Key Screens

| # | Screen | Description |
|---|---|---|
| 1 | Dashboard | Progress bar, budget ring chart, alerts |
| 2 | Project Timeline | Scrollable phases: Foundation → Structure → Finishing |
| 3 | Task Detail | Description, assigned contractor, attachments, comments |
| 4 | Contractor Marketplace | List with ratings, distance, skills |
| 5 | Request Contractor Flow | Select job type, budget, timeline, send request |
| 6 | Budget Screen | Graphs, expense list, approval buttons |
| 7 | Messaging | WhatsApp-style UI |
| 8 | Document Viewer | PDF + markup tools |

---

### 6. AI Layer

#### 6.1 AI Project Copilot

Users can ask natural-language questions:

- "What's delaying my project?"
- "How much will I overspend?"
- "Who is underperforming?"

#### 6.2 AI Features

| Feature | Function |
|---|---|
| Auto schedule generator | Create full task schedule from project description |
| Delay prediction | Predict delays from weather + performance data |
| Budget forecasting | Project final cost from current spend rate |
| Smart contractor matching | Match by skill, location, past performance |
| Document summarization | Summarize contracts and inspection reports |

---

### 7. Backend Architecture (High-Level)

**Services:** Auth, Project, Task Engine, Contractor, Messaging, Payment, AI

| Layer | Technology |
|---|---|
| Mobile | React Native |
| Backend | Node.js / NestJS |
| Database | PostgreSQL |
| Real-Time | WebSockets |
| Cache | Redis |
| Storage | S3 |

---

### 8. Permissions Model

| Role | Access |
|---|---|
| Homeowner | View + approve payments |
| Project Manager | Full control |
| Contractor | Assigned tasks only |
| Sponsor | Financial data + reports |

---

### 9. MVP Build Plan

| Phase | Deliverables | Estimated Duration |
|---|---|---|
| Phase 1 | Auth, project creation, task system, basic dashboard | Days 1–15 |
| Phase 2 | Contractor module, messaging, file uploads | Days 16–30 |
| Phase 3 | Budget tracking, AI assistant (basic) | Days 31–45 |
| Phase 4 | Real-time dispatch (Uber-style), advanced analytics | Days 46–60 |

---

## Part II: Offline-First SQLite Architecture

---

### 10. Core Concept

Design principle: **Device is the temporary source of truth; server reconciles later.**

Instead of "App depends on server to function", PRIBEC mobile uses "Device stores and
operates independently; sync happens when connected".

```
Mobile App
 ├── SQLite (Local DB)
 ├── Sync Engine
 ├── Change Queue
 └── API Client
        ↓
Backend (Cloud)
 ├── API Layer
 ├── Sync Processor
 └── Master Database (PostgreSQL)
```

---

### 11. Local Database (SQLite)

Mirror the backend schema locally. Core tables on-device:

**Projects:**

```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  status TEXT,
  updated_at INTEGER,
  sync_status TEXT DEFAULT 'pending'  -- 'synced' | 'pending'
);
```

**Tasks:**

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  title TEXT,
  status TEXT,
  assigned_to TEXT,
  updated_at INTEGER,
  sync_status TEXT DEFAULT 'pending'
);
```

**Change log (sync queue):**

```sql
CREATE TABLE IF NOT EXISTS change_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT,        -- 'project' | 'task'
  entity_id TEXT,
  operation TEXT,          -- 'CREATE' | 'UPDATE' | 'DELETE'
  payload TEXT,            -- JSON-serialized payload
  synced INTEGER DEFAULT 0,
  created_at INTEGER
);
```

---

### 12. Sync Strategy

#### 12.1 Outgoing (Device → Server)

Every write on device:

1. Writes to the local SQLite table
2. Adds an entry to `change_log` with `synced = 0`

When connectivity is detected:

```
while change_log has unsynced entries:
  batch = SELECT 50–100 entries WHERE synced = 0
  POST /sync/push (batch)
  UPDATE change_log SET synced = 1 WHERE id IN (batch ids)
```

#### 12.2 Incoming (Server → Device)

```
GET /sync/pull?last_sync={timestamp}
→ returns all records updated since last_sync
→ apply to local SQLite (with conflict resolution)
→ save new last_sync timestamp
```

---

### 13. Conflict Resolution

| Strategy | When to Use |
|---|---|
| **Last Write Wins** | MVP default — simple, deterministic |
| **Field-Level Merge** | When different fields change independently |
| **Role Priority** | Senior role (PM) overrides lower role |
| **Manual UI** | Present conflict dialog to user |

**MVP approach:** Last-write-wins based on `updated_at` timestamp.

---

### 14. Sync Engine Design

| Component | Responsibility |
|---|---|
| **Scheduler** | Runs sync every N minutes in background |
| **Network Monitor** | Triggers sync immediately on reconnect |
| **Sync Worker** | Executes the push + pull sequence |

---

### 15. API Endpoints

#### Push — Device → Server

```
POST /sync/push
Authorization: Bearer <JWT>

{
  "changes": [
    {
      "id": "uuid",
      "entity_type": "task",
      "entity_id": "task-uuid",
      "operation": "UPDATE",
      "payload": { "status": "in_progress", "updated_at": 1700000000 }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    { "id": "uuid", "status": "ok" }
  ]
}
```

#### Pull — Server → Device

```
GET /sync/pull?last_sync=1699999999
Authorization: Bearer <JWT>
```

**Response:**

```json
{
  "projects": [...],
  "tasks": [...],
  "deleted": [
    { "entity": "tasks", "id": "task-uuid" }
  ],
  "server_time": 1700000000
}
```

---

### 16. Optimizations

| Technique | Description |
|---|---|
| Delta sync | Only sync records changed since `last_sync` |
| Batching | 50–100 records per push request |
| Priority ordering | Financial data before tasks before metadata |
| Background sync | Runs when app is backgrounded |
| Compressed payloads | gzip for large batches |

---

### 17. Offline UX

| State | UX Indicator |
|---|---|
| No connection | Banner: "You're offline — changes saved locally" |
| Syncing | Banner: "Syncing…" with progress indicator |
| Pending changes | Badge on items not yet synced |
| Sync failed | Error banner with retry button |

---

### 18. Edge Cases

| Scenario | Solution |
|---|---|
| New records created on both sides | UUID primary keys — no ID collision |
| Deleted on server, edited on device | Soft-delete (tombstone) wins |
| Duplicate push | Idempotency key per `change_log` entry |
| Large backlog | Paginate pull, retry failed push in batches |
| Very long offline period | Full re-sync triggered on reconnect |

---

### 19. Technology Choices

| Option | Verdict |
|---|---|
| `react-native-sqlite-storage` | Good for React Native (legacy) |
| **WatermelonDB** | Recommended — high-performance, offline-first, built-in sync |
| Realm | Alternative — strong offline support, own sync server |

---

## Part III: React Native Sync Engine (Code)

---

### 20. Folder Structure

```
/src
  /db
    database.ts          # SQLite init + table creation
    migrations.ts        # Schema migrations
  /sync
    syncEngine.ts        # Entry point — orchestrates push + pull
    syncQueue.ts         # Change log management
    syncAPI.ts           # HTTP calls to backend
    conflictResolver.ts  # Conflict resolution logic
  /services
    network.ts           # NetInfo wrapper
  /models
    project.ts
    task.ts
```

---

### 21. SQLite Setup (`database.ts`)

```typescript
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'app.db', location: 'default' });

export const initDB = () => {
  db.transaction(tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        status TEXT,
        updated_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        title TEXT,
        status TEXT,
        assigned_to TEXT,
        updated_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS change_log (
        id TEXT PRIMARY KEY,
        entity_type TEXT,
        entity_id TEXT,
        operation TEXT,
        payload TEXT,
        synced INTEGER DEFAULT 0,
        created_at INTEGER
      )
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS crdt_docs (
        id TEXT PRIMARY KEY,
        state BLOB
      )
    `);
  });
};

export default db;
```

---

### 22. Change Queue (`syncQueue.ts`)

```typescript
import { v4 as uuid } from 'uuid';
import db from '../db/database';

export const addToQueue = (
  entityType: string,
  entityId: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  payload: object,
) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO change_log (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), entityType, entityId, operation, JSON.stringify(payload), Date.now()],
    );
  });
};
```

---

### 23. API Layer (`syncAPI.ts`)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

export const pushChanges = async (changes: any[]) => {
  const token = await AsyncStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ changes }),
  });
  return response.json();
};

export const pullChanges = async (lastSync: number) => {
  const token = await AsyncStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/sync/pull?last_sync=${lastSync}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

---

### 24. Conflict Resolver (`conflictResolver.ts`)

```typescript
interface SyncRecord {
  id: string;
  updated_at: number;
  [key: string]: any;
}

export const resolveConflict = (
  local: SyncRecord,
  remote: SyncRecord,
): SyncRecord => {
  // Last-write-wins: most recent updated_at wins
  return remote.updated_at > local.updated_at ? remote : local;
};
```

---

### 25. Sync Engine (`syncEngine.ts`)

```typescript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from '../db/database';
import { pushChanges, pullChanges } from './syncAPI';
import { resolveConflict } from './conflictResolver';

let isSyncing = false;

// ─── Main Entry Point ────────────────────────────────────────────────────────

export const syncEngine = async () => {
  if (isSyncing) return;

  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  isSyncing = true;
  try {
    await pushLocalChanges();
    await pullRemoteChanges();
  } finally {
    isSyncing = false;
  }
};

// ─── Push ────────────────────────────────────────────────────────────────────

const pushLocalChanges = async () => {
  db.transaction(async tx => {
    tx.executeSql(
      `SELECT * FROM change_log WHERE synced = 0 LIMIT 100`,
      [],
      async (_, result) => {
        if (result.rows.length === 0) return;

        const changes = Array.from(
          { length: result.rows.length },
          (_, i) => result.rows.item(i),
        );

        await pushChanges(changes);
        await markChangesAsSynced(changes.map(c => c.id));
      },
    );
  });
};

const markChangesAsSynced = (ids: string[]) => {
  const placeholders = ids.map(() => '?').join(',');
  db.transaction(tx => {
    tx.executeSql(
      `UPDATE change_log SET synced = 1 WHERE id IN (${placeholders})`,
      ids,
    );
  });
};

// ─── Pull ────────────────────────────────────────────────────────────────────

const pullRemoteChanges = async () => {
  const lastSyncTime = Number(await AsyncStorage.getItem('last_sync')) || 0;
  const data = await pullChanges(lastSyncTime);

  await applyRemoteChanges('projects', data.projects);
  await applyRemoteChanges('tasks', data.tasks);
  await applyDeletes(data.deleted);

  await AsyncStorage.setItem('last_sync', String(data.server_time));
};

const applyRemoteChanges = async (table: string, items: any[]) => {
  for (const item of items) {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM ${table} WHERE id = ?`,
        [item.id],
        (_, result) => {
          if (result.rows.length > 0) {
            const local = result.rows.item(0);
            const resolved = resolveConflict(local, item);
            tx.executeSql(
              `UPDATE ${table} SET name=?, status=?, updated_at=? WHERE id=?`,
              [resolved.name, resolved.status, resolved.updated_at, resolved.id],
            );
          } else {
            tx.executeSql(
              `INSERT INTO ${table} (id, name, status, updated_at) VALUES (?, ?, ?, ?)`,
              [item.id, item.name, item.status, item.updated_at],
            );
          }
        },
      );
    });
  }
};

const applyDeletes = async (deleted: { entity: string; id: string }[]) => {
  for (const { entity, id } of deleted) {
    db.transaction(tx => {
      tx.executeSql(`DELETE FROM ${entity} WHERE id = ?`, [id]);
    });
  }
};
```

---

### 26. Auto-Sync Triggers

```typescript
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncEngine } from '../sync/syncEngine';

export const useSyncOnMount = () => {
  useEffect(() => {
    syncEngine();

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncEngine();
      }
    });

    return unsubscribe;
  }, []);
};
```

---

### 27. Production Hardening

| Concern | Mitigation |
|---|---|
| Sync while backgrounded | Use `react-native-background-fetch` |
| Auth token expiry during sync | Refresh token before sync starts |
| Large payloads | Chunked push in batches of 50–100 |
| Sync loop on failure | Exponential backoff with max retries |
| Corrupted local DB | SQLite integrity check on startup |
| Double-push the same change | Idempotency key per `change_log` entry |

---

## Part IV: Backend Sync Processor

---

### 28. Backend Architecture

```
POST /sync/push  ──→  SyncController  ──→  SyncService.processPush()
                                               │
                                               ├── SyncProcessor.processChange()
                                               │     ├── handleCreate()
                                               │     ├── handleUpdate() + resolveConflict()
                                               │     └── handleDelete()
                                               └── Returns results array

GET /sync/pull   ──→  SyncController  ──→  SyncService.processPull()
                                               │
                                               └── SELECT WHERE updated_at > lastSync
```

---

### 29. PostgreSQL Schema

**Projects:**

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT,
  status TEXT,
  updated_at BIGINT,
  deleted_at BIGINT
);

CREATE INDEX idx_projects_updated_at ON projects(updated_at);
```

**Tasks:**

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID,
  title TEXT,
  status TEXT,
  assigned_to UUID,
  updated_at BIGINT,
  deleted_at BIGINT
);

CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);
```

**Sync state (per user/device):**

```sql
CREATE TABLE sync_state (
  user_id UUID,
  device_id TEXT,
  last_sync BIGINT,
  PRIMARY KEY (user_id, device_id)
);
```

**CRDT document store:**

```sql
CREATE TABLE crdt_documents (
  id UUID PRIMARY KEY,
  state BYTEA,         -- serialized Yjs state
  updated_at BIGINT
);
```

---

### 30. Controller (`sync.controller.ts`)

```typescript
import { syncService } from './sync.service';

export const push = async (req, res) => {
  const { changes } = req.body;
  const userId = req.user.id;

  const result = await syncService.processPush(userId, changes);
  res.send(result);
};

export const pull = async (req, res) => {
  const lastSync = Number(req.query.last_sync);
  const userId = req.user.id;

  const data = await syncService.processPull(userId, lastSync);
  res.send(data);
};
```

---

### 31. Sync Service (`sync.service.ts`)

```typescript
import { processChange } from './sync.processor';
import { db } from '../../db/db';

export const syncService = {
  async processPush(userId: string, changes: any[]) {
    const results = [];

    for (const change of changes) {
      try {
        const result = await processChange(userId, change);
        results.push({ id: change.id, status: 'ok', result });
      } catch (err) {
        results.push({ id: change.id, status: 'error', error: err.message });
      }
    }

    return { success: true, results };
  },

  async processPull(userId: string, lastSync: number) {
    const projects = await db.query(
      `SELECT * FROM projects WHERE updated_at > $1`,
      [lastSync],
    );

    const tasks = await db.query(
      `SELECT * FROM tasks WHERE updated_at > $1`,
      [lastSync],
    );

    const deleted = await db.query(
      `
        SELECT 'projects' AS entity, id FROM projects WHERE deleted_at > $1
        UNION
        SELECT 'tasks' AS entity, id FROM tasks WHERE deleted_at > $1
      `,
      [lastSync],
    );

    return {
      projects: projects.rows,
      tasks: tasks.rows,
      deleted: deleted.rows,
      server_time: Date.now(),
    };
  },
};
```

---

### 32. Sync Processor (`sync.processor.ts`)

```typescript
import { db } from '../../db/db';
import { resolveConflict } from './sync.conflict';

export const processChange = async (userId: string, change: any) => {
  const { entity_type, entity_id, operation, payload } = change;
  const table = entity_type + 's'; // 'task' → 'tasks'

  const existing = await db.query(
    `SELECT * FROM ${table} WHERE id = $1`,
    [entity_id],
  );

  if (operation === 'CREATE') return handleCreate(table, payload);
  if (operation === 'UPDATE') return handleUpdate(table, existing.rows[0], payload);
  if (operation === 'DELETE') return handleDelete(table, entity_id);
};

const handleCreate = async (table: string, payload: any) => {
  await db.query(
    `INSERT INTO ${table} (id, name, status, updated_at) VALUES ($1, $2, $3, $4)`,
    [payload.id, payload.name, payload.status, Date.now()],
  );
  return { success: true };
};

const handleUpdate = async (table: string, existing: any, payload: any) => {
  if (!existing) return handleCreate(table, payload);

  const resolved = resolveConflict(existing, payload);
  await db.query(
    `UPDATE ${table} SET name=$1, status=$2, updated_at=$3 WHERE id=$4`,
    [resolved.name, resolved.status, resolved.updated_at, resolved.id],
  );
  return { success: true };
};

const handleDelete = async (table: string, id: string) => {
  await db.query(
    `UPDATE ${table} SET deleted_at=$1 WHERE id=$2`,
    [Date.now(), id],
  );
  return { success: true };
};
```

---

### 33. Conflict Resolution (`sync.conflict.ts`)

```typescript
export const resolveConflict = (server: any, client: any) => {
  // Last-write-wins: most recent updated_at timestamp wins
  return client.updated_at > server.updated_at ? client : server;
};
```

---

### 34. Input Validation (`sync.validator.ts`)

```typescript
import { z } from 'zod';

export const changeSchema = z.object({
  entity_type: z.enum(['project', 'task']),
  entity_id: z.string().uuid(),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.record(z.any()),
});

export const validateChanges = (changes: unknown[]) => {
  return changes.map((change, i) => {
    const result = changeSchema.safeParse(change);
    if (!result.success) {
      throw new Error(`Invalid change at index ${i}: ${result.error.message}`);
    }
    return result.data;
  });
};
```

---

### 35. Performance & Scaling

**Performance optimizations:**

| Technique | Implementation |
|---|---|
| Batch inserts | `INSERT INTO tasks (...) VALUES (...), (...)` |
| Indexed queries | `CREATE INDEX idx_tasks_updated_at ON tasks(updated_at)` |
| Pull pagination | `LIMIT 1000` per pull response |
| Parallel processing | `await Promise.all(batch.map(processChange))` |

**Scaling phases:**

| Phase | Architecture |
|---|---|
| Phase 1 | Single Node.js server |
| Phase 2 | BullMQ + Redis queue for async processing |
| Phase 3 | Kafka event streaming for high throughput |
| Phase 4 | Microservices per domain module |

---

## Part V: WebSocket Real-Time Layer

---

### 36. Real-Time Architecture

Two complementary data paths:

| Path | Technology | Purpose |
|---|---|---|
| **Offline Sync** | SQLite ↔ REST `/sync/push` + `/sync/pull` | Reliability, guaranteed delivery |
| **Real-Time** | WebSocket push | Speed, instant UI updates |

**Rule: WebSockets = speed. Sync engine = correctness.**

```
Mobile App
  ├── SQLite
  ├── Sync Engine ──────────────────────────────────┐
  └── WebSocket Client                               │
          ⇅                                          │
   WebSocket Gateway (Node.js)                       │
          ⇅                                          │
   Event Bus (Redis / Kafka)                         │
          ⇅                                          │
   Sync Processor + PostgreSQL ←────────────────────┘
```

---

### 37. WebSocket Server (`ws.server.ts`)

Uses **Socket.IO** (production-ready).

```bash
npm install socket.io
```

```typescript
import { Server } from 'socket.io';

export const initWebSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || [] },
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const user = verifyToken(token);
    if (!user) return next(new Error('Unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    socket.on('join_project', ({ projectId }) => {
      if (!userHasAccess(socket.data.user, projectId)) return;
      socket.join(`project:${projectId}`);
      trackPresence(io, projectId, socket.data.user.id, true);
    });

    socket.on('leave_project', ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      trackPresence(io, projectId, socket.data.user.id, false);
    });
  });

  return io;
};
```

---

### 38. Presence System (`presence.ts`)

**MVP (in-memory):**

```typescript
const presenceMap = new Map<string, Set<string>>();
// key: projectId → Set of userIds

export const trackPresence = (
  io,
  projectId: string,
  userId: string,
  isOnline: boolean,
) => {
  if (!presenceMap.has(projectId)) {
    presenceMap.set(projectId, new Set());
  }
  const users = presenceMap.get(projectId)!;
  isOnline ? users.add(userId) : users.delete(userId);

  io.to(`project:${projectId}`).emit('presence_update', {
    projectId,
    users: Array.from(users),
  });
};
```

**Production (Redis-backed):**

```bash
# Store presence in Redis for horizontal scaling
SET project:123:users [user1, user2]  EXPIRE 3600
```

---

### 39. Broadcasting Changes

Hook into the Sync Processor to broadcast after every successful DB write:

```typescript
// In sync.processor.ts — after handleUpdate():
await db.query(`UPDATE tasks SET ...`);

io.to(`project:${task.project_id}`).emit('task_updated', {
  id: task.id,
  status: task.status,
  updated_at: task.updated_at,
});
```

---

### 40. Mobile WebSocket Client (`ws.client.ts`)

```bash
npm install socket.io-client
```

```typescript
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const createSocket = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  return io(process.env.EXPO_PUBLIC_API_URL!, {
    transports: ['websocket'],
    auth: { token },
  });
};

export const joinProject = (socket, projectId: string) => {
  socket.emit('join_project', { projectId });
};
```

---

### 41. Live Update Handlers

```typescript
// Task update
socket.on('task_updated', (data) => {
  updateTaskLocal(data);                              // update SQLite
  dispatch({ type: 'TASK_UPDATED', payload: data }); // update UI
});

// Presence
socket.on('presence_update', ({ users }) => {
  setOnlineUsers(users);
});

// Typing indicator
socket.on('typing', ({ userId, taskId }) => {
  showTypingIndicator(userId, taskId);
});
```

---

### 42. Sync + WebSocket Integration Rules

| Rule | Reason |
|---|---|
| Always write to SQLite first | SQLite is source of truth on device |
| WebSocket updates also go to SQLite | Prevents data loss on WS disconnect |
| Sync engine reconciles later | Guarantees consistency even if WS drops |
| WebSocket ≠ source of truth | Source of truth = Sync Engine + PostgreSQL |

---

### 43. WebSocket Security

**JWT authentication on connect (mandatory):**

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  if (!user) return next(new Error('Unauthorized'));
  socket.data.user = user;
  next();
});
```

**Project-level authorization before joining room:**

```typescript
socket.on('join_project', ({ projectId }) => {
  if (!userHasAccessToProject(socket.data.user.id, projectId)) return;
  socket.join(`project:${projectId}`);
});
```

---

### 44. WebSocket Scaling

| Phase | Architecture |
|---|---|
| Phase 1 | Single WebSocket server |
| Phase 2 | Redis adapter for horizontal scaling (`@socket.io/redis-adapter`) |
| Phase 3 | Kafka event streaming for fan-out at scale |

---

## Part VI: CRDT Collaborative Editing

---

### 45. Why CRDT

**Traditional sync (last-write-wins) problem:** Two users edit the same field → one edit is
silently lost.

**CRDT guarantee:** All changes merge automatically — no data loss, no conflicts.

**Example:**

```
User A (online):  { "title": "Build house" }
User B (offline): { "status": "in_progress" }

CRDT result:      { "title": "Build house", "status": "in_progress" }
```

CRDT properties:

- **Commutative** — operation order doesn't matter
- **Associative** — grouping doesn't change the result
- **Idempotent** — applying the same update twice is safe

---

### 46. CRDT Strategy

| Data Type | CRDT Type | Library |
|---|---|---|
| Text (notes, comments) | Rich text CRDT | Yjs (`Y.Text`) |
| Tasks / Objects | LWW-Element Map | Yjs (`Y.Map`) |
| Lists (task ordering) | Replicated Growable Array | Yjs (`Y.Array`) |

```bash
npm install yjs y-websocket
```

---

### 47. Document Model

Each project = one CRDT document with typed shared structures:

```typescript
import * as Y from 'yjs';

const doc = new Y.Doc();

export const tasksMap    = doc.getMap('tasks');    // task objects (LWW)
export const taskOrder   = doc.getArray('order');  // task ordering (RGA)
export const projectNotes = doc.getText('notes');  // rich text
```

---

### 48. Task CRDT

```typescript
// Create or update a task (no explicit conflict handling needed)
export const upsertTask = (task: any) => {
  tasksMap.set(task.id, { ...task, updated_at: Date.now() });
};

// Delete a task (CRDT-safe tombstone)
export const deleteTask = (taskId: string) => {
  tasksMap.delete(taskId);
};
```

Yjs tracks all changes as operations and merges them automatically across devices.

---

### 49. Real-Time Text Editing

```typescript
const notes = doc.getText('notes');

// Insert text
notes.insert(0, 'Project started');

// Observe and render changes
notes.observe(event => {
  updateUITextView(notes.toString());
});
```

Provides Google Docs-level collaboration: concurrent cursor-safe edits, no overwrites.

---

### 50. CRDT + WebSocket Bridge

```typescript
// Send local CRDT changes via WebSocket
doc.on('update', (update: Uint8Array) => {
  socket.emit('crdt:update', { projectId, update });
});

// Apply incoming CRDT changes
socket.on('crdt:update', ({ update }: { update: Uint8Array }) => {
  Y.applyUpdate(doc, update);
});
```

**Server relay — does NOT resolve conflicts; CRDT guarantees correctness:**

```typescript
io.on('connection', (socket) => {
  socket.on('crdt:update', ({ projectId, update }) => {
    if (!userHasAccess(socket.data.user, projectId)) return;
    socket.to(`project:${projectId}`).emit('crdt:update', { update });
    queueCRDTUpdate({ projectId, update }); // async persistence
  });
});
```

---

### 51. CRDT Persistence

**Save to SQLite (mobile):**

```typescript
export const saveDoc = (projectId: string) => {
  const state = Y.encodeStateAsUpdate(doc);
  db.transaction(tx => {
    tx.executeSql(
      `INSERT OR REPLACE INTO crdt_docs (id, state) VALUES (?, ?)`,
      [projectId, state],
    );
  });
};
```

**Load from SQLite (mobile):**

```typescript
export const loadDoc = (projectId: string) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT state FROM crdt_docs WHERE id = ?`,
      [projectId],
      (_, result) => {
        if (result.rows.length > 0) {
          Y.applyUpdate(doc, result.rows.item(0).state);
        }
      },
    );
  });
};
```

---

### 52. Presence & Awareness

Yjs includes a built-in Awareness protocol:

```typescript
import { Awareness } from 'y-protocols/awareness';

const awareness = new Awareness(doc);

awareness.setLocalState({
  user: {
    id: currentUser.id,
    name: currentUser.name,
    color: '#3B82F6',
  },
});

// Broadcast via WebSocket
awareness.on('change', () => {
  socket.emit('awareness:update', awareness.getLocalState());
});

socket.on('awareness:update', (state) => {
  awareness.setLocalState(state);
});
```

Enables: live cursors, user avatars, typing indicators, task editing badges.

---

## Part VII: Unified Architecture

---

### 53. System Diagram

```
                ┌───────────────────────────┐
                │       Mobile App          │
                │                           │
                │  ┌───────────────┐        │
                │  │   CRDT (Yjs)  │◄────┐  │
                │  └──────┬────────┘     │  │
                │         │ updates      │  │
                │  ┌──────▼────────┐     │  │
                │  │  SQLite Store │     │  │
                │  └──────┬────────┘     │  │
                │         │              │  │
                │  ┌──────▼────────┐     │  │
                │  │  Sync Engine  │─────┼──┼──────────┐
                │  └───────────────┘     │  │          │
                │                        │  │          │
                │  ┌───────────────┐     │  │          │
                │  │  WebSocket    │─────┘  │          │
                │  │  Client       │────────┼──────────┘
                │  └───────────────┘        │
                └───────────────────────────┘
                                             ⇅
                              ┌───────────────────────────┐
                              │     Backend System        │
                              │                           │
                              │  WebSocket Gateway        │
                              │        ⇅                  │
                              │  CRDT Update Relay        │
                              │        ⇅                  │
                              │  Sync Processor (REST)    │
                              │        ⇅                  │
                              │  PostgreSQL + CRDT Store  │
                              └───────────────────────────┘
```

---

### 54. Data Flow Golden Rules

**Real-Time Path (CRDT + WebSocket):**

1. User edits → CRDT updates locally
2. CRDT emits binary diff
3. WebSocket sends diff to server
4. Server broadcasts to other clients
5. Other clients apply update instantly

**Reliable Path (Sync Engine):**

1. CRDT snapshot saved to SQLite
2. Sync engine pushes to backend on schedule / reconnect
3. Backend persists canonical state
4. Other devices pull on next sync window

**Rule: WebSocket = speed. Sync Engine = correctness.**

---

### 55. Unified Mobile Implementation

```typescript
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';

// 1. Initialize CRDT document per project
export const doc      = new Y.Doc();
export const tasksMap = doc.getMap('tasks');
export const notes    = doc.getText('notes');

// 2. Connect WebSocket
const socket = io(API_URL, { transports: ['websocket'], auth: { token } });

// 3. Bridge CRDT ↔ WebSocket
doc.on('update', (update: Uint8Array) => {
  socket.emit('crdt:update', { projectId, update });
});

socket.on('crdt:update', ({ update }: { update: Uint8Array }) => {
  Y.applyUpdate(doc, update);
});

// 4. Persist CRDT snapshots to SQLite (debounced)
doc.on('update', debounce(() => saveDoc(projectId), 5000));

// 5. Sync engine runs in background every 60 seconds
setInterval(syncEngine, 60_000);
```

---

### 56. Unified Backend Implementation

#### WebSocket Gateway

```typescript
io.on('connection', (socket) => {
  socket.on('join:project', (projectId) => {
    socket.join(`project:${projectId}`);
  });

  socket.on('crdt:update', ({ projectId, update }) => {
    socket.to(`project:${projectId}`).emit('crdt:update', { update });
    queueCRDTUpdate({ projectId, update }); // async, non-blocking
  });
});
```

#### CRDT Batch Processor (persists every 1 second)

```typescript
import * as Y from 'yjs';
import { db } from '../db';

const queue: { projectId: string; update: Uint8Array }[] = [];
const docs  = new Map<string, Y.Doc>();

export const queueCRDTUpdate = (item: { projectId: string; update: Uint8Array }) => {
  queue.push(item);
};

setInterval(async () => {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 100);

  for (const { projectId, update } of batch) {
    if (!docs.has(projectId)) docs.set(projectId, new Y.Doc());
    const doc = docs.get(projectId)!;
    Y.applyUpdate(doc, update);

    const state = Y.encodeStateAsUpdate(doc);
    await db.query(
      `UPDATE crdt_documents SET state=$1, updated_at=$2 WHERE id=$3`,
      [state, Date.now(), projectId],
    );
  }
}, 1000);
```

---

### 57. End-to-End Flow

**Scenario: User A edits a task title while User B is offline**

| Step | Device A (online) | Server | Device B (offline) |
|---|---|---|---|
| 1 | User edits task → CRDT updates locally | | |
| 2 | WebSocket sends CRDT diff | Broadcasts to project room | |
| 3 | SQLite snapshot saved | Persists CRDT state | Missed WebSocket event |
| 4 | | | Reconnects |
| 5 | | | Sync Engine pulls CRDT snapshot |
| 6 | | | CRDT state applied — no conflicts |

---

## Part VIII: Advanced — Field-Level CRDT, Multiplayer UI & Scaling

---

### 58. Task-Specific CRDT

Generic CRDT is insufficient for domain objects. Construction tasks need field-level merge
awareness.

#### 58.1 Hybrid Field Strategy

| Field | CRDT Type | Merge Rule |
|---|---|---|
| `title` | `Y.Text` | Character-level merge |
| `notes` | `Y.Text` | Collaborative editing |
| `status` | LWW Register | Last write wins |
| `assigned_to` | LWW Register | Role-based override |
| `budget` | Max/Min CRDT | Prevent invalid overwrite |

#### 58.2 Task CRDT Factory

```typescript
import * as Y from 'yjs';

export const createTaskCRDT = (doc: Y.Doc) => ({
  title: doc.getText('title'),
  notes: doc.getText('notes'),
  meta:  doc.getMap('meta'),   // status, assigned_to, budget
});
```

#### 58.3 Safe Field Update

```typescript
export const updateTaskField = (
  task: ReturnType<typeof createTaskCRDT>,
  field: string,
  value: any,
  user: { id: string; role: string },
) => {
  if (field === 'title' || field === 'notes') {
    task[field].delete(0, task[field].length);
    task[field].insert(0, value);
    return;
  }

  const current  = task.meta.get(field);
  const incoming = { value, updated_at: Date.now(), updated_by: user.id, updated_by_role: user.role };

  task.meta.set(field, resolveFieldConflict(field, current, incoming, user));
};
```

#### 58.4 Permissions-Aware Conflict Resolver

```typescript
const ROLE_PRIORITY: Record<string, number> = {
  sponsor:          4,
  project_manager:  3,
  contractor:       2,
  viewer:           1,
};

export const resolveFieldConflict = (
  field: string,
  current: any,
  incoming: any,
  user: { role: string },
) => {
  if (!current) return incoming;

  // Higher role always wins
  if (ROLE_PRIORITY[user.role] > ROLE_PRIORITY[current.updated_by_role]) {
    return incoming;
  }

  // Time-based fallback
  return incoming.updated_at > current.updated_at ? incoming : current;
};
```

---

### 59. Multiplayer UI (Cursors & Selections)

#### 59.1 Awareness Setup

```typescript
import { Awareness } from 'y-protocols/awareness';

const awareness = new Awareness(doc);

awareness.setLocalState({
  user: {
    id:    currentUser.id,
    name:  currentUser.name,
    color: currentUser.avatarColor,
  },
});
```

#### 59.2 Cursor Tracking

```typescript
const updateCursor = (position: { x: number; y: number }) => {
  awareness.setLocalStateField('cursor', position);
};
```

#### 59.3 Live Cursor Overlay (React Native)

```tsx
interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number };
}

const CursorOverlay: React.FC<{ users: AwarenessUser[] }> = ({ users }) => (
  <>
    {users.map(user => (
      <View
        key={user.id}
        style={{
          position: 'absolute',
          top: user.cursor.y,
          left: user.cursor.x,
          backgroundColor: user.color,
          borderRadius: 4,
          padding: 4,
        }}
      >
        <Text style={{ color: 'white', fontSize: 11 }}>{user.name}</Text>
      </View>
    ))}
  </>
);
```

#### 59.4 Task Editing Indicators

```typescript
// Mark the task currently being edited
awareness.setLocalStateField('editingTask', taskId);

// In the task card renderer
const editingUsers = getAwarenessStates(awareness)
  .filter(state => state.editingTask === task.id && state.user.id !== currentUser.id);

if (editingUsers.length > 0) {
  showBadge(`${editingUsers[0].user.name} is editing…`);
}
```

#### 59.5 Text Selection Sharing

```typescript
awareness.setLocalStateField('selection', { start: 10, end: 25 });
```

---

### 60. Scaling to Millions (Kafka + Sharded CRDT)

#### 60.1 Architecture at Scale

```
Clients (millions)
    ⇅
WebSocket Gateway (horizontal, N nodes)
    ⇅
Kafka Event Bus (partitioned by projectId)
    ⇅
CRDT Workers (sharded per Kafka partition)
    ⇅
PostgreSQL / S3 (CRDT snapshots)
```

#### 60.2 Shard by Project

Each project = 1 CRDT document = 1 Kafka partition key.

```typescript
producer.send({
  topic: 'crdt-updates',
  messages: [{
    key: projectId,                              // same project → same partition
    value: JSON.stringify({ projectId, update: Array.from(update) }),
  }],
});
```

#### 60.3 CRDT Worker Consumer

```typescript
consumer.run({
  eachMessage: async ({ message }) => {
    const { projectId, update } = JSON.parse(message.value!.toString());
    const doc = getOrCreateDoc(projectId);  // LRU cache
    Y.applyUpdate(doc, new Uint8Array(update));

    if (shouldSnapshot(projectId, doc)) {
      await persistSnapshot(projectId, doc);
    }
  },
});
```

#### 60.4 Document Cache (LRU)

```typescript
import { LRUCache } from 'lru-cache';
import * as Y from 'yjs';

const docCache = new LRUCache<string, Y.Doc>({ max: 1000 });

const getOrCreateDoc = (projectId: string): Y.Doc => {
  if (!docCache.has(projectId)) {
    const doc = new Y.Doc();
    docCache.set(projectId, doc);
  }
  return docCache.get(projectId)!;
};
```

#### 60.5 Storage Strategy

| Layer | Contents | Technology |
|---|---|---|
| Hot (active docs) | In-memory LRU cache | Node.js process memory |
| Warm (recent snapshots) | Redis | `redis.set(key, state)` |
| Cold (history / archive) | PostgreSQL / S3 | `crdt_documents` table |

#### 60.6 Crash Recovery

1. Load latest snapshot from PostgreSQL
2. Replay Kafka events since snapshot timestamp
3. Restore full document state

#### 60.7 Multi-Region Strategy

- Geo-shard projects by user region (Africa, EU, US, etc.)
- Edge WebSocket nodes per region for low latency
- Regional Kafka clusters with cross-region replication for diaspora users
