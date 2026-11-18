# Tasks: National Tier

**Input**: [spec.md](spec.md), [plan.md](plan.md) · **Issue**: #16
**Format**: `[ID] [P?] [Story] Description`. **Resume rule**: continue from the first unchecked task.

## Phase 1: Setup
- [X] T001 Create `specs/003-national-tier/` (spec, plan, tasks, checklist)

## Phase 2: Foundational
- [X] T002 Create `assets/data/national.js`: `NATIONAL = {asOf, regions: ["Neighbor states","West","Midwest","Northeast","Southeast"], universities}` with 28 entries (FR-001). Every money figure ≈, `costNote` where tuition varies, https `links.home/admissions/cost`
- [X] T003 Load `national.js` in `index.html` (after state modules, before `application.js`)
- [X] T004 Extend `scripts/validate-data.mjs` for NATIONAL (FR-006): unique ids, 2-letter `state`, region in `regions`, `sel`, `type`, numeric `tuitionIn ≤ tuitionOut ≤ coaOut`, valid `areas`, https links incl. `cost`, 20–30 entries; deliberate-fault check

## Phase 3: User Story 1 + 2 · Browse with honest costs (P1)
- [X] T005 [US1] `assets/app.js`: `homeOf`, `isResident`, `costOf` helpers; `fitFor` applies `autoPct` only when resident (FR-003, FR-004)
- [X] T006 [US1] `index.html` + `assets/app.js`: `#fScope` select (home/national/all); region options follow scope; pathways shown for home scope only; count text names the scope
- [X] T007 [US2] `uniCard`: cost label (in-state vs. out-of-state ≈), `costNote`, budget flag via `costOf`, "Net price ↗" link, state shown, national "as of" note; cost filter and sort use `costOf`

## Phase 4: User Story 3 · Path pages (P2)
- [X] T008 [US3] `renderPath`: "🌎 Out-of-state & national options" block, top 6 matching by `rankSort`, with fit and cost

## Phase 5: Polish
- [X] T009 [P] Docs: `CLAUDE.md` (national data + residency convention), `README.md`, `docs/ROADMAP.md`, `docs/ADDING_A_STATE.md` (how national data relates to states)
- [X] T010 Regression: syntax, unit tests, `validate-data`, `build --check`, Playwright (scope switching, no TX badges on national, budget flags, path block, 390 px, no console errors)
- [X] T011 PR: `Closes #16`, refs #13 #12 (#30)
- [X] T012 Add the 7 remaining Ivy League schools (Harvard was already listed) and an "Ivy League" type filter; raise the national cap to 40

## Dependencies
T002 → T003/T004 → T005 → T006/T007 → T008 → polish.
