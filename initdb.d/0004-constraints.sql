-- CHECK constraints for data integrity

-- Wallets: balance cannot go below 0
ALTER TABLE public.wallets
  ADD CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0);

-- Wallets: reserved cannot be negative
ALTER TABLE public.wallets
  ADD CONSTRAINT wallets_reserved_non_negative CHECK (reserved >= 0);

-- Actions: credits fields cannot be negative
ALTER TABLE public.actions
  ADD CONSTRAINT actions_credits_non_negative CHECK (credits_reserved >= 0 AND credits_consumed >= 0);

-- Campaigns: credits fields cannot be negative
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_credits_non_negative CHECK (credits_budget >= 0 AND credits_consumed >= 0);
