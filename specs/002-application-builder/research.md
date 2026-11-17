# Research: Application Builder

## 1. Application field limits
- **Decision**: Common Application conventions. **Activities**: up to 10; position/leadership ≤ 50 characters; organization ≤ 100; description ≤ 150; grade levels 9–12; timing (school year / school break / all year); hours per week; weeks per year; "intend to participate in college". **Honors**: up to 5; title ≤ 100; grade levels; recognition level (School, State/Regional, National, International).
- **Rationale**: The Common App is used by most selective colleges and accepted by UT Austin and Texas A&M. These limits are widely documented for students.
- **Alternatives**: ApplyTexas-specific formats differ by school and change, so they're handled as state hints that link to the official source rather than hard-coded.
- **Maintenance**: all limits live in `APP_LIMITS` in `common/content.js`. Update them there if the Common App changes.

## 2. Activity types
- **Decision**: use the Common App's activity-type list (Academic, Art, Athletics: Club, Athletics: JV/Varsity, Career Oriented, Community Service (Volunteer), Computer/Technology, Cultural, Dance, Debate/Speech, Environmental, Family Responsibilities, Foreign Exchange, Foreign Language, Internship, Journalism/Publication, Junior R.O.T.C., LGBT, Music: Instrumental, Music: Vocal, Religious, Research, Robotics, School Spirit, Science/Math, Social Justice, Student Govt./Politics, Theater/Drama, Work (Paid), Other Club/Activity).
- **Rationale**: Students then copy values that match the real form exactly.
- **Default mapping** from plan categories: research→Research, intern→Internship, compete→Academic, project→Other Club/Activity, cert→(honor), summer→Academic, publish→Journalism/Publication, custom→Other Club/Activity. Students can change it.

## 3. Character counting
- **Decision**: count grapheme clusters with `Intl.Segmenter("en", {granularity: "grapheme"})`, falling back to `Array.from(str).length`.
- **Rationale**: Emoji and accented letters count as one character, as a person would count them (spec edge case). Application systems vary in how they count, so flagging is conservative and never truncates.

## 4. Editor UI
- **Decision**: native `<dialog>` with `showModal()`.
- **Rationale**: built-in focus trap, Escape to close and backdrop, with no library (constitution III). Supported in all evergreen browsers.

## 5. Printing one document
- **Decision**: set `document.body.dataset.print = "<doc>"` before `window.print()` and clear it on `afterprint`. Print CSS hides everything except `[data-doc="<doc>"]`.
- **Alternatives**: opening a new window with generated HTML was rejected because popup blockers and theme duplication make it unreliable.

## 6. Backup v2 and migration
- **Decision**: `version: 2` adds `application: {activityOrder, honorOrder}`, and items may carry `details`, `isActivity`, `isHonor`.
  - **v1:** accepted as-is.
  - **Missing orders:** derived from flags.
  - **Version above 2:** known fields are imported and the app shows a "newer version" note.
  - **Merge:** existing non-empty details win, empty ones are filled from the incoming backup, and flags are OR-ed.
- **Rationale**: Families with v1 files and links must never lose data (SC-002).

## 7. Strong-verb tips
- **Decision**: flag openers like "I was", "I am", "Member of", "Helped", "Was a", "Participated in", "Responsible for", "Worked on". Suggest verbs such as Led, Founded, Built, Designed, Organized, Tutored, Mentored, Raised, Launched, Coordinated, Researched, Published, Taught, Coached, Created, Managed, Improved, Volunteered, Translated, Cared for.
- **Rationale**: This is common counselor guidance. Tips are advisory only and never block saving.

## 8. Texas application hints
- **Decision**: `appHints` in `states/tx.js`:
  - ApplyTexas is used by Texas public universities; Common App is accepted by many.
  - UT Austin allows an expanded resume.
  - Texas A&M and other schools have their own essay prompts.
  - Each hint links to the official site (applytexas.org, admissions.utexas.edu, tamu.edu admissions). No requirements are restated beyond what the state module already says.
- **Rationale**: Constitution II: link to official sources rather than copy rules that change.
