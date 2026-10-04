import {executeRBTool} from './rb-assistant-tools.js?v=1';
import {start as startVoice,stop as stopVoice} from './rb-voice.js?v=1';

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let history=[],busy=false,card=null,lastTranscript='';

function addGate(){
 if(document.getElementById('rbAccessGate'))return;
 document.body.classList.add('rb-access-locked');
 const gate=document.createElement('section');gate.id='rbAccessGate';gate.className='rb-access-gate';
 gate.innerHTML='<div class="rb-gate-card"><div class="rb-gate-mark">✦</div><h1 id="rbGateTitle">بنك العلاقات والفرص</h1><div class="rb-gate-actions"><button class="rb-gate-primary" id="rbGatePrimary">دخول</button><button class="rb-gate-soft" id="rbGateSecondary">دعوة</button></div></div>';
 document.body.appendChild(gate);
 $('#rbGatePrimary').onclick=()=>window.relationsBankCloud?.openAuth?.();
 $('#rbGateSecondary').onclick=()=>window.relationsBankCloud?.openManage?.();
}
function accessState(detail){
 const gate=$('#rbAccessGate');if(!gate)return;
 if(detail?.member){
   gate.hidden=true;document.body.classList.remove('rb-access-locked');ensureAssistant();return;
 }
 gate.hidden=false;document.body.classList.add('rb-access-locked');
 if(detail?.authenticated){
   $('#rbGateTitle').textContent='عضويتك تحتاج دعوة';
   $('#rbGateText').textContent='أنت مسجل الدخول، لكنك لست عضوا في دائرة حتى الآن.';
   $('#rbGateInvite').textContent='افتح رابط الدعوة الذي وصلك أو أدخل كود الدعوة للانضمام.';
   $('#rbGatePrimary').textContent='إدخال كود الدعوة';$('#rbGatePrimary').onclick=()=>window.relationsBankCloud?.openManage?.();
   $('#rbGateSecondary').textContent='تسجيل الخروج';$('#rbGateSecondary').onclick=()=>window.relationsBankCloud?.db?.auth?.signOut?.().then(()=>location.reload());
 }else{
   const pending=new URLSearchParams(location.search).get('invite');
   $('#rbGateTitle').textContent=pending?'دعوتك جاهزة':'الدخول بالدعوة فقط';
   $('#rbGateText').textContent=pending?'سجل الدخول أو أنشئ حسابك، وبعدها تنضم تلقائيا إلى الدائرة التي دُعيت لها.':'هذه المنصة خاصة بدوائر موثوقة. تحتاج رابط دعوة من دائرة قائمة.';
   $('#rbGateInvite').textContent=pending?'كود الدائرة موجود داخل رابط الدعوة ولا تحتاج إدخاله يدويا.':'إذا كنت عضوا سابقا، سجل الدخول بحسابك.';
   $('#rbGatePrimary').textContent=pending?'متابعة الدعوة':'تسجيل الدخول';$('#rbGatePrimary').onclick=()=>window.relationsBankCloud?.openAuth?.();
   $('#rbGateSecondary').textContent='لدي كود دعوة';$('#rbGateSecondary').onclick=()=>window.relationsBankCloud?.openManage?.();
 }
}
function append(role,text){
 const value=String(text||'').trim();if(!value)return;
 history.push({role,text:value.slice(0,1800)});history=history.slice(-20);
 const host=$('#rbAiChat');if(!host)return;
 const el=document.createElement('div');el.className='rb-ai-msg '+role;el.textContent=value;host.appendChild(el);host.scrollTop=host.scrollHeight;
}
function setState(state,label,detail=''){
 if(!card)return;card.dataset.state=state||'ready';
 const s=$('#rbAiStatus');if(s)s.textContent=label||'جاهز';
 const live=$('#rbAiLive');if(live&&detail)live.textContent=detail.replace(/^(أنت:|الوكيل:)\s*/,'').trim();
}
function ensureAssistant(){
 if(document.getElementById('rbAiCard'))return;
 const main=document.querySelector('main');if(!main)return setTimeout(ensureAssistant,120);
 card=document.createElement('section');card.id='rbAiCard';card.className='rb-ai-card';card.dataset.state='ready';
 card.innerHTML='<div class="rb-ai-inner"><div class="rb-ai-hero"><div class="rb-ai-heading"><span class="rb-ai-kicker">Gemini</span><h2>محادثة الملف</h2></div><button class="rb-ai-mic" id="rbAiMic" type="button"><span class="rb-ai-mic-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"></path></svg></span><span><strong>ابدأ المحادثة</strong><small>Gemini Live</small></span></button><div class="rb-ai-status"><i class="rb-ai-dot"></i><span id="rbAiStatus">جاهز</span></div><div class="rb-ai-live" id="rbAiLive"></div><div class="rb-ai-hero-actions"><button class="rb-ai-toggle" id="rbAiToggle" type="button" aria-expanded="false">فتح المحادثة</button><button class="rb-ai-stop" id="rbAiStop" type="button">إنهاء</button></div></div><div class="rb-ai-panel" id="rbAiPanel" hidden><div class="rb-ai-chat" id="rbAiChat"></div><form class="rb-ai-input" id="rbAiForm"><input id="rbAiText" autocomplete="off" placeholder="اكتب للوكيل"><button class="rb-ai-send">إرسال</button></form></div></div>';
 main.insertBefore(card,main.firstElementChild);
 $('#rbAiForm').onsubmit=e=>{e.preventDefault();sendText($('#rbAiText').value)};
 $('#rbAiToggle').onclick=()=>{const panel=$('#rbAiPanel'),open=panel.hidden;panel.hidden=!open;$('#rbAiToggle').textContent=open?'إغلاق المحادثة':'فتح المحادثة';$('#rbAiToggle').setAttribute('aria-expanded',String(open))};
 $('#rbAiMic').onclick=async()=>{try{if(window.RelationsBankVoice?.active){await stopVoice();return}setState('connecting','أجهز المايك…');await startVoice()}catch(e){console.error(e);setState('error','تعذر تشغيل الصوت')}};
 $('#rbAiStop').onclick=()=>stopVoice().catch(()=>{});
}
async function sendText(text){
 const value=String(text||'').trim();if(!value||busy)return;$('#rbAiText').value='';append('user',value);busy=true;setState('working','أفهم كلامك…');
 try{
   const ctx=(await executeRBTool('get_member_context',{}))?.context||{};
   if(!window.RelationsBankAssistantAI)await import('./rb-text-ai.js?v=1');
   const result=await window.RelationsBankAssistantAI.ask({message:value,context:ctx,history:history.slice(-10)});
   let saved=0,failed=0;
   for(const call of result?.tool_calls||[]){
     const out=await executeRBTool(call.name,call.arguments||{});if(out?.ok){if(out.persisted)saved++}else failed++;
   }
   if(result?.reply)append('assistant',result.reply);
   if(saved)append('system','تم تحديث ملفك الداخلي بـ '+saved+' معلومة.');
   if(failed)append('system','في معلومة احتاجت توضيح وما حفظتها.');
   const gap=await executeRBTool('get_next_gap',{});
   if(!result?.reply&&gap?.next?.prompt)append('assistant',gap.next.prompt);
   setState('ready','جاهز');
 }catch(e){console.error(e);append('system','تعذر تشغيل الذكاء الآن. بياناتك الحالية بقيت كما هي.');setState('error','تعذر تشغيل الذكاء')}
 finally{busy=false}
}
window.addEventListener('relationsbank:voice-state',e=>{const d=e.detail||{};setState(d.state,d.label,d.detail)});
window.addEventListener('relationsbank:voice-turn',e=>{const d=e.detail||{};if(d.userText)append('user',d.userText);if(d.assistantText)append('assistant',d.assistantText)});
window.addEventListener('relationsbank:assistant-saved',()=>{try{window.RBV3Dashboard?.render?.()}catch{}});
window.addEventListener('relationsbank:access',e=>accessState(e.detail));
addGate();
setTimeout(()=>{const a=window.relationsBankCloud?.getAccess?.();if(a)accessState({authenticated:a.authenticated,member:a.member,circle:a.circle,user:a.user})},600);