-- Campaign preparation: remove the permanent free-Beyond rule for women.
-- The Founding 100 campaign will be implemented separately at launch.
-- Until then, Beyond is available only through an active/trialing paid subscription.

CREATE OR REPLACE FUNCTION public.is_datebu_pro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.plan = 'pro'
      AND (
        (s.status = 'trialing' AND s.trial_ends_at > now())
        OR
        (s.status = 'active' AND s.current_period_end > now())
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_datebu_pro() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_datebu_pro() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_extrovert_user_ids(p_user_ids uuid[])
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.extrovert_profiles p
  JOIN public.subscriptions s ON s.user_id = p.id
  WHERE p.id = ANY(p_user_ids)
    AND s.plan = 'pro'
    AND (
      (s.status = 'trialing' AND s.trial_ends_at > now())
      OR
      (s.status = 'active' AND s.current_period_end > now())
    );
$$;

REVOKE ALL ON FUNCTION public.get_extrovert_user_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_extrovert_user_ids(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_like_status()
RETURNS TABLE(
  starter_remaining integer,
  daily_used integer,
  daily_limit integer,
  purchased_remaining integer,
  is_pro boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.starter_likes_remaining,
    CASE
      WHEN p.daily_likes_date = timezone('Asia/Kolkata', now())::date
        THEN p.daily_likes_used
      ELSE 0
    END,
    CASE WHEN public.is_datebu_pro() THEN 10 ELSE 2 END,
    COALESCE(lw.purchased_likes, 0),
    public.is_datebu_pro()
  FROM public.profiles p
  LEFT JOIN public.like_wallets lw ON lw.user_id = p.id
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_like_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_like_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.like_profile(p_profile_id uuid)
RETURNS TABLE(matched boolean, match_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_a uuid;
  v_user_b uuid;
  v_match_id uuid;
  v_is_pro boolean := public.is_datebu_pro();
  v_today date := timezone('Asia/Kolkata', now())::date;
  v_starter integer;
  v_daily integer;
  v_purchased integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF v_user_id = p_profile_id THEN RAISE EXCEPTION 'INVALID_PROFILE'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.profile_completed = true
      AND p.ghost_mode = false
  ) THEN RAISE EXCEPTION 'PROFILE_UNAVAILABLE'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = v_user_id AND b.blocked_id = p_profile_id)
       OR (b.blocker_id = p_profile_id AND b.blocked_id = v_user_id)
  ) THEN RAISE EXCEPTION 'USER_UNAVAILABLE'; END IF;

  INSERT INTO public.like_wallets(user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.profiles
  SET daily_likes_used = 0,
      daily_likes_date = v_today
  WHERE id = v_user_id
    AND daily_likes_date <> v_today;

  SELECT p.starter_likes_remaining, p.daily_likes_used
  INTO v_starter, v_daily
  FROM public.profiles p
  WHERE p.id = v_user_id
  FOR UPDATE;

  SELECT lw.purchased_likes
  INTO v_purchased
  FROM public.like_wallets lw
  WHERE lw.user_id = v_user_id
  FOR UPDATE;

  IF v_is_pro THEN
    IF v_daily < 10 THEN
      UPDATE public.profiles
      SET daily_likes_used = daily_likes_used + 1
      WHERE id = v_user_id;
    ELSIF v_purchased > 0 THEN
      UPDATE public.like_wallets
      SET purchased_likes = purchased_likes - 1,
          updated_at = now()
      WHERE user_id = v_user_id;
    ELSE
      RAISE EXCEPTION 'LIKE_LIMIT_REACHED';
    END IF;
  ELSIF v_starter > 0 THEN
    UPDATE public.profiles
    SET starter_likes_remaining = starter_likes_remaining - 1
    WHERE id = v_user_id;
  ELSIF v_daily < 2 THEN
    UPDATE public.profiles
    SET daily_likes_used = daily_likes_used + 1
    WHERE id = v_user_id;
  ELSIF v_purchased > 0 THEN
    UPDATE public.like_wallets
    SET purchased_likes = purchased_likes - 1,
        updated_at = now()
    WHERE user_id = v_user_id;
  ELSE
    RAISE EXCEPTION 'LIKE_LIMIT_REACHED';
  END IF;

  INSERT INTO public.likes(liker_id, liked_id)
  VALUES (v_user_id, p_profile_id)
  ON CONFLICT (liker_id, liked_id) DO NOTHING;

  v_user_a := least(v_user_id, p_profile_id);
  v_user_b := greatest(v_user_id, p_profile_id);

  IF EXISTS (
    SELECT 1
    FROM public.likes l
    WHERE l.liker_id = p_profile_id
      AND l.liked_id = v_user_id
  ) THEN
    INSERT INTO public.matches(user_a, user_b)
    VALUES (v_user_a, v_user_b)
    ON CONFLICT (user_a, user_b) DO NOTHING
    RETURNING id INTO v_match_id;

    IF v_match_id IS NULL THEN
      SELECT m.id INTO v_match_id
      FROM public.matches m
      WHERE m.user_a = v_user_a
        AND m.user_b = v_user_b;
    END IF;

    RETURN QUERY SELECT true, v_match_id;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, NULL::uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.like_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.like_profile(uuid) TO authenticated;
