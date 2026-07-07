import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// FR-004 / SC-004 / C3: 多系列チャートは色以外の手掛かり(直接ラベル)で各系列を識別できる。
// 各多系列 SVG に data-series="N" を付し、series-label テキストが N 個以上あることを検証する。
test('every multi-series chart labels each series with a non-color cue', async ({ page }) => {
  await page.goto(indexUrl());
  const report = await page.evaluate(() =>
    [...document.querySelectorAll('svg[data-series]')].map((svg) => ({
      need: Number(svg.getAttribute('data-series')),
      got: svg.querySelectorAll('text.series-label').length,
      aria: svg.getAttribute('aria-label'),
    }))
  );
  expect(report.length, 'expected multi-series charts marked with data-series').toBeGreaterThan(0);
  for (const r of report) {
    expect(r.got, JSON.stringify(r)).toBeGreaterThanOrEqual(r.need);
  }
});
