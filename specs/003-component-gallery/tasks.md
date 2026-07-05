# Tasks: 再利用コンポーネント集ページ

**Input**: Design documents from `specs/003-component-gallery/`
**Base**: feature 001/002 の基盤・検証ハーネスを再利用。
**Tests**: 含む(lint 自動網羅 + 状態色 contrast + axe)

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 [P] `tests/a11y/contrast-tokens.mjs` に状態色ペア(success/warning/error の面 vs 文字)を追加し AA を検証対象に含める

## Phase 2: Foundational

- [x] T002 `styles/components.css` を新規作成: 12部品クラス(`.callout`/`.badge`/`.tag`/`.btn`/`.data-table`/`.progress`/`.stat`/`.legend`/`.divider`/`.checklist`/`.pull-quote`/`.kv`)を役割変数のみで定義(contracts 準拠)

## Phase 3: User Story 1 — コンポーネントを見つけて差し込む（Priority: P1）🎯 MVP

**Goal**: 集ページに ≥10 部品を見本+注記+コピー用コード付きで収録。
**Independent Test**: `components.html` に 10 種以上が並び、トークン由来で AA。

- [x] T003 [US1] `components.html` を作成: 12部品をカテゴリ別に見本 + 用途注記 + コピー用 `<pre><code>` 付きで収録(`styles/components.css` を読み込む)
- [x] T004 [US1] `index.html` ツールバーに `components.html` へのリンクを追加(ショーケース導線, SC-005)
- [x] T005 [US1] `npm run lint:tokens` で `components.css` のハードコード0を確認(SC-002)
- [x] T006 [US1] `node tests/a11y/contrast-tokens.mjs` で状態色ペア含む AA を確認(SC-003)
- [x] T007 [US1] `tests/a11y/components-a11y.spec.mjs` を追加: `components.html` の axe コントラスト検査(SC-003, 要ブラウザ)

## Phase 4: User Story 2 — スライドに差し込んでも崩れない（Priority: P2）

**Goal**: 部品を既存スライドに差し込んでも崩れず準拠維持。
**Independent Test**: 本文スライドに部品を差し込んだ例が 1280×720 で崩れず表示。

- [x] T008 [US2] `index.html` の本文スライド(または新規サンプル)に代表部品(例: `.callout`)を差し込み、1280×720 で overflow しないことをプレビューで確認(SC-004)

## Phase 5: Polish

- [x] T009 [P] `README.md` にコンポーネント集への導線と概要を追記(SC-005)
- [x] T010 [P] `specs/003-component-gallery/verification.md` に SC-001〜006 の結果を記録

---

## Dependencies

- Setup(T001)→ Foundational(T002)→ US1(T003–T007)→ US2(T008)→ Polish(T009–T010)。
- MVP = US1(T001–T007)。

## Task Summary

- 総タスク数: **10** / Setup 1 / Foundational 1 / US1 5 / US2 1 / Polish 2
- 新規: `styles/components.css`, `components.html`, `tests/a11y/components-a11y.spec.mjs`
- 既存 `lint-tokens` が components.css を自動網羅。
