# Database Indexing Diagnostic Commands

These commands are generated for the blocked task `test-exec-1788683879367`. They inspect the actual project schema and workload before any index is proposed. They are read-only and do not create or alter indexes.

## Supabase CLI

The repository's Supabase CLI version is 2.121.0. Its `db query` help confirms `--linked` and `--file` are supported. From the repository root, run:

```powershell
npx supabase db query --linked --file docs/task-remediation/database-indexing-commands.sql --output-format json
```

This requires an authenticated Supabase CLI profile with access to the linked project and its database. The project must be confirmed as the intended non-production environment before running any plan with `ANALYZE`.

The command was attempted from this workspace. The CLI returned `AccessTokenRequiredError` before executing the SQL because no Supabase CLI access token is configured; therefore, no remote query ran. Authenticate the CLI with a project-scoped Supabase access token using `npx supabase login`, then rerun the diagnostic command above.

Alternatively, sign in to the linked project's Supabase Dashboard, open SQL Editor, and run [database-indexing-commands.sql](./database-indexing-commands.sql). The shared dashboard page currently redirects to sign-in, so no remote query has been executed from this session.

## After diagnostics

1. Confirm the real table and its column definitions.
2. Capture representative parameterized queries and an `EXPLAIN (ANALYZE, BUFFERS)` baseline in non-production.
3. Use the actual filter, join, and sort columns to select a candidate index; check for an existing equivalent index.
4. Compare the plan and write overhead after the candidate index.
5. Only then update the blocked task with measured evidence.

Supabase recommends using execution plans to validate candidate indexes and notes that indexes trade write cost for read performance: [Query Optimization](https://supabase.com/docs/guides/database/query-optimization), [Managing Indexes](https://supabase.com/docs/guides/database/postgres/indexes).
