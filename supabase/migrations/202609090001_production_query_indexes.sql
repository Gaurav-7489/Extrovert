-- Production query indexes for the mobile inbox / safety paths.
-- All indexes are additive and safe to run repeatedly.

CREATE INDEX IF NOT EXISTS idx_matches_user_a_created_at
  ON public.matches (user_a, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_user_b_created_at
  ON public.matches (user_b, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked
  ON public.blocks (blocker_id, blocked_id);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked_blocker
  ON public.blocks (blocked_id, blocker_id);

CREATE INDEX IF NOT EXISTS idx_superchats_recipient_status_created_at
  ON public.superchats (recipient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connections_target_status
  ON public.extrovert_connections (target_id, status);

CREATE INDEX IF NOT EXISTS idx_connections_requester_status
  ON public.extrovert_connections (requester_id, status);
