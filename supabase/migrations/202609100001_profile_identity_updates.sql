-- Allow the server-side profile editor to update identity fields atomically.
-- The function is SECURITY DEFINER so the authenticated user does not need a
-- broad UPDATE policy on extrovert_profiles. Only the explicitly exposed fields
-- can be changed; trust/verification state is intentionally excluded.

CREATE OR REPLACE FUNCTION public.update_my_identity_profile(
  p_display_name text,
  p_date_of_birth date,
  p_gender text,
  p_institution_name text,
  p_field_of_study text,
  p_department text,
  p_academic_year text,
  p_job_title text,
  p_employer_name text,
  p_role_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.extrovert_profiles
    WHERE id = v_user_id AND trust_state <> 'banned'
  ) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  UPDATE public.extrovert_profiles
  SET
    display_name = p_display_name,
    date_of_birth = p_date_of_birth,
    gender = p_gender,
    institution_name = NULLIF(p_institution_name, ''),
    field_of_study = NULLIF(p_field_of_study, ''),
    department = NULLIF(p_department, ''),
    academic_year = NULLIF(p_academic_year, ''),
    job_title = NULLIF(p_job_title, ''),
    employer_name = NULLIF(p_employer_name, ''),
    role_description = NULLIF(p_role_description, ''),
    updated_at = now()
  WHERE id = v_user_id;

  -- Keep the legacy dating-profile projection synchronized. Preserve its
  -- required department/year values when the identity type does not use them.
  UPDATE public.profiles
  SET
    display_name = p_display_name,
    date_of_birth = p_date_of_birth,
    gender = p_gender,
    department = COALESCE(NULLIF(p_department, ''), department),
    academic_year = COALESCE(NULLIF(p_academic_year, ''), academic_year),
    institution_name = NULLIF(p_institution_name, ''),
    field_of_study = NULLIF(p_field_of_study, ''),
    job_title = NULLIF(p_job_title, ''),
    employer_name = NULLIF(p_employer_name, ''),
    role_description = NULLIF(p_role_description, ''),
    updated_at = now()
  WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_identity_profile(
  text, date, text, text, text, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_identity_profile(
  text, date, text, text, text, text, text, text, text, text
) TO authenticated;
