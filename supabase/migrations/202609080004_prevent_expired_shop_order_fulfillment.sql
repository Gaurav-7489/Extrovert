-- Extrovert security fix #24
-- Prevent an expired shop order from ever being fulfilled, even through
-- direct Supabase/API calls. The server-side expiration is authoritative.

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Backfill existing orders from their creation time instead of giving every
-- historical order a fresh timeout at migration time.
UPDATE public.shop_orders
SET expires_at = created_at + interval '15 minutes'
WHERE expires_at IS NULL;

ALTER TABLE public.shop_orders
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '15 minutes'),
  ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shop_orders_expiry
  ON public.shop_orders (expires_at)
  WHERE status = 'created';

-- Database-level guard. This blocks both application bugs and direct
-- authenticated/service-role writes from turning an expired order into a
-- fulfilled/paid order.
CREATE OR REPLACE FUNCTION public.guard_shop_order_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at <= now()
     AND (
       NEW.status = 'paid'
       OR NEW.fulfilled_at IS NOT NULL
     ) THEN
    RAISE EXCEPTION 'ORDER_EXPIRED'
      USING ERRCODE = 'P0001';
  END IF;

  IF NEW.fulfilled_at IS NOT NULL AND NEW.status <> 'paid' THEN
    RAISE EXCEPTION 'INVALID_FULFILLMENT_STATE'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_orders_expiry_guard ON public.shop_orders;
CREATE TRIGGER shop_orders_expiry_guard
  BEFORE INSERT OR UPDATE OF status, fulfilled_at, expires_at
  ON public.shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_shop_order_expiry();

-- Fulfillment remains idempotent for an already-completed order, but an
-- expired order can never reach the fulfillment path.
CREATE OR REPLACE FUNCTION public.fulfill_shop_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.shop_orders%rowtype;
BEGIN
  SELECT *
  INTO v_order
  FROM public.shop_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Never fulfill an order after its server-side deadline.
  IF v_order.expires_at <= now() THEN
    RAISE EXCEPTION 'ORDER_EXPIRED';
  END IF;

  -- Preserve idempotency for a valid already-fulfilled order.
  IF v_order.status = 'paid' AND v_order.fulfilled_at IS NOT NULL THEN
    RETURN true;
  END IF;

  IF v_order.status <> 'created' THEN
    RAISE EXCEPTION 'ORDER_NOT_FULFILLABLE';
  END IF;

  IF v_order.product LIKE 'extra_likes_%' THEN
    INSERT INTO public.like_wallets(user_id, purchased_likes)
    VALUES (v_order.user_id, v_order.quantity)
    ON CONFLICT (user_id)
    DO UPDATE SET
      purchased_likes = public.like_wallets.purchased_likes + EXCLUDED.purchased_likes,
      updated_at = now();
  ELSIF v_order.product = 'superchat' THEN
    INSERT INTO public.superchats(
      sender_id,
      recipient_id,
      content,
      shop_order_id
    )
    VALUES (
      v_order.user_id,
      v_order.target_user_id,
      coalesce(v_order.payload->>'content', ''),
      v_order.id
    );
  END IF;

  UPDATE public.shop_orders
  SET
    status = 'paid',
    fulfilled_at = now(),
    updated_at = now()
  WHERE id = p_order_id
    AND status = 'created'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_EXPIRED';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_shop_order(uuid) FROM public;
