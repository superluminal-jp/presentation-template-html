import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { repoRoot } from './_fixtures.mjs';

// T035 / SC-05 / FR-013: 相互参照の整合を check-crossrefs.mjs で検証(リンク切れ0・巻末網羅)
test('cross-references are consistent (no broken links, reference covers all used)', () => {
  let ok = true, output = '';
  try {
    output = execFileSync('node', [resolve(repoRoot, 'scripts/check-crossrefs.mjs')], { encoding: 'utf8' });
  } catch (e) {
    ok = false;
    output = (e.stdout || '') + (e.stderr || '');
  }
  expect(ok, output).toBe(true);
  expect(output).toContain('PASS');
});
