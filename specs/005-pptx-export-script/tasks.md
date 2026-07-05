---

description: "Task list for feature implementation"
---

# Tasks: スライドテンプレート → PowerPoint テンプレート(.potx)変換スクリプト

**Input**: Design documents from `/specs/005-pptx-export-script/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Included. `research.md` §8 commits to a pytest + Playwright test strategy for this feature; tests are written before implementation per each story.

**Organization**: Tasks are grouped by user story (US1/US2/US3 map to spec.md priorities P1/P2/P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project (existing static-site repo), per plan.md Project Structure:
- `scripts/extract-slide-layout-data.mjs` (Node/Playwright extraction)
- `scripts/pptx-template/` (Python assembly: `build_potx.py`, `layout_map.py`, `theme.py`, `potx_writer.py`, `requirements.txt`)
- `tests/pptx/` (pytest + fixtures)
- `build/`, `dist/` (generated, gitignored)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding for the new conversion tool

- [X] T001 Create directories `scripts/pptx-template/`, `tests/pptx/`, `tests/pptx/fixtures/`
- [X] T002 [P] Add `build/` and `dist/` to `.gitignore`
- [X] T003 [P] Create `scripts/pptx-template/requirements.txt` pinning `python-pptx`, `lxml`, `pytest`
- [X] T004 [P] Add `"build:potx": "node scripts/extract-slide-layout-data.mjs && python3 scripts/pptx-template/build_potx.py"` to `package.json` scripts (per contracts/cli-interface.md)
- [X] T005 Implement `scripts/pptx-template/potx_writer.py::save_as_potx(prs, output_path)`: save the fully-built `python-pptx` `Presentation` to a temp `.pptx`, rewrite the `/ppt/presentation.xml` entry in `[Content_Types].xml` from `...presentationml.presentation.main+xml` to `...presentationml.template.main+xml`, and write the result to `output_path`. Note: `python-pptx`'s `Presentation()` loader hard-rejects template content types (verified during implementation), so this must run as a post-process on the finished file, never as a load step (research.md §3)

**Checkpoint**: Tooling scaffolding exists; no shared logic yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared mapping/config modules and fixtures that every user story's tests and implementation depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Define `scripts/pptx-template/layout_map.py` skeleton: `LAYOUT_DEFINITIONS` table covering all 16 layout IDs (`01-title` … `16-closing`) with `layout_name_ja` and the role→`PlaceholderMapping` per data-model.md §5 (structure only; positioning logic added in later phases)
- [X] T007 [P] Define `scripts/pptx-template/theme.py` skeleton: `THEME_SLOT_MAP` constant per data-model.md §4 (OOXML slot → DS token role), function signatures for `apply_theme(prs, token_values: dict) -> None` (implementation added in US2)
- [X] T008 [P] Create `tests/pptx/fixtures/slide-layout-data.sample.json`: a hand-authored fixture covering at least the `01-title` (title/subtitle/meta roles) and `10-dashboard` (chart role with `fallback.is_fallback=true`) layouts, valid against `contracts/slide-layout-data.schema.json`
- [X] T009 [P] Create `tests/pptx/conftest.py` with shared pytest fixtures: loader for `slide-layout-data.sample.json` and a temp-dir fixture for generated `.potx` output
- [X] T010 Add a small JSON Schema validation helper (Node, `scripts/pptx-template/lib/validate-schema.mjs` or inline in the extractor) that validates extractor output against `contracts/slide-layout-data.schema.json` before writing `build/slide-layout-data.json`

**Checkpoint**: Foundation ready — layout mapping table, theme mapping table, and test fixtures exist; US1/US2/US3 implementation can begin.

---

## Phase 3: User Story 1 - HTML の 16 レイアウトを PowerPoint の「スライドレイアウト」として使えるようにする (Priority: P1) 🎯 MVP

**Goal**: `slides/` の 16 HTML レイアウトを 1 つの `.potx` に変換し、PowerPoint の「新しいスライド」ギャラリーから選択・編集可能なレイアウトとして使えるようにする。

**Independent Test**: `npm run build:potx` を実行して生成された `.potx` を PowerPoint で開き、スライドマスター表示で 16 個のカスタムレイアウトが存在し、「新しいスライド」ギャラリーにも 16 レイアウトが表示され、各レイアウトのタイトル/本文プレースホルダーに文字入力できることを確認する。

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T011 [P] [US1] pytest `test_build_generates_16_slide_layouts` in `tests/pptx/test_build_potx.py`: given the full 16-layout fixture, assert the produced `.potx` ZIP contains exactly 16 `ppt/slideLayouts/slideLayoutN.xml` parts
- [X] T012 [P] [US1] pytest `test_layout_names_match_fixture` in `tests/pptx/test_build_potx.py`: assert each generated slide layout's `<p:cSld name="...">` equals the fixture's `layout_name_ja` (FR-012)
- [X] T013 [P] [US1] pytest `test_placeholders_are_editable_not_baked_images` in `tests/pptx/test_build_potx.py`: for the `01-title` layout, assert the title/subtitle regions are `<p:sp>` placeholder shapes with `<p:ph type="title"/>`-style elements, not `<p:pic>` shapes (FR-004)
- [X] T014 [P] [US1] pytest `test_slide_size_is_widescreen` in `tests/pptx/test_build_potx.py`: assert `prs.slide_width`/`slide_height` equal 13.333in×7.5in in EMU (FR-003)
- [X] T015 [P] [US1] Playwright test `tests/pptx/extract.spec.ts` (or `.mjs`, matching existing Playwright test file convention): run the extractor against `slides/01-title.html` only and assert the resulting JSON validates against `contracts/slide-layout-data.schema.json` and contains `title`/`subtitle`/`meta` roles

### Implementation for User Story 1

- [X] T016 [US1] Implement `scripts/extract-slide-layout-data.mjs`: for each `slides/NN-*.html`, launch Playwright headless Chromium, locate known semantic selectors (`.title`, `.subtitle`, `.slide__stage` children, `.meta`, images, frame elements per `styles/frame.css`), read `getComputedStyle` (color, background-color, font-family, font-size, font-weight, line-height) and `getBoundingClientRect()` for `bbox_px`/`bbox_ratio` (against the 1280×720 canvas), and emit one `LayoutDefinition` object per file into `build/slide-layout-data.json`, validated via T010's schema helper before writing
- [X] T017 [US1] Implement `scripts/pptx-template/build_potx.py` CLI skeleton: argument parsing (`--input`, `--output` per contracts/cli-interface.md), load `slide-layout-data.json`, create a blank `python_pptx.Presentation()` to build into, and call `potx_writer.save_as_potx()` (T005) at the end to produce the `--output` `.potx`
- [X] T018 [US1] Implement slide-layout cloning in `scripts/pptx-template/layout_map.py`: for each `LayoutDefinition`, clone one of the blank presentation's existing `slideLayout` XML parts via `lxml`, assign a new part name/relationship, and set `<p:cSld name="...">` to `layout_name_ja`
- [X] T019 [US1] Implement placeholder geometry + type creation in `scripts/pptx-template/layout_map.py`: convert each `SlideElement.bbox_ratio` to EMU offsets on the 13.333in×7.5in canvas and create the corresponding placeholder shape (`TITLE`/`BODY`/`PICTURE`) per the `PlaceholderMapping` table (data-model.md §5), inserted in `reading_order_index` order
- [X] T020 [US1] Implement FR-004/Clarification #1 in `scripts/pptx-template/layout_map.py`: leave placeholder text runs empty so PowerPoint's built-in prompt text ("クリックしてタイトルを入力" style) is shown, instead of writing any extracted HTML text into the shape
- [X] T021 [US1] Wire `scripts/pptx-template/build_potx.py` to call the layout-cloning/placeholder functions for all 16 `LayoutDefinition`s, set `prs.slide_width`/`slide_height` to 13.333in×7.5in (FR-003), and save to `--output` path
- [X] T022 [US1] Add CLI exit-code handling to both `scripts/extract-slide-layout-data.mjs` and `scripts/pptx-template/build_potx.py` per contracts/cli-interface.md (`0` success, `1` unrecoverable error e.g. missing input dir or unwritable output path)

**Checkpoint**: `npm run build:potx` produces a `.potx` with 16 correctly named, editable-placeholder layouts at the right slide size. User Story 1 is independently testable and deliverable as the MVP.

---

## Phase 4: User Story 2 - DS トークン由来の配色・書体をスライドマスター/レイアウトに反映する (Priority: P2)

**Goal**: `.potx` のテーマ配色・フォント(theme1.xml)を DS トークンの実効値で上書きし、プレースホルダー外で利用者が新規に描画する図形にも既定で DS トークン由来の色/フォントが適用されるようにする。

**Independent Test**: 表紙・本文・比較レイアウトを変換し、`.potx` のテーマ配色スロット(dk1/lt1/dk2/lt2/accent1-6/hlink/folHlink)とフォント(majorFont/minorFont)の値を、対応する DS トークンの RGB 値・Noto Sans JP と比較して一致することを確認する。

### Tests for User Story 2 ⚠️

- [X] T023 [P] [US2] pytest `test_theme_color_slots_match_ds_tokens` in `tests/pptx/test_build_potx.py`: assert `theme1.xml`'s `<a:clrScheme>` slots (dk1/lt1/dk2/lt2/accent1-6/hlink/folHlink) equal the expected RGB hex values from the fixture's DS token values, per `THEME_SLOT_MAP` (data-model.md §4)
- [X] T024 [P] [US2] pytest `test_theme_fonts_are_noto_sans_jp` in `tests/pptx/test_build_potx.py`: assert `<a:fontScheme><a:majorFont>/<a:minorFont>`'s `<a:latin typeface="...">` equals `"Noto Sans JP"`
- [X] T025 [P] [US2] pytest `test_user_drawn_shape_inherits_theme_defaults` in `tests/pptx/test_build_potx.py`: assert a plain autoshape added to a generated slide (simulating a user-drawn shape outside any placeholder) resolves its default fill/font to the overridden theme scheme, not Office defaults

### Implementation for User Story 2

- [X] T026 [US2] Extend `scripts/extract-slide-layout-data.mjs` to resolve and emit global DS token role values (`--accent`, `--accent-strong`, `--accent-weak`, `--text-primary`, `--text-secondary`, `--slide-bg`, `--surface`, `--state-success/error/warning`, `--font-sans`) read from `:root` computed styles, added as a top-level `tokens` object in `build/slide-layout-data.json` (extends the schema from `contracts/slide-layout-data.schema.json` with a `tokens` property)
- [X] T027 [US2] Implement `scripts/pptx-template/theme.py`'s `apply_theme(prs, token_values)`: locate the `ThemePart` via the slide master's part relationships, edit `<a:clrScheme>` slots and `<a:fontScheme>` `majorFont`/`minorFont` `latin` typeface via `lxml` per `THEME_SLOT_MAP` (data-model.md §4)
- [X] T028 [US2] Wire `scripts/pptx-template/build_potx.py` to call `theme.apply_theme(prs, data["tokens"])` on the in-progress `Presentation` before calling `potx_writer.save_as_potx()`

**Checkpoint**: Generated `.potx` carries DS-token-derived theme colors/fonts as the deck-wide default, verifiable both on placeholders and on newly user-drawn shapes. User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - 変換できない要素を明示的に報告する (Priority: P3)

**Goal**: ネイティブ再現できない要素(ダッシュボードのグラフ、SVG 装飾等)をラスター画像へフォールバックしつつ、どのレイアウトの何がフォールバックしたかを変換ログで明示する。

**Independent Test**: `10-dashboard.html` を含む変換を実行し、生成された `.potx` の該当レイアウトに画像シェイプが挿入されていること、かつ標準出力の NDJSON ログに当該レイアウト名・要素・理由を記した `WARNING` エントリが出力されることを確認する。

### Tests for User Story 3 ⚠️

- [X] T029 [P] [US3] pytest `test_fallback_element_becomes_picture_and_logs_warning` in `tests/pptx/test_build_potx.py`: using the fixture's `10-dashboard` entry (`fallback.is_fallback=true`), assert the generated layout contains a `Picture` shape at the expected position and that a `WARNING` log entry is emitted with the matching `layout_id`/`element_role`
- [X] T030 [P] [US3] pytest `test_unresolvable_token_logs_warning_and_continues` in `tests/pptx/test_build_potx.py`: simulate a `SlideElement` with an unknown/missing `token_role`, assert the build completes (exit code path returns success) with a `WARNING` log entry rather than raising (FR-009)
- [X] T031 [P] [US3] Playwright test `tests/pptx/extract-fallback.spec.ts`: run the extractor against `slides/10-dashboard.html`, assert the emitted JSON marks the dashboard chart element as `fallback.is_fallback=true` with a non-null `image_path`

### Implementation for User Story 3

- [X] T032 [US3] Implement an NDJSON logging module `scripts/pptx-template/logging_util.py` per contracts/cli-interface.md log schema (`level`, `layout_id`, `element_role`, `message`), used by `build_potx.py`
- [X] T033 [US3] Extend `scripts/extract-slide-layout-data.mjs` to detect elements requiring rasterization (dashboard charts, complex SVG decorations identified via a `data-pptx-fallback` marker or known selector list), capture a 2x-scale PNG via Playwright's `elementHandle.screenshot()`, save under `build/fallback-images/`, and populate `fallback.is_fallback`/`reason`/`image_path`
- [X] T034 [US3] Implement fallback handling in `scripts/pptx-template/layout_map.py`/`build_potx.py`: when `SlideElement.fallback.is_fallback` is true, insert a `Picture` shape at the element's bbox instead of a native placeholder, and emit a `WARNING` via `logging_util` with the reason
- [X] T035 [US3] Wrap per-element style/theme resolution in `scripts/pptx-template/build_potx.py` with try/except that logs a `WARNING` (via `logging_util`) and continues processing on failure, instead of raising (FR-009); reserve exit code `1` only for unrecoverable setup errors (missing input dir, unwritable output path)

**Checkpoint**: All three user stories are independently functional — full pipeline handles the happy path (US1), on-brand theming (US2), and non-crashing, transparent handling of unconvertible elements (US3).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility requirements (FR-014/FR-015) and final validation that span all layouts, plus documentation

- [X] T036 [P] pytest `test_image_placeholders_have_alt_text_hint` in `tests/pptx/test_build_potx.py`: assert `PICTURE`-type placeholders/shapes have a non-empty `cNvPr/@descr` set from `alt_text_hint` (FR-014)
- [X] T037 [P] pytest `test_reading_order_title_body_content` in `tests/pptx/test_build_potx.py`: assert shape insertion order within a layout's `<p:spTree>` follows `reading_order_index` (title → body → supporting content) (FR-015)
- [X] T038 [P] Implement alt-text assignment in `scripts/pptx-template/layout_map.py`: set `cNvPr/@descr` on `PICTURE` placeholders/fallback `Picture` shapes from `SlideElement.alt_text_hint` via direct `lxml` edit (research.md §6)
- [X] T039 [P] Implement/confirm reading-order in `scripts/pptx-template/layout_map.py`: ensure shapes are appended to `<p:spTree>` in `reading_order_index` order (title → body → supporting content) (research.md §6)
- [X] T040 Run `npm run build:potx` end-to-end against all 16 `slides/*.html` and manually validate SC-001–SC-008 following `quickstart.md`'s PowerPoint desktop checklist; record results in the PR description
- [X] T041 [P] Run full test suite: `npx playwright test tests/pptx` and `cd scripts/pptx-template && pytest ../../tests/pptx`; confirm all pass
- [X] T042 Update `README.md` (or equivalent top-level docs) with the new `npm run build:potx` command and a link to `specs/005-pptx-export-script/quickstart.md`, per the live-documentation requirement that public-contract changes (new CLI command) ship with matching docs in the same change

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — no dependency on US2/US3
- **User Story 2 (Phase 4)**: Depends on Foundational; reuses the `.potx` produced by US1's `build_potx.py` skeleton (T017/T021) but its own tests/implementation are independently checkable via the theme-only assertions
- **User Story 3 (Phase 5)**: Depends on Foundational; extends the same `build_potx.py`/extractor but its fallback/logging behavior is independently testable via T029–T031
- **Polish (Phase 6)**: Depends on US1 (placeholders must exist to attach alt text/reading order to) — practically run after US1, can run alongside or after US2/US3

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — MVP
- **User Story 2 (P2)**: Builds on US1's generated layouts (theme applies to the same `.potx`) but is independently testable (theme assertions don't require US3's fallback logic)
- **User Story 3 (P3)**: Builds on US1's pipeline (adds fallback/logging) but is independently testable without US2's theme work

### Within Each User Story

- Tests written and failing before implementation
- Extraction (Node) tasks before assembly (Python) tasks that consume their output
- Layout/placeholder structure before theme/fallback refinements

### Parallel Opportunities

- Setup tasks T002–T004 in parallel; T005 is standalone
- Foundational tasks T006–T009 in parallel (different files); T010 depends on none of them structurally but is easiest after T006
- All US1 test tasks T011–T015 in parallel with each other (different test functions/files)
- All US2 test tasks T023–T025 in parallel; all US3 test tasks T029–T031 in parallel
- Once Foundational completes, US2 and US3 test-writing can start in parallel with US1 implementation (though US2/US3 implementation tasks touch the same `build_potx.py`/`layout_map.py` files as US1, so implementation should be sequenced after US1's T016–T022 land to avoid merge conflicts)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "pytest test_build_generates_16_slide_layouts in tests/pptx/test_build_potx.py"
Task: "pytest test_layout_names_match_fixture in tests/pptx/test_build_potx.py"
Task: "pytest test_placeholders_are_editable_not_baked_images in tests/pptx/test_build_potx.py"
Task: "pytest test_slide_size_is_widescreen in tests/pptx/test_build_potx.py"
Task: "Playwright test tests/pptx/extract.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `npm run build:potx`, open the `.potx` in PowerPoint desktop, confirm 16 layouts + editable placeholders
5. This is a usable MVP: HTML-only users can already distribute a `.potx` others can author from in PowerPoint, even before brand theming (US2) and fallback reporting (US3) land

### Incremental Delivery

1. Setup + Foundational → tooling scaffolding ready
2. Add User Story 1 → test independently → MVP `.potx` deliverable
3. Add User Story 2 → test independently → on-brand `.potx` deliverable
4. Add User Story 3 → test independently → transparent-fallback `.potx` deliverable
5. Polish (accessibility + full validation + docs) → ship

---

## Notes

- [P] tasks touch different files with no unmet dependencies
- [Story] label maps each task to its owning user story for traceability
- Verify each test task fails before starting its paired implementation task
- Stop at each phase checkpoint to validate independently before proceeding
- T005's `potx_writer.save_as_potx()` must only run as a final post-process step on a fully-built presentation; `python-pptx`'s `Presentation()` loader cannot open template content types, so nothing downstream may try to re-open the `.potx` output via `python-pptx`
