-- Server-side, short-lived face verification sessions.
-- Raw session tokens are never stored. Sessions are one-time consumable.

create table if not exists public.extrovert_face_verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  challenge text not null check (challenge in (
    'Turn your head slightly left',
    'Turn your head slightly right',
    'Move a little closer'
  )),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists extrovert_face_verification_sessions_user_idx
  on public.extrovert_face_verification_sessions (user_id, expires_at desc);

create index if not exists extrovert_face_verification_sessions_active_idx
  on public.extrovert_face_verification_sessions (token_hash, expires_at)
  where consumed_at is null;

alter table public.extrovert_face_verification_sessions enable row level security;
revoke all on table public.extrovert_face_verification_sessions from anon, authenticated;

comment on table public.extrovert_face_verification_sessions is
  'Short-lived server-side face verification sessions. Raw tokens are never stored; sessions are consumed once.';
