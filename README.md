# デジタル庁DS準拠 16:9 プレゼンテンプレート

デジタル庁デザインシステム(DS)のデザイントークンのみを視覚の源泉とし、16:9(1280×720)固定グリッドで構築した、フレームワーク非依存の HTML プレゼンテンプレート。プレゼン/データ可視化/認知・行動心理の確立されたベストプラクティスを、出典付きの注釈として各スライドに埋め込む。

## 特長

- **DS 準拠**: 配色・タイポ・余白・角丸・陰影はすべて `@digital-go-jp/design-tokens@2.0.1`(vendor 固定)由来。ブランドキー色は `#0031d8`(デジタル庁 HP 基調)。
- **計16レイアウト**:
  - コア8: 表紙 / 目次 / 章扉 / 本文 / 2カラム比較 / 図表 / まとめ / 参考。
  - 拡張8: ビッグナンバー / KPIダッシュボード / タイムライン / 2×2マトリクス / プロセス / 引用・証言 / 全面ビジュアル / クロージング。
- **手法網羅**: `docs/practices.md` の全採用手法が、いずれかのスライド注釈で実演される(`npm run check:coverage` で検証)。
- **コンポーネント集**: [components.html](components.html) にスライドへ差し込める再利用部品(コールアウト/バッジ/タグ/ボタン/データテーブル/プログレス/統計/凡例/区切り/チェックリスト/引用/キーバリューの12種)を見本 + コピー用コード付きで収録。トークン準拠・AA。
- **付録スライド**: `index.html` 末尾に、各コンポーネントを実際の 16:9 スライドで使った付録(Appendix A: 状態と通知 / B: 指標 / C: まとめ部品 / D: ダッシュボード〈ガイドブック準拠〉/ E: グラフ事例集〈多系列折れ線・100%積み上げ棒・ドーナツ・散布図〉)を収録。多系列は `--cat-1..7`。
- **共通フレーム**: 全スライドの四隅に取扱区分を表示 — 左下 Copyright / 右下 ページ番号(自動採番)/ 右上「（組織名）限定」「機密性N情報」。`<html data-org / data-copyright / data-confidentiality="1|2|3">` で設定。印刷でも保持。区分別の注意色は AA。
- **ダッシュボード整合**: デジタル庁「ダッシュボードデザイン実践ガイドブック」を踏襲。7パレット=DSプリミティブ、チャート指針=practices C群、グリッド整列を確認([docs/dashboard-consistency.md](docs/dashboard-consistency.md))。多系列は `--cat-1..7`(白背景 ≥3:1)。
- **設計意図の注釈**: 各スライドに既定非表示・トグル可能な注釈(適用手法 + 出典)。キー `A` で全体トグル。
- **発表モード**: キー `P`(またはツールバー「発表モード」)で 1 枚表示に切替え、ビューポートに合わせて自動縮尺。`←`/`→`/Space で移動(端で停止)、`F` で全画面、`Esc`/`P` で復帰。既定は縦スクロールのレビュー表示で、印刷(1スライド=1ページ)には影響しない。`prefers-reduced-motion` を尊重。
- **アクセシブル**: 主要テキストは WCAG 2.2 AA コントラスト。キーボードフォーカスリング(`:focus-visible`・トークン由来)、単一 `h1` + `main` ランドマーク + 各スライドのアクセシブル名/位置、多系列チャートは色以外の直接ラベルでも識別可能(色覚・グレースケール対応)。
- **更新追従**: DS 更新はセマンティック写像層のみで吸収(レイアウト無改修)。
- **PPT 変換対応(構造)**: 命名スロット + 固定グリッドで、将来の編集可能 PowerPoint 変換に適合。

## クイックスタート

```bash
npm install            # design-tokens@2.0.1(固定)を取得
npm run sync-tokens    # tokens/vendor/tokens.css を生成(不可侵層)
# index.html をブラウザで開く(ショーケース)。発表は P キーで発表モード。
# 個別レイアウト slides/0X-*.html は index.html から生成される派生物(直接編集しない):
node scripts/split-slides.mjs          # index.html から slides/ を再生成
node scripts/split-slides.mjs --check  # slides/ が index.html と一致するか検査(乖離で終了1)
```

詳細は [仕様](specs/001-ds-presentation-template/spec.md) / [計画](specs/001-ds-presentation-template/plan.md) / [Quickstart](specs/001-ds-presentation-template/quickstart.md)。

## ディレクトリ

| パス | 役割 |
|---|---|
| `tokens/vendor/tokens.css` | DS トークン(v2.0.1 複製・不可侵) |
| `styles/tokens.semantic.css` | セマンティック写像層(役割変数 + スペーシング) |
| `styles/grid.css` / `base.css` / `slides.css` / `layouts/*` | グリッド・基盤・レイアウト |
| `slides/0X-*.html` | レイアウト単体(著者コピー用) |
| `index.html` | 8レイアウトのショーケースデック |
| `assets/charts/*.svg` | トークン整形済みサンプル図(棒/折れ線/構成比) |
| `js/annotations.js` / `js/frame.js` / `js/present.js` | 注釈トグル / 四隅フレーム・スライド名 / 発表モード |
| `docs/practices.md` | 採用手法と出典(正本・ID 参照元) |
| `docs/ds-version-map.md` | DS 更新ランブック |
| `scripts/*` | sync-tokens / lint-tokens / check-crossrefs / split-slides |
| `tests/*` | 検証(Playwright + axe + node チェック) |

## 検証

```bash
npm run lint:tokens      # ハードコード検出(SC-02)
npm run check:crossrefs  # 注釈↔出典の相互参照(SC-05/FR-013)
npm run check:coverage   # 全採用手法の実演・未実演0(feature 002 SC-005)
npm run check:slides     # slides/ が index.html と一致(ドリフト検知, feature 005 FR-017)
node tests/a11y/contrast-tokens.mjs  # 役割色コントラスト(SC-04, node単体)
npm run test:visual      # レンダリング/overflow/視覚回帰/発表モード/チャート系列ラベル(要ブラウザ)
npm run test:a11y        # axe コントラスト + フォーカスリング + ランドマーク/見出し(要ブラウザ)
npm run test:print       # 1スライド=1ページ(SC-01, 要ブラウザ)
npm run verify           # 上記 node チェック + 3 スイートを一括実行
```

`test:*` は `npm install` と `npx playwright install chromium`(ネットワーク要)後に実行。

## PowerPoint テンプレート(.potx)への変換

`slides/` の 16 レイアウトを、PowerPoint の「新しいスライド」から選べるカスタムレイアウト入りの `.potx` に変換できる(詳細: [specs/005-pptx-export-script/quickstart.md](specs/005-pptx-export-script/quickstart.md))。

```bash
pip install -r scripts/pptx-template/requirements.txt  # python-pptx, lxml, pytest
npm run build:potx      # dist/ds-presentation-template.potx を生成
```

## フォント

既定は非同梱(システム + Noto Sans JP フォールバック)。完全再現が必要な場合は [docs/font-embedding.md](docs/font-embedding.md)。

## ライセンス / 出典

デザイントークン: [@digital-go-jp/design-tokens](https://github.com/digital-go-jp/design-tokens)。採用プラクティスの出典は [docs/practices.md](docs/practices.md)。
