'use strict';
(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (menu && nav) {
    document.documentElement.classList.add('menu-ready');
    const close = () => {
      nav.classList.remove('is-open');
      menu.setAttribute('aria-expanded', 'false');
    };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && !nav.contains(event.target)) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        close();
        menu.focus();
      }
    });
    matchMedia('(min-width: 821px)').addEventListener('change', close);
    if ('IntersectionObserver' in window) {
      const links = [...nav.querySelectorAll('a[href^="#"]')];
      const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
      const observer = new IntersectionObserver(entries => {
        const current = entries.filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!current) return;
        links.forEach(link => {
          if (link.getAttribute('href') === '#' + current.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, {rootMargin: '-100px 0px -55% 0px', threshold: 0});
      sections.forEach(section => observer.observe(section));
    }
  }

  const search = document.getElementById('tool-search');
  const controls = document.querySelector('.tools-controls');
  const cards = [...document.querySelectorAll('.model-link')];
  const count = document.getElementById('tool-count');
  const empty = document.getElementById('tools-empty');
  const clear = document.getElementById('clear-search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  if (!search || !controls || !count || !empty || !clear) return;
  const normalize = value => value.normalize('NFC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').trim().toLocaleLowerCase('ar-SA');
  const texts = cards.map(card => normalize(card.textContent));
  let activeCategory = 'all';
  function filter() {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach((card, index) => {
      const matches = (activeCategory === 'all' || card.dataset.category === activeCategory)
        && words.every(word => texts[index].includes(word));
      card.hidden = !matches;
      if (matches) visible++;
    });
    count.textContent = `${visible} من ${cards.length} أداة`;
    empty.hidden = visible !== 0;
    clear.hidden = search.value.length === 0 && activeCategory === 'all';
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeCategory)));
  }
  filters.forEach(button => button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    filter();
  }));
  search.addEventListener('input', filter);
  clear.addEventListener('click', () => {
    search.value = '';
    activeCategory = 'all';
    filter();
    search.focus();
  });
  controls.hidden = false;
  filter();
})();
