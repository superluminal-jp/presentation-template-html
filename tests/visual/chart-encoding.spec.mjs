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

// feature 011 / FR-005: ネイティブ編集可能グラフの data-chart payload は、
// 手描き SVG の直接ラベル・系列数と整合していなければならない。
// この整合チェックが、payload と SVG の限定的な二重表現を封じる唯一の歯止め
// (plan.md の Complexity Tracking に記録した例外)。
test('data-chart payload agrees with the hand-drawn SVG it accompanies', async ({ page }) => {
  await page.goto(indexUrl());
  const charts = await page.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, '');
    return [...document.querySelectorAll('[data-chart]')].map((el) => {
      let data = null, err = null;
      try { data = JSON.parse(el.getAttribute('data-chart')); } catch (e) { err = String(e.message || e); }
      return {
        aria: el.getAttribute('aria-label') || '(no aria-label)',
        declared: el.getAttribute('data-series') ? Number(el.getAttribute('data-series')) : null,
        labels: [...el.querySelectorAll('text.series-label')].map((t) => norm(t.textContent)).sort(),
        data, err,
      };
    });
  });

  expect(charts.length, 'expected charts carrying a data-chart payload').toBeGreaterThan(0);

  for (const c of charts) {
    expect(c.err, `${c.aria}: data-chart is not valid JSON`).toBeNull();
    expect(c.data, `${c.aria}: data-chart is empty`).toBeTruthy();

    const { type, categories, series } = c.data;
    expect(series.length, `${c.aria}: no series`).toBeGreaterThan(0);

    if (type === 'doughnut') {
      // 円系は直接ラベルが系列ではなくカテゴリを指す
      if (c.declared !== null) expect(categories.length, `${c.aria}: category count`).toBe(c.declared);
      if (c.labels.length) {
        expect(categories.map((s) => s.replace(/\s+/g, '')).sort(), `${c.aria}: category names`).toEqual(c.labels);
      }
    } else {
      if (c.declared !== null) expect(series.length, `${c.aria}: series count`).toBe(c.declared);
      if (c.labels.length) {
        expect(series.map((s) => s.name.replace(/\s+/g, '')).sort(), `${c.aria}: series names`).toEqual(c.labels);
      }
      if (type !== 'scatter') {
        for (const s of series) {
          expect(s.values.length, `${c.aria}: 系列「${s.name}」の値数`).toBe(categories.length);
        }
      }
    }
  }
});
