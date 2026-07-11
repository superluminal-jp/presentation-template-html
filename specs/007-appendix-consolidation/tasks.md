# Tasks: コンポーネント集の付録一本化と PPTX 反映

**Feature**: `007-appendix-consolidation` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Input**: spec.md(US1〜US3)/ plan.md / research.md / data-model.md(20種台帳)/ contracts/appendix-contract.md(INV-1〜12)

**Tests**: 本プロジェクトは新規 TDD 単体テストではなく、確立済み検証スイート(lint:tokens / check:* / Playwright visual・a11y・print)で挙動を担保する。各 US の末尾に検証タスクを置く。

## Phase 1: Setup

- [ ] T001 Add `<link rel="stylesheet" href="styles/dads-components.css" />` to the `<head>` of `index.html`(付録Fの公式コンポーネント描画に必要。既存の `styles/components.css` リンクは残す)

## Phase 2: Foundational

_該当なし(Setup 以外に全 US を横断してブロックする前提タスクは無い)。_

---

## Phase 3: User Story 1 — 全コンポーネントを付録で一望する (P1)

**Goal**: 台帳 20 種すべてをデッキ付録で 1 回以上実演する(不足は 区切り + 新規自作2種(バナー/ステップナビ)+ DADS 公式 6 種)。

**Independent Test**: `index.html`/生成 `slides/` だけを閲覧し、20 種が判別可能に出現(SC-001 / INV-1)。

- [ ] T002 [US1] Add a 区切り(divider)demo to the state/components appendix in `index.html`(付録A または C。トークン準拠の `<hr>`/divider マークアップ + ラベル)
- [ ] T002a [US1] Add token-based CSS for a new バナー(通知・緊急)component and ステップナビゲーション component to `styles/components.css`(DS の notification/emergency-banner・step-navigation に倣う。ハードコード不可)
- [ ] T002b [US1] Demonstrate バナー(通知・緊急)in Appendix A and ステップナビゲーション in Appendix C of `index.html`(FR-002a)
- [ ] T003 [US1] Add a new "付録F: DADS 公式コンポーネント" `<section class="slide slide--appendix" data-layout="appendix-dads">` to `index.html`, embedding official markup for card / 箇条書きリスト / チェックボックス / ラジオ / プログレスインジケーター / パンくず sourced from `vendor/dads-components/**`(1280×720 で見切れる場合は 付録F-1/F-2 に分割)
- [ ] T004 [US1] Reconcile component-count text in `index.html`: タイトル meta「12コンポーネント」→「20コンポーネント」、ダッシュボードタイル「コンポーネント 12 / 再利用可」→「20 / 自作14+公式6」(FR-010 / SC-005)
- [ ] T005 [US1] Regenerate standalone slides: run `node scripts/split-slides.mjs`(T002–T004 反映後。`slides/*.html` は手編集しない)
- [ ] T006 [US1] Verify structural checks pass: `npm run lint:tokens` && `npm run check:crossrefs` && `npm run check:coverage` && `npm run check:slides`(INV-2/3、FR-006/011)
- [ ] T007 [US1] Verify a11y on the new/updated appendix slides: `npm run test:a11y`(付録F 含む。コントラスト違反 0 = INV-4/FR-007。違反あれば体裁をトークン内で修正)

**Checkpoint**: 20 種が付録で実演され、構造・a11y 検証が緑。US1 は単独で MVP として成立。

---

## Phase 4: User Story 2 — 独立ページの廃止(リンク切れなし) (P2)

**Goal**: `components.html` を削除し、機能的参照を 0 にする(US1 完了が前提)。

**Independent Test**: `components.html` が存在せず機能的参照 0、検証スイート緑(SC-002 / INV-6/7/12)。

- [ ] T008 [US2] Delete `components.html`
- [ ] T009 [US2] Remove the components-gallery navigation link (href to `components.html`) from `index.html`(必要なら「付録参照」文言へ置換)
- [ ] T010 [P] [US2] Remove/repoint `components.html` references in `README.md`(付録での提示に文言更新。機能的リンクを残さない)
- [ ] T011 [P] [US2] Update `CLAUDE.md` wording so `components.html` is only referenced in past tense as a removed artifact(SPECKIT ブロック含む。機能的参照 0)
- [ ] T012 [P] [US2] Update comments referencing `components.html` in `styles/dads-components.css` and `scripts/sync-dads.mjs`(「付録」を指すよう更新)
- [ ] T013 [P] [US2] Repoint `tests/a11y/components-a11y.spec.mjs` from `components.html` to the deck appendix(`index.html` もしくは生成された付録スライド)で同等のコントラスト検証を行う
- [ ] T014 [P] [US2] Repoint `tests/a11y/focus-a11y.spec.mjs` interactive-focus test from `components.html` to the deck appendix の操作要素(ボタン/チェックボックス/ラジオ等)
- [ ] T015 [US2] Verify deprecation: `grep -rIn "components.html" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=specs .` が機能的参照 0(散文のみ)であり、`npm run test:a11y` が緑

**Checkpoint**: 独立ページ廃止・参照 0・a11y 緑。US1+US2 で HTML 側の一本化が完了。

---

## Phase 5: User Story 3 — PPTX にも付録を含める (P3)

**Goal**: PPTX エクスポートに付録スライドを追加(US1 の付録定義が前提)。

**Independent Test**: `npm run build:pptx` の生成物に付録スライドがあり全要素がネイティブ編集可能(SC-004 / INV-9/10/11)。

- [ ] T016 [US3] Add appendix slide(s) to `scripts/pptx/build-pptx.mjs`: コールアウト/バッジ/タグ/ボタン/データテーブル(`addTable`)/プログレス/統計/凡例/区切り/チェックリスト/引用/kv/バナー/ステップナビ と DADS 公式 6 種を、ネイティブ図形+テキスト+ネイティブ表で近似(SVG 多系列チャートは簡略/省略可)。`builders` 配列へ追加し chrome/採番に載せる
- [ ] T017 [US3] Build & verify PPTX: `npm run build:pptx`; unzip して付録スライド XML に `<p:pic>`/`<pic:` が無いこと(ラスタ 0 = INV-10)、データテーブルが `a:tbl` として存在(INV-11)、付録スライドが 1 枚以上(INV-9)を確認

**Checkpoint**: PPTX に付録が含まれ、ネイティブ編集可能。

---

## Phase 6: Polish & Cross-Cutting

- [ ] T018 [P] Update visual regression baselines for changed/added slides: `npx playwright test tests/visual --update-snapshots`(付録追加・点数変更・nav 変更の意図的差分)
- [ ] T019 Run the full acceptance bundle from `contracts/appendix-contract.md`(lint:tokens / check:crossrefs / check:coverage / check:slides / test:a11y / test:visual / test:print / build:pptx + 参照0 grep + **INV-8 残置確認**: `styles/components.css`・`styles/dads-components.css`・`vendor/dads-components`・`tokens/vendor` の存在)and confirm SC-001〜005 satisfied

---

## Dependencies & Execution Order

- **Setup(T001)** → 全 US の前提(付録F 描画に CSS リンク要)。
- **US1(T002–T007)** → MVP。US2・US3 の前提(付録内容が確定してから廃止・PPTX 反映)。
- **US2(T008–T015)** と **US3(T016–T017)** は US1 完了後、**相互に独立**(並行可)。
- **Polish(T018–T019)** は US1〜US3 完了後。

```text
T001 → US1(T002→T003→T004→T005→T006→T007)
                                   ├→ US2(T008→T009→[T010|T011|T012|T013|T014]→T015)
                                   └→ US3(T016→T017)
                                            → Polish(T018→T019)
```

## Parallel Opportunities

- US1 内: T004 は T002/T003 と別編集箇所だが同一 `index.html` のため直列推奨(コンフリクト回避)。
- US2 内: **T010・T011・T012・T013・T014 は別ファイルで [P] 並行可**。T008/T009 の後に実施。
- US2 と US3 は US1 後に並行可。

## Implementation Strategy

1. **MVP = US1**: 付録に 20 種を揃えるだけで「単一情報源」の中核価値が成立(独立ページはまだ残っていてもよい)。
2. **増分 1 = US2**: 独立ページ廃止で二重管理を解消。
3. **増分 2 = US3**: PPTX へ反映し HTML/PPTX 差を縮小。
4. 各増分の末尾で検証スイートを緑に保ち、最後に visual ベースライン更新と受け入れ束(T019)。
