# Implementation Plan: DADS Official HTML Components Intake

**Branch**: `006-dads-components` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-dads-components/spec.md`

## Summary

Import six official Digital Agency Design System (DADS) sample components — card, list, checkbox, progress-indicator, breadcrumb, radio — from the upstream `digital-go-jp/design-system-example-components-html` repository (MIT, non-package, no release tags) into the static presentation template. Vendoring follows the existing token discipline: a fixed upstream commit SHA plus a sync script copies only the target components' unmodified CSS/HTML into a committed `vendor/` layer, with a drift check mirroring `check:slides`. The official CSS resolves entirely against the already-vendored `tokens/vendor/tokens.css` (verified: all referenced design tokens are present; the only non-token var, `--value`, is a per-instance progress fill set inline). Components are surfaced in the `components.html` gallery via a new, separate `styles/dads-components.css` module; the existing `styles/components.css` is untouched, and no runtime JS is added.

## Technical Context

**Language/Version**: Node.js (ESM `.mjs` scripts, matches existing `scripts/*.mjs`); static HTML5 + CSS3; no TypeScript.

**Primary Dependencies**: `@digital-go-jp/design-tokens@2.0.1` (pinned, already vendored to `tokens/vendor/tokens.css`). Upstream component source fetched over HTTPS from GitHub raw at pinned SHA `3b34f4c3553fa3bee90bfd8b6fe962ac3055107d`. No new npm dependencies.

**Storage**: Files only. Vendored component CSS/HTML under `vendor/dads-components/<name>/`, committed to the repo.

**Testing**: Playwright (`test:visual`, `test:a11y`, `test:print`) + `@axe-core/playwright`; token lint (`lint:tokens`); new drift check `check:dads` modeled on `check:slides`.

**Target Platform**: Modern browsers (deck viewing); Node for build/check scripts.

**Project Type**: Single static project (HTML canonical deck + supporting scripts).

**Performance Goals**: N/A (static content). Sync/check scripts complete in seconds over network.

**Constraints**: No new runtime JS (FR-008). No hard-coded hex in new rules except the card placeholder neutral fill (FR-003). `styles/components.css` byte-for-byte unchanged (SC-002). Token package stays pinned at 2.0.1. Deck body (`index.html`) not modified (FR-010).

**Scale/Scope**: 6 components, ~2–3 card variants, one new script, one new stylesheet, gallery additions, 2 package scripts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an unratified template (placeholder principles only), so there are no formal constitutional gates to evaluate. In its place, this plan honors the established project conventions documented in `CLAUDE.md` and `docs/`:

- **Single source / no drift**: Vendored copies derive from one pinned upstream SHA; `check:dads` enforces no silent drift (parallels `split-slides.mjs --check`). ✅
- **Vendored + immutable + pinned**: Mirrors the `tokens/vendor/` discipline and `sync-tokens.mjs`. ✅
- **Token-driven, no hard-coded values**: Verified all component design-token refs resolve from `tokens/vendor/tokens.css`; only exception (card placeholder neutral fill) is documented. ✅
- **Static + minimal JS**: No new runtime JS. ✅
- **Validation gates**: Existing Playwright/axe/token-lint suite must stay green (SC-006). ✅

**Result**: PASS (no violations; Complexity Tracking not required).

## Project Structure

### Documentation (this feature)

```text
specs/006-dads-components/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── sync-dads-cli.md     # sync:dads / check:dads command contract
│   └── gallery-ui.md        # component gallery presentation contract
├── checklists/
│   └── requirements.md  # spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
scripts/
├── sync-dads.mjs            # NEW: fetch target components' CSS/HTML from pinned SHA → vendor/; --check for drift
├── sync-tokens.mjs          # existing (model for sync-dads)
└── split-slides.mjs         # existing (model for --check drift semantics)

vendor/
└── dads-components/         # NEW: committed, unmodified upstream copies with provenance headers
    ├── card/
    ├── list/
    ├── checkbox/
    ├── progress-indicator/
    ├── breadcrumb/
    └── radio/

styles/
├── dads-components.css      # NEW: aggregates vendored component CSS (@import) + card placeholder + static-state overrides
├── components.css           # existing — UNCHANGED (SC-002)
└── tokens.semantic.css      # existing — unchanged

tokens/
└── vendor/tokens.css        # existing — supplies all DADS token vars the components need

components.html              # MODIFIED: link dads-components.css + add 6 gallery sections
package.json                 # MODIFIED: add "sync:dads" and "check:dads" scripts (and into "verify")
```

**Structure Decision**: Single static project. New code is additive and isolated: one script (`scripts/sync-dads.mjs`), one vendored tree (`vendor/dads-components/`), one stylesheet (`styles/dads-components.css`), plus additive edits to `components.html` and `package.json`. No existing stylesheet or the deck body is modified, keeping blast radius to the gallery surface.

## Key Design Decisions

1. **Token resolution (research-confirmed)**: `components.html` already loads `tokens/vendor/tokens.css`, which defines every design token the 6 components reference (25/26 vars; the 26th, `--value`, is the progress fill set inline per instance). No token supplementation or var remapping is needed — vendored component CSS is consumed unmodified. See `research.md`.

2. **Vendor layout**: `vendor/dads-components/<name>/` at repo root (new top-level `vendor/`), parallel in spirit to `tokens/vendor/`. `.gitignore` does not exclude it, so it commits (FR-011).

3. **Aggregation without mutation**: `styles/dads-components.css` `@import`s each vendored component CSS (unmodified files) and adds only: (a) the card image placeholder rule (neutral fill), (b) any purely static-presentation scoping needed to render checkbox/radio checked states and the static progress fill in the gallery. Provenance headers live in the vendored files themselves.

4. **Drift check with immutable SHA**: `check:dads` re-fetches the pinned SHA from GitHub raw and byte-compares against `vendor/` (network required; deterministic because the SHA is immutable). Exit code 1 on any divergence, listing offending files — same contract as `check:slides`. Added to `verify` only if offline-friendliness is acceptable; otherwise kept out of the default `verify` chain to avoid network dependence in CI (decided in contracts/quickstart).

5. **Static reductions**: progress-indicator uses `static.html` markup with `--value` inline; checkbox omits indeterminate; card uses 2–3 non-photo variants with placeholder. No `.js` files vendored (FR-008).

## Complexity Tracking

No constitution violations; section intentionally empty.
