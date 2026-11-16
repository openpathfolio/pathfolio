# Contract: `PF_APP` (assets/application.js)

A frozen global of pure functions with no DOM access, unit-tested by `scripts/test-application.mjs`. Inputs are plain objects; outputs are plain strings or objects.

| Function | Input → Output | Contract |
|---|---|---|
| `countChars(s)` | string → int | Grapheme count; `""`/null → 0 |
| `limitStatus(s, limit)` | → `{count, limit, over: bool, left}` | `over` iff count > limit |
| `weakOpener(s)` | → string \| null | Matched weak opener (case-insensitive, at start) or null |
| `cleanDetails(d)` | object → object \| undefined | Removes empty values; undefined if nothing is left |
| `normalizeOrders(plan, orders)` | → `{activityOrder, honorOrder}` | See data-model; idempotent |
| `included(order, n)` | → `{included: id[], overflow: id[]}` | Split at n |
| `gradesLabel(grades)` | int[] → string | `[10,11]` → "10–11"; `[9,11]` → "9, 11"; `[]` → "" |
| `activityText(items, limits)` | → string | Numbered plain text in Common App field order; "⚠ over limit" markers |
| `honorText(items, limits)` | → string | Numbered plain text with grade levels and recognition |
| `bragText(model)` | → string | Sections: About me, Interests, Activities & impact, Honors, What I want you to know |
| `resumeModel(profile, plan, orders)` | → object | `{education, activities[], honors[], certifications[], skills[]}`, using entered data only |
| `migrateBackup(data, currentVersion)` | → `{data, warning}` | Throws on non-Pathfolio input; upgrades v1; flags newer versions |
| `mergePlans(current, incoming)` | → plan[] | Merge rules from data-model |
