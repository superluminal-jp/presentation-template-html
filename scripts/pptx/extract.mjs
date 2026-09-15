#!/usr/bin/env node
/**
 * extract.mjs — 正本デック(`index.html`)の実レンダリングからスライド IR を作る。
 *
 * 設計の要:
 *  - このモジュールは**レイアウトもコンポーネントも知らない**。知っているのは
 *    `data-pptx` 役割属性の語彙だけ(contracts/pptx-role-contract.md)。
 *    正本にスライドが増えても、ここは変更不要で追随する(FR-009)。
 *  - 幾何は `getBoundingClientRect()`、体裁は `getComputedStyle()` の実測値のみ。
 *    座標もトークン解決値もコード中に持たない(FR-006 / FR-010)。
 *  - 実行時 JS(frame.js の共通チャーム、tree-connectors.js の直線)が描き終えた
 *    あとの DOM を読む(FR-015 / research.md D8)。
 *
 * 出力: data-model.md §2 のスライド IR(px 単位・スライド原点相対)。
 */

import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, '../..');

/** ブラウザ内で実行される走査本体。DOM API だけを使う(Node の値を参照しない)。 */
function scrapeDeck() {
  const ROLES = new Set(['text', 'shape', 'line', 'table', 'chart', 'image', 'group', 'ignore']);

  const roleOf = (el) => {
    const r = el.getAttribute && el.getAttribute('data-pptx');
    return r && ROLES.has(r) ? r : null;
  };

  /** 直接の子テキストノードに非空白があるか(= この要素自身が本文を持つ)。 */
  const hasOwnText = (el) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    }
    return false;
  };

  const px = (v) => (v ? parseFloat(v) || 0 : 0);
  const hex = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    if (p.length > 3 && p[3] === 0) return null; // 透明
    return p.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  /** 可視の塗り。 */
  const fillOf = (cs) => hex(cs.backgroundColor);

  /** 可視の境界。四辺のうち幅が最大の辺を代表として採る(左帯のみの callout 等に対応)。 */
  const borderOf = (cs) => {
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => ({
      w: px(cs[`border${s}Width`]),
      c: hex(cs[`border${s}Color`]),
      style: cs[`border${s}Style`],
      side: s.toLowerCase(),
    })).filter((b) => b.w > 0 && b.c && b.style !== 'none');
    if (!sides.length) return null;
    const uniform = sides.length === 4 && sides.every((b) => b.w === sides[0].w && b.c === sides[0].c);
    const dom = sides.reduce((a, b) => (b.w > a.w ? b : a));
    return { color: dom.c, widthPx: dom.w, side: uniform ? 'all' : dom.side, uniform };
  };

  const radiusOf = (cs) => px(cs.borderTopLeftRadius);

  /** テキストノード群の実描画矩形の和(インライン要素が先行する場合に効く)。 */
  const textRect = (el) => {
    const rects = [];
    const walk = (node) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) {
          if (!n.nodeValue.trim()) continue;
          const r = document.createRange();
          r.selectNodeContents(n);
          for (const rc of r.getClientRects()) if (rc.width && rc.height) rects.push(rc);
        } else if (n.nodeType === 1 && !roleOf(n)) {
          walk(n);
        }
      }
    };
    walk(el);
    if (!rects.length) return null;
    const x = Math.min(...rects.map((r) => r.left));
    const y = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return { left: x, top: y, width: right - x, height: bottom - y };
  };

  /**
   * テキスト段落の収集。マーク済み子孫では止まる(二重出力の防止)。
   * `<li>` があれば各項目を 1 段落(箇条書き)とし、無ければ全体を 1 段落とする。
   */
  const isBlock = (el) => {
    const d = getComputedStyle(el).display;
    return d !== 'inline' && d !== 'inline-block' && d !== 'inline-flex' && d !== 'contents';
  };

  const paragraphsOf = (root) => {
    const paras = [];
    // ブロックレベルの子要素は独立した段落になる(.callout のタイトル行など)。
    // sink は「現在の段落の runs」。ブロックに入ったら段落を切り替える。
    const runsFrom = (node, ctx) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) {
          const t = n.nodeValue.replace(/\s+/g, ' ');
          if (!t.trim()) continue;
          const cs = getComputedStyle(node);
          ctx.cur().push({
            text: t,
            color: hex(cs.color) || '333333',
            bold: parseInt(cs.fontWeight, 10) >= 600,
            italic: cs.fontStyle === 'italic',
            sizePt: +(px(cs.fontSize) * 0.75).toFixed(1),
          });
        } else if (n.nodeType === 1) {
          if (roleOf(n)) continue;                 // マーク済み子孫は別オブジェクト
          if (n.tagName === 'BR') { ctx.cur().push({ text: '\n', br: true }); continue; }
          if (isBlock(n)) { ctx.brk(); runsFrom(n, ctx); ctx.brk(); }
          else runsFrom(n, ctx);
        }
      }
    };
    // 段落バッファ。brk() は空でなければ確定して次へ。
    const mkCtx = (out, bullet, indent) => {
      let buf = [];
      return {
        cur: () => buf,
        brk: () => { if (buf.length) { out.push({ runs: buf, bullet, indent }); buf = []; } },
        end: () => { if (buf.length) out.push({ runs: buf, bullet, indent }); },
      };
    };

    const items = root.tagName === 'LI' ? [] : [...root.querySelectorAll('li')]
      .filter((li) => !li.closest('[data-pptx="ignore"]'));
    if (items.length) {
      for (const li of items) {
        // 入れ子の深さ = 箇条書きのインデント段
        let depth = 0;
        for (let p = li.parentElement; p && p !== root; p = p.parentElement) {
          if (p.tagName === 'UL' || p.tagName === 'OL') depth++;
        }
        // li 直下の内容だけを 1 段落にする(入れ子リストは自分の li が別段落を作る)
        const acc = [];
        const ctx = mkCtx(acc, true, Math.max(0, depth - 1));
        for (const n of li.childNodes) {
          if (n.nodeType === 1 && (n.tagName === 'UL' || n.tagName === 'OL')) continue;
          if (n.nodeType === 3) {
            const t = n.nodeValue.replace(/\s+/g, ' ');
            if (!t.trim()) continue;
            const cs = getComputedStyle(li);
            ctx.cur().push({
              text: t, color: hex(cs.color) || '333333',
              bold: parseInt(cs.fontWeight, 10) >= 600,
              italic: cs.fontStyle === 'italic',
              sizePt: +(px(cs.fontSize) * 0.75).toFixed(1),
            });
          } else if (n.nodeType === 1 && !roleOf(n)) {
            runsFrom(n, ctx);
          }
        }
        ctx.end();
        // リストマーカーが擬似要素で描かれている場合(.checklist の ✓ など)、
        // その文字を PPTX のネイティブ箇条書き文字として持ち上げる。
        // 本文ではなくマーカーなので、テキストとしてではなく bullet として写す。
        const mk = getComputedStyle(li, '::before').content;
        const mm = mk && mk.match(/^"(.*)"$/);
        const marker = mm && mm[1].trim() ? mm[1].trim() : null;
        if (marker) for (const para of acc) para.marker = marker;
        paras.push(...acc);
      }
    } else {
      const ctx = mkCtx(paras, false, 0);
      runsFrom(root, ctx);
      ctx.end();
    }
    return paras;
  };

  const fontOf = (el) => {
    const cs = getComputedStyle(el);
    const align = { start: 'left', end: 'right', center: 'center', justify: 'left',
      left: 'left', right: 'right' }[cs.textAlign] || 'left';
    return {
      face: (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim(),
      sizePt: +(px(cs.fontSize) * 0.75).toFixed(1),
      bold: parseInt(cs.fontWeight, 10) >= 600,
      color: hex(cs.color) || '333333',
      align,
      lineSpacingPt: +(px(cs.lineHeight || cs.fontSize) * 0.75).toFixed(1),
      padding: {
        l: px(cs.paddingLeft), r: px(cs.paddingRight),
        t: px(cs.paddingTop), b: px(cs.paddingBottom),
      },
    };
  };

  // DS トークンの解決値。theme1.xml の配色差し替えに使う(FR-010: 手維持マップを持たない)。
  const rootCs = getComputedStyle(document.documentElement);
  const tokenHex = (name) => {
    const raw = rootCs.getPropertyValue(name).trim();
    if (!raw) return null;
    // CSS 変数は #rrggbb や別変数を指しうるため、実際に描かせて解決する
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const v = hex(getComputedStyle(probe).color);
    probe.remove();
    return v;
  };

  const deck = {
    canvas: null,
    slides: [],
    tokens: {
      accent: tokenHex('--accent'),
      accentStrong: tokenHex('--accent-strong'),
      textPrimary: tokenHex('--text-primary'),
      surface: tokenHex('--surface'),
      cat: [1, 2, 3, 4, 5, 6, 7].map((i) => tokenHex(`--cat-${i}`)).filter(Boolean),
    },
  };
  const slides = [...document.querySelectorAll('.slide')];

  for (const slide of slides) {
    const base = slide.getBoundingClientRect();
    if (!deck.canvas) deck.canvas = { w: Math.round(base.width), h: Math.round(base.height) };
    const rel = (r) => ({
      x: +(r.left - base.left).toFixed(2), y: +(r.top - base.top).toFixed(2),
      w: +r.width.toFixed(2), h: +r.height.toFixed(2),
    });

    const scs = getComputedStyle(slide);
    const out = {
      layout: slide.getAttribute('data-layout'),
      background: { fill: fillOf(scs) || 'FFFFFF' },
      nodes: [],
    };

    // 文書順 = z 順で走査。group は子をまとめ、ignore は部分木ごと外す。
    const visit = (el, sink) => {
      const role = roleOf(el);
      if (role === 'ignore') return;
      if (el.hidden || getComputedStyle(el).visibility === 'hidden' ||
          getComputedStyle(el).display === 'none') return;

      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const emitted = [];

      if (role === 'chart') {
        let data = null;
        try { data = JSON.parse(el.getAttribute('data-chart')); } catch { data = null; }
        emitted.push({ kind: 'chart', rect: rel(r), chart: data,
          label: el.getAttribute('aria-label') || '' });
        sink.push(...emitted);
        return; // 子孫(SVG の内部図形)は出力しない
      }

      if (role === 'table') {
        const rows = [...el.querySelectorAll('tr')].map((tr) =>
          [...tr.children].map((cell) => {
            const ccs = getComputedStyle(cell);
            return {
              text: cell.textContent.replace(/\s+/g, ' ').trim(),
              header: cell.tagName === 'TH',
              align: { start: 'left', end: 'right', center: 'center',
                left: 'left', right: 'right' }[ccs.textAlign] || 'left',
              fill: fillOf(ccs),
              color: hex(ccs.color) || '333333',
              sizePt: +(px(ccs.fontSize) * 0.75).toFixed(1),
            };
          }));
        sink.push({ kind: 'table', rect: rel(r), rows, border: borderOf(cs) });
        return;
      }

      if (role === 'line') {
        // SVG の <line> は端点そのものを取る(外接矩形だけでは対角線の向きが失われる)。
        // 端点はローカル座標なので、スクリーン CTM を通してビューポート座標へ写す。
        let p1 = null, p2 = null;
        if (el.tagName.toLowerCase() === 'line' && el.ownerSVGElement) {
          const m = el.getScreenCTM();
          const svg = el.ownerSVGElement;
          const map = (x, y) => {
            const pt = svg.createSVGPoint();
            pt.x = x; pt.y = y;
            const q = pt.matrixTransform(m);
            return { x: q.x, y: q.y };
          };
          p1 = map(parseFloat(el.getAttribute('x1')) || 0, parseFloat(el.getAttribute('y1')) || 0);
          p2 = map(parseFloat(el.getAttribute('x2')) || 0, parseFloat(el.getAttribute('y2')) || 0);
        } else {
          p1 = { x: r.left, y: r.top };
          p2 = { x: r.right, y: r.bottom };
        }
        sink.push({
          kind: 'line',
          rect: rel(r),
          from: { x: +(p1.x - base.left).toFixed(2), y: +(p1.y - base.top).toFixed(2) },
          to: { x: +(p2.x - base.left).toFixed(2), y: +(p2.y - base.top).toFixed(2) },
          line: {
            color: hex(cs.stroke) || hex(cs.color) || 'CCCCCC',
            widthPx: px(cs.strokeWidth) || 1,
          },
        });
        return;
      }

      if (role === 'image') {
        sink.push({ kind: 'image', rect: rel(r), src: el.getAttribute('src') || '' });
        return;
      }

      let target = sink;
      if (role === 'group') {
        const g = { kind: 'group', rect: rel(r), children: [] };
        sink.push(g);
        target = g.children;
      }

      // 面(塗り・境界)を持つ要素は、その表面を図形として出す。
      const fill = fillOf(cs);
      const border = borderOf(cs);
      const ownText = hasOwnText(el) || role === 'text';
      if ((fill || border) && el !== document.documentElement) {
        // 本文も持つ要素は、テキストボックス側に塗り/境界を載せる(1オブジェクト化)
        if (!ownText) {
          target.push({ kind: 'shape', rect: rel(r), fill, line: border,
            radiusPx: radiusOf(cs) });
        }
      }

      if (ownText) {
        const paras = paragraphsOf(el);
        if (paras.length) {
          // 面を持つなら要素矩形(余白ごと)、持たないなら実テキスト矩形(詰めて配置)
          const box = (fill || border) ? r : (textRect(el) || r);
          target.push({
            kind: 'text', rect: rel(box), paragraphs: paras, font: fontOf(el),
            fill: (fill || border) ? fill : null,
            line: (fill || border) ? border : null,
            radiusPx: (fill || border) ? radiusOf(cs) : 0,
            inset: (fill || border),
          });
        }
        // 本文を出した要素の内側は、マーク済みの子孫だけを拾う
        for (const c of el.children) if (roleOf(c)) visit(c, target);
        return;
      }

      for (const c of el.children) visit(c, target);
    };

    for (const c of slide.children) visit(c, out.nodes);
    deck.slides.push(out);
  }
  return deck;
}

/** 正本を実レンダリングしてスライド IR を返す。 */
export async function extractDeck({ htmlPath } = {}) {
  const file = htmlPath || resolve(REPO_ROOT, 'index.html');
  const browser = await chromium.launch({
    executablePath: process.env.PPTX_CHROMIUM_PATH || undefined,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1,
    });
    await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
    // 実行時描画の完了を待つ(FR-015): フォント確定 -> チャーム注入 -> ツリー直線
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const slides = [...document.querySelectorAll('.slide')];
      if (!slides.length) return false;
      if (!slides.every((s) => s.querySelector('.slide__frame'))) return false;
      const trees = [...document.querySelectorAll('.tree')];
      return trees.every((t) => t.querySelector('svg.tree__lines line'));
    });
    return await page.evaluate(scrapeDeck);
  } finally {
    await browser.close();
  }
}
