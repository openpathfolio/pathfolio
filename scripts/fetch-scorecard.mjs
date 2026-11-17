#!/usr/bin/env node
/**
 * Fetch official university data from the College Scorecard API (spec 004).
 *
 *   SCORECARD_API_KEY=... node scripts/fetch-scorecard.mjs [--no-discover] [--only id1,id2]
 *
 * 1. Resolve each listed university (state modules + national) to its federal UNITID
 *    by city/state search + name matching → data/universities/scorecard-ids.json
 *    (manual pins are never overwritten; weak/unresolved matches are flagged for review)
 * 2. Fetch figures for all resolved IDs in batches → data/universities/scorecard.json
 * 3. Discovery: suggest notable universities we don't list → data/universities/candidates.json
 *
 * The key is read from the environment only, sent as a header and never logged. Zero dependencies; Node 18+.
 * Behind an HTTPS proxy (e.g., a sandbox), run with NODE_USE_ENV_PROXY=1 (Node >= 22.21).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { API_BASE, FIELDS, DETAIL_FIELDS, CORE_FIELDS, primaryCity, pickMatch, toRecord, stableStringify } from "./lib/scorecard.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data/universities");
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const DISCOVER = !args.includes("--no-discover");
const ONLY = args.includes("--only") ? new Set(args[args.indexOf("--only") + 1].split(",")) : null;
const KEY = process.env.SCORECARD_API_KEY;
if (!KEY) { console.error("✖ SCORECARD_API_KEY is not set (repository secret). Nothing was changed."); process.exit(1); }

/* ---------- Load our universities (same order as index.html) ---------- */
const ctx = vm.createContext({});
const load = rel => vm.runInContext(readFileSync(join(ROOT, rel), "utf8"), ctx, { filename: rel });
load("assets/data/common/registry.js");
readdirSync(join(ROOT, "assets/data/states")).filter(f => f.endsWith(".js")).sort().forEach(f => load(`assets/data/states/${f}`));
load("assets/data/national.js");
const STATES = vm.runInContext("STATES", ctx), NATIONAL = vm.runInContext("NATIONAL", ctx), STATE_LIST = vm.runInContext("STATE_LIST", ctx);
const ours = [...Object.values(STATES).flatMap(s => s.universities), ...NATIONAL.universities]
  .filter(u => !ONLY || ONLY.has(u.id))
  .map(u => ({ id: u.id, name: u.name, city: u.city, state: u.state }));

/* ---------- HTTP with retry (key never printed) ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
let requests = 0;
async function api(params, attempt = 1) {
  const qs = new URLSearchParams(params);
  requests++;
  /* Key goes in the X-Api-Key header (supported by api.data.gov), so it never appears in a URL or log */
  const res = await fetch(`${API_BASE}?${qs}`, { headers: { "X-Api-Key": KEY, "User-Agent": "PathfolioBot/1.0 (+https://github.com/openpathfolio/pathfolio)" } });
  if (res.status === 429 && attempt <= 3) { console.warn(`… rate limited, waiting ${attempt * 30}s`); await sleep(attempt * 30000); return api(params, attempt + 1); }
  if (res.status >= 500 && attempt <= 3) { await sleep(5000 * attempt); return api(params, attempt + 1); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(`HTTP ${res.status}: ${body?.error?.message || body?.errors?.[0]?.message || "request failed"}`); e.status = res.status; throw e; }
  return body;
}

/* ---------- 1. Resolve IDs ---------- */
const idsFile = join(OUT, "scorecard-ids.json");
const ids = existsSync(idsFile) ? JSON.parse(readFileSync(idsFile, "utf8")) : {};
let attempted = 0, failed = 0;
for (const u of ours) {
  const cur = ids[u.id];
  if (cur && (cur.quality === "manual" || cur.quality === "strong")) continue;   // keep confirmed matches
  const city = primaryCity(u.city);
  attempted++;
  try {
    const r = await api({ "school.state": u.state, "school.city": city, "school.degrees_awarded.predominant": "3", per_page: "100",
      fields: [FIELDS.id, FIELDS.name, FIELDS.size].join(",") });
    const m = pickMatch(u.name, r.results || []);
    ids[u.id] = { ours: u.name, city, state: u.state, ...m };
    console.log(`${m.quality.padEnd(10)} ${u.id} → ${m.name || m.reason}`);
  } catch (e) {
    failed++;
    /* A transient error must not erase an earlier (weak) match */
    if (!cur) ids[u.id] = { ours: u.name, city, state: u.state, quality: "unresolved", reason: e.message };
    console.warn(`✖ resolve ${u.id}: ${e.message}`);
  }
  await sleep(250);
}
if (attempted && failed === attempted) { console.error(`✖ All ${failed} lookups failed (network or API problem). Nothing was changed.`); process.exit(1); }
writeFileSync(idsFile, stableStringify(ids, 2) + "\n");

/* ---------- 2. Fetch figures in batches ---------- */
const resolved = Object.entries(ids).filter(([, v]) => v.unitid && v.quality !== "unresolved");
const byUnit = new Map(resolved.map(([pf, v]) => [String(v.unitid), pf]));
const schools = {};
let fieldSet = DETAIL_FIELDS, fieldNote = null;
for (let i = 0; i < resolved.length; i += 50) {
  const batch = resolved.slice(i, i + 50).map(([, v]) => v.unitid);
  let r;
  try { r = await api({ id: batch.join(","), per_page: "100", fields: fieldSet.join(",") }); }
  catch (e) {
    if (e.status === 400 && fieldSet !== CORE_FIELDS) {
      fieldNote = `Full field list rejected (${e.message}); fell back to core fields. Check FIELDS in scripts/lib/scorecard.mjs.`;
      console.warn("⚠ " + fieldNote); fieldSet = CORE_FIELDS;
      r = await api({ id: batch.join(","), per_page: "100", fields: fieldSet.join(",") });
    } else throw e;
  }
  for (const row of r.results || []) { const pf = byUnit.get(String(row[FIELDS.id])); if (pf) schools[pf] = toRecord(row); }
  await sleep(250);
}

/* ---------- 3. Discovery (suggestions only) ---------- */
let candidates = { national: [], states: {} };
if (DISCOVER) {
  const listed = new Set(resolved.map(([, v]) => String(v.unitid)));
  const pick = rows => (rows || []).filter(r => !listed.has(String(r[FIELDS.id]))).map(r => ({
    unitid: r[FIELDS.id], name: r[FIELDS.name], city: r[FIELDS.city], state: r[FIELDS.state],
    admissionRate: r[FIELDS.admissionRate], size: r[FIELDS.size], tuitionOut: r[FIELDS.tuitionOut], url: r[FIELDS.url] || null
  }));
  const fields = [FIELDS.id, FIELDS.name, FIELDS.city, FIELDS.state, FIELDS.admissionRate, FIELDS.size, FIELDS.tuitionOut, FIELDS.url].join(",");
  try {
    const nat = await api({ "school.degrees_awarded.predominant": "3", "school.operating": "1", "latest.admissions.admission_rate.overall__range": "0..0.15",
      "latest.student.size__range": "1500..", sort: "latest.admissions.admission_rate.overall:asc", per_page: "40", fields });
    candidates.national = pick(nat.results).slice(0, 15);
    for (const s of STATE_LIST.filter(x => x.available)) {
      const st = await api({ "school.state": s.code, "school.degrees_awarded.predominant": "3", "school.operating": "1", "school.ownership": "1,2",
        "latest.student.size__range": "4000..", sort: "latest.student.size:desc", per_page: "60", fields });
      candidates.states[s.code] = pick(st.results).slice(0, 15);
    }
  } catch (e) { console.warn(`⚠ discovery skipped: ${e.message}`); candidates.error = e.message; }
  writeFileSync(join(OUT, "candidates.json"), stableStringify(candidates, 2) + "\n");
}

if (resolved.length && !Object.keys(schools).length) { console.error("✖ No figures returned for any resolved university. Nothing was changed."); process.exit(1); }
const out = {
  source: "College Scorecard (U.S. Department of Education), api.data.gov",
  sourceUrl: "https://collegescorecard.ed.gov/",
  retrieved: new Date().toISOString().slice(0, 10),
  note: fieldNote,
  schools
};
writeFileSync(join(OUT, "scorecard.json"), stableStringify(out, 1) + "\n");
const q = Object.values(ids).reduce((a, v) => ((a[v.quality] = (a[v.quality] || 0) + 1), a), {});
console.log(`✓ ${Object.keys(schools).length} universities fetched · matches ${JSON.stringify(q)} · ${requests} API requests`);
