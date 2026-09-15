# Implementation Plan: 編集可能 PPTX への DOM 実測変換(正本一元化)

**Branch**: `claude/digital-agency-html-template-0zcz88` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-pptx-dom-extraction/spec.md`

## Summary

PPTX 書き出しを、手書きの第二の正本から**正本 DOM の実測値に基づく汎用変換**へ転換する。
実装の中核は 4 点: (1) HTML 側に `data-pptx` 役割属性の閉じた語彙を導入し、全コンポーネントを
PPTX ネイティブ・オブジェクトへ 1:1 で写せるプリミティブの合成として再定義する、(2) Playwright で
`index.html` を実レンダリングし算出済み矩形・計算済みスタイルからスライド IR を作る抽出器、
(3) IR を pptxgenjs のネイティブ・オブジェクト(テキストボックス / 図形 / 表 / グラフ / グループ)へ
書き出す出力器、(4) 正本と PPTX の乖離を検出し `verify` に組み込む決定的チェック。

変換器はレイアウト一覧を持たない。正本にスライドが増えれば、コード変更なしで出力へ追随する。
新規ランタイム依存は追加しない(Playwright / pptxgenjs / jszip はいずれも既存 devDependency)。

## Technical Context

**Language/Version**: JavaScript (ES Modules) on Node.js(既存 `scripts/*.mjs` と同一運用); 静的 HTML/CSS/最小 vanilla JS

**Primary Dependencies**: `@playwright/test`(chromium — DOM 実測抽出)、`pptxgenjs`(PPTX 出力)、`jszip`(生成 PPTX の検証読み取り)。いずれも既存 devDependency。**新規依存なし**

**Storage**: ファイルシステム成果物 `dist/sample-deck.pptx`(追跡対象、`.gitignore` の `!dist/sample-deck.pptx`)。中間表現 `dist/deck-ir.json`(追跡外、障害調査用)

**Testing**: 既存 `verify` チェーン。`scripts/pptx/check-pptx.mjs` を新設して結線し、`tests/visual/convertibility.spec.mjs` を役割属性の網羅検証へ拡張

**Target Platform**: ローカル開発環境(Node + Chromium)。生成物は PowerPoint / Keynote / Google スライドで開く

**Project Type**: 静的サイト＋ビルド/検証スクリプト群(`src/` は無く `scripts/` と `tests/` 構成)

**Performance Goals**: 変換は数秒〜十数秒オーダー。28 枚の実レンダリング走査であり性能はクリティカルでない

**Constraints**: 正本は `index.html` のみ(二重定義禁止)。幾何のピクセル一致は非目標。依存追加禁止。役割属性は描画に影響させない(視覚回帰差分 0)。`slides/*.html` は生成物で手編集禁止

**Scale/Scope**: 28 スライド(コア 17 + 付録 11)、20 コンポーネント(自作 14 + DADS 公式 6)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` は未批准(テンプレートのプレースホルダのまま)。正式な条項ゲートは
存在しないため、本リポジトリの事実上の運用原則(`CLAUDE.md` ＋ `.claude/rules/`)を代替ゲートとして評価する:

| 原則(事実上) | 本計画の適合 |
|---|---|
| 単一情報源／二重定義禁止 | 本機能の目的そのもの。文言・座標・トークン値の手写経を全廃(FR-007/FR-010)。**唯一の例外**はチャートデータ payload で、FR-005 の整合チェックで封じ、完全一元化は Deferred として起動条件を記録(research.md D4)。PASS(記録付き例外あり) |
| トークン準拠(ハードコードのブランド値禁止) | 配色は計算済みスタイル由来へ移行し、手維持マップ `tokens.mjs` の色定義を廃止(D5)。`lint:tokens` は不変。PASS |
| Live Documentation(同一変更で docs 更新) | `scripts/pptx/README.md` を全面改訂、`CLAUDE.md` の「PPTX outside verify」記述を解消、`docs/requirements.md` のフェーズ2 記述(python-pptx 第一候補)を実装に整合(FR-019)。PASS |
| 検証で担保(Playwright/axe/lint) | `check:pptx` を新設し `verify` に結線(FR-016)。反証テスト(意図的乖離で失敗すること)を SC-007 として定義。PASS |
| 正本は `index.html`、`slides/*` は生成物 | 生成物へ手を加えない。役割属性は `index.html` に付し `split-slides.mjs` で再生成。PASS |
| 新規ランタイム依存を追加しない | 既存 devDependency のみ(FR-018)。PASS |

**Gate result: PASS**(チャートデータ payload の限定的二重表現のみ、理由・対象・後続条件を記録のうえ受容 — Complexity Tracking 参照)

## Project Structure

### Documentation (this feature)

```text
specs/011-pptx-dom-extraction/
├── plan.md                    # This file
├── spec.md                    # 機能仕様
├── research.md                # Phase 0 output(D1–D8)
├── data-model.md              # Phase 1 output(役割属性語彙 / スライド IR / ChartData)
├── quickstart.md              # Phase 1 output(変換〜検証の手順)
├── contracts/
│   ├── pptx-role-contract.md  # data-pptx 語彙の契約(HTML 作者向け)
│   └── build-pptx-cli.md      # build:pptx / check:pptx の入出力契約
└── checklists/
    └── requirements.md        # spec 品質チェック
```

### Source Code (repository root)

既存の `scripts/<domain>/` パターンを踏襲し、`scripts/pptx/` 配下を再構成する。

```text
index.html                     # 正本: data-pptx 役割属性を付与(描画不変)
styles/
├── layouts/quote.css          # .quote::before の引用符を実 DOM 化(D3)に伴い調整
└── **                         # その他は変更なし想定
js/
└── tree-connectors.js         # 変更なし(抽出側が描画完了を待機 — D8)
scripts/pptx/
├── build-pptx.mjs             # 改訂: オーケストレータ(抽出 → 出力)へ縮小
├── extract.mjs                # 新規: Playwright で DOM 実測 → スライド IR
├── emit.mjs                   # 新規: スライド IR → pptxgenjs ネイティブ・オブジェクト
├── theme.mjs                  # 改訂: tokens.mjs から theme1.xml 差し替えのみを継承
├── check-pptx.mjs             # 新規: 決定的チェック(枚数一致 + 見出しテキスト存在 + chart 整合)
├── tokens.mjs                 # 削除: 色/フォント/寸法の手維持マップを計算済みスタイルへ移行(D5)
└── README.md                  # 全面改訂: 新方式・語彙・制約
tests/visual/
├── convertibility.spec.mjs    # 拡張: 全 28 枚・全コンポーネントの役割属性網羅を検証
└── chart-encoding.spec.mjs    # 拡張: data-chart payload と data-series / series-label の整合
dist/
├── sample-deck.pptx           # 生成物(追跡対象、既存の .gitignore 例外を維持)
└── deck-ir.json               # 生成物(追跡外、障害調査用)
package.json                   # verify に build:pptx && check:pptx を結線
README.md / CLAUDE.md / docs/requirements.md   # 近接ドキュメント同期(FR-019)
```

**Structure Decision**: 抽出(ブラウザ内)と出力(Node 側)は実行コンテキストが異なるため、
スライド IR を挟んで `extract.mjs` / `emit.mjs` に分割する(D6)。`build-pptx.mjs` は両者を繋ぐ
オーケストレータへ縮小し、既存の公開契約(`npm run build:pptx` → `dist/sample-deck.pptx`)は変えない。
検証は `scripts/pdf/check-pdf.mjs` の先例(生成 → 決定的チェック → `verify` 結線)に倣う。

## Phase 順序と依存

```text
Phase 2 (Foundational)  役割属性語彙の確定 + 擬似要素の実 DOM 化
        │                これ無しにはどのユーザーストーリーも抽出できない
        ▼
Phase 3 (US1/P1)        抽出器 + 出力器 + 全 28 枚の text/shape/line 変換   ← MVP
        │
        ├─────────────► Phase 4 (US2/P2)  table / chart / group のネイティブ化
        │                                  US1 の IR 基盤に乗る
        ▼
Phase 5 (US3/P3)        check-pptx.mjs + verify 結線 + 反証テスト
        │                US1/US2 の出力が固まってから閉じる
        ▼
Phase 6 (Polish)        ドキュメント同期・verify 全緑・PPTX 目視評価
```

US1 完了時点で「HTML を直せば PPTX が直る」MVP が独立に成立する(US2/US3 未実装でも価値がある)。

## Complexity Tracking

> Constitution Check は PASS。以下 1 件のみ、理由・対象・後続条件を記録のうえ受容する。

| 項目 | なぜ必要か | なぜ単純な代替では不十分か | 封じ込め | 解消の起動条件 |
|---|---|---|---|---|
| チャートデータ payload が手描き SVG と並存する(限定的二重表現) | ネイティブ編集可能グラフ(SC-004)には数値が要るが、現行 SVG は幾何のみで値を持たない | SVG の幾何から値を逆算する方式は軸スケールの別途宣言を要し、結局 payload と等価かつ脆い | FR-005 の整合チェック(系列数・系列名・値数)を `check:pptx` で自動検証 | FR-005 が恒常的に発火する、またはグラフ種を増やす要求が出た時点で、SVG をデータから生成する後続機能を起こす(spec.md Deferred) |
