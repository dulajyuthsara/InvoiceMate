-- ═══════════════════════════════════════════════════════════════════
-- InvoiceMate PostgreSQL Schema
-- Run: psql -U postgres -d invoicemate < schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ─── USERS ────────────────────────────────────────────────────────
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     TEXT,
  phone             VARCHAR(20) UNIQUE,
  business_name     VARCHAR(200) NOT NULL,
  tin_number        VARCHAR(50),
  logo_url          TEXT,
  default_language  VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (default_language IN ('en','si','ta')),
  subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free','pro','business')),
  wa_phone_id       VARCHAR(100),
  address           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ─── CLIENTS ──────────────────────────────────────────────────────
CREATE TABLE clients (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 VARCHAR(200) NOT NULL,
  email                VARCHAR(255),
  phone                VARCHAR(20),
  address              TEXT,
  tax_id               VARCHAR(50),
  embedding_id         VARCHAR(100),
  lifetime_value_lkr   NUMERIC(14,2) NOT NULL DEFAULT 0,
  invoice_count        INTEGER NOT NULL DEFAULT 0,
  last_invoice_at      TIMESTAMPTZ,
  metadata             JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_name_trgm ON clients USING gin(name gin_trgm_ops);

-- ─── INVOICES ─────────────────────────────────────────────────────
CREATE TABLE invoices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id          UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  invoice_number     VARCHAR(50) NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','sent','viewed','paid','overdue','void')),
  language           VARCHAR(5) NOT NULL DEFAULT 'en'
                       CHECK (language IN ('en','si','ta')),
  line_items         JSONB NOT NULL DEFAULT '[]',
  translations       JSONB,
  subtotal_lkr       NUMERIC(14,2) NOT NULL DEFAULT 0,
  vat_lkr            NUMERIC(14,2) NOT NULL DEFAULT 0,
  nbt_lkr            NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_lkr          NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_lkr           NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date           DATE,
  pdf_url            TEXT,
  pdf_generated_at   TIMESTAMPTZ,
  embedding_id       VARCHAR(100),
  notes              TEXT,
  sent_at            TIMESTAMPTZ,
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at DESC);
-- Full text search index on line_items and notes
CREATE INDEX idx_invoices_fts ON invoices USING gin(
  to_tsvector('english', coalesce(notes,'') || ' ' || coalesce(line_items::text,''))
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────
CREATE TABLE payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount_lkr   NUMERIC(14,2) NOT NULL,
  method       VARCHAR(30) NOT NULL DEFAULT 'cash'
                 CHECK (method IN ('cash','bank_transfer','card','cheque','other')),
  reference    VARCHAR(200),
  notes        TEXT,
  paid_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);

-- ─── REMINDERS ────────────────────────────────────────────────────
CREATE TABLE reminders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  channel        VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp','email','push')),
  status         VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','sent','failed')),
  message_body   TEXT,
  scheduled_for  TIMESTAMPTZ NOT NULL,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_invoice_id ON reminders(invoice_id);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_for) WHERE status = 'scheduled';

-- ─── REFRESH TOKENS ───────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ─── AUDIT LOG ────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ─── TRIGGERS: updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── TRIGGER: update client stats on invoice changes ─────────────
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients SET
    invoice_count = (SELECT COUNT(*) FROM invoices WHERE client_id = NEW.client_id AND status != 'void'),
    last_invoice_at = (SELECT MAX(issued_at) FROM invoices WHERE client_id = NEW.client_id)
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_client_stats
AFTER INSERT OR UPDATE OF status ON invoices
FOR EACH ROW EXECUTE FUNCTION update_client_stats();

-- ─── VIEWS ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW invoice_summary AS
SELECT
  i.id,
  i.user_id,
  i.invoice_number,
  i.status,
  i.total_lkr,
  i.paid_lkr,
  i.total_lkr - i.paid_lkr AS balance_lkr,
  i.due_date,
  i.issued_at,
  c.name AS client_name,
  c.phone AS client_phone,
  c.email AS client_email
FROM invoices i
JOIN clients c ON i.client_id = c.id;

-- Monthly revenue view
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  user_id,
  DATE_TRUNC('month', issued_at) AS month,
  COUNT(*) AS invoice_count,
  SUM(total_lkr) AS gross_revenue_lkr,
  SUM(paid_lkr) AS collected_lkr,
  SUM(total_lkr - paid_lkr) AS outstanding_lkr
FROM invoices
WHERE status != 'void'
GROUP BY user_id, DATE_TRUNC('month', issued_at);
