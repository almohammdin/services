'use strict';
const $=id=>document.getElementById(id), KEY='hatta-sale-engineering-v1';
const roles={A:'مالك السلعة الأصلي',B:'الممول / البائع بالأجل',C:'المشتري بالأجل',D:'المشتري النقدي المستقل',E:'الوكيل المستقل'};
const defaults=()=>({names:{A:'مالك السيارة',B:'الممول',C:'طالب السيولة',D:'المشتري النهائي',E:'وكيل مستقل'},product:'سيارة محددة برقم الهيكل',cash:100000,deferred:154000,resale:98000,purpose:'cash',buyAgent:'B',sellAgent:'B',resaleAgent:'C',finalBuyer:'D',arranged:'unknown',authority:'unknown',checks:[false,false,false,false,false,false]});
let s=defaults(),step=0;
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&saved.names){s={...s,...saved,names:{...s.names,...saved.names}};if(!Array.isArray(s.checks)||s.checks.length!==6)s.checks=defaults().checks;}}catch{}
try{const transfer=JSON.parse(sessionStorage.getItem('deferred-sale-engineering-import'));if(transfer){for(const key of ['product','cash','deferred','resale'])if(Object.prototype.hasOwnProperty.call(transfer,key))s[key]=transfer[key];s.checks=defaults().checks;sessionStorage.removeItem('deferred-sale-engineering-import');}}catch{}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=id=>s.names[id]||roles[id], money=v=>Number.isFinite(+v)&&+v>0?new Intl.NumberFormat('ar-SA',{maximumFractionDigits:2}).format(+v)+' ريال':'مبلغ غير محدد';
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
 const pos={A:[610,45],B:[360,45],C:[110,45],D:[110,355],E:[610,355]};
 const ids=[...new Set(['A','B','C',s.buyAgent,s.sellAgent,...(hasResale()?[s.finalBuyer,s.resaleAgent]:[])])];
 const isOwner=id=>(step===1||step===2)?id==='B':(step===3||step===4)?id==='C':step===5?id===s.finalBuyer:false;
 let svg=`<defs>${[['g','#226f9a'],['m','#216e59'],['a','#bc813e']].map(([id,c])=>`<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}</defs>`;
 const line=(d,type,active=true)=>`<path d="${d}" fill="none" stroke="${{g:'#226f9a',m:'#216e59',a:'#bc813e'}[type]}" stroke-width="${type==='a'?2:3}" ${type==='a'?'stroke-dasharray="7 5"':''} marker-end="url(#${type})" opacity="${active?1:.16}"/>`;
 const text=(x,y,t,color='#687882',size=13)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-size="${size}">${esc(t)}</text>`;
 svg+=line('M610 83H540','g',step===0||step===1)+line('M540 118H610','m',step===0||step===1);
 svg+=text(575,68,'١ شراء','#226f9a',11);
 svg+=line('M360 83H290','g',step===0||step===3)+line('M290 118H360','m',step===0||step===3)+text(325,68,'٢ آجل','#226f9a',11);
 if(hasResale()){
 if(s.finalBuyer==='D')svg+=line('M150 145V355','g',step===0||step===5)+line('M245 355V145','m',step===0||step===5)+text(195,250,'٣ إعادة البيع','#226f9a',13);
 else if(s.finalBuyer==='E')svg+=line('M200 145V280H700V355','g',step===0||step===5)+line('M725 355V310H260V145','m',step===0||step===5);
 else{const x=pos[s.finalBuyer][0]+90;svg+=line(`M180 145V235H${x}V145`,'g',step===0||step===5)+line(`M${x+25} 145V265H215V145`,'m',step===0||step===5);svg+=text(425,222,'٣ عودة السلعة · راجع التنبيه','#a53d35',13);}
 }
 const agencies=[['B',s.buyAgent,'شراء وقبض'],['B',s.sellAgent,'البيع الآجل'],...(hasResale()?[['C',s.resaleAgent,'إعادة البيع']]:[])].filter(([a,b])=>a!==b);
 const seen=new Set();agencies.forEach(([a,b])=>{if(seen.has(a+b))return;seen.add(a+b);const [x,y]=pos[a],[xx,yy]=pos[b];svg+=line(`M${x+90} ${y+100} Q${(x+xx)/2+90} ${Math.max(y,yy)+165} ${xx+90} ${yy+100}`,'a');});
 if(hasResale()&&s.finalBuyer==='E'&&!ids.includes('E'))ids.push('E');
 for(const id of ids){const [x,y]=pos[id],name=n(id),short=name.length>19?name.slice(0,18)+'…':name;svg+=`<g class="node" tabindex="0" role="button" data-node="${id}" aria-label="${esc(roles[id]+' '+name)}"><title>${esc(roles[id]+' · '+name)}</title><rect x="${x}" y="${y}" width="180" height="100" rx="15" fill="${isOwner(id)?'#0d3656':'#f5f3ed'}" stroke="${isOwner(id)?'#0d3656':'#dcd8cf'}"/>${text(x+90,y+22,id,isOwner(id)?'#e2b67c':'#bc813e',13)}${text(x+90,y+50,short,isOwner(id)?'#fff':'#0d3656',17)}${text(x+90,y+76,roles[id],isOwner(id)?'#c8d5df':'#687882',11)}</g>`;}
 svg+=text(450,185,'الشراء النقدي: '+money(s.cash),'#216e59',12)+text(450,207,'دين المشتري للممول: '+money(s.deferred),'#216e59',12);
 if(hasResale())svg+=text(400,470,'حصيلة إعادة البيع: '+money(s.resale),'#216e59',13);
 $('map').innerHTML=svg;
 const detail=[['ثلاثة عقود متتابعة','الملكية: A ثم B ثم C'+(hasResale()?' ثم المشتري النهائي.':'.')+' الثمن النقدي يسير عكس السلعة؛ الثمن الآجل دين على C لصالح B.'],['شراء الممول من المالك الأصلي',`${n('B')} يشتري ${s.product} من ${n('A')} بمبلغ ${money(s.cash)}. المنفذ: ${n(s.buyAgent)}${s.buyAgent!=='B'?' بصفته وكيلا للممول':''}.`],['قبض الممول وحيازته','إتمام الملك والقبض لحساب الممول وتحمله تبعة السلعة. في مسار السيارة المعتمد: توثيق الملك ونقل الحيازة عن محل البائع قبل العقد التالي.'],['عقد البيع الآجل',`${n('B')} يبيع إلى ${n('C')} بثمن إجمالي ${money(s.deferred)} وآجال معلومة. المنفذ عن الممول: ${n(s.sellAgent)}. يبرم العقد بعد ملك الممول وقبضه.`],['قبض المشتري بالأجل','يقبض المشتري السلعة لحسابه ويصبح قادرا على الاحتفاظ بها أو التصرف فيها. بيعها التالي يأتي بعد هذا القبض.'],['إعادة البيع النقدي',`${n('C')} يبيع إلى ${n(s.finalBuyer)} بمبلغ ${money(s.resale)} عبر ${n(s.resaleAgent)}. الثمن حق للمشتري بالأجل. راجع تنبيهات استقلال البيع والوكالة.`]][step];
 if(!hasResale()&&step===0)detail[0]='عقدان متتابعان';
 $('stepDetail').innerHTML=`<b>${esc(detail[0])}</b><div>${esc(detail[1])}</div><small>اللون الداكن يحدد المالك المفترض بعد المرحلة المعروضة، وإثبات تحققها في بوابات التنفيذ.</small>`;
 $('agencyList').innerHTML=agencies.length?agencies.map(([a,b,t])=>`<p>وكالة ${esc(t)}: ${esc(n(a))} ← ${esc(n(b))} <small>(${a} يوكل ${b})</small></p>`).join(''):'<p>كل طرف ينفذ بنفسه. لا توجد وكالة مختارة.</p>';
}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.name){s.names[el.dataset.name]=el.value;invalidate();refreshOptions();render();}else if(['product','cash','deferred','resale'].includes(el.id)){s[el.id]=el.value;invalidate();render();}});
document.addEventListener('change',e=>{const el=e.target;if(el.tagName==='SELECT'){s[el.id]=el.value;s.checks=defaults().checks;document.querySelectorAll('[data-check]').forEach(c=>c.checked=false);render();}if(el.dataset.check!==undefined){const i=+el.dataset.check;if(el.checked&&s.checks.slice(0,i).some(v=>!v)){el.checked=false;$('next').textContent='أكمل إثبات البوابات السابقة أولا، حسب ترتيب التملك والقبض والعقود.';return;}s.checks[i]=el.checked;if(!el.checked)for(let j=i+1;j<6;j++){s.checks[j]=false;document.querySelector(`[data-check="${j}"]`).checked=false;}render();}});
document.addEventListener('click',e=>{const t=e.target.closest('button');if(t?.dataset.step!==undefined){step=+t.dataset.step;render();}if(t?.dataset.preset){s.buyAgent='B';s.sellAgent='B';s.resaleAgent=t.dataset.preset==='agent'?'E':t.dataset.preset==='organized'?'B':'C';s.finalBuyer=t.dataset.preset==='inah'?'B':'D';s.purpose='cash';s.arranged=t.dataset.preset==='organized'?'yes':'no';s.authority='unknown';s.checks=defaults().checks;step=0;init();}const node=e.target.closest('[data-node]');if(node){const input=document.querySelector(`[data-name="${node.dataset.node}"]`);input.focus();input.scrollIntoView({block:'center',behavior:'smooth'});}});
$('map').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const node=e.target.closest('[data-node]');if(node){e.preventDefault();node.dispatchEvent(new MouseEvent('click',{bubbles:true}));}}});
$('print').onclick=()=>window.print();$('reset').onclick=()=>{if(confirm('مسح بيانات المخطط المحفوظة على هذا المتصفح؟')){s=defaults();step=0;init();}};
init();
