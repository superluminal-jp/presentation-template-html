# Implementation Plan: ツリー構造テンプレート(縦・横)

**Branch**: `010-tree-template` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-tree-template/spec.md`

## Summary

ピラミッド・プリンシプル(結論→MECE 根拠→裏付け)を内容モデルとするツリー図を、単一の再利用コンポーネント `.tree` として実装し、縦(トップダウン)をコア新レイアウト `data-layout="tree"`、横(左→右)を付録 `data-layout="appendix-tree-horizontal"` で実演する。技法は意味的入れ子リスト＋擬似要素ボーダーのコネクタによる純 CSS(DS 役割変数のみ)。既存不変条件(トークン限定 / `@media print` 単一ソース / PDF ページ数==`.slide` 数 / `verify` 緑 / `slides/*.html` は生成物)を保つ。デックは 25→27 スライド。

## Technical Context

**Language/Version**: 静的 HTML5 + CSS3 + 最小限のバニラ JS(既存)

**Primary Dependencies**: DS トークン `@digital-go-jp/design-tokens@2.0.1`(vendored・不変); 検証は Playwright + axe-core + 自作 lint。**新規ランタイム依存なし**。

**Storage**: N/A(静的サイト)

**Testing**: Playwright(視覚回帰 / overflow / a11y / print)、token-lint、split `--check`、check:crossrefs/coverage、build:pdf + check:pdf

**Target Platform**: モダンブラウザ 1280×720 固定キャンバス(12カラム×3行グリッド)

**Project Type**: 静的プレゼンテーションテンプレート(単一プロジェクト)

**Performance Goals**: N/A(静的描画)。制約は視覚のみ。

**Constraints**: 全ノード/コネクタが 1280×720 内(overflowX/Y ≤ 1)。色・余白は役割変数のみ(生 hex/rgb/hsl 禁止・余白系生 px 禁止)。印刷は既存 `@media print` 単一ソース。

**Scale/Scope**: 追加 CSS 1本(`styles/layouts/tree.css`)、`index.html` に 2 スライド、生成/テスト配線 4 ファイルの小変更。デック 25→27。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` はテンプレート(未批准・プレースホルダのみ)で、批准済み原則によるゲートは存在しない。代替として、プロジェクトの事実上の不変条件(CLAUDE.md 由来)をゲートとして扱う:

- DS トークン限定 / ハードコード禁止 → **設計は役割変数のみ**で満たす(D6)。
- `@media print` 単一ソース → **新規ページ CSS を追加しない**(D8/契約)。
- PDF ページ数 == ライブ `.slide` 数 → **動的一致を維持**(check:pdf)。
- `slides/*.html` は生成物(手編集禁止) → **split-slides で生成**(D3)。
- `npm run verify` 緑 → **影響点を既知の最小差分に限定**(D7/verification 契約)。

初期評価: **PASS**(違反なし)。Phase 1 後の再評価: **PASS**(Complexity Tracking 記載事項なし)。

## Project Structure

### Documentation (this feature)

```text
specs/010-tree-template/
├── plan.md              # This file
├── spec.md              # Feature spec
├── research.md          # Phase 0: D1–D8 の技術判断
├── data-model.md        # Phase 1: Tree/Node/Connector とサンプルコピー
├── quickstart.md        # Phase 1: 実装/検証手順
├── contracts/
│   ├── component-contract.md   # DOM/CSS API(.tree)
│   └── verification.md         # 検証差分と新規ベースライン
└── checklists/
    └── requirements.md         # 仕様品質チェック(specify で作成済み)
```

### Source Code (repository root)

```text
styles/layouts/tree.css        # 新規: .tree(縦既定)/.tree--horizontal(横)/ノード役割/擬似要素コネクタ
index.html                     # <head> に tree.css リンク; process 直後に縦ツリー; appendix-grid 直前に横ツリー
scripts/split-slides.mjs       # ORDER.tree='17' / TITLE.tree 追加
slides/17-tree.html            # 生成物(split-slides の出力)
tests/visual/_fixtures.mjs     # LAYOUTS に '17-tree' 追加
tests/visual/deck.spec.mjs     # スライド数 25 → 27
tests/visual/deck.spec.mjs-snapshots/          # 新規: deck-tree / deck-appendix-tree-horizontal
tests/visual/ds-update.spec.mjs-snapshots/     # 新規: 17-tree
```

**Structure Decision**: 既存の「コアレイアウト追加」動線(CSS 1本 ＋ index.html マークアップ ＋ split ORDER/TITLE ＋ LAYOUTS ＋ deck 数)を踏襲。横は付録スライド(split 対象外)として同一 CSS を修飾子で再利用。PPTX は `verify` 外のため本機能では非対象。

## Complexity Tracking

> 憲章違反なし。記載事項なし。
