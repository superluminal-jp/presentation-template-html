---
description: "Task list for Deck UX Hardening (005)"
---

# Tasks: Deck UX Hardening

**Input**: Design documents from `/specs/005-deck-ux-hardening/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ux-hardening-contracts.md

**Tests**: Included — this project is test-first (Playwright + axe-core) and the contracts define verifiable tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Canonical deck is `index.html`; `slides/*.html` are regenerated, never hand-edited.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Confirm toolchain: `npm run lint:tokens`, `check:crossrefs`, `check:coverage` run green on the current tree (baseline). Note whether chromium is installed for Playwright suites.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ Must complete before story work relies on it.**

- [ ] T002 Add `check:slides` to `package.json` scripts and insert it into `verify` before the Playwright suites (wires FR-017 gate once T017 lands).
- [ ] T003 Verify no key-binding conflict inventory: document that `annotations.js` uses `a`; present mode will use `p/f/arrows/space/PageUp/Down/Esc` (research D3). No code, just confirm before US3.

**Checkpoint**: Pipeline slots ready; stories can proceed P1 → P2 → P4 → P3.

---

## Phase 3: User Story 1 — Accessibility (Priority: P1) 🎯 MVP

**Goal**: Visible focus, single-h1 + landmark + slide names, non-color chart labels; zero critical/serious axe violations.

### Tests (write first, must FAIL)

- [ ] T004 [P] [US1] `tests/a11y/focus-a11y.spec.mjs` — every interactive element shows `:focus-visible` outline (style ≠ none, width > 0) on `index.html` and `components.html` (C1).
- [ ] T005 [P] [US1] `tests/a11y/landmark-a11y.spec.mjs` — exactly one `<h1>`, `<main>` present, every `.slide` has non-empty `aria-label` + `aria-roledescription`; axe heading-order rule clean (C2).
- [ ] T006 [P] [US1] `tests/visual/chart-encoding.spec.mjs` — every multi-series SVG chart (Appendix D/E) has ≥1 `<text>` label per series (C3).

### Implementation

- [ ] T007 [US1] Add token-driven `:focus-visible` ring in `styles/base.css`; accent-surface override (`.slide--title`, `.slide--closing`) using `--text-on-accent`. Exclude from `@media print`.
- [ ] T008 [US1] `index.html`: change title heading `<p class="title">` → `<h1 class="title">`; wrap `.deck` in `<main>`.
- [ ] T009 [US1] `index.html`: add `aria-roledescription="スライド"` + descriptive `aria-label` (name + position) to each `<section class="slide">`. (Alternatively inject position via `frame.js` — keep static labels for names.)
- [ ] T010 [P] [US1] `index.html`: add direct `<text>` series labels to Appendix D multi-series bar (企画/開発/運用) and Appendix E multi-line / 100% stacked / donut / scatter charts; keep DS palette colors.
- [ ] T011 [US1] Regenerate `slides/*.html` via `node scripts/split-slides.mjs` (propagate US1 markup).
- [ ] T012 [US1] Run `npm run test:a11y` + `tests/visual/chart-encoding.spec.mjs`; confirm T004–T006 pass and existing a11y/contrast stay green.

**Checkpoint**: P1 delivers standalone WCAG improvements.

---

## Phase 4: User Story 2 — Emphasis discipline (Priority: P2)

**Goal**: ≤1 accent focal element per slide; heading underline demoted to neutral.

### Tests (write first, must FAIL)

- [ ] T013 [US2] Extend `tests/visual/accent.spec.mjs` — per slide, at most one accent-emphasized focal element; assert `.slide__heading::after` color ≠ `--accent` (C4). Keep the existing token-value assertion.

### Implementation

- [ ] T014 [US2] `styles/slides.css`: change `.slide__heading::after` background from `var(--accent)` to a neutral/border token (`--border-strong`); keep size/radius.
- [ ] T015 [P] [US2] Audit `styles/layouts/*.css` for slides where accent now appears >1×; demote secondary accent uses to neutral so the single focal element (key figure / recommended option) stays dominant. Token-driven only.
- [ ] T016 [US2] Regenerate `slides/*.html`; run `accent.spec.mjs` + `lint:tokens`; confirm pass.

**Checkpoint**: P1 + P2 both green.

---

## Phase 5: User Story 4 — Source drift check (Priority: P4)

> Sequenced before US3 because it is small, isolated, and gates the regenerate steps used by other stories.

### Tests (write first, must FAIL)

- [ ] T017 [US4] Implement `--check` in `scripts/split-slides.mjs`: regenerate each file in memory, diff vs on-disk `slides/NN-*.html`, exit 1 + list mismatches on drift, PASS otherwise (C6). Refactor generation into a shared function used by both write and check paths.

### Implementation

- [ ] T018 [US4] Confirm `check:slides` npm script (from T002) invokes `--check`; run `npm run check:slides` → PASS on the synced tree.
- [ ] T019 [US4] Negative check: temporarily perturb one `slides/*.html`, confirm `--check` exits 1 naming the file, then restore/regenerate.

**Checkpoint**: Divergence now fails the gate.

---

## Phase 6: User Story 3 — Present mode + view scaling (Priority: P3)

**Goal**: Opt-in single-slide, fit-to-viewport, keyboard/fullscreen, reduced-motion-safe; review/print unchanged.

### Tests (write first, must FAIL)

- [ ] T020 [US3] `tests/visual/present.spec.mjs` — default load is `review`; toggling present mode shows exactly one slide, fits a sub-1280×720 viewport (no clip/h-scroll), keyboard next/prev bounded, siblings inert; print media still shows all slides (C5).

### Implementation

- [ ] T021 [US3] Create `js/present.js`: `data-mode` toggle (`P`/toolbar), active-slide `transform: scale()` fit, keyboard nav (arrows/space/PageUp/Down bounded), Fullscreen API (`F`), `inert` on non-active slides, skip when focus in form fields; no motion under `prefers-reduced-motion`.
- [ ] T022 [US3] `styles/slides.css`: present-mode styles (centering, scaled slide wrapper, hide non-active) gated on `:root[data-mode="present"]`; ensure review + `@media print` unaffected. Token-driven.
- [ ] T023 [US3] `index.html`: add a “発表モード” toolbar control and `<script src="js/present.js">` (index only — NOT in `split-slides` head template).
- [ ] T024 [US3] Run `present.spec.mjs` + full regression (`test:visual`, `test:a11y`, `test:print`); confirm review-mode tests unchanged.

**Checkpoint**: All four stories functional.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T025 Run full `npm run verify` (lint:tokens → check:crossrefs → check:coverage → check:slides → visual → a11y → print); all green.
- [ ] T026 [P] Update `docs/practices.md`/annotations only if a new practice ID is introduced (e.g., color-independence); keep cross-refs consistent (`check:crossrefs`).
- [ ] T027 Run `specs/005-deck-ux-hardening/quickstart.md` manual checks (grayscale charts, keyboard present mode, drift check).

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T003)** → stories.
- **US1 (T004–T012)**, **US2 (T013–T016)**, **US4 (T017–T019)** are mutually independent (different files) and each independently testable.
- **US3 (T020–T024)** depends only on Foundational (T003 key inventory); independent of US1/US2/US4 but should run regression after them.
- Recommended order: **US1 → US2 → US4 → US3 → Polish** (spec priority, with small isolated US4 slotted before the largest story).
- Within each story: tests first (must fail) → implementation → regenerate `slides/` → verify.

### Parallel opportunities

- T004/T005/T006 (US1 tests) in parallel.
- T010 (chart labels) parallel with T007 (focus CSS) — different files.
- T015 (layout accent audit) parallel across independent layout CSS files.

## Notes

- Never hand-edit `slides/*.html`; regenerate after any `index.html` change (T011, T016; enforced by T017 check).
- Keep every style token-driven — `lint:tokens` is a hard gate.
- Present mode is opt-in; default `review` keeps native-size tests green.
- Commit after each story checkpoint.
