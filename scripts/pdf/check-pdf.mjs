#!/usr/bin/env node
// check-pdf.mjs — 生成 PDF の決定的な下地チェック。
//
// Claude Code の視覚評価（主観判断）を、決定的な指標で裏打ちする:
//   (1) dist/deck.pdf が存在し、非自明サイズ（>1KB）で生成されている
//   (2) PDF のページ数が index.html の .slide 実数と一致する（1スライド=1ページ）
//
// スライド枚数はハードコードせず、都度 index.html から数える。
// ページ計数は Chromium 出力 PDF の `/Type /Page`（/Pages は除外）出現数で行う。
//
// Usage: npm run check:pdf   （事前に npm run build:pdf が必要）

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, existsSync, statSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');

const pdfPath = resolve(root, 'dist', 'deck.pdf');
const indexPath = resolve(root, 'index.html');

/** PDF バイト列からページ数を数える（/Type /Page で /Pages を除外）。 */
export function countPdfPages(buf) {
  const text = buf.toString('latin1');
  const matches = text.match(/\/Type\s*\/Page(?![s])/g);
  return matches ? matches.length : 0;
}

/** index.html のスライド（<section class="slide ...">）実数を数える。 */
export function countSlides(html) {
  const matches = html.match(/<section class="slide[ "]/g);
  return matches ? matches.length : 0;
}

function fail(msg) {
  process.stderr.write(`[check:pdf] FAIL — ${msg}\n`);
  process.exit(1);
}

function main() {
  if (!existsSync(pdfPath)) {
    fail('dist/deck.pdf が見つかりません。先に `npm run build:pdf` を実行してください。');
  }
  const size = statSync(pdfPath).size;
  if (size <= 1024) {
    fail(`dist/deck.pdf のサイズが小さすぎます（${size} bytes ≤ 1024）。生成に失敗した可能性があります。`);
  }

  const pageCount = countPdfPages(readFileSync(pdfPath));
  const slideCount = countSlides(readFileSync(indexPath, 'utf8'));

  if (pageCount !== slideCount) {
    fail(`ページ数がスライド枚数と一致しません（PDF ${pageCount} ページ / スライド ${slideCount} 件）。`);
  }

  process.stdout.write(`[check:pdf] PASS — ${pageCount} ページ（スライド ${slideCount} 件）と一致。\n`);
}

main();
