# Phase 1 Data Model: デジタル庁DS準拠 16:9 プレゼンテンプレート

**Date**: 2026-07-05 | **Feature**: 001-ds-presentation-template

本テンプレートは実行時データストアを持たない静的成果物のため、「データモデル」は**成果物の構造モデル**(エンティティ=構成要素とその関係・制約・状態)として定義する。spec §Key Entities を実装可能な粒度に具体化する。

## エンティティ関係(概要)

```text
Deck 1─* SlideLayout *─* Practice(注釈経由) *─1 Citation
SlideLayout 1─* Annotation *─* Practice
SlideLayout *─1 TokenMappingLayer ─1 DesignTokenSet(vendor, pinned)
ChartLayout(=SlideLayout"chart") 1─* ChartSample / PlaceholderSlot
```

## 1. DesignTokenSet(vendor・不可侵)

- **表現**: `tokens/vendor/tokens.css`(`@digital-go-jp/design-tokens@2.0.1` の複製)
- **フィールド**: `--color-primitive-*`, `--color-neutral-*`, `--color-semantic-*`, `--color-key-*`, `--font-family-*`, `--font-size-14..64`, `--font-weight-400/700`, `--line-height-*`, `--border-radius-*`, `--elevation-1..8`
- **不変条件**: 手編集禁止。更新は `scripts/sync-tokens.mjs` による版指定複製のみ。
- **状態遷移**: `pinned(v2.0.1)` → (明示更新) → `pinned(vX)`。遷移時は視覚回帰(SC-07)必須。

## 2. TokenMappingLayer(写像層)

- **表現**: `styles/tokens.semantic.css`
- **フィールド(役割変数)**:
  - 色: `--slide-bg`, `--surface`, `--text-primary`, `--text-secondary`, `--border`, `--accent`, `--state-success|error|warning`
  - スペーシング: `--space-1..12`(4/8px リズム、DS 外の自前定義)
  - ブランドオーバーレイ: HP 固有差分の上書き(存在時のみ)
- **不変条件**:
  - 役割変数は必ず `var(--color-*)`(vendor)を参照し、生の色値を持たない(SC-02)。
  - `--accent` は `--color-key-800`(#0031d8)= HP 基調(FR-004/SC-08)。
  - 本文役割はコントラスト AA を満たすトークンのみ採用(research R6)。
- **関係**: DS 更新の差分を吸収する唯一の窓口(SC-07)。改名・廃止はエイリアスで吸収。

## 3. SlideLayout(コア8種)

- **フィールド**: `id`(title|toc|section|body|compare|chart|summary|reference)、`role`、`grid`(12列・行スロット)、`slots[]`、`headingStyle`、`annotationRef`
- **共通スロット**: `heading`(アクションタイトル)、`body`、`footer/citation`、`signpost`(現在地・道標)、`annotation`
- **レイアウト別スロット**:
  | id | 主スロット | 備考 |
  |---|---|---|
  | title | title, subtitle, meta(発表者/日付) | 表紙。key 色面 |
  | toc | agenda-items(≤7, Miller), current-marker | 目次+現在地 |
  | section | section-no, section-title | 章扉。ピーク配分 |
  | body | heading, body(≤7 bullet), visual-slot | 本文。Assertion–Evidence |
  | compare | heading, col-left, col-right, verdict | 2カラム比較 |
  | chart | heading, chart-slot(sample|placeholder), takeaway, source | 図表 |
  | summary | heading, key-messages(3), cta | まとめ。SUCCESs/エンド |
  | reference | citation-list | 巻末。practices.md ID 参照 |
- **不変条件**:
  - 1280×720 で `overflow` を生じない(SC-01)。
  - 内容保持レイアウトの `heading` はアクションタイトル形式(FR-006/SC-06)。
  - 本文テキストは擬似要素ではなく実要素(PPT 変換可能性、research R7)。
- **状態**: `annotation` 表示状態 = `hidden`(既定) / `visible`(トグル)。

## 4. Annotation(注釈)

- **フィールド**: `slideId`, `intent`(設計意図), `practiceRefs[]`(Practice.id), `defaultState=hidden`
- **表現**: 各スライド内の `[data-annotation]` 要素 + `js/annotations.js` のトグル
- **不変条件**: 既定非表示(FR-005, Clarify Q4)。トグルは全8レイアウトで機能(SC-03)。印刷時は既定で出力しない(発表/配布用)。

## 5. Practice(採用手法)

- **フィールド**: `id`(例 `A-pyramid`, `B-crap`, `C-cleveland-mcgill`, `D-clt`, `E-peak-end`)、`group`(A|B|C|D|E)、`name`、`application`、`citationId`
- **表現**: `docs/practices.md`(正本、群別・ID 付き一覧)
- **不変条件**: 5 群すべてを網羅(FR-008)。各 Practice は必ず 1 つ以上の Citation を持つ(SC-05)。説得系(群E一部)は誠実利用注記必須(FR-014)。

## 6. Citation(出典)

- **フィールド**: `id`, `authors`, `title`, `year`, `source/publisher`
- **表現**: `docs/practices.md` の書誌 + `reference` レイアウトの一覧
- **不変条件**: 正本は practices.md。注釈・巻末は ID 参照(重複禁止、research R8)。

## 7. Deck(ショーケース)

- **フィールド**: 順序付き `SlideLayout[]`、全体構造(導入=title/toc → 本体=section/body/compare/chart → 収束=summary → reference)、`signpost`(進捗/現在地)
- **不変条件**: 系列位置効果/ピーク・エンドに沿う配置。`@media print` で 1スライド=1ページ(SC-01)。

## 8. ChartSample / PlaceholderSlot(図表、FR-015)

- **ChartSample**: トークン整形済みの静的サンプル図(棒・折れ線・構成比の3種)。SVG/CSS、色は役割変数のみ。Cleveland–McGill の選択指針に基づく規範例。
- **PlaceholderSlot**: 作成者の実データ図を受ける画像/枠(`img` またはプレースホルダ)。
- **不変条件**: 実データバインディング・作図エンジンは持たない(スコープ外、FR-015)。

## 検証マトリクス(エンティティ → SC)

| エンティティ/不変条件 | 対応 SC | 検証手段 |
|---|---|---|
| TokenMappingLayer: 生値なし | SC-02 | lint-tokens |
| SlideLayout: 1280×720 無 overflow / 印刷1p | SC-01 | Playwright |
| Annotation: 8/8 トグル | SC-03 | Playwright |
| 役割色: AA | SC-04 | axe-core |
| Practice/Citation: 網羅+相互参照 | SC-05 | practices.md ↔ reference リンク検査 |
| heading: アクションタイトル | SC-06 | 目視/構造チェック |
| DesignTokenSet 版遷移: レイアウト無改修 | SC-07 | 視覚回帰 |
| `--accent`=key-800 | SC-08 | トークン参照検査 |
