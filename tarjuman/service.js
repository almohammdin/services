(()=>{
 'use strict';
 const origin='https://tarjuman-live.yellow-elm-1021.chatgpt.site';
 const remote=location.protocol!=='file:'&&location.origin!==origin&&!['localhost','127.0.0.1'].includes(location.hostname);
 let token='',expires=0;
 async function request(path,data){
  if(!['/api/config','/api/connect','/api/disconnect','/api/live-token','/api/assist','/api/translate','/api/speech'].includes(path))throw Error('طلب غير مدعوم.');
  if(token&&Date.now()>=expires){token='';expires=0;}
  const headers={};if(data!==undefined)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;
  let response;try{response=await fetch((remote?origin:'')+path,{method:data===undefined?'GET':'POST',headers,credentials:remote?'omit':'same-origin',...(data!==undefined?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(65000),cache:'no-store'});}catch{throw Error('تعذر الوصول إلى خدمة الترجمة. تحقق من الاتصال ثم حاول مجددًا.');}
  let body;try{body=await response.json();}catch{throw Error('استجابة غير متوقعة. تحقق من جاهزية خدمة الترجمة.');}
  if(!response.ok){if(response.status===401){token='';expires=0;}const e=Error(body.error||'تعذر إكمال الطلب.');e.status=response.status;throw e;}
  if(path==='/api/connect'){token=body.token;expires=body.expiresAt;delete body.token;}
  if(path==='/api/disconnect'){token='';expires=0;}
  return body;
 }
 async function testLive(target){
  const r=await request('/api/live-token',{target,mode:target==='ar'?'fusha':'fast'});
  await new Promise((resolve,reject)=>{
   const ws=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token='+encodeURIComponent(r.token));
   let done=false;const finish=error=>{if(done)return;done=true;clearTimeout(timer);ws.close();error?reject(error):resolve();};
   const timer=setTimeout(()=>finish(Error('لم يستجب اتصال الترجمة. حاول مجددًا.')),15000);
   ws.onopen=()=>ws.send(JSON.stringify({setup:r.setup||{model:'models/gemini-3.5-live-translate-preview',inputAudioTranscription:{},outputAudioTranscription:{},generationConfig:{responseModalities:['AUDIO'],translationConfig:{targetLanguageCode:target,echoTargetLanguage:false}}}}));
   ws.onmessage=async e=>{try{const d=JSON.parse(typeof e.data==='string'?e.data:await e.data.text());if(d.setupComplete)finish();else if(d.error)finish(Error('تعذر تشغيل نموذج الترجمة في هذا الحساب.'));}catch{}};
   ws.onerror=()=>finish(Error('تعذر الاتصال بترجمة Google.'));ws.onclose=e=>{if(!done)finish(Error('أغلق Google اتصال الترجمة ('+e.code+'). '+String(e.reason||'').slice(0,240).replace(/(?:AQ\.[A-Za-z0-9._-]+|AIza[A-Za-z0-9_-]{20,})/g,'[مفتاح مخفي]')));};
  });return true;
 }
 async function test(target,onProgress=()=>{}){
  const state=['الترجمة: جارٍ الاختبار','المساعد: جارٍ الاختبار'];
  const jobs=[()=>testLive(target),()=>request('/api/assist',{action:'ask',question:'هذا اختبار اتصال فقط. أجب بكلمة: متصل.',context:{target,segments:[],notes:[],attachments:[]}})];
  const labels=['الترجمة','المساعد'];
  if(target==='ar'){state.push('الفصحى والصوت: جارٍ الاختبار');labels.push('الفصحى والصوت');jobs.push(async()=>{const r=await request('/api/translate',{source:'How are you?'});const voice=await request('/api/speech',{text:r.text});if(!voice.audio)throw Error('لم يصل صوت الفصحى.');});}
  await Promise.all(jobs.map(async(job,i)=>{try{await job();state[i]=labels[i]+': متصل';}catch(e){state[i]=labels[i]+': '+e.message;}onProgress(state.join('\n'));}));
  return state.every(s=>s.endsWith(': متصل'));
 }
 window.TarjumanService=Object.freeze({request,test,remote});
})();
