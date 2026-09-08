-- Allow the authenticated onboarding flow to complete an existing Extrovert identity.
-- Protected trust/verification fields remain immutable. profile_completed may only
-- move from false -> true when the submitted identity is complete and adult.

drop policy if exists extrovert_profile_self_update on public.extrovert_profiles;

create policy extrovert_profile_self_update
  on public.extrovert_profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and verification_status = (public.current_extrovert_protected_state() ->> 'verification_status')
    and area_verification_status = (public.current_extrovert_protected_state() ->> 'area_verification_status')
    and trust_state = (public.current_extrovert_protected_state() ->> 'trust_state')
    and (
      profile_completed = ((public.current_extrovert_protected_state() ->> 'profile_completed')::boolean)
      or (
        (public.current_extrovert_protected_state() ->> 'profile_completed')::boolean = false
        and profile_completed = true
        and length(trim(display_name)) between 1 and 80
        and date_of_birth is not null
        and date_of_birth <= (current_date - interval '18 years')::date
        and date_of_birth >= (current_date - interval '100 years')::date
        and gender in ('man', 'woman', 'non-binary', 'other', 'prefer-not-to-say')
        and identity_type in ('student', 'professional', 'other')
      )
    )
    and coalesce(face_verification_completed_at::text, '') = coalesce(public.current_extrovert_protected_state() ->> 'face_verification_completed_at', '')
    and face_verification_attempts = coalesce((public.current_extrovert_protected_state() ->> 'face_verification_attempts')::integer, 0)
    and coalesce(face_verification_method, '') = coalesce(public.current_extrovert_protected_state() ->> 'face_verification_method', '')
    and coalesce(face_verification_last_attempt_at::text, '') = coalesce(public.current_extrovert_protected_state() ->> 'face_verification_last_attempt_at', '')
    and created_at::text = public.current_extrovert_protected_state() ->> 'created_at'
  );
