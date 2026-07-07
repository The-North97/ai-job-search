import { API_URL, jsonFetch, parseJobs, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

/** Accept a raw RemoteOK id or a remoteok.com/remote-jobs/...-<id> URL. */
function normalizeId(input: string): string | null {
  const url = input.match(/-(\d{4,})(?:\/|\?|$)/) || input.match(/(\d{4,})/)
  if (url) return url[1]
  return null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`Could not parse a RemoteOK job ID from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    // The public API has no single-job endpoint; the /api feed carries each job's full
    // description, so we fetch it and locate the id. Only recent jobs are in the feed.
    const raw = await jsonFetch(API_URL)
    const job = parseJobs(raw, true).find((j) => j.id === id)
    if (!job) {
      writeError("Job not found in the current RemoteOK feed (it may have aged out)", "NOT_FOUND")
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "Remote"}`,
        job.salary ? `Salary: ${job.salary}` : "",
        job.date ? `Posted: ${job.date}` : "",
        job.tags.length ? `Tags: ${job.tags.join(", ")}` : "",
        "",
        job.description || "(no description)",
        "",
        `URL: ${job.url}`,
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
