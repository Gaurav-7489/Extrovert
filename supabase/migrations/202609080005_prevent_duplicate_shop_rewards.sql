-- Extrovert security fix #32
-- Prevent repeated/concurrent shop fulfillment requests from granting
-- Likes, Super Likes, SuperChats, or direct SuperChats more than once.

-- A shop order may create at most one direct SuperChat.
CREATE UNIQUE INDEX IF NOT EXISTS superchats_shop_order_id_unique
  ON public.superchats (shop_order_id)
  WHERE shop_order_id IS NOT NULL;

-- Once an order has been fulfilled, its fulfillment marker/state is immutable.
-- This prevents a privileged write from resetting an order and replaying its
-- wallet credit or direct SuperChat delivery.
CREATE OR REPLACE FUNCTION public.guard_shop_order_fulfillment_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.fulfilled_at IS NOT NULL THEN
      IF NEW.fulfilled_at IS NULL
         OR NEW.fulfilled_at <> OLD.fulfilled_at THEN
        RAISE EXCEPTION 'FULFILLMENT_IMMUTABLE'
          USING ERRCODE = 'P0001';
      END IF;

      IF NEW.status <> 'paid' THEN
        RAISE EXCEPTION 'FULFILLMENT_STATE_IMMUTABLE'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;

    IF OLD.status = 'paid' AND NEW.status <> 'paid' THEN
      RAISE EXCEPTION 'FULFILLMENT_STATE_IMMUTABLE'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS shop_orders_fulfillment_immutability
  ON public.shop_orders;

CREATE TRIGGER shop_orders_fulfillment_immutability
BEFORE UPDATE OF status, fulfilled_at
ON public.shop_orders
FOR EACH ROW
EXECUTE FUNCTION public.guard_shop_order_fulfillment_immutability();

-- Fulfillment is serialized by SELECT ... FOR UPDATE and becomes a no-op
-- after the order is marked paid/fulfilled. All benefit delivery remains in
-- this single database transaction, so a failed delivery rolls back the
-- wallet/message grant and the order state together.
CREATE OR REPLACE FUNCTION public.fulfill_shop_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_order public.shop_orders%rowtype;
BEGIN
  SELECT * INTO v_order
  FROM public.shop_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  -- Idempotent replay: an already fulfilled order never grants its benefit
  -- again. The row lock makes concurrent calls wait for the first transaction.
  IF v_order.fulfilled_at IS NOT NULL OR v_order.status = 'paid' THEN
    IF v_order.status = 'paid' AND v_order.fulfilled_at IS NOT NULL THEN
      RETURN true;
    END IF;
    RAISE EXCEPTION 'ORDER_NOT_FULFILLABLE';
  END IF;

  IF v_order.status <> 'created' THEN
    RAISE EXCEPTION 'ORDER_NOT_FULFILLABLE';
  END IF;

  IF v_order.expires_at IS NOT NULL AND v_order.expires_at <= now() THEN
    RAISE EXCEPTION 'ORDER_EXPIRED';
  END IF;

  IF v_order.product LIKE 'extra_likes_%' THEN
    INSERT INTO public.like_wallets(user_id, purchased_likes)
    VALUES (v_order.user_id, v_order.quantity)
    ON CONFLICT (user_id) DO UPDATE
      SET purchased_likes = public.like_wallets.purchased_likes + EXCLUDED.purchased_likes,
          updated_at = now();

  ELSIF v_order.product LIKE 'superlike_%' THEN
    INSERT INTO public.superlike_wallets(user_id, purchased_superlikes)
    VALUES (v_order.user_id, v_order.quantity)
    ON CONFLICT (user_id) DO UPDATE
      SET purchased_superlikes = public.superlike_wallets.purchased_superlikes + EXCLUDED.purchased_superlikes,
          updated_at = now();

  ELSIF v_order.product LIKE 'superchat_credit_%' THEN
    INSERT INTO public.superchat_wallets(user_id, purchased_superchats)
    VALUES (v_order.user_id, v_order.quantity)
    ON CONFLICT (user_id) DO UPDATE
      SET purchased_superchats = public.superchat_wallets.purchased_superchats + EXCLUDED.purchased_superchats,
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
      COALESCE(v_order.payload->>'content', ''),
      v_order.id
    );

  ELSE
    RAISE EXCEPTION 'UNKNOWN_SHOP_PRODUCT';
  END IF;

  UPDATE public.shop_orders
  SET status = 'paid',
      fulfilled_at = now(),
      updated_at = now()
  WHERE id = p_order_id
    AND status = 'created'
    AND fulfilled_at IS NULL
    AND (expires_at IS NULL OR expires_at > now());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FULFILLABLE';
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_shop_order_fulfillment_immutability() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_shop_order_fulfillment_immutability() TO service_role;

REVOKE ALL ON FUNCTION public.fulfill_shop_order(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_shop_order(uuid) TO service_role;
