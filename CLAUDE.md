<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/004-dashboard-slides-frame/plan.md`

Related design artifacts:
- Spec: `specs/004-dashboard-slides-frame/spec.md`
- Research/Data/Contracts/Quickstart: `specs/004-dashboard-slides-frame/`
- Prior features (implemented): 001 (core 8 layouts), 002 (extended 8, 16 total), 003 (component gallery + appendix)
- Requirements source: `docs/requirements.md`; practices catalog: `docs/practices.md`

Active tech: static HTML/CSS + minimal vanilla JS; DS tokens `@digital-go-jp/design-tokens@2.0.1` (pinned, vendored, immutable) mapped via `styles/tokens.semantic.css`; validation with Playwright + axe-core + token lint. Phase 2 (deferred): editable PPTX via python-pptx.
<!-- SPECKIT END -->
