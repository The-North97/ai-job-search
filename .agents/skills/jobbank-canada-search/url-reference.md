# Job Bank Canada — endpoint reference

Data source for the `jobbank-canada-search` skill. Records the endpoints and parsing
anchors so a future maintainer can fix the CLI if Job Bank changes its markup.

## Access & terms

- **Base:** `https://www.jobbank.gc.ca`
- **Auth:** none. Public pages, no API key, no session cookie required (verified: a
  cold request with only a browser User-Agent returns full results).
- **robots.txt:** `User-agent: *` / `Crawl-delay: 5`, **no Disallow** for
  `/jobsearch/*`. Automated access to the search/detail paths is permitted. Keep
  volume low and polite (it is a government public service). The CLI uses a browser
  UA and exponential backoff on 429/5xx.

## Search

`GET /jobsearch/jobsearch`

| Param | Meaning | Notes |
|-------|---------|-------|
| `searchstring` | keyword (title / skill / role) | `+`-encoded; the CLI's `--query` |
| `locationstring` | location free text | e.g. `Toronto, ON`, `Ontario`, `Remote`; the CLI's `--location`. Optional. |
| `sort` | sort order | `M` = best match (default), `D` = date (newest first). CLI `--sort relevance|date`. |
| `fage` | posting age filter, in **days** | e.g. `1` (last 24h), `7`, `30`. CLI `--jobage`. Verified: `fage=1` narrowed 148 → 2 results. |
| `page` | 1-indexed page | **25 results per page.** Verified page 1 and page 2 return disjoint article sets. |
| `fn21` | NOC occupation code | Not used by the CLI (free-text `searchstring` is more flexible). |

**Total count:** `<span class="found" id="results-count">148</span>` → `parseTotalCount`.

### Result card anchors

Results live in `<div id="ajaxupdateform:result_block" class="results-jobs">`. Each is:

```html
<article id="article-49826051" class="action-buttons">
  <a href="/jobsearch/jobposting/49826051;jsessionid=...?source=searchresults" class="resultJobItem">
    <h3 class="title">
      <span class="new">New</span>                         <!-- optional freshness flag -->
      <span class="job-source ..."><span class="wb-inv">Jobillico</span></span>  <!-- origin board -->
      <span class="noctitle">developer, software</span>    <!-- TITLE -->
    </h3>
    <ul class="list-unstyled">
      <li class="date">July 02, 2026</li>                  <!-- DATE -->
      <li class="business">Nord Quantique</li>             <!-- EMPLOYER -->
      <li class="location">... Sherbrooke (QC)</li>        <!-- LOCATION (strip leading "Location") -->
      <li class="salary">... $143,500.00 to $166,500.00 annually</li>  <!-- SALARY (strip leading "Salary") -->
      <li class="source">... Job number: ... 17323127</li> <!-- source board's own job number (not the posting id) -->
    </ul>
  </a>
  ...
</article>
```

- **Posting ID** = the number in `article id="article-<ID>"` and in the `/jobposting/<ID>` href. This is what `detail` consumes. Parser splits on `<article id="article-` and reads each chunk independently.
- The `jsessionid` in hrefs is dropped; the CLI rebuilds a clean `/jobsearch/jobposting/<id>` URL.

## Detail

`GET /jobsearch/jobposting/<id>` (the `jsessionid` path segment is optional and stripped).

The detail page is **schema.org microdata** — parse by `property="..."`:

| Field | Anchor |
|-------|--------|
| Title | `property="title"` |
| Employer | `property="hiringOrganization"` → nested `property="name"` |
| Location | `property="addressLocality"` + `property="addressRegion"` |
| Date posted | `property="datePosted"` (strip leading "Posted on") |
| Salary | `property="baseSalary"` → `property="minValue" content=".."`, `property="maxValue" content=".."`, `property="unitText"` (HOUR/YEAR) |
| Employment type | `property="employmentType"` (may include a nested Full time/Part time span) |
| Deadline | `property="validThrough"` (e.g. `2026-07-23`) |
| Description | `<div class="mrgn-tp-lg" id="jobOverview-N" property="responsibilities|experienceRequirements|skills|jobBenefits">` sibling sections, concatenated |
| Fallback description | `<meta property="og:description" content="...">` |

## Quirks

- The `/jobsearch/feed/jobSearchRSSfeed` Atom feed exists but **ignores free-text
  `term`** — with `term=software+developer` it returns unrelated latest jobs. Real
  keyword filtering there needs the `fn21` NOC code. The HTML search page honors
  free text properly, so the CLI parses HTML, not the feed.
- `locationstring` on the RSS feed is ignored; on the HTML search it works.
- Postings carry two numbers: the **posting ID** (URL, ~8 digits, used by `detail`)
  and a **source job number** (the origin board's ID, in `<li class="source">`). Do
  not confuse them.
