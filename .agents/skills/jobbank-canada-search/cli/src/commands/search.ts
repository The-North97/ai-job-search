import {
  SEARCH_URL,
  htmlFetch,
  parseJobCards,
  parseTotalCount,
  jobageToFage,
  sortFlag,
  resolveLocation,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  province?: string
  remote?: string // "remote" | "hybrid"
  jobage: number
  sort?: string // "relevance" | "date"
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.query) params.set("searchstring", opts.query)
  const loc = resolveLocation(opts.location, opts.province, opts.remote)
  if (loc.fprov) params.set("fprov", loc.fprov)
  if (loc.fskl) params.set("fskl", loc.fskl)
  params.set("sort", sortFlag(opts.sort))
  const fage = jobageToFage(opts.jobage)
  if (fage) params.set("fage", fage)
  if (opts.page > 1) params.set("page", String(opts.page))
  return `${SEARCH_URL}?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = c.id.padEnd(10)
    const title = (c.title || "").slice(0, 34).padEnd(34)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 22).padEnd(22)
    const date = c.date || "—"
    return `${id} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(10) +
    " " +
    "TITLE".padEnd(34) +
    " " +
    "EMPLOYER".padEnd(24) +
    " " +
    "LOCATION".padEnd(22) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const loc = resolveLocation(opts.location, opts.province, opts.remote)
    if (loc.note) process.stderr.write(loc.note + "\n")
    const html = await htmlFetch(buildUrl(opts))
    const total = parseTotalCount(html)
    let cards = parseJobCards(html)
    if (opts.limit && opts.limit > 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}` +
              `${c.salary ? ` · ${c.salary}` : ""}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: cards.length, page: opts.page, total }, results: cards },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
