import {auth,authReady,db,onAuthStateChanged,signIn,isOwner,loadWorkspace} from '../data.js?v=20261024';
import {signOut} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {doc,getDoc,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {CLOUD_ENABLED} from './config.js?v=20261024';
const $=id=>document.getElementById(id),message=text=>{$('cloudMessage').textContent=text};
let user=null,clients=[],revision=0,activeClient='',dirty=false,busy=false,epoch=0,privateLoaded=false;
const api=window.AuthorityMatrix;
const setBusy=value=>{busy=value;for(const id of ['saveMatrix','loadMatrix','clientSelect','restoreLegacy'])$(id).disabled=value};
const safeError=e=>e.code==='permission-denied'?'الحفظ الخاص غير متاح: يلزم تفعيل قواعد حماية البيانات.':e.message||'تعذر إتمام العملية؛ لم تُحفظ تغييراتك.';
window.addEventListener('matrixchange',()=>{dirty=true});
$('clientMemory').oninput=$('matrixState').onchange=()=>{dirty=true};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
function clearPrivate(){if(privateLoaded){api.clear();privateLoaded=false;dirty=false}$('clientMemory').value='';$('matrixState').value='draft';activeClient='';revision=0;clients=[];$('clientSelect').replaceChildren(new Option('اختر العميل',''));$('ownerWorkspace').hidden=true;}
function requireReady(){if(!CLOUD_ENABLED||!isOwner(user)||auth.currentUser?.uid!==user.uid)throw new Error('المساحة الخاصة غير متاحة');const client=clients.find(c=>c.id===$('clientSelect').value);if(!client)throw new Error('اختر العميل أولًا');return client}
$('ownerLogin').onclick=async()=>{try{await signIn()}catch(e){message(safeError(e))}};
$('ownerLogout').onclick=async()=>{if(dirty&&!confirm('توجد تغييرات لم تحفظ. الخروج وإزالة البيانات الخاصة من الصفحة؟'))return;await signOut(auth)};
$('loadMatrix').onclick=async()=>{
 if(busy)return;
 try{const client=requireReady();if(dirty&&!confirm('سيتم استبدال المحتوى الحالي. هل صدّرت أو حفظت ما تحتاجه؟'))return;setBusy(true);const requestEpoch=epoch,uid=user.uid;
 const snap=await getDoc(doc(db,'masarAuthority',uid,'matrices',client.id));if(requestEpoch!==epoch)return;
 if(snap.exists()){const data=snap.data();api.load(JSON.parse(data.matrixJson));revision=data.revision;$('clientMemory').value=data.memory||'';$('matrixState').value=data.status||'draft'}else{api.clear();$('companyName').value=client.name;revision=0;$('clientMemory').value='';$('matrixState').value='draft'}
 activeClient=client.id;privateLoaded=true;dirty=false;message(snap.exists()?`تم فتح نسخة ${revision} للعميل ${client.name}`:'لا توجد مصفوفة محفوظة لهذا العميل؛ يمكنك إعدادها الآن.');
 }catch(e){message(safeError(e))}finally{setBusy(false)}
};
$('saveMatrix').onclick=async()=>{
 if(busy)return;
 try{const client=requireReady();if(activeClient&&activeClient!==client.id)throw new Error('افتح مصفوفة العميل المختار قبل الحفظ');
 if(!activeClient&&!confirm(`ربط المصفوفة الحالية بالعميل «${client.name}»؟`))return;
 const data=MatrixData.parse(JSON.stringify(api.snapshot())),matrixJson=JSON.stringify(data);if(new TextEncoder().encode(matrixJson).length>700000)throw new Error('حجم المصفوفة كبير للحفظ السحابي؛ صدّر JSON للاحتفاظ بها.');
 const uid=user.uid,requestEpoch=epoch,expected=revision,memory=$('clientMemory').value,status=$('matrixState').value;
 setBusy(true);
 await runTransaction(db,async tx=>{
  if(requestEpoch!==epoch)throw new Error('تغير الحساب؛ أعد المحاولة');
  const ref=doc(db,'masarAuthority',uid,'matrices',client.id),snap=await tx.get(ref),old=snap.data();
  if((old?.revision||0)!==expected)throw new Error('توجد نسخة أحدث. صدّر تعديلاتك ثم افتح النسخة الجديدة قبل الحفظ.');
  const next={ownerUid:uid,clientId:client.id,clientName:client.name,matrixJson,memory,status,revision:expected+1,createdAt:old?.createdAt||serverTimestamp(),updatedAt:serverTimestamp()};
  tx.set(ref,next);tx.set(doc(ref,'versions',String(next.revision)),next);
 });
 if(requestEpoch!==epoch)return;activeClient=client.id;privateLoaded=true;revision=expected+1;
 dirty=JSON.stringify(api.snapshot())!==matrixJson||$('clientMemory').value!==memory||$('matrixState').value!==status;
 message(`تم حفظ النسخة ${revision} وربطها بالعميل ${client.name}${dirty?'؛ توجد تعديلات أحدث لم تحفظ.':''}`);
 }catch(e){message(safeError(e))}finally{setBusy(false)}
};
$('restoreLegacy').onclick=()=>{try{requireReady();if(dirty&&!confirm('استبدال المحتوى الحالي بالنسخة السابقة لهذا المتصفح؟'))return;api.restoreLegacy();privateLoaded=true;message('تمت الاستعادة للتحرير؛ لم تُحفظ سحابيًا بعد.')}catch(e){message(safeError(e))}};
await authReady.catch(()=>{});
onAuthStateChanged(auth,async account=>{
 epoch++;const requestEpoch=epoch;clearPrivate();user=account;$('ownerLogin').hidden=Boolean(account);$('ownerLogout').hidden=!account;
 if(!account){message('التحرير العام متاح. صدّر JSON للاحتفاظ بالعمل؛ الحفظ الخاص يتطلب الحساب المعتمد.');return}
 if(!CLOUD_ENABLED){message('تم الدخول. الحفظ الخاص وربط العملاء قيد التفعيل بعد اعتماد قواعد الحماية. يمكنك التحرير وتصدير JSON وPDF الآن.');return}
 try{const workspace=await loadWorkspace(account);if(requestEpoch!==epoch)return;clients=workspace.clients;$('clientSelect').replaceChildren(new Option('اختر العميل',''),...clients.map(c=>new Option(c.name,c.id)));const requested=new URLSearchParams(location.search).get('clientId');if(clients.some(c=>c.id===requested))$('clientSelect').value=requested;$('ownerWorkspace').hidden=false;message('اختر عميلًا لفتح مصفوفتـه، أو اربط المصفوفة الحالية عند الحفظ.')}catch(e){message(safeError(e))}
});
window.addEventListener('pageshow',e=>{if(e.persisted&&privateLoaded&&!isOwner(auth.currentUser))clearPrivate()});
