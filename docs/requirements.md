# プレゼンテーションテンプレート 要求仕様

最終更新: 2026-07-04

## 0. 目的(なぜ)
デジタル庁デザインシステム(DS)のデザイントークンを厳守し、かつデジタル庁ホームページ(digital.go.jp)の配色を踏襲したうえで、確立されたプレゼンテーション・データ可視化・認知科学のベストプラクティス(McKinsey/Minto に限らず広く)を組み込んだ、ビジネス/ソフトウェア開発で再利用可能な 16:9 プレゼンテンプレートを確立する。将来の PowerPoint テンプレート変換を見据え、変換容易な固定グリッド構造とする。DS 側のアップデートを低コストで取り込める実装とする。

## 1. 確定事項サマリ
| 論点 | 決定 |
|---|---|
| テンプレ範囲(フェーズ1) | コアセット 約8種 |
| DS 準拠度 | デザイントークン準拠 + 16:9 スライド最適化 |
| 実装方式(正本) | 素の HTML/CSS + 固定グリッド(FW 非依存) |
| 手法の明示 | ①各スライドの注釈レイヤー + 巻末リファレンス ②別途 解説 markdown |
| 配色 | DS カラートークン準拠 = デジタル庁ホームページ配色を踏襲 |
| DS 更新取り込み | npm `@digital-go-jp/design-tokens` を依存に固定し CSS 変数を参照 |

## 2. スコープ(MoSCoW)
### Must
- 16:9(基準 1280×720px)固定グリッドの HTML スライド、コア 8 レイアウト:
  表紙 / 目次 / 章扉 / 本文 / 2カラム比較 / 図表 / まとめ / 参考(出典一覧)
- DS デザイントークンを CSS カスタムプロパティ経由で参照(値のハードコード禁止)
- デジタル庁ホームページ配色の踏襲(DS カラートークン由来で担保。HP 固有の差分がある場合は薄い「ブランドオーバーレイ」層で吸収)
- 各スライドに設計意図の注釈レイヤー(トグルで表示/非表示)
- 採用プラクティスの解説 markdown(出典付き)を別ファイルで作成
- DS 更新取り込み手順の確立(バージョン固定・差分レビュー・視覚回帰確認)

### Should
- WCAG 2.2 AA コントラスト検証、印刷/PDF 出力対応(`@media print`)
- アクションタイトル(要点を文で示す見出し)を全レイアウトの既定に
- DS バージョン対応表を docs に記録

### Could
- ダークテーマ、キーボードによるスライド送り
- Marp などの Markdown 著者レイヤー(HTML 正本と CSS テーマを共有)

### Won't(フェーズ1では対象外)
- PowerPoint への実変換(フェーズ2)、アニメーション、CMS 連携、多言語切替

## 3. 組み込むプラクティスと出典(テンプレ内・解説 md に明示)
McKinsey/Minto に限らず、構成・スライド設計・データ可視化・認知科学・行動心理の各領域から確立された実践を採用する。5 群(A〜E)に整理(MECE)。粒度は 2 軸で網羅する:**プレゼン全体(§3.A)** と **1 ページ内(§3.B)**、両者を支える横断群(§3.C データ可視化 / §3.D 認知科学 / §3.E 行動心理)。

### 3.A 構成・ストーリー(プレゼン全体|何をどの順で)
| 手法 | テンプレへの適用 | 出典 |
|---|---|---|
| Pyramid Principle / MECE | 構成順序・目次・要旨先行 | Minto, *The Minto Pyramid Principle* (2009) |
| アクションタイトル / So-what | 各スライド見出しを結論文に | McKinsey communication practice; Zelazny, *Say It With Charts* (2001) |
| Assertion–Evidence 構造 | 文headline + 視覚evidence の本文型 | Alley, *The Craft of Scientific Presentations* (2013) |
| SCQA / ストーリー設計 | 表紙・導入の課題提起 | Minto (2009); Duarte, *Resonate* (2010) |
| フック & スルーライン & CTA | 導入の掴み・一貫した主張軸・締めの行動喚起 | Anderson, *TED Talks* (2016); Duarte, *Resonate* (2010) |
| サインポスティング / 道標 | 目次の現在地・章扉・区切りで全体構造を可視化 | Lidwell et al., *Universal Principles of Design* (2010, "Wayfinding") |
| 一貫性 / テンプレート化 | 全スライドで反復するレイアウト規則 | Williams, *The Non-Designer's Design Book* (2014, Repetition) |
| SUCCESs(記憶に残る) | まとめ・要旨のメッセージ設計 | Heath & Heath, *Made to Stick* (2007) |
| 10/20/30 ルール | スライド枚数・文字量の目安 | Kawasaki, "The 10/20/30 Rule of PowerPoint" (2005) |

### 3.B スライド設計・レイアウト(1 ページ内|どう見せる)
| 手法 | テンプレへの適用 | 出典 |
|---|---|---|
| 視覚階層(明示) | サイズ/太さ/色で重要度の読み順を設計 | Lidwell et al., *Universal Principles of Design* (2010) |
| 視線誘導パターン(F / Z / グーテンベルク) | 主要要素を視線動線上に配置 | Nielsen, "F-Shaped Pattern" (NN/g, 2006); Lidwell et al. (2010, Reading Gravity) |
| 余白 / ネガティブスペース(明示) | 要素の分離・焦点化・可読性向上 | White, *The Elements of Graphic Design* (2011) |
| C.R.A.P.(対比・反復・整列・近接) | グリッド・見出し・余白規則 | Williams, *The Non-Designer's Design Book* (2014) |
| ゲシュタルト原則 | 近接・整列・グルーピング | Wertheimer (1923); Koffka (1935) |
| Signal-to-Noise / 簡潔性 | 装飾排除・1スライド1メッセージ | Reynolds, *Presentation Zen* (2019); Duarte, *slide:ology* (2008) |
| Von Restorff 効果 | 強調色は 1 スライド 1 箇所 | von Restorff (1933) |
| Fitts の法則 | 操作要素の大きさ・配置 | Fitts (1954) |
| WCAG 2.2 | コントラスト・可読性 | W3C WCAG 2.2 |

### 3.C データ可視化(数字をどう示す)
| 手法 | テンプレへの適用 | 出典 |
|---|---|---|
| Cleveland–McGill 知覚順位 | チャート種別の選択指針 | Cleveland & McGill, *JASA* (1984) |
| データインク比 | 装飾排除・余白活用 | Tufte, *Visual Display of Quantitative Information* (1983) |
| 事前注意特性(preattentive) | 色・位置での焦点誘導 | Ware, *Information Visualization* (2012) |
| Storytelling with Data | 不要要素除去・注意の集中 | Knaflic, *Storytelling with Data* (2015) |
| ダッシュボード設計 | KPI 表示・比較レイアウト | Few, *Information Dashboard Design* (2006) |

### 3.D 認知科学的基盤(なぜ効くか)
| 手法 | テンプレへの適用 | 出典 |
|---|---|---|
| 認知負荷理論 | 1 スライド 1 メッセージ | Sweller (1988) |
| マルチメディア学習原則(signaling/coherence/redundancy) | 注釈・図と文の対応・冗長排除 | Mayer, *Multimedia Learning* (2009) |
| Miller の法則(7±2) | 箇条書き/要素数の上限設計 | Miller, *Psychological Review* (1956) |
| Hick の法則 | 選択肢・ナビ要素を絞る | Hick (1952); Hyman (1953) |
| 系列位置効果 | 冒頭/末尾に重要メッセージ | Murdock (1962) |
| 画像優位性 / 二重符号化 | 図解の活用 | Paivio (1971); Kosslyn, *Clear and to the Point* (2007) |

### 3.E 行動心理学・意思決定(記憶・説得・選択)
誠実利用が前提。事実に基づく強調・理解促進に用い、誇張や誘導的操作には用いない(グローバル方針「正確性・人間中心」と整合)。

| 手法 | テンプレへの適用 | 出典 |
|---|---|---|
| ピーク・エンドの法則 | 山場スライド + 強い締めを構造化(章扉/まとめの重み付け) | Kahneman, *Thinking, Fast and Slow* (2011) |
| 認知的流暢性 | 高コントラスト・平易な語・簡潔文で理解=納得を担保 | Alter & Oppenheimer (2009) |
| フレーミング効果 | 利得/損失フレームを意図して選択(比較・提案) | Tversky & Kahneman (1981) |
| アンカリング | 冒頭に基準値を提示し数値解釈を誘導(図表・KPI) | Tversky & Kahneman (1974) |
| 進捗 / ゴール勾配 | 目次に現在地・進捗表示で離脱防止 | Kivetz et al. (2006); Hull (1932) |
| 美的ユーザビリティ効果 | 整った体裁が使いやすさ・信頼の知覚を高める | Kurosu & Kashimura (1995) |
| デフォルト効果 / 選択設計 | 推奨案を既定強調(意思決定スライド) | Thaler & Sunstein, *Nudge* (2008) |
| Cialdini の 6 原理(条件付き) | 事実に基づく社会的証明・権威・希少性等のみ(誇張・誘導は不可) | Cialdini, *Influence* (2021) |

※年・書名は上記が正確。ページ番号など細部は解説 md(`practices.md`)作成時に一次資料で確認する。

## 4. デザイントークンと DS 更新取り込み設計
### 4.1 配布形態(確認済み)
- DS トークンは npm パッケージ `@digital-go-jp/design-tokens` で配布。
- Figma(Tokens Studio)→ GitHub → GitHub Actions(Style Dictionary)→ npm publish の自動フロー。
- 出力: `tokens.css`(全トークン)/ `tokens-simple.css`(色・フォント・elevation のサブセット)。
- Figma 版と npm 版はバージョン対応表で管理(例: Figma 2.14.0 ↔ package 2.0.0)。
- 出典: [digital-go-jp/design-tokens](https://github.com/digital-go-jp/design-tokens), [npm @digital-go-jp/design-tokens](https://www.npmjs.com/package/@digital-go-jp/design-tokens)

### 4.1.1 実測結果(v2.0.1, tokens.css)
- 命名 3 層: `--color-primitive-*`(生パレット 13 色×13 階調)/ `--color-neutral-*`(solid/opacity グレー)/ `--color-semantic-*`(success/error/warning)/ `--color-key-*`(ブランドキー=青)。
- デジタル庁プライマリ青 = `--color-key-800: #0031d8`(ホームページ基調と同一系)。キー色は blue プリミティブのエイリアス。
- タイポ: `--font-family-sans: 'Noto Sans JP', …`、`--font-family-mono: 'Noto Sans Mono'`、`--font-size-14〜64`、`--font-weight-400 / -700`(medium 無し)、`--line-height-100〜175`。
- 角丸 `--border-radius-4〜full`、影 `--elevation-1〜8`。
- **欠落 1: スペーシング(余白)トークンが本パッケージに無い** → 4/8px リズムのスペーシングスケールを自前層で定義し DS 更新とは独立管理。
- **欠落 2: 背景/サーフェス/本文文字色などスライド用の意味ロールが未定義**(semantic は success/error/warning のみ、text/surface ロールは含まれない) → セマンティック写像層(TokenMappingLayer)で `--color-key-*` `--color-neutral-*` を役割名に写像。

### 4.2 取り込み方針(低コスト追従)
1. `package.json` で `@digital-go-jp/design-tokens` をバージョン固定して依存に追加。
2. テンプレの CSS は `tokens.css` を読み込み、色・タイポ・余白・角丸・elevation は **`var(--...)` の参照のみ**とする(値のハードコード禁止 = SC-02)。
3. ホームページ配色は同一 DS トークン由来のため、トークン参照で自動的に整合。HP 固有の差分のみを最小限の「ブランドオーバーレイ」CSS 層で上書き(存在する場合のみ)。
4. 更新は `npm update` → CSS 変数差分をレビュー → 視覚回帰(全レイアウトのスクリーンショット比較)で確認 → バージョン対応表を更新。
5. DS で命名・廃止されたトークンはオーバーレイ層のエイリアスで吸収し、テンプレ本体の改修を最小化。

## 5. 実装方式の比較(HTML 以外の検討)
| 方式 | DS トークン取込 | 保守性 | 編集可能 PPT 出力 | 判定 |
|---|---|---|---|---|
| 素 HTML/CSS(採用=正本) | ◎ `tokens.css` を直接参照 | ◎ | △(python-pptx で別途生成) | 採用 |
| Marp(Markdown→スライド) | ○ テーマ CSS に取込可 | ◎ 著者体験良 | ×(PPTX は画像化=非編集) | 補助候補 |
| reveal.js | ○ | ○ | × | 不採用(FW 依存) |
| python-pptx 単独 | △ 値の手写経になりがち | △ | ◎ | フェーズ2 の変換器として併用 |
| Slidev | ○ | ○(開発者向け) | × | 不採用 |

**結論**: 視覚の正本は素 HTML/CSS(DS トークンを CSS 変数でそのまま参照でき、更新追従とホームページ配色踏襲を最も低コストに満たす)。編集可能な PowerPoint はフェーズ2で python-pptx により「レイアウト対応表」からプログラム生成する。Marp は Markdown での量産が必要になった場合の著者レイヤーとして、同じテーマ CSS を共有する形で追加検討。

## 6. 非機能要件(FURPS+)
- Usability: コントラスト比 本文 4.5:1・大見出し 3:1 以上、基準フォント Noto Sans JP、本文最小サイズ規定
- Performance: 外部ネットワーク依存なし(トークン CSS・フォントはローカル同梱/フォールバック指定)
- Portability: 主要ブラウザ最新版 + 印刷、固定グリッドで PPT マッピング可能、PPT 既定寸法(13.333″×7.5″)と整合
- Maintainability: トークンは DS 由来 CSS 変数に集約、レイアウトは命名クラスで再利用、DS 更新はバージョン更新で追従
- Constraints: DS トークン厳守、ハードコード禁止

## 7. 受け入れ基準(検証可能)
- SC-01 8 レイアウトすべてが 1280×720 で崩れず表示され、`@media print` で 1 スライド = 1 ページ出力される
- SC-02 全色・タイポ・余白が DS トークン由来 CSS 変数で表現され、値のハードコードが無い
- SC-03 各スライドに注釈レイヤーがあり、表示/非表示を切替できる
- SC-04 主要テキストのコントラスト比が WCAG 2.2 AA を満たす
- SC-05 解説 md に全採用手法が出典付きで列挙され、テンプレ内リファレンスと相互参照できる
- SC-06 表紙/章扉/本文/比較/図表/まとめの見出しがアクションタイトル形式である
- SC-07 `@digital-go-jp/design-tokens` がバージョン固定で依存に含まれ、`npm update` によるトークン更新がテンプレ本体の改修なしに反映される
- SC-08 配色がデジタル庁ホームページ(DS カラートークン)と整合する

## 8. 残リスク・前提(訂正あれば指摘ください)
- DS バージョンは最新参照(confidence: M)。特定版固定の指定があれば反映する。
- Web フォント配布可否(ライセンス/同梱方針)未確定(M)。未指定ならシステムフォント + Noto Sans JP フォールバックで進行。
- ホームページ固有の配色差分の有無は実装時に実サイトで確認(M)。差分があればブランドオーバーレイ層で吸収。
- PPT 変換手段はフェーズ2で確定(python-pptx を第一候補)(M)。
