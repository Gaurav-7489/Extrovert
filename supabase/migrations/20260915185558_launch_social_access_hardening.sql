-- Keep connection consent and block checks enforced for direct API callers too.
create or replace function private.guard_social_connection()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if tg_op = 'INSERT' then
    if new.requester_id <> actor or new.status <> 'pending' then
      raise exception 'CONNECTION_MUST_START_PENDING';
    end if;
  else
    if new.requester_id is distinct from old.requester_id or new.target_id is distinct from old.target_id then
      raise exception 'CONNECTION_PARTICIPANTS_IMMUTABLE';
    end if;
    if actor not in (old.requester_id, old.target_id) then raise exception 'NOT_CONNECTION_PARTICIPANT'; end if;
    if new.status is distinct from old.status and not (
      (old.status = 'pending' and actor = old.target_id and new.status in ('accepted','declined','blocked')) or
      (old.status = 'pending' and actor = old.requester_id and new.status = 'declined') or
      (old.status = 'accepted' and new.status in ('declined','blocked')) or
      (old.status = 'declined' and actor = old.requester_id and new.status = 'pending')
    ) then raise exception 'INVALID_CONNECTION_STATUS_TRANSITION'; end if;
  end if;
  if new.status in ('pending','accepted') then
    if exists (select 1 from public.blocks b where
      (b.blocker_id = new.requester_id and b.blocked_id = new.target_id) or
      (b.blocker_id = new.target_id and b.blocked_id = new.requester_id)) or
      exists (select 1 from public.extrovert_blocks b where
      (b.blocker_id = new.requester_id and b.blocked_id = new.target_id) or
      (b.blocker_id = new.target_id and b.blocked_id = new.requester_id)) then
      raise exception 'CONNECTION_UNAVAILABLE';
    end if;
    if (select count(*) from public.extrovert_profiles p where p.id in (new.requester_id,new.target_id)
      and p.profile_completed and p.trust_state is distinct from 'banned') <> 2 then
      raise exception 'CONNECTION_UNAVAILABLE';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_social_connection() from public, anon, authenticated;
drop trigger if exists enforce_extrovert_connection_update on public.extrovert_connections;
create trigger guard_social_connection before insert or update on public.extrovert_connections
for each row execute function private.guard_social_connection();

create or replace function private.can_access_social_chat(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
select auth.uid() is not null and exists (
  select 1 from public.extrovert_conversations cv
  join public.extrovert_connections c on c.id = cv.connection_id
  join public.extrovert_conversation_members m on m.conversation_id = cv.id and m.user_id = auth.uid()
  where cv.id = p_conversation_id and c.status = 'accepted'
  and auth.uid() in (c.requester_id,c.target_id)
  and (select count(*) from public.extrovert_profiles p where p.id in (c.requester_id,c.target_id)
    and p.trust_state is distinct from 'banned') = 2
  and not exists (select 1 from public.blocks b where
    (b.blocker_id=c.requester_id and b.blocked_id=c.target_id) or (b.blocker_id=c.target_id and b.blocked_id=c.requester_id))
  and not exists (select 1 from public.extrovert_blocks b where
    (b.blocker_id=c.requester_id and b.blocked_id=c.target_id) or (b.blocker_id=c.target_id and b.blocked_id=c.requester_id))
);
$$;
revoke all on function private.can_access_social_chat(uuid) from public, anon;
grant execute on function private.can_access_social_chat(uuid) to authenticated;
drop policy if exists extrovert_messages_read on public.extrovert_messages;
create policy extrovert_messages_read on public.extrovert_messages for select to authenticated
using (private.can_access_social_chat(conversation_id));
drop policy if exists extrovert_messages_send on public.extrovert_messages;
create policy extrovert_messages_send on public.extrovert_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and private.can_access_social_chat(conversation_id)
  and ciphertext like 'v1.%' and length(ciphertext) <= 16000);
