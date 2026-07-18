# Phase 0 Research: ツリー構造テンプレート(縦・横)

CSS-only の静的 HTML デックに、ピラミッド・プリンシプルを内容モデルとするツリー図を、縦(コア新レイアウト)・横(付録)の両向きで追加する際の技術判断。既存不変条件(DS トークンのみ / `@media print` 単一ソース / PDF ページ数==`.slide` 数 / `npm run verify` 緑 / `slides/*.html` は生成物)を前提とする。

## D1: ツリーの描画技法

- **Decision**(最終): 節点は意味的な入れ子リスト(`<ul>/<li>`)の HTML、コネクタは**直線(鍵線ではない)**を SVG で描く。`js/tree-connectors.js` が各枝分かれ `<li>` に `<svg>` を挿入し、親 node→子 node の `<line>` を実 offset から算出。ノードは process/timeline の枠付きステップの視覚言語を踏襲。子は等幅グリッド(`grid-auto-columns:1fr`)で等間隔。
- **経緯**: 初版は擬似要素ボーダーの鍵線コネクタ(純 CSS)だったが、(1) 縦/横で規則が漏れ線が節点とズレ、(2) flex の内容幅差で中央スタブに約7px の段差が出た。グリッド化で段差は解消したが、ユーザー要望「鍵線ではなく直線で繋ぐ」に応えるには CSS ボーダーでは不可能(直線=斜め線は借りられない)なため、SVG 直線へ移行。
- **Rationale**:
  - 直線は SVG でしか堅牢に描けない。線端を実 node 位置から取るため内容/枝数が変わってもズレない(壊れにくい)。
  - 節点は HTML のまま(テキスト折返し・a11y・コントラストを保持)。SVG は `aria-hidden` の装飾。
  - `viewBox`=li offset・`width/height:100%` で present の transform 拡大にも整合。JS はデック既定の最小バニラ JS 方針に合致。
  - 線色は役割変数(`stroke:var(--border-strong)`)、`stroke-width` は spacing 対象外で token-lint 通過。
- **Alternatives considered**:
  - 擬似要素ボーダーの鍵線(純 CSS): 直線要望に反し、規則漏れ・段差の脆さ。棄却。
  - マークアップ内インライン SVG(分数座標): 多階層では座標が構造依存で壊れやすい。棄却(JS で実測する方が堅牢)。

## D2: 縦・横の両向きの実現

- **Decision**: 単一の再利用コンポーネント `.tree` を既定=縦(トップダウン)とし、修飾子 `.tree--horizontal` で横(左→右)に向き替える。縦・横はノード/コネクタ/状態表現の視覚言語を共有し、レイアウト軸(主軸=縦↔横、コネクタのボーダー辺=上下↔左右)のみを差し替える。
- **Rationale**: FR-003(単一コンポーネントの向き替え)を満たす。timeline がコア＋付録2段で1コンポーネントを再利用する構図と一致。
- **Alternatives considered**: 縦・横で別コンポーネント2本 → 重複・ドリフトのもと。棄却。

## D3: コア新レイアウト(縦)の統合点

- **Decision**: 縦ツリーをコアレイアウト `data-layout="tree"` として追加する。統合点は以下:
  - `scripts/split-slides.mjs` の `ORDER` に `tree:'17'`、`TITLE` に `tree:'ツリー(階層)'` を追加 → 単体ファイルは `slides/17-tree.html`。
  - `tests/visual/_fixtures.mjs` の `LAYOUTS` に `'17-tree'` を追加(ds-update / layouts-overflow / a11y-layouts が自動で対象化)。
  - `index.html` の `<head>` に `styles/layouts/tree.css` のリンクを追加。
  - `index.html` のデック本編に縦ツリーの `<section>` を **`process` の直後**に配置(構造図の並び matrix→process→tree の後段)。単体ファイル番号(17)は ORDER マップ固定でデック内位置とは独立(既存 01–16 の再採番は多量のリネーム/ベースライン差替えを招くため行わない)。
- **Rationale**: 既存の「コアレイアウト追加」パターンに沿う最小変更。ORDER 番号とデック位置の不一致は単体ファイル(著者参照用)の見た目上のみで、正本(index.html)の順序は保たれる。
- **Alternatives considered**: 01–16 を再採番して tree を中途番号に挿入 → 全単体ファイル・全ベースラインのリネームが発生。費用対効果で棄却。

## D4: 付録(横)の統合点

- **Decision**: 横ツリーを付録スライド `data-layout="appendix-tree-horizontal"` として追加(付録は split 対象外=単体ファイル/`LAYOUTS` 追加なし)。スタイルは `styles/layouts/tree.css` に同居(`.tree--horizontal` ＋配置クラス `.slide--appendix-tree`)。デック内位置は **`appendix-grid`(グリッド下地)の直前**(009 が timeline-2row を grid-guide 前に置いたのと同じ末尾寄せ)。
- **Rationale**: 付録=コンポーネント実演の器という既存方針に一致。グリッド下地はデック最終の「付録の付録」として維持。
- **Alternatives considered**: 横も split 対象のコアにする → ユーザー選択(縦=コア/横=付録)に反する。棄却。

## D5: 内容モデル(ピラミッド・プリンシプル)

- **Decision**: ノードの役割を root=結論(支配的メッセージ)/ branch=MECE な根拠(キーライン)/ leaf=個別の裏付け・データ にマップ。両スライドとも `data-practice="A-pyramid"` を付す。
- **Rationale**: `A-pyramid`(Pyramid Principle / MECE)は `docs/practices.md` に既存・既に実演/巻末掲載済み。再利用のため **crossrefs / coverage のカタログ・参照に一切変更が不要**(新規手法追加なし)。
- **Alternatives considered**: 新規 practice(例: ロジックツリー)を追加 → practices.md＋巻末＋実演の同時更新が必要で、本機能の目的(テンプレ追加)に対し過剰。棄却。既存 `A-pyramid` で十分。

## D6: コネクタの配色・太さ

- **Decision**: コネクタ既定色 `var(--border)`、root からの分岐や強調は `var(--accent)`。線幅はボーダー px(例 `2px`)で、色は役割変数のみ。ノード状態(root/branch/leaf)は背景・境界・文字色の役割変数で差別化(root=accent 強調、leaf=淡色)。
- **Rationale**: token-lint(色の生値ゼロ / 余白系 px ゼロ)を通過。視覚階層(B-visual-hierarchy)を役割色で表現。

## D7: 検証サーフェス(影響範囲)

- **Decision**: 以下を更新/新規化する。それ以外の検証は不変。
  - `tests/visual/deck.spec.mjs`: スライド数 `toBe(25)` → `toBe(27)`(コメントも更新)。
  - 新規ベースライン(初回実行で生成): `deck-tree.png`(＋ chromium)/`deck-appendix-tree-horizontal.png`(＋ chromium)/`17-tree.png`(＋ chromium, ds-update)。既存ベースラインは data-layout キーのため不変(挿入で無効化されない)。
  - `check:slides`(split --check): `slides/17-tree.html` を生成すれば PASS。
  - `check:crossrefs` / `check:coverage`: `A-pyramid` 再利用のため **変更不要**。
  - `test:print` / `build:pdf` / `check:pdf`: `@media print` 単一ソースを流用。PDF ページ数はライブ `.slide` 数(27)に動的一致。
  - `test:a11y`(layouts / landmark / focus): `17-tree` が LAYOUTS 経由で対象化。コントラスト AA・見出し階層を満たす作りにする。
- **Rationale**: 影響を最小の既知点に限定。`npm run verify` の全工程を緑に保つ。

## D8: オーバーフロー安全(1280×720)

- **Decision**: ツリーは `grid-row:2` の本文帯に置き縦中央寄せ。ノードは内容高で伸長。既定サンプルは深さ3・分岐≤3(縦コア)に抑える。横(付録)は左→右で深い構造を許容しつつ、右端でのはみ出しを避けるノード幅/折返し方針を採る。`min-height:0` で grid 子の縦オーバーフローを防止(chart で実証済みの手当)。
- **Rationale**: `layouts.spec`(overflowX/Y ≤ 1)と `deck` 視覚回帰を満たす。

## Open questions

なし(spec の 2つの scope 判断はユーザー確認済み)。
