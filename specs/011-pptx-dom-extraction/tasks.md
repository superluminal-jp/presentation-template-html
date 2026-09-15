# Tasks: 編集可能 PPTX への DOM 実測変換(正本一元化)

**Feature**: 011-pptx-dom-extraction | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

**Input**: research.md (D1–D8), data-model.md, contracts/(pptx-role-contract, build-pptx-cli), quickstart.md

**Tests note**: 本プロジェクトはビジュアル回帰＋検証ゲート(`npm run verify`)が既存のテスト面。
新規のユニットテストは作らず、既存テスト面への配線(`convertibility.spec` / `chart-encoding.spec` の拡張、
`check:pptx` の新設と `verify` 結線)と各ゲートの緑化をタスク化する。

**凡例**: `[P]` = 並行実行可(他タスクとファイル競合なし) / `[USn]` = 対応ユーザーストーリー

## Phase 1: Setup

(新規プロジェクト初期化は不要。既存の静的テンプレート構成を踏襲。)

- [ ] T001 現状のベースラインを記録: `npm run verify` を実行して全緑を確認し、`dist/sample-deck.pptx` の現行スライド数を控える(変更前後の比較基準)。

## Phase 2: Foundational (blocking prerequisites — 全 US 共通)

**これ無しにはどのユーザーストーリーも抽出できない。**

- [ ] T002 `specs/011-pptx-dom-extraction/contracts/pptx-role-contract.md` の語彙を確定版として凍結し、`data-pptx` を CSS セレクタの対象にしない規約を `styles/` 側でも担保(属性セレクタの不使用を確認)。
- [ ] T003 [D3] `styles/layouts/quote.css` の `.quote::before { content: "“" }` を削除し、`index.html` の該当箇所へ `<span aria-hidden="true" data-pptx="ignore">“</span>` を追加。装飾引用符の見た目(色 `--accent`、サイズ `--font-size-64`、字下げ)を span 側のクラスへ移す。**視覚回帰の差分が 0 であること**を `npm run test:visual` で確認。
- [ ] T004 `index.html` の全 28 スライドへ `data-pptx` 役割属性を付与(語彙: text/shape/line/table/chart/image/group/ignore)。`.slide__annotation`・`.grid-guide`・装飾要素には `ignore`。複合コンポーネント(`.callout`/`.stat`/`.tile`/`.step-nav__item`/`.node`/`.kv`/`.progress`/`.banner`/`.checklist` 等)の根には `group`。
- [ ] T005 [P] `scripts/split-slides.mjs` で `slides/*.html` を再生成し、`node scripts/split-slides.mjs --check` が整合することを確認(生成物・手編集禁止)。
- [ ] T006 [P] `tests/visual/convertibility.spec.mjs` を拡張: 固定 13 セレクタの検証に加え、**全 `.slide` について `data-pptx` を持つ要素が 1 つ以上あること**、**語彙外の値が使われていないこと**、**`data-pptx="text"` の要素が実 DOM テキストを持つこと**を検証。
- [ ] T007 `npm run test:visual` を実行し、役割属性の追加によるスナップショット差分が **0 件**であることを確認(FR-004 / SC-006)。差分が出た場合は属性が描画に影響しているため T004 を修正する。

**Checkpoint**: 正本が抽出可能な契約を満たす。まだ変換器は無い。

## Phase 3: User Story 1 — 正本デック全枚数が自動で PPTX になる (Priority: P1) 🎯 MVP

**Goal**: `index.html` の実測値から全 28 枚を text/shape/line として自動変換し、文言・座標の手写経を全廃する。

**Independent Test**: `index.html` の見出し文言を変更して `npm run build:pptx` を実行し、`scripts/pptx/` を一切編集せずに出力へ反映されること。

- [ ] T008 [US1] `scripts/pptx/extract.mjs` を新規作成: Playwright(chromium)で `index.html` を開き、`page.goto(..., { waitUntil: 'networkidle' })` + `document.fonts.ready` + tree コネクタ描画完了を待機(D8)。`page.evaluate` 内で全 `.slide` を走査し、`data-pptx` 語彙と `getBoundingClientRect()` / `getComputedStyle()` からスライド IR(data-model.md §2)を構築して返す。`dist/deck-ir.json` へ書き出す。
- [ ] T009 [US1] `extract.mjs` に混在ラン抽出を実装: `data-pptx="text"` 要素の子 `<span>` 等を走査し、`Run = { text, color, bold }` の配列を作る(`.u-accent` の部分着色を保つ — FR-013)。
- [ ] T010 [US1] `scripts/pptx/emit.mjs` を新規作成: スライド IR を受け取り、`text` → `addText`(混在ラン対応)、`shape` → `addShape`(rect / roundRect)、`line` → `addShape(line)` として pptxgenjs へ書き出す。px→in は ÷96、px→pt は ×0.75。スライド背景は IR の `background.fill`。
- [ ] T011 [US1] [D5] `scripts/pptx/theme.mjs` を新規作成: `tokens.mjs` の `THEME`(`theme1.xml` 配色差し替え)の責務のみを継承し、値は抽出時に解決した CSS 変数から取得。`applyDsTheme()` を移設。
- [ ] T012 [US1] `scripts/pptx/build-pptx.mjs` を改訂: 手書きビルダー(`slideTitle`〜`slideApxDads` の 20 関数、共通チャーム、座標定数)を削除し、`extract.mjs` → `emit.mjs` → `applyDsTheme()` を繋ぐオーケストレータへ縮小。出力先 `dist/sample-deck.pptx` は不変。
- [ ] T013 [US1] 共通チャーム(機密区分・著作権・ページ番号)を正本 HTML 側の要素として表現し直し、役割属性 `text` で抽出されるようにする(FR-014)。HTML に既存の該当要素があればそれを使い、無ければ `index.html` へ追加して T007 と同じく視覚回帰差分 0 を確認。
- [ ] T014 [US1] [D5] `scripts/pptx/tokens.mjs` を削除し、参照元が残っていないことを確認(`grep -rn "tokens.mjs" scripts/`)。
- [ ] T015 [US1] US1 の検証: `npm run build:pptx` が成功し、(a) 出力スライド数がライブ `.slide` 数(28)と一致、(b) `grep -cE "'[^']*[ぁ-んァ-ヶ一-龠][^']*'" scripts/pptx/*.mjs` でスライド固有コピーのリテラルが **0 件**(SC-002)、(c) PowerPoint で本文がテキストボックスとして編集できること、を確認。

**Checkpoint**: US1 単独で MVP 成立 — 「HTML を直せば PPTX が直る」。未変換 8 枚が 0 枚、リテラル 214 件が 0 件。

## Phase 4: User Story 2 — ネイティブ編集可能オブジェクト (Priority: P2)

**Goal**: 表・グラフ・グループを PowerPoint 上でそのまま編集できるネイティブ・オブジェクトとして出力する。

**Independent Test**: 出力 PPTX で表のセル編集・グラフのデータ編集・コンポーネントの一括移動ができること。

- [ ] T016 [US2] `extract.mjs` に表抽出を実装: `data-pptx="table"` の `<table>` から `rows: Cell[][]`(`{ text, header, fill, align }`)を構築。`emit.mjs` で `addTable` へ写す(FR-011)。`index.html` の全 `.data-table` に役割属性を付与。
- [ ] T017 [P] [US2] [D4] `index.html` の多系列 SVG(5 箇所)へ `data-chart` JSON payload を付与(type / categories / series)。値は既存 SVG の幾何が表す内容に一致させる。`data-pptx="chart"` を併せて付与。
- [ ] T018 [US2] `tests/visual/chart-encoding.spec.mjs` を拡張: 既存の `data-series` == `series-label` 数の検証に加え、**`data-chart` の `series.length` == `data-series`**、**`series[].name` の集合 == `text.series-label` の文言の集合**、**`series[].values.length` == `categories.length`(scatter 除く)**を検証(FR-005 の整合制約)。
- [ ] T019 [US2] `emit.mjs` にグラフ出力を実装: `ChartData` を pptxgenjs の `addChart` へ写す。グラフ種の対応(bar/line/bar100/doughnut/scatter)、系列色は `--cat-1..7` を系列順に割り当て。
- [ ] T020 [US2] `emit.mjs` にグループ出力を実装: IR の `GroupNode` を PPTX グループとして書き出し、子孫の shape/text がまとまって選択・移動できるようにする(FR-012)。入れ子グループに対応。
- [ ] T021 [US2] US2 の検証: 出力 PPTX を PowerPoint で開き、(a) `.data-table` がネイティブ表でセル編集可、(b) 多系列グラフがネイティブグラフでデータ編集可、(c) `.callout` 等が 1 グループとして移動可、(d) 新規挿入図形の既定色が DS 青、(e) 本文領域にラスタ画像 0 件、を確認(SC-004)。

**Checkpoint**: 「編集可能」の実質が揃う。US1 + US2 で利用者側の価値は完成。

## Phase 5: User Story 3 — 乖離を止める検証ゲート (Priority: P3)

**Goal**: 正本と PPTX の乖離を人手のレビューではなく自動検証で防ぐ。

**Independent Test**: 正本にスライドを追加して PPTX を再生成しないまま `npm run verify` が失敗すること。

- [ ] T022 [US3] `scripts/pptx/check-pptx.mjs` を新規作成: `jszip` で `dist/sample-deck.pptx` を開き `ppt/slides/slide*.xml` を読み、contracts/build-pptx-cli.md の C1–C4 を検証。失敗時は期待値・実測値・該当スライド番号を出力し非 0 で終了。
- [ ] T023 [US3] `package.json` に `"check:pptx": "node scripts/pptx/check-pptx.mjs"` を追加し、`verify` チェーンの末尾へ `&& npm run build:pptx && npm run check:pptx` を結線(contracts/build-pptx-cli.md の結線図どおり)。
- [ ] T024 [US3] **反証テスト**(SC-007): `index.html` に一時的にスライドを 1 枚追加(または見出し文言を変更)し PPTX を再生成しない状態で `npm run verify` を実行して**失敗すること**を確認。確認後に一時変更を戻す。ゲートが実際に機能することの証拠。
- [ ] T025 [US3] `.gitignore` を確認: `!dist/sample-deck.pptx` の追跡例外が維持され、`dist/deck-ir.json` は追跡外であることを確認(必要なら明示)。

**Checkpoint**: 乖離が構造的に再発しない。`CLAUDE.md` の「PPTX outside verify」の穴が閉じる。

## Phase 6: Polish & Cross-Cutting

- [ ] T026 [P] [FR-019] `scripts/pptx/README.md` を全面改訂: 新方式(DOM 実測抽出)、`data-pptx` 語彙、ファイル構成(extract/emit/theme/check)、既知の制約(幾何は近似・フォント埋め込み非対応・`.potx` 未対応)、Deferred 項目。旧記述(「位置は手指定」「20 スライド」「12 コンポーネント」)を削除。
- [ ] T027 [P] [FR-019] `CLAUDE.md` を更新: 「PPTX outside `verify` — not updated」の記述を解消し、011 を Active feature として記載。
- [ ] T028 [P] [FR-019] `docs/requirements.md` のフェーズ2 記述を実装に整合させる(「python-pptx を第一候補」→ 採用した DOM 実測抽出 + pptxgenjs 方式。L38 / L130–136 / L159)。
- [ ] T029 [P] [FR-019] `README.md` に PPTX 変換フローの節を追加(または既存節を更新): `build:pptx` / `check:pptx` の使い方と、新規コンポーネント作成時の役割属性チェックリストへの参照。
- [ ] T030 `npm run verify` を実行し全工程緑を確認(lint:tokens / check:crossrefs / check:coverage / check:slides / test:visual / test:a11y / test:print / build:pdf / check:pdf / **build:pptx / check:pptx**)(SC-005 / FR-017)。
- [ ] T031 生成 PPTX の目視評価: 全 28 枚を開き、見切れ・重なり・文字の折返し破綻・配色の DS 逸脱を確認。近似幾何に起因する許容範囲外の破綻があれば `emit.mjs` 側で調整(HTML の描画は変えない)。
- [ ] T032 成果の計測と記録: SC-001〜SC-007 の実測値を記録(スライド数、リテラル数、視覚回帰差分、verify 結果)。spec.md の「現状の計測値」表と対比できる形で残す。

## Dependencies

```text
T001 ──► T002 ──► T003 ──► T004 ──► T005/T006 ──► T007      (Phase 2: 契約と正本整備)
                                                    │
                                                    ▼
                        T008 ──► T009 ──► T010 ──► T011 ──► T012 ──► T013 ──► T014 ──► T015   (US1: MVP)
                                                    │
                        ┌───────────────────────────┴───────────────────────────┐
                        ▼                                                       ▼
        T016 / T017[P] ──► T018 ──► T019 ──► T020 ──► T021  (US2)      T022 ──► T023 ──► T024 ──► T025  (US3)
                        └───────────────────────────┬───────────────────────────┘
                                                    ▼
                        T026[P] / T027[P] / T028[P] / T029[P] ──► T030 ──► T031 ──► T032   (Polish)
```

- **US3 は US1 に依存し US2 には依存しない**(C1/C2 は text 変換だけで検証できる)。C3(chart 整合)は T017 の後に有効になる。
- T017 と T016 は別ファイル領域のため並行可。T026–T029 はいずれも独立したドキュメントのため並行可。

## Implementation Strategy

**MVP = Phase 2 + Phase 3(US1)**。ここまでで未変換 8 枚と重複リテラル 214 件が解消し、
「HTML を直せば PPTX が直る」という本機能の中核価値が独立して成立する。

US2(ネイティブ化)と US3(ゲート)は US1 の IR 基盤の上に段階的に積める。
US2 を先に入れると利用者価値が早く出て、US3 を先に入れると成果の腐敗を早く止められる。
本計画では**価値 → 保全**の順(US2 → US3)を既定とするが、リリース間隔が空く場合は US3 を先に入れてよい。
