import {
  feedUrl,
  textFetch,
  parseFeed,
  filterByQuery,
  filterByLocation,
  filterByAge,
  sortByDate,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  category: string
  jobage: number
  sort?: string // "relevance" | "date"
  limit?: number
  format: "json" | "table" | "plain"
}

function renderTable(jobs: JobCard[]): string {
  if (jobs.length === 0) return "No results."
  const rows = jobs.map((j) => {
    const title = (j.title || "").slice(0, 38).padEnd(38)
    const company = (j.company || "—").slice(0, 22).padEnd(22)
    const loc = (j.location || "Remote").slice(0, 22).padEnd(22)
    const date = j.date ? j.date.slice(0, 10) : "—"
    return `${title} ${company} ${loc} ${date}`
  })
  const header =
    "TITLE".padEnd(38) + " " + "COMPANY".padEnd(22) + " " + "REGION".padEnd(22) + " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const xml = await textFetch(feedUrl(opts.category))
    if (!xml) {
      writeError(`No feed found for category "${opts.category}"`, "NO_FEED")
      return 1
    }
    let jobs = parseFeed(xml)
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
              `${j.title}\n  ${j.company || "—"} · ${j.location || "Remote"} · ${j.date || "—"}\n  id: ${j.id}\n  ${j.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: jobs.length, category: opts.category }, results: jobs },
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
