import { test, expect } from '@playwright/test';
import { indexUrl } from '../visual/_fixtures.mjs';

// FR-003 / SC-002: PDF 化した成果物のページ数がスライド枚数と一致し、非自明サイズで生成される。
// 版面は既存 @media print（1スライド=1ページ）を唯一の正として再利用する。
// スライド枚数はハードコードせず、その時点の .slide 実数に追随する。

/** PDF バイト列からページ数を数える（/Type /Page で /Pages を除外）。check-pdf.mjs と同一方式。 */
function countPdfPages(buf) {
  const matches = buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);
  return matches ? matches.length : 0;
}

test('deck PDF page count matches slide count and artifact is non-trivial', async ({ page }) => {
  await page.goto(indexUrl());
  const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);

  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ width: '1280px', height: '720px', printBackground: true });

  expect(pdf.byteLength, 'PDF byteLength').toBeGreaterThan(1024);
  expect(countPdfPages(pdf), 'PDF page count == slide count').toBe(slideCount);
});
