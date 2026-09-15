#!/usr/bin/env node
/**
 * theme.mjs — 生成済み PPTX の配色スキーム(`ppt/theme/theme1.xml`)を DS へ差し替える。
 *
 * pptxgenjs は Office 既定スキーム(accent1=#4472C4 ほか)を固定出力するため、
 * PowerPoint 上で利用者が **後から挿入する**図形やグラフの既定色が Office 青になる。
 * ここで accent1 を DS プライマリ青、accent2–6 を DS カテゴリ色、text2/bg2 を
 * DS グレーへ差し替えることで、後挿入のオブジェクトも DS 配色に乗る。
 *
 * 配色値は手維持のマップではなく、抽出時に正本の CSS 変数から解決した値を受け取る
 * (feature 011 / FR-010 — `tokens.mjs` の手写経マップは廃止)。
 */

/** Office のスロット -> DS の役割。抽出した解決値から埋める。 */
export function themeMapFrom(tokens) {
  const cat = tokens.cat || [];
  return {
    accent1: tokens.accent,
    accent2: cat[1] || tokens.accent,
    accent3: cat[2] || tokens.accent,
    accent4: cat[3] || tokens.accent,
    accent5: cat[4] || tokens.accent,
    accent6: cat[5] || tokens.accent,
    dk2: tokens.textPrimary,
    lt2: tokens.surface,
    hlink: tokens.accent,
    folHlink: tokens.accentStrong || tokens.accent,
  };
}

/** theme1.xml の配色スロットを置き換える。未知のスロットは触らない。 */
export function applyDsTheme(themeXml, map) {
  let xml = themeXml;
  for (const [slot, hex] of Object.entries(map)) {
    if (!hex) continue;
    const re = new RegExp(`(<a:${slot}>\\s*<a:srgbClr val=")[0-9A-Fa-f]{6}("\\s*/>)`, 'g');
    xml = xml.replace(re, `$1${hex.toUpperCase()}$2`);
    // dk2/lt2 は sysClr で書かれる場合がある
    const reSys = new RegExp(`(<a:${slot}>\\s*)<a:sysClr[^/]*/>(\\s*</a:${slot}>)`, 'g');
    xml = xml.replace(reSys, `$1<a:srgbClr val="${hex.toUpperCase()}"/>$2`);
  }
  return xml;
}
