/* ============================================================
   Pathfolio: application builder logic (spec 002)
   Pure functions only: no DOM, no storage, no network.
   Loaded in the browser before app.js (global PF_APP) and unit-tested
   in CI by scripts/test-application.mjs (node:vm).
   Contract: specs/002-application-builder/contracts/pf-app-api.md
   ============================================================ */
(function (root) {
  "use strict";

  /* Shared data lives in content.js as top-level `const`s. Those are global lexical bindings,
     not properties of window, so reference them by name with a typeof guard. */
  const LIMITS = () => (typeof APP_LIMITS !== "undefined" && APP_LIMITS) || { activities: 10, honors: 5, position: 50, org: 100, description: 150, honorTitle: 100, hoursWarn: 40, weeksMax: 52 };

  /* ---------- Text helpers ---------- */
  let segmenter = null;
  try { if (typeof Intl !== "undefined" && Intl.Segmenter) segmenter = new Intl.Segmenter("en", { granularity: "grapheme" }); } catch (e) { segmenter = null; }

  /** Characters as a person counts them (emoji and accented letters count as 1). */
  function countChars(s) {
    if (s === null || s === undefined || s === "") return 0;
    const str = String(s);
    if (segmenter) { let n = 0; for (const _ of segmenter.segment(str)) n++; return n; }
    return Array.from(str).length;
  }

  function limitStatus(s, limit) {
    const count = countChars(s);
    return { count, limit, over: count > limit, left: limit - count };
  }

  /** Returns the weak opener a description starts with, or null. Longest match wins. */
  function weakOpener(s, openers) {
    const list = (openers || (typeof WEAK_OPENERS !== "undefined" && WEAK_OPENERS) || []).slice().sort((a, b) => b.length - a.length);
    const t = String(s || "").trim().toLowerCase();
    if (!t) return null;
    for (const o of list) {
      const lo = o.toLowerCase();
      if (t.startsWith(lo) && (t.length === lo.length || /[\s,.;:!?-]/.test(t[lo.length]))) return o;
    }
    return null;
  }

  /** Remove empty values. Returns undefined when nothing meaningful is left. */
  function cleanDetails(d) {
    if (!d || typeof d !== "object") return undefined;
    const out = {};
    for (const [k, v] of Object.entries(d)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "string") { const t = v.trim(); if (t) out[k] = t; continue; }
      if (typeof v === "number") { if (Number.isFinite(v)) out[k] = v; continue; }
      if (Array.isArray(v)) { if (v.length) out[k] = v.slice(); continue; }
      if (typeof v === "boolean") { out[k] = v; continue; }
    }
    return Object.keys(out).length ? out : undefined;
  }

  /** [10,11] → "10–11"; [9,11] → "9, 11"; [12] → "12"; [] → "" */
  function gradesLabel(grades) {
    const gs = [...new Set((grades || []).map(Number).filter(n => Number.isInteger(n)))].sort((a, b) => a - b);
    if (!gs.length) return "";
    const runs = [];
    let start = gs[0], prev = gs[0];
    for (let i = 1; i <= gs.length; i++) {
      if (gs[i] === prev + 1) { prev = gs[i]; continue; }
      runs.push(start === prev ? String(start) : `${start}–${prev}`);
      start = prev = gs[i];
    }
    return runs.join(", ");
  }

  /* ---------- Ordering ---------- */
  function normalizeList(plan, order, flag) {
    const flagged = plan.filter(p => p && p[flag]).map(p => p.id);
    const set = new Set(flagged);
    const seen = new Set();
    const out = [];
    for (const id of order || []) if (set.has(id) && !seen.has(id)) { seen.add(id); out.push(id); }
    for (const id of flagged) if (!seen.has(id)) { seen.add(id); out.push(id); }
    return out;
  }
  /** Drop missing/unflagged ids, append newly flagged ones, dedupe. Idempotent. */
  function normalizeOrders(plan, orders) {
    const o = orders || {};
    return { activityOrder: normalizeList(plan || [], o.activityOrder, "isActivity"), honorOrder: normalizeList(plan || [], o.honorOrder, "isHonor") };
  }
  function included(order, n) { const o = order || []; return { included: o.slice(0, n), overflow: o.slice(n) }; }

  /* ---------- Field accessors (entered data only; nothing invented) ---------- */
  const D = it => (it && it.details) || {};
  function activityIssues(it, L) {
    const d = D(it), lim = L || LIMITS(), issues = [];
    [["position", lim.position, "Position"], ["org", lim.org, "Organization"], ["description", lim.description, "Description"]].forEach(([k, n, label]) => {
      const st = limitStatus(d[k], n); if (st.over) issues.push(`${label} over limit (${st.count}/${n})`);
    });
    if (!d.description) issues.push("Description missing");
    if (!d.type) issues.push("Activity type missing");
    if (!(d.grades && d.grades.length)) issues.push("Grade levels missing");
    return issues;
  }
  function honorIssues(it, L) {
    const d = D(it), lim = L || LIMITS(), issues = [];
    const st = limitStatus(d.honorTitle || it.text, lim.honorTitle);
    if (st.over) issues.push(`Title over limit (${st.count}/${lim.honorTitle})`);
    if (!d.recognition) issues.push("Recognition level missing");
    if (!(d.honorGrades && d.honorGrades.length)) issues.push("Grade levels missing");
    return issues;
  }

  function timingLabel(t) {
    const T = (typeof TIMING !== "undefined" && TIMING) || { school: "During school year", break: "During school break", year: "All year" };
    return (t || []).map(k => T[k] || k).join(", ");
  }

  /* ---------- Plain-text exports ---------- */
  function activityText(items, L) {
    const lim = L || LIMITS();
    if (!items || !items.length) return "ACTIVITIES\n(none yet)";
    const lines = [`ACTIVITIES (Common App format): ${items.length} of ${lim.activities}`, ""];
    items.forEach((it, i) => {
      const d = D(it);
      lines.push(`${i + 1}. ${it.text}`);
      lines.push(`   Activity type: ${d.type || "—"}`);
      lines.push(`   Position/leadership (${countChars(d.position)}/${lim.position}): ${d.position || "—"}`);
      lines.push(`   Organization (${countChars(d.org)}/${lim.org}): ${d.org || "—"}`);
      lines.push(`   Description (${countChars(d.description)}/${lim.description}): ${d.description || "—"}`);
      lines.push(`   Grade levels: ${gradesLabel(d.grades) || "—"} · Timing: ${timingLabel(d.timing) || "—"}`);
      lines.push(`   Hours/week: ${d.hoursPerWeek ?? "—"} · Weeks/year: ${d.weeksPerYear ?? "—"} · Continue in college: ${d.continueInCollege === true ? "Yes" : d.continueInCollege === false ? "No" : "—"}`);
      activityIssues(it, lim).forEach(x => lines.push(`   ⚠ ${x}`));
      lines.push("");
    });
    return lines.join("\n").trimEnd();
  }

  function honorText(items, L) {
    const lim = L || LIMITS();
    if (!items || !items.length) return "HONORS\n(none yet)";
    const lines = [`HONORS (Common App format): ${items.length} of ${lim.honors}`, ""];
    items.forEach((it, i) => {
      const d = D(it), title = d.honorTitle || it.text;
      lines.push(`${i + 1}. ${title} (${countChars(title)}/${lim.honorTitle})`);
      lines.push(`   Grade levels: ${gradesLabel(d.honorGrades) || "—"} · Recognition: ${d.recognition || "—"}`);
      honorIssues(it, lim).forEach(x => lines.push(`   ⚠ ${x}`));
      lines.push("");
    });
    return lines.join("\n").trimEnd();
  }

  /**
   * Resume / brag-sheet model from entered data only.
   * extra: { name, school, contact, skills, interests:[string], note }
   */
  function resumeModel(profile, plan, orders, extra) {
    const p = profile || {}, x = extra || {}, L = LIMITS();
    const byId = new Map((plan || []).map(it => [it.id, it]));
    const o = normalizeOrders(plan || [], orders);
    const acts = included(o.activityOrder, L.activities).included.map(id => byId.get(id)).filter(Boolean);
    const hons = included(o.honorOrder, L.honors).included.map(id => byId.get(id)).filter(Boolean);
    const honorIds = new Set(hons.map(h => h.id));
    return {
      name: x.name || "",
      contact: x.contact || "",
      education: { school: x.school || "", gradYear: p.gradYear || null, gpa: p.gpa || "" },
      interests: (x.interests || []).filter(Boolean),
      activities: acts.map(it => {
        const d = D(it);
        return { title: d.org || it.text, label: it.text, position: d.position || "", grades: gradesLabel(d.grades),
          hoursPerWeek: d.hoursPerWeek ?? null, weeksPerYear: d.weeksPerYear ?? null, description: d.description || "", impact: d.impact || "", link: d.link || "" };
      }),
      honors: hons.map(it => { const d = D(it); return { title: d.honorTitle || it.text, grades: gradesLabel(d.honorGrades), recognition: d.recognition || "" }; }),
      certifications: (plan || []).filter(it => it.cat === "cert" && it.done && !honorIds.has(it.id)).map(it => it.text),
      skills: (x.skills || "").split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
      note: x.note || ""
    };
  }

  function bragText(m) {
    const lines = ["BRAG SHEET (for my recommenders)", ""];
    if (m.name) lines.push(`Name: ${m.name}`);
    const ed = [m.education.school, m.education.gradYear ? `Class of ${m.education.gradYear}` : "", m.education.gpa ? `GPA ${m.education.gpa}` : ""].filter(Boolean).join(" · ");
    if (ed) lines.push(ed);
    if (m.interests.length) lines.push(`Interested in: ${m.interests.join(", ")}`);
    lines.push("", "ACTIVITIES & IMPACT");
    if (!m.activities.length) lines.push("(none yet)");
    m.activities.forEach((a, i) => {
      const meta = [a.position, a.grades ? `Gr ${a.grades}` : "", a.hoursPerWeek != null ? `${a.hoursPerWeek} hrs/wk` : ""].filter(Boolean).join(" · ");
      lines.push(`${i + 1}. ${a.label}${meta ? ` (${meta})` : ""}`);
      if (a.description) lines.push(`   ${a.description}`);
      if (a.impact) lines.push(`   Impact: ${a.impact}`);
    });
    lines.push("", "HONORS & AWARDS");
    if (!m.honors.length) lines.push("(none yet)");
    m.honors.forEach((h, i) => lines.push(`${i + 1}. ${h.title}${[h.grades ? `Gr ${h.grades}` : "", h.recognition].filter(Boolean).length ? ` (${[h.grades ? `Gr ${h.grades}` : "", h.recognition].filter(Boolean).join(", ")})` : ""}`));
    if (m.certifications.length) { lines.push("", "CERTIFICATIONS"); m.certifications.forEach(c => lines.push(`- ${c}`)); }
    lines.push("", "WHAT I'D LIKE YOU TO KNOW", m.note || "(add a note in the Brag sheet tab)");
    return lines.join("\n");
  }

  function resumeText(m) {
    const out = [];
    if (m.name) out.push(m.name.toUpperCase());
    if (m.contact) out.push(m.contact);
    const ed = [m.education.school, m.education.gradYear ? `Class of ${m.education.gradYear}` : "", m.education.gpa ? `GPA ${m.education.gpa}` : ""].filter(Boolean).join(" · ");
    if (ed) out.push("", "EDUCATION", ed);
    if (m.activities.length) {
      out.push("", "ACTIVITIES & LEADERSHIP");
      m.activities.forEach(a => {
        const head = [a.label, [a.position, a.title !== a.label ? a.title : ""].filter(Boolean).join(", ")].filter(Boolean).join(": ");
        const meta = [a.grades ? `Gr ${a.grades}` : "", a.hoursPerWeek != null ? `${a.hoursPerWeek} hrs/wk` : ""].filter(Boolean).join(" · ");
        out.push(`- ${head}${meta ? ` (${meta})` : ""}`);
        if (a.description) out.push(`  ${a.description}`);
        if (a.impact) out.push(`  ${a.impact}`);
      });
    }
    if (m.honors.length) { out.push("", "HONORS & AWARDS"); m.honors.forEach(h => out.push(`- ${h.title}${[h.grades ? `Gr ${h.grades}` : "", h.recognition].filter(Boolean).length ? ` (${[h.grades ? `Gr ${h.grades}` : "", h.recognition].filter(Boolean).join(", ")})` : ""}`)); }
    if (m.certifications.length) { out.push("", "CERTIFICATIONS"); m.certifications.forEach(c => out.push(`- ${c}`)); }
    if (m.skills.length) out.push("", "SKILLS", m.skills.join(" · "));
    return out.join("\n").trim() || "(add details in My Plan to build your resume)";
  }

  /* ---------- Backups ---------- */
  function migrateBackup(data, currentVersion) {
    const cur = currentVersion || 2;
    if (!data || typeof data !== "object" || data.app !== "pathfolio" || !Array.isArray(data.plan)) throw new Error("This file is not a Pathfolio backup.");
    const version = Number.isInteger(data.version) ? data.version : 1;
    const plan = data.plan.filter(p => p && typeof p.id === "string" && typeof p.text === "string" && typeof p.cat === "string").map(p => {
      const it = { id: p.id, text: p.text, cat: p.cat, path: p.path || null, done: !!p.done };
      if (p.isActivity) it.isActivity = true;
      if (p.isHonor) it.isHonor = true;
      const d = cleanDetails(p.details); if (d) it.details = d;
      return it;
    });
    const app = (data.application && typeof data.application === "object") ? data.application : {};
    const application = { ...normalizeOrders(plan, app), note: typeof app.note === "string" ? app.note : "", resume: (app.resume && typeof app.resume === "object") ? app.resume : {} };
    return {
      data: { app: "pathfolio", version: cur, exportedAt: data.exportedAt || null, profile: data.profile && typeof data.profile === "object" ? data.profile : null, quiz: data.quiz || null, plan, application },
      fromVersion: version,
      warning: version > cur ? "newer" : null
    };
  }

  /** Merge incoming plan into current: done/flags OR-ed; each detail field kept if non-empty, else filled from incoming. */
  function mergePlans(current, incoming) {
    const out = (current || []).map(p => ({ ...p, details: p.details ? { ...p.details } : undefined }));
    const byId = new Map(out.map(p => [p.id, p]));
    for (const p of incoming || []) {
      const cur = byId.get(p.id);
      if (!cur) { const copy = { ...p, details: p.details ? { ...p.details } : undefined }; out.push(copy); byId.set(p.id, copy); continue; }
      cur.done = !!(cur.done || p.done);
      if (p.isActivity) cur.isActivity = true;
      if (p.isHonor) cur.isHonor = true;
      if (p.details) {
        const merged = { ...(cur.details || {}) };
        for (const [k, v] of Object.entries(p.details)) if (cleanDetails({ [k]: merged[k] }) === undefined) merged[k] = v;
        cur.details = cleanDetails(merged);
      }
    }
    out.forEach(p => { if (!p.details) delete p.details; });
    return out;
  }
  function mergeOrders(a, b) { return [...new Set([...(a || []), ...(b || [])])]; }

  /** One-line summary for a plan row, e.g. "Build lead · Gr 10–11 · 5 h/wk · 30 wk/yr" */
  function summaryLine(it) {
    const d = D(it);
    return [d.position, d.grades && d.grades.length ? `Gr ${gradesLabel(d.grades)}` : "", d.hoursPerWeek != null ? `${d.hoursPerWeek} h/wk` : "", d.weeksPerYear != null ? `${d.weeksPerYear} wk/yr` : "", d.recognition || ""]
      .filter(Boolean).join(" · ");
  }

  root.PF_APP = Object.freeze({
    countChars, limitStatus, weakOpener, cleanDetails, gradesLabel, normalizeOrders, included,
    activityIssues, honorIssues, timingLabel, activityText, honorText, resumeModel, bragText, resumeText,
    migrateBackup, mergePlans, mergeOrders, summaryLine
  });
})(typeof window !== "undefined" ? window : globalThis);
