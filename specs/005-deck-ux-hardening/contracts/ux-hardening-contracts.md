# Contracts: Deck UX Hardening

UI/CLI contracts for this static template. Each contract has a verifiable test.

## C1 — Focus indicator (FR-001, SC-002)

- **Given** any interactive element (`button`, `a[href]`, `[tabindex]:not([tabindex="-1"])`) receives keyboard focus,
- **Then** `:focus-visible` renders a visible outline with non-zero width, sourced from semantic tokens, with ≥3:1 non-text contrast against its background.
- **On accent-background slides** (`.slide--title`, `.slide--closing`), the ring uses `--text-on-accent` to preserve contrast.
- **Test**: `tests/a11y/focus-a11y.spec.mjs` — focus each interactive element, assert computed `outline-style !== 'none'` and `outline-width` > 0.

## C2 — Heading & landmark structure (FR-002, FR-003, SC-003)

- Exactly **one** `<h1>` exists in `index.html`.
- No heading level is skipped in document order.
- A `<main>` landmark wraps the deck.
- Every `.slide` exposes `aria-roledescription` and a non-empty `aria-label`.
- **Test**: `tests/a11y/landmark-a11y.spec.mjs` — count `h1` === 1; assert `main` present; assert each `.slide` has `aria-label`. Reuses axe with `best-practice`/`wcag2a` heading-order rules where available.

## C3 — Chart series non-color encoding (FR-004, SC-004)

- Every SVG chart containing ≥2 series elements (`rect`/`polyline`/`circle`/donut segment groups) provides ≥1 `<text>` label per series identifying it.
- **Test**: `tests/visual/chart-encoding.spec.mjs` — for each multi-series chart figure, assert count of series-identifying `<text>` labels ≥ number of series (or a legend-independent label per series). Grayscale distinguishability asserted structurally (labels present), not by pixel.

## C4 — Emphasis discipline (FR-006, FR-007, SC-005)

- On each of the 16 core layouts, the number of elements whose resolved color/background equals `--accent` AND that are content emphasis (excluding structural chrome that has been demoted to neutral) is **≤ 1**.
- Heading underline rule (`.slide__heading::after`) is **not** accent-colored by default.
- **Test**: extend `tests/visual/accent.spec.mjs` — per slide, evaluate computed styles and assert at most one accent-emphasized focal element; assert heading underline color !== accent.

## C5 — Present mode (FR-009–014, SC-006, SC-007)

- **Default**: `document.documentElement` has `data-mode="review"` (or unset ⇒ review); all slides visible; native size.
- **Activate**: toolbar control or `P` sets `data-mode="present"`.
- **Fit**: in present mode at a viewport smaller than 1280×720, the active slide's rendered bounding box fits within the viewport (no clipping, no horizontal scroll), 16:9 preserved.
- **Navigate**: `→`/`Space`/`PageDown` advance; `←`/`PageUp` retreat; bounded at [first, last] (no wrap).
- **Fullscreen**: `F` requests/exits fullscreen; current slide index preserved.
- **Inert**: non-active slides are not keyboard-focusable and not announced.
- **Reduced motion**: with `prefers-reduced-motion: reduce`, no non-essential transition is applied.
- **Non-regression**: review scroll behavior and `@media print` output are unchanged.
- **Test**: `tests/visual/present.spec.mjs` — toggle present mode, set a smaller viewport, assert active slide fits and siblings hidden/inert; simulate key nav and assert index bounds; assert default load is review and print media still shows all slides.

## C6 — Slide source drift check (FR-015–017, SC-008)

- **Command**: `node scripts/split-slides.mjs --check`
  - Regenerates each per-slide file **in memory** from `index.html`.
  - Compares to the on-disk `slides/NN-*.html`.
  - Exit `0` and print PASS if all match; exit `1` and list mismatched files if any differ.
- **Command**: `node scripts/split-slides.mjs` (no flag) — unchanged: writes files.
- **npm**: `check:slides` runs `--check`; added to `verify` before the Playwright suites.
- **Test**: covered by the CLI itself (invoked in `verify`); optionally a thin spec asserts non-zero exit on an injected divergence.

## Non-regression contract (all stories)

- `npm run lint:tokens` PASS (no new hardcoded values).
- `npm run check:crossrefs` and `check:coverage` PASS (practice IDs intact).
- Existing `tests/visual/*`, `tests/a11y/*`, `tests/print/*` remain green in review mode at native size.
