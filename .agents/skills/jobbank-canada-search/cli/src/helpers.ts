// Data source: Job Bank Canada (jobbank.gc.ca) public job search. No authentication.
// - Search: /jobsearch/jobsearch returns an HTML list of <article> job cards.
// - Detail: /jobsearch/jobposting/<id> returns one posting as schema.org microdata.
// Both are parsed with regex: the search cards are shallow and stable, and the
// detail page exposes clean `property="..."` microdata attributes, so a full DOM
// parser is unnecessary (keeps this skill zero-dependency like linkedin-search).
//
// robots.txt allows these paths (Crawl-delay: 5). Keep volume low and polite.

export const BASE = "https://www.jobbank.gc.ca"
export const SEARCH_URL = `${BASE}/jobsearch/jobsearch`
export const DETAIL_URL = `${BASE}/jobsearch/jobposting`

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 700
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-CA,en;q=0.9",
      },
      redirect: "follow",
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  salary: string | null
  source: string | null
  isNew: boolean
  url: string
}

export interface JobDetail extends JobCard {
  employmentType: string | null
  deadline: string | null
  description: string | null
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&nbsp;/g, " ")
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

/** Strip a leading inline label ("Location", "Salary") left over from wb-inv spans. */
function stripLabel(text: string, label: string): string {
  return text.replace(new RegExp(`^${label}\\s*`, "i"), "").trim()
}

/**
 * Parse the search results page: a flat list of <article id="article-<id>"> cards.
 * We split on the article boundary and parse each chunk independently so one
 * malformed card cannot break the rest.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/<article id="article-/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/^(\d+)/)
    if (!idMatch) continue
    const id = idMatch[1]

    const titleMatch = chunk.match(/class="noctitle"[^>]*>([\s\S]*?)<\/span>/i)
    const title = titleMatch ? clean(titleMatch[1]) : null
    if (!title) continue

    const dateMatch = chunk.match(/<li class="date"[^>]*>([\s\S]*?)<\/li>/i)
    const date = dateMatch ? clean(dateMatch[1]) || null : null

    const bizMatch = chunk.match(/<li class="business"[^>]*>([\s\S]*?)<\/li>/i)
    const company = bizMatch ? clean(bizMatch[1]) || null : null

    const locMatch = chunk.match(/<li class="location"[^>]*>([\s\S]*?)<\/li>/i)
    const location = locMatch ? stripLabel(clean(locMatch[1]), "Location") || null : null

    const salMatch = chunk.match(/<li class="salary"[^>]*>([\s\S]*?)<\/li>/i)
    const salary = salMatch ? stripLabel(clean(salMatch[1]), "Salary") || null : null

    const srcMatch = chunk.match(/class="job-source[^"]*"[^>]*><span class="wb-inv">([^<]+)<\/span>/i)
    const source = srcMatch ? clean(srcMatch[1]) || null : null

    const isNew = /<span class="new">/i.test(chunk)

    results.push({
      id,
      title,
      company,
      location,
      date,
      salary,
      source,
      isNew,
      url: `${DETAIL_URL}/${id}`,
    })
  }

  return results
}

/** Extract the total result count from the search page ("<span id="results-count">148</span>"). */
export function parseTotalCount(html: string): number | null {
  const m = html.match(/id="results-count"[^>]*>\s*([\d,]+)/i)
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : null
}

/** Assemble a readable salary string from schema.org MonetaryAmount microdata. */
function parseSalary(html: string): string | null {
  const min = html.match(/property="minValue"[^>]*content="([^"]*)"/i)?.[1]
  const max = html.match(/property="maxValue"[^>]*content="([^"]*)"/i)?.[1]
  const unitRaw =
    html.match(/property="unitText"[^>]*>([^<]*)<\/span>/i)?.[1] ||
    html.match(/property="unitText"[^>]*content="([^"]*)"/i)?.[1]
  if (!min && !max) return null
  const unit = unitRaw ? unitRaw.trim().toLowerCase() : ""
  const suffix = unit ? ` ${unit === "hour" ? "hourly" : unit === "year" ? "annually" : unit}` : ""
  const range = min && max && min !== max ? `$${min} to $${max}` : `$${min || max}`
  return `${range}${suffix}`
}

/**
 * Parse the job description. Both Job Bank's own postings and externally-sourced
 * ones expose a `<span property="description">`. Its content is either plain text
 * (Job Bank postings) or HTML-entity-encoded markup like `&lt;p&gt;` (external
 * postings), so we decode entities, turn block tags into line breaks, drop tags,
 * and decode once more for leftover doubly-encoded entities. Falls back to the
 * og:description meta if the span is absent.
 */
function parseDescription(html: string): string | null {
  const m = html.match(/property="description"[^>]*>([\s\S]*?)<\/span>/i)
  if (m && m[1].trim()) {
    let s = decodeHtmlEntities(m[1]) // &lt;p&gt; -> <p>, &amp;nbsp; -> &nbsp;
    s = s.replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/(p|li|ul|ol|div|h[1-6])>/gi, "\n")
    s = s.replace(/<[^>]+>/g, "") // strip remaining tags, keeping newlines
    s = decodeHtmlEntities(s) // resolve leftover entities (e.g. &nbsp;)
    s = s
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
    if (s) return s
  }
  const og = html.match(/property="og:description"[^>]*content="([^"]*)"/i)?.[1]
  return og ? decodeHtmlEntities(og).trim() || null : null
}

/** Parse the single-job detail page (schema.org microdata). */
export function parseJobDetail(html: string, id: string): JobDetail {
  const titleMatch = html.match(/property="title"[^>]*>([\s\S]*?)<\/span>/i)
  const title = titleMatch ? clean(titleMatch[1]) : "(untitled)"

  const orgMatch = html.match(
    /property="hiringOrganization"[\s\S]*?property="name"[^>]*>([\s\S]*?)<\/span>/i,
  )
  const company = orgMatch ? clean(orgMatch[1]) || null : null

  const locality = html.match(/property="addressLocality"[^>]*>([^<]*)<\/span>/i)?.[1]
  const region = html.match(/property="addressRegion"[^>]*>([^<]*)<\/span>/i)?.[1]
  const location =
    [locality, region].filter((x) => x && x.trim()).map((x) => clean(x!)).join(", ") || null

  const dateMatch = html.match(/property="datePosted"[^>]*>([\s\S]*?)<\/span>/i)
  const date = dateMatch ? stripLabel(clean(dateMatch[1]), "Posted on") || null : null

  const salary = parseSalary(html)

  const empMatch = html.match(/property="employmentType"[^>]*>([\s\S]*?)<\/span>/i)
  const employmentType = empMatch ? clean(empMatch[1]) || null : null

  const deadlineMatch = html.match(/property="validThrough"[^>]*>([\s\S]*?)<\/p>/i)
  const deadline = deadlineMatch ? clean(deadlineMatch[1]) || null : null

  const description = parseDescription(html)

  return {
    id,
    title,
    company,
    location,
    date,
    salary,
    source: null,
    isNew: false,
    url: `${DETAIL_URL}/${id}`,
    employmentType,
    deadline,
    description,
  }
}

/** Job Bank "Date posted" filter: posting age in days maps directly to the fage param. */
export function jobageToFage(days: number): string | null {
  if (!days || days <= 0 || days >= 9999) return null
  return String(days)
}

/** Sort mode: relevance -> "M" (best match, Job Bank default), date -> "D". */
export function sortFlag(mode: string | undefined): string {
  return (mode || "").toLowerCase().startsWith("date") ? "D" : "M"
}

// Job Bank does NOT filter by free-text city. Real location filtering is done by
// province facet (fprov=<CODE>) and workplace type (fskl: Remote=15141, Hybrid=100000).
// City-level filtering would require the map geo-radius search (lat/long + radius),
// which is out of scope. So we resolve a free-text --location to a province and/or a
// remote/hybrid flag, and tell the user when it could not be resolved.

const PROVINCES: Record<string, string> = {
  ab: "AB", alberta: "AB",
  bc: "BC", "british columbia": "BC",
  mb: "MB", manitoba: "MB",
  nb: "NB", "new brunswick": "NB",
  nl: "NL", newfoundland: "NL", "newfoundland and labrador": "NL",
  ns: "NS", "nova scotia": "NS",
  nt: "NT", "northwest territories": "NT",
  nu: "NU", nunavut: "NU",
  on: "ON", ontario: "ON",
  pe: "PE", pei: "PE", "prince edward island": "PE",
  qc: "QC", quebec: "QC", "québec": "QC",
  sk: "SK", saskatchewan: "SK",
  yt: "YT", yukon: "YT",
}

/** Remote=15141, Hybrid=100000 in Job Bank's workplace (fskl) facet. */
const WORKPLACE: Record<string, string> = { remote: "15141", hybrid: "100000" }

export interface LocationFilter {
  fprov: string | null
  fskl: string | null
  note: string | null
}

/**
 * Resolve a free-text location (e.g. "Toronto, ON", "Ontario", "Remote") into
 * Job Bank's province facet and/or workplace filter. Explicit province/remote args,
 * when given, take precedence over what is parsed from the location string.
 */
export function resolveLocation(
  location: string | undefined,
  province: string | undefined,
  remote: string | undefined,
): LocationFilter {
  let fprov: string | null = null
  let fskl: string | null = null

  const s = (location || "").toLowerCase().trim()
  if (s) {
    if (/\bremote\b|work from home|\btelework\b/.test(s)) fskl = WORKPLACE.remote
    else if (/\bhybrid\b/.test(s)) fskl = WORKPLACE.hybrid

    for (const t of s.split(/[\s,]+/)) {
      if (PROVINCES[t]) { fprov = PROVINCES[t]; break }
    }
    if (!fprov) {
      for (const [name, code] of Object.entries(PROVINCES)) {
        if (name.length > 2 && s.includes(name)) { fprov = code; break }
      }
    }
  }

  // Explicit flags override.
  if (province) {
    const p = province.toLowerCase().trim()
    fprov = PROVINCES[p] ?? (province.length === 2 ? province.toUpperCase() : fprov)
  }
  if (remote) {
    const r = remote.toLowerCase().trim()
    if (WORKPLACE[r]) fskl = WORKPLACE[r]
  }

  let note: string | null = null
  if (location && !fprov && !fskl) {
    note =
      `Note: Job Bank filters by province or remote/hybrid, not city. "${location}" did not ` +
      `resolve to a province, so this searched all of Canada. Use -p <ON|BC|QC|…> or --remote remote|hybrid to narrow.`
  }
  return { fprov, fskl, note }
}
