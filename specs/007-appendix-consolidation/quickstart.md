# Quickstart: コンポーネント集の付録一本化と PPTX 反映

実装〜検証の最短手順。詳細タスクは `/speckit-tasks` で生成する `tasks.md` 参照。

## 実装ステップ(概略)

1. **付録に不足分+新規を追加(index.html / styles)**
   - 区切り(divider)の見本を付録A(または C)に追加。
   - 新規自作 2 種(バナー〔通知・緊急〕/ステップナビゲーション)の CSS を `styles/components.css` に追加し、付録A/C に見本を配置。
   - 新設「付録F: DADS 公式コンポーネント」に 6 種(カード/箇条書きリスト/チェックボックス/ラジオ/プログレスインジケーター/パンくず)を埋め込み。
   - `<head>` に `styles/dads-components.css` をリンク。
2. **数値表記の整合(index.html)**: 「12コンポーネント」→「20」、ダッシュボードタイルを更新。
3. **生成物を再生成**: `node scripts/split-slides.mjs`。
4. **独立ページ廃止**: `components.html` を削除し、`index.html` のナビリンク・`README.md`・`CLAUDE.md`(SPECKIT ブロック)・CSS/スクリプトのコメント参照を除去。
5. **a11y テスト再ポイント**: `tests/a11y/components-a11y.spec.mjs`・`focus-a11y.spec.mjs` をデッキ(付録)対象に変更。
6. **PPTX に付録追加**: `scripts/pptx/build-pptx.mjs` に付録スライド(ネイティブ要素・`addTable`)を追加、`npm run build:pptx`。
7. **視覚回帰ベースライン更新**: `npx playwright test tests/visual --update-snapshots`。

## 検証(受け入れ)

```sh
npm run lint:tokens
npm run check:crossrefs
npm run check:coverage
node scripts/split-slides.mjs && npm run check:slides
npm run test:a11y
npm run test:visual
npm run build:pptx
# 参照 0(specs 履歴は除外)
grep -rI "components.html" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=specs . && echo "NG: 参照残存" || echo "OK: 参照0"
# pptx 付録にラスタ画像が無い
```

## 完了の目安(Success Criteria 対応)

- SC-001: 20 種すべてが付録に出現 → INV-1
- SC-002: `components.html` 不在・参照 0 → INV-6/7
- SC-003: 検証スイート緑 → INV-2/3/4/5 + crossrefs/coverage
- SC-004: pptx に付録・ラスタ 0 → INV-9/10/11
- SC-005: 点数表記 18 に整合
