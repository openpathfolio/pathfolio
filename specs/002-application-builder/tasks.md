# Tasks: Application Builder

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/](contracts/), [research.md](research.md), [quickstart.md](quickstart.md) · **Epic**: #11
**Format**: `[ID] [P?] [Story] Description`. `[P]` = parallelizable (different files, no unmet dependency).
**Tests**: included, because plan.md and quickstart.md require `scripts/test-application.mjs` in CI.
**Resume rule**: continue from the first unchecked task, and keep checkboxes current in every PR.

## Phase 1: Setup
- [X] T001 Create spec folder `specs/002-application-builder/` (spec, plan, research, data-model, contracts, quickstart, tasks)
- [X] T002 [P] Add constants to `assets/data/common/content.js`: `APP_LIMITS = {activities: 10, honors: 5, position: 50, org: 100, description: 150, honorTitle: 100, hoursWarn: 40, weeksMax: 52}`, `ACTIVITY_TYPES` (Common App list from research.md §2), `RECOGNITION_LEVELS = ["School","State/Regional","National","International"]`, `TIMING = {school:"During school year", break:"During school break", year:"All year"}`, `STRONG_VERBS`, `WEAK_OPENERS` (research.md §7), `CAT_TO_TYPE` default mapping, `APP_TIPS`

## Phase 2: Foundational (blocks all stories)
- [X] T003 Create `assets/application.js` exposing a frozen global `PF_APP` per `contracts/pf-app-api.md`: `countChars` (Intl.Segmenter grapheme, fallback Array.from), `limitStatus`, `weakOpener`, `cleanDetails` ("Empty strings, empty arrays and `null` are removed on save"), `gradesLabel`, `normalizeOrders` (drop missing/unflagged ids, append newly flagged, dedupe; idempotent), `included(order, n)`
- [X] T004 Add `<script src="assets/application.js">` after the data files and before `assets/app.js` in `index.html`
- [X] T005 Create `scripts/test-application.mjs` (node:vm, zero deps) with tests for T003 functions, including emoji/accents counting and normalizeOrders idempotence
- [X] T006 Add `node scripts/test-application.mjs` step to `.github/workflows/ci.yml`

## Phase 3: User Story 1 · Record application details (P1) 🎯 MVP
**Goal**: any plan item can hold optional details that persist. **Independent test**: quickstart scenario 1.
- [X] T007 [US1] Add editor `<dialog id="detailDialog">` to `index.html` with labelled fields: type (select ACTIVITY_TYPES), position (limit 50), org (limit 100), description (limit 150), grades 9–12 checkboxes, timing checkboxes, hoursPerWeek (number ≥ 0; warn if > 40), weeksPerYear (0–52; warn if > 52), continueInCollege, impact, link (https only), honorTitle (limit 100), recognition (select RECOGNITION_LEVELS), honorGrades 9–12; counters with `aria-live="polite"`; weak-opener tip slot
- [X] T008 [US1] In `assets/app.js`: open/populate/save the dialog; save via `PF_APP.cleanDetails`; live counters via `PF_APP.limitStatus`; weak-opener tip via `PF_APP.weakOpener`; hours/weeks soft warnings; default `type` from `CAT_TO_TYPE`
- [X] T009 [US1] In `assets/app.js` `renderPlan`: "✎ Details" button per item and a one-line summary ("Build lead · Gr 10–11 · 5 h/wk · 30 wk/yr")
- [X] T010 [P] [US1] Styles for the dialog, counters (`.over` warning), summary line and tips in `assets/styles.css` (phone-friendly)

## Phase 4: User Story 2 · Activities list (P1)
**Goal**: mark, order and refine activities; top 10 included. **Independent test**: quickstart scenarios 2–3.
- [X] T011 [US2] In `assets/app.js`: "Activity" and "Honor" toggles on plan rows; persist `isActivity`/`isHonor`; store orders in `pathfolio:application` normalized via `PF_APP.normalizeOrders` on every render and save
- [X] T012 [US2] Add the `#application` section with a tablist (Activities · Honors · Brag sheet · Resume · Tips) to `index.html`, and an "Application" nav item after My Plan
- [X] T013 [US2] Render the Activities tab in `assets/app.js`: ordered cards, "Included" vs "Not included (limit 10)", ↑/↓ buttons, Edit opens the dialog, per-field counters and "over limit"/"incomplete" flags, empty state with links to My Plan and career paths
- [X] T014 [US2] Add `PF_APP.activityText(items, limits)` in `assets/application.js` (numbered, Common App field order, "⚠ over limit" markers) and tests in `scripts/test-application.mjs`

## Phase 5: User Story 4 · Export documents (P1)
**Goal**: four outputs, each copyable and printable. **Independent test**: quickstart scenario 5.
- [X] T015 [US4] Add `PF_APP.honorText`, `PF_APP.bragText`, `PF_APP.resumeModel` (entered data only, FR-007) in `assets/application.js`, with tests
- [X] T016 [US4] Render Brag sheet and Resume tabs in `assets/app.js` from `resumeModel`, with a "what I want my recommender to know" note stored in `pathfolio:application.note`
- [X] T017 [US4] Copy (Clipboard API with `prompt` fallback) and Print buttons per document in `assets/app.js`; print sets `body[data-print]` and clears it on `afterprint`
- [X] T018 [P] [US4] Print CSS in `assets/styles.css`: show only `[data-doc=<doc>]`, hide nav and controls, resume fits one US-Letter page for typical content
- [X] T019 [P] [US4] Add `appHints` to `assets/data/states/tx.js` (ApplyTexas, UT Austin expanded resume, Texas A&M admissions, each with an https source) and render them in the Tips tab with general Common App tips (`APP_TIPS`)
- [X] T020 [US4] Validate optional `appHints` (`t`, `d`, https `url`) in `scripts/validate-data.mjs`

## Phase 6: User Story 3 · Honors list (P2)
**Goal**: top 5 honors with title, grades and recognition. **Independent test**: quickstart scenario 4.
- [X] T021 [US3] Render the Honors tab in `assets/app.js`: ordered, "Included" vs "Not included (limit 5)", honorTitle counter (limit 100), "incomplete" when recognition is missing, ↑/↓, Edit

## Phase 7: User Story 5 · Data safety, backup v2 (P1)
**Goal**: lossless v1 restore; v2 includes details and orders. **Independent test**: quickstart scenario 6.
- [X] T022 [US5] Add `PF_APP.migrateBackup(data, 2)` and `PF_APP.mergePlans(current, incoming)` (merge rules from data-model.md) in `assets/application.js`, with tests for v1, v2, v3 ("newer" warning) and non-Pathfolio input
- [X] T023 [US5] Add v1 fixture `scripts/fixtures/backup-v1.json` (the shape produced by the current release) and use it in `scripts/test-application.mjs`
- [X] T024 [US5] In `assets/app.js`: `BACKUP_VERSION = 2`; `snapshot()` includes `application`; `applyBackup` uses `migrateBackup` and `mergePlans`, restores orders and note, and shows the "newer version" warning; restore link over 2,000 characters shows a "use the backup file" note

## Phase 8: Polish & cross-cutting
- [X] T025 [P] Update `CLAUDE.md` (repo map, commands, backup v2 convention), `README.md` features table, `docs/ROADMAP.md` Phase 1 status
- [X] T026 [P] Fix the remaining broken link from #26: Texas A&M aid → `https://www.tamu.edu/admissions/costs-tuitions.html` in `assets/data/states/tx.js`
- [X] T027 Full regression: syntax, `test-application`, `validate-data`, `build --check`, Playwright smoke test (desktop + 390 px, no console errors, quickstart 1–7)
- [ ] T028 PR: `Closes #11`, spec link, tasks completed

## Dependencies
- T002 → T003 → (T004, T005) → T006
- US1 (T007–T010) → US2 (T011–T014) → US4 (T015–T020) and US3 (T021)
- US5 (T022–T024) needs only T003, so it can run after the Foundational phase
- Polish last

## Parallel examples
- After T003: T005 (tests) ∥ T004 (script tag) ∥ T010 (styles)
- In US4: T018 (print CSS) ∥ T019 (TX hints) once T015 is done

## Implementation strategy
MVP is US1 + US2 (details + activities list), the highest-value output. Then US4 exports, US5 backup safety (required before release, because details must survive backups), and US3 honors. All of it ships in one PR, since US5 must accompany any change to stored data.
