import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getAI,getGenerativeModel,GoogleAIBackend,Schema} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-ai.js';

const APP_NAME='relations-bank-ai';
const FIREBASE_CONFIG={apiKey:'AIzaSyAAvC9y5jQ_7fAwmkCqBtgFDrBRF5t4uI0',authDomain:'mesraah-a2dfc.firebaseapp.com',projectId:'mesraah-a2dfc',storageBucket:'mesraah-a2dfc.firebasestorage.app',messagingSenderId:'986043593957',appId:'1:986043593957:web:b848313ef8cf83a5f3500c'};
const ACTIONS=['none','get_context','set_name','set_profile','record_insight','add_relationship','add_knowledge','next_gap'];
const actionSchema=Schema.object({properties:{
 action:Schema.enumString({enum:ACTIONS}),
 name:Schema.string(),company:Schema.string(),roleTitle:Schema.string(),field:Schema.string(),city:Schema.string(),
 key:Schema.enumString({enum:['contribution','needs','strength_sectors','intro_preference','reach_style']}),value:Schema.string(),
 targetOrg:Schema.string(),targetPerson:Schema.string(),targetRole:Schema.string(),sector:Schema.string(),lastContactAt:Schema.string(),
 directContact:Schema.boolean(),canRequestMeeting:Schema.boolean(),priorHelp:Schema.boolean(),scope:Schema.enumString({enum:['private','owner','circle']}),
 knowledgeType:Schema.enumString({enum:['need','offer','insight']}),title:Schema.string(),details:Schema.string(),tags:Schema.array({items:Schema.string()})
},optionalProperties:['name','company','roleTitle','field','city','key','value','targetOrg','targetPerson','targetRole','sector','lastContactAt','directContact','canRequestMeeting','priorHelp','scope','knowledgeType','title','details','tags']});
const schema=Schema.object({properties:{reply:Schema.string(),actions:Schema.array({items:actionSchema})},optionalProperties:['actions']});
const app=getApps().find(x=>x.name===APP_NAME)||initializeApp(FIREBASE_CONFIG,APP_NAME);

const PERSONALITY=[
'أنت وكيل بنك العلاقات والفرص.',
'تجري محادثة مهنية طبيعية مع عضو داخل دائرة موثوقة. المستخدم لا يعبئ استبيانا أمامه؛ أنت تفهم كلامه وتحوله داخليا إلى ملف مهني وعلاقات واحتياجات وقدرات.',
'تكلم بعربية سعودية حجازية خفيفة ومهنية وقصيرة. اسأل سؤالا واحدا واضحا في كل مرة، إلا إذا كان جمع معلومتين مترابطتين طبيعيا.',
'قبل السؤال اقرأ السياق الحالي. لا تسأل عن معلومة موجودة بالفعل.',
'إذا قال المستخدم عدة معلومات واضحة في جملة واحدة، احفظها كلها بأكثر من إجراء في نفس الدور.',
'لا تخترع أسماء أشخاص أو جهات أو قوة علاقة. لا تعتبر معرفة الاسم قدرة على ترتيب لقاء.',
'احفظ المعلومة الصريحة مباشرة. إذا كان شيء غامضا اسأل عنه فقط.',
'ركز على الدور المهني، المجال، المدينة، ما الذي يفيد فيه، ما الذي يحتاجه، القطاعات التي يعرفها، الجهات والأشخاص الذين يعرفهم، هل التواصل مباشر، هل يستطيع طلب لقاء، وهل سبق أن حصل تعاون أو مساعدة.',
'عند العلاقة الجديدة اجعل المشاركة الافتراضية التعارف عن طريقي ما لم يطلب المستخدم غير ذلك.',
'لا تسأل عن أمور حساسة أو شخصية لا تخدم الغرض المهني، ولا تستنتج سمات نفسية.',
'قل للمستخدم من البداية وباختصار إن إجاباته تبني ملفه المهني داخل الدائرة. لا تعرض أسماء الجداول أو الحقول.',
'لا تقل إن معلومة حفظت إلا بعد نجاح الإجراء. بعد الحفظ انتقل لأعلى فجوة مهنية تالية.',
'إذا قال المستخدم يكفي اليوم، اختم باختصار وأخبره أنه يستطيع العودة لاحقا.'
].join('\n');

{
 const ai=getAI(app,{backend:new GoogleAIBackend()});
 const model=getGenerativeModel(ai,{model:'gemini-3.5-flash-lite',generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:.12,maxOutputTokens:900}});
 const ask=async payload=>{
  const prompt=PERSONALITY+
   '\n\nالسياق الداخلي الحالي:\n'+JSON.stringify(payload.context||{})+
   '\n\nآخر المحادثة:\n'+JSON.stringify(payload.history||[])+
   '\n\nرسالة المستخدم:\n'+String(payload.message||'').slice(0,2200)+
   '\n\nالإجراءات: get_context لقراءة الملف، set_profile لحفظ الجهة أو الدور أو المجال أو المدينة، record_insight لحفظ ما يفيد فيه أو يحتاجه أو القطاعات وطريقة التعارف، add_relationship لحفظ علاقة مهنية، add_knowledge لحفظ احتياج أو قدرة أو معرفة عملية، next_gap لمعرفة السؤال التالي. استخدم owner كصلاحية افتراضية للعلاقات التي ذكرها المستخدم ما لم يطلب غير ذلك.';
  const response=await model.generateContent(prompt),raw=JSON.parse(response?.response?.text?.()||'{}'),toolCalls=[];
  for(const a of Array.isArray(raw.actions)?raw.actions.slice(0,6):[]){
    if(a.action==='get_context')toolCalls.push({name:'get_member_context',arguments:{}});
    if(a.action==='set_name')toolCalls.push({name:'set_member_name',arguments:{name:a.name||''}});
    if(a.action==='set_profile')toolCalls.push({name:'set_profile_basics',arguments:{company:a.company||'',role_title:a.roleTitle||'',field:a.field||'',city:a.city||''}});
    if(a.action==='record_insight')toolCalls.push({name:'record_profile_insight',arguments:{key:a.key||'',value:a.value||''}});
    if(a.action==='add_relationship')toolCalls.push({name:'add_relationship',arguments:{target_org:a.targetOrg||'',target_person:a.targetPerson||'',target_role:a.targetRole||'',sector:a.sector||'',city:a.city||'',last_contact_at:a.lastContactAt||'',direct_contact:a.directContact===true,can_request_meeting:a.canRequestMeeting===true,prior_help:a.priorHelp===true,scope:a.scope||'owner'}});
    if(a.action==='add_knowledge')toolCalls.push({name:'add_knowledge',arguments:{type:a.knowledgeType||'insight',title:a.title||'',details:a.details||'',tags:Array.isArray(a.tags)?a.tags:[],city:a.city||'',scope:a.scope||'owner'}});
    if(a.action==='next_gap')toolCalls.push({name:'get_next_gap',arguments:{}});
  }
  return {reply:String(raw.reply||'').trim(),tool_calls:toolCalls};
 };
 window.RelationsBankAssistantAI={provider:'gemini',model:'gemini-3.5-flash-lite',ask};
}