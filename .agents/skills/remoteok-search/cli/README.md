# remoteok-search CLI

Search remote jobs from **RemoteOK** via its public JSON API (`remoteok.com/api`). No
authentication, no API key, **zero runtime dependencies** — runs with just `bun`.

## ⚠️ Personal use only

RemoteOK's `robots.txt` allows `*` (Crawl-delay 1) and `/api` is their documented public
endpoint, but the API terms ask that you **link back to the RemoteOK job URL** (dofollow)
when you use the data. Keep volume low; don't use commercially or for bulk collection.

## Setup

```bash
cd .agents/skills/remoteok-search/cli
bun install    # dev types only
```

## Commands

### Search

```bash
bun run src/cli.ts search [--query "<text>"] [flags]
```

| Flag | Meaning |
|------|---------|
| `--query`, `-q` | Keywords (matched against title + company; use `--tag` for RemoteOK tags). |
| `--location`, `-l` | Filter by the job's region text (e.g. `"Americas"`, `"Canada"`, `"Worldwide"`). All jobs are remote. |
| `--tag`, `-t` | Fetch a RemoteOK tag feed (e.g. `dev`, `javascript`, `golang`). |
| `--jobage <days>` | Posted within N days (client-side). |
| `--sort`, `-s` | `date` (default, newest first) or `relevance` (feed order). |
| `--limit`, `-n <n>` | Cap results emitted. |
| `--format` | `json` (default), `table`, or `plain`. |

### Detail

```bash
bun run src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric RemoteOK id from search results (or a job URL). `detail` resolves ids
still in the recent feed; older ids return `NOT_FOUND`.

## Examples

```bash
bun run src/cli.ts search -q "backend engineer" --jobage 14 --format table
bun run src/cli.ts search -q "python" -l "Americas" --limit 10 --format table
bun run src/cli.ts search -t golang --format table
bun run src/cli.ts detail 1134525 --format plain
```

## Output shape (JSON)

```json
{
  "meta": { "count": 5 },
  "results": [
    {
      "id": "1134525",
      "title": "Senior Backend Engineer",
      "company": "Acme",
      "location": "Americas",
      "date": "2026-07-06T00:00:31+00:00",
      "salary": "$120,000 - $160,000",
      "tags": ["backend", "golang", "postgres"],
      "url": "https://remoteok.com/remote-jobs/...",
      "description": null
    }
  ]
}
```

Errors go to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- Remote-only board; `--query`, `--location`, `--jobage`, `--sort` are all applied
  client-side over the fetched feed (the API has no server-side search).
- `search` omits the description (kept lean); `detail` includes the full description.
- `--query` (title + company) is precise; `--tag` uses RemoteOK's noisy tag taxonomy. An over-tagged-spam filter (>20 tags) drops recruiter talent-pool posts, but tag feeds still carry off-target results — prefer `--query`.
- `bun run test` runs flag-validation plus a live smoke test (needs network).
