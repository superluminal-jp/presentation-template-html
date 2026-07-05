# Phase 0 Research: スライドテンプレート → .potx 変換

## 1. ランタイム分担: Node(Playwright)抽出 + Python(python-pptx)組み立て

- **Decision**: DS トークンの実効値(色・フォント・座標)取得は既存の Playwright 基盤(`tests/visual` 等で既に依存関係済み)でヘッドレスブラウザ描画・`getComputedStyle` 抽出を行い、中間 JSON を出力する。`.potx` の組み立ては `python-pptx`(+ `lxml`)で行う。
- **Rationale**: ブラウザの CSS カスケード解決(`var(--...)` の実効値、レイアウトの計算済み座標)を自前実装で再現するのは高コストかつ HTML 側の実描画とズレるリスクがある。既存の Playwright 依存を再利用すれば、視覚回帰テストと同じ「実際にブラウザがレンダリングした値」を単一の信頼できる情報源にできる。一方で OOXML(`.potx`)の生成に成熟したライブラリは Python の `python-pptx` が実質的に唯一であり、`docs/requirements.md` でも第一候補として明記済み。
- **Alternatives considered**:
  - 純 Python(`tinycss2` 等)で CSS カスケードを自前解決 → ブラウザの計算方式(継承・優先順位・`calc()`)を再実装することになり保守コストが高く、実描画との乖離リスクも残るため却下。
  - 純 Node の `.pptx` 生成ライブラリ(例: `pptxgenjs`)で完結 → カスタムスライドレイアウト/マスターの単位での構築や `.potx` のコンテンツタイプ生成に対する一級サポートが弱く、要求(FR-002, FR-012 等)を満たすには結局低レベル XML 操作が必要になるため、実績のある `python-pptx` を採用。

## 2. 中間データ形式

- **Decision**: 抽出ステップは `build/slide-layout-data.json`(コミット対象外)に、レイアウトごとに以下を出力する: レイアウト ID/名称、キャンバスサイズ(1280×720 の px 座標系)、意味的要素(title/subtitle/body/meta/image/frame)ごとの bounding box(px、後で 13.333in×7.5in へ比率変換)、解決済みの色・`font-family`・`font-size`・`font-weight`・`line-height`、要素ロール、および複雑要素(ダッシュボードのグラフ等)についてはラスターフォールバック用の PNG パスと理由。
- **Rationale**: Node/Python の 2 ランタイムを疎結合にでき、既存のビルド成果物(Playwright のスクリーンショット等)と同様に「生成物は Git 管理外」という規約に合致する。
- **Alternatives considered**: Python プロセスから子プロセスとして Node/Playwright を都度呼び出す一体型スクリプト → 制御フローが複雑になり、抽出結果の単体検証(pytest フィクスチャ化)がしづらくなるため却下。

## 3. `.potx` の妥当な OOXML コンテンツタイプ生成

- **Decision(2026-07-05 実装検証により更新)**: 当初案(あらかじめ用意した `.potx` シードファイルを `python-pptx` の `Presentation()` で開いて編集する)は採用不可と判明した。`python-pptx` の `Presentation()` ローダーは `presentation_part.content_type` を `PML_PRESENTATION_MAIN`(通常の `.pptx`)または `PML_PRES_MACRO_MAIN` のみに限定しており、テンプレート content-type(`...presentationml.template.main+xml`)のパッケージは `ValueError` で明示的に拒否される(`pptx/api.py` の `_is_pptx_package`)。
  代わりに、通常の `.pptx` として `python-pptx` で全編集(スライドレイアウト複製・テーマ上書き・プレースホルダー配置等)を完了させ、`prs.save()` で一時 `.pptx` に保存した後、その ZIP パッケージの `[Content_Types].xml` 内の `/ppt/presentation.xml` の content-type のみを `...presentationml.presentation.main+xml` → `...presentationml.template.main+xml` に書き換えて `.potx` として最終出力する(シードファイルは不要)。
- **Rationale**: `python-pptx` はビルド・編集の間は通常の `.pptx` content-type を要求するため、テンプレートへの変換は「編集がすべて完了した最終成果物」に対する仕上げのポストプロセスとしてのみ行うのが唯一実行可能な経路。シードファイルを別途メンテナンスする必要がなくなり、構成もシンプルになる。
- **Alternatives considered**:
  - 当初案(`.potx` シードを `Presentation()` で開く)→ 上記の理由で技術的に不可能と判明し却下。
  - `.pptx` のまま配布し利用者に手動でリネーム・プロパティ変更させる → FR-011(出力形式の直接指定)を満たさず、利用者体験も悪いため却下。

## 4. カスタムスライドレイアウトの追加

- **Decision**: `python-pptx` の高レベル API は新規スライドレイアウトの「追加」を直接サポートしないため、シード内の既存レイアウトパートを `lxml` でクローンし、レイアウト名・プレースホルダー構成(タイトル/本文/画像等の種類・位置・サイズ)を `layout_map.py` の対応表に従って書き換える。
- **Rationale**: OOXML 上、スライドレイアウトはスライドマスターの子パートであり、追加はパートの複製 + `presentation.xml` 側の関係定義更新で実現するのが確立した手法。
- **Alternatives considered**: 16 レイアウトぶんの内容をすべて 1 つのレイアウトに詰め込みユーザー側で都度手動編集させる → FR-002/FR-012(名前付き 16 レイアウト)を満たせず却下。

## 5. テーマ配色・フォントの上書き(Clarification #2 準拠)

- **Decision**: プレゼンテーションの `ThemePart`(`<a:theme><a:themeElements><a:clrScheme>`/`<a:fontScheme>`)を `lxml` で直接編集し、DS トークンロール(`--accent`, `--text-primary`, `--text-secondary`, `--surface`, `--slide-bg`, `--state-success/error/warning` 等)を Office テーマの 12 スロット(dk1/lt1/dk2/lt2/accent1-6/hlink/folHlink)へ、`--font-sans`(Noto Sans JP)を `majorFont`/`minorFont` の `latin` タイプフェースへマッピングする。
- **Rationale**: プレースホルダー個別の塗り色設定だけでは、ユーザーが新規に描画する図形・テキストには反映されない。テーマそのものを書き換えることが OOXML で「既定色/既定フォントをプレゼンテーション全体に適用する」唯一の手段。
- **Alternatives considered**: 各プレースホルダー/レイアウトに個別の明示色を設定するのみ → Clarification #2 で明示的に却下された選択肢(User Story 2 / FR-005 参照)。

## 6. 代替テキスト・読み上げ順序(Clarification #4 準拠)

- **Decision**: 画像・図表プレースホルダーには `cNvPr/@descr` 属性(`lxml` での直接編集、`python-pptx` の高レベル API に露出していない)へ代替テキスト用ヒントを設定する。読み上げ順序はレイアウト XML の `<p:spTree>` 内でのシェイプ挿入順(タイトル→本文→補足コンテンツ)によって制御する。
- **Rationale**: OOXML において両者を制御する標準機構はこれのみであり、`python-pptx` の高レベル API では未サポートのため低レベル編集が必須。
- **Alternatives considered**: なし(OOXML 仕様上の唯一の実現方法)。

## 7. 複雑要素のラスターフォールバック

- **Decision**: ダッシュボードのグラフや装飾的 SVG など、ネイティブ図形として再現しない要素は、抽出ステップ(Playwright)で該当 DOM ノードを 2 倍スケールの PNG としてクロップ撮影し、中間 JSON に `fallback: true` と理由を記録する。Python 側はこの PNG を `Picture` シェイプとして該当レイアウトに配置し、変換ログに WARNING を出力する(FR-008/FR-009)。
- **Rationale**: 同じ Playwright ブラウザコンテキストを再利用でき、別途スクリーンショット基盤を用意する必要がない。
- **Alternatives considered**: Python 側で HTML を再レンダリングしてラスタライズ → 二重のレンダリングパイプラインとなり、抽出時とスタイルがズレるリスクがあるため却下。

## 8. テスト戦略

- **Decision**: (a) Node 側は既存 Playwright テスト規約に沿い、抽出 JSON のスキーマ・値を検証するテストを追加。(b) Python 側は `pytest` で、固定フィクスチャ(`tests/pptx/fixtures/slide-layout-data.sample.json`)を入力に `build_potx.py` のロジックを呼び出し、生成 `.potx` の ZIP 内に 16 個の `slideLayout*.xml` パートが存在すること、プレースホルダー種別・件数、テーマ配色の RGB 値が期待通りであることをアサートする。(c) 実際の PowerPoint デスクトップでの目視確認(SC-007)は自動化対象外とし、`quickstart.md` に手動 QA 手順として明記する。
- **Rationale**: 既存のテスト文化(Playwright)を踏襲しつつ、Python 部分は `python-pptx` エコシステムの標準である `pytest` を採用するのが最小の追加コストで最大の検証範囲を得られる。
- **Alternatives considered**: PowerPoint 描画結果の自動視覚差分ツール導入 → 本フェーズのスコープ外(既存ツール予算にない大掛かりな追加)として却下。

## Outstanding NEEDS CLARIFICATION

なし。spec.md の Clarifications セッションで主要な曖昧性は解消済みであり、本 Phase 0 調査で技術的な未決事項も解決済み。
