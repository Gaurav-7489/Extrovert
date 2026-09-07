-- Keep the match integrity trigger as an internal database guard only.
create or replace function public.enforce_match_requires_mutual_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_a is null or new.user_b is null or new.user_a = new.user_b then
    raise exception 'INVALID_MATCH_PAIR';
  end if;

  if not exists (
    select 1
    from public.likes l
    where l.liker_id = new.user_a
      and l.liked_id = new.user_b
  ) or not exists (
    select 1
    from public.likes l
    where l.liker_id = new.user_b
      and l.liked_id = new.user_a
  ) then
    raise exception 'MATCH_REQUIRES_MUTUAL_LIKES';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_match_requires_mutual_like()
from public, anon, authenticated, service_role;
