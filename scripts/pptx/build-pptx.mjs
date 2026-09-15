#!/usr/bin/env node
/**
 * build-pptx.mjs — 正本デック(`index.html`)から編集可能な PPTX を生成する。
 *
 * このファイルはオーケストレータであり、スライドの内容も座標も持たない:
 *   extract.mjs  実レンダリングした DOM -> スライド IR
 *   emit.mjs     スライド IR -> pptxgenjs のネイティブ・オブジェクト
 *   group-xml.mjs / theme.mjs  生成後の OOXML 後処理(グループ包み / DS 配色)
 *
 * 正本にスライドやコンポーネントが増えても、ここは変更不要で追随する(FR-009)。
 *
 * 使い方: npm run build:pptx   -> dist/sample-deck.pptx (+ dist/deck-ir.json)
 * 契約:   specs/011-pptx-dom-extraction/contracts/build-pptx-cli.md
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';

import { extractDeck, REPO_ROOT } from './extract.mjs';
import { emitDeck, setCategoricalPalette } from './emit.mjs';
import { wrapGroupsInSlideXml } from './group-xml.mjs';
import { applyDsTheme, themeMapFrom } from './theme.mjs';

const OUT_DIR = resolve(REPO_ROOT, 'dist');
const OUT_FILE = resolve(OUT_DIR, 'sample-deck.pptx');
const IR_FILE = resolve(OUT_DIR, 'deck-ir.json');

/** 生成後の OOXML 後処理: 各スライドのグループ包み + テーマ配色の差し替え。 */
async function postProcess(filePath, tokens) {
  const zip = await JSZip.loadAsync(readFileSync(filePath));

  for (const path of Object.keys(zip.files)) {
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(path)) continue;
    const xml = await zip.file(path).async('string');
    zip.file(path, wrapGroupsInSlideXml(xml));
  }

  const themePath = 'ppt/theme/theme1.xml';
  const entry = zip.file(themePath);
  if (!entry) throw new Error(`${themePath} not found in ${filePath}`);
  zip.file(themePath, applyDsTheme(await entry.async('string'), themeMapFrom(tokens)));

  writeFileSync(filePath, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

export async function build() {
  mkdirSync(OUT_DIR, { recursive: true });

  const deck = await extractDeck();
  writeFileSync(IR_FILE, JSON.stringify(deck, null, 2));

  setCategoricalPalette(deck.tokens.cat);
  const pptx = new PptxGenJS();
  pptx.theme = { headFontFace: 'Noto Sans JP', bodyFontFace: 'Noto Sans JP' };
  const { groupNames } = emitDeck(pptx, deck);

  await pptx.writeFile({ fileName: OUT_FILE });
  await postProcess(OUT_FILE, deck.tokens);

  return { slides: deck.slides.length, groups: groupNames.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build()
    .then(({ slides, groups }) => {
      console.log(`Wrote ${OUT_FILE} — ${slides} slides, ${groups} groups`);
      console.log(`Wrote ${IR_FILE}`);
    })
    .catch((err) => { console.error(err); process.exit(1); });
}
