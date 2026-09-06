-- Keep discovery reach entitlements aligned with the canonical Beyond rule:
-- women receive Beyond for free; paid/trialing users receive it while active.
CREATE OR REPLACE FUNCTION public.get_extrovert_user_ids(p_user_ids uuid[])
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.extrovert_profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE p.id = ANY(p_user_ids)
    AND (
      lower(coalesce(p.gender, '')) IN ('woman', 'female')
      OR (
        s.plan = 'pro'
        AND (
          (s.status = 'trialing' AND s.trial_ends_at > now())
          OR
          (s.status = 'active' AND s.current_period_end > now())
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.get_extrovert_user_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_extrovert_user_ids(uuid[]) TO authenticated;
