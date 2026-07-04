# Implementation Plan: 拡張スライドレイアウトセット

**Branch**: `002-extended-layouts` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-extended-layouts/spec.md`

## Summary

feature 001(コア8レイアウト)の基盤(vendor トークン v2.0.1 / セマンティック写像層 / 注釈機構 / 検証ハーネス)を**そのまま再利用**し、頻出表現の 8 拡張レイアウト(ビッグナンバー / KPIダッシュボード / タイムライン / 2×2マトリクス / プロセス / 引用・証言 / 全面ビジュアル / クロージング)を追加する。各レイアウトは役割変数のみで組み、`index.html` のショーケースへ追記(計16スライド)+ 単体ファイルを生成する。拡張は practices.md の未実演手法を補い、`check-practice-coverage.mjs`(新規)で「全手法が実演される(未実演0)」を機械検証する(SC-005)。既存の lint/crossref/contrast/Playwright 検証を拡張レイアウトにも適用する。新規ベストプラクティスの追加や実データ描画は行わない。

## Technical Context

**Language/Version**: HTML5 / CSS3(カスタムプロパティ)/ 最小限の Vanilla JS(既存 `js/annotations.js` を流用)。ツール実行に Node.js ≥ 18。

**Primary Dependencies**: 追加なし。既存 `@digital-go-jp/design-tokens@2.0.1`(vendor 固定)と写像層を再利用。検証は既存 Playwright / axe-core / node スクリプト。

**Storage**: N/A(静的ファイル)。

**Testing**: 既存ハーネスを拡張レイアウトへ適用(overflow / print / accent / annotations / a11y / convertibility)+ 新規 `check-practice-coverage.mjs`(全手法実演)。`_fixtures.mjs` の `LAYOUTS` を 16 種へ拡張。

**Target Platform**: 主要ブラウザ最新版 + 印刷/PDF。

**Project Type**: 静的フロントエンド・テンプレート(feature 001 と同一プロジェクト)。

**Performance Goals**: 外部ネットワーク依存なし。各スライド軽量。1280×720 で体裁安定。

**Constraints**: DS トークン由来のみ(ハードコード禁止)、WCAG 2.2 AA、16:9 固定、PPT 変換可能な命名スロット構造、注釈既定非表示。全面ビジュアル/KPI/証言はプレースホルダ(著作物・捏造推奨文言を同梱しない)。

**Scale/Scope**: 拡張 8 レイアウト(計 16)、既存ショーケースへ統合、practices.md 全手法の実演完成。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

憲章は未批准(テンプレート)。feature 001 と同一の派生ゲートで評価する:

| ゲート(派生原則) | 判定 | 根拠 |
|---|---|---|
| トークン単一源泉(ハードコード禁止) | PASS | 既存 `lint-tokens` を拡張 CSS にも適用(SC-002) |
| アクセシビリティ(WCAG 2.2 AA) | PASS | axe-core + コントラスト設計(SC-004、重ね文字に注意) |
| 簡素性(FW 非依存・YAGNI) | PASS | 既存機構の再利用、新規依存なし |
| 更新耐性(DS 更新を写像層限定) | PASS | 拡張も役割変数のみ参照(feature 001 と同一) |
| 誠実利用(説得の非操作) | PASS | 証言/社会的証明はプレースホルダ・事実ベース限定(FR-007) |

違反なし → Complexity Tracking は空。

## Project Structure

### Documentation (this feature)

```text
specs/002-extended-layouts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── extended-layout-contracts.md   # 8拡張レイアウトの構造契約
└── tasks.md             # /speckit-tasks 出力(本コマンドでは未作成)
```

### Source Code (repository root) — 既存への追加分

```text
styles/layouts/                    # 追加(8)
├── big-number.css  dashboard.css  timeline.css  matrix.css
└── process.css     quote.css      image-full.css  closing.css

slides/                            # 追加(8, 09〜16)
├── 09-big-number.html  10-dashboard.html  11-timeline.html  12-matrix.html
└── 13-process.html     14-quote.html      15-image-full.html 16-closing.html

index.html                         # 既存デックへ 8 スライドを追記(計16)
assets/                            # 全面ビジュアルのプレースホルダ(CSS/inline SVG、著作物は同梱しない)

scripts/
├── split-slides.mjs               # ORDER/TITLE マップを 16 種へ拡張(既存を更新)
└── check-practice-coverage.mjs    # 追加: practices.md 全手法が実演される(未実演0)を検証(SC-005)

tests/
├── visual/_fixtures.mjs           # LAYOUTS を 16 種へ拡張(既存を更新)
├── visual/coverage.spec.mjs       # 追加: 実演カバレッジ(SC-005)
└── (既存 layouts/annotations/accent/convertibility/print/a11y は 16 種を自動網羅)

docs/
└── practices.md                   # 変更なし(正本)。実演 ID は拡張スライドから参照
```

**Structure Decision**: feature 001 と同一プロジェクトへ**加算的に**追加する。既存の写像層・グリッド・スライドシェル・注釈機構・検証スクリプトは無改変で流用し、拡張は「新しいレイアウト CSS + スライド HTML + ショーケース追記 + カバレッジ検証」に限定する。`_fixtures.mjs` の `LAYOUTS` と `split-slides.mjs` のマップを 16 種へ広げることで、既存テスト(overflow/print/accent/annotations/a11y/convertibility)が拡張レイアウトも自動的に網羅する。

## Complexity Tracking

> Constitution Check に違反が無いため記載なし。
