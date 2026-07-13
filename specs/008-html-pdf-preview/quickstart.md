# Quickstart: HTML→PDF を Claude Code が確認・評価する

正本デック `index.html` を PDF 化し、Claude Code が描画・設計を評価するまでの最短手順。

## 前提

- `npm install` 済み、`npx playwright install chromium` 済み（Chromium 必須）。
- 生成物は `dist/`（バージョン管理外）。

## 手順（Claude Code 主体）

1. **PDF 生成**

   ```sh
   npm run build:pdf
   # → dist/deck.pdf を生成（例: [build:pdf] wrote dist/deck.pdf (25 pages)）
   ```

2. **決定的な下地チェック**

   ```sh
   npm run check:pdf
   # → PASS: ページ数 == スライド枚数、生成成功
   # → FAIL: 期待/実測を表示（是正してから再実行）
   ```

3. **Claude Code による視覚評価**
   - Claude Code が `dist/deck.pdf` を Read ツールの `pages` で全ページ読み込む。
   - `contracts/evaluation-rubric.md` の A（描画破綻）/ B（設計適合）を各スライドに適用。
   - C の様式でレポート出力（slide / render / design / findings ＋ 集計・総合判定）。
   - 画像が不鮮明で判定できないページは `UNEVALUABLE`（合格にしない）。必要なら `npm run build:pdf -- --png` で PNG を併産して再読込。

4. **（任意）ブラウザ確認**
   - Claude Code が `index.html`（`file://`）を Chromium で開き、全スライド表示と対話挙動（発表モード `P`／注釈トグル `A`）を観察して所見を補強。
   - 実行環境が無ければスキップ可（PDF 確認で完結）。

## 回帰（verify への結線）

```sh
npm run verify
# 既存チェーンに build:pdf → check:pdf を含め、
# 枚数不一致・生成失敗を継続検出する。
```

## 期待アウトカム（対応する成功基準）

- 全ページ読み込み・全スライド所見（SC-001） / ページ数一致（SC-002）
- 注入した見切れ等を 100% 検出（SC-003）・正常版で誤検出 0（SC-004）
- 構造化レポート（SC-005） / 版面は単一定義（SC-007）

## トラブルシュート

- `Executable doesn't exist`（Chromium 未導入）: `npx playwright install chromium`。
- ページ数が合わない: `index.html` のスライド増減後に再生成。`check:pdf` は都度 `index.html` を数える（ハードコードなし）。
