import {mergeClientSurvey} from './consultation/model.js?v=20261031-alharbi';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getAuth,setPersistence,browserLocalPersistence,GoogleAuthProvider,signInWithPopup,onAuthStateChanged as watchAuth,signOut} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const config={apiKey:'AIzaSyAAvC9y5jQ_7fAwmkCqBtgFDrBRF5t4uI0',authDomain:'mesraah-a2dfc.firebaseapp.com',projectId:'mesraah-a2dfc',storageBucket:'mesraah-a2dfc.firebasestorage.app',messagingSenderId:'986043593957',appId:'1:986043593957:web:b848313ef8cf83a5f3500c'};
const app=initializeApp(config);
export const auth=getAuth(app);
export const db=getFirestore(app);
export const authReady=setPersistence(auth,browserLocalPersistence);
export const OWNER_EMAIL='naif123456@gmail.com';
export const isOwner=user=>Boolean(user&&user.email?.toLowerCase()===OWNER_EMAIL&&user.emailVerified&&user.providerData?.some(p=>p.providerId==='google.com'));
export function onAuthStateChanged(instance,callback){return watchAuth(instance,user=>callback(isOwner(user)?user:null))}
function requireOwner(user){if(!isOwner(user)||auth.currentUser?.uid!==user.uid)throw new Error('هذه المساحة خاصة بمالك الحساب')}


export async function signIn(){
  await authReady;
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  const user=(await signInWithPopup(auth,provider)).user;if(!isOwner(user)){await signOut(auth);throw new Error('الدخول الخاص متاح لحساب نايف المعتمد فقط')}return user;
}

export const clientKey=name=>String(name||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ar');
export const quoteKey=quote=>String(quote?.id||quote?.quoteNo||'');
export const quoteSeriesKey=quote=>String(quote?.seriesId||quoteKey(quote));
export const quoteVersion=quote=>Math.max(1,Number(quote?.version)||1);
export function latestQuotes(rows=[]){
  const groups=new Map();
  for(const row of rows){
    const key=quoteSeriesKey(row),old=groups.get(key);
    if(!old||quoteVersion(row)>quoteVersion(old)||(quoteVersion(row)===quoteVersion(old)&&String(row.updatedAtIso||'')>String(old.updatedAtIso||'')))groups.set(key,row);
  }
  return [...groups.values()].sort((a,b)=>String(b.updatedAtIso||'').localeCompare(String(a.updatedAtIso||'')));
}
export function quoteFinances(row){
  const amount=Math.max(0,Number(row?.amount)||0);
  const partnerCost=row?.partnerCost===''||row?.partnerCost==null?null:Number(row.partnerCost);
  const validCost=partnerCost!==null&&Number.isFinite(partnerCost)&&partnerCost>=0&&partnerCost<=amount;
  const ownShare=validCost?amount-partnerCost:null;
  const hasCollected=row?.collectedAmount!==null&&row?.collectedAmount!==undefined&&row?.collectedAmount!=='';
  const hasPartnerPaid=row?.partnerPaid!==null&&row?.partnerPaid!==undefined&&row?.partnerPaid!=='';
  const collected=hasCollected?Math.min(amount,Math.max(0,Number(row.collectedAmount)||0)):null;
  const partnerPaid=hasPartnerPaid?Math.min(validCost?partnerCost:0,Math.max(0,Number(row.partnerPaid)||0)):null;
  return {amount,partnerCost:validCost?partnerCost:null,ownShare,collected,partnerPaid,remainingClient:collected===null?null:amount-collected,remainingPartner:validCost&&partnerPaid!==null?partnerCost-partnerPaid:null};
}
const serviceNames={liquidation_pre:'خدمات ما قبل التصفية',governance_session:'جلسة استشارية في الحوكمة',diagnosis:'تشخيص الوضع المؤسسي',authority_matrix:'مصفوفة الصلاحيات',partners:'تنظيم علاقة الشركاء',restructuring:'إعادة الهيكلة',monthly:'متابعة شهرية',custom:'خدمة مخصصة'};
export const serviceLabel=quote=>quote?.serviceName||serviceNames[quote?.service]||quote?.service||'عرض سعر';
const localKey='pricing_clients_v1';
function localClients(){
  try{
    const rows=JSON.parse(localStorage.getItem(localKey)||'[]');
    return Array.isArray(rows)?rows:[];
  }catch{return []}
}
function distinctClients(rows){
  const map=new Map();
  for(const row of rows){
    const name=String(row?.name||'').trim().replace(/\s+/g,' ');
    if(!name)continue;
    const key=clientKey(name),old=map.get(key)||{};
    map.set(key,{...old,...row,name,person:row.person??old.person??'',notes:row.notes??old.notes??'',email:row.email??old.email??'',mobile:row.mobile??old.mobile??'',whatsapp:row.whatsapp??old.whatsapp??''});
  }
  return [...map.values()];
}
// Stable opaque IDs survive client renaming. Migration and saves read the latest document.
function workspaceData(data){
 const deleted=new Set(data.pricingTool_v1?.deletedQuoteIds||[]);
 const quotes=(data.pricingTool_v1?.quotes||[]).filter(q=>!deleted.has(quoteKey(q)));
 const stored=Array.isArray(data.pricingClients_v1?.clients)?data.pricingClients_v1.clients:[];
 const clients=distinctClients([...quotes.map(q=>({name:q.client})),...stored]).map(c=>({...c,id:c.id||crypto.randomUUID()}));
 return {quotes,clients,currentQuoteId:data.pricingTool_v1?.currentQuoteId||null};
}
export async function loadWorkspace(user){
 requireOwner(user);
 return runTransaction(db,async tx=>{
  const ref=doc(db,'users',user.uid),snap=await tx.get(ref),data=snap.data()||{};
  const result=workspaceData(data),stored=data.pricingClients_v1?.clients||[];
  if(result.clients.length!==stored.length||stored.some(c=>!c.id))tx.set(ref,{pricingClients_v1:{clients:result.clients,updatedAtIso:new Date().toISOString()},updatedAt:serverTimestamp()},{merge:true});
  return result;
 });
}
export async function saveClient(user,client){
 requireOwner(user);
 const name=String(client.name||'').trim().replace(/\s+/g,' ');
 if(!name)throw new Error('اسم العميل مطلوب');
 return runTransaction(db,async tx=>{
  const ref=doc(db,'users',user.uid),snap=await tx.get(ref),data=snap.data()||{};
  const current=workspaceData(data).clients,key=clientKey(name),old=current.find(c=>clientKey(c.name)===key)||{};
  const clients=distinctClients([...current.filter(c=>clientKey(c.name)!==key),{...old,...client,name,id:old.id||crypto.randomUUID()}]);
  tx.set(ref,{pricingClients_v1:{clients,updatedAtIso:new Date().toISOString()},updatedAt:serverTimestamp()},{merge:true});
  return clients;
 });
}

export async function updateClient(user,originalName,changes){
  requireOwner(user);
  const oldKey=clientKey(originalName);
  const name=String(changes.name||'').trim().replace(/\s+/g,' ');
  if(!oldKey||!name)throw new Error('اسم العميل مطلوب');
  const newKey=clientKey(name);
  const result=await runTransaction(db,async tx=>{
    const ref=doc(db,'users',user.uid),snap=await tx.get(ref),data=snap.data()||{};
    const box=data.pricingTool_v1||{};
    const deleted=new Set(box.deletedQuoteIds||[]);
    const quotes=(Array.isArray(box.quotes)?box.quotes:[]).filter(q=>!deleted.has(quoteKey(q)));
    const stored=Array.isArray(data.pricingClients_v1?.clients)?data.pricingClients_v1.clients:[];
    const clients=distinctClients([...quotes.map(q=>({name:q.client})),...stored]);
    if(newKey!==oldKey&&clients.some(c=>clientKey(c.name)===newKey))throw new Error('يوجد عميل بهذا الاسم بالفعل');
    const existing=clients.find(c=>clientKey(c.name)===oldKey);
    if(!existing)throw new Error('لم يعد العميل موجودًا. حدّث الصفحة وحاول مجددًا');
    const nextClients=distinctClients([...clients.filter(c=>clientKey(c.name)!==oldKey),{
      ...existing,name,person:String(changes.person||'').trim(),notes:String(changes.notes||'').trim(),email:String(changes.email||'').trim(),mobile:String(changes.mobile||'').trim(),whatsapp:String(changes.whatsapp||'').trim()
    }]);
    const nextQuotes=quotes.map(q=>clientKey(q.client)===oldKey?{...q,client:name}:q);
    tx.set(ref,{
      pricingClients_v1:{clients:nextClients,updatedAtIso:new Date().toISOString()},
      pricingTool_v1:{...box,quotes:nextQuotes,updatedAtIso:new Date().toISOString()},
      updatedAt:serverTimestamp()
    },{merge:true});
    return {clients:nextClients,quotes:nextQuotes};
  });
  if(newKey!==oldKey){
    try{const local=localClients().map(c=>clientKey(c.name)===oldKey?{...c,name}:c);localStorage.setItem(localKey,JSON.stringify(local))}
    catch(error){console.warn('local client cache skipped',error)}
  }
  return result;
}

export async function deleteQuoteVersion(user,id){
  requireOwner(user);
  const key=String(id||'');
  if(!key)throw new Error('معرّف النسخة غير صالح');
  return runTransaction(db,async tx=>{
    const ref=doc(db,'users',user.uid),snap=await tx.get(ref),data=snap.data()||{};
    const box=data.pricingTool_v1||{};
    const quotes=Array.isArray(box.quotes)?box.quotes:[];
    if(!quotes.some(q=>quoteKey(q)===key))throw new Error('النسخة غير موجودة؛ حدّث الصفحة');
    const nextQuotes=quotes.filter(q=>quoteKey(q)!==key);
    const deletedQuoteIds=[...new Set([...(box.deletedQuoteIds||[]),key])];
    const currentQuoteId=box.currentQuoteId===key?(quoteKey(nextQuotes[0])||null):box.currentQuoteId||null;
    tx.set(ref,{pricingTool_v1:{...box,quotes:nextQuotes,deletedQuoteIds,currentQuoteId,updatedAtIso:new Date().toISOString()},updatedAt:serverTimestamp()},{merge:true});
    return nextQuotes;
  });
}


// Authority matrices share the existing private Masar user document and its rules.
// Transactions preserve quotes/clients and reject overwriting a newer matrix.
export async function loadAuthorityMatrix(user,clientId){
 requireOwner(user);
 const snap=await getDoc(doc(db,'users',user.uid));
 return snap.data()?.authorityMatrices_v1?.matrices?.[clientId]||null;
}
export async function saveAuthorityMatrix(user,{clientId,matrixJson,memory='',status='draft',expectedRevision=0}){
 requireOwner(user);
 if(typeof matrixJson!=='string'||new TextEncoder().encode(matrixJson).length>700000)throw new Error('حجم المصفوفة كبير؛ صدّر JSON للاحتفاظ بها.');
 if(typeof memory!=='string'||memory.length>12000||!['draft','review','approved'].includes(status))throw new Error('تحقق من سياق العميل وحالة المصفوفة');
 return runTransaction(db,async tx=>{
  requireOwner(user);
  const ref=doc(db,'users',user.uid),snap=await tx.get(ref),data=snap.data()||{};
  const client=(data.pricingClients_v1?.clients||[]).find(c=>c.id===clientId);
  if(!client)throw new Error('العميل غير موجود. حدّث قائمة العملاء ثم حاول مجددًا.');
  const box=data.authorityMatrices_v1||{},matrices=box.matrices||{},old=matrices[clientId];
  if((old?.revision||0)!==expectedRevision)throw new Error('توجد نسخة أحدث. صدّر تعديلاتك ثم افتح النسخة الجديدة قبل الحفظ.');
  const now=new Date().toISOString();
  const next={clientId,clientName:client.name,matrixJson,memory,status,revision:expectedRevision+1,createdAtIso:old?.createdAtIso||now,updatedAtIso:now};
  const nextBox={...box,matrices:{...matrices,[clientId]:next},updatedAtIso:now};
  // Keep a safety margin below Firestore's document-size limit. Never trim client data.
  if(new TextEncoder().encode(JSON.stringify({...data,authorityMatrices_v1:nextBox})).length>850000)throw new Error('مساحة سجل مسار الحالية ممتلئة. لم نحذف أو نختصر أي بيانات؛ صدّر المصفوفة JSON لحفظ عملك.');
  tx.set(ref,{authorityMatrices_v1:nextBox,updatedAt:serverTimestamp()},{merge:true});
  return next;
 });
}

export async function loadToolWorkspace(user,tools){
 requireOwner(user);
 const workspace=await loadWorkspace(user),snap=await getDoc(doc(db,'users',user.uid)),data=snap.data()||{};
 const records=[];
 for(const tool of tools){
  if(tool.workspaceKind==='client-consultation'){
   for(const client of workspace.clients){const record=client.consultation;if(record)records.push({toolId:tool.id,clientId:client.id,clientName:client.name,revision:record.revision||1,updatedAtIso:record.updatedAtIso||'',status:record.status||'received'});}
   continue;
  }
  const matrices=data[tool.workspaceField]?.matrices||{};
  for(const [clientId,record] of Object.entries(matrices)){
   const client=workspace.clients.find(c=>c.id===clientId);
   records.push({toolId:tool.id,clientId,clientName:client?.name||record.clientName||'عميل محفوظ',revision:record.revision||1,updatedAtIso:record.updatedAtIso||'',status:record.status||'draft'});
  }
 }
 return {clients:workspace.clients,records:records.sort((a,b)=>b.updatedAtIso.localeCompare(a.updatedAtIso))};
}

export async function saveClientSurvey(user,clientId,payload,expectedRevision=0){
 requireOwner(user);
 return runTransaction(db,async tx=>{
  requireOwner(user);
  const ref=doc(db,'users',user.uid),snap=await tx.get(ref),data=snap.data()||{};
  const result=mergeClientSurvey(data,clientId,payload,expectedRevision,new Date().toISOString());
  tx.set(ref,{pricingClients_v1:result.pricingClients_v1,updatedAt:serverTimestamp()},{merge:true});
  return result.record;
 });
}
