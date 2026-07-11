# Phase 0 Research: コンポーネント集の付録一本化と PPTX 反映

技術は既知(静的 HTML/CSS + pptxgenjs + Playwright)。未確定はスコープ内の設計判断のみ。以下で解決する。

## R1. 付録の現状カバレッジと不足分

**Decision**: 既存付録 A〜E を活かし、不足 = **区切り(divider)** と **DADS 公式 6 種** のみ追加する。

**現状(調査結果)**:
- 付録A(状態と通知): コールアウト・バッジ・タグ・ボタン ✓
- 付録B(指標): データテーブル・プログレスバー・統計(KPI)・凡例 ✓
- 付録C(まとめ部品): チェックリスト・キーバリュー・引用ブロック・統計+プログレス ✓
- 付録D(ダッシュボード): KPIタイル・多系列チャート(SVG) ✓
- 付録E(グラフ事例): SVG チャート群 ✓
- **未実演**: 区切り(divider)= 自作 12 種のうち唯一の欠落 / DADS 公式 6 種(カード・箇条書きリスト・チェックボックス・ラジオ・プログレスインジケーター・パンくず)

**Rationale**: 重複実演を避ける(FR-002)。既存の実演を壊さず追加のみで 18 種網羅(SC-001)。

**Alternatives considered**: 付録を全面再設計 → 変更範囲と回帰リスクが過大で棄却。

## R2. DADS 公式コンポーネントの付録への取り込み方

**Decision**: 新設「付録F: DADS 公式コンポーネント」に、`vendor/dads-components/**` の公式マークアップ相当を **1 スライドへ静的に埋め込む**。`index.html` に `styles/dads-components.css` をリンクする(現状未リンク)。公式 CSS は既存 `tokens/vendor/tokens.css` に解決する。

**Rationale**: vendor は不変(G5)。`components.html` が使っていた提示方法(dads-components.css + vendor マークアップ)をそのまま付録へ移設するのが最小差分。6 種を 1 スライドにグリッド配置(見切れ回避のため密度を調整、必要なら付録F-1/F-2 に分割)。

**Alternatives considered**: iframe 読み込み → 印刷/native サイズ/セキュリティで不利、棄却。画像化 → 編集不可・トークン非追従で棄却。

## R3. `components.html` 参照の除去範囲(テスト含む)

**Decision**: 削除に伴い以下を更新する。
- `index.html` のナビリンク(コンポーネント集へのリンク)を除去。
- `README.md` / `CLAUDE.md`(SPECKIT ブロック)の記述を更新(components.html → 付録)。
- **a11y テスト 2 本を再ポイント**: `tests/a11y/components-a11y.spec.mjs`・`tests/a11y/focus-a11y.spec.mjs` は `components.html` を開いている。デッキ付録(`index.html` または生成された付録スライド `slides/*appendix*` / DADS 付録スライド)を対象に変更する。
- `styles/dads-components.css` / `scripts/sync-dads.mjs` 内のコメント文言に `components.html` 参照があれば「付録」へ更新。
- 過去 spec(`specs/003-*`, `005-*`, `006-*`)内の `components.html` 記述は **歴史的記録**のため変更しない(現行コードの参照ではない)。

**Rationale**: FR-004/SC-002 は「ソース・ドキュメント・テストで参照 0」。過去 spec は履歴でスコープ外。

**Alternatives considered**: テストを削除 → a11y カバレッジ低下で棄却。テストを維持したまま components.html を残す → 廃止方針(削除)に反し棄却。

## R4. コンポーネント点数表記の整合

**Decision**: デッキ本文の「12コンポーネント」表記を **18** に更新する。該当箇所は少なくとも 2 つ:
- タイトルスライド meta の「12コンポーネント」
- ダッシュボードタイル「コンポーネント 12(再利用可)」

**Rationale**: FR-010/SC-005(実体との整合)。DADS 公式 6 種を加えて 12+6=18。

**Alternatives considered**: 「12(自作)+6(公式)」の内訳表記 → 冗長。合計 18 に統一し、必要なら sub に内訳を短記。

## R5. 数値変更に伴う相互参照・網羅性チェック

**Decision**: `check:crossrefs` / `check:coverage` は practices(手法)ID の網羅を検証するもので、コンポーネント点数とは独立。付録追加で practices の欠落は生じない想定。実装後に両チェックを再実行して緑を確認する(FR-011)。

**Rationale**: 既存チェックの対象を確認済み(practices catalog 37 の網羅)。コンポーネント追加は practices を減らさない。

## R6. PPTX への付録反映方針

**Decision**: `scripts/pptx/build-pptx.mjs` に **付録スライド(最低 1 枚)** を追加する。ネイティブ要素で:
- コールアウト = 角丸矩形 + 左アクセント罫 + テキスト
- バッジ/タグ = 小さな角丸矩形 + テキスト(状態色)
- データテーブル = pptxgenjs ネイティブ表(`addTable`)
- プログレス/統計/チェックリスト/kv/引用/区切り = 図形 + テキスト
- DADS 公式(カード/リスト/チェックボックス/ラジオ/進捗/パンくず)= 図形 + テキストで体裁を近似
SVG 多系列チャート(付録D/E)は簡略化または省略(利用者許容)。本文領域にラスタ画像を使わない(SC-004)。

**Rationale**: 既存 chrome/グリッド/トークン基盤を再利用。`addTable` はネイティブ編集可能表を満たす。

**Alternatives considered**: 付録を HTML 画像として貼付 → ネイティブ要件違反で棄却。

## 未解決事項

なし([NEEDS CLARIFICATION] 0)。以上で Phase 1 設計へ進行可能。
