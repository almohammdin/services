'use strict';
const $=id=>document.getElementById(id), KEY='hatta-sale-engineering-v1';
const roles={A:'مالك السلعة الأصلي',B:'الممول / البائع بالأجل',C:'المشتري بالأجل',D:'المشتري النقدي المستقل',E:'الوكيل المستقل'};
const defaults=()=>({names:{A:'مالك السيارة',B:'الممول',C:'طالب السيولة',D:'المشتري النهائي',E:'وكيل مستقل'},product:'سيارة محددة برقم الهيكل',cash:100000,deferred:154000,resale:98000,purpose:'cash',buyAgent:'B',sellAgent:'B',resaleAgent:'C',finalBuyer:'D',arranged:'unknown',authority:'unknown',checks:[false,false,false,false,false,false]});
let s=defaults(),step=0;
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&saved.names){s={...s,...saved,names:{...s.names,...saved.names}};if(!Array.isArray(s.checks)||s.checks.length!==6)s.checks=defaults().checks;}}catch{}
try{const transfer=JSON.parse(sessionStorage.getItem('deferred-sale-engineering-import'));if(transfer){for(const key of ['product','cash','deferred','resale'])if(Object.prototype.hasOwnProperty.call(transfer,key))s[key]=transfer[key];s.checks=defaults().checks;sessionStorage.removeItem('deferred-sale-engineering-import');}}catch{}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=id=>s.names[id]||roles[id], money=v=>Number.isFinite(+v)&&+v>0?'<span class="amount-value"><bdi>'+new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(+v)+'</bdi><svg class="sar-icon" role="img" aria-label="ريال سعودي"><use href="#sar-mark"></use></svg></span>':'مبلغ غير محدد';
const hasResale=()=>s.purpose==='cash', hasAgents=()=>s.buyAgent!=='B'||s.sellAgent!=='B'||(hasResale()&&s.resaleAgent!=='C');
const gates=[['تحديد السلعة ومالكها','وصف واضح ورقم هيكل للسيارة، والتحقق من ملك البائع الأصلي.'],['شراء الممول وتملكه وقبضه','عقد شراء وفاتورة باسم الممول وإثبات حيازته وتحمله تبعة الملك قبل البيع التالي.'],['إبرام البيع الآجل بعد ذلك','ثمن إجمالي ثابت وآجال معلومة وعقد مستقل بعد تحقق ملك الممول وقبضه.'],['قبض المشتري بالأجل','إثبات تسلمه وحيازته وتمكينه من التصرف، قبل أي إعادة بيع.'],['إعادة البيع بقرار مستقل','عقد نقدي مع المشتري النهائي بعد القبض، دون ترتيب الممول للتصريف.'],['قبض ثمن إعادة البيع','الثمن لحساب المشتري بالأجل، مع توثيق التحويل وأجر الوكيل إن وجد.']];
function init(){
 $('names').innerHTML=Object.keys(roles).map(id=>`<label>${id} · ${roles[id]}<input data-name="${id}" maxlength="45" value="${esc(n(id))}"></label>`).join('');
 for(const id of ['product','cash','deferred','resale','purpose','arranged','authority'])$(id).value=s[id];
 refreshOptions();
 $('checks').innerHTML=gates.map((g,i)=>`<label class="check" data-gate="${i}"><input type="checkbox" data-check="${i}" ${s.checks[i]?'checked':''}><span>${i+1}. ${g[0]}<small>${g[1]}</small></span></label>`).join('');
 render();
}
function refreshOptions(){for(const [id,keys,principal] of [['buyAgent',['B','C','E','A','D'],'B'],['sellAgent',['B','E','A','C','D'],'B'],['resaleAgent',['C','E','B','A','D'],'C'],['finalBuyer',['D','A','B','E'],'']]){$(id).innerHTML=keys.map(k=>`<option value="${k}">${k} · ${esc(n(k))}${k===principal?' (بنفسه)':''}</option>`).join('');if(!keys.includes(s[id]))s[id]=keys[0];$(id).value=s[id];}}
function evaluate(){const out=[];const add=(level,title,text,ref)=>out.push({level,title,text,ref});
 if(!s.product.trim()||['cash','deferred',...(hasResale()?['resale']:[])].some(k=>!Number.isFinite(+s[k])||+s[k]<=0))add('danger','أكمل بيانات السلعة والثمن','يلزم تحديد السلعة ومبالغ صحيحة موجبة قبل مراجعة العملية.',2);
 const activeIds=['A','B','C',...(hasResale()?['D']:[])];const names=activeIds.map(k=>n(k).trim().replace(/\s+/g,' '));if(new Set(names).size!==names.length)add('warn','أسماء متطابقة لأدوار مختلفة','تحقق من هوية الأطراف. إذا كان الشخص نفسه يشغل دورين فاختره من قائمة الدور أو الوكالة لإظهار أثر الجمع.',5);
 if(hasResale()){
 if(s.finalBuyer==='B')add(+s.resale<+s.deferred?'danger':'warn',+s.resale<+s.deferred?'صورة عينة: رجوع السلعة للممول بأقل':'رجوع السلعة للممول يحتاج مراجعة',+s.resale<+s.deferred?'المشتري بالأجل يعيد السلعة إلى بائعه بثمن نقدي أقل من دينه. غيّر المشتري النهائي إلى طرف مستقل.':'العودة بالمثل أو بأكثر تختلف عن العينة المذكورة، ويحتاج واقع الاتفاق والتواطؤ إلى مراجعة خاصة.',3);
 if(s.arranged==='yes')add('danger','ترتيب الممول لإعادة البيع','هذه من صورة التورق المنظم الممنوع وفق قرار المجمع المعتمد هنا، ولو نفذ البيع وكيل آخر. استقلال اسم الوكيل وحده لا يكفي.',1);
 else if(s.resaleAgent==='B')add('warn','توكيل الممول في تصريف ما باعه','تفصيل التوقيت والالتزام والعرف مؤثر. هذا الاختيار يحتاج مراجعة خاصة، ولا تعتمد الصفحة هذه الصورة. إذا كان التصريف جزءا من الترتيب فاختر «نعم» في سؤال الترتيب.',1);
 else if(s.arranged==='unknown')add('warn','استقلال إعادة البيع لم يتحدد','حدد هل الممول يرتب التصريف، صراحة أو ضمنا أو بحكم العرف. هذه نقطة جوهرية في توصيف التورق.',1);
 if(s.finalBuyer==='A')add('warn','عودة السلعة إلى مالكها الأصلي','لا تساوي تلقائيا رجوعها إلى البائع بالأجل. افحص وجود اتفاق دائري أو تواطؤ أو ارتباط بالممول قبل اعتمادها.',1);
 if(s.resaleAgent===s.finalBuyer)add('warn','الوكيل سيشتري لنفسه','يجتمع تمثيل البائع والشراء للنفس. يلزم فحص إذن الموكل وتعارض المصالح، مع بقاء ضوابط التورق. اختر مشتريا أو وكيلا آخر لتبسيط المسار.',5);
 if(s.resaleAgent==='A')add('warn','المالك الأصلي وكيل لإعادة البيع','افحص استقلاله عن الممول ونطاق وكالته وتوقيت الترتيب. كونه مالكا سابقا لا يكفي وحده للحكم على الصورة.',1);
 }
 if(hasResale()&&s.resaleAgent!=='C'&&s.resaleAgent!=='B'&&(s.resaleAgent===s.buyAgent||s.resaleAgent===s.sellAgent))add('warn','وكيل واحد للممول وللمشتري بالأجل','افحص استقلال إعادة البيع فعليا. اشتراك الوكيل يحتاج مراجعة للعلاقة والترتيبات؛ تغيير اسم الموكل في الورق وحده لا يثبت الاستقلال.',1);
 if(s.buyAgent==='A')add('warn','مالك السلعة يبيع من نفسه بصفته وكيلا','شراء الوكيل من ماله يحتاج إذن الموكل ومراجعة تعارض المصالح. أدرج هذه الصورة للمراجعة قبل التنفيذ.',5);
 if(s.sellAgent==='C')add('warn','المشتري بالأجل يمثل البائع أيضا','يجتمع البيع بالوكالة والشراء للنفس. يلزم إذن الموكل ومراجعة مستقلة لهذه الصورة؛ الإذن لا يعالج بيع ما لم يملك أو يقبض.',5);
 if(s.buyAgent==='C')add('warn','طالب السيولة يشتري ويقبض للممول','فرّق بين قبضه بصفته وكيلا للممول وبين قبضه لنفسه بعد عقد الآجل. تحتاج الوكالة وإثبات انتقال الصفة والقبض مراجعة قبل الاعتماد.',2);
 if(hasAgents()&&s.authority!=='yes')add('warn','وثّق نطاق الوكالة','حدد الموكل والوكيل والسلعة والعمل المأذون والأجر إن وجد. أضف إذن البيع الآجل عند تمثيل الممول.',4);
 const count=hasResale()?6:4;const missing=s.checks.slice(0,count).findIndex(v=>!v);if(missing!==-1)add('warn','بوابة لم تثبت: '+gates[missing][0],'الموافقة على التمويل أو العرض تمهد للعملية. التنفيذ يتبع ترتيب العقود والتملك والقبض الظاهر في البوابات أدناه.',2);
 if(!out.length)add('ok','لم يظهر تعارض في الفحص المحدود','المدخلات تتفق مع المسار المبين في المراجع. هذه قراءة استرشادية، وتبقى صحة العقود والقبض الفعلي واستقلال الأطراف بحاجة تحقق.',hasResale()?1:2);
 return out;
}
function render(){
 $('resaleControls').hidden=!hasResale();$('resale').parentElement.hidden=!hasResale();$('modeLabel').textContent=hasResale()?(s.arranged==='yes'?'تورق منظم · تنبيه':s.finalBuyer==='B'?'عودة للممول · تنبيه':'تورق · اختبار الصورة'):'بيع آجل للاقتناء';
 document.querySelectorAll('[data-gate]').forEach(el=>el.hidden=!hasResale()&&+el.dataset.gate>3);
 const max=hasResale()?5:3;if(step>max)step=max;
 const labels=['الخريطة كاملة','شراء الممول','قبض الممول','البيع الآجل',...(hasResale()?['قبض المشتري','إعادة البيع']:[])];
 $('steps').innerHTML=labels.map((v,i)=>`<button data-step="${i}" class="${step===i?'active':''}" aria-pressed="${step===i}">${v}</button>`).join('');
 const findings=evaluate();$('findings').innerHTML=findings.map(f=>`<div class="finding ${f.level}"><b>${f.title}</b>${f.text} <a href="#ref${f.ref}">المرجع ${f.ref}</a></div>`).join('');
 $('status').textContent=findings.some(f=>f.level==='danger')?'تعارض يحتاج تعديل':findings.some(f=>f.level==='warn')?'نقاط تحتاج تحقق':'اكتمل الفحص المحدود';
 const missing=s.checks.slice(0,hasResale()?6:4).findIndex(v=>!v);$('next').textContent=missing<0?'اكتمل توثيق البوابات بحسب إدخالك. راجع التنبيهات والعقود قبل اعتماد العملية.':'الخطوة التالية: '+gates[missing][0];
 draw();save();
}
function invalidate(){s.checks=defaults().checks;document.querySelectorAll('[data-check]').forEach(c=>c.checked=false);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(s));$('saved').textContent='محفوظ على هذا المتصفح'}catch{$('saved').textContent='الحفظ المحلي غير متاح'}}
function draw(){
 const agent=(key,owner)=>`<label class="card-agent">من ينفذ عن ${esc(n(owner))}؟<select data-config="${key}" aria-label="منفذ ${key==='buyAgent'?'الشراء النقدي':key==='sellAgent'?'البيع الآجل':'إعادة البيع'}">${$(key).innerHTML}</select></label>`;
 const data=[{title:'الممول يشتري السلعة',seller:'A',buyer:'B',price:s.cash,kind:'نقدا',key:'buyAgent',owner:'B',gate:'قبل الخطوة التالية: يتملك الممول السلعة ويقبضها.'},{title:'الممول يبيع بالأجل',seller:'B',buyer:'C',price:s.deferred,kind:'دين بأجل معلوم',key:'sellAgent',owner:'B',gate:'قبل إعادة البيع: يتملك المشتري السلعة ويقبضها.'},...(hasResale()?[{title:'المشتري يبيع ويحصل على النقد',seller:'C',buyer:s.finalBuyer,price:s.resale,kind:'نقدا',key:'resaleAgent',owner:'C',gate:'يختار المشتري إعادة البيع باستقلال عن ترتيب الممول.'}]:[])];
 saleViewer.show(data);
 $('map').innerHTML=data.map((d,i)=>`<article class="sale-card"><header class="card-title"><span>${i+1}</span><h3>${d.title}</h3></header><div class="party-flow"><div><small>البائع</small><strong>${esc(n(d.seller))}</strong></div><div class="one-arrow"><small>السلعة</small><span aria-hidden="true">←</span></div><div><small>المشتري</small><strong>${esc(n(d.buyer))}</strong></div></div><div class="price-strip"><span>${d.kind}</span><strong>${money(d.price)}</strong><small>${esc(n(d.buyer))} يدفع إلى ${esc(n(d.seller))}${i===1?' حسب مواعيد السداد':''}</small></div>${agent(d.key,d.owner)}${s[d.key]!==d.owner?`<p class="agent-note">${esc(n(d.owner))} يوكل ${esc(n(s[d.key]))}${d.key==='buyAgent'?' في الشراء والقبض':' في البيع'}.</p>`:'<p class="agent-note">ينفذ بنفسه.</p>'}${i===2?`<label class="card-agent">من المشتري النهائي؟<select data-config="finalBuyer" aria-label="المشتري النهائي في الرسم">${$('finalBuyer').innerHTML}</select></label>`:''}<p class="gate-note">${!hasResale()&&i===1?'يقبض المشتري السلعة للانتفاع بها.':d.gate}</p></article>`).join('');
 document.querySelectorAll('[data-config]').forEach(el=>el.value=s[el.dataset.config]);
 $('stepDetail').textContent=hasResale()?'الترتيب: شراء وقبض، ثم بيع آجل وقبض، ثم إعادة بيع مستقلة.':'الترتيب: شراء الممول وقبضه، ثم البيع الآجل وقبض المشتري.';
 $('agencyList').innerHTML='';
}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.name){s.names[el.dataset.name]=el.value;invalidate();refreshOptions();render();}else if(['product','cash','deferred','resale'].includes(el.id)){s[el.id]=el.value;invalidate();render();}});
document.addEventListener('change',e=>{const el=e.target;if(el.tagName==='SELECT'){const key=el.dataset.config||el.id;s[key]=el.value;if($(key))$(key).value=el.value;s.checks=defaults().checks;document.querySelectorAll('[data-check]').forEach(c=>c.checked=false);render();}if(el.dataset.check!==undefined){const i=+el.dataset.check;if(el.checked&&s.checks.slice(0,i).some(v=>!v)){el.checked=false;$('next').textContent='أكمل إثبات البوابات السابقة أولا، حسب ترتيب التملك والقبض والعقود.';return;}s.checks[i]=el.checked;if(!el.checked)for(let j=i+1;j<6;j++){s.checks[j]=false;document.querySelector(`[data-check="${j}"]`).checked=false;}render();}});
document.addEventListener('click',e=>{const t=e.target.closest('button');if(t?.dataset.step!==undefined){step=+t.dataset.step;render();}if(t?.dataset.preset){saleViewer.reset();s.buyAgent='B';s.sellAgent='B';s.resaleAgent=t.dataset.preset==='agent'?'E':t.dataset.preset==='organized'?'B':'C';s.finalBuyer=t.dataset.preset==='inah'?'B':'D';s.purpose='cash';s.arranged=t.dataset.preset==='organized'?'yes':'no';s.authority='unknown';s.checks=defaults().checks;step=0;init();}const node=e.target.closest('[data-node]');if(node){const input=document.querySelector(`[data-name="${node.dataset.node}"]`);input.focus();input.scrollIntoView({block:'center',behavior:'smooth'});}});
$('map').addEventListener('unused-keydown',e=>{if(e.key==='Enter'||e.key===' '){const node=e.target.closest('[data-node]');if(node){e.preventDefault();node.dispatchEvent(new MouseEvent('click',{bubbles:true}));}}});
$('print').onclick=()=>window.print();$('reset').onclick=()=>{if(confirm('مسح بيانات المخطط المحفوظة على هذا المتصفح؟')){s=defaults();step=0;saleViewer.reset();init();}};
/* A single sale, viewed through ownership, payment or agency. */
const saleViewer = (() => {
  let stage = 0;
  let layer = 'goods';
  let selected = '';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let moving = !reducedMotion.matches;
  reducedMotion.addEventListener('change', event => { moving = !event.matches; draw(); });
  const layers = {goods:'السلعة', cash:'الثمن', agency:'الوكالة'};
  const titles = ['شراء نقدي', 'بيع بالأجل', 'إعادة البيع'];
  const person = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="16" cy="10" r="5"/><path d="M5 28c0-14 22-14 22 0"/></svg>';
  const button = (key,value,title,active) => '<button type="button" data-view-'+key+'="'+value+'" aria-pressed="'+active+'">'+title+'</button>';
  function show(stages) {
    stage = Math.min(stage, stages.length - 1);
    const d = stages[stage], agent = s[d.key], delegated = agent !== d.owner;
    const agency = layer === 'agency', cash = layer === 'cash', debt = cash && stage === 1;
    const single = agency && !delegated;
    const from = agency ? d.owner : cash ? d.buyer : d.seller;
    const to = agency ? agent : cash ? d.seller : d.buyer;
    // Keep seller on the right and buyer on the left across the goods and price views.
    const right = agency ? from : d.seller, left = agency ? to : d.buyer;
    const label = agency ? 'تفويض' : debt ? 'دين مؤجل' : cash ? 'دفع نقدي' : 'انتقال السلعة';
    const name = id => esc(n(id));
    const asset = esc(s.product.trim() || 'السلعة');
    const summary = agency ? (single ? name(from)+' ينفذ هذه الخطوة بنفسه.' : name(from)+' يوكل '+name(to)+(d.key==='buyAgent'?' في الشراء والقبض لحسابه.':' في البيع لحسابه.'))
      : cash ? (debt ? 'يثبت في ذمة '+name(from)+' مبلغ '+money(d.price)+' لصالح '+name(to)+'. السداد في مواعيد الأقساط.' : 'يدفع '+name(from)+' إلى '+name(to)+' مبلغ '+money(d.price)+'.')
      : 'يبيع '+name(from)+' '+asset+' إلى '+name(to)+'.';
    function node(id,role) {
      return '<button type="button" class="scene-party" data-view-party="'+id+'" aria-pressed="'+(selected===id)+'">'+person+'<small>'+role+'</small><b>'+name(id)+'</b></button>';
    }
    const reverse = cash;
    const path = reverse ? 'M 8 18 H 112' : 'M 112 18 H 8';
    const arrow = reverse ? 'M103 10l9 8-9 8' : 'M17 10l-9 8 9 8';
    const motion = moving && !debt && !single;
    const connector = '<div class="scene-line"><span>'+label+'</span><svg viewBox="0 0 120 36" aria-hidden="true"><path d="'+path+'" fill="none" stroke="currentColor" stroke-width="2" '+(debt||agency?'stroke-dasharray="5 4"':'')+'/><path d="'+arrow+'" fill="none" stroke="currentColor" stroke-width="3"/>'+(motion?'<circle r="5" fill="currentColor"><animateMotion dur="2.3s" repeatCount="indefinite" path="'+path+'"/></circle>':'')+'</svg></div>';
    const roleRight = agency ? (single?'المنفذ':'الموكل') : 'البائع';
    const roleLeft = agency ? 'الوكيل' : 'المشتري';
    const visibleSelection = selected===right || (!single && selected===left);
    const note = visibleSelection ? '<p class="role-note">'+name(selected)+' · '+(selected===right?roleRight:roleLeft)+' في هذه الخطوة.</p>' : '';
    $('saleScene').innerHTML =
      '<nav class="scene-stages" aria-label="مراحل البيع">'+stages.map((_,i)=>button('stage',i,(i+1)+' · '+titles[i],stage===i)).join('')+'</nav>'+
      '<div class="scene-tools"><div class="scene-tabs" aria-label="ماذا تريد أن تتبع؟">'+Object.entries(layers).map(([k,v])=>button('layer',k,v,layer===k)).join('')+'</div>'+
      (!single&&!debt?button('motion','switch',moving?'إيقاف الحركة':'تشغيل الحركة',moving):'')+'</div>'+
      '<div class="scene-board layer-'+layer+'"><div class="scene-nodes '+(single?'solo':'')+'">'+node(right,roleRight)+(single?'':connector+node(left,roleLeft))+'</div>'+
      '<p class="scene-summary">'+summary+'</p>'+note+'</div>'+
      '<div class="scene-owner"><span>المالك بعد البيع</span><strong>'+name(d.buyer)+'</strong></div>';
  }
  $('saleScene').addEventListener('click',event=>{
    const target=event.target.closest('button');
    if(!target)return;
    const data=target.dataset;
    if(data.viewStage!==undefined){stage=Number(data.viewStage);selected='';}
    if(data.viewLayer){layer=data.viewLayer;selected='';}
    if(data.viewParty)selected=selected===data.viewParty?'':data.viewParty;
    if(data.viewMotion)moving=!moving;
    const attr=target.getAttributeNames().find(k=>k.startsWith('data-view-'));
    draw();
    if(attr)$('saleScene').querySelector('['+attr+'="'+target.getAttribute(attr)+'"]')?.focus({preventScroll:true});
  });
  return {show,reset(){stage=0;layer='goods';selected='';}};
})();

init();
