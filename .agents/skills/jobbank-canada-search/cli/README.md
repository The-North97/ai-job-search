# jobbank-canada-search CLI

Search live job listings from **Job Bank Canada** (`jobbank.gc.ca`), Canada's federal
job board. No authentication, no API key, **zero runtime dependencies** — runs with just
`bun`.

## Setup

```bash
cd .agents/skills/jobbank-canada-search/cli
bun install    # dev types only (typescript, @types/bun)
```

## Commands

### Search

```bash
bun run src/cli.ts search [--query "<text>"] [--location "<place>"] [flags]
```

| Flag | Meaning |
|------|---------|
| `--query`, `-q` | Keywords (title, skill, role). Recommended. |
| `--location`, `-l` | Location, e.g. `"Toronto, ON"`, `"Ontario"`, `"Remote"`. Optional (defaults to all Canada). |
| `--jobage <days>` | Posted within N days (`1`, `7`, `30`, …). |
| `--sort`, `-s` | `relevance` (default) or `date` (newest first). |
| `--page <n>` | 1-indexed page (25 results/page). |
| `--limit`, `-n <n>` | Cap results emitted (client-side). |
| `--format` | `json` (default), `table`, or `plain`. |

### Detail

```bash
bun run src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric posting ID from search results (e.g. `49828120`). A full
`/jobsearch/jobposting/...` URL also works.

## Examples

```bash
bun run src/cli.ts search -q "software developer" -l "Toronto, ON" --jobage 14 --format table
bun run src/cli.ts search -q "data engineer" -l "Ontario" --sort date --format table
bun run src/cli.ts search -q "software developer" -l "Remote" --limit 10
bun run src/cli.ts detail 49828120 --format plain
```

## Output shape (JSON)

```json
{
  "meta": { "count": 5, "page": 1, "total": 148 },
  "results": [
    {
      "id": "49828120",
      "title": "software developer",
      "company": "TechDoQuest Inc",
      "location": "Mississauga (ON)",
      "date": "July 02, 2026",
      "salary": "$53.00 hourly",
      "source": "Jobillico",
      "isNew": true,
      "url": "https://www.jobbank.gc.ca/jobsearch/jobposting/49828120"
    }
  ]
}
```

Errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- Data is from Job Bank's public HTML pages (robots.txt allows it, `Crawl-delay: 5`).
  Keep volume low — it's a government public service, not a bulk-data API.
- Page size is fixed at 25 results per page.
- Job Bank aggregates postings from provincial boards and private partners
  (Jobillico, etc.); the `source` field records the origin board.
- `bun run test` runs flag-validation plus a live smoke test (needs network).
