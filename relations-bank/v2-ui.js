(() => {
'use strict';
const RB=window.RBV2;if(!RB)return;
const $=RB.$,$$=RB.$$;

function openLayer(html){
  const l=$('#v2ModalLayer');l.innerHTML=html;l.hidden=false;document.body.style.overflow='hidden';
  l.onclick=e=>{if(e.target===l||e.target.closest('[data-v2-close]'))closeLayer()};
}
function closeLayer(){const l=$('#v2ModalLayer');if(l){l.hidden=true;l.innerHTML=''}document.body.style.overflow=''}

function buildUI(){
  $('.hero')?.setAttribute('hidden','');$('.dashboard-section')?.setAttribute('hidden','');
  const main=$('main');if(!main)return;
  const hero=document.createElement('section');hero.className='v2-hero';hero.id='v2Home';
  hero.innerHTML=`<div class="shell"><span class="v2-kicker">V2 · بنك العلاقات والفرص</span><h1>ماذا تحتاج الآن؟</h1><p>ابدأ من الحاجة، ثم تبحث المنصة في شبكتك عن أفضل من يستطيع المساعدة ولماذا. أو أضف شخصا جديدا ودعه يبني ملفه وعلاقاته تدريجيا.</p><div class="v2-start-grid"><button class="v2-start primary" id="v2NewRequest"><small>REQUEST</small><strong>عندي طلب الآن</strong><span>جهة، صاحب قرار، معلومة، شراكة أو احتياج تجاري. اكتب الطلب كما تقوله عادة.</span></button><button class="v2-start" id="v2AddPerson"><small>NETWORK</small><strong>أضف أو حدّث شخصا</strong><span>ابدأ ببيانات قليلة ثم أكمل ملفه وأسئلته وعلاقاته مع الوقت.</span></button></div></div>`;
  main.insertBefore(hero,main.firstChild);
  const wrap=document.createElement('div');wrap.className='v2-wrap';wrap.id='v2Workspace';
  wrap.innerHTML=`<div class="shell">
  <section class="v2-section"><div class="v2-head"><div><span class="v2-label">محرك الطلبات</span><h2>الطلبات وما يقابلها داخل الشبكة</h2><p>ترتيب المرشحين يعتمد على الوصول الفعلي، القطاع، الجهة، قوة العلاقة وسجل المساعدة.</p></div><button class="v2-btn primary" id="v2RequestBtn">+ طلب جديد</button></div><div class="v2-request-grid" id="v2Requests"></div></section>
  <section class="v2-section"><div class="v2-head"><div><span class="v2-label">ملفات الذكاء العلاقاتية</span><h2>من يفيدنا في ماذا؟ وما الذي لا نعرفه عنه بعد؟</h2><p>اكتمال الملف يعتمد على جودة المعرفة والعلاقات، وليس عدد الخانات.</p></div><button class="v2-btn gold" id="v2PersonBtn">+ أضف/حدّث شخصا</button></div><div class="v2-profile-grid" id="v2Profiles"></div></section>
  <section class="v2-section"><div class="v2-head"><div><span class="v2-label">رؤية الشبكة</span><h2>العلاقات والفجوات</h2><p>أين عندك وصول فعلي؟ وأين تحتاج سؤالا جديدا أو تحديثا؟</p></div></div><div class="v2-insight-grid"><div class="v2-map" id="v2Map"></div><div class="v2-gap-list" id="v2Gaps"></div></div></section>
  </div>`;
  main.insertBefore(wrap,$('.workspace'));
  const layer=document.createElement('div');layer.className='v2-modal-layer';layer.id='v2ModalLayer';layer.hidden=true;document.body.appendChild(layer);
  $('#v2NewRequest').onclick=openRequest;$('#v2RequestBtn').onclick=openRequest;
  const openV1Person=()=>document.querySelector('[data-open="person"]')?.click();$('#v2AddPerson').onclick=openV1Person;$('#v2PersonBtn').onclick=openV1Person;
}

function openRequest(){
  openLayer(`<section class="v2-modal"><div class="v2-modal-head"><div><span class="v2-label">طلب جديد</span><h2>ماذا تحتاج الآن؟</h2></div><button class="v2-close" data-v2-close>×</button></div><form class="v2-form" id="v2RequestForm">
  <label class="wide"><span>اكتب الطلب كما تقوله عادة *</span><textarea name="title" rows="3" required placeholder="مثال: أحتاج شخصا يوصلني إلى مسؤول التسهيلات في بنك معين"></textarea></label>
  <label><span>الجهة المستهدفة</span><input name="target_org" placeholder="مثال: بنك"></label><label><span>القطاع</span><input name="target_sector" placeholder="مثال: بنوك وتمويل"></label>
  <label><span>المنصب أو نوع الشخص</span><input name="target_role" placeholder="مثال: مسؤول ائتمان"></label><label><span>المدينة</span><input name="city" placeholder="مثال: جدة"></label>
  <label><span>الأولوية</span><select name="urgency"><option value="normal">عادية</option><option value="high">عالية</option><option value="low">منخفضة</option></select></label>
  <label><span>المشاركة</span><select name="scope"><option value="private">خاص بي</option><option value="circle">متاح للدائرة</option></select></label>
  <label class="wide"><span>تفاصيل إضافية</span><textarea name="details" rows="3" placeholder="أي سياق يساعد في الترشيح"></textarea></label>
  <div class="v2-actions"><button class="v2-btn" type="button" data-v2-close>إلغاء</button><button class="v2-btn primary">احفظ وابحث في الشبكة</button></div></form></section>`);
  $('#v2RequestForm').onsubmit=saveRequest;
}
async function saveRequest(e){
  e.preventDefault();const f=new FormData(e.currentTarget),title=String(f.get('title')||'').trim();if(title.length<2)return;
  const row={id:RB.cloud?undefined:RB.uuid(),circle_id:RB.circleId||'local',created_by:RB.user?.id||'local',title,details:String(f.get('details')||'').trim(),target_org:String(f.get('target_org')||'').trim(),target_sector:String(f.get('target_sector')||'').trim(),target_role:String(f.get('target_role')||'').trim(),city:String(f.get('city')||'').trim(),urgency:f.get('urgency'),scope:f.get('scope'),status:'open'};if(!row.id)delete row.id;
  try{const saved=await RB.insert('rb_requests',row);RB.requests.unshift(saved);if(!RB.cloud)RB.saveLocal();closeLayer();renderAll();setTimeout(()=>document.querySelector('[data-v2-request="'+saved.id+'"]')?.scrollIntoView({behavior:'smooth',block:'center'}),80)}catch(err){console.error(err);alert('تعذر حفظ الطلب')}
}

function renderRequests(){
  const el=$('#v2Requests');if(!el)return;
  const open=RB.requests.filter(r=>!['closed','cancelled'].includes(r.status));
  if(!open.length){el.innerHTML='<div class="v2-note" style="grid-column:1/-1">ابدأ بأول طلب حقيقي. مثال: «أحتاج مدخلا إلى جهة معينة» أو «أبحث عن خبير في قطاع محدد».</div>';return}
  el.innerHTML=open.map(r=>{const ms=RB.matches(r).slice(0,3);return `<article class="v2-request-card" data-v2-request="${RB.esc(r.id)}"><h3>${RB.esc(r.title)}</h3><p>${RB.esc(r.details||'')}</p><div class="v2-request-meta">${r.target_org?'<span class="v2-chip gold">'+RB.esc(r.target_org)+'</span>':''}${r.target_sector?'<span class="v2-chip">'+RB.esc(r.target_sector)+'</span>':''}${r.target_role?'<span class="v2-chip">'+RB.esc(r.target_role)+'</span>':''}${r.city?'<span class="v2-chip">'+RB.esc(r.city)+'</span>':''}</div><div class="v2-matches">${ms.length?ms.map(m=>`<div class="v2-match"><div class="v2-score">${Math.min(99,m.score)}</div><div><strong>${RB.esc(m.person.name)}</strong><span>${RB.esc(m.factors.join(' · '))}</span></div><button class="v2-btn" data-v2-person="${RB.esc(m.person.id)}">افتح الملف</button></div>`).join(''):'<div class="v2-note">لا يوجد مسار قوي بعد. هذا الطلب أصبح فجوة شبكة وسيظهر ضمن الأسئلة القادمة.</div>'}</div></article>`}).join('');
  $$('[data-v2-person]',el).forEach(b=>b.onclick=()=>openPersonDetail(b.dataset.v2Person));
}
function renderProfiles(){
  const el=$('#v2Profiles');if(!el)return;
  if(!RB.people.length){el.innerHTML='<div class="v2-note">أضف أول شخص وابدأ بناء الشبكة.</div>';return}
  el.innerHTML=RB.people.slice(0,12).map(p=>{const c=RB.completeness(p.id),secs=RB.usefulSectors(p.id);return `<article class="v2-profile"><div class="v2-profile-top"><div style="display:flex;gap:9px"><div class="v2-avatar">${RB.esc(RB.initials(p.name))}</div><div><h3>${RB.esc(p.name)}</h3><div class="sub">${RB.esc(p.company||p.field||p.sector||'')}</div></div></div><button class="v2-btn" data-v2-open-person="${RB.esc(p.id)}">فتح</button></div><div class="v2-complete"><div class="v2-bar"><i style="width:${c.score}%"></i></div><div class="v2-bar-meta"><span>اكتمال الملف</span><b>${c.score}%</b></div></div><div class="v2-gaps">${secs.slice(0,2).map(x=>'<span class="v2-chip">'+RB.esc(x)+'</span>').join('')}${c.gaps.slice(0,2).map(x=>'<span class="v2-gap">ناقص: '+RB.esc(x)+'</span>').join('')}</div></article>`}).join('');
  $$('[data-v2-open-person]',el).forEach(b=>b.onclick=()=>openPersonDetail(b.dataset.v2OpenPerson));
}
function openPersonDetail(id){
  const p=RB.person(id),c=RB.completeness(id),rs=RB.rels(id),am=RB.answerMap(id),secs=RB.usefulSectors(id);
  openLayer(`<section class="v2-modal"><div class="v2-modal-head"><div><span class="v2-label">ملف الذكاء العلاقاتية</span><h2>${RB.esc(p.name)}</h2><div style="color:#6A7780;font-size:12px">${RB.esc([p.company,p.role_title||p.role,p.field||p.sector,p.city].filter(Boolean).join(' · '))}</div></div><button class="v2-close" data-v2-close>×</button></div><div class="v2-person-detail"><div class="v2-metric"><b>${c.score}%</b><span>اكتمال الملف</span></div><div class="v2-metric"><b>${rs.length}</b><span>علاقات موثقة</span></div><div class="v2-metric"><b>${secs.length?RB.esc(secs.join('، ')):'لم تتضح بعد'}</b><span>أين يمكن أن يفيد</span></div><div class="v2-metric"><b>${RB.pastScore(id)>0?'له سجل سابق':'لم يسجل بعد'}</b><span>ذاكرة النجاح</span></div></div><div class="v2-gaps" style="margin:14px 0">${c.gaps.map(g=>'<span class="v2-gap">السؤال التالي: '+RB.esc(g)+'</span>').join('')}</div><div class="v2-actions" style="justify-content:flex-start"><button class="v2-btn primary" id="v2UpdatePerson">أضف معلومة للشخص</button><button class="v2-btn" id="v2AddRelManual">أضف علاقة يدويا</button></div><h3 style="color:#0D3656;margin:18px 0 8px">العلاقات المثبتة</h3><div class="v2-list">${rs.length?rs.map(r=>{const s=RB.relationshipStrength(r);return `<div class="v2-rel"><strong>${RB.esc(r.target_org)} ${r.target_role?'· '+RB.esc(r.target_role):''}</strong><span>${RB.esc([r.sector,r.city,RB.strengthWord(s.score),...s.factors].filter(Boolean).join(' · '))}</span></div>`}).join(''):'<div class="v2-note">لم تسجل علاقات مفصلة بعد.</div>'}</div><h3 style="color:#0D3656;margin:18px 0 8px">ما الذي نعرفه عنه؟</h3><div class="v2-list">${Object.entries(am).length?Object.entries(am).map(([k,v])=>`<div class="v2-rel"><strong>${RB.esc(RB.questionLabel(k))}</strong><span>${RB.esc(typeof v==='string'?v:JSON.stringify(v))}</span></div>`).join(''):'<div class="v2-note">المقابلة الذاتية لم تبدأ بعد.</div>'}</div></section>`);
  $('#v2UpdatePerson').onclick=()=>{window.RBV2UI.closeLayer();document.querySelector('[data-open="knowledge"]')?.click();setTimeout(()=>{const s=document.getElementById('knowledgePersonSelect');if(s)s.value=id},60)};
  $('#v2AddRelManual').onclick=()=>openRelationship(id);
}
function openRelationship(personId){
  const p=RB.person(personId);
  openLayer(`<section class="v2-modal"><div class="v2-modal-head"><div><span class="v2-label">دليل علاقة</span><h2>ماذا يستطيع ${RB.esc(p.name)} الوصول إليه؟</h2></div><button class="v2-close" data-v2-close>×</button></div><form class="v2-form" id="v2RelForm"><input type="hidden" name="person_id" value="${RB.esc(personId)}"><label class="wide"><span>الجهة *</span><input name="target_org" required></label><label><span>الشخص إن كان معروفا</span><input name="target_person"></label><label><span>المنصب</span><input name="target_role"></label><label><span>القطاع</span><input name="sector"></label><label><span>المدينة</span><input name="city"></label><label><span>آخر تواصل</span><input type="date" name="last_contact_at"></label><label><span>تواصل مباشر؟</span><select name="direct_contact"><option value="false">لا</option><option value="true">نعم</option></select></label><label><span>يستطيع ترتيب لقاء؟</span><select name="can_request_meeting"><option value="false">لا</option><option value="true">نعم</option></select></label><label><span>سبق أن ساعد؟</span><select name="prior_help"><option value="false">لا</option><option value="true">نعم</option></select></label><label><span>المشاركة</span><select name="scope"><option value="owner">التعارف عن طريقي</option><option value="private">خاص بي</option><option value="circle">متاح للدائرة</option></select></label><div class="v2-actions"><button type="button" class="v2-btn" data-v2-close>إلغاء</button><button class="v2-btn primary">حفظ العلاقة</button></div></form></section>`);
  $('#v2RelForm').onsubmit=saveRelationship;
}
async function saveRelationship(e){
  e.preventDefault();const f=new FormData(e.currentTarget);const row={id:RB.cloud?undefined:RB.uuid(),circle_id:RB.circleId||'local',created_by:RB.user?.id||'local',person_id:String(f.get('person_id')),target_org:String(f.get('target_org')).trim(),target_person:String(f.get('target_person')).trim(),target_role:String(f.get('target_role')).trim(),sector:String(f.get('sector')).trim(),city:String(f.get('city')).trim(),relationship_type:'professional',last_contact_at:f.get('last_contact_at')||null,direct_contact:f.get('direct_contact')==='true',can_request_meeting:f.get('can_request_meeting')==='true',prior_help:f.get('prior_help')==='true',reciprocal:'unknown',confidence:'confirmed',scope:f.get('scope'),notes:''};if(!row.id)delete row.id;
  try{const saved=await RB.insert('rb_relationship_evidence',row);RB.relationships.unshift(saved);if(!RB.cloud)RB.saveLocal();closeLayer();renderAll()}catch(err){console.error(err);alert('تعذر حفظ العلاقة')}
}
function renderMap(){
  const map=$('#v2Map'),gaps=$('#v2Gaps');if(!map||!gaps)return;const top=RB.people.slice().sort((a,b)=>RB.rels(b.id).length-RB.rels(a.id).length)[0];
  if(!top){map.innerHTML='<h3>خريطة الشبكة</h3><p>تظهر بعد إضافة العلاقات.</p>';gaps.innerHTML='';return}
  const rs=RB.rels(top.id).slice(0,4);map.innerHTML=`<h3>مثال من الشبكة: ${RB.esc(top.name)}</h3><p>الخريطة قراءة سريعة؛ الأسماء الحساسة تظهر فقط حسب الصلاحية.</p><div class="v2-map-nodes"><div class="v2-node root">${RB.esc(top.name)}</div>${rs.map((r,i)=>'<div class="v2-node n'+(i+1)+'">'+RB.esc(r.target_org)+'</div>').join('')}</div>`;
  const x=[];RB.requests.filter(r=>r.status==='open').forEach(r=>{if(!RB.matches(r).length)x.push('لا يوجد وصول واضح لطلب: '+r.title)});RB.people.slice(0,8).forEach(p=>{const c=RB.completeness(p.id);if(c.score<50)x.push(p.name+': نحتاج '+c.gaps.slice(0,2).join(' و '))});
  gaps.innerHTML=x.slice(0,6).map(t=>'<div class="v2-gap-card"><strong>فجوة تستحق سؤالا</strong><span>'+RB.esc(t)+'</span></div>').join('')||'<div class="v2-gap-card"><strong>الشبكة جيدة حاليا</strong><span>أضف طلبا أو حدث ملفات الأشخاص لاكتشاف فجوات جديدة.</span></div>';
}
function renderAll(){renderRequests();renderProfiles();renderMap()}
buildUI();window.addEventListener('rbv2:data',renderAll);setTimeout(renderAll,300);
window.RBV2UI={openLayer,closeLayer,openRelationship,openPersonDetail,renderAll};
})();