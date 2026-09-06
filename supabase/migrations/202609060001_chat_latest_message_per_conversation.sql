-- Chat list performance: return only the newest message for each requested conversation.
-- SECURITY INVOKER preserves the caller's existing RLS visibility.
create or replace function public.get_latest_dating_messages(p_match_ids uuid[])
returns table(id uuid, match_id uuid, sender_id uuid, content text, ciphertext text, encryption_version smallint, created_at timestamptz)
language sql stable security invoker set search_path = public
as $$
  select distinct on (m.match_id)
    m.id, m.match_id, m.sender_id, m.content, m.ciphertext, m.encryption_version, m.created_at
  from public.messages m
  where m.match_id = any(p_match_ids)
  order by m.match_id, m.created_at desc, m.id desc;
$$;

create or replace function public.get_latest_social_messages(p_conversation_ids uuid[])
returns table(id uuid, conversation_id uuid, sender_id uuid, ciphertext text, created_at timestamptz)
language sql stable security invoker set search_path = public
as $$
  select distinct on (m.conversation_id)
    m.id, m.conversation_id, m.sender_id, m.ciphertext, m.created_at
  from public.extrovert_messages m
  where m.conversation_id = any(p_conversation_ids)
  order by m.conversation_id, m.created_at desc, m.id desc;
$$;

create index if not exists messages_match_created_id_desc_idx
  on public.messages (match_id, created_at desc, id desc);

create index if not exists extrovert_messages_conversation_created_id_desc_idx
  on public.extrovert_messages (conversation_id, created_at desc, id desc);
