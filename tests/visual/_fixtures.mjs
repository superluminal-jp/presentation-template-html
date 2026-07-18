/**
 * _fixtures.mjs — 共有テストヘルパ。
 * ローカルの HTML を file:// で開き、1280×720 での overflow を判定する。
 */
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(__dirname, '..', '..');

export const LAYOUTS = [
  '01-title', '02-toc', '03-section', '04-body',
  '05-compare', '06-chart', '07-summary', '08-reference',
  '09-big-number', '10-dashboard', '11-timeline', '12-matrix',
  '13-process', '14-quote', '15-image-full', '16-closing',
  '17-tree',
];

export function slideUrl(name) {
  return pathToFileURL(resolve(repoRoot, 'slides', `${name}.html`)).href;
}

export function indexUrl() {
  return pathToFileURL(resolve(repoRoot, 'index.html')).href;
}

/** ページ内の .slide が 1280×720 を超えて内容をはみ出していないか(SC-01)。 */
export async function assertNoOverflow(page, expect) {
  const report = await page.evaluate(() => {
    const results = [];
    for (const slide of document.querySelectorAll('.slide')) {
      const overflowX = slide.scrollWidth - slide.clientWidth;
      const overflowY = slide.scrollHeight - slide.clientHeight;
      results.push({
        layout: slide.getAttribute('data-layout'),
        w: slide.clientWidth, h: slide.clientHeight,
        overflowX, overflowY,
      });
    }
    return results;
  });
  for (const r of report) {
    expect(r.w, `${r.layout} width`).toBe(1280);
    expect(r.h, `${r.layout} height`).toBe(720);
    expect(r.overflowX, `${r.layout} overflow-x`).toBeLessThanOrEqual(1);
    expect(r.overflowY, `${r.layout} overflow-y`).toBeLessThanOrEqual(1);
  }
  return report;
}
