# Compute Cost and Unit Economics Review

**Task:** `tsk-1788683759940` — Financial Ledger & Compute Unit Economics  
**Owner:** Kevin Malone, Finance  
**Prepared:** 2026-10-21  
**Status:** Completed as a review of recorded workspace KPIs; source billing reconciliation remains unavailable.

## Data source and limits

The only cost ledger available in this workspace is the saved `employees[].kpis` snapshot in [`company_db.json`](../../company_db.json). It has no reporting-period dates, provider/model split, input/output token split, cache usage, invoice IDs, cloud resource hours, or billing export. Treat these values as stored KPI estimates, not audited cash spend or a verified monthly figure. Fifteen employee records have non-zero token or cost values; the remaining roster has no recorded usage in this snapshot.

## Recorded KPI baseline

| Measure | Result | Calculation |
|---|---:|---|
| Agents with non-zero recorded usage | 15 | Saved employee KPI rows |
| Tokens processed | 4,135,961 | Sum of `kpis.tokensProcessed` |
| Recorded compute cost | $187.25 | Sum of `kpis.totalCost` |
| Completed tasks in KPI rows | 1,061 | Sum of `kpis.tasksCompleted`; cross-agent task counts may overlap |
| Cost per recorded million tokens | $45.27 | $187.2522 / 4.135961 million tokens |
| Recorded cost per KPI task | $0.1765 | $187.2522 / 1,061; descriptive only |

### Cost by department in the saved snapshot

| Department | Tokens | Recorded cost | KPI tasks |
|---|---:|---:|---:|
| Engineering | 1,713,788 | $79.20 | 298 |
| Research | 640,000 | $28.70 | 142 |
| Security | 449,800 | $21.00 | 152 |
| Reliability | 424,000 | $17.10 | 177 |
| Executive | 259,970 | $12.45 | 58 |
| Growth | 195,000 | $9.30 | 40 |
| Marketing | 180,000 | $8.50 | 62 |
| Operations | 153,403 | $6.20 | 77 |
| Finance | 120,000 | $4.80 | 55 |

Department totals reconcile to the 15 non-zero rows, subject to rounding.

## Current execution availability

The configured model router was checked without making a generation request: neither the local Ollama provider nor Gemini was available. The failed task records also show Gemini unavailable at execution time. Consequently, this review does not infer current provider spend from task failures, and no current model cost can be reconciled to a live invoice.

## Financial conclusion

The saved ledger is sufficient for a provisional internal KPI baseline, but not for monthly cloud run-rate, gross margin, cash runway, or customer-level unit economics. Its missing reporting window means the $187.25 cannot safely be compared with MRR as a monthly percentage. Do not use this snapshot for a budget commitment or investor/financial statement.

## Ledger fields needed for an auditable next period

Capture one immutable usage row per request with:

- `started_at`, `period_start`, and `period_end` in UTC.
- `provider`, `model`, `agent_id`, `task_id`, and request/trace ID.
- Input, output, cached, and reasoning token counts where supplied by the provider.
- Tool, search, storage, and compute charges as separate line items.
- Currency, amount, pricing source/version, and billing-export or invoice reference.
- Status and retry count, so failed/retried requests are not double-counted.

Reconcile monthly totals to provider invoices before computing cost per task, gross margin, or runway. Preserve the current KPI data as historical estimates rather than replacing it with a fabricated billing total.

For Gemini, model and tier prices change; use the provider’s current table at reconciliation time: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).
