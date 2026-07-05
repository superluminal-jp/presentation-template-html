# ダッシュボード整合確認(dashboard-consistency.md)

**Date**: 2026-07-05 | Feature: 004-dashboard-slides-frame

デジタル庁「ダッシュボードデザインの実践ガイドブックとデザインテンプレート」([出典](https://www.digital.go.jp/resources/dashboard-guidebook))と、本テンプレートの**デザインシステム(DS)**・**採用プラクティス(practices.md)**との整合を記録する(FR-010 / SC-007)。

## 1. カラーパレット: ガイドブック 7 パレット ↔ DS プリミティブ

ガイドブックの 7 標準パレットは DS プリミティブと同一系。本テンプレートは既に vendor 済み(`tokens/vendor/tokens.css`)で、多系列は写像層 `--cat-1..7` として参照する。

| ガイドブック | DS プリミティブ | カテゴリ変数 |
|---|---|---|
| Blue | `--color-primitive-blue-*`(= `--color-key-*`) | `--cat-1` |
| Light Blue | `--color-primitive-light-blue-*` | `--cat-2` |
| Cyan | `--color-primitive-cyan-*` | `--cat-3` |
| Green | `--color-primitive-green-*` | `--cat-4` |
| Orange | `--color-primitive-orange-*` | `--cat-5` |
| Red | `--color-primitive-red-*` | `--cat-6` |
| Solid Gray | `--color-neutral-solid-gray-*` | `--cat-7` |

- 各 `--cat-*` はチャート面として白背景に **≥3:1**(`tests/a11y/contrast-tokens.mjs` で検証)。
- 整合: **一致**(同一の DS トークン群を出典)。

## 2. チャート選択・情報設計 ↔ practices.md(C 群)

| ガイドブックの指針 | 対応プラクティス(ID) |
|---|---|
| 適切なチャート選択の Do/Don't(誤解を防ぐ) | `C-cleveland-mcgill`(知覚順位) |
| 「必要な情報を見せる」/装飾の抑制 | `C-data-ink`, `C-storytelling-data` |
| 焦点の明確化・色/位置の使い分け | `C-preattentive`, `B-von-restorff` |
| KPI カード/凡例/注釈による共有理解 | `C-dashboard` |

- 付録 D(ダッシュボード)スライドは「長さで量を比較(棒)」「装飾排除」「グリッド整列」を実演し、上記 C 群と整合。
- 整合: **一致**(practices.md に既収録、注釈で明示)。

## 3. レイアウト: グリッド整列

- ガイドブックは「グリッド線に沿わせて配置」を推奨。本テンプレートは 1280×720 の 12 カラムグリッド(`styles/grid.css`)を採用し、KPI カード(`.tile`)をグリッド整列。
- 整合: **一致**。

## 4. スコープ差分(本テンプレートで非対象)

| ガイドブック要素 | 本テンプレートの扱い |
|---|---|
| Power BI テンプレート/動的データ接続 | 非対象(静的 HTML。値はプレースホルダ、作図エンジンなし) |
| 地図・散布図・ウォーターフォール等の全チャート種 | 代表例(棒/折れ線/構成比 + 多系列棒)を収録。他種は同方針で追加可能 |
| ナビゲーションボタン(BI 画面遷移) | 非対象(スライド前提) |

差分は「静的スライドテンプレート」というプロダクト性質によるもので、**配色・チャート指針・グリッド整列という設計原則は踏襲**している。

## 結論

カラーパレット・チャート指針・グリッド整列の3点で、ガイドブック / DS / practices.md は**整合**。多系列配色は `--cat-1..7` として DS トークンに紐付け、AA(≥3:1)を機械検証。動的 BI 機能はスコープ外(静的テンプレートの方針)。
