// Data source: We Work Remotely (weworkremotely.com) public RSS feeds + job pages.
// - Search: per-category RSS, e.g. /categories/remote-programming-jobs.rss (25 items),
//   or the all-jobs feed /remote-jobs.rss. Every job is remote.
// - Detail: the job page carries a clean schema.org JSON-LD JobPosting block.
// No authentication. robots.txt allows /; only admin/account paths are blocked.
// RSS feeds are meant for syndication. Keep volume low and polite.

export const BASE = "https://weworkremotely.com"

/** Build the RSS feed URL for a category slug ("all" -> the combined feed). */
export function feedUrl(category: string): string {
  const c = category.toLowerCase().trim()
  if (c === "all" || c === "") return `${BASE}/remote-jobs.rss`
  const slug = c.startsWith("remote-") ? c : `remote-${c}-jobs`
  return `${BASE}/categories/${slug}.rss`
}

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

/** Fetch text with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function textFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 700
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/rss+xml,text/xml,text/html;q=0.9,*/*;q=0.8",
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
  location: string | null // the feed's <region>
  category: string | null
  date: string | null // ISO 8601
  url: string
}

export interface JobDetail extends JobCard {
  employmentType: string | null
  salary: string | null
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
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&nbsp;/g, " ")
}

/** Turn (possibly doubly-encoded) HTML into readable text, preserving paragraph breaks. */
function htmlToText(input: string): string {
  const decoded = decodeHtmlEntities(input) // &lt;div&gt; -> <div>
  const withBreaks = decoded
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
  return decodeHtmlEntities(withBreaks)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"))
  if (!m) return null
  // strip a CDATA wrapper if present
  const inner = m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")
  return inner.trim() || null
}

function slugFromUrl(url: string): string {
  const m = url.match(/\/remote-jobs\/([^/?#]+)/)
  return m ? m[1] : url
}

/** Parse an RSS feed's <item> list into job cards. */
export function parseFeed(xml: string): JobCard[] {
  const results: JobCard[] = []
  const items = xml.split(/<item>/).slice(1)
  for (const raw of items) {
    const item = raw.split(/<\/item>/)[0]
    const link = tag(item, "link")
    if (!link) continue
    const rawTitle = tag(item, "title") ? decodeHtmlEntities(tag(item, "title")!) : ""
    // WWR titles are "Company: Position".
    let company: string | null = null
    let title = rawTitle
    const sep = rawTitle.indexOf(": ")
    if (sep > 0) {
      company = rawTitle.slice(0, sep).trim() || null
      title = rawTitle.slice(sep + 2).trim()
    }
    if (!title) continue

    const pub = tag(item, "pubDate")
    let date: string | null = null
    if (pub) {
      const t = Date.parse(pub)
      if (!isNaN(t)) date = new Date(t).toISOString()
    }

    results.push({
      id: slugFromUrl(link),
      title,
      company,
      location: tag(item, "region"),
      category: tag(item, "category"),
      date,
      url: link,
    })
  }
  return results
}

/**
 * Build a detail record from an RSS feed item (reliable: the feeds aren't Cloudflare-
 * protected the way the HTML job pages are). The item's <description> carries the full
 * job posting HTML. Salary / employmentType / deadline are not in RSS, so they are null.
 */
export function detailFromFeed(xml: string, slug: string, url: string): JobDetail | null {
  const items = xml.split(/<item>/).slice(1)
  for (const raw of items) {
    const item = raw.split(/<\/item>/)[0]
    const link = tag(item, "link")
    if (!link || slugFromUrl(link) !== slug) continue
    const rawTitle = tag(item, "title") ? decodeHtmlEntities(tag(item, "title")!) : ""
    let company: string | null = null
    let title = rawTitle
    const sep = rawTitle.indexOf(": ")
    if (sep > 0) {
      company = rawTitle.slice(0, sep).trim() || null
      title = rawTitle.slice(sep + 2).trim()
    }
    const pub = tag(item, "pubDate")
    let date: string | null = null
    if (pub) {
      const t = Date.parse(pub)
      if (!isNaN(t)) date = new Date(t).toISOString()
    }
    const descRaw = tag(item, "description")
    return {
      id: slug,
      title: title || "(untitled)",
      company,
      location: tag(item, "region"),
      category: tag(item, "category"),
      date,
      url: link || url,
      employmentType: null,
      salary: null,
      deadline: null,
      description: descRaw ? htmlToText(descRaw) : null,
    }
  }
  return null
}

/** Parse a job page's schema.org JSON-LD JobPosting into a detail record. */
export function parseJobDetail(html: string, id: string, url: string): JobDetail {
  const block = html.match(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i,
  )?.[1]

  let title = "(untitled)"
  let company: string | null = null
  let location: string | null = null
  let employmentType: string | null = null
  let salary: string | null = null
  let date: string | null = null
  let deadline: string | null = null
  let description: string | null = null

  if (block) {
    try {
      const j = JSON.parse(block) as Record<string, unknown>
      if (j.title) title = String(j.title)
      const org = j.hiringOrganization as Record<string, unknown> | undefined
      if (org?.name) company = String(org.name)
      if (org?.address) location = String(org.address)
      if (j.employmentType) employmentType = String(j.employmentType)
      if (j.datePosted) {
        const t = Date.parse(String(j.datePosted))
        date = isNaN(t) ? String(j.datePosted) : new Date(t).toISOString()
      }
      if (j.validThrough) {
        const t = Date.parse(String(j.validThrough))
        deadline = isNaN(t) ? String(j.validThrough) : new Date(t).toISOString()
      }
      const bs = j.baseSalary as Record<string, unknown> | undefined
      const val = bs?.value as Record<string, unknown> | undefined
      if (val) {
        const min = Number(val.minValue) || 0
        const max = Number(val.maxValue) || 0
        const cur = bs?.currency ? String(bs.currency) : "USD"
        if (min || max) {
          const fmt = (n: number) => `${cur} ${n.toLocaleString("en-US")}`
          salary = min && max && min !== max ? `${fmt(min)} - ${fmt(max)}` : fmt(min || max)
        }
      }
      if (j.description) description = htmlToText(String(j.description))
    } catch {
      // fall through to null fields
    }
  }
  if (!description) {
    const meta = html.match(/<meta name="description"[^>]*content="([^"]*)"/i)?.[1]
    description = meta ? decodeHtmlEntities(meta).trim() || null : null
  }

  return {
    id,
    title,
    company,
    location,
    category: null,
    date,
    url,
    employmentType,
    salary,
    deadline,
    description,
  }
}

/** Client-side keyword filter over title + company. */
export function filterByQuery(jobs: JobCard[], query: string | undefined): JobCard[] {
  if (!query) return jobs
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return jobs
  return jobs.filter((j) => {
    const hay = `${j.title} ${j.company || ""}`.toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}

/** Client-side substring filter over the job's region string. */
export function filterByLocation(jobs: JobCard[], location: string | undefined): JobCard[] {
  if (!location) return jobs
  const l = location.toLowerCase().trim()
  return jobs.filter((j) => (j.location || "").toLowerCase().includes(l))
}

/** Keep only jobs posted within `days` days (client-side). */
export function filterByAge(jobs: JobCard[], days: number): JobCard[] {
  if (!days || days <= 0 || days >= 9999) return jobs
  const cutoff = Date.now() - days * 86400_000
  return jobs.filter((j) => {
    if (!j.date) return false
    const t = Date.parse(j.date)
    return isNaN(t) ? false : t >= cutoff
  })
}

/** Sort newest-first by ISO date; undated last. */
export function sortByDate(jobs: JobCard[]): JobCard[] {
  return [...jobs].sort((a, b) => {
    const ta = a.date ? Date.parse(a.date) : NaN
    const tb = b.date ? Date.parse(b.date) : NaN
    if (isNaN(ta) && isNaN(tb)) return 0
    if (isNaN(ta)) return 1
    if (isNaN(tb)) return -1
    return tb - ta
  })
}

/** Build a job page URL from an id (slug) or pass a full URL through. */
export function detailUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input
  return `${BASE}/remote-jobs/${input}`
}
