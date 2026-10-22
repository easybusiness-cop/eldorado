-- Read-only diagnostics for the blocked student-record indexing task.
-- Run against the intended non-production Supabase project after confirming
-- the project and environment. This script does not create or alter indexes.

-- 1. Find student-related tables in application schemas and report row estimates.
select
  schemaname as schema_name,
  relname as table_name,
  n_live_tup as estimated_live_rows,
  seq_scan as sequential_scans,
  idx_scan as index_scans
from pg_stat_user_tables
where relname ilike '%student%'
order by schemaname, relname;

-- 2. Inspect columns for any matching table before writing a representative query.
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema not in ('pg_catalog', 'information_schema', 'auth', 'storage')
  and table_name ilike '%student%'
order by table_schema, table_name, ordinal_position;

-- 3. Inspect existing indexes; do not add duplicates.
select
  schemaname as schema_name,
  tablename as table_name,
  indexname as index_name,
  indexdef as index_definition
from pg_indexes
where schemaname not in ('pg_catalog', 'information_schema')
  and tablename ilike '%student%'
order by schemaname, tablename, indexname;

-- 4. Check whether normalized query statistics are available.
select exists (
  select 1 from pg_extension where extname = 'pg_stat_statements'
) as pg_stat_statements_enabled;

-- If the previous result is true, run this separately to find expensive
-- student-related statements. Query text can contain sensitive literals;
-- redact it before sharing results outside the authorized project.
-- select query, calls, total_exec_time, mean_exec_time, rows
-- from pg_stat_statements
-- where query ilike '%student%'
-- order by total_exec_time desc
-- limit 20;

-- After identifying the real table and representative SELECT, capture its
-- baseline plan in the non-production project using:
-- explain (analyze, buffers) <the_actual_read_only_student_select>;
-- Do not run ANALYZE against a write statement or a production workload.
