#!/usr/bin/env node
/**
 * split-slides.mjs — index.html(正本のデック)から各レイアウトを抽出し、
 * slides/NN-id.html の単体ファイル(著者コピー用 / 単体ビジュアルテスト用)を生成する。
 * 単一情報源(index.html)から派生させることで重複ドリフトを避ける。
 *
 * 使い方:
 *   node scripts/split-slides.mjs            生成(slides/ を書き出す)
 *   node scripts/split-slides.mjs --check    検査のみ(書き込まず、index.html と slides/ の乖離を検出)
 *                                            乖離があれば該当ファイルを列挙して終了コード 1(FR-017)。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
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
<html lang="ja" data-annotations="off" data-org="（組織名）" data-copyright="© 2026 （組織名）" data-confidentiality="2">
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
  <link rel="stylesheet" href="../styles/frame.css" />
</head>
<body>
  <div class="deck">
`;
}
const foot = `  </div>
  <script src="../js/annotations.js"></script>
  <script src="../js/frame.js"></script>
</body>
</html>
`;

/** レイアウト単体ファイルの期待内容を組み立てる(生成・検査で共通利用)。 */
function renderStandalone(layout, sec) {
  return head(layout) + '    ' + sec.trim() + '\n' + foot;
}

/** index.html の各 slide セクションを {file, layout, content} に写像する。 */
function expectedFiles() {
  const out = [];
  for (const sec of sections) {
    const layout = (sec.match(/data-layout="([^"]+)"/) || [])[1];
    if (!layout || !ORDER[layout]) continue;
    out.push({
      file: resolve(root, 'slides', `${ORDER[layout]}-${layout}.html`),
      layout,
      content: renderStandalone(layout, sec),
    });
  }
  return out;
}

const CHECK = process.argv.includes('--check');
const files = expectedFiles();

if (CHECK) {
  const drifted = [];
  for (const { file, content } of files) {
    let actual = null;
    try { actual = readFileSync(file, 'utf8'); } catch { actual = null; }
    if (actual !== content) drifted.push(file);
  }
  if (drifted.length) {
    console.error(`[split-slides] FAIL — ${drifted.length} file(s) drifted from index.html:`);
    for (const f of drifted) console.error(`  ${relative(root, f)}  (run: node scripts/split-slides.mjs)`);
    process.exit(1);
  }
  console.log(`[split-slides] PASS — slides/ が index.html と一致(${files.length} file(s))。`);
} else {
  for (const { file, content } of files) writeFileSync(file, content, 'utf8');
  console.log(`[split-slides] generated ${files.length} standalone layout file(s) in slides/.`);
}
