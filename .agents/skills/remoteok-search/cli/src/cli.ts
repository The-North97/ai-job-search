#!/usr/bin/env bun
// Self-contained CLI for searching remote jobs on RemoteOK's public JSON API
// (https://remoteok.com/api). No authentication, zero runtime dependencies — runs
// anywhere `bun` is available.
//
// Personal use only. RemoteOK's API terms ask that you link back to the RemoteOK job
// URL (dofollow) when using the data. Keep volume low; not for commercial or bulk use.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit", s: "sort", t: "tag" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `remoteok-cli — search remote jobs on RemoteOK (remoteok.com/api)

USAGE
  bun run src/cli.ts search [--query "<text>"] [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (matched against title, company, tags). Recommended.
  --location, -l <text>   Filter by the job's region/location text, e.g. "Canada",
                          "Americas", "Worldwide". Optional (all jobs are remote).
  --tag, -t <tag>         Fetch a RemoteOK tag feed (e.g. "dev", "javascript", "golang").
  --jobage <days>         Posted within N days (client-side).
  --sort, -s <mode>       date (default, newest first) | relevance (feed order).
  --limit, -n <n>         Cap results emitted.
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "backend engineer" --jobage 14 --format table
  bun run src/cli.ts search -q "python" -l "Americas" --limit 10 --format table
  bun run src/cli.ts search -t golang --format table
  bun run src/cli.ts detail 1134525 --format plain

Personal use only — please link back to the RemoteOK job URL when using this data.
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "search") {
    const fmt = (flags.format as string) || "json"

    const parseIntFlag = (name: string, raw: string | boolean | string[]): number | null => {
      const val = parseInt(raw as string, 10)
      if (isNaN(val)) {
        process.stderr.write(
          JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n",
        )
        return null
      }
      return val
    }

    if (flags.jobage !== undefined) {
      const v = parseIntFlag("jobage", flags.jobage)
      if (v === null) return 1
      flags.jobage = String(v)
    }
    if (flags.limit !== undefined) {
      const v = parseIntFlag("limit", flags.limit)
      if (v === null) return 1
      flags.limit = String(v)
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      tag: typeof flags.tag === "string" ? flags.tag : undefined,
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      sort: typeof flags.sort === "string" ? flags.sort : undefined,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires an <id|url>", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
