# Tasks: スライド共通フレーム & ダッシュボード実践スライド

**Input**: Design documents from `specs/004-dashboard-slides-frame/`
**Base**: feature 001–003 の基盤・コンポーネント・検証ハーネスを再利用。
**Tests**: 含む(lint 自動 + contrast + frame/print Playwright)

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 [P] `styles/tokens.semantic.css` にカテゴリ配色 `--cat-1..7`(DS 7パレット由来)と機密性トーンのロール変数を追加(役割変数のみ)
- [x] T002 [P] `tests/a11y/contrast-tokens.mjs` に カテゴリ配色 7 色(白背景 ≥3:1)と機密性 neutral ペアを追加

## Phase 2: Foundational

- [x] T003 `styles/frame.css` を新規作成: 四隅フレーム(`.slide__frame` + `.frame__copyright/__pageno/__scope/__confidentiality`)、機密性トーン(`[data-confidentiality]`)、`@media print` 保持
- [x] T004 `js/frame.js` を新規作成: 各 `.slide` に `.slide__frame` を注入し、`.deck` 内でページ番号「n / N」を自動採番、`:root`/スライドの `data-org`/`data-copyright`/`data-confidentiality` から文言・トーンを設定

## Phase 3: User Story 1 — 共通フレームを全スライドに（Priority: P1）🎯 MVP

**Goal**: 全スライドに四隅フレーム(Copyright/ページ番号/組織限定/機密性)。印刷保持・機密性切替。
**Independent Test**: 全スライドに4要素、機密性 1/2/3 切替、印刷保持を確認。

- [x] T005 [US1] `index.html` の `<html>` に既定設定(`data-org`/`data-copyright`/`data-confidentiality="2"`)を付与、`frame.css`/`frame.js` を読み込み、旧フッタのページ番号スパン(`<span>N / M</span>`・`<span>Appendix X</span>`)を撤去(ページ番号はフレームに一本化)
- [x] T006 [US1] `scripts/split-slides.mjs` の head に `frame.css`、foot に `frame.js` を追加(単体ファイルにもフレーム表示)
- [x] T007 [US1] `node scripts/split-slides.mjs` で 16 単体ファイルを再生成(フレーム反映)
- [x] T008 [US1] `npm run lint:tokens` で frame.css のハードコード0を確認(SC-002)
- [x] T009 [US1] `tests/visual/frame.spec.mjs` を追加: 全 `.slide` に `.slide__frame` 4要素、ページ通し番号、`data-confidentiality` 1/2/3 切替で表示変化(SC-001/003)
- [x] T010 [US1] `tests/print/print.spec.mjs` に、印刷 media でフレーム(機密性/Copyright/ページ番号)が保持されるアサートを追加(SC-006)

## Phase 4: User Story 2 — ダッシュボード実践スライド（Priority: P2）

**Goal**: ガイドブック準拠のダッシュボード付録(grid KPI + 多系列 + 凡例、カテゴリ配色)。
**Independent Test**: 付録が grid 整列 KPI + 多系列 + 凡例を含み、7パレット配色・1280×720 無崩れ。

- [x] T011 [US2] `styles/layouts/appendix.css`(または dashboard.css)に多系列チャート整形(`--cat-*` 使用)と KPI カードのグリッド整列を追加
- [x] T012 [US2] `index.html` の付録末尾に「Appendix D: ダッシュボード(ガイドブック準拠)」スライドを追加: grid 整列 KPI カード + 多系列棒チャート(`--cat-1..n`) + 凡例 + 注釈(practices C 群)
- [x] T013 [US2] `node tests/a11y/contrast-tokens.mjs` でカテゴリ配色 ≥3:1・機密性 AA を確認(SC-005)
- [x] T014 [US2] `docs/dashboard-consistency.md` を作成: 7パレット↔DSプリミティブ / チャート指針↔practices C群 / グリッド整列 の整合記録(SC-007/FR-010)

## Phase 5: Polish

- [x] T015 [P] `README.md` に共通フレーム(取扱区分/Copyright/ページ番号)とダッシュボード付録・整合記録を追記
- [x] T016 [P] `specs/004-dashboard-slides-frame/verification.md` に SC-001〜007 の結果を記録

---

## Dependencies

- Setup(T001–T002)→ Foundational(T003–T004)→ US1(T005–T010)→ US2(T011–T014)→ Polish。
- MVP = US1(共通フレーム)。

## Task Summary

- 総タスク数: **16** / Setup 2 / Foundational 2 / US1 6 / US2 4 / Polish 2
- 新規: `styles/frame.css`, `js/frame.js`, `docs/dashboard-consistency.md`, `tests/visual/frame.spec.mjs`
