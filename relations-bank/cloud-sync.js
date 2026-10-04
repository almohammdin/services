(() => {
  'use strict';

  const STORAGE_KEY = 'relations_bank_v1_20261004';
  const CIRCLE_KEY = 'relations_bank_circle_v1';
  const PENDING_INVITE_KEY = 'relations_bank_pending_invite_v1';
  const SUPABASE_URL = 'https://iyqtrbpamoslemjdsqcg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_yiknaa_5w5jPszTw_oxrZw_kgBHNCyX';

  if (!window.supabase?.createClient) {
    console.warn('Relations Bank cloud: Supabase client unavailable');
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  let currentUser = null;
  let currentCircle = null;
  let cloudReady = false;
  let internalWrite = false;
  let syncTimer = null;
  const owners = { people: new Map(), knowledge: new Map(), introductions: new Map() };
  const nativeSetItem = Storage.prototype.setItem;

  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const isUuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));

  function injectStyles(){
    const style = document.createElement('style');
    style.textContent = `
      .cloud-btn,.cloud-select{border:1px solid rgba(13,54,86,.13);background:#fff;color:#0D3656;border-radius:11px;min-height:38px;padding:7px 11px;font:800 12px Craft,Tahoma,Arial,sans-serif}
      .cloud-btn{cursor:pointer}.cloud-btn.primary{background:#0D3656;color:#fff;border-color:#0D3656}.cloud-btn.ok{background:#EAF3EE;color:#165A3D;border-color:#CFE2D6}
      .cloud-select{max-width:190px}.cloud-overlay{position:fixed;inset:0;z-index:140;background:rgba(5,22,34,.62);backdrop-filter:blur(5px);display:grid;place-items:center;padding:18px}
      .cloud-overlay[hidden]{display:none}.cloud-card{width:min(520px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#FFFEFC;border:1px solid #E3DED6;border-radius:24px;box-shadow:0 28px 80px rgba(0,0,0,.28);padding:22px}
      .cloud-card h2{margin:4px 0 6px;color:#0D3656;font-size:24px}.cloud-card p{margin:0 0 16px;color:#5E6C76;font-size:13px}.cloud-close{float:left;border:0;background:#EEF3F6;color:#0D3656;width:36px;height:36px;border-radius:10px;font-size:22px;cursor:pointer}
      .cloud-form{display:grid;gap:11px}.cloud-form label span{display:block;color:#5E6C76;font-size:11px;font-weight:800;margin-bottom:5px}.cloud-form input{width:100%;border:1px solid #E3DED6;border-radius:12px;padding:11px 12px;font:inherit;background:#fff}
      .cloud-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:5px}.cloud-actions button{flex:1}.cloud-msg{min-height:20px;color:#8A5B27;font-size:12px;margin-top:9px}
      .cloud-section{padding:13px;border-radius:15px;background:#F8F6F2;margin-top:12px}.cloud-section strong{display:block;color:#0D3656;font-size:13px;margin-bottom:6px}.invite-row{display:flex;gap:7px}.invite-code{direction:ltr;flex:1;border:1px dashed #C9853C;border-radius:10px;padding:9px;background:#fff;font:800 13px Arial;text-align:center;letter-spacing:.08em}
      @media(max-width:680px){.cloud-select{max-width:120px}.cloud-btn{padding:7px 9px}.top-actions{gap:5px}.circle-pill{display:none}}
    `;
    document.head.appendChild(style);
  }

  function buildUi(){
    injectStyles();
    const top = document.querySelector('.top-actions');
    const circlePill = document.querySelector('.circle-pill');
    if (circlePill) circlePill.id = 'cloudCirclePill';

    if (top) {
      const select = document.createElement('select');
      select.id = 'cloudCircleSelect';
      select.className = 'cloud-select';
      select.hidden = true;

      const manage = document.createElement('button');
      manage.id = 'cloudManageBtn';
      manage.className = 'cloud-btn';
      manage.type = 'button';
      manage.textContent = 'الدائرة';
      manage.hidden = true;

      const auth = document.createElement('button');
      auth.id = 'cloudAuthBtn';
      auth.className = 'cloud-btn primary';
      auth.type = 'button';
      auth.textContent = 'دخول';

      const reset = document.getElementById('resetDemoBtn');
      top.insertBefore(select, reset || null);
      top.insertBefore(manage, reset || null);
      top.insertBefore(auth, reset || null);
    }

    const overlay = document.createElement('div');
    overlay.id = 'cloudOverlay';
    overlay.className = 'cloud-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="cloud-card" role="dialog" aria-modal="true" aria-labelledby="cloudTitle">
        <button class="cloud-close" id="cloudCloseBtn" type="button">×</button>
        <div id="cloudAuthPane">
          <span style="color:#C9853C;font-size:12px;font-weight:900">الحساب السحابي</span>
          <h2 id="cloudTitle">دخول بنك العلاقات والفرص</h2>
          <p>الحساب يفصل بياناتك الخاصة عن بقية الدائرة، ويطبق الصلاحيات على مستوى كل معلومة.</p>
          <form id="cloudAuthForm" class="cloud-form">
            <label><span>البريد الإلكتروني</span><input name="email" type="email" autocomplete="email" required></label>
            <label><span>كلمة المرور</span><input name="password" type="password" autocomplete="current-password" minlength="8" required></label>
            <div class="cloud-actions">
              <button class="cloud-btn primary" type="submit">دخول</button>
              <button class="cloud-btn" id="cloudSignupBtn" type="button">إنشاء حساب</button>
            </div>
          </form>
          <div class="cloud-msg" id="cloudAuthMsg"></div><div class="cloud-section"><strong>الدخول للمنصة بالدعوة</strong><span style="font-size:11px;color:#6b7880">إنشاء الحساب وحده لا يمنح عضوية. العضو ينضم عبر رابط أو كود دعوة من دائرة قائمة.</span></div>
        </div>
        <div id="cloudManagePane" hidden>
          <span style="color:#C9853C;font-size:12px;font-weight:900">إدارة الدائرة</span>
          <h2>الحساب والدائرة</h2>
          <p id="cloudUserLabel"></p>
          <div class="cloud-section">
            <strong>كود دعوة الدائرة الحالية</strong>
            <div class="invite-row"><div class="invite-code" id="cloudInviteCode">—</div><button class="cloud-btn" id="cloudCopyInvite" type="button">نسخ</button></div>
          </div>
          <div class="cloud-section">
            <strong>الانضمام إلى دائرة</strong>
            <div class="invite-row"><input id="cloudJoinCode" class="invite-code" maxlength="12" placeholder="12 characters"><button class="cloud-btn primary" id="cloudJoinBtn" type="button">انضمام</button></div>
          </div>
          <div class="cloud-section">
            <strong>إنشاء دائرة جديدة</strong>
            <div class="invite-row"><input id="cloudNewCircleName" style="flex:1;border:1px solid #E3DED6;border-radius:10px;padding:9px" placeholder="اسم الدائرة"><button class="cloud-btn" id="cloudCreateCircleBtn" type="button">إنشاء</button></div>
          </div>
          <div class="cloud-actions"><button class="cloud-btn" id="cloudRefreshBtn" type="button">تحديث البيانات</button><button class="cloud-btn" id="cloudLogoutBtn" type="button">تسجيل الخروج</button></div>
          <div class="cloud-msg" id="cloudManageMsg"></div>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    document.getElementById('cloudAuthBtn')?.addEventListener('click', () => openCloud(currentUser ? 'manage' : 'auth'));
    document.getElementById('cloudManageBtn')?.addEventListener('click', () => openCloud('manage'));
    document.getElementById('cloudCloseBtn')?.addEventListener('click', closeCloud);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeCloud(); });

    document.getElementById('cloudAuthForm')?.addEventListener('submit', signIn);
    document.getElementById('cloudSignupBtn')?.addEventListener('click', signUp);
    document.getElementById('cloudLogoutBtn')?.addEventListener('click', async () => { await db.auth.signOut(); closeCloud(); location.reload(); });
    document.getElementById('cloudRefreshBtn')?.addEventListener('click', async () => { await hydrateFromCloud(true); });
    document.getElementById('cloudCopyInvite')?.addEventListener('click', copyInvite);
    document.getElementById('cloudJoinBtn')?.addEventListener('click', joinCircle);
    document.getElementById('cloudCreateCircleBtn')?.addEventListener('click', createCircleFromUi);
    document.getElementById('cloudCircleSelect')?.addEventListener('change', async e => {
      localStorage.setItem(CIRCLE_KEY, e.target.value);
      await selectCircle(e.target.value, true);
    });
  }

  function openCloud(mode){
    const overlay = document.getElementById('cloudOverlay');
    if (!overlay) return;
    overlay.hidden = false;
    document.getElementById('cloudAuthPane').hidden = mode !== 'auth';
    document.getElementById('cloudManagePane').hidden = mode !== 'manage';
    if (mode === 'manage') refreshManagePane();
  }
  function closeCloud(){ const o=document.getElementById('cloudOverlay'); if(o)o.hidden=true; }

  function setMsg(id, msg){ const el=document.getElementById(id); if(el)el.textContent=msg||''; }

  async function signIn(e){
    e.preventDefault();
    setMsg('cloudAuthMsg','جارٍ التحقق...');
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email')||'').trim();
    const password = String(fd.get('password')||'');
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) { setMsg('cloudAuthMsg', authMessage(error)); return; }
    setMsg('cloudAuthMsg','تم الدخول.');
    closeCloud();
  }

  async function signUp(){
    const form = document.getElementById('cloudAuthForm');
    const fd = new FormData(form);
    const email = String(fd.get('email')||'').trim();
    const password = String(fd.get('password')||'');
    if (!email || password.length < 8) { setMsg('cloudAuthMsg','أدخل بريدًا صحيحًا وكلمة مرور من 8 أحرف على الأقل.'); return; }
    setMsg('cloudAuthMsg','جارٍ إنشاء الحساب...');
    const { data, error } = await db.auth.signUp({
      email, password,
      options: { emailRedirectTo: location.origin + location.pathname }
    });
    if (error) { setMsg('cloudAuthMsg', authMessage(error)); return; }
    if (data?.session) {
      setMsg('cloudAuthMsg','تم إنشاء الحساب والدخول.');
      closeCloud();
    } else {
      setMsg('cloudAuthMsg','تم إنشاء الحساب. تحقق من رسالة البريد لتأكيده ثم ارجع وسجل الدخول.');
    }
  }

  function authMessage(error){
    const m=String(error?.message||'').toLowerCase();
    if(m.includes('invalid login')) return 'بيانات الدخول غير صحيحة.';
    if(m.includes('email not confirmed')) return 'الحساب يحتاج تأكيد البريد أولا.';
    if(m.includes('already registered')) return 'البريد مسجل مسبقا. استخدم تسجيل الدخول.';
    return 'تعذر إكمال العملية الآن.';
  }

  function updateChrome(){
    const auth = document.getElementById('cloudAuthBtn');
    const manage = document.getElementById('cloudManageBtn');
    const select = document.getElementById('cloudCircleSelect');
    const pill = document.getElementById('cloudCirclePill');
    const reset = document.getElementById('resetDemoBtn');

    if (!currentUser) {
      if(auth){auth.textContent='دخول';auth.className='cloud-btn primary';}
      if(manage) manage.hidden=true;
      if(select) select.hidden=true;
      if(pill) pill.textContent='تجربة محلية';
      if(reset) reset.hidden=false;
      return;
    }

    if(currentUser && !currentCircle){
      if(auth){auth.textContent='بانتظار دعوة';auth.className='cloud-btn';}
      if(manage) manage.hidden=false;
      if(select) select.hidden=true;
      if(pill) pill.textContent='الدخول بالدعوة فقط';
      if(reset) reset.hidden=true;
      return;
    }

    if(auth){auth.textContent='سحابي ✓';auth.className='cloud-btn ok';}
    if(manage) manage.hidden=false;
    if(select) select.hidden=false;
    if(pill) pill.textContent=currentCircle?.name || 'حساب سحابي';
    if(reset) reset.hidden=true;

    document.querySelectorAll('.demo-badge').forEach(el => el.textContent='بيانات الدائرة');
    const meta=document.querySelector('.footer-meta');
    if(meta) meta.textContent='حفظ سحابي بصلاحيات حسب المستخدم والدائرة.';
  }

  async function ensureCircle(){
    const { data: memberships, error: memberError } = await db.from('rb_circle_members').select('circle_id,role').eq('user_id',currentUser.id);
    if (memberError) throw memberError;

    let ids = (memberships||[]).map(x=>x.circle_id);
    if (!ids.length) {
      let platformOwner = false;
      const { data: ownerRow } = await db.from('rb_platform_bootstrap').select('owner_user_id').eq('id',1).maybeSingle();
      if(ownerRow?.owner_user_id === currentUser.id) platformOwner = true;

      if(!platformOwner){
        const { error: bootstrapError } = await db.from('rb_platform_bootstrap').insert({id:1,owner_user_id:currentUser.id});
        if(!bootstrapError) platformOwner = true;
      }

      if(platformOwner){
        const {data:existingOwned}=await db.from('rb_circles').select('id').eq('created_by',currentUser.id).eq('active',true).order('created_at').limit(1);
        let circleId=existingOwned?.[0]?.id||'';
        if(!circleId){
          const { data: circle, error } = await db.from('rb_circles').insert({ name:'دائرة المؤسسين', created_by:currentUser.id }).select('id,name,invite_code,created_by').single();
          if (error) throw error;
          circleId=circle.id;
        }
        const { error: addError } = await db.from('rb_circle_members').upsert({ circle_id:circleId, user_id:currentUser.id, role:'owner' },{onConflict:'circle_id,user_id'});
        if (addError) throw addError;
        ids=[circleId];
      }else{
        currentCircle=null;
        const select=document.getElementById('cloudCircleSelect');
        if(select)select.hidden=true;
        updateChrome();
        setMsg('cloudManageMsg','هذا الحساب غير مرتبط بدائرة. افتح رابط الدعوة أو أدخل كود الدعوة.');
        return false;
      }
    }

    const { data: circles, error: circleError } = await db.from('rb_circles').select('id,name,invite_code,created_by,active').in('id',ids).eq('active',true).order('created_at');
    if (circleError) throw circleError;
    if (!circles?.length) return false;

    const select=document.getElementById('cloudCircleSelect');
    if(select){
      select.innerHTML=circles.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    }

    const wanted = localStorage.getItem(CIRCLE_KEY);
    const chosen = circles.find(c=>c.id===wanted) || circles[0];
    currentCircle=chosen;
    nativeSetItem.call(localStorage,CIRCLE_KEY,chosen.id);
    if(select)select.value=chosen.id;
    updateChrome();
    return true;
  }

  async function selectCircle(id, reload){
    const { data, error }=await db.from('rb_circles').select('id,name,invite_code,created_by,active').eq('id',id).single();
    if(error) throw error;
    currentCircle=data;
    nativeSetItem.call(localStorage,CIRCLE_KEY,id);
    updateChrome();
    await hydrateFromCloud(reload);
  }

  async function loadRemoteState(){
    const circleId=currentCircle.id;
    const [peopleRes, knowledgeRes, introRes]=await Promise.all([
      db.from('rb_people').select('*').eq('circle_id',circleId).order('created_at',{ascending:false}),
      db.from('rb_knowledge').select('*').eq('circle_id',circleId).order('created_at',{ascending:false}),
      db.from('rb_introductions').select('*').eq('circle_id',circleId).order('created_at',{ascending:false})
    ]);
    if(peopleRes.error) throw peopleRes.error;
    if(knowledgeRes.error) throw knowledgeRes.error;
    if(introRes.error) throw introRes.error;

    owners.people.clear(); owners.knowledge.clear(); owners.introductions.clear();

    const people=(peopleRes.data||[]).map(p=>{
      owners.people.set(p.id,p.created_by);
      return {id:p.id,name:p.name,company:p.company,role:p.role_title,city:p.city,sector:p.field,owner:p.relationship_owner,strength:p.relationship_strength,scope:p.scope,note:p.notes,createdBy:p.created_by};
    });
    const knowledge=(knowledgeRes.data||[]).map(k=>{
      owners.knowledge.set(k.id,k.created_by);
      return {id:k.id,personId:k.person_id,type:k.type,title:k.title,details:k.details,tags:k.tags||[],city:k.city,scope:k.scope,source:k.source,createdAt:k.created_at,reviewAt:k.review_at,createdBy:k.created_by};
    });
    const introductions=(introRes.data||[]).map(i=>{
      owners.introductions.set(i.id,i.created_by);
      const opp=(i.need_knowledge_id&&i.offer_knowledge_id)?`${i.need_knowledge_id}__${i.offer_knowledge_id}`:'';
      return {id:i.id,opportunityId:opp,title:i.title,status:i.status,createdAt:i.created_at,note:i.next_action||i.outcome||'',createdBy:i.created_by};
    });
    return {people,knowledge,introductions};
  }

  async function hydrateFromCloud(forceReload=false){
    if(!currentUser||!currentCircle)return;
    cloudReady=false;
    try{
      const remote=await loadRemoteState();
      const next=JSON.stringify(remote);
      const prev=localStorage.getItem(STORAGE_KEY)||'';
      internalWrite=true;
      nativeSetItem.call(localStorage,STORAGE_KEY,next);
      internalWrite=false;
      cloudReady=true;
      updateChrome();
      if(forceReload || prev!==next){
        sessionStorage.setItem('rb_cloud_hydrated','1');
        location.reload();
      }
    }catch(error){
      console.error('Relations Bank hydrate',error);
      cloudReady=false;
      setMsg('cloudManageMsg','تعذر تحميل بيانات الدائرة.');
    }
  }

  function queueSync(raw){
    if(!cloudReady||!currentUser||!currentCircle||internalWrite)return;
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>syncRaw(raw),650);
  }

  async function syncRaw(raw){
    if(!cloudReady||!currentUser||!currentCircle)return;
    let state;
    try{ state=JSON.parse(raw); }catch{return}
    if(!state||!Array.isArray(state.people)||!Array.isArray(state.knowledge)||!Array.isArray(state.introductions))return;

    const circleId=currentCircle.id;
    try{
      const ownPeople=state.people.filter(p=>!owners.people.has(p.id)||owners.people.get(p.id)===currentUser.id).filter(p=>isUuid(p.id));
      if(ownPeople.length){
        const rows=ownPeople.map(p=>({
          id:p.id,circle_id:circleId,created_by:owners.people.get(p.id)||currentUser.id,
          name:p.name||'',company:p.company||'',role_title:p.role||'',city:p.city||'',field:p.sector||'',
          relationship_owner:p.owner||'',relationship_strength:p.strength||'medium',notes:p.note||'',scope:p.scope||'private'
        }));
        const {error}=await db.from('rb_people').upsert(rows,{onConflict:'id'}); if(error)throw error;
        rows.forEach(r=>owners.people.set(r.id,r.created_by));
      }

      const ownKnowledge=state.knowledge.filter(k=>!owners.knowledge.has(k.id)||owners.knowledge.get(k.id)===currentUser.id).filter(k=>isUuid(k.id));
      if(ownKnowledge.length){
        const rows=ownKnowledge.map(k=>({
          id:k.id,circle_id:circleId,created_by:owners.knowledge.get(k.id)||currentUser.id,
          person_id:isUuid(k.personId)?k.personId:null,type:k.type,title:k.title||'',details:k.details||'',tags:Array.isArray(k.tags)?k.tags:[],
          city:k.city||'',scope:k.scope||'private',source:k.source||'direct',review_at:k.reviewAt||null
        }));
        const {error}=await db.from('rb_knowledge').upsert(rows,{onConflict:'id'}); if(error)throw error;
        rows.forEach(r=>owners.knowledge.set(r.id,r.created_by));
      }

      const intros=state.introductions.filter(i=>isUuid(i.id));
      if(intros.length){
        const rows=intros.map(i=>{
          const parts=String(i.opportunityId||'').split('__');
          return {
            id:i.id,circle_id:circleId,created_by:owners.introductions.get(i.id)||currentUser.id,
            need_knowledge_id:isUuid(parts[0])?parts[0]:null,offer_knowledge_id:isUuid(parts[1])?parts[1]:null,
            title:i.title||'مسار تعارف',status:i.status||'approval',next_action:i.note||''
          };
        });
        const {error}=await db.from('rb_introductions').upsert(rows,{onConflict:'id'}); if(error)throw error;
        rows.forEach(r=>owners.introductions.set(r.id,r.created_by));
      }

      const auth=document.getElementById('cloudAuthBtn');
      if(auth){auth.textContent='تم الحفظ ✓';setTimeout(()=>{if(currentUser)auth.textContent='سحابي ✓'},1000);}
    }catch(error){
      console.error('Relations Bank sync',error);
      const auth=document.getElementById('cloudAuthBtn'); if(auth)auth.textContent='تعذر الحفظ';
    }
  }

  Storage.prototype.setItem=function(key,value){
    nativeSetItem.call(this,key,value);
    if(this===window.localStorage && key===STORAGE_KEY) queueSync(value);
  };

  async function refreshManagePane(){
    if(!currentUser)return;
    const userLabel=document.getElementById('cloudUserLabel');
    if(userLabel)userLabel.textContent=currentUser.email||'حساب مسجل';
    const invite=document.getElementById('cloudInviteCode');
    if(invite)invite.textContent=currentCircle?.invite_code||'—';
    setMsg('cloudManageMsg','');
  }

  async function copyInvite(){
    const code=currentCircle?.invite_code; if(!code)return;
    const inviteUrl=new URL(location.href);
    inviteUrl.search='';
    inviteUrl.hash='';
    inviteUrl.searchParams.set('invite',code);
    await navigator.clipboard.writeText(inviteUrl.toString()).catch(()=>{});
    setMsg('cloudManageMsg','تم نسخ رابط الدعوة.');
  }

  async function joinCircle(){
    const code=String(document.getElementById('cloudJoinCode')?.value||'').trim();
    if(!/^[a-f0-9]{12}$/i.test(code)){setMsg('cloudManageMsg','كود الدعوة غير صحيح.');return}
    setMsg('cloudManageMsg','جارٍ الانضمام...');
    const {data,error}=await db.functions.invoke('rb-join-circle',{body:{invite_code:code}});
    if(error||!data?.circle_id){setMsg('cloudManageMsg','تعذر الانضمام. تأكد من الكود.');return}
    nativeSetItem.call(localStorage,CIRCLE_KEY,data.circle_id);
    localStorage.removeItem(PENDING_INVITE_KEY);
    await ensureCircle();
    await selectCircle(data.circle_id,true);
  }

  async function createCircleFromUi(){
    const {data:ownerRow}=await db.from('rb_platform_bootstrap').select('owner_user_id').eq('id',1).maybeSingle();
    if(ownerRow?.owner_user_id!==currentUser.id){setMsg('cloudManageMsg','إنشاء الدوائر متاح لمالك المنصة فقط.');return}
    const name=String(document.getElementById('cloudNewCircleName')?.value||'').trim();
    if(name.length<2){setMsg('cloudManageMsg','اكتب اسم الدائرة.');return}
    setMsg('cloudManageMsg','جارٍ إنشاء الدائرة...');
    const {data:circle,error}=await db.from('rb_circles').insert({name,created_by:currentUser.id}).select('id,name,invite_code,created_by').single();
    if(error){console.error(error);setMsg('cloudManageMsg','تعذر إنشاء الدائرة.');return}
    const {error:memberError}=await db.from('rb_circle_members').insert({circle_id:circle.id,user_id:currentUser.id,role:'owner'});
    if(memberError){console.error(memberError);setMsg('cloudManageMsg','تعذر ربط الحساب بالدائرة.');return}
    nativeSetItem.call(localStorage,CIRCLE_KEY,circle.id);
    await ensureCircle();
    await selectCircle(circle.id,true);
  }

  async function handleSession(session){
    currentUser=session?.user||null;
    cloudReady=false;
    if(!currentUser){ currentCircle=null; updateChrome(); return; }
    try{
      await db.from('rb_profiles').upsert({user_id:currentUser.id,display_name:currentUser.user_metadata?.display_name||''},{onConflict:'user_id'});
      const hasCircle=await ensureCircle();
      if(!hasCircle){
        const pending=localStorage.getItem(PENDING_INVITE_KEY)||'';
        if(/^[a-f0-9]{12}$/i.test(pending)){
          const {data,error}=await db.functions.invoke('rb-join-circle',{body:{invite_code:pending}});
          if(!error&&data?.circle_id){
            localStorage.removeItem(PENDING_INVITE_KEY);
            nativeSetItem.call(localStorage,CIRCLE_KEY,data.circle_id);
            await ensureCircle();
          }
        }
      }
      updateChrome();
      if(currentCircle) await hydrateFromCloud(false);
      else openCloud('manage');
    }catch(error){
      console.error('Relations Bank cloud session',error);
      setMsg('cloudManageMsg','تعذر فتح الحساب السحابي.');
    }
  }

  async function init(){
    const invite=new URLSearchParams(location.search).get('invite')||'';
    if(/^[a-f0-9]{12}$/i.test(invite)){
      localStorage.setItem(PENDING_INVITE_KEY,invite);
    }
    buildUi();
    const joinInput=document.getElementById('cloudJoinCode');
    if(joinInput&&invite)joinInput.value=invite;
    updateChrome();
    const {data:{session}}=await db.auth.getSession();
    await handleSession(session);
    db.auth.onAuthStateChange((_event,session)=>{ setTimeout(()=>handleSession(session),0); });
  }

  window.relationsBankCloud={db,hydrate:()=>hydrateFromCloud(true)};
  init();
})();