# Interview Preparation Guide

<!-- SETUP: STAR examples are personalized by running /setup based on your actual experience -->

## STAR Format

Structure answers as: **Situation** (context), **Task** (your responsibility), **Action** (what you did), **Result** (outcome).

Keep answers to 1-2 minutes. Be specific. End with what you learned or would do differently.

## Ready-Made STAR Examples

<!-- Drafted from James's SPS Commerce experience. Sharpen the numbers/wording in your own voice before interviews. -->

### 1. AI Taxonomy Matching with AWS Bedrock (applied AI, impact)
**S:** Mapping a retailer's product taxonomy onto SPS's taxonomy was a manual, expert-driven process that averaged around 40 weeks per retailer.
**T:** My team was tasked with automating the obvious matches so specialists could focus only on the hard cases.
**A:** We built a solution on AWS Bedrock, testing several models, that took the retailer's taxonomy and SPS's taxonomy and proposed matches. We designed it as a two-pass system: a first-guess suggestion, and a second guess if the first was rejected.
**R:** First-guess suggestions were ~70% correct; the second guess pushed it to 90%+. The automation cut the overall process time by roughly 70%.
**Use for:** "Tell me about an impactful project", "How have you used AI/ML?", "Describe a time you improved a process"

### 2. Net-New Event-Driven Databricks Pipeline (backend / distributed systems)
**S:** We needed database records available in Databricks as fast as possible, and there was no existing path to do it.
**T:** I owned building the pipeline from scratch.
**A:** I designed an event-driven architecture that streamed data through batched endpoints, tuned to push tens of thousands of messages efficiently rather than relying on slow bulk loads.
**R:** A net-new, high-throughput pipeline that got data into Databricks quickly, unblocking downstream analytics work.
**Use for:** "Describe a system you built from scratch", "How do you handle high throughput/scale?", "Tell me about a technical challenge"

### 3. Retrofitting Monitoring into Legacy Products (ownership, customer value)
**S:** Older products had little observability, so customers had no baseline for how they were performing.
**T:** Add visibility into legacy systems that weren't designed for it.
**A:** I implemented monitoring into the existing legacy architecture and surfaced performance metrics.
**R:** Customers got performance baselines they previously lacked, improving transparency and trust in the products.
**Use for:** "Tell me about improving an existing system", "How do you work with legacy code?", "A time you added value beyond the ticket"

### 4. Scrum Master + Ground-Up EDI APIs (collaboration, communication, delivery)
**S:** As Associate Software Engineer II, I built scalable EDI APIs from the ground up for the Assortment product, serving customers and multiple internal teams; I later became my team's Scrum Master.
**T:** Reduce complexity for consumers of the APIs while keeping cross-team delivery on track.
**A:** I designed the APIs for usability across teams and, as Scrum Master, ran ceremonies and used my communication clarity to bridge gaps when teams misunderstood each other.
**R:** Simpler, more usable EDI APIs adopted across teams, plus smoother cross-team coordination.
**Use for:** "Tell me about a leadership moment", "How do you handle team conflict?", "Describe cross-team collaboration"

<!-- Add more STAR examples as needed. Aim for 4-6 covering different competencies. -->

## Common Tough Questions

### "Why are you looking / leaving SPS Commerce?"
> Note: still employed at SPS and on track for a Senior promotion. Frame positively: exploring roles that accelerate the path to Senior and, longer term, leadership, with more scope in backend/AI work. No negativity about SPS - it's where you grew into a backend SME and Scrum Master.

### "You don't have a formal CS degree."
> Acknowledge it directly, then bridge to a self-taught path that's already produced production systems: net-new EDI and item-management APIs, an AWS Bedrock automation that cut a 40-week process ~70%, and a high-throughput Databricks pipeline. Frame the self-directed CS coursework and fast-learning/AI-advocacy as evidence you close gaps quickly.

### "Where do you see yourself in 5 years?"
> Senior Software Engineer in the near term, growing into engineering management within a few years, with a long-term aim at engineering leadership up to CTO. Tie the ambition to the specific role's growth path.

### "What's your biggest weakness?"
> Genuine version: gets frustrated being pulled off active work without a clear reason. Mitigation: has learned to ask for the "why" behind a re-prioritization and to communicate trade-offs explicitly, which turns the friction into a useful conversation rather than silent frustration.

### "Why this company specifically?"
> Customize per company. Must reference: specific projects, company values, market position, or team structure. Never give a generic answer.

## Questions You Should Ask Interviewers

### About the Role
- "What does a typical week look like in this role?"
- "What would success look like in the first 6 months?"
- "What's the biggest challenge the team is facing right now?"

### About the Team
- "How big is the team, and how do you divide work?"
- "What does the development/project lifecycle look like, from idea to production?"
- "How do you onboard new team members?"

### About Tech & Growth
- "What's your current tech stack for [relevant area]?"
- "Is there room to grow into more architectural or strategic decisions?"
- "How does the team stay current with new tools and methods?"

### About Culture (use these to prevent disappointment)
- "How would you describe the team culture?"
- "What does professional development look like here?"
- "Is there flexibility for remote/hybrid work?"
- "What's the balance between development/new projects and maintenance work?"
- "How would you describe the leadership style in this team?"
- "What do people who thrive here have in common?"

## Phone/Video Interview Tips
- Have STAR examples written out (use this file)
- Keep a glass of water nearby
- Smile when speaking (it changes your tone)
- Ask for clarification if a question is vague
- It's OK to take 5 seconds to think before answering
- End with: "Is there anything else you'd like to know about my background?"

## After the Application (Best Practice)

### Follow-Up Etiquette
- **Don't call to "stand out"** or to learn more about the role post-submission - this risks a negative impression
- If the employer specified a timeline, respect it and wait
- If no timeline was given and significant time has passed (2+ weeks), a brief call to ask about status is acceptable
- If you have genuinely new, relevant information to share, a short follow-up is fine

### Thank-You Notes
- When you receive any update (interview invitation, rejection, or status update), send a brief thank-you message
- Express appreciation for their time and the process
- Keep it short (2-3 sentences)

## Roleplay Guidelines
When the user asks for interview practice:
1. Ask which role/company to simulate
2. Start with easy warm-up questions ("Tell me about yourself")
3. Progress to role-specific technical questions
4. Include 1-2 behavioral questions using the competencies from the job posting
5. End with a tough question or curveball
6. After each answer, give brief feedback: what worked, what to sharpen
7. Suggest which STAR example would work best for each question
