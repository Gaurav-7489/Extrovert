-- The earlier descending indexes already cover message pagination. These two
-- indexes have the same key order and add write/storage overhead without
-- improving any query plan.
drop index if exists public.idx_extrovert_messages_conversation_created_id;
drop index if exists public.idx_messages_match_created_id;
