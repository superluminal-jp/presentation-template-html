# Contract: 検証(Verification)

`npm run verify` の全工程を緑に保つための、本機能で更新/新規化する検証点。契約は「差分は既知点に限定し、既存ベースラインを壊さない」こと。

## 更新が必要な検証点

| 検証 | コマンド | 変更内容 |
|---|---|---|
| スライド数 | `test:visual`(deck.spec) | `expect(n).toBe(25)` → `toBe(27)`。コメント更新。 |
| 単体生成整合 | `check:slides`(split --check) | `ORDER.tree='17'` / `TITLE.tree` 追加後、`slides/17-tree.html` を生成して一致。 |
| レイアウト集合 | `test:visual` / `test:a11y` | `_fixtures.mjs` の `LAYOUTS` に `'17-tree'` を追加。 |
| PDF ページ数 | `check:pdf` | 動的に `.slide` 数(27)へ一致(コード変更不要)。 |

## 新規ベースライン(初回実行で取得)

- `deck.spec` スナップショット: `deck-tree.png`(＋ chromium)/ `deck-appendix-tree-horizontal.png`(＋ chromium)
- `ds-update.spec` スナップショット: `17-tree.png`(＋ chromium)
- 既存ベースラインは data-layout / ファイル名キーのため不変(スライド挿入で無効化されない)。

## 変更不要(明示)

- `check:crossrefs` / `check:coverage`: `data-practice="A-pyramid"`(既存・実演済み・巻末掲載済み)を再利用するため、practices.md・巻末リファレンスともに変更なし。
- `lint:tokens`: 役割変数のみ・余白系生 px なしで PASS(コネクタのボーダー px は対象外)。
- `@media print`: 単一ソースを流用、新規ページ CSS なし。
- PPTX(`build:pptx`): `verify` 外の curated サブセット。本機能では対象外(必要なら別途フォローアップ)。

## 合否基準(SC 対応)

- SC-001: `layouts.spec`(overflowX/Y ≤ 1)＋ deck 視覚回帰 PASS。
- SC-002: 縦・横とも root=1・branch 複数・親子コネクタが視認できる(視覚回帰＋目視)。
- SC-003: `check:pdf` で PDF ページ数==27、`npm run verify` 全緑。
- SC-004: `lint:tokens` 違反0 ＋ a11y コントラスト AA。
- SC-005: サンプルの枝数/末端を差し替えても overflow なし(手動確認 + overflow テスト)。
