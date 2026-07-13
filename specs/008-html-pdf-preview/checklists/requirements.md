# Specification Quality Checklist: HTML→PDF 生成物を Claude Code が確認・評価するフロー

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-13
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- 確認の主体は **Claude Code**（AI エージェント）。人の確認は副次（FR-014）。
- 評価範囲は **描画破綻＋設計意図適合** の 2 点に限定（文言内容の良し悪しは範囲外）。ユーザー確認済み。
- 主観評価の非決定性は、決定的な下地チェック（枚数一致・生成成功）と既知不備の検出可能性（SC-003/SC-004）で裏打ち。
- 版面は既存 `@media print` を単一の正として再利用（FR-010 / SC-007）。二重定義ドリフトを防止。
- ブラウザ確認は「可能であれば」の条件付き能力（FR-007 / SC-006）。不能環境でも PDF 確認は成立。
- 実装手段（PDF 生成エンジン、ページ画像化、ブラウザ駆動手段）は spec では固定せず `/speckit-plan` で決定。
- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
