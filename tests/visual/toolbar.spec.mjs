import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// ツールバーはスライド見出しに重ならない全幅トップバー。発表モードでは非表示。
test('toolbar is a full-width top bar and slides start below it', async ({ page }) => {
  await page.goto(indexUrl());
  const g = await page.evaluate(() => {
    const t = document.querySelector('.toolbar').getBoundingClientRect();
    const s = document.querySelector('.slide').getBoundingClientRect();
    return { tl: t.left, tr: t.right, tb: t.bottom, sTop: s.top, vw: window.innerWidth };
  });
  // 全幅(左右端まで) — 右上の浮遊ボックスではなくバー
  expect(g.tl, 'toolbar spans to left edge').toBeLessThanOrEqual(1);
  expect(g.tr, 'toolbar spans to right edge').toBeGreaterThanOrEqual(g.vw - 1);
  // 1枚目のスライドはバーの下から始まる(見出しが隠れない)
  expect(g.sTop, 'first slide starts below the toolbar').toBeGreaterThanOrEqual(g.tb - 1);
});

test('toolbar is hidden in present mode (keyboard-driven)', async ({ page }) => {
  await page.goto(indexUrl());
  await page.keyboard.press('p');
  const display = await page.evaluate(
    () => getComputedStyle(document.querySelector('.toolbar')).display
  );
  expect(display).toBe('none');
});
