# Quickstart: デジタル庁DS準拠 16:9 プレゼンテンプレート

**Feature**: 001-ds-presentation-template | **Date**: 2026-07-05

## 前提

- Node.js ≥ 18(トークン同期・検証スクリプト実行のため)
- モダンブラウザ(Chromium 推奨、印刷/PDF 検証)

## セットアップ(実装後の想定手順)

```bash
npm install                 # @digital-go-jp/design-tokens@2.0.1(厳密固定)を取得
npm run sync-tokens         # tokens/vendor/tokens.css を版指定で複製(不可侵層)
```

## 使う(著者)

1. `index.html` をブラウザで開く → 全8レイアウトのショーケースを確認。
2. 使いたいレイアウト(`slides/0X-*.html`)を複製し、スロットへ内容を差し込む。
   - 見出しは**アクションタイトル**(結論を1文)で書く。
   - 色/余白は**役割変数のみ**使用(`--accent` 等)。生の色値・px 直書きは不可。
3. 発表: 既定は注釈非表示。学習時はキー `a` で注釈トグル(設計意図と出典を表示)。
4. 図表: `chart` レイアウトの `.chart--sample`(規範例)を参考に、自作図は `.chart--placeholder` へ配置。
5. 配布: ブラウザの印刷 → PDF(1スライド=1ページ)。

## 検証(受け入れ基準の自動確認)

```bash
npm run lint:tokens    # SC-02: vendor以外の色/余白ハードコードを検出
npm run test:visual    # SC-01/07: 1280×720レンダリング・overflow・視覚回帰
npm run test:a11y      # SC-04: WCAG 2.2 AA コントラスト(axe-core)
npm run test:print     # SC-01: @media print で1スライド=1ページ
```

| コマンド | 対応 SC | 合格条件 |
|---|---|---|
| `lint:tokens` | SC-02 | ハードコード 0 件 |
| `test:visual` | SC-01, SC-07 | 8/8 overflow なし・視覚回帰差分 ≤0.1%/レイアウト(`maxDiffPixelRatio: 0.001`) |
| `test:a11y` | SC-04 | コントラスト違反 0 件 |
| `test:print` | SC-01 | 8 スライド = 8 ページ |
| 手動 | SC-03/05/06/08 | 注釈トグル/相互参照/アクションタイトル/`--accent`=#0031d8 |

## DS 更新の取り込み(SC-07 ランブック)

```bash
# 1) 依存を新版へ(明示操作)
npm install @digital-go-jp/design-tokens@<new>
npm run sync-tokens
# 2) 差分レビュー(vendor の CSS 変数差分)
git diff tokens/vendor/tokens.css
# 3) 必要なら styles/tokens.semantic.css のエイリアスのみ調整(レイアウトは触らない)
# 4) 視覚回帰
npm run test:visual
# 5) docs/ds-version-map.md を更新
```

## 成功の定義(Definition of Done, フェーズ1)

- 8レイアウト + ショーケース `index.html` が 1280×720 で崩れず表示され PDF 出力できる。
- 全視覚値が DS トークン由来(`lint:tokens` 合格)。`--accent` = #0031d8。
- 注釈が既定非表示・トグル可能(8/8)。
- コントラスト AA 合格。
- `docs/practices.md`(5群・出典付き)と巻末リファレンスが相互参照。
- DS 版更新をレイアウト無改修で反映できる。
