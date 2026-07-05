# Implementation Plan: スライドテンプレート → PowerPoint テンプレート(.potx)変換スクリプト

**Branch**: `005-pptx-export-script` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-pptx-export-script/spec.md`

## Summary

`slides/` 配下の 16 レイアウト HTML を、PowerPoint テンプレート(`.potx`)へ変換する CLI を追加する。変換は 2 段階で行う: (1) 既存の Playwright 基盤を使い各 HTML をヘッドレスブラウザで描画して DS トークンの実効値(色・フォント・座標)を JSON へ抽出する Node ステップ、(2) その JSON を読み込み、チェックイン済みの最小 `.potx` シードファイルを起点として `python-pptx` でスライドマスター・16 個のカスタムスライドレイアウト・テーマ配色/フォント・プレースホルダー・代替テキスト・読み上げ順序を組み立てて保存する Python ステップ。両ステップは 1 つの npm スクリプトから連続実行できる。

## Technical Context

**Language/Version**: Node.js(既存リポジトリと同一バージョン、`package.json` の ESM 前提)/ Python 3.11+

**Primary Dependencies**: Playwright(既存devDependency、DOM描画とスタイル抽出・要素スクリーンショットに再利用)/ `python-pptx`(新規、OOXML `.potx` 組み立て)/ `lxml`(python-pptx 経由で同梱、テーマ/プレースホルダーの低レベル XML 編集に使用)

**Storage**: ファイルシステムのみ(中間 JSON、出力 `.potx`)。DB 等は N/A

**Testing**: Playwright test(既存 `tests/visual`/`tests/a11y`/`tests/print` と同じ枠組みで抽出ステップを検証)/ `pytest`(新規、Python 側のレイアウト組み立て・テーマ上書きロジックを検証)

**Target Platform**: 開発者ローカル環境(macOS/Linux/Windows)で実行する CLI。出力物の検証対象は Microsoft PowerPoint デスクトップ版(現行および 1 つ前のメジャーバージョン、Windows/Mac)(spec Clarifications 参照)

**Project Type**: 単一リポジトリに追加する CLI スクリプト一式(既存の静的サイト・ツール群に併設)

**Performance Goals**: 16 レイアウト一括変換が 30 秒以内に完了する(SC-005)

**Constraints**: 外部ネットワークアクセスなしで完結(FR-010)/ 色・フォントは DS トークン実効値のみを転記しハードコード禁止(FR-006)/ 生成物は編集可能なプレースホルダーであり画像焼き込み不可(FR-004、フォールバック除く)

**Scale/Scope**: 固定 16 レイアウト × 1 スライドマスター。可変長要素は代表 1 パターンに固定(spec Assumptions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` はテンプレートのプレースホルダーのままで、本プロジェクト固有の原則がまだ制定されていない。したがって本フェーズで評価すべき追加ゲートは存在しない。プロジェクト固有の原則を明文化したい場合は `/speckit-constitution` の実行を推奨するが、本機能の計画をブロックするものではない。

Spec Kit 標準の衛生状態のみ確認:
- [x] spec.md の Clarifications セクションで主要な曖昧性は解消済み
- [x] 本計画は spec の Functional Requirements / Success Criteria とトレース可能
- [x] 複雑さの正当化が必要な逸脱なし(下記 Complexity Tracking は空)

*Post-Phase 1 再評価: 変更なし。Phase 1 の設計(research.md / data-model.md / contracts/)は上記スコープを超える新たな複雑性やゲート抵触を導入していない。*

## Project Structure

### Documentation (this feature)

```text
specs/005-pptx-export-script/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
scripts/
├── extract-slide-layout-data.mjs   # Node/Playwright: 16 HTML を描画し DS トークン実効値・座標を JSON 抽出
└── pptx-template/
    ├── build_potx.py                # CLI エントリポイント(python-pptx で .potx を組み立てて保存)
    ├── layout_map.py                 # HTML レイアウトクラス → プレースホルダー配置ルールの対応表
    ├── theme.py                      # DS トークン → OOXML テーマ(clrScheme/fontScheme)書き換え
    ├── potx_writer.py                # 完成した .pptx の [Content_Types].xml を書き換えて .potx として保存するポストプロセス
    └── requirements.txt              # python-pptx, lxml, pytest

build/                                 # 生成物置き場(.gitignore 対象)
└── slide-layout-data.json            # 抽出ステップの中間 JSON(コミット対象外)

tests/
├── visual/ | a11y/ | print/          # 既存 Playwright テスト(変更なし)
└── pptx/
    ├── test_build_potx.py            # pytest: レイアウト/テーマ組み立てロジックの単体テスト
    └── fixtures/
        └── slide-layout-data.sample.json

package.json                          # "build:potx" スクリプトを追加(下記 Structure Decision 参照)
```

**Structure Decision**: 既存の `scripts/*.mjs`(トークン同期・lint・相互参照チェック)と同じ配置規約に従い、新しい変換ロジックは `scripts/pptx-template/` にまとめる。Node(抽出)と Python(組み立て)の 2 ランタイムに分かれるため、`package.json` に `"build:potx": "node scripts/extract-slide-layout-data.mjs && python3 scripts/pptx-template/build_potx.py"` を追加し、利用者からは単一コマンドで完結させる(FR-001)。Python 側の pytest は既存の Playwright テスト群と衝突しないよう `tests/pptx/` に分離する。

## Complexity Tracking

*違反なし。表は空。*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |
