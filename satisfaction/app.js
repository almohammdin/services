import {initializeApp,deleteApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth,setPersistence,browserLocalPersistence,GoogleAuthProvider,signInWithPopup,
  signInWithEmailAndPassword,createUserWithEmailAndPassword,onAuthStateChanged,
  signOut,sendPasswordResetEmail,deleteUser,signInAnonymously,inMemoryPersistence
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore,doc,getDoc,setDoc,collection,addDoc,updateDoc,getDocs,
  query,orderBy,limit,serverTimestamp,onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const firebaseConfig={
  apiKey:'AIzaSyAAvC9y5jQ_7fAwmkCqBtgFDrBRF5t4uI0',
  authDomain:'mesraah-a2dfc.firebaseapp.com',
  projectId:'mesraah-a2dfc',
  storageBucket:'mesraah-a2dfc.firebasestorage.app',
  messagingSenderId:'986043593957',
  appId:'1:986043593957:web:b848313ef8cf83a5f3500c'
};
const ADMIN_EMAIL='almohammdin@gmail.com';
const COMPANIES='satisfactionCompanies';
const USERS='satisfactionUsers';

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
await setPersistence(auth,browserLocalPersistence).catch(console.warn);

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
const label=score=>({5:'ممتاز',4:'جيد',3:'عادي',2:'غير جيد',1:'سيئ'})[Number(score)]||'';
const color=score=>({5:'#08a85d',4:'#6caf49',3:'#d8a737',2:'#db792d',1:'#b8443d'})[Number(score)]||'#66747f';

let currentPublicCompany=null;
let currentResponseRef=null;
let currentUser=null;
let currentProfile=null;
let dashboardRequested=new URLSearchParams(location.search).get('admin')==='1';
let companies=[];
let users=[];
let selectedCompanyId='';
let companyLogoDraft='';
let unsubscribeResponses=null;
let dashboardEntry=null;
let publicSession=null;

async function getPublicSession(){
  if(!publicSession){
    publicSession=(async()=>{
      const surveyApp=initializeApp(firebaseConfig,'satisfaction-public');
      try{
        const surveyAuth=getAuth(surveyApp);
        await setPersistence(surveyAuth,inMemoryPersistence);
        const credential=await signInAnonymously(surveyAuth);
        return {db:getFirestore(surveyApp),uid:credential.user.uid};
      }catch(error){
        await deleteApp(surveyApp).catch(()=>{});
        throw error;
      }
    })().catch(error=>{publicSession=null;throw error});
  }
  return publicSession;
}

function toast(message){
  const el=$('#toast');
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove('show'),1700);
}

function publicUrlFor(companyId){
  const url=new URL(location.href);
  url.search='';
  url.hash='';
  url.searchParams.set('c',companyId||'alsaadah');
  return url.toString();
}

function scoreFace(score){
  const paths={5:'M26 56c5 18 43 24 50 0',4:'M29 58c7 13 34 16 42 0',3:'M31 62h38',2:'M29 68c8-14 34-16 42 0',1:'M25 70c6-19 44-25 50 0'};
  return '<svg class="mini-face" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="'+color(score)+'"/><circle cx="35" cy="39" r="5" fill="#fff"/><circle cx="65" cy="39" r="5" fill="#fff"/><path d="'+paths[score]+'" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>';
}

function companyFallback(){
  return {id:'alsaadah',name:'شركة السعادة',location:'نقطة قياس تجريبية',question:'كيف كانت تجربتك اليوم؟',logoData:'',active:true,cloud:false};
}

function applyPublicCompany(company){
  currentPublicCompany=company;
  $('#orgName').textContent=company.name||'شركة السعادة';
  $('#locationName').textContent=company.location||'';
  $('#locationName').hidden=!company.location;
  $('#surveyQuestion').textContent=company.question||'كيف كانت تجربتك اليوم؟';
  if(company.logoData){
    $('#clientLogo').src=company.logoData;
    $('#clientLogoWrap').hidden=false;
  }else{
    $('#clientLogo').removeAttribute('src');
    $('#clientLogoWrap').hidden=true;
  }
  fitPublicViewport();
}

async function loadPublicCompany(){
  const slug=(new URLSearchParams(location.search).get('c')||'alsaadah').trim().toLowerCase();
  $('#publicStatus').textContent='';
  try{
    const snap=await getDoc(doc(db,COMPANIES,slug));
    if(snap.exists()){
      const data=snap.data()||{};
      if(data.active===false) throw new Error('inactive');
      applyPublicCompany({id:snap.id,...data,cloud:true});
      return;
    }
  }catch(error){
    console.warn('public company load',error);
  }
  applyPublicCompany(companyFallback());
  $('#publicStatus').textContent='هذه الجهة التجريبية تحتاج تهيئة من حساب الإدارة قبل حفظ التقييمات سحابيا.';
}

async function submitVote(score){
  if(!currentPublicCompany?.cloud){
    $('#publicStatus').textContent='يلزم تهيئة الجهة من حساب الإدارة أولا.';
    return;
  }
  $$('.face-btn').forEach(btn=>btn.disabled=true);
  $('#publicStatus').textContent='جارٍ تسجيل التقييم…';
  try{
    const surveySession=await getPublicSession();
    currentResponseRef=await addDoc(collection(surveySession.db,COMPANIES,currentPublicCompany.id,'responses'),{
      ownerUid:surveySession.uid,
      score:Number(score),
      note:'',
      createdAt:serverTimestamp(),
      clientCreatedAt:new Date().toISOString(),
      source:'web'
    });
    $('#publicStatus').textContent='';
    $('#surveyStep').hidden=true;
    $('#thanksStep').hidden=false;
    $('#noteInput').value='';
  }catch(error){
    console.error(error);
    $('#publicStatus').textContent='تعذر تسجيل التقييم الآن. حاول مرة ثانية.';
  }finally{
    $$('.face-btn').forEach(btn=>btn.disabled=false);
  }
}

$$('.face-btn').forEach(btn=>btn.addEventListener('click',()=>submitVote(btn.dataset.score)));

$('#saveNoteBtn').addEventListener('click',async()=>{
  if(!currentResponseRef){toast('تم حفظ التقييم');return}
  const note=$('#noteInput').value.trim();
  if(!note){toast('ما فيه ملاحظة للحفظ');return}
  try{
    await updateDoc(currentResponseRef,{note,noteUpdatedAt:serverTimestamp()});
    toast('تم حفظ الملاحظة');
  }catch(error){
    console.error(error);
    toast('تعذر حفظ الملاحظة');
  }
});

$('#newVoteBtn').addEventListener('click',()=>{
  currentResponseRef=null;
  $('#thanksStep').hidden=true;
  $('#surveyStep').hidden=false;
  $('#publicStatus').textContent='';
});

function openAuth(message=''){
  $('#authMessage').textContent=message;
  $('#authOverlay').hidden=false;
  setTimeout(()=>$('#loginEmail')?.focus(),40);
}
function closeAuth(){ $('#authOverlay').hidden=true; }
$('#authClose').addEventListener('click',closeAuth);
$('#authOverlay').addEventListener('click',e=>{if(e.target===$('#authOverlay'))closeAuth()});

$('#adminAccess').addEventListener('click',async()=>{
  dashboardRequested=true;
  if(auth.currentUser) await enterDashboard(auth.currentUser);
  else openAuth();
});

$('#googleLoginBtn').addEventListener('click',async()=>{
  dashboardRequested=true;
  $('#authMessage').textContent='';
  try{
    const provider=new GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    const credential=await signInWithPopup(auth,provider);
    await enterDashboard(credential.user);
  }catch(error){
    console.error(error);
    $('#authMessage').textContent=authError(error);
  }
});

$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  dashboardRequested=true;
  $('#authMessage').textContent='';
  const email=$('#loginEmail').value.trim();
  const password=$('#loginPassword').value;
  try{
    const credential=await signInWithEmailAndPassword(auth,email,password);
    await enterDashboard(credential.user);
  }catch(error){
    console.error(error);
    $('#authMessage').textContent=authError(error);
  }
});

function authError(error){
  const code=String(error?.code||'');
  if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found')) return 'بيانات الدخول غير صحيحة.';
  if(code.includes('too-many-requests')) return 'محاولات كثيرة. جرّب بعد قليل.';
  if(code.includes('popup-closed')) return 'تم إغلاق نافذة الدخول.';
  if(code.includes('popup-blocked')) return 'المتصفح منع نافذة الدخول. اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مجددًا.';
  if(code.includes('unauthorized-domain')) return 'عنوان المنصة غير مضاف إلى النطاقات المعتمدة لتسجيل الدخول. تواصل مع إدارة المنصة.';
  if(code.includes('network-request-failed')) return 'تعذر الاتصال بخدمة الدخول. تحقق من اتصال الإنترنت ثم حاول مجددًا.';
  if(code.includes('user-disabled')) return 'هذا الحساب موقوف. تواصل مع إدارة المنصة.';
  if(code.includes('operation-not-allowed')) return 'طريقة الدخول غير مفعلة في Firebase.';
  if(code.includes('permission-denied')) return 'الصلاحية غير متاحة لهذا الحساب.';
  return 'تعذر تسجيل الدخول.';
}

async function resolveProfile(user){
  const email=(user.email||'').toLowerCase();
  if(email===ADMIN_EMAIL&&user.emailVerified){
    return {uid:user.uid,email:user.email||ADMIN_EMAIL,name:user.displayName||'نايف',role:'admin',active:true};
  }
  const snap=await getDoc(doc(db,USERS,user.uid));
  if(!snap.exists()) throw new Error('not-authorized');
  const profile={uid:user.uid,...snap.data()};
  if(profile.active===false||profile.role!=='company'||!profile.companyId) throw new Error('not-authorized');
  return profile;
}

async function ensureDemoCompany(){
  const ref=doc(db,COMPANIES,'alsaadah');
  const snap=await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref,{
      name:'شركة السعادة',
      slug:'alsaadah',
      location:'الفرع الرئيسي',
      question:'كيف كانت تجربتك اليوم؟',
      logoData:'',
      active:true,
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
  }
}

function enterDashboard(user){
  if(dashboardEntry) return dashboardEntry;
  dashboardEntry=loadAuthenticatedDashboard(user).finally(()=>{dashboardEntry=null});
  return dashboardEntry;
}

async function loadAuthenticatedDashboard(user){
  try{
    currentUser=user;
    currentProfile=await resolveProfile(user);
    if(currentProfile.role==='admin') await ensureDemoCompany();
    await loadDashboardData();
    showDashboard();
    closeAuth();
  }catch(error){
    console.error(error);
    currentProfile=null;
    const code=String(error?.code||error?.message||'');
    if(code.includes('permission-denied')){
      openAuth('تم التحقق من حسابك، لكن إعدادات صلاحيات قاعدة البيانات تمنع فتح لوحة المنصة. يلزم أن يراجع المسؤول صلاحيات منصة الرضا.');
      return;
    }
    if(code==='company-missing'){
      openAuth('تم التحقق من حسابك، لكن الشركة المرتبطة به غير موجودة. تواصل مع إدارة المنصة.');
      return;
    }
    if(code==='not-authorized'){
      await signOut(auth).catch(()=>{});
      openAuth('هذا الحساب غير مضاف ضمن مستخدمي المنصة أو تم إيقافه. اختر الحساب الصحيح أو تواصل مع الإدارة.');
      return;
    }
    openAuth('تعذر تحميل لوحة المنصة. تحقق من اتصال الإنترنت ثم حاول الدخول مجددًا.');
  }
}

function showDashboard(){
  document.body.classList.remove('public-mode');
  const shell=$('.survey-shell'); if(shell) shell.style.transform='none';
  $('#publicView').hidden=true;
  $('#dashboardView').hidden=false;
  $('#platformHead').hidden=true;
  const isAdmin=currentProfile?.role==='admin';
  $$('[data-admin-only]').forEach(el=>el.hidden=!isAdmin);
  $('#companySelectWrap').hidden=!isAdmin;
  $('#sessionLabel').textContent=isAdmin?'الإدارة العامة':(companies.find(c=>c.id===currentProfile.companyId)?.name||'لوحة الشركة');
  activateTab('results');
  window.scrollTo({top:0,behavior:'smooth'});
}

function showPublic(){
  document.body.classList.add('public-mode');
  $('#dashboardView').hidden=true;
  $('#publicView').hidden=false;
  $('#platformHead').hidden=false;
  dashboardRequested=false;
  loadPublicCompany();
  requestAnimationFrame(fitPublicViewport);
  window.scrollTo({top:0,behavior:'smooth'});
}

$('#logoutBtn').addEventListener('click',async()=>{
  await signOut(auth);
  currentUser=null;currentProfile=null;
  showPublic();
  toast('تم تسجيل الخروج');
});

$('#openPublicBtn').addEventListener('click',()=>{
  const id=selectedCompanyId||currentProfile?.companyId||'alsaadah';
  window.open(publicUrlFor(id),'_blank','noopener');
});

async function loadDashboardData(){
  if(currentProfile.role==='admin'){
    await Promise.all([loadCompanies(),loadUsers()]);
    if(!selectedCompanyId||!companies.some(c=>c.id===selectedCompanyId)) selectedCompanyId=companies[0]?.id||'alsaadah';
  }else{
    const snap=await getDoc(doc(db,COMPANIES,currentProfile.companyId));
    if(!snap.exists()) throw new Error('company-missing');
    if(snap.data().active===false) throw new Error('not-authorized');
    companies=[{id:snap.id,...snap.data()}];
    selectedCompanyId=currentProfile.companyId;
  }
  renderCompanyOptions();
  renderCompanies();
  renderUsers();
  selectCompany(selectedCompanyId);
}

async function loadCompanies(){
  const snap=await getDocs(collection(db,COMPANIES));
  companies=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ar'));
}

async function loadUsers(){
  if(currentProfile.role!=='admin'){users=[];return}
  const snap=await getDocs(collection(db,USERS));
  users=snap.docs.map(d=>({uid:d.id,...d.data()})).filter(u=>u.role==='company').sort((a,b)=>String(a.name||a.email||'').localeCompare(String(b.name||b.email||''),'ar'));
}

function renderCompanyOptions(){
  const opts=companies.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name||c.id)+'</option>').join('');
  $('#companySelect').innerHTML=opts;
  $('#userCompany').innerHTML=opts;
  if(selectedCompanyId) $('#companySelect').value=selectedCompanyId;
}

$('#companySelect').addEventListener('change',()=>selectCompany($('#companySelect').value));

function selectCompany(companyId){
  selectedCompanyId=companyId;
  const company=companies.find(c=>c.id===companyId);
  if(!company) return;
  $('#dashCompanyName').textContent=company.name||company.id;
  $('#companySelect').value=companyId;
  renderPublicLink(companyId);
  subscribeResponses(companyId);
}

function renderPublicLink(companyId){
  const url=publicUrlFor(companyId);
  $('#publicUrl').textContent=url;
  $('#qr').innerHTML='';
  if(window.QRCode) new QRCode($('#qr'),{text:url,width:166,height:166,colorDark:'#06346e',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
}

$('#copyUrlBtn').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(publicUrlFor(selectedCompanyId));toast('تم نسخ الرابط')}
  catch{toast('تعذر النسخ التلقائي')}
});
$('#openLinkBtn').addEventListener('click',()=>window.open(publicUrlFor(selectedCompanyId),'_blank','noopener'));

function subscribeResponses(companyId){
  if(unsubscribeResponses){unsubscribeResponses();unsubscribeResponses=null}
  const q=query(collection(db,COMPANIES,companyId,'responses'),orderBy('createdAt','desc'),limit(1000));
  unsubscribeResponses=onSnapshot(q,snap=>{
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderAnalytics(rows);
  },error=>{
    console.error(error);
    renderAnalytics([]);
    toast('تعذر قراءة النتائج');
  });
}

function responseDate(row){
  if(row.createdAt?.toDate) return row.createdAt.toDate();
  if(row.clientCreatedAt) return new Date(row.clientCreatedAt);
  return new Date(0);
}

function renderAnalytics(rows){
  const counts={1:0,2:0,3:0,4:0,5:0};
  rows.forEach(r=>{if(counts[r.score]!==undefined)counts[r.score]++});
  const total=rows.length;
  const sum=rows.reduce((a,r)=>a+(Number(r.score)||0),0);
  const sat=total?((counts[4]+counts[5])/total*100):0;
  const avg=total?(sum/total):0;
  const startToday=new Date();startToday.setHours(0,0,0,0);
  const today=rows.filter(r=>responseDate(r)>=startToday).length;

  $('#kpiTotal').textContent=total.toLocaleString('en-US');
  $('#kpiSat').textContent=sat.toFixed(0)+'%';
  $('#kpiAvg').textContent=avg.toFixed(1);
  $('#kpiToday').textContent=today.toLocaleString('en-US');

  const max=Math.max(1,...Object.values(counts));
  $('#distribution').innerHTML=[5,4,3,2,1].map(s=>'<div class="dist-row"><div class="dist-label">'+scoreFace(s)+'<span>'+label(s)+'</span></div><div class="track"><div class="fill" style="width:'+((counts[s]/max)*100).toFixed(1)+'%;background:'+color(s)+'"></div></div><div class="count">'+counts[s].toLocaleString('en-US')+'</div></div>').join('');

  const days=[];
  const dayNames=['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);
    const next=new Date(d);next.setDate(next.getDate()+1);
    days.push({date:d,count:rows.filter(r=>{const x=responseDate(r);return x>=d&&x<next}).length});
  }
  const dmax=Math.max(1,...days.map(x=>x.count));
  $('#dailyChart').innerHTML=days.map(x=>'<div class="day"><div class="day-bar" style="height:'+Math.max(6,x.count/dmax*130)+'px"></div><b>'+x.count+'</b><span>'+dayNames[x.date.getDay()]+'</span></div>').join('');

  $('#responsesTable').innerHTML=rows.slice(0,30).map(r=>{
    const d=responseDate(r);
    const dateText=d.getTime()?d.toLocaleString('ar-SA',{dateStyle:'short',timeStyle:'short'}):'—';
    return '<tr><td><span class="score-dot" style="background:'+color(r.score)+'">'+esc(r.score)+'</span></td><td>'+esc(label(r.score))+'</td><td>'+esc(dateText)+'</td><td>'+esc(r.note||'—')+'</td></tr>';
  }).join('')||'<tr><td colspan="4" class="empty-row">لا توجد تقييمات بعد</td></tr>';
}

function activateTab(name){
  $$('.dash-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  $$('.dash-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===name));
}
$$('.dash-tabs button').forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.hidden)return;
  activateTab(btn.dataset.tab);
}));

function renderCompanies(){
  if(currentProfile?.role!=='admin') return;
  $('#companiesList').innerHTML=companies.map(c=>'<article class="company-row">'+
    '<div class="company-row-logo">'+(c.logoData?'<img src="'+esc(c.logoData)+'" alt="">':'بدون شعار')+'</div>'+
    '<div><strong>'+esc(c.name||c.id)+'</strong><small>'+esc(c.id)+'</small></div>'+
    '<div class="row-actions"><button class="mini-btn" data-company-results="'+esc(c.id)+'" type="button">النتائج</button><button class="mini-btn" data-company-edit="'+esc(c.id)+'" type="button">تعديل</button></div>'+
  '</article>').join('')||'<div class="empty-row">لا توجد شركات</div>';

  $$('[data-company-results]').forEach(btn=>btn.addEventListener('click',()=>{selectedCompanyId=btn.dataset.companyResults;selectCompany(selectedCompanyId);activateTab('results')}));
  $$('[data-company-edit]').forEach(btn=>btn.addEventListener('click',()=>editCompany(btn.dataset.companyEdit)));
}

function resetCompanyForm(){
  $('#companyForm').reset();
  $('#companyEditingId').value='';
  $('#companyFormTitle').textContent='إضافة شركة';
  $('#companySlug').readOnly=false;
  $('#companyQuestion').value='كيف كانت تجربتك اليوم؟';
  $('#companyActive').checked=true;
  companyLogoDraft='';
  $('#companyLogoPreview').hidden=true;
  $('#companyLogoPreview img').removeAttribute('src');
  $('#cancelCompanyEdit').hidden=true;
}
$('#newCompanyBtn').addEventListener('click',()=>{resetCompanyForm();activateTab('companies');$('#companyName').focus()});
$('#cancelCompanyEdit').addEventListener('click',resetCompanyForm);

function editCompany(id){
  const c=companies.find(x=>x.id===id);if(!c)return;
  $('#companyEditingId').value=id;
  $('#companyFormTitle').textContent='تعديل '+(c.name||id);
  $('#companyName').value=c.name||'';
  $('#companySlug').value=id;
  $('#companySlug').readOnly=true;
  $('#companyLocation').value=c.location||'';
  $('#companyQuestion').value=c.question||'كيف كانت تجربتك اليوم؟';
  $('#companyActive').checked=c.active!==false;
  companyLogoDraft=c.logoData||'';
  if(companyLogoDraft){$('#companyLogoPreview img').src=companyLogoDraft;$('#companyLogoPreview').hidden=false}else $('#companyLogoPreview').hidden=true;
  $('#cancelCompanyEdit').hidden=false;
  activateTab('companies');
  window.scrollTo({top:0,behavior:'smooth'});
}

function cleanSlug(v){
  return String(v||'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9_-]/g,'').replace(/-+/g,'-');
}
$('#companySlug').addEventListener('input',e=>{if(!e.target.readOnly)e.target.value=cleanSlug(e.target.value)});

async function imageToData(file){
  if(!file)return '';
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url});
    const max=720,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/webp',.86);
  }finally{URL.revokeObjectURL(url)}
}

$('#companyLogoFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    companyLogoDraft=await imageToData(file);
    $('#companyLogoPreview img').src=companyLogoDraft;
    $('#companyLogoPreview').hidden=false;
  }catch(error){console.error(error);toast('تعذر قراءة الشعار')}
});

$('#companyForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(currentProfile?.role!=='admin')return;
  const editing=$('#companyEditingId').value;
  const slug=editing||cleanSlug($('#companySlug').value);
  if(slug.length<3){toast('اسم الرابط يحتاج 3 أحرف على الأقل');return}
  try{
    if(!editing){
      const existing=await getDoc(doc(db,COMPANIES,slug));
      if(existing.exists()){toast('اسم الرابط مستخدم');return}
    }
    const old=companies.find(c=>c.id===slug);
    await setDoc(doc(db,COMPANIES,slug),{
      name:$('#companyName').value.trim(),
      slug,
      location:$('#companyLocation').value.trim(),
      question:$('#companyQuestion').value.trim()||'كيف كانت تجربتك اليوم؟',
      logoData:companyLogoDraft||old?.logoData||'',
      active:$('#companyActive').checked,
      updatedAt:serverTimestamp(),
      ...(editing?{}:{createdAt:serverTimestamp()})
    },{merge:true});
    toast('تم حفظ الشركة');
    await loadCompanies();
    renderCompanyOptions();
    renderCompanies();
    resetCompanyForm();
    selectedCompanyId=slug;
    selectCompany(slug);
  }catch(error){console.error(error);toast('تعذر حفظ الشركة')}
});

function renderUsers(){
  if(currentProfile?.role!=='admin')return;
  const companyName=id=>companies.find(c=>c.id===id)?.name||id||'—';
  $('#usersTable').innerHTML=users.map(u=>'<tr>'+
    '<td><strong>'+esc(u.name||'')+'</strong><br><small dir="ltr">'+esc(u.email||'')+'</small></td>'+
    '<td>'+esc(companyName(u.companyId))+'</td>'+
    '<td><span class="state-pill '+(u.active===false?'off':'')+'">'+(u.active===false?'موقوف':'فعال')+'</span></td>'+
    '<td><div class="row-actions"><button class="mini-btn" type="button" data-user-toggle="'+esc(u.uid)+'">'+(u.active===false?'تفعيل':'إيقاف')+'</button><button class="mini-btn" type="button" data-user-reset="'+esc(u.email||'')+'">إعادة كلمة المرور</button></div></td>'+
  '</tr>').join('')||'<tr><td colspan="4" class="empty-row">لا توجد حسابات شركات بعد</td></tr>';

  $$('[data-user-toggle]').forEach(btn=>btn.addEventListener('click',()=>toggleUser(btn.dataset.userToggle)));
  $$('[data-user-reset]').forEach(btn=>btn.addEventListener('click',()=>resetUserPassword(btn.dataset.userReset)));
}

$('#userForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(currentProfile?.role!=='admin')return;
  const name=$('#userName').value.trim(),email=$('#userEmail').value.trim().toLowerCase(),password=$('#userPassword').value,companyId=$('#userCompany').value;
  if(!companyId){toast('اختر الشركة');return}
  const secondaryName='sat-user-'+Date.now();
  let secondaryApp,created;
  try{
    secondaryApp=initializeApp(firebaseConfig,secondaryName);
    const secondaryAuth=getAuth(secondaryApp);
    const cred=await createUserWithEmailAndPassword(secondaryAuth,email,password);
    created=cred.user;
    await setDoc(doc(db,USERS,created.uid),{
      name,email,companyId,role:'company',active:true,
      createdAt:serverTimestamp(),createdBy:currentUser.uid,updatedAt:serverTimestamp()
    });
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    $('#userForm').reset();
    renderCompanyOptions();
    await loadUsers();
    renderUsers();
    toast('تم إنشاء حساب المستخدم');
  }catch(error){
    console.error(error);
    if(created){try{await deleteUser(created)}catch{}}
    if(secondaryApp){try{await deleteApp(secondaryApp)}catch{}}
    if(String(error?.code||'').includes('email-already-in-use')) toast('البريد مستخدم في Firebase من قبل');
    else if(String(error?.code||'').includes('weak-password')) toast('كلمة المرور قصيرة');
    else toast('تعذر إنشاء المستخدم');
  }
});

async function toggleUser(uid){
  const u=users.find(x=>x.uid===uid);if(!u)return;
  try{
    await updateDoc(doc(db,USERS,uid),{active:u.active===false,updatedAt:serverTimestamp()});
    await loadUsers();renderUsers();toast(u.active===false?'تم تفعيل الحساب':'تم إيقاف الحساب');
  }catch(error){console.error(error);toast('تعذر تعديل الحساب')}
}

async function resetUserPassword(email){
  if(!email)return;
  try{await sendPasswordResetEmail(auth,email);toast('تم إرسال رابط إعادة كلمة المرور')}
  catch(error){console.error(error);toast('تعذر إرسال الرابط')}
}

onAuthStateChanged(auth,async user=>{
  currentUser=user||null;
  if(user&&dashboardRequested) await enterDashboard(user);
  if(!user&&$('#dashboardView').hidden===false) showPublic();
});

if(dashboardRequested){
  if(auth.currentUser) enterDashboard(auth.currentUser);
  else openAuth();
}

loadPublicCompany();


function fitPublicViewport(){
  if(!document.body.classList.contains('public-mode')) return;
  const view=$('#publicView'),shell=$('.survey-shell');
  if(!view||!shell||view.hidden) return;
  shell.style.transform='none';
  requestAnimationFrame(()=>{
    const style=getComputedStyle(view);
    const available=Math.max(1,view.clientHeight-(parseFloat(style.paddingTop)||0)-(parseFloat(style.paddingBottom)||0));
    const natural=shell.getBoundingClientRect().height;
    const scale=Math.min(1,available/natural);
    shell.style.transform=scale<.999?'scale('+Math.max(.72,scale)+')':'none';
  });
}
window.addEventListener('resize',()=>requestAnimationFrame(fitPublicViewport));
window.addEventListener('orientationchange',()=>setTimeout(fitPublicViewport,80));
if(!dashboardRequested){
  document.body.classList.add('public-mode');
  requestAnimationFrame(fitPublicViewport);
}
