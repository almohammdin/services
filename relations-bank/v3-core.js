(() => {
'use strict';
const RB=window.RBV2;if(!RB)return;
const KEY='relations_bank_v3_local_20261004';
const R3=window.RBV3={opportunities:[],contributions:[],agreements:[],splits:[],events:[],nominations:[],loading:false};

function local(){
  try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return {
    opportunities:x.opportunities||[],contributions:x.contributions||[],agreements:x.agreements||[],
    splits:x.splits||[],events:x.events||[],nominations:x.nominations||[]
  }}catch{return {opportunities:[],contributions:[],agreements:[],splits:[],events:[],nominations:[]}}
}
function save(){if(!RB.cloud)localStorage.setItem(KEY,JSON.stringify({
  opportunities:R3.opportunities,contributions:R3.contributions,agreements:R3.agreements,
  splits:R3.splits,events:R3.events,nominations:R3.nominations
}))}
async function ins(table,row){
  if(!RB.cloud){row.id=row.id||RB.uuid();row.created_at=row.created_at||new Date().toISOString();return row}
  const {data,error}=await RB.db.from(table).insert(row).select('*').single();if(error)throw error;return data;
}
async function upd(table,id,patch){
  if(!RB.cloud){const arr=mapTable(table),i=arr.findIndex(x=>x.id===id);if(i>=0)Object.assign(arr[i],patch);save();return arr[i]}
  const {data,error}=await RB.db.from(table).update(patch).eq('id',id).select('*').single();if(error)throw error;return data;
}
function mapTable(t){
  return ({rb_opportunities:R3.opportunities,rb_success_agreements:R3.agreements,rb_nominations:R3.nominations})[t]||[];
}
R3.load=async()=>{
  if(R3.loading)return;R3.loading=true;
  try{
    if(!RB.cloud){Object.assign(R3,local());window.dispatchEvent(new CustomEvent('rbv3:data'));return}
    const c=RB.circleId;
    const [o,co,a,s,e,n]=await Promise.all([
      RB.db.from('rb_opportunities').select('*').eq('circle_id',c).order('created_at',{ascending:false}),
      RB.db.from('rb_opportunity_contributions').select('*').eq('circle_id',c).order('created_at',{ascending:true}),
      RB.db.from('rb_success_agreements').select('*').eq('circle_id',c).order('created_at',{ascending:false}),
      RB.db.from('rb_success_splits').select('*').eq('circle_id',c).order('created_at',{ascending:true}),
      RB.db.from('rb_success_events').select('*').eq('circle_id',c).order('occurred_at',{ascending:false}),
      RB.db.from('rb_nominations').select('*').eq('circle_id',c).order('created_at',{ascending:false})
    ]);
    const err=o.error||co.error||a.error||s.error||e.error||n.error;if(err){console.error('V3 load',err);return}
    R3.opportunities=o.data||[];R3.contributions=co.data||[];R3.agreements=a.data||[];
    R3.splits=s.data||[];R3.events=e.data||[];R3.nominations=n.data||[];
    window.dispatchEvent(new CustomEvent('rbv3:data'));
  }finally{R3.loading=false}
};
R3.request=id=>RB.requests.find(x=>x.id===id)||null;
R3.opportunity=id=>R3.opportunities.find(x=>x.id===id)||null;
R3.agreementFor=oppId=>R3.agreements.find(x=>x.opportunity_id===oppId)||null;
R3.contributionsFor=oppId=>R3.contributions.filter(x=>x.opportunity_id===oppId);
R3.splitsFor=agreementId=>R3.splits.filter(x=>x.agreement_id===agreementId);
R3.eventsFor=agreementId=>R3.events.filter(x=>x.agreement_id===agreementId);
R3.rewardLabel=a=>!a?'لم يحدد':({
  none:'بدون مكافأة',fixed:'مبلغ ثابت',revenue_percent:'نسبة من الإيراد',
  collected_revenue_percent:'نسبة من الإيراد المحصل',margin_percent:'نسبة من الهامش',custom:'اتفاق خاص'
})[a.reward_type]||a.reward_type;
R3.stageLabel=s=>({
  proposed:'مرشحة',review:'مراجعة',approved:'معتمدة',introduced:'تم التعارف',
  meeting:'اجتماع',proposal:'عرض',negotiation:'تفاوض',won:'تمت',lost:'توقفت',closed:'مغلقة'
})[s]||s;
R3.createOpportunity=async(req,candidate)=>{
  const exists=R3.opportunities.find(x=>x.request_id===req.id&&x.matched_person_id===candidate.person.id);
  if(exists)return exists;
  const row={id:RB.cloud?undefined:RB.uuid(),circle_id:RB.circleId||'local',created_by:RB.user?.id||'local',
    request_id:req.id,matched_person_id:candidate.person.id,title:req.title,stage:'proposed',
    source_note:candidate.factors.join(' · ')};
  if(!row.id)delete row.id;
  const opp=await ins('rb_opportunities',row);R3.opportunities.unshift(opp);
  const reqCon={id:RB.cloud?undefined:RB.uuid(),opportunity_id:opp.id,circle_id:RB.circleId||'local',
    contributor_user_id:RB.user?.id||null,contributor_person_id:null,contributor_name:RB.user?.email||'صاحب الطلب',
    contribution_role:'request_source',contribution_note:'أنشأ الطلب الذي ولدت منه الفرصة'};
  if(!reqCon.id)delete reqCon.id;
  const relCon={id:RB.cloud?undefined:RB.uuid(),opportunity_id:opp.id,circle_id:RB.circleId||'local',
    contributor_user_id:null,contributor_person_id:candidate.person.id,contributor_name:candidate.person.name,
    contribution_role:'relationship_owner',contribution_note:'مسار العلاقة الذي ظهر في المطابقة'};
  if(!relCon.id)delete relCon.id;
  const [c1,c2]=await Promise.all([ins('rb_opportunity_contributions',reqCon),ins('rb_opportunity_contributions',relCon)]);
  R3.contributions.push(c1,c2);save();window.dispatchEvent(new CustomEvent('rbv3:data'));return opp;
};
R3.saveAgreement=async(oppId,data,splitRows)=>{
  const existing=R3.agreementFor(oppId);
  let agreement;
  if(existing){agreement=await upd('rb_success_agreements',existing.id,data);Object.assign(existing,agreement)}
  else{
    const row={id:RB.cloud?undefined:RB.uuid(),opportunity_id:oppId,circle_id:RB.circleId||'local',
      created_by:RB.user?.id||'local',...data};if(!row.id)delete row.id;
    agreement=await ins('rb_success_agreements',row);R3.agreements.unshift(agreement);
  }
  if(existing){
    if(RB.cloud){
      const {error}=await RB.db.from('rb_success_splits').delete().eq('agreement_id',agreement.id);
      if(error)throw error;
    }
    R3.splits=R3.splits.filter(x=>x.agreement_id!==agreement.id);
  }
  if(splitRows?.length){
    for(const x of splitRows){
      const row={id:RB.cloud?undefined:RB.uuid(),agreement_id:agreement.id,circle_id:RB.circleId||'local',...x};
      if(!row.id)delete row.id;
      R3.splits.push(await ins('rb_success_splits',row));
    }
  }
  save();window.dispatchEvent(new CustomEvent('rbv3:data'));return agreement;
};
R3.recordEvent=async(agreement,event)=>{
  const row={id:RB.cloud?undefined:RB.uuid(),agreement_id:agreement.id,circle_id:RB.circleId||'local',
    created_by:RB.user?.id||'local',...event};if(!row.id)delete row.id;
  const saved=await ins('rb_success_events',row);R3.events.unshift(saved);
  if(event.event_type===agreement.trigger_event){
    const updated=await upd('rb_success_agreements',agreement.id,{status:'earned'});
    Object.assign(agreement,updated);
  }
  save();window.dispatchEvent(new CustomEvent('rbv3:data'));return saved;
};
R3.updateStage=async(opp,stage)=>{const x=await upd('rb_opportunities',opp.id,{stage});Object.assign(opp,x);window.dispatchEvent(new CustomEvent('rbv3:data'));return x};
R3.nominate=async(data)=>{
  const row={id:RB.cloud?undefined:RB.uuid(),circle_id:RB.circleId||'local',nominated_by:RB.user?.id||'local',
    name:data.name,contact_hint:data.contact_hint||'',why_value:data.why_value||'',status:'suggested'};
  if(!row.id)delete row.id;const n=await ins('rb_nominations',row);R3.nominations.unshift(n);save();window.dispatchEvent(new CustomEvent('rbv3:data'));return n;
};
window.addEventListener('rbv2:data',()=>R3.load());
setTimeout(()=>R3.load(),700);
})();