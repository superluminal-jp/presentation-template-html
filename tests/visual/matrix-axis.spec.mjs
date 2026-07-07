import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// P.11 matrix: y軸ラベル「効果 高 → 低」は 上=高・下=低(内容: 上段=効果大 / 下段=効果小)。
// vertical-rl は既に上→下へ 高→低 と流れる。180°回転を重ねると上下反転(低が上)し内容と矛盾する。
test('matrix y-axis label is vertical and not upside-down (高 stays on top)', async ({ page }) => {
  await page.goto(indexUrl());
  const { transform, writingMode } = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.slide--matrix .axis-y'));
    return { transform: cs.transform, writingMode: cs.writingMode };
  });
  expect(writingMode, 'y-axis label is vertical').toContain('vertical');
  // rotate(180deg) === matrix(-1, 0, 0, -1, 0, 0):上下反転を禁止する。
  expect(transform.replace(/\s/g, ''), '180deg flip inverts 高/低').not.toBe('matrix(-1,0,0,-1,0,0)');
});
