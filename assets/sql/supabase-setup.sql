create extension if not exists pgcrypto;

create table if not exists public.community_join_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  full_name text not null,
  email text not null,
  community_path text,
  intention text,
  status text not null default 'pending' check (status in ('pending', 'returned', 'approved', 'rejected')),
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  source_request_id uuid unique references public.community_join_requests(id) on delete set null,
  auth_user_id uuid,
  full_name text not null,
  email text not null unique,
  community_path text,
  intention text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  joined_at timestamptz not null default now()
);

create unique index if not exists community_join_requests_email_lower_uidx
  on public.community_join_requests (lower(email));

create unique index if not exists community_members_email_lower_uidx
  on public.community_members (lower(email));

alter table public.community_join_requests enable row level security;
alter table public.community_members enable row level security;

-- Public users can insert only their own verified request after auth confirmation.
drop policy if exists "join requests insert authenticated" on public.community_join_requests;
create policy "join requests insert authenticated"
on public.community_join_requests
for insert
to authenticated
with check (
  email_verified = true
  and auth_user_id = auth.uid()
);

-- Public users can see only their own request.
drop policy if exists "join requests select own" on public.community_join_requests;
create policy "join requests select own"
on public.community_join_requests
for select
to authenticated
using (auth_user_id = auth.uid());

-- Members can see only their own final record.
drop policy if exists "members select own" on public.community_members;
create policy "members select own"
on public.community_members
for select
to authenticated
using (auth_user_id = auth.uid());

-- Admin operations should be done with the service role key in a protected admin environment.
