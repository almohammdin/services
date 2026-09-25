import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getAuth,setPersistence,browserLocalPersistence,GoogleAuthProvider,signInWithPopup,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

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
  const quotes=Array.isArray(data.pricingTool_v1?.quotes)?data.pricingTool_v1.quotes:[];
  const stored=Array.isArray(data.pricingClients_v1?.clients)?data.pricingClients_v1.clients:[];
  const clients=distinctClients([...quotes.map(q=>({name:q.client})),...localClients(),...stored]);
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
