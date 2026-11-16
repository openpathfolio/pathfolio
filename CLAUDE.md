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
assets/styles.css                 Theme tokens (light/dark), responsive, print
assets/data/common/registry.js    registerState(), STATE_LIST, AREAS (study-area keys)
assets/data/common/paths.js       26 career paths + kits; employers keyed by state
assets/data/common/content.js     Quiz, roadmap template, pillars, parent tips, national resources
assets/data/states/<code>.js      One module per state (rules, essentials, regions, universities, pathways, links)
assets/data/opportunities.js      GENERATED, never hand-edit
data/opportunities/               curated.json (humans), schema.json, sources/*.json (automation)
data/opportunities/targets/       Official orgs/pages per scope (US, TX…), checked first by the discover job
scripts/validate-data.mjs         Validates registry, states, career paths, targets (node:vm sandbox)
scripts/build-opportunities.mjs   Validate + merge → assets/data/opportunities.js (--check, --prune, --summary, --since, --missing)
scripts/research-matrix.mjs       Weekly research matrix: scopes (US + live states) × verify/discover, topic rotation
scripts/fetch-opportunities.mjs   Runs source adapters in scripts/sources/
scripts/check-links.mjs           Weekly link checker → one `broken-links` issue
.github/prompts/                  opportunity-verify.md, opportunity-discover.md (AI research instructions)
.github/workflows/                ci.yml, refresh-opportunities.yml (plan → research matrix → publish PR), link-check.yml
docs/                             PLAN, ROADMAP, AUTOMATION, ADDING_A_STATE
```

## Commands
```bash
node scripts/validate-data.mjs                  # validate states, career paths, research targets (CI)
node scripts/build-opportunities.mjs            # rebuild opportunities after editing data
node scripts/build-opportunities.mjs --check    # CI: opportunity data valid + generated file current
node scripts/research-matrix.mjs                # which weekly research jobs run (scopes × verify/discover, topic)
node scripts/check-links.mjs --out links.md     # check every external link (weekly in CI)
for f in assets/*.js assets/data/*.js assets/data/*/*.js scripts/*.mjs scripts/sources/*.mjs; do node --check "$f"; done
```
Manual UI check: open `index.html` in a browser at desktop width and at 390px phone width, with no console errors. There is no dev server or build step.

## Conventions
- **No dependencies, no build.** Plain JS with `$`/`$$` helpers and `esc()` for every interpolated string (XSS safety).
- localStorage keys use the prefix `pathfolio:`. The backup JSON is `{app:"pathfolio", version, profile, plan, quiz}`; keep restore backward-compatible.
- Data facts carry a source. Use `≈` for approximate figures. Never invent dates.
- Opportunity ids are stable lowercase-hyphen slugs. Updates from automation may only touch time-sensitive fields (see `UPDATABLE` in the build script).
- State-specific text belongs in the state module, never in `common/` or `app.js`.
- Every live scope needs `data/opportunities/targets/<SCOPE>.json` with a target for each university in that state (CI enforces this).
- Research files `sources/research-<verify|discover>-<SCOPE>.json` are merge-safe: agents start from the existing file. Adapter names must not start with `research-`.
- Commit messages: imperative subject, with a body explaining why. No model names in commits or PRs.

## Never
- Store or log student personal data anywhere outside the user's browser.
- Publish data without a PR reviewed by a person, or let automation push to `main`.
- Add npm dependencies, frameworks or a build step without a constitution amendment.
- Hand-edit `assets/data/opportunities.js`.
