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
| 📌 **Opportunities** | Internships, summer programs, research, competitions and publications. Filter by type, area, grade and cost. Refreshed weekly by a GitHub Action, with human review before anything goes live. |
| 🏫 **Universities** | Texas has 25 schools (public, private, HBCU, liberal arts), labeled Reach, Target or Likely with automatic-admission badges, plus lower-cost pathways |
| 🗓️ **Roadmap** | Generated from the graduation year, with state-specific milestones |
| ✅ **My Plan** | Save anything with one click, add your own goals, track progress, and print or copy the plan |
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
| **CI** (`.github/workflows/ci.yml`) | Runs on every pull request and push to `main`. Checks JavaScript syntax and validates opportunity data. |
| **Refresh opportunities** (`.github/workflows/refresh-opportunities.yml`) | Runs every Monday, or manually from the Actions tab. Fetches from source adapters and opens a pull request for human review. |

**Running your own copy (fork):** enable **Settings → Pages → Deploy from a branch → `main` / `(root)`** and **Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"**.

## Contributing
Data corrections, new opportunities and new states are all welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ADDING_A_STATE.md](docs/ADDING_A_STATE.md).

## Disclaimer
Pathfolio is an educational guide, not official admissions or financial advice. Rankings, tuition, admission rules and deadlines change every year. Always verify on official websites.

## License
[MIT](LICENSE) © OpenPathfolio contributors
