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
