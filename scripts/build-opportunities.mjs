#!/usr/bin/env node
/**
 * Merge, validate and publish opportunity data.
 *
 * Inputs
 *   data/opportunities/curated.json         Human-maintained base list (array of full entries)
 *   data/opportunities/sources/*.json       Automated sources. Each file is either
 *       - an ARRAY of full entries (source adapters), or
 *       - an OBJECT { generatedAt, updates: [...], additions: [...] } (weekly AI web research):
 *           updates   = { id, ...changed fields } for entries that already exist (e.g. a new deadline)
 *           additions = full new entries
 * Output
 *   assets/data/opportunities.js            Loaded by the web app (deterministic: never depends on today's date)
 *
 * Usage
 *   node scripts/build-opportunities.mjs                  build
 *   node scripts/build-opportunities.mjs --check          CI: fail if data is invalid or output is stale
 *   node scripts/build-opportunities.mjs --prune          remove one-time listings whose deadline passed >30 days ago
 *                                                         (edits the source JSON files, then builds)
 *   node scripts/build-opportunities.mjs --summary FILE   also write a Markdown change summary (for PR bodies)
 * No dependencies; Node 18+.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data/opportunities");
const SOURCES = join(DATA, "sources");
const OUT = join(ROOT, "assets/data/opportunities.js");
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const PRUNE = args.includes("--prune");
const SUMMARY = args.includes("--summary") ? args[args.indexOf("--summary") + 1] : null;

const schema = JSON.parse(readFileSync(join(DATA, "schema.json"), "utf8"));
const registry = readFileSync(join(ROOT, "assets/data/common/registry.js"), "utf8");
const AREA_KEYS = new Set([...registry.matchAll(/^\s{2}(\w+):\s*"/gm)].map(m => m[1]));
/* Fields that web research / adapters may change on an existing entry */
const UPDATABLE = new Set(["deadline", "opens", "deadlineNote", "cycle", "lastVerified", "evidenceUrl", "url", "cost", "costNote", "grades", "minAge", "location", "description", "status"]);

const errors = [];
const warnings = [];

function checkField(k, v, where) {
  const rule = schema.properties[k];
  if (!rule) { errors.push(`${where}: unknown field "${k}"`); return; }
  const types = [].concat(rule.type || []);
  if (rule.enum && !rule.enum.includes(v)) { errors.push(`${where}: "${k}" must be one of ${rule.enum.join(", ")}`); return; }
  if (v === null) { if (!types.includes("null")) errors.push(`${where}: "${k}" cannot be null`); return; }
  if (types.includes("string") && typeof v === "string") {
    if (rule.pattern && !new RegExp(rule.pattern).test(v)) errors.push(`${where}: "${k}" has invalid format ("${v}")`);
    if (rule.minLength && v.length < rule.minLength) errors.push(`${where}: "${k}" too short`);
    if (rule.maxLength && v.length > rule.maxLength) errors.push(`${where}: "${k}" longer than ${rule.maxLength}`);
    if (rule.format === "date" && isNaN(Date.parse(v))) errors.push(`${where}: "${k}" is not a real date`);
  } else if (types.includes("array")) {
    if (!Array.isArray(v) || v.length < (rule.minItems || 0)) { errors.push(`${where}: "${k}" must be a non-empty array`); return; }
    v.forEach(x => {
      if (rule.items.pattern && !new RegExp(rule.items.pattern).test(x)) errors.push(`${where}: "${k}" value "${x}" invalid`);
      if (rule.items.type === "integer" && (!Number.isInteger(x) || x < rule.items.minimum || x > rule.items.maximum)) errors.push(`${where}: "${k}" value "${x}" out of range`);
    });
    if (k === "areas") v.forEach(a => { if (!AREA_KEYS.has(a)) errors.push(`${where}: unknown area "${a}"`); });
  } else if (types.includes("boolean")) { if (typeof v !== "boolean") errors.push(`${where}: "${k}" must be true/false`); }
  else if (types.includes("integer")) { if (!Number.isInteger(v)) errors.push(`${where}: "${k}" must be an integer`); }
  else if (types.includes("string")) errors.push(`${where}: "${k}" must be text`);
}
function validateFull(o, where) {
  for (const k of schema.required) if (!(k in o)) errors.push(`${where}: missing "${k}"`);
  for (const [k, v] of Object.entries(o)) checkField(k, v, where);
  if (o.opens && o.deadline && o.opens > o.deadline) errors.push(`${where}: "opens" is after "deadline"`);
  if (o.deadline && !o.evidenceUrl && o.source !== "curated") warnings.push(`${where}: deadline without evidenceUrl`);
}

function readJson(file) {
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch (e) { errors.push(`${basename(file)}: ${e.message}`); return null; }
}

/* ---------- Load ---------- */
const curatedFile = join(DATA, "curated.json");
let curated = readJson(curatedFile) || [];
if (!Array.isArray(curated)) { errors.push("curated.json must be an array"); curated = []; }

const sourceFiles = existsSync(SOURCES) ? readdirSync(SOURCES).filter(f => f.endsWith(".json")).sort() : [];
const sources = sourceFiles.map(f => {
  const file = join(SOURCES, f), name = basename(f, ".json"), raw = readJson(file);
  if (raw === null) return { file, name, additions: [], updates: [], shape: "array" };
  if (Array.isArray(raw)) return { file, name, raw, shape: "array", additions: raw, updates: [] };
  if (typeof raw === "object") return { file, name, raw, shape: "object", additions: raw.additions || [], updates: raw.updates || [] };
  errors.push(`${f}: must be an array or { updates, additions }`); return { file, name, additions: [], updates: [], shape: "array" };
});

/* ---------- Optional prune (edits source files) ---------- */
if (PRUNE) {
  const cutoff = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const expired = o => !o.recurring && o.deadline && o.deadline < cutoff;
  const before = curated.length;
  curated = curated.filter(o => !expired(o));
  if (curated.length !== before) writeFileSync(curatedFile, JSON.stringify(curated, null, 2) + "\n");
  for (const s of sources) {
    const n = s.additions.length;
    s.additions = s.additions.filter(o => !expired(o));
    if (s.additions.length !== n) {
      const out = s.shape === "array" ? s.additions : { ...s.raw, additions: s.additions };
      writeFileSync(s.file, JSON.stringify(out, null, 2) + "\n");
      console.log(`- pruned ${n - s.additions.length} expired listing(s) from ${basename(s.file)}`);
    }
  }
}

/* ---------- Merge ---------- */
const byId = new Map();
const origin = new Map();
for (const o of curated) {
  const e = { ...o, source: o.source || "curated" };
  validateFull(e, `curated:${o.id || "(no id)"}`);
  if (byId.has(e.id)) errors.push(`curated.json: duplicate id "${e.id}"`);
  byId.set(e.id, e); origin.set(e.id, "curated");
}
for (const s of sources) {
  for (const o of s.additions) {
    const e = { ...o, source: o.source || s.name };
    validateFull(e, `${s.name}:${o.id || "(no id)"}`);
    if (byId.has(e.id)) { warnings.push(`${s.name}: addition "${e.id}" already exists, so it was ignored (send it as an update instead)`); continue; }
    byId.set(e.id, e); origin.set(e.id, s.name);
  }
}
for (const s of sources) {
  for (const u of s.updates) {
    const where = `${s.name}:update:${u.id || "(no id)"}`;
    const target = byId.get(u.id);
    if (!target) { errors.push(`${where}: no opportunity with this id`); continue; }
    for (const [k, v] of Object.entries(u)) {
      if (k === "id") continue;
      if (!UPDATABLE.has(k)) { errors.push(`${where}: field "${k}" cannot be updated automatically`); continue; }
      checkField(k, v, where);
    }
    /* Never let an older verification overwrite a newer one */
    if (target.lastVerified && u.lastVerified && u.lastVerified < target.lastVerified) continue;
    Object.assign(target, Object.fromEntries(Object.entries(u).filter(([k]) => k !== "id")));
    if (u.deadline && !u.evidenceUrl && !target.evidenceUrl) warnings.push(`${where}: deadline without evidenceUrl`);
  }
}

const list = [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));

if (warnings.length) console.warn("⚠ Warnings:\n  " + warnings.join("\n  "));
if (errors.length) { console.error("✖ Opportunity data has problems:\n  " + errors.join("\n  ")); process.exit(1); }

const out = `/* AUTO-GENERATED by scripts/build-opportunities.mjs. Do not edit by hand.
   Edit data/opportunities/curated.json, or let the weekly research workflow update data/opportunities/sources/. */
const OPPORTUNITIES = ${JSON.stringify(list, null, 1)};
`;

/* ---------- Change summary (for reviewers) ---------- */
function previousList() {
  if (!existsSync(OUT)) return [];
  const m = readFileSync(OUT, "utf8").match(/const OPPORTUNITIES = (\[[\s\S]*\]);/);
  try { return m ? JSON.parse(m[1]) : []; } catch { return []; }
}
if (SUMMARY) {
  const prev = new Map(previousList().map(o => [o.id, o]));
  const added = list.filter(o => !prev.has(o.id));
  const removed = [...prev.values()].filter(o => !byId.has(o.id));
  const changed = list.filter(o => prev.has(o.id)).map(o => {
    const p = prev.get(o.id);
    const diffs = ["deadline", "opens", "deadlineNote", "cost", "url", "evidenceUrl", "status"].filter(k => (p[k] ?? null) !== (o[k] ?? null))
      .map(k => `\`${k}\`: ${p[k] ?? "—"} → **${o[k] ?? "—"}**`);
    return diffs.length ? { o, diffs } : null;
  }).filter(Boolean);
  const link = o => `[${o.title}](${o.evidenceUrl || o.url})`;
  const md = [
    `## Opportunities refresh: ${list.length} total`,
    `**${added.length} new · ${changed.length} updated · ${removed.length} removed** · ${list.filter(o => o.deadline).length} with published deadlines`,
    "",
    added.length ? "### 🆕 New\n" + added.map(o => `- ${link(o)} (${o.org}, ${o.type}, ${o.states.join("/")})${o.deadline ? ` · deadline **${o.deadline}**` : ""}`).join("\n") : "",
    changed.length ? "\n### ✏️ Updated\n" + changed.map(c => `- ${link(c.o)}: ${c.diffs.join("; ")}`).join("\n") : "",
    removed.length ? "\n### 🗑️ Removed\n" + removed.map(o => `- ${o.title}`).join("\n") : "",
    warnings.length ? "\n### ⚠️ Warnings\n" + warnings.map(w => `- ${w}`).join("\n") : "",
    "\n### Reviewer checklist\n- [ ] Open each new or updated **evidence link** and confirm the dates\n- [ ] No pay-to-play programs or pay-to-publish journals\n- [ ] Grades, ages and costs look right"
  ].filter(Boolean).join("\n");
  writeFileSync(SUMMARY, md + "\n");
}

if (CHECK) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== out) { console.error("✖ assets/data/opportunities.js is out of date. Run: node scripts/build-opportunities.mjs"); process.exit(1); }
  console.log(`✓ ${list.length} opportunities valid and up to date`);
} else {
  writeFileSync(OUT, out);
  const nAdd = sources.reduce((n, s) => n + s.additions.length, 0), nUpd = sources.reduce((n, s) => n + s.updates.length, 0);
  console.log(`✓ Wrote ${list.length} opportunities (${curated.length} curated, ${nAdd} automated additions, ${nUpd} updates)`);
}
