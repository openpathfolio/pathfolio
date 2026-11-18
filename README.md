# 🧭 Pathfolio

**Plan your path from high school to college: career exploration, universities, opportunities, and everything that goes into a strong application, in one free place.**

Pathfolio is an open-source planner for **students and parents**, especially families who are still exploring career paths. It starts with **Texas**, and the project is built so volunteers can add more states.

### 👉 Use it now: **[openpathfolio.github.io/pathfolio](https://openpathfolio.github.io/pathfolio/)**

> No sign-up. No ads. No tracking. Everything a student enters stays in their own browser.

## Features
| | |
|---|---|
| 🧭 **Career quiz** | 18 interest statements (Holland RIASEC model, as used by O*NET) plus favorite subjects and values. You get an interest code and your top career matches. |
| 🗂️ **26 career paths** | Engineering and tech, health, business, law and public service, arts and media, science and agriculture, and aviation and skilled trades |
| 🧰 **Profile-building kit** | For each path: courses, industry certifications, projects, internships, competitions, summer programs, research topics, and reputable places to publish |
| 📌 **Opportunities** | Internships, summer programs, research, competitions and publications. **Published deadlines are highlighted** (closing soon, open, opening soon) and link to the official page as evidence. Refreshed weekly by **AI web research**, with human review before anything goes live. |
| 🌎 **Out-of-state & national** | 35 universities beyond Texas (the Ivy League and other top research universities, flagship publics, nearby states, HBCUs) with out-of-state costs, aid notes and net-price links. Texas rules are never applied to them. |
| 🏫 **Universities** | Texas has 25 schools (public, private, HBCU, liberal arts), labeled Reach, Target or Likely with automatic-admission badges, plus lower-cost pathways |
| 🗓️ **Roadmap** | Generated from the graduation year, with state-specific milestones |
| ✅ **My Plan** | Save anything with one click, add your own goals, track progress, and print or copy the plan |
| 📝 **Application builder** | Add role, hours and impact to plan items, then produce a Common App-style **activities list** (10, with character counters), **honors** (5), a **brag sheet** for recommenders, and a **one-page resume**. Copy or print each. |
| 💾 **Backup & restore** | Download a backup file or copy a private restore link, so data survives cleared browsers and moves between devices |
| 👨‍👩‍👧 **Parents & resources** | Conversation guides, money tips, red flags, curated videos and official links |

## Project structure
```
index.html                         Single-page app (hash routing)
assets/app.js                      App logic (vanilla JS, no build step)
assets/styles.css                  Styles (light/dark, responsive, print)
assets/data/common/registry.js     State registry + study areas
assets/data/common/paths.js        Career paths and profile-building kits
assets/data/common/content.js      Quiz, roadmap, guides, national resources
assets/data/states/tx.js           Texas: universities, rules, essentials, links
assets/data/opportunities.js       GENERATED from data/opportunities/
data/opportunities/curated.json    Human-maintained opportunities
data/opportunities/schema.json     Opportunity data format
data/opportunities/sources/        Output of automated source adapters
scripts/build-opportunities.mjs    Validate + merge → assets/data/opportunities.js
scripts/fetch-opportunities.mjs    Run source adapters (used by the weekly workflow)
scripts/sources/                   One adapter per official source
.github/workflows/                 CI validation + weekly opportunities refresh
```

## Run locally
Open `index.html` in a browser. After editing opportunity data, run:
```bash
node scripts/build-opportunities.mjs
```

## Live site & deployment
Pathfolio is live at **https://openpathfolio.github.io/pathfolio/**.

It is served by GitHub Pages from the `main` branch. Every merge to `main` redeploys automatically within a minute or two; there is no build step.

| Automation | What it does |
|---|---|
| **CI** (`.github/workflows/ci.yml`) | Runs on every pull request and push to `main`. Checks JavaScript syntax and validates state data, career paths, research targets and opportunities. |
| **Refresh opportunities** (`.github/workflows/refresh-opportunities.yml`) | Runs every Monday, or manually. For each scope (national + each live state), a **verify** job re-checks every listing and a **discover** job finds new programs (weekly topic rotation). Results arrive as one pull request with a **coverage report**, for human review. Setup: [docs/AUTOMATION.md](docs/AUTOMATION.md). |
| **Check links** (`.github/workflows/link-check.yml`) | Runs every Wednesday. Checks every external link and keeps one `broken-links` issue current. |

**Running your own copy (fork):** enable **Settings → Pages → Deploy from a branch → `main` / `(root)`** and **Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"**.

## Your data & privacy
Pathfolio has **no accounts and no server database**. A student's profile and plan are stored in the browser's local storage on their own device. To make sure nothing is lost if browser data is cleared:
- **💾 Download backup file**, then save it to Google Drive, iCloud or OneDrive, or email it to yourself. **Restore from file** works on any device.
- **🔗 Copy restore link** creates a private link with the data compressed inside the part after `#`, which browsers never send to the web server. Opening the link restores everything. Treat it like a password.
- The app asks the browser to keep its storage **persistent**, so the browser won't evict it automatically.
- A reminder appears if there's unsaved progress and no backup in the last 14 days.

## Roadmap & how work is tracked
See [docs/ROADMAP.md](docs/ROADMAP.md). Every roadmap item is a [GitHub issue labelled `roadmap`](https://github.com/openpathfolio/pathfolio/issues?q=label%3Aroadmap). Work follows [spec-kit](https://github.com/github/spec-kit) spec-driven development: `specs/NNN-name/` holds the spec, plan and task list, so anyone (human or AI agent) can pick up where the last person stopped. Project memory for contributors and agents: [CLAUDE.md](CLAUDE.md). Principles: [constitution](.specify/memory/constitution.md).

## Contributing
Data corrections, new opportunities and new states are all welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ADDING_A_STATE.md](docs/ADDING_A_STATE.md).

## Disclaimer
Pathfolio is an educational guide, not official admissions or financial advice. Rankings, tuition, admission rules and deadlines change every year. Always verify on official websites.

## License
[MIT](LICENSE) © OpenPathfolio contributors
