<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/003-component-gallery/plan.md`

Related design artifacts:
- Spec: `specs/003-component-gallery/spec.md`
- Research/Data/Contracts/Quickstart: `specs/003-component-gallery/`
- Prior features (implemented): `specs/001-ds-presentation-template/` (core 8 layouts), `specs/002-extended-layouts/` (extended 8 layouts, 16 total)
- Requirements source: `docs/requirements.md`; practices catalog: `docs/practices.md`

Active tech: static HTML/CSS + minimal vanilla JS; DS tokens `@digital-go-jp/design-tokens@2.0.1` (pinned, vendored, immutable) mapped via `styles/tokens.semantic.css`; validation with Playwright + axe-core + token lint. Phase 2 (deferred): editable PPTX via python-pptx.
<!-- SPECKIT END -->
