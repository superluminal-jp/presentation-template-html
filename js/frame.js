/**
 * frame.js — スライド共通フレームの注入(feature 004)。
 * 各 .slide に四隅フレーム(取扱区分/Copyright/ページ番号)を付与し、
 * .deck 内でページ番号を自動採番する。設定は <html> の data 属性から読む。
 *   data-org           : 組織名(既定「（組織名）」)
 *   data-copyright     : 著作権表記(既定「© <年> <組織名>」)
 *   data-confidentiality: 既定の機密性区分 1|2|3(既定 2)。スライド個別属性が優先。
 * 契約: contracts/frame-and-dashboard-contracts.md
 */
(function () {
  const root = document.documentElement;
  const org = root.getAttribute('data-org') || '（組織名）';
  const copyright = root.getAttribute('data-copyright') || ('© ' + new Date().getFullYear() + ' ' + org);
  const defConf = root.getAttribute('data-confidentiality') || '2';

  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;

  slides.forEach((slide, i) => {
    const conf = slide.getAttribute('data-confidentiality') || defConf;
    slide.setAttribute('data-confidentiality', conf);
    if (slide.querySelector('.slide__frame')) return;

    const frame = document.createElement('div');
    frame.className = 'slide__frame';
    frame.setAttribute('aria-hidden', 'false');
    frame.innerHTML =
      '<div class="frame__classification">' +
        '<span class="frame__scope"></span>' +
        '<span class="frame__confidentiality"></span>' +
      '</div>' +
      '<span class="frame__copyright"></span>' +
      '<span class="frame__pageno"></span>';
    // テキストは textContent で安全に設定
    frame.querySelector('.frame__scope').textContent = org + '限定';
    frame.querySelector('.frame__confidentiality').textContent = '機密性' + conf + '情報';
    frame.querySelector('.frame__copyright').textContent = copyright;
    frame.querySelector('.frame__pageno').textContent = (i + 1) + ' / ' + total;
    slide.appendChild(frame);
  });

  // 機密性区分を後から変更する API(区分に応じて属性・文言・色が変わる)
  window.PresFrame = {
    setConfidentiality: function (level, slide) {
      const targets = slide ? [slide] : slides;
      targets.forEach((s) => {
        s.setAttribute('data-confidentiality', String(level));
        const el = s.querySelector('.frame__confidentiality');
        if (el) el.textContent = '機密性' + level + '情報';
      });
    },
  };
})();
