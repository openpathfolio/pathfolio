# Feature Specification: Scale the opportunity research pipeline

**Feature Branch**: `claude/phase-0-research-pipeline` (spec folder `001-research-pipeline-scaling`)

**Created**: 2026-11-16

**Status**: Implemented (see tasks.md)

**Tracking**: Epic #3 · Sub-issues #4, #5, #6, #7, #8, #9 (and #10, a human-only follow-up)

**Input**: "Phase 0: Make the research pipeline scale before adding states. The first weekly run verified 8 of 17 listings and discovered 1 new program (cap 20)."

## User Scenarios & Testing *(mandatory)*

### User Story 1: Complete verification and separate discovery per state (Priority: P1) · #6

As a **maintainer**, I want each weekly refresh to verify *every* listing for each state (and national listings), and to discover new programs in a *separate* budget, so that verification never crowds out discovery and runs stay predictable as states are added.

**Why this priority**: Without this, adding states multiplies an already-incomplete run.

**Independent Test**: Trigger the workflow manually for scope `TX`, job `verify`. The resulting PR's coverage table shows all TX listings verified or explicitly skipped. Trigger `discover` separately; it produces additions without touching verification data.

**Acceptance Scenarios**:
1. **Given** listings in scopes `US` and `TX`, **When** the weekly workflow runs, **Then** one verify job and one discover job run per scope, each writing its own file, and one combined PR is opened.
2. **Given** a verify job that could not re-check a listing this week, **When** the job writes its file, **Then** the previous verification for that listing is kept (not lost).
3. **Given** ISO week *N*, **When** discovery runs, **Then** it focuses on topic `TOPICS[N mod 4]` (STEM → health → business/law/public service → arts/media/trades/agriculture).
4. **Given** a manual run with inputs `scope=TX, job=discover`, **Then** only that job runs.

### User Story 2: State data is validated in CI (Priority: P1) · #5

As a **contributor adding a state**, I want CI to tell me exactly which field in my state file is wrong, so that I can't break the site and reviewers can trust the data's structure.

**Independent Test**: Introduce an invalid area key or a non-https link in `states/tx.js`. CI fails with a message naming the university and field. Revert, and CI passes.

**Acceptance Scenarios**:
1. **Given** a state module with a university whose `region` isn't in `regions`, **When** CI runs, **Then** it fails naming the university id and the field.
2. **Given** an `available: true` state with no `<script>` tag in `index.html`, **Then** CI fails.
3. **Given** current Texas data, **Then** CI passes.

### User Story 3: Targeted discovery from official seed pages (Priority: P2) · #4

As a **maintainer**, I want a list of official organizations and pages per state to check first, so that discovery is systematic and repeatable instead of depending on open-ended search luck.

**Acceptance Scenarios**:
1. **Given** `targets/TX.json`, **Then** every university in `states/tx.js` has a target entry.
2. **Given** the discover job, **When** it finds an official program page not yet in targets, **Then** it records it under `targetSuggestions` in its output for a human to add.
3. **Given** an invalid target file, **Then** CI fails.

### User Story 4: Coverage report in refresh PRs (Priority: P2) · #7

As a **reviewer**, I want each refresh PR to show coverage per scope (verified this run / total, new, changed, unchecked by name, stale), so that I can see gaps before merging.

**Acceptance Scenarios**:
1. **Given** a run date, **When** the summary is generated, **Then** it shows a table per scope and lists unchecked listing ids.

### User Story 5: Families see stale data (Priority: P2) · #8

As a **parent**, I want to see when a listing hasn't been re-checked recently, so that I know to confirm dates on the official site.

**Acceptance Scenarios**:
1. **Given** `lastVerified` older than 60 days, **Then** the card shows "⚠️ Not re-checked in 60+ days".
2. **Given** no `lastVerified`, **Then** the card shows a muted "Not yet verified this cycle" note.
3. **Given** a recent verification, **Then** no warning is shown.

### User Story 6: Weekly broken-link report (Priority: P3) · #9

As a **maintainer**, I want one issue listing broken links each week, so that decay is fixed before families hit dead ends.

**Acceptance Scenarios**:
1. **Given** broken links, **When** the weekly check runs, **Then** a single `broken-links` issue is created or updated with each URL, its file and its status.
2. **Given** sites that block bots (401/403/429), **Then** they are listed separately as "needs a manual check".
3. **Given** no broken links, **Then** an open `broken-links` issue is closed.

### Edge Cases
- A research job fails or times out: other jobs still complete, and the PR notes the missing job.
- A listing belongs to multiple states (`["TX","CA"]`): it is verified in each state's scope; the newest `lastVerified` wins (existing build rule).
- Two jobs edit the same file: impossible by design (one file per scope × job).
- The legacy `sources/web-research.json` is migrated to the new files without losing data.
- Link-check hosts rate-limit: concurrency is capped and retried once.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Research MUST be split into `verify` and `discover` jobs, each with its own prompt (`.github/prompts/opportunity-verify.md`, `opportunity-discover.md`) and turn budget.
- **FR-002**: Jobs MUST run per **scope**: `US` (national listings) plus each `available` state in `STATE_LIST`.
- **FR-003**: Each job MUST write only `data/opportunities/sources/research-<job>-<SCOPE>.json` in the existing `{generatedAt, updates, additions}` format, merging with (not discarding) prior content.
- **FR-004**: Discovery MUST rotate topics by ISO week and cap additions per run (default 10 per scope).
- **FR-005**: A single combined PR MUST be opened per run, with a coverage summary.
- **FR-006**: `scripts/validate-data.mjs` MUST validate registry, career paths, content and every state module, and run in CI.
- **FR-007**: `data/opportunities/targets/<SCOPE>.json` MUST exist for `US` and each available state, validated in CI.
- **FR-008**: `build-opportunities.mjs --summary FILE --since DATE` MUST include per-scope coverage.
- **FR-009**: The app MUST show stale and unverified indicators computed in the browser.
- **FR-010**: `scripts/check-links.mjs` and a weekly `link-check.yml` MUST maintain one `broken-links` issue.
- **FR-011**: All scripts MUST have zero npm dependencies (Constitution III). Generated data MUST stay deterministic (Constitution IV).
- **FR-012**: Automation MUST NOT push to `main`. All changes go through PRs (Constitution VI).

### Key Entities
- **Scope**: `US` or a two-letter state code. Determines which listings a job covers: those with `states` including the scope.
- **Research file**: `research-<verify|discover>-<SCOPE>.json` → `{generatedAt, scope, job, topic?, updates[], additions[], targetSuggestions?[]}`.
- **Target**: `{id, org, kind, state, homepage, pages[{url, kind}], searchHints[], notes}`.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: A weekly run verifies **≥ 95%** of listings in each scope, and names any that weren't verified.
- **SC-002**: Discovery yields **≥ 5** reviewed additions per scope per run on average over 4 weeks (subject to what's published).
- **SC-003**: CI catches 100% of the structural errors in the validation list (tested with deliberate faults).
- **SC-004**: Zero broken links stay unreported for more than 7 days.

## Assumptions
- Live scopes today: `US`, `TX`. New states join automatically when `available: true`.
- Claude (subscription token) is the primary engine. The issue/Copilot engine receives the same prompts.
- External sites may block automated link checks. Those are reported for manual review, not treated as broken.
