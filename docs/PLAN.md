# Pathfolio: Product Plan, Requirements & Roadmap

## 1. Vision
A **free, public, open-source** web app for high-school students and parents (starting with Texas, then expanding state by state) who are **still exploring career paths**. It is one place to plan and track the journey from high school to college admission. It helps families:
1. Discover career paths that fit the student's interests, favorite subjects and values. This covers all fields, not just STEM.
2. Understand state-specific admissions (e.g., Texas top-10% / UT top-5% automatic admission, endorsements, FAFSA requirement, tuition promises).
3. Compare universities by study area, region, cost and personal fit.
4. Find current internships, summer programs, research and competitions, refreshed by automation with human review.
5. Build a strong application: **courses, certifications, projects, internships, competitions, summer programs, research and publications**.
6. Turn ideas into a personal, printable plan and a roadmap based on graduation year.

## 2. Users & needs
| User | Needs |
|---|---|
| Parents (often new to the US/Texas system) | Plain-English guidance, costs and aid, how to support without pushing, deadlines, red flags |
| Undecided students (grades 8–12) | Low-pressure career exploration, concrete "what do I do next" steps |
| Decided students | A deep kit for one path: certifications, internships, research, where to publish |
| School counselors / volunteers | A shareable, free, ad-free resource |

## 3. Functional requirements
| ID | Requirement | Status |
|---|---|---|
| FR1 | **Profile** (grade, grad year, class rank, GPA, region, budget, areas of interest) stored locally; drives all personalization | ✅ |
| FR2 | **Texas automatic-admission check** from class-rank percentile | ✅ |
| FR3 | **Career quiz**: 18 RIASEC interest statements + favorite subjects + values; results give the interest code, top 6 paths with match %, grade-specific next steps | ✅ |
| FR4 | **26 career paths across 7 clusters** (tech, health, business, law/public service, arts/design/media, science/environment/agriculture, aviation/trades) | ✅ |
| FR5 | **Path kit** per career: majors, pay/growth, Texas employers, HS courses, certifications, projects, internships, competitions, summer programs, research topics, publication venues, videos | ✅ |
| FR6 | **University explorer**: 25 Texas universities (public, private, HBCU, liberal arts) with filters by area, type, region and cost; Reach/Target/Likely and auto-admit badges | ✅ |
| FR7 | **Alternative pathways**: dual credit, community college transfer, UT PACE, A&M Engineering Academies, TSTC, JAMP, TAMS, apprenticeships | ✅ |
| FR8 | **Build Profile guide**: 7 pillars, research how-to, professor cold-email template, reputable publication venues, red flags | ✅ |
| FR9 | **Roadmap** generated from graduation year with a "You are here" marker | ✅ |
| FR10 | **My Plan**: add items from any page, add custom goals, check off, import milestones, copy as text, print/PDF | ✅ |
| FR11 | **Parent corner** and **Resources** (videos, official national + state links) | ✅ |
| FR12 | **Multi-state**: state registry + per-state data files + state picker | ✅ (TX live) |
| FR13 | **Opportunities**: schema-validated listings, filters, "add to plan", related opportunities on path pages | ✅ |
| FR14 | **Automation**: weekly GitHub Action runs source adapters + AI web research (Claude action, or Copilot via weekly issue) → validates → opens PR with change summary for human review | ✅ |
| FR16 | **Deadline highlighting**: published current-cycle deadlines are badged (closing soon / open / opening soon), sorted soonest first, filterable, with evidence links; upcoming deadlines on home page | ✅ |
| FR17 | **Data safety**: backup file download/restore (merge or replace), compressed restore link in URL fragment, persistent-storage request, backup reminder | ✅ |
| FR15 | **Application export**: Common App-style activities list (150 chars), honors, resume | ⏳ next |

## 4. Non-functional requirements
- Static HTML/CSS/JS only: no backend, no accounts, no cookies, no analytics. **Personal data never leaves the browser** (localStorage).
- Works on phones; light and dark mode; keyboard-accessible; printable.
- Content lives in `assets/data/*.js` so non-programmers can update it through pull requests.
- Every figure is marked approximate with a "researched" date and links to official sources.

## 5. Architecture
```
index.html                         page shell + sections (hash routing: #quiz, #path/<id>, …)
assets/styles.css                  theme tokens, responsive layout, print styles
assets/app.js                      profile, quiz scoring, rendering, plan storage, routing
assets/data/common/registry.js     registerState(), STATE_LIST, AREAS
assets/data/common/paths.js        CLUSTERS, PATHS (career kits; employers per state)
assets/data/common/content.js      quiz, roadmap template, pillars, parent tips, national resources
assets/data/states/<code>.js       one file per state (universities, rules, essentials, links)
assets/data/opportunities.js       generated by scripts/build-opportunities.mjs
data/opportunities/                curated.json, schema.json, sources/*.json (automated)
scripts/                           build/validate + fetch adapters (no dependencies)
.github/workflows/                 ci.yml (validate), refresh-opportunities.yml (weekly PR)
```

### Opportunity data flow
`scripts/sources/*.mjs` (official APIs/feeds) + weekly AI web research (`.github/prompts/opportunity-research.md`) → `data/opportunities/sources/*.json` (full entries, or `{updates, additions}`) → `build-opportunities.mjs` (schema validation; additions can't override existing ids; updates may only change time-sensitive fields; `--prune` removes one-time listings expired >30 days; output is deterministic so CI `--check` is stable) → `assets/data/opportunities.js` → pull request → human review → merge → GitHub Pages.

### Quiz scoring
- Each RIASEC letter is scored 0–100% from three statements rated 0/1/2.
- Path score = 70% weighted match of the path's 3-letter code (weights 1, 0.6, 0.35) + up to 16% for subject matches + 8% for value matches + 4% for profile interest areas.
- Shown as "match %". It is explicitly a conversation starter, not a verdict.

### University fit
- `highly` selective → Reach (Target at the university level if UT top 5%).
- `selective` → Target if top 25% or auto-admit, else Reach.
- `moderate` → Likely if top 25% or auto-admit, else Target.
- `accessible` → Likely if top 50% or auto-admit, else Target.

## 6. Roadmap
See **[ROADMAP.md](ROADMAP.md)** for the phased plan: research pipeline scaling, application builder, multi-state expansion, quality and community.
