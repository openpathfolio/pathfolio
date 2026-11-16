# Implementation Plan: Scale the opportunity research pipeline

**Branch**: `claude/phase-0-research-pipeline` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md) | **Epic**: #3

## Summary
Split weekly AI research into per-scope `verify` and `discover` jobs (GitHub Actions matrix), with each job writing its own merge-safe file. Seed official target lists. Add CI validation for all hand-written data, a per-scope coverage report, in-app stale indicators, and a weekly link checker. Everything stays dependency-free and human-reviewed.

## Technical Context
**Language/Version**: JavaScript (browser ES2020, vanilla), Node.js 20 for scripts
**Primary Dependencies**: none (Node built-ins only). GitHub Actions: `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`, `anthropics/claude-code-action@v1`, `peter-evans/create-pull-request@v7`
**Storage**: JSON files in the repo; browser localStorage (unchanged)
**Testing**: Node scripts with deliberate-fault checks; Playwright browser smoke test locally; CI runs validators
**Target Platform**: GitHub Pages (static) + GitHub Actions (ubuntu-latest)
**Project Type**: Static web app + data pipeline
**Performance Goals**: each research job within `--max-turns` (verify 80, discover 60); link check < 10 min
**Constraints**: no build step, no npm deps, deterministic generated output, no pushes to `main`
**Scale/Scope**: 2 scopes now (US, TX), designed for 50+ states

## Constitution Check
| Principle | Check | Status |
|---|---|---|
| I. Privacy | No student data involved; link checker sends only a generic user agent | ✅ |
| II. Accuracy | Verify job keeps prior evidence when it can't re-check; stale shown to families; coverage shown to reviewers | ✅ |
| III. Static & no deps | All scripts use Node built-ins; no site build step | ✅ |
| IV. Data-driven | New validator covers state modules; generated output stays date-independent (coverage uses `--since` only in the summary) | ✅ |
| V. Equity | Discovery topic rotation guarantees non-STEM coverage | ✅ |
| VI. Human-in-the-loop | Matrix jobs → artifacts → one PR; least-privilege tools per job | ✅ |
| VII. Spec-driven | This spec and plan, with tasks linked to issues #4–#9 | ✅ |

## Design

### Research matrix
`scripts/research-matrix.mjs` loads `registry.js` in a `node:vm` sandbox and prints `{include:[{scope, job, topic, maxTurns, maxNew}]}` for `US` + every `available` state × `[verify, discover]`, filtered by the workflow inputs `scope` and `job`. Topic = `TOPICS[isoWeek % 4]`.

Workflow `refresh-opportunities.yml`:
1. `plan` job → matrix JSON, engine choice, today.
2. `research` job (matrix, `max-parallel: 2`, `fail-fast: false`) → Claude with the job's prompt + env context → uploads `research-<job>-<scope>.json` as an artifact.
3. `publish` job (`if: always()`) → downloads artifacts into `data/opportunities/sources/`, runs `build --prune --summary --since today`, opens one PR. Missing jobs are noted in the PR body.
4. Issue engine: one issue containing both prompts, for Copilot or manual work.

### Merge-safe research files
Prompts instruct the agent to **start from the existing file**:
- `verify` replaces updates for re-checked listings and keeps others.
- `discover` keeps prior additions and appends new ones.

The build already prevents older verifications from overwriting newer ones.

### Migration
Legacy `sources/web-research.json` → `research-verify-<scope>.json` (updates grouped by the listing's scope) + `research-discover-TX.json` (its 1 addition, UTSW STARS). Done by a one-off script, then deleted.

### Validation (`scripts/validate-data.mjs`)
Loads `common/registry.js`, `common/paths.js`, `common/content.js`, `states/*.js` into one vm context and checks the spec's FR-006 list, plus `targets/*.json`. Reports all errors, then exits 1.

### Coverage summary
`--since DATE`: per scope, count = listings in scope; verified = `lastVerified >= since`; unchecked = names; stale = `lastVerified < since−60d` or null.

### UI
`oppCard`: a muted note for `!lastVerified`; a warning badge for an age above 60 days. No data changes.

### Link checker
Extract URLs from `index.html`, `assets/data/**/*.js` and `data/**/*.json`; skip `youtube.com/results` and `example.org`/`example.edu`; dedupe; concurrency 6; HEAD then GET fallback; 15 s timeout; one retry. Classify as ok / blocked (401, 403, 429, 999) / broken (404, 410, 5xx, network). Write Markdown to a file and exit 0. The workflow manages the issue via `gh`.

## Project Structure
```text
specs/001-research-pipeline-scaling/   spec.md, plan.md, tasks.md
.github/prompts/opportunity-verify.md     (new)
.github/prompts/opportunity-discover.md   (new; replaces opportunity-research.md)
.github/workflows/refresh-opportunities.yml (rewritten: plan → research matrix → publish)
.github/workflows/link-check.yml           (new)
.github/workflows/ci.yml                   (+ validate-data)
scripts/research-matrix.mjs                (new)
scripts/validate-data.mjs                  (new)
scripts/check-links.mjs                    (new)
scripts/build-opportunities.mjs            (+ --since coverage, + targetSuggestions passthrough)
data/opportunities/targets/{US,TX}.json, targets.schema.json (new)
assets/app.js, assets/styles.css           (stale indicators)
docs/AUTOMATION.md, CLAUDE.md              (updated)
```
**Structure Decision**: keep the existing single-repo layout. Scripts stay flat in `scripts/`.

## Complexity Tracking
| Addition | Why needed | Simpler alternative rejected because |
|---|---|---|
| 3-stage workflow with artifacts | One PR from parallel per-scope jobs | A single sequential job recreates the original budget problem |
| `node:vm` loading of browser data files | Validate JS modules without a bundler | Converting state files to JSON would break the no-build browser loading |
