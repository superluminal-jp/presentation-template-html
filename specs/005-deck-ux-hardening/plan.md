# Implementation Plan: Deck UX Hardening

**Branch**: `005-deck-ux-hardening` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-deck-ux-hardening/spec.md`

## Summary

Harden the existing DS-compliant presentation template across four prioritized axes without adding new layouts, components, or content, and without breaking the existing token/visual/a11y/print pipeline:

1. **Accessibility (P1)** — add a token-driven `:focus-visible` ring, a single document `<h1>` + `<main>` landmark + per-slide accessible names, and non-color chart series encoding (direct labels). Prove with expanded axe runs (keyboard/landmark/color-independent).
2. **Emphasis discipline (P2)** — demote the always-on accent heading underline to a neutral/border role so accent marks at most one focal element per slide, realigning with `B-von-restorff`.
3. **Present mode + view scaling (P3)** — add an **opt-in** single-slide, fit-to-viewport, keyboard-driven present mode with full-screen and reduced-motion safety, leaving review (scroll) and print paths unchanged.
4. **Content de-duplication (P4)** — `index.html` is already the single source (`scripts/split-slides.mjs` derives `slides/*.html`). Add a **drift-check** (`--check` mode + test) and wire it into `npm run verify` so divergence fails CI.

**Key architectural constraint**: the existing test suite opens static files via `file://` at native 1280×720 and asserts no-overflow, screenshot equality, axe contrast, and one-slide-per-page print. Every change must be a no-op at native size in review mode; present mode and scaling activate only via explicit opt-in.

## Technical Context

**Language/Version**: HTML5, CSS (custom-property/token driven), vanilla ES modules (browser, no build step for runtime). Node.js for tooling scripts (ESM `.mjs`).

**Primary Dependencies**: `@digital-go-jp/design-tokens@2.0.1` (pinned, vendored). Dev/test: `@playwright/test` ^1.48, `@axe-core/playwright` ^4.10. No new runtime or build dependencies.

**Storage**: N/A (static files).

**Testing**: Playwright (chromium, `file://`, viewport 1280×720) for visual/a11y/print; Node scripts for `lint:tokens`, `check:crossrefs`, `check:coverage`, and the new drift check. Reuse existing `tests/visual/_fixtures.mjs`.

**Target Platform**: Modern evergreen browsers; Chromium is the canonical path for print/PDF (existing `@page { size: 1280px 720px }`).

**Project Type**: Static front-end template (single project). Source lives in `styles/`, `js/`, `index.html`, `slides/` (generated), tests in `tests/`, tooling in `scripts/`.

**Performance Goals**: No runtime perf targets; present-mode slide change must feel instant (no required animation). View scaling via a single CSS transform, no reflow storms.

**Constraints**: SC-02 token discipline (no raw hex/rgb/hsl or raw spacing px in `styles/**` outside `tokens/vendor/`); SC-01 no-overflow at 1280×720; one slide = one print page; WCAG 2.2 AA. Present mode opt-in only.

**Scale/Scope**: 16 core layouts + 5 appendix/reference slides in `index.html`; `components.html` gallery; ~1,060 lines of CSS across 21 files; 2 runtime JS modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an unratified template (placeholder principles only). No formal gates are defined. In its absence, this plan is held to the project's **de-facto ratified standards** captured in `CLAUDE.md`, `docs/practices.md`, and the existing verify pipeline:

| De-facto gate | Source | This feature's compliance |
|---|---|---|
| Token discipline (no hardcoded color/spacing in `styles/**`) | SC-02, `lint:tokens` | All new CSS resolves via existing semantic tokens; **PASS by design**, enforced by `npm run lint:tokens`. |
| No-overflow at 1280×720 | SC-01, `_fixtures.assertNoOverflow` | Changes are no-ops at native size in review mode; **PASS**. |
| One slide = one print page | `base.css @media print` | Present mode and focus styles excluded from print; **PASS**. |
| WCAG 2.2 AA | `docs/practices.md B-wcag` | Feature strengthens conformance (focus, headings, color-independence); **PASS/IMPROVES**. |
| Practice cross-ref integrity | `check:crossrefs`, `check:coverage` | Annotations/`data-practice` IDs unchanged or added against `practices.md`; **PASS**. |
| Test-first (coder skill) | `CLAUDE.md` skill routing | Each story lands failing test → implementation; enforced in tasks. |

**Gate result**: PASS (no violations; no Complexity Tracking entries required).

## Project Structure

### Documentation (this feature)

```text
specs/005-deck-ux-hardening/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions (P4 direction, non-color cue, present-mode approach)
├── data-model.md        # Phase 1 — entities (Slide, Chart series, Emphasis target, Deck view mode)
├── quickstart.md        # Phase 1 — how to verify each story locally
├── contracts/
│   └── ux-hardening-contracts.md   # Focus, heading/landmark, present-mode keyboard, drift-check CLI contracts
└── tasks.md             # Phase 2 — /speckit-tasks output
```

### Source Code (repository root)

```text
index.html                     # CANONICAL deck (single source of truth). Edited: h1, main landmark, slide names, chart labels, present-mode controls
components.html                # Gallery (a11y focus styles apply)
slides/NN-*.html               # GENERATED by scripts/split-slides.mjs (do not hand-edit)

styles/
├── base.css                   # + :focus-visible ring; reduced-motion guard
├── slides.css                 # accent underline → neutral role (P2); present-mode + scaling styles (P3)
├── layouts/*.css              # per-layout accent audit (P2)
└── (no new files unless a dedicated present.css is warranted)

js/
├── annotations.js             # unchanged (verify key-conflict with present-mode)
├── frame.js                   # unchanged
└── present.js                 # NEW — opt-in present mode: single-slide, scale-to-fit, keyboard nav, fullscreen, reduced-motion

scripts/
└── split-slides.mjs           # + --check mode (regenerate to memory, diff against slides/*.html, exit 1 on drift)

tests/
├── a11y/
│   ├── focus-a11y.spec.mjs        # NEW — visible focus indicator on interactive elements
│   ├── landmark-a11y.spec.mjs     # NEW — single h1, heading order, main landmark, slide accessible names
│   └── layouts-a11y.spec.mjs      # extend tags to include keyboard/color-independence where feasible
├── visual/
│   ├── accent.spec.mjs            # extend — at most one accent focal element per slide
│   ├── present.spec.mjs           # NEW — opt-in present mode: fit-to-viewport, keyboard nav, review/print unaffected
│   └── chart-encoding.spec.mjs    # NEW — every multi-series chart has non-color series cues
└── (drift check invoked via npm script; optional thin spec wrapper)

package.json                   # + "check:slides" script; add to "verify"
```

**Structure Decision**: Single static-project layout (existing). No new top-level directories. New runtime code is one JS module (`js/present.js`) loaded only by `index.html`; new styles extend existing `styles/base.css` and `styles/slides.css` to keep `lint:tokens`, `split-slides` head template, and the per-slide generation contract intact. Generated `slides/*.html` remain derivative of `index.html`.

## Complexity Tracking

> No Constitution Check violations. No entries required.
