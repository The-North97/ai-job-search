---
name: weworkremotely-search
version: 1.0.0
description: >
  Search remote job listings on We Work Remotely (weworkremotely.com) via its public RSS
  feeds. Use for fully-remote roles in software (back-end, front-end, full-stack, devops),
  product, design, and more. Trigger phrases: We Work Remotely, WWR, remote programming
  jobs, remote software jobs, fully remote developer roles, remote engineering jobs,
  work-from-home tech jobs.
context: fork
allowed-tools: Bash(bun run skills/weworkremotely-search/cli/src/cli.ts *)
---

# We Work Remotely Search Skill

Search **fully-remote** job listings from **We Work Remotely** (`weworkremotely.com`) via
its public RSS feeds, with schema.org JSON-LD for full detail. No authentication, no API
key, and **zero runtime dependencies** — it runs with just `bun`. Every job is remote.

> A remote-focused companion to `remoteok-search`, `linkedin-search`, `jobbank-canada-search`,
> and `talent-search`. WWR skews toward curated software/engineering roles.

## When to use this skill

- Find fully-remote software roles by keyword and category (back-end, full-stack, devops, …)
- Filter by region (e.g. "Anywhere in the World", "USA Only") or recency
- Get the full description of a specific WWR posting

## Commands

### Search job listings

```bash
bun run skills/weworkremotely-search/cli/src/cli.ts search [--query "<text>"] [--category <slug>] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keywords, matched against title + company.
- `--category <slug>` / `-c <slug>` — category feed (default `remote-programming-jobs`). Others: `remote-back-end-programming-jobs`, `remote-front-end-programming-jobs`, `remote-full-stack-programming-jobs`, `remote-devops-sysadmin-jobs`, `remote-product-jobs`, `remote-design-jobs`, or `all`.
- `--location <text>` / `-l <text>` — filter by the job's region text (e.g. `"Anywhere"`, `"USA Only"`).
- `--jobage <days>` — posted within N days (client-side).
- `--sort <mode>` / `-s <mode>` — `date` (default, newest first) or `relevance`.
- `--limit <n>` / `-n <n>` — cap results emitted.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run skills/weworkremotely-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the job slug from `search` results, or a full `/remote-jobs/...` URL. Detail reads
the full description from the **RSS feed** (reliable — the HTML job pages are Cloudflare-
protected and 403 under load). Salary and employment type come from the job page's JSON-LD
only as a fallback when it is reachable.

## Usage examples

```bash
# Remote backend roles, last 14 days
bun run skills/weworkremotely-search/cli/src/cli.ts search -q "backend" --jobage 14 --format table

# All full-stack roles
bun run skills/weworkremotely-search/cli/src/cli.ts search -c remote-full-stack-programming-jobs --format table

# Engineer roles open to anyone, worldwide
bun run skills/weworkremotely-search/cli/src/cli.ts search -q "engineer" -l "Anywhere" --limit 10 --format table

# Full details for a specific posting
bun run skills/weworkremotely-search/cli/src/cli.ts detail https://weworkremotely.com/remote-jobs/acme-senior-engineer --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing URLs/ids to `detail`, dedup in `/scrape` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's detail (`detail` command) |

JSON search shape: `{ "meta": { "count", "category" }, "results": [ { "id", "title", "company", "location", "category", "date", "url" } ] }`. Errors go to **stderr** as `{ "error": "...", "code": "..." }`, exit code `1`.

## Notes

- WWR has no keyword-search feed: the CLI fetches a **category** feed (~25 recent items) and filters `--query`, `--location`, `--jobage`, `--sort` client-side. Use `--category` (or `all`) for breadth.
- `search` reads the RSS feed; `detail` fetches the job page's JSON-LD for the full description and structured fields.
- Keep volume low; the CLI backs off on 429/5xx.
