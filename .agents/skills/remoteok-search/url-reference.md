# RemoteOK — endpoint reference

Data source for the `remoteok-search` skill.

## Access & terms

- **API:** `https://remoteok.com/api` (public JSON, no auth). Optional `?tags=<tag>`.
- **robots.txt:** `User-agent: *` → `Allow: /`, `Crawl-delay: 1`. Named AI-training/SEO
  crawlers (ClaudeBot, GPTBot, CCBot, Amazonbot, SemrushBot, …) are `Disallow: /`, but a
  user-run tool with a normal browser UA falls under `*`. The homepage `/?tags` AJAX and
  `?action=get_jobs` endpoints are disallowed; the `/api` endpoint is not.
- **API terms:** the feed's first element states you should **link back to the RemoteOK
  job URL (dofollow, no nofollow)** when using the data. The skill carries a personal-use
  note. Keep volume low; no commercial/bulk use.

## Response shape

`GET /api` → JSON array. **Element [0] is a legal/metadata object** (`{ legal, last_updated }`)
— skip it. Remaining elements are jobs:

| Field | Meaning |
|-------|---------|
| `id` | numeric job id (string) — used by `detail` |
| `slug` | url slug |
| `position` | job title |
| `company` | employer |
| `date` | ISO 8601 posting date |
| `location` | free-text region (e.g. "Americas", "Worldwide", "Greater Sydney Area") — every job is remote |
| `salary_min` / `salary_max` | annual USD (0 when unknown) |
| `tags` | array of skill/role tags |
| `url` | canonical RemoteOK job URL |
| `description` | HTML description |

`GET /api?tags=<tag>` returns the same shape filtered to a tag (e.g. `dev`, `golang`).

## CLI behaviour

- **Remote-only:** there is no server keyword/location search, so the CLI fetches the feed
  (~100 latest, or a tag feed) and filters **client-side**: `--query` over title+company
  (tags excluded — too noisy on recruiter posts; use `--tag`), `--location` over the region
  string, `--jobage` and `--sort date` over the ISO date.
- **detail `<id>`:** the API has no single-job endpoint, so `detail` fetches `/api` and
  finds the id (the feed carries each job's full description). Only jobs still in the recent
  feed resolve; older ids return `NOT_FOUND`.

## Quirks

- Skip element [0] (`legal`) — it has no `position`. The parser drops any element lacking
  `position` defensively.
- `location` is a loose region string, not a structured place; `--location` is a substring
  match, best used for coarse regions ("Americas", "Canada", "Worldwide").
- Salaries are annual USD and frequently `0/0` (unknown) → rendered as `null`.
