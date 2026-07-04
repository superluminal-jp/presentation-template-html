<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/002-extended-layouts/plan.md`

Related design artifacts:
- Spec: `specs/002-extended-layouts/spec.md`
- Research (Phase 0): `specs/002-extended-layouts/research.md`
- Data model (Phase 1): `specs/002-extended-layouts/data-model.md`
- Contracts (Phase 1): `specs/002-extended-layouts/contracts/`
- Quickstart (Phase 1): `specs/002-extended-layouts/quickstart.md`
- Base feature (implemented): `specs/001-ds-presentation-template/` (core 8 layouts)
- Requirements source: `docs/requirements.md`; practices catalog: `docs/practices.md`

Active tech: static HTML/CSS + minimal vanilla JS; DS tokens `@digital-go-jp/design-tokens@2.0.1` (pinned, vendored, immutable) mapped via `styles/tokens.semantic.css`; validation with Playwright + axe-core + token lint. Phase 2 (deferred): editable PPTX via python-pptx.
<!-- SPECKIT END -->
