import { test, expect } from '@playwright/test';
import { indexUrl } from './_fixtures.mjs';

// Minto Pyramid Principle: 結論(統括思想)を先に・目立たせる。
// section の主張(lead)はタイトル直下に近接配置し主要色で提示、
// compare の結論(verdict)は根拠(2カラム)より上に置き、フッタと重ならない。

function overlaps(a, b) {
  return !(a.r <= b.l || a.l >= b.r || a.bt <= b.t || a.t >= b.bt);
}

async function geometry(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      const b = el.getBoundingClientRect();
      return { l: b.left, t: b.top, r: b.right, bt: b.bottom };
    };
    const cmp = document.querySelector('.slide--compare');
    const sec = document.querySelector('.slide--section');
    const title = sec.querySelector('.section-title');
    const lead = sec.querySelector('.section-lead');
    return {
      verdict: rect(cmp.querySelector('.verdict')),
      footer: rect(cmp.querySelector('.slide__footer')),
      cols: rect(cmp.querySelector('.cols')),
      titleBottom: title.getBoundingClientRect().bottom,
      leadTop: lead.getBoundingClientRect().top,
      leadColor: getComputedStyle(lead).color,
      titleColor: getComputedStyle(title).color,
    };
  });
}

test('compare: verdict is the top-line answer and does not overlap the footer', async ({ page }) => {
  await page.goto(indexUrl());
  const g = await geometry(page);
  // 結論がフッタ(出典)と重ならない(旧: 同一グリッド行で重畳)
  expect(overlaps(g.verdict, g.footer), 'verdict overlaps footer').toBe(false);
  // 答え先行: 結論は根拠(カラム)より上に置く
  expect(g.verdict.bt, 'verdict above columns').toBeLessThanOrEqual(g.cols.t + 1);
});

test('section: thesis lead is grouped under the title and rendered as primary', async ({ page }) => {
  await page.goto(indexUrl());
  const g = await geometry(page);
  // 近接: 主張はタイトル直下(下端に取り残さない)
  expect(g.leadTop, 'lead below title').toBeGreaterThan(g.titleBottom - 1);
  expect(g.leadTop - g.titleBottom, 'lead grouped near title').toBeLessThan(96);
  // 主要色で提示(灰の脇役にしない): タイトルと同じ主要テキスト色
  expect(g.leadColor, 'lead uses primary color').toBe(g.titleColor);
});
