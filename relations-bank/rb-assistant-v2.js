import {executeRBTool} from './rb-assistant-tools.js?v=1';
import {start as startVoice,stop as stopVoice} from './rb-voice.js?v=1';
import {getNameState,saveMemberName} from './rb-name-tool.js?v=1';

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let history=[],busy=false,card=null,lastTranscript='',nameState=null;

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
   $('#rbGateTitle').textContent='بنك العلاقات والفرص';
   $('#rbGatePrimary').textContent='دعوة';$('#rbGatePrimary').onclick=()=>window.relationsBankCloud?.openManage?.();
   $('#rbGateSecondary').textContent='تسجيل الخروج';$('#rbGateSecondary').onclick=()=>window.relationsBankCloud?.db?.auth?.signOut?.().then(()=>location.reload());
 }else{
   $('#rbGateTitle').textContent='بنك العلاقات والفرص';
   $('#rbGatePrimary').textContent='دخول';$('#rbGatePrimary').onclick=()=>window.relationsBankCloud?.openAuth?.();
   $('#rbGateSecondary').textContent='دعوة';$('#rbGateSecondary').onclick=()=>window.relationsBankCloud?.openManage?.();
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
async function primeName(){
 try{
   nameState=await getNameState();
   if(nameState?.confirmed)return;
   const prompt=(nameState?.name&&nameState.name!=='عضو')?('اسمك '+nameState.name+'، صحيح؟'):'وش اسمك؟';
   const live=$('#rbAiLive');if(live)live.textContent=prompt;
   append('assistant',prompt);
 }catch(e){console.error(e)}
}
function extractNameReply(value){
 const text=String(value||'').trim();
 if(nameState?.name&&nameState.name!=='عضو'&&/^(اي|ايوه|أيوه|نعم|صح|صحيح|تمام|يب|yes)$/i.test(text))return nameState.name;
 const m=text.match(/(?:اسمي|أنا|انا)\s+(.{2,80})$/);
 return (m?.[1]||text).replace(/[.!؟]+$/,'').trim();
}
function ensureAssistant(){
 if(document.getElementById('rbAiCard'))return;
 const main=document.querySelector('main');if(!main)return setTimeout(ensureAssistant,120);
 card=document.createElement('section');card.id='rbAiCard';card.className='rb-ai-card';card.dataset.state='ready';
 card.innerHTML='<div class="rb-ai-inner"><div class="rb-ai-hero"><button class="rb-ai-mic rb-ai-orb" id="rbAiMic" type="button" aria-label="بدء المحادثة الصوتية"><span class="rb-ai-orb-rings" aria-hidden="true"><i></i><i></i><i></i></span><span class="rb-ai-wave" id="rbAiWave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="rb-ai-brandmark" aria-hidden="true"><svg viewBox="0 0 64 64"><path class="rb-logo-links" d="M16 19 32 32 48 17M32 32 47 47M32 32 17 47"/><circle class="rb-logo-node" cx="16" cy="19" r="4"/><circle class="rb-logo-node" cx="48" cy="17" r="4"/><circle class="rb-logo-node" cx="47" cy="47" r="4"/><circle class="rb-logo-node" cx="17" cy="47" r="4"/><path class="rb-logo-spark" d="M32 19c1.7 7.1 3.9 9.3 11 11-7.1 1.7-9.3 3.9-11 11-1.7-7.1-3.9-9.3-11-11 7.1-1.7 9.3-3.9 11-11Z"/></svg></span><span class="rb-ai-gemini"><b>✦</b> Gemini</span></button><div class="rb-ai-heading"><h2>تحدث مع وكيل العلاقات</h2></div><div class="rb-ai-status"><i class="rb-ai-dot"></i><span id="rbAiStatus">جاهز</span></div><div class="rb-ai-live" id="rbAiLive"></div><div class="rb-ai-hero-actions"><button class="rb-ai-toggle" id="rbAiToggle" type="button" aria-expanded="false">فتح المحادثة</button><button class="rb-ai-stop" id="rbAiStop" type="button">إنهاء</button></div></div><div class="rb-ai-panel" id="rbAiPanel" hidden><div class="rb-ai-chat" id="rbAiChat"></div><form class="rb-ai-input" id="rbAiForm"><input id="rbAiText" autocomplete="off" placeholder="اكتب للوكيل"><button class="rb-ai-send">إرسال</button></form></div></div>';
 main.insertBefore(card,main.firstElementChild);
 $('#rbAiForm').onsubmit=e=>{e.preventDefault();sendText($('#rbAiText').value)};
 $('#rbAiToggle').onclick=()=>{const panel=$('#rbAiPanel'),open=panel.hidden;panel.hidden=!open;$('#rbAiToggle').textContent=open?'إغلاق المحادثة':'فتح المحادثة';$('#rbAiToggle').setAttribute('aria-expanded',String(open))};
 $('#rbAiMic').onclick=async()=>{try{if(window.RelationsBankVoice?.active){await stopVoice();return}setState('connecting','أجهز المايك…');await startVoice()}catch(e){console.error(e);setState('error','تعذر تشغيل الصوت')}};
 $('#rbAiStop').onclick=()=>stopVoice().catch(()=>{});
 primeName();
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
window.addEventListener('relationsbank:assistant-saved',()=>{try{window.RBV3Dashboard?.render?.()}catch{}});
window.addEventListener('relationsbank:access',e=>accessState(e.detail));

function installVoiceOrb(){
  document.querySelector('.v2-toolbar')?.remove();
  const kicker=document.querySelector('.v2-kicker');if(kicker&&/V2|V3/.test(kicker.textContent||''))kicker.textContent='بنك العلاقات والفرص';
  if(document.getElementById('rbVoiceOrbStyle'))return;
  const style=document.createElement('style');style.id='rbVoiceOrbStyle';style.textContent=`
    .rb-ai-card{padding:0!important}.rb-ai-inner{padding:28px!important}.rb-ai-hero{gap:12px!important}.rb-ai-heading h2{font-size:24px!important;margin:6px 0 0!important}
    .rb-ai-orb{position:relative!important;isolation:isolate;width:clamp(220px,28vw,292px)!important;min-width:0!important;min-height:0!important;aspect-ratio:1!important;border-radius:50%!important;padding:0!important;margin:8px auto 4px!important;overflow:hidden!important;display:grid!important;place-items:center!important;background:radial-gradient(circle at 32% 27%,rgba(255,255,255,.22),transparent 27%),radial-gradient(circle at 50% 52%,#174F76 0 37%,#0D3656 59%,#071F33 100%)!important;border:1px solid rgba(226,164,94,.38)!important;box-shadow:0 28px 65px rgba(4,24,39,.35),inset 0 0 0 1px rgba(255,255,255,.06)!important}
    .rb-ai-orb:before{content:"";position:absolute;inset:13px;border-radius:50%;border:1px solid rgba(255,255,255,.1);box-shadow:inset 0 0 40px rgba(201,133,60,.08);z-index:0}
    .rb-ai-orb-rings,.rb-ai-orb-rings i{position:absolute;inset:0;border-radius:50%;pointer-events:none}.rb-ai-orb-rings i{border:1px solid rgba(226,164,94,.22);opacity:0}
    .rb-ai-card[data-state="listening"] .rb-ai-orb-rings i,.rb-ai-card[data-state="speaking"] .rb-ai-orb-rings i{animation:rbOrbRing 1.8s ease-out infinite}.rb-ai-orb-rings i:nth-child(2){animation-delay:.55s!important}.rb-ai-orb-rings i:nth-child(3){animation-delay:1.1s!important}
    @keyframes rbOrbRing{0%{inset:34%;opacity:.58}100%{inset:2%;opacity:0}}
    .rb-ai-wave{position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 25px;opacity:.78;pointer-events:none}.rb-ai-wave i{display:block;width:5px;height:54px;border-radius:999px;background:linear-gradient(180deg,rgba(240,195,142,.16),rgba(240,195,142,.96),rgba(240,195,142,.16));transform:scaleY(.18);transition:transform .08s linear,opacity .15s ease;transform-origin:center}.rb-ai-wave i:nth-child(odd){height:40px}.rb-ai-wave i:nth-child(3n){height:68px}
    .rb-ai-brandmark{position:relative;z-index:3;width:108px;height:108px;border-radius:34px;display:grid;place-items:center;background:rgba(7,31,51,.87);border:1px solid rgba(255,255,255,.11);box-shadow:0 18px 38px rgba(0,0,0,.28),inset 0 0 28px rgba(201,133,60,.1);backdrop-filter:blur(8px)}.rb-ai-brandmark svg{width:76px!important;height:76px!important;overflow:visible}.rb-logo-links{fill:none;stroke:#8EACC0;stroke-width:2;stroke-linecap:round}.rb-logo-node{fill:#E7EEF3;stroke:#0D3656;stroke-width:1}.rb-logo-spark{fill:#E2A45E;filter:drop-shadow(0 0 7px rgba(226,164,94,.35))}
    .rb-ai-gemini{position:absolute;z-index:4;bottom:28px;left:50%;transform:translateX(-50%);display:flex!important;align-items:center;gap:5px;color:rgba(255,255,255,.68)!important;font:700 10px Arial,sans-serif;letter-spacing:.02em}.rb-ai-gemini b{color:#E9B979;font-size:12px}
    .rb-ai-card[data-state="listening"] .rb-ai-orb{box-shadow:0 0 0 7px rgba(240,112,112,.06),0 28px 65px rgba(4,24,39,.4)!important}.rb-ai-card[data-state="speaking"] .rb-ai-orb{box-shadow:0 0 0 7px rgba(226,164,94,.08),0 28px 65px rgba(4,24,39,.4)!important}
    .rb-ai-status{margin-top:4px!important}.rb-ai-panel{width:min(780px,100%);margin-inline:auto!important}
    @media(max-width:650px){.rb-ai-inner{padding:20px 14px!important}.rb-ai-orb{width:min(72vw,250px)!important}.rb-ai-brandmark{width:92px;height:92px;border-radius:29px}.rb-ai-brandmark svg{width:64px!important;height:64px!important}.rb-ai-wave{gap:5px;padding:0 20px}.rb-ai-wave i{width:4px;height:46px}.rb-ai-heading h2{font-size:20px!important}}
  `;document.head.appendChild(style);
}
let rbWakeLock=null,rbWakeTimer=null,rbVoiceSession=false,rbWavePhase=0;
async function rbReleaseWake(){clearTimeout(rbWakeTimer);rbWakeTimer=null;if(rbWakeLock){try{await rbWakeLock.release()}catch{}rbWakeLock=null}}
async function rbAcquireWake(){if(!rbVoiceSession||document.visibilityState!=='visible'||!('wakeLock' in navigator))return;if(rbWakeLock&&!rbWakeLock.released)return;try{rbWakeLock=await navigator.wakeLock.request('screen');rbWakeLock.addEventListener('release',()=>{rbWakeLock=null})}catch{}}
function rbSpeechActivity(){if(!rbVoiceSession)return;rbAcquireWake();clearTimeout(rbWakeTimer);rbWakeTimer=setTimeout(()=>rbReleaseWake(),120000)}
let rbWaveTarget=0,rbWaveCurrent=0,rbWaveSource='user',rbWaveRAF=null;
function rbAnimateWave(){
  const bars=[...document.querySelectorAll('#rbAiWave i')];
  rbWaveCurrent+=(rbWaveTarget-rbWaveCurrent)*.28;
  if(rbWaveTarget<.02)rbWaveCurrent*=.88;
  if(bars.length){
    rbWavePhase+=.16;
    bars.forEach((bar,i)=>{
      const shape=.28+.72*Math.abs(Math.sin(rbWavePhase+i*.82));
      const center=1-Math.min(1,Math.abs(i-(bars.length-1)/2)/((bars.length-1)/2));
      const energy=Math.min(1,.12+rbWaveCurrent*(.65+.45*center)*shape);
      bar.style.transform='scaleY('+(.16+energy*1.05)+')';
      bar.style.opacity=String(.38+energy*.62);
    });
  }
  if(rbVoiceSession||rbWaveCurrent>.01)rbWaveRAF=requestAnimationFrame(rbAnimateWave);
  else{rbWaveRAF=null;bars.forEach(b=>{b.style.transform='scaleY(.16)';b.style.opacity='.45'})}
}
function rbSetWave(level,source='user'){
  rbWaveTarget=Math.max(0,Math.min(1,Number(level)||0));rbWaveSource=source;
  const orb=document.getElementById('rbAiMic');if(orb)orb.dataset.voiceSource=source;
  if(!rbWaveRAF)rbWaveRAF=requestAnimationFrame(rbAnimateWave);
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&rbVoiceSession&&rbWakeTimer)rbAcquireWake()});
window.addEventListener('relationsbank:voice-state',e=>{
  const d=e.detail||{},state=d.state||'';
  if(['connecting','listening','speaking','working'].includes(state)){rbVoiceSession=true;if(state==='speaking'||d.detail)rbSpeechActivity();else if(state==='connecting')rbSpeechActivity()}
  if(['stopped','error'].includes(state)){rbVoiceSession=false;rbReleaseWake();rbSetWave(0)}
});
window.addEventListener('relationsbank:voice-level',e=>{
  const d=e.detail||{};rbVoiceSession=true;rbSetWave(d.level||0,d.source||'user');
  if((d.level||0)>.035)rbSpeechActivity();
});
installVoiceOrb();
addGate();
setTimeout(()=>{const a=window.relationsBankCloud?.getAccess?.();if(a)accessState({authenticated:a.authenticated,member:a.member,circle:a.circle,user:a.user})},600);