# Phase 1 Data Model: 変更インベントリ

本フィーチャーに永続データエンティティは無い。ここでは「変更対象=スタイル調整の単位」をエンティティとして扱い、対象・現状・目標・検証を1行で定義する。実装(タスク)はこの表を正とする。

## エンティティ: レイアウト/コンポーネント調整

各行は「1つの CSS 調整単位」。`現状`→`目標`は挙動の記述であり、確定値(倍率など)は視覚回帰で決める。

### US1 — 描画不具合(P1)

| ID | 対象ファイル:根拠 | 要素 | 現状 | 目標 | 検証(FR/SC) |
|----|------|------|------|------|------|
| A1 | `styles/layouts/appendix.css:34-35` | `.legend__swatch--cat2/--cat3` | 詳細度(0,1,0)で基底 `.legend__swatch{bg:accent}`(`components.css:111`)に後勝ち上書きされ緑/橙が青化 | 詳細度を(0,2,0)へ(例 `.legend .legend__swatch--cat*`)。cat1/cat2/cat3 が青/緑/橙で描画 | FR-001, SC-001 |
| A2 | 同上(全系列凡例) | 付録D・付録E の凡例/系列/データ点 | 一部青化 | 凡例=系列=データ点の色が一致 | FR-002, SC-001 |
| B1 | `styles/frame.css:43-46` | `.slide--image-full .frame__scope/__copyright/__pageno` | 反転対象外で `--text-secondary` が濃地に埋没 | 反転リストへ追加し `--text-on-accent` で判読 | FR-003, SC-002 |

### US2 — 構図の統一(P2)

| ID | 対象ファイル:根拠 | 要素 | 現状 | 目標 | 検証(FR/SC) |
|----|------|------|------|------|------|
| C1 | `styles/layouts/summary.css:8` | `.key-messages` | `align-content: center`(行2 1fr で中央落下) | `start`(見出し直下から) | FR-004, SC-003 |
| C2 | `styles/layouts/process.css:4` | `.process` | `align-self: center` | `start` | FR-004, SC-003 |
| C3 | `styles/layouts/timeline.css:6` | `.timeline` | `align-self: center` | `start` | FR-004, SC-003 |
| C4 | `styles/layouts/chart.css:2-9` | `.chart` / `.takeaway` | stretch セル内で SVG を flex 中央寄せ + takeaway `align-self:center` | 上寄せ(SVG `align-items:start`、takeaway `align-self:start`) | FR-004, SC-003 |
| C5 | `styles/layouts/big-number.css:3-20` | `.bignum` / `.anchor` | 数値=center・内訳=end で上下分離、64px で優位弱 | `calc(var(--font-size-64)*N)` へ拡大 + 数値/内訳を近接1ユニット化 | FR-006, SC-004 |
| C0 | `styles/layouts/section.css`,`quote.css`,`big-number.css`(縦位置意図) | 章扉・引用・ビッグナンバーの中央寄り | 中央寄せ | **不変(除外)** — 意図した構図を保持 | FR-005 |

### US3 — 仕上げ(P3・任意)

| ID | 対象ファイル:根拠 | 要素 | 現状 | 目標 | 検証(FR) |
|----|------|------|------|------|------|
| E1 | `styles/layouts/appendix.css`(F/H) | 付録F・付録H | 下半分が大きく空く | 意図的余白として成立、または他付録と密度整合 | FR-007 |
| E2 | `index.html`(closing)/`styles/layouts/closing.css` | クロージング CTA | 語中で不自然に折り返し | 折り返しの自然化(幅/文言の微調整) | FR-008 |
| E3 | `styles/layouts/title.css` | 表紙 | 主要素が上下端に貼付き中央空洞 | 意図した構図へ配置 | (US3) |

## 不変条件(全 ID 共通)

- DS トークン参照のみ(生 hex/rgb/hsl 禁止・spacing 生 px 禁止)= `lint:tokens` 通過(FR-009)。
- HTML 構造・スライド枚数不変、`slides/*.html` は再生成のみ(手編集禁止)。
- `@media print` の 1スライド=1ページ不変、PDF ページ数 == ライブ `.slide` 数(FR-010/011, SC-006)。

## 状態遷移

N/A(静的スタイルの是正のみ)。
