import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// FR-009–014 / SC-006,007 / C5: オプトインの発表モード。
// 既定は review、発表モードは 1 枚をビューポートに収め、キーボードで境界付き移動、印刷は不変。

test('default mode is review with all slides visible', async ({ page }) => {
  await page.goto(indexUrl());
  const mode = await page.evaluate(() => document.documentElement.getAttribute('data-mode'));
  expect(mode === null || mode === 'review').toBe(true);
  const visible = await page.evaluate(
    () => [...document.querySelectorAll('.slide')].filter((s) => s.getBoundingClientRect().width > 0).length
  );
  expect(visible).toBeGreaterThan(1);
});

test('present mode fits one slide in a small viewport and hides siblings', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto(indexUrl());
  await page.keyboard.press('p');
  const info = await page.evaluate(() => {
    const active = document.querySelector('.slide[data-active]');
    const r = active.getBoundingClientRect();
    const others = [...document.querySelectorAll('.slide:not([data-active])')].filter(
      (s) => s.getBoundingClientRect().width > 0
    ).length;
    return {
      mode: document.documentElement.getAttribute('data-mode'),
      rw: r.width, rh: r.height, rl: r.left, rt: r.top, rr: r.right, rb: r.bottom,
      others, vw: window.innerWidth, vh: window.innerHeight,
    };
  });
  expect(info.mode).toBe('present');
  expect(info.others, 'sibling slides hidden').toBe(0);
  expect(info.rw, 'fits width').toBeLessThanOrEqual(info.vw + 1);
  expect(info.rh, 'fits height').toBeLessThanOrEqual(info.vh + 1);
  expect(info.rl, 'no left clip').toBeGreaterThanOrEqual(-1);
  expect(info.rt, 'no top clip').toBeGreaterThanOrEqual(-1);
  expect(info.rr, 'no right overflow').toBeLessThanOrEqual(info.vw + 1);
});

test('present mode keyboard navigation is bounded at both ends', async ({ page }) => {
  await page.goto(indexUrl());
  await page.keyboard.press('p');
  const total = await page.evaluate(() => window.PresPresent.total());
  const first = await page.evaluate(() => window.PresPresent.index());
  await page.keyboard.press('ArrowLeft');
  const stillFirst = await page.evaluate(() => window.PresPresent.index());
  await page.keyboard.press('ArrowRight');
  const second = await page.evaluate(() => window.PresPresent.index());
  expect(first).toBe(0);
  expect(stillFirst).toBe(0);
  expect(second).toBe(1);
  // 末尾で停止
  await page.evaluate((n) => window.PresPresent.go(n - 1), total);
  await page.keyboard.press('ArrowRight');
  const last = await page.evaluate(() => window.PresPresent.index());
  expect(last).toBe(total - 1);
});

test('non-active slides are inert in present mode', async ({ page }) => {
  await page.goto(indexUrl());
  await page.keyboard.press('p');
  const allInert = await page.evaluate(() =>
    [...document.querySelectorAll('.slide:not([data-active])')].every((s) => s.hasAttribute('inert'))
  );
  expect(allInert).toBe(true);
});

test('toggling present mode off restores review', async ({ page }) => {
  await page.goto(indexUrl());
  await page.keyboard.press('p');
  await page.keyboard.press('Escape');
  const mode = await page.evaluate(() => document.documentElement.getAttribute('data-mode'));
  const visible = await page.evaluate(
    () => [...document.querySelectorAll('.slide')].filter((s) => s.getBoundingClientRect().width > 0).length
  );
  expect(mode).toBe('review');
  expect(visible).toBeGreaterThan(1);
});

test('print shows all slides even when present mode is active', async ({ page }) => {
  await page.goto(indexUrl());
  await page.keyboard.press('p');
  await page.emulateMedia({ media: 'print' });
  const visible = await page.evaluate(
    () => [...document.querySelectorAll('.slide')].filter((s) => s.getBoundingClientRect().width > 0).length
  );
  expect(visible).toBeGreaterThan(1);
});
