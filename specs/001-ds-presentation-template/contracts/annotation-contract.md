# Contract: 注釈レイヤー(マークアップ + トグル API)

**Provider**: `js/annotations.js` + `styles/slides.css`。**Consumer**: 各スライド、学習者/著者。

## マークアップ契約

```html
<section class="slide" data-layout="body">
  ...
  <aside class="slide__annotation" data-annotation hidden
         aria-label="設計意図と出典">
    <p class="annotation__intent">この見出しは結論を1文で述べるアクションタイトル。</p>
    <ul class="annotation__practices">
      <li data-practice="A-action-title">アクションタイトル(→ practices.md #A-action-title)</li>
      <li data-practice="D-clt">認知負荷理論(→ #D-clt)</li>
    </ul>
  </aside>
</section>
```

- `[data-annotation]` を持つ要素が注釈。`hidden` 属性で**既定非表示**(FR-005/Clarify Q4)。
- `data-practice` は `docs/practices.md` の Practice.id を参照(相互参照、SC-05)。書誌の直書き禁止(重複回避)。

## トグル API

- グローバル: `window.PresTemplate.toggleAnnotations(force?: boolean)` — 全スライドの注釈表示を切替(`force` 明示時はその状態に固定)。
- 既定操作: キー `a` で全体トグル、各スライドの `.slide__annotation-toggle` ボタンで個別トグル。
- 状態は `document.documentElement` の `data-annotations="on|off"` に反映(CSS が `[hidden]` を制御)。
- 初期状態: `off`(非表示)。

## 印刷契約

- `@media print`: 注釈は既定で出力しない(発表/配布のクリーンさ)。`data-annotations="on"` かつ print でも出す設定は将来拡張(本フェーズ範囲外)。

## テスト対象の不変条件

- C-A-1: 全8レイアウトで初期表示が非表示、トグルで表示に切替可能(SC-03)。
- C-A-2: すべての `data-practice` が practices.md に存在(相互参照リンク切れゼロ、SC-05)。
- C-A-3: `aria-label` 付与でスクリーンリーダから識別可能。
