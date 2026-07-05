# Implementation Plan: スライド共通フレーム & ダッシュボード実践スライド

**Branch**: `004-dashboard-slides-frame` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

## Summary

feature 001–003 の基盤(vendor トークン v2.0.1 / セマンティック写像層 / コンポーネント / 検証ハーネス)を再利用し、(1) 全スライドに四隅の**共通フレーム**(左下 Copyright・右下 ページ番号・右上 取扱区分〈組織限定 + 機密性1/2/3〉)を付与、(2) デジタル庁ダッシュボード実践ガイドブック準拠の**ダッシュボード付録スライド**(グリッド整列 KPI カード + 多系列チャート + 凡例)を追加する。多系列の**カテゴリ配色**は DS の 7 パレット(solid-gray/blue/light-blue/cyan/green/orange/red)由来の役割変数として定義。機密性区分は `data-confidentiality="1|2|3"` で切替、区分別注意色は AA。フレームは注釈と異なり**印刷でも保持**。整合(ガイドブック/DS/practices C 群)を `docs/dashboard-consistency.md` に記録。既存の lint/contrast/Playwright を流用し、フレーム/配色の検証を追加。

## Technical Context

**Language/Version**: HTML5 / CSS3(カスタムプロパティ)/ 最小限 Vanilla JS(ページ番号付与 + 機密性トグル)。Node.js ≥ 18(検証)。
**Primary Dependencies**: 追加なし。既存トークン・写像層・コンポーネント。
**Storage**: N/A。
**Testing**: 既存 `lint-tokens`(styles/ 自動網羅)/ `contrast-tokens.mjs`(機密性注意色 + カテゴリ配色ペアを追加)/ Playwright(フレーム4要素の存在・印刷保持・ダッシュボード overflow)。
**Target Platform**: 主要ブラウザ最新版 + 印刷/PDF。
**Project Type**: 静的フロントエンド(001–003 と同一プロジェクト)。
**Constraints**: トークン由来のみ(ハードコード禁止)、WCAG 2.2 AA、16:9、フレームは四隅余白で本文非重複・印刷保持、ダッシュボードはグリッド整列。
**Scale/Scope**: 全スライドへフレーム付与、ダッシュボード付録 1–2 枚、7 パレットのカテゴリ配色、整合記録。

## Constitution Check

憲章未批准。派生ゲートで評価:
| ゲート | 判定 | 根拠 |
|---|---|---|
| トークン単一源泉 | PASS | lint 自動網羅(SC-002) |
| アクセシビリティ AA | PASS | 機密性注意色/カテゴリ配色を contrast 検査(SC-005) |
| 簡素性(FW非依存) | PASS | 既存機構 + 最小 JS |
| 更新耐性 | PASS | 役割変数のみ参照 |
| 配布物適合(取扱区分の印刷保持) | PASS | フレームは `@media print` で保持(FR-004) |

違反なし → Complexity Tracking 空。

## Project Structure

```text
styles/
├── frame.css                     # 追加: 四隅共通フレーム(取扱区分/Copyright/ページ番号)
├── tokens.semantic.css           # 追加: カテゴリ配色 --cat-1..7(7パレット) + 機密性注意色ロール
└── layouts/dashboard.css         # 追加/拡張: ガイドブック準拠の KPI カード/多系列チャート整形

js/
└── frame.js                      # 追加: デック内ページ番号の自動付与 + 機密性区分の適用

index.html                        # 全スライドへ frame 要素を付与、frame.css/js を読込、ダッシュボード付録を追加
slides/*.html                     # 単体ファイルにもフレーム(split-slides のテンプレに frame を反映)

docs/
└── dashboard-consistency.md      # 追加: ガイドブック × DS × practices の整合記録(SC-007)

tests/
├── a11y/contrast-tokens.mjs      # 機密性注意色 + カテゴリ配色ペアを追加
└── visual/frame.spec.mjs         # 追加: 全スライドにフレーム4要素・印刷保持・ページ通し番号
```

**Structure Decision**: 001–003 と同一プロジェクトへ加算。フレームは各 `.slide` 直下の `.slide__frame`(四隅絶対配置、`.slide__stage` の外=四隅余白域)として追加し、本文と重ならない。`split-slides.mjs` の単体テンプレにもフレームを含め、単体表示でも体裁一致。カテゴリ配色・機密性注意色は写像層に集約(DS 更新耐性を維持)。ダッシュボード付録は既存 `.slide--appendix` 系に KPI カード/多系列チャートを加えた実例。

## Complexity Tracking

> 違反なし。記載なし。
