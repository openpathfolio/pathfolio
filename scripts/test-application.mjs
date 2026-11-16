#!/usr/bin/env node
/**
 * Unit tests for assets/application.js (PF_APP). No dependencies; Node 18+.
 *   node scripts/test-application.mjs
 * Spec: specs/002-application-builder/ · Contract: contracts/pf-app-api.md
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ctx = vm.createContext({ Intl, console });
for (const f of ["assets/data/common/content.js", "assets/application.js"])
  vm.runInContext(readFileSync(join(ROOT, f), "utf8"), ctx, { filename: f });
const A = vm.runInContext("PF_APP", ctx);
const LIMITS = vm.runInContext("APP_LIMITS", ctx);
const fixtureV1 = JSON.parse(readFileSync(join(ROOT, "scripts/fixtures/backup-v1.json"), "utf8"));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; console.error(`✖ ${name}\n   ${e.message}`); }
}
const clone = o => JSON.parse(JSON.stringify(o));
/* Objects created inside the vm context have different prototypes, so compare by value */
const same = (a, b, msg) => assert.deepStrictEqual(clone(a), clone(b), msg);

/* ---- counting & limits ---- */
test("countChars basics", () => { assert.equal(A.countChars(""), 0); assert.equal(A.countChars(null), 0); assert.equal(A.countChars("abc"), 3); });
test("countChars treats emoji and accents as one character", () => {
  assert.equal(A.countChars("café"), 4);
  assert.equal(A.countChars("café"), 4);          // e + combining accent
  assert.equal(A.countChars("👍🏽"), 1);                // emoji + skin tone
  assert.equal(A.countChars("👨‍👩‍👧"), 1);                // ZWJ family
});
test("limitStatus flags over limit", () => {
  same(A.limitStatus("x".repeat(150), 150), { count: 150, limit: 150, over: false, left: 0 });
  assert.equal(A.limitStatus("x".repeat(163), 150).over, true);
});
test("limits match Common App conventions", () => {
  assert.equal(LIMITS.activities, 10); assert.equal(LIMITS.honors, 5);
  assert.equal(LIMITS.position, 50); assert.equal(LIMITS.org, 100); assert.equal(LIMITS.description, 150); assert.equal(LIMITS.honorTitle, 100);
});

/* ---- tips ---- */
test("weakOpener finds weak starts, longest match, word boundary", () => {
  assert.equal(A.weakOpener("Member of the robotics club"), "Member of");
  assert.equal(A.weakOpener("helped with fundraising"), "Helped with");
  assert.equal(A.weakOpener("Helped organize a drive"), "Helped");
  assert.equal(A.weakOpener("Helpful mentor to freshmen"), null);
  assert.equal(A.weakOpener("Led a 12-person build team"), null);
  assert.equal(A.weakOpener(""), null);
});

/* ---- details ---- */
test("cleanDetails removes empties and returns undefined when nothing left", () => {
  assert.equal(A.cleanDetails({ position: "  ", grades: [], org: null, hoursPerWeek: NaN }), undefined);
  same(A.cleanDetails({ position: " Captain ", grades: [10, 11], continueInCollege: false, hoursPerWeek: 0 }),
    { position: "Captain", grades: [10, 11], continueInCollege: false, hoursPerWeek: 0 });
});
test("gradesLabel ranges", () => {
  assert.equal(A.gradesLabel([11, 10]), "10–11");
  assert.equal(A.gradesLabel([9, 10, 11, 12]), "9–12");
  assert.equal(A.gradesLabel([9, 11]), "9, 11");
  assert.equal(A.gradesLabel([12]), "12");
  assert.equal(A.gradesLabel([]), "");
});

/* ---- ordering ---- */
const plan = [
  { id: "a", text: "Robotics", cat: "compete", isActivity: true },
  { id: "b", text: "Job", cat: "custom", isActivity: true },
  { id: "c", text: "Award", cat: "cert", isHonor: true, isActivity: true },
  { id: "d", text: "Course", cat: "course" }
];
test("normalizeOrders drops missing/unflagged, appends new, dedupes", () => {
  const o = A.normalizeOrders(plan, { activityOrder: ["b", "zz", "b", "d"], honorOrder: [] });
  same(o.activityOrder, ["b", "a", "c"]);
  same(o.honorOrder, ["c"]);
});
test("normalizeOrders is idempotent", () => {
  const once = A.normalizeOrders(plan, { activityOrder: ["c"] });
  same(A.normalizeOrders(plan, once), once);
});
test("included splits at the limit", () => {
  const ids = Array.from({ length: 12 }, (_, i) => "x" + i);
  const r = A.included(ids, 10);
  assert.equal(r.included.length, 10); same(r.overflow, ["x10", "x11"]);
});

/* ---- exports ---- */
const detailed = [
  { id: "a", text: "FIRST Robotics", cat: "compete", isActivity: true,
    details: { type: "Robotics", position: "Build lead", org: "Team 1234", description: "Led 12-person build team; designed drivetrain; won 2024 regional innovation award.",
      grades: [10, 11], timing: ["school"], hoursPerWeek: 10, weeksPerYear: 30, continueInCollege: true, impact: "Team reached state for the first time" } },
  { id: "b", text: "Part-time job", cat: "custom", isActivity: true, details: { description: "x".repeat(163) } }
];
test("activityText lists Common App fields in order", () => {
  const t = A.activityText(detailed, LIMITS);
  assert.match(t, /ACTIVITIES \(Common App format\): 2 of 10/);
  assert.match(t, /1\. FIRST Robotics\n   Activity type: Robotics\n   Position\/leadership \(10\/50\): Build lead/);
  assert.match(t, /Grade levels: 10–11 · Timing: During school year/);
  assert.match(t, /Hours\/week: 10 · Weeks\/year: 30 · Continue in college: Yes/);
});
test("activityText flags over-limit and missing fields", () => {
  const t = A.activityText(detailed, LIMITS);
  assert.match(t, /⚠ Description over limit \(163\/150\)/);
  assert.match(t, /⚠ Activity type missing/);
});
test("honorText shows recognition and flags missing", () => {
  const t = A.honorText([{ id: "c", text: "Regional award", cat: "cert", isHonor: true, details: { honorGrades: [11], recognition: "State/Regional" } },
    { id: "e", text: "Honor roll", cat: "custom", isHonor: true }], LIMITS);
  assert.match(t, /1\. Regional award \(14\/100\)\n   Grade levels: 11 · Recognition: State\/Regional/);
  assert.match(t, /⚠ Recognition level missing/);
});
test("resumeModel uses entered data only and respects limits", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ id: "m" + i, text: "Act " + i, cat: "custom", isActivity: true }));
  const m = A.resumeModel({ gradYear: 2028, gpa: "" }, [...many, { id: "k", text: "CompTIA A+", cat: "cert", done: true }], {}, { name: "", skills: "Python, CAD; Spanish" });
  assert.equal(m.activities.length, 10);
  assert.equal(m.education.gpa, "");
  assert.equal(m.name, "");
  same(m.certifications, ["CompTIA A+"]);
  same(m.skills, ["Python", "CAD", "Spanish"]);
});
test("bragText includes activities, impact and note", () => {
  const m = A.resumeModel({ gradYear: 2028, gpa: "4.1" }, detailed, {}, { school: "Any High School", interests: ["Robotics"], note: "Ask me about our drivetrain." });
  const t = A.bragText(m);
  assert.match(t, /Any High School · Class of 2028 · GPA 4\.1/);
  assert.match(t, /Interested in: Robotics/);
  assert.match(t, /Impact: Team reached state for the first time/);
  assert.match(t, /Ask me about our drivetrain\./);
});

test("resumeText uses only entered data and omits empty sections", () => {
  const m = A.resumeModel({ gradYear: 2028 }, detailed, {}, { name: "Sam Rivera", school: "Any High School", skills: "Python" });
  const t = A.resumeText(m);
  assert.match(t, /^SAM RIVERA\n/);
  assert.match(t, /EDUCATION\nAny High School · Class of 2028/);
  assert.match(t, /- FIRST Robotics: Build lead, Team 1234 \(Gr 10–11 · 10 hrs\/wk\)/);
  assert.doesNotMatch(t, /HONORS/);
  assert.match(A.resumeText(A.resumeModel({}, [], {}, {})), /add details in My Plan/);
});

/* ---- backups ---- */
test("migrateBackup upgrades v1 fixture without loss", () => {
  const { data, warning, fromVersion } = A.migrateBackup(clone(fixtureV1), 2);
  assert.equal(fromVersion, 1); assert.equal(warning, null); assert.equal(data.version, 2);
  assert.equal(data.plan.length, fixtureV1.plan.length);
  fixtureV1.plan.forEach((p, i) => { assert.equal(data.plan[i].id, p.id); assert.equal(data.plan[i].text, p.text); assert.equal(data.plan[i].done, p.done); });
  same(data.application.activityOrder, []); same(data.profile, fixtureV1.profile); same(data.quiz, fixtureV1.quiz);
});
test("migrateBackup round-trips v2 details and orders", () => {
  const v2 = { app: "pathfolio", version: 2, plan: clone(plan).concat(clone(detailed).map(d => ({ ...d, id: d.id + "2" }))), application: { activityOrder: ["c", "a", "b"], honorOrder: ["c"], note: "hi" } };
  const { data } = A.migrateBackup(v2, 2);
  same(data.application.activityOrder.slice(0, 3), ["c", "a", "b"]);
  assert.equal(data.application.note, "hi");
  assert.equal(data.plan.find(p => p.id === "a2").details.position, "Build lead");
});
test("migrateBackup flags newer versions and rejects non-Pathfolio input", () => {
  assert.equal(A.migrateBackup({ app: "pathfolio", version: 3, plan: [] }, 2).warning, "newer");
  assert.throws(() => A.migrateBackup({ hello: 1 }, 2), /not a Pathfolio backup/);
  assert.throws(() => A.migrateBackup(null, 2));
});
test("mergePlans keeps non-empty current details, fills empties, ORs flags", () => {
  const cur = [{ id: "a", text: "R", cat: "c", done: false, details: { position: "Lead" } }, { id: "z", text: "only here", cat: "c" }];
  const inc = [{ id: "a", text: "R", cat: "c", done: true, isActivity: true, details: { position: "Member", org: "Team" } }, { id: "n", text: "new", cat: "c" }];
  const out = A.mergePlans(cur, inc);
  const a = out.find(p => p.id === "a");
  assert.equal(a.done, true); assert.equal(a.isActivity, true);
  assert.equal(a.details.position, "Lead"); assert.equal(a.details.org, "Team");
  same(out.map(p => p.id), ["a", "z", "n"]);
});
test("mergeOrders keeps current order then new ids", () => same(A.mergeOrders(["b", "a"], ["a", "c"]), ["b", "a", "c"]));
test("summaryLine", () => assert.equal(A.summaryLine(detailed[0]), "Build lead · Gr 10–11 · 10 h/wk · 30 wk/yr"));

if (failed) { console.error(`\n✖ ${failed} failed, ${passed} passed`); process.exit(1); }
console.log(`✓ ${passed} application-builder tests passed`);
