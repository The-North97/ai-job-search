import {
  SEARCH_URL,
  htmlFetch,
  parseJobCards,
  filterByAge,
  sortByDate,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage: number
  sort?: string // "relevance" | "date"
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.query) params.set("k", opts.query)
  if (opts.location) params.set("l", opts.location)
  if (opts.page > 1) params.set("p", String(opts.page))
  return `${SEARCH_URL}?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = c.id.slice(0, 20).padEnd(20)
    const title = (c.title || "").slice(0, 34).padEnd(34)
    const company = (c.company || "—").slice(0, 22).padEnd(22)
    const loc = (c.location || "—").slice(0, 18).padEnd(18)
    const date = c.date ? c.date.slice(0, 10) : "—"
    return `${id} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(20) +
    " " +
    "TITLE".padEnd(34) +
    " " +
    "COMPANY".padEnd(22) +
    " " +
    "LOCATION".padEnd(18) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)
    cards = filterByAge(cards, opts.jobage)
    if ((opts.sort || "").toLowerCase().startsWith("date")) cards = sortByDate(cards)
    if (opts.limit && opts.limit > 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: cards.length, page: opts.page }, results: cards },
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
