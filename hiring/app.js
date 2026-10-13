(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => crypto.randomUUID();
  const clone = v => JSON.parse(JSON.stringify(v));
  const stages = {shortlisted:'قائمة مختصرة',screening:'فرز أولي',qualified:'مؤهل',interview:'مقابلة',assessment:'تقييم عملي',offer:'عرض',hired:'تم التعيين',closed:'مغلق'};
  const statuses = ['مقترح','بانتظار تأكيد','مؤكد','تمت المقابلة','إعادة جدولة'];
  const seedElement = $('offline-data');
  const offline = !!seedElement;
  const demo = !!seedElement && JSON.parse(seedElement.textContent).demo === true;
  let db, user = null, doc = null, currentJobId = '', currentView = 'candidates', selectedCandidate = '', selectedRound = '';
  let revision = 0, dirtyVersion = 0, savedVersion = 0, saveTimer, saving = null, loading = false, authMode = 'login', editKind = '', editId = '';
  const offlineKey = 'hiring-offline-v1-' + (seedElement ? (JSON.parse(seedElement.textContent).demo ? 'demo' : JSON.parse(seedElement.textContent).createdAt) : '');
  const job = () => doc?.jobs.find(j => j.id === currentJobId);
  const candidate = id => job()?.candidates.find(c => c.id === id);
  const round = () => candidate(selectedCandidate)?.interviews.find(r => r.id === selectedRound);
  const link = (url, label) => /^https?:\/\//i.test(url || '') ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : '';
  const message = (id, text, ok = false) => { $(id).textContent = text; $(id).classList.toggle('success', ok); };
  const stageOptions = value => Object.entries(stages).map(([k,v]) => `<option value="${k}" ${value===k?'selected':''}>${v}</option>`).join('');
  const selectOptions = (list, selected) => list.map(v => `<option ${v===selected?'selected':''}>${esc(v)}</option>`).join('');
  const sortedCandidates = () => [...(job()?.candidates || [])].sort((a,b) => (a.classification==='suitable'?0:1)-(b.classification==='suitable'?0:1));
  const latestScore = c => { const rounds = [...c.interviews].reverse(); for (const r of rounds) { const s = hiringScore(r.criteria, r.scores); if (s.complete) return s.score; } return null; };
  const displayDate = value => { if (!value) return 'لم يحدد موعد'; try { return new Intl.DateTimeFormat('ar-SA',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',calendar:'gregory',timeZone:'Asia/Riyadh'}).format(new Date(value + ':00+03:00')) + ' · الرياض'; } catch { return value; } };
  function changed() {
    dirtyVersion += 1;
    $('sync-status').textContent = offline ? 'تعديلات محلية' : 'تعديلات تنتظر الحفظ';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save().catch(e => message('workspace-message', e.message)), 900);
  }
  async function save() {
    if (!doc || dirtyVersion === savedVersion) return;
    if (saving) return saving;
    saving = (async () => {
      while (doc && dirtyVersion !== savedVersion) {
        const version = dirtyVersion;
        const snapshot = clone(doc);
        if (offline) {
          try { localStorage.setItem(offlineKey, JSON.stringify(snapshot)); } catch { throw new Error('تعذر الحفظ المحلي. نزّل نسخة HTML أو بيانات لحفظ تعديلاتك.'); }
        } else {
          if (!user) throw new Error('الجلسة انتهت. سجّل الدخول قبل الحفظ.');
          $('sync-status').textContent = 'جارٍ الحفظ في السحابة…';
          const {data,error} = await db.from('hiring_workspaces').update({document:snapshot,owner_id:user.id}).eq('account_email',user.email.toLowerCase()).eq('revision',revision).select('revision,updated_at');
          if (error) throw new Error('لم تحفظ التعديلات سحابيًا: ' + error.message);
          if (!data?.length) throw new Error('تعذر الحفظ لأن نسخة السحابة تغيرت أو الصلاحية انتهت. نزّل نسخة بيانات لحفظ تعديلاتك، ثم حدّث الصفحة للمراجعة.');
          revision = data[0].revision;
        }
        savedVersion = version;
      }
      $('sync-status').textContent = offline ? 'محفوظ محليًا · نزّل نسخة للاحتفاظ بها' : 'محفوظ في السحابة';
      message('workspace-message', offline ? 'الحفظ المحلي يعمل على هذا المتصفح. استخدم ملف HTML لنقل نسختك.' : 'تم حفظ التعديلات في حسابك.', true);
    })().finally(() => { saving = null; });
    return saving;
  }
  function showWorkspace() {
    $('auth').hidden = true; $('workspace').hidden = false; $('logout').hidden = offline;
    $('account-label').textContent = demo ? 'معاينة ببيانات افتراضية · التعديلات لا ترفع للسحابة' : offline ? 'نسخة HTML محلية · البيانات: 13 أكتوبر 2026' : user.email;
    $('footer-mode').textContent = demo ? 'نسخة تجريبية · بيانات افتراضية' : offline ? 'نسخة محلية قابلة للتعديل' : 'حفظ سحابي خاص';
    currentJobId = currentJobId || doc.jobs[0]?.id || '';
    renderAll();
  }
  function clearWorkspace() {
    clearTimeout(saveTimer); doc = null; user = null; dirtyVersion = savedVersion = 0;
    $('workspace').hidden = true; $('auth').hidden = false; $('logout').hidden = true;
    for (const id of ['candidate-list','qualification-list','interview-editor','ad-content','stats']) $(id).replaceChildren();
    $('account-label').textContent = ''; $('sync-status').textContent = 'تسجيل دخول مطلوب';
  }
  async function loadWorkspace(authUser) {
    if (loading) return;
    loading = true;
    try {
      const {data:userData,error:userError} = await db.auth.getUser();
      if (userError || !userData.user) throw new Error('تعذر التحقق من الحساب. حاول تسجيل الدخول مجددًا.');
      user = userData.user;
      const {data,error} = await db.from('hiring_workspaces').select('document,revision,account_email').limit(1);
      if (error) throw new Error('تعذر تحميل المساحة: ' + error.message);
      if (!data?.length) throw new Error('لا توجد مساحة مفعّلة لهذا البريد بعد. إن كان هذا هو البريد المحدد، فقد يكون استيراد البيانات ما زال بانتظار الموافقة.');
      if (!validDocument(data[0].document)) throw new Error('بنية بيانات المساحة غير صالحة. لم يتم استبدالها.');
      doc = data[0].document; revision = data[0].revision; dirtyVersion = savedVersion = 0;
      $('sync-status').textContent = 'متصل بالسحابة'; message('auth-message',''); showWorkspace();
    } catch (e) { message('auth-message',e.message); $('logout').hidden = !user; } finally { loading = false; }
  }
  function renderStats() {
    const j = job(); if (!j) { $('stats').innerHTML=''; return; }
    const suitable = j.candidates.filter(c=>c.classification==='suitable').length;
    $('stats').innerHTML = [[j.candidates.length,'مرشحًا'],[suitable,'مناسب'],[j.candidates.length-suitable,'ربما'],[j.candidates.filter(c=>c.interviews.some(r=>hiringScore(r.criteria,r.scores).complete)).length,'تقييم مكتمل']].map(([n,t])=>`<div class="stat"><b>${n}</b><span>${t}</span></div>`).join('');
  }
  function renderAll() {
    if (!doc.jobs.some(j=>j.id===currentJobId)) currentJobId = doc.jobs[0]?.id || '';
    $('job-select').innerHTML = doc.jobs.map(j=>`<option value="${esc(j.id)}" ${j.id===currentJobId?'selected':''}>${esc(j.title)}</option>`).join('');
    $('stage-filter').innerHTML = '<option value="all">جميع المراحل</option>'+stageOptions('');
    renderStats(); renderCandidates(); renderQualification(); renderInterviews(); renderAd(); switchView(currentView);
  }
  function switchView(view) {
    currentView=view;
    for (const v of ['candidates','qualification','interviews','ad','guide']) $('view-'+v).hidden=v!==view;
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  }
  function renderCandidates() {
    const query=$('candidate-search').value.trim().toLocaleLowerCase(), cls=$('class-filter').value, stage=$('stage-filter').value;
    $('candidate-list').innerHTML = sortedCandidates().map((c,i)=>({c,i})).filter(({c})=>(cls==='all'||c.classification===cls)&&(stage==='all'||c.stage===stage)&&(!query||(c.nameAr+' '+c.nameEn+' '+c.sourceName).toLocaleLowerCase().includes(query))).map(({c,i})=>{
      const score=latestScore(c), suspicious=!!c.phoneNote;
      const phoneHtml=/^\+[1-9]\d{6,14}$/.test(c.phone)&&!suspicious?`<a class="ltr" href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`:`<bdi dir="ltr" class="ltr">${esc(c.phone||'غير متوفر')}</bdi>`;
      return `<article class="candidate" data-id="${esc(c.id)}"><div class="candidate-top"><span class="number">${i+1}</span><div class="candidate-name"><h3>${esc(c.nameAr||'اسم عربي يحتاج تأكيدًا')}</h3><div class="english" lang="en" dir="ltr">${esc(c.nameEn)}</div><small>${esc(c.city)}</small></div><span class="badge ${c.classification==='suitable'?'suitable':'maybe'}">${c.classification==='suitable'?'مناسب':'ربما'}</span></div><div class="candidate-body"><div><span class="cell-label">الجوال</span>${phoneHtml}${c.phoneNote?`<div class="phone-note">${esc(c.phoneNote)}</div>`:''}</div><div><span class="cell-label">البريد الإلكتروني</span>${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)?`<a href="mailto:${esc(c.email)}" class="ltr">${esc(c.email)}</a>`:`<span class="ltr">${esc(c.email||'غير متوفر')}</span>`}<div class="candidate-links">${link(c.profileUrl,'الملف الشخصي')}${link(c.applicationUrl,'طلب LinkedIn')}</div></div><div><label>موعد المقابلة المقترح<input type="datetime-local" dir="ltr" data-candidate="${esc(c.id)}" data-field="scheduledAt" value="${esc(c.scheduledAt)}"></label><small>${esc(displayDate(c.scheduledAt))}</small></div></div><div class="candidate-footer"><label>حالة الموعد<select data-candidate="${esc(c.id)}" data-field="meetingStatus">${selectOptions(statuses,c.meetingStatus)}</select></label><span class="result">${esc(stages[c.stage]||c.stage)} · ${score==null?'لم يكتمل تقييم المقابلة':score+' / 100'}</span><div class="actions"><button data-action="edit-candidate" data-id="${esc(c.id)}">تحرير</button><button data-action="qualify" data-id="${esc(c.id)}">تأهيل</button><button class="primary" data-action="assess" data-id="${esc(c.id)}">تقييم المقابلة</button></div></div></article>`;
    }).join('') || '<div class="empty">لا يوجد مرشحون مطابقون للفلاتر. يمكنك إضافة مرشح لهذا الإعلان.</div>';
  }
  function renderQualification() {
    const j=job(); if(!j)return;
    $('pipeline').innerHTML=Object.entries(stages).map(([id,name])=>`<div>${name}<b>${j.candidates.filter(c=>c.stage===id).length}</b></div>`).join('');
    $('qualification-list').innerHTML=sortedCandidates().map((c,i)=>`<details class="panel qualification" id="qualification-${esc(c.id)}"><summary>${i+1}. ${esc(c.nameAr)} · <bdi dir="ltr">${esc(c.nameEn)}</bdi></summary><div class="qualification-grid">${j.requirements.map(req=>`<label>${esc(req.name)}${req.required?'':' · مفضّل'}<select data-candidate="${esc(c.id)}" data-qualification="${esc(req.id)}"><option value="unknown">يحتاج تحققًا</option><option value="yes" ${c.qualifications[req.id]==='yes'?'selected':''}>تم التحقق: مستوفى</option><option value="no" ${c.qualifications[req.id]==='no'?'selected':''}>تم التحقق: غير مستوفى</option><option value="na" ${c.qualifications[req.id]==='na'?'selected':''}>غير منطبق</option></select></label>`).join('')}<label>مرحلة المتابعة<select data-candidate="${esc(c.id)}" data-field="stage">${stageOptions(c.stage)}</select></label></div><label>دليل التأهيل وما يحتاج متابعة<textarea data-candidate="${esc(c.id)}" data-field="qualificationNotes">${esc(c.qualificationNotes)}</textarea></label><p class="notice">اختيار المرحلة يدوي. الدرجة لا تقرر الاستبعاد أو التعيين تلقائيًا.</p><small>${c.history.slice(0,4).map(h=>esc(h.at.slice(0,10)+' · '+h.text)).join('<br>')}</small></details>`).join('')||'<div class="empty">أضف مرشحين لهذا الإعلان لبدء التأهيل.</div>';
  }
  function renderInterviews() {
    const list=sortedCandidates();
    if(!list.some(c=>c.id===selectedCandidate))selectedCandidate=list[0]?.id||'';
    $('interview-candidate').innerHTML=list.map(c=>`<option value="${esc(c.id)}" ${c.id===selectedCandidate?'selected':''}>${esc(c.nameAr)} — ${esc(c.nameEn)}</option>`).join('');
    const c=candidate(selectedCandidate);
    if(!c){$('round-select').innerHTML='';$('interview-editor').innerHTML='<div class="empty">لا يوجد مرشحون لهذا الإعلان.</div>';return;}
    if(!c.interviews.some(r=>r.id===selectedRound))selectedRound=c.interviews.at(-1)?.id||'';
    $('round-select').innerHTML=c.interviews.map((r,i)=>`<option value="${esc(r.id)}" ${r.id===selectedRound?'selected':''}>${esc(r.label||'المقابلة '+(i+1))} · ${esc(r.interviewer||'لم يحدد المقابل')}</option>`).join('');
    const r=round();
    if(!r){$('interview-editor').innerHTML='<div class="empty">لم يبدأ تقييم هذا المرشح بعد. اضغط «إضافة مقابلة» لإنشاء نموذج مستقل.</div>';return;}
    $('interview-editor').innerHTML=`<div class="panel"><h2>${esc(c.nameAr)} <bdi dir="ltr">${esc(c.nameEn)}</bdi></h2><div class="interview-header"><label>اسم المقابل<input data-round-field="interviewer" value="${esc(r.interviewer)}"></label><label>اسم أو نوع المقابلة<input data-round-field="label" value="${esc(r.label)}"></label><label>وقت المقابلة الفعلي (الرياض)<input type="datetime-local" dir="ltr" data-round-field="actualAt" value="${esc(r.actualAt)}"></label><label>توصية المقابل<select data-round-field="decision">${selectOptions(['لم تحدد','متابعة للمرحلة التالية','يحتاج تحققًا إضافيًا','مقترح للعرض','غير مناسب وفق أدلة المقابلة'],r.decision||'لم تحدد')}</select></label></div><div id="score-summary" class="score-summary"></div><p class="notice">محاور هذه المقابلة نسخة من معايير الإعلان عند إنشائها. تعديل الإعلان لاحقًا لا يغيّر هذا السجل.</p>${r.criteria.map(cr=>`<section class="criterion"><div class="criterion-head"><h3>${esc(cr.name)}</h3><span class="badge maybe">${Number(cr.weight)} وزن</span></div><p class="question">${esc(cr.question)}</p><div class="anchors"><div><b>١ · غير كافٍ</b>${esc(cr.weak)}</div><div><b>٣ · المتوقع</b>${esc(cr.adequate)}</div><div><b>٥ · قوي</b>${esc(cr.strong)}</div></div><div class="criterion-controls"><label>الدرجة<select data-score="${esc(cr.id)}"><option value="">غير مقيم</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${Number(r.scores[cr.id])===n?'selected':''}>${n} / 5</option>`).join('')}</select></label><label>الدليل من الإجابة أو التمرين<textarea data-evidence="${esc(cr.id)}" placeholder="ما الذي قاله أو نفذه المرشح؟">${esc(r.evidence[cr.id]||'')}</textarea></label></div></section>`).join('')}<div class="interview-tail"><label>نقاط القوة وما يحتاج تحققًا<textarea data-round-field="summary">${esc(r.summary)}</textarea></label><label>الخطوة التالية وسبب التوصية<textarea data-round-field="nextStep">${esc(r.nextStep)}</textarea></label></div><small>أُنشئ السجل: <bdi dir="ltr">${esc(r.createdAt)}</bdi>. التوصية قرار للمقابل، وليست قرارًا آليًا.</small></div>`;
    updateScore();
  }
  function updateScore() {
    const r=round(); if(!r||!$('score-summary'))return;
    const score=hiringScore(r.criteria,r.scores), evidenceCount=r.criteria.filter(cr=>String(r.evidence[cr.id]||'').trim()).length;
    $('score-summary').innerHTML=`<div><b>${score.complete?score.score:'—'}</b><small>${score.complete?'درجة موزونة من ١٠٠':'تقييم غير مكتمل'}</small></div><div>${score.assessed} / ${score.total} محاور مقيمة<small>${evidenceCount} / ${r.criteria.length} محاور موثقة بأدلة</small><small>لا يتحول المجموع إلى قبول أو رفض تلقائي.</small></div>`;
    renderStats();
  }
  function addRound() {
    const c=candidate(selectedCandidate);if(!c){message('workspace-message','أضف مرشحًا أولًا.');return;}
    const r={id:uid(),label:'المقابلة '+(c.interviews.length+1),interviewer:'',actualAt:'',criteria:clone(job().criteria),scores:{},evidence:{},decision:'لم تحدد',summary:'',nextStep:'',createdAt:new Date().toISOString()};
    c.interviews.push(r);selectedRound=r.id;changed();renderInterviews();
  }
  function renderAd() {
    const j=job();if(!j){$('ad-content').innerHTML='<div class="empty">أنشئ إعلانًا جديدًا.</div>';return;}
    $('ad-content').innerHTML=`<span class="eyebrow dark">الإعلان الوظيفي</span><h2>${esc(j.title)}</h2><p dir="ltr" lang="en">${esc(j.titleEn)}</p><p>${esc(j.company)} · ${esc(j.location)} · ${esc(j.employment)}</p><p><span class="badge maybe">${esc(j.status)}</span> · آخر موعد في نص الإعلان: <bdi dir="ltr">${esc(j.deadline||'لم يحدد')}</bdi></p><div class="actions">${link(j.sourceUrl,'الإعلان في المصدر')}<button data-action="edit-job">تحرير الإعلان</button><button data-action="download-ad">تنزيل الإعلان HTML</button></div><hr><div class="ad-text">${j.description.split('\n').map(line=>line?`<p dir="${/[\u0600-\u06ff]/.test(line)?'rtl':'ltr'}" lang="${/[\u0600-\u06ff]/.test(line)?'ar':'en'}">${esc(line)}</p>`:'<br>').join('')}</div>`;
  }
  function input(name,label,value='',type='text',all=false) { return `<label class="${all?'span-all':''}">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${['email','url','datetime-local'].includes(type)?'dir="ltr"':''}></label>`; }
  function openEditor(kind,id='') {
    editKind=kind;editId=id;message('editor-message','');
    if(kind==='candidate') {
      const c=candidate(id)||{};$('editor-title').textContent=id?'تحرير المرشح':'إضافة مرشح';
      $('editor-fields').innerHTML=input('nameAr','الاسم بالعربية',c.nameAr)+input('nameEn','الاسم بالإنجليزية / المصدر',c.nameEn)+input('city','الموقع',c.city)+`<label>التصنيف<select name="classification"><option value="suitable" ${c.classification==='suitable'?'selected':''}>مناسب</option><option value="maybe" ${c.classification!=='suitable'?'selected':''}>ربما</option></select></label>`+input('phone','الجوال كما ورد',c.phone)+input('email','البريد',c.email,'email')+input('profileUrl','رابط الملف الشخصي',c.profileUrl,'url')+input('applicationUrl','رابط طلب التقديم',c.applicationUrl,'url')+input('scheduledAt','موعد المقابلة المقترح — الرياض',c.scheduledAt,'datetime-local')+input('phoneNote','ملاحظة التحقق من الرقم',c.phoneNote)+`<label class="span-all">ملاحظات<textarea name="notes">${esc(c.notes)}</textarea></label>${c.sourcePhone?`<small class="span-all">البيانات الأصلية محفوظة: <bdi dir="ltr">${esc(c.sourcePhone)} · ${esc(c.sourceEmail)}</bdi></small>`:''}`;
    } else {
      const original=job();const j=kind==='newjob'?{title:'',titleEn:'',company:original?.company||'',location:'',employment:'',status:'مسودة',deadline:'',sourceUrl:'',description:'',criteria:clone(original?.criteria||[]),requirements:clone(original?.requirements||[])}:original;
      $('editor-title').textContent=kind==='newjob'?'إعلان جديد':'تحرير الإعلان والمعايير';
      $('editor-fields').innerHTML=input('title','المسمى بالعربية',j.title)+input('titleEn','المسمى بالإنجليزية',j.titleEn)+input('company','الشركة',j.company)+input('location','الموقع ونمط العمل',j.location)+input('employment','نوع الدوام',j.employment)+input('status','حالة الإعلان',j.status)+input('deadline','آخر موعد',j.deadline,'date')+input('sourceUrl','رابط المصدر',j.sourceUrl,'url')+`<label class="span-all">نص الإعلان باللغتين<textarea name="description" rows="12" dir="auto">${esc(j.description)}</textarea></label><label class="span-all">متطلبات التأهيل — كل سطر متطلب؛ اكتب «مفضّل» للشرط غير الإلزامي<textarea name="requirements">${esc(j.requirements.map(r=>r.name+(r.required?'':' (مفضّل)')).join('\n'))}</textarea></label><h3 class="span-all">نموذج التقييم لهذا الإعلان</h3><p class="notice span-all">تُطبّع الأوزان إلى ١٠٠٪. تعديلها يطبق على المقابلات الجديدة فقط. عدّل الأسئلة لتناسب كل إعلان.</p>${j.criteria.map((cr,i)=>`<section class="criterion-edit span-all" data-criterion-index="${i}" data-id="${esc(cr.id)}">${input('cr'+i+'name','المحور',cr.name)}${input('cr'+i+'weight','الوزن',cr.weight,'number')}<label class="span-all">السؤال<textarea name="cr${i}question">${esc(cr.question)}</textarea></label>${input('cr'+i+'weak','مؤشرات درجة ١',cr.weak,'text',true)}${input('cr'+i+'adequate','مؤشرات درجة ٣',cr.adequate,'text',true)}${input('cr'+i+'strong','مؤشرات درجة ٥',cr.strong,'text',true)}</section>`).join('')}`;
    }
    $('editor').showModal();
  }
  function applyEditor(event) {
    event.preventDefault();const data=new FormData($('editor-form')), get=k=>String(data.get(k)||'').trim();
    if(editKind==='candidate') {
      if(!get('nameEn')&&!get('nameAr')){message('editor-message','أدخل اسم المرشح.');return;}
      let c=candidate(editId);
      if(!c){c={id:uid(),sourceName:get('nameEn'),sourcePhone:get('phone'),sourceEmail:get('email'),nameNote:'بإدخال المستخدم',stage:'shortlisted',meetingStatus:'مقترح',qualifications:{},qualificationNotes:'',interviews:[],history:[]};job().candidates.push(c);}
      for(const key of ['nameAr','nameEn','city','classification','phone','email','profileUrl','applicationUrl','scheduledAt','phoneNote','notes'])c[key]=get(key);
    } else {
      if(!get('title')){message('editor-message','أدخل المسمى الوظيفي.');return;}
      const base=job(), criteria=[];
      for(const section of $('editor-fields').querySelectorAll('[data-criterion-index]')){const i=section.dataset.criterionIndex;criteria.push({id:section.dataset.id,name:get('cr'+i+'name'),weight:Number(get('cr'+i+'weight')),question:get('cr'+i+'question'),weak:get('cr'+i+'weak'),adequate:get('cr'+i+'adequate'),strong:get('cr'+i+'strong')});}
      if(!criteria.length||criteria.some(cr=>!cr.name||!cr.question||!Number.isFinite(cr.weight)||cr.weight<0)||!criteria.some(cr=>cr.weight>0)){message('editor-message','أكمل أسماء المحاور والأسئلة، واستخدم أوزانًا غير سالبة ومجموعًا أكبر من صفر.');return;}
      const requirements=get('requirements').split('\n').map(s=>s.trim()).filter(Boolean).map((name,i)=>({id:base?.requirements.find(r=>name.replace(/\s*\(مفضّل\)/g,'').trim()===r.name.replace(/\s*\(مفضّل\)/g,'').trim())?.id||'req-'+uid(),name:name.replace(/\s*\(مفضّل\)/g,''),required:!name.includes('مفضّل')&&!name.includes('مفضل')}));
      let j=base;if(editKind==='newjob'){j={id:uid(),candidates:[]};doc.jobs.push(j);currentJobId=j.id;}
      for(const key of ['title','titleEn','company','location','employment','status','deadline','sourceUrl','description'])j[key]=get(key);j.criteria=criteria;j.requirements=requirements;
    }
    changed();$('editor').close();renderAll();
  }
  function validDocument(value) {
    return value?.schemaVersion===1&&Array.isArray(value.jobs)&&value.jobs.length<=100&&value.jobs.every(j=>typeof j.id==='string'&&typeof j.title==='string'&&typeof j.description==='string'&&Array.isArray(j.criteria)&&j.criteria.length<=30&&j.criteria.every(cr=>typeof cr.id==='string'&&typeof cr.name==='string'&&Number.isFinite(Number(cr.weight))&&Number(cr.weight)>=0)&&Array.isArray(j.requirements)&&Array.isArray(j.candidates)&&j.candidates.length<=3000&&j.candidates.every(c=>typeof c.id==='string'&&typeof c.nameAr==='string'&&typeof c.nameEn==='string'&&Array.isArray(c.interviews)&&c.interviews.every(r=>Array.isArray(r.criteria)&&r.scores&&r.evidence)));
  }
  function download(content,type,name) { const objectUrl=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=objectUrl;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),10000); }
  async function standaloneHtml() {
    const getSource=async(id,isStyle=false)=>{const el=$(id);const url=isStyle?el.href:el.src;return url?await fetch(url).then(r=>{if(!r.ok)throw new Error('تعذر إعداد ملف HTML: '+r.status);return r.text();}):el.textContent;};
    const [css,scoring,app]=await Promise.all([getSource('styles-source',true),getSource('scoring-source'),getSource('app-source')]);
    const root=document.documentElement.cloneNode(true);root.querySelectorAll('script').forEach(s=>s.remove());root.querySelector('#styles-source').remove();
    const scriptSafe=s=>s.replace(/<\/script/gi,'<\\/script');
    const style=document.createElement('style');style.id='styles-source';style.textContent=css;root.querySelector('head').append(style);
    const seed=document.createElement('script');seed.id='offline-data';seed.type='application/json';seed.textContent=JSON.stringify(doc).replace(/</g,'\\u003c');root.querySelector('body').append(seed);
    const scoreScript=document.createElement('script');scoreScript.id='scoring-source';scoreScript.textContent=scriptSafe(scoring);root.querySelector('body').append(scoreScript);
    const appScript=document.createElement('script');appScript.id='app-source';appScript.textContent=scriptSafe(app);root.querySelector('body').append(appScript);
    return '<!doctype html>\n'+root.outerHTML;
  }
  $('auth-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!db){message('auth-message','تعذر تحميل خدمة الحساب. تحقق من الاتصال وحدّث الصفحة.');return;}
    const email=$('auth-email').value.trim(),password=$('auth-password').value;$('auth-submit').disabled=true;message('auth-message','جارٍ التحقق…');
    try {
      if(authMode==='signup') {const {error}=await db.auth.signUp({email,password});if(error)throw error;message('auth-message','أُرسل تأكيد البريد إن كان التسجيل متاحًا. افتح رسالة التحقق ثم عد إلى هذا الرابط واختر «تسجيل الدخول».',true);}
      else {const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;message('auth-message','تم الدخول، جارٍ تحميل المساحة…',true);}
      $('auth-password').value='';
    } catch(e){message('auth-message','تعذر إكمال الدخول: '+e.message);}finally{$('auth-submit').disabled=false;}
  });
  $('auth-mode').addEventListener('click',()=>{authMode=authMode==='login'?'signup':'login';$('auth-title').textContent=authMode==='login'?'تسجيل الدخول':'إنشاء حساب بالبريد';$('auth-submit').textContent=authMode==='login'?'دخول إلى المساحة':'إنشاء الحساب وإرسال التحقق';$('auth-mode').textContent=authMode==='login'?'إنشاء حساب':'العودة إلى تسجيل الدخول';$('auth-password').autocomplete=authMode==='login'?'current-password':'new-password';message('auth-message','');});
  $('logout').addEventListener('click',async()=>{try{await save();const {error}=await db.auth.signOut();if(error)throw error;clearWorkspace();}catch(e){message('workspace-message',e.message);}});
  $('save-now').addEventListener('click',()=>save().catch(e=>message('workspace-message',e.message)));
  $('job-select').addEventListener('change',()=>{currentJobId=$('job-select').value;selectedCandidate=selectedRound='';$('candidate-search').value='';renderAll();});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='qualification')renderQualification();if(b.dataset.view==='interviews')renderInterviews();switchView(b.dataset.view);}));
  for(const id of ['candidate-search','class-filter','stage-filter'])$(id).addEventListener('input',renderCandidates);
  $('add-candidate').addEventListener('click',()=>openEditor('candidate'));
  $('new-job').addEventListener('click',()=>openEditor('newjob'));
  $('edit-job').addEventListener('click',()=>openEditor('job'));
  $('clone-job').addEventListener('click',()=>{const original=job();if(!original)return;const copy=clone(original);copy.id=uid();copy.title+=' — نسخة';copy.status='مسودة';copy.candidates=[];doc.jobs.push(copy);currentJobId=copy.id;changed();renderAll();openEditor('job');});
  $('editor-form').addEventListener('submit',applyEditor);
  for(const id of ['close-editor','cancel-editor'])$(id).addEventListener('click',()=>$('editor').close());
  document.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;const id=button.dataset.id,action=button.dataset.action;
    if(action==='edit-candidate')openEditor('candidate',id);
    if(action==='edit-job')openEditor('job');
    if(action==='qualify'){renderQualification();switchView('qualification');const el=$('qualification-'+id);el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});}
    if(action==='assess'){selectedCandidate=id;selectedRound='';renderInterviews();switchView('interviews');if(!candidate(id).interviews.length)addRound();$('view-interviews').scrollIntoView({behavior:'smooth',block:'start'});}
    if(action==='download-ad'){const j=job();download(`<!doctype html><html lang="ar-SA" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(j.title)}</title><style>body{max-width:850px;margin:40px auto;padding:24px;font:17px/1.9 Tahoma,Arial}h1{color:#0d3656}p{white-space:pre-wrap}p[dir=ltr]{text-align:left}</style><h1>${esc(j.title)}</h1>${j.description.split('\n').map(s=>`<p dir="${/[\u0600-\u06ff]/.test(s)?'rtl':'ltr'}">${esc(s)}</p>`).join('')}</html>`,'text/html;charset=utf-8','job-ad.html');}
  });
  document.addEventListener('input',event=>{const el=event.target;if(!doc)return;
    if(el.dataset.candidate){const c=candidate(el.dataset.candidate);if(!c)return;if(el.dataset.field){if(el.dataset.field==='stage'){c.history.unshift({at:new Date().toISOString(),text:'المرحلة: '+stages[el.value]});c.history=c.history.slice(0,50);}c[el.dataset.field]=el.value;}if(el.dataset.qualification)c.qualifications[el.dataset.qualification]=el.value;changed();if(el.dataset.field==='scheduledAt')el.closest('div').querySelector('small').textContent=displayDate(el.value);}
    const r=round();if(!r)return;
    if(el.dataset.score){r.scores[el.dataset.score]=el.value?Number(el.value):'';changed();updateScore();}
    if(el.dataset.evidence){r.evidence[el.dataset.evidence]=el.value;changed();updateScore();}
    if(el.dataset.roundField){r[el.dataset.roundField]=el.value;changed();}
  });
  $('interview-candidate').addEventListener('change',()=>{selectedCandidate=$('interview-candidate').value;selectedRound='';renderInterviews();});
  $('round-select').addEventListener('change',()=>{selectedRound=$('round-select').value;renderInterviews();});
  $('new-round').addEventListener('click',addRound);
  $('export-json').addEventListener('click',()=>download(JSON.stringify(doc,null,2),'application/json;charset=utf-8','hiring-workspace.json'));
  $('export-html').addEventListener('click',async()=>{try{download(await standaloneHtml(),'text/html;charset=utf-8','hiring-workspace.html');message('workspace-message','تم تجهيز نسخة HTML مستقلة تحتوي على بياناتك وتعديلاتك.',true);}catch(e){message('workspace-message',e.message);}});
  $('import-json').addEventListener('click',()=>$('import-file').click());
  $('import-file').addEventListener('change',async()=>{try{const file=$('import-file').files[0];if(!file)return;if(file.size>2e6)throw new Error('الحد الأقصى للنسخة ٢ ميغابايت.');const imported=JSON.parse(await file.text());if(doc.jobs.length+(imported.jobs?.length||0)>100)throw new Error('الحد الأقصى ١٠٠ إعلان.');if(!validDocument(imported))throw new Error('ملف البيانات لا يطابق نموذج مساحة التوظيف.');let added=0;for(const j of imported.jobs){if(doc.jobs.some(existing=>existing.id===j.id)){const copy=clone(j);copy.id=uid();copy.title+=' — مستورد';doc.jobs.push(copy);}else doc.jobs.push(j);added++;}if(doc.jobs.length>100)throw new Error('الحد الأقصى ١٠٠ إعلان.');changed();renderAll();message('workspace-message','أضيف '+added+' إعلانًا من النسخة دون استبدال الإعلانات الحالية.',true);}catch(e){message('workspace-message',e.message);}finally{$('import-file').value='';}});
  window.addEventListener('beforeunload',event=>{if(dirtyVersion!==savedVersion){event.preventDefault();event.returnValue='';}});
  async function init() {
    if(offline){doc=JSON.parse(seedElement.textContent);try{const saved=JSON.parse(localStorage.getItem(offlineKey));if(validDocument(saved))doc=saved;}catch{}$('sync-status').textContent='نسخة محلية';showWorkspace();return;}
    if(!window.supabase?.createClient){message('auth-message','تعذر تحميل خدمة الحساب. تحقق من الاتصال ثم حدّث الصفحة.');return;}
    db=window.supabase.createClient('https://iyqtrbpamoslemjdsqcg.supabase.co','sb_publishable_yiknaa_5w5jPszTw_oxrZw_kgBHNCyX',{auth:{storageKey:'hiring-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},global:{fetch:async(input,options={})=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{return await fetch(input,{...options,signal:controller.signal});}finally{clearTimeout(timer);}}}});
    db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){clearWorkspace();return;}if(event==='SIGNED_IN'&&!doc)setTimeout(()=>loadWorkspace(session.user),0);});
    const {data}=await db.auth.getSession();if(data.session)await loadWorkspace(data.session.user);
  }
  init().catch(e=>message('auth-message',e.message));
})();
