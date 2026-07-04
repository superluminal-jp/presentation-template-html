/**
 * annotations.js — 注釈レイヤーのトグル(既定=非表示)。
 * 契約: contracts/annotation-contract.md
 * - window.PresTemplate.toggleAnnotations(force?)
 * - キー "a" で全体トグル / .slide__annotation-toggle で個別トグル
 * - 状態は documentElement[data-annotations="on|off"](初期 off)
 */
(function () {
  const root = document.documentElement;
  if (!root.hasAttribute('data-annotations')) root.setAttribute('data-annotations', 'off');

  function setAll(state) {
    root.setAttribute('data-annotations', state);
    // [hidden] 属性を state に合わせて同期(印刷や非対応環境のフォールバック)
    for (const el of document.querySelectorAll('[data-annotation]')) {
      if (state === 'on') el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    }
    for (const btn of document.querySelectorAll('[data-annotation-toggle-all]')) {
      btn.setAttribute('aria-pressed', String(state === 'on'));
    }
  }

  function toggleAnnotations(force) {
    const current = root.getAttribute('data-annotations') === 'on';
    const next = typeof force === 'boolean' ? force : !current;
    setAll(next ? 'on' : 'off');
    return next;
  }

  function toggleOne(el) {
    const hidden = el.hasAttribute('hidden');
    if (hidden) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target && e.target.tagName) || '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      toggleAnnotations();
    }
  });

  document.addEventListener('click', (e) => {
    const all = e.target.closest('[data-annotation-toggle-all]');
    if (all) { toggleAnnotations(); return; }
    const one = e.target.closest('.slide__annotation-toggle');
    if (one) {
      const slide = one.closest('.slide');
      const ann = slide && slide.querySelector('[data-annotation]');
      if (ann) toggleOne(ann);
    }
  });

  window.PresTemplate = { toggleAnnotations };

  // 初期状態を明示適用(off)
  setAll(root.getAttribute('data-annotations') || 'off');
})();
