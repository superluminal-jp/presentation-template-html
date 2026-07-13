---

description: "Task list for HTML→PDF confirmation flow evaluated by Claude Code"
---

# Tasks: HTML→PDF 生成物を Claude Code が確認・評価するフロー

**Input**: Design documents from `specs/008-html-pdf-preview/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 含める。本リポジトリは検証駆動（`verify` チェーン＋ Playwright/axe）で TDD を運用しているため、決定的な下地チェックはテスト先行で追加する。Claude Code の視覚評価（主観判断）はテストではなく手続き（ルーブリック適用）として扱う。

**Organization**: ユーザーストーリー単位（P1→P2→P3）。各ストーリーは独立して実装・検証可能。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 別ファイル・依存なしで並列実行可
- **[Story]**: US1/US2/US3（該当フェーズのみ）
- パスはリポジトリ相対

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: PDF 関連コードの置き場と成果物規約の確認

- [x] T001 `scripts/pdf/` ディレクトリを新設し、`scripts/pptx/README.md` に倣った近接ドキュメント雛形 `scripts/pdf/README.md` を作成する
- [x] T002 成果物 `dist/deck.pdf`・`dist/pdf-pages/` が既存 `.gitignore`（`dist/*`、`!dist/sample-deck.pptx` のみ例外）で追跡外になることを確認し、その旨を `scripts/pdf/README.md` に明記する（追加の無視設定は不要／FR-011）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: PDF 生成基盤。全ユーザーストーリーの前提（US1 は本 PDF を読み、US3 は本 PDF を検証する）

**⚠️ CRITICAL**: このフェーズ完了までユーザーストーリー作業は開始できない

- [x] T003 `scripts/pdf/build-pdf.mjs` を実装する（Playwright chromium で `index.html` を `file://` で開き、`emulateMedia({media:'print'})` の上で `page.pdf({width:'1280px',height:'720px',printBackground:true})` を `dist/deck.pdf` に出力。`--out <path>` / `--png`（`dist/pdf-pages/NN.png`）対応。stdout に `[build:pdf] wrote <path> (N pages)`。Chromium 未導入時は `npx playwright install chromium` を促し非0終了。版面 CSS は新規定義せず既存 `@media print` のみ使用／FR-010, 契約 `contracts/build-pdf-cli.md`）
- [x] T004 `package.json` の `scripts` に `"build:pdf": "node scripts/pdf/build-pdf.mjs"` を追加する
- [x] T005 `npm run build:pdf` を実行し `dist/deck.pdf` が生成され、stdout のページ数が表示されることを確認する（生成成功のスモーク）

**Checkpoint**: PDF 成果物が再現可能に生成できる

---

## Phase 3: User Story 1 - Claude Code が PDF を読み込み描画・設計適合を評価する (Priority: P1) 🎯 MVP

**Goal**: Claude Code が `dist/deck.pdf` を全ページ読み込み、スライド単位で描画破綻・設計適合を評価した構造化レポートを出力する

**Independent Test**: 確認フローを1回起動 → 生成 PDF の全ページを Claude Code が読み込み、全スライド分の render/design 判定と所見を含むレポートが得られる（SC-001/SC-005）

### Implementation for User Story 1

- [x] T006 [US1] `scripts/pdf/README.md` に評価手続きを記載する（`contracts/evaluation-rubric.md` を参照し、build:pdf → Read `pages` で全ページ読込 → A 描画破綻/B 設計適合を適用 → C 表形式レポート、`UNEVALUABLE` は合格にしない／FR-003, FR-013）
- [x] T007 [US1] リポジトリ直下 `README.md` に「PDF で確認する（Claude Code）」節を追加する（起動方法・出力先・評価観点・レポート様式／FR-012, 近接ドキュメント）
- [x] T008 [US1] 確認フローを実際に実行して基準レポートを作成する（`npm run build:pdf` → Claude Code が `dist/deck.pdf` を Read `pages` で全ページ評価 → `contracts/evaluation-rubric.md` の C 様式で `specs/008-html-pdf-preview/evaluation-report.md` に出力。全スライドを網羅すること／SC-001, SC-005）

**Checkpoint**: US1 単独で「Claude Code による PDF 評価」が成立（MVP）

---

## Phase 4: User Story 2 - Claude Code がブラウザ表示で確認する (Priority: P2)

**Goal**: 可能な環境で Claude Code が Chromium でデックを開き、画面表示と対話挙動（発表モード/注釈トグル）を観察して所見に反映する

**Independent Test**: Claude Code がブラウザで全スライドを表示し、少なくとも1つの対話挙動を観察して所見に反映できる（SC-006）。環境が無ければスキップしても PDF 確認（US1）は成立

### Implementation for User Story 2

- [x] T009 [P] [US2] `README.md`／`specs/008-html-pdf-preview/quickstart.md` にブラウザ確認手順を記載する（`index.html` を `file://` で開く、発表モード `P`・注釈トグル `A` を観察、環境が無ければスキップ可／FR-007）
- [x] T010 [US2] Claude Code が Chromium で `index.html` を開き、全スライドの画面表示と1つ以上の対話挙動を観察し、その所見を `specs/008-html-pdf-preview/evaluation-report.md` に追記する（SC-006）

**Checkpoint**: US1 に加え、対話挙動を含む観察が評価に反映される

---

## Phase 5: User Story 3 - 確認フローを繰り返し実行でき既知の不備を検出できる (Priority: P3)

**Goal**: 決定的な下地チェック（生成成功＋ページ数=スライド枚数）を `verify` に組み込み、注入した描画破綻を確認フローが検出する

**Independent Test**: 正常版で下地チェックが PASS し、見切れ等を注入した版で不備が検出される（SC-002/SC-003）

### Tests for User Story 3 ⚠️（先行・RED）

- [x] T011 [P] [US3] `tests/print/pdf-artifact.spec.mjs` を追加する（RED）: `index.html` から PDF を生成し、ページ数が `.slide` 実数と一致すること・`byteLength>1024` を検証（`tests/visual/_fixtures.mjs` の `indexUrl` を利用、枚数はハードコードしない）

### Implementation for User Story 3

- [x] T012 [US3] `scripts/pdf/check-pdf.mjs` を実装する（`dist/deck.pdf` の存在と `byteLength>1024`、PDF の `/Type /Page`（`/Pages` 除外）出現数を `index.html` の `.slide` 実数と照合、不一致で stderr に期待/実測を出し非0終了、PASS 時 `[check:pdf] PASS — N ページ` ／契約 `contracts/build-pdf-cli.md`, FR-008）
- [x] T013 [US3] `package.json` に `"check:pdf": "node scripts/pdf/check-pdf.mjs"` を追加し、`verify` チェーンへ `build:pdf` → `check:pdf` を結線する（FR-009／T004 と同一ファイルのため T004 の後）
- [x] T014 [US3] 注入不備の検出を検証する（あるスライドに一時的にオーバーフローを混入 → `npm run build:pdf` → `check:pdf` と Claude Code 評価の双方が当該不備を検出することを確認 → 変更を復元。混入版はコミットしない／SC-003, SC-004）

**Checkpoint**: 決定的ガードが `verify` に載り、既知不備の検出可能性が担保される

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント整合と全体検証

- [x] T015 [P] `README.md` / `scripts/pdf/README.md` / `specs/008-html-pdf-preview/quickstart.md` の記述重複を排し相互リンクで整合させる（No Redundancy／Proximity）
- [x] T016 `npm run verify` を実行し、新規 `build:pdf`／`check:pdf` を含め全チェーンが green であることを確認する
- [x] T017 `specs/008-html-pdf-preview/quickstart.md` の手順どおりにエンドツーエンドで再実行し、SC-001〜SC-008 の充足を確認する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし・即開始可
- **Foundational (Phase 2)**: Setup 後。全ユーザーストーリーをブロック（PDF 生成が前提）
- **US1 (Phase 3)**: Foundational 後。MVP
- **US2 (Phase 4)**: Foundational 後。US1 のレポートに追記する形で連携（独立実行も可）
- **US3 (Phase 5)**: Foundational 後。US1/US2 と独立
- **Polish (Phase 6)**: 対象ストーリー完了後

### User Story Dependencies

- **US1 (P1)**: T003（PDF 生成）に依存。他ストーリー非依存
- **US2 (P2)**: Foundational のみ依存。所見追記先として US1 の T008 レポートを利用（無ければ独立に作成可）
- **US3 (P3)**: T003（PDF 生成）に依存。US1/US2 非依存

### Within Each Story

- US3: テスト T011（RED）→ 実装 T012 → 結線 T013（GREEN）
- `package.json` を編集する T004・T013 は同一ファイルのため直列（並列不可）

### Parallel Opportunities

- Phase 1: T001 → T002（同一 README のため直列）
- US2 の T009（ドキュメント）は US1 実装と別ファイルのため [P]
- US3 の先行テスト T011 は他フェーズと別ファイルのため [P]
- Polish の T015 は別ファイル整合作業で [P]

---

## Parallel Example: 横断で並行できるもの

```bash
# US2 ドキュメントと US3 先行テストは別ファイルなので並行可:
Task: "README/quickstart にブラウザ確認手順を追記 (T009)"
Task: "tests/print/pdf-artifact.spec.mjs を追加 (T011, RED)"
```

---

## Implementation Strategy

### MVP First (User Story 1 のみ)

1. Phase 1 Setup 完了
2. Phase 2 Foundational 完了（PDF 生成＝全ストーリーの前提）
3. Phase 3 US1 完了 → **STOP & VALIDATE**: Claude Code が全スライドを評価したレポートを出力できるか確認
4. 価値提供可能（Claude Code による PDF 確認が成立）

### Incremental Delivery

1. Setup + Foundational → PDF 生成基盤
2. US1 → Claude Code 評価（MVP）
3. US2 → ブラウザ観察を評価に補完
4. US3 → 決定的ガードを `verify` に載せ回帰検出
5. 各ストーリーは前を壊さず価値を追加

---

## Notes

- [P] = 別ファイル・依存なし
- Claude Code の視覚評価は主観判断のため、決定的指標（枚数一致・生成成功＝US3）と既知不備検出（T014）で裏打ちする
- 版面は既存 `@media print` のみを正とし、PDF 用の新規 CSS を書かない
- 成果物（PDF/PNG）はコミットしない。注入不備の検証版もコミットしない
- 各タスクまたは論理的なまとまりごとにコミット
