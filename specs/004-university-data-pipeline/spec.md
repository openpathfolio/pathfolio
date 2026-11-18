# Feature Specification: Official University Data Pipeline

**Feature Branch**: `claude/phase-2-university-data` (spec folder `004-university-data-pipeline`)

**Created**: 2026-11-17

**Status**: Implemented (see tasks.md)

**Tracking**: #14 (Phase 2, parent #12), expanded from "College Scorecard adapter" to a monthly refresh and discovery workflow.

**Input**: "Do we need a college discovery workflow based on US News, College Scorecard, College Board or other places that we can run monthly to fetch updated data and store in our local dataset?" A `SCORECARD_API_KEY` repository secret is configured.

## Source decision
| Source | Decision | Reason |
|---|---|---|
| College Scorecard API (U.S. Dept. of Education) | **Primary** | Official, public-domain, free API covering every US college: tuition, cost, net price by family income, admission rate, graduation rate, earnings |
| IPEDS / Common Data Set / official university pages | Secondary (human or AI research) | Official, but no simple API |
| US News, College Board | **Not scraped** | Proprietary data. Their terms restrict automated collection and republishing. We keep short, hand-entered rank labels that cite US News |

## User Scenarios & Testing *(mandatory)*

### User Story 1: Official figures replace estimates (Priority: P1)
A parent comparing out-of-state universities sees **official federal figures**: published tuition (in-state and out-of-state), total cost, admission rate. The "≈" estimates appear only where no official figure exists. The source and retrieval date are shown.

**Acceptance Scenarios**:
1. **Given** official data for MIT, **Then** its card shows official tuition and admission rate without "≈", plus a "College Scorecard" source line.
2. **Given** a university with no official match yet, **Then** it keeps its ≈ figures unchanged.
3. **Given** a Texas university with a newer researched tuition (e.g., Rice's 2026–27 figure), **Then** the curated tuition stays primary for that state's residents, and official metrics are added alongside.

### User Story 2: Real cost after aid (Priority: P1)
The parent sees the **average net price after grants** and a **net price by family income** table, which shows what families like theirs actually paid. They also see the **graduation rate** and **median earnings 10 years after enrolling**.

**Acceptance Scenarios**:
1. **Given** official net-price-by-income data, **Then** the card offers a "Net price by family income" table with five bands and a note on what the figures mean.
2. **Given** missing values, **Then** those rows show "—" rather than zero.

### User Story 3: Monthly refresh with human review (Priority: P1)
Once a month, a workflow fetches official figures for every listed university and opens a **pull request** with a summary of changed figures, new or uncertain school matches, and failures. Nothing is published until a maintainer merges it.

**Acceptance Scenarios**:
1. **Given** the secret is set, **When** the monthly workflow runs, **Then** a PR updates `data/universities/scorecard.json` and the generated site file, with a change summary.
2. **Given** a university whose name doesn't clearly match the federal database, **Then** the PR lists it as **"needs confirmation"**, and its match is recorded as weak or unresolved, never silently guessed.
3. **Given** the API is down or the key is missing, **Then** the run fails clearly and nothing is overwritten.

### User Story 4: Discovery of universities we don't list (Priority: P2)
Each run also suggests notable universities not yet in Pathfolio: nationally (highly selective four-year schools) and per live state (larger four-year schools). They appear in the PR as a table for people to decide on. Nothing is added automatically.

**Acceptance Scenarios**:
1. **Given** the discovery query, **Then** the PR lists candidates (name, state, admission rate, size, tuition) excluding schools already listed. For example, the University of Chicago appears.

### Edge Cases
- Several campuses share a city (e.g., UT Health San Antonio vs. UTSA): the best name match wins, and ties prefer the closer, shorter name.
- Abbreviated names (e.g., "Virginia Tech" vs. "Virginia Polytechnic Institute and State University"): weak match, flagged for confirmation.
- A field missing from the API response: stored as null and shown as "—".
- Rate limits (HTTP 429): retry with backoff; a persistent failure fails the run.

## Requirements *(mandatory)*
- **FR-001**: A script MUST resolve each listed university (state modules + national) to its federal ID (UNITID) by city/state search and name matching, storing the match and its quality (`strong`, `weak`, `manual`, `unresolved`) in `data/universities/scorecard-ids.json`. Manual pins are never overwritten.
- **FR-002**: A script MUST fetch, in batches by ID: published in-state and out-of-state tuition, cost of attendance, admission rate, undergraduate size, average net price, net price by five income bands, graduation rate (150% of normal time), median earnings 10 years after entry, school URL and net-price calculator URL. It stores them in `data/universities/scorecard.json` with a retrieval date.
- **FR-003**: A build step MUST generate `assets/data/official.js` deterministically from the stored data (CI `--check`), and write a Markdown summary: changed figures, new, weak and unresolved matches, discovery candidates.
- **FR-004**: The app MUST prefer official figures for universities whose costs are estimates (the national list). For state-module universities, curated tuition stays primary for residents, and official metrics are added. Every official figure carries a source line.
- **FR-005**: A monthly GitHub Actions workflow (plus manual dispatch) MUST run fetch → build → PR. It never pushes to `main`.
- **FR-006**: Discovery MUST produce suggestions only (`data/universities/candidates.json` and the PR table). Inclusion is a human decision.
- **FR-007**: The API key MUST come only from the `SCORECARD_API_KEY` secret and is never logged or committed.
- **FR-008**: Scripts MUST have zero dependencies, and the matching and normalization logic MUST be unit-tested in CI with fixtures taken from real API responses.

## Success Criteria *(mandatory)*
- **SC-001**: After the first run, at least 90% of listed universities resolve to a strong match, and every weak or unresolved one is named in the PR.
- **SC-002**: National-list cards show official tuition for every strongly matched school.
- **SC-003**: A monthly run needs at most a few dozen API requests (well under the key's hourly limit).
- **SC-004**: Zero unreviewed changes reach `main`.

## Assumptions
- Federal data typically lags 1–2 academic years. The site labels figures "most recent federal data", with the retrieval date. Curated, newer, officially sourced figures for state modules stay primary.
- Net price figures are averages for first-time, full-time students receiving federal aid. For public universities they reflect in-state students. The UI says so.
- US News rank labels remain hand-maintained bands with attribution.
