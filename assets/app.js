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
    $("#fRegion").innerHTML = `<option value="all">All regions</option>` + ST().regions.map(r => `<option>${esc(r)}</option>`).join("");
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

  /* ---------------- University fit ---------------- */
  const SEL_LABEL = { highly: "Highly selective", selective: "Selective", moderate: "Moderately selective", accessible: "Accessible" };
  function fitFor(u, rank) {
    if (rank == null) return null;
    const auto = u.autoPct && rank <= u.autoPct;
    let tier;
    if (u.sel === "highly") tier = auto ? "target" : "reach";
    else if (u.sel === "selective") tier = auto || rank <= 25 ? "target" : "reach";
    else if (u.sel === "moderate") tier = auto || rank <= 25 ? "likely" : "target";
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
    const links = Object.entries(u.links).map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener">${esc(k[0].toUpperCase() + k.slice(1))} ↗</a>`).join("");
    const over = profile.budget !== "any" && u.tuition > +profile.budget;
    return `<article class="card uni">
      <div class="uni-head"><div><h3>${esc(u.name)}</h3><p class="muted small">${esc(u.city)} · ${esc(u.region)} · ${u.type}</p></div></div>
      <div class="badges">${fitBadge(u)}${over ? `<span class="badge warnb">Above budget: check aid</span>` : ""}</div>
      <p class="small rank-line">🏅 ${esc(u.rankLabel)}</p>
      <div class="kv">
        <div><span>Tuition / yr</span><strong>${money(u.tuition)}</strong></div>
        <div><span>Total cost / yr</span><strong>${money(u.coa)}</strong></div>
        <div><span>Acceptance</span><strong>${esc(u.acceptance)}</strong></div>
      </div>
      <p class="small"><strong>Automatic admission:</strong> ${u.autoPct ? `Top ${u.autoPct}% of ${esc(ST().name)} class${u.autoPct === 5 ? " (major not guaranteed)" : ""}` : "None (private, holistic)"}</p>
      <p class="small"><strong>Known for:</strong> ${esc(u.notable)}</p>
      <p class="small"><strong>Aid:</strong> ${esc(u.aid)}</p>
      <div class="tags">${u.areas.map(a => `<span class="tag">${esc(AREAS[a])}</span>`).join("")}</div>
      <div class="links">${links}</div>
    </article>`;
  }

  $("#fArea").innerHTML = `<option value="all">All areas</option>` + Object.entries(AREAS).filter(([k]) => k !== "trades").map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  function renderUnis() {
    const area = $("#fArea").value, type = $("#fType").value, region = $("#fRegion").value, cost = +$("#fCost").value, sort = $("#fSort").value;
    const list = ST().universities.filter(u => (area === "all" || u.areas.includes(area)) && (type === "all" || u.type === type) &&
      (region === "all" || u.region === region) && u.tuition <= cost)
      .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : a[sort] - b[sort]);
    $("#uniList").innerHTML = list.map(uniCard).join("") || "<p>No universities match these filters. Try widening them.</p>";
    $("#uniCount").textContent = `Showing ${list.length} of ${ST().universities.length} universities in ${esc(ST().name)}` + (profile.rank ? ` · fit based on top ${profile.rank}% class rank` : " · add class rank in your profile to see Reach / Target / Likely");
  }
  ["#fArea", "#fType", "#fRegion", "#fCost", "#fSort"].forEach(s => $(s).addEventListener("change", renderUnis));
  renderUnis();

  /* ---------------- Plan (saved items) ---------------- */
  const CATS = { course: "📚 Courses", cert: "🏅 Certifications", project: "🛠️ Projects", intern: "💼 Internships & experience", compete: "🏆 Competitions & clubs", summer: "☀️ Summer programs", research: "🔬 Research", publish: "📰 Publish / showcase", milestone: "🗓️ Milestones", custom: "⭐ My goals" };
  let plan = store.get("plan", []);
  const inPlan = id => plan.some(p => p.id === id);
  function savePlan() { store.set("plan", plan); updatePlanCount(); }
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
      return `<div class="card"><h3>${label}</h3><ul class="checklist">${items.map(p => `<li><label><input type="checkbox" data-done="${p.id}" ${p.done ? "checked" : ""}> <span>${esc(p.text)}${p.path && PATH_BY_ID[p.path] ? ` <a class="muted small" href="#path/${p.path}">· ${esc(PATH_BY_ID[p.path].name)}</a>` : ""}</span></label><button type="button" class="link-btn no-print" data-del="${p.id}" aria-label="Remove">✕</button></li>`).join("")}</ul></div>`;
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
    const id = e.target.dataset.del; if (!id) return;
    plan = plan.filter(p => p.id !== id); savePlan(); renderPlan();
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

      ${(() => { const rel = oppsForState().filter(o => o.areas.some(a => p.areas.includes(a))).slice(0, 6);
        return rel.length ? `<h2 class="section-title">📌 Related opportunities</h2><div class="grid g3">${rel.map(oppCard).join("")}</div><p class="small"><a href="#opportunities">See all opportunities →</a></p>` : ""; })()}

      <h2 class="section-title">🏫 ${esc(ST().name)} universities for this path</h2>
      ${pathways}${uniBlock}

      <h2 class="section-title">🎬 Watch & learn</h2>
      <div class="grid g3">
        ${[["Day in the life", `day in the life ${p.name.split("(")[0]}`], ["Is this career right for me?", `${p.name.split("(")[0]} career pros and cons`], ["How to prepare in high school", `how to become ${p.majors[0]} high school student advice`]]
          .map(([t, q]) => `<a class="card res" href="${yt(q)}" target="_blank" rel="noopener"><span class="yt" aria-hidden="true">▶</span><div><strong>${t}</strong><p class="small muted">YouTube search: always current</p></div></a>`).join("")}
        <a class="card res" href="https://www.bls.gov/ooh/" target="_blank" rel="noopener"><span class="yt gov" aria-hidden="true">i</span><div><strong>BLS Occupational Outlook</strong><p class="small muted">Official pay, growth & duties</p></div></a>
      </div>`;
  }
  function uniMini(u) {
    return `<li><a href="${u.links.admissions || u.links.home}" target="_blank" rel="noopener"><strong>${esc(u.name)}</strong></a>
      ${u.region === profile.region ? "📍" : ""}<span class="muted small"> · ${money(u.tuition)}/yr${fitFor(u, profile.rank) && fitFor(u, profile.rank).auto ? " · auto-admit ✓" : ""}</span></li>`;
  }

  /* ---------------- Opportunities ---------------- */
  const OPP_TYPES = { internship: "💼 Internship", "summer-program": "☀️ Summer program", research: "🔬 Research", competition: "🏆 Competition", scholarship: "🎓 Scholarship", certification: "🏅 Certification", volunteer: "🤝 Volunteer / experience", publication: "📰 Publication" };
  const OPP_CAT = { internship: "intern", "summer-program": "summer", research: "research", competition: "compete", scholarship: "custom", certification: "cert", volunteer: "intern", publication: "publish" };
  const COST = { free: "Free", paid: "Paid", stipend: "Paid / stipend", fee: "Fee", varies: "Cost varies" };
  const oppsForState = () => (typeof OPPORTUNITIES === "undefined" ? [] : OPPORTUNITIES).filter(o => o.states.includes("US") || o.states.includes(profile.state));
  function oppCard(o) {
    const text = `${o.title} (${o.org})`;
    return `<article class="card opp">
      <p class="muted small cluster">${OPP_TYPES[o.type] || o.type}${o.states.includes("US") ? " · National" : " · " + esc(o.states.join(", "))}</p>
      <h3><a href="${o.url}" target="_blank" rel="noopener">${esc(o.title)} ↗</a></h3>
      <p class="small muted">${esc(o.org)}${o.location ? " · " + esc(o.location) : ""}</p>
      <p class="small">${esc(o.description)}</p>
      <div class="badges"><span class="badge ${o.cost === "fee" ? "warnb" : "likely"}">${COST[o.cost]}</span>
        <span class="badge neutral">Grades ${Math.min(...o.grades)}–${Math.max(...o.grades)}${o.minAge ? ` · ${o.minAge}+` : ""}</span>
        <span class="badge neutral">🗓️ ${o.deadline ? "Deadline " + esc(o.deadline) : esc(o.deadlineNote || "See website")}</span></div>
      <div class="row between"><span class="muted small">${o.lastVerified ? "Verified " + esc(o.lastVerified) : "Check official site for current dates"}</span>${addBtn(text, OPP_CAT[o.type] || "custom")}</div>
    </article>`;
  }
  $("#oType").innerHTML = `<option value="all">All types</option>` + Object.entries(OPP_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  $("#oArea").innerHTML = `<option value="all">All areas</option>` + Object.entries(AREAS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  function renderOpps() {
    const type = $("#oType").value, area = $("#oArea").value, grade = $("#oGrade").value, cost = $("#oCost").value, q = $("#oSearch").value.trim().toLowerCase();
    const list = oppsForState().filter(o => (type === "all" || o.type === type) && (area === "all" || o.areas.includes(area)) &&
      (grade === "all" || o.grades.includes(+grade)) && (cost === "all" || (cost === "free" ? ["free", "paid", "stipend"].includes(o.cost) : o.cost === cost)) &&
      (!q || [o.title, o.org, o.description, o.location].join(" ").toLowerCase().includes(q)));
    $("#oppList").innerHTML = list.map(oppCard).join("") || "<p>No opportunities match. Try widening the filters.</p>";
    $("#oppCount").textContent = `Showing ${list.length} of ${oppsForState().length} opportunities (national + ${ST().name})`;
  }
  ["#oType", "#oArea", "#oGrade", "#oCost"].forEach(s => $(s).addEventListener("change", renderOpps));
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

  /* ---------------- Routing ---------------- */
  const views = $$(".view");
  function route() {
    let id = (location.hash || "#home").slice(1);
    if (id === "home-profile") { show("home"); $("#home-profile").scrollIntoView(); return; }
    if (id.startsWith("path/")) { renderPath(id.slice(5)); show("path"); window.scrollTo(0, 0); return; }
    if (!document.getElementById(id) || !document.getElementById(id).classList.contains("view")) id = "home";
    if (id === "plan") renderPlan();
    if (id === "universities") renderUnis();
    if (id === "roadmap") renderRoadmap();
    if (id === "opportunities") renderOpps();
    show(id); window.scrollTo(0, 0);
  }
  function show(id) {
    views.forEach(v => (v.hidden = v.id !== id));
    const navId = id === "path" ? "explore" : id;
    $$("#nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + navId));
    $("#nav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded", "false");
  }
  window.addEventListener("hashchange", route);
  $("#menuBtn").addEventListener("click", () => {
    const open = $("#nav").classList.toggle("open");
    $("#menuBtn").setAttribute("aria-expanded", String(open));
  });
  route();
})();
