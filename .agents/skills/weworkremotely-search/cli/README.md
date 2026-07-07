# weworkremotely-search CLI

Search remote jobs from **We Work Remotely** (`weworkremotely.com`) via its public RSS
feeds and schema.org job pages. No authentication, no API key, **zero runtime
dependencies** — runs with just `bun`.

## Setup

```bash
cd .agents/skills/weworkremotely-search/cli
bun install    # dev types only
```

## Commands

### Search

```bash
bun run src/cli.ts search [--query "<text>"] [--category <slug>] [flags]
```

| Flag | Meaning |
|------|---------|
| `--query`, `-q` | Keywords (matched against title + company). |
| `--category`, `-c` | Category feed. Default `remote-programming-jobs`. Also `remote-back-end-programming-jobs`, `remote-front-end-programming-jobs`, `remote-full-stack-programming-jobs`, `remote-devops-sysadmin-jobs`, `remote-product-jobs`, `remote-design-jobs`, or `all`. |
| `--location`, `-l` | Filter by the job's region text (e.g. `"Anywhere"`, `"USA Only"`). |
| `--jobage <days>` | Posted within N days (client-side). |
| `--sort`, `-s` | `date` (default, newest first) or `relevance` (feed order). |
| `--limit`, `-n <n>` | Cap results emitted. |
| `--format` | `json` (default), `table`, or `plain`. |

### Detail

```bash
bun run src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the job slug from search results, or a full `/remote-jobs/...` URL. Detail reads the
full description from the **RSS feed** (the HTML job pages sit behind Cloudflare and 403
under load); the job page's JSON-LD (salary, employment type) is only a fallback.

## Examples

```bash
bun run src/cli.ts search -q "backend" --jobage 14 --format table
bun run src/cli.ts search -c remote-full-stack-programming-jobs --format table
bun run src/cli.ts search -q "engineer" -l "Anywhere" --limit 10
bun run src/cli.ts detail https://weworkremotely.com/remote-jobs/acme-senior-engineer --format plain
```

## Output shape (JSON)

```json
{
  "meta": { "count": 5, "category": "remote-programming-jobs" },
  "results": [
    {
      "id": "acme-senior-backend-engineer",
      "title": "Senior Backend Engineer",
      "company": "Acme",
      "location": "Anywhere in the World",
      "category": "Back-End Programming",
      "date": "2026-07-06T20:07:47.000Z",
      "url": "https://weworkremotely.com/remote-jobs/acme-senior-backend-engineer"
    }
  ]
}
```

Errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- WWR has no keyword-search feed, so the CLI fetches a category feed (~25 recent items)
  and filters `--query`, `--location`, `--jobage`, `--sort` client-side. Use `--category`
  (or `all`) for breadth.
- `search` comes from the RSS feed; `detail` fetches the job page's JSON-LD for the full
  description and structured fields.
- `bun run test` runs flag-validation plus a live smoke test (needs network).
