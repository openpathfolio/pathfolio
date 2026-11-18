# Pathfolio Roadmap

_Last updated: November 2026_

**Where we are:** Texas is live (25 universities, 26 career paths, 18 opportunities), with weekly AI research, deadline highlighting, backup/restore, and CI.
**Where we're going:** one place for any US family to plan from high school to college admission, for every state.

> **Status lives in GitHub issues**: [`label:roadmap`](https://github.com/openpathfolio/pathfolio/issues?q=label%3Aroadmap). Epics: Phase 0 #3 · Phase 1 #11 · Phase 2 #12 · Phase 3 #22 · Phase 4 #23. Specs live in `specs/`.

This roadmap is ordered so each phase makes the next one cheaper. Effort estimates: **S** = a day or two, **M** = about a week, **L** = several weeks (volunteer pace).

---

## Phase 0: Make the research pipeline scale (do first) · M · #3 · spec `specs/001-research-pipeline-scaling/`

The first weekly run (Nov 16) **verified 8 of 17 listings and discovered 1 new program** (cap 20). One run does both jobs and runs out of budget. Adding states multiplies the work, so fix this before expanding.

| # | Task | Why |
|---|---|---|
| 0.1 | **Split the research into two jobs**: `verify` (check existing listings) and `discover` (find new ones), each with its own budget | Verification currently crowds out discovery |
| 0.2 | **Run one job per state** (a GitHub Actions matrix over the live states) and **rotate**: each state verified every 2 weeks, discovery in topic rotation (STEM → health → business/law → arts/trades) | Keeps each run small, predictable and within plan limits |
| 0.3 | **Seed lists of official program pages**: `data/opportunities/targets/<state>.json` lists each university's pre-college, summer-research and outreach pages, plus agencies and science fairs | Targeted checks beat open-ended search; makes discovery repeatable |
| 0.4 | **Coverage report in every PR**: "verified 17/17, 5 new, 2 deadlines changed, 3 not re-checked" | Reviewers can see gaps at a glance |
| 0.5 | **Stale-data badges in the app**: show "not re-checked in 60+ days" | Families know what to double-check |
| 0.6 | **Weekly link checker** (opens an issue listing broken links) | 100+ links across states will decay |
| 0.7 | **Validate state files in CI** (required fields, valid areas, https links, no duplicate ids) | State data is not schema-checked today; needed before outside contributors add states |
| 0.8 | **Human follow-up from run #1**: confirm the picoCTF status note ("now CyLab Security Academy") before relying on it | AI notes need human confirmation |

---

## Phase 1: Application builder (finishes the core promise) · M · #11 · spec `specs/002-application-builder/`

The goal is "track everything → easily create the application".

| # | Task |
|---|---|
| 1.1 | Plan items gain optional **details**: dates, grade levels, hours/week, weeks/year, role/position, impact/results, links |
| 1.2 | **Common App-style activities export**: top 10 activities with 50-character position and 150-character description fields, character counters, and suggestions for strong verbs |
| 1.3 | **Honors export** (top 5) from certifications and awards |
| 1.4 | **Brag sheet** for recommenders, and a **one-page resume** (print/PDF) |
| 1.5 | **ApplyTexas** and state-application variants as states are added |

---

## Phase 2: Multi-state expansion · L (repeats per state) · #12

### 2.1 Data model changes (once) · M
- **Home state vs. states to explore.** The home state decides residency, automatic-admission rules, state aid and in-state tuition. Families should also be able to browse other states' universities.
- **Universities get in-state and out-of-state tuition** (`tuitionIn`, `tuitionOut`) and an optional regional-discount program:
  - WUE (Western states)
  - Midwest Student Exchange
  - SREB Academic Common Market (Southern states)
- **Rules apply only to residents.** Texas's top-10% rule should not show for a California student browsing Texas schools.
- **A national tier** of highly selective private and flagship universities that families in every state consider (MIT, Stanford, Georgia Tech, Purdue, UIUC, Michigan…). ✅ Done in spec `specs/003-national-tier/` (#16), with residency-aware costs; the full home vs. explore-state profile remains in #13.
- **Opportunities are already state-aware** (`states: ["US"]` or a state code); no change needed.

### 2.2 Automated baseline from official data · M
- ✅ **Done in spec `specs/004-university-data-pipeline/` (#14):** monthly official-data refresh plus discovery, with reviewed PRs. Original plan: build a **College Scorecard adapter**. Scorecard is the US Department of Education's official API (free key from api.data.gov). For every college in a state it provides in-state and out-of-state tuition, acceptance rate, size, graduation rate and earnings.
- The adapter generates a **draft** university list per state. Humans and AI add what Scorecard lacks: notable programs, automatic-admission rules, aid promises, regions.
- Scorecard data lags about one year, so label it with its year.

### 2.3 AI-drafted, human-reviewed state packs · S per state
A **"Draft a state"** workflow (manual trigger, state code as input) uses the research instructions to draft `states/<code>.js` from the Scorecard baseline plus official sources, with a citation on every rule and figure, then opens a PR. A **state captain** (a volunteer parent, counselor or student from that state) reviews it.

**Every state pack must research:**
- [ ] Guaranteed or automatic admission (e.g., Texas top 10%, California UC ELC)
- [ ] The state application system and deadlines
- [ ] State merit and need aid (e.g., Florida Bright Futures, Georgia HOPE/Zell, Cal Grant, NY Excelsior)
- [ ] Tuition-free promise programs at public universities
- [ ] Community-college transfer guarantees
- [ ] Graduation requirements that affect admission (e.g., California A–G)
- [ ] Dual enrollment, early college and state magnet/residential STEM schools
- [ ] State science fair, academic league, and FFA/HOSA/SkillsUSA chapters
- [ ] Residency rules and regional tuition-discount programs
- [ ] At least 12 universities across regions and price points, plus pathways
- [ ] An opportunities seed list (`targets/<state>.json`) for weekly research

### 2.4 Suggested order
| Order | State | Why |
|---|---|---|
| 1 | **National tier** (for Texans) | Highest immediate value for current users: out-of-state engineering and CS options with out-of-state costs |
| 2 | **California** | Largest number of high-school graduates; the most complex system (UC/CSU/CCC, ELC, A–G, Cal Grant). If the model handles CA, it handles anyone |
| 3 | **Florida** | Large state; Bright Futures; a clear public university system |
| 4 | **Georgia** | HOPE/Zell; Georgia Tech; SREB Academic Common Market |
| 5 | **New York** | SUNY/CUNY; Excelsior Scholarship |
| 6 | **Illinois** | UIUC engineering; MAP grants; Midwest Student Exchange |
| next | Volunteers decide | A state goes live when it has a captain and a reviewed pack |

**Definition of done for a state:** the pack passes CI, the captain approves, at least 15 opportunities exist for that state, it's added to the weekly verify/discover rotation, and it's switched to `available: true`.

---

## Phase 3: Quality, reach & community · ongoing · #22
| # | Task | Effort |
|---|---|---|
| 3.1 | **Spanish translation** (UI text first, then data) | L |
| 3.2 | Accessibility audit (screen readers, keyboard, contrast) | S |
| 3.3 | **Scholarships** as an opportunity type, per state and region | M |
| 3.4 | Custom domain **openpathfolio.org** | S |
| 3.5 | `CODEOWNERS` for state data (captains review their state) | S |
| 3.6 | GitHub Project board, milestones per phase, `good first issue` labels | S |
| 3.7 | Annual August refresh checklist automated as an issue | S |

## Phase 4: Optional extras (only if families ask) · L · #23
- **Optional sync to the family's own cloud** (e.g., a file in their own Google Drive). No Pathfolio server, no accounts.
- **Counselor share view**: a read-only printable plan.
- **Shareable career-path comparisons.**

---

## Guardrails (all phases)
- **Privacy:** no accounts, no server-side student data, no analytics.
- **Accuracy:** official sources only, never guessed dates, every change reviewed by a person, evidence links on every published date.
- **Cost:** AI usage stays within one subscription by rotating states and topics, with turn limits per job.
- **Equity:** free and paid-to-student programs first, every career cluster (not only STEM), and affordable options in every state.

## Suggested sequence
| When | Focus |
|---|---|
| Next 2 weeks | Phase 0 (pipeline scaling, CI validation for state files) |
| Weeks 3–4 | Phase 1 (application builder) |
| Weeks 5–6 | Phase 2.1–2.3 tooling + national tier |
| Then, every 2–3 weeks | One new state, as captains volunteer |
| Ongoing | Phase 3 |
