-- Harden Like / SuperLike / Pass writes against direct client mutation.
-- All interaction creation now goes through authenticated, server-owned RPCs.

-- Normal users must not write interaction tables directly.
revoke insert, update, delete on table public.likes from authenticated;
revoke insert, update, delete on table public.passes from authenticated;
revoke insert, update, delete on table public.superlikes from authenticated;

-- Wallet balances are server-owned. Users may read their own balance only.
revoke insert, update, delete on table public.like_wallets from authenticated;
revoke insert, update, delete on table public.superlike_wallets from authenticated;

-- Atomic Pass RPC. The database validates the caller, target, profile state,
-- block relationship and self-targeting instead of trusting the client/UI.
create or replace function public.pass_profile(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_profile_id is null or v_user_id = p_profile_id then
    raise exception 'INVALID_PROFILE';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.profile_completed = true
      and p.ghost_mode = false
  ) then
    raise exception 'PROFILE_UNAVAILABLE';
  end if;

  if exists (
    select 1
    from public.blocks b
    where (b.blocker_id = v_user_id and b.blocked_id = p_profile_id)
       or (b.blocker_id = p_profile_id and b.blocked_id = v_user_id)
  ) then
    raise exception 'USER_UNAVAILABLE';
  end if;

  insert into public.passes (passer_id, passed_id)
  values (v_user_id, p_profile_id)
  on conflict (passer_id, passed_id) do nothing;

  return true;
end;
$$;

revoke all on function public.pass_profile(uuid) from public;
grant execute on function public.pass_profile(uuid) to authenticated;

-- SuperLike is one atomic server operation. It owns the wallet decrement,
-- SuperLike creation and discover exclusion; the client cannot forge any
-- of these mutations independently.
create or replace function public.send_superlike(p_recipient_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_sender uuid := auth.uid();
  v_balance integer;
begin
  if v_sender is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id is null or v_sender = p_recipient_id then raise exception 'INVALID_PROFILE'; end if;

  if not exists (
    select 1 from public.profiles
    where id = p_recipient_id and profile_completed = true and ghost_mode = false
  ) then
    raise exception 'PROFILE_UNAVAILABLE';
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = v_sender and blocked_id = p_recipient_id)
       or (blocker_id = p_recipient_id and blocked_id = v_sender)
  ) then
    raise exception 'USER_UNAVAILABLE';
  end if;

  if exists (
    select 1 from public.superlikes
    where sender_id = v_sender and recipient_id = p_recipient_id
  ) then
    raise exception 'ALREADY_SENT';
  end if;

  select purchased_superlikes
    into v_balance
    from public.superlike_wallets
   where user_id = v_sender
   for update;

  if coalesce(v_balance, 0) < 1 then
    raise exception 'SUPERLIKE_EMPTY';
  end if;

  insert into public.superlikes(sender_id, recipient_id)
  values(v_sender, p_recipient_id);

  update public.superlike_wallets
     set purchased_superlikes = purchased_superlikes - 1,
         updated_at = now()
   where user_id = v_sender;

  insert into public.passes(passer_id, passed_id)
  values(v_sender, p_recipient_id)
  on conflict (passer_id, passed_id) do nothing;

  return true;
end;
$function$;

revoke all on function public.send_superlike(uuid) from public;
grant execute on function public.send_superlike(uuid) to authenticated;

-- The existing like_profile() RPC already performs authentication, target,
-- profile, block and allowance checks. Keep direct table insertion disabled so
-- the allowance cannot be bypassed by inserting into likes directly.
revoke all on function public.like_profile(uuid) from public;
grant execute on function public.like_profile(uuid) to authenticated;
