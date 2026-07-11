#!/usr/bin/env node
// PPTX reproduction of the showcase deck (`index.html`).
//
// Reproduces the 16 core layouts using only features that translate cleanly to
// native PowerPoint objects: background fills, text boxes, and simple shapes
// (rectangles / lines / ellipses). Content mirrors `index.html`; exact geometry
// is intentionally approximate — overall design parity, not pixel parity.
//
// Out of scope (deferred): appendices A–E, which showcase multi-series charts,
// data tables, and component chrome beyond text-box + background primitives.
//
// Usage: npm run build:pptx

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import PptxGenJS from 'pptxgenjs';
import { COLOR, FONT, SIZE } from './tokens.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../../dist');
const OUT_FILE = resolve(OUT_DIR, 'sample-deck.pptx');

// 16:9 canvas matching the HTML deck (1280x720 px @ 96 px/in).
const W = 13.333;
const H = 7.5;
// Safe area (grid.css): --safe-x space-8 48px, --safe-y space-6 32px.
const MX = 0.5; // 48px
const MY = 0.3333; // 32px
const M = MX; // alias kept for the not-yet-reworked layouts (06-16)
const CW = W - MX * 2; // stage width = 1184px = 12.333"
const STAGE_H = H - MY * 2; // 656px = 6.833"
const GUTTER = 0.25; // --grid-gutter space-5 24px
const COL_W = (CW - GUTTER * 11) / 12; // 12-col grid, ~0.799"
const FOOT_Y = 6.7; // above safe-y bottom

// 12-col grid helpers (1-based start column, matching CSS grid-column values).
const gx = (startCol) => MX + (startCol - 1) * (COL_W + GUTTER);
const gw = (spanCols) => spanCols * COL_W + (spanCols - 1) * GUTTER;

/** Heading with mixed accent runs + neutral underline (Von Restorff: keep accent
 *  reserved for a single focus — the rule below the heading is neutral gray,
 *  per `.slide__heading::after` using --border-strong). */
function heading(s, pptx, runs, y = MY) {
  s.addText(
    runs.map((r) => ({ text: r.text, options: r.accent ? { color: COLOR.accent } : {} })),
    {
      x: MX, y, w: CW, h: 0.75, fontFace: FONT.sans, fontSize: SIZE.heading,
      bold: true, color: COLOR.textPrimary, align: 'left', valign: 'top',
    },
  );
  s.addShape(pptx.ShapeType.rect, {
    x: MX, y: y + 0.72, w: 0.667, h: 0.042, fill: { color: COLOR.borderStrong }, line: { type: 'none' },
  });
}

/** Footer: top border + citation caption (matches `.slide__footer`). */
function footer(s, pptx, text) {
  s.addShape(pptx.ShapeType.line, {
    x: MX, y: FOOT_Y, w: CW, h: 0, line: { color: COLOR.border, width: 1 },
  });
  s.addText(text, {
    x: MX, y: FOOT_Y + 0.06, w: CW, h: 0.35, fontFace: FONT.sans, fontSize: SIZE.caption,
    color: COLOR.textSecondary, align: 'left', valign: 'top',
  });
}

// Shared slide chrome (placeholders): confidentiality/distribution banner
// (top-right), copyright (bottom-left), page number (bottom-right). Stamped on
// every slide; text switches to on-accent white over accent-filled backgrounds.
const CHROME_SIZE = 8; // pt — smaller than caption; unobtrusive document chrome
function chrome(s, pptx, page, total, onAccent) {
  const fg = onAccent ? COLOR.textOnAccent : COLOR.textSecondary;
  s.addText('［公開範囲・機密区分を記入］', {
    x: gx(6), y: 0.1, w: gw(7), h: 0.26, fontFace: FONT.sans, fontSize: CHROME_SIZE,
    color: fg, align: 'right', valign: 'top',
  });
  s.addText('© 2026 ［組織名を記入］', {
    x: MX, y: 7.16, w: CW / 2, h: 0.26, fontFace: FONT.sans, fontSize: CHROME_SIZE,
    color: fg, align: 'left', valign: 'top',
  });
  s.addText(`${page} / ${total}`, {
    x: MX + CW / 2, y: 7.16, w: CW / 2, h: 0.26, fontFace: FONT.sans, fontSize: CHROME_SIZE,
    color: fg, align: 'right', valign: 'top',
  });
}

/** Build the deck and return the PptxGenJS instance (for testing). */
export function buildDeck() {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'DS_16x9', width: W, height: H });
  pptx.layout = 'DS_16x9';
  pptx.theme = { headFontFace: FONT.sans, bodyFontFace: FONT.sans };

  // Deck order; `accent` flags accent-filled backgrounds (chrome goes white).
  const builders = [
    { fn: slideTitle, accent: true },
    { fn: slideToc, accent: false },
    { fn: slideSection, accent: false },
    { fn: slideBody, accent: false },
    { fn: slideCompare, accent: false },
    { fn: slideChart, accent: false },
    { fn: slideSummary, accent: false },
    { fn: slideBigNumber, accent: false },
    { fn: slideDashboard, accent: false },
    { fn: slideTimeline, accent: false },
    { fn: slideMatrix, accent: false },
    { fn: slideProcess, accent: false },
    { fn: slideQuote, accent: false },
    { fn: slideImageFull, accent: false },
    { fn: slideClosing, accent: true },
    { fn: slideReference, accent: false },
  ];

  // Capture each created slide (without threading a handle through every
  // builder) so shared chrome gets sequential page numbers.
  const created = [];
  const addSlide = pptx.addSlide.bind(pptx);
  pptx.addSlide = (...args) => {
    const s = addSlide(...args);
    created.push(s);
    return s;
  };
  builders.forEach(({ fn }) => fn(pptx));
  pptx.addSlide = addSlide; // restore original

  created.forEach((s, i) => chrome(s, pptx, i + 1, created.length, builders[i].accent));

  return pptx;
}

// 01 — Title (accent-filled cover; title top-aligned per HTML, meta on a rule)
function slideTitle(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.accent };
  // title block sits at the top of the stage (matches HTML: grid row 1, top-aligned)
  s.addText('各レイアウトが\n自らの使い方を示すテンプレート', {
    x: gx(1), y: MY, w: gw(10), h: 1.75, fontFace: FONT.sans, fontSize: SIZE.display,
    bold: true, color: COLOR.textOnAccent, align: 'left', valign: 'top', lineSpacingMultiple: 1.2,
  });
  s.addText('デジタル庁DS準拠・このデック自体が使い方の見本です', {
    x: gx(1), y: 2.15, w: gw(9), h: 0.5, fontFace: FONT.sans, fontSize: SIZE.h2,
    color: COLOR.textOnAccent, align: 'left', valign: 'top',
  });
  // meta row pinned near the bottom, above a top rule (matches HTML meta at ~6.8in)
  const metaY = 6.7;
  s.addShape(pptx.ShapeType.line, { x: gx(1), y: metaY, w: CW, h: 0, line: { color: COLOR.textOnAccent, width: 1 } });
  s.addText('16レイアウト        12コンポーネント        DS v2.0.1 準拠', {
    x: gx(1), y: metaY + 0.1, w: CW, h: 0.35, fontFace: FONT.sans, fontSize: SIZE.caption,
    color: COLOR.textOnAccent, align: 'left', valign: 'top',
  });
}

// 02 — TOC (agenda list with per-row rule; current item in accent)
function slideToc(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: 'この' }, { text: 'デック自体', accent: true }, { text: 'が使い方の見本です' }]);
  const items = [
    ['01', 'レイアウトの選び方'],
    ['02', '主張と根拠の書き方'],
    ['03', 'データの見せ方'],
    ['04', '手順とスケジュール'],
    ['05', '出典と設計意図'],
  ];
  const listX = gx(1);
  const listW = gw(8);
  const rowH = 0.85;
  const top = 1.7;
  items.forEach(([n, label], i) => {
    const y = top + i * rowH;
    const current = i === 0;
    const color = current ? COLOR.accent : COLOR.textPrimary;
    s.addText(n, {
      x: listX, y, w: 0.75, h: rowH - 0.12, fontFace: FONT.sans, fontSize: SIZE.h3, bold: true,
      color: COLOR.accent, align: 'left', valign: 'middle',
    });
    s.addText(label, {
      x: listX + 0.95, y, w: listW - 0.95, h: rowH - 0.12, fontFace: FONT.sans, fontSize: SIZE.h3,
      bold: current, color, align: 'left', valign: 'middle',
    });
    s.addShape(pptx.ShapeType.line, { x: listX, y: y + rowH - 0.12, w: listW, h: 0, line: { color: COLOR.border, width: 1 } });
  });
}

// 03 — Section (gray surface, accent chapter no., accent-barred lead; centered)
function slideSection(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.surface };
  s.addText('SECTION 01', {
    x: gx(1), y: 2.15, w: gw(12), h: 0.5, fontFace: FONT.sans, fontSize: SIZE.h2, bold: true,
    color: COLOR.accent, align: 'left', charSpacing: 2,
  });
  s.addText('章扉レイアウト', {
    x: gx(1), y: 2.7, w: gw(10), h: 1.1, fontFace: FONT.sans, fontSize: SIZE.display, bold: true,
    color: COLOR.textPrimary, align: 'left', lineSpacingMultiple: 1.2,
  });
  // section-lead: left accent border (space-1 4px) + padding-left (space-4 16px)
  const leadY = 4.25;
  s.addShape(pptx.ShapeType.rect, { x: gx(1), y: leadY, w: 0.042, h: 0.7, fill: { color: COLOR.accent }, line: { type: 'none' } });
  s.addText('章の変わり目で緩急をつけ、次章の主張を1文で予告する。', {
    x: gx(1) + 0.21, y: leadY, w: gw(9), h: 0.7, fontFace: FONT.sans, fontSize: SIZE.h2, bold: true,
    color: COLOR.textPrimary, align: 'left', valign: 'middle',
  });
}

// 04 — Body (assertion heading + evidence bullets left, visual box right)
function slideBody(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: '本文は' }, { text: '見出しに主張・本文に根拠', accent: true }, { text: 'を置きます' }]);
  const bodyTop = 1.7;
  const bodyBottom = FOOT_Y - 0.2;
  s.addText(
    [
      { text: '見出しは結論（アクションタイトル）を1文で', options: { bullet: { indent: 18 }, breakLine: true } },
      { text: '本文は根拠を7項目以内の箇条書きで', options: { bullet: { indent: 18 }, breakLine: true } },
      { text: '右の枠に図版やコンポーネントを差し込む', options: { bullet: { indent: 18 }, breakLine: true } },
    ],
    {
      x: gx(1), y: bodyTop, w: gw(7), h: bodyBottom - bodyTop, fontFace: FONT.sans, fontSize: SIZE.h3,
      color: COLOR.textPrimary, align: 'left', valign: 'top', lineSpacingMultiple: 1.6, paraSpaceAfter: 8,
    },
  );
  // visual box (surface, bordered) containing a callout
  const vx = gx(8);
  const vw = gw(5);
  s.addShape(pptx.ShapeType.roundRect, {
    x: vx, y: bodyTop, w: vw, h: bodyBottom - bodyTop, rectRadius: 0.08,
    fill: { color: COLOR.surface }, line: { color: COLOR.border, width: 1 },
  });
  const inX = vx + 0.3;
  const inW = vw - 0.6;
  const inY = bodyTop + (bodyBottom - bodyTop) / 2 - 0.75;
  s.addShape(pptx.ShapeType.rect, { x: inX, y: inY, w: inW, h: 1.5, fill: { color: COLOR.accentWeak }, line: { type: 'none' } });
  s.addShape(pptx.ShapeType.rect, { x: inX, y: inY, w: 0.06, h: 1.5, fill: { color: COLOR.accent }, line: { type: 'none' } });
  s.addText(
    [
      { text: 'コンポーネント差し込み例\n', options: { bold: true } },
      { text: '.callout をスライド内にそのまま配置（グリッド非依存）。', options: {} },
    ],
    {
      x: inX + 0.25, y: inY + 0.12, w: inW - 0.4, h: 1.26, fontFace: FONT.sans, fontSize: SIZE.caption,
      color: COLOR.textPrimary, align: 'left', valign: 'top', lineSpacingMultiple: 1.4,
    },
  );
  footer(s, pptx, '使い方: Assertion–Evidence 構造');
}

// 05 — Compare (conclusion-first verdict bar, then symmetric 2 columns)
function slideCompare(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: '比較は' }, { text: '2案を同一基準', accent: true }, { text: 'で並べます' }]);
  // verdict (conclusion) bar placed ABOVE the evidence columns
  const vy = 1.55;
  s.addShape(pptx.ShapeType.roundRect, {
    x: gx(1), y: vy, w: CW, h: 0.7, rectRadius: 0.06,
    fill: { color: COLOR.accentWeak }, line: { type: 'none' },
  });
  s.addShape(pptx.ShapeType.rect, { x: gx(1), y: vy, w: 0.042, h: 0.7, fill: { color: COLOR.accent }, line: { type: 'none' } });
  s.addText('→ 結論（推奨案）を先頭に置き、根拠を下に並べる', {
    x: gx(1) + 0.25, y: vy, w: CW - 0.5, h: 0.7, fontFace: FONT.sans, fontSize: SIZE.h3, bold: true,
    color: COLOR.accent, align: 'left', valign: 'middle',
  });
  // 2 evidence columns
  const colGap = 0.3333; // space-6 32px
  const colW = (CW - colGap) / 2;
  const colY = 2.55;
  const colH = FOOT_Y - 0.2 - colY;
  const cols = [
    { title: '案A: 中立に記述', items: ['見出しに案名を置く', '箇条書きで特徴を対比', '誇張しない'], accent: false },
    { title: '案B: 推奨を強調', items: ['accent 枠で推奨を明示', 'デフォルト効果を活用', '3項目以内に絞る'], accent: true },
  ];
  cols.forEach((c, i) => {
    const x = gx(1) + i * (colW + colGap);
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: colY, w: colW, h: colH, rectRadius: 0.06,
      fill: { color: COLOR.surface },
      line: { color: c.accent ? COLOR.accent : COLOR.border, width: c.accent ? 2 : 1 },
    });
    if (c.accent) {
      s.addShape(pptx.ShapeType.rect, { x, y: colY, w: colW, h: 0.05, fill: { color: COLOR.accent }, line: { type: 'none' } });
    }
    s.addText(c.title, {
      x: x + 0.3, y: colY + 0.25, w: colW - 0.6, h: 0.55, fontFace: FONT.sans, fontSize: SIZE.h2,
      bold: true, color: c.accent ? COLOR.accent : COLOR.textPrimary, align: 'left',
    });
    s.addText(
      c.items.map((t) => ({ text: t, options: { bullet: { indent: 16 }, breakLine: true } })),
      {
        x: x + 0.3, y: colY + 0.95, w: colW - 0.6, h: colH - 1.15, fontFace: FONT.sans, fontSize: SIZE.body,
        color: COLOR.textPrimary, align: 'left', valign: 'top', lineSpacingMultiple: 1.4, paraSpaceAfter: 6,
      },
    );
  });
  footer(s, pptx, '使い方: フレーミング / C.R.A.P.');
}

// Shared content band (below heading, above footer).
const BODY_TOP = 1.55;
const BODY_BOTTOM = FOOT_Y - 0.2;

// 06 — Chart (graph replaced with a dashed placeholder frame + takeaway)
function slideChart(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: '図表は' }, { text: '基準値を先に', accent: true }, { text: '示して解釈を助けます' }]);
  // placeholder frame (`.chart--placeholder`: 2px dashed border-strong)
  const px = gx(1);
  const pw = gw(8);
  s.addShape(pptx.ShapeType.roundRect, {
    x: px, y: BODY_TOP, w: pw, h: BODY_BOTTOM - BODY_TOP, rectRadius: 0.08,
    fill: { color: COLOR.slideBg }, line: { color: COLOR.borderStrong, width: 2, dashType: 'dash' },
  });
  s.addText('［図表／画像を差し込む（作成者の実データ図を受ける枠）］', {
    x: px + 0.3, y: BODY_TOP, w: pw - 0.6, h: BODY_BOTTOM - BODY_TOP, fontFace: FONT.sans,
    fontSize: SIZE.caption, color: COLOR.textSecondary, align: 'center', valign: 'middle',
  });
  // takeaway (cols 9/-1), vertically centered
  const tx = gx(9);
  const tw = gw(4);
  s.addText('例: 75%減', {
    x: tx, y: 3.1, w: tw, h: 0.8, fontFace: FONT.sans, fontSize: SIZE.h2, bold: true,
    color: COLOR.accent, align: 'left',
  });
  s.addText('基準値を左に置き、差分の意味を1文で添える。', {
    x: tx, y: 3.9, w: tw, h: 1.4, fontFace: FONT.sans, fontSize: SIZE.body,
    color: COLOR.textSecondary, align: 'left', lineSpacingMultiple: 1.5,
  });
  footer(s, pptx, '使い方: Cleveland–McGill / データインク');
}

// 07 — Summary (3 key cards with accent top border + accent CTA bar)
function slideSummary(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: 'まとめは' }, { text: '3点', accent: true }, { text: 'に凝縮します' }]);
  const keys = ['レイアウトを選ぶ', '役割変数に差し込む', '印刷/PDFで出力する'];
  const gap = 0.3333; // space-6
  const tw = (CW - gap * 2) / 3;
  const cardY = BODY_TOP;
  const cardH = 2.9;
  keys.forEach((t, i) => {
    const x = gx(1) + i * (tw + gap);
    s.addShape(pptx.ShapeType.roundRect, { x, y: cardY, w: tw, h: cardH, rectRadius: 0.06, fill: { color: COLOR.surface }, line: { type: 'none' } });
    s.addShape(pptx.ShapeType.rect, { x, y: cardY, w: tw, h: 0.05, fill: { color: COLOR.accent }, line: { type: 'none' } }); // border-top accent
    s.addText(String(i + 1), {
      x: x + 0.3, y: cardY + 0.3, w: tw - 0.6, h: 0.9, fontFace: FONT.sans, fontSize: SIZE.heading, bold: true,
      color: COLOR.accent, align: 'left',
    });
    s.addText(t, {
      x: x + 0.3, y: cardY + 1.3, w: tw - 0.6, h: 1.3, fontFace: FONT.sans, fontSize: SIZE.body,
      color: COLOR.textPrimary, align: 'left', valign: 'top',
    });
  });
  // CTA bar (accent fill, on-accent text)
  const ctaY = cardY + cardH + 0.35;
  s.addShape(pptx.ShapeType.roundRect, { x: gx(1), y: ctaY, w: CW, h: 0.75, rectRadius: 0.06, fill: { color: COLOR.accent }, line: { type: 'none' } });
  s.addText('使い方: この3手順でスライドを作り始めてください', {
    x: gx(1) + 0.3, y: ctaY, w: CW - 0.6, h: 0.75, fontFace: FONT.sans, fontSize: SIZE.h3, bold: true,
    color: COLOR.textOnAccent, align: 'left', valign: 'middle',
  });
}

// 08 — Big number (single hero metric + anchor)
function slideBigNumber(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: 'ビッグナンバーは' }, { text: '単一指標', accent: true }, { text: 'を大きく1点強調します' }]);
  s.addText(
    [
      { text: '16', options: { fontSize: SIZE.display, bold: true, color: COLOR.accent } },
      { text: ' レイアウト', options: { fontSize: SIZE.heading, color: COLOR.textPrimary } },
    ],
    { x: gx(1), y: 2.5, w: CW, h: 1.6, fontFace: FONT.sans, align: 'left', valign: 'middle' },
  );
  s.addText(
    [
      { text: '内訳: コア ', options: {} }, { text: '8', options: { bold: true, color: COLOR.textPrimary } },
      { text: ' + 拡張 ', options: { color: COLOR.textSecondary } }, { text: '8', options: { bold: true, color: COLOR.textPrimary } },
      { text: ' = ', options: { color: COLOR.textSecondary } }, { text: '16', options: { bold: true, color: COLOR.textPrimary } },
      { text: '（用途で選ぶ）', options: { color: COLOR.textSecondary } },
    ],
    { x: gx(1), y: 5.0, w: CW, h: 0.6, fontFace: FONT.sans, fontSize: SIZE.h3, color: COLOR.textSecondary, align: 'left' },
  );
  footer(s, pptx, '使い方: 強調は1箇所 / アンカリング');
}

// 09 — Dashboard (KPI grid, 3 cols x 2 rows, one highlight)
function slideDashboard(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: 'ダッシュボードは' }, { text: '6件以内', accent: true }, { text: 'のKPIを整列します' }]);
  const tiles = [
    ['レイアウト', '16', 'コア8+拡張8', false],
    ['コンポーネント', '12', '再利用可', true],
    ['採用手法', '37', '出典付き', false],
    ['付録スライド', '5', '実例', false],
    ['DS準拠', '100%', 'トークン参照', false],
    ['ハードコード', '0', 'lint検証', false],
  ];
  const cols = 3;
  const gap = 0.1667; // space-4
  const tw = (CW - gap * (cols - 1)) / cols;
  const th = (BODY_BOTTOM - BODY_TOP - gap) / 2;
  tiles.forEach(([label, value, sub, hi], i) => {
    const x = gx(1) + (i % cols) * (tw + gap);
    const y = BODY_TOP + Math.floor(i / cols) * (th + gap);
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: tw, h: th, rectRadius: 0.06,
      fill: { color: hi ? COLOR.accent : COLOR.surface },
      line: hi ? { type: 'none' } : { color: COLOR.border, width: 1 },
    });
    const fg = hi ? COLOR.textOnAccent : COLOR.textPrimary;
    const sub2 = hi ? COLOR.accentWeak : COLOR.textSecondary;
    s.addText(label, { x: x + 0.28, y: y + 0.24, w: tw - 0.56, h: 0.4, fontFace: FONT.sans, fontSize: SIZE.caption, color: sub2, align: 'left' });
    s.addText(value, { x: x + 0.28, y: y + 0.62, w: tw - 0.56, h: 0.9, fontFace: FONT.sans, fontSize: 40, bold: true, color: fg, align: 'left' });
    s.addText(sub, { x: x + 0.28, y: th > 1.9 ? y + th - 0.5 : y + 1.5, w: tw - 0.56, h: 0.35, fontFace: FONT.sans, fontSize: SIZE.caption, color: sub2, align: 'left' });
  });
  footer(s, pptx, '使い方: 注目1件を強調・6件以内に抑える');
}

// 10 — Timeline (time axis: directional rail, period labels, progress states)
function slideTimeline(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: 'タイムラインは' }, { text: '時系列で全体像', accent: true }, { text: 'を示します' }]);
  // [num, time, label, body, state]
  const steps = [
    ['1', '0週', '選ぶ', 'レイアウトを複製', 'done'],
    ['2', '1週', '書く', '主張と根拠を入力', 'current'],
    ['3', '2週', '整える', 'トークン内で調整', 'upcoming'],
    ['4', '4週', '配る', '印刷・PDFで共有', 'upcoming'],
  ];
  const n = steps.length;
  const railY = 3.05;
  const stepW = CW / n;
  const md = 0.44; // marker diameter
  const railStart = gx(1) + md / 2;
  const railEnd = gx(1) + CW - 0.35; // leave room for the arrowhead
  // directional rail + arrowhead (arrow of time →)
  s.addShape(pptx.ShapeType.line, { x: railStart, y: railY, w: railEnd - railStart, h: 0, line: { color: COLOR.border, width: 2 } });
  s.addShape(pptx.ShapeType.triangle, { x: railEnd, y: railY - 0.09, w: 0.18, h: 0.18, rotate: 90, fill: { color: COLOR.border }, line: { type: 'none' } });
  steps.forEach(([num, time, label, body, state], i) => {
    const colX = gx(1) + stepW * i;
    const mx = colX; // marker left-aligned in its column (matches HTML)
    const my = railY - md / 2;
    const upcoming = state === 'upcoming';
    const current = state === 'current';
    if (current) { // halo ring
      s.addShape(pptx.ShapeType.ellipse, { x: mx - 0.07, y: my - 0.07, w: md + 0.14, h: md + 0.14, fill: { color: COLOR.accentWeak }, line: { type: 'none' } });
    }
    s.addShape(pptx.ShapeType.ellipse, {
      x: mx, y: my, w: md, h: md,
      fill: { color: upcoming ? COLOR.slideBg : COLOR.accent },
      line: upcoming ? { color: COLOR.borderStrong, width: 1.5 } : { type: 'none' },
    });
    s.addText(num, { x: mx, y: my, w: md, h: md, fontFace: FONT.sans, fontSize: SIZE.caption, bold: true, color: upcoming ? COLOR.textSecondary : COLOR.textOnAccent, align: 'center', valign: 'middle' });
    s.addText(time, { x: colX, y: railY + 0.32, w: stepW - 0.2, h: 0.35, fontFace: FONT.sans, fontSize: SIZE.caption, bold: true, color: current ? COLOR.accent : COLOR.textSecondary, align: 'left' });
    s.addText(label, { x: colX, y: railY + 0.72, w: stepW - 0.2, h: 0.5, fontFace: FONT.sans, fontSize: SIZE.h3, bold: true, color: upcoming ? COLOR.textSecondary : COLOR.textPrimary, align: 'left' });
    s.addText(body, { x: colX, y: railY + 1.25, w: stepW - 0.25, h: 0.8, fontFace: FONT.sans, fontSize: SIZE.body, color: COLOR.textSecondary, align: 'left' });
  });
}

// 11 — Matrix (2x2 quadrants, top-left highlighted; axis labels)
function slideMatrix(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: 'マトリクスは' }, { text: '2軸で位置づけ', accent: true }, { text: 'を示します' }]);
  const quads = [
    ['最優先', '効果大・容易（推奨象限を強調）', true],
    ['計画的に', '効果大・困難', false],
    ['すきま時間で', '効果小・容易', false],
    ['見送り', '効果小・困難', false],
  ];
  const gridX = gx(1) + 0.5; // leave room for y-axis label
  const gridW = CW - 0.5;
  const gridY = BODY_TOP;
  const gridH = BODY_BOTTOM - BODY_TOP - 0.4; // leave room for x-axis label
  const qgap = 0.1667;
  const qw = (gridW - qgap) / 2;
  const qh = (gridH - qgap) / 2;
  quads.forEach(([title, desc, hi], i) => {
    const x = gridX + (i % 2) * (qw + qgap);
    const y = gridY + Math.floor(i / 2) * (qh + qgap);
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: qw, h: qh, rectRadius: 0.06,
      fill: { color: COLOR.surface },
      line: { color: hi ? COLOR.accent : COLOR.border, width: hi ? 2 : 1 },
    });
    if (hi) s.addShape(pptx.ShapeType.rect, { x, y, w: qw, h: 0.05, fill: { color: COLOR.accent }, line: { type: 'none' } });
    s.addText(title, { x: x + 0.25, y: y + 0.2, w: qw - 0.5, h: 0.5, fontFace: FONT.sans, fontSize: SIZE.h3, bold: true, color: hi ? COLOR.accent : COLOR.textPrimary, align: 'left' });
    s.addText(desc, { x: x + 0.25, y: y + 0.75, w: qw - 0.5, h: 0.8, fontFace: FONT.sans, fontSize: SIZE.caption, color: COLOR.textSecondary, align: 'left' });
  });
  // Rotated text pivots about the box center; place that center in the left
  // gutter (x~0.3) and vertically centered over the grid height.
  s.addText('効果 高 → 低', { x: 0.3 - gridH / 2, y: gridY + gridH / 2 - 0.2, w: gridH, h: 0.4, fontFace: FONT.sans, fontSize: SIZE.caption, color: COLOR.textSecondary, align: 'center', valign: 'middle', rotate: 270 });
  s.addText('容易さ 高 → 低', { x: gridX, y: gridY + gridH + 0.1, w: gridW, h: 0.35, fontFace: FONT.sans, fontSize: SIZE.caption, color: COLOR.textSecondary, align: 'center' });
  footer(s, pptx, '使い方: 2軸で位置づけ・推奨象限を1つ強調');
}

// 12 — Process (3 step cards with accent arrows)
function slideProcess(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.slideBg };
  heading(s, pptx, [{ text: 'プロセスは' }, { text: '3ステップ', accent: true }, { text: 'で手順を図解します' }]);
  const steps = [['1', '選ぶ', 'レイアウトを複製'], ['2', '差し込む', '役割変数のまま入力'], ['3', '出す', '印刷/PDF 出力']];
  const arrowW = 0.7;
  const boxW = (CW - arrowW * 2) / 3;
  const y = 2.5;
  const boxH = 2.3;
  steps.forEach(([num, label, body], i) => {
    const x = gx(1) + i * (boxW + arrowW);
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: boxW, h: boxH, rectRadius: 0.06, fill: { color: COLOR.surface }, line: { type: 'none' } });
    s.addText(num, { x, y: y + 0.3, w: boxW, h: 0.9, fontFace: FONT.sans, fontSize: SIZE.heading, bold: true, color: COLOR.accent, align: 'center' });
    s.addText(label, { x, y: y + 1.2, w: boxW, h: 0.5, fontFace: FONT.sans, fontSize: SIZE.h3, bold: true, color: COLOR.textPrimary, align: 'center' });
    s.addText(body, { x: x + 0.2, y: y + 1.7, w: boxW - 0.4, h: 0.5, fontFace: FONT.sans, fontSize: SIZE.body, color: COLOR.textSecondary, align: 'center' });
    if (i < steps.length - 1) {
      s.addText('→', { x: x + boxW, y, w: arrowW, h: boxH, fontFace: FONT.sans, fontSize: SIZE.heading, bold: true, color: COLOR.accent, align: 'center', valign: 'middle' });
    }
  });
  footer(s, pptx, '使い方: 番号+矢印で手順を明確化');
}

// 13 — Quote (surface bg, accent quotation mark, attribution on a rule)
function slideQuote(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.surface };
  s.addText('“', { x: gx(1) - 0.05, y: 1.4, w: 1.4, h: 1.4, fontFace: FONT.sans, fontSize: 96, bold: true, color: COLOR.accent, align: 'left', valign: 'top' });
  s.addText('引用レイアウトは、事実に基づく実利用者の声だけを載せます。誇張や捏造はしません。', {
    x: gx(1), y: 2.7, w: gw(10), h: 2.0, fontFace: FONT.sans, fontSize: SIZE.heading,
    color: COLOR.textPrimary, align: 'left', valign: 'top', lineSpacingMultiple: 1.35,
  });
  s.addShape(pptx.ShapeType.line, { x: gx(1), y: 5.3, w: CW, h: 0, line: { color: COLOR.border, width: 1 } });
  s.addText(
    [
      { text: '［氏名・肩書きを記入］', options: { bold: true, color: COLOR.textPrimary } },
      { text: ' — ［部署／団体を記入］', options: { color: COLOR.textSecondary } },
    ],
    { x: gx(1), y: 5.4, w: CW, h: 0.6, fontFace: FONT.sans, fontSize: SIZE.h3, align: 'left' },
  );
}

// 14 — Image full (image replaced with a dashed placeholder + captioned scrim)
function slideImageFull(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.surface };
  // full-bleed placeholder panel
  s.addShape(pptx.ShapeType.rect, { x: 0.25, y: 0.25, w: W - 0.5, h: H - 0.5, fill: { color: COLOR.surface }, line: { color: COLOR.borderStrong, width: 2, dashType: 'dash' } });
  s.addText('［全面画像を差し込む（著作物は各自用意）］', {
    x: 0, y: 0, w: W, h: H - 1.6, fontFace: FONT.sans, fontSize: SIZE.body, color: COLOR.textSecondary, align: 'center', valign: 'middle',
  });
  // scrim (dark translucent) so the overlaid caption keeps AA contrast
  s.addShape(pptx.ShapeType.rect, { x: 0.25, y: H - 1.95, w: W - 0.5, h: 1.7, fill: { color: COLOR.textPrimary, transparency: 20 }, line: { type: 'none' } });
  s.addText(
    [
      { text: '全面ビジュアルで印象づける\n', options: { bold: true, fontSize: SIZE.heading } },
      { text: '要点は1行、スクリムで重ね文字のコントラスト（AA）を確保。', options: { fontSize: SIZE.body } },
    ],
    { x: MX + 0.1, y: H - 1.75, w: gw(8), h: 1.4, fontFace: FONT.sans, color: COLOR.textOnAccent, align: 'left', valign: 'top', lineSpacingMultiple: 1.3 },
  );
}

// 15 — Closing (accent-filled, on-accent CTA + contact on a rule)
function slideClosing(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.accent };
  // heading with white text + white underline (overrides the neutral heading())
  s.addText('クロージングは行動喚起で締めます', {
    x: MX, y: MY, w: CW, h: 0.75, fontFace: FONT.sans, fontSize: SIZE.heading, bold: true,
    color: COLOR.textOnAccent, align: 'left', valign: 'top',
  });
  s.addShape(pptx.ShapeType.rect, { x: MX, y: MY + 0.72, w: 0.667, h: 0.042, fill: { color: COLOR.textOnAccent }, line: { type: 'none' } });
  s.addText('このテンプレートで、\n次の資料を作り始めてください', {
    x: gx(1), y: 2.5, w: gw(11), h: 1.8, fontFace: FONT.sans, fontSize: SIZE.display, bold: true,
    color: COLOR.textOnAccent, align: 'left', valign: 'middle', lineSpacingMultiple: 1.1,
  });
  s.addShape(pptx.ShapeType.line, { x: gx(1), y: 5.55, w: CW, h: 0, line: { color: COLOR.textOnAccent, width: 1 } });
  s.addText('連絡先: ［メール／チャンネルを記入］          資料・テンプレート: ［リンク］', {
    x: gx(1), y: 5.65, w: CW, h: 0.6, fontFace: FONT.sans, fontSize: SIZE.h3, color: COLOR.textOnAccent, align: 'left', valign: 'top',
  });
}

// 16 — Reference (surface bg; condensed 2-col list, full list in docs/practices.md)
function slideReference(pptx) {
  const s = pptx.addSlide();
  s.background = { color: COLOR.surface };
  heading(s, pptx, [{ text: '出典' }]);
  const refs = [
    ['A-pyramid', 'Minto, The Minto Pyramid Principle (2009)'],
    ['A-assertion-evidence', 'Alley, The Craft of Scientific Presentations (2013)'],
    ['B-crap', "Williams, The Non-Designer's Design Book (2014)"],
    ['C-cleveland-mcgill', 'Cleveland & McGill, JASA (1984)'],
    ['C-data-ink', 'Tufte, The Visual Display of Quantitative Information (1983)'],
    ['D-miller', 'Miller, Psychological Review (1956)'],
    ['D-clt', 'Sweller (1988)'],
    ['E-peak-end', 'Kahneman, Thinking, Fast and Slow (2011)'],
    ['E-framing', 'Tversky & Kahneman (1981)'],
    ['B-wcag', 'W3C WCAG 2.2'],
  ];
  const gap = 0.3333;
  const colW = (CW - gap) / 2;
  [0, 1].forEach((col) => {
    const slice = refs.slice(col * 5, col * 5 + 5);
    s.addText(
      slice.flatMap(([id, ref]) => [
        { text: `${id}  `, options: { color: COLOR.accent, bold: true } },
        { text: `${ref}\n`, options: { color: COLOR.textSecondary } },
      ]),
      {
        x: gx(1) + col * (colW + gap), y: BODY_TOP, w: colW, h: 4.4, fontFace: FONT.sans, fontSize: SIZE.caption,
        align: 'left', valign: 'top', lineSpacingMultiple: 1.9,
      },
    );
  });
  footer(s, pptx, '全出典は docs/practices.md を参照（本スライドは抜粋）');
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const pptx = buildDeck();
  await pptx.writeFile({ fileName: OUT_FILE });
  console.log(`Wrote ${OUT_FILE}`);
}

// Run only when invoked directly, not when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
