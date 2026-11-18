#!/usr/bin/env node
/** Unit tests for scripts/lib/scorecard.mjs (spec 004). No dependencies. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { nameTokens, primaryCity, matchScore, pickMatch, toRecord, normalizeUrl, stableStringify, diffRecords, DETAIL_FIELDS, CORE_FIELDS, INCOME_BANDS } from "./lib/scorecard.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fx = JSON.parse(readFileSync(join(ROOT, "scripts/fixtures/scorecard-sample.json"), "utf8"));
let passed = 0, failed = 0;
const test = (n, fn) => { try { fn(); passed++; } catch (e) { failed++; console.error(`✖ ${n}\n   ${e.message}`); } };
const pick = (ours, city) => pickMatch(ours, fx.cityCandidates[city]);

test("nameTokens strips filler, parentheticals and punctuation", () => {
  assert.deepEqual(nameTokens("Texas A&M University"), ["texas", "a", "m"]);
  assert.deepEqual(nameTokens("Howard University (HBCU)"), ["howard"]);
  assert.deepEqual(nameTokens("The University of Texas at Austin"), ["texas", "austin"]);
  assert.deepEqual(nameTokens("University of Wisconsin–Madison"), ["wisconsin", "madison"]);
});
test("primaryCity takes the first city", () => {
  assert.equal(primaryCity("San Marcos & Round Rock"), "San Marcos");
  assert.equal(primaryCity("Denton · Dallas · Houston"), "Denton");
  assert.equal(primaryCity("Houston"), "Houston");
});
test("Rice wins among many Houston schools", () => { const m = pick("Rice University", "Houston"); assert.equal(m.quality, "strong"); assert.equal(m.unitid, 227757); });
test("University of Houston beats UH-Downtown (closer name)", () => { const m = pick("University of Houston", "Houston"); assert.equal(m.unitid, 225511); assert.equal(m.quality, "strong"); });
test("Texas Southern (HBCU) matches", () => assert.equal(pick("Texas Southern University (HBCU)", "Houston").unitid, 229063));
test("UTSA beats the UT health campus in San Antonio", () => assert.equal(pick("University of Texas at San Antonio", "San Antonio").unitid, 229027));
test("Trinity in San Antonio", () => assert.equal(pick("Trinity University", "San Antonio").unitid, 229179));
test("Texas A&M ↔ 'Texas A & M University-College Station'", () => { const m = pick("Texas A&M University", "College Station"); assert.equal(m.quality, "strong"); assert.equal(m.unitid, 228723); });
test("UCLA beats USC and Cal State LA", () => assert.equal(pick("University of California, Los Angeles (UCLA)", "Los Angeles").unitid, 110662));
test("Spelman vs Georgia Tech in Atlanta", () => {
  assert.equal(pick("Spelman College (HBCU, women's college)", "Atlanta").unitid, 141060);
  assert.equal(pick("Georgia Institute of Technology", "Atlanta").unitid, 139755);
});
test("Virginia Tech is a weak match flagged for review", () => { const m = pick("Virginia Tech", "Blacksburg"); assert.equal(m.quality, "weak"); assert.equal(m.unitid, 233921); });
test("No candidates → unresolved", () => assert.equal(pickMatch("Anything", []).quality, "unresolved"));
test("Unrelated names → unresolved, never guessed", () => assert.equal(pickMatch("Baylor University", fx.cityCandidates["Atlanta"]).quality, "unresolved"));
test("matchScore prefers full coverage", () => assert.ok(matchScore("Rice University", "Rice University") > matchScore("Rice University", "Houston Christian University")));

test("toRecord maps a real private response (Rice)", () => {
  const r = toRecord(fx.detail.rice);
  assert.equal(r.unitid, 227757); assert.equal(r.ownership, "private");
  assert.equal(r.tuitionOut, 67857); assert.equal(r.coa, 87824); assert.equal(r.admissionRate, 0.08);
  assert.equal(r.avgNetPrice, 11164); assert.equal(r.gradRate, 0.9531); assert.equal(r.medianEarnings10yr, 90773);
  assert.equal(r.netPriceByIncome, null);
  assert.equal(r.priceCalculatorUrl, "https://financialaid.rice.edu/cost-attendance/estimate-your-cost");
});
test("toRecord maps public net price by income (UT Austin) and nulls missing fields", () => {
  const r = toRecord(fx.detail.utaustin);
  assert.equal(r.ownership, "public");
  assert.equal(r.netPriceByIncome["0-30000"], 8979); assert.equal(r.netPriceByIncome["110001-plus"], 30480);
  assert.equal(r.tuitionIn, null); assert.equal(r.admissionRate, null);
});
test("normalizeUrl adds https and rejects junk", () => {
  assert.equal(normalizeUrl("www.mit.edu/"), "https://www.mit.edu/");
  assert.equal(normalizeUrl("http://x.edu"), "https://x.edu");
  assert.equal(normalizeUrl("not a url"), null);
  assert.equal(normalizeUrl(null), null);
});
test("field lists: core ⊂ detail, five income bands, both ownerships", () => {
  CORE_FIELDS.forEach(f => assert.ok(DETAIL_FIELDS.includes(f), f));
  assert.equal(INCOME_BANDS.length, 5);
  assert.equal(DETAIL_FIELDS.filter(f => f.includes("by_income_level")).length, 10);
});
test("stableStringify is key-order independent", () => assert.equal(stableStringify({ b: 1, a: { d: 2, c: 3 } }), stableStringify({ a: { c: 3, d: 2 }, b: 1 })));
test("diffRecords lists only changed summary fields", () => {
  assert.deepEqual(diffRecords({ tuitionOut: 1, coa: 2 }, { tuitionOut: 1, coa: 3 }), [{ field: "coa", from: 2, to: 3 }]);
  assert.deepEqual(diffRecords(undefined, { tuitionOut: 5 }).map(d => d.field), ["tuitionOut"]);
});

if (failed) { console.error(`\n✖ ${failed} failed, ${passed} passed`); process.exit(1); }
console.log(`✓ ${passed} university-data tests passed`);
