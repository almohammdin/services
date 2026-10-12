const taskNames={help:'فهم المنصة',request:'البحث عن مساعدة لطلب',person:'إضافة شخص أو علاقة',profile:'بناء ملفي المهني',manage:'إدارة الدائرة'};
const scopes={private:'خاص بي',owner:'التعارف عن طريقي',circle:'متاح للدائرة'};
const clean=(x,n=240)=>String(x??'').trim().slice(0,n);
let task='help',focus=null,pending=null,identity='',epoch=0,saving=false;
const access=()=>window.relationsBankCloud?.getAccess?.()||{};
const person=id=>(window.RBV2?.people||[]).find(p=>p.id===id&&(!p.circle_id||p.circle_id===access().circle?.id));
function guard(snapshot){const a=access();if(!a.user||!a.circle||!a.ready||window.RBV2?.circleId&&window.RBV2.circleId!==a.circle.id||snapshot&&snapshot!==identity)throw Error('تغير الحساب أو الدائرة. ابدأ العملية في الدائرة الحالية.');return a;}
function changed(){window.dispatchEvent(new CustomEvent('relationsbank:assistant-context',{detail:{task,focus,pending}}));}
function setTask(value){if(!taskNames[value])return;if(value==='manage'&&!window.RBGov?.isChair?.()&&!window.RBGov?.state?.is_platform_owner)return;task=value;focus=null;pending=null;changed();}
function setFocus(value){if(value?.circle_id&&value.circle_id!==access().circle?.id)return;focus=value;changed();}
function stage(kind,args,title,scope='owner'){if(pending)return {ok:false,persisted:false,error:'راجع المسودة الحالية واحفظها أو ألغها قبل إضافة أخرى.'};const a=guard();pending={id:crypto.randomUUID(),kind,args:structuredClone(args),title,scope:scopes[scope]||scope,circleName:a.circle.name,snapshot:identity,epoch};changed();return {ok:true,persisted:false,needs_confirmation:true,summary:title,circle:a.circle.name,visibility:pending.scope,instruction:'اطلب قول احفظ أو الضغط على حفظ. لا تقل تم الحفظ.'};}
async function selfProfile(a){const db=window.relationsBankCloud.db;const r=await db.from('rb_people').select('*').eq('circle_id',a.circle.id).eq('auth_user_id',a.user.id).maybeSingle();if(r.error)throw r.error;if(r.data)return r.data;const name=clean(a.user.user_metadata?.display_name||'صاحب الحساب',180);const s=await db.from('rb_people').insert({circle_id:a.circle.id,created_by:a.user.id,auth_user_id:a.user.id,name,relationship_owner:name,relationship_strength:'medium',scope:'private'}).select('*').single();if(s.error)throw s.error;return s.data;}
async function confirm(){
 if(!pending||saving)return {ok:false,error:'لا توجد إضافة جاهزة للحفظ.'};const item=pending,a=guard(item.snapshot);if(item.epoch!==epoch)throw Error('انتهت المسودة.');saving=true;
 try{const db=window.relationsBankCloud.db,base={circle_id:a.circle.id,created_by:a.user.id};let saved;
  if(item.kind==='person')saved=await db.from('rb_people').insert({...base,...item.args}).select('id').single();
  else if(item.kind==='request')saved=await db.from('rb_requests').insert({...base,...item.args}).select('id').single();
  else{const p=item.args.person_id?person(item.args.person_id):await selfProfile(a);if(!p||p.created_by!==a.user.id&&p.auth_user_id!==a.user.id)throw Error('تعديل هذا الملف غير متاح لحسابك.');const {person_id,...args}=item.args;
   if(item.kind==='profile')saved=await db.from('rb_people').update(args).eq('id',p.id).eq('circle_id',a.circle.id).select('id').single();
   if(item.kind==='insight')saved=await db.from('rb_profile_answers').upsert({...base,person_id:p.id,question_key:args.key,category:args.key==='needs'?'needs':args.key==='contribution'?'contribution':'profile',answer:args.value,source:p.auth_user_id===a.user.id?'self':'owner',answered_at:new Date().toISOString()},{onConflict:'person_id,question_key,source'}).select('id').single();
   if(item.kind==='relationship')saved=await db.from('rb_relationship_evidence').insert({...base,person_id:p.id,...args}).select('id').single();
   if(item.kind==='knowledge')saved=await db.from('rb_knowledge').insert({...base,person_id:p.id,...args,source:'direct'}).select('id').single();
   if(item.kind==='collaboration'){await window.RBGov.api('collaboration_save',{person_id:p.id,preferences:args.preferences,scope:args.scope});saved={data:{id:p.id}};}}
  if(saved?.error)throw saved.error;if(!saved)throw Error('الإجراء غير متاح.');
  if(identity===item.snapshot&&pending?.id===item.id){pending=null;changed();await window.relationsBankCloud?.hydrate?.();await window.RBV2?.load?.();window.dispatchEvent(new CustomEvent('relationsbank:assistant-saved'));if(item.kind==='request')navigate({section:'requests'});}
  return {ok:true,persisted:true,summary:item.title,id:saved.data?.id,circle:item.circleName};
 }finally{saving=false;}
}
function cancel(){pending=null;changed();return {ok:true,persisted:false};}
function navigate(args={}){
 guard();const section=clean(args.section,30),map={home:'#v2Home',requests:'#v2Requests',people:'#v2Profiles',knowledge:'[data-view="knowledge"]',opportunities:'[data-view="opportunities"]',introductions:'[data-view="introductions"]',circles:'#circleScenariosFold',account:'#cloudAuthBtn',circle:'#cloudManageBtn',new_request:'#v2NewRequest',new_person:'#v2AddPerson'};
 if(section==='person'){const p=person(args.person_id);if(!p)throw Error('اختر شخصًا من الدائرة الحالية.');window.RBV2UI?.openPersonDetail(p.id);return {ok:true,opened:p.name};}
 const el=document.querySelector(map[section]||'body > rb-invalid');if(!el)return {ok:false,error:'القسم غير جاهز.'};
 if(['account','circle','new_request','new_person'].includes(section)){el.click();return {ok:true,opened:section};}
 window.RBV2UI?.closeLayer?.();document.querySelector('#modalOverlay [data-close]')?.click();if(el.matches('button'))el.click();if(section==='circles')el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});focus=null;changed();return {ok:true,opened:section};
}
function search(args={}){guard();const query=clean(args.query);if(!query)return {ok:false,error:'اكتب الحاجة أولًا.'};const r={title:query,target_org:clean(args.target_org),target_sector:clean(args.target_sector),target_role:clean(args.target_role),city:clean(args.city)};return {ok:true,candidates:(window.RBV2?.matches?.(r)||[]).slice(0,5).map(m=>({person_id:m.person.id,name:m.person.name,reason:m.factors,score:Math.min(99,m.score)})),note:'ترشيحات من المعلومات المتاحة لحسابك. التعارف يتطلب موافقة صاحب العلاقة.'};}
async function context(){
 const a=guard(),RB=window.RBV2;let p=focus?.type==='person'?person(focus.id):null;
 if(task==='profile'&&!p){const r=await window.relationsBankCloud.db.from('rb_people').select('*').eq('circle_id',a.circle.id).eq('auth_user_id',a.user.id).maybeSingle();if(r.error)throw r.error;p=r.data;}
 const gaps=[];if(task==='profile'){if(!p?.field)gaps.push({key:'field',prompt:'في أي مجال تقدر تساعد الآخرين؟'});if(!p?.role_title&&!p?.company)gaps.push({key:'role_context',prompt:'وش طبيعة عملك؟ تقدر تتجاوز السؤال.'});}
 return {circle:{id:a.circle.id,name:a.circle.name,is_example:!!a.circle.is_example},role:window.RBGov?.state?.is_platform_owner?'platform_owner':window.RBGov?.isChair?.()?'circle_leader':'member',can_create_circle:!!window.RBGov?.state?.can_create_circle,task,task_label:taskNames[task],user:{name:a.user.user_metadata?.display_name||'صاحب الحساب'},focus,profile:p?{id:p.id,name:p.name,company:p.company,role_title:p.role_title,field:p.field,city:p.city,is_self:p.auth_user_id===a.user.id}:null,gaps,pending:pending?{summary:pending.title,visibility:pending.scope,circle:pending.circleName}:null,visible_people:(RB?.people||[]).slice(0,35).map(x=>({id:x.id,name:x.name,field:x.field,company:x.company})),preferences:p?(RB?.collaboration||[]).find(x=>x.person_id===p.id)?.preferences||{}:{}};
}
function target(args){if(args.person_id){if(!person(args.person_id))throw Error('الشخص غير متاح.');return args.person_id;}if(focus?.type==='person')return focus.id;if(task==='profile')return '';throw Error('حدد الشخص المقصود أو اختر بناء ملفي المهني قبل تجهيز الإضافة.');}
async function execute(name,args={}){
 if(['get_member_context','get_platform_context'].includes(name))return {ok:true,context:await context()};if(name==='get_next_gap'){const c=await context();return {ok:true,next:c.gaps[0]||null};}
 if(name==='navigate_platform')return navigate(args);if(name==='search_circle')return search(args);
 if(name==='find_person'){guard();const q=clean(args.query,180),norm=window.RBV2?.norm||((s)=>String(s).toLowerCase());const matches=(window.RBV2?.people||[]).filter(p=>norm(p.name).includes(norm(q)));if(matches.length===1)return navigate({section:'person',person_id:matches[0].id});return {ok:true,candidates:matches.slice(0,5).map(p=>({person_id:p.id,name:p.name,reason:['مطابقة الاسم'],score:0}))};}
if(name==='set_task'){setTask(args.task);return {ok:true,task};}if(name==='cancel_pending')return cancel();
 if(name==='explain_examples'){window.RBAssistant?.startTour?.();return {ok:true,opened:'جولة الأمثلة'};}
 if(name==='select_person'){const p=person(args.person_id);if(!p)throw Error('الشخص غير متاح.');setFocus({type:'person',id:p.id,circle_id:access().circle.id});return {ok:true,selected:p.name};}
 if(name==='create_person'){const name=clean(args.name,180);if(name.length<2)throw Error('اكتب اسم الشخص.');const scope=scopes[args.scope]?args.scope:'owner';return stage('person',{name,company:clean(args.company,180),role_title:clean(args.role_title,180),field:clean(args.field,120),city:clean(args.city,120),notes:clean(args.notes,1600),scope,relationship_owner:access().user?.user_metadata?.display_name||'صاحب العلاقة',relationship_strength:'medium'},'إضافة '+name+' كشخص بلا حساب',scope);}
 if(name==='create_request'){const title=clean(args.title);if(title.length<2)throw Error('وضح الطلب.');const scope=args.scope==='circle'?'circle':'private';return stage('request',{title,details:clean(args.details,1800),target_org:clean(args.target_org,180),target_sector:clean(args.target_sector,120),target_role:clean(args.target_role,160),city:clean(args.city,120),scope,status:'open',urgency:['low','normal','high'].includes(args.urgency)?args.urgency:'normal'},'حفظ الطلب: '+title,scope);}
 const person_id=target(args),label=person_id?person(person_id).name:'ملفك المهني',scope=scopes[args.scope]?args.scope:'owner';
 if(name==='set_profile_basics'){const patch={person_id};for(const k of ['company','role_title','field','city'])if(clean(args[k]))patch[k]=clean(args[k],180);if(Object.keys(patch).length===1)throw Error('لا توجد معلومات.');return stage('profile',patch,'تحديث '+label+': '+Object.entries(patch).filter(([k])=>k!=='person_id').map(([,v])=>v).join('، '),person_id?person(person_id).scope:'private');}
 if(name==='record_profile_insight'){if(!['contribution','needs','strength_sectors','intro_preference','reach_style'].includes(args.key)||!clean(args.value))throw Error('وضح المعلومة.');return stage('insight',{person_id,key:args.key,value:clean(args.value,1600)},'معلومة عن '+label+': '+clean(args.value,400),person_id?person(person_id).scope:'private');}
 if(name==='add_relationship'){const target_org=clean(args.target_org,180);if(!target_org)throw Error('حدد الجهة.');return stage('relationship',{person_id,target_org,target_person:clean(args.target_person,180),target_role:clean(args.target_role,160),sector:clean(args.sector,120),city:clean(args.city,120),last_contact_at:/^\d{4}-\d{2}-\d{2}$/.test(args.last_contact_at||'')?args.last_contact_at:null,direct_contact:args.direct_contact===true,can_request_meeting:args.can_request_meeting===true,prior_help:args.prior_help===true,relationship_type:'professional',reciprocal:'unknown',confidence:'self_reported',scope,notes:''},'علاقة '+label+' بجهة '+target_org,scope);}
 if(name==='add_knowledge'){const title=clean(args.title);if(title.length<2)throw Error('وضح عنوان المعلومة.');return stage('knowledge',{person_id,title,type:['need','offer','insight'].includes(args.type)?args.type:'insight',details:clean(args.details,1800),tags:(Array.isArray(args.tags)?args.tags:[]).map(x=>clean(x,80)).slice(0,12),city:clean(args.city,120),scope},'معلومة لـ '+label+': '+title,scope);}
 if(name==='save_collaboration')return stage('collaboration',{person_id,preferences:args.preferences||{},scope:args.scope==='circle'?'circle':'private'},'أسلوب التعاون والتواصل لـ '+label,args.scope==='circle'?'circle':'private');
 return {ok:false,error:'الإجراء غير متاح للمساعد.'};
}
function syncIdentity(){const a=access(),next=(a.user?.id||'')+':'+(a.circle?.id||'');if(next===identity)return;identity=next;epoch++;pending=null;focus=null;task='help';changed();}
window.addEventListener('relationsbank:access',syncIdentity);window.addEventListener('relationsbank:focus',e=>setFocus(e.detail));syncIdentity();
window.RBAssistantContext={context,execute,confirm,cancel,setTask,navigate,search,guard,taskNames,get pending(){return pending;},get identity(){return identity;},get task(){return task;}};
export {context,execute,confirm,taskNames};
