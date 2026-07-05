# Phase 0 Research: 再利用コンポーネント集ページ

**Date**: 2026-07-05 | **Feature**: 003-component-gallery

未解決 NEEDS CLARIFICATION は無し。判断は「収録セット」「AA(状態色)」「コピー用コードの提示」「差し込み互換」。

## R1. 収録コンポーネントセット(≥10)

- **Decision**: 12 種を収録: コールアウト(info/success/warning/error) / バッジ / タグ(chip) / ボタン(primary/secondary/tertiary) / データテーブル / プログレスバー / 統計(stat) / 凡例(legend) / 区切り(divider) / チェックリスト / 引用ブロック(pull-quote) / キーバリュー(kv/定義リスト)。
- **Rationale**: ビジネス/開発プレゼンで頻出し、スライドに差し込みやすい静的部品。状態系は semantic トークンを実演。
- **Alternatives**: タブ/アコーディオン等の対話部品 → JS 必要でスコープ外。

## R2. 状態色の AA 担保

- **Decision**: 状態コールアウトは淡色面(該当色の 50 階調 or surface)+ 濃色の文字/枠(semantic-1/2)で構成し、面上の文字は `--text-primary`(#333)を基本にする。バッジ等の色面上文字は白 or 濃色を AA 満たす側で選ぶ。`contrast-tokens.mjs` に代表ペアを追加して機械検証。
- **Rationale**: semantic の 1/2 は濃色でコントラストが取りやすい。淡面 + 濃文字は安全。
- **Alternatives**: 濃色面 + 白文字のみ → 警告(黄系)で白文字が AA 未達になりやすいため回避。

## R3. コピー用マークアップの提示

- **Decision**: 各部品の見本の直下に `<pre><code>` でエスケープしたマークアップを併記(近接=Live Documentation の Proximity)。専用のクリップボード JS は必須としない。
- **Rationale**: FR-006 を静的に満たし、依存を増やさない。
- **Alternatives**: クリップボードボタン(JS) → 任意拡張に留める。

## R4. スライド差し込み互換(FR-004)

- **Decision**: 部品は自己完結クラス(グリッド span や `.slide__stage` に非依存)。余白は `--space-*`、色は役割変数のみ。ショーケースの本文スライドに 1 例を差し込み、崩れないこと(SC-004)を確認。
- **Rationale**: どこでも同じ見た目 = 再利用性。
- **Alternatives**: スライド専用の派生クラス → 二重管理。

## R5. 検証の再利用

- **Decision**: `lint-tokens` は `styles/` 走査で `components.css` を自動検査。AA は contrast-tokens 追加 + components-a11y.spec(axe)。
- **Rationale**: 既存ハーネスに乗せ、追加は最小。
