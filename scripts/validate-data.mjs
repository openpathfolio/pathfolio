#!/usr/bin/env node
/**
 * Validate hand-written data: state registry, state modules, career paths, shared content,
 * and opportunity research targets. Runs in CI. No dependencies; Node 18+.
 *
 *   node scripts/validate-data.mjs
 *
 * Browser data files are plain scripts (no modules), so they are loaded into one
 * node:vm context in the same order index.html loads them.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

/* ---------- Load browser data into a sandbox ---------- */
const ctx = vm.createContext({ console });
const load = rel => {
  try { vm.runInContext(readFileSync(join(ROOT, rel), "utf8"), ctx, { filename: rel }); }
  catch (e) { err(rel, `failed to load: ${e.message}`); }
};
const stateFiles = readdirSync(join(ROOT, "assets/data/states")).filter(f => f.endsWith(".js")).sort();
["assets/data/common/registry.js", "assets/data/common/paths.js", "assets/data/common/content.js",
  ...stateFiles.map(f => `assets/data/states/${f}`), "assets/data/national.js"].forEach(load);
/* `const` bindings in scripts are not properties of the context, so read them by name */
const get = name => { try { return vm.runInContext(`typeof ${name} === "undefined" ? undefined : ${name}`, ctx); } catch { return undefined; } };
const STATES = get("STATES"), STATE_LIST = get("STATE_LIST"), AREAS = get("AREAS"), PATHS = get("PATHS"),
  CLUSTERS = get("CLUSTERS"), SUBJECTS = get("SUBJECTS"), VALUES = get("VALUES"), ROADMAP_TEMPLATE = get("ROADMAP_TEMPLATE");
for (const [n, v] of Object.entries({ STATES, STATE_LIST, AREAS, PATHS, CLUSTERS, SUBJECTS, VALUES, ROADMAP_TEMPLATE }))
  if (v === undefined) err("data", `global ${n} is not defined`);
if (errors.length) finish();

const isHttps = u => typeof u === "string" && /^https:\/\/[^\s"]+$/.test(u);
const isStr = s => typeof s === "string" && s.trim().length > 0;
const isNum = n => typeof n === "number" && Number.isFinite(n) && n >= 0;
const AREA_KEYS = new Set(Object.keys(AREAS));
const PHASE_LABELS = new Set(ROADMAP_TEMPLATE.map(r => r.label));
const html = readFileSync(join(ROOT, "index.html"), "utf8");

/* ---------- STATE_LIST ↔ modules ↔ index.html ---------- */
const listed = new Map(STATE_LIST.map(s => [s.code, s]));
STATE_LIST.forEach(s => {
  if (!/^[A-Z]{2}$/.test(s.code)) err("STATE_LIST", `bad code "${s.code}"`);
  if (s.available) {
    if (!STATES[s.code]) err("STATE_LIST", `${s.code} is available but no module registered it`);
    const file = `assets/data/states/${s.code.toLowerCase()}.js`;
    if (!html.includes(`src="${file}"`)) err("index.html", `missing <script src="${file}"> for available state ${s.code}`);
  }
});
Object.keys(STATES).forEach(code => {
  if (!listed.has(code)) err(`states/${code}`, "registered but not in STATE_LIST");
  else if (!listed.get(code).available) err(`states/${code}`, "registered but STATE_LIST marks it unavailable");
});

/* ---------- Each state module ---------- */
const SEL = new Set(["highly", "selective", "moderate", "accessible"]);
const TYPES = new Set(["Public", "Private"]);
for (const [code, st] of Object.entries(STATES)) {
  const w = `states/${code.toLowerCase()}.js`;
  if (!isStr(st.name)) err(w, "name is required");
  if (!Array.isArray(st.regions) || !st.regions.length) err(w, "regions must be a non-empty array");
  const regions = new Set(st.regions || []);
  if (!Array.isArray(st.universities) || st.universities.length < 1) { err(w, "universities must be a non-empty array"); continue; }
  const ids = new Set();
  st.universities.forEach((u, i) => {
    const uw = `${w} universities[${u.id || i}]`;
    if (!/^[a-z0-9-]+$/.test(u.id || "")) err(uw, "id must be a lowercase slug");
    if (ids.has(u.id)) err(uw, "duplicate id"); ids.add(u.id);
    ["name", "city", "rankLabel", "acceptance", "notable", "aid"].forEach(k => { if (!isStr(u[k])) err(uw, `"${k}" is required text`); });
    if (!regions.has(u.region)) err(uw, `region "${u.region}" is not in regions`);
    if (!TYPES.has(u.type)) err(uw, `type must be Public or Private`);
    if (!SEL.has(u.sel)) err(uw, `sel must be one of ${[...SEL].join(", ")}`);
    ["rankSort", "tuition", "coa"].forEach(k => { if (!isNum(u[k])) err(uw, `"${k}" must be a non-negative number`); });
    if (u.tuition > u.coa) err(uw, "tuition is greater than total cost (coa)");
    if (u.autoPct !== null && !(isNum(u.autoPct) && u.autoPct <= 100)) err(uw, "autoPct must be null or 0–100");
    if (u.type === "Private" && u.autoPct) err(uw, "private universities cannot have autoPct");
    if (!Array.isArray(u.areas) || !u.areas.length) err(uw, "areas must be a non-empty array");
    (u.areas || []).forEach(a => { if (!AREA_KEYS.has(a)) err(uw, `unknown area "${a}"`); });
    if (!u.links || !u.links.home) err(uw, "links.home is required");
    Object.entries(u.links || {}).forEach(([k, v]) => { if (!isHttps(v)) err(uw, `links.${k} must be an https URL`); });
  });
  (st.rankRules || []).forEach((r, i) => {
    const rw = `${w} rankRules[${i}]`;
    if (!isStr(r.label) || !isStr(r.yes) || !isStr(r.no)) err(rw, "label, yes, no are required");
    if (!(isNum(r.pct) && r.pct <= 100)) err(rw, "pct must be 0–100");
  });
  (st.essentials || []).forEach((e, i) => { if (!isStr(e.t) || !isStr(e.d)) err(`${w} essentials[${i}]`, "t and d are required"); });
  Object.entries(st.roadmapExtras || {}).forEach(([label, items]) => {
    if (!PHASE_LABELS.has(label)) err(`${w} roadmapExtras`, `"${label}" is not a roadmap phase (${[...PHASE_LABELS].join(" | ")})`);
    if (!Array.isArray(items) || !items.every(isStr)) err(`${w} roadmapExtras["${label}"]`, "must be an array of text");
  });
  if (st.appHints !== undefined && !Array.isArray(st.appHints)) err(w, "appHints must be an array");
  (st.appHints || []).forEach((h, i) => {
    if (!isStr(h.t) || !isStr(h.d)) err(`${w} appHints[${i}]`, "t and d are required");
    if (!isHttps(h.url)) err(`${w} appHints[${i}]`, "url must be https (official source)");
  });
  [["officialLinks", "title"], ["pathways", "name"]].forEach(([key, nameKey]) =>
    (st[key] || []).forEach((l, i) => {
      if (!isStr(l[nameKey])) err(`${w} ${key}[${i}]`, `${nameKey} is required`);
      if (!isHttps(l.url)) err(`${w} ${key}[${i}]`, "url must be https");
    }));
}

/* ---------- National tier (spec 003) ---------- */
const NATIONAL = get("NATIONAL");
if (!NATIONAL) err("national.js", "NATIONAL is not defined");
else {
  const w = "national.js";
  const regions = new Set(NATIONAL.regions || []);
  if (!isStr(NATIONAL.asOf)) err(w, "asOf is required (e.g. \"2025–26\")");
  if (!regions.size) err(w, "regions must be a non-empty array");
  const list = NATIONAL.universities || [];
  if (list.length < 20 || list.length > 40) err(w, `expected 20–40 universities, found ${list.length}`);
  const nids = new Set();
  list.forEach((u, i) => {
    const uw = `${w} universities[${u.id || i}]`;
    if (!/^[a-z0-9-]+$/.test(u.id || "")) err(uw, "id must be a lowercase slug");
    if (nids.has(u.id)) err(uw, "duplicate id"); nids.add(u.id);
    for (const st of Object.values(STATES)) if (st.universities.some(x => x.id === u.id)) err(uw, `id also used by states/${st.code.toLowerCase()}.js`);
    if (!/^[A-Z]{2}$/.test(u.state || "")) err(uw, "state must be a 2-letter code");
    ["name", "city", "rankLabel", "acceptance", "notable", "aid"].forEach(k => { if (!isStr(u[k])) err(uw, `"${k}" is required text`); });
    if (!regions.has(u.region)) err(uw, `region "${u.region}" is not in NATIONAL.regions`);
    if (!TYPES.has(u.type)) err(uw, "type must be Public or Private");
    if (!SEL.has(u.sel)) err(uw, `sel must be one of ${[...SEL].join(", ")}`);
    ["rankSort", "tuitionIn", "tuitionOut", "coaOut"].forEach(k => { if (!isNum(u[k])) err(uw, `"${k}" must be a non-negative number`); });
    if (u.tuitionIn > u.tuitionOut) err(uw, "tuitionIn is greater than tuitionOut");
    if (u.tuitionOut > u.coaOut) err(uw, "tuitionOut is greater than coaOut");
    if (u.costNote !== undefined && !isStr(u.costNote)) err(uw, "costNote must be text");
    if ("ivy" in u && u.ivy !== true) err(uw, "ivy must be true when present");
    if ("autoPct" in u) err(uw, "national universities must not set autoPct (state rules apply only via state modules)");
    if (!Array.isArray(u.areas) || !u.areas.length) err(uw, "areas must be a non-empty array");
    (u.areas || []).forEach(a => { if (!AREA_KEYS.has(a)) err(uw, `unknown area "${a}"`); });
    ["home", "admissions", "cost"].forEach(k => { if (!isHttps((u.links || {})[k])) err(uw, `links.${k} must be an https URL`); });
  });
}

/* ---------- Career paths ---------- */
const pathIds = new Set();
PATHS.forEach((p, i) => {
  const w = `paths[${p.id || i}]`;
  if (!/^[a-z0-9-]+$/.test(p.id || "")) err(w, "id must be a lowercase slug");
  if (pathIds.has(p.id)) err(w, "duplicate id"); pathIds.add(p.id);
  if (!CLUSTERS[p.cluster]) err(w, `unknown cluster "${p.cluster}"`);
  if (!/^[RIASEC]{2,3}$/.test(p.code || "")) err(w, "code must be 2–3 RIASEC letters");
  (p.areas || []).forEach(a => { if (!AREA_KEYS.has(a)) err(w, `unknown area "${a}"`); });
  (p.subjects || []).forEach(s => { if (!SUBJECTS[s]) err(w, `unknown subject "${s}"`); });
  (p.values || []).forEach(v => { if (!VALUES[v]) err(w, `unknown value "${v}"`); });
  ["courses", "projects", "certs", "internships", "competitions", "summer", "research", "publish", "majors"].forEach(k => {
    if (!Array.isArray(p[k]) || !p[k].length || !p[k].every(isStr)) err(w, `"${k}" must be a non-empty list of text`);
  });
  if (!p.employers || typeof p.employers !== "object") err(w, "employers must be an object keyed by state code");
  else Object.keys(p.employers).forEach(c => { if (!listed.has(c)) err(w, `employers has unknown state "${c}"`); });
});

/* ---------- Opportunity research targets ---------- */
const TDIR = join(ROOT, "data/opportunities/targets");
const TARGET_KINDS = new Set(["university", "medical-center", "agency", "nonprofit", "fair", "company", "school-program"]);
const PAGE_KINDS = new Set(["precollege", "research", "summer", "internship", "outreach", "competition", "camp", "other"]);
const scopes = ["US", ...STATE_LIST.filter(s => s.available).map(s => s.code)];
for (const scope of scopes) {
  const file = join(TDIR, `${scope}.json`), w = `targets/${scope}.json`;
  if (!existsSync(file)) { err(w, "missing (required for every live scope)"); continue; }
  let t; try { t = JSON.parse(readFileSync(file, "utf8")); } catch (e) { err(w, e.message); continue; }
  if (t.scope !== scope) err(w, `scope must be "${scope}"`);
  if (!Array.isArray(t.targets) || !t.targets.length) { err(w, "targets must be a non-empty array"); continue; }
  const tids = new Set();
  t.targets.forEach((x, i) => {
    const xw = `${w} [${x.id || i}]`;
    if (!/^[a-z0-9-]+$/.test(x.id || "")) err(xw, "id must be a lowercase slug");
    if (tids.has(x.id)) err(xw, "duplicate id"); tids.add(x.id);
    if (!isStr(x.org)) err(xw, "org is required");
    if (!TARGET_KINDS.has(x.kind)) err(xw, `kind must be one of ${[...TARGET_KINDS].join(", ")}`);
    if (!isHttps(x.homepage)) err(xw, "homepage must be https");
    (x.pages || []).forEach((p, j) => {
      if (!isHttps(p.url)) err(`${xw} pages[${j}]`, "url must be https");
      if (!PAGE_KINDS.has(p.kind)) err(`${xw} pages[${j}]`, `kind must be one of ${[...PAGE_KINDS].join(", ")}`);
    });
    if (x.searchHints && !(Array.isArray(x.searchHints) && x.searchHints.every(isStr))) err(xw, "searchHints must be a list of text");
    if (x.universityId && !(STATES[scope]?.universities || []).some(u => u.id === x.universityId)) err(xw, `universityId "${x.universityId}" not found in states/${scope.toLowerCase()}.js`);
  });
  if (STATES[scope]) STATES[scope].universities.forEach(u => {
    if (!t.targets.some(x => x.universityId === u.id)) err(w, `no target for university "${u.id}" (add one with universityId)`);
  });
}

finish();
function finish() {
  if (errors.length) { console.error(`✖ ${errors.length} data problem(s):\n  ` + errors.join("\n  ")); process.exit(1); }
  console.log(`✓ Data valid: ${Object.keys(STATES || {}).length} state(s), ${(get("NATIONAL") || { universities: [] }).universities.length} national universities, ${(PATHS || []).length} career paths, targets for ${scopes.join(", ")}`);
}
