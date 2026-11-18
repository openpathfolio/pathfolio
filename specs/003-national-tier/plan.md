# Implementation Plan: National Tier

**Branch**: `claude/phase-2-national-tier` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md) | **Issue**: #16 (+ cost slice of #13)

## Summary
Add `assets/data/national.js` (a `NATIONAL` dataset of 28 universities with in-state and out-of-state costs), a residency-aware cost helper and state-scoped admission rules in `app.js`, a scope selector on Universities, an out-of-state block on career-path pages, and CI validation for the national data.

## Technical Context
**Language/Version**: vanilla JS (ES2020); Node 20 for validation
**Primary Dependencies**: none
**Storage**: static data file; no new student data
**Testing**: `validate-data.mjs` (national checks + fault test), Playwright smoke test (desktop + 390 px)
**Target Platform**: GitHub Pages
**Constraints**: no build step; figures marked ≈ with official links

## Constitution Check
| Principle | Compliance | Status |
|---|---|---|
| I. Privacy | No new personal data | ✅ |
| II. Accuracy | ≈ figures, "as of 2025–26", official cost/net-price link on every entry; Scorecard (#14) will replace | ✅ |
| III. No deps | Plain data file + vanilla JS | ✅ |
| IV. State-pluggable | National data is separate from state modules; residency logic is generic (any home state) | ✅ |
| V. Equity | Includes HBCUs, affordable nearby-state publics, and aid notes, not just elite privates | ✅ |
| VII. Spec-driven | This spec, plan and tasks; #16 | ✅ |

## Design
- **Data**: `NATIONAL = { asOf: "2025–26", regions: [...], universities: [...] }`. A university has `{id, name, state, city, region, type, rankSort, rankLabel, acceptance, tuitionIn, tuitionOut, coaOut, costNote?, sel, areas, notable, aid, links:{home, admissions, cost}}`.
- **Helpers in app.js**:
  - `homeOf(u)`: `u.state` for national entries, otherwise the state module's code.
  - `isResident(u)`: `homeOf(u) === profile.state`.
  - `costOf(u)`: `{tuition, coa, label}`. In-state uses `u.tuition`/`u.coa` (state modules) or `u.tuitionIn`. Out-of-state uses `tuitionOut`/`coaOut`. A state-module university has no out-of-state figure yet; it falls back to its own figure, labelled "resident".
  - `fitFor(u)`: automatic admission only when `isResident(u)`.
- **UI**:
  - Universities: a `#fScope` select (home / national / all). The region options and pathway cards follow the scope. Cards show "Tuition / yr (out-of-state ≈)" and the cost note, and add a "Net price ↗" link.
  - Path pages: a "🌎 Out-of-state & national options" block (top 6 by rank among matching areas).
- **Validation**: extend `validate-data.mjs` to load `national.js` and check FR-006.

## Project Structure
```text
assets/data/national.js       NEW national dataset
index.html                    scope select, script tag, wording
assets/app.js                 residency helpers, scope, path block
scripts/validate-data.mjs     national validation
docs/ADDING_A_STATE.md, CLAUDE.md, README.md, ROADMAP   docs
```

## Complexity Tracking
None.
