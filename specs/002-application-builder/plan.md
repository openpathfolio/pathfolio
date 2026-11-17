# Implementation Plan: Application Builder

**Branch**: `claude/phase-1-application-builder` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md) | **Epic**: #11

## Summary
Extend My Plan items with optional application details and activity/honor flags, add an **Application** view with four outputs (activities list, honors list, brag sheet, resume) that can be copied as text and printed, add per-state application hints (Texas first), and move backups to **version 2** with lossless restore of version 1. Pure logic (limits, character counting, text exports, backup migration) goes in a new dependency-free script that is unit-tested in CI with `node:vm`. Rendering stays in `app.js`.

## Technical Context
**Language/Version**: JavaScript (browser ES2020, vanilla); Node 20 for tests
**Primary Dependencies**: none (constitution III). Uses built-in `<dialog>`, `Intl.Segmenter` (with fallback), the Clipboard API (with `prompt` fallback) and print CSS
**Storage**: browser localStorage (`pathfolio:plan`, new `pathfolio:application`); backup JSON v2
**Testing**: `scripts/test-application.mjs` (node:vm, no deps) in CI; Playwright browser smoke test locally (desktop + 390 px)
**Target Platform**: evergreen browsers (desktop, iOS, Android), GitHub Pages
**Project Type**: static single-page web app
**Performance Goals**: editor and counters respond instantly; outputs render in under 100 ms for 50 plan items
**Constraints**: on-device only; one printed US-Letter page for a typical resume; no build step
**Scale/Scope**: up to ~100 plan items per student

## Constitution Check (pre-design)
| Principle | How this plan complies | Status |
|---|---|---|
| I. Privacy | All details stay in localStorage and backups the family owns. No network calls added. Exports go to the clipboard or print only | ✅ |
| II. Accuracy | Limits sourced from Common App conventions, kept in one table. Texas hints link to official pages. Nothing is invented: outputs use only entered data | ✅ |
| III. Static, no deps | New plain script `assets/application.js`; tests use Node built-ins | ✅ |
| IV. Data-driven, state-pluggable | Activity types, limits, verbs and tips live in `common/content.js`. State hints live in `states/<code>.js` (`appHints`), validated in CI | ✅ |
| V. Equity & inclusion | "Family Responsibilities" and "Work (Paid)" are first-class activity types. Phone-friendly, accessible labels and counters | ✅ |
| VI. Human-in-the-loop | No automation involved | n/a |
| VII. Spec-driven | This spec, plan and tasks; issue #11 | ✅ |

## Design
See [research.md](research.md) (decisions), [data-model.md](data-model.md) (entities, validation, migration) and [contracts/](contracts/) (backup v2 format, `PF_APP` logic API, UI contract). Validation steps are in [quickstart.md](quickstart.md).

**Key decisions**
1. **Split logic and UI.** `assets/application.js` exposes a frozen global `PF_APP` with pure functions: `countChars`, `limitStatus`, `weakOpener`, `activityText`, `honorText`, `bragText`, `resumeModel`, `migrateBackup`, `mergePlans`, `normalizeOrders`. `app.js` calls them. CI unit-tests them without a browser.
2. **Details live on the plan item** (`item.details`, `item.isActivity`, `item.isHonor`). Order lives in `pathfolio:application = {activityOrder, honorOrder}`. Orders are normalized against current items (removed ids are dropped, newly flagged ids are appended).
3. **Editor uses `<dialog>`**: a native modal with focus management, labelled inputs and `aria-live="polite"` counters.
4. **Application view `#application`** has tabs: Activities · Honors · Brag sheet · Resume · Tips (state hints). Each document has **Copy** and **Print** buttons. Printing sets `body[data-print="<doc>"]` so only that document prints.
5. **Backup v2** adds `application` orders and item details. `migrateBackup()` upgrades v1 (no details or orders). For versions above 2 it imports known fields and returns a warning. Merge keeps existing details unless they're empty.
6. **Restore-link size warning** when the link exceeds 2,000 characters (recommend the file instead).

## Project Structure
```text
specs/002-application-builder/   spec.md, plan.md, research.md, data-model.md, quickstart.md, contracts/, tasks.md, checklists/
assets/application.js            NEW: pure logic (PF_APP), loaded before app.js
assets/app.js                    detail editor, flags, Application view, backup v2 wiring
assets/styles.css                editor, application tabs, documents, print rules
assets/data/common/content.js    APP_LIMITS, ACTIVITY_TYPES, RECOGNITION_LEVELS, TIMING, STRONG_VERBS, WEAK_OPENERS, APP_TIPS
assets/data/states/tx.js         appHints (ApplyTexas, UT Austin expanded resume, with sources)
index.html                       nav item, #application section, editor <dialog>, script tag
scripts/test-application.mjs     NEW: unit tests for PF_APP (node:vm)
scripts/validate-data.mjs        + appHints validation
.github/workflows/ci.yml         + node scripts/test-application.mjs
docs/, CLAUDE.md, README.md      docs updates
```
**Structure Decision**: single static app. One new logic file keeps `app.js` manageable and makes the logic testable without a bundler.

## Constitution Check (post-design)
No new violations. The new file and test script add no dependencies. Backup compatibility is preserved, which satisfies the Technical Constraints on backup versioning.

## Complexity Tracking
| Addition | Why needed | Simpler alternative rejected because |
|---|---|---|
| Separate `assets/application.js` | Unit-test pure logic in CI without a browser or bundler | Keeping it inside the `app.js` IIFE makes it untestable without Playwright, which isn't a dependency in CI |
| `pathfolio:application` order store | Independent ordering of activities and honors | Sorting by a rank field on items complicates reordering and v1 migration |
