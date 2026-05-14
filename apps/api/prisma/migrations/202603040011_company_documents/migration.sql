-- Company Verification Documents
-- Tracks files uploaded as part of the company verification workflow

CREATE TABLE identity.company_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES identity.companies(id) ON DELETE CASCADE,
  uploaded_by      UUID NOT NULL REFERENCES identity.users(id),
  document_type    VARCHAR(100) NOT NULL DEFAULT 'other',
  document_name    VARCHAR(255) NOT NULL,
  file_name        VARCHAR(255) NOT NULL,
  storage_path     TEXT         NOT NULL,
  public_url       TEXT         NOT NULL,
  mime_type        VARCHAR(100),
  file_size_bytes  INTEGER,
  status           VARCHAR(30)  NOT NULL DEFAULT 'pending',
  review_notes     TEXT,
  reviewed_by      UUID REFERENCES identity.users(id),
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_company_documents_company ON identity.company_documents (company_id);
CREATE INDEX idx_company_documents_status  ON identity.company_documents (company_id, status);
