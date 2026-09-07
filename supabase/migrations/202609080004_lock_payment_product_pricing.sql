-- Fix #30: payment product, price and quantity are server-owned values.
-- The API already derives these values from the canonical catalog; these database
-- constraints make the same invariant hold even if a privileged write path is
-- accidentally exposed or a future code path passes client-controlled values.

-- Shop orders: product determines the only valid price and quantity.
alter table public.shop_orders
  drop constraint if exists shop_orders_product_pricing_check;

alter table public.shop_orders
  add constraint shop_orders_product_pricing_check
  check (
    (product = 'extra_likes_5'      and amount_paise = 1900 and quantity = 5) or
    (product = 'extra_likes_15'     and amount_paise = 4900 and quantity = 15) or
    (product = 'extra_likes_30'     and amount_paise = 7900 and quantity = 30) or
    (product = 'superlike_1'        and amount_paise = 1900 and quantity = 1) or
    (product = 'superlike_5'        and amount_paise = 5900 and quantity = 5) or
    (product = 'superchat_credit_1' and amount_paise = 2900 and quantity = 1) or
    (product = 'superchat_credit_3' and amount_paise = 6900 and quantity = 3) or
    (product = 'superchat'          and amount_paise = 2900 and quantity = 0)
  );

-- Once an order exists, its economic terms are immutable. Fulfillment may only
-- transition status/timestamps and must never be able to rewrite the purchase.
create or replace function public.guard_shop_order_pricing()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.product is distinct from old.product
       or new.amount_paise is distinct from old.amount_paise
       or new.quantity is distinct from old.quantity then
      raise exception 'ORDER_PRICING_IMMUTABLE';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_shop_order_pricing on public.shop_orders;
create trigger trg_guard_shop_order_pricing
before update on public.shop_orders
for each row execute function public.guard_shop_order_pricing();

-- UPI submissions: the amount must also match the server-owned product/plan.
alter table public.upi_payment_submissions
  drop constraint if exists upi_payment_product_pricing_check;

alter table public.upi_payment_submissions
  add constraint upi_payment_product_pricing_check
  check (
    (payment_type = 'shop' and (
      (product = 'extra_likes_5'      and amount_paise = 1900) or
      (product = 'extra_likes_15'     and amount_paise = 4900) or
      (product = 'extra_likes_30'     and amount_paise = 7900) or
      (product = 'superlike_1'        and amount_paise = 1900) or
      (product = 'superlike_5'        and amount_paise = 5900) or
      (product = 'superchat_credit_1' and amount_paise = 2900) or
      (product = 'superchat_credit_3' and amount_paise = 6900) or
      (product = 'superchat'          and amount_paise = 2900)
    )) or
    (payment_type = 'subscription' and (
      (product = 'weekly'  and amount_paise = 3900) or
      (product = 'monthly' and amount_paise = 9900)
    ))
  );

-- Product and amount are immutable after the payment submission is created.
create or replace function public.guard_upi_payment_terms()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.payment_type is distinct from old.payment_type
       or new.product is distinct from old.product
       or new.amount_paise is distinct from old.amount_paise then
      raise exception 'PAYMENT_TERMS_IMMUTABLE';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_upi_payment_terms on public.upi_payment_submissions;
create trigger trg_guard_upi_payment_terms
before update on public.upi_payment_submissions
for each row execute function public.guard_upi_payment_terms();
