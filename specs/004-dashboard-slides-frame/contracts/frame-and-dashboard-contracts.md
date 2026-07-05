# Contract: 共通フレーム & ダッシュボード

**Provider**: `styles/frame.css` / `styles/tokens.semantic.css`(カテゴリ配色) / `js/frame.js`。**Consumer**: 全スライド、著者。

## 共通フレーム マークアップ

```html
<section class="slide slide--body" data-layout="body" data-confidentiality="2">
  ...
  <div class="slide__frame" aria-hidden="false">
    <span class="frame__copyright">© 2026 ［組織名］</span>
    <span class="frame__pageno"><!-- js が n / N を設定 --></span>
    <span class="frame__scope">［組織名］限定</span>
    <span class="frame__confidentiality">機密性2情報</span>
  </div>
</section>
```

- `data-confidentiality="1|2|3"`: `.frame__confidentiality` の文言/色を切替(未指定は既定 2 相当)。
- `.frame__pageno`: `js/frame.js` が `.deck` 内で「n / N」を自動設定。単体は「1」。
- 四隅配置(絶対): copyright=左下, pageno=右下, scope=右上上段, confidentiality=右上下段。`.slide__stage` と非重複。

## 機密性トーン(CSS)

| data-confidentiality | 文言 | 面 | 文字 |
|---|---|---|---|
| 1 | 機密性1情報 | surface(neutral) | text-primary |
| 2 | 機密性2情報 | orange 淡面 | orange 濃 |
| 3 | 機密性3情報 | red 淡面 | red 濃 |

## カテゴリ配色(役割変数)

`--cat-1..7` = blue / light-blue / cyan / green / orange / red / solid-gray(DS 7 パレット)。各色は白背景に対しチャート面 ≥3:1。

## ダッシュボード付録

- KPI カード(`.tile` 群)を 12 カラムグリッド整列。
- 多系列チャート(棒/折れ線)を `--cat-*` で塗り、`.legend` を併記。
- 注釈で practices C 群(Cleveland–McGill/データインク/ダッシュボード設計)を明示。

## テスト対象

- C-F-1: 全 `.slide` に `.slide__frame`(4要素)存在(SC-001)。
- C-F-2: `@media print` でフレーム保持(SC-006)、注釈は非表示のまま。
- C-F-3: `data-confidentiality` 切替で表示変化(SC-003)。
- C-F-4: `--cat-1..7` 各色が白背景 ≥3:1(SC-005)。
- C-F-5: styles にハードコード0(SC-002)。
