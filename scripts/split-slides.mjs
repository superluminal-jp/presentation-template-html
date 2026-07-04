#!/usr/bin/env node
/**
 * split-slides.mjs — index.html(正本のデック)から各レイアウトを抽出し、
 * slides/NN-id.html の単体ファイル(著者コピー用 / 単体ビジュアルテスト用)を生成する。
 * 単一情報源(index.html)から派生させることで重複ドリフトを避ける。
 *
 * 使い方: node scripts/split-slides.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ORDER = {
  title: '01', toc: '02', section: '03', body: '04', compare: '05', chart: '06', summary: '07', reference: '08',
  'big-number': '09', dashboard: '10', timeline: '11', matrix: '12', process: '13', quote: '14', 'image-full': '15', closing: '16',
};
const TITLE = {
  title: '表紙', toc: '目次', section: '章扉', body: '本文',
  compare: '2カラム比較', chart: '図表', summary: 'まとめ', reference: '参考',
  'big-number': 'ビッグナンバー', dashboard: 'KPIダッシュボード', timeline: 'タイムライン', matrix: '2×2マトリクス',
  process: 'プロセス', quote: '引用・証言', 'image-full': '全面ビジュアル', closing: 'クロージング',
};

const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const sections = [...html.matchAll(/<section class="slide[^]*?<\/section>/g)].map((m) => m[0]);

function head(layout) {
  const cssLayout = `../styles/layouts/${layout}.css`;
  return `<!doctype html>
<html lang="ja" data-annotations="off">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${TITLE[layout]} — レイアウト単体</title>
  <link rel="stylesheet" href="../tokens/vendor/tokens.css" />
  <link rel="stylesheet" href="../styles/tokens.semantic.css" />
  <link rel="stylesheet" href="../styles/base.css" />
  <link rel="stylesheet" href="../styles/grid.css" />
  <link rel="stylesheet" href="../styles/slides.css" />
  <link rel="stylesheet" href="${cssLayout}" />
</head>
<body>
  <div class="deck">
`;
}
const foot = `  </div>
  <script src="../js/annotations.js"></script>
</body>
</html>
`;

let count = 0;
for (const sec of sections) {
  const layout = (sec.match(/data-layout="([^"]+)"/) || [])[1];
  if (!layout || !ORDER[layout]) continue;
  const file = resolve(root, 'slides', `${ORDER[layout]}-${layout}.html`);
  writeFileSync(file, head(layout) + '    ' + sec.trim() + '\n' + foot, 'utf8');
  count++;
}
console.log(`[split-slides] generated ${count} standalone layout file(s) in slides/.`);
