# Quickstart: スライドテンプレート → .potx 変換

## 前提条件

- Node.js(このリポジトリの既存 `package.json` が要求するバージョン)と `npm install` 済みの依存関係(Playwright 含む)。
- Python 3.11 以上。
- `pip install -r scripts/pptx-template/requirements.txt`(`python-pptx`, `lxml`, `pytest`)。

## 実行

```sh
npm run build:potx
```

既定では `slides/` 配下の 16 HTML を読み込み、`dist/ds-presentation-template.potx` を生成する。出力先を変えたい場合:

```sh
node scripts/extract-slide-layout-data.mjs --out build/slide-layout-data.json
python3 scripts/pptx-template/build_potx.py --input build/slide-layout-data.json --output dist/my-template.potx
```

## 動作確認手順

1. コマンド実行後、終了コードが `0` であることを確認する。
2. stdout の NDJSON ログを確認し、`WARNING` が出ていないか(出ている場合はどのレイアウト・要素かを確認する)。
3. 生成された `.potx` を **Microsoft PowerPoint デスクトップ版**(現行または 1 つ前のメジャーバージョン、Windows/Mac)で開く(spec Clarifications: 検証対象アプリケーションはこれのみ)。
4. 「表示 > スライドマスター」でカスタムレイアウトが 16 個あり、それぞれ日本語名(表紙・目次・章扉…)で識別できることを確認する。
5. 通常表示に戻り、「ホーム > 新しいスライド」のレイアウト一覧に 16 レイアウトが表示されることを確認する。
6. 任意のレイアウトを適用し、タイトル・本文プレースホルダーをクリックして文字入力できる(画像化されていない)ことを確認する。
7. 画像・図表を含むレイアウトで、画像を選択し「代替テキスト」ウィンドウにヒントが入っていることを確認する。
8. 新規に図形やテキストボックスを描画し、既定の色/フォントが DS トークン由来のテーマ色・Noto Sans JP になっていることを確認する。

## テスト実行

```sh
# Node 側(抽出ステップの検証)
npx playwright test tests/pptx

# Python 側(組み立てロジックの検証)
cd scripts/pptx-template && pytest ../../tests/pptx
```

## トラブルシューティング

- 生成された `.potx` が PowerPoint で「壊れたファイル」と表示される場合、`potx_writer.py` の content-type 書き換えが `[Content_Types].xml` 内の `/ppt/presentation.xml` エントリのみを対象にしているか(他のパートを誤って書き換えていないか)を確認する(research.md #3 参照)。
- テーマ色が反映されない場合、`scripts/pptx-template/theme.py` のスロット対応表(data-model.md `ThemeMapping`)と `styles/tokens.semantic.css` のロール変数名が一致しているか確認する。
