# Implementation Plan: HTML→PDF 生成物を Claude Code が確認・評価するフロー

**Branch**: `008-html-pdf-preview` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-html-pdf-preview/spec.md`

## Summary

正本デック `index.html` を、既存の `@media print`（1スライド=1ページ）を唯一の版面定義として PDF 化し、その PDF を **Claude Code 自身が**読み込んで各スライドの「描画破綻」と「設計意図適合」を評価・レポートする確認フローを追加する。実装の中核は 3 点: (1) Playwright で `page.pdf()` を行う再利用可能なビルドスクリプト（`npm run build:pdf` → `dist/deck.pdf`）、(2) PDF 生成成功とページ数=スライド枚数を検証する決定的な下地チェック（`verify` に組込）、(3) Claude Code の視覚評価手順とルーブリック（`contracts/evaluation-rubric.md`）＋構造化レポート様式。ブラウザ確認（P2）は可能な環境で Claude Code が Chromium を開いて観察する補助経路とする。新規ランタイム依存は追加しない（Playwright は既存 devDependency）。

## Technical Context

**Language/Version**: JavaScript (ES Modules) on Node.js（既存 `scripts/*.mjs` と同一運用）; 静的 HTML/CSS/最小 vanilla JS

**Primary Dependencies**: `@playwright/test`（chromium、既存 devDependency）を PDF 生成・ブラウザ観察に流用。新規依存なし（PDF パーサ等の追加を避ける）

**Storage**: ファイルシステム成果物 `dist/deck.pdf`（追跡対象）と、任意の per-slide PNG（追跡外）。`.gitignore` は `dist/*` を無視しつつ `!dist/sample-deck.pptx`・`!dist/deck.pdf` を例外として追跡

**Testing**: 既存 `verify` チェーン（Playwright + axe-core + node lint スクリプト）。決定的な下地チェックを追加し `test:print` 相当の枠へ組込

**Target Platform**: ローカル開発環境（Node + Chromium）。Claude Code は生成 PDF を Read ツール（`pages` パラメータ）で視覚的に読み込む

**Project Type**: 静的サイト＋ビルド/検証スクリプト群（`src/` は無く、`scripts/` と `tests/` 構成）

**Performance Goals**: PDF 生成は数秒オーダー。性能はクリティカルでない

**Constraints**: 版面は `@media print` を単一の正として再利用（二重定義禁止）。依存追加を避ける。生成 PDF は追跡（PPTX と同様）／PNG 等は追跡外。スライド枚数はハードコードせず `.slide` 実数に追随

**Scale/Scope**: 約 25 スライド（16 レイアウト＋付録 A–I）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` は未批准（テンプレートのプレースホルダのまま）。正式な条項ゲートは存在しないため、本リポジトリの事実上の運用原則（`CLAUDE.md` ＋ `.claude/rules/live-documentation.md`）を代替ゲートとして評価する:

| 原則（事実上） | 本計画の適合 |
|---|---|
| 単一情報源／二重定義禁止 | 版面は既存 `@media print` のみを正とし PDF を生成（FR-010）。PASS |
| トークン準拠（ハードコードのブランド値禁止） | 新 CSS を書かない（PDF は既存 print CSS を利用）。`lint:tokens` 不変。PASS |
| Live Documentation（同一変更で docs 更新） | README に確認フロー節を同一変更で追加（FR-012）。PASS |
| 検証で担保（Playwright/axe/lint） | 決定的下地チェックを `verify` に追加（FR-009）。PASS |
| 正本は `index.html`、`slides/*` は生成物 | 生成物へ手を加えない。PASS |

**Gate result: PASS**（違反なし。Complexity Tracking への記載事項なし）

## Project Structure

### Documentation (this feature)

```text
specs/008-html-pdf-preview/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output（評価レポート/成果物のエンティティ）
├── quickstart.md        # Phase 1 output（フロー起動〜評価手順）
├── contracts/
│   ├── evaluation-rubric.md   # Claude Code の評価契約（描画破綻＋設計適合＋レポート様式）
│   └── build-pdf-cli.md       # build:pdf の入出力契約
└── checklists/
    └── requirements.md  # spec 品質チェック（作成済み）
```

### Source Code (repository root)

本リポジトリは静的サイト＋スクリプト構成のため、既存レイアウトを踏襲し `scripts/pdf/` を新設する。

```text
index.html                     # 正本デック（変更なし）
styles/**                      # 既存 @media print を版面の正として利用（変更なし想定）
scripts/
├── pdf/
│   ├── build-pdf.mjs          # 新規: Playwright で index.html → dist/deck.pdf（+任意 PNG）
│   ├── check-pdf.mjs          # 新規: 決定的下地チェック（生成成功 + ページ数=スライド枚数）
│   └── README.md              # 新規: scripts/pptx/README.md に倣う近接ドキュメント
├── pptx/ …                    # 既存（無関係、参考構造）
└── split-slides.mjs …         # 既存
tests/
└── print/
    └── pdf-artifact.spec.mjs  # 新規（任意）: build:pdf 後の成果物条件を Playwright で回帰
dist/
└── deck.pdf                   # 生成物（追跡対象。.gitignore の !dist/deck.pdf で例外指定）
README.md                      # 確認フロー節を追記（近接ドキュメント）
package.json                   # scripts に build:pdf / check:pdf を追加、verify に結線
```

**Structure Decision**: 既存の `scripts/<domain>/` パターン（例: `scripts/pptx/`）に合わせ、PDF 関連を `scripts/pdf/` に集約。成果物は既存の `dist/` を再利用し、`sample-deck.pptx` と同様に `dist/deck.pdf` を `.gitignore` の例外として追跡する。テストは既存 `tests/print/` 配下に追加し、`verify` の `test:print` 経路に自然に含める。

## Complexity Tracking

> Constitution Check は PASS。正当化を要する違反はないため記載事項なし。
