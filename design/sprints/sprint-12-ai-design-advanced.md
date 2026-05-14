# Sprint 12 — AI Design Assistant & Advanced Features
**Phases 13–18 | Weeks 81–130**

## Goal
Build the AI-powered voice/text-to-floor-plan design system with auto-BOQ generation, then complete the platform with communication enhancements, lifecycle management, security hardening, bank/government integrations, and performance optimization.

---

## Prerequisites (Sprint 11 must be complete)

All AI Design features consume the **AI Engine infrastructure delivered in Sprint 11**. Do not start Sprint 12 until the following are operational:

| Prerequisite | Sprint 11 Component | Used By |
|---|---|---|
| LLM Gateway deployed | `ai_engine.llm_requests` table + gateway service | All design generation calls |
| pgvector embeddings live | `ai_engine.legislation_corpus` | Building code compliance check |
| RAG pipeline operational | `POST /api/v1/ai/legal-query` | Compliance validation step |
| Document AI running | `apps/ai-services/document_extraction/` | Floor plan image parsing |
| MLflow model registry | `apps/ai-services/risk_scoring/` | Cost estimation in design pipeline |
| Voice-to-text endpoint | `POST /api/v1/ai/voice-to-text` | Conversational design input |
| Celery + Redis workers | Background job infrastructure | Async generation jobs |

---

## Part A: AI Design Assistant (Phase 13 | Weeks 81–92)

### Deliverables
- [ ] Conversational design input (text + voice)
- [ ] AI floor plan generation (2D layouts)
- [ ] 3D model generation + photorealistic renders
- [ ] Multi-turn conversational refinement
- [ ] Building code compliance validation (via AI Legal Engine)
- [ ] Design template library
- [ ] Auto-BOQ generation from generated plans
- [ ] Real-time cost estimation during design
- [ ] Design export (PDF, DWG, PNG, 3D model)
- [ ] Share design with contractors for bidding

---

### Data Models

### `ai_engine.design_sessions`
```sql
CREATE TABLE ai_engine.design_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  user_id UUID REFERENCES identity.users(id),
  session_reference VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, abandoned
  conversation_history JSONB DEFAULT '[]',  -- [{role, content, timestamp}]
  current_requirements JSONB,  -- {bedrooms, bathrooms, style, budget, total_area_m2, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `ai_engine.generated_designs`
```sql
CREATE TABLE ai_engine.generated_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_engine.design_sessions(id),
  project_id UUID REFERENCES construction.projects(id),
  user_id UUID REFERENCES identity.users(id),
  design_name VARCHAR(255),
  requirements JSONB,             -- captured requirements
  floor_plan_svg TEXT,            -- SVG floor plan
  floor_plan_pdf_url TEXT,
  floor_plan_dwg_url TEXT,
  model_3d_url TEXT,              -- OBJ/FBX 3D model
  render_urls JSONB DEFAULT '[]', -- photorealistic render images
  extracted_dimensions JSONB,     -- {total_area_m2, room_list, wall_lengths, ...}
  compliance_check JSONB,         -- {passed: bool, issues: [{code, description}]}
  estimated_cost NUMERIC(18,2),
  currency CHAR(3) DEFAULT 'USD',
  boq_id UUID REFERENCES construction.boqs(id),  -- auto-generated BOQ
  version SMALLINT DEFAULT 1,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Design Generation Pipeline
```
1. User: "I want a 3-bedroom house, $40,000 budget, modern style"
   ↓
2. LLM: Parse requirements → structured JSON
   {bedrooms: 3, bathrooms: 2, style: "modern", budget: 40000, ...}
   ↓
3. LLM: Generate room layout description + dimension constraints
   ↓
4. CAD Engine (Python): Generate SVG floor plan from layout description
   - Uses architectural Python libraries (ezdxf, shapely, matplotlib)
   - Applies local building code constraints (min room sizes, setbacks)
   ↓
5. Blender API: Generate 3D model from floor plan
   ↓
6. Render Service: Photorealistic renders (perspective views)
   ↓
7. Compliance Engine: Check plan against building codes (RAG)
   ↓
8. BOQ Engine: Auto-extract dimensions → generate BOQ (Sprint 08 logic)
   ↓
9. Cost Engine: Attach supplier pricing to BOQ → estimate total cost
   ↓
10. Return: floor_plan_svg, renders, compliance_report, boq, cost_estimate
```

### API Endpoints
```
POST /api/v1/design/sessions                    — start design session
POST /api/v1/design/sessions/:id/message        — send message (text/voice)
GET  /api/v1/design/sessions/:id/designs        — current generated designs
POST /api/v1/design/sessions/:id/refine         — "make kitchen bigger", "add garage"
POST /api/v1/design/sessions/:id/designs/:dId/generate-boq   — auto-generate BOQ
POST /api/v1/design/sessions/:id/designs/:dId/export         — PDF/DWG export
POST /api/v1/design/sessions/:id/designs/:dId/share          — share with contractors
GET  /api/v1/design/templates                   — public design templates
GET  /api/v1/design/templates/:id               — specific template
```

---

## Part B: Communication & Advanced Features (Phase 14 | Weeks 93–100)

### Deliverables
- [ ] Video calls (WebRTC) for design reviews
- [ ] Full-text search with Elasticsearch (properties, contractors, suppliers)
- [ ] Property comparison tool (side-by-side)
- [ ] Market intelligence reports (monthly auto-generated)
- [ ] Referral & rewards system
- [ ] Multi-language i18n (English default + regional languages)
- [ ] Accessibility (WCAG 2.1 AA)

### Key Data Models
```sql
-- Referrals
CREATE TABLE identity.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES identity.users(id),
  referee_id UUID REFERENCES identity.users(id),
  referral_code VARCHAR(20) NOT NULL,
  reward_type VARCHAR(30),       -- discount, credit, commission
  reward_amount NUMERIC(10,2),
  reward_currency CHAR(3),
  status VARCHAR(20) DEFAULT 'pending', -- pending, qualified, rewarded
  qualified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Part C: Lifecycle & Property Management (Phase 15 | Weeks 101–108)

### Deliverables
- [ ] Warranty registration + tracking + claims
- [ ] Scheduled maintenance reminders + booking
- [ ] Rental management (tenant profiles, leases, rent collection)
- [ ] Property performance tracking (utility costs, rental income, ROI)
- [ ] Lifetime document vault (construction docs preserved forever)

### Key Data Models
```sql
CREATE TABLE construction.warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  property_id UUID REFERENCES property.properties(id),
  contractor_id UUID REFERENCES identity.users(id),
  warranty_type VARCHAR(50),       -- structural, roofing, electrical, plumbing, waterproofing
  coverage_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  warranty_document_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE construction.warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id UUID REFERENCES construction.warranties(id),
  filed_by UUID REFERENCES identity.users(id),
  description TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'filed',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE property.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  landlord_id UUID REFERENCES identity.users(id),
  tenant_id UUID REFERENCES identity.users(id),
  monthly_rent NUMERIC(12,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  lease_start DATE NOT NULL,
  lease_end DATE,
  deposit_amount NUMERIC(12,2),
  status VARCHAR(20) DEFAULT 'active',
  lease_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Part D: Advanced Security & Compliance (Phase 16 | Weeks 109–115)

### Deliverables
- [ ] MFA: SMS, TOTP (authenticator app), biometric (mobile)
- [ ] GDPR compliance tools (data export, right to deletion)
- [ ] ML-based fraud detection (transaction patterns, account takeover)
- [ ] Third-party penetration testing
- [ ] Compliance dashboard (ISO 27001, SOC 2 readiness)
- [ ] End-to-end encryption for sensitive messages

### MFA Implementation
```typescript
// MFA required for:
const MFA_REQUIRED_ACTIONS = [
  'escrow_release',
  'large_transaction',      // > $10,000
  'account_settings_change',
  'admin_operations',
  'bulk_data_export'
];
```

---

## Part E: Bank & Government Integrations (Phase 17 | Weeks 116–124)

### Deliverables
- [ ] Bank underwriting API (property valuation, credit score, mortgage pre-approval)
- [ ] Government registry APIs (Land Registry, Deeds Office, Tax Authority, Municipal)
- [ ] Open banking (Plaid / Mono — bank account linking, direct transfers)
- [ ] Government compliance automation (building permit applications)
- [ ] Risk score export API for lenders

### Integration Architecture
```typescript
// Government API integration layer (adapter pattern)
interface GovernmentAPIAdapter {
  checkTitleDeed(deedNumber: string): Promise<TitleDeedStatus>;
  getOwnershipHistory(propertyRef: string): Promise<OwnershipRecord[]>;
  submitBuildingPermit(application: PermitApplication): Promise<PermitReference>;
  checkPermitStatus(reference: string): Promise<PermitStatus>;
  getTransferDutyReceipt(transactionRef: string): Promise<DutyReceipt>;
}
// Each country gets its own implementation
// Fallback to manual workflow when API unavailable
```

---

## Part F: Platform Optimization & Scale (Phase 18 | Weeks 125–130)

### Deliverables
- [ ] Database query optimization + read replicas
- [ ] Service extraction (Escrow Service, Risk Service as independent services)
- [ ] Mobile app optimization (offline sync, battery, storage)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] CDN optimization
- [ ] Auto-scaling configuration

### Performance Targets
| Metric | Target |
|--------|--------|
| API p95 response time | < 300ms |
| Mobile app launch time | < 3 seconds |
| Property search results | < 500ms |
| Platform uptime | 99.5% |
| Offline sync success rate | > 99% |
| LLM query response | < 5 seconds |

### Service Extraction Priority
1. **Escrow Service** (highest criticality, financial isolation)
2. **Risk & Analytics Service** (read-heavy, independent scaling)
3. **AI Engine Service** (GPU compute isolation)
4. **Notification Service** (high throughput, independent)

---

## Acceptance Criteria Highlights

### AI Design
- [ ] Voice input → floor plan generated in < 30 seconds
- [ ] "Add a bedroom" refinement updates plan in < 15 seconds
- [ ] Auto-generated BOQ from design is within 15% of manual BOQ
- [ ] Compliance check flags any violation of local building codes
- [ ] Designs exportable as PDF with dimensions labeled

### Lifecycle
- [ ] Warranty claim creates contractor notification immediately
- [ ] Rent due reminder fires 5 days before payment date
- [ ] Maintenance history accessible for property lifetime

### Security
- [ ] MFA enforced on all escrow release actions
- [ ] Penetration test passed with no critical/high findings
- [ ] GDPR data export returns all user data within 72 hours

### Scale
- [ ] System handles 1,000 concurrent users without degradation
- [ ] Property search with 100,000 listings returns in < 500ms
- [ ] Offline sync handles 500 queued actions without data loss

---

## Dependencies
- All previous sprints
- Sprint 11 (AI Engine required for AI Design)
- Sprint 08 (BOQ engine required for design-to-BOQ pipeline)
