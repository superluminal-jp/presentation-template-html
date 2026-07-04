# Contract: CSS カスタムプロパティ(セマンティック役割 API)

**Consumer**: レイアウト CSS(`styles/layouts/*.css`)、著者の追加スタイル。
**Provider**: `styles/tokens.semantic.css`(写像層)。**Source**: `tokens/vendor/tokens.css`(v2.0.1、不可侵)。

契約: レイアウト・著者は **役割変数のみ** を使用する。vendor 変数(`--color-primitive-*` 等)やリテラル色/余白を直接使わない(SC-02、`lint-tokens` で強制)。

## 色ロール

| 変数 | 参照(既定) | 用途 | 制約 |
|---|---|---|---|
| `--slide-bg` | `--color-neutral-white` | スライド地色 | — |
| `--surface` | `--color-neutral-solid-gray-50` | カード/面 | — |
| `--text-primary` | `--color-neutral-solid-gray-800` | 本文 | on `--slide-bg` で ≥4.5:1 |
| `--text-secondary` | `--color-neutral-solid-gray-600` | 補足 | on `--slide-bg` で ≥4.5:1 |
| `--border` | `--color-neutral-solid-gray-200` | 罫線/区切り | — |
| `--accent` | `--color-key-800`(#0031d8) | 強調/キー | HP 基調と一致(SC-08)、1スライド1箇所 |
| `--on-accent` | `--color-neutral-white` | accent 上の文字 | on `--accent` で ≥4.5:1 |
| `--state-success` | `--color-semantic-success-1` | 状態 | — |
| `--state-error` | `--color-semantic-error-1` | 状態 | — |
| `--state-warning` | `--color-semantic-warning-orange-1` | 状態 | — |

## タイポロール

| 変数 | 参照 | 用途 |
|---|---|---|
| `--font-sans` | `--font-family-sans` | 既定書体(Noto Sans JP → system) |
| `--font-mono` | `--font-family-mono` | コード/数値 |
| `--fs-display` | `--font-size-57`〜`64` | 表紙タイトル |
| `--fs-h1` | `--font-size-36`〜`45` | 見出し(アクションタイトル) |
| `--fs-h2` | `--font-size-24`〜`28` | 小見出し |
| `--fs-body` | `--font-size-18`〜`20` | 本文(最小 18) |
| `--fs-caption` | `--font-size-14` | 脚注/出典 |
| `--fw-normal` / `--fw-bold` | `--font-weight-400` / `-700` | 強調は bold のみ(medium 無し) |

## スペーシング(DS 外・写像層で定義)

`--space-1..12` = 4,8,12,16,24,32,40,48,64,80,96,128 (px)。余白・ガター・余幅はこのスケールのみ使用。

## 半径・陰影

`--radius-*` = `--border-radius-*` の別名。`--elevation-*` は vendor をそのまま使用。

## 不変条件(テスト対象)

- C-CSS-1: 役割変数の値は必ず `var(--...)`(vendor)経由。リテラル禁止(SC-02)。
- C-CSS-2: `--accent` は `--color-key-800`(SC-08)。
- C-CSS-3: 本文・見出しロールのコントラストが AA(SC-04)。
- C-CSS-4: DS 更新時に変更するのは本ファイルのエイリアスのみ(SC-07)。
