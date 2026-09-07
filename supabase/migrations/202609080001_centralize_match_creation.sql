-- ============================================================
-- Fix 7: Centralize match creation
-- ============================================================
-- Match rows must only be created by one trusted database primitive.
-- The client-facing like_profile RPC is the only application entry
-- point that may request this primitive.

create or replace function public.create_match_if_mutual_like(
  p_user_a uuid,
  p_user_b uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_a uuid;
  v_user_b uuid;
  v_match_id uuid;
  v_lock_key bigint;
begin
  if p_user_a is null or p_user_b is null or p_user_a = p_user_b then
    return null;
  end if;

  v_user_a := least(p_user_a, p_user_b);
  v_user_b := greatest(p_user_a, p_user_b);

  -- Serialize the pair so simultaneous reciprocal likes cannot miss
  -- match creation because both transactions observe the same state.
  v_lock_key := hashtextextended(v_user_a::text || ':' || v_user_b::text, 0);
  perform pg_advisory_xact_lock(v_lock_key);

  if not exists (
    select 1
    from public.likes l
    where l.liker_id = v_user_a
      and l.liked_id = v_user_b
  ) or not exists (
    select 1
    from public.likes l
    where l.liker_id = v_user_b
      and l.liked_id = v_user_a
  ) then
    return null;
  end if;

  insert into public.matches (user_a, user_b)
  values (v_user_a, v_user_b)
  on conflict (user_a, user_b) do nothing
  returning id into v_match_id;

  if v_match_id is null then
    select m.id
      into v_match_id
      from public.matches m
     where m.user_a = v_user_a
       and m.user_b = v_user_b;
  end if;

  return v_match_id;
end;
$$;

-- Internal DB primitive: never expose it through the Data API.
revoke execute on function public.create_match_if_mutual_like(uuid, uuid)
from public, anon, authenticated, service_role;

-- Remove the old trigger path so match creation has exactly one owner.
drop trigger if exists likes_create_match_trigger on public.likes;
drop function if exists public.create_match_on_mutual_like();

-- like_profile remains the trusted application entry point and now delegates
-- match creation to the single central primitive above.
create or replace function public.like_profile(p_profile_id uuid)
returns table(matched boolean, match_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_match_id uuid;
  v_is_pro boolean := public.is_datebu_pro();
  v_today date := timezone('Asia/Kolkata', now())::date;
  v_starter integer;
  v_daily integer;
  v_purchased integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_user_id = p_profile_id then raise exception 'INVALID_PROFILE'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_profile_id
      and p.profile_completed = true
      and p.ghost_mode = false
  ) then raise exception 'PROFILE_UNAVAILABLE'; end if;
  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_user_id and b.blocked_id = p_profile_id)
       or (b.blocker_id = p_profile_id and b.blocked_id = v_user_id)
  ) then raise exception 'USER_UNAVAILABLE'; end if;

  insert into public.like_wallets(user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  update public.profiles
     set daily_likes_used = 0,
         daily_likes_date = v_today
   where id = v_user_id
     and daily_likes_date <> v_today;

  select p.starter_likes_remaining, p.daily_likes_used
    into v_starter, v_daily
    from public.profiles p
   where p.id = v_user_id
   for update;

  select lw.purchased_likes
    into v_purchased
    from public.like_wallets lw
   where lw.user_id = v_user_id
   for update;

  if v_is_pro then
    if v_daily < 10 then
      update public.profiles
         set daily_likes_used = daily_likes_used + 1
       where id = v_user_id;
    elsif v_purchased > 0 then
      update public.like_wallets
         set purchased_likes = purchased_likes - 1,
             updated_at = now()
       where user_id = v_user_id;
    else
      raise exception 'LIKE_LIMIT_REACHED';
    end if;
  elsif v_starter > 0 then
    update public.profiles
       set starter_likes_remaining = starter_likes_remaining - 1
     where id = v_user_id;
  elsif v_daily < 2 then
    update public.profiles
       set daily_likes_used = daily_likes_used + 1
     where id = v_user_id;
  elsif v_purchased > 0 then
    update public.like_wallets
       set purchased_likes = purchased_likes - 1,
           updated_at = now()
     where user_id = v_user_id;
  else
    raise exception 'LIKE_LIMIT_REACHED';
  end if;

  insert into public.likes(liker_id, liked_id)
  values (v_user_id, p_profile_id)
  on conflict (liker_id, liked_id) do nothing;

  v_match_id := public.create_match_if_mutual_like(v_user_id, p_profile_id);

  if v_match_id is not null then
    return query select true, v_match_id;
    return;
  end if;

  return query select false, null::uuid;
end;
$$;

grant execute on function public.like_profile(uuid) to authenticated;
revoke execute on function public.like_profile(uuid) from anon;
