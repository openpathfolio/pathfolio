# Contributing

Thank you for helping students and parents! You don't need to be a programmer.

## Easiest: open an issue
Use **Issues → New issue → "Data correction"** to report:
- outdated tuition, rankings, deadlines or admission rules
- broken links
- programs that no longer exist, or great new ones (especially free or paid-to-student programs)

Please include an **official source link**.

## Editing data directly
| File | Contains |
|---|---|
| `assets/data/states/<state>.js` | A state's universities, admission rules, essentials, regions, pathways and links |
| `assets/data/common/paths.js` | Career paths and their profile-building kits |
| `assets/data/common/content.js` | Quiz statements, roadmap, guides, national resources |
| `data/opportunities/curated.json` | Internships, programs, competitions (format: `data/opportunities/schema.json`) |

To make a change:
1. Edit the file and keep the existing format: quotes, commas and brackets.
2. If you changed opportunities, run `node scripts/build-opportunities.mjs`. CI fails if the generated file is out of date.
3. Open `index.html` locally to check that the site still loads.
4. Open a pull request that describes what changed and links your source.

Adding a whole state? See [docs/ADDING_A_STATE.md](docs/ADDING_A_STATE.md).
Adding an automated source? See [scripts/sources/README.md](scripts/sources/README.md). Weekly AI research is described in [docs/AUTOMATION.md](docs/AUTOMATION.md).

## Content guidelines
- Prefer **official sources** (university, TEA, THECB, BLS).
- Mark uncertain numbers with `≈`.
- Recommend **free or low-cost** opportunities first. Don't add paid "guaranteed admission" or pay-to-publish services.
- Keep it inclusive: every career path, budget and region.
- No personal data about real students.

## Annual refresh (every August)
- [ ] US News rankings
- [ ] Tuition and cost of attendance
- [ ] State admission rules (e.g., UT Austin automatic-admission percentage)
- [ ] Application and FAFSA deadlines
- [ ] Update `DATA_UPDATED` in `assets/data/common/content.js`
- [ ] Re-verify curated opportunities and set `lastVerified`
