#!/usr/bin/env node
/**
 * emit.mjs — スライド IR を pptxgenjs のネイティブ・オブジェクトへ書き出す。
 *
 * 出力はすべて PowerPoint で編集できる実体(テキストボックス / 図形 / 直線 /
 * ネイティブ表 / ネイティブグラフ)であり、本文領域にラスタ画像を使わない(FR-011)。
 * このモジュールもレイアウト名を知らない。IR の `kind` だけで分岐する。
 *
 * グループ(FR-012): pptxgenjs 4.x にグループ API が無いため、ここでは各図形へ
 * `objectName` でグループ印を付けるだけに留め、実際の `<p:grpSp>` 包みは
 * `group-xml.mjs` が生成後の OOXML に対して行う。
 */

import { GROUP_TAG } from './group-xml.mjs';

const PX_PER_IN = 96;
const inch = (px) => +(px / PX_PER_IN).toFixed(4);
const pt = (px) => +(px * 0.75).toFixed(2);

/** DS カテゴリ配色(--cat-1..7)。系列順に割り当てる。抽出時に解決した値を使う。 */
let CAT = [];
export function setCategoricalPalette(colors) { CAT = colors || []; }

/** 段落 -> pptxgenjs のテキスト断片配列。部分着色は同一ボックス内の run として保つ。 */
function textParts(paragraphs, font) {
  const parts = [];
  paragraphs.forEach((para, pi) => {
    para.runs.forEach((run, ri) => {
      if (run.br) { parts.push({ text: '', options: { breakLine: true } }); return; }
      const last = ri === para.runs.length - 1;
      parts.push({
        text: run.text,
        options: {
          color: run.color || font.color,
          bold: !!run.bold,
          italic: !!run.italic,
          fontSize: run.sizePt || font.sizePt,
          breakLine: last && pi < paragraphs.length - 1,
          ...(para.bullet
            ? { bullet: para.marker
                  // 擬似要素のマーカー(✓ 等)はネイティブ箇条書き文字として保つ
                  ? { characterCode: para.marker.codePointAt(0).toString(16).toUpperCase(), indent: 15 }
                  : { indent: 15 },
                indentLevel: para.indent || 0 }
            : {}),
        },
      });
    });
  });
  return parts;
}

function addTextNode(slide, n, groupName) {
  const opts = {
    x: inch(n.rect.x), y: inch(n.rect.y), w: inch(n.rect.w), h: inch(n.rect.h),
    fontFace: n.font.face || 'Noto Sans JP',
    fontSize: n.font.sizePt,
    color: n.font.color,
    bold: n.font.bold,
    align: n.font.align,
    valign: 'top',
    margin: 0,
    wrap: true,
    // 余白は HTML の padding をそのまま内側マージンへ(面を持つ箱のみ)
    ...(n.inset ? { margin: [pt(n.font.padding.t), pt(n.font.padding.r),
                             pt(n.font.padding.b), pt(n.font.padding.l)] } : {}),
    ...(n.fill ? { fill: { color: n.fill } } : {}),
    ...(n.line && n.line.uniform ? { line: { color: n.line.color, width: pt(n.line.widthPx) } } : {}),
    ...(n.radiusPx ? { rectRadius: inch(n.radiusPx) } : {}),
    ...(groupName ? { objectName: groupName } : {}),
  };
  slide.addText(textParts(n.paragraphs, n.font), opts);

  // 片側だけの境界(callout の左帯など)は、独立した細い矩形で表す
  if (n.line && !n.line.uniform) addEdge(slide, n, groupName);
}

/** 非一様境界(1辺のみ)を細い矩形として描く。 */
function addEdge(slide, n, groupName) {
  const b = n.line, r = n.rect, w = b.widthPx;
  const geo = {
    left:   { x: r.x, y: r.y, w, h: r.h },
    right:  { x: r.x + r.w - w, y: r.y, w, h: r.h },
    top:    { x: r.x, y: r.y, w: r.w, h: w },
    bottom: { x: r.x, y: r.y + r.h - w, w: r.w, h: w },
  }[b.side];
  if (!geo) return;
  slide.addShape('rect', {
    x: inch(geo.x), y: inch(geo.y), w: inch(geo.w), h: inch(geo.h),
    fill: { color: b.color }, line: { type: 'none' },
    ...(groupName ? { objectName: groupName } : {}),
  });
}

function addShapeNode(slide, n, groupName) {
  const opts = {
    x: inch(n.rect.x), y: inch(n.rect.y), w: inch(n.rect.w), h: inch(n.rect.h),
    fill: n.fill ? { color: n.fill } : { type: 'none' },
    line: n.line && n.line.uniform
      ? { color: n.line.color, width: pt(n.line.widthPx) }
      : { type: 'none' },
    ...(groupName ? { objectName: groupName } : {}),
  };
  if (n.radiusPx) {
    slide.addShape('roundRect', { ...opts, rectRadius: inch(n.radiusPx) });
  } else {
    slide.addShape('rect', opts);
  }
  if (n.line && !n.line.uniform) addEdge(slide, n, groupName);
}

function addLineNode(slide, n, groupName) {
  const a = n.from, b = n.to;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
  slide.addShape('line', {
    x: inch(x), y: inch(y), w: inch(w), h: inch(h),
    line: { color: n.line.color, width: pt(n.line.widthPx) },
    // 端点の向きを保つ(外接矩形だけでは対角線の向きが決まらない)
    flipH: b.x < a.x,
    flipV: b.y < a.y,
    ...(groupName ? { objectName: groupName } : {}),
  });
}

function addTableNode(slide, n) {
  const rows = n.rows.map((row) => row.map((c) => ({
    text: c.text,
    options: {
      bold: c.header, color: c.color, fontSize: c.sizePt, align: c.align,
      valign: 'middle',
      ...(c.fill ? { fill: { color: c.fill } } : {}),
    },
  })));
  slide.addTable(rows, {
    x: inch(n.rect.x), y: inch(n.rect.y), w: inch(n.rect.w),
    border: { type: 'solid', color: n.border ? n.border.color : 'CCCCCC', pt: 0.75 },
    autoPage: false,
  });
}

function addChartNode(slide, n, pptx) {
  const c = n.chart;
  const geo = { x: inch(n.rect.x), y: inch(n.rect.y), w: inch(n.rect.w), h: inch(n.rect.h) };
  if (!c) {  // payload 不正時も編集可能な体裁を保つ(枠 + 説明)
    slide.addText(n.label || 'chart', { ...geo, fontSize: 10, align: 'center', valign: 'middle',
      line: { color: 'CCCCCC', width: 1 } });
    return;
  }
  const colors = c.series.map((_, i) => CAT[i % (CAT.length || 1)] || '0031D8');
  const common = {
    ...geo, chartColors: c.type === 'doughnut' ? c.categories.map((_, i) => CAT[i % (CAT.length || 1)] || '0031D8') : colors,
    showLegend: true, legendPos: 'b', legendFontSize: 8,
    catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, dataLabelFontSize: 8,
  };

  if (c.type === 'doughnut') {
    slide.addChart(pptx.ChartType.doughnut,
      [{ name: c.series[0].name, labels: c.categories, values: c.series[0].values }],
      { ...common, holeSize: 55, showPercent: false });
    return;
  }

  if (c.type === 'scatter') {
    // 群ごとに x が異なるため、x 軸を連結し、各系列は自分の区間だけ値を持つ。
    const xs = c.series.flatMap((s) => s.x || []);
    let off = 0;
    const data = [{ name: 'X', values: xs }];
    for (const s of c.series) {
      const vals = new Array(xs.length).fill(null);
      (s.values || []).forEach((v, i) => { vals[off + i] = v; });
      off += (s.x || []).length;
      data.push({ name: s.name, values: vals });
    }
    slide.addChart(pptx.ChartType.scatter, data,
      { ...common, lineSize: 0, lineDataSymbol: 'circle', lineDataSymbolSize: 6 });
    return;
  }

  const data = c.series.map((s) => ({ name: s.name, labels: c.categories, values: s.values }));
  if (c.type === 'line') {
    slide.addChart(pptx.ChartType.line, data, { ...common, lineDataSymbol: 'none', lineSize: 2 });
  } else if (c.type === 'bar100') {
    slide.addChart(pptx.ChartType.bar, data,
      { ...common, barDir: 'col', barGrouping: 'percentStacked' });
  } else {
    slide.addChart(pptx.ChartType.bar, data,
      { ...common, barDir: 'col', barGrouping: 'clustered',
        showLegend: c.series.length > 1 });
  }
}

/** IR のノード列を 1 スライドへ書き出す。group は印を付けて平坦化する。 */
function emitNodes(slide, nodes, pptx, groups, groupName = null) {
  for (const n of nodes) {
    switch (n.kind) {
      case 'group': {
        const name = `${GROUP_TAG}${groups.length}`;
        groups.push(name);
        emitNodes(slide, n.children, pptx, groups, name);
        break;
      }
      case 'text': addTextNode(slide, n, groupName); break;
      case 'shape': addShapeNode(slide, n, groupName); break;
      case 'line': addLineNode(slide, n, groupName); break;
      case 'table': addTableNode(slide, n); break;
      case 'chart': addChartNode(slide, n, pptx); break;
      default: break;
    }
  }
}

/** スライド IR からデッキを組み立てる。戻り値は pptxgenjs インスタンス。 */
export function emitDeck(pptx, deck) {
  const W = deck.canvas.w / PX_PER_IN;
  const H = deck.canvas.h / PX_PER_IN;
  pptx.defineLayout({ name: 'DS_16x9', width: W, height: H });
  pptx.layout = 'DS_16x9';

  const groups = [];
  for (const s of deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: s.background.fill };
    emitNodes(slide, s.nodes, pptx, groups);
  }
  return { pptx, groupNames: groups };
}
