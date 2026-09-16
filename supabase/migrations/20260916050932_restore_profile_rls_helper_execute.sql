-- The profile UPDATE policy calls this security-definer helper in its
-- WITH CHECK clause. It must be executable by authenticated users or every
-- profile upsert fails before the dating details can be saved.
GRANT EXECUTE ON FUNCTION public.current_profile_protected_state() TO authenticated;
