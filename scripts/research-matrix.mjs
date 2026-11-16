#!/usr/bin/env node
/**
 * Print the GitHub Actions matrix for weekly opportunity research.
 *
 *   node scripts/research-matrix.mjs [--scope all|US|TX] [--job both|verify|discover] [--date YYYY-MM-DD]
 *
 * Scopes = "US" (national listings) + every state marked available in STATE_LIST.
 * Discovery topic rotates by ISO week so every career cluster gets attention.
 * Output: {"include":[{scope, job, topic, topicLabel, maxTurns, maxNew}, ...]}
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : def; };

export const TOPICS = [
  { id: "stem", label: "Engineering, computing, math & physical sciences" },
  { id: "health", label: "Health, medicine, life sciences & psychology" },
  { id: "business-public", label: "Business, finance, law, government & education" },
  { id: "creative-hands", label: "Arts, design, media, agriculture, environment, aviation & skilled trades" }
];
export const BUDGET = { verify: { maxTurns: 80 }, discover: { maxTurns: 60, maxNew: 10 } };

export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 864e5 + 1) / 7);
}

export function liveScopes() {
  const ctx = vm.createContext({});
  vm.runInContext(readFileSync(join(ROOT, "assets/data/common/registry.js"), "utf8"), ctx);
  const list = vm.runInContext("STATE_LIST", ctx);
  return ["US", ...list.filter(s => s.available).map(s => s.code)];
}

export function buildMatrix({ scope = "all", job = "both", date = new Date() } = {}) {
  const scopes = liveScopes().filter(s => scope === "all" || s === scope);
  if (!scopes.length) throw new Error(`Unknown or unavailable scope "${scope}". Live scopes: ${liveScopes().join(", ")}`);
  const jobs = job === "both" ? ["verify", "discover"] : [job];
  if (!jobs.every(j => BUDGET[j])) throw new Error(`job must be both, verify or discover`);
  const topic = TOPICS[isoWeek(date) % TOPICS.length];
  return {
    include: scopes.flatMap(s => jobs.map(j => ({
      scope: s, job: j, topic: topic.id, topicLabel: topic.label,
      maxTurns: BUDGET[j].maxTurns, maxNew: BUDGET[j].maxNew || 0
    })))
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const date = arg("date") ? new Date(arg("date") + "T00:00:00Z") : new Date();
  try { console.log(JSON.stringify(buildMatrix({ scope: arg("scope", "all"), job: arg("job", "both"), date }))); }
  catch (e) { console.error("✖ " + e.message); process.exit(1); }
}
