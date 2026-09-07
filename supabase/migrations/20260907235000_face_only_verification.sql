-- Extrovert MVP: verification is a lightweight face/liveness check only.
-- No KYC provider, document verification, or biometric embedding is stored.

create or replace function public.current_extrovert_verification_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select verification_status
  from public.extrovert_profiles
  where id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_extrovert_verification_status() from public;
grant execute on function public.current_extrovert_verification_status() to authenticated;

drop policy if exists extrovert_profile_self_update on public.extrovert_profiles;
create policy extrovert_profile_self_update
  on public.extrovert_profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and verification_status = public.current_extrovert_verification_status()
  );

-- Remove the old provider-session table. Area verification remains separate.
drop table if exists public.extrovert_verification_sessions cascade;
