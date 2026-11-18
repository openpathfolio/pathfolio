# Tasks: Official University Data Pipeline

**Input**: [spec.md](spec.md), [plan.md](plan.md) · **Issue**: #14
**Format**: `[ID] [P?] [Story] Description`. **Resume rule**: continue from the first unchecked task.

## Phase 1: Setup
- [X] T001 Create `specs/004-university-data-pipeline/` (spec, plan, tasks, checklist)
- [X] T002 Verify API field names, batching, and discovery filters live with `DEMO_KEY` (via a session environment that allows api.data.gov)

## Phase 2: Foundational
- [X] T003 `scripts/lib/scorecard.mjs`: FIELDS, DETAIL_FIELDS, CORE_FIELDS, INCOME_BANDS, nameTokens, primaryCity, matchScore, pickMatch, toRecord, normalizeUrl, stableStringify, diffRecords
- [X] T004 [P] `scripts/fixtures/scorecard-sample.json` (real Rice and UT Austin responses + same-city candidate lists) and `scripts/test-universities.mjs` (20 tests)

## Phase 3: User Story 3 · Monthly refresh with review (P1)
- [X] T005 [US3] `scripts/fetch-scorecard.mjs`: resolve → batch fetch → discovery; key as header; fail-safe on missing key, all-failed lookups or empty results; keep earlier matches on transient errors
- [X] T006 [US3] `scripts/build-universities.mjs`: validate, generate `assets/data/official.js`, `--check`, `--summary` (changes, weak/unresolved, not fetched, discovery tables, checklist)
- [X] T007 [US3] Seed `data/universities/` (empty `scorecard.json` and `candidates.json`; 9 manual UNITID pins from live responses)
- [X] T008 [US3] `.github/workflows/refresh-universities.yml` (monthly + manual, PR via create-pull-request); CI runs unit tests and `build-universities --check`

## Phase 4: User Stories 1 & 2 · Official figures in the app (P1)
- [X] T009 [US1] Load `official.js`; `officialOf`, `costOf` prefers official for estimated entries; federal acceptance; the cost note hides when official
- [X] T010 [US2] `officialBlock`: average net price after aid, graduation rate, median earnings, net price by family income table, source and retrieval date; price-calculator link fallback
- [X] T011 [US1] Browser test with a temporary fixture dataset (curated Rice tuition kept; official Purdue with derived total; MIT still ≈; 390 px; no console errors)

## Phase 5: User Story 4 · Discovery (P2)
- [X] T012 [US4] Discovery queries (national highly selective; large schools per live state), excluding listed schools → `candidates.json` and PR tables

## Phase 6: Polish
- [X] T013 [P] Docs: `docs/AUTOMATION.md` (university refresh section), `CLAUDE.md`, `README.md`, `docs/ROADMAP.md`; update issue #14
- [X] T014 Regression: syntax, all unit tests, validators, earlier browser suites
- [X] T015 PR (stacked on #30): `Closes #14`
- [ ] T016 After merge: run **Refresh university data** manually; review the first PR (confirm weak matches, pin unresolved)
