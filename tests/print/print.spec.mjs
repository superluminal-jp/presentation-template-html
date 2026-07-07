import { test, expect } from '@playwright/test';
import { indexUrl } from '../visual/_fixtures.mjs';

// T025 / SC-01: 印刷で 1スライド=1ページ。各 .slide に page-break-after が効いていることを検証。
test('print media applies one-slide-per-page breaks', async ({ page }) => {
  await page.goto(indexUrl());
  await page.emulateMedia({ media: 'print' });
  const breaks = await page.evaluate(() => {
    const slides = [...document.querySelectorAll('.slide')];
    return slides.map((s) => {
      const cs = getComputedStyle(s);
      return cs.breakAfter || cs.pageBreakAfter;
    });
  });
  expect(breaks.length).toBeGreaterThanOrEqual(16);
  // 最後以外はページ送り、注釈は印刷対象外
  breaks.slice(0, -1).forEach((b) => expect(['always', 'page']).toContain(b));

  const annPrintable = await page.evaluate(() =>
    [...document.querySelectorAll('.slide__annotation')].filter((a) => getComputedStyle(a).display !== 'none').length
  );
  expect(annPrintable).toBe(0);

  // SC-006: 共通フレーム(取扱区分/Copyright/ページ番号)は印刷でも保持される
  const framesHidden = await page.evaluate(() =>
    [...document.querySelectorAll('.slide__frame')].filter((f) => getComputedStyle(f).display === 'none').length
  );
  expect(framesHidden).toBe(0);

  // PDF 生成(スモーク): 例外なく生成できること
  const pdf = await page.pdf({ width: '1280px', height: '720px', printBackground: true });
  expect(pdf.byteLength).toBeGreaterThan(1000);
});
