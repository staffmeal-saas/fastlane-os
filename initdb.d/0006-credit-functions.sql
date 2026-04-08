-- =====================================================
-- CREDIT ALLOCATION & EXPIRATION FUNCTIONS
-- =====================================================
-- Called via cron job or Hasura scheduled event.

-- =====================================================
-- 1. Monthly credit allocation with carry-over logic
-- =====================================================
CREATE OR REPLACE FUNCTION allocate_monthly_credits()
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  monthly_credits INTEGER,
  carried_over INTEGER,
  expired INTEGER,
  new_balance INTEGER
) AS $$
DECLARE
  rec RECORD;
  v_wallet_id UUID;
  v_current_balance INTEGER;
  v_reportable INTEGER;
  v_expired INTEGER;
  v_new_balance INTEGER;
BEGIN
  FOR rec IN
    SELECT c.id AS client_id, c.name AS client_name,
           o.monthly_credits, o.carry_over_enabled,
           o.carry_over_max, o.carry_over_expiry_days
    FROM public.clients c
    JOIN public.offers o ON o.id = c.offer_id
    WHERE c.status = 'active'
      AND o.monthly_credits > 0
  LOOP
    -- Get wallet
    SELECT w.id, w.balance INTO v_wallet_id, v_current_balance
    FROM public.wallets w
    WHERE w.client_id = rec.client_id;

    IF v_wallet_id IS NULL THEN
      CONTINUE;
    END IF;

    v_reportable := 0;
    v_expired := 0;

    -- Handle carry-over / expiration of current balance
    IF rec.carry_over_enabled AND v_current_balance > 0 THEN
      IF rec.carry_over_max IS NOT NULL THEN
        v_reportable := LEAST(v_current_balance, rec.carry_over_max);
        v_expired := v_current_balance - v_reportable;
      ELSE
        v_reportable := v_current_balance;
      END IF;

      -- Record carry-over transaction
      IF v_reportable > 0 THEN
        INSERT INTO public.wallet_transactions
          (wallet_id, client_id, type, amount, balance_after, description)
        VALUES
          (v_wallet_id, rec.client_id, 'carry_over', 0, v_reportable,
           'Report de ' || v_reportable || ' credits du mois precedent');
      END IF;

      -- Record expiration if any
      IF v_expired > 0 THEN
        INSERT INTO public.wallet_transactions
          (wallet_id, client_id, type, amount, balance_after, description)
        VALUES
          (v_wallet_id, rec.client_id, 'expiration', -v_expired, v_reportable,
           'Expiration de ' || v_expired || ' credits (depassement plafond report)');
      END IF;
    ELSIF v_current_balance > 0 THEN
      -- No carry-over: expire everything
      v_expired := v_current_balance;
      v_reportable := 0;

      INSERT INTO public.wallet_transactions
        (wallet_id, client_id, type, amount, balance_after, description)
      VALUES
        (v_wallet_id, rec.client_id, 'expiration', -v_expired, 0,
         'Expiration de ' || v_expired || ' credits (pas de report)');
    END IF;

    -- Allocate new monthly credits
    v_new_balance := v_reportable + rec.monthly_credits;

    INSERT INTO public.wallet_transactions
      (wallet_id, client_id, type, amount, balance_after, description)
    VALUES
      (v_wallet_id, rec.client_id, 'allocation', rec.monthly_credits, v_new_balance,
       'Allocation mensuelle de ' || rec.monthly_credits || ' credits');

    -- Update wallet
    UPDATE public.wallets
    SET balance = v_new_balance,
        carried_over = v_reportable,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Return row
    client_id := rec.client_id;
    client_name := rec.client_name;
    monthly_credits := rec.monthly_credits;
    carried_over := v_reportable;
    expired := v_expired;
    new_balance := v_new_balance;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. Expire old carried-over credits
-- =====================================================
-- Expires credits that have been carried over beyond
-- the offer's carry_over_expiry_days limit.
CREATE OR REPLACE FUNCTION expire_old_credits()
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  expired_amount INTEGER
) AS $$
DECLARE
  rec RECORD;
  v_wallet_id UUID;
  v_current_balance INTEGER;
  v_oldest_carry_over TIMESTAMPTZ;
  v_carried_over INTEGER;
  v_to_expire INTEGER;
  v_new_balance INTEGER;
BEGIN
  FOR rec IN
    SELECT c.id AS client_id, c.name AS client_name,
           o.carry_over_expiry_days
    FROM public.clients c
    JOIN public.offers o ON o.id = c.offer_id
    WHERE c.status = 'active'
      AND o.carry_over_enabled = true
      AND o.carry_over_expiry_days IS NOT NULL
  LOOP
    SELECT w.id, w.balance, w.carried_over
    INTO v_wallet_id, v_current_balance, v_carried_over
    FROM public.wallets w
    WHERE w.client_id = rec.client_id;

    IF v_wallet_id IS NULL OR v_carried_over <= 0 THEN
      CONTINUE;
    END IF;

    -- Find the most recent carry_over transaction
    SELECT wt.created_at INTO v_oldest_carry_over
    FROM public.wallet_transactions wt
    WHERE wt.wallet_id = v_wallet_id
      AND wt.type = 'carry_over'
    ORDER BY wt.created_at DESC
    LIMIT 1;

    IF v_oldest_carry_over IS NULL THEN
      CONTINUE;
    END IF;

    -- Check if carried-over credits have expired
    IF v_oldest_carry_over + (rec.carry_over_expiry_days || ' days')::INTERVAL < now() THEN
      v_to_expire := v_carried_over;
      v_new_balance := v_current_balance - v_to_expire;

      -- Safety: don't go below zero
      IF v_new_balance < 0 THEN
        v_to_expire := v_current_balance;
        v_new_balance := 0;
      END IF;

      INSERT INTO public.wallet_transactions
        (wallet_id, client_id, type, amount, balance_after, description)
      VALUES
        (v_wallet_id, rec.client_id, 'expiration', -v_to_expire, v_new_balance,
         'Expiration des credits reportes (>' || rec.carry_over_expiry_days || ' jours)');

      UPDATE public.wallets
      SET balance = v_new_balance,
          carried_over = 0,
          updated_at = now()
      WHERE id = v_wallet_id;

      client_id := rec.client_id;
      client_name := rec.client_name;
      expired_amount := v_to_expire;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
