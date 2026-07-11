# Phase 0 Research: DADS Official HTML Components Intake

All Technical Context unknowns are resolved below. No `NEEDS CLARIFICATION` remain.

## R1. Does the vendored token layer resolve every token the components reference?

**Decision**: Yes — consume the official component CSS **unmodified**; no token supplementation or variable remapping.

**Evidence**: Extracted every `var(--…)` reference from the six components' CSS at the pinned SHA and diffed against the variable names defined in `tokens/vendor/tokens.css`:

- 26 distinct custom properties referenced.
- 25 are DADS design tokens — **all present** in `tokens/vendor/tokens.css` (e.g., `--color-key-1100`, `--color-primitive-blue-1000`, `--color-neutral-solid-gray-536`, `--color-semantic-error-1`, `--font-family-sans`).
- 1 non-token: `--value`, a per-instance progress fill percentage set via inline `style` on the progress element — not a design token.

**Rationale**: `components.html` already links `tokens/vendor/tokens.css` before any component stylesheet, so imported component CSS resolves automatically. This keeps SC-002/FR-002/FR-003 satisfied without touching `styles/components.css` or hand-editing upstream CSS.

**Alternatives considered**:
- Vendor the upstream repo's `global.css` token block — rejected (duplicates the already-vendored tokens; drift risk; violates no-redundancy).
- Remap upstream vars to the deck's semantic names (`--accent`, …) — rejected (the deck's `tokens.semantic.css` does not define DADS primitives; remapping mutates official CSS, breaking FR-002 fidelity).

## R2. How to make the components "updatable" without cloning/building upstream?

**Decision**: Pinned commit SHA + `scripts/sync-dads.mjs` fetching only target files from GitHub raw; track updates by bumping the SHA constant.

**Rationale**: Upstream is a Storybook reference project (TS/React tooling), **not** an npm package, and publishes **no release tags** (verified: only `main`/`develop` + dependabot branches). A pinned SHA is the only stable, reproducible reference. Fetching just the needed `*.css`/`*.html` avoids importing the upstream toolchain and matches the existing `sync-tokens.mjs` vendoring model.

**Alternatives considered**:
- git submodule / subtree of the whole repo — rejected (pulls Storybook/TS/React; heavy; conflicts with the subset-only decision).
- npm git-dependency — rejected (not a package; no build artifact/exports; brittle CSS paths).
- One-time manual copy — rejected (loses updatability, the feature's explicit motivation).

## R3. Drift-detection mechanism (parallel to `check:slides`)

**Decision**: `sync-dads.mjs --check` re-fetches the pinned SHA and byte-compares against `vendor/dads-components/`; prints divergent files and exits 1 on any difference, exit 0 otherwise. Exposed as `npm run check:dads`.

**Rationale**: Reuses the mental model and exit-code contract of `split-slides.mjs --check` (`check:slides`). Because the SHA is immutable, the upstream side of the comparison is deterministic. The provenance banner prepended locally is excluded from the comparison (compare against the fetched body, not the banner).

**Constraint / open trade-off**: Unlike `check:slides` (fully local), `check:dads` needs network access. Resolution: keep `check:dads` **out of the default `verify` chain** (which runs in CI/offline) and document it as a maintainer-run command; optionally allow a cached-hash mode later. Recorded in `contracts/sync-dads-cli.md`.

## R4. Which files per component, and static-only reductions

**Decision** (verified against the pinned SHA file listing):

| Component | Vendored files | Static reduction |
|---|---|---|
| card | 2–3 of `example-*.html` + matching `card-example-*.css` | drop `card-*.jpg/png`; `<img>` → placeholder `<div>` w/ neutral fill |
| list | `list.css` + `all-lists.html` | none (CSS+HTML only) |
| checkbox | `checkbox.css` + `standalone.html`/`stacked.html` | omit `indeterminate.html` (needs JS) |
| progress-indicator | `progress-indicator.css` + `static.html` | drop `progress-indicator.js`; set `--value` inline |
| breadcrumb | `breadcrumb.css` + `plain.html`/`with-home-icon.html`/`with-visible-label.html` | none |
| radio | `radio.css` + `standalone.html`/`stacked.html` | none |

**Rationale**: Matches spec scope (static gallery display, no runtime JS). `*.stories.ts`, `*.mdx`, `*.vrt.js`, `*.test.js` are dev-only and excluded.

## R5. Provenance / license handling

**Decision**: Prepend each vendored file with a header comment: source name (`出典：デジタル庁デザインシステム`), source URL, upstream SHA, retrieval date, compatible token version (`@digital-go-jp/design-tokens@2.0.1`). Mirrors the `sync-tokens.mjs` banner.

**Rationale**: Upstream is MIT; unmodified redistribution warrants attribution, and DADS terms forbid presenting modified material as Digital Agency's own. Header satisfies FR-007/SC-005. HTML files use `<!-- … -->`, CSS files use `/* … */`.

## Summary of resolved unknowns

- Token resolution: **solved, zero supplementation** (R1).
- Update strategy: **pinned SHA + fetch script** (R2).
- Drift check: **`--check`, network, out of default `verify`** (R3).
- File selection & static reductions: **fixed** (R4).
- Provenance: **banner header per file** (R5).
