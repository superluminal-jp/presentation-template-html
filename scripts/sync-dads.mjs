#!/usr/bin/env node
/**
 * sync-dads.mjs — デジタル庁デザインシステム(DADS)公式サンプルコンポーネントを
 * 固定コミット SHA から vendor 層へ複製する(feature 006 の窓口)。
 *
 * 取得元 digital-go-jp/design-system-example-components-html は npm パッケージでは
 * なく、リリースタグも無い Storybook 参照実装。よってコミット SHA を固定し、
 * 対象コンポーネントの CSS/HTML のみを GitHub raw から取得して
 * vendor/dads-components/<name>/ へ無改変コピーする。各ファイル先頭には出典・URL・
 * SHA・取得日・トークン対応版を記録する(MIT 準拠)。tokens/vendor/tokens.css と同じ
 * 「固定・vendored・不可侵」方針。sync-tokens.mjs / split-slides.mjs を範とする。
 *
 * 使い方:
 *   node scripts/sync-dads.mjs            取得(vendor/ を書き出す)
 *   node scripts/sync-dads.mjs --check    検査のみ(書き込まず、vendor と upstream の乖離を検出)
 *                                          乖離があれば該当ファイルを列挙し終了コード 1。
 *
 * 更新手順: 下記 SHA を新しいコミットに更新し `npm run sync:dads` を再実行する。
 * vendor 配下は手編集せず、本スクリプトの実行結果のみを正とする。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// ── 固定パラメータ ─────────────────────────────────────────────
const REPO = 'digital-go-jp/design-system-example-components-html';
const SHA = '3b34f4c3553fa3bee90bfd8b6fe962ac3055107d';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${SHA}/src/components`;
const BLOB_BASE = `https://github.com/${REPO}/blob/${SHA}/src/components`;
const TOKEN_VERSION = '@digital-go-jp/design-tokens@2.0.1';
const DEST_ROOT = resolve(repoRoot, 'vendor/dads-components');

// ── 取得対象マニフェスト(静的表示に必要な CSS/HTML のみ。JS/TS/MDX は除外) ──
// 末尾 link / form-control-label は他コンポーネントが参照する依存 CSS(それ自体は
// ギャラリー掲載しない): list が .dads-link を、checkbox/radio の stacked が
// .dads-form-control-label を必要とするため無改変で同梱する。
const MANIFEST = {
  card: ['example-1.html', 'example-2.html', 'card-example-1.css', 'card-example-2.css'],
  list: ['list.css', 'all-lists.html'],
  checkbox: ['checkbox.css', 'standalone.html', 'stacked.html'],
  'progress-indicator': ['progress-indicator.css', 'static.html'],
  breadcrumb: ['breadcrumb.css', 'plain.html', 'with-home-icon.html', 'with-visible-label.html'],
  radio: ['radio.css', 'standalone.html', 'stacked.html'],
  link: ['link.css'],
  'form-control-label': ['form-control-label.css'],
};

const HEADER_MARK = '出典：デジタル庁デザインシステム';

/** ファイル種別ごとの provenance ヘッダを組み立てる(MIT 準拠の出典表示)。 */
function banner(name, file, ext) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    `${HEADER_MARK} (Digital Agency Design System)`,
    `Source: ${BLOB_BASE}/${name}/${file}`,
    `Commit: ${SHA}`,
    `Retrieved: ${date}`,
    `Tokens: ${TOKEN_VERSION}`,
    'License: MIT — vendored unmodified via `npm run sync:dads`. DO NOT hand-edit.',
  ];
  if (ext === 'html') {
    return `<!--\n  ${lines.join('\n  ')}\n-->\n`;
  }
  return `/*\n  ${lines.join('\n  ')}\n*/\n`;
}

/** 既存 vendored ファイルから provenance ヘッダを取り除き、本文のみを返す。 */
function stripBanner(text, ext) {
  if (ext === 'html') {
    return text.replace(/^<!--[\s\S]*?-->\n?/, '');
  }
  return text.replace(/^\/\*[\s\S]*?\*\/\n?/, '');
}

function extOf(file) {
  return file.endsWith('.html') ? 'html' : 'css';
}

function destPath(name, file) {
  return resolve(DEST_ROOT, name, file);
}

/** upstream から本文を取得(非 200 は例外)。 */
async function fetchUpstream(name, file) {
  const url = `${RAW_BASE}/${name}/${file}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch failed ${res.status} ${res.statusText}: ${url}`);
  }
  return await res.text();
}

async function runWrite() {
  let count = 0;
  for (const [name, files] of Object.entries(MANIFEST)) {
    mkdirSync(resolve(DEST_ROOT, name), { recursive: true });
    for (const file of files) {
      const ext = extOf(file);
      const body = await fetchUpstream(name, file);
      const out = banner(name, file, ext) + body;
      writeFileSync(destPath(name, file), out, 'utf8');
      console.log(`[sync-dads] wrote vendor/dads-components/${name}/${file}`);
      count += 1;
    }
  }
  console.log(`[sync-dads] done: ${count} files from ${REPO}@${SHA.slice(0, 10)}`);
}

async function runCheck() {
  const problems = [];
  for (const [name, files] of Object.entries(MANIFEST)) {
    for (const file of files) {
      const ext = extOf(file);
      const rel = `vendor/dads-components/${name}/${file}`;
      const dest = destPath(name, file);
      if (!existsSync(dest)) {
        problems.push(`${rel}: missing (run \`npm run sync:dads\`)`);
        continue;
      }
      const upstream = await fetchUpstream(name, file);
      const localBody = stripBanner(readFileSync(dest, 'utf8'), ext);
      if (localBody !== upstream) {
        problems.push(`${rel}: drift from ${SHA.slice(0, 10)}`);
      }
    }
  }
  if (problems.length > 0) {
    console.error('[sync-dads] DRIFT detected — vendored files do not match pinned upstream:');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('Run `npm run sync:dads` to re-vendor, or restore the pinned copies.');
    process.exit(1);
  }
  console.log(`[sync-dads] OK: vendored files match ${REPO}@${SHA.slice(0, 10)}`);
}

async function main() {
  const check = process.argv.includes('--check');
  try {
    if (check) await runCheck();
    else await runWrite();
  } catch (err) {
    console.error(`[sync-dads] ${err.message}`);
    process.exit(1);
  }
}

main();
