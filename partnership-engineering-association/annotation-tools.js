/* Session-only annotations. No slide content or calculations are modified. */
(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  if (!slides.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };
  let penWidth = 3, highlightWidth = 18;
  let mode = 'browse', color = '#b47a2d', active = null;
  const records = slides.map(slide => {
    const layer = svg('svg', {class: 'annotation-layer', viewBox: '0 0 1000 1000', preserveAspectRatio: 'none', 'aria-hidden': 'true'});
    slide.append(layer);
    return {slide, layer, strokes: [], history: []};
  });
  const current = () => records.find(r => !r.slide.hidden);
  const dock = document.createElement('aside');
  dock.className = 'annotation-dock';
  dock.setAttribute('aria-label', 'أدوات الشرح');
  dock.innerHTML = `<button type="button" class="annotation-toggle" aria-label="أدوات الشرح" title="أدوات الشرح" aria-expanded="false" aria-controls="annotationPanel">✎ <span>أدوات الشرح</span></button>
    <div id="annotationPanel" hidden>
      <div class="annotation-modes" role="group" aria-label="أداة الشرح">
        <button type="button" data-mode="browse" aria-pressed="true">تصفح</button>
        <button type="button" data-mode="pen" aria-pressed="false">قلم</button>
        <button type="button" data-mode="highlight" aria-pressed="false">تظليل</button>
        <button type="button" data-mode="pointer" aria-pressed="false">مؤشر</button>
      </div>
      <div class="annotation-actions">
        <div class="annotation-colors" role="group" aria-label="لون التأشير">
          <button type="button" data-color="#b47a2d" style="--swatch:#b47a2d" aria-label="ذهبي" aria-pressed="true"></button>
          <button type="button" data-color="#061f56" style="--swatch:#061f56" aria-label="كحلي" aria-pressed="false"></button>
          <button type="button" data-color="#287d7a" style="--swatch:#287d7a" aria-label="أخضر" aria-pressed="false"></button>
        </div>
        <button type="button" data-action="undo" disabled>تراجع</button>
        <button type="button" data-action="clear" disabled>مسح الشريحة</button>
      </div>
      <label class="annotation-size">سماكة القلم والتظليل <input id="annotationWidth" type="range" min="1" max="40" value="3" aria-label="سماكة أداة التأشير"><output id="annotationWidthValue">3</output></label><p class="annotation-help" role="status">التأشير محفوظ أثناء الجلسة فقط.</p>
    </div>`;
  document.querySelector('.nav').append(dock);
  const laser = document.createElement('div');
  laser.className = 'annotation-pointer';
  laser.hidden = true;
  laser.setAttribute('aria-hidden', 'true');
  document.body.append(laser);
  const toggle = dock.querySelector('.annotation-toggle');
  const panel = dock.querySelector('#annotationPanel');
  const undo = dock.querySelector('[data-action="undo"]');
  const clear = dock.querySelector('[data-action="clear"]');
  const help = dock.querySelector('.annotation-help');
  function refresh() {
    const r = current();
    undo.disabled = !r?.history.length;
    clear.disabled = !r?.strokes.length;
  }
  function end(cancel = false) {
    if (active) {
      const {r, path, id} = active;
      active = null;
      if (cancel) path.remove();
      else {r.history.push([...r.strokes]); r.strokes.push(path);}
      if (r.layer.hasPointerCapture(id)) r.layer.releasePointerCapture(id);
    }
    laser.hidden = true;
    refresh();
  }
  function setMode(value) {
    end(); mode = value;
    const width=mode==='highlight'?highlightWidth:penWidth;dock.querySelector('#annotationWidth').value=width;dock.querySelector('#annotationWidthValue').textContent=width;
    document.body.dataset.annotationMode = mode;
    dock.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    help.textContent = mode === 'browse' ? 'التأشير محفوظ أثناء الجلسة فقط.' : 'للتحريك والحاسبات اختر «تصفح». Esc ينهي التأشير.';
  }
  toggle.onclick = () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (panel.hidden) setMode('browse');
  };
  dock.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  dock.querySelectorAll('[data-color]').forEach(b => b.onclick = () => {
    color = b.dataset.color;
    dock.querySelectorAll('[data-color]').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
  });
  undo.onclick = () => {
    end(); const r = current();
    if (!r?.history.length) return;
    r.strokes = r.history.pop(); r.layer.replaceChildren(...r.strokes); refresh();
  };
  clear.onclick = () => {
    end(); const r = current();
    if (!r?.strokes.length) return;
    r.history.push([...r.strokes]); r.strokes = []; r.layer.replaceChildren(); refresh();
  };
  function point(e, layer) {
    const box = layer.getBoundingClientRect();
    return [Math.max(0, Math.min(1000, (e.clientX-box.left)/box.width*1000)), Math.max(0, Math.min(1000, (e.clientY-box.top)/box.height*1000))];
  }
  function moveLaser(e) {
    laser.hidden = false;
    laser.style.left = e.clientX + 'px'; laser.style.top = e.clientY + 'px';
  }
  records.forEach(r => {
    const layer = r.layer;
    // Do not let writing trigger the presentation's click/swipe navigation.
    ['click', 'dblclick', 'contextmenu', 'touchstart', 'touchend'].forEach(type => layer.addEventListener(type, e => e.stopPropagation()));
    layer.addEventListener('pointerdown', e => {
      if (mode === 'browse' || !e.isPrimary || e.button !== 0 || active) return;
      e.preventDefault(); e.stopPropagation();
      if (mode === 'pointer') {moveLaser(e); layer.setPointerCapture(e.pointerId); return;}
      const [x,y] = point(e, layer);
      const path = svg('path', {d: `M${x},${y} L${x+.01},${y}`, fill: 'none', stroke: color, 'stroke-width': mode === 'highlight' ? highlightWidth : penWidth, opacity: mode === 'highlight' ? .28 : 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke'});
      layer.append(path); active = {r, path, id: e.pointerId}; layer.setPointerCapture(e.pointerId);
    });
    layer.addEventListener('pointermove', e => {
      if (!e.isPrimary) return;
      if (mode === 'pointer') {moveLaser(e); return;}
      if (!active || active.id !== e.pointerId) return;
      const [x,y] = point(e, layer);
      active.path.setAttribute('d', active.path.getAttribute('d') + ` L${x},${y}`);
    });
    layer.addEventListener('pointerup', e => {if (active?.id === e.pointerId) end(); else laser.hidden = true;});
    layer.addEventListener('pointercancel', () => end(true));
    layer.addEventListener('lostpointercapture', () => {if (active) end();});
    layer.addEventListener('pointerleave', () => {laser.hidden = true;});
    new MutationObserver(() => {end(); refresh();}).observe(r.slide, {attributes: true, attributeFilter: ['hidden']});
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mode !== 'browse') {
      e.preventDefault(); e.stopImmediatePropagation(); setMode('browse');
    }
  }, true);
  window.addEventListener('blur', () => end());
  window.addEventListener('resize', () => end());
  document.addEventListener('fullscreenchange', () => end());
  new MutationObserver(() => {
    if (document.body.classList.contains('tool-expanded')) setMode('browse');
  }).observe(document.body, {attributes:true, attributeFilter:['class']});
  dock.querySelector('#annotationWidth').oninput=e=>{const w=+e.target.value;if(mode==='highlight')highlightWidth=w;else penWidth=w;dock.querySelector('#annotationWidthValue').textContent=w;};
  setMode('browse');
})();
