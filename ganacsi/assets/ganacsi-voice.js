import {GoogleGenAI,Modality} from 'https://cdn.jsdelivr.net/npm/@google/genai@2.14.0/+esm';
import {GANACSI_TOOL_DECLARATIONS,executeGanacsiTool} from './ganacsi-voice-tools.js?v=2';

const MODEL='gemini-3.1-flash-live-preview';
const INPUT_RATE=16000,OUTPUT_RATE=24000,IDLE_MS=45000,TOOL_TIMEOUT_MS=15000;
let active=false,session=null,micStream=null,micContext=null,outputContext=null,micSource=null,micProcessor=null,silentGain=null,outputWorklet=null,outputGain=null,micSuppressed=false,outputQueuedUntil=0,resumeMicTimer=null,streamEndSent=false,idleTimer=null,lastActivity=0,wakeLockSentinel=null;

const TEXT={
  so:{connecting:'Waan isku xirayaa…',listening:'Waan ku dhageysanayaa',speaking:'Kaaliyaha GANACSI wuu hadlayaa',working:'Waxaan eegayaa xogta…',error:'Codka ma shaqayn hadda',ready:'Taabo oo la hadal',detail:'Si dabiici ah u hadal. Kaaliyuhu wuu ku fahmayaa oo kula hadlaya.',idle:'Wadahadalkii wuu dhammaaday'},
  en:{connecting:'Connecting…',listening:'I’m listening',speaking:'GANACSI Assistant is speaking',working:'Checking the demo…',error:'Voice is unavailable right now',ready:'Tap and talk',detail:'Speak naturally. The assistant listens, understands and talks with you.',idle:'Conversation ended'},
  ar:{connecting:'أجهز المحادثة…',listening:'أسمعك الآن',speaking:'مساعد GANACSI يتحدث',working:'أراجع البيانات…',error:'تعذر تشغيل الصوت الآن',ready:'اضغط وتكلم',detail:'تكلم بشكل طبيعي. المساعد يسمعك ويفهمك ويسولف معك.',idle:'انتهت المحادثة'}
};
function lang(){
  const v=(document.documentElement.lang||new URLSearchParams(location.search).get('lang')||'so').toLowerCase();
  return ['so','en','ar'].includes(v)?v:'so';
}
function copy(){return TEXT[lang()]||TEXT.so}
function endpoint(){return String(window.GANACSI_VOICE_TOKEN_ENDPOINT||'https://mesraah-live-token.naif123456.workers.dev/token').trim()}
function emit(state,label){window.dispatchEvent(new CustomEvent('ganacsi:voice-state',{detail:{state,label}}))}
function clearIdle(){clearTimeout(idleTimer);idleTimer=null}
function markActivity(){lastActivity=Date.now();if(!active)return;clearIdle();idleTimer=setTimeout(()=>{if(active&&Date.now()-lastActivity>=IDLE_MS)stop('idle')},IDLE_MS)}
function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
const IOS_ECHO_GUARD=isIOS();

async function requestWakeLock(){if(!active||document.visibilityState!=='visible'||!navigator.wakeLock||wakeLockSentinel)return;try{const s=await navigator.wakeLock.request('screen');wakeLockSentinel=s;s.addEventListener('release',()=>{if(wakeLockSentinel===s)wakeLockSentinel=null},{once:true})}catch{wakeLockSentinel=null}}
async function releaseWakeLock(){const s=wakeLockSentinel;wakeLockSentinel=null;if(!s)return;try{await s.release()}catch{}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&active&&!wakeLockSentinel)requestWakeLock().catch(()=>{})});

function instruction(){
  const l=lang(),context=window.GanacsiAssistantBridge?.getBusinessContext?.()||{};
  const languageRule=l==='so'
    ? `The primary conversation language is Somali. Speak natural, fluent Somali as used by business owners in Hargeisa and Somaliland. Do not sound like a literal translation from Arabic or English. Use everyday Somali business language and natural rhythm. Keep brand names such as ZAAD, eDahab and GANACSI unchanged. If a finance term is more natural in common local usage, use that natural term rather than forcing a formal translation.`
    : l==='ar'
      ? `The primary conversation language is Arabic. Speak in a natural Saudi Hijazi conversational style, close to everyday Jeddah speech: warm, professional, easy and concise. Use Saudi words and rhythm naturally without exaggeration. Do NOT use an Egyptian, Levantine, Gulf-non-Saudi, or formal broadcaster accent. Do NOT sound like translated Modern Standard Arabic and do not read page copy. If you are unsure between a generic Arabic expression and a Saudi one, prefer the Saudi expression.`
      : `The primary conversation language is English. Speak naturally, clearly and concisely.`;

  return `You are the GANACSI AI business assistant inside a concept demo for merchants in Somaliland.
This is a REAL-TIME VOICE CONVERSATION. You are not a text reader and you must never behave like text-to-speech software.
Listen to the user, understand the intent, answer naturally, allow interruption, and continue the same conversation without restarting after every turn.
${languageRule}
If the user naturally switches between Somali, Arabic and English, follow the user's language and continue the same context.

Important truth about this build:
- All business numbers are SAMPLE DATA for a concept demo.
- There is NO live connection to ZAAD, eDahab, Dara Salaam Bank or any bank/payment provider in this build.
- Never claim that money was transferred, collected, reconciled or changed in a real account.
- The final product may later connect to real merchant accounts and payment data, but this demo does not.

Your role:
- Be a smart daily business assistant, not customer support.
- Help with sales, expenses, cash movement, receivables, collections, unmatched transactions, suppliers, debts and business performance.
- Keep answers short unless the user asks for detail.
- When the user asks to see something in GANACSI, use navigate_to_target and move the interface for them.
- Before answering questions about current demo numbers, call get_business_context when useful so you use the latest sample data.
- If the user explicitly tells you a stable fact about their own business, such as business type, city, payment channels or preference, use remember_business_profile. This is only demo memory stored on this device.
- Never say you remembered or saved something unless the tool returns ok=true and persisted=true.
- Do not recite the dashboard, do not list every number unless asked, and do not repeatedly remind the user that it is a demo. Mention the demo limitation only when relevant to avoid confusion.

Current GANACSI context at the start of this voice conversation:
${JSON.stringify(context)}`;
}

function ensureUi(){
  if(document.getElementById('ganacsiVoiceOverlay'))return;
  const host=document.createElement('div');
  host.id='ganacsiVoiceOverlay';host.className='ganacsi-voice-overlay';host.hidden=true;
  host.innerHTML=`<section class="ganacsi-voice-panel" role="region" aria-label="GANACSI voice conversation">
    <div class="ganacsi-voice-bars" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="ganacsi-voice-copy"><strong id="ganacsiVoiceStatus"></strong><span id="ganacsiVoiceDetail"></span></div>
    <button id="ganacsiVoiceStop" type="button" aria-label="End voice conversation">×</button>
  </section>`;
  document.body.appendChild(host);
  document.getElementById('ganacsiVoiceStop').onclick=()=>stop('manual');
}
function injectStyles(){
  if(document.getElementById('ganacsiVoiceStyle'))return;
  const s=document.createElement('style');s.id='ganacsiVoiceStyle';
  s.textContent=`.ganacsi-voice-overlay{position:fixed;left:0;right:0;bottom:max(10px,env(safe-area-inset-bottom));z-index:250;display:flex;justify-content:center;padding:0 10px;pointer-events:none}.ganacsi-voice-overlay[hidden]{display:none}.ganacsi-voice-panel{width:min(560px,100%);min-height:58px;display:grid;grid-template-columns:40px minmax(0,1fr) 36px;gap:10px;align-items:center;padding:8px 9px 8px 11px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:linear-gradient(135deg,#0b2b33,#075f50);box-shadow:0 14px 36px rgba(0,0,0,.26);color:#fff;pointer-events:auto}.ganacsi-voice-bars{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;gap:3px}.ganacsi-voice-bars i{width:3px;height:13px;background:#d7ab42;border-radius:99px;animation:ganacsiBars .9s ease-in-out infinite}.ganacsi-voice-bars i:nth-child(2){height:22px;animation-delay:.14s}.ganacsi-voice-bars i:nth-child(3){animation-delay:.28s}@keyframes ganacsiBars{50%{transform:scaleY(.42);opacity:.6}}.ganacsi-voice-copy{min-width:0}.ganacsi-voice-copy strong{display:block;font-size:11px}.ganacsi-voice-copy span{display:block;margin-top:2px;color:rgba(255,255,255,.7);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ganacsi-voice-panel button{width:34px;height:34px;border:1px solid rgba(255,255,255,.17);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;font:inherit;font-size:20px;line-height:1}@media(max-width:520px){.ganacsi-voice-overlay{padding:0 7px}.ganacsi-voice-panel{min-height:54px;grid-template-columns:36px minmax(0,1fr) 34px;gap:8px;padding:7px}.ganacsi-voice-bars{width:34px;height:34px}.ganacsi-voice-panel button{width:32px;height:32px}}`;
  document.head.appendChild(s);
}
function setStatus(label,state){const e=document.getElementById('ganacsiVoiceStatus');if(e)e.textContent=label;emit(state,label)}
function setDetail(text){const e=document.getElementById('ganacsiVoiceDetail');if(e)e.textContent=text}
function bytesToBase64(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary)}
function base64ToFloat32(value){const binary=atob(value),length=binary.length-(binary.length%2),buffer=new ArrayBuffer(length),bytes=new Uint8Array(buffer);for(let i=0;i<length;i++)bytes[i]=binary.charCodeAt(i);const pcm=new Int16Array(buffer),out=new Float32Array(pcm.length);for(let i=0;i<pcm.length;i++)out[i]=pcm[i]/32768;return out}
function resampleToInt16(input,sourceRate){const ratio=sourceRate/INPUT_RATE,out=new Int16Array(Math.max(1,Math.round(input.length/ratio)));for(let i=0;i<out.length;i++){const pos=i*ratio,left=Math.floor(pos),right=Math.min(left+1,input.length-1),mix=pos-left,value=(input[left]||0)*(1-mix)+(input[right]||0)*mix,clamped=Math.max(-1,Math.min(1,value));out[i]=clamped<0?clamped*32768:clamped*32767}return out}
async function prepareAudio(){
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx||!navigator.mediaDevices?.getUserMedia)throw new Error('voice-not-supported');
  micContext=new AudioCtx();try{outputContext=new AudioCtx({sampleRate:OUTPUT_RATE})}catch{outputContext=new AudioCtx()}
  await Promise.all([micContext.resume(),outputContext.resume()]);
  if(!outputContext.audioWorklet)throw new Error('voice-playback-not-supported');
  await outputContext.audioWorklet.addModule('./assets/ganacsi-voice-playback.worklet.js?v=2');
  outputWorklet=new AudioWorkletNode(outputContext,'ganacsi-voice-playback');
  outputGain=outputContext.createGain();outputGain.gain.value=1;outputWorklet.connect(outputGain);outputGain.connect(outputContext.destination);
  outputQueuedUntil=outputContext.currentTime;
  micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
}
function clearPlayback(){try{outputWorklet?.port.postMessage({type:'clear'})}catch{}if(outputContext)outputQueuedUntil=outputContext.currentTime}
function suppressMicForOutput(){if(!IOS_ECHO_GUARD||micSuppressed)return;micSuppressed=true;if(!streamEndSent&&session){streamEndSent=true;try{session.sendRealtimeInput({audioStreamEnd:true})}catch{}}}
function resumeMic(){clearTimeout(resumeMicTimer);if(!IOS_ECHO_GUARD){if(active)setStatus(copy().listening,'listening');return}const remaining=outputContext?Math.max(0,(outputQueuedUntil-outputContext.currentTime)*1000):0;resumeMicTimer=setTimeout(()=>{micSuppressed=false;streamEndSent=false;if(active)setStatus(copy().listening,'listening')},remaining+140)}
function playPcm(base64){
  if(!active||!outputContext||!outputWorklet||!base64)return;
  markActivity();suppressMicForOutput();
  const samples=base64ToFloat32(base64);if(!samples.length)return;
  outputQueuedUntil=Math.max(outputContext.currentTime,outputQueuedUntil)+samples.length/OUTPUT_RATE;
  try{outputWorklet.port.postMessage({samples},[samples.buffer])}catch{outputWorklet.port.postMessage({samples})}
  setStatus(copy().speaking,'speaking');
}
async function fetchToken(forceRefresh=false){
  if(typeof window.GanacsiVoiceGetAppCheckToken!=='function')throw new Error('voice-app-check-not-ready');
  const appCheck=await window.GanacsiVoiceGetAppCheckToken({forceRefresh});
  const response=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':appCheck},body:'{}'});
  const data=await response.json().catch(()=>({}));
  if(response.status===401&&!forceRefresh)return fetchToken(true);
  if(!response.ok||!data.token)throw new Error('voice-token-failed');
  return data.token;
}
function withTimeout(promise,ms=TOOL_TIMEOUT_MS){let timer;return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('voice-tool-timeout')),ms)})]).finally(()=>clearTimeout(timer))}
async function handleToolCalls(calls=[]){
  markActivity();setStatus(copy().working,'working');const responses=[];
  for(const call of calls){let result;try{result=await withTimeout(executeGanacsiTool(call.name,call.args||{}))}catch(error){result={ok:false,error:String(error?.message||error)}}responses.push({name:call.name,id:call.id,response:{result}})}
  session?.sendToolResponse({functionResponses:responses});
}
function handleMessage(message){
  if(message?.toolCall?.functionCalls?.length)handleToolCalls(message.toolCall.functionCalls).catch(console.error);
  const content=message?.serverContent;if(!content)return;
  if(content.interrupted){clearPlayback();micSuppressed=false;streamEndSent=false;setStatus(copy().listening,'listening')}
  for(const part of content.modelTurn?.parts||[])if(part.inlineData?.data)playPcm(part.inlineData.data);
  if(content.turnComplete&&active)resumeMic();
}
function startMic(){
  if(!active||!session||!micContext||!micStream||micProcessor)return;
  micSource=micContext.createMediaStreamSource(micStream);micProcessor=micContext.createScriptProcessor(2048,1,1);
  silentGain=micContext.createGain();silentGain.gain.value=0;
  micProcessor.onaudioprocess=event=>{if(!active||!session||micSuppressed)return;const pcm=resampleToInt16(event.inputBuffer.getChannelData(0),micContext.sampleRate),bytes=new Uint8Array(pcm.buffer,pcm.byteOffset,pcm.byteLength);try{session.sendRealtimeInput({audio:{data:bytesToBase64(bytes),mimeType:`audio/pcm;rate=${INPUT_RATE}`}})}catch{}};
  micSource.connect(micProcessor);micProcessor.connect(silentGain);silentGain.connect(micContext.destination);
}
async function shutdown(){
  clearIdle();await releaseWakeLock();clearTimeout(resumeMicTimer);resumeMicTimer=null;micSuppressed=false;streamEndSent=false;
  if(micProcessor)micProcessor.onaudioprocess=null;
  try{micProcessor?.disconnect();micSource?.disconnect();silentGain?.disconnect();outputWorklet?.disconnect();outputGain?.disconnect()}catch{}
  micStream?.getTracks?.().forEach(track=>track.stop());micStream=null;
  try{await micContext?.close();await outputContext?.close()}catch{}
  micContext=outputContext=null;micProcessor=micSource=silentGain=outputWorklet=outputGain=null;
}
async function start(){
  if(active)return;
  ensureUi();injectStyles();const host=document.getElementById('ganacsiVoiceOverlay');host.hidden=false;
  active=true;setStatus(copy().connecting,'connecting');setDetail(copy().detail);
  try{
    await requestWakeLock();await prepareAudio();const token=await fetchToken();if(!active)return;
    const ai=new GoogleGenAI({apiKey:token,httpOptions:{apiVersion:'v1alpha'}});
    session=await ai.live.connect({
      model:MODEL,
      config:{responseModalities:[Modality.AUDIO],systemInstruction:instruction(),speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}},tools:[{functionDeclarations:GANACSI_TOOL_DECLARATIONS}]},
      callbacks:{
        onopen:()=>setStatus(copy().connecting,'connecting'),
        onmessage:handleMessage,
        onerror:event=>console.error('GANACSI voice:',event),
        onclose:()=>{releaseWakeLock().catch(()=>{});if(active){active=false;setStatus(copy().error,'error');setDetail(copy().ready)}}
      }
    });
    if(!active)return;startMic();markActivity();setStatus(copy().listening,'listening');setDetail(copy().detail);
  }catch(error){
    console.error('GANACSI voice start:',error);setStatus(copy().error,'error');setDetail(copy().ready);
    try{session?.close?.()}catch{}session=null;active=false;await shutdown();
  }
}
async function stop(reason='manual'){
  const idle=reason==='idle';active=false;clearIdle();try{session?.close?.()}catch{}session=null;await shutdown();
  emit('',idle?copy().idle:copy().ready);
  const host=document.getElementById('ganacsiVoiceOverlay');if(!host)return;
  if(idle){setStatus(copy().idle,'idle');setDetail(copy().ready);setTimeout(()=>{if(!active)host.hidden=true},1800)}else host.hidden=true;
}
window.GanacsiVoice={start,stop,get active(){return active}};
ensureUi();injectStyles();
