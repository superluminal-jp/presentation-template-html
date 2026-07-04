#!/usr/bin/env node
/**
 * lint-tokens.mjs — SC-02 の門番。
 *
 * tokens/vendor/ 以外の CSS で「生のブランド値」を検出したら失敗させる:
 *   - 生の 16進カラー (#rgb / #rrggbb / #rrggbbaa)
 *   - 生の rgb()/rgba()/hsl() リテラル
 *   - 余白系プロパティでの生 px 値(スペーシングは --space-* を使う)
 *
 * 役割変数(styles/tokens.semantic.css)は vendor の var(--color-*) のみ参照する前提。
 * 例外: tokens/vendor/**、transparent/currentColor、0、CSS変数定義値内の許可リストなし。
 *
 * 使い方: npm run lint:tokens
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const SCAN_DIRS = ['styles'];
const IGNORE = [resolve(repoRoot, 'tokens', 'vendor')];

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const RGBHSL = /\b(?:rgba?|hsla?)\s*\(/;

// 余白系プロパティ(margin/padding/gap/inset)の「宣言単位」で生 px(≥3)を検出する。
// 宣言ごとに property: value を切り出して判定するため、@page size 等の隣接 px は誤検出しない。
// ボーダー幅などのヘアライン px は対象プロパティでないため自然に除外される。
function isSpacingProp(prop) {
  return (
    prop === 'margin' || prop.startsWith('margin-') ||
    prop === 'padding' || prop.startsWith('padding-') ||
    prop === 'gap' || prop === 'row-gap' || prop === 'column-gap' ||
    prop === 'inset' || prop.startsWith('inset-')
  );
}
function rawSpacingPx(code) {
  for (const m of code.matchAll(/([a-zA-Z-]+)\s*:\s*([^;{}]+)/g)) {
    const prop = m[1].toLowerCase();
    if (!isSpacingProp(prop)) continue;
    const pxs = [...m[2].matchAll(/(-?\d+)px/g)].map((x) => Math.abs(+x[1]));
    if (pxs.some((v) => v >= 3)) return m[2].match(/-?\d+px/)[0];
  }
  return null;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (IGNORE.some((ig) => p.startsWith(ig))) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (extname(p) === '.css') acc.push(p);
  }
  return acc;
}

const violations = [];
for (const base of SCAN_DIRS) {
  const dir = resolve(repoRoot, base);
  let files = [];
  try { files = walk(dir); } catch { continue; }
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const code = line.replace(/\/\*.*?\*\//g, '').split('/*')[0];
      if (!code.trim()) return;
      if (HEX.test(code)) violations.push([file, i + 1, 'raw hex color', code.trim()]);
      else if (RGBHSL.test(code)) violations.push([file, i + 1, 'raw rgb/hsl color', code.trim()]);
      if (rawSpacingPx(code)) violations.push([file, i + 1, 'raw px spacing (use --space-*)', code.trim()]);
    });
  }
}

if (violations.length) {
  console.error(`[lint:tokens] FAIL — ${violations.length} hardcoded value(s) outside tokens/vendor/:\n`);
  for (const [file, ln, kind, snippet] of violations) {
    console.error(`  ${relative(repoRoot, file)}:${ln}  [${kind}]  ${snippet}`);
  }
  process.exit(1);
}
console.log('[lint:tokens] PASS — no hardcoded brand values outside tokens/vendor/.');
