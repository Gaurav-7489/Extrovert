-- Fix #9: a blocked pair must never have a dating match.
-- Enforce this in the database, including concurrent block/match attempts.

CREATE OR REPLACE FUNCTION public.create_match_if_mutual_like(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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

  -- Serialize all match/block mutations for this pair.
  v_lock_key := hashtextextended(v_user_a::text || ':' || v_user_b::text, 0);
  perform pg_advisory_xact_lock(v_lock_key);

  -- A block in either direction is an absolute match barrier.
  if exists (
    select 1
    from public.blocks b
    where (b.blocker_id = v_user_a and b.blocked_id = v_user_b)
       or (b.blocker_id = v_user_b and b.blocked_id = v_user_a)
  ) then
    return null;
  end if;

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

-- Defense in depth: even a trusted/direct INSERT into matches cannot
-- create a match for a blocked pair.
CREATE OR REPLACE FUNCTION public.reject_blocked_match_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
declare
  v_lock_key bigint;
begin
  v_lock_key := hashtextextended(least(new.user_a, new.user_b)::text || ':' || greatest(new.user_a, new.user_b)::text, 0);
  perform pg_advisory_xact_lock(v_lock_key);

  if exists (
    select 1
    from public.blocks b
    where (b.blocker_id = new.user_a and b.blocked_id = new.user_b)
       or (b.blocker_id = new.user_b and b.blocked_id = new.user_a)
  ) then
    raise exception 'BLOCKED_MATCH' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists matches_reject_blocked_pair on public.matches;
create trigger matches_reject_blocked_pair
before insert on public.matches
for each row
execute function public.reject_blocked_match_insert();

-- Blocking must also invalidate an already-existing match. This trigger
-- takes the same pair lock, so block-vs-match races resolve safely.
CREATE OR REPLACE FUNCTION public.remove_match_on_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
declare
  v_user_a uuid;
  v_user_b uuid;
  v_lock_key bigint;
begin
  v_user_a := least(new.blocker_id, new.blocked_id);
  v_user_b := greatest(new.blocker_id, new.blocked_id);
  v_lock_key := hashtextextended(v_user_a::text || ':' || v_user_b::text, 0);
  perform pg_advisory_xact_lock(v_lock_key);

  delete from public.matches m
   where m.user_a = v_user_a
     and m.user_b = v_user_b;

  return new;
end;
$$;

drop trigger if exists blocks_remove_match_trigger on public.blocks;
create trigger blocks_remove_match_trigger
before insert on public.blocks
for each row
execute function public.remove_match_on_block();

revoke execute on function public.reject_blocked_match_insert() from public, anon, authenticated;
revoke execute on function public.remove_match_on_block() from public, anon, authenticated;

-- create_match_if_mutual_like is an internal server-side RPC used by like_profile.
revoke execute on function public.create_match_if_mutual_like(uuid, uuid) from public, anon, authenticated;
