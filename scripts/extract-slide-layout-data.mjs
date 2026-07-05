#!/usr/bin/env node
/**
 * extract-slide-layout-data.mjs
 *
 * Node/Playwright half of the .potx conversion pipeline (specs/005-pptx-export-script).
 * Renders each `slides/NN-*.html` layout headlessly, reads DS-token-resolved
 * computed styles + geometry for its semantic elements, and emits an
 * intermediate JSON (contracts/slide-layout-data.schema.json) consumed by
 * scripts/pptx-template/build_potx.py.
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateSlideLayoutData } from './validate-slide-layout-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const LAYOUT_NAMES_JA = {
  '01-title': '表紙',
  '02-toc': '目次',
  '03-section': '章扉',
  '04-body': '本文',
  '05-compare': '比較',
  '06-chart': '図表',
  '07-summary': 'まとめ',
  '08-reference': 'リファレンス',
  '09-big-number': 'ビッグナンバー',
  '10-dashboard': 'ダッシュボード',
  '11-timeline': 'タイムライン',
  '12-matrix': 'マトリクス',
  '13-process': 'プロセス',
  '14-quote': '引用',
  '15-image-full': '全面画像',
  '16-closing': 'クロージング',
};

const LAYOUT_ORDER = Object.keys(LAYOUT_NAMES_JA);

// Selectors tried in this order; first matching element per role is used.
const ROLE_SELECTORS = {
  title: ['.title', '.slide__heading', '.section-title'],
  subtitle: ['.subtitle'],
  meta: ['.meta'],
  body: ['.body', '.lead', '.callout__title', '.verdict', '.quote', '.section-lead'],
  caption: ['.slide__citation', '.caption', '.attribution'],
  image: ['img'],
  // Elements too complex to reconstruct as native shapes; rasterized (FR-008).
  chart: ['.chart', '.kpi-grid', '.bignum', '.chart-sample'],
};

// Global DS token roles resolved once per page (data-model.md ThemeMapping).
const TOKEN_ROLE_CSS_VARS = {
  'text-primary': '--text-primary',
  'text-secondary': '--text-secondary',
  'slide-bg': '--slide-bg',
  surface: '--surface',
  accent: '--accent',
  'accent-strong': '--accent-strong',
  'accent-weak': '--accent-weak',
  'state-success': '--state-success',
  'state-error': '--state-error',
  'state-warning': '--state-warning',
  'font-sans': '--font-sans',
};

function parseArgs(argv) {
  const args = { inputDir: 'slides', out: 'build/slide-layout-data.json' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--input-dir') args.inputDir = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function rgbToHex(rgbString) {
  if (!rgbString) return null;
  const m = rgbString.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
  const [r, g, b, a] = parts;
  if (a === 0) return null; // transparent
  const toHex = (n) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function resolveTokenValues(page) {
  return page.evaluate((cssVars) => {
    const style = getComputedStyle(document.documentElement);
    const out = {};
    for (const [role, varName] of Object.entries(cssVars)) {
      out[role] = style.getPropertyValue(varName).trim();
    }
    return out;
  }, TOKEN_ROLE_CSS_VARS);
}

function nearestTokenRole(colorHex, tokenValues) {
  for (const [role, value] of Object.entries(tokenValues)) {
    if (role === 'font-sans') continue;
    const asHex = value.startsWith('#') ? value.toUpperCase() : rgbToHex(value);
    if (asHex && colorHex && asHex.toUpperCase() === colorHex.toUpperCase()) {
      return `--${role}`;
    }
  }
  return '--text-primary'; // best-effort default; never leaves token_role empty
}

async function extractElements(page, tokenValues) {
  const raw = await page.evaluate(
    ({ roleSelectors, canvasWidth, canvasHeight }) => {
      const stage = document.querySelector('.slide') || document.body;
      const stageRect = stage.getBoundingClientRect();
      const seen = new Set();
      const results = [];

      for (const [role, selectors] of Object.entries(roleSelectors)) {
        for (const sel of selectors) {
          const el = stage.querySelector(sel);
          if (!el || seen.has(el)) continue;
          seen.add(el);
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          results.push({
            role,
            text: el.tagName === 'IMG' ? null : (el.textContent || '').trim() || null,
            bbox_px: {
              x: rect.left - stageRect.left,
              y: rect.top - stageRect.top,
              w: rect.width,
              h: rect.height,
            },
            color: cs.color,
            backgroundColor: cs.backgroundColor,
            fontFamily: cs.fontFamily.replace(/["']/g, '').split(',')[0].trim(),
            fontSizePx: parseFloat(cs.fontSize),
            fontWeight: parseInt(cs.fontWeight, 10) >= 600 ? 700 : 400,
            lineHeightPx: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2,
          });
          break; // first matching selector wins for this role
        }
      }
      return { elements: results, canvasWidth, canvasHeight };
    },
    { roleSelectors: ROLE_SELECTORS, canvasWidth: CANVAS_WIDTH, canvasHeight: CANVAS_HEIGHT }
  );
  return raw.elements;
}

async function extractFrameElements(page) {
  return page.evaluate(() => {
    const frame = document.querySelector('.slide__frame');
    if (!frame) return [];
    const classification = frame.querySelector('.frame__classification');
    const copyright = frame.querySelector('.frame__copyright');
    const pageno = frame.querySelector('.frame__pageno');
    const rectFor = (el) => {
      if (!el) return { x: 0, y: 0, w: 0, h: 0 };
      const stage = document.querySelector('.slide');
      const stageRect = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - stageRect.left, y: r.top - stageRect.top, w: r.width, h: r.height };
    };
    const out = [];
    if (classification) {
      out.push({
        kind: 'classification',
        text_template: classification.textContent.trim(),
        position: rectFor(classification),
      });
    }
    if (copyright) {
      out.push({
        kind: 'copyright',
        text_template: copyright.textContent.trim(),
        position: rectFor(copyright),
      });
    }
    if (pageno) {
      out.push({
        kind: 'page_number',
        text_template: pageno.textContent.trim(),
        position: rectFor(pageno),
      });
    }
    return out;
  });
}

function toRatioBBox(bboxPx) {
  return {
    x: bboxPx.x / CANVAS_WIDTH,
    y: bboxPx.y / CANVAS_HEIGHT,
    w: bboxPx.w / CANVAS_WIDTH,
    h: bboxPx.h / CANVAS_HEIGHT,
  };
}

async function captureFallbackImage(page, role, layoutId, outDir, selectors) {
  const stage = page.locator('.slide');
  for (const sel of selectors) {
    const locator = stage.locator(sel).first();
    if ((await locator.count()) === 0) continue;
    await mkdir(outDir, { recursive: true });
    const imagePath = resolve(outDir, `${layoutId}__${role}.png`);
    await locator.screenshot({ path: imagePath, scale: 'css' });
    return imagePath;
  }
  return null;
}

async function extractLayout(browser, htmlPath, fallbackImageDir) {
  const layoutId = basename(htmlPath, '.html');
  const layoutNameJa = LAYOUT_NAMES_JA[layoutId] || layoutId;

  const page = await browser.newPage({ viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });

  const tokenValues = await resolveTokenValues(page);
  const rawElements = await extractElements(page, tokenValues);
  const frameElements = await extractFrameElements(page);

  const elements = [];
  let readingOrderIndex = 0;
  for (const raw of rawElements) {
    const colorHex = rgbToHex(raw.color);
    const bgHex = rgbToHex(raw.backgroundColor);
    const isChartRole = raw.role === 'chart';

    let fallback = { is_fallback: false };
    let altTextHint = null;
    if (isChartRole) {
      const imagePath = await captureFallbackImage(
        page,
        raw.role,
        layoutId,
        fallbackImageDir,
        ROLE_SELECTORS.chart
      );
      fallback = {
        is_fallback: true,
        reason: 'complex DOM/CSS visualization rasterized instead of reconstructed as native shapes',
        image_path: imagePath,
      };
      altTextHint = `${layoutNameJa}の図表`;
    } else if (raw.role === 'image') {
      altTextHint = raw.text || `${layoutNameJa}の画像`;
    }

    elements.push({
      role: raw.role,
      text: raw.text,
      bbox_px: raw.bbox_px,
      bbox_ratio: toRatioBBox(raw.bbox_px),
      computed_style: {
        color_hex: colorHex || '#000000',
        background_color_hex: bgHex,
        font_family: raw.fontFamily,
        font_size_px: raw.fontSizePx,
        font_weight: raw.fontWeight,
        line_height_px: raw.lineHeightPx,
        token_role: nearestTokenRole(colorHex, tokenValues),
      },
      fallback,
      alt_text_hint: altTextHint,
      reading_order_index: readingOrderIndex++,
    });
  }

  await page.close();

  return {
    layout_id: layoutId,
    layout_name_ja: layoutNameJa,
    source_path: `slides/${layoutId}.html`,
    elements,
    frame_elements: frameElements,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputDir = resolve(REPO_ROOT, args.inputDir);
  const outPath = resolve(REPO_ROOT, args.out);
  const fallbackImageDir = resolve(dirname(outPath), 'fallback-images');

  const browser = await chromium.launch();
  const logs = [];
  const layouts = [];
  let globalTokens = null;

  try {
    for (const layoutId of LAYOUT_ORDER) {
      const htmlPath = resolve(inputDir, `${layoutId}.html`);
      try {
        const page = await browser.newPage({ viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } });
        await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
        if (!globalTokens) {
          globalTokens = await resolveTokenValues(page);
          if (globalTokens['font-sans']) {
            globalTokens['font-sans'] = globalTokens['font-sans']
              .replace(/["']/g, '')
              .split(',')[0]
              .trim();
          }
        }
        await page.close();
      } catch (err) {
        logs.push({ level: 'WARNING', layout_id: layoutId, element_role: null, message: `Could not open ${htmlPath}: ${err.message}` });
        continue;
      }

      const layoutData = await extractLayout(browser, htmlPath, fallbackImageDir);
      layouts.push(layoutData);
    }
  } finally {
    await browser.close();
  }

  const data = { tokens: globalTokens || {}, layouts };
  const { valid, errors } = validateSlideLayoutData(data);
  if (!valid) {
    for (const err of errors) {
      logs.push({ level: 'ERROR', layout_id: null, element_role: null, message: `Schema validation: ${err}` });
    }
    for (const log of logs) process.stdout.write(JSON.stringify(log) + '\n');
    process.exitCode = 1;
    return;
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(data, null, 2), 'utf-8');
  logs.push({ level: 'INFO', layout_id: null, element_role: null, message: `Wrote ${outPath}` });

  for (const log of logs) process.stdout.write(JSON.stringify(log) + '\n');
}

main().catch((err) => {
  process.stdout.write(JSON.stringify({ level: 'ERROR', layout_id: null, element_role: null, message: err.stack || String(err) }) + '\n');
  process.exitCode = 1;
});
