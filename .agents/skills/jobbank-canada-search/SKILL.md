---
name: jobbank-canada-search
version: 1.0.0
description: >
  Search live job listings on Job Bank Canada (jobbank.gc.ca), Canada's federal job
  board, for any Canadian province, city, or remote. Use for open positions,
  vacancies, and hiring across any sector or role (software, data, trades, health,
  admin, etc.) anywhere in Canada. Trigger phrases: find a job in Canada, Canadian
  job search, Job Bank, search jobs Ontario/Toronto/Canada, job openings Canada,
  vacancies in <Canadian place>, remote jobs Canada, look up this Job Bank posting.
context: fork
allowed-tools: Bash(bun run skills/jobbank-canada-search/cli/src/cli.ts *)
---

# Job Bank Canada Search Skill

Search live job listings from **Job Bank Canada** (`jobbank.gc.ca`), the Government of
Canada's national job board. No authentication, no API key, and **zero runtime
dependencies** — it runs with just `bun`. Location is passed explicitly, so it works for
any province, city, or remote out of the box.

> Companion to the country-agnostic `linkedin-search`. Job Bank aggregates postings from
> provincial boards and private partners (Jobillico, etc.), so it surfaces roles that may
> not appear on LinkedIn — a good second source for a Canadian job search.

## Access note

Job Bank is a public government service. Its `robots.txt` permits the search and detail
paths (`Crawl-delay: 5`) and no login is required. Still, **keep volume low and polite** —
this is a public service, not a bulk-data API. The CLI uses a browser User-Agent and backs
off on rate-limit responses.

## When to use this skill

- Search job openings anywhere in Canada (province, city, or remote)
- Filter by recency (posted within N days) or sort by newest first
- Get the full description of a specific Job Bank posting

## Commands

### Search job listings

```bash
bun run skills/jobbank-canada-search/cli/src/cli.ts search [--query "<text>"] [--location "<place>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, skill, role). Recommended.
- `--location <text>` / `-l <text>` — a Canadian place, e.g. `"Toronto, ON"`, `"Ontario"`, or `"Remote"`. Optional; omit to search all of Canada.
- `--jobage <days>` — posted within N days (e.g. `1`, `7`, `30`). Omit for all postings.
- `--sort <mode>` / `-s <mode>` — `relevance` (default) or `date` (newest first).
- `--page <n>` — page number (1-indexed, 25 results per page).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run skills/jobbank-canada-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric posting ID from `search` results (e.g. `49828120`). A full
`/jobsearch/jobposting/...` URL also works. Returns title, employer, location, salary,
employment type, posting date, application deadline, and the full description.

## Usage examples

```bash
# Software developer roles in Toronto, last 14 days
bun run skills/jobbank-canada-search/cli/src/cli.ts search -q "software developer" -l "Toronto, ON" --jobage 14 --format table

# Data engineer roles across Ontario, newest first
bun run skills/jobbank-canada-search/cli/src/cli.ts search -q "data engineer" -l "Ontario" --sort date --format table

# Backend roles, fully remote in Canada
bun run skills/jobbank-canada-search/cli/src/cli.ts search -q "backend developer" -l "Remote" --limit 10 --format table

# Nationwide search, no location filter
bun run skills/jobbank-canada-search/cli/src/cli.ts search -q "kubernetes" --sort date

# Full details for a specific posting
bun run skills/jobbank-canada-search/cli/src/cli.ts detail 49828120 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail`, dedup in `/scrape` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

JSON search shape: `{ "meta": { "count", "page", "total" }, "results": [ { "id", "title", "company", "location", "date", "salary", "source", "isNew", "url" } ] }`. All errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- Data is from Job Bank's public HTML search pages (no credentials).
- Page size is fixed at 25 results per page; use `--page` to go deeper.
- `--location` accepts free text (`"Toronto, ON"`, `"Ontario"`, `"Remote"`). `--jobage` maps to Job Bank's posting-age filter in days.
- The `source` field records which board a posting originated from (Job Bank aggregates provincial and partner boards).
- Job Bank rate-limits aggressive access; the CLI retries 429/5xx with exponential backoff. Keep volume low.
- See `url-reference.md` for the endpoint and parsing details if the markup changes.
