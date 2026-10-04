const SCOPE=['private','owner','circle'];
const INSIGHT_KEYS=['contribution','needs','strength_sectors','intro_preference','reach_style'];

export const RB_TOOL_DECLARATIONS=[
 {name:'get_member_context',description:'اقرأ الملف المهني الحالي للعضو ونواقصه قبل أن تسأل.',parametersJsonSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'set_profile_basics',description:'احفظ معلومات مهنية قالها العضو بوضوح عن نفسه.',parametersJsonSchema:{type:'object',properties:{company:{type:'string'},role_title:{type:'string'},field:{type:'string'},city:{type:'string'}},additionalProperties:false}},
 {name:'record_profile_insight',description:'احفظ معلومة مهنية مصرحا بها عن العضو.',parametersJsonSchema:{type:'object',properties:{key:{type:'string',enum:INSIGHT_KEYS},value:{type:'string'}},required:['key','value'],additionalProperties:false}},
 {name:'add_relationship',description:'احفظ علاقة مهنية ذكرها العضو. لا تفترض قوة أو قدرة لم يقلها.',parametersJsonSchema:{type:'object',properties:{target_org:{type:'string'},target_person:{type:'string'},target_role:{type:'string'},sector:{type:'string'},city:{type:'string'},last_contact_at:{type:'string'},direct_contact:{type:'boolean'},can_request_meeting:{type:'boolean'},prior_help:{type:'boolean'},scope:{type:'string',enum:SCOPE}},required:['target_org','direct_contact','can_request_meeting','prior_help','scope'],additionalProperties:false}},
 {name:'add_knowledge',description:'احفظ احتياجا أو قدرة أو معرفة عملية قالها العضو.',parametersJsonSchema:{type:'object',properties:{type:{type:'string',enum:['need','offer','insight']},title:{type:'string'},details:{type:'string'},tags:{type:'array',items:{type:'string'}},city:{type:'string'},scope:{type:'string',enum:SCOPE}},required:['type','title','scope'],additionalProperties:false}},
 {name:'get_next_gap',description:'حدد أعلى معلومة مهنية ناقصة تستحق السؤال التالي.',parametersJsonSchema:{type:'object',properties:{},additionalProperties:false}}
];

const db=()=>window.relationsBankCloud?.db;
const user=async()=>{const client=db();if(!client)return null;const {data:{session}}=await client.auth.getSession();return session?.user||null};
const circle=()=>localStorage.getItem('relations_bank_circle_v1')||'';
const clean=(v,max=300)=>String(v??'').trim().slice(0,max);

async function ensureProfile(){
 const client=db(),u=await user(),circleId=circle();
 if(!client||!u||!circleId)throw new Error('member-session-required');
 let {data:p,error}=await client.from('rb_people').select('*').eq('circle_id',circleId).eq('auth_user_id',u.id).maybeSingle();
 if(error)throw error;
 if(!p){
   const name=clean(u.user_metadata?.display_name||u.email?.split('@')[0]||'عضو الدائرة',180);
   const res=await client.from('rb_people').insert({circle_id:circleId,created_by:u.id,auth_user_id:u.id,name,company:'',role_title:'',city:'',field:'',relationship_owner:name,relationship_strength:'medium',notes:'',scope:'owner'}).select('*').single();
   if(res.error)throw res.error;p=res.data;
 }
 return {client,u,circleId,p};
}
async function context(){
 const {client,p}=await ensureProfile();
 const [k,r,a]=await Promise.all([
   client.from('rb_knowledge').select('id,type,title,details,tags,city,scope,source,review_at').eq('person_id',p.id).order('created_at',{ascending:false}).limit(30),
   client.from('rb_relationship_evidence').select('id,target_org,target_person,target_role,sector,city,last_contact_at,direct_contact,can_request_meeting,prior_help,scope').eq('person_id',p.id).order('created_at',{ascending:false}).limit(30),
   client.from('rb_profile_answers').select('question_key,answer,answered_at').eq('person_id',p.id).order('answered_at',{ascending:false}).limit(20)
 ]);
 const answers={};for(const row of a.data||[])if(!(row.question_key in answers))answers[row.question_key]=row.answer;
 const gaps=[];
 if(!p.role_title&&!p.company)gaps.push({key:'role_context',prompt:'وش طبيعة شغلك حاليا، ودورك في الجهة؟'});
 if(!p.field)gaps.push({key:'field',prompt:'وش المجال اللي تعتبر نفسك أقوى فيه مهنيا؟'});
 if(!p.city)gaps.push({key:'city',prompt:'وين يتركز شغلك وعلاقاتك غالبا؟'});
 if(!answers.contribution)gaps.push({key:'contribution',prompt:'الناس عادة ترجع لك في إيش أو تطلب مساعدتك في إيش؟'});
 if(!answers.needs)gaps.push({key:'needs',prompt:'وش الشيء اللي يفيدك أنت حاليا من هذه الدائرة؟'});
 if(!answers.strength_sectors)gaps.push({key:'strength_sectors',prompt:'في أي قطاعات عندك معرفة أو وصول أقوى؟'});
 if(!(r.data||[]).length)gaps.push({key:'relationship',prompt:'أعطني جهة واحدة عندك فيها علاقة فعلية ونبدأ منها.'});
 if(!answers.intro_preference)gaps.push({key:'intro_preference',prompt:'إذا ظهرت فرصة من إحدى علاقاتك، كيف تفضل يتم طلب التعارف عن طريقك؟'});
 return {profile:{id:p.id,name:p.name,company:p.company,role_title:p.role_title,field:p.field,city:p.city},answers,knowledge:k.data||[],relationships:r.data||[],gaps:gaps.slice(0,6)};
}
async function refresh(){try{await window.RBV2?.load?.()}catch{}window.dispatchEvent(new CustomEvent('relationsbank:assistant-saved'))}
export async function executeRBTool(name,args={}){
 if(name==='get_member_context')return {ok:true,context:await context()};
 const {client,u,circleId,p}=await ensureProfile();
 if(name==='set_member_name'){
   const memberName=clean(args.name,180);
   if(!memberName)return {ok:false,error:'name-required'};
   const updated=await client.from('rb_people').update({name:memberName,relationship_owner:memberName}).eq('id',p.id);
   if(updated.error)throw updated.error;
   const saved=await client.from('rb_profile_answers').upsert({circle_id:circleId,created_by:u.id,person_id:p.id,question_key:'name_confirmed',category:'profile',answer:memberName,source:'self',answered_at:new Date().toISOString()},{onConflict:'person_id,question_key,source'});
   if(saved.error)throw saved.error;
   await refresh();
   return {ok:true,persisted:true,name:memberName};
 }
 if(name==='set_profile_basics'){
   const patch={};for(const k of ['company','role_title','field','city'])if(clean(args[k]))patch[k]=clean(args[k],180);
   if(!Object.keys(patch).length)return {ok:false,error:'no-values'};
   const {error}=await client.from('rb_people').update(patch).eq('id',p.id);if(error)throw error;await refresh();return {ok:true,persisted:true,fields:Object.keys(patch)};
 }
 if(name==='record_profile_insight'){
   if(!INSIGHT_KEYS.includes(args.key)||!clean(args.value))return {ok:false,error:'invalid-insight'};
   const {error}=await client.from('rb_profile_answers').upsert({circle_id:circleId,created_by:u.id,person_id:p.id,question_key:args.key,category:args.key==='needs'?'needs':args.key==='contribution'?'contribution':'profile',answer:clean(args.value,1600),source:'self',answered_at:new Date().toISOString()},{onConflict:'person_id,question_key,source'});
   if(error)throw error;await refresh();return {ok:true,persisted:true,key:args.key};
 }
 if(name==='add_relationship'){
   const org=clean(args.target_org,200);if(!org)return {ok:false,error:'target-org-required'};
   const scope=SCOPE.includes(args.scope)?args.scope:'owner';
   const row={circle_id:circleId,created_by:u.id,person_id:p.id,target_org:org,target_person:clean(args.target_person,180),target_role:clean(args.target_role,160),sector:clean(args.sector,120),city:clean(args.city,120),relationship_type:'professional',last_contact_at:/^\d{4}-\d{2}-\d{2}$/.test(clean(args.last_contact_at,10))?args.last_contact_at:null,direct_contact:args.direct_contact===true,can_request_meeting:args.can_request_meeting===true,prior_help:args.prior_help===true,reciprocal:'unknown',confidence:'self_reported',scope,notes:''};
   const {data,error}=await client.from('rb_relationship_evidence').insert(row).select('id').single();if(error)throw error;await refresh();return {ok:true,persisted:true,id:data.id};
 }
 if(name==='add_knowledge'){
   const type=['need','offer','insight'].includes(args.type)?args.type:'insight',title=clean(args.title,240);if(!title)return {ok:false,error:'title-required'};
   const scope=SCOPE.includes(args.scope)?args.scope:'owner',tags=(Array.isArray(args.tags)?args.tags:[]).map(x=>clean(x,80)).filter(Boolean).slice(0,12);
   const {data,error}=await client.from('rb_knowledge').insert({circle_id:circleId,created_by:u.id,person_id:p.id,type,title,details:clean(args.details,1800),tags,city:clean(args.city,120),scope,source:'direct',review_at:new Date(Date.now()+90*86400000).toISOString()}).select('id').single();
   if(error)throw error;await refresh();return {ok:true,persisted:true,id:data.id};
 }
 if(name==='get_next_gap'){const c=await context();return {ok:true,next:c.gaps[0]||null,gaps:c.gaps}}
 return {ok:false,error:'unknown-tool'};
}
window.RBExecuteTool=executeRBTool;