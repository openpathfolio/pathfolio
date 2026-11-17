# Feature Specification: Application Builder

**Feature Branch**: `claude/phase-1-application-builder` (spec folder `002-application-builder`)

**Created**: 2026-11-17

**Status**: Draft

**Tracking**: Epic #11 (Phase 1)

**Input**: User description: "Application builder: turn My Plan into application-ready content. Plan items gain optional details (grade levels, dates, hours/week, weeks/year, role/position, organization, impact/results, link). Students can mark items as activities or honors, order them, and export a Common App-style activities list (10 entries; 50-char position, 100-char organization, 150-char description with live counters and strong-verb hints), an honors list (top 5, 100-char titles, grade levels, recognition level), a brag sheet for teacher/counselor recommenders, and a one-page resume, all printable and copyable, all on-device (privacy). Backup format version bump with backward-compatible restore of version-1 backups. State-application hints come from the state module (ApplyTexas first)."

## Context

Pathfolio already lets families save courses, certifications, projects, internships, competitions, research and goals to **My Plan**. The founding goal is "a single place to plan and track… based on which the college application can be easily created." Today the plan is a checklist. It holds none of the details an application asks for (role, hours, impact), and there is no way to turn it into the sections students actually fill in. This feature closes that gap.

## User Scenarios & Testing *(mandatory)*

### User Story 1: Record application details for anything in the plan (Priority: P1)

A student (or a parent helping them) opens a plan item, such as "Robotics team: build lead", and fills in the details colleges ask about: what kind of activity it is, their role, the organization, which grades they did it in, roughly how many hours per week and weeks per year, and what they accomplished. Details are optional and saved on the device. Items with details show a compact summary in the plan.

**Why this priority**: Every export depends on these details. Students also benefit from recording achievements as they happen rather than reconstructing them in 12th grade.

**Independent Test**: Add details to two plan items, reload the page, and confirm the details persist and appear in the plan summary. Nothing else is required.

**Acceptance Scenarios**:
1. **Given** a plan item, **When** the student opens "Add details" and saves a role, grades 10–11, 5 hours/week, 30 weeks/year and an impact sentence, **Then** the item shows a one-line summary ("Build lead · Gr 10–11 · 5 h/wk · 30 wk/yr") and the details survive a reload.
2. **Given** a detail form, **When** the student leaves every field blank and saves, **Then** the item is unchanged and no error appears.
3. **Given** an hours/week value above 40 or weeks/year above 52, **When** saving, **Then** the student sees a gentle warning to double-check, and the value is still allowed.

---

### User Story 2: Build the activities list (Priority: P1)

The student marks plan items as **application activities**, puts them in order of importance, and edits each into application-ready form. The form has a position/leadership field (limit 50 characters), an organization field (100) and a description field (150). Live character counters turn red when the student is over a limit. Tips suggest strong action verbs and quantifying impact. The top 10 form the list. Activities beyond 10 stay visible but are marked "not included".

**Why this priority**: The activities list is the most-used application section that students struggle with, and it's where the plan's data pays off.

**Independent Test**: Mark 12 items as activities, reorder them, write descriptions, and confirm only the top 10 are labelled as included, counters are accurate, and over-limit fields are flagged.

**Acceptance Scenarios**:
1. **Given** 12 items marked as activities, **When** viewing the activities list, **Then** items 1–10 are labelled "Included" and items 11–12 "Not included (limit 10)".
2. **Given** a description of 163 characters, **Then** the counter shows "163 / 150" in a warning colour, and the export marks that entry "over limit".
3. **Given** the student moves an activity up or down, **Then** the order persists after a reload.
4. **Given** a description starting with a weak opener (e.g., "I was in", "Member of", "Helped with"), **Then** a tip suggests starting with a strong verb (e.g., "Led", "Built", "Organized", "Tutored", "Raised").
5. **Given** an activity, **When** the student picks an activity type, **Then** the type comes from the standard list used by the Common Application (e.g., Academic, Community Service (Volunteer), Robotics, Research, Work (Paid), Family Responsibilities).

---

### User Story 3: Build the honors list (Priority: P2)

The student marks items such as certifications, awards and competition results as **honors**, orders them, and gives each a title (limit 100 characters), the grade levels it was received in, and the level of recognition (School, State/Regional, National, International). The top 5 are included.

**Independent Test**: Mark 6 items as honors, confirm the top 5 are included, and the counters and recognition levels work.

**Acceptance Scenarios**:
1. **Given** 6 honors, **Then** 5 are "Included" and 1 is "Not included (limit 5)".
2. **Given** an honor without a recognition level, **Then** the export shows it as incomplete.

---

### User Story 4: Export application-ready documents (Priority: P1)

From a new **Application** view, the student can produce four outputs. Each can be **copied as text** (to paste into an application or an email) and **printed or saved as PDF**:
- **Activities list:** in Common App order and fields.
- **Honors list.**
- **Brag sheet** for teachers and the counselor writing recommendations: the student's intended areas, top activities with impact, honors, a "what I want my recommender to know" note, and the roadmap year.
- **One-page resume:** education (school name, graduation year, GPA if entered), activities, honors and certifications, skills, all on one printed page for typical content.

**Why this priority**: These outputs are the reason families track anything at all.

**Independent Test**: With a plan containing 5 activities and 3 honors, open each output, copy it, and print it. Each is complete, readable and needs no retyping.

**Acceptance Scenarios**:
1. **Given** 5 activities with details, **When** copying the activities list, **Then** the clipboard text lists each activity with type, position, organization, description, grades, hours/week and weeks/year, in order.
2. **Given** the resume view, **When** printing, **Then** navigation, buttons and editing controls are hidden, and typical content (≤ 10 activities, ≤ 5 honors) fits on one US-Letter page.
3. **Given** fields over their character limits, **Then** each output flags those entries so the student can fix them before pasting into an application.
4. **Given** the student's state module provides application hints (Texas: ApplyTexas, UT Austin expanded resume), **Then** the Application view shows those hints. States without hints show only the general Common App guidance.

---

### User Story 5: Keep data safe across the change (Priority: P1)

Existing families have plans and backups made before this feature. Their data must keep working, and new details must be included in backups and restore links.

**Independent Test**: Restore a version-1 backup file into the new version and confirm all items appear (with no details). Create a new backup with details, clear the browser, restore it, and confirm everything returns.

**Acceptance Scenarios**:
1. **Given** a version-1 backup, **When** restored, **Then** all plan items, the profile and quiz results are restored, and items have empty details.
2. **Given** a plan with details and orderings, **When** backed up and restored (file or link), **Then** all details and orderings are identical.
3. **Given** a backup from a *newer* version than the app understands, **Then** restore still imports what it recognizes and tells the user the backup came from a newer version.

### Edge Cases
- An item is both an activity and an honor (e.g., "Robotics team" vs. "FRC regional award"): allowed, and it appears in both lists.
- An item is removed from the plan: it disappears from the activities and honors lists, and the remaining order stays stable.
- Text with emoji or accented characters: counters count characters as a person would see them.
- Very long organization names, or no organization: export omits empty fields cleanly.
- Profile has no school name or GPA: the resume simply omits those lines.
- Restore links grow with details: the app warns when a link becomes very long (some email apps break long links) and recommends the backup file instead.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Each plan item MUST support optional details: activity type, position/role, organization, grade levels (9–12), timing (school year, school break, all year), hours per week, weeks per year, description, impact/results, link, "continue in college" (yes or no), and for honors: title and recognition level.
- **FR-002**: Students MUST be able to mark any plan item as an application activity and/or an honor, and reorder each list.
- **FR-003**: The activities list MUST include the first 10 activities and the honors list the first 5, with clearly labelled overflow.
- **FR-004**: Fields MUST show live character counters with limits: position 50, organization 100, description 150, honor title 100. Over-limit text is allowed but flagged everywhere it appears.
- **FR-005**: The app MUST offer writing tips: strong-verb suggestions when a description starts with a weak opener, and a reminder to quantify results.
- **FR-006**: The app MUST provide four outputs (activities list, honors list, brag sheet, one-page resume), each copyable as plain text and printable.
- **FR-007**: The resume and brag sheet MUST use only data the family entered (profile, plan details, quiz interests). Nothing is invented or pre-filled with sample achievements.
- **FR-008**: State modules MAY provide application hints (application systems, resume or essay notes, with sources), shown in the Application view. Texas provides the first ones.
- **FR-009**: The backup format MUST move to version 2, include details and orderings, restore version-1 backups without loss, and handle newer versions gracefully.
- **FR-010**: All data MUST stay on the device (no network requests with student data), consistent with Constitution I.
- **FR-011**: The feature MUST work at phone width (390 px) and be keyboard and screen-reader accessible (labelled fields, counters announced politely).

### Key Entities
- **Plan item (extended)**: existing `{id, text, cat, path, done}` plus optional `details` (FR-001), plus flags `isActivity` and `isHonor`.
- **Application lists**: the ordered list of plan-item ids for activities and for honors.
- **Application hints (per state)**: title, text, source link.
- **Backup v2**: `{app: "pathfolio", version: 2, exportedAt, profile, plan (with details), quiz, application: {activityOrder, honorOrder}}`.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: A student with 10 tracked activities can produce a complete, within-limit activities list in under 30 minutes, without retyping anything already in the plan.
- **SC-002**: 100% of version-1 backups (test fixtures from the current release) restore without data loss.
- **SC-003**: For typical content (≤ 10 activities, ≤ 5 honors), the resume prints on a single US-Letter page in current desktop browsers.
- **SC-004**: Every over-limit field is flagged in the editor and in all four outputs (no silent truncation).
- **SC-005**: No student data leaves the device. Verified by observing zero network requests carrying plan content during use.

## Assumptions
- Character limits and fields follow the Common Application's current activities and honors format (10 activities: position 50, organization 100, description 150; 5 honors: title 100, recognition level). Limits live in one place so they can be updated if the Common App changes them.
- Hours/week and weeks/year are numbers with typical bounds (0–40, 0–52). Values outside are allowed with a warning, since some students (e.g., family responsibilities) have unusual schedules.
- "Grade levels" uses 9–12 (and "post-graduate" is out of scope for now).
- Texas hints reference ApplyTexas and UT Austin's expanded resume, which are already described in the Texas state module. Exact current rules are linked, not restated.
- The app does not submit applications or connect to application platforms. Students copy and paste.
- Essays are out of scope (a separate future feature). The brag sheet includes a free-text note only.
