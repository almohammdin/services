(() => {
  'use strict';
  const labels = {proposed:'موعد مقترح',invited:'بانتظار موافقة المرشح',confirmed:'موعد مؤكد',arrived:'حضر المرشح',completed:'تمت المقابلة',reschedule_requested:'طلب تأجيل',rescheduled:'أعيدت الجدولة',no_show:'لم يحضر',cancelled:'ملغى'};
  const colors = {proposed:'#475569',invited:'#1d4ed8',confirmed:'#15803d',arrived:'#0e7490',completed:'#334155',reschedule_requested:'#b45309',rescheduled:'#7e22ce',no_show:'#be123c',cancelled:'#71717a'};
  const symbols = {proposed:'◇',invited:'↗',confirmed:'✓',arrived:'●',completed:'✓✓',reschedule_requested:'◷',rescheduled:'↻',no_show:'!',cancelled:'×'};
  const closed = new Set(['completed','no_show','cancelled']);
  const next = {proposed:['invited','cancelled','reschedule_requested'],invited:['confirmed','reschedule_requested','no_show','cancelled'],confirmed:['arrived','reschedule_requested','no_show','cancelled'],arrived:['completed','reschedule_requested','cancelled'],reschedule_requested:['cancelled'],rescheduled:['invited','reschedule_requested','cancelled']};
  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id = () => crypto.randomUUID();
  const stamp = start => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start||'') ? Date.parse(start+':00+03:00') : NaN;
  const dayOf = ms => new Date(ms+10800000).toISOString().slice(0,10);
  const today = () => dayOf(Date.now());
  const addDays = (day,n) => dayOf(stamp(day+'T00:00')+n*86400000);
  const end = a => stamp(a.start)+Number(a.durationMin)*60000;
  const blockEnd = a => end(a)+Number(a.bufferMin||0)*60000;
  const records = doc => (doc?.jobs||[]).flatMap(job=>(job.candidates||[]).flatMap(candidate=>(candidate.appointments||[]).map(a=>({job,candidate,a}))));
  const history = (a,text) => { (a.history ||= []).unshift({at:new Date().toISOString(),text}); };
  function primary(c) {
    const list=[...(c.appointments||[])].sort((a,b)=>stamp(a.start)-stamp(b.start));
    const active=list.filter(a=>!closed.has(a.status));
    return active.find(a=>end(a)>=Date.now())||active.at(-1)||list.at(-1);
  }
  function sync(c) { const a=primary(c); c.scheduledAt=a?.start||''; c.meetingStatus=a?labels[a.status]:'لم يحدد موعد'; }
  function ensure(doc) {
    let changed=false;
    const legacy={'مقترح':'proposed','بانتظار تأكيد':'invited','مؤكد':'confirmed','تمت المقابلة':'completed','إعادة جدولة':'reschedule_requested'};
    for(const j of doc.jobs)for(const c of j.candidates) {
      if(Array.isArray(c.appointments))continue;
      c.appointments=[];changed=true;
      if(Number.isFinite(stamp(c.scheduledAt))) c.appointments.push({id:'legacy-'+j.id+'-'+c.id,start:c.scheduledAt,durationMin:45,bufferMin:15,status:legacy[c.meetingStatus]||'proposed',title:'المقابلة الأولى',interviewer:'نايف المحمدي',mode:'video',location:'',notes:'',history:[{at:new Date().toISOString(),text:'نقل الموعد المحفوظ إلى لوحة المواعيد؛ لم ترسل دعوة جديدة.'}],createdAt:new Date().toISOString()});
      sync(c);
    }
    return changed;
  }
  function conflicts(list) {
    const active=list.filter(r=>!closed.has(r.a.status)&&Number.isFinite(stamp(r.a.start))).sort((a,b)=>stamp(a.a.start)-stamp(b.a.start));
    const result=[];
    for(let i=0;i<active.length;i++)for(let k=i+1;k<active.length;k++) {
      const x=active[i],y=active[k];
      if(stamp(y.a.start)>=blockEnd(x.a))break;
      result.push({x,y,kind:stamp(y.a.start)<end(x.a)?'overlap':'buffer',tentative:[x.a.status,y.a.status].some(s=>['proposed','reschedule_requested','rescheduled'].includes(s))});
    }
    return result;
  }
  function onDay(a,day) { const from=stamp(day+'T00:00');return stamp(a.start)<from+86400000&&end(a)>from; }
  function clashes(doc,a,excluded='') {
    return conflicts([...records(doc).filter(r=>r.a.id!==excluded),{job:{},candidate:{},a}]).filter(p=>p.x.a===a||p.y.a===a);
  }
  function validate(a) {
    if(!Number.isFinite(stamp(a.start))||window.HiringDates.parse(window.HiringDates.format(a.start),'datetime')!==a.start)return 'أدخل تاريخًا ووقتًا صحيحين بالأرقام الإنجليزية.';
    if(!Number.isInteger(a.durationMin)||a.durationMin<10||a.durationMin>480)return 'مدة المقابلة من 10 إلى 480 دقيقة.';
    if(!Number.isInteger(a.bufferMin)||a.bufferMin<0||a.bufferMin>120)return 'الفاصل بعد المقابلة من 0 إلى 120 دقيقة.';
    if(a.mode==='video'&&a.location&&!/^https?:\/\//i.test(a.location))return 'اكتب رابط اجتماع يبدأ بـ https:// أو اتركه فارغًا.';
    return '';
  }
  function revise(a,values,reason='') {
    if(closed.has(a.status))throw new Error('هذا موعد مغلق. أضف مقابلة جديدة للمتابعة.');
    const modified=['start','durationMin','mode','location'].some(k=>a[k]!==values[k]);
    if(modified) {
      history(a,'تعديل الموعد: '+window.HiringDates.format(a.start)+' ← '+window.HiringDates.format(values.start)+(reason?' · '+reason:''));
      a.previousStart=a.start;
      if(a.status!=='proposed') { a.status='rescheduled'; a.confirmedAt=null; a.inviteSentAt=null; a.arrivedAt=null; }
    }
    for(const key of ['start','durationMin','bufferMin','title','interviewer','mode','location','notes'])if(Object.prototype.hasOwnProperty.call(values,key))a[key]=values[key];a.updatedAt=new Date().toISOString();
  }
  function transition(a,status,reason='') {
    if(!next[a.status]?.includes(status))throw new Error('أكمل المرحلة السابقة أولًا.');
    if(['reschedule_requested','cancelled'].includes(status)&&!reason.trim())throw new Error('اكتب سبب التأجيل أو الإلغاء في ملاحظات الموعد.');
    if(['arrived','completed','no_show'].includes(status)&&stamp(a.start)>Date.now()+15*60000)throw new Error('هذا الموعد في المستقبل. سجّل الحضور أو النتيجة عند وقت المقابلة.');
    if(status==='no_show'&&end(a)>Date.now())throw new Error('انتظر انتهاء وقت المقابلة قبل تسجيل عدم الحضور.');
    a.status=status;a.updatedAt=new Date().toISOString();
    const field={invited:'inviteSentAt',confirmed:'confirmedAt',arrived:'arrivedAt',completed:'completedAt',no_show:'noShowAt',cancelled:'cancelledAt',reschedule_requested:'rescheduleRequestedAt'}[status];
    if(field)a[field]=a.updatedAt;
    history(a,labels[status]+(reason?' · '+reason:''));
  }
  function invitation(r) {
    const a=r.a;
    return 'مرحبًا '+(r.candidate.nameAr||r.candidate.nameEn)+',\n\nندعوك إلى '+(a.title||'مقابلة')+' لوظيفة «'+r.job.title+'».\nالموعد: '+window.HiringDates.format(a.start)+'\nالتوقيت: الرياض (UTC+03:00)\nالمدة: '+a.durationMin+' دقيقة\nنوع المقابلة: '+({video:'عن بُعد — اتصال مرئي',phone:'اتصال هاتفي',onsite:'حضور شخصي'}[a.mode]||a.mode)+(a.location?'\n'+(a.mode==='video'?'رابط الاجتماع: ':'التفاصيل: ')+a.location:'\nسيتم تأكيد تفاصيل الاتصال قبل المقابلة.')+'\n\nنرجو الرد لتأكيد مناسبة الموعد، أو اقتراح وقت بديل إذا تعذر الحضور.\n\nمع التحية،\n'+(a.interviewer||'نايف المحمدي');
  }
  let api,selectedDay='',jobFilter='all',statusFilter='all',editing=null,inviting=null;
  const $=name=>document.getElementById(name);
  const button=(action,text,r,extra='')=>`<button type="button" data-schedule="${action}" ${r?`data-appointment="${esc(r.a.id)}"`:''} ${extra}>${text}</button>`;
  const badge=a=>`<span class="appointment-status" data-status="${esc(a.status)}" style="--status-color:${colors[a.status]||colors.proposed}"><span class="status-symbol" aria-hidden="true">${symbols[a.status]||symbols.proposed}</span>${esc(labels[a.status]||a.status)}</span>`;
  function pairText(p,a) {
    const other=p.x.a.id===a?.id?p.y:p.x;
    return (p.kind==='overlap'?'تداخل مقابلات':'الفاصل غير كافٍ')+' · '+(other.candidate.nameAr||other.candidate.nameEn||'موعد آخر')+' · '+window.HiringDates.format(other.a.start);
  }
  function find(appointmentId) {return records(api.doc()).find(r=>r.a.id===appointmentId);}
  function dateLabel(day) {return new Intl.DateTimeFormat('ar-SA',{weekday:'long',day:'numeric',month:'long',year:'numeric',calendar:'gregory',numberingSystem:'latn',timeZone:'Asia/Riyadh'}).format(new Date(stamp(day+'T12:00')));}
  function timeline(list,allConflicts) {
    if(!list.length)return '<div class="empty">لا توجد مقابلات في هذا اليوم.</div>';
    const from=stamp(selectedDay+'T00:00'),positions=list.map(r=>({r,start:Math.max(0,(stamp(r.a.start)-from)/60000),end:Math.min(1440,(end(r.a)-from)/60000),buffer:Math.min(1440,(blockEnd(r.a)-from)/60000)}));
    const low=Math.max(0,Math.floor(Math.min(...positions.map(p=>p.start))/60)*60-60),high=Math.min(1440,Math.ceil(Math.max(...positions.map(p=>p.buffer))/60)*60+60);
    const x=n=>45+(n-low)/(high-low)*740,h=45+positions.length*43;
    const danger=new Set(allConflicts.filter(p=>p.kind==='overlap').flatMap(p=>[p.x.a.id,p.y.a.id]));
    const ticks=[];for(let t=low;t<=high;t+=60)ticks.push(`<line x1="${x(t)}" y1="28" x2="${x(t)}" y2="${h-10}" stroke="#e3dfd7"/><text x="${x(t)}" y="18" text-anchor="middle" class="chart-time">${String(Math.floor(t/60)).padStart(2,'0')}:00</text>`);
    return `<div class="timeline-scroll"><svg class="schedule-timeline" viewBox="0 0 1100 ${h}" role="img" aria-label="الرسم الزمني للمقابلات في ${esc(dateLabel(selectedDay))}" dir="ltr">${positions.map((p,i)=>`<rect x="16" y="${30+i*43}" width="1068" height="43" fill="${i%2?'#edf2f7':'#ffffff'}"/><line x1="16" x2="1084" y1="${73+i*43}" y2="${73+i*43}" stroke="#dce3eb"/>`).join('')}${ticks.join('')}${positions.map(({r,start,end:finish,buffer},i)=>{const y=37+i*43;return `<g data-schedule="edit" data-appointment="${esc(r.a.id)}" tabindex="0" role="button" aria-label="${esc(r.candidate.nameAr+' '+window.HiringDates.format(r.a.start)+' '+labels[r.a.status])}"><title>${esc(r.candidate.nameAr+' · '+window.HiringDates.format(r.a.start)+' · '+r.a.durationMin+' دقيقة · '+labels[r.a.status])}</title><rect x="${x(start)}" y="${y}" width="${Math.max(3,x(finish)-x(start))}" height="25" rx="5" fill="${colors[r.a.status]||colors.proposed}" ${danger.has(r.a.id)?'stroke="#b52e2e" stroke-width="3"':''}/>${buffer>finish?`<rect x="${x(finish)}" y="${y+4}" width="${x(buffer)-x(finish)}" height="17" rx="3" fill="${colors[r.a.status]||colors.proposed}" fill-opacity=".13" stroke="${colors[r.a.status]||colors.proposed}" stroke-dasharray="4 3"/>`:''}<text x="1075" y="${y+17}" text-anchor="start" direction="rtl" class="chart-name">${esc((r.candidate.nameAr||r.candidate.nameEn).slice(0,36))}</text><text x="${x(start)+4}" y="${y+18}" fill="#fff" font-family="Arial" font-size="12">${symbols[r.a.status]||symbols.proposed}</text></g>`;}).join('')}</svg></div>`;
  }
  function render() {
    const doc=api?.doc();if(!doc)return;
    const all=records(doc),now=Date.now();
    if(!selectedDay)selectedDay=all.filter(r=>!closed.has(r.a.status)&&end(r.a)>=now).sort((a,b)=>stamp(a.a.start)-stamp(b.a.start))[0]?.a.start.slice(0,10)||today();
    if(jobFilter!=='all'&&!doc.jobs.some(j=>j.id===jobFilter))jobFilter='all';
    const base=all.filter(r=>jobFilter==='all'||r.job.id===jobFilter);
    const list=base.filter(r=>onDay(r.a,selectedDay)&&(statusFilter==='all'||r.a.status===statusFilter)).sort((a,b)=>stamp(a.a.start)-stamp(b.a.start));
    const pairs=conflicts(all),dayPairs=pairs.filter(p=>(onDay(p.x.a,selectedDay)||onDay(p.y.a,selectedDay))&&(jobFilter==='all'||p.x.job.id===jobFilter||p.y.job.id===jobFilter));
    const active=base.filter(r=>!closed.has(r.a.status));
    $('schedule-dashboard').innerHTML=`<div class="section-head"><div><h2>لوحة المواعيد</h2><p>توقيت الرياض · التداخل يُفحص بين جميع الإعلانات</p></div>${button('new','اقتراح موعد',null,'class="primary"')}</div><div class="schedule-metrics">${[[active.filter(r=>onDay(r.a,today())).length,'مواعيد اليوم'],[active.filter(r=>stamp(r.a.start)>=now&&stamp(r.a.start)<now+7*86400000).length,'خلال 7 أيام'],[active.filter(r=>['invited','rescheduled'].includes(r.a.status)).length,'بانتظار الموافقة'],[base.filter(r=>r.a.status==='completed').length,'مقابلات تمت'],[pairs.filter(p=>jobFilter==='all'||p.x.job.id===jobFilter||p.y.job.id===jobFilter).length,'تنبيهات تعارض']].map(([n,t],i)=>`<div class="schedule-metric ${i===4&&n?'danger':''}"><b>${n}</b><span>${t}</span></div>`).join('')}</div><div class="schedule-filters"><label>اليوم${window.HiringDates.field(selectedDay,'data-schedule-day="true"','date')}</label><div class="actions day-navigation">${button('prev','اليوم السابق')}${button('today','اليوم')}${button('next','اليوم التالي')}</div><label>الإعلان<select id="schedule-job"><option value="all">جميع الإعلانات</option>${doc.jobs.map(j=>`<option value="${esc(j.id)}" ${jobFilter===j.id?'selected':''}>${esc(j.title)}</option>`).join('')}</select></label><label>حالة الموعد<select id="schedule-filter"><option value="all">جميع الحالات</option>${Object.entries(labels).map(([s,t])=>`<option value="${s}" ${statusFilter===s?'selected':''}>${t}</option>`).join('')}</select></label></div><div class="panel"><div class="section-head"><h3>${esc(dateLabel(selectedDay))}</h3><small>الجزء المتقطع = فاصل بعد المقابلة</small></div>${timeline(list,pairs)}<div class="schedule-legend">${Object.entries(labels).map(([s,t])=>`<span><i style="background:${colors[s]}" aria-hidden="true"></i><b aria-hidden="true">${symbols[s]}</b>${t}</span>`).join('')}</div></div>${dayPairs.length?`<div class="conflict-panel" role="status"><h3>تعارضات تحتاج مراجعة</h3>${dayPairs.map(p=>`<div>${button('edit',p.kind==='overlap'?'تداخل وقت':'فاصل غير كافٍ',p.x)}<span>${esc(p.x.candidate.nameAr)} و${esc(p.y.candidate.nameAr)} · <bdi dir="ltr">${esc(window.HiringDates.format(p.x.a.start))}</bdi> / <bdi dir="ltr">${esc(window.HiringDates.format(p.y.a.start))}</bdi>${p.tentative?' · ضمن مواعيد غير مؤكدة':''}</span></div>`).join('')}</div>`:''}<section class="day-agenda" aria-label="مقابلات اليوم"><div class="section-head"><h3>مقابلات اليوم <span class="agenda-count">${list.length}</span></h3><small>مرتبة حسب وقت البداية · توقيت الرياض</small></div><div class="appointment-columns" aria-hidden="true"><span>المرشح والمقابلة</span><span>الوقت والمدة</span><span>حالة الموعد</span><span>الإجراءات</span></div><div class="appointment-list">${list.map(r=>row(r,pairs)).join('')||'<div class="empty">لا توجد مواعيد تطابق الاختيار.</div>'}</div></section><details class="schedule-insights"><summary>ملخص الأسبوع وحالات المواعيد</summary><div class="schedule-bottom"><div class="panel"><h3>المواعيد خلال 7 أيام</h3><div class="week-bars">${Array.from({length:7},(_,i)=>{const d=addDays(selectedDay,i),n=active.filter(r=>onDay(r.a,d)).length,max=Math.max(1,...Array.from({length:7},(_,k)=>active.filter(r=>onDay(r.a,addDays(selectedDay,k))).length));return `<button data-schedule="day" data-day="${d}" aria-label="${esc(dateLabel(d))}، ${n} مواعيد"><b>${n}</b><span class="week-bar" style="height:${Math.max(2,n/max*50)}px"></span><small dir="ltr">${d.slice(8,10)}/${d.slice(5,7)}</small></button>`;}).join('')}</div></div><div class="panel"><h3>حالات المواعيد</h3><div class="status-bars">${Object.entries(labels).map(([s,t])=>{const n=base.filter(r=>r.a.status===s).length;return n?`<div><span>${t}</span><i style="width:${Math.max(3,n/Math.max(1,base.length)*100)}%;background:${colors[s]}"></i><b>${n}</b></div>`:'';}).join('')||'<small>لا توجد مواعيد بعد.</small>'}</div></div></div></details>`;
  }
  function row(r,pairs) {
    const a=r.a,has=pairs.some(p=>p.x.a.id===a.id||p.y.a.id===a.id);
    return `<article class="appointment-row${has?' has-conflict':''}"><div class="appointment-person"><h3>${esc(r.candidate.nameAr||r.candidate.nameEn)} <small lang="en" dir="ltr">${esc(r.candidate.nameEn)}</small></h3><p>${esc(r.job.title)} · ${esc(a.title)}</p></div><div class="appointment-time"><bdi dir="ltr">${esc(a.start.slice(11,16))} <span class="time-end">– ${new Date(end(a)+10800000).toISOString().slice(11,16)}</span></bdi><small>${a.durationMin} دقيقة + ${a.bufferMin} دقيقة فاصل</small></div><div>${badge(a)}${has?'<small class="conflict-text">يوجد تعارض</small>':''}</div><div class="actions">${button('edit','إدارة الموعد',r)}${['proposed','invited','rescheduled'].includes(a.status)?button('invite','تجهيز الدعوة',r):''}${button('assess','التقييم',r)}</div></article>`;
  }
  function open(jobId='',candidateId='',appointmentId='') {
    const doc=api.doc();if(!doc)return;
    const r=appointmentId?find(appointmentId):null;
    const j=r?.job||doc.jobs.find(j=>j.id===jobId)||doc.jobs.find(j=>j.id===jobFilter)||doc.jobs[0];
    if(!j){api.message('أنشئ إعلانًا ومرشحًا أولًا.');return;}
    const c=r?.candidate||j.candidates.find(c=>c.id===candidateId)||j.candidates[0];
    if(!c){api.message('أضف مرشحًا لهذا الإعلان أولًا.');return;}
    editing={jobId:j.id,candidateId:c.id,id:r?.a.id||'',draft:r?.a||{start:(selectedDay||today())+'T10:00',durationMin:45,bufferMin:15,title:'المقابلة '+((c.appointments?.length||0)+1),interviewer:'نايف المحمدي',mode:'video',location:'',notes:'',status:'proposed'}};
    renderEditor();$('schedule-editor').showModal();
  }
  function renderEditor() {
    const doc=api.doc(),j=doc.jobs.find(j=>j.id===editing.jobId),c=j.candidates.find(c=>c.id===editing.candidateId),a=editing.draft,isClosed=closed.has(a.status);
    const input=(key,label,value,type='text')=>`<label>${label}<input name="${key}" type="${type}" value="${esc(value)}" ${type==='number'?'dir="ltr" lang="en"':''}></label>`;
    $('schedule-editor').innerHTML=`<form id="schedule-form"><div class="section-head"><h2>${editing.id?'إدارة الموعد':'اقتراح مقابلة'}</h2>${button('close','×',null,'aria-label="إغلاق"')}</div>${!editing.id?`<div class="form-grid"><label>الإعلان<select id="appointment-job">${doc.jobs.map(job=>`<option value="${esc(job.id)}" ${job.id===j.id?'selected':''}>${esc(job.title)}</option>`).join('')}</select></label><label>المرشح<select id="appointment-candidate">${j.candidates.map(ca=>`<option value="${esc(ca.id)}" ${ca.id===c.id?'selected':''}>${esc(ca.nameAr)} — ${esc(ca.nameEn)}</option>`).join('')}</select></label></div>`:`<h3>${esc(c.nameAr)} <bdi dir="ltr">${esc(c.nameEn)}</bdi></h3><p>${esc(j.title)}</p>`}<div class="appointment-progress">${['proposed','invited','confirmed','arrived','completed'].map((s,i)=>`<span class="${a.status===s?'current':''}"><b>${i+1}</b>${labels[s]}</span>`).join('')}</div>${badge(a)}<fieldset ${isClosed?'disabled':''} class="form-grid appointment-fields">${input('title','اسم المقابلة',a.title)}${input('interviewer','المقابل',a.interviewer)}<label>الموعد — الرياض (UTC+03:00)${window.HiringDates.field(a.start,'name="start" required')}</label><div class="form-grid">${input('durationMin','المدة بالدقائق',a.durationMin,'number')}${input('bufferMin','الفاصل بعد المقابلة',a.bufferMin,'number')}</div><label>نوع المقابلة<select name="mode">${[['video','مرئية عن بُعد'],['phone','هاتفية'],['onsite','حضور شخصي']].map(([v,t])=>`<option value="${v}" ${a.mode===v?'selected':''}>${t}</option>`).join('')}</select></label>${input('location','رابط الاجتماع أو المكان / تفاصيل الاتصال',a.location)}<label class="span-all">ملاحظات / سبب التأجيل أو الإلغاء<textarea name="notes">${esc(a.notes)}</textarea></label></fieldset><div id="appointment-conflicts" class="notice" hidden></div><p id="schedule-message" class="message" role="status"></p><div class="actions appointment-actions">${!isClosed?'<button type="submit" class="primary">تطبيق التعديل</button>':''}${(next[a.status]||[]).map(s=>button('status',({invited:'تجهيز الدعوة',confirmed:'تسجيل موافقة المرشح',arrived:'تسجيل الحضور',completed:'إكمال المقابلة',reschedule_requested:'تسجيل طلب التأجيل',no_show:'تسجيل عدم الحضور',cancelled:'إلغاء الموعد'})[s],{a},`data-status="${s}"`)).join('')}${editing.id?button('followup','مقابلة جديدة لنفس المرشح',{a})+button('assess','فتح التقييم',{a}):''}</div>${a.status==='rescheduled'?'<p class="notice">الموعد تغيّر. أرسل الدعوة الجديدة ثم سجّل موافقة المرشح من جديد.</p>':''}${a.status==='reschedule_requested'?'<p class="notice">عدّل التاريخ أو الوقت مع السبب لتحديد موعد بديل.</p>':''}${a.history?.length?`<details class="appointment-history"><summary>سجل المتابعة (${a.history.length})</summary>${a.history.map(h=>`<p><bdi dir="ltr">${esc(window.HiringDates.format(new Date(Date.parse(h.at)+10800000).toISOString().slice(0,16)))}</bdi> · ${esc(h.text)}</p>`).join('')}</details>`:''}</form>`;
    $('schedule-form').elements.durationMin.min='10';$('schedule-form').elements.durationMin.max='480';$('schedule-form').elements.bufferMin.min='0';$('schedule-form').elements.bufferMin.max='120';previewConflicts();
  }
  function formValues() {
    const f=$('schedule-form'),get=k=>String(f.elements.namedItem(k).value||'').trim();
    return {start:window.HiringDates.parse(get('start'),'datetime'),durationMin:Number(get('durationMin')),bufferMin:Number(get('bufferMin')),title:get('title'),interviewer:get('interviewer'),mode:get('mode'),location:get('location'),notes:get('notes')};
  }
  function previewConflicts() {
    if(!editing||!api.doc())return;
    const a={...editing.draft,...formValues()},pairs=clashes(api.doc(),a,editing.id);
    $('appointment-conflicts').hidden=!pairs.length;
    $('appointment-conflicts').textContent=pairs.map(p=>pairText(p,a)).join('\n');
  }
  function apply(close=true) {
    const values=formValues(),error=validate(values);if(error)throw new Error(error);
    const doc=api.doc(),j=doc.jobs.find(j=>j.id===editing.jobId),c=j?.candidates.find(c=>c.id===editing.candidateId);if(!c)throw new Error('المرشح غير موجود.');
    if(editing.id) {
      const a=c.appointments.find(a=>a.id===editing.id);revise(a,values,values.notes);editing.draft=a;
    } else {
      const a={id:id(),...values,status:'proposed',createdAt:new Date().toISOString(),history:[]};history(a,'اقتراح موعد');c.appointments.push(a);editing.id=a.id;editing.draft=a;
    }
    sync(c);api.changed();api.refresh();if(close)$('schedule-editor').close();return find(editing.id);
  }
  function invite(r) {
    if(!r||!['proposed','invited','rescheduled'].includes(r.a.status))throw new Error('جهّز الدعوة من الموعد المقترح أو بعد إعادة الجدولة.');
    const errors=clashes(api.doc(),r.a,r.a.id);if(errors.length)throw new Error('عدّل الموعد أو الفاصل قبل إرسال الدعوة: '+errors.map(p=>pairText(p,r.a)).join('؛ '));
    inviting=r.a.id;
    const subject='دعوة مقابلة — '+r.job.title,text=invitation(r),email=r.candidate.email;
    $('invitation-editor').innerHTML=`<div class="section-head"><h2>دعوة المقابلة</h2>${button('close-invite','×',null,'aria-label="إغلاق"')}</div><label>المستلم<bdi dir="ltr">${esc(email||'لم يسجل بريد المرشح')}</bdi></label><label>نص الدعوة<textarea id="invitation-text" rows="13">${esc(text)}</textarea></label><p class="notice">بعد إرسال الدعوة بنفسك، اضغط «تسجيل إرسال الدعوة». لا تتغير الحالة عند فتح البريد أو نسخ النص.</p><div class="actions">${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email||'')?`<a class="button-link" id="invitation-mail" href="mailto:${esc(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}">فتح البريد للإرسال</a>`:''}${button('copy-invite','نسخ النص')}${button('sent','تسجيل إرسال الدعوة',r,'class="primary"')}</div><p id="invitation-message" class="message" role="status"></p>`;
    $('invitation-editor').showModal();
  }
  function status(r,value) {
    if(!r)throw new Error('حدد موعدًا أولًا.');
    if(['invited','confirmed'].includes(value)) {const p=clashes(api.doc(),r.a,r.a.id);if(p.length)throw new Error('حل تعارض الموعد أولًا: '+p.map(p=>pairText(p,r.a)).join('؛ '));}
    if(value==='invited'&&r.a.status==='invited'){history(r.a,'تسجيل إعادة إرسال الدعوة');r.a.inviteSentAt=new Date().toISOString();}
    else transition(r.a,value,r.a.notes||'');
    sync(r.candidate);api.changed();api.refresh();
  }
  function clear() {selectedDay='';jobFilter=statusFilter='all';editing=inviting=null;for(const name of ['schedule-dashboard','schedule-editor','invitation-editor']){const el=$(name);if(el?.open)el.close();el?.replaceChildren();}}
  function bind(callbacks) {
    api=callbacks;
    document.addEventListener('submit',e=>{if(e.target.id!=='schedule-form')return;e.preventDefault();try{apply();}catch(error){$('schedule-message').textContent=error.message;}});
    document.addEventListener('input',e=>{if(e.target.closest('#schedule-form')&&e.target.tagName!=='SELECT')previewConflicts();if(e.target.dataset.scheduleDay==='true'){const d=window.HiringDates.parse(e.target.value,'date');if(d){selectedDay=d;render();}}if(e.target.id==='invitation-text'){const r=find(inviting),anchor=$('invitation-mail');if(anchor&&r)anchor.href='mailto:'+r.candidate.email+'?subject='+encodeURIComponent('دعوة مقابلة — '+r.job.title)+'&body='+encodeURIComponent(e.target.value);}});
    document.addEventListener('change',e=>{
      if(e.target.id==='schedule-job'){jobFilter=e.target.value;render();}if(e.target.id==='schedule-filter'){statusFilter=e.target.value;render();}
      if(e.target.id==='appointment-job'){const j=api.doc().jobs.find(j=>j.id===e.target.value);if(!j?.candidates.length){$('schedule-message').textContent='أضف مرشحًا لهذا الإعلان أولًا.';e.target.value=editing.jobId;return;}editing.draft={...editing.draft,...formValues()};editing.jobId=j.id;editing.candidateId=j.candidates[0].id;renderEditor();}
      if(e.target.id==='appointment-candidate'){editing.candidateId=e.target.value;}
      if(e.target.closest('#schedule-form')&&e.target.name==='mode')previewConflicts();
    });
    document.addEventListener('keydown',e=>{const el=e.target.closest('g[data-schedule]');if(el&&['Enter',' '].includes(e.key)){e.preventDefault();el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
    document.addEventListener('click',async e=>{
      const el=e.target.closest('[data-schedule]');if(!el||!api.doc())return;
      const action=el.dataset.schedule,r=find(el.dataset.appointment||'');
      try {
        if(action==='new')open();
        if(action==='edit')open(r?.job.id,r?.candidate.id,r?.a.id);
        if(action==='followup'){const old={...editing};$('schedule-editor').close();open(old.jobId,old.candidateId);}
        if(action==='close')$('schedule-editor').close();if(action==='close-invite')$('invitation-editor').close();
        if(action==='today'){selectedDay=today();render();}if(action==='prev'||action==='next'){selectedDay=addDays(selectedDay,action==='prev'?-1:1);render();}if(action==='day'){selectedDay=el.dataset.day;render();}
        if(action==='invite')invite(r);
        if(action==='status') {const current=apply(false);if(el.dataset.status==='invited')invite(current);else status(current,el.dataset.status);renderEditor();}
        if(action==='sent') {status(find(inviting),'invited');$('invitation-editor').close();if($('schedule-editor').open)renderEditor();}
        if(action==='copy-invite'){await navigator.clipboard.writeText($('invitation-text').value);$('invitation-message').textContent='تم نسخ الدعوة.';$('invitation-message').classList.add('success');}
        if(action==='assess'&&r){$('schedule-editor').close();api.assess(r);}
      }catch(error){const target=$('invitation-editor').open?'invitation-message':$('schedule-editor').open?'schedule-message':null;if(target)$(target).textContent=error.message;else api.message(error.message);}
    });
  }
  window.HiringSchedule={labels,colors,closed,records,stamp,end,blockEnd,today,addDays,ensure,primary,sync,conflicts,clashes,onDay,validate,revise,transition,invitation,bind,render,open,clear};
})();
