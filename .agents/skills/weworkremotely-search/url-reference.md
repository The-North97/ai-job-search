# We Work Remotely — endpoint reference

Data source for the `weworkremotely-search` skill.

## Access & terms

- **Base:** `https://weworkremotely.com`
- **Auth:** none.
- **robots.txt:** `User-agent: *` → `Allow: /`; only `/admin/`, `/account/`,
  `/manage-company/`, and token edit/cancel paths are disallowed. The RSS feeds and
  `/remote-jobs/*` pages are allowed and RSS is meant for syndication. Keep volume low.

## Search — RSS feeds

`GET /categories/<slug>.rss` (per category) or `GET /remote-jobs.rss` (combined).

Common slugs: `remote-programming-jobs` (default), `remote-back-end-programming-jobs`,
`remote-front-end-programming-jobs`, `remote-full-stack-programming-jobs`,
`remote-devops-sysadmin-jobs`, `remote-product-jobs`, `remote-design-jobs`. The CLI's
`--category all` maps to `/remote-jobs.rss`.

Each `<item>` carries:

| Element | Meaning |
|---------|---------|
| `<title>` | `"Company: Position"` — split on the first `": "` |
| `<region>` | remote region, e.g. "Anywhere in the World", "USA Only" → `location` |
| `<category>` | WWR category name |
| `<pubDate>` | RFC-822 date → normalized to ISO 8601 |
| `<link>` / `<guid>` | job page URL; the slug (last path segment) is the `id` |
| `<description>` | doubly-encoded HTML (used as a fallback preview) |

There is **no keyword-search RSS**, so the CLI fetches a category feed and filters
`--query` (title+company), `--location` (region), `--jobage`, and `--sort` **client-side**.

## Detail

**Primary source is the RSS feed, not the HTML page.** WWR's `/remote-jobs/<slug>` HTML
pages sit behind Cloudflare bot protection that returns **403 under load** (the RSS feeds
do not). The RSS `<description>` already carries the full job posting HTML, so `detail`
finds the item by slug in the combined feed (then the category feed) and renders its
description. Salary / employment type / deadline are not in RSS, so they are `null` on this
path.

### Fallback — JSON-LD (job page)

For jobs no longer in the feeds, `detail` falls back to `GET /remote-jobs/<slug>` and parses
the schema.org **JSON-LD `JobPosting`** block (when not rate-limited). Fields used:

| Field | JSON-LD path |
|-------|--------------|
| Title | `title` |
| Company | `hiringOrganization.name` |
| Location | `hiringOrganization.address` |
| Employment type | `employmentType` |
| Posted / deadline | `datePosted` / `validThrough` |
| Salary | `baseSalary.value.minValue` / `maxValue`, `baseSalary.currency` |
| Description | `description` (doubly-encoded HTML → decoded to text) |

Fallback description: `<meta name="description">`.

## Quirks

- Titles are `"Company: Position"`; a company name containing `": "` (rare) would
  mis-split — the split takes the first occurrence.
- `<description>` in both the RSS and the JSON-LD is **doubly HTML-encoded**
  (`&lt;div&gt;`); decode entities, convert block tags to newlines, strip, decode again.
- `baseSalary` is frequently `0/0` (unknown) → rendered `null`.
- Category feeds hold ~25 recent items; use `--category all` or another category for breadth.
- **HTML job pages 403 under load (Cloudflare).** That is why `detail` reads from RSS first;
  the JSON-LD page is only a fallback and may itself be blocked. If detail needs salary /
  employment type and the page is blocked, retry later or lower request volume.
