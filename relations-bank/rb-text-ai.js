import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getAI,getGenerativeModel,GoogleAIBackend,Schema} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-ai.js';

const APP_NAME='relations-bank-ai';
const FIREBASE_CONFIG={apiKey:'AIzaSyAAvC9y5jQ_7fAwmkCqBtgFDrBRF5t4uI0',authDomain:'mesraah-a2dfc.firebaseapp.com',projectId:'mesraah-a2dfc',storageBucket:'mesraah-a2dfc.firebasestorage.app',messagingSenderId:'986043593957',appId:'1:986043593957:web:b848313ef8cf83a5f3500c'};

import {RB_TOOL_DECLARATIONS} from './rb-assistant-tools.js?v=20261012-5';
import {instructions} from './rb-assistant-instructions.js?v=20261012-5';
import {consentKey} from './rb-assistant-privacy.js?v=20261012-5';
const actionSchema=Schema.object({properties:{name:Schema.enumString({enum:RB_TOOL_DECLARATIONS.map(t=>t.name)}),arguments:Schema.string()}});
const schema=Schema.object({properties:{reply:Schema.string(),actions:Schema.array({items:actionSchema})},optionalProperties:['actions']});
const app=getApps().find(x=>x.name===APP_NAME)||initializeApp(FIREBASE_CONFIG,APP_NAME);
const ai=getAI(app,{backend:new GoogleAIBackend()});
const model=getGenerativeModel(ai,{model:'gemini-3.5-flash-lite',generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:.12,maxOutputTokens:1200}});
const ask=async payload=>{
 if(localStorage.getItem(consentKey())!=='yes')throw Error('consent-required');
 const prompt=instructions+'\nالسياق العام دون أسماء أو ملفات خاصة: '+JSON.stringify(payload.context||{})+'\nآخر المحادثة التي اختار المستخدم إرسالها: '+JSON.stringify(payload.history||[])+'\nطلب المستخدم: '+String(payload.message||'').slice(0,2200)+'\nالأدوات المتاحة: '+JSON.stringify(RB_TOOL_DECLARATIONS)+'\nأرجع actions بالأداة name وarguments كنص JSON صالح. لا تستخدم معرف شخص غير موجود في نتائج الأدوات. لا تدّع حفظًا قبل تأكيد المستخدم.';
 const response=await model.generateContent(prompt),raw=JSON.parse(response?.response?.text?.()||'{}'),tool_calls=[];
 for(const a of Array.isArray(raw.actions)?raw.actions.slice(0,5):[]){if(!RB_TOOL_DECLARATIONS.some(t=>t.name===a.name))continue;try{const args=JSON.parse(a.arguments||'{}');if(args&&typeof args==='object'&&!Array.isArray(args))tool_calls.push({name:a.name,arguments:args});}catch{}}
 return {reply:String(raw.reply||'').trim(),tool_calls};
};
window.RelationsBankAssistantAI={provider:'gemini',model:'gemini-3.5-flash-lite',ask};
