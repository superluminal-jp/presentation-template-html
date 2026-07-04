# Tasks: 拡張スライドレイアウトセット

**Input**: Design documents from `specs/002-extended-layouts/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Base**: feature 001(コア8レイアウト・検証ハーネス)を再利用。加算的に追加する。
**Tests**: 含む(既存ハーネスを 16 種へ拡張 + 新規カバレッジ検証)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可(異なるファイル・未完タスクに非依存)
- **[Story]**: US1/US2(spec のユーザーストーリー)

---

## Phase 1: Setup（既存ハーネスの拡張）

- [x] T001 [P] `tests/visual/_fixtures.mjs` の `LAYOUTS` 配列に拡張8種(`09-big-number`…`16-closing`)を追加し 16 種に拡張
- [x] T002 [P] `scripts/split-slides.mjs` の `ORDER`/`TITLE` マップに拡張8レイアウトを追加(09〜16)
- [x] T003 [P] `scripts/check-practice-coverage.mjs` を新規実装(全スライドの `data-practice` の和集合 ⊇ `docs/practices.md` の全 ID を検証。未実演0=SC-005)し、`package.json` に `check:coverage` を追加して `verify` に統合

**Checkpoint**: 検証系が 16 種前提へ拡張され、カバレッジ検証が起動可能。

---

## Phase 2: Foundational（拡張共通ユーティリティ）

- [x] T004 `styles/slides.css` に拡張共通ユーティリティを追加: スクリム(`--color-neutral-opacity-gray-*` 由来)、KPIタイル shell、ステップ marker、マトリクス枠。すべて役割変数のみ(ハードコード禁止)

**Checkpoint**: 複数の拡張レイアウトが共有する部品が整い、レイアウト実装が役割変数で組める。

---

## Phase 3: User Story 1 — 頻出パターンを準拠したまま表現（Priority: P1）🎯 MVP

**Goal**: 拡張8レイアウトで頻出表現を準拠スタイルのまま作成でき、ショーケース/単体で提供。
**Independent Test**: 拡張8レイアウトに内容を入れ、16:9 で崩れず表示・PDF出力でき、配色/タイポがトークン由来であることを確認。

- [x] T005 [P] [US1] `slides/09-big-number.html` + `styles/layouts/big-number.css`(単一指標 + アンカー、強調1箇所。注釈: `B-von-restorff`,`C-preattentive`,`E-fluency`,`E-anchoring`)
- [x] T006 [P] [US1] `slides/10-dashboard.html` + `styles/layouts/dashboard.css`(kpi-grid ≤6、`.kpi--highlight` ≤1。注釈: `C-dashboard`,`C-storytelling-data`,`E-default-effect`,`A-action-title`)
- [x] T007 [P] [US1] `slides/11-timeline.html` + `styles/layouts/timeline.css`(順序付きステップ + marker。注釈: `A-consistency`,`A-scqa`,`A-signposting`)
- [x] T008 [P] [US1] `slides/12-matrix.html` + `styles/layouts/matrix.css`(2軸ラベル + 4象限。注釈: `B-gestalt`,`E-framing`,`C-preattentive`)
- [x] T009 [P] [US1] `slides/13-process.html` + `styles/layouts/process.css`(番号+矢印の手順。注釈: `D-multimedia`,`B-signal-noise`,`A-consistency`)
- [x] T010 [P] [US1] `slides/14-quote.html` + `styles/layouts/quote.css`(引用 + 出典/肩書きプレースホルダ、捏造推奨文言なし。注釈: `E-cialdini`,`E-aesthetic-usability`)
- [x] T011 [P] [US1] `slides/15-image-full.html` + `styles/layouts/image-full.css`(全面プレースホルダ + スクリムで重ね文字 AA。注釈: `D-picture-superiority`,`B-whitespace`,`B-wcag`)
- [x] T012 [P] [US1] `slides/16-closing.html` + `styles/layouts/closing.css`(締め + CTA + 連絡先。注釈: `A-10-20-30`,`B-fitts`,`A-hook-throughline-cta`,`E-peak-end`)
- [x] T013 [US1] `index.html` の参考(reference)スライドの**前**へ拡張8スライドを追記(物語順、計16スライド)
- [x] T014 [US1] `node scripts/split-slides.mjs` を実行し、16 種の単体ファイルを生成(`slides/09..16-*.html`)
- [x] T015 [US1] 内容保持の拡張レイアウト見出しをアクションタイトル形式に統一(SC-006)
- [x] T016 [US1] `npm run lint:tokens` を実行し拡張CSSのハードコード0を確認(SC-002)
- [x] T017 [US1] `npm run test:visual` で 16/16 が 1280×720 で overflow なしを確認(SC-001)
- [x] T018 [US1] `npm run test:print` で 16 スライド=16 ページを確認(SC-001)
- [x] T019 [US1] `npm run test:a11y` で拡張レイアウト(重ね文字含む)の AA を確認(SC-004)
- [x] T020 [US1] `tests/visual/convertibility.spec.mjs` が 16 種でスロット矩形確定・本文実DOMを確認(SC-007)

**Checkpoint**: US1 単独で「頻出表現を準拠のまま作れる」拡張が成立(計16レイアウト)。

---

## Phase 4: User Story 2 — ベストプラクティス網羅を完成（Priority: P2）

**Goal**: practices.md の全手法が core+extended のいずれかで実演される(未実演0)。
**Independent Test**: `check:coverage` が緑(未実演0)で、巻末リファレンスが使用手法を網羅することを確認。

- [x] T021 [US2] 各拡張レイアウト注釈の `data-practice` が research R2 の割当(未実演手法)を実現していることを確認・調整(未実演手法をすべて実演へ)
- [x] T022 [US2] `index.html` 巻末 citation-list に、拡張で新規使用する手法 ID を追加(FR-013: 使用手法を巻末が網羅)
- [x] T023 [US2] `npm run check:coverage`(未実演0=SC-005)と `npm run check:crossrefs`(相互参照・巻末網羅)を実行し緑を確認
- [x] T024 [US2] `tests/visual/coverage.spec.mjs` を追加(`check-practice-coverage.mjs` の緑を CI で確認)

**Checkpoint**: テンプレートが「全手法を実演する体系的リファレンス」として完成。

---

## Phase 5: Polish & Cross-Cutting

- [x] T025 [P] `README.md` を計16レイアウト(コア8 + 拡張8)に更新し、`check:coverage` を検証節へ追記
- [x] T026 [P] `specs/002-extended-layouts/verification.md` に SC-001〜009 の確認結果を記録(実行/委譲の別を明記)
- [x] T027 `npm run verify`(lint:tokens/check:crossrefs/check:coverage/test:visual/test:a11y/test:print)を通しで実行し全体緑を確認

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → 検証系拡張。T001/T002/T003 は [P]。
- **Phase 2 (Foundational)** → 共通ユーティリティ(T004)。拡張レイアウト前に完了。
- **US1 (P1)**: Foundational 後。T005–T012 は [P](別ファイル)。T013(index追記)→ T014(split)→ T015–T020(検証)。← **MVP**
- **US2 (P2)**: US1 完了後(注釈と巻末が揃ってから)。T021→T022→T023→T024。
- **Polish (Phase 5)** → 全 US 後。

## Parallel Execution Examples

- Setup: `T001`,`T002`,`T003` を並行。
- US1 レイアウト量産: `T005`〜`T012` を並行(8タスク・別ファイル)。
- Polish: `T025`,`T026` を並行。

## Implementation Strategy

- **MVP = US1**(Phase 1→2→3)。この時点で拡張8レイアウトが準拠状態で使え、計16種に。
- 次に **US2** でカタログ全手法の実演を完成(未実演0)。各 US は独立に検証・デモ可能。
- 既存の検証ハーネスは `LAYOUTS` 拡張で自動的に 16 種を網羅するため、追加テストは coverage のみ。

## Task Summary

- 総タスク数: **27**
- 内訳: Setup 3 / Foundational 1 / US1 16 / US2 4 / Polish 3
- 並列機会: レイアウト量産(8)・セットアップ(3)・ドキュメント(2)
- MVP スコープ: **US1**(T001–T020)
- 新規スクリプト: `check-practice-coverage.mjs`(SC-005)。既存 lint/crossref/contrast/Playwright は 16 種へ自動拡張。
