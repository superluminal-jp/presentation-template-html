#!/usr/bin/env node
/**
 * check-practice-coverage.mjs — SC-005 の検証。
 * テンプレート全体(index.html のショーケース)の data-practice の和集合が、
 * docs/practices.md のカタログ全 ID を包含する(未実演 0)ことを確認する。
 *
 * 使い方: npm run check:coverage
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const catalog = new Set([...read('docs/practices.md').matchAll(/`([A-E]-[a-z0-9-]+)`/g)].map((m) => m[1]));
const demonstrated = new Set([...read('index.html').matchAll(/data-practice="([^"]+)"/g)].map((m) => m[1]));

const unused = [...catalog].filter((id) => !demonstrated.has(id));
const unknown = [...demonstrated].filter((id) => !catalog.has(id));

console.log(`catalog: ${catalog.size} / demonstrated: ${demonstrated.size} / undemonstrated: ${unused.length}`);
if (unknown.length) {
  console.error(`[check:coverage] FAIL — カタログに無い data-practice: ${unknown.join(', ')}`);
  process.exit(1);
}
if (unused.length) {
  console.error(`[check:coverage] FAIL — 未実演の手法 ${unused.length} 件: ${unused.join(', ')}`);
  process.exit(1);
}
console.log('[check:coverage] PASS — practices.md の全手法が実演されている(未実演0)。');
