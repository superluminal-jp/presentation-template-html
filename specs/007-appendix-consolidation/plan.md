# Implementation Plan: コンポーネント集の付録一本化と PPTX 反映

**Branch**: `007-appendix-consolidation` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-appendix-consolidation/spec.md`

## Summary

独立ページ `components.html` を廃止し、その全コンポーネント実例をデッキ本体(`index.html`)の付録スライドに一本化する。現状、自作 12 種は付録 A〜C に概ね実演済みだが **区切り(divider)** が未実演、**DADS 公式 6 種は付録に未実演**(`components.html` のみ)。よって「付録の拡張(不足分の追加)→ 独立ページと参照の除去 → 数値表記の整合 → PPTX への付録追加」の順で進める。正典は `index.html`、`slides/*.html` は再生成物。

## Technical Context

**Language/Version**: 静的 HTML5 / CSS3 + 最小限のバニラ JS(ES modules)。ビルド系は Node.js。

**Primary Dependencies**: `@digital-go-jp/design-tokens@2.0.1`(pinned・vendored)/ `pptxgenjs`(PPTX 生成)/ `@playwright/test` + `@axe-core/playwright`(検証)。

**Storage**: N/A(ファイルベースの静的資産)。

**Testing**: Playwright(visual・a11y・print)+ 自作 Node チェック(`lint:tokens` / `check:crossrefs` / `check:coverage` / `check:slides`)。

**Target Platform**: モダンブラウザ(HTML デッキ)+ PowerPoint/Keynote(PPTX)。

**Project Type**: 静的サイト + ビルド/エクスポートスクリプト(単一リポジトリ)。

**Performance Goals**: N/A(生成物サイズ・描画は人間閲覧レンジ)。

**Constraints**: トークン準拠(ブランド値ハードコード 0)/ ネイティブ 1280×720 見切れ 0 / WCAG 2.2 AA / present モードは opt-in(既定 review)。

**Scale/Scope**: デッキ約 21→拡張後スライド、コンポーネント 18 種、PPTX 16→拡張後スライド。

## Constitution Check

*GATE: Phase 0 前に通過必須。Phase 1 後に再評価。*

プロジェクト憲章(`.specify/memory/constitution.md`)は未批准テンプレート。よって本リポジトリの確立済みエンジニアリング規範を de-facto ゲートとして適用する:

- **G1 トークン単一ソース**: すべての体裁はトークン参照。`lint:tokens` 緑(ブランド値ハードコード 0)。→ 遵守(既存 CSS を再利用、新規ハードコードなし)。
- **G2 正典と生成物の整合**: `index.html` を編集し `slides/*.html` は `split-slides.mjs` で再生成。`check:slides` 緑。→ 遵守。
- **G3 検証で挙動を担保**: 変更は既存スイート(visual/a11y/print + crossrefs/coverage)で検証。→ 遵守(baseline は意図変更として更新)。
- **G4 アクセシビリティ**: WCAG 2.2 AA(`test:a11y`)。→ 遵守。
- **G5 immutable vendor**: `tokens/vendor`・`vendor/dads-components` は不変・残置。→ 遵守(削除しない)。

**判定**: 違反なし。Complexity Tracking は空。

## Project Structure

### Documentation (this feature)

```text
specs/007-appendix-consolidation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output(コンポーネント台帳・付録/PPTX マッピング)
├── quickstart.md        # Phase 1 output(実装・検証手順)
├── contracts/
│   └── appendix-contract.md   # 付録の内容契約・不変条件
└── tasks.md             # /speckit-tasks で生成(本コマンドでは作成しない)
```

### Source Code (repository root)

```text
index.html                      # 正典デッキ。付録スライドを拡張(divider 追加・DADS 公式付録 追加)、
                                #   dads-components.css をリンク、コンポ点数表記を 18 に整合
slides/*.html                   # 生成物(split-slides.mjs で再生成)
components.html                  # 【削除】独立コンポーネント集
styles/
├── components.css              # 残置(付録が利用)
├── dads-components.css         # 残置 + index.html からリンク
└── layouts/appendix.css        # 付録の体裁(必要に応じ拡張)
vendor/dads-components/**        # 残置(付録に埋め込む公式マークアップの出所)
tokens/vendor/**                # 残置(不変)
scripts/
├── split-slides.mjs            # 付録追加後に再生成
└── pptx/build-pptx.mjs         # 付録スライドを追加(ネイティブ要素)
tests/
├── a11y/components-a11y.spec.mjs   # components.html 依存 → 付録(デッキ)へ再ポイント
├── a11y/focus-a11y.spec.mjs        # components.html 依存 → 付録の操作要素へ再ポイント
└── visual/*                        # ベースライン更新(意図変更)
README.md / CLAUDE.md            # components.html 参照除去・記述更新
```

**Structure Decision**: 既存単一リポジトリ構成を踏襲。新規ディレクトリは作らず、付録は `index.html` 内のスライド追加として実装する。

## Complexity Tracking

> Constitution Check に違反なし。記載事項なし。
