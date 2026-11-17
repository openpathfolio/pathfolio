# Quickstart: validate the Application Builder

## Prerequisites
Node 20 and a modern browser. No install or build step.

## Automated checks
```bash
node scripts/test-application.mjs          # PF_APP unit tests (limits, counting, exports, migration, merge)
node scripts/validate-data.mjs             # includes appHints validation
node scripts/build-opportunities.mjs --check
```
Expected: all pass, with a non-zero test count.

## Manual scenarios (open index.html)
1. **Details persist**: My Plan → add an item → ✎ Details → fill role, grades 10–11, 5 h/wk, 30 wk/yr → Save → reload. The summary line is shown and the details are kept.
2. **Limits**: type a 160-character description. The counter shows 160 / 150 in the warning style, and the Activities tab flags the entry "over limit".
3. **Ordering and overflow**: mark 12 items as activities. Items 11–12 show "Not included". Move item 12 up to position 1, then reload, and the order is kept.
4. **Honors**: mark 6 items as honors. The 6th is overflow. Missing recognition shows as incomplete.
5. **Exports**: in each tab, Copy (paste into a text editor to check), then Print. Only that document prints, and the resume fits on one page for ≤ 10 activities and ≤ 5 honors.
6. **Backups**: restore the v1 fixture (`scripts/fixtures/backup-v1.json`). Items appear, and the lists are empty. Download a v2 backup, clear site data, then restore. Details and orders are identical.
7. **Phone**: repeat 1–5 at 390 px width, with no horizontal scroll.
8. **Privacy**: in DevTools → Network, using the feature makes no requests carrying plan content.
