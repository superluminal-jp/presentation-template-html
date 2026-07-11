# Contract: 付録の内容契約と不変条件

本フィーチャーが公開/保証する契約。実装はこれを満たし、検証で強制する。

## C1. デッキ付録の内容契約(HTML)

- **INV-1(網羅)**: 台帳 20 種すべてが、生成後の `slides/*.html` および `index.html` 付録スライド上に、判別可能な形で 1 回以上出現する。
- **INV-2(トークン準拠)**: 付録スライドの体裁はトークン参照のみ。`npm run lint:tokens` が PASS。
- **INV-3(生成整合)**: `index.html` 変更後に `node scripts/split-slides.mjs` を実行し、`npm run check:slides` が PASS(乖離 0)。
- **INV-4(a11y)**: 付録を含む全レイアウトで axe コントラスト違反 0。`npm run test:a11y` PASS。
- **INV-5(見切れなし)**: 各付録スライドがネイティブ 1280×720 でオーバーフローしない(visual 回帰で検出)。

## C2. 廃止契約(参照 0)

- **INV-6**: リポジトリの現行ソース・テスト・ビルドに `components.html` への**機能的参照**(ナビ `href`、テストの `goto`、ビルド入力)が 0 件。
  - 検証: `grep -rIn "components.html" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=specs .` を実施し、ヒットが「廃止を説明する散文(CLAUDE.md/README の feature ログ)」のみで、機能的参照 0 を確認。
  - 注: `specs/` 配下の歴史的記録は除外。CLAUDE.md/README では過去形の記述に留め、リンク/読込を残さない。
- **INV-7**: `components.html` ファイルが存在しない。
- **INV-8(残置)**: `styles/components.css`・`styles/dads-components.css`・`tokens/vendor/**`・`vendor/dads-components/**` は存在し続ける。
  - 検証: 上記パスの存在を明示確認する(受け入れ束に含める)。

## C3. PPTX エクスポート契約

- **INV-9**: `npm run build:pptx` が成功し、`dist/sample-deck.pptx` に付録スライドが 1 枚以上含まれる。
- **INV-10(ネイティブ)**: 付録スライド上の要素はテキストボックス・図形・ネイティブ表のみ。本文領域に `<p:pic>` 由来のラスタ画像が 0 件。
  - 検証: 生成 pptx を unzip し、付録スライド XML に `<pic:` / `<p:pic>` が無いことを確認。
- **INV-11(表)**: データテーブルは pptxgenjs ネイティブ表(`a:tbl`)として出力される。

## C4. テスト再ポイント契約

- **INV-12**: `tests/a11y/components-a11y.spec.mjs` と `tests/a11y/focus-a11y.spec.mjs` は `components.html` を参照せず、デッキ(付録)を対象に同等の a11y/フォーカス検証を行い PASS する。

## 検証コマンド束(受け入れ)

```sh
npm run lint:tokens
npm run check:crossrefs
npm run check:coverage
node scripts/split-slides.mjs && npm run check:slides
npm run test:a11y
npm run test:visual         # baseline 更新後
npm run build:pptx          # + pptx 付録の pic 不在チェック
! grep -rI "components.html" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=specs .
# INV-8 残置確認
test -f styles/components.css && test -f styles/dads-components.css && test -d vendor/dads-components && test -d tokens/vendor
```
