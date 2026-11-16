#!/usr/bin/env node
/**
 * Run every source adapter in scripts/sources/*.mjs and save results to
 * data/opportunities/sources/<adapter>.json. The scheduled GitHub Action then
 * runs build-opportunities.mjs and opens a pull request for HUMAN REVIEW.
 *
 * Adapter contract (see scripts/sources/README.md):
 *   export const name = "my-source";      // file-safe id
 *   export const enabled = true;
 *   export async function fetchOpportunities(ctx) { return [ ...objects matching schema ] }
 *
 * Rules: use official APIs/feeds or pages whose terms and robots.txt allow
 * automated access; identify ourselves; be gentle (one request per page).
 */
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ADAPTERS = join(ROOT, "scripts/sources");
const OUT = join(ROOT, "data/opportunities/sources");
mkdirSync(OUT, { recursive: true });

const USER_AGENT = "PathfolioBot/1.0 (+https://github.com/openpathfolio/pathfolio)";
const ctx = {
  today: new Date().toISOString().slice(0, 10),
  async get(url, opts = {}) {
    const res = await fetch(url, { ...opts, headers: { "User-Agent": USER_AGENT, ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return res;
  }
};

let failures = 0;
for (const file of readdirSync(ADAPTERS).filter(f => f.endsWith(".mjs"))) {
  const mod = await import(pathToFileURL(join(ADAPTERS, file)));
  if (!mod.enabled) { console.log(`- skip ${file} (disabled)`); continue; }
  try {
    const items = (await mod.fetchOpportunities(ctx)).map(o => ({ ...o, source: mod.name, lastVerified: ctx.today }));
    writeFileSync(join(OUT, `${mod.name}.json`), JSON.stringify(items, null, 2) + "\n");
    console.log(`✓ ${mod.name}: ${items.length} items`);
  } catch (e) {
    failures++; console.error(`✖ ${mod.name}: ${e.message} (keeping previous data)`);
  }
}
if (failures) process.exitCode = 0; // one broken site should not block the others
