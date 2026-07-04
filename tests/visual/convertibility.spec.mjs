import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// T046 / FR-012: 命名スロットの矩形が確定でき、本文が実DOMテキスト(擬似要素での本文表示なし)
const SLOTS = ['.slide__heading', '.title', '.subtitle', '.meta', '.agenda', '.section-title',
  '.body', '.cols', '.chart', '.takeaway', '.key-messages', '.cta', '.citation-list'];

test('every layout exposes determinable slot rectangles with real DOM text', async ({ page }) => {
  await page.goto(indexUrl());
  const report = await page.evaluate((SLOTS) => {
    const rows = [];
    for (const s of document.querySelectorAll('.slide')) {
      for (const sel of SLOTS) {
        const el = s.querySelector(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const rectOk = [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.width > 0 && r.height > 0;
        const textOk = sel === '.chart' ? true : el.textContent.trim().length > 0;
        rows.push({ layout: s.getAttribute('data-layout'), sel, rectOk, textOk });
      }
    }
    return rows;
  }, SLOTS);
  for (const r of report) {
    expect(r.rectOk, `${r.layout} ${r.sel} rect`).toBe(true);
    expect(r.textOk, `${r.layout} ${r.sel} text`).toBe(true);
  }
});
