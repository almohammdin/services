(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const labels={invalid_session:'سجل الدخول مجددًا.',platform_owner_required:'هذا الإجراء متاح لمالك المنصة.',approved_leader_required:'يلزم اعتمادك كرئيس دائرة قبل إنشاء دائرة.',circle_leader_required:'هذا الإجراء متاح لرئيس هذه الدائرة.',circle_name:'اكتب اسم دائرة من حرفين إلى 120 حرفًا.',person_invite_invalid:'رابط الربط منتهي أو مستخدم أو غير صالح.',person_already_linked:'الملف مرتبط بحساب بالفعل.',account_has_profile:'حسابك مرتبط بملف آخر في هذه الدائرة. اطلب من رئيس الدائرة مراجعة الملفين.',partner_circle_invalid:'الدائرة الأخرى غير متاحة لاتفاق مشترك.',reward_invalid:'راجع نوع المكافأة ووقت الاستحقاق.',reward_amount:'أدخل مبلغ مكافأة موجبًا.',reward_percentage:'أدخل نسبة من أكثر من صفر إلى 100.',shares_total:'حصص المستفيدين يجب أن يكون مجموعها 100%.',custom_terms:'اكتب شروط الاتفاق الخاص.',agreement_locked:'الاتفاق معتمد ولا يمكن تغيير حصصه.',agreement_version:'تغير الاتفاق أو حالته. حدّث الصفحة وراجع النسخة الحالية.',agreement_not_approved:'يلزم اعتماد الاتفاق قبل تسجيل نتيجة.',event_invalid:'نوع الحدث غير صالح.',event_value_required:'أدخل قيمة مالية موجبة للحدث.',collaboration_invalid:'راجع اختيارات أسلوب التعاون.',member_required:'هذا الإجراء يتطلب عضوية الدائرة.',person_not_found:'لم نجد هذا الملف.',person_example:'هذا ملف تجريبي ولا يُربط بحساب حقيقي.'};
 const G=window.RBGov={state:{},incoming:[]};
 G.api=async(action,body={})=>{
  const db=window.relationsBankCloud?.db;if(!db)throw Error('الاتصال غير جاهز.');
  const {data,error}=await db.functions.invoke('rb-governance',{body:{action,...body}});
  let code=data?.error;
  if(error){try{code=(await error.context.json()).error}catch{code='operation_failed';}}
  if(error||code)throw Error(labels[code]||'تعذر إكمال العملية. حاول مجددًا.');
  return data||{};
 };
 G.refresh=async()=>{
  const a=window.relationsBankCloud?.getAccess?.();if(!a?.user)return;
  G.state=await G.api('context',{circle_id:a.circle?.id||''});
  G.renderRole();return G.state;
 };
 G.isChair=()=>{const a=window.relationsBankCloud?.getAccess?.();return !!a?.user&&a.circle?.created_by===a.user.id;};
 G.renderRole=()=>{
  let badge=$('#rbRoleBadge');if(!badge){badge=document.createElement('span');badge.id='rbRoleBadge';badge.className='rb-role-badge';$('.top-actions')?.prepend(badge);}
  badge.textContent=G.state.is_platform_owner?'مالك المنصة':G.isChair()?'رئيس هذه الدائرة':'مستخدم في هذه الدائرة';
  const section=$('#cloudCreateCircleBtn')?.closest('.cloud-section');if(section)section.hidden=!G.state.can_create_circle;
  let admin=$('#rbPlatformAdmin');
  if(!admin){admin=document.createElement('button');admin.id='rbPlatformAdmin';admin.type='button';admin.className='cloud-btn';admin.textContent='إدارة المنصة';$('.top-actions')?.append(admin);admin.onclick=G.openPlatform;}
  admin.hidden=!G.state.is_platform_owner;
 };
 G.openPlatform=async()=>{
  try{
   const [data,ledger]=await Promise.all([G.api('platform_users'),G.api('platform_rewards')]);
   window.RBV2UI.openLayer(`<section class="v2-modal"><div class="v2-modal-head"><div><h2>رؤساء الدوائر المعتمدون</h2><p>الاعتماد يتيح إنشاء دوائر. صلاحيات كل دائرة تخص رئيسها وأعضاءها.</p></div><button class="v2-close" data-v2-close aria-label="إغلاق">×</button></div><div class="rb-member-list">${data.users.map(u=>`<div><span><strong>${esc(u.name)}</strong><small>${esc(u.username||'')} ${u.is_owner?'مالك المنصة':u.approved?'معتمد لإنشاء دوائر':'مستخدم عادي'}</small></span>${u.is_owner?'':`<button class="v2-btn" data-approve-user="${esc(u.user_id)}" data-approved="${u.approved?'1':'0'}">${u.approved?'إيقاف إنشاء دوائر جديدة':'اعتماد رئيس دائرة'}</button>`}</div>`).join('')}</div><p class="rb-gov-note">إيقاف إنشاء دوائر جديدة لا يغيّر إدارة الدوائر القائمة.</p><p id="rbAdminMsg" role="status" aria-live="polite"></p><h3>مكافآت المنصة</h3><p class="rb-gov-note">آخر 200 اتفاق مالي. تفاصيل الأشخاص والعلاقات تبقى داخل دوائرها.</p><div class="rb-member-list">${ledger.rewards.length?ledger.rewards.map(a=>`<div><span><strong>${esc(a.circle_name)}</strong><small>${esc(a.status)} ${a.fixed_amount?window.RBMoney.html(a.fixed_amount,a.currency):esc(a.percentage??0)+'%'}</small></span><span>حصة المنصة ${Number(a.platform_share)}%</span></div>`).join(''):'<p>لا توجد مكافآت مالية مسجلة.</p>'}</div></section>`);
   $('[data-approve-user]')&&document.querySelectorAll('[data-approve-user]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await G.api('approve_leader',{user_id:b.dataset.approveUser,approved:b.dataset.approved!=='1'});await G.openPlatform();}catch(e){$('#rbAdminMsg').textContent=e.message;b.disabled=false;}});
  }catch(e){alert(e.message);}
 };
 G.renderManagement=async()=>{
  await G.refresh();
  const pane=$('#cloudManagePane');if(!pane)return;
  let box=$('#rbCircleManagement');if(!box){box=document.createElement('div');box.id='rbCircleManagement';box.className='cloud-section';pane.append(box);}
  box.hidden=!G.isChair();
  if(!G.isChair())return;
  const a=window.relationsBankCloud.getAccess();
  const data=await G.api('circle_members',{circle_id:a.circle.id});
  box.innerHTML=`<strong>إدارة دائرتك</strong><form class="cloud-form" id="rbCircleSettings"><label><span>اسم الدائرة</span><input name="name" value="${esc(a.circle.name)}" minlength="2" maxlength="120" required></label><label class="rb-check"><input type="checkbox" name="partnerships" ${a.circle.partnerships_enabled?'checked':''}><span>إظهار اسم الدائرة لرؤساء الدوائر لتنسيق فرص مشتركة</span></label><p class="cloud-hint">هذا الخيار يشارك اسم الدائرة فقط. ملفات الأشخاص والعلاقات تبقى بصلاحياتها.</p><button class="cloud-btn primary">حفظ إعدادات الدائرة</button><p id="rbCircleSettingsMsg" role="status" aria-live="polite"></p></form><strong style="margin-top:14px">حسابات الدائرة</strong><div class="rb-member-list">${data.members.map(m=>`<div><span>${esc(m.name)}</span><small>${m.user_id===a.circle.created_by?'رئيس الدائرة':'مستخدم'}</small></div>`).join('')}</div>`;
  $('#rbCircleSettings').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;try{await G.api('circle_update',{circle_id:a.circle.id,name:f.elements.name.value,partnerships_enabled:f.elements.partnerships.checked});await window.relationsBankCloud.hydrate();}catch(err){$('#rbCircleSettingsMsg').textContent=err.message;b.disabled=false;}};
 };
 const prefLabels={contact_channel:'طريقة التواصل',detail_level:'مستوى التفاصيل',intro_style:'طريقة التعارف',collaboration_role:'الدور المفضل في التعاون'};
 const prefValues={contact_channel:{message:'رسالة مكتوبة',call:'مكالمة',meeting:'لقاء',flexible:'مرن'},detail_level:{brief:'مختصر',detailed:'تفصيلي',depends:'حسب الموضوع'},intro_style:{ask_first:'اسألني قبل التعارف',group_intro:'تعارف برسالة مشتركة',direct_intro:'تعارف مباشر بعد الاتفاق'},collaboration_role:{connector:'أربط الأشخاص',expert:'أقدم خبرة',executor:'أساعد في التنفيذ',explorer:'أستكشف الأفكار'}};
 G.renderPerson=id=>{
  const RB=window.RBV2,p=RB?.person(id),layer=$('#v2ModalLayer .v2-modal');if(!p||!layer)return;
  const a=window.relationsBankCloud.getAccess(),own=p.created_by===a.user?.id||p.auth_user_id===a.user?.id;
  const profile=(RB.collaboration||[]).find(x=>x.person_id===id),preferences=profile?.preferences||{};
  const wrap=document.createElement('section');wrap.className='rb-collaboration';
  wrap.innerHTML=`<h3>أسلوب التعاون والتواصل</h3><p class="rb-gov-note">اختياري، بناءً على ما يصرح به الشخص. لا توجد درجة شخصية ولا يؤثر في ترتيب مرشحي الفرص.</p>${own?`<form id="rbCollaborationForm" class="v2-form">${Object.entries(prefLabels).map(([key,label])=>`<label><span>${label}</span><select name="${key}"><option value="">بدون تحديد</option>${Object.entries(prefValues[key]).map(([value,name])=>`<option value="${value}" ${preferences[key]===value?'selected':''}>${name}</option>`).join('')}</select></label>`).join('')}<label class="wide"><span>المشاركة</span><select name="scope"><option value="private">خاص بي وبصاحب الملف المرتبط</option><option value="circle" ${profile?.scope==='circle'?'selected':''}>متاح للدائرة</option></select></label><div class="wide"><button class="v2-btn primary">حفظ التفضيلات</button><p id="rbCollaborationMsg" role="status" aria-live="polite"></p></div></form>`:Object.entries(preferences).map(([k,v])=>`<div class="v2-rel"><strong>${prefLabels[k]||''}</strong><span>${prefValues[k]?.[v]||''}</span></div>`).join('')||'<p>لم تُشارك تفضيلات تعاون لهذا الملف.</p>'}`;
  if((own||G.isChair())&&!p.auth_user_id&&!p.is_example)wrap.innerHTML+='<div class="rb-link-person"><h3>ربط الشخص بحساب لاحقًا</h3><p>أنشئ رابطًا للشخص ليقبله بنفسه بعد تسجيل الدخول. قبول الدعوة يربط هذا الملف بحسابه ويتيح له قراءة بياناته وتحديثها.</p><button class="v2-btn" id="rbCreatePersonLink">إنشاء رابط ربط الحساب</button><p id="rbPersonLinkMsg" role="status" aria-live="polite"></p></div>';
  if(p.auth_user_id)wrap.innerHTML+='<p class="rb-gov-note">هذا الملف مرتبط بحساب.</p>';
  layer.append(wrap);
  const form=$('#rbCollaborationForm');if(form)form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{const values=Object.fromEntries(new FormData(form)),scope=values.scope;delete values.scope;await G.api('collaboration_save',{person_id:id,preferences:values,scope});await RB.load();$('#rbCollaborationMsg').textContent='تم حفظ التفضيلات.';}catch(err){$('#rbCollaborationMsg').textContent=err.message;}finally{button.disabled=false;}};
  const link=$('#rbCreatePersonLink');if(link)link.onclick=async()=>{link.disabled=true;try{const result=await G.api('person_link_create',{person_id:id});const msg=$('#rbPersonLinkMsg');msg.textContent='الرابط صالح 7 أيام ويُستخدم مرة واحدة.';const input=document.createElement('input');input.type='text';input.readOnly=true;input.dir='ltr';input.value=result.url;input.setAttribute('aria-label','رابط ربط الحساب');msg.append(input);const copy=document.createElement('button');copy.type='button';copy.className='v2-btn';copy.textContent='نسخ الرابط';copy.onclick=async()=>{try{await navigator.clipboard.writeText(result.url);copy.textContent='تم النسخ';}catch{input.select();}};msg.append(copy);}catch(err){$('#rbPersonLinkMsg').textContent=err.message;}finally{link.disabled=false;}};
 };
 G.renderPendingLink=()=>{
  const token=new URLSearchParams(location.search).get('person_invite');if(!token||!window.relationsBankCloud?.getAccess?.().user)return;
  if($('#rbPendingPersonLink'))return;
  const box=document.createElement('section');box.id='rbPendingPersonLink';box.className='rb-examples-guide';box.innerHTML='<div><h2>دعوة ربط ملفك بحسابك</h2><p>قبول الدعوة يربط الملف الذي أرسل لك بحسابك داخل دائرته، ويتيح لك قراءة بياناته وتحديثها.</p></div><button class="cloud-btn primary" id="rbAcceptPersonLink">قبول ربط الملف</button><p id="rbAcceptPersonMsg" role="status" aria-live="polite"></p>';
  document.querySelector('main')?.prepend(box);
  $('#rbAcceptPersonLink').onclick=async()=>{const b=$('#rbAcceptPersonLink');b.disabled=true;try{const result=await G.api('person_link_accept',{token});localStorage.setItem('relations_bank_circle_v1',result.circle_id);const url=new URL(location.href);url.searchParams.delete('person_invite');url.searchParams.delete('invite');history.replaceState(null,'',url);location.reload();}catch(e){$('#rbAcceptPersonMsg').textContent=e.message;b.disabled=false;}};
 };
 window.addEventListener('relationsbank:access',()=>{G.refresh().then(()=>G.renderPendingLink()).catch(()=>{});});
})();
