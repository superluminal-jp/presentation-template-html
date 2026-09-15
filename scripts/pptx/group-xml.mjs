#!/usr/bin/env node
/**
 * group-xml.mjs — 生成済み PPTX の図形を `<p:grpSp>` で包む(FR-012)。
 *
 * pptxgenjs 4.x にはグループ API が無い。emit.mjs は各図形の `objectName` に
 * グループ印(GROUP_TAG + 連番)を付けるだけなので、ここで `ppt/slides/slideN.xml`
 * を走査し、同じ印を持つ連続した図形要素をグループへ包み直す。
 *
 * 安全側に倒す方針: 想定外の形(印が飛び飛び、座標が読めない等)なら包まずに
 * そのまま残す。グループ化に失敗しても常に開ける PPTX であることを優先する。
 */

export const GROUP_TAG = 'DSGRP_';

const SHAPE_RE = /<p:(sp|cxnSp|pic|graphicFrame)\b[\s\S]*?<\/p:\1>/g;

/** 図形要素から objectName(cNvPr の name 属性)を取り出す。 */
function nameOf(xml) {
  const m = xml.match(/<p:cNvPr\b[^>]*\bname="([^"]*)"/);
  return m ? m[1] : '';
}

/** 図形要素の a:off / a:ext(EMU)を取り出す。 */
function boxOf(xml) {
  const off = xml.match(/<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"\s*\/>/);
  const ext = xml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"\s*\/>/);
  if (!off || !ext) return null;
  return { x: +off[1], y: +off[2], cx: +ext[1], cy: +ext[2] };
}

function grpSp(id, name, box, inner) {
  return (
    '<p:grpSp>' +
      '<p:nvGrpSpPr>' +
        `<p:cNvPr id="${id}" name="${name}"/>` +
        '<p:cNvGrpSpPr/>' +
        '<p:nvPr/>' +
      '</p:nvGrpSpPr>' +
      '<p:grpSpPr>' +
        '<a:xfrm>' +
          `<a:off x="${box.x}" y="${box.y}"/>` +
          `<a:ext cx="${box.cx}" cy="${box.cy}"/>` +
          // 子座標系を親と一致させ、子は絶対座標のままで正しく収まる
          `<a:chOff x="${box.x}" y="${box.y}"/>` +
          `<a:chExt cx="${box.cx}" cy="${box.cy}"/>` +
        '</a:xfrm>' +
      '</p:grpSpPr>' +
      inner +
    '</p:grpSp>'
  );
}

/**
 * 1 スライドの XML に対しグループ包みを適用して返す。
 * 包めなかった場合は入力をそのまま返す。
 */
export function wrapGroupsInSlideXml(xml) {
  const open = xml.indexOf('<p:spTree>');
  const close = xml.lastIndexOf('</p:spTree>');
  if (open < 0 || close < 0) return xml;

  const head = xml.slice(0, open + '<p:spTree>'.length);
  const tree = xml.slice(open + '<p:spTree>'.length, close);
  const tail = xml.slice(close);

  // spTree の先頭にある nvGrpSpPr / grpSpPr は図形ではないので保持する
  const firstShape = tree.search(/<p:(sp|cxnSp|pic|graphicFrame)\b/);
  if (firstShape < 0) return xml;
  const prelude = tree.slice(0, firstShape);
  const body = tree.slice(firstShape);

  const shapes = body.match(SHAPE_RE);
  if (!shapes) return xml;
  // 連結し直して元と一致するか(= 取りこぼしが無いか)を確認。ずれるなら触らない。
  if (shapes.join('') !== body.replace(/\s+(?=<p:(sp|cxnSp|pic|graphicFrame)\b)/g, '')) {
    // 空白の差異のみ許容するため、素朴一致に失敗したら安全側で何もしない
    if (shapes.join('').length !== body.trim().length) return xml;
  }

  // 最大 id を求め、グループ用に続き番号を振る
  let maxId = 0;
  for (const m of xml.matchAll(/<p:cNvPr\s+id="(\d+)"/g)) maxId = Math.max(maxId, +m[1]);

  const out = [];
  let i = 0;
  let changed = false;
  while (i < shapes.length) {
    const tag = nameOf(shapes[i]);
    if (!tag.startsWith(GROUP_TAG)) { out.push(shapes[i++]); continue; }

    // 同じ印を持つ連続した図形を集める
    let j = i;
    while (j < shapes.length && nameOf(shapes[j]) === tag) j++;
    const members = shapes.slice(i, j);
    const boxes = members.map(boxOf);

    if (members.length < 2 || boxes.some((b) => !b)) {
      out.push(...members);            // 単独 or 座標不明 -> 包まない
    } else {
      const x = Math.min(...boxes.map((b) => b.x));
      const y = Math.min(...boxes.map((b) => b.y));
      const x2 = Math.max(...boxes.map((b) => b.x + b.cx));
      const y2 = Math.max(...boxes.map((b) => b.y + b.cy));
      out.push(grpSp(++maxId, tag, { x, y, cx: x2 - x, cy: y2 - y }, members.join('')));
      changed = true;
    }
    i = j;
  }

  if (!changed) return xml;
  return head + prelude + out.join('') + tail;
}
