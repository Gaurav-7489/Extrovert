-- Fix #12: validate Like/SuperLike/Pass targets inside trusted database code.
-- Like and SuperLike already perform target/self/block checks in their RPCs.
-- Passes previously allowed direct authenticated INSERTs with only passer_id
-- validation, which meant the target could be self, unavailable, or blocked.

CREATE OR REPLACE FUNCTION public.pass_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF p_profile_id IS NULL OR v_user_id = p_profile_id THEN
    RAISE EXCEPTION 'INVALID_PROFILE';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.profile_completed = true
      AND p.ghost_mode = false
  ) THEN
    RAISE EXCEPTION 'PROFILE_UNAVAILABLE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.blocks b
    WHERE (b.blocker_id = v_user_id AND b.blocked_id = p_profile_id)
       OR (b.blocker_id = p_profile_id AND b.blocked_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'USER_UNAVAILABLE';
  END IF;

  INSERT INTO public.passes (passer_id, passed_id)
  VALUES (v_user_id, p_profile_id)
  ON CONFLICT (passer_id, passed_id) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pass_profile(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pass_profile(uuid) TO authenticated;

-- Pass creation must go through the validated RPC; callers may still read/delete
-- their own pass rows under the existing RLS policies.
REVOKE INSERT ON TABLE public.passes FROM authenticated, anon;
