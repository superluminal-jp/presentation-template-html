# Implementation Plan: 再利用コンポーネント集ページ

**Branch**: `003-component-gallery` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

## Summary

feature 001/002 の基盤(vendor トークン v2.0.1 / セマンティック写像層 / 検証ハーネス)を再利用し、スライドへ差し込める再利用 UI コンポーネント(≥10)を `styles/components.css`(役割変数のみ)で定義し、参照ページ `components.html` に見本 + 用途注記 + コピー用マークアップ付きで収録する。部品は自己完結クラスでスライドのグリッドに非依存。README とショーケース(`index.html` ツールバー)から辿れるようにする。既存 `lint-tokens` が `styles/` を走査するため部品CSSのハードコード検証は自動で効く。AA は役割色設計 + 状態色の contrast 事前検査で担保。

## Technical Context

**Language/Version**: HTML5 / CSS3(カスタムプロパティ)。JS は不要(静的)。Node.js ≥ 18(検証)。
**Primary Dependencies**: 追加なし。既存トークン・写像層を再利用。
**Storage**: N/A。
**Testing**: 既存 `lint-tokens`(styles/components.css を自動網羅)+ `contrast-tokens.mjs` に状態色ペアを追加 + `tests/a11y/components-a11y.spec.mjs`(axe, components.html)。
**Target Platform**: 主要ブラウザ最新版 + 印刷。
**Project Type**: 静的フロントエンド(001/002 と同一プロジェクト)。
**Constraints**: トークン由来のみ(ハードコード禁止)、WCAG 2.2 AA、部品はスライドグリッド非依存で差し込み可能。
**Scale/Scope**: コンポーネント ≥10、`components.html` 参照ページ、README/ショーケース導線。

## Constitution Check

憲章未批准。派生ゲートで評価: トークン単一源泉(PASS: lint 自動網羅)/ AA(PASS: 役割色 + 状態色 contrast)/ 簡素性(PASS: 静的CSS・新規依存なし)/ 更新耐性(PASS: 役割変数のみ)。違反なし → Complexity Tracking 空。

## Project Structure

```text
styles/components.css              # 追加: 全コンポーネントの部品クラス(役割変数のみ)
components.html                    # 追加: コンポーネント集ページ(見本 + 注記 + コピー用コード)
index.html                        # ツールバーに components.html へのリンク追記
README.md                         # コンポーネント集への導線追記
tests/
├── a11y/contrast-tokens.mjs      # 状態色ペア(success/warning/error on surface)を追加
└── a11y/components-a11y.spec.mjs # 追加: components.html の axe コントラスト検査

specs/003-component-gallery/
├── plan.md research.md data-model.md quickstart.md contracts/component-contracts.md tasks.md
```

**Structure Decision**: 001/002 と同一プロジェクトへ加算。部品は BEM 風の自己完結クラス(`.callout`,`.badge`,`.tag`,`.btn`,`.data-table`,`.progress`,`.stat`,`.legend`,`.divider`,`.checklist`,`.pull-quote`,`.kv`)で、スライド内・ページ内どちらでも同一の見た目になる。

## Complexity Tracking

> 違反なし。記載なし。
