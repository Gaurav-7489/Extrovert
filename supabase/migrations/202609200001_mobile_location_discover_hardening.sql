-- Extrovert production hardening: precise area verification, distance-based Nearby,
-- and passed-profile recovery RPCs.

alter table public.extrovert_area_verifications
  add column if not exists location_lat_rounded double precision,
  add column if not exists location_lng_rounded double precision;

create index if not exists extrovert_area_verifications_user_verified_idx
  on public.extrovert_area_verifications (user_id, verified_at desc);

create or replace function public.rewind_last_pass()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_pass_id uuid;
  v_passed_id uuid;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_datebu_pro() then raise exception 'PRO_REQUIRED'; end if;

  select id, passed_id
    into v_pass_id, v_passed_id
    from public.passes
   where passer_id = v_user_id
   order by created_at desc
   limit 1
   for update;

  if v_pass_id is null then return null; end if;

  delete from public.passes
   where id = v_pass_id
     and passer_id = v_user_id;

  return v_passed_id;
end;
$$;

create or replace function public.reset_passed_profiles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  select count(*)::integer
    into v_count
    from public.passes
   where passer_id = v_user_id;

  delete from public.passes where passer_id = v_user_id;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.rewind_last_pass() from public;
revoke all on function public.reset_passed_profiles() from public;
grant execute on function public.rewind_last_pass() to authenticated;
grant execute on function public.reset_passed_profiles() to authenticated;

create or replace function public.get_discover_profiles_v3(
  p_excluded_ids uuid[] default '{}'::uuid[],
  p_limit integer default 20,
  p_interested_in text[] default '{}'::text[],
  p_preferred_department text default null,
  p_min_age integer default 18,
  p_max_age integer default 99,
  p_nearby_only boolean default false,
  p_max_distance_km double precision default 25
)
returns table(
  id uuid,
  display_name text,
  date_of_birth date,
  gender text,
  department text,
  academic_year text,
  identity_type text,
  institution_name text,
  field_of_study text,
  job_title text,
  employer_name text,
  role_description text,
  bio text,
  ghost_mode boolean,
  created_at timestamptz,
  profile_photos jsonb,
  profile_interests jsonb,
  verification_status text,
  area_verification_status text,
  area_name text,
  profile_photo_path text,
  is_beyond boolean,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
with me as (
  select
    coalesce(mv.location_lat_rounded, ma.center_lat) as lat,
    coalesce(mv.location_lng_rounded, ma.center_lng) as lng
  from public.extrovert_profiles mep
  left join public.extrovert_areas ma on ma.id = mep.area_id
  left join lateral (
    select av.location_lat_rounded, av.location_lng_rounded
    from public.extrovert_area_verifications av
    where av.user_id = mep.id
      and av.status = 'verified'
    order by av.verified_at desc nulls last, av.created_at desc
    limit 1
  ) mv on true
  where mep.id = auth.uid()
),
base as (
  select
    p.id,
    p.display_name,
    p.date_of_birth,
    p.gender,
    p.department,
    p.academic_year,
    p.identity_type,
    p.institution_name,
    p.field_of_study,
    p.job_title,
    p.employer_name,
    p.role_description,
    p.bio,
    p.ghost_mode,
    p.created_at,
    ep.verification_status,
    ep.area_verification_status,
    ep.profile_photo_path,
    ea.name as area_name,
    coalesce(cv.location_lat_rounded, ea.center_lat) as candidate_lat,
    coalesce(cv.location_lng_rounded, ea.center_lng) as candidate_lng,
    (
      case when p.gender in ('woman','female') then .25 else 0 end +
      case when ep.verification_status = 'verified' then .35 else 0 end +
      case when ep.area_verification_status = 'verified' then .175 else 0 end +
      case
        when p_preferred_department is not null
         and lower(coalesce(p.department,'')) like '%' || lower(trim(p_preferred_department)) || '%'
        then .2 else 0
      end
    ) as boost,
    (
      p.gender in ('woman','female')
      or exists (
        select 1
        from public.subscriptions s
        where s.user_id = p.id
          and s.plan = 'pro'
          and s.status in ('active','trialing')
          and (
            (s.status = 'trialing' and s.trial_ends_at > now())
            or (s.status = 'active' and s.current_period_end > now())
          )
      )
    ) as is_beyond
  from public.profiles p
  left join public.extrovert_profiles ep on ep.id = p.id
  left join public.extrovert_areas ea on ea.id = ep.area_id
  left join lateral (
    select av.location_lat_rounded, av.location_lng_rounded
    from public.extrovert_area_verifications av
    where av.user_id = p.id
      and av.status = 'verified'
    order by av.verified_at desc nulls last, av.created_at desc
    limit 1
  ) cv on true
  where p.profile_completed = true
    and p.ghost_mode = false
    and p.id <> auth.uid()
    and not (p.id = any(coalesce(p_excluded_ids, '{}'::uuid[])))
    and not exists (
      select 1 from public.likes l
      where l.liker_id = auth.uid() and l.liked_id = p.id
    )
    and not exists (
      select 1 from public.passes x
      where x.passer_id = auth.uid() and x.passed_id = p.id
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
    and (
      cardinality(coalesce(p_interested_in, '{}'::text[])) = 0
      or 'everyone' = any(p_interested_in)
      or ('men' = any(p_interested_in) and p.gender in ('man','male'))
      or ('women' = any(p_interested_in) and p.gender in ('woman','female'))
      or (
        ('nonbinary' = any(p_interested_in) or 'other' = any(p_interested_in))
        and p.gender in ('non-binary','nonbinary','other')
      )
    )
    and p.date_of_birth is not null
    and date_part('year', age(current_date, p.date_of_birth))
      between greatest(18, least(coalesce(p_min_age,18), 99))
          and greatest(
            greatest(18, least(coalesce(p_min_age,18), 99)),
            least(coalesce(p_max_age,99), 99)
          )
),
with_distance as (
  select
    b.*,
    case
      when me.lat is null or me.lng is null
        or b.candidate_lat is null or b.candidate_lng is null
      then null
      else 6371.0 * acos(
        least(
          1.0,
          greatest(
            -1.0,
            sin(radians(me.lat)) * sin(radians(b.candidate_lat))
            + cos(radians(me.lat)) * cos(radians(b.candidate_lat))
            * cos(radians(b.candidate_lng - me.lng))
          )
        )
      )
    end as distance_value
  from base b
  left join me on true
)
select
  c.id,
  c.display_name,
  c.date_of_birth,
  c.gender,
  c.department,
  c.academic_year,
  c.identity_type,
  c.institution_name,
  c.field_of_study,
  c.job_title,
  c.employer_name,
  c.role_description,
  c.bio,
  c.ghost_mode,
  c.created_at,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'storage_path', pp.storage_path,
        'display_order', pp.display_order,
        'is_primary', pp.is_primary
      )
      order by pp.is_primary desc, pp.display_order asc
    )
    from public.profile_photos pp
    where pp.profile_id = c.id
  ), '[]'::jsonb) as profile_photos,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'interests',
        jsonb_build_object('id', i.id, 'name', i.name)
      )
    )
    from public.profile_interests pi
    join public.interests i on i.id = pi.interest_id
    where pi.profile_id = c.id
  ), '[]'::jsonb) as profile_interests,
  coalesce(c.verification_status,'not_verified'),
  coalesce(c.area_verification_status,'not_verified'),
  c.area_name,
  c.profile_photo_path,
  c.is_beyond,
  case
    when c.distance_value is null then null
    else round(c.distance_value::numeric, 1)::double precision
  end as distance_km
from with_distance c
where not p_nearby_only
   or (
     c.area_verification_status = 'verified'
     and c.distance_value is not null
     and c.distance_value <= greatest(1, least(coalesce(p_max_distance_km,25), 100))
   )
order by
  case when p_nearby_only then c.distance_value end asc nulls last,
  c.boost desc,
  c.created_at desc
limit greatest(1, least(coalesce(p_limit,20),50));
$$;

revoke all on function public.get_discover_profiles_v3(uuid[],integer,text[],text,integer,integer,boolean,double precision) from public;
grant execute on function public.get_discover_profiles_v3(uuid[],integer,text[],text,integer,integer,boolean,double precision) to authenticated;
