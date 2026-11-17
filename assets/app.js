/* Pathfolio: app logic (vanilla JS, no dependencies) */
(function () {
  "use strict";

  /* ---------------- Helpers ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const money = n => "$" + Math.round(n).toLocaleString("en-US");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("pathfolio:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("pathfolio:" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return "i" + (h >>> 0).toString(36); };
  const PATH_BY_ID = Object.fromEntries(PATHS.map(p => [p.id, p]));
  const employersOf = p => (p.employers && (p.employers[profile.state] || Object.values(p.employers)[0])) || "Varies by region";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  $$(".updated").forEach(el => (el.textContent = DATA_UPDATED));
  $("#repoLink").href = SITE_REPO + "/issues/new/choose";

  /* ---------------- Profile ---------------- */
  function defaultGradYear(grade) {
    const now = new Date();
    const schoolEnd = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
    return schoolEnd + (12 - grade);
  }
  let profile = store.get("profile", { state: "TX", grade: 11, gradYear: defaultGradYear(11), rank: null, gpa: "", region: "any", budget: "any", areas: [] });

  if (!STATES[profile.state]) profile.state = "TX";
  const ST = () => STATES[profile.state];
  $("#pState").innerHTML = STATE_LIST.map(s => `<option value="${s.code}" ${s.available ? "" : "disabled"}>${esc(s.name)}${s.available ? "" : " (coming soon)"}</option>`).join("");
  function fillRegions() {
    $("#pRegion").innerHTML = `<option value="any">Anywhere in ${esc(ST().name)}</option>` + ST().regions.map(r => `<option>${esc(r)}</option>`).join("");
    fillUniRegions();
    $$(".state-name").forEach(el => (el.textContent = ST().name));
  }
  fillRegions();
  $("#pAreas").innerHTML = Object.entries(AREAS).map(([k, v]) =>
    `<label class="chip"><input type="checkbox" value="${k}"><span>${esc(v)}</span></label>`).join("");

  function fillProfileForm() {
    $("#pState").value = profile.state; $("#pGrade").value = profile.grade; $("#pGrad").value = profile.gradYear;
    $("#pRank").value = profile.rank ?? ""; $("#pGpa").value = profile.gpa || "";
    $("#pRegion").value = profile.region; $("#pBudget").value = profile.budget;
    $$("#pAreas input").forEach(i => (i.checked = profile.areas.includes(i.value)));
  }
  fillProfileForm();
  $("#pGrade").addEventListener("change", () => ($("#pGrad").value = defaultGradYear(+$("#pGrade").value)));
  $("#profileForm").addEventListener("submit", e => {
    e.preventDefault();
    const r = parseFloat($("#pRank").value);
    profile = {
      state: STATES[$("#pState").value] ? $("#pState").value : "TX",
      grade: +$("#pGrade").value, gradYear: +$("#pGrad").value || defaultGradYear(+$("#pGrade").value),
      rank: r > 0 && r <= 100 ? r : null, gpa: $("#pGpa").value.trim(),
      region: $("#pRegion").value, budget: $("#pBudget").value,
      areas: $$("#pAreas input:checked").map(i => i.value)
    };
    store.set("profile", profile);
    $("#profileMsg").textContent = "✓ Saved. University fit, roadmap and quiz results now use this profile.";
    fillRegions(); $("#pRegion").value = profile.region; renderStateStatic();
    renderRank(); renderUnis(); renderRoadmap(); renderOpps();
  });

  /* ---------------- Rank check ---------------- */
  function renderRank() {
    const r = profile.rank;
    if (!r) return;
    const rows = ST().rankRules.map(x => [x.label, r <= x.pct, x.yes, x.no]);
    $("#rankResult").innerHTML = `<p>Class rank: <strong>top ${r}%</strong></p><ul class='rank-list'>` + rows.map(([n, ok, yes, no]) =>
      `<li class="${ok ? "ok" : "warn"}"><strong>${ok ? "✅" : "🔎"} ${esc(n)}:</strong> ${esc(ok ? yes : no)}</li>`).join("") + "</ul>";
  }
  renderRank();
  function renderStateStatic() {
    $("#essentials").innerHTML = ST().essentials.map(e => `<div class="card"><h3>${esc(e.t)}</h3><p>${esc(e.d)}</p></div>`).join("");
    $("#pathwayList").innerHTML = ST().pathways.map(p => `<a class="card res" href="${p.url}" target="_blank" rel="noopener"><div><strong>${esc(p.name)} ↗</strong><p class="small muted">${esc(p.desc)}</p></div></a>`).join("");
    $("#resOfficial").innerHTML = [...ST().officialLinks, ...RESOURCES.official].map(r => `<a href="${r.url}" target="_blank" rel="noopener">${esc(r.title)} ↗</a>`).join("");
  }

  /* ---------------- Residency-aware costs & rules (spec 003) ---------------- */
  const NAT = typeof NATIONAL !== "undefined" ? NATIONAL : { regions: [], universities: [] };
  const isResident = u => u.state === profile.state;
  /** Tuition/cost as it applies to this family: in-state for their own state, otherwise out-of-state. */
  function costOf(u) {
    if (isResident(u)) {
      const tuition = u.tuitionIn ?? u.tuition;
      const coa = u.coa ?? (u.coaOut != null ? u.coaOut - ((u.tuitionOut ?? 0) - (u.tuitionIn ?? 0)) : null);
      return { tuition, coa, label: "in-state" };
    }
    if (u.tuitionOut != null) return { tuition: u.tuitionOut, coa: u.coaOut, label: "out-of-state" };
    return { tuition: u.tuition, coa: u.coa, label: "resident rate; out-of-state not listed" };
  }
  function scopedUniversities(scope) {
    if (scope === "national") return NAT.universities;
    if (scope === "all") return [...ST().universities, ...NAT.universities];
    return ST().universities;
  }
  function fillUniRegions() {
    /* Runs at startup via fillRegions(), before NAT is initialized below, so read the global directly */
    const natRegions = typeof NATIONAL !== "undefined" ? NATIONAL.regions : [];
    const scope = $("#fScope") ? $("#fScope").value : "home";
    const regions = scope === "national" ? natRegions : scope === "all" ? [...ST().regions, ...natRegions] : ST().regions;
    const cur = $("#fRegion").value;
    $("#fRegion").innerHTML = `<option value="all">All regions</option>` + regions.map(r => `<option>${esc(r)}</option>`).join("");
    if (regions.includes(cur)) $("#fRegion").value = cur;
  }

  /* ---------------- University fit ---------------- */
  const SEL_LABEL = { highly: "Highly selective", selective: "Selective", moderate: "Moderately selective", accessible: "Accessible" };
  function fitFor(u, rank) {
    if (rank == null) return null;
    const auto = !!(u.autoPct && isResident(u) && rank <= u.autoPct);   /* state rules apply only to residents (FR-004) */
    /* Public universities admit non-residents at lower rates, so treat them one selectivity level harder (spec 003) */
    const STEP = { accessible: "moderate", moderate: "selective", selective: "highly", highly: "highly" };
    const sel = u.type === "Public" && !isResident(u) ? STEP[u.sel] : u.sel;
    let tier;
    if (sel === "highly") tier = auto ? "target" : "reach";
    else if (sel === "selective") tier = auto || rank <= 25 ? "target" : "reach";
    else if (sel === "moderate") tier = auto || rank <= 25 ? "likely" : "target";
    else tier = auto || rank <= 50 ? "likely" : "target";
    return { tier, auto };
  }
  const TIER = { reach: "🚀 Reach", target: "🎯 Target", likely: "✅ Likely" };
  function fitBadge(u) {
    const f = fitFor(u, profile.rank);
    if (!f) return `<span class="badge neutral">${SEL_LABEL[u.sel]}</span>`;
    return `<span class="badge ${f.tier}">${TIER[f.tier]}</span>${f.auto ? `<span class="badge auto">Auto-admit ✓</span>` : ""}`;
  }

  function uniCard(u) {
    const LINK_LABEL = { cost: "Net price", aid: "Aid" };
    const links = Object.entries(u.links).map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener">${esc(LINK_LABEL[k] || k[0].toUpperCase() + k.slice(1))} ↗</a>`).join("");
    const c = costOf(u), resident = isResident(u), national = u.tuitionOut != null;
    const over = profile.budget !== "any" && c.tuition > +profile.budget;
    const autoLine = u.autoPct
      ? (resident ? `Top ${u.autoPct}% of ${esc(ST().name)} class${u.autoPct === 5 ? " (major not guaranteed)" : ""}` : "Not available to out-of-state applicants (holistic review)")
      : u.type === "Private" ? "None (private, holistic)" : (resident ? "None (holistic review)" : "Not applicable: out-of-state applicants are reviewed holistically, often with higher standards");
    return `<article class="card uni${national && !resident ? " uni-out" : ""}">
      <div class="uni-head"><div><h3>${esc(u.name)}</h3><p class="muted small">${esc(u.city)}${national ? `, ${esc(u.state)}` : ""} · ${esc(u.region)} · ${u.type}${!resident ? ` · <span class="oos">Out-of-state</span>` : ""}</p></div></div>
      <div class="badges">${fitBadge(u)}${over ? `<span class="badge warnb">Above budget: check aid</span>` : ""}</div>
      <p class="small rank-line">🏅 ${esc(u.rankLabel)}</p>
      <div class="kv">
        <div><span>Tuition / yr (${c.label})</span><strong>${national ? "≈ " : ""}${money(c.tuition)}</strong></div>
        <div><span>Total cost / yr</span><strong>${c.coa != null ? (national ? "≈ " : "") + money(c.coa) : "—"}</strong></div>
        <div><span>Acceptance</span><strong>${esc(u.acceptance)}</strong></div>
      </div>
      ${u.costNote ? `<p class="small cost-note">💲 ${esc(u.costNote)}</p>` : ""}
      <p class="small"><strong>Automatic admission:</strong> ${autoLine}</p>
      <p class="small"><strong>Known for:</strong> ${esc(u.notable)}</p>
      <p class="small"><strong>Aid:</strong> ${esc(u.aid)}</p>
      <div class="tags">${u.areas.map(a => `<span class="tag">${esc(AREAS[a])}</span>`).join("")}</div>
      <div class="links">${links}</div>
      ${national ? `<p class="muted small asof">Figures ≈ ${esc(NAT.asOf)} published costs. Use the net price calculator for your family's real cost.</p>` : ""}
    </article>`;
  }

  $("#fArea").innerHTML = `<option value="all">All areas</option>` + Object.entries(AREAS).filter(([k]) => k !== "trades").map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  function renderUnis() {
    const scope = $("#fScope").value, area = $("#fArea").value, type = $("#fType").value, region = $("#fRegion").value, cost = +$("#fCost").value, sort = $("#fSort").value;
    const pool = scopedUniversities(scope);
    const list = pool.filter(u => (area === "all" || u.areas.includes(area)) && (type === "all" || u.type === type) &&
      (region === "all" || u.region === region) && costOf(u).tuition <= cost)
      .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "tuition" ? costOf(a).tuition - costOf(b).tuition : a.rankSort - b.rankSort);
    $("#uniList").innerHTML = list.map(uniCard).join("") || "<p>No universities match these filters. Try widening them.</p>";
    const where = scope === "national" ? "out-of-state & national universities" : scope === "all" ? `universities (${ST().name} + national)` : `universities in ${ST().name}`;
    $("#uniCount").textContent = `Showing ${list.length} of ${pool.length} ${where}` + (profile.rank ? ` · fit based on top ${profile.rank}% class rank` : " · add class rank in your profile to see Reach / Target / Likely");
    $("#pathwayBlock").hidden = scope === "national";
  }
  $("#fScope").addEventListener("change", () => { fillUniRegions(); renderUnis(); });
  ["#fArea", "#fType", "#fRegion", "#fCost", "#fSort"].forEach(s => $(s).addEventListener("change", renderUnis));
  renderUnis();

  /* ---------------- Plan (saved items) ---------------- */
  const CATS = { course: "📚 Courses", cert: "🏅 Certifications", project: "🛠️ Projects", intern: "💼 Internships & experience", compete: "🏆 Competitions & clubs", summer: "☀️ Summer programs", research: "🔬 Research", publish: "📰 Publish / showcase", milestone: "🗓️ Milestones", custom: "⭐ My goals" };
  let plan = store.get("plan", []);
  const inPlan = id => plan.some(p => p.id === id);
  function savePlan() { store.set("plan", plan); updatePlanCount(); if (plan.length) requestPersistence(); if ($("#backupStatus")) renderBackupStatus(); }
  function updatePlanCount() { $("#planCount").textContent = plan.length ? plan.length : ""; }
  function addToPlan(text, cat, pathId) {
    const id = hash(cat + "|" + text);
    if (!inPlan(id)) { plan.push({ id, text, cat, path: pathId || null, done: false }); savePlan(); }
    return id;
  }
  updatePlanCount();

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-add]"); if (!b) return;
    addToPlan(b.dataset.text, b.dataset.cat, b.dataset.path);
    b.textContent = "✓ Added"; b.disabled = true; b.classList.add("added");
  });
  const addBtn = (text, cat, pathId) => {
    const added = inPlan(hash(cat + "|" + text));
    return `<button type="button" class="add ${added ? "added" : ""}" ${added ? "disabled" : ""} data-add data-text="${esc(text)}" data-cat="${cat}" data-path="${pathId || ""}" aria-label="Add to my plan: ${esc(text)}">${added ? "✓ Added" : "＋ Plan"}</button>`;
  };

  function renderPlan() {
    const done = plan.filter(p => p.done).length;
    const pct = plan.length ? Math.round((done / plan.length) * 100) : 0;
    $("#planBar").style.width = pct + "%";
    $("#planStats").textContent = plan.length ? `${done} of ${plan.length} done (${pct}%)` : "Your plan is empty. Open a career path and click ＋ Plan on ideas you like, or add your own below.";
    $("#planList").innerHTML = Object.entries(CATS).map(([cat, label]) => {
      const items = plan.filter(p => p.cat === cat); if (!items.length) return "";
      return `<div class="card"><h3>${label}</h3><ul class="checklist">${items.map(p => `<li><div class="item-main"><label><input type="checkbox" data-done="${p.id}" ${p.done ? "checked" : ""}> <span>${esc(p.text)}${p.path && PATH_BY_ID[p.path] ? ` <a class="muted small" href="#path/${p.path}">· ${esc(PATH_BY_ID[p.path].name)}</a>` : ""}</span></label>${planRowExtras(p)}</div><button type="button" class="link-btn no-print" data-del="${p.id}" aria-label="Remove ${esc(p.text)}">✕</button></li>`).join("")}</ul></div>`;
    }).join("");
  }
  $("#addCat").innerHTML = Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${k === "custom" ? "selected" : ""}>${v}</option>`).join("");
  $("#addForm").addEventListener("submit", e => {
    e.preventDefault(); const t = $("#addText").value.trim(); if (!t) return;
    addToPlan(t, $("#addCat").value); $("#addText").value = ""; renderPlan();
  });
  $("#planList").addEventListener("change", e => {
    const id = e.target.dataset.done; if (!id) return;
    const it = plan.find(p => p.id === id); if (it) { it.done = e.target.checked; savePlan(); renderPlan(); }
  });
  $("#planList").addEventListener("click", e => {
    const ed = e.target.closest("[data-edit]"); if (ed) { openEditor(ed.dataset.edit, ed); return; }
    const fl = e.target.closest("[data-flag]");
    if (fl) {
      const it = plan.find(p => p.id === fl.dataset.id); if (!it) return;
      it[fl.dataset.flag] = !it[fl.dataset.flag]; if (!it[fl.dataset.flag]) delete it[fl.dataset.flag];
      savePlan(); saveApp(); renderPlan();
      const again = $(`#planList [data-flag="${fl.dataset.flag}"][data-id="${fl.dataset.id}"]`); if (again) again.focus();
      return;
    }
    const id = e.target.dataset.del; if (!id) return;
    plan = plan.filter(p => p.id !== id); savePlan(); saveApp(); renderPlan();
  });
  $("#clearPlan").addEventListener("click", () => { if (confirm("Remove all items from your plan?")) { plan = []; savePlan(); renderPlan(); } });
  $("#printPlan").addEventListener("click", () => window.print());
  $("#copyPlan").addEventListener("click", () => {
    const txt = Object.entries(CATS).map(([cat, label]) => {
      const items = plan.filter(p => p.cat === cat); if (!items.length) return "";
      return label.replace(/^\S+\s/, "") + "\n" + items.map(p => `  [${p.done ? "x" : " "}] ${p.text}`).join("\n");
    }).filter(Boolean).join("\n\n");
    copy(txt || "(empty plan)", $("#copyPlan"));
  });
  $("#importMilestones").addEventListener("click", () => {
    const phases = roadmapPhases(); const now = new Date();
    let idx = phases.findIndex(p => now >= p.start && now <= p.end);
    if (idx === -1) idx = phases.findIndex(p => now < p.start);
    if (idx === -1) { alert("Your roadmap dates have passed. Update the graduation year in your profile."); return; }
    [phases[idx], phases[idx + 1]].filter(Boolean).forEach(p => p.items.forEach(t => addToPlan(t, "milestone")));
    renderPlan();
  });
  /* ---------------- Application builder (spec 002) ---------------- */
  let appState = Object.assign({ activityOrder: [], honorOrder: [], note: "", resume: {} }, store.get("application", {}));
  function saveApp() { Object.assign(appState, PF_APP.normalizeOrders(plan, appState)); store.set("application", appState); }
  function planRowExtras(p) {
    const sum = PF_APP.summaryLine(p);
    return `<div class="item-tools no-print">
        <button type="button" class="chip-btn" data-edit="${p.id}" aria-label="Edit application details for ${esc(p.text)}">✎ Details</button>
        <button type="button" class="chip-btn ${p.isActivity ? "on" : ""}" aria-pressed="${!!p.isActivity}" data-flag="isActivity" data-id="${p.id}">Activity</button>
        <button type="button" class="chip-btn ${p.isHonor ? "on" : ""}" aria-pressed="${!!p.isHonor}" data-flag="isHonor" data-id="${p.id}">Honor</button>
      </div>${sum ? `<p class="small muted item-sum">${esc(sum)}</p>` : ""}`;
  }

  /* --- Details editor (US1) --- */
  const dlg = $("#detailDialog");
  let editingId = null, editorReturn = null;
  const gradeChecks = name => [9, 10, 11, 12].map(g => `<label class="inline"><input type="checkbox" name="${name}" value="${g}"> ${g}th</label>`).join("");
  $("#dType").innerHTML = `<option value="">Choose…</option>` + ACTIVITY_TYPES.map(t => `<option>${esc(t)}</option>`).join("");
  $("#dRecognition").innerHTML = `<option value="">Choose…</option>` + RECOGNITION_LEVELS.map(t => `<option>${esc(t)}</option>`).join("");
  $("#dGrades").innerHTML = gradeChecks("dg");
  $("#dHonorGrades").innerHTML = gradeChecks("dhg");
  $("#dTiming").innerHTML = Object.entries(TIMING).map(([k, v]) => `<label class="inline"><input type="checkbox" name="dt" value="${k}"> ${esc(v)}</label>`).join("");
  const checkedVals = name => $$(`#detailForm input[name="${name}"]:checked`).map(i => i.value);
  const setChecked = (name, vals) => $$(`#detailForm input[name="${name}"]`).forEach(i => (i.checked = (vals || []).map(String).includes(i.value)));

  function updateEditor() {
    $$("#detailForm .counter").forEach(c => {
      const st = PF_APP.limitStatus($("#" + c.dataset.for).value, APP_LIMITS[c.dataset.limit]);
      c.textContent = `${st.count} / ${st.limit}${st.over ? " · over limit" : ""}`;
      c.classList.toggle("over", st.over);
    });
    const w = PF_APP.weakOpener($("#dDescription").value);
    $("#dTip").textContent = w ? `Tip: instead of “${w}…”, start with a strong verb such as ${STRONG_VERBS.slice(0, 6).join(", ")}. Add numbers where you can.` : "";
    const h = parseFloat($("#dHours").value), wk = parseFloat($("#dWeeks").value), warns = [];
    if (h > APP_LIMITS.hoursWarn) warns.push(`more than ${APP_LIMITS.hoursWarn} hours per week`);
    if (wk > APP_LIMITS.weeksMax) warns.push(`more than ${APP_LIMITS.weeksMax} weeks per year`);
    $("#dTimeWarn").textContent = warns.length ? `Please double-check: ${warns.join(" and ")}. Honest estimates are best.` : "";
    $("#dHonorFields").hidden = !$("#dIsHonor").checked;
  }
  $("#detailForm").addEventListener("input", updateEditor);
  $("#detailForm").addEventListener("change", updateEditor);

  function openEditor(id, returnFocus) {
    const it = plan.find(p => p.id === id); if (!it) return;
    editingId = id; editorReturn = returnFocus || null;
    const d = it.details || {};
    $("#dlgItem").textContent = it.text;
    $("#dIsActivity").checked = !!it.isActivity; $("#dIsHonor").checked = !!it.isHonor;
    $("#dType").value = d.type || CAT_TO_TYPE[it.cat] || "";
    $("#dPosition").value = d.position || ""; $("#dOrg").value = d.org || ""; $("#dDescription").value = d.description || "";
    setChecked("dg", d.grades); setChecked("dt", d.timing); setChecked("dhg", d.honorGrades);
    $("#dHours").value = d.hoursPerWeek ?? ""; $("#dWeeks").value = d.weeksPerYear ?? "";
    $("#dContinue").checked = d.continueInCollege === true;
    $("#dImpact").value = d.impact || ""; $("#dLink").value = d.link || "";
    $("#dHonorTitle").value = d.honorTitle || ""; $("#dHonorTitle").placeholder = it.text;
    $("#dRecognition").value = d.recognition || "";
    updateEditor();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    $("#dPosition").focus();
  }
  function closeEditor() {
    if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
    editingId = null;
    if (editorReturn && document.contains(editorReturn)) editorReturn.focus();
  }
  $("#dCancel").addEventListener("click", closeEditor);
  dlg.addEventListener("cancel", e => { e.preventDefault(); closeEditor(); });
  $("#detailForm").addEventListener("submit", e => {
    e.preventDefault();
    const it = plan.find(p => p.id === editingId); if (!it) { closeEditor(); return; }
    const num = v => (v === "" || v === null ? null : Number(v));
    const honorTitle = $("#dHonorTitle").value.trim();
    const details = PF_APP.cleanDetails({
      type: $("#dType").value, position: $("#dPosition").value, org: $("#dOrg").value, description: $("#dDescription").value,
      grades: checkedVals("dg").map(Number), timing: checkedVals("dt"),
      hoursPerWeek: num($("#dHours").value), weeksPerYear: num($("#dWeeks").value),
      continueInCollege: $("#dContinue").checked ? true : null,
      impact: $("#dImpact").value, link: $("#dLink").value,
      honorTitle: honorTitle && honorTitle !== it.text ? honorTitle : "", recognition: $("#dRecognition").value,
      honorGrades: checkedVals("dhg").map(Number)
    });
    if (details) it.details = details; else delete it.details;
    if ($("#dIsActivity").checked) it.isActivity = true; else delete it.isActivity;
    if ($("#dIsHonor").checked) it.isHonor = true; else delete it.isHonor;
    const ret = editorReturn && editorReturn.dataset ? { edit: editorReturn.dataset.edit, edit2: editorReturn.dataset.edit2 } : null;
    savePlan(); saveApp(); renderPlan();
    if (location.hash === "#application") renderApplication();
    if (ret) editorReturn = $(ret.edit ? `[data-edit="${ret.edit}"]` : `[data-edit2="${ret.edit2}"]`);
    closeEditor();
  });

  /* --- Application view (US2, US3, US4) --- */
  let appTab = "activities";
  const byIdMap = () => new Map(plan.map(p => [p.id, p]));
  const isHttps = u => /^https:\/\/\S+$/.test(u || "");
  function interestsList() {
    const fromProfile = (profile.areas || []).map(a => AREAS[a]).filter(Boolean);
    const counts = {};
    plan.forEach(p => { if (p.path && PATH_BY_ID[p.path]) counts[p.path] = (counts[p.path] || 0) + 1; });
    const fromPaths = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => PATH_BY_ID[id].name);
    return [...new Set([...fromPaths, ...fromProfile])];
  }
  function appModel() {
    return PF_APP.resumeModel(profile, plan, appState, { ...appState.resume, note: appState.note, interests: interestsList() });
  }
  function toolbar(doc, info) {
    return `<div class="doc-toolbar no-print"><p class="muted small">${info}</p><div class="row">
      <button type="button" class="btn" data-copydoc="${doc}">📋 Copy as text</button>
      <button type="button" class="btn" data-printdoc="${doc}">🖨️ Print / PDF</button></div></div>`;
  }
  const field = (label, val, limitKey) => {
    const st = limitKey ? PF_APP.limitStatus(val, APP_LIMITS[limitKey]) : null;
    return `<div class="af"><span class="af-label">${label}${st ? ` <span class="counter ${st.over ? "over" : ""}">${st.count}/${st.limit}</span>` : ""}</span><span class="af-val">${val ? esc(val) : `<span class="muted">—</span>`}</span></div>`;
  };
  const emptyState = what => `<div class="card empty"><p>No ${what} yet. In <a href="#plan">My Plan</a>, press <strong>${what === "activities" ? "Activity" : "Honor"}</strong> on an item (or open <strong>✎ Details</strong>). Need ideas? Open a <a href="#explore">career path</a> and add items to your plan.</p></div>`;

  function listCards(kind) {
    const order = kind === "activities" ? appState.activityOrder : appState.honorOrder;
    const limit = kind === "activities" ? APP_LIMITS.activities : APP_LIMITS.honors;
    const map = byIdMap();
    return `<ol class="app-list">${order.map((id, i) => {
      const it = map.get(id); if (!it) return "";
      const d = it.details || {};
      const inc = i < limit;
      const issues = kind === "activities" ? PF_APP.activityIssues(it) : PF_APP.honorIssues(it);
      const body = kind === "activities"
        ? field("Activity type", d.type) + field("Position / leadership", d.position, "position") + field("Organization", d.org, "org") +
          field("Description", d.description, "description") +
          field("Grades · timing", [PF_APP.gradesLabel(d.grades) && `Gr ${PF_APP.gradesLabel(d.grades)}`, PF_APP.timingLabel(d.timing)].filter(Boolean).join(" · ")) +
          field("Hours/week · weeks/year", [d.hoursPerWeek != null ? `${d.hoursPerWeek} h/wk` : "", d.weeksPerYear != null ? `${d.weeksPerYear} wk/yr` : ""].filter(Boolean).join(" · "))
        : field("Honor title", d.honorTitle || it.text, "honorTitle") + field("Grade levels", PF_APP.gradesLabel(d.honorGrades)) + field("Recognition", d.recognition);
      return `<li class="card app-item ${inc ? "" : "overflow"}" data-idx="${i}">
        <div class="app-item-head"><span class="app-num">${i + 1}</span><h3>${esc(it.text)}</h3>
          <span class="badge ${inc ? "likely" : "warnb"}">${inc ? "Included" : `Not included (limit ${limit})`}</span></div>
        <div class="af-grid">${body}</div>
        ${issues.length ? `<ul class="issues">${issues.map(x => `<li>⚠ ${esc(x)}</li>`).join("")}</ul>` : `<p class="ok-line small">✓ Complete</p>`}
        <div class="row no-print">
          <button type="button" class="btn small-btn" data-move="${kind}" data-dir="-1" data-id="${id}" ${i === 0 ? "disabled" : ""} aria-label="Move ${esc(it.text)} up">↑</button>
          <button type="button" class="btn small-btn" data-move="${kind}" data-dir="1" data-id="${id}" ${i === order.length - 1 ? "disabled" : ""} aria-label="Move ${esc(it.text)} down">↓</button>
          <button type="button" class="btn small-btn" data-edit2="${id}">✎ Edit</button>
        </div></li>`;
    }).join("")}</ol>`;
  }

  function renderResumeDoc(m) {
    const ed = [m.education.school, m.education.gradYear ? `Class of ${m.education.gradYear}` : "", m.education.gpa ? `GPA ${m.education.gpa}` : ""].filter(Boolean).join(" · ");
    const sec = (title, inner) => inner ? `<section><h3>${title}</h3>${inner}</section>` : "";
    return `<article class="resume doc">
      <header><h2>${m.name ? esc(m.name) : `<span class="muted no-print">Your name (add it above)</span>`}</h2>${m.contact ? `<p>${esc(m.contact)}</p>` : ""}</header>
      ${sec("Education", ed ? `<p>${esc(ed)}</p>` : "")}
      ${sec("Activities & Leadership", m.activities.length ? `<ul>${m.activities.map(a => `<li><strong>${esc(a.label)}</strong>${[a.position, a.title !== a.label ? a.title : ""].filter(Boolean).length ? `: ${esc([a.position, a.title !== a.label ? a.title : ""].filter(Boolean).join(", "))}` : ""}<span class="muted">${[a.grades ? ` · Gr ${a.grades}` : "", a.hoursPerWeek != null ? ` · ${a.hoursPerWeek} hrs/wk` : ""].join("")}</span>${a.description || a.impact ? `<br><span class="r-desc">${esc(a.description)}${a.description && a.impact ? " " : ""}${a.impact ? `<em>${esc(a.impact)}</em>` : ""}</span>` : ""}${isHttps(a.link) ? `<br><a href="${esc(a.link)}">${esc(a.link)}</a>` : ""}</li>`).join("")}</ul>` : "")}
      ${sec("Honors & Awards", m.honors.length ? `<ul>${m.honors.map(h => `<li>${esc(h.title)}<span class="muted">${h.grades ? ` · Gr ${esc(h.grades)}` : ""}${h.recognition ? ` · ${esc(h.recognition)}` : ""}</span></li>`).join("")}</ul>` : "")}
      ${sec("Certifications", m.certifications.length ? `<p>${esc(m.certifications.join(" · "))}</p>` : "")}
      ${sec("Skills", m.skills.length ? `<p>${esc(m.skills.join(" · "))}</p>` : "")}
    </article>`;
  }

  function renderApplication() {
    saveApp();
    const nA = appState.activityOrder.length, nH = appState.honorOrder.length;
    $("#actCount").textContent = nA || ""; $("#honCount").textContent = nH || "";
    const m = appModel();
    $("#panel-activities").innerHTML = toolbar("activities", `${Math.min(nA, APP_LIMITS.activities)} of ${APP_LIMITS.activities} included. Order by importance. Limits: position ${APP_LIMITS.position}, organization ${APP_LIMITS.org}, description ${APP_LIMITS.description} characters.`) +
      (nA ? listCards("activities") : emptyState("activities"));
    $("#panel-honors").innerHTML = toolbar("honors", `${Math.min(nH, APP_LIMITS.honors)} of ${APP_LIMITS.honors} included. Title limit ${APP_LIMITS.honorTitle} characters. Add grade levels and recognition level.`) +
      (nH ? listCards("honors") : emptyState("honors"));
    $("#panel-brag").innerHTML = toolbar("brag", "Give this to the teachers and counselor writing your recommendations, about 4–6 weeks before deadlines.") +
      `<div class="card no-print"><label for="bragNote">What I'd like my recommenders to know (challenges, goals, a story behind an activity)</label>
        <textarea id="bragNote" rows="4">${esc(appState.note || "")}</textarea></div>
       <article class="card doc brag"><pre class="doc-text">${esc(PF_APP.bragText(m))}</pre></article>`;
    const r = appState.resume || {};
    $("#panel-resume").innerHTML = toolbar("resume", "One page, built only from what you entered. Your name and contact details stay on this device.") +
      `<div class="card no-print resume-form"><div class="grid g2">
        <div><label for="rName">Name</label><input id="rName" type="text" value="${esc(r.name || "")}" autocomplete="name"></div>
        <div><label for="rSchool">High school</label><input id="rSchool" type="text" value="${esc(r.school || "")}"></div>
        <div><label for="rContact">Contact line (optional)</label><input id="rContact" type="text" value="${esc(r.contact || "")}" placeholder="City, State · email"></div>
        <div><label for="rSkills">Skills (comma-separated)</label><input id="rSkills" type="text" value="${esc(r.skills || "")}" placeholder="Python, CAD, Spanish (fluent)"></div>
      </div></div>` + renderResumeDoc(m);
    const hints = (ST().appHints || []);
    $("#panel-tips").innerHTML = `<div class="grid g2">${APP_TIPS.map(t => `<div class="card"><h3>${esc(t.t)}</h3><p>${esc(t.d)}</p></div>`).join("")}</div>` +
      (hints.length ? `<h2 class="section-title">${esc(ST().name)} application notes</h2><div class="grid g2">${hints.map(h => `<div class="card"><h3>${esc(h.t)}</h3><p>${esc(h.d)}</p><a href="${h.url}" target="_blank" rel="noopener">Official source ↗</a></div>`).join("")}</div>` : "") +
      `<p class="muted small">Field limits follow the Common Application's activities and honors sections. Always check each application's current instructions.</p>`;
    showTab(appTab, false);
  }
  function showTab(tab, focus) {
    appTab = tab;
    $$("#application [role=tab]").forEach(b => { const on = b.dataset.tab === tab; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    $$("#application [role=tabpanel]").forEach(p => (p.hidden = p.dataset.doc !== tab));
  }
  $("#application .tabs").addEventListener("click", e => { const b = e.target.closest("[role=tab]"); if (b) showTab(b.dataset.tab, true); });
  $("#application .tabs").addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    const tabs = $$("#application [role=tab]"), i = tabs.findIndex(t => t.dataset.tab === appTab);
    const n = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    e.preventDefault(); showTab(tabs[n].dataset.tab, true);
  });
  function docText(doc) {
    const map = byIdMap(), m = appModel();
    if (doc === "activities") return PF_APP.activityText(appState.activityOrder.slice(0, APP_LIMITS.activities).map(id => map.get(id)).filter(Boolean));
    if (doc === "honors") return PF_APP.honorText(appState.honorOrder.slice(0, APP_LIMITS.honors).map(id => map.get(id)).filter(Boolean));
    if (doc === "brag") return PF_APP.bragText(m);
    return PF_APP.resumeText(m);
  }
  $("#application").addEventListener("click", e => {
    const cp = e.target.closest("[data-copydoc]"); if (cp) { copy(docText(cp.dataset.copydoc), cp); return; }
    const pr = e.target.closest("[data-printdoc]"); if (pr) { document.body.dataset.print = pr.dataset.printdoc; window.print(); return; }
    const ed = e.target.closest("[data-edit2]"); if (ed) { openEditor(ed.dataset.edit2, ed); return; }
    const mv = e.target.closest("[data-move]");
    if (mv) {
      const key = mv.dataset.move === "activities" ? "activityOrder" : "honorOrder";
      const arr = appState[key], i = arr.indexOf(mv.dataset.id), j = i + Number(mv.dataset.dir);
      if (i < 0 || j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      saveApp(); renderApplication();
      const again = $(`[data-move="${mv.dataset.move}"][data-dir="${mv.dataset.dir}"][data-id="${mv.dataset.id}"]`);
      (again && !again.disabled ? again : $(`[data-edit2="${mv.dataset.id}"]`)).focus();
    }
  });
  $("#application").addEventListener("input", e => {
    const t = e.target;
    if (t.id === "bragNote") { appState.note = t.value; saveApp(); $("#panel-brag .doc-text").textContent = PF_APP.bragText(appModel()); return; }
    const key = { rName: "name", rSchool: "school", rContact: "contact", rSkills: "skills" }[t.id];
    if (key) {
      appState.resume = { ...(appState.resume || {}), [key]: t.value }; saveApp();
      const doc = $("#panel-resume .resume"); if (doc) doc.outerHTML = renderResumeDoc(appModel());
    }
  });
  window.addEventListener("afterprint", () => { delete document.body.dataset.print; });

  /* Keep multiple open tabs in sync: another tab saved → reload our in-memory copy instead of overwriting it later */
  window.addEventListener("storage", e => {
    if (!e.key || !e.key.startsWith("pathfolio:")) return;
    if (e.key === "pathfolio:plan") { plan = store.get("plan", []); updatePlanCount(); }
    else if (e.key === "pathfolio:application") appState = Object.assign({ activityOrder: [], honorOrder: [], note: "", resume: {} }, store.get("application", {}));
    else if (e.key === "pathfolio:profile") { profile = store.get("profile", profile); fillProfileForm(); }
    else return;
    const view = (location.hash || "#home").slice(1);
    if (view === "plan") renderPlan(); else if (view === "application") renderApplication();
  });

  /* ---------------- Backup & restore (data never leaves the device unless the user moves it) ---------------- */
  const BACKUP_VERSION = 2;
  function snapshot() {
    saveApp();
    return { app: "pathfolio", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), profile, plan, quiz: store.get("quiz", null), application: appState };
  }
  function markBackedUp() { store.set("lastBackup", new Date().toISOString()); renderBackupStatus(); }
  async function requestPersistence() {
    try { if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch (e) { /* not supported */ }
  }
  async function renderBackupStatus() {
    const last = store.get("lastBackup", null);
    let persisted = false;
    try { persisted = !!(navigator.storage && navigator.storage.persisted && await navigator.storage.persisted()); } catch (e) { /* ignore */ }
    const days = last ? Math.floor((Date.now() - Date.parse(last)) / 864e5) : null;
    $("#backupStatus").textContent = (last ? `Last backup: ${new Date(last).toLocaleDateString()}${days ? ` (${days} day${days === 1 ? "" : "s"} ago)` : " (today)"}` : "No backup yet.") +
      (persisted ? " · Browser storage is marked persistent, so the browser won't auto-clear it (but clearing site data still erases it)." : "");
    const needs = (plan.length || profile.rank || profile.areas.length) && (!last || days >= 14);
    $("#backupNag").innerHTML = needs
      ? `<div class="card nag"><span>💾 <strong>Your ${plan.length ? `${plan.length} plan item${plan.length === 1 ? "" : "s"} and profile are` : "profile is"} saved only in this browser.</strong> ${last ? `Last backup was ${days} days ago.` : "You haven't made a backup yet."}</span><a class="btn" href="#plan">Back up now</a></div>`
      : "";
  }
  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function applyBackup(raw) {
    const { data, warning } = PF_APP.migrateBackup(raw, BACKUP_VERSION);   /* throws for non-Pathfolio files; upgrades v1 */
    const incoming = data.plan;
    const merge = !plan.length || confirm(`Restore ${incoming.length} plan item(s) from ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString() : "backup"}?\n\nOK = merge with what's here now\nCancel = replace everything here with the backup`);
    if (merge) {
      plan = PF_APP.mergePlans(plan, incoming);
      appState.activityOrder = PF_APP.mergeOrders(appState.activityOrder, data.application.activityOrder);
      appState.honorOrder = PF_APP.mergeOrders(appState.honorOrder, data.application.honorOrder);
      if (!appState.note) appState.note = data.application.note || "";
      const cur = appState.resume || {}, inc = data.application.resume || {};
      appState.resume = Object.fromEntries([...new Set([...Object.keys(inc), ...Object.keys(cur)])].map(k => [k, cur[k] || inc[k] || ""]));
    } else {
      plan = incoming;
      appState = { activityOrder: data.application.activityOrder, honorOrder: data.application.honorOrder, note: data.application.note || "", resume: data.application.resume || {} };
    }
    lastRestoreWarning = warning;
    if (data.profile && typeof data.profile === "object") { profile = { ...profile, ...data.profile }; if (!STATES[profile.state]) profile.state = "TX"; store.set("profile", profile); }
    if (data.quiz) store.set("quiz", data.quiz);
    savePlan(); saveApp(); markBackedUp(); requestPersistence();
    fillRegions(); fillProfileForm(); renderStateStatic(); renderRank(); renderUnis(); renderRoadmap(); renderOpps(); renderPlan();
    if (location.hash === "#application") renderApplication();
    return incoming.length;
  }
  let lastRestoreWarning = null;
  const newerNote = () => lastRestoreWarning === "newer" ? "\n\nNote: this backup was made by a newer version of Pathfolio. Everything this version understands was restored; reload later to pick up the rest." : "";
  /* Restore link: data is compressed into the URL fragment (#restore=…), which browsers never send to the server */
  const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
  async function encodeRestore(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream !== "undefined") return "z." + b64u(await pipe(bytes, new CompressionStream("deflate-raw")));
    return "j." + b64u(bytes);
  }
  async function decodeRestore(s) {
    const [kind, body] = [s.slice(0, 2), s.slice(2)];
    let bytes = unb64u(body);
    if (kind === "z.") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  $("#downloadBackup").addEventListener("click", () => {
    download(`pathfolio-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot(), null, 2));
    markBackedUp(); requestPersistence();
  });
  $("#restoreFile").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const n = applyBackup(JSON.parse(await f.text())); alert(`✓ Restored ${n} plan item(s) and your profile.` + newerNote()); }
    catch (err) { alert("Could not restore: " + err.message); }
    e.target.value = "";
  });
  $("#copyRestoreLink").addEventListener("click", async () => {
    const link = location.origin + location.pathname + "#restore=" + await encodeRestore(snapshot());
    copy(link, $("#copyRestoreLink")); markBackedUp(); requestPersistence();
    $("#linkNote").textContent = link.length > 2000
      ? `This link is long (${link.length.toLocaleString()} characters), and some email and chat apps break long links. The backup file is more reliable.`
      : "";
  });
  async function handleRestoreLink(payload) {
    try {
      const data = await decodeRestore(payload);
      history.replaceState(null, "", location.pathname + "#plan");
      if (confirm("Restore the Pathfolio plan and profile saved in this link?")) { const n = applyBackup(data); alert(`✓ Restored ${n} plan item(s).` + newerNote()); }
    } catch (e) { alert("This restore link is incomplete or damaged."); history.replaceState(null, "", location.pathname + "#plan"); }
    route();
  }

  function copy(text, btn) {
    const done = () => { const o = btn.textContent; btn.textContent = "✓ Copied"; setTimeout(() => (btn.textContent = o), 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => prompt("Copy:", text));
    else prompt("Copy:", text);
  }

  /* ---------------- Career paths ---------------- */
  $("#eCluster").innerHTML = `<option value="all">All clusters</option>` + Object.entries(CLUSTERS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  function pathCard(p, pct) {
    return `<a class="card path-card" href="#path/${p.id}">
      <div class="path-icon" aria-hidden="true">${p.icon}</div>
      <div><p class="muted small cluster">${esc(CLUSTERS[p.cluster])}</p>
      <h3>${esc(p.name)} ${pct != null ? `<span class="match">${pct}% match</span>` : ""}</h3>
      <p class="small">${esc(p.summary)}</p>
      <p class="small muted">💵 ${esc(p.pay)} · 📈 ${esc(p.growth)}</p>
      <span class="small linkish">Open path & profile kit →</span></div></a>`;
  }
  function renderExplore() {
    const c = $("#eCluster").value, q = $("#eSearch").value.trim().toLowerCase();
    const list = PATHS.filter(p => (c === "all" || p.cluster === c) &&
      (!q || [p.name, p.summary, p.majors.join(" "), employersOf(p), CLUSTERS[p.cluster]].join(" ").toLowerCase().includes(q)));
    $("#pathList").innerHTML = list.map(p => pathCard(p)).join("") || "<p>No paths match. Try another word.</p>";
  }
  $("#eCluster").addEventListener("change", renderExplore);
  $("#eSearch").addEventListener("input", renderExplore);
  renderExplore();

  const SECTIONS = [
    ["courses", "📚", "High-school courses", "course"], ["certs", "🏅", "Certifications", "cert"],
    ["projects", "🛠️", "Project ideas", "project"], ["internships", "💼", "Internships & experience", "intern"],
    ["competitions", "🏆", "Competitions & clubs", "compete"], ["summer", "☀️", "Summer programs", "summer"],
    ["research", "🔬", "Research topic ideas", "research"], ["publish", "📰", "Where to publish / showcase", "publish"]
  ];
  const yt = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

  function renderPath(id) {
    const p = PATH_BY_ID[id];
    if (!p) { location.hash = "#explore"; return; }
    const unis = ST().universities.filter(u => u.areas.some(a => p.areas.includes(a)))
      .sort((a, b) => (b.region === profile.region) - (a.region === profile.region) || a.rankSort - b.rankSort);
    const tiers = ["reach", "target", "likely"];
    const uniBlock = profile.rank
      ? `<div class="grid g3">${tiers.map(t => {
          const items = unis.filter(u => fitFor(u, profile.rank).tier === t);
          return `<div class="card tier ${t}"><h3>${TIER[t]}</h3>${items.length ? `<ul class="uni-mini">${items.map(u => uniMini(u)).join("")}</ul>` : "<p class='muted small'>None</p>"}</div>`;
        }).join("")}</div>`
      : `<p class="muted small">Add a class-rank percentile in your <a href="#home-profile">profile</a> to sort these into Reach / Target / Likely.</p><div class="card"><ul class="uni-mini cols">${unis.map(u => uniMini(u)).join("")}</ul></div>`;
    /* Rank by how central the path's field is to the school (areas are listed strongest-first), then by overall rank */
    /* Path areas are listed primary-first too, so a match on the path's main area outranks a secondary one */
    const strength = u => Math.min(99, ...p.areas.map((pa, pi) => { const ui = u.areas.indexOf(pa); return ui < 0 ? 99 : pi * 10 + ui; }));
    const natPicks = NAT.universities.filter(u => !isResident(u) && strength(u) < 99)
      .sort((a, b) => strength(a) - strength(b) || a.rankSort - b.rankSort).slice(0, 6);
    const natBlock = natPicks.length ? `<h3 class="section-title">🌎 Out-of-state & national options</h3>
      <div class="card"><ul class="uni-mini cols">${natPicks.map(u => uniMini(u)).join("")}</ul>
      <p class="small muted">Out-of-state costs shown (≈ ${esc(NAT.asOf)}). <a href="#universities" data-scope-link="national" data-area="${esc(p.areas[0])}">Compare all out-of-state options →</a></p></div>` : "";
    const pathways = p.areas.includes("trades") || p.id === "aviation"
      ? `<p class="small">💡 Also see <a href="#universities">community colleges, TSTC and apprenticeships</a> for this path.</p>` : "";

    $("#path").innerHTML = `
      <p class="crumbs"><a href="#explore">← All career paths</a></p>
      <div class="path-hero">
        <div class="path-icon big" aria-hidden="true">${p.icon}</div>
        <div><p class="eyebrow">${esc(CLUSTERS[p.cluster])} · Interest code ${p.code.split("").join("-")}</p>
        <h1>${esc(p.name)}</h1><p class="lead">${esc(p.summary)}</p></div>
      </div>
      <div class="grid g3">
        <div class="card stat"><span class="stat-label">Median pay (US)</span><span class="stat-value sm">${esc(p.pay)}</span></div>
        <div class="card stat"><span class="stat-label">Job growth 2024–34</span><span class="stat-value sm">${esc(p.growth)}</span></div>
        <div class="card stat"><span class="stat-label">${esc(ST().name)} employers</span><span class="small">${esc(employersOf(p))}</span></div>
      </div>
      <div class="card"><h2>🎓 College majors</h2><div class="tags">${p.majors.map(m => `<span class="tag lg">${esc(m)}</span>`).join("")}</div></div>

      <h2 class="section-title">🧰 Profile-building kit</h2>
      <p class="muted">Click <strong>＋ Plan</strong> on anything you want to do. It's saved to <a href="#plan">My Plan</a>. Program availability changes every year, so always check current details.</p>
      <div class="grid g2">${SECTIONS.map(([key, icon, title, cat]) => `
        <div class="card kit"><h3>${icon} ${title}</h3><ul class="kit-list">${p[key].map(t => `<li><span>${esc(t)}</span>${addBtn(t, cat, p.id)}</li>`).join("")}</ul></div>`).join("")}
      </div>
      <p class="small">New to research? Read the <a href="#build">research guide & professor email template</a>.</p>

      ${(() => { const rel = oppsForState().filter(o => o.areas.some(a => p.areas.includes(a))).sort((a, b) => dateInfo(a).rank - dateInfo(b).rank).slice(0, 6);
        return rel.length ? `<h2 class="section-title">📌 Related opportunities</h2><div class="grid g3">${rel.map(oppCard).join("")}</div><p class="small"><a href="#opportunities">See all opportunities →</a></p>` : ""; })()}

      <h2 class="section-title">🏫 ${esc(ST().name)} universities for this path</h2>
      ${pathways}${uniBlock}${natBlock}

      <h2 class="section-title">🎬 Watch & learn</h2>
      <div class="grid g3">
        ${[["Day in the life", `day in the life ${p.name.split("(")[0]}`], ["Is this career right for me?", `${p.name.split("(")[0]} career pros and cons`], ["How to prepare in high school", `how to become ${p.majors[0]} high school student advice`]]
          .map(([t, q]) => `<a class="card res" href="${yt(q)}" target="_blank" rel="noopener"><span class="yt" aria-hidden="true">▶</span><div><strong>${t}</strong><p class="small muted">YouTube search: always current</p></div></a>`).join("")}
        <a class="card res" href="https://www.bls.gov/ooh/" target="_blank" rel="noopener"><span class="yt gov" aria-hidden="true">i</span><div><strong>BLS Occupational Outlook</strong><p class="small muted">Official pay, growth & duties</p></div></a>
      </div>`;
  }
  function uniMini(u) {
    const c = costOf(u), f = fitFor(u, profile.rank);
    return `<li><a href="${u.links.admissions || u.links.home}" target="_blank" rel="noopener"><strong>${esc(u.name)}</strong></a>
      ${isResident(u) && u.region === profile.region ? "📍" : ""}<span class="muted small"> · ${c.label === "out-of-state" ? "≈ " : ""}${money(c.tuition)}/yr${c.label === "out-of-state" ? " out-of-state" : ""}${f ? ` · ${TIER[f.tier]}` : ""}${f && f.auto ? " · auto-admit ✓" : ""}</span></li>`;
  }

  /* ---------------- Opportunities ---------------- */
  const OPP_TYPES = { internship: "💼 Internship", "summer-program": "☀️ Summer program", research: "🔬 Research", competition: "🏆 Competition", scholarship: "🎓 Scholarship", certification: "🏅 Certification", volunteer: "🤝 Volunteer / experience", publication: "📰 Publication" };
  const OPP_CAT = { internship: "intern", "summer-program": "summer", research: "research", competition: "compete", scholarship: "custom", certification: "cert", volunteer: "intern", publication: "publish" };
  const COST = { free: "Free", paid: "Paid", stipend: "Paid / stipend", fee: "Fee", varies: "Cost varies" };
  const oppsForState = () => (typeof OPPORTUNITIES === "undefined" ? [] : OPPORTUNITIES).filter(o => o.states.includes("US") || o.states.includes(profile.state));
  /* Deadline status: computed in the browser from today's date */
  const parseDay = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDay = s => parseDay(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  function dateInfo(o) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (o.status === "not-offered") return { kind: "closed", rank: 3e6, label: "Not offered this cycle" };
    if (!o.deadline) return { kind: "none", rank: 1e6, label: o.deadlineNote || "Dates not yet published" };
    const days = Math.round((parseDay(o.deadline) - today) / 864e5);
    if (days < 0) return { kind: "closed", rank: 2e6 - days, label: `Closed ${fmtDay(o.deadline)}. Next cycle not announced yet` };
    if (o.opens && parseDay(o.opens) > today) return { kind: "upcoming", rank: 5e5 + days, days, label: `Opens ${fmtDay(o.opens)} · Deadline ${fmtDay(o.deadline)}` };
    if (days <= 14) return { kind: "soon", rank: days, days, label: days === 0 ? `Due TODAY (${fmtDay(o.deadline)})` : `Closes in ${days} day${days === 1 ? "" : "s"} (${fmtDay(o.deadline)})` };
    return { kind: "open", rank: days, days, label: `Deadline ${fmtDay(o.deadline)} · ${days} days left` };
  }
  const DATE_ICON = { soon: "⏰", open: "📅", upcoming: "🔜", closed: "⛔", none: "🗓️" };
  function oppCard(o) {
    const di = dateInfo(o);
    const text = `${o.title} (${o.org})${o.deadline && di.kind !== "closed" ? `: apply by ${fmtDay(o.deadline)}` : ""}`;
    const verified = o.evidenceUrl
      ? `<a class="small verified" href="${o.evidenceUrl}" target="_blank" rel="noopener">✓ Dates confirmed on official site${o.lastVerified ? ` (checked ${esc(o.lastVerified)})` : ""}</a>`
      : `<span class="muted small">${o.lastVerified ? `Checked ${esc(o.lastVerified)}: dates not yet published` : "Check official site for current dates"}</span>`;
    /* Freshness (computed in the browser so generated data stays date-independent) */
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const ageDays = o.lastVerified ? Math.floor((today0 - parseDay(o.lastVerified)) / 864e5) : null;
    const fresh = ageDays === null
      ? `<p class="small stale-note">ⓘ Not yet verified for the current cycle</p>`
      : ageDays > 60 ? `<p class="small stale-note stale">⚠️ Not re-checked in ${ageDays} days. Confirm dates on the official site.</p>` : "";
    return `<article class="card opp dl-${di.kind}">
      ${["open", "soon", "upcoming"].includes(di.kind) ? `<div class="dl-banner dl-${di.kind}">${DATE_ICON[di.kind]} ${esc(di.label)}${o.cycle ? ` <span class="cycle">${esc(o.cycle)}</span>` : ""}</div>` : ""}
      <p class="muted small cluster">${OPP_TYPES[o.type] || o.type}${o.states.includes("US") ? " · National" : " · " + esc(o.states.join(", "))}</p>
      <h3><a href="${o.url}" target="_blank" rel="noopener">${esc(o.title)} ↗</a></h3>
      <p class="small muted">${esc(o.org)}${o.location ? " · " + esc(o.location) : ""}</p>
      <p class="small">${esc(o.description)}</p>${fresh}
      <div class="badges"><span class="badge ${o.cost === "fee" ? "warnb" : "likely"}">${COST[o.cost]}</span>
        <span class="badge neutral">${Math.min(...o.grades) === Math.max(...o.grades) ? `Grade ${o.grades[0]}` : `Grades ${Math.min(...o.grades)}–${Math.max(...o.grades)}`}${o.minAge ? ` · ${o.minAge}+` : ""}</span>
        ${["none", "closed"].includes(di.kind) ? `<span class="badge neutral">${DATE_ICON[di.kind]} ${esc(di.label)}</span>` : ""}</div>
      <div class="row between">${verified}${addBtn(text, OPP_CAT[o.type] || "custom")}</div>
    </article>`;
  }
  $("#oType").innerHTML = `<option value="all">All types</option>` + Object.entries(OPP_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  $("#oArea").innerHTML = `<option value="all">All areas</option>` + Object.entries(AREAS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  function renderOpps() {
    const type = $("#oType").value, area = $("#oArea").value, grade = $("#oGrade").value, cost = $("#oCost").value, dl = $("#oStatus").value, q = $("#oSearch").value.trim().toLowerCase();
    const all = oppsForState().map(o => ({ o, di: dateInfo(o) }));
    const list = all.filter(({ o, di }) => (type === "all" || o.type === type) && (area === "all" || o.areas.includes(area)) &&
      (grade === "all" || o.grades.includes(+grade)) && (cost === "all" || (cost === "free" ? ["free", "paid", "stipend"].includes(o.cost) : o.cost === cost)) &&
      (dl === "all" || (dl === "published" && ["open", "soon", "upcoming"].includes(di.kind)) || (dl === "soon30" && di.days != null && di.days <= 30 && di.kind !== "upcoming") || (dl === "nodate" && di.kind === "none")) &&
      (!q || [o.title, o.org, o.description, o.location].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => a.di.rank - b.di.rank || a.o.title.localeCompare(b.o.title));
    const published = all.filter(x => ["open", "soon", "upcoming"].includes(x.di.kind)).length;
    const soon = all.filter(x => x.di.days != null && x.di.days <= 30 && x.di.kind !== "upcoming").length;
    $("#oppHighlights").innerHTML = published
      ? `<strong>📅 ${published} opportunit${published === 1 ? "y has" : "ies have"} published deadlines</strong>${soon ? ` · <strong class="soon-text">⏰ ${soon} close${soon === 1 ? "s" : ""} within 30 days</strong>` : ""} · <button type="button" class="link-btn accent" id="showPublished">Show only these</button>`
      : `🗓️ No deadlines for the upcoming cycle have been published yet. The weekly research update adds them as soon as programs announce dates.`;
    const sp = $("#showPublished"); if (sp) sp.onclick = () => { $("#oStatus").value = "published"; renderOpps(); };
    $("#oppList").innerHTML = list.map(x => oppCard(x.o)).join("") || "<p>No opportunities match. Try widening the filters.</p>";
    $("#oppCount").textContent = `Showing ${list.length} of ${all.length} opportunities (national + ${ST().name}), soonest deadlines first`;
    renderHomeDeadlines();
  }
  function renderHomeDeadlines() {
    const up = oppsForState().map(o => ({ o, di: dateInfo(o) })).filter(x => ["open", "soon"].includes(x.di.kind)).sort((a, b) => a.di.rank - b.di.rank).slice(0, 3);
    $("#homeDeadlines").innerHTML = up.length ? `<div class="card"><h2>📅 Upcoming deadlines</h2><ul class="kit-list">${up.map(x =>
      `<li><span><a href="${x.o.url}" target="_blank" rel="noopener"><strong>${esc(x.o.title)}</strong></a><br><span class="small dl-text dl-${x.di.kind}">${DATE_ICON[x.di.kind]} ${esc(x.di.label)}</span></span></li>`).join("")}</ul><p class="small"><a href="#opportunities">See all opportunities →</a></p></div>` : "";
  }
  ["#oType", "#oArea", "#oGrade", "#oCost", "#oStatus"].forEach(s => $(s).addEventListener("change", renderOpps));
  $("#oSearch").addEventListener("input", renderOpps);

  /* ---------------- Build profile page ---------------- */
  $("#pillars").innerHTML = PILLARS.map(p => `<div class="card"><h3>${p.icon} ${esc(p.title)}</h3><p>${esc(p.body)}</p><ul>${p.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>`).join("");
  $("#coldEmail").textContent = COLD_EMAIL;
  $("#copyEmail").addEventListener("click", () => copy(COLD_EMAIL, $("#copyEmail")));
  $("#publishList").innerHTML = RESOURCES.publish.map(r => `<a href="${r.url}" target="_blank" rel="noopener">${esc(r.title)} ↗</a>`).join("");
  $("#redFlags").innerHTML = RED_FLAGS.map(r => `<li>${esc(r)}</li>`).join("");

  /* ---------------- Roadmap ---------------- */
  function roadmapPhases() {
    const G = profile.gradYear || defaultGradYear(profile.grade || 11);
    const extras = ST().roadmapExtras || {};
    return ROADMAP_TEMPLATE.map(r => ({
      ...r,
      items: [...r.items, ...(extras[r.label] || [])],
      start: new Date(G + r.start[0], r.start[1], 1),
      end: new Date(G + r.end[0], r.end[1] + 1, 0, 23, 59)
    }));
  }
  function renderRoadmap() {
    const G = profile.gradYear || defaultGradYear(profile.grade || 11);
    const now = new Date();
    $("#roadmapLead").innerHTML = `Personalized for the <strong>Class of ${G}</strong> (applying fall ${G - 1}). Change the graduation year in your <a href="#home-profile">profile</a>. Deadlines are typical, so verify with each university.`;
    $("#timeline").innerHTML = roadmapPhases().map(p => {
      const state = now > p.end ? "past" : now >= p.start ? "current" : "future";
      return `<li class="${state}"><div class="tl-when">${MONTHS[p.start.getMonth()]} ${p.start.getFullYear()} – ${MONTHS[p.end.getMonth()]} ${p.end.getFullYear()}${state === "current" ? `<span class="here">You are here</span>` : ""}</div>
        <div class="card"><h3>${esc(p.label)}${state === "past" ? ` <span class="muted small">(past)</span>` : ""}</h3><ul class="kit-list">${p.items.map(t => `<li><span>${esc(t)}</span>${state !== "past" ? addBtn(t, "milestone") : ""}</li>`).join("")}</ul></div></li>`;
    }).join("");
  }
  renderRoadmap();

  /* ---------------- Parents & resources ---------------- */
  $("#parentTips").innerHTML = PARENT_TIPS.map(t => `<div class="card"><h3>${t.icon} ${esc(t.title)}</h3><ul>${t.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>${t.note ? `<p class="muted small">${esc(t.note)}</p>` : ""}</div>`).join("") +
    `<div class="card callout"><h3>📌 State essentials</h3><p>Admission rules, graduation requirements, aid programs and tuition promises for your state: see the <a href="#home">home page summary</a>.</p></div>`;
  const resCard = r => `<a class="card res" href="${r.url}" target="_blank" rel="noopener"><span class="yt" aria-hidden="true">▶</span><div><strong>${esc(r.title)}</strong><p class="small muted">${esc(r.desc)}</p></div></a>`;
  $("#resExplore").innerHTML = RESOURCES.explore.map(resCard).join("");
  $("#resParents").innerHTML = RESOURCES.parents.map(resCard).join("");

  /* ---------------- Quiz ---------------- */
  const PER_PAGE = 6;
  const INTEREST_PAGES = Math.ceil(QUIZ_ITEMS.length / PER_PAGE);
  const TOTAL_STEPS = INTEREST_PAGES + 2;
  let qStep = 0, ratings = Array(QUIZ_ITEMS.length).fill(null), pickSubjects = [], pickValues = [];

  function renderQuizStep() {
    $("#quizBox").hidden = false; $("#quizResult").hidden = true;
    $("#progressBar").style.width = (qStep / TOTAL_STEPS) * 100 + "%";
    $("#qBack").disabled = qStep === 0;
    $("#qNext").textContent = qStep === TOTAL_STEPS - 1 ? "See my results →" : "Next →";
    if (qStep < INTEREST_PAGES) {
      $("#qStep").textContent = `Part 1 of 3 · Interests (page ${qStep + 1} of ${INTEREST_PAGES})`;
      const start = qStep * PER_PAGE;
      $("#qBody").innerHTML = `<h2>How much would you enjoy…</h2>` + QUIZ_ITEMS.slice(start, start + PER_PAGE).map((it, j) => {
        const i = start + j;
        return `<fieldset class="rate"><legend>${esc(it.t)}</legend>
          ${[[0, "👎 Not me"], [1, "🤷 Maybe"], [2, "👍 Love it"]].map(([v, l]) =>
            `<label class="rate-opt"><input type="radio" name="r${i}" value="${v}" ${ratings[i] === v ? "checked" : ""}><span>${l}</span></label>`).join("")}
        </fieldset>`;
      }).join("");
    } else if (qStep === INTEREST_PAGES) {
      $("#qStep").textContent = "Part 2 of 3 · Favorite subjects";
      $("#qBody").innerHTML = `<h2>Pick up to 3 subjects you enjoy most</h2><div class="chips" id="subChips">${Object.entries(SUBJECTS).map(([k, v]) =>
        `<label class="chip"><input type="checkbox" value="${k}" ${pickSubjects.includes(k) ? "checked" : ""}><span>${esc(v)}</span></label>`).join("")}</div>`;
      limitChips("#subChips", 3);
    } else {
      $("#qStep").textContent = "Part 3 of 3 · What matters to you";
      $("#qBody").innerHTML = `<h2>Pick up to 3 things you value most in a future career</h2><div class="chips" id="valChips">${Object.entries(VALUES).map(([k, v]) =>
        `<label class="chip"><input type="checkbox" value="${k}" ${pickValues.includes(k) ? "checked" : ""}><span>${esc(v)}</span></label>`).join("")}</div>`;
      limitChips("#valChips", 3);
    }
  }
  function limitChips(sel, max) {
    const box = $(sel);
    const sync = () => { const n = $$("input:checked", box).length; $$("input", box).forEach(i => (i.disabled = !i.checked && n >= max)); };
    box.addEventListener("change", sync); sync();
  }
  function collectStep() {
    if (qStep < INTEREST_PAGES) {
      $$("#qBody input:checked").forEach(i => (ratings[+i.name.slice(1)] = +i.value));
      const start = qStep * PER_PAGE;
      const missing = ratings.slice(start, start + PER_PAGE).some(r => r === null);
      if (missing) { alert("Please answer every statement on this page (\"Maybe\" is fine!)."); return false; }
    } else if (qStep === INTEREST_PAGES) pickSubjects = $$("#subChips input:checked").map(i => i.value);
    else pickValues = $$("#valChips input:checked").map(i => i.value);
    return true;
  }
  $("#qNext").addEventListener("click", () => {
    if (!collectStep()) return;
    if (qStep < TOTAL_STEPS - 1) { qStep++; renderQuizStep(); $("#quiz").scrollIntoView(); }
    else finishQuiz();
  });
  $("#qBack").addEventListener("click", () => {
    if (qStep < INTEREST_PAGES) $$("#qBody input:checked").forEach(i => (ratings[+i.name.slice(1)] = +i.value));
    if (qStep > 0) { qStep--; renderQuizStep(); }
  });

  function scoreQuiz() {
    const raw = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }, max = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    QUIZ_ITEMS.forEach((it, i) => { raw[it.k] += ratings[i] || 0; max[it.k] += 2; });
    const norm = Object.fromEntries(Object.keys(raw).map(k => [k, raw[k] / max[k]]));
    const W = [1, 0.6, 0.35];
    const scored = PATHS.map(p => {
      let s = p.code.split("").reduce((acc, L, i) => acc + W[i] * norm[L], 0) / W.slice(0, p.code.length).reduce((a, b) => a + b, 0);
      s = s * 0.7;
      s += Math.min(2, p.subjects.filter(x => pickSubjects.includes(x)).length) * 0.08;
      s += Math.min(2, p.values.filter(x => pickValues.includes(x)).length) * 0.04;
      if (p.areas.some(a => profile.areas.includes(a))) s += 0.04;
      return { p, pct: Math.max(5, Math.min(99, Math.round(s * 100))) };
    }).sort((a, b) => b.pct - a.pct);
    const code = Object.keys(norm).sort((a, b) => norm[b] - norm[a]).slice(0, 3);
    return { norm, code, scored };
  }

  function finishQuiz() {
    const { norm, code, scored } = scoreQuiz();
    store.set("quiz", { ratings, pickSubjects, pickValues, date: new Date().toISOString() });
    $("#progressBar").style.width = "100%";
    $("#quizBox").hidden = true;
    const top = scored.slice(0, 6), best = top[0].p;
    const bars = Object.keys(RIASEC).map(k => `<div class="bar-row"><span><b>${k}</b> · ${esc(RIASEC[k].name)}</span><div class="bar"><div style="width:${Math.round(norm[k] * 100)}%"></div></div><b>${Math.round(norm[k] * 100)}%</b></div>`).join("");

    const g = profile.grade || 11;
    const focus = g <= 9 ? ["courses", "competitions", "projects"] : g === 10 ? ["certs", "competitions", "projects", "summer"]
      : g === 11 ? ["projects", "internships", "summer", "research"] : ["projects", "publish", "internships"];
    const next = focus.map(k => [k, best[k][0]]);
    const catOf = Object.fromEntries(SECTIONS.map(s => [s[0], s[3]]));

    $("#quizResult").innerHTML = `
      <div class="card result-head">
        <p class="eyebrow">Your interest code: ${code.join("-")}</p>
        <h2>${code.map(k => esc(RIASEC[k].name)).join(" · ")}</h2>
        <p class="muted">${code.map(k => esc(RIASEC[k].desc)).join(" ")}</p>
        <div class="bars">${bars}</div>
        <div class="row no-print"><button class="btn primary" type="button" onclick="window.print()">🖨️ Print / Save PDF</button><button class="btn" id="retake" type="button">Retake quiz</button>
          <a class="btn" href="https://www.mynextmove.org/explore/ip" target="_blank" rel="noopener">Try the official O*NET Interest Profiler ↗</a></div>
      </div>
      <h2 class="section-title">🧭 Your top career paths to explore</h2>
      <p class="muted">These are starting points for exploring, not a final answer. Open each one to see majors, universities and a profile-building kit.</p>
      <div class="grid g3">${top.map(t => pathCard(t.p, t.pct)).join("")}</div>
      <div class="card callout">
        <h2>🚀 Suggested next steps for a ${g}th grader → ${esc(best.name)}</h2>
        <ul class="kit-list">${next.map(([k, t]) => `<li><span>${esc(t)}</span>${addBtn(t, catOf[k], best.id)}</li>`).join("")}</ul>
        <p class="small">See the full kit on the <a href="#path/${best.id}">${esc(best.name)}</a> page. Also explore <a href="#path/${top[1].p.id}">${esc(top[1].p.name)}</a>: trying two paths is smart.</p>
      </div>
      <div class="card"><h3>👨‍👩‍👧 Talk about it as a family</h3><ul>
        <li>Which of these paths surprised you? Which feel exciting, and which feel "not me"?</li>
        <li>Who do we know working in one of these fields who could talk for 20 minutes?</li>
        <li>What's one small experiment (a video, a class, a shadow day) we can try this month?</li></ul></div>`;
    $("#quizResult").hidden = false;
    $("#retake").addEventListener("click", () => { qStep = 0; ratings = Array(QUIZ_ITEMS.length).fill(null); pickSubjects = []; pickValues = []; renderQuizStep(); });
    $("#quizResult").scrollIntoView({ behavior: "smooth" });
  }
  renderQuizStep();
  renderStateStatic();
  renderHomeDeadlines();
  renderBackupStatus();

  /* ---------------- Routing ---------------- */
  const views = $$(".view");
  function route() {
    let id = (location.hash || "#home").slice(1);
    if (id.startsWith("restore=")) { handleRestoreLink(id.slice(8)); return; }
    if (id === "home-profile") { show("home"); $("#home-profile").scrollIntoView(); return; }
    if (id.startsWith("path/")) { renderPath(id.slice(5)); show("path"); window.scrollTo(0, 0); return; }
    if (!document.getElementById(id) || !document.getElementById(id).classList.contains("view")) id = "home";
    if (id === "plan") { renderPlan(); renderBackupStatus(); }
    if (id === "universities") renderUnis();
    if (id === "roadmap") renderRoadmap();
    if (id === "opportunities") renderOpps();
    if (id === "application") renderApplication();
    show(id); window.scrollTo(0, 0);
  }
  function show(id) {
    views.forEach(v => (v.hidden = v.id !== id));
    const navId = id === "path" ? "explore" : id;
    $$("#nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + navId));
    $("#nav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded", "false");
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-scope-link]"); if (!a) return;
    /* Deliver what the link promises: that scope, the path's main area, and no leftover filters */
    $("#fScope").value = a.dataset.scopeLink; fillUniRegions();
    $("#fRegion").value = "all"; $("#fType").value = "all"; $("#fCost").value = "999999";
    $("#fArea").value = a.dataset.area && $(`#fArea option[value="${a.dataset.area}"]`) ? a.dataset.area : "all";
  });
  $("#menuBtn").addEventListener("click", () => {
    const open = $("#nav").classList.toggle("open");
    $("#menuBtn").setAttribute("aria-expanded", String(open));
  });
  route();
})();
