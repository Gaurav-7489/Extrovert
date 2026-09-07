-- Critical hardening: sensitive tables are API-denylisted while service-role server routes remain authoritative.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='upi_payment_submissions' AND policyname='deny_direct_authenticated_access') THEN
    CREATE POLICY deny_direct_authenticated_access ON public.upi_payment_submissions FOR ALL TO authenticated USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='upi_payment_submissions' AND policyname='deny_direct_anon_access') THEN
    CREATE POLICY deny_direct_anon_access ON public.upi_payment_submissions FOR ALL TO anon USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='extrovert_face_verification_sessions' AND policyname='deny_direct_authenticated_access') THEN
    CREATE POLICY deny_direct_authenticated_access ON public.extrovert_face_verification_sessions FOR ALL TO authenticated USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='extrovert_face_verification_sessions' AND policyname='deny_direct_anon_access') THEN
    CREATE POLICY deny_direct_anon_access ON public.extrovert_face_verification_sessions FOR ALL TO anon USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_audit_logs' AND policyname='deny_direct_authenticated_access') THEN
    CREATE POLICY deny_direct_authenticated_access ON public.admin_audit_logs FOR ALL TO authenticated USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_audit_logs' AND policyname='deny_direct_anon_access') THEN
    CREATE POLICY deny_direct_anon_access ON public.admin_audit_logs FOR ALL TO anon USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_vapid_keys' AND policyname='deny_direct_authenticated_access') THEN
    CREATE POLICY deny_direct_authenticated_access ON public.push_vapid_keys FOR ALL TO authenticated USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_vapid_keys' AND policyname='deny_direct_anon_access') THEN
    CREATE POLICY deny_direct_anon_access ON public.push_vapid_keys FOR ALL TO anon USING (false) WITH CHECK (false);
  END IF;
END $$;

-- SECURITY DEFINER functions are never callable anonymously. Internal guards/maintenance
-- functions are not client RPCs and are fully removed from PUBLIC/authenticated execution.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon', r.schema_name, r.function_name, r.args);
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.current_extrovert_verification_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_profile_protected_state() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_protected_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_extrovert_connection_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_shop_orders() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS extrovert_conversations_connection_idx ON public.extrovert_conversations(connection_id);
CREATE INDEX IF NOT EXISTS extrovert_conversation_members_user_conversation_idx ON public.extrovert_conversation_members(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS extrovert_messages_conversation_sender_created_idx ON public.extrovert_messages(conversation_id, sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_match_created_idx ON public.messages(sender_id, match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS likes_liker_created_idx ON public.likes(liker_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS likes_liked_created_idx ON public.likes(liked_id, created_at DESC, id DESC);
