# Contract: `sync-dads.mjs` CLI (`sync:dads` / `check:dads`)

Node ESM script at `scripts/sync-dads.mjs`. Models `scripts/sync-tokens.mjs` (vendoring) and `scripts/split-slides.mjs --check` (drift semantics).

## Constants (in-script)

- `REPO = 'digital-go-jp/design-system-example-components-html'`
- `SHA = '3b34f4c3553fa3bee90bfd8b6fe962ac3055107d'`
- `RAW_BASE = https://raw.githubusercontent.com/${REPO}/${SHA}/src/components`
- `TOKEN_VERSION = '@digital-go-jp/design-tokens@2.0.1'`
- `DEST_ROOT = vendor/dads-components`
- `MANIFEST` = component→files list (see data-model.md)

## Command: `npm run sync:dads` (write mode)

**Behavior**:
1. For each manifest file, HTTPS GET `${RAW_BASE}/<name>/<file>`.
2. On non-200 → print error incl. URL, exit 1 (no partial success left ambiguous).
3. Prepend provenance header, write to `vendor/dads-components/<name>/<basename>`.
4. Print a one-line summary per file and a total count.

**Provenance header** (CSS `/* */`, HTML `<!-- -->`), fields:
```
出典：デジタル庁デザインシステム (Digital Agency Design System)
Source: https://github.com/<REPO>/blob/<SHA>/src/components/<name>/<file>
Commit: <SHA>
Retrieved: <YYYY-MM-DD>
Tokens: <TOKEN_VERSION>
License: MIT — vendored unmodified; regenerate via `npm run sync:dads`. DO NOT hand-edit.
```

**Postconditions**: `vendor/dads-components/**` populated; bodies byte-identical to upstream at SHA; each file carries the header.

## Command: `npm run check:dads` (`sync-dads.mjs --check`)

**Behavior**:
1. For each manifest file, fetch upstream body at SHA.
2. Read the local vendored file, strip its provenance header, compare bodies.
3. Collect mismatches (and any missing local files).
4. If any mismatch/missing → print each offending path + reason, exit **1**.
5. Else print OK summary, exit **0**.

**Exit codes**: `0` = vendored matches pinned upstream; `1` = drift or missing file (same contract as `check:slides`).

**Non-goals / constraints**:
- Requires network (documented). NOT added to the default `verify` chain to keep CI offline-safe; run manually or in a network-enabled job.
- `--check` never writes.

## package.json

```json
"sync:dads": "node scripts/sync-dads.mjs",
"check:dads": "node scripts/sync-dads.mjs --check"
```

`verify` is left unchanged (network-free). A maintainer runs `check:dads` when auditing drift or before bumping the SHA.

## Acceptance mapping

- FR-005 → sync write mode. FR-006 → `--check` exit codes. FR-007 → provenance header. FR-011 → files committed. SC-003/SC-004 → re-sync reproducibility + drift detection.
