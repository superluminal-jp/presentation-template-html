<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/005-pptx-export-script/plan.md`

Related design artifacts:
- Spec: `specs/005-pptx-export-script/spec.md`
- Research/Data/Contracts/Quickstart: `specs/005-pptx-export-script/`
- Prior features (implemented): 001 (core 8 layouts), 002 (extended 8, 16 total), 003 (component gallery + appendix), 004 (dashboard slides frame)
- Requirements source: `docs/requirements.md`; practices catalog: `docs/practices.md`

Active tech: static HTML/CSS + minimal vanilla JS; DS tokens `@digital-go-jp/design-tokens@2.0.1` (pinned, vendored, immutable) mapped via `styles/tokens.semantic.css`; validation with Playwright + axe-core + token lint. Phase 2 (this feature): `slides/` HTML → editable PowerPoint template (`.potx`) via Node/Playwright extraction + Python `python-pptx` assembly (`scripts/pptx-template/`).
<!-- SPECKIT END -->
