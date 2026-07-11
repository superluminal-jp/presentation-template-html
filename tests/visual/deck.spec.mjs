import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// T043 / SC-01+SC-07: ショーケース全体の視覚回帰(各スライドのスクリーンショット)
test('deck: per-slide screenshot regression', async ({ page }) => {
  await page.goto(indexUrl());
  const slides = page.locator('.slide');
  const n = await slides.count();
  // コア16 + 付録8(A–H) = 24。付録 F/G/H は feature 007 でコンポーネント一本化により追加。
  // スライド増減時はこの値とベースラインを更新する。
  expect(n).toBe(24);
  for (let i = 0; i < n; i++) {
    const layout = await slides.nth(i).getAttribute('data-layout');
    await expect(slides.nth(i)).toHaveScreenshot(`deck-${layout}.png`, { maxDiffPixelRatio: 0.001 });
  }
});
