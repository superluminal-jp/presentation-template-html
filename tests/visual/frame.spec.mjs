import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// T009 / SC-001/003: 全スライドに共通フレーム4要素 + 通しページ番号 + 機密性切替
test('every slide has a four-element frame with sequential page numbers', async ({ page }) => {
  await page.goto(indexUrl());
  const data = await page.evaluate(() => {
    const slides = [...document.querySelectorAll('.slide')];
    return slides.map((s, i) => {
      const f = s.querySelector('.slide__frame');
      return {
        i: i + 1,
        has4: !!(f && f.querySelector('.frame__copyright') && f.querySelector('.frame__pageno') &&
                 f.querySelector('.frame__scope') && f.querySelector('.frame__confidentiality')),
        pageno: f ? f.querySelector('.frame__pageno').textContent.trim() : null,
      };
    });
  });
  const total = data.length;
  expect(total).toBeGreaterThanOrEqual(16);
  for (const d of data) {
    expect(d.has4, `slide ${d.i} frame`).toBe(true);
    expect(d.pageno).toBe(`${d.i} / ${total}`);
  }
});

test('confidentiality classification switches across 1/2/3', async ({ page }) => {
  await page.goto(indexUrl());
  const result = await page.evaluate(() => {
    const s = document.querySelector('.slide--body') || document.querySelector('.slide');
    const el = s.querySelector('.frame__confidentiality');
    const snap = () => ({ attr: s.getAttribute('data-confidentiality'), text: el.textContent, bg: getComputedStyle(el).backgroundColor });
    const out = {};
    window.PresFrame.setConfidentiality(1, s); out.l1 = snap();
    window.PresFrame.setConfidentiality(2, s); out.l2 = snap();
    window.PresFrame.setConfidentiality(3, s); out.l3 = snap();
    return out;
  });
  expect(result.l1.text).toContain('機密性1');
  expect(result.l2.text).toContain('機密性2');
  expect(result.l3.text).toContain('機密性3');
  // トーンが区分ごとに異なる(2/3 は淡面が付く)
  expect(result.l2.bg).not.toBe(result.l3.bg);
});
