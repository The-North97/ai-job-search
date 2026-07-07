# Search Queries for Job Scraper

<!-- Configured for James Parker: Greater Toronto Area + remote Canada, backend/AI software roles. -->

> **Note:** The framework's built-in scraper CLI tools target the **Danish** job market (Jobindex, Jobnet, etc.) and do not apply here. Use the LinkedIn/Indeed/Google `site:` queries below with the `/apply` workflow, or wire up Canadian portal integrations later.

## Search Sites

Structured CLI tools (prefer these - live, parseable, deduplicatable):
- **linkedin-search** - `bun run .agents/skills/linkedin-search/cli/src/cli.ts` (country-agnostic; pass `-l "Toronto, Ontario, Canada"` or `-l "Remote"`)
- **jobbank-canada-search** - `bun run .agents/skills/jobbank-canada-search/cli/src/cli.ts` (Job Bank Canada; aggregates provincial + partner boards. Filters by province `-p ON` / remote `--remote remote`, not city)
- **talent-search** - `bun run .agents/skills/talent-search/cli/src/cli.ts` (Talent.com Canada aggregator; free-text `-l "Toronto, ON"` / `-l "Remote"`, `--jobage`/`--sort date` applied client-side. Personal use only.)
- **remoteok-search** - `bun run .agents/skills/remoteok-search/cli/src/cli.ts` (RemoteOK; fully-remote roles worldwide. `-q` matches title+company; `-l` filters region e.g. "Americas". Personal use only.)
- **weworkremotely-search** - `bun run .agents/skills/weworkremotely-search/cli/src/cli.ts` (We Work Remotely; fully-remote software roles by category. `-c remote-back-end-programming-jobs` etc., or `-c all`; `-q` matches title+company.)

Secondary (WebSearch with `site:` filters):
- **indeed.ca** - largest Canadian job board (aggressively blocks scrapers; WebSearch only)
- **glassdoor.ca** - listings + company reviews and salary data
- **wellfound.com** (AngelList Talent) - startup / AI-forward roles, often remote
- Company career pages via Google `site:` filters

## Query Categories

Queries are grouped by priority. Combine each with location terms where the site supports it: "Remote", "Canada", "Toronto", "Vaughan", "GTA".

### Priority 1: Backend / Distributed-Systems Software Engineer

Strongest and most desired direction.

```
site:linkedin.com/jobs "Senior Software Engineer" backend Java remote Canada
site:linkedin.com/jobs "Software Engineer" ("event-driven" OR Kafka) remote Canada
site:linkedin.com/jobs "Backend Developer" Java Kubernetes Toronto
site:indeed.ca "Software Engineer" backend Java remote
site:indeed.ca "Senior Software Developer" Kubernetes Toronto OR remote
```

### Priority 2: Applied AI / AI-Forward Engineering

Leverages the AWS Bedrock / LLM automation work.

```
site:linkedin.com/jobs ("AI Engineer" OR "Applied AI") software remote Canada
site:linkedin.com/jobs "Software Engineer" (LLM OR Bedrock OR "generative AI") remote
site:indeed.ca "Machine Learning Engineer" software backend remote Canada
site:wellfound.com software engineer AI remote canada
```

### Priority 3: Platform / Data Engineering (adjacent pivots)

Adjacent roles the backend + data-pipeline experience supports.

```
site:linkedin.com/jobs "Platform Engineer" (Kubernetes OR AWS) remote Canada
site:linkedin.com/jobs "Data Engineer" (Databricks OR Kafka) remote Canada
site:indeed.ca "API Engineer" OR "Integration Engineer" Java remote
```

### Priority 4: Broader Software Roles (wider net)

```
site:linkedin.com/jobs "Software Developer" Java OR Python remote Canada
site:indeed.ca "Full Stack Developer" (TypeScript OR React) remote Toronto
site:linkedin.com/jobs "Software Engineer" B2B SaaS remote Canada
```

## CLI Queries (run directly - preferred over WebSearch)

Job Bank Canada (province-filtered; `-p ON` covers the GTA, add `--remote remote` for WFH):
```
bun run .agents/skills/jobbank-canada-search/cli/src/cli.ts search -q "software developer" -p ON --jobage 14 --sort date --format json
bun run .agents/skills/jobbank-canada-search/cli/src/cli.ts search -q "backend developer" -p ON --jobage 14 --format json
bun run .agents/skills/jobbank-canada-search/cli/src/cli.ts search -q "data engineer" -p ON --jobage 14 --format json
bun run .agents/skills/jobbank-canada-search/cli/src/cli.ts search -q "software developer" --remote remote --jobage 14 --format json
```

LinkedIn (city + remote):
```
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "senior software engineer" -l "Toronto, Ontario, Canada" --jobage 14 --format json
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "backend engineer" -l "Remote" --jobage 14 --format json
```

Talent.com (aggregator; catches postings the others miss):
```
bun run .agents/skills/talent-search/cli/src/cli.ts search -q "software developer" -l "Ontario" --jobage 14 --sort date --format json
bun run .agents/skills/talent-search/cli/src/cli.ts search -q "backend developer" -l "Remote" --jobage 14 --format json
```

RemoteOK (fully-remote; -l filters region, optional):
```
bun run .agents/skills/remoteok-search/cli/src/cli.ts search -q "backend engineer" --jobage 14 --format json
bun run .agents/skills/remoteok-search/cli/src/cli.ts search -q "software" -l "Americas" --jobage 14 --format json
```

We Work Remotely (fully-remote software; -c selects category):
```
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts search -q "backend" -c remote-back-end-programming-jobs --jobage 30 --format json
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts search -c remote-full-stack-programming-jobs --jobage 30 --format json
```

## Location Filter

When evaluating results, verify the job location fits James's constraints (remote-first; hybrid acceptable outside the downtown Toronto core; no relocation):
- **Ideal:** Fully remote (Canada) or remote-first
- **Acceptable:** Hybrid in the GTA north/west - Vaughan, Concord, Woodbridge, Thornhill, Markham, Richmond Hill, North York, Mississauga
- **Borderline:** Hybrid in downtown Toronto core (only if infrequent / low-commute-frequency)
- **Too far / disqualifying:** Daily on-site in downtown Toronto; any role requiring relocation

## Salary Filter

Target ~CAD 120k. Flag postings clearly below this unless there's a compelling non-comp hook (title, growth path, tech, or a personal-interest domain like automotive/robotics/AI/games).

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape ai" -> Priority 2 queries + custom applied-AI queries
- "/scrape backend remote" -> Priority 1 queries filtered to remote-only
