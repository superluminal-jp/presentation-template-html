# 評価レポート: deck.pdf（Claude Code による確認）

**日付**: 2026-07-13 **入力**: `dist/deck.pdf`（25 ページ）を Read ツールの `pages` で全ページ読込
**基準**: [contracts/evaluation-rubric.md](./contracts/evaluation-rubric.md) A（描画破綻）/ B（設計適合）
**下地チェック**: `npm run check:pdf` → PASS（25 ページ == スライド 25 件）

## スライド単位の所見

| slide | render | design | findings |
|---|---|---|---|
| 01-title | PASS | PASS | — |
| 02-toc | PASS | PASS | — |
| 03-section | PASS | PASS | — |
| 04-body | PASS | PASS | — |
| 05-compare | PASS | PASS | — |
| 06-chart | PASS | PASS | — |
| 07-summary | PASS | PASS | — |
| 08-big-number | PASS | PASS | ビッグナンバー「16」は最大要素だが強調はやや控えめ（設計意図の範囲内） |
| 09-dashboard | PASS | PASS | 6 タイル・注目1件強調・付録スライド数 9 に整合 |
| 10-timeline | PASS | PASS | — |
| 11-matrix | PASS | PASS | — |
| 12-process | PASS | PASS | — |
| 13-quote | PASS | PASS | — |
| 14-image-full | PASS | PASS | ⚠ 四隅フレームの補助テキスト（「（組織名）限定」「© 2026」）が暗いスクリム上で低コントラスト。主キャプションは白文字で良好。要監視 |
| 15-closing | PASS | PASS | — |
| 16-reference | PASS | PASS | 4 カラムで密だが判読可 |
| 17-appendix-A | PASS | PASS | callout/badge/tag/btn/divider 正常 |
| 18-appendix-B | PASS | PASS | 表・プログレス・凡例・要約値 正常 |
| 19-appendix-C | PASS | PASS | checklist/kv/pull-quote/stat 正常 |
| 20-appendix-D | PASS | PASS | KPI カード＋多系列バー（直接ラベル）正常 |
| 21-appendix-E | PASS | PASS | 折れ線/積上げ/ドーナツ/散布図 正常 |
| 22-appendix-F | PASS | PASS | banner/step-nav 正常 |
| 23-appendix-G | PASS | PASS | DADS card/list/breadcrumb 正常 |
| 24-appendix-H | PASS | PASS | DADS checkbox/radio/progress 正常 |
| 25-appendix-I（grid-guide） | PASS | PASS | 12カラム×3行の下地・スパン例・仕様凡例 正常（feature 008 で追加） |

## 集計

- `total`: 25 / `renderFail`: 0 / `designFail`: 0 / `uneval`: 0
- **verdict**: 合格（描画破綻 0・設計不適合 0）。ただし 14-image-full にフレーム補助テキストの低コントラストという**設計上の要監視事項**が 1 件。

## ブラウザ観察（US2 / 可能な環境）

Chromium で `index.html` を開き、PDF に現れない対話挙動を Claude Code が観察：

- **注釈トグル ON（A）**: 設計意図の注釈パネルが表示され、各手法が `practices.md` へのリンク付きで出る（表示件数 16）。表紙では「視覚階層 / フック&スルーライン」が確認できた。→ 描画・設計の意図が可視化され所見と整合。
- **発表モード ON（P）**: `data-mode=present` に遷移し、単一スライドが中央に拡大表示（アクティブ 1 枚）、ツールバーは非表示、四隅フレームは保持。→ 対話挙動は既存仕様どおり正常。

いずれも描画破綻なし。ブラウザ観察は PDF 評価（US1）を補完し、結論を変えない（総合判定は合格のまま）。

## 注入不備の検出検証（US3 / T014, SC-003・SC-004）

01-title に一時的にオーバーフロー要素（`height:1400px`）を注入して確認フローを実行：

- **check:pdf（決定的）**: `overflow:hidden` により内容はクリップされページ分裂は起きないため、ページ数 25 == スライド 25 で **PASS**（＝枚数不変の不備は検出できないケース）。
- **Claude Code 視覚評価（本フローの主眼）**: 再生成 PDF の 1 ページ目を読むと、タイトル・サブタイトル・メタが版面外へ押し出されて消失し、四隅フレームのみ残存 → **描画破綻として即検出**。
- 検証後に `git checkout index.html` で注入を復元し、`build:pdf`／`check:pdf` が PASS に戻ることを確認（誤検出 0・SC-004）。

**結論**: 決定的チェックが見逃す種類の描画破綻（クリップ/押し出し）を、Claude Code の視覚評価が捕捉できることを実証。両者は相補的（枚数不変=check:pdf、視覚崩れ=Claude Code）。

## 補足

- 14-image-full の低コントラストは feature 008 以前からの既存挙動であり、本フローが**検出できた**こと自体が確認能力の実証。修正は別課題（暗背景時のフレーム文字色の適応）として切り出すのが妥当。
- 全ページで共通フレーム（取扱区分・著作権・ページ番号）が保持され、注釈レイヤーの混入は 0 件。
- 版面は既存 `@media print`（1スライド=1ページ）から生成、PDF ページ数＝スライド枚数が一致。
