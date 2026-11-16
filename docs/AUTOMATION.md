# Weekly opportunity research: how it works and how to set it up

Spec: [`specs/001-research-pipeline-scaling/`](../specs/001-research-pipeline-scaling/) · Tracking: epic #3

## What happens every Monday
The **Refresh opportunities** workflow (`.github/workflows/refresh-opportunities.yml`) has three stages:

1. **Plan:** `scripts/research-matrix.mjs` lists the **scopes**: `US` (national listings) plus every state marked `available` in `STATE_LIST`. For each scope it schedules two jobs. It also picks this week's **discovery topic**, rotating by ISO week:
   STEM → health → business/law/public service/education → arts/media/agriculture/environment/aviation/trades.
2. **Research:** one job per scope × job type, at most 2 at a time, each with its own budget:
   | Job | Instructions | Budget | Writes |
   |---|---|---|---|
   | `verify` | [`.github/prompts/opportunity-verify.md`](../.github/prompts/opportunity-verify.md): re-checks **every** listing in scope on its official page, stalest first; records deadlines, opening dates, status and evidence links; lists anything it skipped | 80 turns | `data/opportunities/sources/research-verify-<SCOPE>.json` |
   | `discover` | [`.github/prompts/opportunity-discover.md`](../.github/prompts/opportunity-discover.md): checks the official **targets** in `data/opportunities/targets/<SCOPE>.json` first, then searches the web; adds up to 10 new programs for the topic; suggests new official pages | 60 turns | `data/opportunities/sources/research-discover-<SCOPE>.json` |

   Files are **merge-safe**: each job starts from its previous file, so a listing that wasn't re-checked keeps its last verification.
3. **Publish:** collects all results, runs the source adapters, builds and validates (`--prune` removes one-time listings expired more than 30 days ago), and opens **one pull request** whose description includes:
   - a **coverage table** per scope (verified this run / total, new, not re-checked by name, stale)
   - new, updated and removed listings, with evidence links
   - suggested new research targets
   - any research job that failed (its previous data is kept)

**Nothing is published until a person reviews and merges the PR.**

### Running it manually
**Actions → Refresh opportunities → Run workflow**, then choose:
- `engine`: `auto` / `claude` / `issue`
- `scope`: `all`, `US`, or a state code (e.g. `TX`)
- `job`: `both` / `verify` / `discover`

## Engine A (recommended): Claude, fully automatic
Uses a **Claude Pro/Max subscription** (or an Anthropic API key) through [Anthropic's GitHub Action](https://github.com/anthropics/claude-code-action).
1. On your computer, with [Claude Code](https://code.claude.com) installed, run `claude setup-token` and copy the token.
2. Go to **Settings → Secrets and variables → Actions** and add `CLAUDE_CODE_OAUTH_TOKEN`, or `ANTHROPIC_API_KEY` to use API billing.
3. Go to **Settings → Actions → General**, and turn on "Allow GitHub Actions to create and approve pull requests".

Usage scales with the number of scopes: today 2 scopes × 2 jobs = 4 jobs per week. The AI may only use web search, web fetch, file edits and the build script.

## Engine B: GitHub Copilot coding agent
Without a Claude secret, the workflow opens one weekly issue (label `opportunity-research`). It lists every job with its output file, followed by both instruction files.
1. Assign the issue to **Copilot**. It opens a PR.
2. Copilot's firewall blocks most sites by default. Go to **Settings → Copilot → Coding agent** and allow the official domains, or turn off the firewall for this repo.
3. Copilot has no general web-search tool, so it's better at **verify** than **discover**.

## Engine C: manual
Follow the weekly issue's instructions with any AI assistant that has web search, write the listed files, run `node scripts/build-opportunities.mjs`, and open a PR.

## Reviewing the weekly PR
- [ ] Check the **coverage table**. Anything under 95% is flagged ⚠️, with the unchecked listings named.
- [ ] Open the evidence links for new and changed dates.
- [ ] Reject pay-to-play programs and pay-to-publish journals.
- [ ] Add useful **suggested targets** to `data/opportunities/targets/<SCOPE>.json` (in a separate PR is fine).

## Data files
| File | Edited by | Purpose |
|---|---|---|
| `data/opportunities/curated.json` | Humans | Trusted base list |
| `data/opportunities/sources/research-verify-<SCOPE>.json` | Verify job | `updates` (dates, status, evidence) + `skipped` |
| `data/opportunities/sources/research-discover-<SCOPE>.json` | Discover job | `additions` (new programs) + `targetSuggestions` |
| `data/opportunities/sources/<adapter>.json` | Source adapters | Entries from official feeds |
| `data/opportunities/targets/<SCOPE>.json` | Humans | Official orgs/pages to check first (required for every live scope; validated in CI) |
| `assets/data/opportunities.js` | `build-opportunities.mjs` | Generated, never edited by hand |

Updates may only change time-sensitive fields, and never overwrite a newer verification with an older one.

## Adding a state to the rotation
When a state module becomes `available: true` (see [ADDING_A_STATE.md](ADDING_A_STATE.md)), create `data/opportunities/targets/<CODE>.json` with a target for every university in the state. CI enforces this. The state then joins the weekly matrix automatically.

## Weekly link check
**Check links** (`.github/workflows/link-check.yml`) runs every Wednesday. It checks every URL in the site data and keeps **one** issue labelled `broken-links` up to date, closing it when everything passes. Sites that block automated checks (401/403/429) are listed separately for a quick manual look.
