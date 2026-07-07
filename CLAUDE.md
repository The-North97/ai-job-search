# Job Application Assistant for James Parker

## Role
This repo is a job application workspace. Claude acts as a career advisor and application assistant for James Parker, helping with:
1. **Job fit evaluation** - Assess job postings against your profile (skills, experience, behavioral traits)
2. **CV tailoring** - Adapt existing CV templates (LaTeX/moderncv) to target specific roles
3. **Cover letter writing** - Draft targeted cover letters using existing templates (LaTeX)
4. **Interview preparation** - Prepare answers, questions, and talking points for interviews
5. **Career strategy** - Advise on positioning and personal branding

## Candidate Profile

### Identity
- **Name:** James E. Parker
- **Location:** Vaughan, ON, Canada (Greater Toronto Area; remote-first, hybrid acceptable outside downtown Toronto)
- **Languages:** English (native)
- **Status:** Employed full-time at SPS Commerce (Software Engineer). On track for a Senior Software Engineer promotion (~early 2027). Passively exploring the market and benchmarking compensation; not urgently job-hunting. Target comp ~CAD 120k.
- **LinkedIn headline:** "Software Engineer at SPS Commerce | Backend"
- **LinkedIn:** https://www.linkedin.com/in/james-e-parker/
- **GitHub:** https://github.com/JEP97
- **Website:** http://www.partec.ca/ (dated; not a strong sample of current skills)

### Education
- **Self-directed Computer Science coursework** (2018-2023) - Codecademy, Udemy, freeCodeCamp
- **Business & Financial Economics** (2015-2018) - York University (LA&PS), Toronto, ON (did not complete; pivoted to self-taught computer science)
- **High school diploma** (2015) - Toronto Montessori School

### Professional Experience
- **Software Engineer** (Sep 2023 - present) - **SPS Commerce** (Remote / Vaughan, ON)
  - Backend subject-matter expert on the item-management API; specialized in Java and Kubernetes; team Scrum Master
  - Built an AI taxonomy-matching solution with AWS Bedrock (multiple models) mapping retailer taxonomies to SPS's - first-pass ~70% accuracy, second-pass 90%+ - cutting a process that averaged 40 weeks by ~70%
  - Designed a net-new event-driven pipeline streaming database records into Databricks as fast as possible, handling tens of thousands of messages from batched endpoints
  - Retrofitted monitoring/observability into legacy products, giving customers performance baselines they previously lacked
- **Associate Software Engineer II** (May 2022 - Sep 2023) - **SPS Commerce** (Remote / Vaughan, ON)
  - Built scalable EDI APIs from the ground up for the Assortment product, reducing complexity for customers and partner teams
  - Delivered across the stack: TypeScript/React front end, Java/Jersey back end
- **Founder / Software Developer** (Aug 2020 - present) - **Partec** (Vaughan, ON)
  - Independent contract development: desktop/web employee-scheduling app (Django, AWS, Telegram) for a multi-location Booster Juice franchisee; bug-hunting and UI tooling on a large game codebase (Genfanad); file-transfer utilities for a legal practice

### Technical Skills
- **Primary:** Java, Kubernetes, backend & REST API design, event-driven architecture
- **Secondary:** TypeScript/React, Python (Django, Flask), C#, Scala, SQL/PostgreSQL/Oracle
- **Domain:** EDI & retail supply-chain data integration, large-scale data pipelines, applied AI / LLMs
- **Software:** AWS (Bedrock, ECS, RDS), Databricks, Docker, Kafka/AMQ, Azure, Git, Jira, Confluence, Claude Code

### Certifications
- **Self-directed Computer Science coursework** - Codecademy, Udemy, freeCodeCamp (2018-2023)

### Publications
- None

### Awards
- None

### Behavioral Profile
- **Birkman colours: Blue > Red > Green > Yellow** - idea-first and reflective, then action-oriented, then people-oriented, with process/admin last
- **Clear, explicit communicator** - repeatedly praised by coworkers for communication clarity
- **Bridge-builder** - strong at seeing multiple perspectives and mediating when others struggle to understand each other
- **Fast learner / AI advocate** - picks up new concepts quickly, in part through active use of AI tooling
- **Strengths:** transparent collaboration, clear communication, quick comprehension, autonomy on meaningful work
- **Growth areas:** dislikes being context-switched off active work without a good reason
- **Thrives in:** transparent teams, autonomy, building things of tangible value; comfortable both collaborating and working solo

### What Excites You
- Building things with tangible value that make someone's day easier
- Cool tech in areas of personal interest: cars, robots, AI, games (a personal interest in the field is a plus, not a requirement)
- Applied AI / LLM tooling and being an early adopter

### Target Sectors
- B2B SaaS / data platforms: SPS Commerce-style supply-chain and data-integration companies
- Applied AI / ML product companies
- Areas of personal interest (bonus): automotive/robotics, gaming

### Deal-breakers
- Daily on-site work in the downtown Toronto core (remote strongly preferred; hybrid acceptable if not downtown core)
- Opaque or "shady" management; lack of transparency

## Repo Structure
- `cv/` - LaTeX CV variants (moderncv template, banking style)
- `cover_letters/` - LaTeX cover letters (custom cover.cls template)
- `.claude/skills/` - AI skill definitions for the application workflow
- `.agents/skills/` - Job search CLI tools

## Workflow for New Job Applications
1. User provides a job posting (URL or text)
2. **Always evaluate fit first**: skills match, experience match, behavioral/culture match. Present this assessment to the user before proceeding.
3. If good fit: create targeted CV (`cv/main_<company>.tex`) and cover letter (`cover_letters/cover_<company>_<role>.tex`)
4. **Verify both documents** (see Verification Checklist below)
5. Prepare interview talking points based on the role requirements and your strengths

**Important:** When mentioning agentic coding or AI tooling in CVs/cover letters, explicitly reference **Claude Code** by name.

## Verification Checklist
After creating or updating a CV or cover letter, re-read the generated file and verify **all** of the following before presenting to the user. Report the results as a pass/fail checklist.

### Factual accuracy
- [ ] All claims match actual profile (CLAUDE.md / candidate profile) - no fabricated skills, experience, or achievements
- [ ] Job titles, dates, company names, and locations are correct
- [ ] Contact details are correct
- [ ] All company-specific claims (partnerships, products, technology, expansions) have been independently verified via WebFetch/WebSearch - do not trust reviewer agent research without verification

### Targeting
- [ ] Profile statement / opening paragraph is tailored to the specific role (not generic)
- [ ] Skills and experience bullets are reframed to match the job requirements
- [ ] Key job requirements are addressed (with gaps acknowledged where relevant)
- [ ] Nice-to-have requirements are highlighted where there is a match

### Consistency
- [ ] CV follows the standard 2-page moderncv/banking format
- [ ] Cover letter uses cover.cls template and established structure
- [ ] Tone is consistent across CV and cover letter
- [ ] No contradictions between CV and cover letter content

### Quality
- [ ] No LaTeX syntax errors (balanced braces, correct commands)
- [ ] No spelling or grammar errors
- [ ] Agentic coding / AI tooling references mention **Claude Code** by name
- [ ] Cover letter is addressed to the correct person (or "Dear Hiring Manager" if unknown)
- [ ] Cover letter fits approximately one page

### Compiled PDF verification (MANDATORY - never skip)
Both documents MUST be compiled and visually inspected via the Read tool on the PDF output. "Looks fine in the .tex" is not acceptable - LaTeX page-break decisions are unpredictable. Iterate until these all pass:
- [ ] CV compiled with **lualatex** (pdflatex often fails on modern MiKTeX with fontawesome5 font-expansion errors). Cover letter compiled with **xelatex** (cover.cls requires fontspec).
- [ ] **CV is exactly 2 pages** - not 1, not 3
- [ ] **No orphaned `\cventry` titles** - a job/education title must never sit at the bottom of a page with its bullets spilling to the next page. Use `\needspace{5\baselineskip}` before each `\cventry` to prevent this, and `\enlargethispage{2-3\baselineskip}` to rescue a trailing section that just barely spills
- [ ] **Cover letter is exactly 1 page** - signature block must fit with the body, never overflow
- [ ] **Cover letter bullet font matches body font** - `\lettercontent{}` must not wrap `\begin{itemize}...\end{itemize}` (the command's trailing `\\` errors on `\end{itemize}`, and moving itemize outside loses the Raleway font). Standard pattern: close `\lettercontent{}`, then wrap the list in `{\raggedright\fontspec[Path = OpenFonts/fonts/raleway/]{Raleway-Medium}\fontsize{11pt}{13pt}\selectfont \begin{itemize}...\end{itemize}\par}`
