# talent-search CLI

Search live job listings from **Talent.com Canada** (`ca.talent.com`), a large Canadian
job aggregator. No authentication, no API key, **zero runtime dependencies** — runs with
just `bun`.

## ⚠️ Personal use only

Talent.com's `robots.txt` allows the `/jobs` and `/view` pages this CLI uses (it blocks the
JSON API and `/search-jobs`), but Talent.com's terms restrict automated/bulk access. **Keep
volume low, don't use it commercially or for bulk data collection.** Run at your own risk.

## Setup

```bash
cd .agents/skills/talent-search/cli
bun install    # dev types only
```

## Commands

### Search

```bash
bun run src/cli.ts search [--query "<text>"] [--location "<place>"] [flags]
```

| Flag | Meaning |
|------|---------|
| `--query`, `-q` | Keywords (title, skill, role). Recommended. |
| `--location`, `-l` | Location, e.g. `"Toronto, ON"`, `"Ontario"`, `"Remote"`. Optional. |
| `--jobage <days>` | Posted within N days (client-side filter on each card's date). |
| `--sort`, `-s` | `relevance` (default) or `date` (newest first, client-side). |
| `--page <n>` | 1-indexed page (~19 results/page). |
| `--limit`, `-n <n>` | Cap results emitted (client-side). |
| `--format` | `json` (default), `table`, or `plain`. |

### Detail

```bash
bun run src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric job ID from search results, or a `/view?id=...` URL. Detail is
best-effort (title, company, description) — the aggregator's detail page is client-rendered,
so the richest data is in the search results and on the source site via the posting.

## Examples

```bash
bun run src/cli.ts search -q "software developer" -l "Toronto, ON" --jobage 14 --format table
bun run src/cli.ts search -q "data engineer" -l "Ontario" --sort date --format table
bun run src/cli.ts search -q "backend developer" -l "Remote" --limit 10
bun run src/cli.ts detail 626504717573300915 --format plain
```

## Output shape (JSON)

```json
{
  "meta": { "count": 5, "page": 1 },
  "results": [
    {
      "id": "626504717573300915",
      "title": "Java Software Engineer",
      "company": "Infinity Solutions",
      "location": "ON, Canada",
      "date": "2026-07-02T23:07:17Z",
      "snippet": "Job Title: Java Software Engineer Location: Toronto, Canada Duration…",
      "url": "https://ca.talent.com/view?id=626504717573300915"
    }
  ]
}
```

Errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- `--jobage` and `--sort date` are applied **client-side** (Talent.com's URL has no date
  filter; the per-card ISO timestamp makes this exact).
- Talent.com's markup uses per-build CSS-module class hashes; the parser anchors on stable
  class *prefixes*. If a future site rebuild renames components, see `url-reference.md`.
- `bun run test` runs flag-validation plus a live smoke test (needs network).
