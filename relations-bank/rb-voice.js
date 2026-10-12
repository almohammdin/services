import {GoogleGenAI,Modality} from 'https://cdn.jsdelivr.net/npm/@google/genai@2.14.0/+esm';
import {RB_TOOL_DECLARATIONS,executeAITool} from './rb-assistant-tools.js?v=20261012-5';
import {publicContext,consentKey} from './rb-assistant-privacy.js?v=20261012-5';
import {instructions} from './rb-assistant-instructions.js?v=20261012-5';

const MODEL='gemini-3.1-flash-live-preview',INPUT_RATE=16000,OUTPUT_RATE=24000,TOOL_TIMEOUT=15000;
let voiceGeneration=0,active=false,session=null,micStream=null,micContext=null,outContext=null,micSource=null,micProcessor=null,silentGain=null,outWorklet=null,outGain=null,micSuppressed=false,queuedUntil=0,resumeTimer=null,streamEndSent=false,wakeLock=null,idleTimer=null,lastLevelEmit=0,lastActivity=0;
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const emit=(state,label,detail='')=>window.dispatchEvent(new CustomEvent('relationsbank:voice-state',{detail:{state,label,detail}}));
const endpoint=()=>String(window.RELATIONS_BANK_VOICE_TOKEN_ENDPOINT||'https://mesraah-live-token.naif123456.workers.dev/token').trim();
const emitLevel=(level,source='user')=>window.dispatchEvent(new CustomEvent('relationsbank:voice-level',{detail:{level:Math.max(0,Math.min(1,level||0)),source}}));
async function requestWake(){
  if(!active||document.visibilityState!=='visible'||!navigator.wakeLock?.request||wakeLock)return;
  try{wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener?.('release',()=>{wakeLock=null})}catch{}
}
async function releaseWake(){clearTimeout(idleTimer);idleTimer=null;try{await wakeLock?.release?.()}catch{}wakeLock=null}
function markActivity(){
  lastActivity=Date.now();
  requestWake();
  clearTimeout(idleTimer);
  idleTimer=setTimeout(()=>{if(active&&Date.now()-lastActivity>=120000)releaseWake()},120000);
}
document.addEventListener('visibilitychange',()=>{if(active&&document.visibilityState==='visible'&&Date.now()-lastActivity<120000)requestWake()});

function instruction(context){return instructions+'\nسياق عام دون ملفات خاصة: '+JSON.stringify(context||{});}
function b64(bytes){let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s)}
function pcmFloat(value){const bin=atob(value),len=bin.length-(bin.length%2),buf=new ArrayBuffer(len),u=new Uint8Array(buf);for(let i=0;i<len;i++)u[i]=bin.charCodeAt(i);const pcm=new Int16Array(buf),out=new Float32Array(pcm.length);for(let i=0;i<pcm.length;i++)out[i]=pcm[i]/32768;return out}
function resample(input,rate){const ratio=rate/INPUT_RATE,out=new Int16Array(Math.max(1,Math.round(input.length/ratio)));for(let i=0;i<out.length;i++){const pos=i*ratio,l=Math.floor(pos),r=Math.min(l+1,input.length-1),mix=pos-l,val=(input[l]||0)*(1-mix)+(input[r]||0)*mix,x=Math.max(-1,Math.min(1,val));out[i]=x<0?x*32768:x*32767}return out}
async function prepare(){
 const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx||!navigator.mediaDevices?.getUserMedia)throw new Error('voice-not-supported');
 micContext=new Ctx();try{outContext=new Ctx({sampleRate:OUTPUT_RATE})}catch{outContext=new Ctx()}
 await Promise.all([micContext.resume(),outContext.resume()]);
 if(!outContext.audioWorklet)throw new Error('playback-not-supported');
 await outContext.audioWorklet.addModule('./rb-voice-playback.worklet.js?v=1');
 outWorklet=new AudioWorkletNode(outContext,'relations-bank-voice-playback');outGain=outContext.createGain();outGain.gain.value=1;outWorklet.connect(outGain);outGain.connect(outContext.destination);queuedUntil=outContext.currentTime;
 micStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
}
function clearPlayback(){try{outWorklet?.port.postMessage({type:'clear'})}catch{}if(outContext)queuedUntil=outContext.currentTime}
function suppress(){if(!isIOS()||micSuppressed)return;micSuppressed=true;if(!streamEndSent&&session){streamEndSent=true;try{session.sendRealtimeInput({audioStreamEnd:true})}catch{}}}
function resumeAfter(){clearTimeout(resumeTimer);if(!isIOS()){if(active)emit('listening','أسمعك الآن');return}const ms=outContext?Math.max(0,(queuedUntil-outContext.currentTime)*1000):0;resumeTimer=setTimeout(()=>{micSuppressed=false;streamEndSent=false;if(active)emit('listening','أسمعك الآن')},ms+140)}
function play(data){
 if(!active||!outContext||!outWorklet||!data)return;
 suppress();
 const samples=pcmFloat(data);if(!samples.length)return;
 let sum=0;for(let i=0;i<samples.length;i+=16)sum+=samples[i]*samples[i];
 const rms=Math.sqrt(sum/Math.max(1,Math.ceil(samples.length/16)));
 emitLevel(Math.min(1,rms*7),'assistant');markActivity();
 queuedUntil=Math.max(outContext.currentTime,queuedUntil)+samples.length/OUTPUT_RATE;
 try{outWorklet.port.postMessage({samples},[samples.buffer])}catch{outWorklet.port.postMessage({samples})}
 emit('speaking','الوكيل يتحدث')
}
async function token(force=false){if(typeof window.RelationsBankVoiceGetAppCheckToken!=='function')throw new Error('app-check-not-ready');const t=await window.RelationsBankVoiceGetAppCheckToken({forceRefresh:force}),r=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':t},body:'{}'}),j=await r.json().catch(()=>({}));if(r.status===401&&!force)return token(true);if(!r.ok||!j.token)throw new Error('voice-token-failed');return j.token}
function timeout(p,ms=TOOL_TIMEOUT){let id;return Promise.race([Promise.resolve(p),new Promise((_,rej)=>{id=setTimeout(()=>rej(new Error('tool-timeout')),ms)})]).finally(()=>clearTimeout(id))}
async function tools(calls=[]){const generation=voiceGeneration,captured=window.RBAssistantContext.identity;if(!active)return;const responses=[];emit('working','أحفظ المعلومة…');for(const call of calls){if(!active||generation!==voiceGeneration||captured!==window.RBAssistantContext.identity)return;let result;try{result=await timeout(executeAITool(call.name,call.args||{}))}catch(e){result={ok:false,error:String(e?.message||e)}}responses.push({name:call.name,id:call.id,response:{result}})}if(active&&generation===voiceGeneration&&captured===window.RBAssistantContext.identity)session?.sendToolResponse({functionResponses:responses})}
function message(m){
 if(!active)return;
 if(m?.toolCall?.functionCalls?.length)tools(m.toolCall.functionCalls).catch(console.error);
 const c=m?.serverContent;if(!c)return;
 if(c.interrupted){clearPlayback();micSuppressed=false;streamEndSent=false;emit('listening','أسمعك الآن')}
 if(c.inputTranscription?.text&&!micSuppressed){window.RBAssistant?.confirmFromSpeech(c.inputTranscription.text);markActivity();emit('listening','أسمعك الآن','أنت: '+c.inputTranscription.text)}
 if(c.outputTranscription?.text){markActivity();emit('speaking','الوكيل يتحدث','الوكيل: '+c.outputTranscription.text)}
 for(const p of c.modelTurn?.parts||[])if(p.inlineData?.data)play(p.inlineData.data);
 if(c.turnComplete&&active)resumeAfter();
}
function startMic(){
 if(!active||!session||!micContext||!micStream||micProcessor)return;
 micSource=micContext.createMediaStreamSource(micStream);micProcessor=micContext.createScriptProcessor(2048,1,1);silentGain=micContext.createGain();silentGain.gain.value=0;
 micProcessor.onaudioprocess=e=>{
   if(!active||!session||micSuppressed)return;
   const input=e.inputBuffer.getChannelData(0);
   let sum=0;for(let i=0;i<input.length;i+=8)sum+=input[i]*input[i];
   const rms=Math.sqrt(sum/Math.max(1,Math.ceil(input.length/8)));
   const now=performance.now();
   if(now-lastLevelEmit>70){emitLevel(Math.min(1,rms*10),'user');lastLevelEmit=now}
   if(rms>0.012)markActivity();
   const pcm=resample(input,micContext.sampleRate),bytes=new Uint8Array(pcm.buffer,pcm.byteOffset,pcm.byteLength);
   try{session.sendRealtimeInput({audio:{data:b64(bytes),mimeType:'audio/pcm;rate='+INPUT_RATE}})}catch{}
 };
 micSource.connect(micProcessor);micProcessor.connect(silentGain);silentGain.connect(micContext.destination);
}
async function shutdown(){
 clearTimeout(resumeTimer);resumeTimer=null;micSuppressed=false;streamEndSent=false;if(micProcessor)micProcessor.onaudioprocess=null;
 try{micProcessor?.disconnect();micSource?.disconnect();silentGain?.disconnect();outWorklet?.disconnect();outGain?.disconnect()}catch{}
 micStream?.getTracks?.().forEach(t=>t.stop());micStream=null;try{await micContext?.close();await outContext?.close()}catch{}
 micContext=outContext=null;micProcessor=micSource=silentGain=outWorklet=outGain=null;emitLevel(0);await releaseWake();
}
export async function start(){
 if(active)return;
 if(localStorage.getItem(consentKey())!=='yes')throw new Error('consent-required');
 const access=window.relationsBankCloud?.getAccess?.();if(!access?.member)throw new Error('invite-membership-required');
 const generation=++voiceGeneration;active=true;markActivity();emit('connecting','أجهز المحادثة…');
 try{
  const ctx=await publicContext();
  await prepare();const t=await token();if(!active||generation!==voiceGeneration)return;
  const ai=new GoogleGenAI({apiKey:t,httpOptions:{apiVersion:'v1alpha'}});
  session=await ai.live.connect({model:MODEL,config:{responseModalities:[Modality.AUDIO],systemInstruction:instruction(ctx),inputAudioTranscription:{},outputAudioTranscription:{},speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}},tools:[{functionDeclarations:RB_TOOL_DECLARATIONS}]},callbacks:{onopen:()=>emit('connecting','أتصل بالوكيل…'),onmessage:m=>{if(generation===voiceGeneration)message(m)},onerror:e=>console.error('Relations Bank voice',e),onclose:()=>{if(active&&generation===voiceGeneration){active=false;emit('error','انقطع الاتصال')}}}});
  if(!active||generation!==voiceGeneration)return;startMic();emit('listening','أسمعك الآن','');
  session.sendClientContent({turns:[{role:'user',parts:[{text:'ابدأ بتحية قصيرة ثم اسأل عن الهدف الحالي، أو تابع هدف الجولة المذكور في السياق.'}]}],turnComplete:true});
 }catch(e){console.error(e);active=false;emit('error','تعذر تشغيل المحادثة الصوتية','استخدم الكتابة الآن أو حاول مرة أخرى.');try{session?.close?.()}catch{}session=null;await shutdown();throw e}
}
export async function stop(){voiceGeneration++;active=false;try{session?.close?.()}catch{}session=null;await shutdown();emit('stopped','انتهت المحادثة')}
window.RelationsBankVoice={start,stop,get active(){return active}};

window.addEventListener('relationsbank:voice-save-result',e=>{if(active&&session)session.sendClientContent({turns:[{role:'user',parts:[{text:e.detail?.persisted?'أكد النظام أن الحفظ نجح. أخبرني بذلك باختصار.':'لم ينجح الحفظ. وجّهني للتنبيه داخل المنصة.'}]}],turnComplete:true});});

