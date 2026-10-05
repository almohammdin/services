import {executeRBTool} from './rb-assistant-tools.js?v=1';
import {start as startVoice,stop as stopVoice} from './rb-voice.js?v=2';
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
 card.innerHTML='<div class="rb-ai-inner"><div class="rb-ai-hero"><button class="rb-ai-mic rb-ai-orb" id="rbAiMic" type="button" aria-label="بدء المحادثة الصوتية"><span class="rb-ai-breath-ring" aria-hidden="true"></span><span class="rb-ai-core-wave" id="rbAiWave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="rb-ai-gemini"><b>✦</b> Gemini</span></button><div class="rb-ai-heading"><h2>تحدث مع وكيل العلاقات</h2></div><div class="rb-ai-status"><i class="rb-ai-dot"></i><span id="rbAiStatus">جاهز</span></div><div class="rb-ai-live" id="rbAiLive"></div><div class="rb-ai-hero-actions"><button class="rb-ai-toggle" id="rbAiToggle" type="button" aria-expanded="false">فتح المحادثة</button><button class="rb-ai-stop" id="rbAiStop" type="button">إنهاء</button></div></div><div class="rb-ai-panel" id="rbAiPanel" hidden><div class="rb-ai-chat" id="rbAiChat"></div><form class="rb-ai-input" id="rbAiForm"><input id="rbAiText" autocomplete="off" placeholder="اكتب للوكيل"><button class="rb-ai-send">إرسال</button></form></div></div>';
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
    .rb-ai-card{padding:0!important}.rb-ai-inner{padding:28px!important}.rb-ai-hero{gap:12px!important}.rb-ai-heading h2{font-size:24px!important;margin:7px 0 0!important}
    .rb-ai-orb{
      position:relative!important;width:clamp(190px,25vw,244px)!important;min-width:0!important;min-height:0!important;aspect-ratio:1!important;
      border-radius:50%!important;padding:0!important;margin:8px auto 6px!important;overflow:hidden!important;display:grid!important;place-items:center!important;
      background:linear-gradient(145deg,#174F76 0%,#0D3656 58%,#082A45 100%)!important;
      border:1px solid rgba(255,255,255,.12)!important;
      box-shadow:0 22px 54px rgba(5,31,50,.28),inset 0 1px 0 rgba(255,255,255,.06)!important;
      transition:transform .2s ease,box-shadow .2s ease,background .2s ease!important
    }
    .rb-ai-orb:hover{transform:translateY(-2px)}
    .rb-ai-breath-ring{
      position:absolute;inset:16px;border-radius:50%;border:1px solid rgba(255,255,255,.11);
      box-shadow:inset 0 0 28px rgba(255,255,255,.02);pointer-events:none
    }
    .rb-ai-core-wave{position:relative;z-index:3;display:flex;align-items:center;justify-content:center;gap:8px;height:88px}
    .rb-ai-core-wave i{
      display:block;width:9px;height:58px;border-radius:999px;
      background:linear-gradient(180deg,#F7D5AB 0%,#E2A45E 52%,#C9853C 100%);
      transform:scaleY(.28);transform-origin:center;transition:transform .07s linear,opacity .1s ease;
      box-shadow:0 0 14px rgba(226,164,94,.18)
    }
    .rb-ai-core-wave i:nth-child(1),.rb-ai-core-wave i:nth-child(5){height:38px}
    .rb-ai-core-wave i:nth-child(2),.rb-ai-core-wave i:nth-child(4){height:52px}
    .rb-ai-core-wave i:nth-child(3){height:68px}
    .rb-ai-gemini{
      position:absolute;z-index:4;bottom:27px;left:50%;transform:translateX(-50%);
      display:flex!important;align-items:center;gap:4px;color:rgba(255,255,255,.62)!important;
      font:700 10px Arial,sans-serif;letter-spacing:.01em
    }
    .rb-ai-gemini b{color:#E9B979;font-size:11px;line-height:1}
    .rb-ai-card[data-state="listening"] .rb-ai-orb{
      background:linear-gradient(145deg,#174F76 0%,#0D3656 64%,#082A45 100%)!important;
      box-shadow:0 0 0 8px rgba(21,77,116,.07),0 22px 54px rgba(5,31,50,.34)!important
    }
    .rb-ai-card[data-state="speaking"] .rb-ai-orb{
      background:linear-gradient(145deg,#154D74 0%,#0D3656 55%,#071F33 100%)!important;
      box-shadow:0 0 0 8px rgba(201,133,60,.07),0 22px 54px rgba(5,31,50,.34)!important
    }
    .rb-ai-card[data-state="listening"] .rb-ai-breath-ring,
    .rb-ai-card[data-state="speaking"] .rb-ai-breath-ring{animation:rbBreathRing 1.5s ease-in-out infinite}
    @keyframes rbBreathRing{50%{inset:11px;border-color:rgba(255,255,255,.18)}}
    .rb-ai-status{margin-top:4px!important}.rb-ai-panel{width:min(780px,100%);margin-inline:auto!important}
    @media(max-width:650px){
      .rb-ai-inner{padding:20px 14px!important}.rb-ai-orb{width:min(64vw,220px)!important}.rb-ai-core-wave{gap:7px;height:82px}
      .rb-ai-core-wave i{width:8px}.rb-ai-heading h2{font-size:20px!important}
    }
  `;document.head.appendChild(style);
}
let rbWakeLock=null,rbWakeTimer=null,rbVoiceSession=false,rbWavePhase=0;
async function rbReleaseWake(){clearTimeout(rbWakeTimer);rbWakeTimer=null;if(rbWakeLock){try{await rbWakeLock.release()}catch{}rbWakeLock=null}}
async function rbAcquireWake(){if(!rbVoiceSession||document.visibilityState!=='visible'||!('wakeLock' in navigator))return;if(rbWakeLock&&!rbWakeLock.released)return;try{rbWakeLock=await navigator.wakeLock.request('screen');rbWakeLock.addEventListener('release',()=>{rbWakeLock=null})}catch{}}
function rbSpeechActivity(){if(!rbVoiceSession)return;rbAcquireWake();clearTimeout(rbWakeTimer);rbWakeTimer=setTimeout(()=>rbReleaseWake(),120000)}
let rbWaveTarget=0,rbWaveCurrent=0,rbWaveSource='user',rbWaveRAF=null;
function rbAnimateWave(){
  const bars=[...document.querySelectorAll('#rbAiWave i')];
  rbWaveCurrent+=(rbWaveTarget-rbWaveCurrent)*.3;
  if(rbWaveTarget<.02)rbWaveCurrent*=.86;
  if(bars.length){
    rbWavePhase+=.18;
    const patterns=[.68,.88,1,.88,.68];
    bars.forEach((bar,i)=>{
      const organic=.45+.55*Math.abs(Math.sin(rbWavePhase+i*.9));
      const energy=Math.min(1,.08+rbWaveCurrent*patterns[i]*organic*1.35);
      bar.style.transform='scaleY('+(.24+energy*.95)+')';
      bar.style.opacity=String(.58+energy*.42);
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