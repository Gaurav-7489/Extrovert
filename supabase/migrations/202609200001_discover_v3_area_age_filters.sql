-- Extrovert Discover v3: real age filters + verified-area filtering.
create or replace function public.get_discover_profiles_v3(
  p_excluded_ids uuid[] default '{}',
  p_limit integer default 20,
  p_interested_in text[] default '{}',
  p_preferred_department text default null,
  p_min_age integer default 18,
  p_max_age integer default 99,
  p_area_id uuid default null
)
returns table(
  id uuid, display_name text, date_of_birth date, gender text, department text,
  academic_year text, identity_type text, institution_name text, field_of_study text,
  job_title text, employer_name text, role_description text, bio text, ghost_mode boolean,
  created_at timestamptz, profile_photos jsonb, profile_interests jsonb,
  verification_status text, area_verification_status text, area_name text,
  profile_photo_path text, is_beyond boolean
)
language sql
security definer
stable
set search_path = public
as $$
with candidates as (
  select
    p.id,p.display_name,p.date_of_birth,p.gender,p.department,p.academic_year,
    p.identity_type,p.institution_name,p.field_of_study,p.job_title,p.employer_name,
    p.role_description,p.bio,p.ghost_mode,p.created_at,
    ep.verification_status,ep.area_verification_status,ep.profile_photo_path,ep.area_id,
    ea.name area_name,
    (
      case when ep.verification_status='verified' then .35 else 0 end +
      case when ep.area_verification_status='verified' then .25 else 0 end +
      case when p_preferred_department is not null
        and lower(coalesce(p.department,'')) like '%'||lower(trim(p_preferred_department))||'%'
        then .2 else 0 end
    ) boost
  from public.profiles p
  left join public.extrovert_profiles ep on ep.id=p.id
  left join public.extrovert_areas ea on ea.id=ep.area_id
  where p.profile_completed=true
    and p.ghost_mode=false
    and coalesce(p.experience_mode,'both') in ('dating','both')
    and p.id<>auth.uid()
    and p.date_of_birth is not null
    and extract(year from age(current_date,p.date_of_birth))::int
      between greatest(18,coalesce(p_min_age,18)) and least(99,coalesce(p_max_age,99))
    and not(p.id=any(coalesce(p_excluded_ids,'{}')))
    and not exists(select 1 from public.likes l where l.liker_id=auth.uid() and l.liked_id=p.id)
    and not exists(select 1 from public.passes x where x.passer_id=auth.uid() and x.passed_id=p.id)
    and not exists(
      select 1 from public.blocks b
      where (b.blocker_id=auth.uid() and b.blocked_id=p.id)
         or (b.blocker_id=p.id and b.blocked_id=auth.uid())
    )
    and (
      cardinality(coalesce(p_interested_in,'{}'))=0
      or 'everyone'=any(p_interested_in)
      or ('men'=any(p_interested_in) and p.gender in('man','male'))
      or ('women'=any(p_interested_in) and p.gender in('woman','female'))
      or (('nonbinary'=any(p_interested_in) or 'other'=any(p_interested_in))
          and p.gender in('non-binary','nonbinary','other'))
    )
    and (
      p_area_id is null
      or (ep.area_id=p_area_id and ep.area_verification_status='verified')
    )
)
select
  c.id,c.display_name,c.date_of_birth,c.gender,c.department,c.academic_year,
  c.identity_type,c.institution_name,c.field_of_study,c.job_title,c.employer_name,
  c.role_description,c.bio,c.ghost_mode,c.created_at,
  coalesce((select jsonb_agg(jsonb_build_object(
    'storage_path',pp.storage_path,'display_order',pp.display_order,'is_primary',pp.is_primary
  ) order by pp.is_primary desc,pp.display_order asc)
  from public.profile_photos pp where pp.profile_id=c.id),'[]'::jsonb),
  coalesce((select jsonb_agg(jsonb_build_object(
    'interests',jsonb_build_object('id',i.id,'name',i.name)
  )) from public.profile_interests pi
  join public.interests i on i.id=pi.interest_id
  where pi.profile_id=c.id),'[]'::jsonb),
  coalesce(c.verification_status,'not_verified'),
  coalesce(c.area_verification_status,'not_verified'),
  c.area_name,
  c.profile_photo_path,
  exists(
    select 1 from public.subscriptions s
    where s.user_id=c.id and s.plan='pro' and s.status in('active','trialing')
      and (
        (s.status='trialing' and s.trial_ends_at>now())
        or (s.status='active' and s.current_period_end>now())
      )
  )
from candidates c
order by c.boost desc,c.created_at desc
limit greatest(1,least(coalesce(p_limit,20),100));
$$;

revoke all on function public.get_discover_profiles_v3(uuid[],integer,text[],text,integer,integer,uuid) from public;
grant execute on function public.get_discover_profiles_v3(uuid[],integer,text[],text,integer,integer,uuid) to authenticated;
