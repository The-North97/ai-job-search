---
name: remoteok-search
version: 1.0.0
description: >
  Search remote job listings on RemoteOK (remoteok.com) via its public JSON API. Use for
  fully-remote positions in software, data, design, marketing, and more — worldwide or by
  region. Trigger phrases: remote jobs, RemoteOK, work-from-home jobs, remote software
  jobs, remote engineer roles, fully remote positions, remote developer jobs.
context: fork
allowed-tools: Bash(bun run skills/remoteok-search/cli/src/cli.ts *)
---

# RemoteOK Search Skill

Search **fully-remote** job listings from **RemoteOK** (`remoteok.com`) via its public JSON
API. No authentication, no API key, and **zero runtime dependencies** — it runs with just
`bun`. Every job is remote, so there is no location requirement (you can still filter by the
job's region, e.g. "Americas" or "Canada").

> A remote-focused companion to `linkedin-search`, `jobbank-canada-search`, and
> `talent-search`. Good for a candidate who prioritizes remote work.

## ⚠️ Personal use only

RemoteOK's `robots.txt` allows general access (Crawl-delay 1) and `/api` is their public
endpoint, but the API terms ask that you **link back to the RemoteOK job URL** when using
the data. Keep volume low; do not use commercially or for bulk collection.

## When to use this skill

- Find fully-remote roles by keyword (title, skill, or role)
- Filter by region (e.g. jobs open to the Americas / Canada / Worldwide) or recency
- Get the full description of a specific RemoteOK posting

## Commands

### Search job listings

```bash
bun run skills/remoteok-search/cli/src/cli.ts search [--query "<text>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keywords, matched against title + company (use `--tag` for RemoteOK's tag taxonomy).
- `--location <text>` / `-l <text>` — filter by the job's region text (e.g. `"Americas"`, `"Canada"`, `"Worldwide"`). Optional.
- `--tag <tag>` / `-t <tag>` — fetch a RemoteOK tag feed (e.g. `dev`, `javascript`, `golang`).
- `--jobage <days>` — posted within N days (client-side).
- `--sort <mode>` / `-s <mode>` — `date` (default, newest first) or `relevance`.
- `--limit <n>` / `-n <n>` — cap results emitted.
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run skills/remoteok-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric RemoteOK id from `search` results (or a job URL). Returns title, company,
region, salary, tags, and the full description. Only jobs still in the recent feed resolve.

## Usage examples

```bash
# Remote backend roles, last 14 days
bun run skills/remoteok-search/cli/src/cli.ts search -q "backend engineer" --jobage 14 --format table

# Remote Python roles open to the Americas
bun run skills/remoteok-search/cli/src/cli.ts search -q "python" -l "Americas" --limit 10 --format table

# Everything under the "golang" tag
bun run skills/remoteok-search/cli/src/cli.ts search -t golang --format table

# Full details for a specific posting
bun run skills/remoteok-search/cli/src/cli.ts detail 1134525 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail`, dedup in `/scrape` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's detail (`detail` command) |

JSON search shape: `{ "meta": { "count" }, "results": [ { "id", "title", "company", "location", "date", "salary", "tags", "url", "description" } ] }`. Errors go to **stderr** as `{ "error": "...", "code": "..." }`, exit code `1`.

## Notes

- Remote-only board: `--query`, `--location`, `--jobage`, and `--sort` are applied client-side over the fetched feed (the API has no server-side search).
- `--query` (title + company) is the precise path and the recommended one. `--tag` uses RemoteOK's own tag taxonomy, which is noisy (postings are often mis-tagged); an over-tagged-spam filter removes the worst recruiter posts but tag feeds still carry off-target results.
- `search` omits the description to stay lean; `detail` includes it.
- Please link back to the RemoteOK job URL when using this data. Keep volume low.
