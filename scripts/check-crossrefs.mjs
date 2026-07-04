#!/usr/bin/env node
/**
 * check-crossrefs.mjs — SC-05 / FR-013 の相互参照検証。
 *  1) スライドの data-practice="ID" がすべて practices.md に存在(リンク切れ 0)
 *  2) 巻末 reference の .cid がすべて practices.md に存在
 *  3) デックで使用した data-practice を巻末 reference が網羅(FR-013)
 *
 * 使い方: npm run check:crossrefs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

// 1) practices.md の ID 集合(`X-...` バッククォート表記)
const practices = read('docs/practices.md');
const catalog = new Set([...practices.matchAll(/`([A-E]-[a-z0-9-]+)`/g)].map((m) => m[1]));

// 2) index.html から data-practice と 巻末 .cid を収集
const index = read('index.html');
const usedPractices = new Set([...index.matchAll(/data-practice="([^"]+)"/g)].map((m) => m[1]));
const refBlock = (index.match(/class="citation-list"[^]*?<\/ul>/) || [''])[0];
const refIds = new Set([...refBlock.matchAll(/class="cid">([A-E]-[a-z0-9-]+)</g)].map((m) => m[1]));

const errors = [];

// (1) data-practice ⊆ catalog
for (const id of usedPractices) if (!catalog.has(id)) errors.push(`data-practice "${id}" が practices.md に無い`);
// (2) reference .cid ⊆ catalog
for (const id of refIds) if (!catalog.has(id)) errors.push(`巻末 cid "${id}" が practices.md に無い`);
// (3) used ⊆ reference (FR-013)
for (const id of usedPractices) if (!refIds.has(id)) errors.push(`使用手法 "${id}" が巻末リファレンスに未掲載(FR-013)`);

console.log(`practices catalog: ${catalog.size} / used: ${usedPractices.size} / reference: ${refIds.size}`);
if (errors.length) {
  console.error(`[check:crossrefs] FAIL — ${errors.length} 件:`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('[check:crossrefs] PASS — 全参照が整合(リンク切れ 0 / 巻末網羅)。');
