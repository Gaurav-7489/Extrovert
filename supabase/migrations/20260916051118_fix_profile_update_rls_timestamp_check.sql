-- Keep the RLS helper safe to call from the profile policy without giving it
-- definer privileges. The caller can only read their own row through RLS.
ALTER FUNCTION public.current_profile_protected_state() SECURITY INVOKER;

-- JSON serializes timestamptz differently from Postgres' text output. The old
-- policy compared the two text representations and consequently rejected every
-- update even when no protected field changed.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND role::text = ((SELECT public.current_profile_protected_state()) ->> 'role')
    AND identity_verified = (((SELECT public.current_profile_protected_state()) ->> 'identity_verified')::boolean)
    AND area_verified = (((SELECT public.current_profile_protected_state()) ->> 'area_verified')::boolean)
    AND starter_likes_remaining = (((SELECT public.current_profile_protected_state()) ->> 'starter_likes_remaining')::integer)
    AND daily_likes_used = (((SELECT public.current_profile_protected_state()) ->> 'daily_likes_used')::integer)
    AND coalesce(daily_likes_date::text, '') = coalesce((SELECT public.current_profile_protected_state()) ->> 'daily_likes_date', '')
    AND created_at = (((SELECT public.current_profile_protected_state()) ->> 'created_at')::timestamptz)
  );
