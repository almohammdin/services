import {execute} from './rb-assistant-context.js?v=20261012-5';
import {localId,safeOutput} from './rb-assistant-privacy.js?v=20261012-5';
const str={type:'string'},scope={type:'string',enum:['private','owner','circle']};
const define=(name,description,properties={},required=[])=>({name,description,parametersJsonSchema:{type:'object',properties,required,additionalProperties:false}});
export const RB_TOOL_DECLARATIONS=[
 define('get_platform_context','اقرأ الدائرة والدور والهدف والملف المفتوح دون إنشاء ملف.'),
 define('get_member_context','اقرأ السياق دون إنشاء سجل.'),
 define('set_task','اختر هدف المستخدم الصريح.',{task:{type:'string',enum:['help','request','person','profile','manage']}},['task']),
 define('navigate_platform','افتح قسمًا أو ملفًا دون حفظ.',{section:{type:'string',enum:['home','requests','people','knowledge','opportunities','introductions','circles','account','circle','person','new_request','new_person']},person_id:str},['section']),
 define('find_person','ابحث عن اسم قاله المستخدم وافتح الملف إذا كانت النتيجة واحدة.',{query:str},['query']),
 define('search_circle','ابحث في الدائرة واشرح أسباب الترشيح.',{query:str,target_org:str,target_sector:str,target_role:str,city:str},['query']),
 define('explain_examples','ابدأ الجولة المرئية للأمثلة بطلب المستخدم.'),
 define('select_person','حدد الشخص من الملفات المتاحة.',{person_id:str},['person_id']),
 define('create_person','جهز شخصًا بلا حساب قبل الحفظ.',{name:str,company:str,role_title:str,field:str,city:str,notes:str,scope},['name']),
 define('create_request','جهز طلبًا للمراجعة والحفظ.',{title:str,details:str,target_org:str,target_sector:str,target_role:str,city:str,scope,urgency:{type:'string',enum:['low','normal','high']}},['title']),
 define('set_profile_basics','جهز معلومات الشخص المقصود.',{person_id:str,company:str,role_title:str,field:str,city:str}),
 define('record_profile_insight','جهز معلومة صريحة عن الشخص.',{person_id:str,key:{type:'string',enum:['contribution','needs','strength_sectors','intro_preference','reach_style']},value:str},['key','value']),
 define('add_relationship','جهز علاقة دون افتراض القدرة أو القوة.',{person_id:str,target_org:str,target_person:str,target_role:str,sector:str,city:str,last_contact_at:str,direct_contact:{type:'boolean'},can_request_meeting:{type:'boolean'},prior_help:{type:'boolean'},scope},['target_org']),
 define('add_knowledge','جهز احتياجًا أو قدرة أو معرفة.',{person_id:str,type:{type:'string',enum:['need','offer','insight']},title:str,details:str,tags:{type:'array',items:str},city:str,scope},['type','title']),
 define('save_collaboration','جهز أسلوب تعاون اختياريًا مصرحًا به.',{person_id:str,preferences:{type:'object',properties:{contact_channel:{type:'string',enum:['message','call','meeting','flexible']},detail_level:{type:'string',enum:['brief','detailed','depends']},intro_style:{type:'string',enum:['ask_first','group_intro','direct_intro']},collaboration_role:{type:'string',enum:['connector','expert','executor','explorer']}},additionalProperties:false},scope},['preferences']),
 define('cancel_pending','ألغ المسودة الحالية.'),define('get_next_gap','سؤال مهني عند اختيار بناء ملفي.')
];
export async function executeRBTool(name,args={}){try{return await execute(name,args)}catch(e){return {ok:false,persisted:false,error:e.message||'تعذر تنفيذ الإجراء.'}}}
export async function executeAITool(name,args={}){try{const mapped={...args};if(mapped.person_id)mapped.person_id=localId(mapped.person_id);const out=await executeRBTool(name,mapped);window.dispatchEvent(new CustomEvent('relationsbank:assistant-tool-result',{detail:out}));return await safeOutput(out);}catch{return {ok:false,persisted:false,error:'الإجراء غير متاح. راجع العرض المحلي.'};}}
window.RBExecuteTool=executeRBTool;
