# Phase 0 Research: デジタル庁DS準拠 16:9 プレゼンテンプレート

**Date**: 2026-07-05 | **Feature**: 001-ds-presentation-template

`/speckit-clarify` により未解決の NEEDS CLARIFICATION は無し(図表スコープ・フォント同梱・トークン版・注釈既定状態を確定済み)。本書は実装を左右する技術判断を確定する。

## R1. トークン層構成(vendor / 写像 / レイアウト)

- **Decision**: 3 層に分離する。(1) `tokens/vendor/tokens.css` = DS 配布物 v2.0.1 を無改変で複製(不可侵)。(2) `styles/tokens.semantic.css` = 役割名への写像 + スペーシングスケール + ブランドオーバーレイ。(3) レイアウト CSS は役割変数のみ参照。
- **Rationale**: DS 更新の影響を写像層に閉じ込め、レイアウト無改修での追従(SC-07)を構造的に保証。vendor を不可侵にすることで `npm update` 差分レビューが機械的になる。
- **Alternatives considered**: (a) レイアウトから DS プリミティブ変数を直接参照 → 改名・廃止時に全レイアウト改修が必要で SC-07 未達。(b) Sass 等でビルド時に値を焼き込み → ハードコード化し SC-02 と衝突、更新追従不可。

## R2. スペーシングスケール(DS 非提供分の補完)

- **Decision**: 4/8px リズムの自前スケール `--space-1..12`(4,8,12,16,24,32,40,48,64,80,96,128px)を写像層に定義。DS 更新とは独立管理し、`docs/practices.md`/`ds-version-map.md` に「DS 外の自前定義」と明記。
- **Rationale**: 実測で design-tokens v2.0.1 にスペーシングトークンが存在しない(要求 §4.1.1 欠落1)。8px グリッドは DS のレイアウト規範とも整合し、余白/ネガティブスペース原則(§3.B)を体系化できる。
- **Alternatives considered**: Figma 側スペーシングの手写経 → 出典の版管理が二重化し保守困難。任意 px 直書き → C.R.A.P. の反復性・SC-02 と衝突。

## R3. 意味ロールの写像(背景/サーフェス/文字/アクセント)

- **Decision**: `--slide-bg=neutral-white`、`--surface=neutral-solid-gray-50`、`--text-primary=neutral-solid-gray-800(#333)`、`--text-secondary=neutral-solid-gray-600`、`--accent=color-key-800(#0031d8)`、`--border=neutral-solid-gray-200`、状態色は `--color-semantic-*` を写像。強調は `--accent` を 1 スライド 1 箇所(Von Restorff)。
- **Rationale**: design-tokens は text/surface 役割を持たない(要求 §4.1.1 欠落2)。キー色 800 と gray-800 本文の組み合わせは WCAG AA を満たす見込み(R6 で自動検証)。ホームページ基調(key-800)と一致し FR-004/SC-08 を満たす。
- **Alternatives considered**: semantic の success/error/warning を汎用文字色に流用 → 意味の誤用で保守性低下。

## R4. フォント戦略

- **Decision**: 既定は非同梱。`--font-family-sans`(Noto Sans JP → system-ui フォールバック)を DS トークン経由で参照。ピクセル忠実/オフライン完全再現が要る配布向けに、Noto Sans JP を `assets/fonts/` へ同梱し `@font-face` で解決する手順を `docs/` に文書化(オプション)。
- **Rationale**: 「外部ネットワーク依存なし」を既定で満たしつつ軽量(Clarify Q2=C)。font-weight は 400/700 のみ(medium 無し)なので、強調は太字 + アクセント色で表現。
- **Alternatives considered**: Web フォント CDN 参照 → 外部依存で NFR 違反。常時同梱 → 配布サイズ増を全利用者に強制。

## R5. 検証ツールチェーン(受け入れ自動化)

- **Decision**: Playwright を単一の検証基盤に採用。(a) 1280×720 レンダリングのはみ出し検査(SC-01)、(b) `page.pdf()` で 1スライド=1ページ検証(SC-01)、(c) レイアウト別スクリーンショットの視覚回帰(SC-07: DS 更新前後比較)。axe-core をコントラスト監査(SC-04)。`lint-tokens.mjs` で vendor 以外のハードコード検出(SC-02)。
- **視覚回帰の差分許容閾値**: レイアウトあたり変化ピクセル比 **≤ 0.1%**(アンチエイリアス起因の微差は無視、`maxDiffPixelRatio: 0.001`)。これを超える差分は SC-07 の失敗として扱う。
- **Rationale**: 静的テンプレートの SC は「見た目の安定」「コントラスト」「トークン純度」「印刷」に集約され、Playwright + axe + lint で機械検証可能。ブラウザ実体で検証するため PPT 変換前の忠実性も担保。
- **Alternatives considered**: 手動目視のみ → SC-07 の回帰検知が属人化。単体テストのみ → レンダリング/印刷を検証できない。

## R6. コントラスト適合の事前確認

- **Decision**: 主要トークン組み合わせ(`--text-primary #333` on `--slide-bg #fff`、`--accent #0031d8` on `#fff`、白文字 on `--accent`)をコントラスト計算し、本文 4.5:1・大見出し 3:1 を満たす配色のみ役割に採用。実測: #333/#fff ≈ 12.6:1(AA 合格)、#0031d8/#fff ≈ 10.4:1(合格)。境界的な淡色キー(key-400/500)は本文用途に使わない。
- **Rationale**: FR-010/SC-04 を設計段階で保証し、axe-core 検証を「回帰検知」に限定する。
- **Alternatives considered**: 実装後にのみ検証 → 役割選定のやり直しリスク。

## R7. PPT 変換可能性の構造制約(フェーズ2 準備)

- **Decision**: 各レイアウトを「命名スロット(タイトル/本文/図表枠/脚注/道標)」の固定グリッド配置で定義し、スロット座標・寸法を `contracts/pptx-layout-map.schema.json` に対応付け可能な形にする。段組・絶対配置は px 基準(1280×720)で PPT 既定寸法(13.333″×7.5″ = 960×540pt)へ線形写像。変換を妨げる構成(複雑な CSS グリッドの自動フロー依存、擬似要素での本文表示等)を本文テキストに用いない。
- **Rationale**: フェーズ2で python-pptx がスロット→プレースホルダに機械写像でき、編集可能なネイティブ PPT を生成できる(FR-012)。本フェーズは実変換せず構造適合のみ担保。
- **Alternatives considered**: レイアウトを自由フローで作り後で変換 → スロット同定が困難で変換器が壊れやすい。

## R8. 出典の二重管理回避(注釈 ↔ practices.md ↔ 巻末)

- **Decision**: 出典の正本は `docs/practices.md`(群 A〜E・ID 付き)。スライド注釈と巻末リファレンスは practices.md の ID を参照する(相互参照)。テンプレ内には短縮表記 + ID、詳細は practices.md。
- **Rationale**: FR-007/SC-05 の相互参照を満たしつつ、Live Documentation の No-Redundancy(単一情報源)に整合。
- **Alternatives considered**: 各スライドに完全な書誌情報を直書き → 重複・ドリフトの温床。

## 未解決事項

なし。実装フェーズで実サイト確認が要る軽微な前提のみ残存: ホームページ固有の配色差分の有無(差分があればブランドオーバーレイ層で吸収、data-model の TokenMappingLayer 参照)。
