import {corsHeaders} from 'npm:@supabase/supabase-js@2.95.0/cors';
import {createClient} from 'npm:@supabase/supabase-js@2.95.0';
const headers={'Access-Control-Allow-Origin':'https://almohammdin.github.io','Access-Control-Allow-Headers':corsHeaders['Access-Control-Allow-Headers'],'Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const clean=(v:unknown,max=300)=>String(v??'').trim().slice(0,max);
const uuid=(v:unknown)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
async function hash(v:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
const errorCodes=['platform_owner_required','approved_leader_required','circle_leader_required','circle_name','person_invite_invalid','person_already_linked','account_has_profile','partner_circle_invalid','reward_invalid','reward_amount','reward_percentage','shares_total','custom_terms','agreement_locked','agreement_version','agreement_not_approved','event_invalid','event_value_required','user_not_found','person_not_found','person_example','collaboration_invalid','member_required'];
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 try{
  const secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
  const db=createClient(Deno.env.get('SUPABASE_URL')!,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
  const checked=await db.auth.getUser(token),user=checked.data?.user;
  if(checked.error||!user)return reply({error:'invalid_session'},401);
  const b=await req.json().catch(()=>({})),action=clean(b.action,60);
  const boot=await db.from('rb_platform_bootstrap').select('owner_user_id').eq('id',1).single();
  if(boot.error)throw boot.error;
  const platformOwner=boot.data.owner_user_id===user.id;
  const membership=async(id:string)=>{const r=await db.from('rb_circle_members').select('role').eq('circle_id',id).eq('user_id',user.id).maybeSingle();if(r.error)throw r.error;return r.data;};
  const getCircle=async(id:string)=>{if(!uuid(id))throw Error('member_required');const r=await db.from('rb_circles').select('id,name,created_by,active,partnerships_enabled').eq('id',id).eq('active',true).maybeSingle();if(r.error)throw r.error;return r.data;};
  const requireChair=async(id:string)=>{const c=await getCircle(id);if(!c||c.created_by!==user.id)throw Error('circle_leader_required');return c;};
  const rpc=async(name:string,args:Record<string,unknown>)=>{const r=await db.rpc(name,args);if(r.error)throw r.error;return r.data;};
  if(action==='context'){
   const [approval,memberships]=await Promise.all([db.from('rb_leader_approvals').select('approved').eq('user_id',user.id).maybeSingle(),db.from('rb_circle_members').select('circle_id,role').eq('user_id',user.id)]);
   if(approval.error||memberships.error)throw approval.error||memberships.error;
   const c=uuid(b.circle_id)?await getCircle(b.circle_id):null;
   return reply({ok:true,is_platform_owner:platformOwner,can_create_circle:platformOwner||!!approval.data?.approved,is_circle_leader:!!c&&c.created_by===user.id,memberships:memberships.data||[]});
  }
  if(action==='platform_users'){
   if(!platformOwner)throw Error('platform_owner_required');
   const [profiles,approvals,handles]=await Promise.all([db.from('rb_profiles').select('user_id,display_name'),db.from('rb_leader_approvals').select('user_id,approved'),db.from('rb_login_handles').select('user_id,username')]);
   if(profiles.error||approvals.error||handles.error)throw profiles.error||approvals.error||handles.error;
   return reply({users:(profiles.data||[]).map(p=>({user_id:p.user_id,name:p.display_name||'مستخدم',username:handles.data?.find(h=>h.user_id===p.user_id)?.username||'',approved:approvals.data?.find(a=>a.user_id===p.user_id)?.approved||false,is_owner:p.user_id===boot.data.owner_user_id}))});
  }
  if(action==='platform_rewards'){
   if(!platformOwner)throw Error('platform_owner_required');
   const rewards=await db.from('rb_success_agreements').select('id,circle_id,reward_type,fixed_amount,percentage,currency,status').neq('reward_type','none').order('created_at',{ascending:false}).limit(200);if(rewards.error)throw rewards.error;
   const ids=(rewards.data||[]).map(a=>a.id),circleIds=(rewards.data||[]).map(a=>a.circle_id);
   const [splits,circles]=await Promise.all([ids.length?db.from('rb_success_splits').select('agreement_id,pool_share_percent').in('agreement_id',ids).eq('beneficiary_type','platform').eq('beneficiary_user_id',user.id):Promise.resolve({data:[],error:null}),circleIds.length?db.from('rb_circles').select('id,name').in('id',circleIds):Promise.resolve({data:[],error:null})]);
   if(splits.error||circles.error)throw splits.error||circles.error;
   return reply({rewards:(rewards.data||[]).map(a=>({...a,circle_name:circles.data?.find(c=>c.id===a.circle_id)?.name||'دائرة',platform_share:splits.data?.find(s=>s.agreement_id===a.id)?.pool_share_percent??0}))});
  }
  if(action==='approve_leader')return reply(await rpc('rb_set_leader_approval',{p_actor:user.id,p_user:b.user_id,p_approved:b.approved===true}));
  if(action==='create_circle')return reply({circle:await rpc('rb_create_owned_circle',{p_user:user.id,p_name:clean(b.name,120)})});
  if(action==='circle_update'){
   await requireChair(b.circle_id);const name=clean(b.name,120);if(name.length<2)throw Error('circle_name');
   const r=await db.from('rb_circles').update({name,partnerships_enabled:b.partnerships_enabled===true}).eq('id',b.circle_id);if(r.error)throw r.error;
   return reply({ok:true});
  }
  if(action==='circle_members'){
   await requireChair(b.circle_id);
   const [ms,ps]=await Promise.all([db.from('rb_circle_members').select('user_id,role').eq('circle_id',b.circle_id),db.from('rb_profiles').select('user_id,display_name')]);
   if(ms.error||ps.error)throw ms.error||ps.error;
   return reply({members:(ms.data||[]).map(m=>({...m,name:ps.data?.find(p=>p.user_id===m.user_id)?.display_name||'مستخدم'}))});
  }
  if(action==='partner_circles'){
   await requireChair(b.circle_id);
   const r=await db.from('rb_circles').select('id,name').eq('active',true).eq('partnerships_enabled',true).neq('id',b.circle_id);if(r.error)throw r.error;
   return reply({circles:r.data||[]});
  }
  if(action==='person_link_create'){
   if(!uuid(b.person_id))throw Error('person_not_found');
   const p=await db.from('rb_people').select('id,circle_id,created_by,auth_user_id,is_example').eq('id',b.person_id).maybeSingle();if(p.error)throw p.error;
   if(!p.data)throw Error('person_not_found');
   if(p.data.is_example)throw Error('person_example');
   const c=await getCircle(p.data.circle_id);
   if(!c||!(await membership(c.id))||(p.data.created_by!==user.id&&c.created_by!==user.id))throw Error('circle_leader_required');
   if(p.data.auth_user_id)throw Error('person_already_linked');
   const raw=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
   const saved=await db.from('rb_person_account_invites').insert({circle_id:c.id,person_id:p.data.id,invited_by:user.id,token_hash:await hash(raw)});if(saved.error)throw saved.error;
   const invite=await db.from('rb_circles').select('invite_code').eq('id',c.id).single();if(invite.error)throw invite.error;
   return reply({ok:true,url:'https://almohammdin.github.io/services/relations-bank/?invite='+invite.data.invite_code+'&person_invite='+raw,expires_in_days:7});
  }
  if(action==='person_link_accept'){
   const value=clean(b.token,128);if(!/^[a-f0-9]{64}$/.test(value))throw Error('person_invite_invalid');
   return reply(await rpc('rb_accept_person_account_invite',{p_user:user.id,p_hash:await hash(value)}));
  }
  if(action==='collaboration_save'){
   const p=await db.from('rb_people').select('id,circle_id,created_by,auth_user_id').eq('id',b.person_id).maybeSingle();if(p.error)throw p.error;
   if(!p.data)throw Error('person_not_found');
   if(!(await membership(p.data.circle_id))||(p.data.created_by!==user.id&&p.data.auth_user_id!==user.id))throw Error('member_required');
   const enums:Record<string,string[]>={contact_channel:['message','call','meeting','flexible'],detail_level:['brief','detailed','depends'],intro_style:['ask_first','group_intro','direct_intro'],collaboration_role:['connector','expert','executor','explorer']};
   const prefs:Record<string,string>={};
   for(const [key,values] of Object.entries(enums)){const v=clean(b.preferences?.[key],40);if(v&&!values.includes(v))throw Error('collaboration_invalid');if(v)prefs[key]=v;}
   const existing=await db.from('rb_collaboration_profiles').select('created_by').eq('person_id',p.data.id).maybeSingle();if(existing.error)throw existing.error;
   const saved=await db.from('rb_collaboration_profiles').upsert({person_id:p.data.id,circle_id:p.data.circle_id,created_by:existing.data?.created_by||user.id,preferences:prefs,scope:b.scope==='circle'?'circle':'private',updated_at:new Date().toISOString()},{onConflict:'person_id'});if(saved.error)throw saved.error;
   return reply({ok:true});
  }
  if(action==='agreement_save')return reply({agreement:await rpc('rb_save_named_agreement',{p_user:user.id,p_opportunity:b.opportunity_id,p_values:b.values||{},p_shares:b.shares||{},p_submit:b.submit===true})});
  if(action==='agreement_approve')return reply({agreement:await rpc('rb_approve_named_agreement',{p_user:user.id,p_agreement:b.agreement_id,p_version:b.version})});
  if(action==='agreement_event')return reply({event:await rpc('rb_record_approved_event',{p_user:user.id,p_agreement:b.agreement_id,p_event:b.event||{}})});
  if(action==='incoming_agreements'){
   const c=await getCircle(b.circle_id);if(!c||c.created_by!==user.id)return reply({agreements:[]});
   const r=await db.from('rb_success_agreements').select('*').eq('counterparty_circle_id',c.id).neq('status','draft');if(r.error)throw r.error;
   const ids=(r.data||[]).map(a=>a.circle_id);
   const names=ids.length?await db.from('rb_circles').select('id,name').in('id',ids):{data:[],error:null};if(names.error)throw names.error;
   return reply({agreements:(r.data||[]).map(a=>({...a,primary_circle_name:names.data?.find(n=>n.id===a.circle_id)?.name||'دائرة أخرى'}))});
  }
  return reply({error:'invalid_action'},400);
 }catch(e){
  const message=String((e as {message?:string})?.message||e),code=errorCodes.find(c=>message.includes(c));
  return reply({error:code||'operation_failed'},code?.endsWith('_required')?403:code?400:500);
 }
});
