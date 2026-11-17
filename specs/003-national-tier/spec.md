# Feature Specification: National Tier (out-of-state universities)

**Feature Branch**: `claude/phase-2-national-tier` (spec folder `003-national-tier`)

**Created**: 2026-11-17

**Status**: Implemented (see tasks.md)

**Tracking**: #16 (Phase 2, parent #12). Includes the residency-cost slice of #13; the rest of #13 (full home vs. explore-state profile) stays open.

**Input**: "Texas families can compare top out-of-state options (Georgia Tech, Purdue, UIUC, Michigan, MIT, Stanford, CMU, Caltech…) with out-of-state costs and aid notes. 20–30 universities with sources, out-of-state tuition and net-price calculator links. Shown under 'Explore other states / national' without Texas rules applied."

## User Scenarios & Testing *(mandatory)*

### User Story 1: Browse out-of-state and national universities (Priority: P1)

A Texas parent opens Universities and switches the scope from "Texas" to "Out-of-state & national". They see about 28 well-known universities: flagship publics popular with Texans, top private research universities, nearby-state options and HBCUs. Each shows out-of-state tuition, total cost, selectivity, what it's known for, aid notes, and links to admissions and the official net-price calculator.

**Why this priority**: Families of strong STEM students routinely consider out-of-state options, and today the app can't show any.

**Independent Test**: Switch scope to national and filter by study area "Engineering". Cards show "out-of-state" costs and net-price links, with no Texas automatic-admission badges.

**Acceptance Scenarios**:
1. **Given** scope "Out-of-state & national", **Then** 20–30 universities are listed, each with a state, an out-of-state tuition figure marked approximate, and a net-price/cost link.
2. **Given** a Texas resident with a top-5% class rank, **When** viewing a national university, **Then** no automatic-admission badge appears (Texas rules apply only to Texas public universities).
3. **Given** scope "All", **Then** Texas and national universities appear together, each labelled with in-state or out-of-state cost as it applies to the family.
4. **Given** the region filter in national scope, **Then** regions are national groupings (Neighbor states, West, Midwest, Northeast, Southeast).

### User Story 2: Honest cost comparison (Priority: P1)

The parent wants to know the real cost for their family, not just sticker price. Each national card says whether the figure is out-of-state tuition, shows a range where tuition varies by program, flags "above budget" using the out-of-state figure, and explains that private universities with large endowments often cost less after aid. It links to the school's net-price calculator.

**Acceptance Scenarios**:
1. **Given** a budget of "≤ $35k", **Then** national universities above it show "Above budget: check aid" based on their out-of-state cost.
2. **Given** a university whose tuition varies by program (e.g., engineering differential), **Then** the card shows the range note.
3. **Given** a private university with a published free-tuition income line (e.g., MIT, Harvard under $200k), **Then** the aid note states it with "check current policy" wording.

### User Story 3: Out-of-state options on career-path pages (Priority: P2)

On a career path page (e.g., Robotics), after the Texas universities, the family sees up to 6 out-of-state options strong in that path's study areas, with costs and fit labels.

**Acceptance Scenarios**:
1. **Given** the Robotics path, **Then** an "Out-of-state & national options" block lists up to 6 universities with engineering programs, labelled with out-of-state cost.

### Edge Cases
- A family whose home state isn't Texas (future): costs for universities in their own state show as in-state. The same logic applies to every state.
- A national university without a published figure: it shows "≈" with a range and a link, never a precise-looking guess.
- Very selective schools: Reach for everyone, regardless of class rank.
- Phone width: cards and filters fit without horizontal scrolling.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The app MUST include a national dataset of 20–30 universities, each with: state, city, national region, type, selectivity, rank label, acceptance (≈), in-state tuition, out-of-state tuition (≈), total out-of-state cost (≈), an optional cost note (range or variation), study areas, notable programs, an aid note, and https links to home, admissions and an official cost or net-price page.
- **FR-002**: Universities MUST offer a scope selector: home state (default), out-of-state & national, all.
- **FR-003**: The cost shown for any university MUST be in-state when the university is in the family's state, otherwise out-of-state, and MUST be labelled as such. Budget and cost filters MUST use that figure.
- **FR-004**: State-specific admission rules (automatic admission, rank rules) MUST apply only to universities in the family's own state.
- **FR-005**: Career-path pages MUST show up to 6 matching national universities in a separate block.
- **FR-006**: National data MUST be validated in CI: fields, unique ids, valid areas and regions, https links, and in-state ≤ out-of-state tuition.
- **FR-007**: All figures MUST be marked approximate (≈), with an "as of" year and official links (Constitution II). Official Scorecard figures replace them when #14 lands.

### Key Entities
- **National university**: as FR-001, keyed by `id`, with `state` (2-letter).
- **National regions**: Neighbor states (of Texas), West, Midwest, Northeast, Southeast.

## Success Criteria *(mandatory)*
- **SC-001**: A family can list and compare out-of-state options for their intended major in under 2 minutes (scope + area filter).
- **SC-002**: 100% of national entries have an official cost or net-price link and pass CI validation.
- **SC-003**: Zero Texas automatic-admission badges appear on non-Texas universities.

## Assumptions
- Figures are approximate 2025–26 published values gathered from official university pages where available, otherwise reputable compilations. Each is marked ≈ and linked to an official cost page. College Scorecard data (#14) will replace them.
- "Neighbor states" is phrased for Texas families today. When other states go live, regions remain usable because each card also shows the state.
- Regional tuition-exchange programs (WUE, MSEP, ACM) are out of scope until non-Texas home states exist (#13).
- Public universities usually admit non-residents at lower rates, so Reach/Target/Likely treats a public university as one selectivity level harder for out-of-state applicants. Private universities are unchanged.
- Career-path pages rank out-of-state picks by how central the path's main field is to each school (study areas are listed strongest-first), then by overall rank.
