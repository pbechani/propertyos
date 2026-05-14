-- Sprint 01-b: Company & Service Provider Management
-- Creates identity.companies, identity.company_members, identity.company_invitations,
-- and identity.company_orphaned_tasks

-- ============================================================
-- identity.companies
-- ============================================================
CREATE TABLE identity.companies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(255) NOT NULL,
  slug                 VARCHAR(100) UNIQUE NOT NULL,
  category             VARCHAR(50)  NOT NULL,
  registration_number  VARCHAR(100),
  tax_number           VARCHAR(100),
  website              VARCHAR(255),
  phone                VARCHAR(20),
  email                VARCHAR(255) NOT NULL,
  address              JSONB DEFAULT '{}',
  logo_url             TEXT,
  description          TEXT,
  status               VARCHAR(30) NOT NULL DEFAULT 'pending_verification',
  verification_status  VARCHAR(30) DEFAULT 'unverified',
  verified_by          UUID REFERENCES identity.users(id),
  verified_at          TIMESTAMPTZ,
  rejection_reason     TEXT,
  created_by           UUID NOT NULL REFERENCES identity.users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_category              ON identity.companies (category);
CREATE INDEX idx_companies_status                ON identity.companies (status);
CREATE INDEX idx_companies_verification_status   ON identity.companies (verification_status);

-- ============================================================
-- identity.company_members
-- ============================================================
CREATE TABLE identity.company_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES identity.companies(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES identity.users(id)     ON DELETE CASCADE,
  role         VARCHAR(50) NOT NULL,
  is_admin     BOOLEAN NOT NULL DEFAULT false,
  status       VARCHAR(30) NOT NULL DEFAULT 'active',
  permissions  JSONB DEFAULT '[]',
  invited_by   UUID REFERENCES identity.users(id),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ,
  revoked_by   UUID REFERENCES identity.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_members_company ON identity.company_members (company_id);
CREATE INDEX idx_company_members_user    ON identity.company_members (user_id);
CREATE INDEX idx_company_members_status  ON identity.company_members (status);

-- ============================================================
-- identity.company_invitations
-- ============================================================
CREATE TABLE identity.company_invitations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES identity.companies(id) ON DELETE CASCADE,
  invited_email  VARCHAR(255) NOT NULL,
  role           VARCHAR(50)  NOT NULL,
  is_admin       BOOLEAN NOT NULL DEFAULT false,
  permissions    JSONB DEFAULT '[]',
  token_hash     VARCHAR(64) NOT NULL,
  status         VARCHAR(30) NOT NULL DEFAULT 'pending',
  invited_by     UUID REFERENCES identity.users(id),
  accepted_by    UUID REFERENCES identity.users(id),
  expires_at     TIMESTAMPTZ NOT NULL,
  accepted_at    TIMESTAMPTZ,
  revoked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX       idx_company_invitations_company     ON identity.company_invitations (company_id, status);
CREATE UNIQUE INDEX idx_company_invitations_token_hash ON identity.company_invitations (token_hash);

-- ============================================================
-- identity.company_orphaned_tasks
-- ============================================================
CREATE TABLE identity.company_orphaned_tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES identity.companies(id) ON DELETE CASCADE,
  original_user_id      UUID NOT NULL REFERENCES identity.users(id),
  assignee_id           UUID REFERENCES identity.users(id),
  resource_type         VARCHAR(100) NOT NULL,
  resource_id           UUID,
  description           TEXT,
  requires_notification BOOLEAN NOT NULL DEFAULT false,
  notification_notes    TEXT,
  status                VARCHAR(30) NOT NULL DEFAULT 'unassigned',
  assigned_at           TIMESTAMPTZ,
  closed_at             TIMESTAMPTZ,
  closed_by             UUID REFERENCES identity.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_orphaned_tasks_company ON identity.company_orphaned_tasks (company_id, status);
CREATE INDEX idx_company_orphaned_tasks_user    ON identity.company_orphaned_tasks (original_user_id);
