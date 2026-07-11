# Phase 1 Data Model: DADS Official HTML Components Intake

This feature is file-based (no runtime data store). The "entities" are build-time/config artifacts and their relationships.

## Entity: Pinned Upstream Source

The single fixed reference all vendored copies derive from.

| Field | Value / Rule |
|---|---|
| repository | `digital-go-jp/design-system-example-components-html` |
| commit SHA | `3b34f4c3553fa3bee90bfd8b6fe962ac3055107d` (immutable) |
| raw base URL | `https://raw.githubusercontent.com/<repo>/<sha>/src/components` |
| license | MIT |
| token compatibility | `@digital-go-jp/design-tokens@2.0.1` |

**Rule**: Declared once as constants in `scripts/sync-dads.mjs`. Updating components = changing the SHA constant and re-running sync.

## Entity: Component Manifest Entry

Drives which files the sync script fetches per component. Defined as a list in `scripts/sync-dads.mjs`.

| Field | Type | Rule |
|---|---|---|
| name | string | vendor subdir name (`card`, `list`, `checkbox`, `progress-indicator`, `breadcrumb`, `radio`) |
| files | string[] | upstream-relative paths under `src/components/<name>/` to fetch (CSS + HTML only) |

**Selected files** (from research R4):

- `card`: `example-1.html`, `example-2.html`, `card-example-1.css`, `card-example-2.css` (+ optionally example-3 pair)
- `list`: `list.css`, `all-lists.html`
- `checkbox`: `checkbox.css`, `standalone.html`, `stacked.html`
- `progress-indicator`: `progress-indicator.css`, `static.html`
- `breadcrumb`: `breadcrumb.css`, `plain.html`, `with-home-icon.html`, `with-visible-label.html`
- `radio`: `radio.css`, `standalone.html`, `stacked.html`
- `link`: `link.css` — **dependency only** (list uses `.dads-link`); not its own gallery section
- `form-control-label`: `form-control-label.css` — **dependency only** (checkbox/radio stacked use `.dads-form-control-label`); not its own gallery section

**Implementation note (discovered during build)**: the upstream component HTML are full standalone documents that also `<link>` sibling-component CSS (`link.css`, `form-control-label.css`) and `global.css`. The two sibling stylesheets are vendored (above). `global.css` is **not** vendored — it re-defines tokens (already in `tokens/vendor/tokens.css`) and page-wide resets (already in `styles/base.css`, which supplies `box-sizing`/`font-family`); only its `.dads-u-visually-hidden` utility is reproduced locally in `styles/dads-components.css`. The `static.html` progress indicator is an icon-based passive indicator (not a percentage bar), so the per-instance `--value` is unused and no inline `--value` is set. DADS focus outlines (black `--color-neutral-black`) are harmonized to the deck's `--accent` in `styles/dads-components.css` (color only) to satisfy the feature-005 single-accent focus-ring a11y contract.

**Validation**: Every listed file MUST exist at the pinned SHA (sync errors and exits non-zero if a fetch 404s). No `*.js`, `*.ts`, `*.mdx`, `*.test.*`, `*.vrt.*` may be listed (FR-008).

## Entity: Vendored Component File

A local copy of one upstream file.

| Field | Rule |
|---|---|
| path | `vendor/dads-components/<name>/<basename>` (flattened; upstream `src/components/<name>/` prefix dropped) |
| provenance header | Prepended; records source name, URL, SHA, retrieval date, token version (FR-007) |
| body | Byte-identical to upstream at the pinned SHA (below the header) |

**Comment syntax**: `.css` → `/* … */`; `.html` → `<!-- … -->`.

**Drift rule**: `check` compares the on-disk body (header stripped) to a fresh fetch of the pinned SHA. Any mismatch ⇒ report file, exit 1 (FR-006).

## Entity: Gallery Section

A presentation block in `components.html` for one component.

| Field | Rule |
|---|---|
| container | `<section class="comp">` (existing gallery convention) |
| heading | `<h2 class="comp__name">` with component name + DADS class badge |
| demo | `<div class="comp__demo">` containing the vendored markup (or a faithful transcription of it) |
| code | `<pre class="comp__code">` showing copyable markup |

**Rule**: Sections are additive; existing gallery sections and `styles/components.css` are unchanged (SC-002). Styling comes from `styles/dads-components.css` + `tokens/vendor/tokens.css` only.

## Relationships

```
Pinned Upstream Source ──1:N──> Component Manifest Entry ──1:N──> Vendored Component File
                                                                        │
                                        styles/dads-components.css ──@import──┘
                                                                        │
Gallery Section ──renders──> (vendored markup) ──styled-by──> dads-components.css + tokens.css
```

## State / Lifecycle

1. **Sync**: `sync:dads` fetches manifest files at SHA → writes vendored files (with headers).
2. **Aggregate**: `styles/dads-components.css` imports vendored CSS; `components.html` embeds markup.
3. **Verify**: existing suite (visual/a11y/print/token-lint) green; `check:dads` reports no drift.
4. **Update** (future): bump SHA → `sync:dads` → review diff → re-verify.
