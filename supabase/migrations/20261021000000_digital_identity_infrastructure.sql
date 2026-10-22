-- ============================================================================
-- RUFFLO DIGITAL IDENTITY & WORKSPACE INFRASTRUCTURE (RDIWI) MIGRATION
-- Migration: 20261021000000_digital_identity_infrastructure.sql
-- ============================================================================

-- 1. Agent Digital Identities Table
create table if not exists public.agent_digital_identities (
  id uuid primary key default gen_random_uuid(),
  identity_id varchar(150) not null unique,
  organization_id varchar(100) not null,
  agent_id text not null,
  display_name text not null,
  role text not null default 'Autonomous Operational Agent',
  email_address varchar(255) not null,
  email_provider varchar(50) not null default 'google_workspace'
    check (email_provider in ('google_workspace', 'gmail_oauth', 'internal_relay')),
  status varchar(50) not null default 'active'
    check (status in ('active', 'provisioning', 'suspended', 'revoked')),
  workspace_id varchar(150) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_digital_identities_org_agent
  on public.agent_digital_identities (organization_id, agent_id);

create unique index if not exists idx_agent_digital_identities_org_email
  on public.agent_digital_identities (organization_id, email_address);

-- 2. Agent Workspaces Table
create table if not exists public.agent_workspaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id varchar(150) not null unique,
  organization_id varchar(100) not null,
  agent_id text not null,
  workspace_path text not null,
  status varchar(50) not null default 'active'
    check (status in ('active', 'idle', 'closed', 'resetting')),
  storage_driver varchar(50) not null default 'playwright_storage_state',
  cookies_count integer not null default 0,
  is_persistent boolean not null default true,
  last_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_workspaces_org_agent
  on public.agent_workspaces (organization_id, agent_id);

-- 3. Agent Connected Accounts Table
create table if not exists public.agent_connected_accounts (
  id uuid primary key default gen_random_uuid(),
  account_id varchar(150) not null unique,
  organization_id varchar(100) not null,
  agent_id text not null,
  platform varchar(50) not null
    check (platform in ('linkedin', 'instagram', 'youtube', 'canva', 'github', 'x_twitter', 'custom')),
  account_handle varchar(150) not null,
  email_used varchar(255) not null,
  status varchar(50) not null default 'provisioned'
    check (status in ('provisioned', 'pending_verification', 'pending_human_assistance', 'active', 'suspended')),
  requires_human_assistance boolean not null default false,
  assistance_reason text,
  browser_session_id varchar(150),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create index if not exists idx_agent_connected_accounts_org_agent_platform
  on public.agent_connected_accounts (organization_id, agent_id, platform);

-- 4. Agent Browser Sessions Table
create table if not exists public.agent_browser_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key varchar(150) not null unique,
  organization_id varchar(100) not null,
  agent_id text not null,
  current_url text not null default 'about:blank',
  status varchar(50) not null default 'active'
    check (status in ('active', 'idle', 'closed')),
  history_count integer not null default 0,
  cookies_count integer not null default 0,
  cookie_domains text[] not null default '{}',
  user_agent text not null,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create index if not exists idx_agent_browser_sessions_org_agent
  on public.agent_browser_sessions (organization_id, agent_id);

-- 5. Agent Identity Permissions Table
create table if not exists public.agent_identity_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id varchar(100) not null,
  agent_id text not null,
  permission varchar(100) not null,
  granted_by text not null default 'system_orchestrator',
  granted_at timestamptz not null default now()
);

create unique index if not exists idx_agent_identity_permissions_unique
  on public.agent_identity_permissions (organization_id, agent_id, permission);

-- 6. Agent Identity Events Table
create table if not exists public.agent_identity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id varchar(100) not null,
  agent_id text not null,
  action varchar(100) not null,
  details text not null,
  source_ip varchar(45),
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_identity_events_org_agent_time
  on public.agent_identity_events (organization_id, agent_id, created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.agent_digital_identities enable row level security;
alter table public.agent_workspaces enable row level security;
alter table public.agent_connected_accounts enable row level security;
alter table public.agent_browser_sessions enable row level security;
alter table public.agent_identity_permissions enable row level security;
alter table public.agent_identity_events enable row level security;

-- Organization-level Service Role grants
grant select, insert, update, delete on public.agent_digital_identities to service_role;
grant select, insert, update, delete on public.agent_workspaces to service_role;
grant select, insert, update, delete on public.agent_connected_accounts to service_role;
grant select, insert, update, delete on public.agent_browser_sessions to service_role;
grant select, insert, update, delete on public.agent_identity_permissions to service_role;
grant select, insert, update, delete on public.agent_identity_events to service_role;

revoke all on public.agent_digital_identities from anon;
revoke all on public.agent_workspaces from anon;
revoke all on public.agent_connected_accounts from anon;
revoke all on public.agent_browser_sessions from anon;
revoke all on public.agent_identity_permissions from anon;
revoke all on public.agent_identity_events from anon;
