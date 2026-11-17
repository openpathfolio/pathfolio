# CLAUDE.md: project memory for Pathfolio

This is the shared memory for AI agents (Claude Code, Copilot) and human contributors. Read it before starting work, and update it when conventions change.

## What this is
**Pathfolio** (https://openpathfolio.github.io/pathfolio/) is a free, open-source, static web app that helps high-school students and parents plan the path from career exploration to college admission: career quiz, career paths with profile-building kits, universities by state, opportunities with deadlines, roadmap, My Plan, and backup/restore. Texas is live; more states are being added.

**Binding principles:** [.specify/memory/constitution.md](.specify/memory/constitution.md). Privacy by design, official-source accuracy, no build step or dependencies, state-pluggable data, equity, human-reviewed automation, spec-driven work.

## Where work is tracked
- **Roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md) gives the overview. **GitHub issues** labelled `roadmap` are the source of truth for status: one epic per phase (`phase-0` … `phase-4`), with sub-issues per task.
- **Specs:** `specs/NNN-short-name/` (`spec.md`, `plan.md`, `tasks.md`) created with spec-kit. Each epic or issue links its spec folder.
- **To continue someone's work:** open the issue → follow its spec folder → resume from the first unchecked task in `tasks.md`.

## Spec-kit workflow (skills in `.claude/skills/`)
`/speckit-specify` → `/speckit-clarify` (optional) → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` (optional) → `/speckit-implement`
- Specs describe *what* and *why*; plans describe *how*, and include a Constitution Check.
- Keep `tasks.md` checkboxes current as you work, and reference task IDs (e.g. `T012`) in commits.
- PRs: `Closes #<issue>` plus a link to the spec folder. Fill in the PR template.

## Repository map
```
index.html                        Single page; sections are views (hash routing: #quiz, #path/<id>, #opportunities, #plan…)
assets/app.js                     All UI logic (vanilla JS, one IIFE)
assets/application.js             Application-builder pure logic (global PF_APP; limits, exports, backup migration), unit-tested in CI
assets/styles.css                 Theme tokens (light/dark), responsive, print
assets/data/common/registry.js    registerState(), STATE_LIST, AREAS (study-area keys)
assets/data/common/paths.js       26 career paths + kits; employers keyed by state
assets/data/common/content.js     Quiz, roadmap template, pillars, parent tips, national resources
assets/data/states/<code>.js      One module per state (rules, essentials, regions, universities, pathways, links)
assets/data/national.js           NATIONAL: out-of-state/national universities (≈ costs, in/out-of-state tuition, net-price links)
assets/data/official.js           GENERATED from data/universities/ (College Scorecard), never hand-edit
data/universities/                scorecard-ids.json (UNITID matches; humans pin "manual"), scorecard.json, candidates.json
assets/data/opportunities.js      GENERATED, never hand-edit
data/opportunities/               curated.json (humans), schema.json, sources/*.json (automation)
data/opportunities/targets/       Official orgs/pages per scope (US, TX…), checked first by the discover job
scripts/validate-data.mjs         Validates registry, states, career paths, targets (node:vm sandbox)
scripts/build-opportunities.mjs   Validate + merge → assets/data/opportunities.js (--check, --prune, --summary, --since, --missing)
scripts/research-matrix.mjs       Weekly research matrix: scopes (US + live states) × verify/discover, topic rotation
scripts/fetch-opportunities.mjs   Runs source adapters in scripts/sources/
scripts/check-links.mjs           Weekly link checker → one `broken-links` issue
scripts/fetch-scorecard.mjs       Monthly: resolve UNITIDs, fetch official figures, discover candidates (needs SCORECARD_API_KEY)
scripts/build-universities.mjs    Validate + generate assets/data/official.js (--check, --summary); helpers in scripts/lib/scorecard.mjs
.github/prompts/                  opportunity-verify.md, opportunity-discover.md (AI research instructions)
.github/workflows/                ci.yml, refresh-opportunities.yml (plan → research matrix → publish PR), refresh-universities.yml (monthly Scorecard PR), link-check.yml
docs/                             PLAN, ROADMAP, AUTOMATION, ADDING_A_STATE
```

## Commands
```bash
node scripts/test-application.mjs               # PF_APP unit tests: limits, exports, backup v1→v2 (CI)
node scripts/test-universities.mjs              # Scorecard matching/normalization tests (CI)
node scripts/build-universities.mjs --check     # CI: official university data valid + generated file current
node scripts/validate-data.mjs                  # validate states, career paths, research targets, appHints (CI)
node scripts/build-opportunities.mjs            # rebuild opportunities after editing data
node scripts/build-opportunities.mjs --check    # CI: opportunity data valid + generated file current
node scripts/research-matrix.mjs                # which weekly research jobs run (scopes × verify/discover, topic)
node scripts/check-links.mjs --out links.md     # check every external link (weekly in CI)
for f in assets/*.js assets/data/*.js assets/data/*/*.js scripts/*.mjs scripts/sources/*.mjs; do node --check "$f"; done
```
Manual UI check: open `index.html` in a browser at desktop width and at 390px phone width, with no console errors. There is no dev server or build step.

## Conventions
- **No dependencies, no build.** Plain JS with `$`/`$$` helpers and `esc()` for every interpolated string (XSS safety).
- localStorage keys use the prefix `pathfolio:` (`plan`, `profile`, `quiz`, `application`). The backup JSON is **version 2**: `{app:"pathfolio", version: 2, profile, plan, quiz, application}`. Plan items may carry `details`, `isActivity` and `isHonor`. Restores go through `PF_APP.migrateBackup`; keep v1 restorable (fixture: `scripts/fixtures/backup-v1.json`).
- Application field limits live only in `APP_LIMITS` (`common/content.js`). Optional per-state `appHints` (with https sources) feed the Application Tips tab.
- Data facts carry a source. Use `≈` for approximate figures. Never invent dates.
- Opportunity ids are stable lowercase-hyphen slugs. Updates from automation may only touch time-sensitive fields (see `UPDATABLE` in the build script).
- State-specific text belongs in the state module, never in `common/` or `app.js`.
- **Residency:** every university has a `state` (state modules get it automatically from `registerState`). Use `costOf(u)` for any displayed cost (in-state for the family's own state, else out-of-state) and never apply `autoPct`/rank rules to non-residents. National entries never set `autoPct`; CI enforces it.
- **Official data:** never scrape US News or College Board. Official figures come from the College Scorecard via the monthly reviewed PR. In the app, use `officialOf(u)`; official figures replace ≈ estimates only for estimated (national) entries, while curated state-module tuition stays primary for residents.
- Every live scope needs `data/opportunities/targets/<SCOPE>.json` with a target for each university in that state (CI enforces this).
- Research files `sources/research-<verify|discover>-<SCOPE>.json` are merge-safe: agents start from the existing file. Adapter names must not start with `research-`.
- Commit messages: imperative subject, with a body explaining why. No model names in commits or PRs.

## Never
- Store or log student personal data anywhere outside the user's browser.
- Publish data without a PR reviewed by a person, or let automation push to `main`.
- Add npm dependencies, frameworks or a build step without a constitution amendment.
- Hand-edit `assets/data/opportunities.js`.
