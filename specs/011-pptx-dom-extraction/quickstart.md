# Quickstart: 編集可能 PPTX への DOM 実測変換

**Feature**: 011-pptx-dom-extraction | **Contracts**: [contracts/](./contracts/)

## 前提

```bash
npm install
npx playwright install chromium   # 未導入の場合のみ
```

## 変換して確認する

```bash
npm run build:pptx     # index.html を実レンダリング → dist/sample-deck.pptx
npm run check:pptx     # 正本との乖離を決定的に検証(枚数 / 見出し / chart 整合 / 画像不使用)
```

`dist/sample-deck.pptx` を PowerPoint / Keynote / Google スライドで開き、下記を確認する。

| 確認項目 | 期待 |
|---|---|
| 本文をクリック | テキストボックスとして選択・編集できる(画像でない) |
| 表をクリック | ネイティブ表。セルを書き換えられる |
| グラフをクリック | ネイティブグラフ。系列データを編集できる |
| `.callout` 等の一部をクリック | コンポーネント全体が 1 グループとして選択される |
| 新規に図形を挿入 | 既定色が DS のプライマリ青(`#0031d8`) |
| スライド枚数 | ライブの `.slide` 数と一致 |

## 正本を直して追随を確認する

変換器のソースに触れずに反映されることが本機能の要。

```bash
# 1. index.html の任意の見出しを書き換える
# 2. 再変換
npm run build:pptx
# 3. 反映を確認(scripts/pptx/ を一切編集していないこと)
git diff --stat scripts/pptx/     # 差分が無いこと
```

## 新しいコンポーネントを足すとき

`contracts/pptx-role-contract.md` のチェックリストに従う。要点のみ:

```html
<!-- 複合コンポーネント: 根に group、面に shape、文字に text -->
<div class="callout callout--info" data-pptx="group">
  <div class="callout__surface" data-pptx="shape"></div>
  <span class="callout__title" data-pptx="text">タイトル</span>
  <p data-pptx="text">本文。<span class="u-accent">強調</span>は同じボックス内のランとして保たれる。</p>
</div>

<!-- 装飾は出力対象から外す -->
<span aria-hidden="true" data-pptx="ignore">“</span>
```

確認:

```bash
npm run test:visual    # 役割属性の追加で描画が変わっていないこと(差分 0)
npm run build:pptx && npm run check:pptx
```

## 障害調査

抽出結果は中間表現としてファイルに落ちる(追跡外)。

```bash
cat dist/deck-ir.json | head -60          # スライド IR を直接読む
node -e "const ir=require('./dist/deck-ir.json'); console.log(ir.slides.map(s=>[s.layout,s.nodes.length]))"
```

PPTX 側の中身は PowerPoint を開かずに読める。

```bash
npx --yes unzip -l dist/sample-deck.pptx | grep 'ppt/slides/slide'
```

| 症状 | 見るところ |
|---|---|
| スライドが欠ける | IR の `slides.length`。抽出時の待機(D8)が足りていないか |
| テキストが空 | 擬似要素で本文を描いていないか(FR-003 違反) |
| グラフが画像になる | `data-chart` の JSON が不正、または `data-pptx="chart"` が未付与 |
| コンポーネントがバラける | 根に `data-pptx="group"` が無い |
| 色が Office 既定 | `theme.mjs` の `theme1.xml` 差し替えが走っていない |

## 全体検証

```bash
npm run verify     # build:pptx / check:pptx を含む全工程
```
