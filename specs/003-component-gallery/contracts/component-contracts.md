# Contract: 再利用コンポーネント(クラス API)

**Provider**: `styles/components.css`。**Consumer**: `components.html`、スライド、著者。
役割変数のみ使用(vendor 直参照可)。自己完結クラス(スライドグリッド非依存)。

## クラス契約(抜粋)

| class | 構造 | 変種 | 不変条件 |
|---|---|---|---|
| `.callout` | `.callout > .callout__title? + .callout__body` | `.callout--info/success/warning/error` | 淡面 + 濃文字/左罫(semantic)。文字 AA |
| `.badge` | `<span class="badge badge--X">` | neutral/accent/success/warning/error | 面上文字 AA。小サイズでも可読 |
| `.tag` | `<span class="tag">` | — | surface + border |
| `.btn` | `<button class="btn btn--X">` | primary/secondary/tertiary | 面上文字 AA、操作領域は Fitts 配慮の最小高 |
| `.data-table` | `<table class="data-table">` | `.data-table--striped` | ヘッダ強調、罫は border、偶数行 surface |
| `.progress` | `.progress > .progress__bar[style=width]` | — | トラック surface-strong、バー accent |
| `.stat` | `.stat > .stat__value + .stat__label` | — | 値は accent 強調(Von Restorff) |
| `.legend` | `.legend > .legend__item(.legend__swatch + text)` | — | swatch は役割色 |
| `.divider` | `<hr class="divider">` | — | border 1px |
| `.checklist` | `.checklist > li` | — | チェック印は state-success |
| `.pull-quote` | `<blockquote class="pull-quote">` | — | accent 引用記号/罫 |
| `.kv` | `.kv > (.kv__k + .kv__v)` | — | ラベル text-secondary、値 text-primary |

## テスト対象

- C-C-1: `styles/components.css` に生 hex/rgb/生px 余白が無い(SC-002)。
- C-C-2: 状態色ペア(面 vs 文字)が AA(SC-003)。
- C-C-3: 代表部品を本文スライドに差し込んでも 1280×720 で overflow しない(SC-004)。
- C-C-4: 各部品に見本 + 用途注記 + コピー用 `<code>` が併記(SC-001/006)。
