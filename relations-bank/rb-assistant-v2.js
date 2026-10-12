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
  $('#rbGateSecondary').textContent='عندي دعوة';$('#rbGateSecondary').onclick=()=>window.relationsBankCloud?.openSignup?.();
}
function accessState(detail){
 const gate=$('#rbAccessGate');if(!gate)return;
 if(detail?.member){
   gate.hidden=true;document.body.classList.remove('rb-access-locked');ensureAssistant();if(card)card.hidden=false;return;
 }
 gate.hidden=false;document.body.classList.add('rb-access-locked');
 if(card)card.hidden=true;if(window.RelationsBankVoice?.active)stopVoice().catch(()=>{});
 if(detail?.authenticated){
   $('#rbGateTitle').textContent='بنك العلاقات والفرص';
   $('#rbGatePrimary').textContent=window.RBGov?.state?.can_create_circle?'إنشاء دائرة':'الدائرة والدعوة';$('#rbGatePrimary').onclick=()=>window.relationsBankCloud?.openManage?.();
   $('#rbGateSecondary').textContent='تسجيل الخروج';$('#rbGateSecondary').onclick=()=>window.relationsBankCloud?.db?.auth?.signOut?.().then(()=>location.reload());
 }else{
   $('#rbGateTitle').textContent='بنك العلاقات والفرص';
   $('#rbGatePrimary').textContent='دخول';$('#rbGatePrimary').onclick=()=>window.relationsBankCloud?.openAuth?.();
    $('#rbGateSecondary').textContent='عندي دعوة';$('#rbGateSecondary').onclick=()=>window.relationsBankCloud?.openSignup?.();
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
 const active=$('#rbAiActive'),speaking=['connecting','listening','speaking'].includes(state)||!!window.RelationsBankVoice?.active;
 if(active)active.hidden=!speaking&&state!=='error';
 const stop=$('#rbAiStop');if(stop)stop.hidden=!speaking;
 const mic=$('#rbAiMic');if(mic)mic.textContent=speaking?'إنهاء الصوت':'ابدأ بالصوت';
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
function setPanel(open){
 const panel=$('#rbAiPanel');if(!panel)return;panel.hidden=!open;
 $('#rbAiToggle').setAttribute('aria-expanded',String(open));
 if(open)setTimeout(()=>$('#rbAiText')?.focus(),0);
}
function ensureAssistant(){
 if(document.getElementById('rbAiCard'))return;
 card=document.createElement('section');card.id='rbAiCard';card.className='rb-ai-card rb-ai-float';card.dataset.state='ready';
 card.innerHTML='<div class="rb-ai-player"><button class="rb-ai-toggle" id="rbAiToggle" type="button" aria-expanded="false" aria-controls="rbAiPanel"><span aria-hidden="true">✦</span><strong>المساعد</strong></button><div class="rb-ai-active" id="rbAiActive" hidden><span class="rb-ai-core-wave" id="rbAiWave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span id="rbAiStatus" role="status" aria-live="polite">جاهز</span><button class="rb-ai-stop" id="rbAiStop" type="button" aria-label="إنهاء المحادثة الصوتية" hidden>إنهاء</button></div></div><div class="rb-ai-panel" id="rbAiPanel" role="dialog" aria-labelledby="rbAiHeading" hidden><div class="rb-ai-panel-head"><h2 id="rbAiHeading">وكيل العلاقات</h2><button id="rbAiMinimize" type="button" aria-label="تصغير المساعد">×</button></div><p class="rb-ai-live" id="rbAiLive"></p><button class="rb-ai-mic" id="rbAiMic" type="button">ابدأ بالصوت</button><div class="rb-ai-chat" id="rbAiChat"></div><form class="rb-ai-input" id="rbAiForm"><label class="rb-sr-only" for="rbAiText">اكتب للوكيل</label><input id="rbAiText" autocomplete="off" placeholder="أو اكتب هنا"><button class="rb-ai-send" type="submit">إرسال</button></form></div>';
 document.body.appendChild(card);
 const position=()=>{const vv=window.visualViewport;if(!vv)return;card.style.setProperty('--rb-keyboard-offset',Math.max(0,innerHeight-vv.height-vv.offsetTop)+'px');card.style.setProperty('--rb-panel-max-height',Math.max(160,Math.min(470,vv.height-100))+'px');};
 window.visualViewport?.addEventListener('resize',position);window.visualViewport?.addEventListener('scroll',position);position();
 $('#rbAiForm').onsubmit=e=>{e.preventDefault();sendText($('#rbAiText').value)};
 $('#rbAiToggle').onclick=()=>setPanel($('#rbAiPanel').hidden);
 $('#rbAiMinimize').onclick=()=>setPanel(false);
 $('#rbAiMic').onclick=async()=>{try{if(window.RelationsBankVoice?.active){await stopVoice();return;}setPanel(false);setState('connecting','أجهز المحادثة…');await startVoice();}catch(e){console.error(e);setState('error','تعذر تشغيل الصوت');setPanel(true);}};
 $('#rbAiStop').onclick=()=>stopVoice().catch(()=>{});
 card.addEventListener('keydown',e=>{if(e.key==='Escape'){setPanel(false);$('#rbAiToggle').focus();}});
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
