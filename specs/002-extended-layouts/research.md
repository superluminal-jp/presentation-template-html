# Phase 0 Research: 拡張スライドレイアウトセット

**Date**: 2026-07-05 | **Feature**: 002-extended-layouts

未解決の NEEDS CLARIFICATION は無し。feature 001 の基盤を再利用するため、判断は「統合方法」「実演カバレッジの割当」「プレースホルダ/倫理」「検証の拡張」に集約される。

## R1. ショーケースへの統合方法(加算)

- **Decision**: 拡張 8 スライドを既存 `index.html` のデック末尾(参考スライドの前 or 後)へ**追記**し、単一ショーケース(計16)とする。`split-slides.mjs` の ORDER/TITLE マップを 16 種へ拡張して単体ファイルを生成。
- **Rationale**: 単一情報源(index.html)を保ち、既存の overflow/print/coverage 検証が 1 デックで全網羅できる。参考(出典)は最後に置くため、拡張スライドは参考の**前**に挿入する。
- **Alternatives considered**: 別ショーケース(extended.html)→ 検証・導線が二重化。iframe 合成 → 印刷分割が壊れる。

## R2. 実演カバレッジの割当(SC-005 の実現)

- **Decision**: コア8で未実演の手法を拡張レイアウトの注釈に割り当て、`check-practice-coverage.mjs` で「practices.md 全 ID の実演(未実演0)」を検証する。割当表:

| 拡張レイアウト | 主に実演する未実演手法(ID) |
|---|---|
| 09 big-number | `B-von-restorff`, `C-preattentive`, `E-fluency` |
| 10 dashboard | `C-dashboard`, `C-storytelling-data`, `E-default-effect`, `A-action-title` |
| 11 timeline | `A-consistency`, `A-scqa` |
| 12 matrix | `B-gestalt` |
| 13 process | `D-multimedia`, `B-signal-noise` |
| 14 quote | `E-cialdini`, `E-aesthetic-usability` |
| 15 image-full | `D-picture-superiority`, `B-whitespace`, `B-wcag` |
| 16 closing | `A-10-20-30`, `B-fitts` |

- **Rationale**: 各手法を最も自然に体現するレイアウトへ割り当て、コア18 + 上記19 = カタログ37手法すべてを実演(未実演0)。`B-fitts`(操作要素)は注釈トグル/CTA、`B-wcag`(コントラスト)は重ね文字の image-full で自然に体現。
- **Alternatives considered**: 一部手法を未実演のまま残す → SC-005 未達。手法を無理に全レイアウトへ散布 → 注釈が冗長化し `D-clt`(認知負荷)に反する。

## R3. 全面ビジュアルのプレースホルダと重ね文字コントラスト

- **Decision**: 画像は同梱せず、CSS のプレースホルダ(トークン由来の面 + パターン)または作成者が差し込む `img` 枠とする。重ね文字が必要な場合は、トークン由来の半透明スクリム(`--color-neutral-opacity-gray-*`)を敷き、テキストは `--text-on-accent` 相当でコントラスト AA を確保。
- **Rationale**: 著作物を同梱しない(FR-008)。スクリムで背景に依らず AA を担保。opacity グレーは vendor トークンにあるため役割変数で表現可能。
- **Alternatives considered**: サンプル写真同梱 → ライセンス/サイズ問題。文字を常に単色帯に置く → ビジュアル訴求が弱い。

## R4. 引用/社会的証明の倫理(誠実利用)

- **Decision**: 引用・証言レイアウトは、引用文 + 出典/肩書きのプレースホルダのみを同梱し、実在の推奨文言・捏造の数値を初期同梱しない。注釈に「事実に基づく社会的証明に限る」旨を明記(`E-cialdini` の条件付き注記)。
- **Rationale**: グローバル方針「正確性・人間中心」と FR-007 に整合。
- **Alternatives considered**: 説得力のあるダミー証言を同梱 → 誤用・捏造の温床。

## R5. 検証ハーネスの拡張(既存の自動網羅)

- **Decision**: `tests/visual/_fixtures.mjs` の `LAYOUTS` 配列を 16 種へ拡張するのみで、既存の layouts/annotations/accent/convertibility/print/a11y テストが拡張レイアウトを自動網羅する。新規は `check-practice-coverage.mjs` と薄い `coverage.spec.mjs`(node スクリプトの緑を確認)。
- **Rationale**: DRY。テストロジックの重複を避け、レイアウト追加=配列追加で検証が広がる。
- **Alternatives considered**: 拡張専用のテスト群を新設 → 重複・保守増。

## R6. 指標/ダッシュボードのトークン整形(作図エンジンなし)

- **Decision**: ビッグナンバーは大型数値 + アンカー(基準/比較)+ 1 箇所のアクセント。ダッシュボードは KPI タイルのグリッド(見出し・値・補足・任意の強調)。いずれも役割変数のみで表現し、実データバインディングや作図エンジンは持たない(feature 001 の図表方針を踏襲)。
- **Rationale**: テンプレートは「見せ方の規範」であり、値は作成者が差し込む。`C-dashboard`/`C-storytelling-data`/`E-default-effect` を静的に実演できる。
- **Alternatives considered**: 動的チャート/バインディング → スコープ外・依存増。

## 未解決事項

なし。全面ビジュアルの実画像運用と、証言の実データ入力は作成者側の運用に委ねる(テンプレートはプレースホルダと注記を提供)。
