# Sprint 06 — Construction Project Management
**Phase 5 | Weeks 23–30**

## Goal
Build the full construction project lifecycle management system — from project creation through stage-by-stage progress tracking, budget management, geo-tagged photo uploads, offline-first mobile, and escrow-linked milestone payments.

---

## Deliverables Checklist
- [ ] Project creation & dashboard
- [ ] Project role management (owner, PM, contractor)
- [ ] Milestone system with approval workflow
- [ ] 11 construction stage definitions + tracking
- [ ] Budget management (baseline, allocations, variance tracking)
- [ ] Change order management
- [ ] Mobile app — geo-tagged photo/video uploads
- [ ] Offline-first architecture (SQLite + background sync)
- [ ] EXIF validation (timestamp, GPS, device)
- [ ] Document vault (plans, permits, contracts)
- [ ] Project communication hub
- [ ] Escrow integration (milestone-based payment release)

---

## The 11 Construction Stages

| Stage | Name | Typical Inspection? |
|-------|------|---------------------|
| 1 | Site Preparation & Foundation | Yes |
| 2 | Substructure / Footings | Yes |
| 3 | Walling (Ground Floor) | No |
| 4 | Ring Beam | Yes |
| 5 | Walling (Upper Floor, if applicable) | No |
| 6 | Roofing Structure | Yes |
| 7 | Roof Covering & Waterproofing | No |
| 8 | External Plastering & Rendering | No |
| 9 | Internal Finishing (Plastering, Screeding) | No |
| 10 | Fit-Out (Electrical, Plumbing, Windows, Doors) | Yes |
| 11 | Final Finishing & Handover | Yes |

---

## Data Models

### `construction.projects`
```sql
CREATE TABLE construction.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_reference VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(30) DEFAULT 'new_build', -- new_build, renovation, extension
  property_id UUID REFERENCES property.properties(id), -- optional link
  owner_id UUID REFERENCES identity.users(id),
  project_manager_id UUID REFERENCES identity.users(id),
  status VARCHAR(20) DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  country CHAR(2) NOT NULL,
  site_latitude NUMERIC(9,6),
  site_longitude NUMERIC(9,6),
  site_address TEXT,
  total_budget NUMERIC(18,2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  escrow_account_id UUID REFERENCES financial.accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.project_stages`
```sql
CREATE TABLE construction.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  stage_number SMALLINT NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, inspection_pending, approved, completed, blocked
  allocated_budget NUMERIC(18,2),
  actual_cost NUMERIC(18,2) DEFAULT 0,
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  requires_inspection BOOLEAN DEFAULT FALSE,
  inspection_passed BOOLEAN,
  contractor_id UUID REFERENCES identity.users(id),
  UNIQUE(project_id, stage_number)
);
```

### `construction.milestones`
```sql
CREATE TABLE construction.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  stage_id UUID REFERENCES construction.project_stages(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  budget_amount NUMERIC(18,2),
  payment_amount NUMERIC(18,2), -- released from escrow on completion
  approved_by UUID REFERENCES identity.users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.progress_entries`
```sql
CREATE TABLE construction.progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  stage_id UUID REFERENCES construction.project_stages(id),
  submitted_by UUID REFERENCES identity.users(id),
  entry_type VARCHAR(20) DEFAULT 'progress', -- progress, delivery_confirmation, issue, daily_log
  notes TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  geo_accuracy_meters NUMERIC(8,2),
  captured_at TIMESTAMPTZ NOT NULL,   -- from device EXIF/GPS, not server time
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  device_metadata JSONB,  -- {device_id, os, app_version, camera_make}
  hash VARCHAR(64),       -- SHA-256 of the entry for immutability
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.progress_media`
```sql
CREATE TABLE construction.progress_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES construction.progress_entries(id),
  media_type VARCHAR(10) NOT NULL, -- image, video
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size_bytes INTEGER,
  exif_data JSONB,          -- full EXIF extracted server-side
  exif_latitude NUMERIC(9,6),
  exif_longitude NUMERIC(9,6),
  exif_timestamp TIMESTAMPTZ,
  exif_device VARCHAR(255),
  geo_verified BOOLEAN DEFAULT FALSE,   -- true if within site geo-fence
  timestamp_verified BOOLEAN DEFAULT FALSE, -- true if EXIF matches claimed time
  hash VARCHAR(64),         -- SHA-256 of raw file
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.expenses`
```sql
CREATE TABLE construction.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  stage_id UUID REFERENCES construction.project_stages(id),
  description VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- materials, labor, equipment, permits, other
  amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  receipt_url TEXT,
  submitted_by UUID REFERENCES identity.users(id),
  approved_by UUID REFERENCES identity.users(id),
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.change_orders`
```sql
CREATE TABLE construction.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  stage_id UUID REFERENCES construction.project_stages(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reason TEXT,
  budget_impact NUMERIC(18,2),    -- positive = increase, negative = decrease
  timeline_impact_days INTEGER,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  requested_by UUID REFERENCES identity.users(id),
  approved_by UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Offline-First Mobile Architecture

### Local SQLite Schema (Mobile)
```sql
-- Outbox table — unsynced local actions
CREATE TABLE local_outbox (
  id TEXT PRIMARY KEY,           -- client-generated UUID
  action_type TEXT NOT NULL,     -- 'create_progress_entry', 'upload_media', etc.
  payload TEXT NOT NULL,         -- JSON
  priority INTEGER DEFAULT 5,    -- 1=high (financials), 5=normal, 10=low
  created_at TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);

-- Local cache of project data
CREATE TABLE local_projects (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,  -- JSON
  synced_at TEXT
);
```

### Sync Strategy
1. App opens → fetch latest project data from API if online
2. All user actions written to `local_outbox` first
3. Background sync worker processes outbox (priority order)
4. On sync: server validates, creates records, returns server IDs
5. App updates local records with server IDs
6. Conflict resolution: **server wins** for financial data, **last write wins** for notes
7. Bandwidth-aware: large video uploads deferred to WiFi/4G only

### EXIF Validation Rules
Server-side validation on every photo upload:
- GPS coordinates must be within **500m** of registered site location
- Photo timestamp must be within **24 hours** of submission time
- If validation fails: flag media, notify PM, still accept but mark `geo_verified=false`

---

## API Endpoints

### Projects
```
POST  /api/v1/projects
GET   /api/v1/projects
GET   /api/v1/projects/:id
PATCH /api/v1/projects/:id
GET   /api/v1/projects/:id/summary     — budget vs actual, stage overview
```

### Stages
```
GET   /api/v1/projects/:id/stages
PATCH /api/v1/projects/:id/stages/:stageNum/start
PATCH /api/v1/projects/:id/stages/:stageNum/complete
```

### Progress
```
POST /api/v1/projects/:id/progress              — create entry (with media)
GET  /api/v1/projects/:id/progress              — timeline view
POST /api/v1/projects/:id/progress/sync-batch   — offline sync endpoint (array of entries)
```

### Budget
```
GET  /api/v1/projects/:id/budget                — budget vs actual breakdown
POST /api/v1/projects/:id/expenses              — add expense
POST /api/v1/projects/:id/change-orders         — submit change order
PATCH /api/v1/projects/:id/change-orders/:coId/approve
```

### Milestones & Payments
```
POST  /api/v1/projects/:id/milestones
PATCH /api/v1/projects/:id/milestones/:mId/complete
PATCH /api/v1/projects/:id/milestones/:mId/approve   — triggers escrow release
```

### Documents
```
POST /api/v1/projects/:id/documents
GET  /api/v1/projects/:id/documents
```

---

## Acceptance Criteria
- [ ] Project created, stages auto-populated from config
- [ ] Contractor can submit progress entry with geo-tagged photo from mobile
- [ ] Photos with GPS outside site boundary flagged automatically
- [ ] Offline submission queued locally, synced when connectivity returns
- [ ] Milestone approval triggers escrow release via Sprint 05 service
- [ ] Budget vs actual variance calculated correctly across all expenses
- [ ] Change order approval updates project budget
- [ ] All project actions logged in audit table
- [ ] SHA-256 hash stored per progress entry (immutability)
- [ ] Resumable uploads work for videos > 50MB

---

## Dependencies
- Sprint 02 (auth, contractor/PM roles)
- Sprint 05 (escrow account for milestone payments)

## Blocks
- Sprint 07 (contractors/suppliers need projects to bid on)
- Sprint 08 (government inspections tied to construction stages)
- Sprint 09 (monitoring & verification)
