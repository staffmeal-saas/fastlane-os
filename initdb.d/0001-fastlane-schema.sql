-- =====================================================
-- FASTLANE OS — Database Schema
-- =====================================================
-- Executed on first `docker compose up` via initdb.d

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create schemas required by Nhost services
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

-- =====================================================
-- 1. OFFERS (commercial plans with credit rules)
-- =====================================================
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    monthly_credits INTEGER NOT NULL DEFAULT 0,
    carry_over_enabled BOOLEAN NOT NULL DEFAULT false,
    carry_over_max INTEGER DEFAULT NULL,
    carry_over_expiry_days INTEGER DEFAULT NULL,
    price_monthly NUMERIC(10,2) DEFAULT 0,
    is_sprint BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. CLIENTS (company accounts)
-- =====================================================
CREATE TYPE public.client_status AS ENUM ('sprint', 'active', 'suspended', 'archived');

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    status public.client_status NOT NULL DEFAULT 'sprint',
    offer_id UUID REFERENCES public.offers(id),
    owner_user_id UUID,  -- references auth.users managed by nhost
    industry TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. CLIENT_MEMBERS (link users to clients with roles)
-- =====================================================
CREATE TYPE public.client_role AS ENUM ('owner', 'collaborator');

CREATE TABLE public.client_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,  -- references auth.users
    role public.client_role NOT NULL DEFAULT 'collaborator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(client_id, user_id)
);

-- =====================================================
-- 4. WALLETS (one per client)
-- =====================================================
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    reserved INTEGER NOT NULL DEFAULT 0,
    carried_over INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. WALLET_TRANSACTIONS (full ledger)
-- =====================================================
CREATE TYPE public.transaction_type AS ENUM (
    'allocation',     -- monthly credit allocation
    'consumption',    -- action completion debit
    'reservation',    -- credit reserved for planned action
    'release',        -- reserved credit released
    'carry_over',     -- unused credits carried over
    'recharge',       -- credit pack purchase
    'adjustment',     -- manual admin adjustment
    'expiration'      -- expired credits
);

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    type public.transaction_type NOT NULL,
    amount INTEGER NOT NULL,  -- positive = credit, negative = debit
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_id UUID,  -- optional: action_id, upgrade_id, etc.
    reference_type TEXT,  -- 'action', 'upgrade', 'manual'
    created_by UUID,  -- user who created this transaction
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. CAMPAIGNS
-- =====================================================
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    objectives TEXT,
    status public.campaign_status NOT NULL DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    kpi_targets JSONB DEFAULT '{}',
    kpi_results JSONB DEFAULT '{}',
    credits_budget INTEGER DEFAULT 0,
    credits_consumed INTEGER DEFAULT 0,
    owner_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 7. ACTIONS (tasks within campaigns)
-- =====================================================
CREATE TYPE public.action_status AS ENUM ('a_valider', 'planifiee', 'en_cours', 'review', 'terminee', 'annulee');
CREATE TYPE public.action_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status public.action_status NOT NULL DEFAULT 'a_valider',
    priority public.action_priority NOT NULL DEFAULT 'medium',
    credits_reserved INTEGER DEFAULT 0,
    credits_consumed INTEGER DEFAULT 0,
    assigned_to UUID,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 8. ACTION_STATUS_HISTORY (audit trail)
-- =====================================================
CREATE TABLE public.action_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
    old_status public.action_status,
    new_status public.action_status NOT NULL,
    changed_by UUID,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 9. STRATEGIC_BLOCKS
-- =====================================================
CREATE TABLE public.strategic_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,  -- acquisition, conversion, events, automation, sales_enablement
    description TEXT,
    objectives TEXT,
    kpi_targets JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 10. DOCUMENTS
-- =====================================================
CREATE TYPE public.document_type AS ENUM ('pdf', 'audit', 'report', 'script', 'strategy', 'bilan', 'other');

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    strategic_block_id UUID REFERENCES public.strategic_blocks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type public.document_type NOT NULL DEFAULT 'other',
    description TEXT,
    file_id TEXT,  -- Nhost storage file ID
    file_url TEXT,
    file_size BIGINT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    published_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 11. DOCUMENT_VERSIONS
-- =====================================================
CREATE TABLE public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    file_id TEXT,
    file_url TEXT,
    file_size BIGINT,
    changelog TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 12. UPGRADES (credit recharge requests)
-- =====================================================
CREATE TYPE public.upgrade_status AS ENUM ('brouillon', 'demande', 'valide', 'paye', 'credite', 'refuse');

CREATE TABLE public.upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    credits_amount INTEGER NOT NULL,
    pack_type TEXT,  -- '500', '1000', '2000', 'custom'
    status public.upgrade_status NOT NULL DEFAULT 'brouillon',
    allocation_target TEXT DEFAULT 'general',  -- 'general', 'campaign', 'action'
    requested_by UUID,
    validated_by UUID,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    validated_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    credited_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 13. NOTIFICATIONS (placeholder for Phase 2)
-- =====================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 14. USER_PROFILES (extends nhost auth.users)
-- =====================================================
CREATE TYPE public.platform_role AS ENUM ('super_admin', 'admin_ops', 'account_manager', 'sprint_manager', 'finance_admin', 'client_owner', 'client_collaborator', 'prospect_sprint');

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,  -- references auth.users
    platform_role public.platform_role NOT NULL DEFAULT 'client_owner',
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_client_members_user ON public.client_members(user_id);
CREATE INDEX idx_client_members_client ON public.client_members(client_id);
CREATE INDEX idx_campaigns_client ON public.campaigns(client_id);
CREATE INDEX idx_actions_campaign ON public.actions(campaign_id);
CREATE INDEX idx_actions_client ON public.actions(client_id);
CREATE INDEX idx_actions_status ON public.actions(status);
CREATE INDEX idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX idx_documents_client ON public.documents(client_id);
CREATE INDEX idx_documents_campaign ON public.documents(campaign_id);
CREATE INDEX idx_upgrades_client ON public.upgrades(client_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_user_profiles_user ON public.user_profiles(user_id);

-- =====================================================
-- SEED DATA: Default offers
-- =====================================================
INSERT INTO public.offers (name, description, monthly_credits, carry_over_enabled, carry_over_max, is_sprint, price_monthly) VALUES
('Sprint Gratuit', 'Sprint de 5 jours pour démontrer la valeur Fastlane', 0, false, NULL, true, 0),
('Start', 'Offre d''entrée avec accompagnement essentiel', 500, true, 250, false, 2500),
('Growth', 'Offre de croissance avec pilotage avancé', 1000, true, 500, false, 5000),
('Scale', 'Offre premium avec pilotage complet et priorité', 2000, true, 1000, false, 9000);
