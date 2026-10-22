-- Tenant-scoped semantic knowledge storage for Gemini gemini-embedding-001
-- vectors (768 dimensions). Apply with `supabase db push` after reviewing.
create extension if not exists vector with schema extensions;

create table if not exists public.knowledge_chunks (
  id text not null,
  organization_id varchar(100) not null
    references public.organizations(id) on delete cascade,
  document_id text not null,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (length(content) between 1 and 12000),
  embedding extensions.vector(768) not null,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  primary key (organization_id, id),
  unique (organization_id, document_id, chunk_index)
);

create index if not exists knowledge_chunks_org_document_idx
  on public.knowledge_chunks (organization_id, document_id, chunk_index);

create index if not exists knowledge_chunks_embedding_hnsw_idx
  on public.knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

alter table public.knowledge_chunks enable row level security;

-- The server uses the service-role client after authenticating and resolving
-- organization_id. End-user roles receive no direct table or RPC access.
revoke all on public.knowledge_chunks from public, anon, authenticated;
grant select, insert, update, delete on public.knowledge_chunks to service_role;

create or replace function public.match_knowledge_chunks(
  query_embedding extensions.vector(768),
  match_count integer,
  filter_organization_id varchar(100),
  filter_metadata jsonb default '{}'::jsonb
)
returns table (
  id text,
  document_id text,
  chunk_index integer,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.chunk_index,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding OPERATOR(extensions.<=>) query_embedding) as similarity
  from public.knowledge_chunks as chunks
  where chunks.organization_id = filter_organization_id
    and chunks.metadata @> coalesce(filter_metadata, '{}'::jsonb)
  order by chunks.embedding OPERATOR(extensions.<=>) query_embedding
  limit least(greatest(coalesce(match_count, 3), 1), 50);
$$;

revoke all on function public.match_knowledge_chunks(
  extensions.vector(768), integer, varchar, jsonb
) from public, anon, authenticated;
grant execute on function public.match_knowledge_chunks(
  extensions.vector(768), integer, varchar, jsonb
) to service_role;

-- Inngest carries job/tenant IDs and a document-ID hash; text stays in Supabase.
create table if not exists public.knowledge_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id varchar(100) not null
    references public.organizations(id) on delete cascade,
  document_id text not null,
  document_content text
    check (document_content is null or length(document_content) between 1 and 2000000),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  chunks_ingested integer not null default 0 check (chunks_ingested >= 0),
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists knowledge_ingestion_jobs_org_created_idx
  on public.knowledge_ingestion_jobs (organization_id, created_at desc);

alter table public.knowledge_ingestion_jobs enable row level security;
revoke all on public.knowledge_ingestion_jobs from public, anon, authenticated;
grant select, insert, update on public.knowledge_ingestion_jobs to service_role;
