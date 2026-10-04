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