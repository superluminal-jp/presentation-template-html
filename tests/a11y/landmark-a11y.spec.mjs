import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { indexUrl } from '../visual/_fixtures.mjs';

// FR-002 / FR-003 / SC-003 / C2: 単一の h1・main ランドマーク・各スライドのアクセシブル名。
test('document exposes exactly one h1 and a main landmark', async ({ page }) => {
  await page.goto(indexUrl());
  const r = await page.evaluate(() => ({
    h1: document.querySelectorAll('h1').length,
    main: document.querySelectorAll('main').length,
  }));
  expect(r.h1).toBe(1);
  expect(r.main).toBe(1);
});

test('every slide has an accessible name and slide role description', async ({ page }) => {
  await page.goto(indexUrl());
  const slides = await page.evaluate(() =>
    [...document.querySelectorAll('.slide')].map((s) => ({
      layout: s.getAttribute('data-layout'),
      label: (s.getAttribute('aria-label') || '').trim(),
      roledesc: (s.getAttribute('aria-roledescription') || '').trim(),
    }))
  );
  expect(slides.length).toBeGreaterThan(0);
  for (const s of slides) {
    expect(s.label.length, `${s.layout} aria-label`).toBeGreaterThan(0);
    expect(s.roledesc.length, `${s.layout} aria-roledescription`).toBeGreaterThan(0);
  }
});

test('no axe heading-order / landmark / heading-one violations', async ({ page }) => {
  await page.goto(indexUrl());
  const results = await new AxeBuilder({ page })
    .options({ runOnly: { type: 'rule', values: ['heading-order', 'page-has-heading-one', 'landmark-one-main'] } })
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
