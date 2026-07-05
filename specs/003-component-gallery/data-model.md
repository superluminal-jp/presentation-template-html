# Phase 1 Data Model: 再利用コンポーネント集ページ

**Date**: 2026-07-05 | **Feature**: 003-component-gallery

静的成果物のため「構造モデル」として定義。

## エンティティ

### Component(コンポーネント)
- **フィールド**: `name`、`category`(状態/ラベル/操作/データ/構造)、`className`(`.callout` 等)、`variants[]`(例: info/success/warning/error)、`usageNote`、`markupExample`、`tokensUsed[]`
- **不変条件**: 視覚値は役割変数のみ(SC-002)。テキスト/UI は AA(SC-003)。スライドグリッドに非依存で差し込み可能(FR-004)。

### ComponentGallery(集ページ)
- **フィールド**: 順序付き `Component[]`(カテゴリ別)、README/ショーケースからの導線
- **不変条件**: ≥10 部品、各に見本 + 用途注記 + コピー用コード(SC-001/006)。

## 収録一覧(className / variants)

| # | 部品 | class | variants | 使用トークン(主) |
|---|---|---|---|---|
| 1 | コールアウト | `.callout` | info/success/warning/error | semantic-*, opacity-gray, text-primary |
| 2 | バッジ | `.badge` | neutral/accent/success/warning/error | semantic-*, accent, on-accent |
| 3 | タグ/チップ | `.tag` | — | surface, border, text |
| 4 | ボタン | `.btn` | primary/secondary/tertiary | accent, on-accent, border |
| 5 | データテーブル | `.data-table` | striped | surface, border, text |
| 6 | プログレス | `.progress` | — | accent, surface-strong |
| 7 | 統計(KPI) | `.stat` | — | accent, text-secondary |
| 8 | 凡例 | `.legend` | — | accent, border, text |
| 9 | 区切り | `.divider` | — | border |
| 10 | チェックリスト | `.checklist` | — | state-success, text |
| 11 | 引用ブロック | `.pull-quote` | — | accent, surface, text |
| 12 | キーバリュー | `.kv` | — | text-secondary, text-primary, border |

## 検証マトリクス

| 不変条件 | SC | 手段 |
|---|---|---|
| 役割変数のみ(ハードコード0) | SC-002 | lint-tokens(styles/ 自動) |
| 状態色ペア AA | SC-003 | contrast-tokens(追加) + axe |
| ≥10 部品・見本+注記+コード | SC-001/006 | components.html 目視/構造 |
| スライド差し込みで崩れない | SC-004 | プレビュー実測(本文スライドに1例) |
| README/ショーケース導線 | SC-005 | リンク存在確認 |
