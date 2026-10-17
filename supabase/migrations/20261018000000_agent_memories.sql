create table if not exists public.agent_memories (
  id uuid primary key default gen_random_uuid(),
  organization_id varchar(100) not null
    references public.organizations(id) on delete cascade,
  agent_id text not null
    check (length(agent_id) between 1 and 200),
  scope text not null
    check (scope in ('short_term', 'working', 'agent', 'department', 'company', 'project')),
  content text not null
    check (length(content) between 1 and 10000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(content, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B')
  ) stored
);

create index if not exists agent_memories_org_agent_created_idx
  on public.agent_memories (organization_id, agent_id, created_at desc);

create index if not exists agent_memories_org_scope_created_idx
  on public.agent_memories (organization_id, scope, created_at desc);

create index if not exists agent_memories_search_vector_idx
  on public.agent_memories using gin (search_vector);

create or replace function public.trim_agent_memories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.agent_memories
  where organization_id = new.organization_id
    and agent_id = new.agent_id
    and id not in (
      select id
      from public.agent_memories
      where organization_id = new.organization_id
        and agent_id = new.agent_id
      order by created_at desc, id desc
      offset 50
    );
  return null;
end;
$$;

create trigger agent_memories_retention
after insert on public.agent_memories
for each row execute function public.trim_agent_memories();

alter table public.agent_memories enable row level security;

revoke all on public.agent_memories from anon, authenticated;
grant select, insert, delete on public.agent_memories to service_role;
revoke all on function public.trim_agent_memories() from public, anon, authenticated;
