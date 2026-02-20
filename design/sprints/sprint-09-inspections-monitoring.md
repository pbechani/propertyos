# Sprint 09 — Government Inspections, Monitoring & Verification
**Phases 8 & 9 | Weeks 46–55**

## Goal
Integrate government inspection workflows into construction stages, build immutable progress verification with geo-fencing, and add dispute resolution tooling. These features are critical for diaspora trust.

---

## Deliverables Checklist

### Phase 8: Government Inspection Workflow
- [ ] Inspection requirements per construction stage (configurable per region)
- [ ] Inspector marketplace (government-approved inspectors)
- [ ] Inspection booking & scheduling
- [ ] Inspection report submission (pass/fail/conditional)
- [ ] Deficiency tracking + re-inspection workflow
- [ ] Inspector portal (assignments, reports, certificates)
- [ ] Compliance certificate management (electrical, plumbing, gas, occupancy)
- [ ] Stage blocker — block progression until inspection passes

### Phase 9: Monitoring & Verification
- [ ] Third-party independent inspector booking
- [ ] Immutable progress records (SHA-256 hashing, append-only ledger)
- [ ] Advanced geo-verification (site geo-fence, off-site alerts)
- [ ] EXIF metadata enforcement + photo manipulation detection
- [ ] Multi-party milestone approval (owner + inspector + PM)
- [ ] Dispute filing, evidence collection, timeline reconstruction

---

## Data Models

### `inspection.inspection_requirements`
```sql
CREATE TABLE inspection.inspection_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country CHAR(2) NOT NULL,
  region VARCHAR(100),
  construction_stage SMALLINT NOT NULL,
  inspection_type VARCHAR(50) NOT NULL, -- foundation, structural, electrical, plumbing, occupancy
  authority_name VARCHAR(255),
  is_mandatory BOOLEAN DEFAULT TRUE,
  description TEXT,
  UNIQUE(country, construction_stage, inspection_type)
);
```

### `inspection.inspector_profiles`
```sql
CREATE TABLE inspection.inspector_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES identity.users(id),
  inspector_type VARCHAR(30) NOT NULL, -- government, independent, third_party
  registration_number VARCHAR(100),
  issuing_authority VARCHAR(255),
  specializations JSONB DEFAULT '[]', -- ["structural","electrical","plumbing"]
  service_areas JSONB DEFAULT '[]',   -- [{country, region, city}]
  license_expiry DATE,
  license_document_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 0,
  total_inspections INTEGER DEFAULT 0
);
```

### `inspection.inspection_requests`
```sql
CREATE TABLE inspection.inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_reference VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID REFERENCES construction.projects(id),
  stage_id UUID REFERENCES construction.project_stages(id),
  inspection_type VARCHAR(50) NOT NULL,
  requested_by UUID REFERENCES identity.users(id),
  assigned_inspector_id UUID REFERENCES identity.users(id),
  scheduled_date TIMESTAMPTZ,
  preferred_dates JSONB DEFAULT '[]',
  site_access_instructions TEXT,
  status VARCHAR(20) DEFAULT 'requested', -- requested, scheduled, in_progress, report_submitted, passed, failed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `inspection.inspection_reports`
```sql
CREATE TABLE inspection.inspection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES inspection.inspection_requests(id),
  inspector_id UUID REFERENCES identity.users(id),
  project_id UUID REFERENCES construction.projects(id),
  stage_id UUID REFERENCES construction.project_stages(id),
  outcome VARCHAR(20) NOT NULL, -- passed, failed, conditional_pass
  report_date DATE NOT NULL,
  site_visit_at TIMESTAMPTZ,
  inspector_lat NUMERIC(9,6),    -- GPS when report submitted
  inspector_lng NUMERIC(9,6),
  summary TEXT,
  deficiencies JSONB DEFAULT '[]',  -- [{item, severity, photo_url, remediation_required}]
  conditions JSONB DEFAULT '[]',    -- for conditional_pass
  report_document_url TEXT,
  signature_url TEXT,
  hash VARCHAR(64),   -- SHA-256 of report content
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `inspection.compliance_certificates`
```sql
CREATE TABLE inspection.compliance_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  sale_id UUID REFERENCES sales.property_sales(id),
  certificate_type VARCHAR(50) NOT NULL, -- electrical, plumbing, gas, water, occupancy, completion
  certificate_number VARCHAR(100),
  issued_by VARCHAR(255),
  issued_date DATE,
  expiry_date DATE,
  certificate_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'valid', -- valid, expired, revoked
  hash VARCHAR(64),  -- SHA-256 of certificate file
  uploaded_by UUID REFERENCES identity.users(id),
  verified_by UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `inspection.progress_ledger` (Immutable — Phase 9)
```sql
CREATE TABLE inspection.progress_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_number BIGSERIAL,   -- monotonically increasing, never gaps
  project_id UUID REFERENCES construction.projects(id),
  entry_type VARCHAR(30) NOT NULL, -- progress_photo, milestone_complete, inspector_sign_off
  entry_id UUID NOT NULL,          -- references progress_entries or inspection_reports
  entry_hash VARCHAR(64) NOT NULL, -- SHA-256 of the referenced entry content
  previous_hash VARCHAR(64),       -- hash of the previous ledger entry (chain integrity)
  submitter_id UUID REFERENCES identity.users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
-- NEVER allow UPDATE or DELETE on this table
-- Grant INSERT only to application role
```

### `inspection.disputes`
```sql
CREATE TABLE inspection.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_reference VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID REFERENCES construction.projects(id),
  sale_id UUID REFERENCES sales.property_sales(id),
  filed_by UUID REFERENCES identity.users(id),
  against_party_id UUID REFERENCES identity.users(id),
  dispute_type VARCHAR(50), -- quality, payment, delay, misrepresentation, fraud
  description TEXT NOT NULL,
  evidence_entries JSONB DEFAULT '[]',  -- [{type, id, url, description}]
  timeline_events JSONB DEFAULT '[]',   -- reconstructed from audit logs
  status VARCHAR(20) DEFAULT 'filed', -- filed, under_review, mediation, resolved, dismissed
  resolution TEXT,
  resolved_by UUID REFERENCES identity.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Inspections
```
POST /api/v1/inspections/request                [project_owner, contractor]
GET  /api/v1/inspections/requests               [own requests / inspector assignments]
GET  /api/v1/inspections/requests/:id
PATCH /api/v1/inspections/requests/:id/schedule [inspector, admin]
POST /api/v1/inspections/requests/:id/report    [inspector]
GET  /api/v1/inspections/requests/:id/report
```

### Certificates
```
POST /api/v1/projects/:id/certificates          [conveyancer, inspector]
GET  /api/v1/projects/:id/certificates
GET  /api/v1/sales/:id/certificates
PATCH /api/v1/certificates/:id/verify           [admin]
```

### Inspector Marketplace
```
GET /api/v1/inspectors?type=government&country=ZW&specialization=structural
GET /api/v1/inspectors/:id
```

### Progress Ledger
```
GET /api/v1/projects/:id/ledger                 — full immutable progress chain
GET /api/v1/projects/:id/ledger/verify          — verify chain integrity
```

### Disputes
```
POST /api/v1/disputes
GET  /api/v1/disputes/me
GET  /api/v1/disputes/:id
POST /api/v1/disputes/:id/evidence
PATCH /api/v1/admin/disputes/:id/resolve        [admin]
```

---

## Stage Blocker Logic
When `requires_inspection = TRUE` for a construction stage:
1. Stage `status` moves to `inspection_pending` when contractor marks work done
2. Owner / PM requests inspection via the booking system
3. Inspector submits report
4. If `outcome = passed` → stage auto-advances to `completed`, escrow release triggered
5. If `outcome = failed` → stage remains `blocked`, deficiencies logged, re-inspection required
6. If `outcome = conditional_pass` → PM acknowledges conditions, manual unblock by admin

---

## Geo-Fence Verification
For every photo upload (progress entry):
1. Extract EXIF GPS coordinates
2. Compute distance from registered site coordinates (Haversine formula)
3. If distance > 500m → set `geo_verified = false`, create alert
4. Alert sent to PM and project owner with map showing where photo was actually taken

```typescript
function haversineDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

---

## Progress Chain Integrity Verification
```typescript
// Verify the progress ledger chain integrity
async function verifyChainIntegrity(projectId: string): Promise<{valid: boolean, brokenAt?: number}> {
  const entries = await db.query(
    'SELECT * FROM inspection.progress_ledger WHERE project_id = $1 ORDER BY sequence_number ASC',
    [projectId]
  );
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].previous_hash !== entries[i-1].entry_hash) {
      return { valid: false, brokenAt: entries[i].sequence_number };
    }
  }
  return { valid: true };
}
```

---

## Acceptance Criteria
- [ ] Foundation inspection required before stage 2 can begin
- [ ] Inspector can submit report from mobile (offline capable)
- [ ] Failed inspection blocks stage and notifies all parties
- [ ] Compliance certificates visible to buyer in sale portal
- [ ] Every progress photo is checked against site geo-fence
- [ ] Off-site photo triggers alert (not blocked — just flagged)
- [ ] Progress ledger chain integrity verifiable via API
- [ ] Dispute filed with evidence collection reconstructs timeline from audit logs
- [ ] Inspector rating updated after project owner rates them

---

## Dependencies
- Sprint 02 (inspector role)
- Sprint 06 (construction stages, progress entries)

## Blocks
- Sprint 10 (logistics delivery confirmation uses same geo-verification)
- Sprint 11 (risk scoring uses inspection pass/fail data)
