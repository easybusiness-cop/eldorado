create table if not exists public.organization_memberships (
  organization_id varchar(100) not null
    references public.organizations(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  role text not null
    check (role in ('member', 'engineer', 'reviewer', 'operator', 'admin')),
  capabilities text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_memberships enable row level security;

create policy "Members can view their own organization memberships"
on public.organization_memberships
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke insert, update, delete
on public.organization_memberships
from anon, authenticated;
