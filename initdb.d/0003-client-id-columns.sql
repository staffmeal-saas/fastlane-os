-- Add client_id to indirect tables for Hasura permission filtering
-- This enables row-level security through client_members for all tables

-- wallet_transactions -> wallets.client_id
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
UPDATE wallet_transactions wt SET client_id = w.client_id FROM wallets w WHERE wt.wallet_id = w.id AND wt.client_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_client_id ON wallet_transactions(client_id);

-- action_status_history -> actions.client_id
ALTER TABLE action_status_history ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
UPDATE action_status_history ash SET client_id = a.client_id FROM actions a WHERE ash.action_id = a.id AND ash.client_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_action_status_history_client_id ON action_status_history(client_id);

-- document_versions -> documents.client_id
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
UPDATE document_versions dv SET client_id = d.client_id FROM documents d WHERE dv.document_id = d.id AND dv.client_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_document_versions_client_id ON document_versions(client_id);

-- Auto-populate client_id on insert
CREATE OR REPLACE FUNCTION set_wallet_transaction_client_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NULL THEN
    SELECT client_id INTO NEW.client_id FROM wallets WHERE id = NEW.wallet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wallet_transaction_client_id
  BEFORE INSERT ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION set_wallet_transaction_client_id();

CREATE OR REPLACE FUNCTION set_action_status_history_client_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NULL THEN
    SELECT client_id INTO NEW.client_id FROM actions WHERE id = NEW.action_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_action_status_history_client_id
  BEFORE INSERT ON action_status_history
  FOR EACH ROW EXECUTE FUNCTION set_action_status_history_client_id();

CREATE OR REPLACE FUNCTION set_document_version_client_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NULL THEN
    SELECT client_id INTO NEW.client_id FROM documents WHERE id = NEW.document_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_version_client_id
  BEFORE INSERT ON document_versions
  FOR EACH ROW EXECUTE FUNCTION set_document_version_client_id();
