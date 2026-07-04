# Implementation Plan: デジタル庁DS準拠 16:9 プレゼンテンプレート

**Branch**: `001-ds-presentation-template` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ds-presentation-template/spec.md`

## Summary

デジタル庁デザインシステム(DS)のデザイントークン(`@digital-go-jp/design-tokens` v2.0.1、厳密固定)のみを視覚の源泉とし、16:9(1280×720)固定グリッドのコア8レイアウトを、フレームワーク非依存の素の HTML/CSS で構築する。DS が提供しない「スペーシング」「スライド用の意味ロール(背景/サーフェス/本文文字色/アクセント)」は、DS を不可侵の vendor 層としたうえで、独立した**セマンティック写像層**で補い、DS 更新をレイアウト無改修で取り込む(SC-07)。各スライドは既定非表示・トグル可能な注釈レイヤーで設計意図と出典を提示し(FR-005)、採用ベストプラクティスは別途 `docs/practices.md` に出典付きで列挙する(FR-007)。図表はトークン整形済みの静的サンプル図+画像/プレースホルダ枠を提供(FR-015)。検証は自動化(視覚回帰・コントラスト監査・トークン lint・印刷/PDF)で SC を担保する。編集可能 PowerPoint への実変換はフェーズ2(本計画は構造的変換可能性のみ担保、FR-012)。

## Technical Context

**Language/Version**: HTML5 / CSS3(カスタムプロパティ)/ 最小限の Vanilla JS(ES2020、注釈トグルのみ)。ツール実行に Node.js ≥ 18。フェーズ2の PPT 生成は Python 3.11 + python-pptx(本計画では未実装)。

**Primary Dependencies**: `@digital-go-jp/design-tokens@2.0.1`(厳密固定、実行時 UI フレームワークなし)。開発/検証: Playwright(レンダリング・視覚回帰・印刷/PDF)、axe-core(WCAG 2.2 AA コントラスト)、自作トークン lint スクリプト。

**Storage**: N/A(静的ファイル。ビルド生成物と PNG ベースラインのみ)。

**Testing**: Playwright(1280×720 レンダリング/`@media print` の 1スライド=1ページ/視覚回帰スクリーンショット)、axe-core(コントラスト)、`lint-tokens`(vendor 層以外での色/余白ハードコード検出)。

**Target Platform**: 主要ブラウザ最新版(Chromium / Firefox / WebKit)+ 印刷/PDF 出力。

**Project Type**: 静的フロントエンド・テンプレート(単一プロジェクト)。

**Performance Goals**: 外部ネットワーク依存ゼロ(トークン/フォントはローカル解決)。各スライドは軽量(数百 KB 以内)。1280×720 で体裁が安定(はみ出し・見切れなし)。

**Constraints**: オフライン動作可能。視覚値は DS トークン由来のみ(vendor 層以外でのブランド値ハードコード禁止)。WCAG 2.2 AA。16:9 固定 1280×720。PPT 変換を妨げない構造(固定グリッド・命名レイアウト・標準寸法整合)。

**Scale/Scope**: コア8レイアウト、ショーケース 1 デック、5群(A〜E)にわたる採用手法とその注釈・`practices.md`・巻末リファレンス。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

プロジェクト憲章(`.specify/memory/constitution.md`)は未批准(テンプレート状態)。批准済み原則が無いため、spec/requirements 由来の派生ゲートで評価する:

| ゲート(派生原則) | 判定 | 根拠 |
|---|---|---|
| トークン単一源泉(vendor 以外で視覚値ハードコード禁止) | PASS | 写像層 + `lint-tokens` で担保(FR-003/SC-02) |
| アクセシビリティ(WCAG 2.2 AA) | PASS | axe-core 自動監査(FR-010/SC-04) |
| 簡素性(フレームワーク非依存・YAGNI) | PASS | 素 HTML/CSS、実行時依存なし |
| 外部依存の最小化(オフライン可) | PASS | トークン/フォントをローカル解決 |
| 更新耐性(DS 更新をレイアウト無改修で取込) | PASS | vendor/写像層の分離(FR-011/SC-07) |

違反なし → Complexity Tracking は空。

> 推奨: 別途 `/speckit-constitution` で上記派生ゲートを正式原則として批准すると、以降のレビュー基準が固定化される(本計画の前提とは非ブロッキング)。

## Project Structure

### Documentation (this feature)

```text
specs/001-ds-presentation-template/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── css-custom-properties.md   # セマンティック役割変数 API
│   ├── layout-contracts.md        # 8レイアウトの構造契約(スロット/クラス/グリッド)
│   ├── annotation-contract.md     # 注釈マークアップ + トグル API
│   └── pptx-layout-map.schema.json # フェーズ2 変換マッピングのスキーマ(実装は後続)
└── tasks.md             # /speckit-tasks 出力(本コマンドでは未作成)
```

### Source Code (repository root)

```text
tokens/
└── vendor/
    └── tokens.css                 # @digital-go-jp/design-tokens@2.0.1 を複製(不可侵・自動同期)

styles/
├── tokens.semantic.css            # 役割写像(--slide-bg/--surface/--text-primary/--accent 等)+ スペーシングスケール(4/8px)+ ブランドオーバーレイ
├── base.css                       # リセット・タイポ・印刷(@media print)規則
├── grid.css                       # 16:9 キャンバス(1280×720)+ 12カラムグリッド
├── slides.css                     # スライドシェル・道標(現在地)・注釈レイヤー土台
└── layouts/                       # レイアウト別 CSS(8)
    ├── title.css  toc.css  section.css  body.css
    └── compare.css  chart.css  summary.css  reference.css

js/
└── annotations.js                 # 注釈レイヤーの表示/非表示トグル(既定=非表示)

slides/                            # レイアウト実体(HTML 断片) + サンプル内容
├── 01-title.html  02-toc.html  03-section.html  04-body.html
├── 05-compare.html 06-chart.html 07-summary.html 08-reference.html
index.html                         # 全8レイアウトのショーケースデック

assets/
└── charts/                        # トークン整形済み静的サンプル図(SVG/CSS)+ 画像プレースホルダ

docs/
├── requirements.md                # 既存(要求整理)
├── practices.md                   # 採用手法の解説 + 出典(SC-05、5群 A〜E)
└── ds-version-map.md              # Figma↔npm バージョン対応表 + 更新ランブック(SC-07)

scripts/
├── sync-tokens.mjs                # 固定版 tokens.css を tokens/vendor/ へ複製
├── lint-tokens.mjs                # vendor 以外での色/余白ハードコードを検出し失敗させる
└── (phase2) build-pptx.py         # python-pptx による編集可能 PPT 生成(未実装)

tests/
├── visual/                        # Playwright: レイアウト別スクリーンショット + ベースライン
├── a11y/                          # axe-core: コントラスト監査
└── print/                         # 印刷/PDF: 1スライド=1ページ検証

package.json                       # 依存固定(design-tokens@2.0.1)+ 検証スクリプト
```

**Structure Decision**: 単一の静的フロントエンド・プロジェクト。実行時 UI フレームワークは持たない。DS トークンを不可侵の `tokens/vendor/` に隔離し、可変の意匠は `styles/tokens.semantic.css`(写像層)へ集約することで、DS 更新の影響範囲を写像層のみに閉じる。レイアウトは命名クラスと固定グリッドで表現し、フェーズ2の PPT 変換(`contracts/pptx-layout-map.schema.json`)に写像しやすくする。

## Complexity Tracking

> Constitution Check に違反が無いため記載なし。
