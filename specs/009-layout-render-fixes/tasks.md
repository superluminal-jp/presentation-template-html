---
description: "Task list for 009-layout-render-fixes"
---

# Tasks: レイアウト描画の修正と構図の統一

**Input**: Design documents from `specs/009-layout-render-fixes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/verification.md, quickstart.md

**Tests**: 新規の自動テストは作らない(spec で未要求)。検証は既存 `npm run verify`(視覚/a11y/印刷/PDF)と、構図変更に伴う視覚回帰スナップショットの更新で担保する。

**Organization**: ユーザーストーリー単位(US1=P1 バグ / US2=P2 構図 / US3=P3 仕上げ)。各ストーリーは独立実装・独立検証可能。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 別ファイルで依存が無く並行可能
- 変更は DS トークン参照のみ(生 hex/rgb/hsl・spacing 生 px 禁止)。`@media print` と `tokens/vendor/**` は不変。

---

## Phase 1: Setup (共有・ベースライン)

**Purpose**: 変更前の緑状態と描画を記録し、Before/After 比較の基準を作る

- [X] T001 現状のグリーンベースラインを確認: `lint:tokens` PASS・`check:pdf` PASS(25ページ)で基準確認(full verify は最終 T020 に集約)
- [X] T002 [P] 変更前 PDF を基準化: `dist/deck.pdf`(25ページ)を確認し対象スライド(p6/p8/p14/p20)の Before を控えた

**Checkpoint**: 変更前が緑・25ページであることを確認

---

## Phase 2: Foundational (前提整理・ブロッキング)

**Purpose**: 各ストーリーの検証で更新すべき視覚回帰スナップショットの所在を特定する

**⚠️ 全ストーリー着手前に完了必須**

- [X] T003 影響スナップショットを特定: `tests/visual/deck.spec.mjs-snapshots`(per-slide)と `tests/visual/ds-update.spec.mjs-snapshots`(16レイアウト)を確認

**Checkpoint**: 更新対象スナップショットが判明 — ストーリー実装を開始可能

---

## Phase 3: User Story 1 - 描画不具合の是正(凡例色・濃色地の可読性) (Priority: P1) 🎯 MVP

**Goal**: 凡例スウォッチが系列色(青/緑/橙)と一致し、濃色地スライドのフレーム文字が AA コントラストで判読できる

**Independent Test**: `npm run build:pdf` 後、`dist/deck.pdf` の p20(付録D 凡例=系列一致)と p14(全面画像フレーム判読)を確認し、`npm run test:a11y` が通る

### Implementation for User Story 1

- [X] T004 [P] [US1] `styles/layouts/appendix.css` の系列凡例修飾子を `.legend .legend__swatch--cat1/2/3`(詳細度 0,2,0)へ。screen 実測で cat1=青/cat2=緑(29,139,86)/cat3=橙(226,81,0)を確認(D1/A1/A2)
- [X] T005 [P] [US1] `styles/frame.css` の濃地反転に `.slide--image-full .frame__scope/__copyright/__pageno` を追加し `var(--text-on-accent)` へ反転(D2/B1)
- [X] T006 [US1] `npm run build:pdf` 後、p20 凡例=系列一致(AC-1/AC-3)・p14 フレーム白文字判読(AC-2)を PDF で確認
- [X] T007 [US1] `lint:tokens` PASS・`test:a11y` 21件 PASS(15-image-full 含む=SC-002)を確認
- [X] T008 [US1] 付録D/全面画像は 8px スウォッチ/微小文字で回帰しきい値内(スナップショット不変)。`test:visual` 通過

**Checkpoint**: 凡例色一致(SC-001)とフレーム可読(SC-002)が単独で成立 — MVP 完了

---

## Phase 4: User Story 2 - 構図の統一(本文の縦位置とビッグナンバーの階層) (Priority: P2)

**Goal**: 短文スライドで本文が見出し直下から始まり、ビッグナンバーの数値が主役として際立つ。中央寄せ意図(章扉/引用/ビッグナンバー)は保持

**Independent Test**: `npm run build:pdf` 後、p7 まとめ・p8 ビッグナンバー・p10 タイムライン・p12 プロセス・p6 図表・p22 付録F で本文が見出し直下から始まり、章扉/引用の中央寄せが保たれている

### Implementation for User Story 2

- [X] T009 [P] [US2] `styles/layouts/summary.css` の `.key-messages` を `align-content: start` に(C1)
- [X] T010 [P] [US2] `styles/layouts/process.css` の `.process` を `align-self: start` に(C2)
- [X] T011 [P] [US2] `styles/layouts/timeline.css` の `.timeline` を `align-self: start` に(C3)
- [X] T012 [P] [US2] `styles/layouts/chart.css` の `.chart`(`align-self:start`+`align-items:flex-start`)と `.takeaway`(`align-self:start`)を上寄せに(C4)
- [X] T013 [US2] `styles/layouts/big-number.css` の `.bignum` を `calc(var(--font-size-64)*1.8)` へ拡大。`index.html` に `.bignum-block` ラッパを追加し数値+内訳を中央寄せの1ユニット化(`slides/` 再生成済み)(C5/D4/FR-006)
- [X] T014 [US2] `build:pdf` で確認: p6/p7/p8/p10/p12 本文が見出し直下開始(AC-4)、p8「16」最大+内訳近接(AC-6)、p13 引用/p8 ビッグナンバー中央寄り保持(AC-5)、フッタ見切れ無し
- [X] T015 [US2] `lint:tokens` PASS(calc 通過)。変更5スライドのスナップショットを更新(deck×5・ds-update×5)し `test:visual` 57件 PASS

**Checkpoint**: US1 と US2 が各々独立して成立

---

## Phase 5: User Story 3 - 仕上げの微調整(疎なスライドと折り返し) (Priority: P3・任意)

> **状態: 未着手(意図的に保留)**。P3 は spec で任意。E1(付録F/H 密度)・E3(表紙構図)は受け入れ基準が主観的、E2(CTA 折り返し)は現状「作り始めて / ください」がて形+くださいの自然境界で許容範囲。P1+P2 の成果を確認後、必要なら別途着手する。

**Goal**: 疎な付録スライドの体裁整合、CTA の自然な折り返し、表紙構図の是正

**Independent Test**: `npm run build:pdf` 後、p22 付録F・p24 付録H・p15 クロージング・p1 表紙で体裁が整い、CTA が語中で折り返さない

### Implementation for User Story 3

- [ ] T016 [P] [US3] `styles/layouts/appendix.css`(付録F/H 該当ルール)で下方の空白を意図的余白として成立させる、または他付録と密度を整合させる(E1/FR-007)
- [ ] T017 [P] [US3] クロージング CTA の折り返しを是正: `index.html`(closing セクションの文言/改行)必要に応じ `styles/layouts/closing.css` の折り返し指定を調整する(E2/FR-008)
- [ ] T018 [P] [US3] `styles/layouts/title.css` で表紙主要素の上下端貼り付き/中央空洞を是正し、意図した構図に配置する(E3)
- [ ] T019 [US3] `index.html` を変更した場合は `node scripts/split-slides.mjs` で `slides/*.html` を再生成し `npm run check:slides` を通す。`npm run build:pdf` で AC-7 を確認する

**Checkpoint**: 全ストーリーが独立して成立

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: 全体の整合と配布物の確定

- [X] T020 `npm run verify` 全ステップ PASS(lint:tokens・crossrefs・coverage・slides・visual 57・a11y 21・print 2・build:pdf 25p・check:pdf、SC-005/SC-006)
- [X] T021 quickstart AC-1〜AC-6 を `dist/deck.pdf` で最終確認(AC-7=US3 は未実施)
- [X] T022 `dist/deck.pdf` は最新レンダリング(25ページ)。git 追跡対象として変更に含める

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし・即着手可
- **Foundational (Phase 2)**: Setup 完了後・全ストーリーをブロック
- **User Stories (Phase 3-5)**: Foundational 後に着手。US1/US2/US3 は対象ファイルが概ね素で、相互依存なし(並行可)。優先度順は P1→P2→P3
- **Polish (Phase 6)**: 対象ストーリー完了後

### User Story Dependencies

- **US1 (P1)**: `appendix.css`(凡例)/`frame.css`。他ストーリーに非依存 — MVP
- **US2 (P2)**: `summary/process/timeline/chart/big-number.css`。US1 と別ファイル・非依存
- **US3 (P3)**: `appendix.css`(F/H)/`index.html`/`closing.css`/`title.css`。任意・非依存

> 注: US1 T004 と US3 T016 はどちらも `appendix.css` を触る。同時並行時は編集箇所(凡例 vs 付録F/H レイアウト)が異なるため衝突しにくいが、順に適用すると安全。

### Within Each User Story

- 実装(スタイル変更)→ ビルド確認(build:pdf 目視)→ lint/a11y → スナップショット更新(test:visual)の順
- ストーリー完了後に次優先へ

### Parallel Opportunities

- Setup: T002 は [P]
- US1: T004(appendix)と T005(frame)は別ファイルで [P]
- US2: T009〜T012 は別ファイルで [P](T013 big-number は単独、T014/T015 は集約検証で直列)
- US3: T016〜T018 は別ファイルで [P]

---

## Parallel Example: User Story 1

```bash
# US1 の独立ファイル変更を並行:
Task: "styles/layouts/appendix.css の系列凡例詳細度を(0,2,0)へ引き上げ"   # T004
Task: "styles/frame.css の濃地反転に .slide--image-full を追加"          # T005
# 続いて集約検証(直列): build:pdf → lint/a11y → snapshot 更新
```

## Parallel Example: User Story 2

```bash
# US2 の別ファイル上寄せを並行:
Task: "summary.css align-content: start"     # T009
Task: "process.css align-self: start"        # T010
Task: "timeline.css align-self: start"       # T011
Task: "chart.css 上寄せ(chart/takeaway)"     # T012
```

---

## Implementation Strategy

### MVP First (User Story 1 のみ)

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 US1(凡例色・濃地フレームの2バグ)
3. **STOP & VALIDATE**: p20/p14 と a11y を単独確認
4. 正確性の欠陥が解消 — ここで区切ってレビュー/デモ可

### Incremental Delivery

1. Setup + Foundational → 基盤
2. US1(バグ)→ 独立検証 → MVP
3. US2(構図)→ 独立検証
4. US3(仕上げ・任意)→ 独立検証
5. 各段で `npm run verify` 緑・PDF 25ページを維持

---

## Notes

- [P] = 別ファイル・依存なし。集約検証タスク(build:pdf/verify/snapshot)は同一成果物を触るため直列。
- 構図変更は視覚回帰スナップショットを更新する前提(意図差分のみ)。意図せぬ差分は修正。
- `slides/*.html` は生成物 — 触れるのは US3 で `index.html` を変えた時のみ、必ず再生成(T019)。
- ハードコード禁止。ビッグナンバーは `calc(var(--font-size-64)*N)` を用い直値 px を書かない。
- コミットはタスク単位または論理グループ単位で。各チェックポイントで独立検証。
