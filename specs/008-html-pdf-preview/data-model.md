# Phase 1 Data Model: HTML→PDF 生成物を Claude Code が確認・評価するフロー

本機能はデータ永続化を持たないため、「エンティティ」は成果物・入出力の構造として定義する。

## Entity: 正本デック (Canonical Deck)

- **表現**: `index.html`
- **属性**:
  - `slides[]`: `<section class="slide" data-layout>` の集合。枚数は動的（ハードコード禁止）。
  - `frame`: 各スライドの共通フレーム（取扱区分・著作権・ページ番号）。`js/frame.js` が付与。
- **不変条件**: 版面（1スライド=1ページ）は `@media print` により定義される唯一の正。

## Entity: PDF 出力 (PDF Artifact)

- **表現**: `dist/deck.pdf`（追跡対象。PPTX 成果物と同様に `.gitignore` 例外指定）
- **属性**:
  - `pageCount`: 整数。= 正本デックの `slides[]` 件数。
  - `pageSize`: 1280×720px 相当（16:9）。
  - `byteLength`: > 1024（生成成功の下限）。
- **生成規則**: `scripts/pdf/build-pdf.mjs` が `@media print` 適用下で生成。
- **検証規則（決定的）**:
  - 存在し、`byteLength > 1024`。
  - `pageCount === slideCount`（`index.html` の `.slide` 実数）。

## Entity: ページ画像 (Page Image)

- **表現**: PDF の各ページ（一次）／任意の `dist/pdf-pages/NN.png`（フォールバック）
- **属性**:
  - `index`: 1..pageCount。
  - `slideRef`: 対応するスライド（レイアウト名／ページ番号）。
- **用途**: Claude Code の視覚評価入力（Read ツール `pages` で読み込み）。

## Entity: 評価レポート (Evaluation Report)

Claude Code が出力する構造化された確認結果。スライド単位のレコードの集合。

- **レコード属性**:
  - `slide`: ページ番号／レイアウト識別（例: `10-dashboard`）。
  - `render`: `PASS` | `FAIL` | `UNEVALUABLE`（描画破綻の判定）。
  - `design`: `PASS` | `FAIL` | `UNEVALUABLE`（設計意図適合の判定）。
  - `findings`: 所見（FAIL/UNEVALUABLE 時は具体症状と該当箇所を必須）。
- **集計属性**:
  - `total`, `renderFail`, `designFail`, `uneval`。
  - `verdict`: 全 `render`/`design` が `PASS` のとき合格。`UNEVALUABLE` は合格に含めない（FR-013）。
- **状態遷移**:
  - `UNEVALUABLE`（画像が判定に不十分）→ 再生成/高解像度化後に再評価 → `PASS`/`FAIL`。
- **表現例（人可読・機械可読両対応の表形式）**:

  | slide | render | design | findings |
  |---|---|---|---|
  | 01-title | PASS | PASS | — |
  | 10-dashboard | FAIL | PASS | 6枚目タイルが右端で見切れ（overflow-x） |

## Entity: 評価ルーブリック (Evaluation Rubric)

- **表現**: `contracts/evaluation-rubric.md`
- **役割**: `render`/`design` 判定の基準（チェック項目）と、レポート様式（上記スキーマ）を規定する契約。
- **依拠**: `docs/practices.md`、スライド注釈 `data-practice`、DS トークン（新基準は作らない）。

## 関係

```
正本デック ──build-pdf──▶ PDF 出力 ──(Read pages)──▶ ページ画像 ──評価(ルーブリック)──▶ 評価レポート
      └───────────── check-pdf（決定的: pageCount===slideCount, byteLength>1KB）
```
