#!/usr/bin/env bun
// Self-contained CLI for searching remote jobs on We Work Remotely (weworkremotely.com)
// via its public RSS feeds and schema.org job pages. No authentication, zero runtime
// dependencies — runs anywhere `bun` is available.
//
// robots.txt allows these paths; RSS feeds are meant for syndication. Keep volume low.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = {
    q: "query", l: "location", n: "limit", s: "sort", c: "category",
  }
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

const HELP = `weworkremotely-cli — search remote jobs on We Work Remotely (weworkremotely.com)

USAGE
  bun run src/cli.ts search [--query "<text>"] [--category <slug>] [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (matched against title + company). Recommended.
  --category, -c <slug>   Category feed. Default "remote-programming-jobs". Others:
                          remote-back-end-programming-jobs, remote-front-end-programming-jobs,
                          remote-full-stack-programming-jobs, remote-devops-sysadmin-jobs,
                          remote-product-jobs, remote-design-jobs, "all" (combined feed).
  --location, -l <text>   Filter by the job's region text (e.g. "Anywhere", "USA Only").
  --jobage <days>         Posted within N days (client-side).
  --sort, -s <mode>       date (default, newest first) | relevance (feed order).
  --limit, -n <n>         Cap results emitted.
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "backend" --jobage 14 --format table
  bun run src/cli.ts search -c remote-full-stack-programming-jobs --format table
  bun run src/cli.ts search -q "engineer" -l "Anywhere" --limit 10
  bun run src/cli.ts detail some-company-senior-engineer --format plain

Uses We Work Remotely's public RSS/job pages. Keep volume low.
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
      category: typeof flags.category === "string" ? flags.category : "remote-programming-jobs",
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
      category: typeof flags.category === "string" ? flags.category : undefined,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
