// Data source: RemoteOK public JSON API (https://remoteok.com/api). No authentication.
// The API returns a JSON array whose FIRST element is a legal/metadata object; the rest
// are job objects. It is remote-only (every job is a remote role). There is no server
// keyword/location search, so we fetch the feed and filter client-side.
//
// Personal use only. RemoteOK's robots.txt allows "*" with Crawl-delay 1, and the /api is
// their documented public endpoint — but its terms ASK THAT YOU LINK BACK to the RemoteOK
// job URL (dofollow) when you use the data. Keep volume low; do not use commercially or
// for bulk collection. (RemoteOK blocks AI-training crawlers specifically; this is a
// user-run personal search tool with a normal browser UA, not a crawler.)

export const API_URL = "https://remoteok.com/api"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

/** Fetch JSON with exponential backoff on 429/5xx. */
export async function jsonFetch(url: string): Promise<unknown> {
  const maxRetries = 6
  let delay = 700
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json,text/plain,*/*",
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
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }
  throw new Error("Request failed after max retries")
}

export interface Job {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null // ISO 8601
  salary: string | null
  tags: string[]
  url: string
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

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|ul|ol|div|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function formatSalary(min: unknown, max: unknown): string | null {
  const lo = typeof min === "number" ? min : 0
  const hi = typeof max === "number" ? max : 0
  if (!lo && !hi) return null
  const fmt = (n: number) => "$" + n.toLocaleString("en-US")
  if (lo && hi && lo !== hi) return `${fmt(lo)} - ${fmt(hi)}`
  return fmt(lo || hi)
}

/** Map the raw API array (skipping the legal element) into typed jobs. */
export function parseJobs(raw: unknown, withDescription = false): Job[] {
  if (!Array.isArray(raw)) return []
  const out: Job[] = []
  for (const el of raw) {
    if (!el || typeof el !== "object") continue
    const o = el as Record<string, unknown>
    if (o.legal !== undefined || o.position === undefined) continue // skip legal/metadata element
    const id = o.id != null ? String(o.id) : o.slug != null ? String(o.slug) : ""
    if (!id) continue
    const rawTags = Array.isArray(o.tags) ? (o.tags as unknown[]).map(String) : []
    out.push({
      id,
      title: String(o.position),
      company: o.company != null ? String(o.company) : null,
      location: o.location ? String(o.location).trim() || null : null,
      date: o.date != null ? String(o.date) : null,
      salary: formatSalary(o.salary_min, o.salary_max),
      tags: rawTags,
      url: o.url != null ? String(o.url) : `https://remoteok.com/remote-jobs/${id}`,
      description: withDescription && o.description ? htmlToText(String(o.description)) : null,
    })
  }
  return out
}

/**
 * Client-side keyword filter over title + company only. RemoteOK jobs (especially
 * recruiter / talent-pool posts) are tagged with dozens of roles, so matching tags
 * makes broad queries wildly imprecise (a "File Clerk" tagged "engineer"). Use the
 * explicit `--tag` feed for tag-based filtering; `--query` stays precise on the title.
 */
export function filterByQuery(jobs: Job[], query: string | undefined): Job[] {
  if (!query) return jobs
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return jobs
  return jobs.filter((j) => {
    const hay = `${j.title} ${j.company || ""}`.toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}

/** Client-side substring filter over the job's location/region string. */
export function filterByLocation(jobs: Job[], location: string | undefined): Job[] {
  if (!location) return jobs
  const l = location.toLowerCase().trim()
  return jobs.filter((j) => (j.location || "").toLowerCase().includes(l))
}

/** Keep only jobs posted within `days` days (client-side, using each job's ISO date). */
export function filterByAge(jobs: Job[], days: number): Job[] {
  if (!days || days <= 0 || days >= 9999) return jobs
  const cutoff = Date.now() - days * 86400_000
  return jobs.filter((j) => {
    if (!j.date) return false
    const t = Date.parse(j.date)
    return isNaN(t) ? false : t >= cutoff
  })
}

/**
 * Drop recruiter/talent-pool spam. RemoteOK has generic "join our talent community"
 * posts tagged with 20-35 roles at once; they pollute every `--tag` feed and, being
 * freshly posted, sort to the top. Real single-role postings rarely exceed ~12 tags,
 * so anything above the threshold is almost certainly spam. Threshold is deliberately
 * generous (20) so legit multi-tagged postings survive; the spam posts run 25-35 tags.
 */
export function dropOvertagged(jobs: Job[], maxTags = 20): Job[] {
  return jobs.filter((j) => j.tags.length <= maxTags)
}

/** Sort newest-first by ISO date; undated last. */
export function sortByDate(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const ta = a.date ? Date.parse(a.date) : NaN
    const tb = b.date ? Date.parse(b.date) : NaN
    if (isNaN(ta) && isNaN(tb)) return 0
    if (isNaN(ta)) return 1
    if (isNaN(tb)) return -1
    return tb - ta
  })
}
