alter table public.upi_payment_submissions
  add column if not exists fraud_score smallint not null default 0,
  add column if not exists fraud_flags text[] not null default '{}',
  add column if not exists fraud_review_required boolean not null default false,
  add column if not exists duplicate_of uuid null;

create or replace function public.detect_upi_payment_fraud()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_utr text;
  v_duplicate_id uuid;
  v_rapid_repeat bigint;
  v_hourly_volume bigint;
  v_daily_volume bigint;
  v_score integer := 0;
  v_flags text[] := '{}';
begin
  normalized_utr := nullif(upper(regexp_replace(coalesce(new.utr, ''), '\\s+', '', 'g')), '');

  if normalized_utr is not null then
    select s.id
      into v_duplicate_id
      from public.upi_payment_submissions s
     where s.id <> new.id
       and nullif(upper(regexp_replace(coalesce(s.utr, ''), '\\s+', '', 'g')), '') = normalized_utr
     order by s.created_at asc
     limit 1;

    if v_duplicate_id is not null then
      v_score := v_score + 100;
      v_flags := array_append(v_flags, 'duplicate_utr');
    end if;
  end if;

  select count(*)
    into v_rapid_repeat
    from public.upi_payment_submissions s
   where s.id <> new.id
     and s.user_id = new.user_id
     and s.payment_type = new.payment_type
     and s.product = new.product
     and s.amount_paise = new.amount_paise
     and s.created_at >= coalesce(new.created_at, now()) - interval '10 minutes';

  if v_rapid_repeat >= 1 then
    v_score := v_score + 40;
    v_flags := array_append(v_flags, 'rapid_repeat');
  end if;

  select count(*)
    into v_hourly_volume
    from public.upi_payment_submissions s
   where s.id <> new.id
     and s.user_id = new.user_id
     and s.created_at >= coalesce(new.created_at, now()) - interval '1 hour';

  if v_hourly_volume >= 4 then
    v_score := v_score + 30;
    v_flags := array_append(v_flags, 'high_velocity_1h');
  end if;

  select count(*)
    into v_daily_volume
    from public.upi_payment_submissions s
   where s.id <> new.id
     and s.user_id = new.user_id
     and s.created_at >= coalesce(new.created_at, now()) - interval '24 hours';

  if v_daily_volume >= 9 then
    v_score := v_score + 30;
    v_flags := array_append(v_flags, 'high_volume_24h');
  end if;

  new.fraud_score := least(v_score, 100)::smallint;
  new.fraud_flags := v_flags;
  new.fraud_review_required := v_score >= 40;
  new.duplicate_of := v_duplicate_id;

  return new;
end;
$$;

revoke all on function public.detect_upi_payment_fraud() from public, anon, authenticated;

drop trigger if exists trg_detect_upi_payment_fraud on public.upi_payment_submissions;
create trigger trg_detect_upi_payment_fraud
before insert or update of user_id, payment_type, product, amount_paise, utr, created_at
on public.upi_payment_submissions
for each row
execute function public.detect_upi_payment_fraud();

create index if not exists idx_upi_payment_submissions_fraud_review
  on public.upi_payment_submissions (fraud_review_required, created_at desc)
  where fraud_review_required = true;

create index if not exists idx_upi_payment_submissions_user_created
  on public.upi_payment_submissions (user_id, created_at desc);

create index if not exists idx_upi_payment_submissions_utr_normalized
  on public.upi_payment_submissions ((upper(regexp_replace(coalesce(utr, ''), '\\s+', '', 'g'))))
  where utr is not null and btrim(utr) <> '';
