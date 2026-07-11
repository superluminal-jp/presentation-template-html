import { test, expect } from '@playwright/test';
import { indexUrl } from '../visual/_fixtures.mjs';

// FR-001 / SC-002 / C1: キーボードフォーカス時に可視のフォーカスリングが出る。
// :focus-visible はキーボード(Tab)操作でのみ一致するため、Tab で巡回して確認する。
async function tabAndCollect(page) {
  const count = await page.evaluate(
    () => document.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])').length
  );
  const seen = [];
  for (let i = 0; i < count + 2; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      if (!/^(A|BUTTON)$/.test(el.tagName)) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        text: (el.textContent || '').trim().slice(0, 24),
        outlineStyle: cs.outlineStyle,
        outlineWidth: parseFloat(cs.outlineWidth) || 0,
        outlineColor: cs.outlineColor.replace(/\s/g, ''),
      };
    });
    if (info) seen.push(info);
  }
  return seen;
}

// トークン由来のリング色のみ許可: --accent(#0031d8) か、濃色地での --text-on-accent(白)。
const ALLOWED_RING = new Set(['rgb(0,49,216)', 'rgb(255,255,255)']);

function assertVisibleTokenRing(seen) {
  expect(seen.length, 'expected to focus at least one interactive element').toBeGreaterThan(0);
  for (const s of seen) {
    expect(s.outlineStyle, JSON.stringify(s)).not.toBe('none');
    expect(s.outlineWidth, JSON.stringify(s)).toBeGreaterThan(0);
    expect(ALLOWED_RING.has(s.outlineColor), `ring color not token-driven: ${JSON.stringify(s)}`).toBe(true);
  }
}

// index.html は付録(コンポーネント一本化先)の操作要素も含むため、この 1 本で
// デッキ全体のフォーカスリングを検証する(旧コンポーネント集ページ用テストは統合)。
test('index: interactive elements show a visible focus ring on keyboard focus', async ({ page }) => {
  await page.goto(indexUrl());
  assertVisibleTokenRing(await tabAndCollect(page));
});
