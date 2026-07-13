# scripts/pdf — HTML→PDF 確認フロー

正本デック `index.html` を PDF 化し、**Claude Code** が描画・設計を評価するための最小構成。人の確認は副次。仕様は [specs/008-html-pdf-preview/](../../specs/008-html-pdf-preview/)。

## スクリプト

| コマンド | 実体 | 役割 |
|---|---|---|
| `npm run build:pdf` | `build-pdf.mjs` | Chromium で `index.html` を開き、`@media print` 適用下に `page.pdf()` で `dist/deck.pdf`(1280×720)を生成。`--png` で `dist/pdf-pages/NN.png`、`--out <path>` で出力先上書き。 |
| `npm run check:pdf` | `check-pdf.mjs` | 決定的チェック: `dist/deck.pdf` が存在し `>1KB`、かつ PDF ページ数 == `index.html` の `.slide` 実数。不一致で非0終了。 |

`verify` チェーンに `build:pdf` → `check:pdf` を結線済み。

## 設計上の約束

- **版面は既存 `@media print` のみを正**とし、PDF 用の新規 CSS を書かない(二重定義でドリフトさせない)。
- **スライド枚数はハードコードしない**。`check-pdf.mjs` は都度 `index.html` から数える。
- ページ計数は Chromium 出力 PDF の `/Type /Page`(`/Pages` 除外)出現数による依存フリー方式。**Chromium 出力前提**。

## 成果物とバージョン管理

- 出力: `dist/deck.pdf`、任意で `dist/pdf-pages/NN.png`。
- `dist/deck.pdf` は**追跡対象**(`.gitignore` の `!dist/deck.pdf` で例外指定。`sample-deck.pptx` と同様、ビルド不要でレビュー・閲覧可能)。per-slide PNG 等その他の生成物は `dist/*` により追跡外。
- 注意: デック変更のたびに PDF が再コミットされ差分が出る(意図的。レビュー容易性を優先)。

## Claude Code による評価手順

1. `npm run build:pdf` で `dist/deck.pdf` を生成。
2. `npm run check:pdf` で決定的下地チェック(枚数一致・生成成功)。
3. `dist/deck.pdf` を Read ツールの `pages` で全ページ読み込み、[評価ルーブリック](../../specs/008-html-pdf-preview/contracts/evaluation-rubric.md)の A(描画破綻)/B(設計適合)を各スライドに適用。
4. (可能なら)`index.html` をブラウザで開き、発表モード `P`・注釈トグル `A` を観察して所見を補強。
5. スライド単位の表(slide / render / design / findings)＋集計・総合判定でレポート。判定不能ページは `UNEVALUABLE`(合格にしない)。

前提: `npm install` ＋ `npx playwright install chromium`(ネットワーク要)。
