# Feature Specification: Deck UX Hardening

**Feature Branch**: `005-deck-ux-hardening`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "implement 1,2,3,4" — the four prioritized improvements from the template review: (1) accessibility quick wins, (2) accent/emphasis discipline, (3) present mode with view scaling, (4) de-duplication of slide content sources.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accessible for keyboard and assistive-technology users (Priority: P1)

A person who navigates without a mouse — or who relies on a screen reader, low vision, or cannot distinguish colors — opens the deck and can perceive every element, know where keyboard focus is, follow the document's heading structure, and read every chart's series without depending on color alone.

**Why this priority**: The template publicly claims WCAG 2.2 AA conformance (`B-wcag`), yet today it ships concrete failures: no visible focus indicator, no top-level heading/landmarks, and multi-series charts encoded by color only. These are correctness defects against a stated contract, affect the widest audience, and are the lowest-effort/highest-trust fixes. They must land first.

**Independent Test**: Tab through the showcase with a keyboard and confirm every interactive element shows a visible focus ring; run an automated accessibility audit (axe) on the showcase and every per-slide file with zero critical/serious violations; render the deck in grayscale and confirm every chart series is still distinguishable and identifiable.

**Acceptance Scenarios**:

1. **Given** the showcase is open, **When** the user presses Tab to move through interactive elements, **Then** each focused element displays a clearly visible focus indicator that meets the non-text contrast requirement.
2. **Given** a screen reader is active, **When** the user requests the document's heading outline, **Then** exactly one top-level heading exists, each slide exposes an accessible name/position, and content headings nest without skipped levels.
3. **Given** any slide containing a multi-series chart, **When** the slide is viewed in grayscale (or by a user with color vision deficiency), **Then** every series remains distinguishable and identifiable by a non-color cue (direct label, pattern, or shape) in addition to color.
4. **Given** the automated accessibility audit runs against the showcase and each per-slide file, **When** results are collected, **Then** there are zero critical or serious violations.

---

### User Story 2 - Emphasis that reads as intentional (Priority: P2)

A presenter drops content into a slide and the single most important element draws the eye first; the accent color signals "this one thing," not the template's chrome.

**Why this priority**: The deck teaches "one emphasis per slide" (`B-von-restorff`) but contradicts itself — the accent color appears on every heading underline plus emphasis spans plus bullet markers, so accent stops signaling importance. Realigning it is a small, mostly-CSS change that restores the principle the template exists to demonstrate. It ranks below a11y because it is a quality/consistency issue, not a conformance failure.

**Independent Test**: Inspect each of the 16 core layouts and confirm the accent color is applied to at most one emphasis target per slide, with structural chrome (heading rules, list markers) rendered in a non-accent role; verify the token-lint/validation pipeline still passes with no hardcoded values introduced.

**Acceptance Scenarios**:

1. **Given** any core content slide, **When** its accent usage is counted, **Then** the accent color emphasizes at most one deliberate focal element; structural/decorative elements use a neutral or border role instead.
2. **Given** a slide that must highlight a key figure or recommended option, **When** it is rendered, **Then** that single element is the most visually prominent accented item on the slide.
3. **Given** the emphasis changes are applied, **When** the token/style validation runs, **Then** no raw color or spacing values are introduced (all values resolve through existing semantic tokens).

---

### User Story 3 - Deliver the deck full-screen from any laptop (Priority: P3)

A presenter opens the deck in a browser and can advance one slide at a time, fitted to the screen, using the keyboard — without horizontal scrolling or manual zooming, on displays narrower than the fixed slide canvas.

**Why this priority**: The artifact is a *presentation* template, but today it is a vertical scroll gallery: on any display below the fixed canvas width the slide clips, and there is no single-slide advance. This is the biggest usability unlock, but it is net-new behavior (larger, higher-risk change), so it follows the correctness and consistency work.

**Independent Test**: On a viewport narrower and shorter than the slide canvas, enter present mode and confirm the current slide is fully visible with no clipping or horizontal scroll; advance and retreat through the whole deck with the keyboard; confirm review (scroll gallery) mode still works unchanged and printing is unaffected.

**Acceptance Scenarios**:

1. **Given** a viewport smaller than the slide canvas, **When** the deck is displayed, **Then** the active slide is scaled to fit entirely within the viewport with its aspect ratio preserved and no clipping or horizontal scrolling.
2. **Given** present mode is active, **When** the user presses the next/previous keys (and space), **Then** the deck moves forward/backward exactly one slide and stops at the first and last slide without wrapping unexpectedly.
3. **Given** present mode is active, **When** the user requests full-screen and later exits, **Then** the deck enters/leaves full-screen and returns to the prior mode without losing the current slide position.
4. **Given** a user who prefers reduced motion, **When** slides change, **Then** no non-essential motion/animation is applied.
5. **Given** the existing review (scroll) and print paths, **When** present mode is added, **Then** those paths continue to behave as before (regression-free).

---

### User Story 4 - Edit slide content once (Priority: P4)

A maintainer changes a slide's wording or structure in one place and the change is reflected everywhere that slide appears, with no risk of the showcase and the per-slide file drifting apart.

**Why this priority**: The same 16 slides exist in both the showcase and per-slide files — two sources of truth that will silently diverge. Consolidating protects long-term integrity but is invisible to end users and structurally the largest change, so it is sequenced last.

**Independent Test**: Change one slide's content in the single canonical source, regenerate/assemble, and confirm both the showcase and the standalone view reflect the change with no manual second edit; confirm a check fails if the two representations diverge.

**Acceptance Scenarios**:

1. **Given** a single canonical definition per slide, **When** a maintainer edits that definition and runs the assembly/build, **Then** both the showcase and the standalone per-slide output reflect the edit without any second manual edit.
2. **Given** the consolidation is complete, **When** a validation/consistency check runs, **Then** it fails if the showcase and per-slide representations of the same slide differ, and passes when they match.
3. **Given** the de-duplication is applied, **When** the full deck is rendered, **Then** it is visually and semantically identical to the pre-change deck (no content regressions).

---

### Edge Cases

- **Very small or very large viewports**: present mode must still fit the slide (scale down without clipping; the deck need not scale beyond its native size but must remain centered and usable).
- **Keyboard focus on hidden slides**: when only one slide is shown in present mode, interactive elements on off-screen slides must not be reachable by Tab or announced out of order.
- **Annotation toggle interaction**: the existing annotation toggle ("A" key) and the new present-mode navigation keys must not conflict, and annotations must remain hidden by default in projection.
- **Charts with more series than distinct non-color cues available**: the non-color encoding scheme must degrade gracefully (e.g., fall back to direct labeling) rather than reuse an ambiguous cue.
- **Print/PDF export**: adding present mode and focus styles must not alter the "one slide = one page" print output or reintroduce chrome that print intentionally hides.
- **Single canonical source missing a slide**: the assembly/consistency check must clearly report which slide is missing rather than silently omitting it.

## Requirements *(mandatory)*

### Functional Requirements

#### Accessibility (User Story 1)

- **FR-001**: Every interactive element (buttons, links, and any focusable navigation control) MUST display a visible focus indicator when focused via keyboard, meeting the non-text contrast requirement, driven by existing semantic tokens.
- **FR-002**: The document MUST expose exactly one top-level heading and a coherent, non-skipping heading hierarchy for the deck.
- **FR-003**: Each slide MUST expose an accessible name and its position (e.g., "slide N of total") to assistive technology, and the deck MUST provide a primary landmark region.
- **FR-004**: Every chart that distinguishes data series MUST convey series identity through at least one non-color cue (direct label, pattern, or shape) in addition to color.
- **FR-005**: The showcase and every per-slide file MUST pass the project's automated accessibility audit with zero critical or serious violations.

#### Emphasis discipline (User Story 2)

- **FR-006**: The template MUST limit accent-colored emphasis to at most one deliberate focal element per slide; structural or decorative elements (heading rules, list markers) MUST use a neutral or border role by default.
- **FR-007**: When a slide has a designated key element (key figure, recommended option), that element MUST be the most visually prominent accented item on the slide.
- **FR-008**: All emphasis changes MUST resolve through existing semantic tokens with no raw color or spacing values introduced.

#### Present mode & view scaling (User Story 3)

- **FR-009**: The deck MUST provide a present mode that displays one slide at a time, scaled to fit entirely within the current viewport with the slide aspect ratio preserved and no clipping or horizontal scrolling.
- **FR-010**: In present mode, users MUST be able to advance and retreat exactly one slide using the keyboard (next/previous and space), bounded at the first and last slide.
- **FR-011**: The deck MUST offer full-screen entry and exit that preserves the current slide position.
- **FR-012**: Present mode MUST NOT apply non-essential motion for users who indicate a reduced-motion preference.
- **FR-013**: Adding present mode MUST preserve the existing review (scroll gallery) experience and the "one slide = one page" print/PDF output.
- **FR-014**: In present mode, interactive elements on non-visible slides MUST NOT be keyboard-focusable or announced.

#### Content de-duplication (User Story 4)

- **FR-015**: Each slide's content MUST have a single canonical source from which both the showcase and the standalone per-slide views are produced.
- **FR-016**: A single edit to a slide's canonical source MUST propagate to both the showcase and per-slide outputs without a second manual edit.
- **FR-017**: A validation/consistency check MUST fail when the showcase and per-slide representations of the same slide diverge, and pass when they match.
- **FR-018**: The consolidated deck MUST render visually and semantically identical to the pre-change deck (no content regressions).

#### Cross-cutting constraints

- **FR-019**: All changes MUST preserve the existing design-token discipline (no hardcoded colors or spacing; values resolve through the semantic token layer).
- **FR-020**: All changes MUST keep the existing 16 core layouts, appendix slides, component gallery, and slide-frame behavior functionally intact.

### Key Entities *(include if feature involves data)*

- **Slide**: A single unit of the deck with a layout type, content, optional annotation (design intent), and frame metadata (classification, confidentiality, page number). Gains a canonical single-source representation (User Story 4) and an accessible name/position (User Story 1).
- **Chart series**: A data series within a chart, identified today by color; gains a required non-color identity cue (User Story 1).
- **Emphasis target**: The single focal element per slide eligible for accent treatment (User Story 2).
- **Deck view mode**: The presentation state — review (scroll gallery), present (single-slide, scaled, keyboard-driven), and print — that governs how slides are displayed (User Story 3).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Automated accessibility audit reports zero critical or serious violations across the showcase and all per-slide files.
- **SC-002**: 100% of interactive elements show a visible focus indicator on keyboard focus.
- **SC-003**: The deck exposes exactly one top-level heading and a heading outline with no skipped levels.
- **SC-004**: 100% of multi-series charts remain fully distinguishable when viewed in grayscale.
- **SC-005**: Across all 16 core layouts, accent-colored emphasis is applied to at most one focal element per slide.
- **SC-006**: On a viewport smaller than the slide canvas, 100% of slides display fully in present mode with no clipping or horizontal scrolling.
- **SC-007**: A presenter can advance through the entire deck and enter/exit full-screen using only the keyboard.
- **SC-008**: A single content edit is reflected in both the showcase and the per-slide view with exactly one manual change, and the consistency check detects any divergence.
- **SC-009**: The token/style validation pipeline passes with zero hardcoded color or spacing values introduced by this feature.
- **SC-010**: Print/PDF output remains one slide per page and visually unchanged from before the feature.

## Assumptions

- **Canonical source direction (User Story 4)**: The single source of truth will be established in whichever representation minimizes disruption (per-slide files or the showcase), with the other generated/assembled from it; the exact direction is a planning decision. Assumption confidence: medium.
- **Automated accessibility tooling**: The project's existing validation stack (Playwright + axe-core + token lint, per project docs) is the reference for "automated accessibility audit" and "token/style validation pipeline"; no new tool category is required. Confidence: high.
- **Scope boundary**: This feature hardens the existing template; it does not add new slide layouts, new components, or new content, and does not change the pinned design-token vendor package. Confidence: high.
- **Present mode is additive**: Review (scroll) mode remains the default entry experience; present mode is an opt-in mode, not a replacement. Confidence: medium.
- **Non-color chart cues**: Direct labeling is the preferred default non-color cue; patterns/shapes are acceptable where direct labels would crowd the chart. Confidence: medium.
- **Reduced-motion**: If present mode introduces any transition, it is treated as non-essential and suppressed under a reduced-motion preference; a no-transition implementation trivially satisfies this. Confidence: high.
- **Browser scope**: Modern evergreen browsers (Chromium-based for the canonical print path) are the target, consistent with the existing print sizing approach. Confidence: medium.
