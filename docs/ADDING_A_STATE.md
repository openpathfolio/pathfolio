# Adding a new state

Each state is one data file. No code changes are needed beyond two small edits.

## 1. Create `assets/data/states/<code>.js`
Copy `assets/data/states/tx.js` as a template and keep the same shape:

```js
registerState("CA", {
  name: "California",
  abbr: "CA",
  rankRules: [            // optional: automatic/guaranteed admission by class rank
    { label: "University of California (ELC)", pct: 9, yes: "...", no: "..." }
  ],
  essentials: [ { t: "Title", d: "What families must know" } ],
  roadmapExtras: { "12th grade: fall": ["California: UC application due Nov 30"] },
  officialLinks: [ { title: "UC Admissions", url: "https://admission.universityofcalifornia.edu" } ],
  regions: ["Bay Area", "Los Angeles", "San Diego", "Central Valley", "Sacramento", "Northern California"],
  universities: [ { id: "...", name: "...", region: "Bay Area", type: "Public", rankSort: 15, rankLabel: "...",
                    acceptance: "...", tuition: 15000, coa: 40000, sel: "highly", autoPct: null,
                    areas: ["eng", "cs"], notable: "...", aid: "...", links: { home: "https://..." } } ],
  pathways: [ { name: "Community college transfer (TAG)", desc: "...", url: "https://..." } ]
});
```

Field notes:
- `sel`: `highly`, `selective`, `moderate` or `accessible`. This drives the Reach/Target/Likely labels.
- `autoPct`: the class-rank cutoff for automatic admission, or `null` if the state has none.
- `areas`: keys from `AREAS` in `assets/data/common/registry.js`.
- Use `≈` for approximate figures, and link official sources.

## 2. Load it
Add a script tag in `index.html` next to the Texas one:
```html
<script src="assets/data/states/ca.js"></script>
```

## 3. Turn it on in the picker
In `assets/data/common/registry.js`, set `available: true` for the state in `STATE_LIST`.

## 3b. Residency and the national list
- Each university in your module automatically gets `state: "<CODE>"`. Costs and automatic-admission rules then apply only to residents of that state (`costOf()` / `fitFor()` in `app.js`).
- Some universities in your state may already be in `assets/data/national.js` (e.g., UC Berkeley when adding California), where families from other states see them with out-of-state costs. **Leave them there for now**, and don't reuse their `id` in your module (CI rejects duplicate ids). How state modules and the national list combine, so each family sees each school once with the right cost, is tracked in the data-model issue #13.

## 4. Optional: local employers
In `assets/data/common/paths.js`, add the state to each path's `employers`, e.g. `employers: { TX: "...", CA: "..." }`. If a state is missing, the first listed state's employers are shown.

## 5. State-specific opportunities
Add entries to `data/opportunities/curated.json` with `"states": ["CA"]`, then run `node scripts/build-opportunities.mjs`.

## Checklist before opening a PR
- [ ] At least 10 universities across the state's regions, including affordable options
- [ ] Admission rules and financial-aid essentials, with sources
- [ ] App loads with the new state selected, with no console errors
- [ ] `node scripts/build-opportunities.mjs --check` passes
