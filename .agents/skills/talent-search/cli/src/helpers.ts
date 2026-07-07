// Data source: Talent.com Canada (ca.talent.com) public job pages. No authentication.
// - Search: /jobs?k=<kw>&l=<loc>&p=<page> returns HTML job cards (19/page).
// - Detail: /view?id=<id> returns one posting (client-rendered; og tags + a
//   description column are the stable anchors).
// Parsed with regex on the stable CSS-module class *prefixes* (e.g. "JobCard_title__"):
// Talent.com's class names carry per-build hash suffixes ("__X32Qk") that change on
// deploys, so we never match the full hashed name — only the prefix.
//
// Personal use only. robots.txt allows /jobs and /view (it blocks the JSON API and
// /search-jobs), but Talent.com's terms restrict automated access — keep volume low
// and do not use commercially or for bulk collection. Run at your own responsibility.

export const BASE = "https://ca.talent.com"
export const SEARCH_URL = `${BASE}/jobs`
export const DETAIL_URL = `${BASE}/view`

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
  date: string | null // ISO 8601 (from the card's <time dateTime="...">)
  snippet: string | null
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
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

/**
 * Parse the search page: job cards wrapped in
 * <div data-testid="jobcard-container-<id>" ...>. We split on that marker so each
 * chunk starts with the job id, and parse fields by stable class prefixes.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/data-testid="jobcard-container-/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/^(\d+)/)
    if (!idMatch) continue
    const id = idMatch[1]

    const titleMatch = chunk.match(/class="JobCard_title__[^"]*"[^>]*>([\s\S]*?)<\/h2>/i)
    const title = titleMatch ? clean(titleMatch[1]) : null
    if (!title) continue

    const companyMatch = chunk.match(/class="JobCard_company__[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
    const company = companyMatch ? clean(companyMatch[1]) || null : null

    const locMatch = chunk.match(/class="JobCard_location__[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
    const location = locMatch ? clean(locMatch[1]) || null : null

    const dateMatch = chunk.match(/class="JobCard_timeText__[^"]*"[^>]*dateTime="([^"]*)"/i)
    const date = dateMatch ? dateMatch[1] || null : null

    let snippet: string | null = null
    const snipMatch = chunk.match(/class="JobCard_snippet__[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
    if (snipMatch) {
      // Snippet is doubly-encoded employer HTML with a trailing "Show more" link.
      let s = decodeHtmlEntities(decodeHtmlEntities(snipMatch[1]))
      s = stripTags(s).replace(/\s*Show more\s*$/i, "").trim()
      snippet = s || null
    }

    results.push({
      id,
      title,
      company,
      location,
      date,
      snippet,
      url: `${DETAIL_URL}?id=${id}`,
    })
  }

  return results
}

/** Parse the single-job detail page (best-effort: og tags + description column). */
export function parseJobDetail(html: string, id: string): JobDetail {
  const ogTitle = html.match(/property="og:title"[^>]*content="([^"]*)"/i)?.[1]
  let title = "(untitled)"
  let company: string | null = null
  if (ogTitle) {
    // Format: "<title> – <company> – Job <country>"
    const parts = decodeHtmlEntities(ogTitle).split(/\s+[–-]\s+/)
    if (parts[0]) title = parts[0].trim()
    if (parts.length >= 3 && parts[1]) company = parts[1].trim()
  }

  // Description column (stable prefix "styles_jobDescriptionColumn__"); strip svg,
  // buttons, scripts, then tags. Cut off the related-jobs column if it bleeds in.
  let description: string | null = null
  const colAttr = html.search(/class="styles_jobDescriptionColumn__[^"]*"/i)
  if (colAttr >= 0) {
    // Start at the enclosing tag's "<", not mid-attribute, so the opening tag is
    // well-formed and gets stripped (otherwise the class="..."> fragment leaks as text).
    const colStart = html.lastIndexOf("<", colAttr)
    let block = html.slice(colStart >= 0 ? colStart : colAttr, (colStart >= 0 ? colStart : colAttr) + 12000)
    const relIdx = block.search(/class="styles_relatedJobsColumn__/i)
    if (relIdx > 0) block = block.slice(0, relIdx)
    block = block
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<button[\s\S]*?<\/button>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|ul|ol|div|h[1-6])>/gi, "\n")
    let text = decodeHtmlEntities(block.replace(/<[^>]+>/g, ""))
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
    // Drop the card-header preamble (title/company/date/apply/job-type) that precedes
    // the "Job description" heading, when that heading is present.
    const bodyStart = text.search(/Job description/i)
    if (bodyStart >= 0) {
      text = text.slice(bodyStart + "Job description".length).replace(/^[\s:·•-]+/, "").trim()
    }
    // Drop trailing footer/related-content that can bleed in from the column.
    const footer = text.search(/(Create a job alert|Similar jobs|Report this job|People also searched)/i)
    if (footer > 0) text = text.slice(0, footer).trim()
    if (text) description = text
  }
  if (!description) {
    const meta = html.match(/<meta name="description"[^>]*content="([^"]*)"/i)?.[1]
    description = meta ? decodeHtmlEntities(meta).trim() || null : null
  }

  return {
    id,
    title,
    company,
    location: null,
    date: null,
    snippet: null,
    url: `${DETAIL_URL}?id=${id}`,
    description,
  }
}

/** Keep only cards posted within `days` days, using each card's ISO date (client-side). */
export function filterByAge<T extends { date: string | null }>(cards: T[], days: number): T[] {
  if (!days || days <= 0 || days >= 9999) return cards
  const cutoff = Date.now() - days * 86400_000
  return cards.filter((c) => {
    if (!c.date) return false
    const t = Date.parse(c.date)
    return isNaN(t) ? false : t >= cutoff
  })
}

/** Sort cards newest-first by ISO date (client-side); undated go last. */
export function sortByDate<T extends { date: string | null }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const ta = a.date ? Date.parse(a.date) : NaN
    const tb = b.date ? Date.parse(b.date) : NaN
    if (isNaN(ta) && isNaN(tb)) return 0
    if (isNaN(ta)) return 1
    if (isNaN(tb)) return -1
    return tb - ta
  })
}
