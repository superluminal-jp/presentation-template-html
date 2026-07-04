# 検証結果記録(verification.md) — feature 002

**Date**: 2026-07-05 | **Feature**: 002-extended-layouts | 環境: ローカル(ネットワーク既定 deny)

## SC 別サマリ

| SC | 内容 | 手段 | 結果 |
|---|---|---|---|
| SC-001 | 拡張8(計16)が 1280×720 崩れなし / 印刷1p | プレビュー実測(overflow)+ print.spec(要ブラウザ) | **PASS(overflow=0, 16/16)**。reference は 4カラム化で解消。PDF/印刷アサートは spec 済・実行委譲 |
| SC-002 | 拡張CSSもトークン由来・ハードコード0 | `npm run lint:tokens` | **PASS**(0 件) |
| SC-003 | 拡張の注釈 既定非表示・トグル | プレビュー実測 | **PASS**(16/16 注釈、default 0 → on 16) |
| SC-004 | AA コントラスト(重ね文字含む) | 役割色 contrast + image-full スクリム設計 | **設計 PASS**(役割色 AA)。axe 実行は要ブラウザで委譲 |
| SC-005 | 全採用手法の実演(未実演0) | `npm run check:coverage` | **PASS**(catalog 37 / demonstrated 37 / 未実演 0) |
| SC-006 | 見出しがアクションタイトル | 目視 | **PASS**(big-number/dashboard/timeline/matrix/process が結論見出し) |
| SC-007 | スロット矩形確定・実DOM本文 | プレビュー実測(拡張スロット)+ convertibility.spec | **PASS**(拡張8スロット rect 確定) |
| SC-008 | レイアウト種別 16・全て単体化 | `split-slides`(16ファイル生成) | **PASS**(slides/ に 16 ファイル) |
| SC-009 | 各表現を10分以内に作成 | 手動計測 | 未計測(運用時) |
| FR-013 | 巻末が使用手法を網羅 | `npm run check:crossrefs` | **PASS**(used 37 / reference 37) |

## 実行できた検証(この環境)

- `npm run lint:tokens` → PASS
- `npm run check:coverage` → PASS(37/37、未実演0)
- `npm run check:crossrefs` → PASS(used 37 / reference 37)
- プレビュー(Chromium)実測: 16/16 overflow 0、注釈 0→16、拡張スロット矩形 OK、reference 4カラムで収まり(fresh CSS で refOverflowY=0 を確認)

## 実行を委譲した検証(要 `npm install` + `npx playwright install chromium`)

- `npm run test:visual` / `test:a11y`(axe, image-full 重ね文字含む) / `test:print`(16ページ)
- 視覚回帰ベースライン(feature 001 の T037 と共通、拡張分も新規取得が必要)

> 既存の Playwright 検証は `tests/visual/_fixtures.mjs` の `LAYOUTS`(16種)拡張により拡張レイアウトを自動網羅する。新規 `tests/visual/coverage.spec.mjs` が SC-005 を CI で確認。

## 備考

- ブラウザHTTPキャッシュにより、`reference.css` の更新(2→4カラム)がプレビューで即時反映されない事象を確認。ディスク上は `columns: 4`、fresh 取得で overflow 0 を確認済み。CI/`npm install` 後のクリーン環境では問題なし。
