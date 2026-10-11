'use strict';
(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (menu && nav) {
    document.documentElement.classList.add('menu-ready');
    const close = () => {nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false');};
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => {if (event.target.closest('a')) close();});
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {close(); menu.focus();}
    });
    matchMedia('(min-width: 821px)').addEventListener('change', close);
  }
  const search = document.getElementById('tool-search');
  const searchBox = document.querySelector('.tools-search');
  const cards = [...document.querySelectorAll('.model-link')];
  const count = document.getElementById('tool-count');
  const empty = document.getElementById('tools-empty');
  const clear = document.getElementById('clear-search');
  if (!search || !searchBox || !count || !empty || !clear) return;
  const normalize = value => value.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').trim().toLocaleLowerCase('ar-SA');
  const texts = cards.map(card => normalize(card.textContent));
  function filter() {
    const query = normalize(search.value);
    const words = query.split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach((card, index) => {
      const matches = words.every(word => texts[index].includes(word));
      card.hidden = !matches;
      if (matches) visible++;
    });
    count.textContent = `${visible} من ${cards.length} أداة`;
    empty.hidden = visible !== 0;
    clear.hidden = search.value.length === 0;
  }
  search.addEventListener('input', filter);
  clear.addEventListener('click', () => {search.value = ''; filter(); search.focus();});
  searchBox.hidden = false;
  filter();
})();
