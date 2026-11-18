# Implementation Plan: Official University Data Pipeline

**Branch**: `claude/phase-2-university-data` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md) | **Issue**: #14

## Summary
A zero-dependency Node pipeline. It resolves every listed university to its federal UNITID, fetches official College Scorecard figures monthly, suggests unlisted universities, and opens a reviewed pull request. A generated `assets/data/official.js` feeds the app, which prefers official figures over estimates and adds net price after aid, net price by family income, graduation rate and earnings.

## Technical Context
**Language/Version**: Node 20 (scripts, built-in `fetch`), vanilla browser JS
**Dependencies**: none. API: `https://api.data.gov/ed/collegescorecard/v1/schools` (key as `X-Api-Key` header from secret `SCORECARD_API_KEY`)
**Storage**: `data/universities/{scorecard-ids,scorecard,candidates}.json` → generated `assets/data/official.js`
**Testing**: `scripts/test-universities.mjs` (20 tests; fixtures include real API responses); `build-universities.mjs --check` in CI; Playwright with a temporary fixture dataset
**Constraints**: deterministic generated output; no pushes to `main`; the key never enters URLs or logs
**Verified live (2026-11-17)** with the public `DEMO_KEY`: field names, ID-list batching, net price by income (public), range/sort discovery filters, matching for Rice and UT Austin

## Constitution Check
| Principle | Compliance | Status |
|---|---|---|
| I. Privacy | No student data; only public institutional data | ✅ |
| II. Accuracy | Official federal source with retrieval date and link; estimates only as fallback; uncertain matches flagged, never guessed | ✅ |
| III. No deps | Node built-ins only | ✅ |
| IV. Data-driven | Stored JSON → deterministic generated file, validated in CI | ✅ |
| V. Equity | Net price by family income is shown prominently (real affordability, not sticker price) | ✅ |
| VI. Human-in-the-loop | Monthly PR with change, match and discovery summary; discovery is suggestions only | ✅ |
| VII. Spec-driven | This spec, plan and tasks; #14 | ✅ |

## Design
- **`scripts/lib/scorecard.mjs`** (pure): field map, `nameTokens`, `primaryCity`, `matchScore`, `pickMatch` (strong ≥ 0.85 coverage; weak = ≥ 0.5 and same first token, largest school; else unresolved), `toRecord`, `normalizeUrl`, `stableStringify`, `diffRecords`.
- **`scripts/fetch-scorecard.mjs`**:
  1. Resolve unmatched IDs by city/state query.
  2. Fetch figures in batches of 50 IDs. If the API rejects a field, fall back to core fields.
  3. Discovery (national selective + large schools per live state).
  4. Safety: missing key, all lookups failing, or no data returned → exit 1 without writing. Transient errors keep earlier matches.
- **`scripts/build-universities.mjs`**: validate → generate `official.js` → `--check` / `--summary`.
- **Workflow** `refresh-universities.yml`: monthly (4th, 11:29 UTC) plus manual; opens a PR with `peter-evans/create-pull-request@v7`.
- **App**:
  - `officialOf(u)`; `costOf` prefers official figures for estimated (national) entries.
  - The out-of-state total for public universities is calculated as cost of attendance + (out-of-state − in-state tuition), and marked ≈.
  - `officialBlock(u)` shows net price after aid, graduation rate, earnings, and the net-price-by-income table, with the source and retrieval date.
  - Acceptance shows the federal rate when available.
  - State-module tuition stays curated for residents (it's newer and officially sourced).
- **Seed**: 9 UNITIDs pinned as `manual` from live API responses (Rice, UT Austin, Stanford, Harvard, Yale, Columbia, MIT, Princeton, Northeastern).

## Complexity Tracking
| Addition | Why | Simpler alternative rejected |
|---|---|---|
| Name-matching heuristic | IPEDS names differ from common names ("Texas A & M University-College Station") | Hand-entering 60+ UNITIDs is error-prone; the heuristic plus a human-confirmed weak list is safer |
