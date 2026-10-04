import {GoogleGenAI,Modality} from 'https://cdn.jsdelivr.net/npm/@google/genai@2.14.0/+esm';
import {RB_TOOL_DECLARATIONS,executeRBTool} from './rb-assistant-tools.js?v=1';
import {saveMemberName} from './rb-name-tool.js?v=1';

const MODEL='gemini-3.1-flash-live-preview',INPUT_RATE=16000,OUTPUT_RATE=24000,TOOL_TIMEOUT=15000;
const NAME_TOOL={name:'set_member_name',description:'اعتمد اسم العضو بعد أن يؤكده بنفسه.',parametersJsonSchema:{type:'object',properties:{name:{type:'string'}},required:['name'],additionalProperties:false}};
let active=false,session=null,micStream=null,micContext=null,outContext=null,micSource=null,micProcessor=null,silentGain=null,outWorklet=null,outGain=null,micSuppressed=false,queuedUntil=0,resumeTimer=null,streamEndSent=false;
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const emit=(state,label,detail='')=>window.dispatchEvent(new CustomEvent('relationsbank:voice-state',{detail:{state,label,detail}}));
const endpoint=()=>String(window.RELATIONS_BANK_VOICE_TOKEN_ENDPOINT||'https://mesraah-live-token.naif123456.workers.dev/token').trim();

function instruction(context){
 return [
  'أنت وكيل صوتي داخل بنك العلاقات والفرص.',
  'مهمتك التعرف مهنيا على العضو وبناء ملفه وعلاقاته واحتياجاته داخليا من خلال محادثة طبيعية.',
  'المستخدم لا يرى استبيانا ولا حقول قاعدة بيانات. لا تطلب منه تعبئة نموذج.',
  'تحدث بالعربية السعودية الحجازية الخفيفة بصوت أنثوي مهني. اختصر واسأل سؤالا واحدا في كل مرة.',
  'في البداية قل باختصار إن إجاباته تستخدم لبناء ملفه المهني داخل الدائرة ويمكنه التوقف والعودة لاحقا.',
  'في أول دور أكد اسم العضو الظاهر في السياق قبل أي سؤال مهني. إذا صححه، اعتمد الاسم المصحح أولا.',
  'قبل السؤال استخدم get_member_context واقرأ النواقص. لا تسأل عن معلومة موجودة.',
  'إذا قال المستخدم عدة معلومات واضحة في جملة واحدة، نفذ عدة أدوات واحفظها كلها ثم اسأل عن أعلى فجوة تالية.',
  'لا تخترع أسماء أو جهات أو قوة علاقة. معرفة الاسم لا تعني إمكانية ترتيب لقاء.',
  'إذا ذكر علاقة، فرق بين التواصل المباشر وإمكانية طلب لقاء وسابقة المساعدة. إذا لم يقل واحدة منها لا تفترضها.',
  'اجعل صلاحية العلاقة owner أي التعارف عن طريقي ما لم يطلب المستخدم خاص أو متاح للدائرة.',
  'لا تستنتج شخصية نفسية ولا تسأل عن بيانات حساسة لا تخدم الغرض المهني.',
  'لا تقل تم الحفظ إلا إذا رجعت الأداة ok=true وpersisted=true.',
  'إذا قال يكفي اليوم، اختم باختصار.',
  'السياق عند بدء الجلسة: '+JSON.stringify(context||{})
 ].join('\n');
}
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
function play(data){if(!active||!outContext||!outWorklet||!data)return;suppress();const samples=pcmFloat(data);if(!samples.length)return;queuedUntil=Math.max(outContext.currentTime,queuedUntil)+samples.length/OUTPUT_RATE;try{outWorklet.port.postMessage({samples},[samples.buffer])}catch{outWorklet.port.postMessage({samples})}emit('speaking','الوكيل يتحدث')}
async function token(force=false){if(typeof window.RelationsBankVoiceGetAppCheckToken!=='function')throw new Error('app-check-not-ready');const t=await window.RelationsBankVoiceGetAppCheckToken({forceRefresh:force}),r=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-AppCheck':t},body:'{}'}),j=await r.json().catch(()=>({}));if(r.status===401&&!force)return token(true);if(!r.ok||!j.token)throw new Error('voice-token-failed');return j.token}
function timeout(p,ms=TOOL_TIMEOUT){let id;return Promise.race([Promise.resolve(p),new Promise((_,rej)=>{id=setTimeout(()=>rej(new Error('tool-timeout')),ms)})]).finally(()=>clearTimeout(id))}
async function tools(calls=[]){const responses=[];emit('working','أحفظ المعلومة…');for(const call of calls){let result;try{result=await timeout(executeRBTool(call.name,call.args||{}))}catch(e){result={ok:false,error:String(e?.message||e)}}responses.push({name:call.name,id:call.id,response:{result}})}session?.sendToolResponse({functionResponses:responses})}
function message(m){
 if(m?.toolCall?.functionCalls?.length)tools(m.toolCall.functionCalls).catch(console.error);
 const c=m?.serverContent;if(!c)return;
 if(c.interrupted){clearPlayback();micSuppressed=false;streamEndSent=false;emit('listening','أسمعك الآن')}
 if(c.inputTranscription?.text&&!micSuppressed)emit('listening','أسمعك الآن','أنت: '+c.inputTranscription.text);
 if(c.outputTranscription?.text)emit('speaking','الوكيل يتحدث','الوكيل: '+c.outputTranscription.text);
 for(const p of c.modelTurn?.parts||[])if(p.inlineData?.data)play(p.inlineData.data);
 if(c.turnComplete&&active)resumeAfter();
}
function startMic(){
 if(!active||!session||!micContext||!micStream||micProcessor)return;
 micSource=micContext.createMediaStreamSource(micStream);micProcessor=micContext.createScriptProcessor(2048,1,1);silentGain=micContext.createGain();silentGain.gain.value=0;
 micProcessor.onaudioprocess=e=>{if(!active||!session||micSuppressed)return;const pcm=resample(e.inputBuffer.getChannelData(0),micContext.sampleRate),bytes=new Uint8Array(pcm.buffer,pcm.byteOffset,pcm.byteLength);try{session.sendRealtimeInput({audio:{data:b64(bytes),mimeType:'audio/pcm;rate='+INPUT_RATE}})}catch{}};
 micSource.connect(micProcessor);micProcessor.connect(silentGain);silentGain.connect(micContext.destination);
}
async function shutdown(){
 clearTimeout(resumeTimer);resumeTimer=null;micSuppressed=false;streamEndSent=false;if(micProcessor)micProcessor.onaudioprocess=null;
 try{micProcessor?.disconnect();micSource?.disconnect();silentGain?.disconnect();outWorklet?.disconnect();outGain?.disconnect()}catch{}
 micStream?.getTracks?.().forEach(t=>t.stop());micStream=null;try{await micContext?.close();await outContext?.close()}catch{}
 micContext=outContext=null;micProcessor=micSource=silentGain=outWorklet=outGain=null;
}
export async function start(){
 if(active)return;
 const access=window.relationsBankCloud?.getAccess?.();if(!access?.member)throw new Error('invite-membership-required');
 active=true;emit('connecting','أجهز المحادثة…');
 try{
  const ctx=(await executeRBTool('get_member_context',{}))?.context||{};
  await prepare();const t=await token();if(!active)return;
  const ai=new GoogleGenAI({apiKey:t,httpOptions:{apiVersion:'v1alpha'}});
  session=await ai.live.connect({model:MODEL,config:{responseModalities:[Modality.AUDIO],systemInstruction:instruction(ctx),inputAudioTranscription:{},outputAudioTranscription:{},speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}},tools:[{functionDeclarations:[...RB_TOOL_DECLARATIONS,NAME_TOOL]}]},callbacks:{onopen:()=>emit('connecting','أتصل بالوكيل…'),onmessage:message,onerror:e=>console.error('Relations Bank voice',e),onclose:()=>{if(active){active=false;emit('error','انقطع الاتصال')}}}});
  if(!active)return;startMic();emit('listening','أسمعك الآن','تكلم بشكل طبيعي. الوكيل يحول كلامك إلى ملفك المهني داخليا.');
 }catch(e){console.error(e);active=false;emit('error','تعذر تشغيل المحادثة الصوتية','استخدم الكتابة الآن أو حاول مرة أخرى.');try{session?.close?.()}catch{}session=null;await shutdown();throw e}
}
export async function stop(){active=false;try{session?.close?.()}catch{}session=null;await shutdown();emit('stopped','انتهت المحادثة')}
window.RelationsBankVoice={start,stop,get active(){return active}};