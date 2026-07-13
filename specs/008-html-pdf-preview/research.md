# Phase 0 Research: HTML→PDF 生成物を Claude Code が確認・評価するフロー

Technical Context に未解決の NEEDS CLARIFICATION は無いが、設計上の主要判断を以下に記録する。

## R1. PDF 生成手段

- **Decision**: Playwright（chromium）で `index.html` を `file://` で開き、`page.emulateMedia({ media: 'print' })` の上で `page.pdf({ width: '1280px', height: '720px', printBackground: true })` を実行し `dist/deck.pdf` に書き出す、再利用可能なスクリプト `scripts/pdf/build-pdf.mjs`（npm `build:pdf`）を追加する。
- **Rationale**: 同一手順が既に `tests/print/print.spec.mjs` でスモーク実証済み（例外なく PDF 生成できることを確認済み）。Playwright は既存 devDependency で新規依存が不要。`@media print`（1スライド=1ページ）をそのまま版面の正として使え、二重定義を生まない（FR-010 / SC-007）。
- **Alternatives considered**:
  - ブラウザの手動印刷（Cmd+P）→ 再現性・自動化不可、Claude Code 主体化に不適。
  - `weasyprint` / `wkhtmltopdf` 等の外部エンジン → 新規依存・CSS 解釈差異による版面ドリフトの懸念。却下。
  - Chromium ヘッドレス CLI 直叩き → Playwright で同等かつ既存資産と統一できるため不要。

## R2. Claude Code へのページ供給（画像としての読み込み）

- **Decision**: 一次経路は「Claude Code が `dist/deck.pdf` を Read ツールの `pages` パラメータで直接ページ単位に視覚読み込みする」。ラスタライズは必須としない。堅牢化のための任意経路として `build-pdf.mjs --png` で per-slide PNG（`dist/pdf-pages/NN.png`）も出力可能にする。
- **Rationale**: 本ハーネスの Read ツールは PDF をページ指定で視覚的に読める。追加のラスタライズ依存（pdftoppm/ghostscript 等）を避けられ、FR-002「各ページ画像として読み込める形」を最小構成で満たす。PNG 経路は PDF 直読が使えない環境・ツール向けのフォールバック。
- **Alternatives considered**:
  - 常に PDF→PNG 変換して PNG のみ供給 → 外部ツール依存が増える。既定にしない。
  - per-slide スクリーンショット（deck.spec 相当）を評価入力にする → 「PDF 生成物の評価」という主旨（配布実体＝PDF）からずれるため一次経路にしない。

## R3. 決定的な下地チェック（ページ数=スライド枚数・生成成功）

- **Decision**: `scripts/pdf/check-pdf.mjs` で (a) `dist/deck.pdf` の存在と非自明サイズ（>1KB）、(b) PDF 内のページ数を `index.html` 内の `.slide` セクション実数と照合、を検証し、不一致で非0終了する。ページ数は PDF バイト列の `/Type /Page`（`/Pages` を除外）出現数で数える依存フリー方式を採る。スライド枚数は `index.html` を正規表現で数え、ハードコードしない（FR-008）。加えて既存 `print.spec.mjs` の page-break 検証を継続利用する。
- **Rationale**: 主観評価（Claude Code）を、決定的指標（枚数一致・生成成功）で裏打ちする方針（SC-002）。PDF パーサ依存を足さずに実装でき、リポジトリの「依存を増やさない」方針に整合。
- **Alternatives considered**:
  - `pdf-lib`/`pdfjs-dist` を導入して厳密にページ数取得 → 新規依存。現時点の要件（枚数一致の確認）には過剰。将来必要になれば差し替え可能。
  - PDF→PNG 変換してファイル数で数える → 外部ツール依存。却下。
- **Risk/Note**: `/Type /Page` 正規表現は Chromium 生成 PDF では安定的だが、圧縮オブジェクトストリームを使う生成器では過小計数の可能性がある。Chromium 出力に限定した前提を README/契約に明記する。

## R4. Claude Code による評価（描画破綻＋設計意図適合）

- **Decision**: 評価基準を `contracts/evaluation-rubric.md` に契約として固定する。描画破綻チェック（見切れ・ページ分裂・フレーム欠落・要素重なり/崩れ・文字化け）と、設計意図適合チェック（DS 準拠配色・トークン、アクションタイトル、視覚階層、1スライド1メッセージ、コントラスト/可読性）の 2 系統。出力はスライド単位の構造化レポート（表形式：slide / 描画 / 設計 / 所見）。判定不能ページは「評価不能」を明示し合格扱いにしない（FR-013）。
- **Rationale**: 設計意図の基準はデックが既に掲げるもの（`docs/practices.md`・注釈 `data-practice`・DS トークン）に依拠し、新たな基準体系を作らない（重複回避／spec の Assumption）。ルーブリックを契約化することで評価の再現性・追跡性を担保。
- **Alternatives considered**:
  - 自由記述の総評のみ → 追跡不能・回帰に使えない。構造化必須。
  - 数値スコアリング（点数化）→ 主観の擬似定量化で誤解を生む。合否＋所見に留める。

## R5. ブラウザ確認（P2, 可能な環境で）

- **Decision**: Claude Code が Chromium で `index.html`（`file://`）を開き、全スライドの画面表示と 1 つ以上の対話挙動（発表モード `P` / 注釈トグル `A`）を観察して所見に反映する。実行手段は既存 Playwright（ヘッデッド/スクリーンショット）または claude-in-chrome を許容。環境が無ければスキップし、PDF 確認（P1）で完結させる（FR-007）。
- **Rationale**: 対話挙動・スクリーン専用表示は PDF に現れないため補完価値がある一方、必須にすると環境依存で壊れる。条件付き能力に留める。
- **Alternatives considered**:
  - ブラウザ確認を必須化 → CI/無 GUI 環境で失敗。却下。

## R6. 成果物のバージョン管理

- **Decision**: `dist/deck.pdf` を追跡対象にする（既存の `dist/sample-deck.pptx` と同じ扱い）。`.gitignore` に `!dist/deck.pdf` を追加して例外指定する。`dist/pdf-pages/` 等その他の一時生成物は追跡しない（FR-011）。
- **Rationale**: ビルド（Playwright/Chromium）不要で PDF をレビュー・閲覧でき、Claude Code も追加ビルドなしに評価入力へアクセスできる。PPTX 成果物を追跡している既存方針と一貫。
- **Trade-off**: デック変更のたびに 6MB 級バイナリが再コミットされ差分ノイズ・履歴肥大が生じる。レビュー容易性を優先しユーザー判断で許容（本フローの主眼が「Claude Code による PDF 確認」であることと整合）。
- **Alternatives considered**: gitignore のまま毎回ローカル生成 → リポジトリは軽いが、レビュー時に各自ビルドが必要。ユーザー判断で不採用。

## 依存関係サマリ

- 新規ランタイム依存: **なし**
- 既存流用: `@playwright/test`（PDF 生成・任意のブラウザ観察）、Node 標準 `fs`/`url`/`path`、既存 `@media print` CSS、既存 `.gitignore`/`dist/` 規約
