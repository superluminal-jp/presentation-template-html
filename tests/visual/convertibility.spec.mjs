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

// feature 011 / FR-001: data-pptx は閉じた語彙。語彙外の値は変換器が解釈できない。
const VOCAB = ['text', 'shape', 'line', 'table', 'chart', 'image', 'group', 'ignore'];

test('data-pptx values stay inside the closed role vocabulary', async ({ page }) => {
  await page.goto(indexUrl());
  const used = await page.evaluate(() =>
    [...new Set([...document.querySelectorAll('[data-pptx]')].map((el) => el.getAttribute('data-pptx')))]);
  expect(used.length, 'expected role attributes to be present').toBeGreaterThan(0);
  for (const v of used) expect(VOCAB, `unknown data-pptx value "${v}"`).toContain(v);
});

// feature 011 / FR-003: 本文は実 DOM のテキストノード。擬似要素で本文文字を描かない。
// (描いた場合 DOM 抽出で消え、PPTX から本文が黙って欠落する)
//
// 例外は `li::before` のリストマーカー(.checklist の ✓ など)。これは本文ではなく
// 箇条書きの記号であり、抽出器がネイティブ箇条書き文字として持ち上げるため失われない。
// 例外はこの 1 種類に限る — li 以外や、マーカーとして長すぎる文字列は本文とみなす。
test('no pseudo-element renders body text', async ({ page }) => {
  await page.goto(indexUrl());
  const offenders = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('.slide *')) {
      for (const pseudo of ['::before', '::after']) {
        const c = getComputedStyle(el, pseudo).content;
        if (!c || c === 'none' || c === 'normal') continue;
        // 引用符付きの文字列だけが「描かれる文字」。空文字は装飾用の箱。
        const m = c.match(/^"(.*)"$/);
        if (!m || !m[1].trim()) continue;
        const marker = el.tagName === 'LI' && pseudo === '::before' && [...m[1].trim()].length === 1;
        if (!marker) {
          bad.push({ sel: el.className || el.tagName, pseudo, content: m[1] });
        }
      }
    }
    return bad;
  });
  expect(offenders, JSON.stringify(offenders)).toEqual([]);
});

// feature 011 / FR-002: どのスライドも変換対象を持つ(空のスライドが生まれていない)
test('every slide yields at least one convertible element', async ({ page }) => {
  await page.goto(indexUrl());
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('.slide')].map((s) => ({
      layout: s.getAttribute('data-layout'),
      // マーク済み要素 か、直接テキストを持つ要素(自動でテキストボックスになる)
      marked: s.querySelectorAll('[data-pptx]:not([data-pptx="ignore"])').length,
      texts: [...s.querySelectorAll('*')].filter((el) =>
        !el.closest('[data-pptx="ignore"]') &&
        [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())).length,
    })));
  for (const r of rows) {
    expect(r.marked + r.texts, `${r.layout} has nothing to convert`).toBeGreaterThan(0);
  }
});
