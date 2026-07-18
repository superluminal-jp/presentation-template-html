# Contract: `.tree` コンポーネント(DOM / CSS API)

デックが公開する UI 契約。マークアップは意味的入れ子リスト、スタイルは `styles/layouts/tree.css`。

## DOM 構造(縦=既定)

```html
<section class="slide slide--tree" data-layout="tree" data-practice="A-pyramid">
  <!-- slide__heading(アクションタイトル)/ frame は既存共通 -->
  <ul class="tree">
    <li class="tree__node tree__node--root">
      <div class="node"><span class="node__label">…結論…</span></div>
      <ul>
        <li class="tree__node tree__node--branch">
          <div class="node"><span class="node__label">①…</span><span class="node__body">…</span></div>
          <ul>
            <li class="tree__node tree__node--leaf"><div class="node">…裏付け…</div></li>
          </ul>
        </li>
        <!-- branch を MECE に 2〜5 -->
      </ul>
    </li>
  </ul>
</section>
```

## DOM 構造(横=付録)

```html
<section class="slide slide--appendix slide--appendix-tree" data-layout="appendix-tree-horizontal" data-practice="A-pyramid">
  <ul class="tree tree--horizontal"> … 同じ入れ子構造 … </ul>
</section>
```

## クラス契約

| クラス | 役割 |
|---|---|
| `.tree` | ツリー本体(縦既定)。`grid-row:2` 帯に配置。 |
| `.tree--horizontal` | 横(左→右)への向き替え修飾子。 |
| `.tree__node--root` / `--branch` / `--leaf` | ノードの役割。役割色/強調を切替。 |
| `.node` / `.node__label` / `.node__body` | ノード枠と本文。process/timeline と同じ視覚言語。 |
| 配置クラス `.slide--tree` / `.slide--appendix-tree` | スライド単位の配置(コンポーネントは配置非依存)。 |

## コネクタ(直線 / SVG)

- コネクタは**鍵線(L字)ではなく直線**。各枝分かれ `<li>` 内に `<svg class="tree__lines">` を `js/tree-connectors.js` が挿入し、親 node から各子 node へ `<line class="tree__line">` を描く。
- 線端は実際の node 位置(offset 合算)から算出 → 内容/枝数が変わってもズレない。縦=親下辺中央→子上辺中央、横=親右辺中央→子左辺中央。
- SVG は `viewBox`=li の offset サイズ・`width/height:100%` のため present モードの transform 拡大でも整合。線色 `.tree__line{stroke:var(--border-strong)}`(役割変数)。
- スクリプトは `index.html` と各 `slides/NN-*.html`(split foot 経由)で読み込む。`.tree__lines` は `aria-hidden`(装飾)。

## 制約(不変条件)

- 色・余白・角丸・文字サイズ・境界・線色は DS 役割変数のみ(生 hex/rgb/hsl 禁止・余白系生 px 禁止)。線幅 `stroke-width` は spacing 対象外。
- 全要素が 1280×720 内(overflowX/Y ≤ 1)。
- 印刷は既存 `@media print` 単一ソースに従う(新規ページ CSS 追加禁止)。
- `slides/17-tree.html` は `split-slides.mjs` の生成物(手編集禁止)。
