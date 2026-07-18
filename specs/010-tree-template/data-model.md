# Phase 1 Data Model: ツリー構造テンプレート(縦・横)

UI コンポーネントのため「データ」は DOM 構造とスタイル契約に相当する。内容モデルはピラミッド・プリンシプル。

## Entities

### Tree(ツリー)
- **表すもの**: 階層構造全体(1根＋複数枝)。
- **属性**:
  - `orientation`: `vertical`(既定, 縦/トップダウン) | `horizontal`(横/左→右)。DOM 上は `.tree`(縦) / `.tree.tree--horizontal`(横)。
  - `depth`: 階層の深さ(既定サンプル=3: root/branch/leaf)。
  - `data-practice`: `A-pyramid`(スライド section に付与)。
- **不変条件**: 1280×720 内に全ノード/コネクタが収まる。役割色のみ・生の余白 px なし。

### Node(ノード)
- **表すもの**: ツリーの要素。ピラミッドの1命題。
- **役割(role)**:
  - `root`(結論=支配的メッセージ): 頂点(縦)/左端(横)。accent 強調(境界/背景)。ツリーに1つ。
  - `branch`(根拠=MECE なキーライン): 第2階層。surface ノード＋強い label。2〜5個。
  - `leaf`(裏付け=個別データ): 末端(任意)。淡色・小。各 branch に 0〜N個。
- **属性**: `label`(見出し語)/ `body`(補足, 任意)。
- **状態遷移**: なし(静的表示)。

### Connector(コネクタ)
- **表すもの**: 親子ノードを結ぶ線(擬似要素のボーダー)。
- **属性**: `axis`(縦=上下辺 / 横=左右辺)/ `color`(既定 `var(--border)`, 強調 `var(--accent)`)。
- **不変条件**: 親1—子Nの分岐関係を視覚的に一意に示す。色は役割変数のみ、太さはボーダー px。

## Relationships

- Tree 1 — 1 root Node
- root Node 1 — N branch Node(MECE)
- branch Node 1 — 0..N leaf Node
- 各親子ペア 1 — 1 Connector

## サンプルコピー(ピラミッド・プリンシプル; 実装時に文言調整可)

- **root**: 「〈結論〉この構成を採用する」
- **branch(3, MECE)**: 「① 伝わりやすさ」「② 作りやすさ」「③ 保守しやすさ」
- **leaf(各branch下, 任意1)**: 「①→結論先出しで要点が即伝わる」「②→トークンで色/余白が一貫」「③→単一情報源で改修が局所化」

縦コア=上記を3階層で提示。横付録=同じ論理を左→右で提示(より深い/枝の多い構造の受け皿を示す)。

## 検証ルール(spec の FR/SC 由来)

- FR-004/SC-004: 色・余白・角丸・文字はトークン由来(生値ゼロ)。token-lint PASS。
- FR-005/SC-001: overflowX/Y ≤ 1(1280×720)。layouts.spec / deck 視覚回帰 PASS。
- FR-006/SC-002: root=1・branch 複数・親子コネクタ明示(役割の視覚差)。
- FR-011: 文字/背景コントラスト AA。a11y PASS。
