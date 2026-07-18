# Tasks: ツリー構造テンプレート(縦・横)

**Feature**: 010-tree-template | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

**Input**: research.md (D1–D8), data-model.md, contracts/(component-contract, verification), quickstart.md

**Tests note**: 本プロジェクトはビジュアル回帰＋検証ゲート(`npm run verify`)が既存のテスト面。新規のユニットテストは作らず、既存テスト面への配線(LAYOUTS / deck 数 / 新規ベースライン)と各ゲートの緑化をタスク化する。

## Phase 1: Setup

（新規プロジェクト初期化は不要。既存の静的テンプレート構成を踏襲。）

## Phase 2: Foundational (blocking prerequisites — US1/US2 共通)

- [X] T001 [P] `styles/layouts/tree.css` を新規作成: `.tree` コンポーネント基盤 — 意味的入れ子リストのレイアウト、`.node`/`.node__label`/`.node__body` の枠(process/timeline と同じ `var(--surface)`/`border`/`var(--radius-*)`/トークン padding)、役割修飾子 `.tree__node--root`/`--branch`/`--leaf`(root=accent 強調 / leaf=淡色)、擬似要素ボーダーによる親子コネクタ(縦既定, 色 `var(--border)`/強調 `var(--accent)`)、及び横用修飾子 `.tree--horizontal`(コネクタ辺を左右へ)。色・余白はすべて DS 役割変数のみ(コネクタ太さのボーダー px のみ許容)。
- [X] T002 `index.html` の `<head>` に `<link rel="stylesheet" href="styles/layouts/tree.css" />` を追加(`styles/layouts/grid-guide.css` の直後、`styles/components.css` の前)。

**Checkpoint**: `.tree` コンポーネントの CSS が読み込まれる状態(まだ消費スライドなし)。

## Phase 3: User Story 1 — 縦ツリー(トップダウンの主張構造) (Priority: P1) 🎯 MVP

**Goal**: 結論→MECE 根拠→裏付けをトップダウンで示すコア新レイアウト `data-layout="tree"` を追加し、1280×720 内に破綻なく表示する。

**Independent Test**: `slides/17-tree.html` 単体および index 内の縦ツリーが overflow なく表示され、root=1・branch 複数・親子コネクタが視認できる。

- [X] T003 [US1] `index.html` の本編、`process` スライドの直後に縦ツリー `<section class="slide slide--tree" data-layout="tree" data-practice="A-pyramid">` を追加。`.slide__heading` にアクションタイトル、本文に `<ul class="tree">`(root 1 / branch 3(MECE) / 各 branch に leaf 任意1)。文言は data-model.md のピラミッド・プリンシプル サンプルに準拠。
- [X] T004 [US1] `scripts/split-slides.mjs` の `ORDER` に `tree: '17'`、`TITLE` に `tree: 'ツリー(階層)'` を追加。
- [X] T005 [US1] `node scripts/split-slides.mjs` を実行し `slides/17-tree.html` を生成(生成物・手編集禁止)。
- [X] T006 [P] [US1] `tests/visual/_fixtures.mjs` の `LAYOUTS` 配列に `'17-tree'` を追加。
- [X] T007 [US1] `tests/visual/deck.spec.mjs` のスライド数を `toBe(25)` → `toBe(26)` に更新し、コメント(コア+付録の内訳)も更新。
- [X] T008 [US1] 縦ツリーの検証: `npm run lint:tokens`(生値0)、`node scripts/split-slides.mjs --check`(整合)、`npm run test:visual`(新規ベースライン `deck-tree`/`17-tree` を取得し目視確定、overflowX/Y ≤ 1)、`npm run test:a11y`(`17-tree` のコントラスト AA・見出し階層)を緑化。

**Checkpoint**: US1 単独で「縦ツリー1枚」の MVP が成立(デック 26 枚, verify の該当ゲート緑)。

## Phase 4: User Story 2 — 横ツリー(左→右のロジックツリー) (Priority: P2)

**Goal**: 同一 `.tree` コンポーネントを `.tree--horizontal` で向き替え、深い/枝の多い構造の受け皿を付録スライドで示す。

**Independent Test**: 付録の横ツリーが root=左端・枝=右展開で overflow なく表示され、縦と同一の視覚言語であること。

- [X] T009 [US2] `index.html` の付録、`appendix-grid` スライドの直前に横ツリー `<section class="slide slide--appendix slide--appendix-tree" data-layout="appendix-tree-horizontal" data-practice="A-pyramid">` を追加。本文に `<ul class="tree tree--horizontal">`(縦と同じ入れ子構造)。`.slide__heading` にアクションタイトル。
- [X] T010 [US2] `tests/visual/deck.spec.mjs` のスライド数を `toBe(26)` → `toBe(27)` に更新し、コメントを更新(付録に横ツリー追加)。
- [X] T011 [US2] 横ツリーの検証: `npm run test:visual`(新規ベースライン `deck-appendix-tree-horizontal` を取得し目視確定、overflow なし)、`npm run test:print`(1スライド=1ページ)を緑化。

**Checkpoint**: US1＋US2 でデック 27 枚。縦・横が単一コンポーネントの向き替えで実演される。

## Phase 5: User Story 3 — 再利用可能なツリーコンポーネント (Priority: P3)

**Goal**: 枝数(2〜5)や末端の有無を差し替えてもレイアウトが崩れず 1280×720 に収まる。

**Independent Test**: サンプルの枝数/深さを増減しても overflow テストが緑。

- [X] T012 [US3] `styles/layouts/tree.css` を可変ブレッドス/深さに堅牢化(第2階層の均等配置、ノード幅・折返し、`min-height:0` による縦オーバーフロー防止)。枝2〜5・末端有無の各パターンで `npm run test:visual`(overflow)を確認し、必要なら CSS を調整。

**Checkpoint**: コンポーネントが構造差し替えに耐える。

## Phase 6: Polish & Cross-Cutting

- [X] T013 `npm run verify` を実行し全工程緑を確認(lint:tokens / check:crossrefs / check:coverage / check:slides / test:visual / test:a11y / test:print / build:pdf / check:pdf)。`A-pyramid` 再利用のため crossrefs/coverage は不変であることを確認。
- [X] T014 [P] `npm run build:pdf` で `dist/deck.pdf` を再生成し、`npm run check:pdf` で総ページ数==27 を確認。生成 PDF の縦・横ツリー各ページを Read(`pages`)で `contracts/` のルーブリック(見切れ/分割/枠欠け/重なり・DS 配色・アクションタイトル・階層・コントラスト)に照らして目視評価。
- [X] T015 [P] ドキュメント整合を確認: `CLAUDE.md` の SPECKIT ブロック(010 記述)と実装の一致、`specs/010-tree-template/checklists/requirements.md` の残課題なしを確認。乖離があれば是正。

## Dependencies

- **Foundational (T001–T002)**: すべての US の前提。
- **US1 (T003–T008)**: Foundational 後。MVP。
- **US2 (T009–T011)**: Foundational 後。deck 数(T010: 26→27)は US1(T007: 25→26)を前提とするため US1 の後に実施。
- **US3 (T012)**: Foundational 後(検証は US1 の縦ツリーが存在すると容易)。
- **Polish (T013–T015)**: 全 US 完了後。

## Parallel Execution Examples

- Foundational: T001(`tree.css`)は独立ファイルのため単独で着手可。
- US1 内: T004(`split-slides.mjs`)と T006(`_fixtures.mjs`)は別ファイルで並行可 [P](ただし T005 の生成は T003・T004 の後)。
- Polish: T014(PDF 評価)と T015(ドキュメント整合)は別対象で並行可 [P]。

## Implementation Strategy

- **MVP**: Foundational → US1 のみで「縦ツリー(コア)」を先行デリバリ(デック 26)。
- **Increment**: US2 で横(付録)を追加(デック 27)、US3 で再利用堅牢化、Polish で全ゲート緑＋PDF 目視。
- 各 US 完了時に該当検証を緑化し、退行を局所化する。

## Implementation Notes (完了記録)

- 全タスク完了。`npm run verify` 全工程緑(lint:tokens / crossrefs 37=37 / coverage 37/0 / check:slides 17 / test:visual 59 / test:a11y 22 / test:print 2 / build:pdf 27p / check:pdf 27==27)。
- 新規ベースラインは `-darwin` の3枚のみ(`deck-tree` / `deck-appendix-tree-horizontal` / `17-tree`)。既存ベースラインは無改変。Playwright は単一 `chromium` プロジェクトで `-darwin` サフィックスを使用(既存 `-chromium-darwin` は不使用のレガシー)。
- T012(US3 堅牢化): コネクタを「単一スパイン方式」に刷新(初版の trimmed-half バス方式は縦規則が横へ漏れ、線が節点と不整合になる脆さがあった)。スパイン=各 li の連続ボーダー(端は中心までトリム)、スタブ=1本の直線、親→スパイン=1本の直線。縦・横を `:not(.tree--horizontal)` / `.tree--horizontal` で完全分離し規則漏れを排除。
- コネクタ段差の是正(実測で確認): 縦の子コンテナを flex(内容幅)から **等幅グリッド `grid-auto-columns:1fr`** に変更。flex 版は内容幅差で中央スタブが約7px ずれ(root/ul中心=640 に対し②中心=646.8、バス中点=643.4)、バス上で段差が出ていた。グリッド化後は root=ul中心=②中心=バス中点=640 で厳密一致、枝も等間隔(376.4/640/903.6)、各葉も枝中心に一致(段差ゼロ)。
- **鍵線→直線への変更(ユーザー要望)**: L字の擬似要素コネクタを廃し、`js/tree-connectors.js` が各枝分かれ li に SVG を挿入して親→子の**直線**を実 offset から描画。線端が実 node 位置なので内容/枝数が変わってもズレない。`index.html` と split foot(全 `slides/NN-*.html`)に `tree-connectors.js` を追加。SVG は `aria-hidden` で a11y 影響なし(axe list 規則も svg は li 内のため非該当)。縦=6線・横=7線、overflow 0、PDF(印刷, JS 実行後)にも描画されることを p13/p26 で確認。等幅グリッドは維持し直線が等間隔に扇形展開。
- PDF 目視(print media, ツールバー非表示): p13 縦ツリー / p26 横ツリー とも見切れ・分割・重なりなし、DS 配色・アクションタイトル・階層・コントラスト良好。
- デック内順序: コア tree は process(12) の直後=13、横は付録 I(26)、グリッドは付録 J(27)。付録グリッドのコメントを I→J に更新。
