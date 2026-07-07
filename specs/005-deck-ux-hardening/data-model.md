# Phase 1 Data Model: Deck UX Hardening

This is a static template; "entities" are DOM/asset structures and their invariants, not persisted data.

## Entity: Slide

Represents one unit of the deck.

- **Source**: authored as `<section class="slide slide--{layout}" data-layout="{layout}">` in `index.html` (canonical). Derived into `slides/NN-{layout}.html` by `split-slides.mjs`.
- **Fields / attributes**:
  - `data-layout` (existing) — layout id, drives ORDER/TITLE maps.
  - `data-confidentiality` (existing) — 1|2|3.
  - `aria-roledescription="スライド"` (**new**, FR-003).
  - `aria-label` (**new**, FR-003) — human name + "N / total" position.
- **Contained headings**:
  - Title slide: exactly one `<h1 class="title">` (**changed** from `<p>`).
  - All other content slides: `<h2 class="slide__heading">` (unchanged).
- **Invariants**:
  - Exactly one `<h1>` exists across the whole document (SC-003).
  - Heading levels do not skip (no h3 without a preceding h2 in the same slide).
  - Slide renders at 1280×720 with ≤1px overflow in review mode (SC-001, unchanged).
  - Slide content is real DOM text (existing `convertibility` contract).

## Entity: Chart series

A data series inside an SVG chart.

- **Fields**:
  - Color (existing) — from `--cat-1..7` DS palette.
  - **Non-color cue (new, FR-004)** — a direct `<text>` label (or segment/value label) identifying the series at or adjacent to its mark.
- **Invariants**:
  - Every chart that renders ≥2 series exposes a non-color cue per series.
  - Series identity is recoverable in grayscale (SC-004).
  - Labels are real SVG `<text>` (not pseudo-elements), consistent with convertibility.
- **Scope**: multi-series charts in Appendix D and Appendix E. Single-series chart (06) already satisfies this via bar labels.

## Entity: Emphasis target

The single focal element per slide eligible for accent color.

- **Fields**:
  - Role: `key figure` | `recommended option` | `single keyword` | `none`.
- **Invariants** (FR-006, FR-007, SC-005):
  - Accent color is applied to **at most one** focal element per slide.
  - Structural/decorative chrome (heading underline rule, list bullet markers) uses a **neutral/border** role, not accent, by default.
  - When a designated key element exists, it is the most prominent accented item.
- **State change**: `slides.css` heading underline moves from `background: var(--accent)` to a neutral/border token; per-layout accent audit ensures no second accent competes.

## Entity: Deck view mode

The presentation state governing how slides display. Held on the document root.

- **States**:
  - `review` (**default**) — vertical scroll gallery, native 1280×720, all slides visible. Current behavior; unchanged.
  - `present` — single active slide, scaled to fit viewport, keyboard-navigable, others `inert`/hidden.
  - `print` — `@media print`, one slide per page, all slides visible; ignores `data-mode`.
- **Representation**: `document.documentElement[data-mode="review|present"]` (default `review`); active slide index tracked by `present.js`.
- **Transitions**:
  - `review → present`: toolbar control or `P`.
  - `present → review`: `P` or `Esc`.
  - within `present`: next/prev bounded [0, total-1]; `F` toggles fullscreen.
- **Invariants** (FR-009–014):
  - Default load is `review`; tests that never toggle mode see unchanged output.
  - In `present`, exactly one slide is visible and focusable; scale preserves 16:9; no clipping/horizontal scroll.
  - Motion suppressed under `prefers-reduced-motion`.
  - Print output unaffected regardless of `data-mode`.

## Cross-entity invariants (pipeline)

- **Token discipline**: no new raw hex/rgb/hsl or raw spacing px in `styles/**` (SC-02, `lint:tokens`).
- **Source/derivative sync (P4)**: `slides/*.html` MUST equal `split-slides.mjs` output for the current `index.html`; `check:slides` fails on drift (FR-017).
- **Cross-reference integrity**: any `data-practice` / `.cid` additions resolve to `docs/practices.md` IDs (`check:crossrefs`, `check:coverage`).
