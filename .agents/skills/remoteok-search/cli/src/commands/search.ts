import {
  API_URL,
  jsonFetch,
  parseJobs,
  filterByQuery,
  filterByLocation,
  filterByAge,
  sortByDate,
  dropOvertagged,
  writeError,
  type Job,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  tag?: string
  jobage: number
  sort?: string // "relevance" | "date"
  limit?: number
  format: "json" | "table" | "plain"
}

function renderTable(jobs: Job[]): string {
  if (jobs.length === 0) return "No results."
  const rows = jobs.map((j) => {
    const id = j.id.slice(0, 10).padEnd(10)
    const title = (j.title || "").slice(0, 36).padEnd(36)
    const company = (j.company || "—").slice(0, 22).padEnd(22)
    const loc = (j.location || "Remote").slice(0, 20).padEnd(20)
    const date = j.date ? j.date.slice(0, 10) : "—"
    return `${id} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(10) +
    " " +
    "TITLE".padEnd(36) +
    " " +
    "COMPANY".padEnd(22) +
    " " +
    "LOCATION".padEnd(20) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = opts.tag ? `${API_URL}?tags=${encodeURIComponent(opts.tag)}` : API_URL
    const raw = await jsonFetch(url)
    let jobs = dropOvertagged(parseJobs(raw))
    jobs = filterByQuery(jobs, opts.query)
    jobs = filterByLocation(jobs, opts.location)
    jobs = filterByAge(jobs, opts.jobage)
    if (!opts.sort || opts.sort.toLowerCase().startsWith("date")) jobs = sortByDate(jobs)
    if (opts.limit && opts.limit > 0) jobs = jobs.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(jobs) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        jobs
          .map(
            (j) =>
              `${j.title}\n  ${j.company || "—"} · ${j.location || "Remote"} · ${j.date || "—"}` +
              `${j.salary ? ` · ${j.salary}` : ""}\n  id: ${j.id}\n  ${j.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: jobs.length }, results: jobs }, null, 2) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
