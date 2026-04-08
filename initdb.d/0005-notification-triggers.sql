-- =====================================================
-- NOTIFICATION TRIGGERS
-- =====================================================
-- Auto-generate notifications when key events occur.
-- Each trigger finds the client_owner via client_members.

-- Helper: find owner user_id for a given client
CREATE OR REPLACE FUNCTION get_client_owner(p_client_id UUID)
RETURNS UUID AS $$
  SELECT user_id
  FROM public.client_members
  WHERE client_id = p_client_id AND role = 'owner'
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- 1. Action completed
-- =====================================================
CREATE OR REPLACE FUNCTION notify_action_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM 'terminee' AND NEW.status = 'terminee' THEN
    v_owner_id := get_client_owner(NEW.client_id);
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, client_id, title, message, type)
      VALUES (
        v_owner_id,
        NEW.client_id,
        'Action terminee',
        'L''action "' || NEW.title || '" a ete terminee.',
        'action_completed'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_action_completed
  AFTER UPDATE ON public.actions
  FOR EACH ROW EXECUTE FUNCTION notify_action_completed();

-- =====================================================
-- 2. Credits low (balance < 20% of monthly_credits)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_credits_low()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_monthly_credits INTEGER;
  v_threshold INTEGER;
BEGIN
  IF NEW.balance < OLD.balance THEN
    SELECT o.monthly_credits INTO v_monthly_credits
    FROM public.clients c
    JOIN public.offers o ON o.id = c.offer_id
    WHERE c.id = NEW.client_id;

    IF v_monthly_credits IS NOT NULL AND v_monthly_credits > 0 THEN
      v_threshold := (v_monthly_credits * 20) / 100;
      IF NEW.balance <= v_threshold AND OLD.balance > v_threshold THEN
        v_owner_id := get_client_owner(NEW.client_id);
        IF v_owner_id IS NOT NULL THEN
          INSERT INTO public.notifications (user_id, client_id, title, message, type)
          VALUES (
            v_owner_id,
            NEW.client_id,
            'Credits bientot epuises',
            'Votre solde de credits est inferieur a 20%. Pensez a recharger.',
            'credits_low'
          );
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_credits_low
  AFTER UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION notify_credits_low();

-- =====================================================
-- 3. Upgrade validated (status -> credite)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_upgrade_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM 'credite' AND NEW.status = 'credite' THEN
    v_owner_id := get_client_owner(NEW.client_id);
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, client_id, title, message, type)
      VALUES (
        v_owner_id,
        NEW.client_id,
        'Credits recharges',
        NEW.credits_amount || ' credits ont ete ajoutes a votre portefeuille.',
        'upgrade_completed'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_upgrade_completed
  AFTER UPDATE ON public.upgrades
  FOR EACH ROW EXECUTE FUNCTION notify_upgrade_completed();

-- =====================================================
-- 4. New document published
-- =====================================================
CREATE OR REPLACE FUNCTION notify_document_published()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF (OLD.is_published IS DISTINCT FROM true) AND NEW.is_published = true THEN
    v_owner_id := get_client_owner(NEW.client_id);
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, client_id, title, message, type)
      VALUES (
        v_owner_id,
        NEW.client_id,
        'Nouveau document disponible',
        'Le document "' || NEW.title || '" est maintenant disponible.',
        'document_published'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_document_published
  AFTER UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION notify_document_published();

-- =====================================================
-- 5. Campaign status change
-- =====================================================
CREATE OR REPLACE FUNCTION notify_campaign_update()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_owner_id := get_client_owner(NEW.client_id);
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, client_id, title, message, type)
      VALUES (
        v_owner_id,
        NEW.client_id,
        'Campagne mise a jour',
        'La campagne "' || NEW.name || '" est passee en statut ' || NEW.status || '.',
        'campaign_update'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_campaign_update
  AFTER UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION notify_campaign_update();
