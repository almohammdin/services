(() => {
'use strict';
const RB=window.RBV2,R3=window.RBV3,D=()=>window.RBV3Dashboard;if(!RB||!R3)return;
const $=RB.$,$$=RB.$$;
function eventLabel(t){return ({meeting:'اجتماع',proposal:'عرض',signed:'توقيع',invoice:'فاتورة',collected:'تحصيل',closed:'إغلاق'})[t]||t}
function fmtMoney(v,c='SAR'){return c+' '+Number(v).toLocaleString('en-US',{maximumFractionDigits:2})}
function openOpportunity(id){
  const o=R3.opportunity(id);if(!o)return;
  const p=RB.person(o.matched_person_id),r=R3.request(o.request_id),a=R3.agreementFor(o.id),cs=R3.contributionsFor(o.id),events=a?R3.eventsFor(a.id):[],stages=D().stages,current=stages.indexOf(o.stage);
  let pipeline='',prov='',timeline='';
  stages.forEach((s,i)=>pipeline+='<button type="button" class="v3-step '+(i===current?'active':'')+'" data-v3-stage="'+s+'"><b>'+R3.stageLabel(s)+'</b><span>'+(i<current?'تم':i===current?'الحالية':'التالي')+'</span></button>');
  cs.forEach((c,i)=>prov+='<div class="v3-prov"><i>'+(i+1)+'</i><div><b>'+D().contributionLabel(c.contribution_role)+'</b><span>'+RB.esc(c.contributor_name||c.contribution_note)+'</span></div></div>');
  events.forEach(e=>timeline+='<div class="v3-event"><time>'+new Date(e.occurred_at).toLocaleDateString('ar-SA-u-nu-latn')+'</time><div><b>'+eventLabel(e.event_type)+(e.event_value?' · '+fmtMoney(e.event_value,a.currency):'')+'</b><span>'+RB.esc(e.note||'')+'</span></div></div>');
  window.RBV2UI.openLayer('<section class="v2-modal"><div class="v2-modal-head"><div><span class="v3-kicker">سجل أصل الفرصة</span><h2>'+RB.esc(o.title)+'</h2><div style="color:#6A7780;font-size:12px">'+RB.esc(p.name)+(r&&r.target_org?' · '+RB.esc(r.target_org):'')+'</div></div><button class="v2-close" data-v2-close>×</button></div><div class="v3-pipeline">'+pipeline+'</div><h3 style="color:#0D3656;margin:17px 0 8px">كيف ولدت هذه الفرصة؟</h3><div class="v3-provenance">'+(prov||'<div class="v2-note">لم تسجل مساهمات بعد.</div>')+'</div><div class="v3-agreement"><strong>'+(a?R3.rewardLabel(a):'مكافأة النجاح')+'</strong><span>'+RB.esc(D().summary(a))+'</span></div><div class="v3-actions"><button class="v2-btn primary" id="v3AgreementFromOpp">'+(a?'عرض الاتفاق':'حدد مكافأة النجاح')+'</button>'+(a?'<button class="v2-btn green" id="v3EventBtn">سجل حدثا</button>':'')+'</div>'+(a?'<h3 style="color:#0D3656;margin:18px 0 8px">سجل التحقق</h3><div class="v3-timeline">'+(timeline||'<div class="v2-note">لم يسجل حدث تحقق بعد.</div>')+'</div>':'')+'</section>');
  $$('[data-v3-stage]').forEach(b=>b.onclick=async()=>{await R3.updateStage(o,b.dataset.v3Stage);openOpportunity(id);D().render()});
  $('#v3AgreementFromOpp').onclick=()=>window.RBV3Agreement&&window.RBV3Agreement.open(id);
  if(a&&$('#v3EventBtn'))$('#v3EventBtn').onclick=()=>openEvent(id,a.id);
}
function openEvent(oppId,agreementId){
  const a=R3.agreements.find(x=>x.id===agreementId);if(!a)return;
  window.RBV2UI.openLayer('<section class="v2-modal"><div class="v2-modal-head"><div><span class="v3-kicker">تحقق النتيجة</span><h2>سجل حدثا على الفرصة</h2></div><button class="v2-close" data-v2-close>×</button></div><form class="v2-form" id="v3EventForm"><label><span>الحدث</span><select name="event_type"><option value="meeting">اجتماع</option><option value="proposal">عرض</option><option value="signed">توقيع</option><option value="invoice">فاتورة</option><option value="collected">تحصيل</option><option value="closed">إغلاق</option></select></label><label><span>القيمة إن وجدت</span><input name="event_value" type="number" min="0" step="0.01"></label><label class="wide"><span>ملاحظة</span><textarea name="note" rows="3"></textarea></label><div class="v3-actions wide"><button class="v2-btn" type="button" data-v2-close>إلغاء</button><button class="v2-btn primary">حفظ الحدث</button></div></form></section>');
  $('#v3EventForm').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.currentTarget),t=f.get('event_type');
    try{
      await R3.recordEvent(a,{event_type:t,event_value:f.get('event_value')?Number(f.get('event_value')):null,note:String(f.get('note')||''),occurred_at:new Date().toISOString()});
      const stage={meeting:'meeting',proposal:'proposal',signed:'won',collected:'won',closed:'closed'}[t];
      if(stage)await R3.updateStage(R3.opportunity(oppId),stage);
      window.RBV2UI.closeLayer();D().render();
    }catch(err){console.error(err);alert('تعذر حفظ الحدث')}
  }
}
function openNomination(){
  window.RBV2UI.openLayer('<section class="v2-modal"><div class="v2-modal-head"><div><span class="v3-kicker">ترشيح لا عضوية تلقائية</span><h2>رشّح شخصا يضيف قيمة للدائرة</h2></div><button class="v2-close" data-v2-close>×</button></div><div class="v3-warning">الترشيح لا يعطيك نسبة من أعمال الشخص لاحقا. الاستحقاق المالي يرتبط فقط بمساهمة فعلية في فرصة محددة.</div><form class="v2-form" id="v3NomForm"><label class="wide"><span>الاسم *</span><input name="name" required></label><label class="wide"><span>لماذا وجوده مفيد للدائرة؟ *</span><textarea name="why_value" rows="4" required></textarea></label><label class="wide"><span>وسيلة تعريف مختصرة</span><input name="contact_hint"></label><div class="v3-actions wide"><button class="v2-btn" type="button" data-v2-close>إلغاء</button><button class="v2-btn primary">إرسال الترشيح</button></div></form></section>');
  $('#v3NomForm').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);
    try{await R3.nominate({name:String(f.get('name')).trim(),why_value:String(f.get('why_value')).trim(),contact_hint:String(f.get('contact_hint')).trim()});window.RBV2UI.closeLayer();D().render()}
    catch(err){console.error(err);alert('تعذر حفظ الترشيح')}
  }
}
window.RBV3Dialogs={openOpportunity,openEvent,openNomination};
})();