---
description: "Task list for DADS Official HTML Components Intake"
---

# Tasks: DADS Official HTML Components Intake

**Input**: Design documents from `specs/006-dads-components/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No new automated tests are authored (no TDD requested). Verification uses the existing suite (`lint:tokens`, `test:a11y`, `test:visual`) plus the new `check:dads` drift command. Verification tasks are included per story.

**Organization**: Tasks grouped by user story (US1 P1, US2 P2, US3 P3) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish have no story label)

## Path Conventions

Single static project. Repo-root paths: `scripts/`, `vendor/`, `styles/`, `components.html`, `package.json`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffolding for the vendored tree and npm entry points.

- [ ] T001 [P] Create the vendored component directory scaffold `vendor/dads-components/{card,list,checkbox,progress-indicator,breadcrumb,radio}/` (add a `.gitkeep` in each so the empty dirs commit)
- [ ] T002 [P] Add `"sync:dads": "node scripts/sync-dads.mjs"` and `"check:dads": "node scripts/sync-dads.mjs --check"` to the `scripts` block of `package.json` (do NOT add to `verify` — `check:dads` needs network per research R3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the sync script and populate the vendored files that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until `vendor/dads-components/**` is populated.

- [ ] T003 Create `scripts/sync-dads.mjs` with in-script constants (`REPO`, `SHA=3b34f4c3553fa3bee90bfd8b6fe962ac3055107d`, `RAW_BASE`, `TOKEN_VERSION='@digital-go-jp/design-tokens@2.0.1'`, `DEST_ROOT='vendor/dads-components'`) and the `MANIFEST` (6 components → CSS/HTML file lists) exactly as listed in `data-model.md` (Component Manifest Entry). Model structure on `scripts/sync-tokens.mjs`.
- [ ] T004 Implement write-mode in `scripts/sync-dads.mjs`: HTTPS GET each manifest file from `RAW_BASE`, error+exit 1 on non-200, prepend the provenance header (CSS `/* */`, HTML `<!-- -->`) with fields per `contracts/sync-dads-cli.md`, write byte-identical body to `vendor/dads-components/<name>/<basename>` (depends on T003)
- [ ] T005 Run `npm run sync:dads` to populate `vendor/dads-components/**`; visually confirm 6 dirs contain the expected CSS/HTML (no `.js/.ts/.mdx/.vrt/.test` files) (depends on T004)
- [ ] T006 Guard token resolution: extract `var(--…)` refs from the vendored component CSS and confirm every design-token var (all except the per-instance `--value`) is defined in `tokens/vendor/tokens.css`; fail loudly if any are missing (depends on T005)

**Checkpoint**: Vendored, provenance-stamped component files exist and their tokens resolve. User stories can begin.

---

## Phase 3: User Story 1 - Use official DADS components on slides (Priority: P1) 🎯 MVP

**Goal**: All six DADS components render with DADS-conformant styling in the `components.html` gallery, using official markup unchanged.

**Independent Test**: Open `components.html`; card, list, checkbox, progress-indicator, breadcrumb, radio all appear styled (colors/spacing from tokens), with official class names in their markup.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create `styles/dads-components.css`: `@import` each of the 6 vendored component CSS files (relative `../vendor/dads-components/<name>/<file>.css`), add the card image placeholder rule (neutral fill via `var(--color-neutral-solid-gray-100)`; documented single hex exception only if no token fits), and any minimal static-state scoping — no overrides of upstream token-driven colors/spacing (per `contracts/gallery-ui.md`)
- [ ] T008 [US1] Add `<link rel="stylesheet" href="styles/dads-components.css" />` to `components.html` `<head>`, placed AFTER `styles/components.css` (leave the `styles/components.css` link and file untouched — SC-002)
- [ ] T009 [US1] Add the card gallery `<section class="comp">` to `components.html` using 2–3 non-photo vendored variants with the placeholder in place of `<img>`
- [ ] T010 [US1] Add the list (箇条書きリスト) gallery section to `components.html` from the vendored markup
- [ ] T011 [US1] Add the checkbox gallery section to `components.html` showing unchecked + checked static states (no indeterminate)
- [ ] T012 [US1] Add the progress-indicator gallery section to `components.html` using the static markup with `style="--value: <n>"` inline (no JS)
- [ ] T013 [US1] Add the breadcrumb (パンくず) gallery section to `components.html` from the vendored markup (plain / with-home-icon / with-visible-label)
- [ ] T014 [US1] Add the radio gallery section to `components.html` showing standalone + stacked static states

> T009–T014 all edit `components.html` (same file) → run sequentially, not in parallel.

- [ ] T015 [US1] Render `components.html` in a browser: confirm all 6 components are styled (0 unstyled/broken — SC-001); regenerate the `components.html` visual baseline via `npm run test:visual` if the change is intended
- [ ] T016 [US1] Run `npm run test:a11y` against `components.html`; confirm axe passes with the new sections (labels/aria from upstream markup intact, single `<h1>` preserved)

**Checkpoint**: MVP — the six official components are usable from the gallery.

---

## Phase 4: User Story 2 - Keep components updatable and reproducible (Priority: P2)

**Goal**: Maintainers can re-sync from the pinned SHA reproducibly and detect drift without cloning/building upstream.

**Independent Test**: `npm run check:dads` exits 0 when vendored files match the pinned SHA and exits 1 (listing files) when a vendored file is altered.

### Implementation for User Story 2

- [ ] T017 [US2] Implement `--check` mode in `scripts/sync-dads.mjs`: fetch each manifest file at the pinned SHA, read the local vendored file and strip its provenance header, byte-compare bodies, collect mismatches/missing, exit 1 with the offending paths (else exit 0) — same contract as `check:slides` (`contracts/sync-dads-cli.md`)
- [ ] T018 [US2] Verify reproducibility: re-run `npm run sync:dads` and confirm `git diff --stat vendor/dads-components` is empty; run `npm run check:dads` and confirm exit 0 (SC-003)
- [ ] T019 [US2] Verify drift detection: temporarily edit one vendored file, confirm `npm run check:dads` exits 1 and names it, then revert (SC-004)

**Checkpoint**: Update + drift-audit workflow works.

---

## Phase 5: User Story 3 - Preserve provenance and license compliance (Priority: P3)

**Goal**: Every vendored file records its DADS origin, URL, commit, retrieval date, token version, and MIT note.

**Independent Test**: Open any vendored file → a complete provenance header is present.

### Implementation for User Story 3

- [ ] T020 [US3] Confirm the provenance header emitted by `scripts/sync-dads.mjs` includes all fields — `出典：デジタル庁デザインシステム`, source URL, commit SHA, retrieval date, `@digital-go-jp/design-tokens@2.0.1`, and the MIT/"vendored unmodified — do not hand-edit" line; adjust the header builder and re-run `npm run sync:dads` if any field is missing (per `contracts/sync-dads-cli.md`)
- [ ] T021 [US3] Verify 100% of files under `vendor/dads-components/**` carry the complete header (grep the source marker across all vendored CSS/HTML) (SC-005)

**Checkpoint**: License/attribution compliance verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T022 [P] Add a short usage note (sync:dads / check:dads, pinned-SHA update flow) to `docs/practices.md` or the repo README, cross-referencing `specs/006-dads-components/quickstart.md`
- [ ] T023 Run `npm run verify` (offline chain: lint:tokens, check:crossrefs, check:coverage, check:slides, test:visual, test:a11y, test:print) — all green (SC-006)
- [ ] T024 Confirm no scope leakage: `git diff --stat styles/components.css index.html` is empty and no new files under `js/` (SC-002, FR-008, FR-010)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories (produces the vendored substrate).
- **US1 (Phase 3)**: depends on Foundational. Delivers the MVP.
- **US2 (Phase 4)**: depends on Foundational (needs the script + vendored files). Independent of US1.
- **US3 (Phase 5)**: depends on Foundational (headers are emitted there). Independent of US1/US2.
- **Polish (Phase 6)**: depends on all targeted stories.

### User Story Dependencies

- US1, US2, US3 are mutually independent once Foundational is done. US2 and US3 both refine/verify the same `scripts/sync-dads.mjs` — if worked in parallel, coordinate edits to that file.

### Within Each User Story

- US1: new stylesheet (T007) can proceed in parallel with nothing else; the `components.html` edits (T008–T014) are sequential (same file); verification (T015–T016) last.
- US2/US3: implementation before verification.

### Parallel Opportunities

- Setup: T001 and T002 in parallel (different files).
- Foundational: T003→T004→T005→T006 are sequential (same script + ordering).
- US1: T007 (new file) parallel to planning the section edits; T009–T014 sequential on `components.html`.
- Cross-story: US1 (front-end) and US2/US3 (script) touch disjoint files except US2/US3 both edit `sync-dads.mjs`.

---

## Parallel Example: Setup

```bash
Task: "T001 Create vendor/dads-components/<6 dirs>/.gitkeep"
Task: "T002 Add sync:dads and check:dads to package.json scripts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational (populate `vendor/`) → Phase 3 US1.
2. **STOP and VALIDATE**: open `components.html`, confirm 6 components render styled; a11y green.
3. Ship the MVP.

### Incremental Delivery

1. Setup + Foundational → substrate ready.
2. US1 → gallery renders (MVP).
3. US2 → drift check + reproducible re-sync.
4. US3 → provenance/license verification.
5. Polish → docs + full `verify` + scope-leak guard.

---

## Notes

- [P] = different files, no incomplete deps. Same-file edits (esp. `components.html`, `sync-dads.mjs`) are sequential.
- `check:dads` requires network and is intentionally excluded from `npm run verify` (offline-safe CI).
- Vendored files are committed (FR-011); `.gitignore` does not exclude `vendor/`.
- Do not hand-edit vendored files — change the pinned `SHA` and re-run `sync:dads`.
- Commit after each phase/logical group.
