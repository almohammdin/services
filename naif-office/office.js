(function(){
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
 home:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 files:'<path d="M3 7h7l2 2h9v10H3zM4 7V4h6l2 2h7"/>',
 team:'<circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2M16 5a3 3 0 0 1 0 6m2 3q4 1 4 6"/>',
 council:'<path d="m3 9 9-6 9 6H3zm2 11h14M6 11v6m6-6v6m6-6v6"/>',
 editor:'<path d="m13 5 6 6M4 20l5-1L21 7l-4-4L5 15zM12 21h9"/>',
 meeting:'<path d="M3 8h18v12H3zM8 8V5h8v3M3 12q9 5 18 0M10 13v2h4v-2"/>',
 log:'<path d="M5 4h14v17H5zM8 9h8m-8 4h8m-8 4h5"/>',
 arrow:'<path d="M20 12H4m6-6-6 6 6 6"/>',plus:'<path d="M12 5v14M5 12h14"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v3"/>',edit:'<path d="m4 20 4-1L20 7l-3-3L5 16z"/>'
};
const icon=k=>`<svg viewBox="0 0 24 24" class="icon" aria-hidden="true">${icons[k]||icons.files}</svg>`;
const nav=[['home','الرئيسية'],['files','ملفات العمل'],['log','سجل القرارات'],['team','الفريق']];
const rooms={
 meeting:{name:'اجتماع عميل',desc:'حضّر أسئلتك ونطاق العمل قبل اللقاء.',example:'اجتماع تشخيص احتياجات منشأة عائلية',instruction:'جهز أسئلة الاجتماع مرتبة حسب الأولوية، ثم صغ نطاق العمل والقرارات المطلوب حسمها.'},
 council:{name:'مجلس المستشارين',desc:'اختبر البدائل قبل اعتماد القرار.',example:'هندسة المجالس داخل «مجالس» أو كمنتج مستقل؟',instruction:'قيّم البدائل من زاويتك. اذكر التوصية ودليلها وأقوى اعتراض والمعلومة التي قد تغير رأيك.'},
 editor:{name:'غرفة التحرير',desc:'حوّل الخبر أو السؤال إلى محتوى بصوتك.',example:'قراءة قرار يهم أصحاب المطاعم',instruction:'ابدأ بالمصدر الأصلي وحدد الجمهور المشمول ثم اقترح تعليق X ونقاط تصوير للسناب. ميز بين الواقعة والرأي.'}
};
const labels={title:'عنوان الملف',brief:'التكليف',owner:'المسؤول',status:'حالة الملف',client:'العميل والحضور',questions:'أسئلة الاجتماع',notes:'ما اتفقنا عليه',scope:'نطاق العمل المقترح',url:'رابط جلسة الوكيل',optionA:'البديل الأول',optionB:'البديل الثاني',customer:'رأي مستشار العميل',product:'رأي مستشار المنتج',execution:'رأي مستشار التنفيذ',objection:'أقوى اعتراض',choice:'القرار المعتمد',reason:'سبب الاختيار',assumption:'الافتراض الذي يعتمد عليه القرار',review:'موعد المراجعة',outcome:'نتيجة المراجعة',source:'رابط المصدر الأصلي',finding:'ما الذي يثبته المصدر؟',angle:'رأي نايف',post:'تعليق X',snap:'نقاط تصوير السناب',metric:'نتيجة النشر وأسئلة الجمهور',next:'الخطوة التالية'};
const statusList=['قيد التحضير','للمراجعة','مكتمل'];
const prefix='naif-office.v1.';const itemPrefix=prefix+'file.';
const baseTeam=[{id:'f',name:'فوزة',role:'تنسيق التكليفات وتجميع النتائج'},...Array.from({length:6},(_,i)=>({id:'g'+i,name:'وكيل قروك '+(i+1),role:'أضف تخصص الوكيل'})),{id:'c',name:'كلود',role:'التنفيذ التقني وتطوير النماذج'}];
function read(key,fallback){const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value)}
function team(){return baseTeam.map(a=>({...a,...read(prefix+'agent.'+a.id,{})}))}
function records(){return Object.keys(localStorage).filter(k=>k.startsWith(itemPrefix)).map(k=>read(k,null)).filter(r=>r&&rooms[r.type]).sort((a,b)=>b.updated.localeCompare(a.updated))}
const now=()=>new Date().toISOString();
const date=(d,opts={})=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn',{month:'short',day:'numeric',...opts}).format(new Date(d));
const agentUrl=a=>{const fallback=a.id==='f'?'https://chatgpt.com/':a.id==='c'?'https://claude.ai/':'https://grok.com/';try{const u=new URL(a.url||fallback);return u.protocol==='https:'?u.href:fallback}catch{return fallback}};
const atDay=d=>new Date(d+'T12:00:00');
const freshId=()=>crypto.randomUUID?.()||'n'+Date.now().toString(36)+Math.random().toString(36).slice(2);
function flash(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>$('#toast').classList.remove('show'),3200)}
function modal(title,html){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=html;if(!$('#dlg').open)$('#dlg').showModal()}
function close(){if($('#dlg').open)$('#dlg').close()}
function field(key,value='',type='textarea',wide=false,required=false,placeholder=''){
 const attrs=`name="${key}" id="f-${key}" ${required?'required':''} placeholder="${esc(placeholder)}"`;
 const ctl=type==='textarea'?`<textarea ${attrs}>${esc(value)}</textarea>`:`<input ${attrs} type="${type}" value="${esc(value)}">`;
 return `<label class="field ${wide?'wide':''}"><span>${labels[key]||key}</span>${ctl}</label>`
}
function options(arr,sel){return arr.map(([id,name])=>`<option value="${esc(id)}" ${id===sel?'selected':''}>${esc(name)}</option>`).join('')}
function select(key,value,arr){return `<label class="field">${labels[key]}<select name="${key}">${options(arr,value)}</select></label>`}
function action(t,label,style='btn secondary',extra=''){return `<button type="button" class="${style}" data-act="${t}" ${extra}>${label}</button>`}
function roomCards(){return Object.entries(rooms).map(([k,r])=>`<button class="room ${k}" data-start="${k}"><span class="tile-icon">${icon(k)}</span><span class="arrow">${icon('arrow')}</span><h3>${r.name}</h3><p>${r.desc}</p></button>`).join('')}
function showNew(type){
 if(!rooms[type])return modal('تكليف جديد',`<div class="template-list">${roomCards()}</div>`);
 modal(rooms[type].name,`<form id="new-form" data-type="${type}"><div class="grid">${field('title','','text',true,true,rooms[type].example)}${field('brief','','textarea',true,true,'وش تبغى الفريق يسلّمك؟')}${select('owner','f',team().map(a=>[a.id,a.name]))}</div><div class="actions"><button class="btn">إنشاء الملف</button>${window.SpeechRecognition||window.webkitSpeechRecognition?action('dictate',icon('mic')+' إملاء التكليف'):''}</div></form>`);
 $('#f-title').focus()
}
let speech;
$('#dlg').addEventListener('close',()=>speech?.abort());
function dictate(){if(speech){speech.stop();return}const C=window.SpeechRecognition||window.webkitSpeechRecognition;if(!C)return;const s=new C();speech=s;s.lang='ar-SA';s.onresult=e=>{const el=$('#f-brief');if(el)el.value=[el.value,e.results[0][0].transcript].filter(Boolean).join(' ')};s.onerror=()=>flash('تعذر الإملاء. تقدر تكتب التكليف.');s.onend=()=>{speech=null;const b=$('[data-act=dictate]');if(b)b.textContent='إملاء التكليف'};s.start();$('[data-act=dictate]').textContent='إيقاف الإملاء'}
function empty(title,sub,k='files'){return `<div class="empty"><span class="tile-icon">${icon(k)}</span><div><strong>${title}</strong><p>${sub}</p></div></div>`}
function row(r){const due=r.review&&atDay(r.review)<new Date()&&!r.outcome;return `<a href="#file/${esc(r.id)}" class="record ${r.type}"><span class="tile-icon">${icon(r.type)}</span><div><b>${esc(r.title)}</b><small>${rooms[r.type].name} · ${date(r.updated)} ${due?' · حان موعد المراجعة':''}</small></div><span class="pill">${esc(r.status)}</span>${icon('arrow')}</a>`}
function pageHead(h,p,btn=''){return `<div class="page-head"><div><h1>${h}</h1><p>${p}</p></div>${btn}</div>`}
function home(rs){return `<section class="hero"><div><h1>حيّاك يا نايف</h1><p>وش تبي يجهز لك المكتب اليوم؟</p>${action('new',icon('plus')+' تكليف جديد','btn')}</div>${officeDrawing()}</section>
 <div class="section-head"><h2>مساحات العمل</h2></div><div class="cards">${roomCards()}</div>
 <div class="section-head"><h2>أحدث الملفات</h2><a href="#files" class="text-btn">كل الملفات ${icon('arrow')}</a></div>${rs.length?rs.slice(0,4).map(row).join(''):empty('أول ملف يبدأ بتكليف','اختر مساحة عمل أو افتح تكليف جديد.')}
 `}
function list(rs){return pageHead('ملفات العمل','ابحث في تكليفات المكتب وتابع تقدمها.',action('new',icon('plus')+' تكليف جديد','btn'))+`<div class="list-tools"><input aria-label="بحث في الملفات" id="search" type="search" placeholder="ابحث بعنوان الملف أو التكليف"><select aria-label="تصفية بحسب الحالة" id="filter">${options([['','كل الحالات'],...statusList.map(v=>[v,v])],'')}</select></div><div id="results">${rs.map(row).join('')||empty('ملفات المكتب','تظهر تكليفاتك هنا بعد إنشاء أول ملف.')}</div>`}
function filter(){const q=$('#search').value.trim(),s=$('#filter').value;$('#results').innerHTML=records().filter(r=>(!s||s===r.status)&&(r.title+' '+r.brief).includes(q)).map(row).join('')||empty('ما فيه ملفات مطابقة','جرّب عنوان آخر أو غيّر الحالة.')}
function log(rs){const ds=rs.filter(r=>r.choice);return pageHead('سجل القرارات','القرارات التي اعتمدتها وأسبابها ومواعيد مراجعتها.')+(ds.map(r=>`<div class="panel group"><a href="#file/${esc(r.id)}"><small class="meta">${esc(r.title)}</small><h2>${esc(r.choice)}</h2></a><p>${esc(r.reason)}</p><div class="split"><small>${r.review?'مراجعة '+date(atDay(r.review),{year:'numeric'}):''}</small><a class="text-btn" href="#file/${esc(r.id)}">فتح القرار ${icon('arrow')}</a></div></div>`).join('')||empty('سجلك جاهز لأول قرار','اعتمد توصيتك داخل ملف مجلس المستشارين لتظهر هنا.','log'))}
function agents(){return pageHead('فريق المكتب','خصص أسماء الوكلاء وأدوارهم. انسخ التكليف من ملف العمل وانقل إجابة الوكيل إليه.')+`<section class="agents">${team().map((a,i)=>`<div class="agent"><span class="avatar">${i===0?'ف':i===7?'ك':i}</span><div><b>${esc(a.name)}</b><small>${esc(a.role)}</small></div>${action('agent',icon('edit'),'secondary',`aria-label="تعديل ${esc(a.name)}" data-id="${a.id}"`)}</div>`).join('')}</section>`}
function editAgent(id){const a=team().find(t=>t.id===id);modal('تعديل عضو الفريق',`<form id="agent-form" data-id="${id}"><div class="grid">${field('اسم العضو',a.name,'text',true,true)}${field('التخصص',a.role,'textarea',true,true)}${field('url',agentUrl(a),'url',true)}</div><div class="actions"><button class="btn">حفظ التعديل</button></div></form>`)}
let current=null;
function detail(r){
 const F=(key,type='textarea',wide=false,req=false)=>field(key,r[key],type,wide,req);
 const block=(title,html,sub='')=>`<section class="form-card"><h2>${title}</h2>${sub}<div class="grid">${html}</div></section>`;
 let body=block('بطاقة التكليف',F('title','text',true,true)+F('brief','textarea',true,true)+select('owner',r.owner,team().map(a=>[a.id,a.name]))+select('status',r.status,statusList.map(v=>[v,v])));
 if(r.type==='meeting') body+=block('التحضير والمتابعة',F('client','text',true)+F('questions')+F('notes')+F('scope','textarea',true));
 if(r.type==='editor') body+=block('المصدر والإنتاج',F('source','url',true)+F('finding')+F('angle')+F('post')+F('snap')+F('metric','textarea',true));
 if(r.type==='council'){
  body+=block('البدائل المطروحة',F('optionA','text')+F('optionB','text'));
  body+=block('آراء المستشارين',['customer','product','execution'].map(key=>`<div class="wide group">${F(key)}<div class="copy-row">${action('brief','نسخ سؤال المستشار','btn secondary',`data-lens="${key}"`)}</div></div>`).join(''),'<p class="hint">انسخ سؤال كل مستشار على حدة، ثم سجل رأيه هنا.</p>');
  body+=block('ورقة القرار',F('objection')+F('assumption')+F('choice','text',true)+F('reason')+F('review','date')+F('outcome','textarea',true));
 }
 return `<div class="detail"><a href="#files" class="back top-link">‹ العودة إلى ملفات العمل</a>${pageHead(esc(r.title),rooms[r.type].name+' · '+esc(r.status),action('brief','تجهيز تكليف الوكيل','btn'))}
 <form id="details">${body}${block('المتابعة',F('next','text',true))}<div class="actions"><button class="btn">حفظ الملف</button>${action('report','عرض ملخص الملف')}${action('print','طباعة الملخص')}</div></form>
 <section class="panel group"><h2>سجل التعديلات</h2><ol class="timeline">${r.events.slice().reverse().map(e=>`<li>${esc(e.note)} <small>· ${date(e.at,{hour:'2-digit',minute:'2-digit'})}</small></li>`).join('')}</ol></section><div class="print-only"></div></div>`
}
function summary(r){return [r.title,rooms[r.type].name,...Object.keys(labels).filter(k=>!['title','owner'].includes(k)&&r[k]).map(k=>labels[k]+'\n'+r[k]),'المسؤول\n'+team().find(a=>a.id===r.owner)?.name].join('\n\n')}
const lenses={customer:'زاوية العميل: حدد المستخدم والمشتري وحاجتهما.',product:'زاوية المنتج: اختبر قيمة كل بديل وسهولة استخدامه.',execution:'زاوية التنفيذ: قارن الوقت والموارد واقترح أصغر تجربة.'};
function draft(){return {...current,...Object.fromEntries(new FormData($('#details')))}}
function brief(r,lens){
 const a=team().find(a=>a.id===r.owner);
 const fields=lens?['optionA','optionB']:({meeting:['client','notes'],editor:['source','finding','angle'],council:['optionA','optionB','customer','product','execution','objection']})[r.type];
 return [lens?'مراجعة مستقلة':`تكليف إلى ${a.name}`,r.title,r.brief,...fields.filter(k=>r[k]).map(k=>labels[k]+' — '+r[k]),lenses[lens],rooms[r.type].instruction,lens?'اكتب رأيك المستقل مع تجربة تختبر افتراضك.':'اكتب الناتج الجاهز للمراجعة وحدد المعلومات التي تحتاجها.'].filter(Boolean).join('\n\n')
}
function output(title,value,agent){modal(title,`<div class="preview" dir="auto">${esc(value)}</div><div class="actions">${action('copy','نسخ النص','btn')}${agent?'<a class="btn secondary" target="_blank" rel="noopener noreferrer" href="'+esc(agentUrl(agent))+'">فتح '+esc(agent.name)+'</a>':''}</div>`)}
function notice(msg){flash(msg)}
function saveRecord(r,previous){
 const live=read(itemPrefix+r.id,null);
 if(previous&&live?.updated!==previous.updated){notice('تغير الملف في نافذة أخرى. انسخ تعديلاتك ثم أعد فتح الملف.');return false}
 localStorage.setItem(itemPrefix+r.id,JSON.stringify(r));return true
}
function restoreDraft(r){
 const pending=readSession(r.id);if(!pending||pending.base!==r.updated)return;
 const f=$('#details');for(const [key,val] of Object.entries(pending.fields)){const el=f.elements.namedItem(key);if(el)el.value=val}flash('تمت استعادة المسودة');
}
function readSession(id){try{return JSON.parse(sessionStorage.getItem(prefix+'draft.'+id))}catch{return null}}
document.addEventListener('input',e=>{if(e.target.form?.id==='details' && current){try{sessionStorage.setItem(prefix+'draft.'+current.id,JSON.stringify({base:current.updated,fields:Object.fromEntries(new FormData(e.target.form))}))}catch{notice('استخدم حفظ الملف للاحتفاظ بتعديلاتك')}}});
function render(){
 const [route='home',id]=(location.hash.slice(1)||'home').split('/');const rs=records();const active=route==='file'?'files':nav.some(([k])=>k===route)?route:'home';
 current=null;
 const links=nav.map(([k,n])=>`<a href="#${k}" class="nav-link ${active===k?'active':''}" ${active===k?'aria-current="page"':''}>${icon(k)}<span>${n}</span></a>`).join('');
 $('#nav').innerHTML=links;$('#mobile-nav').innerHTML=links;$('#page-label').textContent=nav.find(n=>n[0]===active)[1];
 if(route==='file')current=rs.find(r=>r.id===id);
 $('#main').innerHTML=current?detail(current):active==='team'?agents():active==='log'?log(rs):active==='files'?list(rs):home(rs);
 document.title=(current?.title||$('#page-label').textContent)+' | مكتب نايف';
 if(current)restoreDraft(current);
 if($('#search')){$('#search').oninput=filter;$('#filter').onchange=filter}
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-start],[data-act]');if(!b)return;
 try{
 if(b.dataset.start)return showNew(b.dataset.start);
 switch(b.dataset.act){
 case 'new':return showNew();
 case 'agent':return editAgent(b.dataset.id);
 case 'dictate':return dictate();
 case 'brief':return output('تكليف جاهز للنسخ',brief(draft(),b.dataset.lens),team().find(a=>a.id===draft().owner));
 case 'report':return output('ملخص الملف',summary(draft()));
 case 'print':$('.print-only').textContent=summary(draft());window.print();break;
 case 'copy':{const val=$('.preview').innerText;try{await navigator.clipboard.writeText(val);flash('تم نسخ النص')}catch{const range=document.createRange();range.selectNodeContents($('.preview'));getSelection().removeAllRanges();getSelection().addRange(range);notice('تم تحديد النص للنسخ اليدوي')}break}
 }
 }catch{notice('تعذر تنفيذ الطلب. حاول مرة أخرى.')}
});
document.addEventListener('submit',e=>{
 const form=e.target;if(!['new-form','agent-form','details'].includes(form.id))return;e.preventDefault();
 const values=Object.fromEntries(Array.from(new FormData(form),([k,v])=>[k,String(v).trim()]));
 try{
 if(form.id==='agent-form'){
 if(!values['اسم العضو']||!values['التخصص'])return notice('أدخل الاسم والتخصص');
 if(values.url && !/^https:\/\//i.test(values.url))return notice('استخدم رابط جلسة يبدأ بـ https');
 localStorage.setItem(prefix+'agent.'+form.dataset.id,JSON.stringify({name:values['اسم العضو'],role:values['التخصص'],url:values.url}));close();render();return flash('تم حفظ بيانات العضو')
 }
 if(!values.title||!values.brief)return notice('أدخل عنوان الملف والتكليف');
 const stamp=now();
 if(form.id==='new-form'){
 const r={...values,id:freshId(),type:form.dataset.type,status:statusList[0],updated:stamp,events:[{at:stamp,note:'إنشاء الملف'}]};
 if(saveRecord(r)){close();location.hash='file/'+r.id;flash('تم إنشاء الملف')}return
 }
 if(values.choice&&!values.reason)return notice('سجل سبب اختيار القرار لاعتماده');
 if(values.outcome&&!values.choice)return notice('سجل القرار قبل إضافة نتيجة مراجعته');
 const changed=Object.keys(values).filter(k=>values[k]!==String(current[k]??''));
 if(!changed.length)return flash('الملف محفوظ');
 const note=changed.includes('choice')&&values.choice?'اعتماد القرار · '+values.choice:'تحديث '+changed.map(k=>labels[k]).join('، ');
 const r={...current,...values,updated:stamp,events:[...current.events,{at:stamp,note}]};
 if(saveRecord(r,current)){render();flash('تم حفظ الملف')}
 }catch{notice('تعذر الحفظ في هذا المتصفح. احتفظ بنسخة من نص الملف.')}
});
window.addEventListener('hashchange',()=>{close();render();window.scrollTo(0,0);$('#main').focus({preventScroll:true})});
const today=new Date();
$('#date').textContent=[new Intl.DateTimeFormat('ar',{weekday:'long'}).format(today),new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'short',year:'numeric'}).format(today),date(today,{year:'numeric'})+' م'].join(' | ');
try{render()}catch{$('#main').innerHTML=empty('تعذر فتح بيانات المكتب','افتح الصفحة في متصفح يسمح بالحفظ المحلي.')}
})();
