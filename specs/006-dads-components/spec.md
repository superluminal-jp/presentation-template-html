# Feature Specification: DADS Official HTML Components Intake

**Feature Branch**: `006-dads-components`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Import Digital Agency Design System (DADS) official sample HTML components (card, list, checkbox, progress-indicator, breadcrumb, radio) into this static presentation template via a pinned-commit + sync-script vendoring approach, matching the existing design-tokens vendoring discipline."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use official DADS components on slides (Priority: P1)

A deck author browsing the component gallery finds official Digital Agency Design System components (card, bulleted list, checkbox, progress indicator, breadcrumb, radio) rendered with DADS-conformant styling, and can copy their markup into slide content knowing the appearance matches the official design system.

**Why this priority**: This is the core value — bringing authoritative, design-system-conformant components into the deck so authored slides look consistent with government design standards. Without it the feature delivers nothing.

**Independent Test**: Open the component gallery and confirm all six components render with DADS styling (colors/spacing resolved from the official tokens, not broken/unstyled). Deliverable even if the sync tooling (Story 2) were done manually.

**Acceptance Scenarios**:

1. **Given** the component gallery is open, **When** the author views it, **Then** card, list, checkbox, progress indicator, breadcrumb, and radio each appear with DADS-conformant visual styling.
2. **Given** a component uses DADS design tokens, **When** it renders, **Then** its colors and spacing resolve from the vendored official token definitions (no unstyled/fallback appearance).
3. **Given** the author inspects any imported component, **When** they read its source, **Then** the markup class names and structure match the official DADS sample unchanged.

---

### User Story 2 - Keep components updatable and reproducible (Priority: P2)

A maintainer needs to refresh the imported components when upstream changes, and to detect when the local copy has drifted from the pinned upstream source, without cloning or building the upstream Storybook project.

**Why this priority**: Updatability was the explicit motivation for choosing a pinned-SHA + sync approach over a one-time copy. It protects the feature's long-term maintainability but is not required for the initial visual value.

**Independent Test**: Run the sync command and confirm it repopulates the vendored files from the pinned upstream commit; run the check command and confirm it reports whether local vendored files match upstream.

**Acceptance Scenarios**:

1. **Given** the pinned upstream commit, **When** the maintainer runs the sync command, **Then** the six components' CSS and HTML are (re)written into the vendor directory.
2. **Given** the vendored files match the pinned upstream, **When** the maintainer runs the drift check, **Then** it reports no drift.
3. **Given** a vendored file has been altered locally, **When** the maintainer runs the drift check, **Then** it reports the difference.

---

### User Story 3 - Preserve provenance and license compliance (Priority: P3)

A reviewer verifying license compliance can confirm each vendored file records its origin (Digital Agency Design System), source URL, upstream commit, and the compatible token version.

**Why this priority**: Required for MIT-compliant unmodified redistribution and to avoid misrepresenting the material as Digital Agency's own work, but it does not affect end-user rendering.

**Independent Test**: Open any vendored file and confirm a header comment naming the source, URL, and commit is present.

**Acceptance Scenarios**:

1. **Given** any vendored component file, **When** the reviewer opens it, **Then** a header records the DADS source, URL, upstream commit SHA, and compatible token version.

---

### Edge Cases

- **Interactive-only behavior on a static surface**: The progress indicator ships with animation script and the checkbox has an indeterminate state that requires script. Both are reduced to their static, no-script presentation; animated/indeterminate variants are out of scope.
- **Demo image assets**: The card samples reference bundled photographic assets. These are not vendored; a neutral placeholder stands in so no binary demo assets enter the repository.
- **Token variable mismatch**: The official component styles reference the DADS primitive/semantic token variables, which the deck's hand-curated semantic token layer does not define. Components must be fed the official token definitions rather than bound to the deck's semantic names.
- **Upstream has no release tags**: Updates are tracked by commit SHA, not by version tag.
- **Upstream markup drift**: If upstream renames classes or restructures, the drift check surfaces the divergence rather than silently serving stale copies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The deck MUST present six official DADS components — card, bulleted list, checkbox, progress indicator, breadcrumb, radio — in the component gallery.
- **FR-002**: Imported component markup MUST preserve the official DADS class names and structure without modification.
- **FR-003**: Imported component styling MUST resolve colors and spacing from the vendored official DADS token definitions; new style rules MUST NOT introduce hard-coded color values (the card placeholder's neutral fill is the sole permitted exception).
- **FR-004**: The imported component styles MUST be delivered as a new, separate style module; the existing hand-built component stylesheet MUST remain unchanged.
- **FR-005**: A sync capability MUST fetch, from a fixed upstream commit, only the target components' style and markup files into a dedicated vendor location.
- **FR-006**: A drift-check capability MUST report whether the vendored files match the pinned upstream source, mirroring the existing slide drift-check convention.
- **FR-007**: Each vendored file MUST carry a header recording the source (Digital Agency Design System), source URL, upstream commit SHA, retrieval date, and compatible token version.
- **FR-008**: The feature MUST NOT add new runtime JavaScript; the progress indicator is imported in its static, non-animated form and the checkbox excludes its script-dependent indeterminate state.
- **FR-009**: Card import MUST be limited to a small set of representative variants, and MUST NOT vendor the upstream photographic demo assets (a neutral placeholder is used instead).
- **FR-010**: The feature MUST NOT modify the slide deck body; components are surfaced in the gallery only and not auto-injected into deck slides.
- **FR-011**: The vendored source files MUST be committed to the repository for reproducibility.
- **FR-012**: The existing validation suite (accessibility, visual, and token checks) MUST continue to pass after the components are added.

### Key Entities

- **Vendored component**: A locally stored copy of one upstream DADS component, consisting of its official style and markup files plus a provenance header. Attributes: component name, source URL, upstream commit, token-version compatibility, retrieval date.
- **Pinned upstream source**: The fixed upstream commit that all vendored copies derive from; the single reference point for both syncing and drift detection.
- **Token definitions**: The vendored official DADS token values that the component styles reference to resolve their colors and spacing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six target components render with DADS-conformant styling in the component gallery (0 unstyled or broken components).
- **SC-002**: The existing hand-built component stylesheet is byte-for-byte unchanged (0 modifications).
- **SC-003**: Re-running the sync from the pinned commit reproduces the vendored files identically, and the drift check reports no drift immediately afterward.
- **SC-004**: The drift check flags any local divergence from the pinned upstream (detects 100% of altered vendored files in verification).
- **SC-005**: 100% of vendored files carry a provenance header naming source, URL, and commit.
- **SC-006**: No new runtime JavaScript is added, and the full existing validation suite passes.

## Assumptions

- Components are surfaced in the component gallery for authors to copy from; they are not automatically inserted into deck slides. (confidence: medium)
- The vendored files, including the token definitions the components need, are committed to the repository for reproducibility. (confidence: high)
- The compatible design-token version stays pinned at its current version; this feature does not upgrade it. (confidence: high)
- Card samples use two to three representative variants; photographic demo assets are replaced by a neutral placeholder. (confidence: high)
- The checkbox indeterminate state and the progress indicator animation are out of scope because they require runtime script. (confidence: high)
- Updates are tracked by upstream commit SHA because the upstream project publishes no release tags and is not a package. (confidence: high)
- The upstream design tooling (Storybook/TypeScript/React) is not introduced; only static style and markup files are consumed. (confidence: high)
