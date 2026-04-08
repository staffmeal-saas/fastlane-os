-- =====================================================
-- AUDIT LOG
-- =====================================================
-- Generic audit trail for sensitive tables.
-- Tracks INSERT/UPDATE/DELETE with full JSONB snapshots.

-- =====================================================
-- 1. Audit log table
-- =====================================================
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    client_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_client ON public.audit_log(client_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at);

-- =====================================================
-- 2. Generic audit trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_record_id UUID;
  v_client_id UUID;
  v_changed_by UUID;
BEGIN
  -- Extract changed_by from Hasura session variable if available
  BEGIN
    v_changed_by := current_setting('hasura.user_id', true)::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_changed_by := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    v_new := row_to_json(NEW)::JSONB;
    v_record_id := NEW.id;
    -- Extract client_id if column exists
    v_client_id := v_new ->> 'client_id';

  ELSIF TG_OP = 'UPDATE' THEN
    v_old := row_to_json(OLD)::JSONB;
    v_new := row_to_json(NEW)::JSONB;
    v_record_id := NEW.id;
    v_client_id := v_new ->> 'client_id';

  ELSIF TG_OP = 'DELETE' THEN
    v_old := row_to_json(OLD)::JSONB;
    v_record_id := OLD.id;
    v_client_id := v_old ->> 'client_id';
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_by, client_id)
  VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_old, v_new, v_changed_by, v_client_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Attach audit triggers to sensitive tables
-- =====================================================
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_wallets
  AFTER INSERT OR UPDATE OR DELETE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_wallet_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_campaigns
  AFTER INSERT OR UPDATE OR DELETE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.actions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_upgrades
  AFTER INSERT OR UPDATE OR DELETE ON public.upgrades
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
