create index if not exists idx_messages_match_created_id
  on public.messages (match_id, created_at desc, id desc);

create index if not exists idx_extrovert_messages_conversation_created_id
  on public.extrovert_messages (conversation_id, created_at desc, id desc);

create index if not exists idx_profile_photos_profile_primary_order
  on public.profile_photos (profile_id, is_primary desc, display_order asc);