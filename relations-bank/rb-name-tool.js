export async function getNameState(){
  const db=window.relationsBankCloud?.db;
  const access=window.relationsBankCloud?.getAccess?.();
  const circleId=access?.circle?.id||localStorage.getItem('relations_bank_circle_v1')||'';
  const user=access?.user;
  if(!db||!user||!circleId)return {confirmed:false,name:''};
  const {data:person,error}=await db.from('rb_people').select('id,name').eq('circle_id',circleId).eq('auth_user_id',user.id).maybeSingle();
  if(error)throw error;
  if(!person)return {confirmed:false,name:user.user_metadata?.display_name||''};
  const {data:answer}=await db.from('rb_profile_answers').select('answer').eq('person_id',person.id).eq('question_key','name_confirmed').eq('source','self').maybeSingle();
  return {confirmed:!!answer,name:String(answer?.answer||person.name||'').trim(),personId:person.id};
}

export async function saveMemberName(value){
  const name=String(value||'').trim().slice(0,180);
  if(!name)return {ok:false,error:'name-required'};
  const db=window.relationsBankCloud?.db;
  const access=window.relationsBankCloud?.getAccess?.();
  const circleId=access?.circle?.id||localStorage.getItem('relations_bank_circle_v1')||'';
  const user=access?.user;
  if(!db||!user||!circleId)return {ok:false,error:'member-session-required'};
  let {data:person,error}=await db.from('rb_people').select('id').eq('circle_id',circleId).eq('auth_user_id',user.id).maybeSingle();
  if(error)throw error;
  if(!person){
    const created=await db.from('rb_people').insert({circle_id:circleId,created_by:user.id,auth_user_id:user.id,name,company:'',role_title:'',city:'',field:'',relationship_owner:name,relationship_strength:'medium',notes:'',scope:'owner'}).select('id').single();
    if(created.error)throw created.error;person=created.data;
  }else{
    const updated=await db.from('rb_people').update({name,relationship_owner:name}).eq('id',person.id);
    if(updated.error)throw updated.error;
  }
  const saved=await db.from('rb_profile_answers').upsert({circle_id:circleId,created_by:user.id,person_id:person.id,question_key:'name_confirmed',category:'profile',answer:name,source:'self',answered_at:new Date().toISOString()},{onConflict:'person_id,question_key,source'});
  if(saved.error)throw saved.error;
  try{await db.auth.updateUser({data:{display_name:name}})}catch{}
  try{await window.RBV2?.load?.()}catch{}
  return {ok:true,persisted:true,name};
}

window.RBNameTool={getNameState,saveMemberName};

function bindNameFirstStep(){
  const form=document.getElementById('rbAiForm'),input=document.getElementById('rbAiText');
  if(!form||!input)return setTimeout(bindNameFirstStep,120);
  if(form.dataset.nameFirstBound==='1')return;
  form.dataset.nameFirstBound='1';
  form.addEventListener('submit',async event=>{
    let state;try{state=await getNameState()}catch{return}
    if(state?.confirmed)return;
    event.preventDefault();event.stopImmediatePropagation();
    const raw=input.value.trim();if(!raw)return;
    input.value='';
    const host=document.getElementById('rbAiChat');
    const add=(role,text)=>{if(!host||!text)return;const el=document.createElement('div');el.className='rb-ai-msg '+role;el.textContent=text;host.appendChild(el);host.scrollTop=host.scrollHeight};
    add('user',raw);
    const yes=/^(اي|ايوه|أيوه|نعم|صح|صحيح|تمام|يب|yes)$/i;
    let memberName=(state?.name&&state.name!=='عضو'&&yes.test(raw))?state.name:'';
    if(!memberName){
      const m=raw.match(/(?:اسمي|أنا|انا)\s+(.{2,80})$/);
      memberName=(m?.[1]||raw).replace(/[.!؟]+$/,'').trim();
    }
    if(memberName.length<2){add('assistant','وش الاسم اللي نعتمده؟');return}
    try{
      const saved=await saveMemberName(memberName);
      if(!saved?.ok)return;
      add('assistant','حياك الله '+saved.name+'.');
      const live=document.getElementById('rbAiLive');if(live)live.textContent='حياك الله '+saved.name+'.';
      const gap=await window.RBExecuteTool?.('get_next_gap',{});
      if(gap?.next?.prompt)add('assistant',gap.next.prompt);
    }catch(error){console.error(error)}
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindNameFirstStep,{once:true});else bindNameFirstStep();
