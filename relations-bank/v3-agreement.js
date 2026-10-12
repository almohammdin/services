(() => {
 'use strict';
 const RB=window.RBV2,R3=window.RBV3;if(!RB||!R3)return;
 const $=RB.$,esc=RB.esc,G=()=>window.RBGov,D=()=>window.RBV3Dashboard;
 const labelStatus=s=>({draft:'مسودة',proposed:'بانتظار رئيس الدائرة الأخرى',accepted:'معتمد من رؤساء الدوائر',active:'نشط',earned:'مستحق',cancelled:'ملغي',expired:'منتهي'})[s]||s;
 const pool=a=>{const events=R3.eventsFor(a.id).filter(e=>e.event_type===a.trigger_event||(e.event_type==='invoice'&&a.trigger_event==='first_invoice'));if(a.status!=='earned')return null;if(a.reward_type==='fixed')return Number(a.fixed_amount);if(a.percentage!=null){const base=a.reward_type==='collected_revenue_percent'?events.reduce((v,e)=>v+Number(e.event_value||0),0):Number(events.at(-1)?.event_value||0);return base*Number(a.percentage)/100;}return null;};
 async function showAgreement(a){
  const splits=await RB.db.from('rb_success_splits').select('*').eq('agreement_id',a.id);
  const approval=await RB.db.from('rb_agreement_approvals').select('circle_id,approval_version').eq('agreement_id',a.id);
  if(splits.error||approval.error)throw splits.error||approval.error;
  const total=pool(a),details=splits.data.map(x=>`<div class="v3-value"><b>${Number(x.pool_share_percent)}%</b><span>${esc(x.beneficiary_name)}</span>${total!=null?'<strong>'+window.RBMoney.html(total*Number(x.pool_share_percent)/100,a.currency)+'</strong>':''}</div>`).join('');
  const approved=c=>approval.data.some(x=>x.circle_id===c&&x.approval_version===a.approval_version);
  window.RBV2UI.openLayer(`<section class="v2-modal"><div class="v2-modal-head"><div><h2>المستفيدون والموافقات</h2></div><button class="v2-close" data-v2-close aria-label="إغلاق">×</button></div><div class="v3-agreement"><strong>${labelStatus(a.status)}</strong><span>${D().summaryHtml(a)}</span></div><div class="v3-value-strip">${details||'<p>هذه الفرصة بدون مكافأة.</p>'}</div>${total!=null?'<p>إجمالي المكافأة المستحقة '+window.RBMoney.html(total,a.currency)+'</p>':''}<div class="rb-approval-list"><span>موافقة رئيس الدائرة المصدر: ${approved(a.circle_id)?'مسجلة':'لم تسجل'}</span>${a.counterparty_circle_id?`<span>موافقة رئيس الدائرة الأخرى: ${approved(a.counterparty_circle_id)?'مسجلة':'لم تسجل'}</span>`:''}</div><p>${esc(a.terms_note||'')}</p><p class="rb-gov-note">هذه سجلات استحقاق. تسجيل حدث لا ينفذ تحويلًا ماليًا.</p></section>`);
 }
 async function open(id){
  const o=R3.opportunity(id);if(!o)return;const a=R3.agreementFor(id);
  if(a&&!['draft','proposed'].includes(a.status)){try{await showAgreement(a);}catch(e){alert(e.message);}return;}
  if(!G()?.isChair()){
   if(a){try{await showAgreement(a);}catch(e){alert(e.message);}return;}
   window.RBV2UI.openLayer('<section class="v2-modal"><div class="v2-modal-head"><h2>مكافأة الفرصة</h2><button class="v2-close" data-v2-close aria-label="إغلاق">×</button></div><p>تسجيل وعرض تفاصيل مكافأة الفرصة متاح لرؤساء الدوائر والمنصة.</p></section>');return;
  }
  try{
   const access=window.relationsBankCloud.getAccess(),partners=(await G().api('partner_circles',{circle_id:access.circle.id})).circles||[],splits=a?R3.splitsFor(a.id):[];
   const first=splits.find(x=>x.beneficiary_circle_id===access.circle.id)?.pool_share_percent??'',second=splits.find(x=>x.beneficiary_circle_id===a?.counterparty_circle_id)?.pool_share_percent??'',platform=splits.find(x=>x.beneficiary_type==='platform')?.pool_share_percent??'';
   window.RBV2UI.openLayer(`<section class="v2-modal"><div class="v2-modal-head"><div><h2>اتفاق مكافأة النجاح</h2></div><button class="v2-close" data-v2-close aria-label="إغلاق">×</button></div><p class="v3-warning">المكافأة اختيارية ولا توجد نسبة افتراضية. حصص المستفيدين توزع المكافأة نفسها. الاتفاق المشترك ينتظر موافقة رئيس الدائرة الأخرى.</p><form class="v2-form" id="v3RewardForm"><label class="wide"><span>نوع المكافأة</span><select name="reward_type"><option value="none">بدون مكافأة</option><option value="fixed">مبلغ ثابت</option><option value="collected_revenue_percent">نسبة من الإيراد المحصل</option><option value="margin_percent">نسبة من الهامش</option><option value="custom">اتفاق خاص</option></select></label><label id="rbFixedField"><span>إجمالي المكافأة ${window.RBMoney.symbolHtml}</span><input name="fixed_amount" type="number" min="0.01" step="0.01"></label><label id="rbPercentField"><span>نسبة المكافأة من أساس الاحتساب %</span><input name="percentage" type="number" min="0.01" max="100" step="0.01"></label><label class="wide"><span>أساس الاحتساب</span><input name="reward_base_note" maxlength="500" placeholder="مثال: الإيراد المحصل من هذه الفرصة"></label><label><span>وقت الاستحقاق</span><select name="trigger_event"><option value="collected">عند التحصيل</option><option value="signed">عند التوقيع</option><option value="first_invoice">عند أول فاتورة</option><option value="custom">حسب الاتفاق</option></select></label><label><span>مدة الاستحقاق بالأيام</span><input name="attribution_days" type="number" min="1" max="1825" value="180" required></label><label class="wide"><span>الدائرة المشاركة في الفرصة</span><select name="counterparty_circle_id"><option value="">فرصة داخل دائرتي</option>${partners.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label><p class="wide rb-gov-note">تظهر الدوائر التي سمح رؤساؤها بالتنسيق المشترك. مشاركة اتفاق المكافأة لا تكشف ملفات الأشخاص في الدائرة الأخرى.</p><label><span>حصة رئيس دائرة ${esc(access.circle.name)} %</span><input name="primary_share" type="number" min="0" max="100" step="0.01" value="${first}"></label><label id="rbSecondaryShare"><span>حصة رئيس الدائرة الأخرى %</span><input name="secondary_share" type="number" min="0" max="100" step="0.01" value="${second}"></label><label><span>حصة المنصة %</span><input name="platform_share" type="number" min="0" max="100" step="0.01" value="${platform}"></label><label class="wide"><span>شروط الاتفاق</span><textarea name="terms_note" rows="3" maxlength="3000"></textarea></label><div class="v3-total wide" id="v3RewardTotal"></div><p class="wide" id="rbAgreementMsg" role="status" aria-live="polite"></p><div class="v3-actions wide"><button type="button" class="v2-btn" data-v2-close>إلغاء</button><button class="v2-btn primary" type="submit">حفظ مسودة</button><button type="button" class="v2-btn green" id="v3RewardAccept">إرسال واعتماد حصتي</button></div></form></section>`);
   const f=$('#v3RewardForm');if(a){for(const key of ['reward_type','fixed_amount','percentage','reward_base_note','trigger_event','attribution_days','counterparty_circle_id','terms_note'])if(f.elements[key])f.elements[key].value=a[key]??'';}
   const refresh=()=>{
    const type=f.elements.reward_type.value,shared=!!f.elements.counterparty_circle_id.value;
    $('#rbFixedField').hidden=type!=='fixed';f.elements.fixed_amount.required=type==='fixed';
    $('#rbPercentField').hidden=!['collected_revenue_percent','margin_percent','revenue_percent'].includes(type);f.elements.percentage.required=!$('#rbPercentField').hidden;
    $('#rbSecondaryShare').hidden=!shared;f.elements.secondary_share.disabled=!shared;
    const total=(Number(f.elements.primary_share.value)||0)+(shared?Number(f.elements.secondary_share.value)||0:0)+(Number(f.elements.platform_share.value)||0);
    $('#v3RewardTotal').textContent='مجموع حصص المكافأة '+total+'%';$('#v3RewardTotal').className='v3-total wide '+(type==='none'||Math.abs(total-100)<.001?'good':'bad');return total;
   };
   f.addEventListener('input',refresh);refresh();
   async function save(submit){
    if(!f.reportValidity())return;const total=refresh(),values=Object.fromEntries(new FormData(f));
    if(values.reward_type!=='none'&&Math.abs(total-100)>.001){$('#rbAgreementMsg').textContent='حصص المستفيدين يجب أن يكون مجموعها 100%.';return;}
    const buttons=[...f.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
    try{const shares={primary:Number(values.primary_share)||0,secondary:values.counterparty_circle_id?Number(values.secondary_share)||0:0,platform:Number(values.platform_share)||0};for(const k of ['primary_share','secondary_share','platform_share'])delete values[k];const result=await R3.saveAgreement(id,values,shares,submit);window.RBV2UI.closeLayer();D().render();if(result.status==='proposed')alert('حُفظت موافقتك. الاتفاق ينتظر موافقة رئيس الدائرة الأخرى.');}
    catch(e){$('#rbAgreementMsg').textContent=e.message;buttons.forEach(b=>b.disabled=false);}
   }
   f.onsubmit=e=>{e.preventDefault();save(false);};$('#v3RewardAccept').onclick=()=>save(true);
  }catch(e){alert(e.message);}
 }
 let incomingBusy=false,lastCircle='',lastLoad=0;
 async function renderIncoming(force=false){
  const access=window.relationsBankCloud?.getAccess?.();if(!access?.circle||!G()?.isChair()){document.getElementById('rbIncomingAgreements')?.remove();return;}
  if(incomingBusy||(!force&&lastCircle===access.circle.id&&Date.now()-lastLoad<1500))return;incomingBusy=true;
  try{
   const data=await G().api('incoming_agreements',{circle_id:access.circle.id});lastCircle=access.circle.id;lastLoad=Date.now();if(window.relationsBankCloud.getAccess().circle?.id!==access.circle.id)return;
   let host=$('#rbIncomingAgreements');if(!host){host=document.createElement('section');host.id='rbIncomingAgreements';host.className='v3-section';$('#v3Economics')?.after(host);}
   host.innerHTML=data.agreements.length?`<div class="v3-head"><h2>اتفاقات مشتركة واردة</h2></div>${data.agreements.map(a=>`<article class="rb-incoming-card"><h3>اتفاق من دائرة ${esc(a.primary_circle_name)}</h3><p>${D().summaryHtml(a)}</p><p>${esc(a.terms_note||'')}</p><strong>${labelStatus(a.status)}</strong>${a.status==='proposed'?`<div class="v3-actions"><button class="v2-btn primary" data-approve-agreement="${esc(a.id)}" data-version="${a.approval_version}">اعتماد الاتفاق وحصتي</button></div>`:''}<button class="v2-btn" data-view-shares="${esc(a.id)}">عرض المستفيدين والحصص</button><p role="status" aria-live="polite"></p></article>`).join('')}`:'';
   host.querySelectorAll('[data-approve-agreement]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await G().api('agreement_approve',{agreement_id:b.dataset.approveAgreement,version:Number(b.dataset.version)});incomingBusy=false;await renderIncoming(true);}catch(e){b.closest('article').querySelector('[role=status]').textContent=e.message;b.disabled=false;}});
   host.querySelectorAll('[data-view-shares]').forEach(b=>b.onclick=async()=>{try{await showAgreement(data.agreements.find(x=>x.id===b.dataset.viewShares));}catch(e){alert(e.message);}});
  }catch{console.error('Incoming agreements unavailable');}finally{incomingBusy=false;}
 }
 window.RBV3Agreement={open,renderIncoming};
})();
