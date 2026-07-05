# Phase 0 Research: スライド共通フレーム & ダッシュボード実践スライド

**Date**: 2026-07-05 | **Feature**: 004-dashboard-slides-frame

未解決 NEEDS CLARIFICATION は無し。判断は「フレーム配置/印刷」「機密性の区分と色」「ページ番号付与」「カテゴリ配色」「ガイドブック整合」。

## R1. 共通フレームの配置と印刷保持

- **Decision**: 各 `.slide` 直下に `.slide__frame`(絶対配置、四隅)を置く。`.slide__stage`(安全余白 32/48px の内側)の**外側の余白域**に配置し本文と重ならない(FR-005)。要素: 左下 `.frame__copyright` / 右下 `.frame__pageno` / 右上 `.frame__classification`(`.frame__scope` + `.frame__confidentiality`)。`@media print` で `display` を維持(注釈は非表示だがフレームは保持、FR-004)。
- **Rationale**: 四隅の絶対配置は本文グリッドから独立し、全レイアウトへ一律付与できる。
- **Alternatives**: フッタ内(`.slide__footer`)に統合 → レイアウトごとにフッタ有無が異なり不統一。

## R2. 機密性区分と色

- **Decision**: `data-confidentiality="1|2|3"` を `.slide`(または `:root`)に付与し、`.frame__confidentiality` の表示文言と注意色を切替。マッピング: **1=公開可(neutral/gray)**、**2=要保護(warning/orange 淡面+濃文字)**、**3=厳重(error/red 淡面+濃文字)**。既定サンプルは **2**。`.frame__scope` は「（組織名）限定」プレースホルダ。文字は AA(淡面+濃文字は feature 003 で検証済: orange 5.40 / red 5.14:1、neutral は text-primary/surface で高コントラスト)。
- **Rationale**: 政府の情報格付け(機密性1–3)の一般表記に沿い、上位区分ほど強い注意色。AA を pale+dark で担保。
- **Alternatives**: 濃色面+白文字 → 警告(黄系)で AA 未達リスク。3区分を常時併記 → 1文書1区分の実務に反する。

## R3. ページ番号の付与

- **Decision**: `js/frame.js` がデック(`.deck`)内の `.slide` を走査し `.frame__pageno` に「n / 総数」を自動設定。単体スライドファイルは総数1のため当該番号/プレースホルダを表示。既存の各レイアウト内 `slide__footer` の「X / 16」表記は撤去し、ページ番号はフレームに一本化(重複回避)。
- **Rationale**: 通し番号を機械付与し、スライド増減に追従(SC-001/FR-003)。
- **Alternatives**: 手動採番 → 増減で崩れる。

## R4. カテゴリ配色(多系列)

- **Decision**: 写像層に `--cat-1..7` を DS 7 パレット由来で定義(ガイドブックと同系): 1=`--color-key-800`(blue)、2=`--color-primitive-light-blue-700`、3=`--color-primitive-cyan-800`、4=`--color-primitive-green-700`、5=`--color-primitive-orange-700`、6=`--color-primitive-red-700`、7=`--color-neutral-solid-gray-600`。各色はチャート面として白背景に対し **≥3:1**(グラフィック要素)を満たす色調を選択。`contrast-tokens.mjs` で検証し、未達は 1 段濃い階調へ調整。
- **Rationale**: ガイドブックの 7 標準パレット=DS プリミティブと一致。役割変数化で DS 更新耐性を維持。
- **Alternatives**: 任意色の付番 → トークン非準拠・整合崩れ。

## R5. ダッシュボードのグリッド整列(ガイドブック準拠)

- **Decision**: KPI カード(`.kpi`/`.tile` 流用)を 12 カラムグリッドに整列(例: 4枚×3col または 3枚×4col)。多系列チャートは棒/折れ線を `--cat-*` で塗り、凡例(`.legend`)を併記。チャート選択は practices C 群(Cleveland–McGill/データインク)に沿った Do を実演し、注釈で明示。
- **Rationale**: ガイドブックの「グリッド線に沿わせる」「必要な情報を見せる」原則を、既存グリッド + コンポーネントで実現。
- **Alternatives**: 自由配置 → ガイドブック非準拠。

## R6. 整合の確認(ガイドブック × DS × practices)

- **Decision**: `docs/dashboard-consistency.md` に、(a) 7 パレット↔DS プリミティブの対応、(b) チャート指針↔practices C 群の対応、(c) グリッド整列↔本テンプレのグリッド、(d) 差分と対応、を表で記録(SC-007/FR-010)。
- **Rationale**: 整合を検証可能な形で残す(Live Documentation)。
- 出典: [デジタル庁 ダッシュボードデザイン実践ガイドブック](https://www.digital.go.jp/resources/dashboard-guidebook)。

## 未解決事項

なし。法的な情報格付け判断は利用組織の規程に委ねる(テンプレートは表示枠を提供、spec Assumptions 参照)。
