# Job Evaluation Framework

## Scoring Dimensions

Evaluate each job posting against these five dimensions:

### 1. Technical Skills Match (0-100)
How well do the required/preferred skills align with the candidate's capabilities?

| Score | Meaning |
|-------|---------|
| 80-100 | Core requirements are primary skills |
| 60-79 | Most requirements match, 1-2 gaps that are learnable |
| 40-59 | Partial match, significant upskilling needed |
| 0-39 | Fundamental mismatch |

**Strong match areas:** Java, backend & REST API design, Kubernetes/Docker, event-driven architecture, high-throughput data pipelines, AWS (Bedrock, ECS, RDS), EDI integrations, applied AI/LLMs, TypeScript/React
**Moderate match areas:** Python (Django/Flask), C#, Scala, SQL (PostgreSQL/Oracle), Databricks, Kafka/AMQ, Azure, full-stack delivery
**Weak match areas:** Formal data science / ML modeling from scratch, mobile development, low-level/embedded, formal CS credential (self-taught background)

### 2. Experience Match (0-100)
Does work history align with what they're looking for?

| Score | Meaning |
|-------|---------|
| 80-100 | Direct experience in the same domain and role type |
| 60-79 | Related experience, transferable skills clear |
| 40-59 | Adjacent experience, would need to make the case |
| 0-39 | Unrelated experience |

**Strong:** Backend/API engineering in B2B SaaS, EDI & retail supply-chain data integration, event-driven systems, applied-AI automation, cross-team delivery / Scrum Master
**Moderate:** Full-stack (TS/React) product work, cloud/data-platform engineering, independent full-stack contract delivery (Partec)
**Entry-level:** People management / team lead (future goal), formal data-science roles, architect-titled roles (doing the work, not yet the title)

### 3. Behavioral/Culture Fit (0-100)
Does the role and company culture match the behavioral profile? (See `02-behavioral-profile.md`.)

| Score | Meaning |
|-------|---------|
| 80-100 | Culture strongly matches behavioral preferences |
| 60-79 | Mixed signals but mostly compatible |
| 40-59 | Some friction areas |
| 0-39 | Significant culture mismatch |

**Strong-fit signals:** autonomy/ownership, transparent leadership, greenfield/build-from-scratch work, AI-forward teams, clear and stable priorities, remote-first.
**Friction signals:** office-first (downtown Toronto core), opaque/"shady" management, rigid heavy process, constant unexplained context-switching.

**Red flags to research:** Department disorganization, work dominated by maintenance over development, opaque leadership, RTO mandates to a downtown core office. Check reviews, media coverage, LinkedIn connections, and network contacts for insider perspective.

### 4. Location & Logistics (Pass/Fail + Notes)
- Fully remote (Canada): PASS (ideal)
- Hybrid outside downtown Toronto core: PASS
- Hybrid in downtown Toronto core (frequent): FLAG (discuss with user)
- Requires relocation: FAIL (deal-breaker)
- Daily on-site downtown Toronto: FAIL (deal-breaker)

### 5. Career Alignment & Motivation (0-100)
Does this role advance career goals and contain tasks that energize?

| Score | Meaning |
|-------|---------|
| 80-100 | Strongly aligned with career direction, clear growth path |
| 60-79 | Good role but only partially aligned with long-term goals |
| 40-59 | Decent job but doesn't build toward career goals |
| 0-39 | Dead end or backwards step |

**Career goals:**
- Near term: reach Senior Software Engineer (currently on track at SPS ~early 2027; external Senior roles are a lateral/accelerated path)
- Mid term: move into engineering management (a few years out)
- Long term: engineering leadership up to CTO

**Motivation filter:** Evaluate not just whether he *can* do the tasks, but whether they will *energize* him. Consider:
- Tasks that energize: building things of tangible value, making users' lives easier, novel/interesting problems, applied AI, tech in areas of personal interest (cars, robots, AI, games)
- Tasks that drain: being pulled off active work without a good reason, heavy process/admin for its own sake, opaque environments
- Non-task factors: transparent leadership, autonomy, remote flexibility, a credible growth path toward Senior then leadership

**Life situation alignment:**
- **Security**: Currently employed and not in a rush; can afford to be selective and hold out for strong-fit roles.
- **Flexibility**: Strongly values remote/hybrid flexibility; based in Vaughan, ON.
- **Compensation**: Target ~CAD 120k. Below that needs a compelling non-comp reason (growth, title, tech, mission).
- **Professional development**: Wants a clear path to Senior and, eventually, leadership.

### 6. Salary Benchmark (Optional)

If the salary lookup tool is configured (`salary_data.json` exists), look up the company:
```
python salary_lookup.py "<Company Name>" --json
```

If a city is known from the posting, add `--city "<City>"` to narrow results.

Present findings as:
```
### Salary Benchmark
| Metric | Value |
|--------|-------|
| [Category] index | XX.X (+/-X.X% vs baseline) |
| Overall index | XX.X (+/-X.X% vs baseline) |
```

Interpret results relative to the baseline defined in the data file's metadata. For index-based data, higher typically means above-market compensation. James's target baseline is ~CAD 120k.

If the salary tool is not configured, skip this section.

## Output Format

Present the evaluation as:

```
## Job Fit Evaluation: [Role] at [Company]

| Dimension | Score | Notes |
|-----------|-------|-------|
| Technical Skills | XX/100 | [brief note] |
| Experience Match | XX/100 | [brief note] |
| Behavioral Fit | XX/100 | [brief note] |
| Location | PASS/FAIL | [brief note] |
| Career Alignment | XX/100 | [brief note] |

**Overall Score: XX/100** (weighted average of scored dimensions)

### Verdict: [Strong Fit / Good Fit / Moderate Fit / Weak Fit / Poor Fit]

### Key Strengths for This Role
- [bullet points]

### Gaps to Address
- [bullet points]

### Recommendation
[1-2 sentences: apply/skip/apply with caveats]

### Company Research Checklist
- [ ] Checked company website (mission, values, recent news)
- [ ] Checked review sites (Glassdoor, Blind, etc.)
- [ ] Checked LinkedIn for team size, recent hires, connections
- [ ] Checked media for restructuring, growth, or workplace issues
- [ ] Identified network contacts who may know the team/manager
```

## Weighting
- Technical Skills: 30%
- Experience Match: 25%
- Behavioral Fit: 15%
- Career Alignment: 30%

(Location is pass/fail, not weighted)

## Thresholds
- **Strong Fit** (75+): Definitely apply, tailor everything
- **Good Fit** (60-74): Apply, address gaps in cover letter
- **Moderate Fit** (45-59): Consider carefully, discuss with user
- **Weak Fit** (30-44): Probably skip unless strategic reasons
- **Poor Fit** (<30): Skip

**Note on selectivity:** James is currently employed and benchmarking, not urgently searching. Bias toward Strong-Fit roles; a Moderate Fit needs a strong hook (comp, tech, growth, or a personal-interest domain) to be worth the effort.

## Pre-Application: Call the Employer (Best Practice)

Before writing the application, consider whether the candidate should call the contact person listed in the posting. **Only call if there are substantive questions** - never call just to "be remembered."

### When to Suggest Calling
- The posting has unclear or ambiguous requirements
- It's unclear which competencies are essential vs. nice-to-have
- The role description is vague about day-to-day tasks
- There's a named contact person who invites questions

### Good Questions to Ask
- "What are the primary challenges in this role?"
- "How is time typically divided across the listed responsibilities?"
- "Which competencies are most critical for success in this position?"
- "What does success look like in the first 6-12 months?"

### Rules for the Call
- Prepare a 30-second "elevator pitch" about your background in case they ask
- The call's purpose is **gathering information**, not delivering a pitch
- Take notes - use what you learn to tailor the application
- Reference the conversation naturally in the cover letter ("After speaking with [name], I was especially drawn to...")
