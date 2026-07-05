#!/usr/bin/env node
/**
 * contrast-tokens.mjs — 役割色の組み合わせが WCAG 2.2 AA を満たすことを検証(research R6 / SC-04)。
 * vendor トークンの実効 hex を用いて相対輝度・コントラスト比を計算する。純関数のため node 単体で実行可能。
 *
 * 使い方: node tests/a11y/contrast-tokens.mjs
 */

// vendor(v2.0.1)からの実効値
const HEX = {
  'neutral-white': '#ffffff',
  'solid-gray-800': '#333333',   // --text-primary
  'solid-gray-600': '#666666',   // --text-secondary
  'key-800': '#0031d8',          // --accent
  // 状態色コールアウト/バッジ: 淡面 + 濃文字(feature 003)
  'green-50': '#e6f5ec', 'green-900': '#115a36',
  'orange-50': '#ffeee2', 'orange-900': '#ac3e00',
  'red-50': '#fdeeee', 'red-900': '#ce0000',
};

function luminance(hex) {
  const c = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function ratio(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// [name, fg, bg, minRatio(本文4.5 / 大見出し3.0)]
const CASES = [
  ['text-primary on slide-bg', HEX['solid-gray-800'], HEX['neutral-white'], 4.5],
  ['text-secondary on slide-bg', HEX['solid-gray-600'], HEX['neutral-white'], 4.5],
  ['accent on slide-bg (large/graphic)', HEX['key-800'], HEX['neutral-white'], 3.0],
  ['text-on-accent (white on accent)', HEX['neutral-white'], HEX['key-800'], 4.5],
  ['success text on success pale', HEX['green-900'], HEX['green-50'], 4.5],
  ['warning text on warning pale', HEX['orange-900'], HEX['orange-50'], 4.5],
  ['error text on error pale', HEX['red-900'], HEX['red-50'], 4.5],
];

let failed = 0;
console.log('WCAG 2.2 AA contrast (role tokens):');
for (const [name, fg, bg, min] of CASES) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  (min ${min})  ${name}`);
}
if (failed) { console.error(`\n[contrast] FAIL — ${failed} role pair(s) below AA.`); process.exit(1); }
console.log('\n[contrast] PASS — all role pairs meet AA.');
