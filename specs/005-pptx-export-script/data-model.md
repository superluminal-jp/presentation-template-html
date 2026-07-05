# Phase 1 Data Model: スライドテンプレート → .potx 変換

このドキュメントは、抽出ステップ(Node/Playwright)と組み立てステップ(Python/`python-pptx`)の間でやり取りされる中間データ、および出力 `.potx` 側の論理エンティティを定義する。永続 DB は使用しない(ファイルベース)。

## 1. LayoutDefinition(入力 HTML 側)

`slides/` 配下の 1 HTML ファイルに対応する論理エンティティ。

| フィールド | 型 | 説明 |
|---|---|---|
| `layout_id` | string | ファイル名由来の ID(例: `01-title`) |
| `layout_name_ja` | string | 日本語表示名(例: 「表紙」)。PowerPoint のレイアウト選択ギャラリーに表示(FR-012) |
| `source_path` | string | `slides/01-title.html` などの相対パス |
| `elements` | `SlideElement[]` | 抽出された意味的要素の一覧 |
| `frame_elements` | `FrameElement[]` | 分類ラベル・著作権表示・ページ番号など、スライドマスター側へ一度だけ昇格する共通要素(FR-013) |

**バリデーションルール**:
- `layout_id` は 16 レイアウトの命名規約(`NN-name`)に一致しなければならない。一致しない場合は汎用レイアウトとして最善努力変換し警告(Edge Cases)。
- 16 レイアウトすべてが揃っていない状態でも変換は継続できるが、欠落分は生成されず、変換ログに記録される(FR-009 の情報提供義務との整合)。

## 2. SlideElement(抽出された意味的要素)

| フィールド | 型 | 説明 |
|---|---|---|
| `role` | enum: `title`, `subtitle`, `body`, `caption`, `meta`, `image`, `chart`, `other` | プレースホルダー種別決定に使う意味ロール |
| `text` | string \| null | 抽出時点の実テキスト(`.potx` 側では実テキストとしては使わず、プロンプトテキスト生成の参考情報としてのみ利用。Clarification #1 参照) |
| `bbox_px` | `{x, y, w, h}` | 1280×720 px キャンバス内での bounding box |
| `bbox_ratio` | `{x, y, w, h}` | 0–1 の比率(13.333in×7.5in への変換の元) |
| `computed_style` | `ComputedStyle` | 解決済みスタイル |
| `fallback` | `{is_fallback: bool, reason: string, image_path: string \| null}` | ネイティブ再現不可のためラスター化した場合の情報(FR-008) |
| `alt_text_hint` | string \| null | `role` が `image`/`chart` の場合の代替テキスト用ヒント(FR-014) |
| `reading_order_index` | integer | レイアウト内での読み上げ順序(タイトル→本文→補足の順、FR-015) |

**状態遷移**: なし(1 回の変換で完結する静的データ)。

## 3. ComputedStyle

| フィールド | 型 | 説明 |
|---|---|---|
| `color_hex` | string(`#RRGGBB`) | 文字色の実効値 |
| `background_color_hex` | string \| null | 背景色の実効値(透明の場合 null) |
| `font_family` | string | 実効フォントファミリー(例: `Noto Sans JP`) |
| `font_size_px` | number | 実効フォントサイズ(px) |
| `font_weight` | number | 400 or 700(DS トークンに準拠) |
| `line_height_px` | number | 実効行送り |
| `token_role` | string | どの DS セマンティックトークンロールに由来するか(例: `--text-primary`)。ハードコード禁止(FR-006)の検証に使う出所情報 |

## 4. ThemeMapping(DS トークン → OOXML テーマ)

Clarification #2(テーマ全体上書き)を実現するための対応表。`scripts/pptx-template/theme.py` 内に定義。

| OOXML テーマスロット | 対応 DS トークンロール |
|---|---|
| `dk1`(主要暗色) | `--text-primary` |
| `lt1`(主要明色) | `--slide-bg` |
| `dk2` | `--text-secondary` |
| `lt2` | `--surface` |
| `accent1` | `--accent` |
| `accent2` | `--accent-strong` |
| `accent3` | `--accent-weak` |
| `accent4` | `--state-success` |
| `accent5` | `--state-error` |
| `accent6` | `--state-warning` |
| `hlink` / `folHlink` | `--accent` (リンク色は本テンプレでは通常リンクを持たないため accent を流用) |
| `majorFont.latin` / `minorFont.latin` | `--font-sans`(Noto Sans JP) |

**バリデーションルール**: 12 スロットすべてが DS トークン由来の値で埋まらなければならない(ハードコード禁止、FR-006/FR-005)。

## 5. PlaceholderMapping(HTML 要素ロール → PPTX プレースホルダー種別)

| SlideElement.role | PPTX プレースホルダー種別 | 備考 |
|---|---|---|
| `title` | `TITLE` (idx=0) | 1 レイアウトにつき 0 または 1 |
| `subtitle` | `BODY`(サブタイプ的に 2 番目の text placeholder) | 表紙レイアウトのみ想定 |
| `body` | `BODY` | 本文・箇条書き等 |
| `caption` | `BODY`(小さいテキストボックス) | 図表キャプション等 |
| `meta` | `BODY` | 発表者・日付等のメタ情報 |
| `image` | `PICTURE` | alt text ヒント必須(FR-014) |
| `chart` | `PICTURE`(フォールバック)または将来的にネイティブグラフ | 本フェーズはフォールバック(FR-008) |
| `other` | 汎用テキストボックス(非プレースホルダー) | 未知要素の最善努力変換 |

## 6. FrameElement(共通フレーム要素)

| フィールド | 型 | 説明 |
|---|---|---|
| `kind` | enum: `classification`, `copyright`, `page_number` | 種別 |
| `text_template` | string | 例: `© {year} {org}` |
| `position` | `SlideMasterPlacement` | スライドマスター側の固定位置(全レイアウト共通、FR-013) |

## 7. PotxOutput(出力側の論理構造)

| フィールド | 型 | 説明 |
|---|---|---|
| `slide_size` | `{width_in: 13.333, height_in: 7.5}` | FR-003 |
| `slide_master` | 1 件 | テーマ配色/フォント上書き済み、`FrameElement` を保持 |
| `slide_layouts` | `SlideLayout[]`(16件) | `LayoutDefinition` から 1:1 生成 |
| `conversion_log` | `LogEntry[]` | 成功/警告/フォールバックの実行記録(FR-009、Key Entities「変換ログ」) |

### SlideLayout

| フィールド | 型 | 説明 |
|---|---|---|
| `name` | string | ギャラリー表示名(FR-012) |
| `placeholders` | `Placeholder[]` | `PlaceholderMapping` に従って生成 |
| `reading_order` | `string[]`(placeholder id の並び) | FR-015 |

### LogEntry

| フィールド | 型 | 説明 |
|---|---|---|
| `level` | enum: `INFO`, `WARNING`, `ERROR` | ERROR は発生させない設計(処理継続、FR-009)だが将来拡張のため型として保持 |
| `layout_id` | string | 対象レイアウト |
| `element_role` | string \| null | 対象要素(該当する場合) |
| `message` | string | 内容(例: 「グラフをラスター画像にフォールバックしました」) |
