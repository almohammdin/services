import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getAuth,setPersistence,browserLocalPersistence,GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const config={apiKey:'AIzaSyAAvC9y5jQ_7fAwmkCqBtgFDrBRF5t4uI0',authDomain:'mesraah-a2dfc.firebaseapp.com',projectId:'mesraah-a2dfc',storageBucket:'mesraah-a2dfc.firebasestorage.app',messagingSenderId:'986043593957',appId:'1:986043593957:web:b848313ef8cf83a5f3500c'};
const app=initializeApp(config);
export const auth=getAuth(app);
export const db=getFirestore(app);
export const authReady=setPersistence(auth,browserLocalPersistence);
export {onAuthStateChanged};

export async function signIn(){
  await authReady;
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  return (await signInWithPopup(auth,provider)).user;
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
  const collected=Math.min(amount,Math.max(0,Number(row?.collectedAmount)||0));
  const partnerPaid=Math.min(validCost?partnerCost:0,Math.max(0,Number(row?.partnerPaid)||0));
  return {amount,partnerCost:validCost?partnerCost:null,ownShare,collected,partnerPaid,remainingClient:amount-collected,remainingPartner:validCost?partnerCost-partnerPaid:null};
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
    map.set(key,{...old,...row,name,person:row.person||old.person||'',notes:row.notes||old.notes||''});
  }
  return [...map.values()];
}
export async function loadWorkspace(user){
  const snap=await getDoc(doc(db,'users',user.uid));
  const data=snap.exists()?snap.data():{};
  const deleted=new Set(data.pricingTool_v1?.deletedQuoteIds||[]);
  const quotes=(Array.isArray(data.pricingTool_v1?.quotes)?data.pricingTool_v1.quotes:[]).filter(q=>!deleted.has(quoteKey(q)));
  const stored=Array.isArray(data.pricingClients_v1?.clients)?data.pricingClients_v1.clients:[];
  const clients=distinctClients([...quotes.map(q=>({name:q.client})),...(stored.length?[]:localClients()),...stored]);
  if(clients.length!==stored.length||clients.some(c=>!stored.some(s=>clientKey(s.name)===clientKey(c.name)))){
    await setDoc(doc(db,'users',user.uid),{pricingClients_v1:{clients,updatedAtIso:new Date().toISOString()},updatedAt:serverTimestamp()},{merge:true});
  }
  return {quotes,clients,currentQuoteId:data.pricingTool_v1?.currentQuoteId||null};
}
export async function saveClient(user,client,knownClients=[]){
  const name=String(client.name||'').trim().replace(/\s+/g,' ');
  if(!name)throw new Error('اسم العميل مطلوب');
  const current=knownClients.length?knownClients:(await loadWorkspace(user)).clients;
  const key=clientKey(name);
  const old=current.find(c=>clientKey(c.name)===key)||{};
  const clients=distinctClients([...current.filter(c=>clientKey(c.name)!==key),{...old,...client,name}]);
  await setDoc(doc(db,'users',user.uid),{pricingClients_v1:{clients,updatedAtIso:new Date().toISOString()},updatedAt:serverTimestamp()},{merge:true});
  return clients;
}

export async function updateClient(user,originalName,changes){
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
      ...existing,name,person:String(changes.person||'').trim(),notes:String(changes.notes||'').trim()
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
