-- Secure Pass management actions after direct DELETE was revoked.

create or replace function public.rewind_last_pass()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_pass_id uuid;
  v_passed_id uuid;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_datebu_pro() then raise exception 'PRO_REQUIRED'; end if;

  select id, passed_id
    into v_pass_id, v_passed_id
    from public.passes
   where passer_id = v_user_id
   order by created_at desc
   limit 1
   for update;

  if v_pass_id is null then
    return null;
  end if;

  delete from public.passes where id = v_pass_id and passer_id = v_user_id;
  return v_passed_id;
end;
$$;

revoke all on function public.rewind_last_pass() from public;
grant execute on function public.rewind_last_pass() to authenticated;

create or replace function public.reset_passed_profiles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  select count(*)::integer into v_count
    from public.passes
   where passer_id = v_user_id;

  delete from public.passes where passer_id = v_user_id;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.reset_passed_profiles() from public;
grant execute on function public.reset_passed_profiles() to authenticated;
