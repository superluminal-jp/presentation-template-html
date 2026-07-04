import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { repoRoot } from './_fixtures.mjs';

// T024 / SC-005: practices.md の全手法が core+extended で実演される(未実演0)
test('practice coverage is complete (no undemonstrated catalog entries)', () => {
  let ok = true, output = '';
  try {
    output = execFileSync('node', [resolve(repoRoot, 'scripts/check-practice-coverage.mjs')], { encoding: 'utf8' });
  } catch (e) {
    ok = false;
    output = (e.stdout || '') + (e.stderr || '');
  }
  expect(ok, output).toBe(true);
  expect(output).toContain('未実演0');
});
