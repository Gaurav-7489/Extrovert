-- Lock verification_status transitions to trusted server-side service-role logic.
-- Client/authenticated sessions may update ordinary profile fields, but they can
-- never set, clear, or otherwise change verification_status directly.

create or replace function public.enforce_server_only_verification_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and auth.role() <> 'service_role' then
    raise exception 'verification_status can only be changed by trusted server logic';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_server_only_verification_status() from public;

 drop trigger if exists extrovert_profiles_verification_status_server_only
   on public.extrovert_profiles;

create trigger extrovert_profiles_verification_status_server_only
before update on public.extrovert_profiles
for each row
execute function public.enforce_server_only_verification_status();
