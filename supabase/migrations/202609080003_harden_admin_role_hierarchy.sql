-- Extrovert: harden the admin role hierarchy.
-- Role changes must go through one database function; normal authenticated clients cannot UPDATE profiles.role directly.

CREATE OR REPLACE FUNCTION public.extrovert_role_rank(p_role public.user_role)
RETURNS integer LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE p_role
    WHEN 'SUPER_ADMIN' THEN 100
    WHEN 'ADMIN' THEN 80
    WHEN 'MODERATOR' THEN 60
    WHEN 'VERIFIED_STUDENT' THEN 40
    WHEN 'STUDENT' THEN 20
    WHEN 'SUSPENDED' THEN 10
    WHEN 'BANNED' THEN 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.extrovert_actor_role()
RETURNS public.user_role
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role public.user_role;
BEGIN
  IF v_user_id IS NULL THEN RETURN NULL; END IF;
  IF v_user_id = 'a22a60b0-8010-47a7-8626-1b59433aefaf'::uuid THEN RETURN 'SUPER_ADMIN'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_target_user_id uuid,
  p_new_role public.user_role
)
RETURNS public.user_role
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role;
  v_target_role public.user_role;
BEGIN
  IF v_actor_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_target_user_id IS NULL OR p_new_role IS NULL THEN RAISE EXCEPTION 'Target user and role are required'; END IF;
  IF p_target_user_id = v_actor_id THEN RAISE EXCEPTION 'Users cannot change their own role'; END IF;
  IF p_target_user_id = 'a22a60b0-8010-47a7-8626-1b59433aefaf'::uuid AND p_new_role <> 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'The trusted owner role cannot be changed';
  END IF;

  v_actor_role := public.extrovert_actor_role();
  IF v_actor_role IS NULL OR v_actor_role NOT IN ('SUPER_ADMIN', 'ADMIN') THEN
    RAISE EXCEPTION 'Insufficient privileges to change roles';
  END IF;

  SELECT role INTO v_target_role FROM public.profiles WHERE id = p_target_user_id FOR UPDATE;
  IF v_target_role IS NULL THEN RAISE EXCEPTION 'Target user does not exist'; END IF;

  -- An ADMIN may only manage roles strictly below ADMIN. SUPER_ADMIN is the only role
  -- allowed to create/manage ADMIN and SUPER_ADMIN assignments.
  IF v_actor_role <> 'SUPER_ADMIN'
     AND public.extrovert_role_rank(p_new_role) >= public.extrovert_role_rank(v_actor_role) THEN
    RAISE EXCEPTION 'Cannot grant a role at or above your own rank';
  END IF;
  IF p_new_role = 'SUPER_ADMIN' AND v_actor_role <> 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Only SUPER_ADMIN can grant SUPER_ADMIN';
  END IF;

  UPDATE public.profiles SET role = p_new_role WHERE id = p_target_user_id;
  RETURN p_new_role;
END;
$$;

-- Normal clients cannot modify the protected role column directly.
REVOKE UPDATE (role) ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.extrovert_role_rank(public.user_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.extrovert_actor_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_user_role(uuid, public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.user_role) TO authenticated;

COMMENT ON FUNCTION public.set_user_role(uuid, public.user_role) IS 'Trusted role-management entry point enforcing the Extrovert admin hierarchy and protecting the SUPER_ADMIN owner.';
COMMENT ON FUNCTION public.extrovert_role_rank(public.user_role) IS 'Canonical authorization rank for Extrovert user roles.';
