/**
 * tree-connectors.js — ツリー図の直線コネクタ(feature 010)。
 * 各 .tree の枝分かれ node について、親 node から子 node へ「直線(鍵線ではない)」を
 * SVG で描く。線端は実際の node 位置(offset)から算出するため、内容や枝数が変わっても
 * ズレない(壊れにくい)。縦は親の下辺中央→子の上辺中央、横は親の右辺中央→子の左辺中央。
 *
 * 座標は offset ベース(レイアウト座標)で計算し、SVG は viewBox=li の offset サイズ・
 * width/height=100% とするため、present モードの transform 拡大でも整合する。
 * 契約: contracts/component-contract.md
 */
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';

  // node の中心・辺の座標を、基準要素(枝分かれ li)からの offset 合算で求める。
  function box(nodeEl, base) {
    var x = 0, y = 0, el = nodeEl;
    while (el && el !== base) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    var w = nodeEl.offsetWidth, h = nodeEl.offsetHeight;
    return { left: x, right: x + w, top: y, bottom: y + h, cx: x + w / 2, cy: y + h / 2 };
  }

  function line(x1, y1, x2, y2) {
    var ln = document.createElementNS(SVGNS, 'line');
    ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
    ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
    ln.setAttribute('class', 'tree__line');
    return ln;
  }

  function drawLi(li, horizontal) {
    var parentNode = li.querySelector(':scope > .node');
    var childUl = li.querySelector(':scope > ul');
    if (!parentNode || !childUl) return;

    var svg = li.querySelector(':scope > svg.tree__lines');
    if (!svg) {
      svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'tree__lines');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('preserveAspectRatio', 'none');
      li.insertBefore(svg, li.firstChild);
    }
    var W = li.offsetWidth, H = li.offsetHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var p = box(parentNode, li);
    var children = childUl.querySelectorAll(':scope > li > .node');
    for (var i = 0; i < children.length; i++) {
      var c = box(children[i], li);
      if (horizontal) svg.appendChild(line(p.right, p.cy, c.left, c.cy));
      else svg.appendChild(line(p.cx, p.bottom, c.cx, c.top));
    }
  }

  function drawAll() {
    var trees = document.querySelectorAll('.tree');
    for (var t = 0; t < trees.length; t++) {
      var horizontal = trees[t].classList.contains('tree--horizontal');
      var lis = trees[t].querySelectorAll('li');
      for (var i = 0; i < lis.length; i++) drawLi(lis[i], horizontal);
    }
  }

  if (document.readyState !== 'loading') drawAll();
  else document.addEventListener('DOMContentLoaded', drawAll);
  window.addEventListener('resize', drawAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
})();
