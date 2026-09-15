# Contract: `build:pptx` / `check:pptx` の入出力

**Feature**: 011-pptx-dom-extraction | **Plan**: [../plan.md](../plan.md)

## `npm run build:pptx`

**入力**: `index.html`(正本、実レンダリング)、`styles/**`、`js/**`

**出力**:

| パス | 追跡 | 内容 |
|---|---|---|
| `dist/sample-deck.pptx` | 追跡対象(`.gitignore` の `!dist/sample-deck.pptx`) | 編集可能な PPTX |
| `dist/deck-ir.json` | 追跡外 | スライド IR(障害調査用) |

**不変条件**:

- 出力スライド数 == ライブの `.slide` 数
- 本文領域にラスタ画像を含まない
- 同一入力から同一出力(冪等。フォント読み込み完了を待機して非決定性を排する)
- スライド固有のコピー・座標をスクリプト内に持たない

**終了コード**: 成功 0 / 失敗 非 0(抽出失敗、`data-chart` の JSON パース失敗など)

## `npm run check:pptx`

**入力**: `dist/sample-deck.pptx`(既存であること)、`index.html`(比較の基準)

**検証項目**:

| # | 検証 | 失敗時のメッセージ要件 |
|---|---|---|
| C1 | PPTX のスライド数 == ライブ `.slide` 数 | 期待値と実測値の双方を出す |
| C2 | 正本の各スライドの見出しテキストが、対応するスライドの XML に存在する | 不一致のスライド番号・レイアウト名・期待テキストを出す |
| C3 | `data-chart` を持つ全要素が整合制約(系列数 / 系列名 / 値数)を満たす | 違反した SVG の `aria-label` と違反内容を出す |
| C4 | 本文領域にラスタ画像(`ppt/media/` の参照)が無い | 画像を含むスライド番号を出す |

**終了コード**: 全項目成功 0 / いずれか失敗 非 0

**実装手段**: 生成 PPTX を `jszip`(既存 devDependency)で開き `ppt/slides/slide*.xml` を読む。
PowerPoint の起動は不要。

## `verify` チェーンへの結線

```text
lint:tokens → check:crossrefs → check:coverage → check:slides
→ test:visual → test:a11y → test:print
→ build:pdf → check:pdf
→ build:pptx → check:pptx        ← 本機能で追加
```

`build:pdf` / `check:pdf` と同じ位置づけ(生成 → 決定的チェック)。
これにより `CLAUDE.md` の「PPTX outside verify — not updated」という既知の穴が閉じる。

## 後方互換

- コマンド名 `build:pptx` と出力パス `dist/sample-deck.pptx` は変更しない。
- `scripts/pptx/tokens.mjs` は削除される(内部モジュール。`npm run` の公開契約ではない)。
  `THEME` の責務は `scripts/pptx/theme.mjs` が継承する。
