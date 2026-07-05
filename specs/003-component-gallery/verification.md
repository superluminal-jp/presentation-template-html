# 検証結果記録(verification.md) — feature 003

**Date**: 2026-07-05 | **Feature**: 003-component-gallery | 環境: ローカル(ネットワーク既定 deny)

## SC 別サマリ

| SC | 内容 | 手段 | 結果 |
|---|---|---|---|
| SC-001 | ≥10 部品(見本+用途注記) | components.html 目視/構造 | **PASS**(12部品収録) |
| SC-002 | 部品CSSがトークン由来・ハードコード0 | `npm run lint:tokens` | **PASS**(0 件) |
| SC-003 | 部品の AA(状態色含む) | `contrast-tokens.mjs`(状態色ペア追加)+ axe(要ブラウザ) | **PASS(役割/状態色)**。axe 実行は委譲 |
| SC-004 | 代表部品をスライドへ差し込んで崩れない | プレビュー実測(body スライドに .callout) | **PASS**(overflow 0) |
| SC-005 | README/ショーケースから到達 | リンク存在(README + index ツールバー) | **PASS** |
| SC-006 | コピー用マークアップ併記 | components.html 目視 | **PASS**(各部品に `<pre><code>`) |

## 実行できた検証(この環境)

- `npm run lint:tokens` → PASS(components.css 含む)
- `node tests/a11y/contrast-tokens.mjs` → PASS(状態色ペア success 7.34 / warning 5.40 / error 5.14:1 を含む全 AA)
- プレビュー(Chromium)実測: components.html レンダリング、body スライドへの .callout 差し込みで overflow 0

## 委譲(要 `npm install` + `npx playwright install chromium`)

- `npm run test:a11y`(`tests/a11y/components-a11y.spec.mjs`: components.html の axe color-contrast)

## 収録コンポーネント(12)

callout / badge / tag / btn / data-table / progress / stat / legend / divider / checklist / pull-quote / kv
