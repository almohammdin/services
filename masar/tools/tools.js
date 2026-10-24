import {TOOLS,toolUrl} from './catalog.js?v=20261024e';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let account=null,clients=[],records=[],epoch=0;
const statusLabels={draft:'مسودة',review:'للمراجعة',approved:'معتمدة داخليًا',received:'وصلت الإجابات',reviewed:'تمت مراجعتها'};
function render(){
 const clientId=account?$('clientFilter').value:'';
 $('toolCards').innerHTML=TOOLS.map(t=>`<article class="tool-card"><span class="tool-category">${esc(t.category)}</span><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p><small>التصدير: <span dir="ltr">${esc(t.outputs)}</span></small>${t.note?`<small class="tool-note">${esc(t.note)}</small>`:''}<div class="tool-actions"><a class="tool-link primary" href="${esc(toolUrl(t))}">${esc(t.openLabel||'فتح الأداة')} ←</a>${account&&clientId?`<a class="tool-link" href="${esc(toolUrl(t,clientId))}">${esc(t.clientLabel||'فتح للعميل المختار')}</a>`:''}</div></article>`).join('');
 const list=records.filter(r=>!clientId||r.clientId===clientId);
 $('savedWork').innerHTML=list.length?list.map(r=>{const tool=TOOLS.find(t=>t.id===r.toolId);if(!tool)return '';const date=new Date(r.updatedAtIso);const stamp=Number.isNaN(date.getTime())?'':date.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn');return `<article class="saved-row"><div><strong>${esc(r.clientName)}</strong><small>${esc(tool.name)} · ${esc(statusLabels[r.status]||'مسودة')} · الإصدار ${esc(r.revision)}${stamp?' · '+esc(stamp):''}</small></div><a class="tool-link" href="${esc(toolUrl(tool,r.clientId))}">استكمال العمل ←</a></article>`}).join(''):'<p class="empty-work">لا توجد أعمال محفوظة'+(clientId?' لهذا العميل':'')+' بعد. افتح أداة واربط عملك بالعميل عند الحفظ.</p>';
}
function clear(){account=null;clients=[];records=[];$('privateWorkspace').hidden=true;$('clientFilter').replaceChildren(new Option('كل العملاء',''));render()}
$('clientFilter').onchange=render;render();
try{
 const {auth,authReady,onAuthStateChanged,signIn,loadToolWorkspace}=await import('../data.js?v=20261024e');
 const {signOut}=await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js');
 $('loginBtn').onclick=async()=>{try{$('loginBtn').disabled=true;await signIn()}catch(e){$('accountMessage').textContent=e.message||'تعذر الدخول. حاول مجددًا.'}finally{$('loginBtn').disabled=false}};
 $('logoutBtn').onclick=()=>signOut(auth);
 await authReady.catch(()=>{});
 onAuthStateChanged(auth,async user=>{
  const requestEpoch=++epoch;clear();$('loginBtn').hidden=Boolean(user);$('logoutBtn').hidden=!user;
  if(!user){$('accountMessage').textContent='التحرير العام دون حفظ. الدخول والحفظ وربط العملاء عبر حساب مسار الخاص بنايف.';return}
  $('accountMessage').textContent='جارٍ فتح أعمالك المحفوظة في مسار…';
  try{const data=await loadToolWorkspace(user,TOOLS.filter(t=>t.workspaceField||t.workspaceKind));if(requestEpoch!==epoch)return;account=user;clients=data.clients;records=data.records;$('clientFilter').replaceChildren(new Option('كل العملاء',''),...clients.map(c=>new Option(c.name,c.id)));const requested=new URLSearchParams(location.search).get('clientId');if(clients.some(c=>c.id===requested))$('clientFilter').value=requested;$('privateWorkspace').hidden=false;$('accountMessage').textContent='أعمالك المحفوظة مرتبطة بعملاء مسار، ويمكنك العودة إليها من هنا.';render()}catch(e){if(requestEpoch===epoch)$('accountMessage').textContent='تعذر تحميل أعمال الحساب. حدّث الصفحة للمحاولة مجددًا.'}
 });
 window.addEventListener('pageshow',e=>{if(e.persisted&&auth.currentUser?.uid!==account?.uid){epoch++;clear()}});
}catch(e){$('accountMessage').textContent='الأدوات العامة متاحة. تعذر الاتصال بالحساب؛ حدّث الصفحة للمحاولة مجددًا.';$('loginBtn').hidden=true}
