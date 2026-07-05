import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// T034 / SC-03: 注釈は既定非表示、8/8 でトグル表示できる
test('annotations default hidden and toggle on/off for all slides', async ({ page }) => {
  await page.goto(indexUrl());
  const visible = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.slide__annotation')].filter((a) => a.offsetParent !== null).length
    );
  const total = await page.evaluate(() => document.querySelectorAll('.slide__annotation').length);
  const withAnn = await page.evaluate(() =>
    [...document.querySelectorAll('.slide')].filter((s) => s.querySelector('.slide__annotation')).length
  );
  const individualToggles = await page.evaluate(() => document.querySelectorAll('.slide__annotation-toggle').length);
  expect(total).toBeGreaterThanOrEqual(16); // 注釈を持つスライド(コア+拡張)。付録スライドは注釈なし
  expect(withAnn).toBe(total);              // すべての注釈はスライドに属する
  expect(individualToggles).toBe(0);        // 右上の i マークは取扱区分フレームと重なるため表示しない
  expect(await visible()).toBe(0);          // 既定は非表示
  await page.evaluate(() => window.PresTemplate.toggleAnnotations(true));
  expect(await visible()).toBe(total);      // トグルで全注釈表示
  await page.evaluate(() => window.PresTemplate.toggleAnnotations(false));
  expect(await visible()).toBe(0);
});
