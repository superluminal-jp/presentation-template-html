#!/usr/bin/env node
// build-pdf.mjs — 正本デック（index.html）を PDF 化する。
//
// 既存の `@media print`（1スライド=1ページ）を唯一の版面定義として再利用し、
// PDF 用の新規 CSS は書かない。Chromium で index.html を file:// で開き、
// print メディアをエミュレートしたうえで page.pdf() で 1280×720px を出力する。
// 出力は dist/deck.pdf（バージョン管理外）。Claude Code はこの PDF を Read ツールの
// `pages` パラメータでページ単位に視覚読み込みして評価する。
//
// Usage:
//   npm run build:pdf                 dist/deck.pdf を生成
//   node scripts/pdf/build-pdf.mjs --out <path>   出力先を上書き
//   node scripts/pdf/build-pdf.mjs --png          per-slide PNG も dist/pdf-pages/ に出力

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');

// --- 引数解析 -------------------------------------------------------------
const argv = process.argv.slice(2);
const wantPng = argv.includes('--png');
const outIdx = argv.indexOf('--out');
const outPath = outIdx !== -1 && argv[outIdx + 1]
  ? resolve(root, argv[outIdx + 1])
  : resolve(root, 'dist', 'deck.pdf');

const indexUrl = pathToFileURL(resolve(root, 'index.html')).href;

async function main() {
  mkdirSync(dirname(outPath), { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(indexUrl, { waitUntil: 'networkidle' });

    const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);

    // 任意: per-slide PNG（PDF 直読が使えない環境向けフォールバック）。
    // 画面（screen）メディアで各スライドを撮る。
    if (wantPng) {
      const pngDir = resolve(root, 'dist', 'pdf-pages');
      mkdirSync(pngDir, { recursive: true });
      const slides = page.locator('.slide');
      for (let i = 0; i < slideCount; i++) {
        const n = String(i + 1).padStart(2, '0');
        await slides.nth(i).screenshot({ path: resolve(pngDir, `${n}.png`) });
      }
      process.stdout.write(`[build:pdf] wrote ${slideCount} page image(s) to dist/pdf-pages/\n`);
    }

    // 版面の正: 既存 @media print（1スライド=1ページ）を使用。
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: outPath,
      width: '1280px',
      height: '720px',
      printBackground: true,
    });

    const rel = outPath.startsWith(root) ? outPath.slice(root.length + 1) : outPath;
    process.stdout.write(`[build:pdf] wrote ${rel} (${slideCount} pages)\n`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  const msg = String(err && err.message ? err.message : err);
  process.stderr.write(`[build:pdf] FAIL — ${msg}\n`);
  if (/Executable doesn't exist|browserType.launch/.test(msg)) {
    process.stderr.write("[build:pdf] Chromium 未導入の可能性。`npx playwright install chromium` を実行してください。\n");
  }
  process.exit(1);
});
