# Specification Quality Checklist: 編集可能 PPTX への DOM 実測変換(正本一元化)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-15
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

### 確認済み・未解決事項

- 変換方式(案B: DOM 実測抽出)はユーザー確認済み。案A(手書き追補)・案C(OOXML 直接生成)は棄却し、C は Deferred に記録。未解決の [NEEDS CLARIFICATION] なし。
- 出力範囲は「本機能では計画のみ、実装は後続」とユーザーが選択。本スペック一式が成果物。

### 仕様の性質に関する但し書き

- FR-001 の役割属性名 `data-pptx` と語彙、FR-006 の「実レンダリングの算出値を使う」は、厳密には実装手段に踏み込む。これは本機能の**利用者(テンプレート保守者・コンポーネント作者)にとって語彙そのものが公開契約**であり、語彙を規定しなければ受け入れ条件を書けないため、意図的に仕様側へ置いている。具体的なライブラリ選定・ファイル分割は plan.md / research.md 側に留めた。
- spec.md 冒頭の「現状の計測値」は 2026-09-15 時点の実測(スライド 28 対 20、日本語リテラル 214、component 数表示 20 対 12)。SC-001/SC-002 はこの実測を基準値とするため、実装着手時に再計測して差異があれば基準を更新すること。

### 依存する既存不変条件

- SC-001 のスライド数はライブ `.slide` 数に追随する設計であり、固定値 28 をハードコードしない。
- FR-017(既存検証スイート全緑)と FR-018(新規ランタイム依存なし)は既存の不変条件をそのまま継承。
- チャートデータ payload の限定的二重表現は Constitution Check で唯一の記録付き例外。理由・封じ込め・解消の起動条件は plan.md の Complexity Tracking に記載済み。
