# Data Model: Application Builder

## Plan item (extended)
Stored in `localStorage["pathfolio:plan"]` as an array.

| Field | Type | Notes |
|---|---|---|
| `id` | string | existing; stable hash |
| `text` | string | existing; the plan label |
| `cat` | string | existing category key |
| `path` | string \| null | existing career-path id |
| `done` | boolean | existing |
| `isActivity` | boolean? | NEW; included in the activities list |
| `isHonor` | boolean? | NEW; included in the honors list |
| `details` | object? | NEW; all fields optional (below) |

### `details`
| Field | Type | Validation |
|---|---|---|
| `type` | string | one of `ACTIVITY_TYPES` |
| `position` | string | limit 50 (flag only) |
| `org` | string | limit 100 (flag only) |
| `description` | string | limit 150 (flag only); weak-opener tip |
| `grades` | int[] | subset of 9–12 |
| `timing` | string[] | subset of `school`, `break`, `year` |
| `hoursPerWeek` | number | ≥ 0; warn if > 40 |
| `weeksPerYear` | number | 0–52; warn if > 52 |
| `continueInCollege` | boolean | |
| `impact` | string | free text for the brag sheet and resume |
| `link` | string | must start with `https://` to be shown as a link |
| `honorTitle` | string | limit 100 (flag only); defaults to `text` |
| `recognition` | string | one of `School`, `State/Regional`, `National`, `International` |
| `honorGrades` | int[] | subset of 9–12 |

Empty strings, empty arrays and `null` are removed on save, so a saved item never has empty `details`.

## Application orders
`localStorage["pathfolio:application"] = { activityOrder: string[], honorOrder: string[] }`

**`normalizeOrders(plan, orders)`**:
- drops ids that are missing or no longer flagged
- appends flagged ids that aren't in the order yet (in plan order)
- removes duplicates

The first 10 activities and the first 5 honors are **included**. The rest are labelled overflow.

## State application hints
In `assets/data/states/<code>.js`: `appHints: [{ t: string, d: string, url: https-string }]` (optional; validated by `scripts/validate-data.mjs`).

## Backup v2
```json
{ "app": "pathfolio", "version": 2, "exportedAt": "ISO date",
  "profile": {...}, "plan": [ {plan item (extended)} ], "quiz": {...} | null,
  "application": { "activityOrder": ["id"], "honorOrder": ["id"] } }
```

### State transitions on restore
| Incoming | Result |
|---|---|
| v1 (no `application`, no details) | Items restored; orders derived from flags (none), so the lists are empty |
| v2 | Exact restore (replace) or merge |
| v > 2 | Known fields imported; `warning: "newer"` shown to the user |
| not a Pathfolio file | Rejected with a friendly message |

**Merge rules**:
- For items with the same id: `done` = OR, `isActivity`/`isHonor` = OR, and each detail field is kept if non-empty, otherwise taken from the incoming item.
- Orders: current order, then incoming ids not already present.
