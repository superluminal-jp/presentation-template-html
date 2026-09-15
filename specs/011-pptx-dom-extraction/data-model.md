# Data Model: 編集可能 PPTX への DOM 実測変換

**Feature**: 011-pptx-dom-extraction | **Plan**: [plan.md](./plan.md)

本機能は永続ストアを持たない。実体は (1) HTML 上の役割属性語彙と (2) 抽出器→出力器が受け渡す
スライド IR の 2 つ。

## 1. 役割属性 `data-pptx`(HTML 側の契約)

閉じた語彙。変換器が知る唯一の入力。

| 値 | PPTX 上の対応物 | 抽出される情報 | 用例 |
|---|---|---|---|
| (なし) | テキストボックス | 上と同じ(**既定**。直接テキストを持つ要素が自動で対象になる) | `.slide__heading`, `.stat__value`, `.callout` |
| `text` | テキストボックス 1 個 | 部分木を束ね、`<li>` を箇条書き段落にする | `.body`, `.checklist`, `.citation-list` |
| `shape` | 矩形(角丸可) | 矩形、塗り、境界色/太さ、角丸半径 | `.callout` の面、`.tile`, `.node` |
| `line` | 直線 | 始点・終点、色、太さ | `.slide__footer` の罫、tree コネクタ |
| `table` | ネイティブ表 | 行列のセルテキスト、ヘッダ行、境界、セル塗り | `.data-table` |
| `chart` | ネイティブグラフ | グラフ種、系列名、カテゴリ、数値、系列色 | 多系列 SVG |
| `image` | 画像 | 矩形、画像ソース | 装飾画像(本文領域では原則不使用) |
| `group` | グループ | 子孫をまとめる境界のみ(自身は描画しない) | `.callout`, `.stat`, `.step-nav__item` |
| `ignore` | (出力しない) | — | 純粋な装飾、注釈パネル、グリッドガイド |

**規則**(実装時に既定を反転 — 理由は contracts/pptx-role-contract.md):

- 役割属性は**描画に影響しない**(CSS セレクタの対象にしない)。
- **既定は「本文は自動で出る」**。直接の子テキストノードに非空白を持つ要素が
  1 テキストボックスになる。役割属性はこの既定を上書きする目的にのみ付ける。
- 最外の「直接テキストを持つ要素」が勝つ。その内側のインライン要素は同じボックス内の
  *run* になり、別ボックスにはならない(二重出力の防止)。
- 面(塗り・境界)と本文の両方を持つ要素は、**1 つのオブジェクト**(塗り付きテキスト
  ボックス)になる。面のみの要素は `shape`、面 + 複数テキストは `group`。
- ボックスの矩形は、面を持つなら要素矩形(余白ごと)、持たないなら実テキストの
  描画矩形(`Range.getClientRects()` の和)。後者により、先行するインライン図形
  (凡例スウォッチ等)とテキストが重ならない。
- `group` は入れ子可。`ignore` は子孫ごと出力対象から外す。
- `text` は「部分木を 1 ボックスに束ねる」上書き。`<li>` があれば各項目が箇条書き段落になり、
  `li::before` の 1 文字マーカーはネイティブ箇条書き文字として持ち上がる。

## 2. スライド IR(抽出器 → 出力器)

```text
Deck
├── canvas: { w: 1280, h: 720 }          # px。出力時に inch へ換算(÷96)
└── slides: Slide[]                       # 正本の .slide と 1:1、文書順
```

```text
Slide
├── layout: string                        # data-layout の値(参照用。出力の分岐には使わない)
├── background: { fill: hex }             # .slide の計算済み背景色
└── nodes: Node[]                         # 文書順 = z 順
```

```text
Node = TextNode | ShapeNode | LineNode | TableNode | ChartNode | ImageNode | GroupNode
```

| フィールド | 型 | 適用 | 備考 |
|---|---|---|---|
| `kind` | 語彙の値 | 全 Node | `data-pptx` の値 |
| `rect` | `{ x, y, w, h }` px | 全 Node(`group` 除く) | スライド原点からの相対。`getBoundingClientRect` の差分 |
| `runs` | `Run[]` | TextNode | 部分着色を保つ(下記) |
| `font` | `{ face, sizePt, bold, align, valign, lineSpacing }` | TextNode | 計算済みスタイル由来。px→pt は ×0.75 |
| `fill` | hex or `null` | ShapeNode / TableNode | `transparent` は `null` |
| `line` | `{ color, widthPt, radius }` | ShapeNode / LineNode | 境界。`radius` は角丸 |
| `rows` | `Cell[][]` | TableNode | `Cell = { text, header: boolean, fill, align }` |
| `chart` | `ChartData` | ChartNode | 下記 |
| `src` | string | ImageNode | data URI もしくは相対パス |
| `children` | `Node[]` | GroupNode | 出力時に PPTX グループへ |

```text
Run = { text: string, color: hex, bold: boolean, italic: boolean, sizePt: number }
```

`.u-accent` のような部分着色は、テキストボックスを分割せず 1 Node の複数 Run として保つ(FR-013)。

## 3. ChartData(ネイティブグラフの源)

HTML 上では `data-chart` 属性の JSON として保持し、IR へそのまま写す。

```text
ChartData
├── type: 'bar' | 'line' | 'bar100' | 'doughnut' | 'scatter'
├── categories: string[]                  # 横軸のカテゴリ(scatter では空)
└── series: { name: string, values: number[], x?: number[] }[]
                                          # x は scatter のみ(系列ごとの横軸値)
```

**整合制約(FR-005、`check:pptx` で検証)**:

- 円系以外: `series.length` == `data-series`、`series[].name` の集合 == `text.series-label` の集合
- 円系(`doughnut`): `categories.length` == `data-series`、`categories` の集合 == `series-label` の集合
  (円グラフでは直接ラベルが系列ではなくカテゴリを指すため)
- `scatter` を除き `series[].values.length` == `categories.length`

系列色は語彙外の暗黙値とせず、`styles/tokens.semantic.css` の `--cat-1..7` を系列順に割り当てる
(既存の `CAT` パレットと同じ順序)。

## 4. 状態遷移

なし。変換は 1 方向・冪等。同一の `index.html` からは同一の IR と PPTX が得られる
(フォント読み込み待機により非決定性を排する。D8)。
