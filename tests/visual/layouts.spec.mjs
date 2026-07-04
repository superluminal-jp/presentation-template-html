import { test, expect } from '@playwright/test';
import { LAYOUTS, slideUrl, indexUrl, assertNoOverflow } from './_fixtures.mjs';

// T024 / SC-01: 8レイアウトが 1280×720 で崩れず(overflow なし)表示される
for (const name of LAYOUTS) {
  test(`layout ${name} fits 1280x720 without overflow`, async ({ page }) => {
    await page.goto(slideUrl(name));
    await assertNoOverflow(page, expect);
  });
}

test('showcase deck has no overflow on any slide', async ({ page }) => {
  await page.goto(indexUrl());
  const report = await assertNoOverflow(page, expect);
  expect(report.length).toBe(8);
});
