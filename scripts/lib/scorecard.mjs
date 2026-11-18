/**
 * College Scorecard helpers (spec 004). Pure functions, no I/O, unit-tested by
 * scripts/test-universities.mjs. API docs: https://collegescorecard.ed.gov/data/api-documentation/
 */

export const API_BASE = "https://api.data.gov/ed/collegescorecard/v1/schools";

export const INCOME_BANDS = ["0-30000", "30001-48000", "48001-75000", "75001-110000", "110001-plus"];
export const INCOME_LABELS = { "0-30000": "$0–30k", "30001-48000": "$30–48k", "48001-75000": "$48–75k", "75001-110000": "$75–110k", "110001-plus": "$110k+" };

/* Field names verified against the live API (2026-11-17) */
export const FIELDS = {
  id: "id",
  name: "school.name",
  city: "school.city",
  state: "school.state",
  url: "school.school_url",
  priceCalculatorUrl: "school.price_calculator_url",
  ownership: "school.ownership",                       // 1 public, 2 private nonprofit, 3 for-profit
  admissionRate: "latest.admissions.admission_rate.overall",
  size: "latest.student.size",
  tuitionIn: "latest.cost.tuition.in_state",
  tuitionOut: "latest.cost.tuition.out_of_state",
  coa: "latest.cost.attendance.academic_year",
  avgNetPricePublic: "latest.cost.avg_net_price.public",
  avgNetPricePrivate: "latest.cost.avg_net_price.private",
  gradRate: "latest.completion.completion_rate_4yr_150nt",
  medianEarnings10yr: "latest.earnings.10_yrs_after_entry.median"
};
export const netPriceField = (ownership, band) => `latest.cost.net_price.${ownership}.by_income_level.${band}`;
export const DETAIL_FIELDS = [
  ...Object.values(FIELDS),
  ...INCOME_BANDS.flatMap(b => [netPriceField("public", b), netPriceField("private", b)])
];
/* Minimal set used if the full request is rejected (a renamed field must not break the run) */
export const CORE_FIELDS = [FIELDS.id, FIELDS.name, FIELDS.city, FIELDS.state, FIELDS.tuitionIn, FIELDS.tuitionOut, FIELDS.coa, FIELDS.admissionRate, FIELDS.size];

const STOP = new Set(["the", "of", "at", "in", "and", "university", "college", "campus", "main", "city", "s", "hbcu", "women", "womens"]);

/** Lowercase tokens without punctuation, parentheticals or filler words. "Texas A&M" → ["texas","a","m"] */
export function nameTokens(name) {
  return String(name || "").toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ").filter(t => t && !STOP.has(t));
}

/** First city in strings like "San Marcos & Round Rock" or "Denton · Dallas · Houston" */
export function primaryCity(city) {
  return String(city || "").split(/\s*(?:&|·|,|\/| and )\s*/)[0].trim();
}

/** Coverage of OUR tokens by theirs (0–1), plus a small bonus for closer (shorter) names. */
export function matchScore(ourName, theirName) {
  const a = nameTokens(ourName), b = new Set(nameTokens(theirName));
  if (!a.length || !b.size) return 0;
  const hit = a.filter(t => b.has(t)).length;
  return hit / a.length + 0.1 * (hit / b.size);
}

/**
 * Choose the federal record for one of our universities from same-city candidates.
 * strong: ≥ 0.85 coverage (best score). weak: ≥ 0.5 and shares the first token; largest such school.
 */
export function pickMatch(ourName, candidates) {
  const scored = (candidates || []).map(c => ({ c, score: matchScore(ourName, c[FIELDS.name]) })).sort((x, y) => y.score - x.score || (y.c[FIELDS.size] || 0) - (x.c[FIELDS.size] || 0));
  if (!scored.length) return { quality: "unresolved", reason: "no candidates in that city/state" };
  const best = scored[0];
  if (best.score >= 0.85) return { quality: "strong", unitid: best.c[FIELDS.id], name: best.c[FIELDS.name], score: round(best.score) };
  const first = nameTokens(ourName)[0];
  const weak = scored.filter(s => s.score >= 0.5 && nameTokens(s.c[FIELDS.name])[0] === first)
    .sort((x, y) => (y.c[FIELDS.size] || 0) - (x.c[FIELDS.size] || 0))[0];
  if (weak) return { quality: "weak", unitid: weak.c[FIELDS.id], name: weak.c[FIELDS.name], score: round(weak.score) };
  return { quality: "unresolved", reason: `best candidate "${best.c[FIELDS.name]}" scored ${round(best.score)}` };
}
const round = n => Math.round(n * 100) / 100;

const num = v => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Convert one API result (flat dotted keys) into our stored record. Missing values → null. */
export function toRecord(r) {
  const ownership = r[FIELDS.ownership] === 1 ? "public" : r[FIELDS.ownership] === 2 || r[FIELDS.ownership] === 3 ? "private" : null;
  const byIncome = {};
  for (const b of INCOME_BANDS) {
    const v = ownership ? num(r[netPriceField(ownership, b)]) : (num(r[netPriceField("public", b)]) ?? num(r[netPriceField("private", b)]));
    byIncome[b] = v;
  }
  const rate = num(r[FIELDS.admissionRate]), grad = num(r[FIELDS.gradRate]);
  return {
    unitid: r[FIELDS.id],
    name: r[FIELDS.name] || null,
    city: r[FIELDS.city] || null,
    state: r[FIELDS.state] || null,
    ownership,
    url: normalizeUrl(r[FIELDS.url]),
    priceCalculatorUrl: normalizeUrl(r[FIELDS.priceCalculatorUrl]),
    admissionRate: rate === null ? null : Math.round(rate * 10000) / 10000,
    size: num(r[FIELDS.size]),
    tuitionIn: num(r[FIELDS.tuitionIn]),
    tuitionOut: num(r[FIELDS.tuitionOut]),
    coa: num(r[FIELDS.coa]),
    avgNetPrice: num(r[FIELDS.avgNetPricePublic]) ?? num(r[FIELDS.avgNetPricePrivate]),
    netPriceByIncome: Object.values(byIncome).some(v => v !== null) ? byIncome : null,
    gradRate: grad === null ? null : Math.round(grad * 10000) / 10000,
    medianEarnings10yr: num(r[FIELDS.medianEarnings10yr])
  };
}

/** Scorecard URLs sometimes lack a scheme ("www.x.edu/"). Only https URLs are kept. */
export function normalizeUrl(u) {
  if (!u || typeof u !== "string") return null;
  let s = u.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  s = s.replace(/^http:\/\//i, "https://");
  return /^https:\/\/[^\s"'<>]+$/.test(s) ? s : null;
}

/** Stable JSON: object keys sorted recursively (deterministic generated files). */
export function stableStringify(v, indent = 1) {
  const sort = x => Array.isArray(x) ? x.map(sort) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map(k => [k, sort(x[k])])) : x;
  return JSON.stringify(sort(v), null, indent);
}

/** Fields compared in the PR summary */
export const SUMMARY_FIELDS = ["tuitionIn", "tuitionOut", "coa", "admissionRate", "avgNetPrice", "gradRate", "medianEarnings10yr"];
export function diffRecords(prev, next) {
  return SUMMARY_FIELDS.filter(k => (prev?.[k] ?? null) !== (next?.[k] ?? null)).map(k => ({ field: k, from: prev?.[k] ?? null, to: next?.[k] ?? null }));
}
