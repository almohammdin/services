(() => {
  'use strict';
  const latin = value => String(value ?? '').replace(/[\u0660-\u0669\u06f0-\u06f9]/g, c => String(c.charCodeAt(0) - (c.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660))).replace(/\u066c/g, ',').replace(/\u066b/g, '.');
  const pad = value => String(value).padStart(2, '0');
  function format(value, kind = 'datetime') {
    if (!value) return '';
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (!m) return '';
    return `${m[3]}/${m[2]}/${m[1]}` + (kind === 'date' ? '' : ` ${m[4] || '00'}:${m[5] || '00'}`);
  }
  function parse(value, kind = 'datetime') {
    value = latin(value).trim();
    if (!value) return '';
    const m = value.match(kind === 'date' ? /^(\d{2})\/(\d{2})\/(\d{4})$/ : /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
    if (!m) return null;
    const [day, month, year, hour, minute] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4] || 0), Number(m[5] || 0)];
    const test = new Date(Date.UTC(year, month - 1, day));
    if (year < 1900 || year > 2100 || test.getUTCFullYear() !== year || test.getUTCMonth() !== month - 1 || test.getUTCDate() !== day || hour > 23 || minute > 59) return null;
    return `${year}-${pad(month)}-${pad(day)}` + (kind === 'date' ? '' : `T${pad(hour)}:${pad(minute)}`);
  }
  let counter = 0;
  function field(value, attrs = '', kind = 'datetime') {
    const id = 'date-field-' + (++counter);
    return `<div class="date-field"><input id="${id}" class="date-text" type="text" inputmode="numeric" lang="en" dir="ltr" data-date-kind="${kind}" placeholder="${kind === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm'}" value="${format(value,kind)}" ${attrs}><button type="button" class="date-open" data-date-open="${id}" aria-label="اختيار التاريخ${kind === 'date' ? '' : ' والوقت'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/></svg></button></div>`;
  }
  const todayParts = () => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Riyadh'}).formatToParts(new Date()).map(p => [p.type,p.value]));
  let target, selected, shownYear, shownMonth, dialog;
  function renderPicker() {
    const kind = target.dataset.dateKind;
    const parts = selected.split(/[T:-]/);
    const label = new Intl.DateTimeFormat('ar-SA', {month:'long',year:'numeric',calendar:'gregory',numberingSystem:'latn',timeZone:'UTC'}).format(new Date(Date.UTC(shownYear,shownMonth,1)));
    const offset = (new Date(Date.UTC(shownYear,shownMonth,1)).getUTCDay()+1)%7;
    const days = new Date(Date.UTC(shownYear,shownMonth+1,0)).getUTCDate();
    const weekday = ['سبت','أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة'];
    let cells = Array.from({length:offset},()=>'<span class="date-empty"></span>').join('');
    for(let d=1;d<=days;d++) {
      const date = `${shownYear}-${pad(shownMonth+1)}-${pad(d)}`;
      cells += `<button type="button" data-pick-day="${date}" class="date-day ${selected.startsWith(date)?'selected':''}" aria-label="${d} ${label}">${d}</button>`;
    }
    dialog.innerHTML = `<form id="date-picker-form"><div class="date-picker-heading"><button type="button" data-month-step="-1" aria-label="الشهر السابق">‹</button><h3 id="date-picker-title">${label}</h3><button type="button" data-month-step="1" aria-label="الشهر التالي">›</button></div><div class="date-grid">${weekday.map(d=>`<span class="date-weekday">${d}</span>`).join('')}${cells}</div>${kind==='date'?'':`<div class="date-time"><label>الساعة<select id="pick-hour" lang="en" dir="ltr">${Array.from({length:24},(_,i)=>`<option ${pad(i)===(parts[3]||'10')?'selected':''}>${pad(i)}</option>`).join('')}</select></label><label>الدقيقة<select id="pick-minute" lang="en" dir="ltr">${Array.from({length:60},(_,i)=>`<option ${pad(i)===(parts[4]||'00')?'selected':''}>${pad(i)}</option>`).join('')}</select></label></div>`}<div class="date-picker-actions"><button type="submit" class="primary">اختيار</button><button type="button" data-date-cancel>إلغاء</button></div></form>`;
    dialog.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();
      const value = selected.slice(0,10)+(kind==='date'?'':`T${dialog.querySelector('#pick-hour').value}:${dialog.querySelector('#pick-minute').value}`);
      target.value = format(value,kind);
      target.dispatchEvent(new Event('input',{bubbles:true}));
      dialog.close(); target.focus();
    });
  }
  function openPicker(input) {
    target = input;
    const t = todayParts();
    selected = parse(input.value,input.dataset.dateKind) || `${t.year}-${t.month}-${t.day}T10:00`;
    shownYear = Number(selected.slice(0,4)); shownMonth = Number(selected.slice(5,7))-1;
    if(!dialog) { dialog=document.createElement('dialog'); dialog.id='date-picker'; dialog.className='date-picker'; dialog.setAttribute('aria-labelledby','date-picker-title'); document.body.append(dialog); }
    renderPicker(); dialog.showModal();
  }
  document.addEventListener('click',event=>{
    const open = event.target.closest('[data-date-open]');
    if(open) { openPicker(document.getElementById(open.dataset.dateOpen)); return; }
    if(dialog?.open&&dialog.querySelector('#pick-hour'))selected=selected.slice(0,10)+'T'+dialog.querySelector('#pick-hour').value+':'+dialog.querySelector('#pick-minute').value;
    const day=event.target.closest('[data-pick-day]');
    if(day) { selected=day.dataset.pickDay+selected.slice(10); renderPicker(); return; }
    const step=event.target.closest('[data-month-step]');
    if(step) { shownMonth+=Number(step.dataset.monthStep); if(shownMonth<0){shownYear--;shownMonth=11;} if(shownMonth>11){shownYear++;shownMonth=0;} renderPicker();return; }
    if(event.target.closest('[data-date-cancel]'))dialog.close();
  });
  const convertText = node => {
    if(node.nodeType===Node.TEXT_NODE) {
      if(!node.parentElement?.closest('script,style,textarea')) { const next=latin(node.nodeValue); if(next!==node.nodeValue)node.nodeValue=next; }
      return;
    }
    if(node.nodeType!==Node.ELEMENT_NODE || node.matches('script,style'))return;
    if(node.matches('input:not([type=password]):not([type=email]):not([type=url]),textarea')) { const next=latin(node.value); if(next!==node.value)node.value=next; }
    for(const child of node.childNodes)convertText(child);
  };
  document.addEventListener('input',event=>{
    const el=event.target;
    if(!el.matches('input:not([type=password]):not([type=email]):not([type=url]),textarea'))return;
    const next=latin(el.value);
    if(next!==el.value) { const start=el.selectionStart,end=el.selectionEnd;el.value=next;try{el.setSelectionRange(start,end);}catch{} }
    if(el.dataset.dateKind)el.setCustomValidity(parse(el.value,el.dataset.dateKind)===null?'استخدم الصيغة '+(el.dataset.dateKind==='date'?'DD/MM/YYYY':'DD/MM/YYYY HH:mm'):'');
  },true);
  function start() {
    convertText(document.body);
    new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')convertText(record.target);else for(const node of record.addedNodes)convertText(node);}}).observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.HiringDates={latin,format,parse,field};
})();
