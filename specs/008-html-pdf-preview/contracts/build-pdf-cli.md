# Contract: build:pdf / check:pdf CLI

PDF 確認フローが公開する実行インターフェース（コマンド契約）。

## `npm run build:pdf` → `scripts/pdf/build-pdf.mjs`

- **目的**: 正本デック `index.html` から `dist/deck.pdf` を生成する。
- **入力**:
  - 引数なしで既定動作。
  - `--png`（任意）: 併せて per-slide PNG を `dist/pdf-pages/NN.png` に出力。
  - `--out <path>`（任意）: 出力 PDF パス上書き（既定 `dist/deck.pdf`）。
- **処理契約**:
  - Chromium で `index.html` を `file://` で開く。
  - `emulateMedia({ media: 'print' })` を適用（既存 `@media print` を版面の正として使用）。
  - `page.pdf({ width: '1280px', height: '720px', printBackground: true })`。
- **出力**:
  - stdout: 生成先パスと生成ページ数（例: `[build:pdf] wrote dist/deck.pdf (25 pages)`）。
  - 終了コード: 成功 `0` / 失敗 非0。
- **副作用**: `dist/` を必要に応じ作成。`dist/deck.pdf` は追跡対象、per-slide PNG 等は追跡外。
- **不変条件**: 版面 CSS を新規に定義しない（`@media print` のみを使用）。

## `npm run check:pdf` → `scripts/pdf/check-pdf.mjs`

- **目的**: 生成 PDF が確認可能な状態か決定的に検証する。
- **前提**: 事前に `build:pdf` 実行（または内部で実行）。
- **検証契約**:
  1. `dist/deck.pdf` が存在し `byteLength > 1024`。
  2. PDF ページ数 == `index.html` の `.slide` セクション実数。
- **出力**:
  - PASS: `[check:pdf] PASS — N ページ（スライド N 件）と一致` / 終了コード 0。
  - FAIL: 不一致内容（期待 vs 実測）を stderr に出力 / 終了コード 1。
- **ハードコード禁止**: スライド枚数は都度 `index.html` から数える。
- **ページ計数方式**: PDF バイト列の `/Type /Page`（`/Pages` を除外）出現数。Chromium 出力前提。

## `verify` への結線

- `package.json` の `verify` チェーンに `build:pdf` → `check:pdf` を含める（既存 `test:print` の前後いずれか、決定的チェックとして）。
- 目的: 崩れ（枚数不一致・生成失敗）を CI/ローカル双方で継続検出（FR-009 / SC-002）。

## エラー時の振る舞い

- Chromium 未インストール時: 明確なメッセージで `npx playwright install chromium` を促し 非0 終了。
- 出力先書込不可: パスとともに失敗理由を stderr、非0 終了。
