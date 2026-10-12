import {aiErrorInfo} from '../ai-errors.js?v=20';
export const MAX_AUDIO_BYTES=10*1024*1024;
export function audioMime(file){
 const type=(file.type||'').split(';')[0];
 const map={'audio/x-m4a':'audio/mp4','audio/mp3':'audio/mpeg','audio/x-wav':'audio/wav'};
 if(map[type])return map[type];
 if(['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/ogg','audio/aac','audio/flac'].includes(type))return type;
 const ext=(file.name||'').split('.').pop().toLowerCase();
 return {m4a:'audio/mp4',mp3:'audio/mpeg',wav:'audio/wav',webm:'audio/webm',ogg:'audio/ogg',aac:'audio/aac',flac:'audio/flac'}[ext]||'';
}
export function validateAudio(file){if(!file?.size)throw Error('المقطع فارغ.');if(file.size>MAX_AUDIO_BYTES)throw Error('اختر مقطعا أصغر من 10 ميجابايت.');if(!audioMime(file))throw Error('صيغة الصوت غير مدعومة. جرب MP3 أو M4A أو WAV.');}
export function initVoice({getPoem,applyPoem,askAI}){
 const $=id=>document.getElementById(id);
 let recorder,stream,context,raf,timer,blob,url,recordedSeconds=0,started=0,busy=false,revision=0,pending=false;
 const status=t=>$('voiceStatus').textContent=t;
 const clock=n=>$('voiceClock').textContent=`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')} / 01:00`;
 const canvas=$('voiceWave'),ctx=canvas.getContext('2d');
 function idleWave(){ctx.clearRect(0,0,600,100);ctx.fillStyle='#b76b57';for(let i=0;i<55;i++){const h=5+Math.sin(i*.55)**2*18;ctx.fillRect(25+i*10,50-h/2,3,h);}}
 function releaseMic(){clearInterval(timer);cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;context?.close().catch(()=>{});context=null;}
 function controls(){const recording=recorder?.state==='recording';$('recordBtn').disabled=busy||pending;$('uploadAudio').disabled=busy||recording||pending;$('clearAudio').disabled=busy||recording||pending||!blob;$('transcribeBtn').disabled=busy||!blob||!$('audioConsent').checked;$('recordBtn').textContent=recording?'■ إنهاء التسجيل':'● ابدأ التسجيل';$('recordBtn').setAttribute('aria-label',recording?'إنهاء التسجيل':'بدء تسجيل الإلقاء');$('recordBtn').classList.toggle('recording',recording);}
 function clear(){revision++;$('audioPlayer').pause();$('audioPlayer').removeAttribute('src');$('audioPlayer').load();if(url)URL.revokeObjectURL(url);url=null;blob=null;$('audioFile').value='';$('audioConsent').checked=false;$('audioPlayer').hidden=true;$('audioSend').hidden=true;$('transcriptResult').hidden=true;$('transcript').value='';clock(0);idleWave();controls();}
 async function loadBlob(file,seconds){
  validateAudio(file);clear();const mine=revision;
  url=URL.createObjectURL(file);const player=$('audioPlayer');
  try{
   const duration=seconds||await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('تعذر قراءة مدة الملف. جرب مقطعا آخر.')),12000);player.onloadedmetadata=()=>{clearTimeout(timeout);resolve(player.duration);};player.onerror=()=>{clearTimeout(timeout);reject(Error('تعذر تشغيل هذا الملف في المتصفح. جرب MP3 أو M4A.'));};player.src=url;});
   if(mine!==revision)return;
   if(!Number.isFinite(duration)||duration<=0||duration>61)throw Error('اختر مقطعا مدته 60 ثانية أو أقل.');
   player.src=url;blob=file;player.hidden=false;$('audioSend').hidden=false;clock(Math.min(60,duration));status('اسمع المقطع، ثم اطلب القراءة عندما تكون جاهزا.');controls();
  }catch(e){clear();throw e;}
 }
 $('recordBtn').onclick=async()=>{
  if(recorder?.state==='recording'){recorder.stop();releaseMic();return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){status('التسجيل غير متاح في هذا المتصفح. استخدم رفع مقطع صوتي.');return;}
  clear();pending=true;controls();status('بانتظار إذن الميكروفون…');
  try{
   stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
   recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);const chunks=[];let total=0;
   recorder.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);total+=e.data.size;if(total>MAX_AUDIO_BYTES&&recorder.state==='recording'){recorder.stop();releaseMic();}}};
   recorder.onerror=()=>{releaseMic();pending=false;controls();status('تعذر إكمال التسجيل. أعد المحاولة أو ارفع مقطعا.');};
   recorder.onstop=async()=>{recordedSeconds=(performance.now()-started)/1000;releaseMic();pending=false;try{await loadBlob(new Blob(chunks,{type:recorder.mimeType}),recordedSeconds);}catch(e){status(e.message);}controls();};
   started=performance.now();recorder.start(250);pending=false;status('ألقِ بيتك. يتوقف التسجيل تلقائيا بعد 60 ثانية.');controls();
   timer=setInterval(()=>{const elapsed=(performance.now()-started)/1000;clock(Math.min(60,elapsed));if(elapsed>=60&&recorder.state==='recording'){recorder.stop();releaseMic();}},200);
   try{context=new (window.AudioContext||window.webkitAudioContext)();const analyser=context.createAnalyser();analyser.fftSize=256;context.createMediaStreamSource(stream).connect(analyser);const data=new Uint8Array(analyser.fftSize);const draw=()=>{analyser.getByteTimeDomainData(data);ctx.clearRect(0,0,600,100);ctx.strokeStyle='#b76b57';ctx.lineWidth=3;ctx.beginPath();data.forEach((v,i)=>{const x=i/data.length*600,y=v/255*100;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();raf=requestAnimationFrame(draw);};draw();}catch{/* Recording remains available without visualization. */}
  }catch(e){releaseMic();pending=false;controls();status(e.name==='NotAllowedError'?'إذن الميكروفون مرفوض. اسمح به من إعدادات الموقع أو ارفع مقطعا.':'تعذر فتح الميكروفون. استخدم رفع مقطع صوتي.');}
 };
 $('uploadAudio').onclick=()=>$('audioFile').click();
 $('audioFile').onchange=async()=>{const file=$('audioFile').files[0];if(!file)return;pending=true;controls();try{await loadBlob(file);}catch(e){status(e.message);}finally{pending=false;controls();}};
 $('clearAudio').onclick=()=>{clear();status('حذف المقطع من هذه الصفحة.');};$('audioConsent').onchange=controls;
 $('transcribeBtn').onclick=async()=>{
  if(busy||!blob||!$('audioConsent').checked)return;
  const original=getPoem(),mine=revision;busy=true;controls();status('يجري استخراج قراءة الإلقاء…');
  try{
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('تعذر قراءة الملف.'));reader.readAsDataURL(blob);});
   const result=await askAI('transcribe',{},[{inlineData:{mimeType:audioMime(blob),data}}]);
   if(mine!==revision)return;
   if(typeof result.poem!=='string'||!result.poem.trim())throw Error('لم أستطع تمييز أبيات في المقطع. جرب تسجيلا أقرب وأوضح.');
   $('transcript').value=result.poem.slice(0,5000);$('voiceOriginal').textContent=original||'المحرر فارغ';$('transcriptNote').textContent=String(result.note||'راجع الكلمات والتشكيل، ثم اعتمد القراءة.');$('transcriptResult').hidden=false;status('القراءة جاهزة لمراجعتك.');
  }catch(e){status(e.code?aiErrorInfo(e).message:e.message==='timeout'?aiErrorInfo(e).message:e.message);}finally{busy=false;controls();}
 };
 $('useTranscript').onclick=()=>{const text=$('transcript').value.trim();if(!text)return;applyPoem(text);};
 window.addEventListener('pagehide',()=>{if(recorder?.state==='recording'){recorder.onstop=null;recorder.stop();}releaseMic();clear();});idleWave();controls();
}
