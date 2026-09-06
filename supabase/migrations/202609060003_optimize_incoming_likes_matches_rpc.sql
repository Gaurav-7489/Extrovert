create or replace function public.get_like_match_ids(p_user_ids uuid[] default '{}')
returns table(user_id uuid, match_id uuid)
language sql stable security definer set search_path=public
as $$
  select case when m.user_a = auth.uid() then m.user_b else m.user_a end as user_id, m.id as match_id
  from public.matches m
  where (m.user_a = auth.uid() and m.user_b = any(coalesce(p_user_ids,'{}'::uuid[])))
     or (m.user_b = auth.uid() and m.user_a = any(coalesce(p_user_ids,'{}'::uuid[])));
$$;
revoke all on function public.get_like_match_ids(uuid[]) from public, anon;
grant execute on function public.get_like_match_ids(uuid[]) to authenticated;
