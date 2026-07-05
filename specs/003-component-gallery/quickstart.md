# Quickstart: 再利用コンポーネント集ページ

**Feature**: 003-component-gallery | **Date**: 2026-07-05

## 使う(著者)

1. `components.html` を開く(README / `index.html` ツールバーからも到達可)。
2. 使いたい部品の見本を確認し、直下のコピー用マークアップをスライドへ貼る。
3. スタイルは `styles/components.css` を読み込むだけ(役割変数で自動整形)。スライド内にそのまま差し込める。

## 検証

```bash
npm run lint:tokens                  # SC-002(components.css もハードコード0)
node tests/a11y/contrast-tokens.mjs  # SC-003(状態色ペア含む AA)
npm run test:a11y                    # SC-003(axe: components.html・要ブラウザ)
```

## DoD

- `components.html` に 10 種以上の部品(見本 + 用途注記 + コピー用コード)。
- 役割変数のみ(lint 合格)、状態色ペア AA。
- 代表部品をスライドへ差し込んでも崩れない。
- README / ショーケースから 1 クリックで到達。
