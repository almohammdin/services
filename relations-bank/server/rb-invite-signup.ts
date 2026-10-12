import {corsHeaders} from 'npm:@supabase/supabase-js@2.95.0/cors';
import {createClient} from 'npm:@supabase/supabase-js@2.95.0';
const headers={'Access-Control-Allow-Origin':'https://almohammdin.github.io','Access-Control-Allow-Headers':corsHeaders['Access-Control-Allow-Headers'],'Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const clean=(v:unknown,max=320)=>String(v??'').trim().slice(0,max);
async function hash(v:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(n=>n.toString(16).padStart(2,'0')).join('');}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});if(req.method!=='POST')return reply({ok:false},405);
 let admin:any,createdId='';
 try{
  const body=await req.json().catch(()=>({})),username=clean(body.username,30).toLowerCase(),invite=clean(body.invite_code,12).toLowerCase(),personToken=clean(body.person_invite,64);
  const secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;if(!secret)return reply({ok:false,error:'server'},503);
  admin=createClient(Deno.env.get('SUPABASE_URL')!,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
  const limit=await admin.rpc('rb_allow_login',{p_bucket:await hash(secret+'signup:'+ip)});if(limit.error||!limit.data)return reply({ok:false,error:'rate_limit'},429);
  let circle:any=null;
  if(/^[a-f0-9]{12}$/.test(invite)){const r=await admin.from('rb_circles').select('id,name,active').eq('invite_code',invite).eq('active',true).maybeSingle();if(r.error)throw r.error;circle=r.data;}
  else if(/^[a-f0-9]{64}$/.test(personToken)){
   const r=await admin.from('rb_person_account_invites').select('circle_id').eq('token_hash',await hash(personToken)).is('accepted_by',null).gt('expires_at',new Date().toISOString()).maybeSingle();if(r.error)throw r.error;
   if(r.data){const c=await admin.from('rb_circles').select('id,name,active').eq('id',r.data.circle_id).eq('active',true).maybeSingle();if(c.error)throw c.error;circle=c.data;}
  }
  if(!circle)return reply({ok:false,error:'invalid_invite'},403);
  if(body.action==='inspect_invite')return reply({ok:true,circle_name:circle.name});
  if(!/^[a-z][a-z0-9_]{2,29}$/.test(username))return reply({ok:false,error:'username_format'},400);
  const password=String(body.password||'');if(password.length<12||password.length>256)return reply({ok:false,error:'password'},400);
  const displayName=clean(body.display_name,120)||username,contactEmail=clean(body.contact_email).toLowerCase();
  if(contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))return reply({ok:false,error:'email'},400);
  const existing=await admin.from('rb_login_handles').select('user_id').eq('username',username).maybeSingle();if(existing.error)throw existing.error;if(existing.data)return reply({ok:false,error:'username_taken'},409);
  const created=await admin.auth.admin.createUser({email:'member-'+crypto.randomUUID()+'@accounts.relations-bank.invalid',password,email_confirm:true,user_metadata:{display_name:displayName}});if(created.error)return reply({ok:false,error:'create'},400);createdId=created.data.user.id;
  const handle=await admin.from('rb_login_handles').insert({user_id:createdId,username,contact_email:contactEmail});if(handle.error)throw handle.error;
  const membership=await admin.from('rb_circle_members').insert({circle_id:circle.id,user_id:createdId,role:'member'});if(membership.error)throw membership.error;
  const profile=await admin.from('rb_profiles').upsert({user_id:createdId,display_name:displayName},{onConflict:'user_id'});if(profile.error)throw profile.error;
  createdId='';return reply({ok:true,circle_id:circle.id,role:'member'});
 }catch(e){if(admin&&createdId)await admin.auth.admin.deleteUser(createdId);console.error('rb-invite-signup',e);return reply({ok:false,error:'server'},500);}
});

