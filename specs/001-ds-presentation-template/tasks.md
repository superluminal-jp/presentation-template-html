# Tasks: デジタル庁DS準拠 16:9 プレゼンテンプレート

**Input**: Design documents from `specs/001-ds-presentation-template/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Tests**: 含む(plan の受け入れ自動化方針: Playwright + axe-core + lint-tokens が各 SC を検証)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可(異なるファイル・未完タスクに非依存)
- **[Story]**: US1/US2/US3(spec のユーザーストーリー)
- パスは repo ルート相対

## Path Conventions（plan の構造に準拠）

`tokens/`, `styles/`(`layouts/` 含む), `js/`, `slides/`, `assets/charts/`, `scripts/`, `tests/`(`visual/`,`a11y/`,`print/`), `docs/`, `index.html`, `package.json`

---

## Phase 1: Setup（共有基盤）

- [x] T001 `package.json` を作成し、`@digital-go-jp/design-tokens@2.0.1` を厳密固定で依存追加、npm スクリプト(`sync-tokens`,`lint:tokens`,`test:visual`,`test:a11y`,`test:print`)を定義（repo ルート `package.json`）
- [x] T002 [P] ソースディレクトリ雛形を作成: `tokens/vendor/`, `styles/layouts/`, `js/`, `slides/`, `assets/charts/`, `scripts/`, `tests/visual/`, `tests/a11y/`, `tests/print/`
- [x] T003 [P] `scripts/sync-tokens.mjs` を実装（固定版 `tokens.css` を `node_modules/@digital-go-jp/design-tokens/dist/` から `tokens/vendor/tokens.css` へ複製）
- [x] T004 `npm install` 実行後に `npm run sync-tokens` で `tokens/vendor/tokens.css`（v2.0.1）を生成
- [x] T005 [P] Playwright + axe-core を dev 依存に追加し、`tests/playwright.config.mjs`（viewport 1280×720、print/pdf 設定）を作成
- [x] T006 [P] `scripts/lint-tokens.mjs` を実装（`tokens/vendor/` 以外での生 hex 色・生 px 余白を検出して失敗させる。SC-02 の門番）

**Checkpoint**: 依存が固定され、vendor トークンが取得され、検証スクリプトが起動可能。

---

## Phase 2: Foundational（全ストーリーのブロッキング前提）

**⚠️ これらは全ユーザーストーリーの前提。完了まで US フェーズに進めない。**

- [x] T007 `styles/tokens.semantic.css`（写像層）を作成: 役割色(`--slide-bg`,`--surface`,`--text-primary`,`--text-secondary`,`--border`,`--accent`,`--on-accent`,`--state-*`)+ スペーシング `--space-1..12`(4/8px)+ ブランドオーバーレイ枠。すべて `var(--color-*)`(vendor)参照（contracts/css-custom-properties.md 準拠）
- [x] T008 [P] `styles/base.css` を作成: リセット、タイポ役割(`--fs-*`,`--fw-*`)、`@media print` 基本規則（1スライド=1ページ）
- [x] T009 [P] `styles/grid.css` を作成: 1280×720 固定キャンバス + 12カラムグリッド + 安全余白（上下 `--space-6`/左右 `--space-8`）
- [x] T010 `styles/slides.css` を作成: スライドシェル、道標(`.slide__signpost`)、注釈レイヤー土台（`[data-annotations="off"]` で `[data-annotation]` を非表示）
- [x] T011 [P] コントラスト事前検査 `tests/a11y/contrast-tokens.spec.mjs`（役割色の組合せが AA を満たすことを assert。research R6 / SC-04）
- [x] T012 共有テストフィクスチャ `tests/visual/_fixtures.mjs`（スライドを読み込み 1280×720 で overflow 有無を判定するヘルパ）

**Checkpoint**: トークン写像・グリッド・シェル・検証土台が完成。以降のレイアウトが役割変数のみで組める。

---

## Phase 3: User Story 1 — 準拠デックを素早く組み立てる（Priority: P1）🎯 MVP

**Goal**: コア8レイアウト + ショーケースで、DS 準拠の 16:9 デックを崩れなく作成・印刷できる。
**Independent Test**: 8レイアウトに内容を入れ、1280×720 で崩れず表示・PDF 出力でき、配色/タイポがトークン由来であることを確認。

- [x] T013 [P] [US1] `slides/01-title.html` + `styles/layouts/title.css`（表紙: title/subtitle/meta、key 色面、視覚階層）
- [x] T014 [P] [US1] `slides/02-toc.html` + `styles/layouts/toc.css`（目次: agenda li ≤7、現在地マーカー。Miller/サインポスティング）
- [x] T015 [P] [US1] `slides/03-section.html` + `styles/layouts/section.css`（章扉: section-no/section-title）
- [x] T016 [P] [US1] `slides/04-body.html` + `styles/layouts/body.css`（本文: bullet ≤7、visual スロット、Assertion–Evidence 見出し）
- [x] T017 [P] [US1] `slides/05-compare.html` + `styles/layouts/compare.css`（2カラム比較: col-left/col-right/verdict）
- [x] T018 [P] [US1] `slides/06-chart.html` + `styles/layouts/chart.css`（図表: `.chart--sample`/`.chart--placeholder`、takeaway、脚注出典）
- [x] T019 [P] [US1] `assets/charts/` にトークン整形済み静的サンプル図（棒・折れ線・構成比の3種）を作成（SVG/CSS、役割変数のみ。FR-015）
- [x] T020 [P] [US1] `slides/07-summary.html` + `styles/layouts/summary.css`（まとめ: key-messages×3、CTA。SUCCESs/ピーク・エンド）
- [x] T021 [P] [US1] `slides/08-reference.html` + `styles/layouts/reference.css`（参考: citation-list 枠。中身は US2 で ID 参照）
- [x] T022 [US1] `index.html` を作成: 8レイアウトを物語順(導入→本体→収束→参考)で束ね、道標/現在地を配置
- [x] T023 [US1] 内容保持レイアウトの見出しをアクションタイトル形式に統一（SC-06）
- [x] T024 [US1] `tests/visual/layouts.spec.mjs`: 8/8 が 1280×720 で overflow なし（SC-01）
- [x] T025 [US1] `tests/print/print.spec.mjs`: `index.html` が 8スライド=8ページで PDF 出力（SC-01）
- [x] T026 [US1] `npm run lint:tokens` を実行し `styles/` のハードコード 0 件を確認（SC-02）
- [x] T027 [US1] `--accent` が `--color-key-800`(#0031d8) であることを検査（`tests/visual/accent.spec.mjs`。SC-08）
- [x] T028 [US1] `tests/a11y/layouts-a11y.spec.mjs`: レンダリング後のコントラストが AA（axe-core。SC-04）

**Checkpoint**: US1 単独で MVP として提供可能（準拠デック作成・印刷・トークン純度・AA）。

---

## Phase 4: User Story 2 — ベストプラクティスを引用付きで適用（Priority: P2）

**Goal**: 各スライドに既定非表示・トグル可能な注釈を備え、採用手法を出典付きで相互参照できる。
**Independent Test**: 注釈をトグル表示し、手法と出典 ID が示され、practices.md と巻末が相互参照できることを確認。

- [x] T029 [P] [US2] `js/annotations.js` を実装: `window.PresTemplate.toggleAnnotations(force?)`、キー `a`、`documentElement[data-annotations]`、初期 `off`（annotation-contract.md 準拠）
- [x] T030 [US2] `styles/slides.css` に注釈の表示制御 CSS を追加（`[data-annotations="off"]` 非表示。個別トグルボタンは後続の共通フレームと重なるため撤去）
- [x] T031 [P] [US2] `docs/practices.md` を作成: 群 A〜E、各手法に `id` と書誌（requirements §3 を正本化。FR-008/SC-05）
- [x] T032 [US2] 全8スライドに `[data-annotation][hidden]` ブロックを挿入（intent + `data-practice` ID 群。annotation-contract.md）
- [x] T033 [US2] `slides/08-reference.html` の citation-list を practices.md の ID 参照で埋める（重複禁止・相互参照）
- [x] T034 [US2] `tests/visual/annotations.spec.mjs`: 8/8 で初期非表示→トグル表示を検証（SC-03）
- [x] T035 [US2] `scripts/check-crossrefs.mjs` + `tests/visual/crossref.spec.mjs`: 全 `data-practice` が practices.md に存在（リンク切れ 0。SC-05）**かつ** `slides/08-reference.html` の citation-list が practices.md の全 Citation を網羅（欠落 0。FR-013）

**Checkpoint**: US1 に注釈・出典体系が加わり、教材兼実務ツールとして成立。

---

## Phase 5: User Story 3 — DS更新の低コスト追従（Priority: P2）

**Goal**: DS 更新をレイアウト無改修（写像層のみ）で取り込め、更新前後で体裁が保たれる。
**Independent Test**: トークン改名を写像層で吸収し、レイアウト定義を変更せず視覚回帰が許容範囲であることを確認。

- [x] T036 [P] [US3] `docs/ds-version-map.md` を作成: Figma↔npm バージョン対応表 + 更新ランブック（quickstart の手順を正式化。SC-07）
- [ ] T037 [US3] 8レイアウトの視覚回帰ベースラインを取得（`tests/visual/__baselines__/`）
- [x] T038 [US3] エイリアス吸収テスト `tests/visual/ds-update.spec.mjs`: 写像層でトークン改名を模擬し、レイアウト定義無変更でベースライン差分が閾値（≤0.1%/レイアウト, `maxDiffPixelRatio: 0.001`）内であることを検証（SC-07）
- [x] T039 [US3] 更新フロー検証: `sync-tokens` 差分が `tokens/vendor/` のみ、変更は `styles/tokens.semantic.css` のエイリアスに限定されることを確認・文書化

**Checkpoint**: DS 更新の持続的追従が機械検証付きで確立。

---

## Phase 6: Polish & Cross-Cutting

- [x] T040 [P] `README.md`（ルート）を作成し quickstart/plan/spec へリンク
- [x] T041 [P] アクセシビリティ仕上げ: `lang="ja"`、注釈トグルの aria/フォーカス順、`aria-label`（annotation-contract C-A-3）
- [x] T042 [P] `docs/font-embedding.md`: Noto Sans JP 同梱手順（任意・Clarify Q2 のオプション）
- [x] T043 `index.html` 全体の視覚回帰 + PDF エクスポートのスモークテスト
- [x] T044 quickstart の検証マトリクスで SC-001〜010 を通しで確認し結果を記録。SC-009/SC-010 は成果指標のため測定手順を明記(被験者 n≥3、SC-009=10枚デック組立の実測時間、SC-010=注釈のみで手法識別した正答率)
- [x] T045 [P] `npm run verify`（4検証: lint:tokens/test:visual/test:a11y/test:print を統合）を配線
- [x] T046 [P] PPT変換可能性の検査 `tests/visual/convertibility.spec.mjs`: 全レイアウトで命名スロットの矩形(x,y,w,h)が確定でき、本文が実DOMテキスト(擬似要素での本文表示なし)であることを検証（layout-contracts C-L-3 / FR-012）

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → すべての前提。T001→T004 は順序依存(install→sync)、T002/T003/T005/T006 は [P]。
- **Phase 2 (Foundational)** → US 前に完了必須。T007 が色/余白の源泉で最重要、T008/T009/T011 は [P]、T010 は T007 後、T012 は T009 後。
- **User Stories**:
  - **US1 (P1)**: Foundational 後に着手。T013–T021 は [P]（別ファイル)。T022 は全レイアウト後。T023–T028 は検証で T022 後。← **MVP**
  - **US2 (P2)**: US1 のレイアウト実体に依存（T032 が各スライドへ注釈挿入）。T029/T031 は [P]。
  - **US3 (P2)**: Foundational の vendor/写像分離 + US1 レイアウトに依存（ベースライン取得）。T036 は [P]。
  - US2 と US3 は相互に独立（並行着手可、ただし双方 US1 完了後が現実的）。
- **Polish (Phase 6)** → 全 US 後。

## Parallel Execution Examples

- Setup: `T002`,`T003`,`T005`,`T006` を並行。
- Foundational: `T008`,`T009`,`T011` を並行（T007 完了後）。
- US1 レイアウト量産: `T013`〜`T021` を並行（9タスク、別ファイル)。
- ドキュメント: `T031`(US2),`T036`(US3),`T040`,`T042` を並行。

## Implementation Strategy

- **MVP = US1 のみ**（Phase 1→2→3）。この時点で「DS 準拠 16:9 デックを作成・印刷でき、トークン純度と AA を満たす」実用テンプレートが完成。
- 次に **US2**（注釈・出典体系)で差別化価値、**US3**（更新追従)で持続性を積む。各 US は独立に検証・デモ可能。
- 各 US 完了時に対応 SC を実行してグリーンを確認してから次へ。

## Task Summary

- 総タスク数: **46**
- 内訳: Setup 6 / Foundational 6 / US1 16 / US2 7 / US3 4 / Polish 7
- 並列機会: レイアウト量産(9)・基盤(3)・セットアップ(4)・ドキュメント(4)
- MVP スコープ: **US1**（T001–T028）
- FR-012(PPT変換可能性)は Polish の T046 で検証。FR-013(巻末に全出典)は T035 で網羅検査。
