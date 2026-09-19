-- Lock Discover SECURITY DEFINER RPCs to signed-in users only.
revoke execute on function public.get_discover_profiles_v3(uuid[],integer,text[],text,integer,integer,uuid) from anon;
revoke execute on function public.reset_passed_profiles() from anon;
revoke execute on function public.rewind_last_pass() from anon;

grant execute on function public.get_discover_profiles_v3(uuid[],integer,text[],text,integer,integer,uuid) to authenticated;
grant execute on function public.reset_passed_profiles() to authenticated;
grant execute on function public.rewind_last_pass() to authenticated;
