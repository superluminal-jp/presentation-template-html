# Phase 0 Research: レイアウト描画の修正と構図の統一

4件の設計判断を確定する。いずれも既存コードの根本原因に基づく。

## D1: 凡例スウォッチの系列色一致(FR-001/002)

**Decision**: `styles/layouts/appendix.css` の系列凡例修飾子を、詳細度を1段上げたセレクタ(例 `.legend .legend__swatch--cat1/2/3`)に変更する。基底の既定色は据え置く。

**Rationale**: 現状 `.legend__swatch{background:var(--accent)}`(`components.css:111`)と `.legend__swatch--cat2/--cat3`(`appendix.css:34-35`)は同一詳細度(0,1,0)。`components.css` は `index.html` で `appendix.css`(28行目)より後(30行目)に読み込まれるため、基底が後勝ちで系列修飾子を上書きし、cat2(緑)/cat3(橙)が accent(青)に化ける(cat1 は元から青のため露見しない)。詳細度を 0,2,0 へ上げれば読み込み順に依存せず修飾子が勝つ。中立スウォッチ(`--muted`/`--surface`)は同一ファイル内で基底の後に定義されており影響を受けない(FR: 中立凡例は不変)。

**Alternatives considered**:
- リンク順の入れ替え(appendix を後ろへ) → 全レイアウトのカスケードに副作用が及ぶため却下。
- 基底 `.legend__swatch` の既定 background を撤去 → `--muted`/`--surface` 以外の素の凡例が無色になる回帰リスクで却下。
- `!important` → 保守性を損なうため却下。

## D2: 濃色地スライドのフレーム文字反転(FR-003)

**Decision**: `styles/frame.css:43-46` の反転セレクタ群に `.slide--image-full` を追加し、`.frame__scope`(取扱区分「組織限定」)・`.frame__copyright`・`.frame__pageno` を `var(--text-on-accent)` へ反転する。機密性バッジ(`.frame__confidentiality`)は自前の背景色を持つため対象外。

**Rationale**: 現状の反転は `.slide--title`/`.slide--closing`(accent 濃地)限定。全面画像スライドは `--surface-strong` + グレー縞の濃地だが対象外のため、`--text-secondary` のフレーム文字がほぼ埋没していた(p14 で確認)。キャプションは既に `--text-on-accent`(白)で可読なので、フレームも同色へ揃えれば整合し AA を満たす。`--text-on-accent` は白系トークンで、`--surface-strong`/グレー縞に対し十分なコントラストを持つ(a11y テストで実測確認)。

**Alternatives considered**:
- スクリムをフレーム下まで敷いて文字色は据え置き → フレームは `z-index:2` で最前面・`pointer-events:none` の別レイヤーであり、スクリムは本文レイヤー側のため被覆設計が複雑化。却下。
- 濃地を自動判定する汎用フックの導入 → 対象1スライドに対し過剰。YAGNI で却下。

## D3: 本文の縦位置を上寄せへ統一(FR-004/005)

**Decision**: 本文帯(行2)を縦中央に置くレイアウトのうち、本文量が少なく間延びするものを上寄せ(`align-self: start` / `align-content: start`、または内部 flex の `align-items: start`)へ変更する。中央寄せが設計意図の `section`/`quote`/`big-number` は除外する。対象と手当ては `data-model.md` のインベントリに列挙。

**Rationale**: `.slide__stage` は `grid-template-rows: auto 1fr auto`(`grid.css:30`)。行2(1fr)が残余高を占め、その中で各レイアウトが `align-*: center` して短い本文を縦中央へ落とすため、見出し直下に空白帯が生じる(summary=`align-content:center`、process/timeline=`align-self:center`、chart=stretch セル内で SVG を flex 中央寄せ)。上寄せにすれば見出しに続けて本文が始まり、スライド間で視線の落ち着き先が揃う(SC-003)。行構造自体は変えないため印刷・PDF ページ割りへ影響しない。

**Alternatives considered**:
- stage の行を `auto auto 1fr` に作り替える(下スペーサ方式) → 全レイアウト横断の大改修で回帰リスク大。却下。
- 全レイアウト一律で中央→上寄せ → 中央寄せが効果的な章扉/引用/ビッグナンバーまで損なう。除外リスト方式を採用。

## D4: ビッグナンバーの視覚的優位(FR-006)

**Decision**: `big-number.css` の `.bignum` を `font-size: calc(var(--font-size-64) * N)`(N は視覚回帰で確定、目安 1.6〜2.0)へ拡大し、数値と `.anchor`(内訳)を行2内で近接した1ユニットとして配置(現状の「数値=center / 内訳=end」の分離を解消)する。単位・内訳は安全余白内に収める。

**Rationale**: DS 型スケールは `--font-size-64` が最大(`tokens/vendor` 実測)。1280×720 では 64px は主役として弱い。`lint:tokens` は生 hex/rgb/hsl と spacing プロパティの生 px のみを検出するため、`calc(var(--font-size-64) * N)`(raw px を含まない token 由来式・font-size は非 spacing)は lint を通過する(FR-009 の想定どおり)。現状 `.bignum`(center)と `.anchor`(end)が行2の上下端に離れて配置され、間に空白が生じているため、近接配置で「まとまり」を作り Von Restorff を効かせる。

**Alternatives considered**:
- 新しい大サイズトークンを `tokens/vendor` に追加 → vendor は不変(immutable)につき禁止。却下。
- 数値拡大せず構図の締めのみ(spec の代替案) → 64px 据え置きでは優位が限定的。calc 拡大を第一とし、万一 lint/回帰で不可なら締めのみへフォールバック(spec Assumptions 準拠)。

## 出力

全 NEEDS CLARIFICATION は解消済み(spec 時点で0)。設計判断 D1〜D4 は Phase 1 の data-model / contracts に反映する。
