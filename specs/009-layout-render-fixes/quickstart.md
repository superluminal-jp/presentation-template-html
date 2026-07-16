# Quickstart: レイアウト描画の修正と構図の統一

## 前提

- 依存導入済み(`npm install`)。ブランチ `009-layout-render-fixes`。
- 正本は `index.html`。`slides/*.html` は生成物(手編集禁止)。

## 適用の流れ(推奨順)

1. **P1 バグ(US1)を先に**
   - `styles/layouts/appendix.css`: `.legend__swatch--cat*` の詳細度を引き上げ(D1/A1・A2)。
   - `styles/frame.css`: 濃地反転リストに `.slide--image-full` を追加(D2/B1)。
2. **再ビルドで確認**
   ```sh
   npm run build:pdf
   ```
   `dist/deck.pdf` を開き、付録D 凡例色(青/緑/橙)と全面画像フレームの判読を確認(AC-1/AC-2)。
3. **P2 構図(US2)**
   - `summary.css` / `process.css` / `timeline.css` / `chart.css` を上寄せへ(C1〜C4)。
   - `big-number.css` を数値拡大 + 近接化(C5)。倍率 N は目視で仮置き→視覚回帰で確定。
   - **除外**: `section` / `quote` / `big-number` の中央寄り意図は変えない(C0/FR-005)。
4. **P3 仕上げ(US3・任意)**
   - 付録F/H の密度、クロージング CTA の折り返し、表紙構図(E1〜E3)。
5. **フル検証**
   ```sh
   npm run verify
   ```
   全通過を確認(トークン lint・視覚・a11y・印刷・PDF ページ数)。

## 目視チェックの要点

- **色**: 系列を使う凡例(付録D・E)は必ず系列と同色。中立凡例(当月/前月/目標)は変えない。
- **縦位置**: 見出し直下から本文が始まるか(短文スライド)。
- **見切れ**: 上寄せ後に行3(フッタ)へめり込まないか(出典・ダッシュボード等の詰まったスライド)。
- **ページ数**: `check:pdf` が「PDF ページ数 == `.slide` 数」で通ること。

## つまずきどころ

- `lint:tokens` 失敗 → 生 px/hex を入れていないか。`calc(var(--font-size-64)*N)` は可、`104px` 等の直値は不可。
- `test:visual` 失敗 → 意図した構図変更ならスナップショット更新、意図せぬ差分なら修正。
- 凡例が直らない → 詳細度が基底(0,1,0)を上回っているか(0,2,0 以上)を確認。
