# Quickstart: 拡張スライドレイアウトセット

**Feature**: 002-extended-layouts | **Date**: 2026-07-05

feature 001 の基盤を前提とする(`npm install` / `npm run sync-tokens` 済み)。

## 使う(著者)

1. `index.html`(ショーケース)を開くと、コア8 + 拡張8 = 計16レイアウトが並ぶ。
2. 使いたい拡張レイアウト(`slides/09..16-*.html`)を複製し、スロットへ内容を差し込む:
   - **ビッグナンバー**: 単一指標 + 基準/比較(アンカー)。強調は1箇所。
   - **KPIダッシュボード**: タイル ≤6、注目1件に `.kpi--highlight`。
   - **タイムライン/プロセス**: 順序付きステップ ≤6、番号/矢印で順序を明示。
   - **2×2マトリクス**: 2軸ラベル + 4象限。
   - **引用・証言**: 引用文 + 出典/肩書き(事実ベース。捏造しない)。
   - **全面ビジュアル**: 画像枠(自前画像を配置)+ 重ね文字はスクリムで AA。
   - **クロージング**: 締めのメッセージ + CTA + 連絡先。
3. 発表は注釈非表示、学習時はキー `A` で設計意図と出典を表示。

## 検証(受け入れ基準)

```bash
npm run lint:tokens                 # SC-002(拡張CSSもハードコード0)
npm run check:crossrefs             # 注釈↔出典の相互参照
npm run check:coverage              # SC-005: practices.md 全手法が実演(未実演0)
node tests/a11y/contrast-tokens.mjs # SC-004(役割色)
npm run test:visual                 # SC-001/07(16種の overflow/回帰・要ブラウザ)
npm run test:a11y                   # SC-004(axe・要ブラウザ)
npm run test:print                  # SC-001(印刷1p・要ブラウザ)
```

| コマンド | 対応 SC | 合格条件 |
|---|---|---|
| `lint:tokens` | SC-002 | ハードコード 0 |
| `check:coverage` | SC-005 | 未実演手法 0(catalog 全 ID 実演) |
| `test:visual` | SC-001/07/08 | 16/16 overflow なし・回帰内 |
| `test:a11y` | SC-004 | コントラスト違反 0(重ね文字含む) |
| `test:print` | SC-001 | 16 スライド = 16 ページ |

## 成功の定義(DoD)

- 拡張8レイアウト + 単体ファイルが 1280×720 で崩れず表示・PDF出力できる。
- 全視覚値がトークン由来(`lint:tokens` 合格)。
- `check:coverage` が緑(practices.md 全手法が core+extended で実演)。
- 拡張レイアウトの注釈が既定非表示・トグル可能、コントラスト AA。
- レイアウト種別数が 16 に達し、すべてショーケース + 単体で提供。
