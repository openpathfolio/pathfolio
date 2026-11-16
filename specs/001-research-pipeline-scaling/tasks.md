# Tasks: Scale the opportunity research pipeline

**Input**: [spec.md](spec.md), [plan.md](plan.md) · **Epic**: #3
**Format**: `[ID] [P?] [Story] Description`. `[P]` = can run in parallel (different files).
**Resume rule**: continue from the first unchecked task, and keep checkboxes current in every PR.

## Phase 1: Setup
- [x] T001 Create `specs/001-research-pipeline-scaling/` with spec, plan, tasks (this file)
- [x] T002 [P] Add `CLAUDE.md`, constitution, PR template, roadmap issue template, Copilot instructions

## Phase 2: Foundational (blocks the other stories)
- [x] T003 [US2] `scripts/validate-data.mjs`: load registry/paths/content/states in `node:vm`; validate state fields, universities, rankRules, roadmapExtras keys, STATE_LIST ↔ index.html script tags, career paths (#5)
- [x] T004 [US2] Deliberate-fault check: bad area, bad region, http link, duplicate id, missing script tag → each reported; revert
- [x] T005 [US2] Add `node scripts/validate-data.mjs` to `.github/workflows/ci.yml`

## Phase 3: User Story 1 · Verify/discover per scope (P1) · #6 🎯
- [x] T006 [US1] `scripts/research-matrix.mjs`: scopes = US + available states; jobs; topic by ISO week; filters from inputs; prints matrix JSON
- [x] T007 [P] [US1] `.github/prompts/opportunity-verify.md` (merge-safe, scope-limited, never guess dates)
- [x] T008 [P] [US1] `.github/prompts/opportunity-discover.md` (topic rotation, targets first, `targetSuggestions`, cap)
- [x] T009 [US1] Migrate `sources/web-research.json` → `research-verify-US.json`, `research-verify-TX.json`, `research-discover-TX.json`; delete legacy file; output unchanged (`--check` passes)
- [x] T010 [US1] Rewrite `refresh-opportunities.yml`: plan → research (matrix, artifacts) → publish (one PR); issue engine posts both prompts
- [x] T011 [US1] `build-opportunities.mjs`: accept `scope`/`job`/`topic`/`targetSuggestions` keys in research files; list target suggestions in the summary
- [x] T012 [US1] Remove superseded `.github/prompts/opportunity-research.md`; update references

## Phase 4: User Story 3 · Targets (P2) · #4
- [x] T013 [P] [US3] `data/opportunities/targets.schema.json`
- [x] T014 [P] [US3] `targets/TX.json`: all 25 universities + medical centers, agencies, TXSEF, with homepages + search hints
- [x] T015 [P] [US3] `targets/US.json`: national agencies and programs
- [x] T016 [US3] Validate targets in `validate-data.mjs` (incl. every TX university covered)

## Phase 5: User Story 4 · Coverage report (P2) · #7
- [x] T017 [US4] `--since DATE` coverage table per scope (total, verified, new, changed, unchecked ids, stale)
- [x] T018 [US4] Test with a sample run; check the summary output

## Phase 6: User Story 5 · Stale indicators (P2) · #8
- [x] T019 [US5] `oppCard`: stale (60+ days) warning badge, unverified muted note; styles
- [x] T020 [US5] Browser test: desktop + 390px, no console errors

## Phase 7: User Story 6 · Link checker (P3) · #9
- [x] T021 [US6] `scripts/check-links.mjs` (extract, dedupe, concurrency, HEAD→GET, classify, Markdown report)
- [x] T022 [US6] Test against a local HTTP server (200/404/403/timeout)
- [x] T023 [US6] `.github/workflows/link-check.yml` (weekly; create/update/close `broken-links` issue)

## Phase 8: Polish
- [x] T024 [P] Update `docs/AUTOMATION.md`, `CLAUDE.md`, `README.md` automation table, `scripts/sources/README.md`
- [x] T025 Full regression: syntax, `validate-data`, `build --check`, browser smoke test
- [ ] T026 PR: `Closes #4 #5 #6 #7 #8 #9`, refs #3; #10 stays open (human check)

## Dependencies
T003–T005 → everything else. T006–T012 (US1) before T017 (coverage reads scope metadata). US3, US5 and US6 are independent of each other.
