-- =====================================================
-- FASTLANE OS — API Keys & Audit Logs
-- =====================================================
-- api_keys : per-user API keys for REST admin API
-- api_logs : full audit log of all API calls

-- =====================================================
-- 1. API KEYS
-- =====================================================
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    label TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. API LOGS
-- =====================================================
CREATE TABLE public.api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id),
    user_id UUID,
    action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'invite', 'publish', 'unpublish', 'login')),
    entity_type TEXT,
    entity_id UUID,
    payload JSONB,
    result JSONB,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX idx_api_logs_action ON public.api_logs(action);
CREATE INDEX idx_api_logs_api_key_id ON public.api_logs(api_key_id);
