# Contract: 拡張スライドレイアウト構造契約(8種)

**Consumer**: 著者、フェーズ2 PPT 変換器、検証ハーネス。
**Provider**: `slides/09..16-*.html` + `styles/layouts/*.css`。feature 001 の共通契約(`.slide` / `.slide__stage` / 12列グリッド / 命名スロット / 注釈 / アクションタイトル / 1280×720)を**継承**する。

## 共通(継承)

- ルート: `<section class="slide slide--{id}" data-layout="{id}">` … `.slide__stage`(12列グリッド)。
- 注釈: `[data-annotation][hidden]` 既定非表示 + `data-practice` は practices.md ID 参照。
- 本文は実 DOM テキスト(擬似要素で本文を表示しない)。
- 1280×720 で overflow なし、印刷 1 スライド=1 ページ、役割変数のみ。

## レイアウト別スロット契約

| id | 必須スロット | 実演手法(注釈 data-practice) |
|---|---|---|
| `big-number` | `.slide__heading`, `.bignum`(値), `.anchor`(基準/比較), `.slide__citation` | `B-von-restorff`, `C-preattentive`, `E-fluency`, `E-anchoring` |
| `dashboard` | `.slide__heading`, `.kpi-grid`(タイル ≤6, `.kpi--highlight` ≤1), `.slide__citation` | `C-dashboard`, `C-storytelling-data`, `E-default-effect`, `A-action-title` |
| `timeline` | `.slide__heading`, `.timeline`(`.step` 順序付き, marker), `.slide__signpost` | `A-consistency`, `A-scqa`, `A-signposting` |
| `matrix` | `.slide__heading`, `.matrix`(`.axis-x`,`.axis-y`,`.quadrant`×4) | `B-gestalt`, `E-framing`, `C-preattentive` |
| `process` | `.slide__heading`, `.process`(`.step` 番号+矢印), `.visual`? | `D-multimedia`, `B-signal-noise`, `A-consistency` |
| `quote` | `.slide__heading`?, `.quote`, `.attribution`(source/role) | `E-cialdini`, `E-aesthetic-usability` |
| `image-full` | `.visual-full`(プレースホルダ), `.scrim`?, `.caption` | `D-picture-superiority`, `B-whitespace`, `B-wcag` |
| `closing` | `.slide__heading`, `.closing-cta`, `.contact` | `A-10-20-30`, `B-fitts`, `A-hook-throughline-cta`, `E-peak-end` |

## 追加の不変条件(テスト対象)

- C-E-1: 8/8 拡張レイアウトが 1280×720 で overflow なし・印刷1p(SC-001)。
- C-E-2: `dashboard` の `.kpi--highlight` は 0〜1 件、`.kpi` は ≤6(SC-004 情報過多回避 / Von Restorff)。
- C-E-3: `image-full` の重ね文字はスクリム併用で AA(SC-004)。
- C-E-4: `quote` は捏造推奨文言を含まない(プレースホルダ)(FR-007)。
- C-E-5: 全拡張レイアウトのスロット矩形が確定・本文実DOM(SC-007)。
- C-E-6: 拡張の注釈 `data-practice` により、core+extended の和集合が practices.md 全 ID を包含(SC-005)。
