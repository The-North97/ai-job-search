import {
  textFetch,
  feedUrl,
  detailFromFeed,
  parseJobDetail,
  detailUrl,
  writeError,
  type JobDetail,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  category?: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  if (!opts.id || !opts.id.trim()) {
    writeError("detail requires an <id|url>", "BAD_ID")
    return 1
  }
  const url = detailUrl(opts.id.trim())
  const slug = url.match(/\/remote-jobs\/([^/?#]+)/)?.[1] || opts.id.trim()

  try {
    let job: JobDetail | null = null

    // Primary: the RSS feeds (reliable). WWR's HTML job pages sit behind Cloudflare bot
    // protection that 403s under load, so we read the full description from RSS instead.
    // Try the combined feed, then the caller's/default category feed.
    const feeds = [feedUrl("all"), feedUrl(opts.category || "remote-programming-jobs")]
    for (const f of feeds) {
      const xml = await textFetch(f).catch(() => "")
      if (xml) {
        job = detailFromFeed(xml, slug, url)
        if (job) break
      }
    }

    // Fallback: the job page's JSON-LD (richer: salary, employmentType, deadline), used
    // for jobs no longer in the feeds. May be blocked by Cloudflare; tolerate failure.
    if (!job) {
      const html = await textFetch(url).catch(() => "")
      if (html) job = parseJobDetail(html, slug, url)
    }

    if (!job) {
      writeError(
        "Job not found in the current WWR feeds (it may have aged out; the HTML page can also be rate-limited)",
        "NOT_FOUND",
      )
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "Remote"}`,
        job.salary ? `Salary: ${job.salary}` : "",
        job.employmentType ? `Employment: ${job.employmentType}` : "",
        job.date ? `Posted: ${job.date.slice(0, 10)}` : "",
        job.deadline ? `Closes: ${job.deadline.slice(0, 10)}` : "",
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
