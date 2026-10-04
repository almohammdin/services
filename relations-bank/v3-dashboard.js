(() => {
'use strict';
const RB=window.RBV2,R3=window.RBV3;if(!RB||!R3)return;
const $=RB.$,$$=RB.$$;
const stages=['proposed','review','approved','introduced','meeting','proposal','negotiation','won','closed'];
function contributionLabel(r){return ({request_source:'مصدر الطلب',relationship_owner:'صاحب العلاقة',information_source:'مصدر المعلومة',introducer:'من نفذ التعارف',followup:'المتابعة',other:'مساهمة أخرى'})[r]||r}
function statusLabel(s){return ({draft:'مسودة',proposed:'مقترح',accepted:'مقبول',active:'نشط',earned:'مستحق',cancelled:'ملغي',expired:'منتهي'})[s]||s}
function summary(a){if(!a)return 'لم يحدد اتفاق مكافأة لهذه الفرصة';if(a.reward_type==='none')return 'هذه الفرصة بدون مكافأة نجاح';const v=a.fixed_amount?('SAR '+Number(a.fixed_amount).toLocaleString('en-US')):(a.percentage!=null?('% '+Number(a.percentage).toLocaleString('en-US')):'');return [R3.rewardLabel(a),v,statusLabel(a.status)].filter(Boolean).join(' · ')}
function build(){
  const host=document.querySelector('#v2Workspace .shell');if(!host||document.getElementById('v3Economics'))return;
  const sec=document.createElement('section');sec.className='v3-section';sec.id='v3Economics';
  let pipe='';stages.forEach(s=>pipe+='<div class="v3-step"><b>'+R3.stageLabel(s)+'</b><span data-stage-count="'+s+'">0 فرصة</span></div>');
  sec.innerHTML='<div class="v3-head"><div><span class="v3-kicker">الفرص والاستحقاقات</span><h2>من أين جاءت الفرصة؟ ومن يستحق ماذا إذا نجحت؟</h2></div><button class="v2-btn gold" id="v3NominateBtn">+ رشّح عضوا للدائرة</button></div><div class="v3-value-strip" id="v3Stats"></div><div class="v3-pipeline">'+pipe+'</div><div class="v3-grid" id="v3Opportunities"></div><div class="v3-head" style="margin-top:22px"><div><span class="v3-kicker">الترشيحات</span><h2 style="font-size:20px">أعضاء مقترحون للدائرة</h2></div></div><div class="v3-nominations" id="v3Nominations"></div>';
  const first=document.querySelector('#v2Workspace .v2-section');host.insertBefore(sec,first||null);
  $('#v3NominateBtn').onclick=()=>window.RBV3Dialogs&&window.RBV3Dialogs.openNomination();
  const k=document.querySelector('.v2-kicker');if(k)k.textContent='بنك العلاقات والفرص';
}
function renderStats(){
  const el=$('#v3Stats');if(!el)return;
  const vals=[[R3.opportunities.filter(x=>!['lost','closed'].includes(x.stage)).length,'فرص نشطة'],[R3.agreements.filter(x=>x.reward_type!=='none').length,'فرص بمكافأة'],[R3.agreements.filter(x=>x.status==='earned').length,'استحقاقات تحققت'],[R3.nominations.filter(x=>['suggested','review'].includes(x.status)).length,'ترشيحات للمراجعة']];
  el.innerHTML=vals.map(x=>'<div class="v3-value"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');
  $$('[data-stage-count]').forEach(n=>{n.textContent=R3.opportunities.filter(x=>x.stage===n.dataset.stageCount).length+' فرصة'})
}
function renderOpportunities(){
  const el=$('#v3Opportunities');if(!el)return;
  if(!R3.opportunities.length){el.innerHTML='<div class="v2-note" style="grid-column:1/-1">بعد ظهور مرشح داخل أي طلب اضغط «حوّل إلى فرصة». عندها يبدأ سجل أصل الفرصة ومكافأة النجاح إن وجدت.</div>';return}
  el.innerHTML=R3.opportunities.map(o=>{
    const p=RB.person(o.matched_person_id),r=R3.request(o.request_id),a=R3.agreementFor(o.id),cs=R3.contributionsFor(o.id);
    const prov=cs.slice(0,3).map((c,i)=>'<div class="v3-prov"><i>'+(i+1)+'</i><div><b>'+contributionLabel(c.contribution_role)+'</b><span>'+RB.esc(c.contributor_name||c.contribution_note)+'</span></div></div>').join('');
    return '<article class="v3-card"><div class="v3-top"><div><h3>'+RB.esc(o.title)+'</h3><p>'+RB.esc(p.name)+(r&&r.target_org?' · '+RB.esc(r.target_org):'')+'</p></div><span class="v3-stage '+RB.esc(o.stage)+'">'+R3.stageLabel(o.stage)+'</span></div><div class="v3-provenance">'+prov+'</div><div class="v3-agreement"><strong>'+(a?R3.rewardLabel(a):'مكافأة النجاح')+'</strong><span>'+RB.esc(summary(a))+'</span></div><div class="v3-actions"><button class="v2-btn" data-v3-open="'+RB.esc(o.id)+'">فتح الفرصة</button><button class="v2-btn primary" data-v3-agreement="'+RB.esc(o.id)+'">'+(a?'عرض الاتفاق':'حدد مكافأة النجاح')+'</button></div></article>';
  }).join('');
  $$('[data-v3-open]',el).forEach(b=>b.onclick=()=>window.RBV3Dialogs&&window.RBV3Dialogs.openOpportunity(b.dataset.v3Open));
  $$('[data-v3-agreement]',el).forEach(b=>b.onclick=()=>window.RBV3Agreement&&window.RBV3Agreement.open(b.dataset.v3Agreement));
}
function renderNominations(){
  const el=$('#v3Nominations');if(!el)return;
  if(!R3.nominations.length){el.innerHTML='<div class="v2-note" style="grid-column:1/-1">لا توجد ترشيحات حاليا. العضوية لا تمنح أي نسبة لمجرد الدعوة.</div>';return}
  el.innerHTML=R3.nominations.map(n=>'<article class="v3-nom"><strong>'+RB.esc(n.name)+'</strong><span>'+RB.esc(n.why_value||'بدون وصف')+'</span>'+(n.contact_hint?'<span>'+RB.esc(n.contact_hint)+'</span>':'')+'<em class="v3-nom-status">'+RB.esc(n.status)+'</em></article>').join('')
}
function decorate(){
  $$('.v2-request-card').forEach(card=>{
    const req=R3.request(card.dataset.v2Request);if(!req)return;const ms=RB.matches(req);
    $$('.v2-match',card).forEach((row,i)=>{
      if(row.querySelector('[data-v3-convert]')||!ms[i])return;
      const m=ms[i],btn=document.createElement('button');btn.className='v2-btn gold';btn.type='button';btn.dataset.v3Convert=req.id;btn.textContent='حوّل إلى فرصة';
      btn.onclick=async()=>{btn.disabled=true;try{await R3.createOpportunity(req,m);render()}catch(e){console.error(e);alert('تعذر إنشاء الفرصة')}finally{btn.disabled=false}};
      row.appendChild(btn);
    })
  })
}
function render(){build();renderStats();renderOpportunities();renderNominations();decorate()}
window.RBV3Dashboard={render,stages,summary,contributionLabel};
window.addEventListener('rbv2:data',()=>setTimeout(render,40));window.addEventListener('rbv3:data',()=>setTimeout(render,40));setTimeout(render,1000);
})();