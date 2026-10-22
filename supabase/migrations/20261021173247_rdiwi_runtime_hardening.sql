-- RDIWI runtime hardening. Secrets are ciphertext-only envelopes written by
-- the server using Cloud KMS. OAuth state is hashed and single-use.

alter table public.agent_digital_identities
  alter column email_address drop not null,
  alter column email_provider drop not null,
  alter column email_provider drop default,
  alter column status set default 'provisioning';

create unique index if not exists agent_digital_identities_org_agent_uidx
  on public.agent_digital_identities (organization_id, agent_id);

alter table public.agent_workspaces
  add column if not exists storage_key text,
  add column if not exists persistence_status text not null default 'pending'
    check (persistence_status in ('pending', 'encrypted', 'unavailable'));

alter table public.agent_connected_accounts
  alter column email_used drop not null,
  add column if not exists authorization_status text not null default 'requested'
    check (authorization_status in ('requested', 'approved', 'denied', 'revoked')),
  add column if not exists requested_by uuid,
  add column if not exists approved_by uuid,
  add column if not exists scopes text[] not null default '{}',
  add column if not exists credential_ref uuid,
  add column if not exists connected_confirmed_by uuid,
  add column if not exists connected_confirmed_at timestamptz;

alter table public.agent_connected_accounts
  drop constraint if exists agent_connected_accounts_platform_check;
alter table public.agent_connected_accounts
  add constraint agent_connected_accounts_platform_check
  check (platform in ('linkedin', 'instagram', 'youtube', 'canva', 'github', 'x_twitter', 'custom', 'google_workspace'));

alter table public.agent_connected_accounts
  drop constraint if exists agent_connected_accounts_status_check;
alter table public.agent_connected_accounts
  add constraint agent_connected_accounts_status_check
  check (status in ('requested', 'denied', 'provisioned', 'pending_verification', 'pending_human_assistance', 'active', 'suspended', 'revoked'));

-- Legacy rows were created before provider authorization was tracked. Require
-- those claims to be re-authorized instead of treating them as live accounts.
update public.agent_connected_accounts
set status = 'revoked', authorization_status = 'revoked',
    requires_human_assistance = false,
    assistance_reason = 'Legacy account record requires fresh provider authorization.'
where authorization_status = 'requested'
  and status in ('provisioned', 'pending_verification', 'pending_human_assistance', 'active', 'suspended');

create table if not exists public.agent_identity_capability_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id varchar(100) not null,
  agent_id text not null,
  capability varchar(150) not null,
  reason text not null check (char_length(reason) between 1 and 2000),
  status varchar(20) not null default 'pending' check (status in ('pending', 'approved', 'denied', 'revoked')),
  requested_by text not null,
  decided_by uuid,
  decision_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint capability_request_identity_fk foreign key (organization_id, agent_id)
    references public.agent_digital_identities (organization_id, agent_id) on delete cascade
);
create unique index if not exists agent_capability_requests_pending_uidx
  on public.agent_identity_capability_requests (organization_id, agent_id, capability)
  where status = 'pending';
create index if not exists agent_capability_requests_org_status_idx
  on public.agent_identity_capability_requests (organization_id, status, created_at desc);

-- This table stores only KMS-wrapped data-encryption keys and authenticated
-- ciphertext. It is inaccessible to end-user roles, even with RLS enabled.
create table if not exists public.agent_secret_envelopes (
  id uuid primary key default gen_random_uuid(),
  organization_id varchar(100) not null,
  agent_id text not null,
  purpose varchar(100) not null,
  kms_key_name text not null,
  wrapped_dek bytea not null,
  ciphertext bytea not null,
  nonce bytea not null,
  auth_tag bytea not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_secret_identity_fk foreign key (organization_id, agent_id)
    references public.agent_digital_identities (organization_id, agent_id) on delete cascade,
  constraint agent_secret_identity_purpose_unique unique (organization_id, agent_id, purpose)
);

alter table public.agent_connected_accounts
  add constraint agent_connected_accounts_credential_ref_fk
  foreign key (credential_ref) references public.agent_secret_envelopes (id) on delete set null not valid;

create table if not exists public.agent_google_oauth_states (
  state_hash bytea primary key,
  organization_id varchar(100) not null,
  agent_id text not null,
  requested_scopes text[] not null,
  requested_by uuid not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint agent_google_oauth_identity_fk foreign key (organization_id, agent_id)
    references public.agent_digital_identities (organization_id, agent_id) on delete cascade
);
create index if not exists agent_google_oauth_states_expiry_idx
  on public.agent_google_oauth_states (expires_at);

create unique index if not exists agent_connected_accounts_org_agent_platform_handle_uidx
  on public.agent_connected_accounts (organization_id, agent_id, platform, account_handle);

-- Foreign keys keep workspace, connected account, browser session, permission,
-- and audit rows within the owning organization/agent identity.
alter table public.agent_workspaces
  add constraint agent_workspaces_identity_fk foreign key (organization_id, agent_id)
  references public.agent_digital_identities (organization_id, agent_id) on delete cascade not valid;
alter table public.agent_connected_accounts
  add constraint agent_connected_accounts_identity_fk foreign key (organization_id, agent_id)
  references public.agent_digital_identities (organization_id, agent_id) on delete cascade not valid;
alter table public.agent_browser_sessions
  add constraint agent_browser_sessions_identity_fk foreign key (organization_id, agent_id)
  references public.agent_digital_identities (organization_id, agent_id) on delete cascade not valid;
alter table public.agent_identity_permissions
  add constraint agent_identity_permissions_identity_fk foreign key (organization_id, agent_id)
  references public.agent_digital_identities (organization_id, agent_id) on delete cascade not valid;
alter table public.agent_identity_events
  add constraint agent_identity_events_identity_fk foreign key (organization_id, agent_id)
  references public.agent_digital_identities (organization_id, agent_id) on delete cascade not valid;

alter table public.agent_digital_identities enable row level security;
alter table public.agent_workspaces enable row level security;
alter table public.agent_connected_accounts enable row level security;
alter table public.agent_browser_sessions enable row level security;
alter table public.agent_identity_permissions enable row level security;
alter table public.agent_identity_events enable row level security;
alter table public.agent_identity_capability_requests enable row level security;
alter table public.agent_secret_envelopes enable row level security;
alter table public.agent_google_oauth_states enable row level security;

-- Remove default PUBLIC/anon/authenticated access before granting the narrow
-- browser-facing read/request operations. Server-side code uses service_role.
revoke all on public.agent_digital_identities from public, anon, authenticated;
revoke all on public.agent_workspaces from public, anon, authenticated;
revoke all on public.agent_connected_accounts from public, anon, authenticated;
revoke all on public.agent_browser_sessions from public, anon, authenticated;
revoke all on public.agent_identity_permissions from public, anon, authenticated;
revoke all on public.agent_identity_events from public, anon, authenticated;
revoke all on public.agent_identity_capability_requests from public, anon, authenticated;
revoke all on public.agent_secret_envelopes from public, anon, authenticated;
revoke all on public.agent_google_oauth_states from public, anon, authenticated;

grant select, insert, update, delete on public.agent_digital_identities to service_role;
grant select, insert, update, delete on public.agent_workspaces to service_role;
grant select, insert, update, delete on public.agent_connected_accounts to service_role;
grant select, insert, update, delete on public.agent_browser_sessions to service_role;
grant select, insert, update, delete on public.agent_identity_permissions to service_role;
grant select, insert, update, delete on public.agent_identity_events to service_role;
grant select, insert, update, delete on public.agent_identity_capability_requests to service_role;
grant select, insert, update, delete on public.agent_secret_envelopes to service_role;
grant select, insert, update, delete on public.agent_google_oauth_states to service_role;

grant select on public.agent_digital_identities, public.agent_workspaces,
  public.agent_connected_accounts, public.agent_browser_sessions,
  public.agent_identity_permissions, public.agent_identity_events,
  public.agent_identity_capability_requests to authenticated;
grant insert on public.agent_identity_capability_requests to authenticated;
grant update (status, decided_by, decision_reason, decided_at)
  on public.agent_identity_capability_requests to authenticated;

create policy rdiwi_identity_select on public.agent_digital_identities
  for select to authenticated using (
    exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_digital_identities.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['identity:read', 'identity:manage', 'system:admin']))
  );
create policy rdiwi_workspace_select on public.agent_workspaces
  for select to authenticated using (
    exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_workspaces.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['identity:read', 'identity:manage', 'system:admin']))
  );
create policy rdiwi_accounts_select on public.agent_connected_accounts
  for select to authenticated using (
    exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_connected_accounts.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['identity:read', 'identity:manage', 'system:admin']))
  );
create policy rdiwi_browser_sessions_select on public.agent_browser_sessions
  for select to authenticated using (
    exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_browser_sessions.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['identity:read', 'identity:manage', 'system:admin']))
  );
create policy rdiwi_permissions_select on public.agent_identity_permissions
  for select to authenticated using (
    exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_identity_permissions.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['identity:read', 'identity:manage', 'system:admin']))
  );
create policy rdiwi_events_select on public.agent_identity_events
  for select to authenticated using (
    exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_identity_events.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['identity:read', 'identity:manage', 'system:admin']))
  );
create policy rdiwi_capability_requests_select on public.agent_identity_capability_requests
  for select to authenticated using (
    exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_identity_capability_requests.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['identity:read', 'identity:manage', 'system:admin']))
  );
create policy rdiwi_capability_requests_insert on public.agent_identity_capability_requests
  for insert to authenticated with check (
    status = 'pending' and requested_by = (select auth.uid())::text
    and exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_identity_capability_requests.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['task:run', 'identity:manage', 'system:admin']))
  );
create policy rdiwi_capability_requests_decide on public.agent_identity_capability_requests
  for update to authenticated using (
    exists (select 1 from public.organization_memberships m
      where m.organization_id = agent_identity_capability_requests.organization_id
        and m.user_id = (select auth.uid()) and m.is_active
        and (m.role in ('owner', 'admin') or coalesce(m.capabilities, '{}') && array['identity:manage', 'system:admin']))
  ) with check (
    decided_by = (select auth.uid()) and status in ('approved', 'denied', 'revoked')
  );
