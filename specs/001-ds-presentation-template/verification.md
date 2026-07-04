# 検証結果記録(verification.md)

**Date**: 2026-07-05 | **Feature**: 001-ds-presentation-template | 環境: ローカル(ネットワーク既定 deny)

実装フェーズで実施した検証の結果。ブラウザDL/npm install を要する Playwright/axe 実行は、その旨を明記して後続(CI/ローカル `npm install` 後)に委譲。node 単体・プレビュー実測で確認できたものは実測結果を記載。

## SC 別サマリ

| SC | 内容 | 手段 | 結果 |
|---|---|---|---|
| SC-01 | 8レイアウト 1280×720 崩れなし / 印刷1p | プレビュー実測(overflow) + print.spec(実行は要ブラウザ) | **PASS(overflow=0, 8/8)**。PDF/印刷アサートは spec 作成済み・実行は委譲 |
| SC-02 | 全視覚値がトークン由来・ハードコード0 | `node scripts/lint-tokens.mjs` | **PASS**(0 件) |
| SC-03 | 注釈 既定非表示・8/8 トグル | プレビュー実測(`toggleAnnotations`) | **PASS**(default 0 → on 8 → off 0、8/8 スライドに注釈) |
| SC-04 | WCAG 2.2 AA コントラスト | `node tests/a11y/contrast-tokens.mjs`(役割色) | **PASS**(12.63 / 5.74 / 8.64 / 8.64:1)。axe 実行は要ブラウザで委譲 |
| SC-05 | 採用手法が出典付き・相互参照 | `node scripts/check-crossrefs.mjs` | **PASS**(catalog 37 / used 18 / reference 18、リンク切れ0) |
| SC-06 | 見出しがアクションタイトル | 目視(プレビュー) | **PASS**(本文/比較/図表/まとめ 等が結論文見出し) |
| SC-07 | DS更新をレイアウト無改修で追従 | 構造(vendor/写像層分離)+ ds-update.spec / baseline | **設計・spec 完了**。視覚回帰ベースライン取得は要ブラウザで委譲(T037) |
| SC-08 | 配色が HP キー色一致 | プレビュー実測(`--accent`) | **PASS**(`#0031d8` = key-800) |
| SC-09 | 10枚デックを30分以内 | 手動計測(手順は T044 に明記) | 未計測(運用時に測定) |
| SC-10 | 注釈のみで手法識別 ≥90% | 手動計測(被験者 n≥3) | 未計測(運用時に測定) |
| FR-012 | PPT 変換可能性(スロット矩形確定・実DOM本文) | プレビュー実測 | **PASS**(全スロット rect 確定・本文実DOM) |
| FR-013 | 巻末が全出典を網羅 | `check-crossrefs`(used ⊆ reference) | **PASS** |

## 実行できた検証(この環境)

- `npm run lint:tokens` → PASS
- `npm run check:crossrefs` → PASS
- `node tests/a11y/contrast-tokens.mjs` → PASS
- プレビュー(Chromium)での実測: overflow 0(8/8)、`--accent=#0031d8`、注釈 0→8→0、スロット矩形・実DOM本文 OK

## 実行を委譲した検証(要 `npm install` + `npx playwright install chromium`)

- `npm run test:visual`(layouts / deck 視覚回帰・T024/T043)
- `npm run test:a11y`(axe color-contrast・T028)
- `npm run test:print`(1スライド=1ページ・PDF スモーク・T025)
- 視覚回帰ベースライン取得(T037)と DS 更新耐性(T038)

> これらは spec ファイルを作成済み。`npm install` 後に `npm run verify` で一括実行できる。
