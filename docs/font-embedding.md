# フォント同梱手順(任意・font-embedding.md)

既定では**フォントを同梱しない**(システム + Noto Sans JP フォールバックで「外部依存なし」を満たす)。
ピクセル忠実・オフライン完全再現・PPT 変換時の字形一致が必要な配布向けに、以下の手順で Noto Sans JP を同梱できる(Clarify Q2 のオプション)。

## 手順

1. Noto Sans JP を取得(SIL Open Font License 1.1)。ライセンス条項に従い同梱可。
   - 例: Google Fonts / 公式配布から `NotoSansJP-Regular` / `NotoSansJP-Bold`(weight 400/700 のみで足りる)。
2. `assets/fonts/` に配置(例: `NotoSansJP-Regular.woff2`, `NotoSansJP-Bold.woff2`)。
3. `styles/fonts.local.css` を作成し `@font-face` を定義:
   ```css
   @font-face {
     font-family: 'Noto Sans JP';
     font-weight: 400;
     font-display: swap;
     src: url('../assets/fonts/NotoSansJP-Regular.woff2') format('woff2');
   }
   @font-face {
     font-family: 'Noto Sans JP';
     font-weight: 700;
     font-display: swap;
     src: url('../assets/fonts/NotoSansJP-Bold.woff2') format('woff2');
   }
   ```
4. `index.html` / 各 `slides/*.html` の `<head>` で、`tokens.css` の**後**に読み込む:
   ```html
   <link rel="stylesheet" href="styles/fonts.local.css" />
   ```
   トークンの `--font-family-sans` は 'Noto Sans JP' を先頭に参照済みのため、追加の CSS 変更は不要。

## 注意

- weight は 400/700 のみ(DS も medium 非提供)。強調は太字 + アクセント色で表現する。
- 同梱によりリポジトリ/配布サイズが増える。既定の非同梱運用と使い分ける。
- ライセンス表記(OFL)を配布物に含める。
