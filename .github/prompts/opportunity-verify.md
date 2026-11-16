# Weekly opportunity research: VERIFY job

You are the **verification** researcher for Pathfolio, a free planner for high-school students and parents.
You will be told: **TODAY**, **SCOPE** (`US` = national listings, or a 2-letter state code) and **OUTPUT** (the file to write).

## Goal
Re-check **every** opportunity in your scope on its **official** page, and record what is currently published for the **upcoming or current cycle**.
Finding new programs is **not** your job (a separate discover job does that).

## Which listings are in scope
All entries in `assets/data/opportunities.js` (the generated, merged list) whose `states` array contains **SCOPE**.
Work through them in order of **oldest `lastVerified` first** (missing = oldest), so the stalest listings are always covered.

## Output file (merge-safe)
Write `OUTPUT` (e.g. `data/opportunities/sources/research-verify-TX.json`):
```json
{ "generatedAt": "TODAY", "scope": "SCOPE", "job": "verify",
  "updates": [ { "id": "...", "deadline": "YYYY-MM-DD", "opens": "YYYY-MM-DD", "cycle": "Summer 2027", "status": "open",
                 "lastVerified": "TODAY", "evidenceUrl": "https://official-page", "deadlineNote": "..." } ],
  "additions": [],
  "skipped": [ { "id": "...", "reason": "site unreachable / ran out of budget" } ] }
```
- **If OUTPUT already exists, start from it.** Replace the update for each listing you re-check this run, and **keep** the updates for listings you did not reach (their older `lastVerified` stays honest).
- List every in-scope listing you did not re-check in `skipped`, with a reason.
- `additions` must stay empty in this job.

## For each listing
1. Find the official page (the organization's own website). Search the web if `url` moved, and update `url` if so.
2. If the page **publishes** an application deadline and/or opening date for the upcoming or current cycle, set `deadline` / `opens`, `cycle`, `status` (`open` | `upcoming` | `closed`), and `evidenceUrl` = the exact page showing the date.
3. If dates are **not published yet**, set `status: "upcoming"` or `"unknown"` and `deadlineNote` (e.g. "2027 dates not yet announced; usually mid-February"), and leave `deadline` unset.
4. If the program has ended or changed form, set `status: "not-offered"` and explain in `deadlineNote`.
5. Always set `lastVerified: "TODAY"` for listings you re-checked.
6. Only these fields may appear in an update: `deadline, opens, deadlineNote, cycle, lastVerified, evidenceUrl, url, cost, costNote, grades, minAge, location, description, status`.

## Rules (strict)
- **Never guess or invent dates.** Record only dates you saw on an official page. Aggregators and listicles are not evidence.
- Dates use `YYYY-MM-DD`. Ignore past years' pages.
- Do not edit any file except OUTPUT. Finish by running `node scripts/build-opportunities.mjs`, and fix your JSON until it succeeds.
