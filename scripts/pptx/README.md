# PowerPoint エクスポート(scripts/pptx)

正本デック `index.html` を、**ネイティブに編集可能な `.pptx`** へ書き出す Node 実装。
テキストボックス・図形・ネイティブ表・ネイティブグラフのみで構成し、本文領域にラスタ画像を使わない。

## 使い方

```bash
npm run build:pptx      # -> dist/sample-deck.pptx (+ dist/deck-ir.json)
npm run check:pptx      # 正本との乖離を検証(verify に組込済み)
```

生成物 `dist/sample-deck.pptx` は Git 追跡対象(`dist/` の他生成物は管理外)。
PowerPoint / Keynote / Google スライドで開ける。

## 方式: DOM 実測抽出(feature 011)

**変換器はレイアウト一覧も本文コピーも持たない。** 実レンダリングした DOM の
算出済み矩形(`getBoundingClientRect`)と計算済みスタイル(`getComputedStyle`)だけを読む。
そのため、正本にスライドやコンポーネントが増えても**変換器のコード変更は不要**で出力へ追随する。

> **なぜ変えたか**: 旧実装はスライドごとの文言と座標を手書きした「第二の正本」だった。
> 結果として正本 28 枚に対し 20 枚しか変換されず(8 枚が欠落)、日本語リテラル 208 個が
> 二重管理となり、表紙メタは「20コンポーネント」に対し「12コンポーネント」のまま陳腐化していた。
> `build:pptx` が `verify` の外にあったことが、それを放置した構造的原因である。

## 構成

| ファイル | 役割 |
|---|---|
| `build-pptx.mjs` | オーケストレータ。抽出 → 出力 → 後処理を繋ぐだけで、内容も座標も持たない |
| `extract.mjs` | 実レンダリングした DOM → スライド IR。`data-pptx` 役割属性の語彙だけを知る |
| `emit.mjs` | スライド IR → pptxgenjs のネイティブ・オブジェクト |
| `group-xml.mjs` | 生成後の OOXML を `<p:grpSp>` で包む(pptxgenjs にグループ API が無いため) |
| `theme.mjs` | `ppt/theme/theme1.xml` の配色を DS パレットへ差し替える |
| `check-pptx.mjs` | 正本との乖離を検出する決定的チェック(`verify` に結線) |

デザイントークンの解決値は**抽出時に正本の CSS 変数から読む**。手維持のマップ
(旧 `tokens.mjs`)は廃止した。

## 変換の契約

HTML 側がどう書かれていれば何に変換されるかは
[`specs/011-pptx-dom-extraction/contracts/pptx-role-contract.md`](../../specs/011-pptx-dom-extraction/contracts/pptx-role-contract.md)
が正。要点のみ:

- **本文はマーク不要**。直接テキストを持つ要素が自動でテキストボックスになる。
- `data-pptx` は既定の上書き専用: `ignore` / `shape` / `group` / `text` / `table` / `chart` / `line` / `image`。
- 面 + 複数テキストの複合(`.tile` / `.node` / `.step` など)は `group` → PowerPoint 上で一塊に動く。
- グラフは `data-chart` の JSON payload からネイティブグラフになり、**数値ごと編集できる**。

## 検証(check:pptx)

| # | 検証 |
|---|---|
| C1 | PPTX のスライド数 == ライブ `.slide` 数 |
| C2 | 正本の各スライドの見出しが、対応スライドに存在する |
| C3 | `data-chart` payload が直接ラベル・系列数と整合する |
| C4 | 本文領域にラスタ画像が無い |

`verify` の末尾に `build:pptx && check:pptx` として結線済み。正本を変更して PPTX を
再生成しないまま `verify` を実行すると、C1/C2 で失敗する。

## 環境変数

| 変数 | 用途 |
|---|---|
| `PPTX_CHROMIUM_PATH` | Chromium の実行ファイルを明示指定する。Playwright 同梱版と実行環境の Chromium ビルドが一致しない CI やコンテナ向けの逃げ道。未設定なら Playwright の既定を使う |

## 制約(既知)

- **幾何は近似**。HTML とのピクセル一致は非対象。フォントメトリクスの差により
  折り返し位置は PowerPoint 側の描画に従う。
- **フォント埋め込みは未対応**(pptxgenjs 非対応)。未導入端末では代替表示。
- **`.potx` テンプレート化は未対応**(配布形態の課題。後続)。
- **チャートは payload と手描き SVG の二重表現**。C3 の整合チェックで封じているが、
  SVG をデータから生成する完全な一元化は後続(spec.md の Deferred を参照)。

対応スペック: [specs/011-pptx-dom-extraction](../../specs/011-pptx-dom-extraction/)
