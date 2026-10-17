(() => {
  'use strict';
  const nav = document.getElementById('page-nav');
  const menu = document.getElementById('menu-button');
  const links = [...nav.querySelectorAll('a')];
  const sections = links.map(a => document.getElementById(a.dataset.section));
  const progress = document.getElementById('reading-progress');
  const toast = document.getElementById('toast');
  let noticeTimer;
  function notice(message) {
    clearTimeout(noticeTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    noticeTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }
  function closeMenu() {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
  });
  links.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.getElementById('print-button').addEventListener('click', () => window.print());
  document.getElementById('share-button').addEventListener('click', async () => {
    const url = document.querySelector('link[rel="canonical"]').href;
    try {
      await navigator.clipboard.writeText(url);
      notice('تم نسخ رابط المقترح');
    } catch {
      const input = document.createElement('textarea');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      notice(copied ? 'تم نسخ رابط المقترح' : 'انسخ الرابط من شريط العنوان');
    }
  });
  let scheduled = false;
  function updateReadingPosition() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${total > 0 ? Math.min(100, window.scrollY / total * 100) : 0}%`;
    const offset = Math.min(200, window.innerHeight * 0.28);
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) current = section;
    }
    links.forEach(link => {
      if (link.dataset.section === current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scheduled = false;
  }
  function requestUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateReadingPosition);
    }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('load', updateReadingPosition);
  updateReadingPosition();
})();
