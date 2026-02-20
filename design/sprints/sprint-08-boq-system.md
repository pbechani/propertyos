# Sprint 08 — Intelligent BOQ / BOM System
**Phase 7 | Weeks 39–45**

## Goal
Build the Bill of Quantities (BOQ) engine — auto-calculation of material quantities from floor plans, multi-tier pricing, real-time cost recalculation, supplier integration, and procurement workflow. This is a core value differentiator.

---

## Deliverables Checklist
- [ ] BOQ data model (categories, materials, units)
- [ ] Material master data (with 3 pricing tiers)
- [ ] Floor plan parser (extract dimensions → auto-calculate quantities)
- [ ] Real-time material swapping with instant cost recalculation
- [ ] Multi-tier price comparison (budget / standard / premium)
- [ ] Supplier price integration (live pricing from marketplace)
- [ ] BOQ versioning (save, compare, revert)
- [ ] Budget alignment feature (swap to meet target budget)
- [ ] Procurement workflow (BOQ → RFQ → Purchase Order)
- [ ] BOQ to RFQ conversion (send to suppliers)

---

## Data Models

### `construction.boq_templates`
```sql
CREATE TABLE construction.boq_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(50), -- residential, commercial, industrial
  country CHAR(2),
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.boqs`
```sql
CREATE TABLE construction.boqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  version SMALLINT NOT NULL DEFAULT 1,
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, archived
  target_budget NUMERIC(18,2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  total_estimated_cost NUMERIC(18,2),
  is_current BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON construction.boqs (project_id, is_current);
```

### `construction.boq_sections`
```sql
CREATE TABLE construction.boq_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_id UUID REFERENCES construction.boqs(id),
  construction_stage SMALLINT, -- links to project stage
  section_name VARCHAR(255) NOT NULL, -- "Foundation", "Walling", "Roofing"
  display_order SMALLINT,
  section_total NUMERIC(18,2) DEFAULT 0
);
```

### `construction.boq_items`
```sql
CREATE TABLE construction.boq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES construction.boq_sections(id),
  boq_id UUID REFERENCES construction.boqs(id),
  material_id UUID REFERENCES construction.material_master(id),
  description VARCHAR(255) NOT NULL,
  unit VARCHAR(30) NOT NULL,          -- m2, m3, kg, bag, piece, litre
  quantity NUMERIC(12,4) NOT NULL,
  quantity_source VARCHAR(20) DEFAULT 'manual', -- auto, manual, adjusted
  selected_tier VARCHAR(20) DEFAULT 'standard', -- budget, standard, premium
  budget_unit_price NUMERIC(18,4),
  standard_unit_price NUMERIC(18,4),
  premium_unit_price NUMERIC(18,4),
  selected_unit_price NUMERIC(18,4),  -- from selected tier or custom
  selected_supplier_id UUID REFERENCES identity.users(id),
  selected_supplier_price NUMERIC(18,4),
  line_total NUMERIC(18,2) GENERATED ALWAYS AS (quantity * COALESCE(selected_supplier_price, selected_unit_price)) STORED,
  procurement_status VARCHAR(20) DEFAULT 'not_ordered', -- not_ordered, rfq_sent, quoted, ordered, delivered
  notes TEXT,
  display_order SMALLINT
);
```

### `construction.material_master`
```sql
CREATE TABLE construction.material_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,   -- cement, bricks, steel, timber, roofing, electrical, plumbing
  subcategory VARCHAR(100),
  material_name VARCHAR(255) NOT NULL,
  standard_specification TEXT,
  unit VARCHAR(30) NOT NULL,
  country CHAR(2),
  budget_price NUMERIC(18,4),       -- ~60-70% of standard
  standard_price NUMERIC(18,4),     -- market midpoint
  premium_price NUMERIC(18,4),      -- ~120-130% of standard
  currency CHAR(3) DEFAULT 'USD',
  alternatives JSONB DEFAULT '[]',  -- [{material_id, reason}]
  last_price_update TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX ON construction.material_master (category, country);
```

### `construction.floor_plan_extractions`
```sql
CREATE TABLE construction.floor_plan_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.projects(id),
  file_url TEXT NOT NULL,
  file_type VARCHAR(10), -- pdf, dwg, png, jpg
  extracted_data JSONB,  -- {total_floor_area, wall_length, roof_area, rooms: [{name, area}]}
  extraction_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Quantity Calculation Formulas

### Auto-calculation logic given floor plan dimensions:
```typescript
interface FloorPlanDimensions {
  totalFloorAreaM2: number;
  externalWallLengthM: number;
  internalWallLengthM: number;
  wallHeightM: number;
  roofAreaM2: number;
  numberOfRooms: number;
  numberOfDoors: number;
  numberOfWindows: number;
}

const calculations = {
  // Foundation (concrete)
  foundation_concrete_m3: dims.externalWallLengthM * 0.6 * 0.3,  // strip foundation
  // Walling (bricks)
  bricks_pieces: (dims.externalWallLengthM + dims.internalWallLengthM) * dims.wallHeightM * 55,  // 55 bricks/m2
  // Cement (bags for brickwork)
  cement_bags_brickwork: bricks_pieces / 110,   // 1 bag per ~110 bricks
  // Roofing
  roofing_sheets_m2: dims.roofAreaM2 * 1.15,    // 15% waste factor
  // Screed / floor
  screed_m2: dims.totalFloorAreaM2,
  // Doors
  door_frames: dims.numberOfDoors,
  // Windows
  window_frames: dims.numberOfWindows,
}
```

---

## Real-Time Swap Logic
When user changes a material tier:
1. Recalculate `line_total` for affected item
2. Recalculate all `section_total` values
3. Recalculate `boqs.total_estimated_cost`
4. Return diff object: `{previous_total, new_total, delta, over_budget: boolean}`

This must complete in < 200ms (use in-memory calculation, update DB async).

---

## API Endpoints

### BOQ
```
POST  /api/v1/projects/:id/boq                      — create BOQ
GET   /api/v1/projects/:id/boq                      — get current BOQ
GET   /api/v1/projects/:id/boq/versions             — version history
GET   /api/v1/projects/:id/boq/:version             — specific version
POST  /api/v1/projects/:id/boq/new-version          — save current as new version
```

### Items & Sections
```
PATCH /api/v1/boq/:id/items/:itemId/tier            — change budget/standard/premium
PATCH /api/v1/boq/:id/items/:itemId/quantity        — adjust quantity
PATCH /api/v1/boq/:id/items/:itemId/supplier        — select supplier for item
GET   /api/v1/boq/:id/budget-summary                — by section and total
POST  /api/v1/boq/:id/optimize                      — AI: suggest swaps to meet target budget
```

### Floor Plan Parsing
```
POST /api/v1/projects/:id/floor-plan                — upload + trigger extraction
GET  /api/v1/projects/:id/floor-plan/status         — extraction status
POST /api/v1/projects/:id/boq/auto-generate         — generate BOQ from extraction
```

### Supplier Price Integration
```
GET /api/v1/boq/:id/items/:itemId/supplier-prices   — live quotes from marketplace
```

### Procurement
```
POST /api/v1/boq/:id/generate-rfqs                  — create RFQs from selected items
GET  /api/v1/boq/:id/procurement-status             — status of all items
```

---

## Material Pricing Tiers (Examples — Zimbabwe)
| Material | Unit | Budget | Standard | Premium |
|----------|------|--------|----------|---------|
| Cement (Portland) | 50kg bag | $9.50 | $11.50 | $14.00 |
| Commons brick | 1000 pcs | $180 | $220 | $290 |
| Steel rebar 12mm | per tonne | $850 | $1,050 | $1,300 |
| Roofing sheets (IBR) | per m² | $6.50 | $8.50 | $12.00 |
| River sand | per m³ | $25 | $35 | $50 |

---

## Acceptance Criteria
- [ ] BOQ auto-generated from floor plan dimensions produces accurate quantities (±10% of manual calc)
- [ ] User switches cement from standard to budget: total cost recalculates instantly (< 200ms)
- [ ] Version history saves and restores correctly
- [ ] BOQ-to-RFQ conversion creates correctly scoped RFQs for selected suppliers
- [ ] Budget alignment tool suggests tier swaps that bring total within 5% of target
- [ ] Supplier live prices appear inline in BOQ (alongside tier pricing)
- [ ] Material price history chart shows 12-month trend
- [ ] Procurement status updates when RFQ accepted and order placed

---

## Dependencies
- Sprint 06 (projects + construction stages)
- Sprint 07 (supplier product catalog + pricing)

## Blocks
- Sprint 13 (AI design assistant auto-generates BOQ from generated plans)
