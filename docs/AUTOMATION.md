# Weekly opportunity research: setup

Every Monday the **Refresh opportunities** workflow (`.github/workflows/refresh-opportunities.yml`):

1. Runs any **source adapters** (`scripts/sources/*.mjs`) that pull from official feeds or APIs.
2. Runs **AI web research** with the instructions in [`.github/prompts/opportunity-research.md`](../.github/prompts/opportunity-research.md):
   - **Verifies** every listing on its official page, and records published deadlines, opening dates, the cycle, and an **evidence link**.
   - **Discovers** new university pre-college, research and training programs (Texas first), national internships and competitions.
   - Writes only `data/opportunities/sources/web-research.json`.
3. Builds and validates the data, removes one-time listings whose deadlines passed more than 30 days ago, and writes a change summary.
4. Opens a **pull request** for a maintainer to review. **Nothing is published until a person merges it.**

The website then highlights published deadlines: closing soon, open, and opening soon. It sorts by the soonest deadline and links to the official evidence page.

## Option A (recommended): Claude, fully automatic
Uses your **Claude Pro or Max subscription** (or an Anthropic API key) through [Anthropic's official GitHub Action](https://github.com/anthropics/claude-code-action).

1. On your own computer, with [Claude Code](https://code.claude.com) installed, run:
   ```bash
   claude setup-token
   ```
   Copy the token it prints.
2. In the repo, go to **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `CLAUDE_CODE_OAUTH_TOKEN`
   - Value: the token from step 1.

   Or, to bill an API account instead, add `ANTHROPIC_API_KEY`.
3. Go to **Settings → Actions → General → Workflow permissions**, and turn on **"Allow GitHub Actions to create and approve pull requests"** (already done).
4. To test it now, go to **Actions → Refresh opportunities → Run workflow** and choose engine = `claude`.

Notes:
- Usage counts against your Claude plan's limits. One weekly run of a few dozen searches is modest.
- The AI can only use web search, web fetch, file edits, and the build script (`--allowedTools` in the workflow).

## Option B: GitHub Copilot coding agent
If no Claude secret is set, the workflow opens a weekly issue labelled `opportunity-research` that contains the full research instructions.

1. Open the issue and **assign it to Copilot**. Copilot works on it and opens a pull request.
2. **Important:** Copilot's coding agent runs behind a firewall that blocks most websites by default. Go to **Settings → Copilot → Coding agent** and either add the official domains it needs (university `.edu` sites, `nasa.gov`, and so on) to the allowlist, or turn off the firewall for this repo. See GitHub's docs: *Customizing or disabling the firewall for Copilot coding agent*.
3. Copilot can fetch pages it's allowed to reach but has no general web-search tool, so it is better at **verifying** existing listings than at **discovering** new ones. For discovery, Option A works better.

Copilot coding agent requires Copilot Pro, Pro+, Business or Enterprise.

## Option C: manual
Open the weekly issue, paste its instructions into any AI assistant that has web search (or do the research yourself), save the result as `data/opportunities/sources/web-research.json`, run `node scripts/build-opportunities.mjs`, and open a pull request.

## Reviewing the weekly pull request
The PR description lists **new**, **updated** and **removed** listings, with links to the evidence pages. Before merging:
- [ ] Open each evidence link and confirm the dates.
- [ ] Reject pay-to-play programs and pay-to-publish journals.
- [ ] Check grades, ages and costs.

CI must pass. It re-validates everything and checks that the generated file is current.

## How the data merges
| File | Who edits | Role |
|---|---|---|
| `data/opportunities/curated.json` | Humans | The trusted base list |
| `data/opportunities/sources/web-research.json` | Weekly AI research | `updates` (new dates for existing ids) + `additions` (new programs) |
| `data/opportunities/sources/<adapter>.json` | Source adapters | Full entries from official feeds |
| `assets/data/opportunities.js` | `build-opportunities.mjs` | Generated, never edited by hand |

Updates can only change time-sensitive fields: deadline, opening date, cycle, status, URL, cost, evidence link and similar. They can never overwrite a newer verification with an older one.
