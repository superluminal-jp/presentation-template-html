import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// T027 / SC-08: --accent が key-800(#0031d8 = rgb(0,49,216))で HP 基調と一致
test('accent role resolves to Digital Agency key-800 (#0031d8)', async ({ page }) => {
  await page.goto(indexUrl());
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  );
  expect(accent.replace(/\s/g, '')).toBe('#0031d8');
});

// C4 / FR-006 / SC-005: 見出し下線は構造装飾 → アクセント色にしない(Von Restorff の希釈を避ける)。
test('heading underline rule is not accent-colored', async ({ page }) => {
  await page.goto(indexUrl());
  const underlines = await page.evaluate(() =>
    [...document.querySelectorAll('.slide__heading')].map((h) =>
      getComputedStyle(h, '::after').backgroundColor.replace(/\s/g, '')
    )
  );
  expect(underlines.length).toBeGreaterThan(0);
  for (const bg of underlines) expect(bg, `underline bg ${bg}`).not.toBe('rgb(0,49,216)');
});

// C4 / FR-007 / SC-005: テキスト強調(.u-accent)は 1 スライド 1 箇所まで(単一焦点)。
test('at most one accent text-emphasis per slide', async ({ page }) => {
  await page.goto(indexUrl());
  const counts = await page.evaluate(() =>
    [...document.querySelectorAll('.slide')].map((s) => ({
      layout: s.getAttribute('data-layout'),
      n: s.querySelectorAll('.u-accent').length,
    }))
  );
  expect(counts.length).toBeGreaterThan(0);
  for (const c of counts) expect(c.n, JSON.stringify(c)).toBeLessThanOrEqual(1);
});
