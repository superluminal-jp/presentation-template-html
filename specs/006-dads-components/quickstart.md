# Quickstart: DADS Official HTML Components Intake

## Prerequisites

- `npm install` done (`@digital-go-jp/design-tokens@2.0.1` present; `tokens/vendor/tokens.css` synced via `npm run sync-tokens`).
- Network access for `sync:dads` / `check:dads` (fetches GitHub raw at the pinned SHA).

## Fetch / refresh the vendored components

```bash
npm run sync:dads     # fetch target components' CSS/HTML at the pinned SHA → vendor/dads-components/
```

Writes committed, unmodified upstream copies with provenance headers.

## Verify no drift from upstream

```bash
npm run check:dads    # exit 0 = matches pinned SHA; exit 1 = drift/missing (lists offending files)
```

Network-required; not part of `npm run verify` (kept offline-safe).

## View the components

Open `components.html` in a browser. The six DADS components (card, list, checkbox, progress-indicator, breadcrumb, radio) render in the gallery, styled from `styles/dads-components.css` + `tokens/vendor/tokens.css`.

## Run the existing validation suite

```bash
npm run lint:tokens
npm run test:a11y
npm run test:visual   # regenerate components.html baseline if intentionally changed
```

`npm run verify` runs the full offline chain (token-lint, crossrefs, coverage, slides drift, visual, a11y, print).

## Update to a newer upstream (future)

1. Edit `SHA` in `scripts/sync-dads.mjs` to the new commit.
2. `npm run sync:dads` and review the diff in `vendor/dads-components/`.
3. Update provenance is automatic (header regenerated).
4. Re-run `npm run test:visual` / `test:a11y`; refresh baselines if the visual change is intended.
5. Commit.

## Acceptance smoke check

- [ ] `styles/components.css` unchanged (`git diff --stat styles/components.css` empty).
- [ ] `vendor/dads-components/**` present with provenance headers.
- [ ] All 6 components visible and styled in `components.html`.
- [ ] `npm run check:dads` exits 0 right after a sync.
- [ ] No new `js/` files; token-lint + a11y + visual pass.
