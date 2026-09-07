-- Fix 14: protect server-owned profile fields from direct authenticated updates.
--
-- Client-side field hiding is not a security boundary. Authenticated users can
-- call the Supabase Data API directly, so server-owned authority/entitlement
-- fields must be protected at the database layer as well.

CREATE OR REPLACE FUNCTION public.guard_profile_protected_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Trusted server/database roles may perform administrative maintenance.
  -- Normal authenticated sessions must never be able to rewrite these fields.
  IF auth.uid() IS NOT NULL
     AND current_user NOT IN ('service_role', 'postgres') THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.identity_verified IS DISTINCT FROM OLD.identity_verified
       OR NEW.area_verified IS DISTINCT FROM OLD.area_verified
       OR NEW.starter_likes_remaining IS DISTINCT FROM OLD.starter_likes_remaining
       OR NEW.daily_likes_used IS DISTINCT FROM OLD.daily_likes_used
       OR NEW.daily_likes_date IS DISTINCT FROM OLD.daily_likes_date
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Protected profile fields can only be changed by trusted server logic';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_protected_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_protected_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_protected_fields();

REVOKE ALL ON FUNCTION public.guard_profile_protected_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_profile_protected_fields() FROM anon;
REVOKE ALL ON FUNCTION public.guard_profile_protected_fields() FROM authenticated;
