---
name: talent-search
version: 1.0.0
description: >
  Search live job listings on Talent.com Canada (ca.talent.com), a large Canadian job
  aggregator, for any Canadian city, province, or remote. Use for open positions,
  vacancies, and hiring across any sector or role (software, data, trades, health,
  admin, etc.) in Canada. Trigger phrases: Talent.com, Canadian job aggregator search,
  find jobs Canada, job openings in <Canadian place>, remote jobs Canada, look up this
  Talent.com posting.
context: fork
allowed-tools: Bash(bun run skills/talent-search/cli/src/cli.ts *)
---

# Talent.com Canada Search Skill

Search live job listings from **Talent.com Canada** (`ca.talent.com`), a high-volume
Canadian job aggregator. No authentication, no API key, and **zero runtime dependencies** —
it runs with just `bun`. Location is passed explicitly, so it works for any city, province,
or remote.

> A companion to `linkedin-search` and `jobbank-canada-search`. As an aggregator, Talent.com
> pulls from many employer and partner boards, so it surfaces postings the others miss — a
> useful third source for a Canadian job search.

## ⚠️ Personal use only

Talent.com's `robots.txt` allows the `/jobs` (search) and `/view` (detail) pages this skill
uses — it blocks only the JSON API and `/search-jobs`. Even so, Talent.com's terms restrict
automated and bulk access. **Keep volume low, and do not use this commercially or for bulk
data collection.** Run it on your own responsibility.

## When to use this skill

- Search job openings anywhere in Canada (city, province, or remote)
- Filter by recency (posted within N days) or sort newest-first
- Get the (best-effort) description of a specific Talent.com posting

## Commands

### Search job listings

```bash
bun run skills/talent-search/cli/src/cli.ts search [--query "<text>"] [--location "<place>"] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, skill, role). Recommended.
- `--location <text>` / `-l <text>` — a place, e.g. `"Toronto, ON"`, `"Ontario"`, or `"Remote"`. Optional.
- `--jobage <days>` — posted within N days (applied client-side using each card's timestamp).
- `--sort <mode>` / `-s <mode>` — `relevance` (default) or `date` (newest first, client-side).
- `--page <n>` — page number (1-indexed, ~19 results per page).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run skills/talent-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric job ID from `search` results (e.g. `626504717573300915`), or a
`/view?id=...` URL. Detail returns title, company, and a best-effort description; the
richest structured data (location, date, snippet) is already in the search results.

## Usage examples

```bash
# Software developer roles in Toronto, last 14 days
bun run skills/talent-search/cli/src/cli.ts search -q "software developer" -l "Toronto, ON" --jobage 14 --format table

# Data engineer roles across Ontario, newest first
bun run skills/talent-search/cli/src/cli.ts search -q "data engineer" -l "Ontario" --sort date --format table

# Backend roles, remote
bun run skills/talent-search/cli/src/cli.ts search -q "backend developer" -l "Remote" --limit 10 --format table

# Full details for a specific posting
bun run skills/talent-search/cli/src/cli.ts detail 626504717573300915 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail`, dedup in `/scrape` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's detail (`detail` command) |

JSON search shape: `{ "meta": { "count", "page" }, "results": [ { "id", "title", "company", "location", "date", "snippet", "url" } ] }`. Errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- `--jobage` and `--sort date` are client-side (Talent.com's URL exposes no date filter; the per-card ISO timestamp makes both exact).
- Talent.com's HTML uses per-build CSS-module class hashes; the parser anchors on stable class *prefixes*, so it tolerates hash churn but not a component rename. If results come back empty after a Talent.com redesign, see `url-reference.md`.
- Keep volume low; the CLI backs off on 429/5xx.
