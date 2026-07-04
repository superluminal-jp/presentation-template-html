# Contract: スライドレイアウト構造契約(コア8種)

**Consumer**: 著者(内容差し込み)、フェーズ2 PPT 変換器。
**Provider**: `slides/*.html` + `styles/layouts/*.css` + `styles/grid.css`。

## 共通契約

- ルート: `<section class="slide slide--{id}" data-layout="{id}">`。キャンバスは 1280×720 固定(`styles/grid.css`)。
- 12 カラムグリッド。配置は `--space-*` のみ。
- 共通スロット: `.slide__heading`(内容保持レイアウトはアクションタイトル)、`.slide__body`、`.slide__signpost`(現在地/道標)、`.slide__citation`(脚注出典)、`[data-annotation]`(既定非表示)。
- 本文は実 DOM テキスト(擬似要素での本文表示禁止=PPT 変換可能性)。
- 不変条件: 内容量が既定上限内なら overflow を生じない(SC-01)。

## レイアウト別スロット契約

| id | 必須スロット | 手法適用(注釈で明示) |
|---|---|---|
| `title` | `.title`, `.subtitle`, `.meta` | 表紙。key 色面、視覚階層 |
| `toc` | `.agenda`(li ≤7), `.current`(現在地) | Miller/サインポスティング/ゴール勾配 |
| `section` | `.section-no`, `.section-title` | 章扉。ピーク配分/系列位置 |
| `body` | `.slide__heading`, `.body`(bullet ≤7), `.visual` | Assertion–Evidence/CLT/F・Zパターン |
| `compare` | `.slide__heading`, `.col--left`, `.col--right`, `.verdict` | フレーミング/C.R.A.P./近接 |
| `chart` | `.slide__heading`, `.chart`(`.chart--sample`\|`.chart--placeholder`), `.takeaway`, `.slide__citation` | Cleveland–McGill/データインク/事前注意/アンカリング |
| `summary` | `.slide__heading`, `.key-messages`(3), `.cta` | SUCCESs/ピーク・エンド/CTA |
| `reference` | `.citation-list`(practices.md ID 参照) | 出典一覧(SC-05) |

## グリッド契約(PPT 写像用の基準)

- 基準キャンバス: 1280×720px。安全余白: 上下 `--space-6`(32px)、左右 `--space-8`(48px)。
- 各スロットは矩形(x,y,w,h in px)として確定でき、`pptx-layout-map.schema.json` に対応付く。
- PPT 既定寸法 960×540pt への写像係数: `pt = px × 0.75`。

## テスト対象の不変条件

- C-L-1: 8/8 レイアウトが 1280×720 で overflow なし、印刷で 1スライド=1ページ(SC-01)。
- C-L-2: 内容保持レイアウトの `.slide__heading` がアクションタイトル形式(SC-06)。
- C-L-3: 各レイアウトのスロット矩形が確定(欠落なし)= 変換可能性(FR-012)。
