# Phase 1 Data Model: スライド共通フレーム & ダッシュボード実践スライド

**Date**: 2026-07-05 | **Feature**: 004-dashboard-slides-frame

## エンティティ

### SlideFrame(共通フレーム)
- **表現**: `.slide > .slide__frame`(四隅絶対配置)
- **スロット**: `.frame__copyright`(左下)/ `.frame__pageno`(右下)/ `.frame__scope`(右上上段)/ `.frame__confidentiality`(右上下段)
- **不変条件**: 四隅の余白域に置き `.slide__stage` 本文と重ならない(FR-005)。`@media print` で保持(FR-004)。配色はトークン由来(FR-006)。文字は AA。

### ConfidentialityLevel(機密性区分)
- **フィールド**: `level`(1|2|3)、`label`(「機密性N情報」)、`tone`(neutral|warning|error)
- **表現**: `data-confidentiality` 属性で選択、CSS が `.frame__confidentiality` の色/文言を切替
- **不変条件**: 1/2/3 のいずれか。既定サンプル=2。上位ほど強い注意色。AA。

### CategoricalPalette(カテゴリ配色)
- **フィールド**: `--cat-1 … --cat-7`(DS 7 パレット由来)
- **不変条件**: 各色は白背景に対しチャート面として ≥3:1。役割変数(vendor 参照)。

### DashboardSlide(ダッシュボード付録)
- **表現**: `.slide--appendix`(または `.slide--dashboard-ex`)に KPI カード群 + 多系列チャート + 凡例
- **不変条件**: KPI カードはグリッド整列。1280×720 で崩れない(SC-004)。practices C 群と整合(FR-009)。

### KPICard / Series
- **KPICard**: `label` / `value`(プレースホルダ)/ `sub` / `highlighted?`
- **Series**: 多系列チャートの 1 系列。`--cat-n` 色 + 凡例ラベル。

## 検証マトリクス

| 不変条件 | SC | 手段 |
|---|---|---|
| 全スライドにフレーム4要素 | SC-001 | frame.spec(全 .slide に要素存在) |
| トークン由来・ハードコード0 | SC-002 | lint-tokens |
| 機密性 1/2/3 切替 | SC-003 | frame.spec(属性切替で表示変化) |
| ダッシュボード grid + 多系列 + 凡例, 無 overflow | SC-004 | Playwright(overflow) |
| カテゴリ配色 7 パレット・AA/識別可 | SC-005 | contrast-tokens(cat 各色 ≥3:1) |
| フレーム印刷保持 | SC-006 | print.spec(print media で表示維持) |
| 整合記録 | SC-007 | docs/dashboard-consistency.md 存在 |
