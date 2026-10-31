import {auth,authReady,onAuthStateChanged,loadWorkspace,saveClientSurvey} from '../data.js?v=20261031-alharbi';
import {signOut} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {surveyGroups,parseSurvey} from './model.js?v=20261031-alharbi';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let account=null,clients=[],current=null,sourceJson='',revision=0,dirty=false,epoch=0,busy=false;
const publicUrl=new URL('/services/consultation/',location.origin).href;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function clearPrivate(){account=null;clients=[];current=null;sourceJson='';revision=0;dirty=false;$('workspace').hidden=true;$('clientWorkspace').hidden=true;$('answers').replaceChildren();$('clientSelect').replaceChildren(new Option('اختر العميل',''));$('sourceJson').value='';$('sourceFile').value='hatta-consulting-draft.json';$('clientName').textContent='';$('contactName').textContent='';$('recordMeta').textContent='';$('saveMessage').textContent='';$('importMessage').textContent='';}
function renderAnswers(){
 if(!sourceJson){$('answers').innerHTML='<p class="empty-survey">بانتظار إضافة إجابات هذا العميل.</p>';$('recordMeta').textContent='';}
 else{const {source,answerCount}=parseSurvey(sourceJson);$('recordMeta').textContent=answerCount+' إجابة · '+$('sourceFile').value+(revision?' · النسخة '+revision:'');$('answers').innerHTML=surveyGroups(source.schema).map(g=>'<section class="survey-card answer-group"><h2>'+esc(g.title)+'</h2><dl>'+g.fields.filter(([id])=>Object.hasOwn(source.answers,id)).map(([id,label])=>'<div class="answer"><dt>'+esc(label)+'</dt><dd>'+esc(source.answers[id]||'لم تتم الإجابة')+'</dd></div>').join('')+'</dl></section>').join('');}
 $('saveSurvey').disabled=!sourceJson||busy;$('downloadSurvey').disabled=!sourceJson;$('printSurvey').disabled=!sourceJson;
 $('recordStatus').textContent=dirty?'تعديلات تنتظر الحفظ':sourceJson?($('reviewStatus').value==='reviewed'?'تمت مراجعتها':'وصلت الإجابات'):'بانتظار الإجابات';
}
function selectClient(){
 current=clients.find(c=>c.id===$('clientSelect').value)||null;sourceJson=current?.consultation?.sourceJson||'';revision=current?.consultation?.revision||0;dirty=false;
 $('clientWorkspace').hidden=!current;$('answers').replaceChildren();$('saveMessage').textContent='';$('importMessage').textContent='';$('sourceJson').value='';$('answerFile').value='';
 if(!current)return;
 $('clientName').textContent=current.name;$('contactName').textContent=current.person||'';$('clientLink').href='../clients/?clientId='+encodeURIComponent(current.id);
 const record=current.consultation;$('sentDate').value=record?.sentDate||'';$('receivedDate').value=record?.receivedDate||today();$('reviewStatus').value=record?.status||'received';$('sourceFile').value=record?.sourceFile||'hatta-consulting-draft.json';$('importBox').open=!sourceJson;renderAnswers();
}
$('clientSelect').onchange=()=>{if(dirty&&!confirm('توجد تعديلات غير محفوظة. الانتقال إلى عميل آخر؟')){$('clientSelect').value=current?.id||'';return}epoch++;selectClient()};
function preview(text,fileName){
 if(!current)throw Error('اختر العميل أولا.');
 parseSurvey(text);
 if(sourceJson!==text&&current.consultation&&!confirm('استبدال الإجابات المحفوظة في المعاينة؟ تبقى النسخة الحالية حتى تضغط حفظ.'))return;
 sourceJson=text;if(fileName)$('sourceFile').value=fileName;
 dirty=true;$('reviewStatus').value='received';$('receivedDate').value=today();$('saveMessage').textContent='راجع الإجابات ثم احفظها في ملف '+current.name+'.';$('importMessage').textContent='تمت قراءة الملف. الإجابات معروضة أدناه.';renderAnswers();
}
$('previewSurvey').onclick=()=>{try{preview($('sourceJson').value)}catch(e){$('importMessage').textContent=e.message}};
$('answerFile').onchange=async e=>{const file=e.target.files[0],requestEpoch=epoch;if(!file)return;try{if(file.size>200000)throw Error('حجم الملف يتجاوز الحد المسموح.');const text=await file.text();if(requestEpoch!==epoch||!account)return;preview(text,file.name);$('sourceJson').value=text}catch(e){if(requestEpoch===epoch)$('importMessage').textContent=e.message}};
for(const id of ['sentDate','receivedDate','reviewStatus','sourceFile'])$(id).onchange=()=>{if(sourceJson){dirty=true;renderAnswers()}};
$('saveSurvey').onclick=async()=>{
 if(!account||!current||!sourceJson||busy)return;
 const requestEpoch=epoch,clientId=current.id,owner=account;
 const payload={sourceJson,sourceFile:$('sourceFile').value.trim(),sentDate:$('sentDate').value,receivedDate:$('receivedDate').value,status:$('reviewStatus').value};
 busy=true;$('clientSelect').disabled=true;$('answerFile').disabled=true;$('previewSurvey').disabled=true;$('sourceJson').disabled=true;for(const id of ['sentDate','receivedDate','reviewStatus','sourceFile'])$(id).disabled=true;renderAnswers();$('saveMessage').textContent='جار حفظ الإجابات…';
 try{const record=await saveClientSurvey(owner,clientId,payload,revision);if(requestEpoch!==epoch||account?.uid!==owner.uid)return;current.consultation=record;revision=record.revision;dirty=false;$('sourceJson').value='';$('importBox').open=false;$('saveMessage').textContent='تم حفظ '+record.answerCount+' إجابة في ملف '+current.name+'.';}
 catch(e){if(requestEpoch===epoch)$('saveMessage').textContent=e.message||'تعذر الحفظ. احتفظ بملف الإجابات وحاول مجددا.'}
 finally{busy=false;$('clientSelect').disabled=false;$('answerFile').disabled=false;$('previewSurvey').disabled=false;$('sourceJson').disabled=false;for(const id of ['sentDate','receivedDate','reviewStatus','sourceFile'])$(id).disabled=false;if(requestEpoch===epoch&&account)renderAnswers()}
};
$('downloadSurvey').onclick=()=>{if(!account||!sourceJson)return;const url=URL.createObjectURL(new Blob([sourceJson],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=$('sourceFile').value.replace(/[^\p{L}\p{N}._-]/gu,'_')||'hatta-consulting-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('printSurvey').onclick=()=>{if(account&&sourceJson)window.print()};
$('copyLink').onclick=async()=>{try{await navigator.clipboard.writeText(publicUrl);$('accountMessage').textContent='تم نسخ رابط الاستبيان العام.'}catch{$('accountMessage').textContent='رابط الاستبيان: '+publicUrl}};
$('logout').onclick=()=>signOut(auth);
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
await authReady.catch(()=>{});await auth.authStateReady();
onAuthStateChanged(auth,async user=>{
 const requestEpoch=++epoch;clearPrivate();
 if(!user){location.replace('/services/masar/?next='+encodeURIComponent(location.pathname+location.search));return}
 account=user;
 try{const data=await loadWorkspace(user);if(requestEpoch!==epoch||account?.uid!==user.uid)return;clients=data.clients;$('clientSelect').replaceChildren(new Option('اختر العميل',''),...clients.map(c=>new Option(c.name,c.id)));const id=new URLSearchParams(location.search).get('clientId');if(clients.some(c=>c.id===id))$('clientSelect').value=id;$('workspace').hidden=false;$('accountMessage').textContent='الإجابات محفوظة في حساب مسار الخاص بك.';selectClient();}
 catch(e){if(requestEpoch===epoch)$('accountMessage').textContent='تعذر فتح ملفات العملاء. حدّث الصفحة للمحاولة مجددا.'}
});
window.addEventListener('pageshow',e=>{if(e.persisted&&auth.currentUser?.uid!==account?.uid){epoch++;clearPrivate()}});
