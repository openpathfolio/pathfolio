<!--
Sync Impact Report
- Version change: template → 1.0.0 (initial ratification)
- Principles added: I–VII (all new)
- Sections added: Technical Constraints, Development Workflow, Governance
- Templates reviewed: plan-template.md (Constitution Check gates map to I–VII) ✅,
  spec-template.md ✅, tasks-template.md ✅ (no structural change needed)
- Follow-up TODOs: none
-->

# Pathfolio Constitution

Pathfolio is a free, open-source planner that helps high-school students and parents go from career exploration to college admission. These principles are binding on every spec, plan, task and pull request.

## Core Principles

### I. Privacy by Design (NON-NEGOTIABLE)
- Student data (profile, plan, quiz answers) lives **only on the student's device** (browser storage), or in files and links the family controls.
- No accounts, no server-side student data, no analytics, no third-party trackers, no cookies.
- Repository data, logs, automation and AI prompts MUST NOT contain personal data about real students.
- Any feature that would move student data off the device requires an explicit constitution amendment.

### II. Accuracy & Evidence
- Facts that families act on (deadlines, admission rules, costs, eligibility) come from **official sources**: the organization's own site, government data or the university. Each is recorded with a source or evidence link.
- **Never guess or invent dates or figures.** Unknown values stay `null` with an explanatory note. Approximate values are marked `≈`.
- Every content change, whether from a human, an adapter or AI research, reaches `main` only through a pull request reviewed by a person.
- Data shows when it was last verified. Stale data is flagged, never silently presented as current.

### III. Static, Simple & Dependency-Free
- The site is static HTML/CSS/vanilla JS served by GitHub Pages: **no build step, no frameworks, no runtime dependencies**.
- Scripts in `scripts/` run on plain Node.js (LTS) with **zero npm dependencies**.
- Prefer the smallest change that solves the problem (YAGNI). New complexity must be justified in the plan's Complexity Tracking table.

### IV. Data-Driven & State-Pluggable
- Content lives in data files (`assets/data/**`, `data/**`), not hard-coded in UI logic.
- Each US state is a self-contained module (`assets/data/states/<code>.js`) registered through `registerState()`. Adding a state MUST NOT require changes to `app.js`.
- All data is **validated in CI** against a documented schema. Generated files are deterministic, so their output never depends on the current date.

### V. Equity & Inclusion
- Cover **all** career clusters (not only STEM), every budget and every region.
- List free and paid-to-student opportunities first. Never list pay-to-play programs, pay-to-publish journals or "guaranteed admission" services.
- Usable on phones, accessible (keyboard, screen readers, WCAG AA contrast), in plain language for parents new to the US system.

### VI. Human-in-the-Loop Automation
- Automation (adapters, AI web research) proposes changes. It never publishes directly.
- AI agents get least-privilege tools (`--allowedTools`), bounded budgets (turns, scope per run), and shared written instructions in `.github/prompts/`.
- Automation output includes a reviewer-friendly change summary and coverage report.

### VII. Spec-Driven, Issue-Tracked Work
- Every roadmap item is a **GitHub issue** (labels `roadmap`, `phase-N`). Non-trivial work follows spec-kit: `specs/NNN-name/` with `spec.md` → `plan.md` → `tasks.md` → implementation.
- Pull requests link their issue (`Closes #N`) and spec folder, and keep `tasks.md` checkboxes current, so anyone can pick up the work where it stopped.
- `CLAUDE.md` and this constitution are the shared memory for humans and AI agents. Update them when conventions change.

## Technical Constraints
- **Browsers:** current evergreen browsers (Chrome, Edge, Safari, Firefox), including iOS/Android.
- **Performance:** first load works on a phone over 4G. Keep data files lean and avoid large images.
- **Storage keys:** prefix `pathfolio:`. The backup format is versioned (`app: "pathfolio", version: N`) and stays backward-compatible for restore.
- **Secrets:** only in GitHub Actions secrets (`CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY`, future `SCORECARD_API_KEY`). Never in code or data.
- **Licensing:** MIT. External content is summarized and linked, never copied wholesale.

## Development Workflow
1. Pick or create an issue → `/speckit-specify` (for features) → `/speckit-clarify` if ambiguous → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
2. Work on a branch. Small data-only fixes may skip the spec but still need an issue or PR description with a source.
3. CI (`.github/workflows/ci.yml`) MUST pass: JS syntax, opportunity validation, state validation.
4. Before merge, verify in a browser (desktop + 390px phone width) with no console errors.
5. A maintainer reviews and merges. Squash or merge commits are both fine; the PR description summarizes the spec and tasks completed.

## Governance
- This constitution supersedes other practices. Plans MUST include a "Constitution Check" against Principles I–VII.
- Amendments are made by pull request that updates this file with a version bump (MAJOR: principle removed or redefined; MINOR: principle or section added; PATCH: clarification) and a Sync Impact Report.
- Runtime guidance for contributors and agents lives in `CLAUDE.md`, `CONTRIBUTING.md` and `docs/`.

**Version**: 1.0.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
