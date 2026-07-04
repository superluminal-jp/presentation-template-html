# デザインシステム バージョン対応表 & 更新ランブック(ds-version-map.md)

DS トークンの取り込みは**明示操作**として管理する(SC-07)。`tokens/vendor/` は不可侵層で、更新は本ランブックに従う。

## バージョン対応表

| 取り込み日 | npm `@digital-go-jp/design-tokens` | Figma DS(参考) | 主な差分メモ | 検証 |
|---|---|---|---|---|
| 2026-07-05 | **2.0.1**(固定) | 2.14.x 系 | 初回ベースライン | 視覚回帰ベースライン取得 |

> 版固定は `package.json` の `"@digital-go-jp/design-tokens": "2.0.1"`(範囲指定にしない)。

## 更新ランブック(レイアウト無改修で追従)

1. 依存を新版へ更新(明示):
   ```bash
   npm install @digital-go-jp/design-tokens@<new>
   npm run sync-tokens        # tokens/vendor/tokens.css を再生成(不可侵層)
   ```
2. 差分レビュー(vendor のみが変わるはず):
   ```bash
   git diff tokens/vendor/tokens.css
   ```
3. 影響を写像層に閉じる:
   - 変更が必要でも編集対象は `styles/tokens.semantic.css`(役割エイリアス)**のみ**。
   - トークンの改名・廃止は写像層のエイリアスで吸収し、`styles/layouts/*` は触らない。
4. 視覚回帰(閾値 ≤0.1%/レイアウト, `maxDiffPixelRatio: 0.001`):
   ```bash
   npm run test:visual
   ```
   - 差分が想定内なら新ベースラインを承認、想定外なら写像層で調整。
5. 純度・整合の再確認:
   ```bash
   npm run lint:tokens && npm run check:crossrefs
   ```
6. 本対応表に行を追記(取り込み日・版・差分メモ・検証結果)。

## 逸脱時のエスカレーション

- レイアウト定義(`styles/layouts/*`)の編集が避けられない更新は、SC-07 の逸脱として記録し、spec/plan の見直し(または `/speckit-clarify`)を検討する。
