#!/usr/bin/env node
/**
 * sync-tokens.mjs — 固定版 DS デザイントークンを vendor 層へ複製する(SC-07 の窓口)。
 *
 * `@digital-go-jp/design-tokens`(package.json で版固定)の dist/tokens.css を
 * tokens/vendor/tokens.css へ無改変コピーする。tokens/vendor/ は不可侵層であり、
 * 手編集せず本スクリプトの実行結果のみを正とする。
 *
 * 使い方: npm run sync-tokens
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const PKG = '@digital-go-jp/design-tokens';
const SRC_REL = 'dist/tokens.css';
const DEST = resolve(repoRoot, 'tokens/vendor/tokens.css');

function resolvePkgVersion() {
  try {
    const pj = require(`${PKG}/package.json`);
    return pj.version;
  } catch {
    return 'unknown';
  }
}

function main() {
  let srcPath;
  try {
    // node_modules から dist/tokens.css を解決
    srcPath = require.resolve(`${PKG}/${SRC_REL}`);
  } catch (e) {
    console.error(`[sync-tokens] ${PKG} が見つかりません。先に \`npm install\` を実行してください。`);
    process.exit(1);
  }
  const version = resolvePkgVersion();
  const banner =
    `/**\n * Do not edit directly, this file was auto-generated.\n` +
    ` * Source: ${PKG}@${version} (${SRC_REL})\n` +
    ` * Vendored copy — regenerate via \`npm run sync-tokens\`. DO NOT hand-edit.\n */\n\n`;
  const css = readFileSync(srcPath, 'utf8').replace(/^\/\*\*[\s\S]*?\*\/\s*/, '');
  mkdirSync(dirname(DEST), { recursive: true });
  writeFileSync(DEST, banner + css, 'utf8');
  console.log(`[sync-tokens] wrote tokens/vendor/tokens.css from ${PKG}@${version}`);
}

main();
