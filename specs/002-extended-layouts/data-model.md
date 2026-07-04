# Phase 1 Data Model: 拡張スライドレイアウトセット

**Date**: 2026-07-05 | **Feature**: 002-extended-layouts

feature 001 の構造モデルを継承し、拡張レイアウト固有の構成要素を追加する。実行時データストアは持たない。

## エンティティ関係(追加分)

```text
ExtendedLayout (SlideLayout を継承) 1─* NamedSlot
ExtendedLayout *─* Practice(注釈 data-practice 経由)
Dashboard 1─* KPITile
Timeline/Process 1─* Step(順序付き)
Matrix 1─4 Quadrant(2軸)
Quote 1─1 Attribution
ImageFull 1─1 VisualSlot(+ 任意 Scrim)
PracticeCoverage: union(all data-practice across core+extended) ⊇ practices.md catalog
```

## 1. ExtendedLayout(拡張レイアウト)

- **フィールド**: `id`(big-number|dashboard|timeline|matrix|process|quote|image-full|closing)、`role`、`grid`、`slots[]`、`demonstrates[]`(Practice.id)
- **不変条件**: feature 001 の SlideLayout 契約を満たす(1280×720 無 overflow、役割変数のみ、注釈既定非表示、印刷1p、命名スロット、内容保持はアクションタイトル)。

## 2. KPITile(ダッシュボード)

- **フィールド**: `label`、`value`(プレースホルダ)、`sub`(補足/前期比)、`highlighted`(任意 1 件の推奨/注目)
- **不変条件**: タイル数は情報過多を避け上限を設ける(推奨 ≤6, Miller)。`highlighted` は 0〜1 件(default 効果/Von Restorff)。

## 3. Step(タイムライン/プロセス)

- **フィールド**: `order`(整数)、`marker`(番号/日付)、`label`、`body`
- **不変条件**: 順序が一意で昇順。ステップ数は上限(推奨 ≤6)。順序標識が視認できる。

## 4. Quadrant(2×2 マトリクス)

- **フィールド**: `axisX`/`axisY`(ラベル)、`position`(4 象限のいずれか)、`content`
- **不変条件**: 2 軸にラベルがあり、4 象限が明示的にグルーピング(ゲシュタルト)される。

## 5. Quote / Attribution(引用・証言)

- **フィールド**: `quote`(引用文)、`source`(出典)、`role`(肩書き)
- **不変条件**: 出典/肩書きは事実に基づくプレースホルダ。捏造の推奨文言・実在団体の偽推薦を初期同梱しない(FR-007)。

## 6. VisualSlot / Scrim(全面ビジュアル)

- **フィールド**: `image`(作成者提供プレースホルダ)、`caption`、`scrim`(重ね文字時の半透明面)
- **不変条件**: 著作物を同梱しない。重ね文字は AA コントラスト(スクリムで担保、FR-008/SC-004)。

## 7. PracticeCoverage(実演カバレッジ)

- **定義**: 全スライド(core+extended)の `data-practice` の和集合。
- **不変条件**: practices.md の全 Practice.id を包含する(未実演 0、SC-005)。`scripts/check-practice-coverage.mjs` で検証。

## 検証マトリクス(エンティティ → SC)

| エンティティ/不変条件 | 対応 SC | 検証手段 |
|---|---|---|
| ExtendedLayout: 1280×720 無 overflow / 印刷1p | SC-001 | Playwright(既存 layouts/print) |
| 役割変数のみ(ハードコード0) | SC-002 | lint-tokens(既存) |
| 注釈 既定非表示・トグル | SC-003 | Playwright annotations(既存) |
| コントラスト AA(重ね文字含む) | SC-004 | axe-core + スクリム設計 |
| PracticeCoverage ⊇ catalog | SC-005 | check-practice-coverage(新規) |
| 見出し=アクションタイトル | SC-006 | 目視/構造 |
| スロット矩形確定・実DOM本文 | SC-007 | convertibility(既存) |
| レイアウト種別数 16・全て単体化 | SC-008 | split-slides + ファイル数確認 |
