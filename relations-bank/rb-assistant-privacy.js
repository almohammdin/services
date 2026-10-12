import {context} from './rb-assistant-context.js?v=20261012-5';
let identity='',aliases=new Map(),lastCandidates=[];
function sync(){const key=window.RBAssistantContext.identity;if(key!==identity){identity=key;aliases=new Map();lastCandidates=[];}for(const p of window.RBV2?.people||[])if(!aliases.has(p.id))aliases.set(p.id,'person_'+(aliases.size+1));}
function alias(id){sync();return aliases.get(id)||'';}
export function localId(id){sync();if(!id)return '';for(const [key,value] of aliases)if(value===id)return key;throw Error('اختر شخصًا من نتائج البحث الحالية.');}
export async function publicContext(){
 const c=await context();sync();return {task:c.task,task_label:c.task_label,role:c.role,can_create_circle:c.can_create_circle,circle:{is_example:c.circle.is_example},focus:c.focus?{type:c.focus.type,person_id:c.focus.type==='person'?alias(c.focus.id):undefined}:null,profile_state:{exists:!!c.profile,has_field:!!c.profile?.field,has_role:!!c.profile?.role_title,has_company:!!c.profile?.company,has_city:!!c.profile?.city},gaps:c.gaps.map(g=>({key:g.key,prompt:g.prompt})),pending:!!c.pending,last_candidates:lastCandidates,tour_step:window.RBAssistant?.tourStep?.title||null,note:'التفاصيل والأسماء محفوظة داخل المنصة. أدوات البحث ترجع معرفات مؤقتة وأسبابًا عامة. لا تطلب معلومات إلا لهدف المستخدم.'};
}
export function safeOutput(out){
 if(!out?.ok)return {ok:false,persisted:false,error:'لم ينفذ الإجراء. راجع التنبيه داخل المنصة.'};
 const safe={ok:true,persisted:out.persisted===true};
 if(out.context)return publicContext().then(context=>({...safe,context}));
 if(out.needs_confirmation)return {...safe,needs_confirmation:true,instruction:'توجد مسودة محلية. اطلب تأكيد الحفظ من المستخدم.'};
 if(out.candidates){lastCandidates=out.candidates.map((x,i)=>({person_id:alias(x.person_id),label:'مرشح '+(i+1),reason:x.reason,score:x.score}));return {...safe,candidates:lastCandidates,note:'تظهر الأسماء للمستخدم داخل المنصة. استخدم المعرف لفتح ملف المرشح.'};}
 if(out.next)return {...safe,next:out.next};if(out.task)return {...safe,task:out.task};return {...safe,note:'تم تحديث العرض المحلي.'};
}
export function consentKey(){return 'rb_ai_consent_v2:'+(window.relationsBankCloud?.getAccess?.().user?.id||'');}
