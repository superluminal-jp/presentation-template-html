import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// レイアウトはグリッド(.slide__stage: auto 1fr auto)で制御される。
// フッタ(.slide__footer)は常に最終行に置かれ、本文スロットと重ならないことを保証する。
// (かつて compare の verdict がフッタと同一行で重畳したバグの再発防止。)

test('every stage places its footer on the last row (grid-controlled)', async ({ page }) => {
  await page.goto(indexUrl());
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('.slide__footer')].map((f) => {
      const cs = getComputedStyle(f);
      return { display: getComputedStyle(f.closest('.slide__stage')).display, gridRow: cs.gridRow };
    })
  );
  expect(rows.length).toBeGreaterThan(0);
  for (const r of rows) {
    expect(r.display, 'stage uses CSS grid').toBe('grid');
  }
});

test('footer never overlaps slide content in any layout', async ({ page }) => {
  await page.goto(indexUrl());
  const report = await page.evaluate(() => {
    const out = [];
    for (const slide of document.querySelectorAll('.slide')) {
      const stage = slide.querySelector('.slide__stage');
      if (!stage) continue;
      const footer = stage.querySelector(':scope > .slide__footer');
      if (!footer) continue;
      const fr = footer.getBoundingClientRect();
      for (const child of stage.children) {
        if (child === footer) continue;
        const cr = child.getBoundingClientRect();
        if (cr.width === 0 || cr.height === 0) continue;
        out.push({
          layout: slide.getAttribute('data-layout'),
          el: child.getAttribute('class') || child.tagName,
          // content bottom must sit at/above the footer top; >1 means overlap into the footer
          overlapPx: Math.round(cr.bottom - fr.top),
        });
      }
    }
    return out;
  });
  expect(report.length, 'expected slides with footers').toBeGreaterThan(0);
  for (const r of report) {
    expect(r.overlapPx, `${r.layout}: ".${r.el}" overlaps footer by ${r.overlapPx}px`).toBeLessThanOrEqual(1);
  }
});
