# Contract: Component Gallery Presentation (`components.html` + `styles/dads-components.css`)

## Stylesheet wiring

`components.html` `<head>` gains one link, placed **after** existing token + base stylesheets so DADS token vars are defined first:

```html
<link rel="stylesheet" href="tokens/vendor/tokens.css" />
<link rel="stylesheet" href="styles/tokens.semantic.css" />
<link rel="stylesheet" href="styles/base.css" />
<link rel="stylesheet" href="styles/components.css" />
<link rel="stylesheet" href="styles/dads-components.css" />   <!-- NEW, last -->
```

**Rule**: `styles/components.css` link and file remain unchanged (SC-002). The new module loads last so it never overrides existing gallery components (disjoint class namespaces: DADS uses its own official class names).

## `styles/dads-components.css` responsibilities

1. `@import url("../vendor/dads-components/<name>/<file>.css");` for each vendored CSS (unmodified files).
2. Card image placeholder rule: neutral fill box replacing `<img>` (only permitted hard-coded color, FR-003 exception) — use a token where possible (e.g., `var(--color-neutral-solid-gray-100)`), fall back to a documented neutral hex only if no token fits.
3. Minimal gallery scoping if needed so static states (checkbox/radio checked, progress `--value`) render without JS. No overrides of upstream token-driven colors/spacing.

**Rule**: No new `var()`-less hard-coded hex except the documented placeholder. Token-lint (`lint:tokens`) must still pass (SC-006).

## Gallery section contract (per component)

Each of the 6 components adds one `<section class="comp">` following the existing pattern:

```html
<section class="comp">
  <h2 class="comp__name">カード <span class="badge">DADS</span></h2>
  <p class="comp__note">…用途の一文…</p>
  <div class="comp__demo"><!-- vendored DADS markup --></div>
  <pre class="comp__code">&lt;!-- copyable markup --&gt;</pre>
</section>
```

**Rules**:
- Demo markup uses official DADS class names/structure unchanged (FR-002).
- progress-indicator demo sets `style="--value: <n>"` inline (static fill, no JS).
- checkbox/radio demos show unchecked + checked static states; no indeterminate.
- card demo uses 2–3 variants with placeholder in place of photos.

## Accessibility / validation contract

- Page keeps a single `<h1>` (existing `page__title`); components add `<h2>` only.
- Interactive controls (checkbox/radio inputs, breadcrumb links) must have associated labels/`aria` per the upstream markup (kept intact).
- `test:a11y` (axe) and `test:visual` must pass with the new sections present (SC-006). A visual baseline for `components.html` is (re)generated as part of implementation.

## Acceptance mapping

- FR-001/FR-004/FR-010 → gallery-only surfacing via separate module. SC-001 → all six render styled. SC-002 → components.css untouched. SC-006 → suite green.
