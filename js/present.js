/**
 * present.js — オプトインの発表モード(feature 005 / US3)。
 * 既定は review(縦スクロールのショーケース)。P またはツールバーで present に切替える。
 * present では 1 枚をビューポートに合わせて縮小表示し、キーボードで境界付きに移動する。
 * 印刷は @media print が全スライドを表示するため data-mode の影響を受けない。
 * 契約: specs/005-deck-ux-hardening/contracts/ux-hardening-contracts.md (C5)
 *
 * 公開 API: window.PresPresent = { toggle, enter, exit, next, prev, go, index, total }
 */
(function () {
  const root = document.documentElement;
  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;
  if (!total) return;

  // 既定は review(明示設定して CSS の分岐を安定させる。視覚は不変)。
  if (root.getAttribute('data-mode') !== 'present') root.setAttribute('data-mode', 'review');
  let current = 0;

  const clamp = (i) => Math.max(0, Math.min(total - 1, i));

  /** ビューポートに合わせた縮尺(1280×720 を基準に縦横で収まる方)。 */
  function applyScale() {
    if (root.getAttribute('data-mode') !== 'present') return;
    const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    root.style.setProperty('--present-scale', String(scale));
  }

  function render() {
    slides.forEach((s, i) => {
      const active = i === current;
      if (active) s.setAttribute('data-active', '');
      else s.removeAttribute('data-active');
      // 非アクティブは操作対象外(フォーカス不可・非通知)
      if (!active && root.getAttribute('data-mode') === 'present') s.setAttribute('inert', '');
      else s.removeAttribute('inert');
    });
    applyScale();
  }

  function enter() {
    root.setAttribute('data-mode', 'present');
    render();
  }
  function exit() {
    root.setAttribute('data-mode', 'review');
    slides.forEach((s) => { s.removeAttribute('data-active'); s.removeAttribute('inert'); });
    root.style.removeProperty('--present-scale');
  }
  function toggle() {
    if (root.getAttribute('data-mode') === 'present') exit();
    else enter();
  }
  function go(i) { current = clamp(i); render(); }
  function next() { go(current + 1); }
  function prev() { go(current - 1); }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else if (root.requestFullscreen) {
      root.requestFullscreen().catch(() => {});
    }
  }

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'p' || e.key === 'P') { toggle(); return; }

    if (root.getAttribute('data-mode') !== 'present') return;

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault(); next(); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Escape':
        exit(); break;
      case 'f':
      case 'F':
        toggleFullscreen(); break;
    }
  });

  window.addEventListener('resize', applyScale);

  for (const btn of document.querySelectorAll('[data-present-toggle]')) {
    btn.addEventListener('click', () => toggle());
  }

  window.PresPresent = {
    toggle, enter, exit, next, prev, go,
    index: () => current,
    total: () => total,
  };
})();
