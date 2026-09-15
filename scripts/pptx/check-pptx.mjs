#!/usr/bin/env node
/**
 * check-pptx.mjs — 正本と生成 PPTX の乖離を検出する決定的チェック。
 *
 * これが `verify` の外にあったことが、従来 8 枚の未変換と文言の陳腐化を
 * 放置した構造的原因だった(feature 011 / FR-016)。PowerPoint の起動は不要で、
 * 生成物を jszip で開いて XML を読むだけで判定する。
 *
 * 検証項目(contracts/build-pptx-cli.md):
 *   C1 スライド数 == ライブ `.slide` 数
 *   C2 正本の各スライドの見出しテキストが、対応スライドに存在する
 *   C3 `data-chart` payload が整合制約を満たす
 *   C4 本文領域にラスタ画像が無い
 *
 * 使い方: npm run check:pptx
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { extractDeck, REPO_ROOT } from './extract.mjs';
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';

const PPTX = resolve(REPO_ROOT, 'dist', 'sample-deck.pptx');

/** 正本から「スライドごとの見出し」と「チャート payload」を読む。 */
async function readSource() {
  const browser = await chromium.launch({
    executablePath: process.env.PPTX_CHROMIUM_PATH || undefined,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(pathToFileURL(resolve(REPO_ROOT, 'index.html')).href, { waitUntil: 'networkidle' });
    return await page.evaluate(() => {
      const norm = (s) => (s || '').replace(/\s+/g, '').trim();
      const slides = [...document.querySelectorAll('.slide')].map((s) => {
        const h = s.querySelector('h1, h2.slide__heading, .section-title, .title, .quote');
        return { layout: s.getAttribute('data-layout'), heading: norm(h && h.textContent) };
      });
      const charts = [...document.querySelectorAll('[data-chart]')].map((el) => {
        let data = null, err = null;
        try { data = JSON.parse(el.getAttribute('data-chart')); }
        catch (e) { err = String(e.message || e); }
        return {
          label: el.getAttribute('aria-label') || '(no aria-label)',
          declaredSeries: el.getAttribute('data-series') ? Number(el.getAttribute('data-series')) : null,
          seriesLabels: [...el.querySelectorAll('text.series-label')].map((t) => norm(t.textContent)),
          data, err,
        };
      });
      return { slides, charts };
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  const fail = [];

  if (!existsSync(PPTX)) {
    console.error(`[check:pptx] FAIL — ${PPTX} がありません。先に \`npm run build:pptx\` を実行してください。`);
    process.exit(1);
  }

  const src = await readSource();
  const zip = await JSZip.loadAsync(readFileSync(PPTX));
  const slidePaths = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => Number(a.match(/(\d+)/)[1]) - Number(b.match(/(\d+)/)[1]));

  // C1: スライド数の一致
  if (slidePaths.length !== src.slides.length) {
    fail.push(`C1 スライド数の不一致: 正本 ${src.slides.length} 枚 / PPTX ${slidePaths.length} 枚` +
      `\n   -> \`npm run build:pptx\` を実行して PPTX を正本に追随させてください。`);
  }

  // C2: 見出しテキストの存在 + C4: ラスタ画像の不使用
  const n = Math.min(slidePaths.length, src.slides.length);
  for (let i = 0; i < n; i++) {
    const xml = await zip.file(slidePaths[i]).async('string');
    const text = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
      .map((m) => m[1]).join('').replace(/\s+/g, '');
    const want = src.slides[i].heading;
    if (want && !text.includes(want)) {
      fail.push(`C2 見出し不一致 (slide ${i + 1} / ${src.slides[i].layout}):` +
        `\n   期待: ${want.slice(0, 60)}\n   PPTX 側に見つかりません`);
    }
    if (/<a:blip\b/.test(xml)) {
      fail.push(`C4 本文領域にラスタ画像 (slide ${i + 1} / ${src.slides[i].layout})`);
    }
  }

  // C3: チャート payload の整合
  for (const c of src.charts) {
    if (c.err || !c.data) { fail.push(`C3 data-chart の JSON が不正: ${c.label} — ${c.err || 'null'}`); continue; }
    const d = c.data;
    const norm = (s) => (s || '').replace(/\s+/g, '');
    if (d.type === 'doughnut') {
      // 円系はラベルが系列ではなくカテゴリを指す
      if (c.declaredSeries !== null && d.categories.length !== c.declaredSeries) {
        fail.push(`C3 カテゴリ数 ${d.categories.length} != data-series ${c.declaredSeries}: ${c.label}`);
      }
      if (c.seriesLabels.length) {
        const a = [...d.categories.map(norm)].sort().join('|');
        const b = [...c.seriesLabels].sort().join('|');
        if (a !== b) fail.push(`C3 カテゴリ名が直接ラベルと不一致: ${c.label}\n   payload: ${a}\n   svg    : ${b}`);
      }
    } else {
      if (c.declaredSeries !== null && d.series.length !== c.declaredSeries) {
        fail.push(`C3 系列数 ${d.series.length} != data-series ${c.declaredSeries}: ${c.label}`);
      }
      if (c.seriesLabels.length) {
        const a = [...d.series.map((s) => norm(s.name))].sort().join('|');
        const b = [...c.seriesLabels].sort().join('|');
        if (a !== b) fail.push(`C3 系列名が直接ラベルと不一致: ${c.label}\n   payload: ${a}\n   svg    : ${b}`);
      }
      if (d.type !== 'scatter') {
        for (const s of d.series) {
          if (s.values.length !== d.categories.length) {
            fail.push(`C3 値数 ${s.values.length} != カテゴリ数 ${d.categories.length} (系列「${s.name}」): ${c.label}`);
          }
        }
      }
    }
  }

  if (fail.length) {
    console.error('[check:pptx] FAIL\n' + fail.map((f) => ' - ' + f).join('\n'));
    process.exit(1);
  }
  console.log(`[check:pptx] PASS — ${slidePaths.length} slides / ${src.charts.length} charts、` +
    '正本と一致(枚数・見出し・チャート整合・ラスタ画像なし)。');
}

main().catch((err) => { console.error(err); process.exit(1); });
