# Implementation Plan: レイアウト描画の修正と構図の統一

**Branch**: `009-layout-render-fixes` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-layout-render-fixes/spec.md`

## Summary

PDF レビューで検出した (1) 凡例スウォッチ色の系列不一致(付録D 等)と (2) 濃色地スライドのフレーム文字不可読(全面画像)の2バグを是正し、(3) 本文が縦中央に沈む構図の癖を上詰め既定へ統一、(4) ビッグナンバーの数値を主役として際立たせる。実装は既存 CSS(役割変数=DS トークン参照)への限定的な変更のみで、HTML 構造・スライド枚数・`@media print` 単一ソースは不変。検証は既存 `npm run verify`(トークン lint + Playwright 視覚/a11y/印刷 + PDF ページ数)で担保する。

## Technical Context

**Language/Version**: 静的 HTML5 / CSS3 + 最小限のバニラ JS(ビルドステップなし)

**Primary Dependencies**: `@digital-go-jp/design-tokens@2.0.1`(ピン留め・vendored・不変)。検証に Playwright + `@axe-core/playwright`。新規ランタイム依存なし。

**Storage**: N/A(静的資産)

**Testing**: `npm run verify` = `lint:tokens` → `check:crossrefs` → `check:coverage` → `check:slides` → `test:visual` → `test:a11y` → `test:print` → `build:pdf` → `check:pdf`

**Target Platform**: モダンブラウザ(画面=review モード)+ 印刷/PDF(1スライド=1ページ)

**Project Type**: Single project(静的プレゼンテンプレート)

**Performance Goals**: N/A(描画品質・体裁の是正が目的)

**Constraints**: DS トークン準拠・ハードコード0(`lint:tokens`)・WCAG 2.2 AA・キャンバス 1280×720 固定の安全余白内・PDF ページ数 == ライブ `.slide` 数・`@media print` は変更不可

**Scale/Scope**: 既存25スライド。変更対象は CSS 6〜8ファイル程度(`frame.css`・`appendix.css`・`slides.css`/`grid.css` いずれか + 各レイアウト `big-number/summary/process/timeline/chart` 等)。HTML 変更は原則なし(P3 の CTA 折り返しで `index.html` の軽微調整が入り得る)。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` は未批准のテンプレート(プレースホルダのみ)。具体条項が無いため、`CLAUDE.md` のプロジェクト規約を de-facto ゲートとして適用する:

- **G1 トークン準拠**: 生の色/px を新規導入しない(`lint:tokens` 通過)。→ 全変更で遵守。`calc(var(--font-size-*) * N)` は raw px/hex を含まず lint 対象外(font-size は spacing プロパティでない)ため許容。
- **G2 アクセシビリティ**: WCAG 2.2 AA を維持/改善(`test:a11y`)。→ FR-003 で改善。
- **G3 正本の単一性**: `slides/*.html` は生成物。手編集せず `index.html` を正本とする。→ HTML 変更が生じる場合は `index.html` のみ、`check:slides` で整合確認。
- **G4 印刷不変**: `@media print` の 1スライド=1ページと PDF ページ数不変(`check:pdf`)。→ 変更しない。
- **G5 発表モード非回帰**: 既定 review・ネイティブ寸法の視覚回帰を維持。→ `test:visual` で担保。

**判定**: 違反なし。Complexity Tracking 記入不要。

## Project Structure

### Documentation (this feature)

```text
specs/009-layout-render-fixes/
├── plan.md              # This file
├── research.md          # Phase 0 output — 4件の設計判断
├── data-model.md        # Phase 1 output — レイアウト調整インベントリ
├── quickstart.md        # Phase 1 output — 適用と目視/自動検証の手順
├── contracts/
│   └── verification.md   # Phase 1 output — 不変条件と受け入れチェック
├── checklists/
│   └── requirements.md   # /speckit-specify で作成済み
└── tasks.md             # Phase 2 output(/speckit-tasks で作成 — 本コマンドでは作らない)
```

### Source Code (repository root)

```text
index.html                         # 正本デック(P3 の CTA 折り返しのみ触れる可能性)
styles/
├── frame.css                      # [変更] 濃色地の文字反転に .slide--image-full を追加(US1/FR-003)
├── layouts/
│   └── appendix.css               # [変更] .legend__swatch--cat* の詳細度を引き上げ(US1/FR-001,002)
├── components.css                 # [参照] .legend__swatch 既定色の出所(衝突源)
├── grid.css / slides.css          # [参照] .slide__stage 行構成(縦位置既定の基盤)
└── layouts/
    ├── big-number.css             # [変更] 数値スケール拡大 + 数値/内訳の近接化(US2/FR-006)
    ├── summary.css                # [変更] align-content:center → start(US2/FR-004)
    ├── process.css                # [変更] .process align-self:center → start(US2/FR-004)
    ├── timeline.css               # [変更] .timeline align-self:center → start(US2/FR-004)
    ├── chart.css                  # [変更] chart/takeaway の縦位置を上寄せ(US2/FR-004)
    └── appendix.css(F/H)          # [変更/任意] 疎スライドの密度調整(US3/FR-007)
tests/                             # 既存の visual / a11y / print を再利用(新規テストは最小)
scripts/pdf/                       # build:pdf / check:pdf(不変・再実行のみ)
```

**Structure Decision**: 単一プロジェクトの既存 CSS を局所修正する。新規ファイル・新規依存は作らない。レイアウトごとの縦位置は「本文帯(行2)の配置指定」を上寄せへ統一しつつ、中央寄せが設計意図の `section`/`quote`/`big-number` は除外する(FR-005)。行1(見出し)・行3(フッタ)のグリッド構造(`grid.css` の `auto 1fr auto`)は変更しない。

## Complexity Tracking

> Constitution Check に違反なし。記入不要。
