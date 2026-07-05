# Contract: CLI インターフェース

本機能は外部 API を持たないローカル CLI ツールであるため、契約はコマンドライン引数・終了コード・ログ出力形式として定義する。

## コマンド

```sh
npm run build:potx -- [options]
```

内部的には以下 2 コマンドを順次実行する:

```sh
node scripts/extract-slide-layout-data.mjs [--input-dir <dir>] [--out <json-path>]
python3 scripts/pptx-template/build_potx.py [--input <json-path>] [--output <potx-path>]
```

Python 組み立てステップは内部で「通常の `.pptx` として編集 → 完成後に `.potx` へ content-type を書き換えて保存」の 2 段階で動作する(research.md #3)。この内部段階は CLI 引数としては露出しない。

## 引数契約

| 引数 | 対象 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `--input-dir` | Node 抽出ステップ | No | `slides/` | 変換対象 HTML ディレクトリ(FR-001) |
| `--out` | Node 抽出ステップ | No | `build/slide-layout-data.json` | 中間 JSON 出力先 |
| `--input` | Python 組み立てステップ | No | `build/slide-layout-data.json` | 中間 JSON の入力 |
| `--output` | Python 組み立てステップ | No | `dist/ds-presentation-template.potx` | 生成される `.potx` の出力パス(FR-011) |

## 終了コード

| コード | 意味 |
|---|---|
| `0` | 変換成功(警告があっても 0。FR-009: 警告は処理を止めない) |
| `1` | 回復不能なエラー(例: 入力ディレクトリが存在しない、出力先に書き込み権限がない、`[Content_Types].xml` の書き換え対象パートが見つからない) |

## ログ出力契約

- 標準出力(stdout)に構造化ログを 1 行 1 JSON(NDJSON)で出力する。
- 各行のスキーマ: `{"level": "INFO"|"WARNING"|"ERROR", "layout_id": string|null, "element_role": string|null, "message": string}`(data-model.md の `LogEntry` に対応)。
- WARNING の例: ラスターフォールバック発生、未知レイアウトクラスの最善努力変換、画像参照切れ。
- ERROR は終了コード `1` の場合にのみ出力される。

## 前提・保証

- 実行はネットワークアクセスなしで完結する(FR-010)。
- 同一入力に対して複数回実行しても出力 `.potx` は(生成タイムスタンプ等のメタデータを除き)同一の構造・内容になる(再現性)。
