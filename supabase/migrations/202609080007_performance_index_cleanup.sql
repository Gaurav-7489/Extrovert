CREATE INDEX IF NOT EXISTS explore_plan_messages_sender_idx ON public.explore_plan_messages(sender_id);
DROP INDEX IF EXISTS public.extrovert_conversation_members_user_conversation_idx;
DROP INDEX IF EXISTS public.idx_upi_payment_submissions_user_created;
