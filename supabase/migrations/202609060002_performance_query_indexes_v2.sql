create index if not exists matches_user_a_created_at_desc_idx on public.matches (user_a, created_at desc, id desc);
create index if not exists matches_user_b_created_at_desc_idx on public.matches (user_b, created_at desc, id desc);
create index if not exists likes_liked_liker_created_at_desc_idx on public.likes (liked_id, liker_id, created_at desc, id desc);
