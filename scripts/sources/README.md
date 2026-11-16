# Opportunity source adapters

Each `*.mjs` file here pulls opportunities from **one** official source and maps them to
[`data/opportunities/schema.json`](../../data/opportunities/schema.json).

Most discovery is done by the weekly **AI web research** step (see [docs/AUTOMATION.md](../../docs/AUTOMATION.md)), which writes `research-<verify|discover>-<SCOPE>.json`. Adapters are for sources with a stable official feed or API.

The weekly **Refresh opportunities** workflow runs all enabled adapters, rebuilds
`assets/data/opportunities.js`, and opens a **pull request for a human to review**.
Nothing is published automatically.

## Adding a source
1. Copy `example-json-feed.mjs` and rename it, e.g. `nasa-ostem.mjs`.
2. Set `name` (must not start with `research-`, which is reserved), set `enabled = true`, and map fields in `fetchOpportunities(ctx)`.
3. Run `node scripts/fetch-opportunities.mjs && node scripts/build-opportunities.mjs` locally.
4. Open a PR.

## Ground rules
- **Prefer official APIs, RSS/JSON feeds or published lists.** Check each site's terms of use and `robots.txt`.
  Do not scrape sites that forbid it (e.g., LinkedIn, Indeed, Handshake).
- Keep listings **free or paid-to-student** first. No "pay-to-play" programs or pay-to-publish journals.
- One request per page, no logins, no personal data.
- If a source breaks, the adapter fails alone and its previous data is kept.
