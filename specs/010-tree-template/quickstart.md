# Quickstart: ツリー構造テンプレート(縦・横)

## 実装の流れ(概要)

1. `styles/layouts/tree.css` を新規作成(`.tree` 縦既定 ＋ `.tree--horizontal` 横 ＋ ノード役割 ＋ 擬似要素コネクタ)。役割変数のみ。
2. `index.html`:
   - `<head>` に `styles/layouts/tree.css` のリンクを追加。
   - デック本編、`process` スライドの直後に縦ツリー `<section ... data-layout="tree" data-practice="A-pyramid">` を追加。
   - 付録、`appendix-grid` の直前に横ツリー `<section ... data-layout="appendix-tree-horizontal" data-practice="A-pyramid">` を追加。
3. `scripts/split-slides.mjs` の `ORDER` に `tree:'17'`、`TITLE` に `tree:'ツリー(階層)'` を追加。
4. `tests/visual/_fixtures.mjs` の `LAYOUTS` に `'17-tree'` を追加。
5. `tests/visual/deck.spec.mjs` の数を 25→27 に更新(コメントも)。
6. `node scripts/split-slides.mjs` で `slides/17-tree.html` を生成。
7. `npm run verify`(初回は新規ベースライン生成のため視覚テストを更新実行 → 目視確認 → 確定)。

## 動作確認

```sh
# 単体生成の整合
node scripts/split-slides.mjs --check

# 個別ゲート
npm run lint:tokens
npm run check:crossrefs
npm run check:coverage
npm run check:slides

# 視覚 / a11y / 印刷 / PDF
npm run test:visual        # 初回のみ新規ベースライン取得(--update-snapshots 相当)後に目視で確定
npm run test:a11y
npm run test:print
npm run build:pdf && npm run check:pdf   # PDF ページ数 == 27

# 一括
npm run verify
```

## 確認観点(rubric)

- 縦: 頂点=結論1、第2階層=MECE 根拠(複数)、末端=裏付け(任意)。親子コネクタが上→下で明示。
- 横: 根=左端、枝=右へ展開。親子コネクタが左→右で明示。縦と同一の視覚言語。
- 両方: 1280×720 内に収まり見切れ/重なりなし。色・余白はトークン由来。コントラスト AA。
- PDF: 総ページ数がライブ `.slide` 数(27)と一致。

## 注意

- `slides/*.html` は生成物。手編集せず、index.html を編集して `split-slides.mjs` で再生成する。
- 既存 01–16 の採番・ベースラインは変更しない(tree は 17)。
- PPTX は `verify` 外。本機能では更新しない。
