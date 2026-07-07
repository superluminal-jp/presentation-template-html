# Quickstart: Verify Deck UX Hardening

Prereqs: `npm install` and (for browser tests) `npx playwright install chromium`.

## Full gate

```bash
npm run verify   # lint:tokens → check:crossrefs → check:coverage → check:slides → visual → a11y → print
```

## Per-story verification

### P1 — Accessibility
```bash
npm run test:a11y                       # focus, landmarks, contrast
```
- Open `index.html`, press Tab: every button/link shows a visible focus ring.
- With a screen reader, request the heading list: exactly one top-level heading; slides announce name + "N / total".
- View any Appendix D/E chart in grayscale (browser devtools → Rendering → emulate grayscale): every series still identifiable by its label.

### P2 — Emphasis discipline
```bash
npx playwright test tests/visual/accent.spec.mjs
```
- Scan the 16 layouts: accent color marks at most one focal element per slide; heading underline is neutral.

### P3 — Present mode
```bash
npx playwright test tests/visual/present.spec.mjs
```
- Open `index.html`, press `P` (or the toolbar “発表モード” control): one slide fills the screen, scaled to fit.
- `→`/`Space` next, `←` prev (stops at first/last); `F` fullscreen; `Esc`/`P` back to review.
- Resize the window below 1280×720: slide still fits, no horizontal scroll.
- Print preview: still one slide per page (present mode does not affect print).

### P4 — Source drift check
```bash
node scripts/split-slides.mjs --check   # PASS when slides/ matches index.html
npm run check:slides
```
- Edit a slide only in `index.html`, run `node scripts/split-slides.mjs`, and both the showcase and `slides/NN-*.html` reflect it.
- If `slides/*.html` is hand-edited out of sync, `--check` exits 1 and names the file.

## Guardrails
- Never hand-edit `slides/*.html` — regenerate from `index.html`.
- Keep all new CSS token-driven (no raw hex/rgb/hsl or raw spacing px in `styles/**`).
- Present-mode JS is loaded by `index.html` only; do not add it to the `split-slides` head template.
