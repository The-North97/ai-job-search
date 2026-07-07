# Talent.com Canada — endpoint reference

Data source for the `talent-search` skill. Records endpoints and parsing anchors so a
maintainer can fix the CLI when Talent.com changes its markup (it will — see Quirks).

## Access & terms

- **Base:** `https://ca.talent.com`
- **Auth:** none. Public pages, browser User-Agent is enough.
- **robots.txt:** `User-agent: *`, no crawl-delay. **Disallows** `/search-jobs/*` and the
  JSON API (`/services/api-new/search`). **Allows** `/jobs` (search) and `/view` (detail),
  which is what the CLI uses. Even so, Talent.com's terms restrict automated/bulk access,
  so the generated skill carries a personal-use-only warning and keeps volume low.

## Search

`GET /jobs`

| Param | Meaning | Notes |
|-------|---------|-------|
| `k` | keywords (title / skill / role) | CLI `--query` |
| `l` | location free text | Talent.com geo-resolves it (e.g. `Ontario`, `Toronto, ON`, `Remote`). CLI `--location`. Optional. |
| `p` | 1-indexed page | ~19 results/page. Verified: `p=2` returns a disjoint set. |

- **No URL date filter** exists (date filtering lives behind the disallowed API). The CLI
  applies `--jobage` **client-side** using each card's ISO timestamp, and `--sort date`
  is likewise a client-side sort. There is no server relevance/date sort param exposed.

### Result card anchors

Each card is wrapped in a container div and split on its `data-testid`:

```html
<div data-job-id="7249174a6a44" data-new-id="602798226187759430" data-rank="2"
     data-testid="jobcard-container-602798226187759430">
  <article class="JobCard_card__TSiPB">
    <h2 class="JobCard_title__X32Qk">Java Software Engineer</h2>       <!-- TITLE -->
    <address class="JobCard_meta__yPOkr">
      <span class="JobCard_company__NmRol">Infinity Solutions</span>  <!-- COMPANY -->
      <span class="JobCard_location__nmTtw">ON, Canada</span>         <!-- LOCATION -->
    </address>
    <p class="JobCard_snippet__rqX60">…doubly-encoded employer HTML… <a href="/view?id=…">Show more</a></p>
    <time class="JobCard_timeText__wyyGm" dateTime="2026-07-02T23:07:17Z">Last updated: 4 days ago</time>
  </article>
</div>
```

- **Split anchor:** `data-testid="jobcard-container-` → each chunk starts with the job id.
- **Detail id** = the container id (also in `data-new-id` and the `/view?id=<id>` link).
- **Date** = the `<time … dateTime="...">` ISO 8601 value (clean, reliable).

## Detail

`GET /view?id=<id>` (robots-allowed).

The page is client-rendered (Next.js RSC streamed via `self.__next_f`), so there is **no
clean JSON-LD or hydration object** to parse. Best-effort anchors:

| Field | Anchor |
|-------|--------|
| Title + company | `<meta property="og:title" content="<title> – <company> – Job <country>">` (split on ` – `) |
| Description | `class="styles_jobDescriptionColumn__…"` block, svg/button/script stripped, cut before `styles_relatedJobsColumn__` |
| Fallback description | `<meta name="description" content="...">` |

Detail is intentionally lighter than search — the search cards already carry
title/company/location/date/snippet reliably; detail adds the full description.

## Quirks — READ BEFORE EDITING

- **CSS-module class hashes change on every deploy.** Class names look like
  `JobCard_title__X32Qk`; the `__X32Qk` suffix is a per-build hash. The CLI matches only
  the stable prefix (`JobCard_title__`). If Talent.com renames the component (the prefix
  itself), parsing breaks — update the prefixes here and in `helpers.ts`.
- **Snippet is doubly HTML-encoded** employer markup (`&amp;lt;` → `&lt;` → `<`). The CLI
  decodes entities twice, strips tags, and drops the trailing "Show more".
- **Styled-component classes (`sc-xxxxx`) are fully unstable** — never anchor on them.
- The JSON API would be cleaner but is **disallowed by robots.txt**, so we parse HTML.
