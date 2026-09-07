-- ============================================================
-- Fix #31: Subscription activation requires an approved payment
-- ============================================================

create or replace function public.approve_subscription_payment(p_payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.upi_payment_submissions%rowtype;
  v_days integer;
  v_now timestamptz := now();
  v_end timestamptz;
begin
  select * into v_payment
  from public.upi_payment_submissions
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment submission not found.' using errcode = 'P0002';
  end if;

  if v_payment.payment_type <> 'subscription' then
    raise exception 'Payment is not a subscription payment.' using errcode = 'P0001';
  end if;

  if v_payment.status = 'approved' then
    return jsonb_build_object('success', true, 'already_approved', true);
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'Only pending subscription payments can be approved.' using errcode = 'P0001';
  end if;

  if v_payment.product = 'weekly' and v_payment.amount_paise = 3900 then
    v_days := 7;
  elsif v_payment.product = 'monthly' and v_payment.amount_paise = 9900 then
    v_days := 30;
  else
    raise exception 'Subscription payment does not match an authoritative server price.' using errcode = 'P0001';
  end if;

  -- Approval and activation are one transaction. Subscription state cannot
  -- commit unless this exact payment is valid and approved in this transaction.
  update public.upi_payment_submissions
  set status = 'approved', updated_at = v_now
  where id = v_payment.id;

  v_end := v_now + make_interval(days => v_days);

  insert into public.subscriptions (
    user_id,
    plan,
    status,
    current_period_start,
    current_period_end,
    last_payment_id,
    updated_at
  ) values (
    v_payment.user_id,
    'pro',
    'active',
    v_now,
    v_end,
    v_payment.id::text,
    v_now
  )
  on conflict (user_id) do update
  set plan = 'pro',
      status = 'active',
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      last_payment_id = excluded.last_payment_id,
      updated_at = v_now;

  return jsonb_build_object(
    'success', true,
    'already_approved', false,
    'payment_id', v_payment.id,
    'user_id', v_payment.user_id
  );
end;
$$;

revoke all on function public.approve_subscription_payment(uuid) from public;
revoke all on function public.approve_subscription_payment(uuid) from anon;
revoke all on function public.approve_subscription_payment(uuid) from authenticated;
grant execute on function public.approve_subscription_payment(uuid) to service_role;

comment on function public.approve_subscription_payment(uuid) is
  'Atomically approves a valid pending UPI subscription payment and activates Pro in the same transaction. Client roles cannot execute this function.';
