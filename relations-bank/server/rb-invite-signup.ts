import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const headers={
 "Access-Control-Allow-Origin":"https://almohammdin.github.io",
 "Access-Control-Allow-Headers":"content-type, apikey, authorization, x-client-info",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Content-Type":"application/json"
};
const clean=(v,max=320)=>String(v??"").trim().slice(0,max);

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return new Response(JSON.stringify({ok:false}),{status:405,headers});
 try{
   const body=await req.json().catch(()=>({}));
   const username=clean(body.username,30).toLowerCase();
   const contactEmail=clean(body.contact_email).toLowerCase();
   const email=username?('member-'+crypto.randomUUID()+'@accounts.relations-bank.invalid'):clean(body.email).toLowerCase();
   const password=String(body.password||"");
   const displayName=clean(body.display_name,120);
   const invite=clean(body.invite_code,32).toLowerCase();

   if(username&&!/^[a-z][a-z0-9_]{2,29}$/.test(username))return new Response(JSON.stringify({ok:false,error:"username_format"}),{status:400,headers});
   if(contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))return new Response(JSON.stringify({ok:false,error:"email"}),{status:400,headers});
   if(!email.includes("@"))return new Response(JSON.stringify({ok:false,error:"email"}),{status:400,headers});
   if(password.length<8)return new Response(JSON.stringify({ok:false,error:"password"}),{status:400,headers});
   if(displayName.length<2)return new Response(JSON.stringify({ok:false,error:"name"}),{status:400,headers});

   const url=Deno.env.get("SUPABASE_URL")!;
   const secret=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
   const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
   if(username){
     const existing=await admin.from('rb_login_handles').select('user_id').eq('username',username).maybeSingle();
     if(existing.error)throw existing.error;
     if(existing.data)return new Response(JSON.stringify({ok:false,error:'username_taken'}),{status:409,headers});
   }

   const boot=await admin.from("rb_platform_bootstrap").select("owner_user_id").eq("id",1).maybeSingle();
   if(boot.error)throw boot.error;

   let circleId="";
   let role="member";

   if(boot.data){
     if(!/^[a-f0-9]{12}$/i.test(invite))return new Response(JSON.stringify({ok:false,error:"invite_required"}),{status:403,headers});
     const circle=await admin.from("rb_circles").select("id").eq("invite_code",invite).eq("active",true).maybeSingle();
     if(circle.error)throw circle.error;
     if(!circle.data)return new Response(JSON.stringify({ok:false,error:"invalid_invite"}),{status:403,headers});
     circleId=circle.data.id;
   }

   const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:displayName}});
   if(created.error){
     const msg=String(created.error.message||"").toLowerCase();
     const error=msg.includes("registered")||msg.includes("exists")?"exists":"create";
     return new Response(JSON.stringify({ok:false,error}),{status:400,headers});
   }
   const user=created.data.user;
   if(username){
     const handle=await admin.from('rb_login_handles').insert({user_id:user.id,username,contact_email:contactEmail});
     if(handle.error){
       await admin.auth.admin.deleteUser(user.id);
       return new Response(JSON.stringify({ok:false,error:handle.error.code==='23505'?'username_taken':'server'}),{status:409,headers});
     }
   }

   if(!boot.data){
     role="owner";
     const bootInsert=await admin.from("rb_platform_bootstrap").insert({id:1,owner_user_id:user.id});
     if(bootInsert.error)throw bootInsert.error;
     const circle=await admin.from("rb_circles").insert({name:"دائرة المؤسسين",created_by:user.id}).select("id").single();
     if(circle.error)throw circle.error;
     circleId=circle.data.id;
   }

   const membership=await admin.from("rb_circle_members").insert({circle_id:circleId,user_id:user.id,role});
   if(membership.error)throw membership.error;

   const profile=await admin.from("rb_profiles").upsert({user_id:user.id,display_name:displayName},{onConflict:"user_id"});
   if(profile.error)throw profile.error;

   return new Response(JSON.stringify({ok:true,circle_id:circleId,role}),{headers});
 }catch(error){
   console.error("rb-invite-signup",error);
   return new Response(JSON.stringify({ok:false,error:"server"}),{status:500,headers});
 }
});
