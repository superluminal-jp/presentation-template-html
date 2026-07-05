# 検証結果記録(verification.md) — feature 004

**Date**: 2026-07-05 | **Feature**: 004-dashboard-slides-frame | 環境: ローカル(ネットワーク既定 deny)

## SC 別サマリ

| SC | 内容 | 手段 | 結果 |
|---|---|---|---|
| SC-001 | 全スライドに四隅フレーム4要素・一貫位置 | プレビュー実測 | **PASS**(20/20 に .slide__frame + 4要素、ページ 1/20…20/20) |
| SC-002 | フレーム/ダッシュボード配色がトークン由来・ハードコード0 | `npm run lint:tokens` | **PASS**(0 件) |
| SC-003 | 機密性 1/2/3 で表示が変わる | プレビュー実測(`PresFrame.setConfidentiality`) | **PASS**(文言「機密性N情報」+ トーン切替。fresh CSS で conf2=orange-50/orange-900 AA を確認) |
| SC-004 | ダッシュボード付録が grid KPI + 多系列 + 凡例・無崩れ | プレビュー実測 | **PASS**(overflow 0、KPI 4枚グリッド + 3系列棒 + 凡例) |
| SC-005 | カテゴリ配色 7 パレット由来・AA/識別可 | `contrast-tokens.mjs` | **PASS**(cat-1..7 白背景 3.88–8.64:1、機密性 AA) |
| SC-006 | 共通フレームが印刷で保持 | frame print CSS + print.spec | **設計 PASS**(`@media print` で display 保持、注釈は非表示)。実行は要ブラウザで委譲 |
| SC-007 | ガイドブック/DS/practices の整合記録 | `docs/dashboard-consistency.md` | **PASS**(3点で一致・差分明記) |

## 実行できた検証(この環境)

- `npm run lint:tokens` → PASS(frame.css / appendix.css / tokens.semantic.css 含む)
- `node tests/a11y/contrast-tokens.mjs` → PASS(カテゴリ配色 cat-1..7 ≥3:1、状態/機密性 AA)
- `npm run check:crossrefs` / `check:coverage` → PASS(37/37 維持)
- プレビュー(Chromium)実測: 20/20 フレーム4要素、ページ通し番号 1..20、機密性 1/2/3 切替、ダッシュボード overflow 0、全20スライド overflow 0

## 委譲(要 `npm install` + `npx playwright install chromium`)

- `tests/visual/frame.spec.mjs`(フレーム4要素・通し番号・機密性切替)
- `tests/print/print.spec.mjs`(印刷でフレーム保持のアサート追加)
- `tests/a11y/components-a11y.spec.mjs` ほか既存 axe/visual

## 実装メモ

- ページ番号はフレームに一本化(旧フッタの「N / M」「Appendix X」スパンは撤去)。
- 濃色地(表紙/クロージング=accent)ではフレーム文字を on-accent へ反転。
- ブラウザHTTPキャッシュにより新規トークン(`--conf*`/`--cat*`)がプレビューで即時反映されない事象を確認。ディスク/lint/fresh 取得では正常(CI クリーン環境で問題なし)。
- 単体スライドファイルにもフレーム(`split-slides` の head/foot に frame.css/js を追加)。
