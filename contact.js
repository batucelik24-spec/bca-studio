/* Contact is a dialog rather than a route, so the current project stays in place. */
(() => {
  const panel = document.getElementById('contact-panel');
  if (!panel) return;

  if (window.BCA_I18N?.lang === 'en') {
    Object.assign(window.BCA_EN || (window.BCA_EN = {}), {
      'Birlikte üretelim.': 'Let’s create together.',
      'Yeni bir fikir, proje veya iş birliği için bize ulaşın.': 'Get in touch about a new idea, project or collaboration.',
      'E-posta': 'Email',
      'Şirket adresi': 'Company address',
      'Haritada aç ↗': 'View on map ↗',
      'İletişim panelini kapat': 'Close contact panel'
    });
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let opener = null;
  let previousOverflow = '';
  let closeTimer = 0;
  let backdropDown = false;
  let restoreFocus = true;

  function close(immediate = false) {
    if (!panel.open) return;
    if (immediate || reducedMotion.matches) {
      clearTimeout(closeTimer);
      panel.close();
      return;
    }
    if (panel.classList.contains('closing')) return;
    panel.classList.add('closing');
    closeTimer = setTimeout(() => panel.close(), 200);
  }

  document.querySelectorAll('[data-contact-open]').forEach(button => {
    button.addEventListener('click', () => {
      if (panel.open) return;
      opener = button;
      previousOverflow = document.body.style.overflow;
      restoreFocus = true;
      panel.classList.remove('closing');
      panel.showModal();
      document.documentElement.classList.add('contact-open');
      document.body.style.overflow = 'hidden';
      panel.scrollTop = 0;
    });
  });

  panel.querySelector('.contact-close').addEventListener('click', () => close());
  panel.addEventListener('cancel', event => { event.preventDefault(); close(); });
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...panel.querySelectorAll('button, a[href]')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  const outsidePanel = event => {
    const rect = panel.getBoundingClientRect();
    return event.target === panel && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  panel.addEventListener('pointerdown', event => { backdropDown = outsidePanel(event); });
  panel.addEventListener('pointerup', event => {
    if (backdropDown && outsidePanel(event)) close();
    backdropDown = false;
  });
  panel.addEventListener('pointercancel', () => { backdropDown = false; });
  panel.addEventListener('close', () => {
    clearTimeout(closeTimer);
    panel.classList.remove('closing');
    document.documentElement.classList.remove('contact-open');
    document.body.style.overflow = previousOverflow;
    if (restoreFocus && opener?.isConnected && opener.getClientRects().length) opener.focus({preventScroll:true});
    opener = null;
  });
  addEventListener('hashchange', () => { restoreFocus = false; close(true); });
})();
