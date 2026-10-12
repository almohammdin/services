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
  let examplesHidden = false;
  let guideSeen = false;
  let handleProfile = null;
  let lastCloudFocus = null;
  const owners = { people: new Map(), knowledge: new Map(), introductions: new Map() };
  const nativeSetItem = Storage.prototype.setItem;

  function emitAccess(){
    window.dispatchEvent(new CustomEvent('relationsbank:access',{detail:{authenticated:!!currentUser,member:!!currentCircle,circle:currentCircle?{id:currentCircle.id,name:currentCircle.name}:null,user:currentUser?{id:currentUser.id,email:currentUser.email||''}:null,invite_pending:!!localStorage.getItem(PENDING_INVITE_KEY)}}));
  }

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
      select.setAttribute('aria-label','اختر الدائرة');

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
        <button class="cloud-close" id="cloudCloseBtn" type="button" aria-label="إغلاق">×</button>
        <div id="cloudAuthPane">
          <h2 id="cloudTitle">بنك العلاقات والفرص</h2>
          <form id="cloudAuthForm" class="cloud-form">
            <label id="cloudNameField" hidden><span>الاسم</span><input name="display_name" type="text" autocomplete="name" placeholder="الاسم"></label>
            <label><span id="cloudIdentifierLabel">اسم المستخدم أو البريد الإلكتروني</span><input name="identifier" type="text" autocomplete="username" dir="ltr" maxlength="320" required></label>
            <label id="cloudContactField" hidden><span>البريد الإلكتروني (اختياري)</span><input name="contact_email" type="email" autocomplete="email" dir="ltr" maxlength="320"></label>
            <label id="cloudInviteField" hidden><span>كود الدعوة</span><input name="invite_code" type="text" dir="ltr" maxlength="12" pattern="[a-fA-F0-9]{12}" placeholder="الصق كود الدعوة هنا"></label>
            <label><span>كلمة المرور</span><input name="password" type="password" autocomplete="current-password" required></label>
            <p id="cloudAuthHint" class="cloud-hint">استخدم بيانات حسابك للدخول.</p>
            <div class="cloud-actions">
              <button class="cloud-btn primary" id="cloudAuthSubmit" type="submit">دخول</button>
              <button class="cloud-btn" id="cloudSignupBtn" type="button">إنشاء حساب</button>
            </div>
          </form>
          <div class="cloud-msg" id="cloudAuthMsg" role="status" aria-live="polite"></div>
        </div>
        <div id="cloudManagePane" hidden>
          <span style="color:#C9853C;font-size:12px;font-weight:900">إدارة الدائرة</span>
          <h2 id="cloudManageTitle">الحساب والدائرة</h2>
          <p id="cloudUserLabel"></p>
          <details class="cloud-section" id="cloudAccountSettings"><summary>إعدادات الحساب</summary>
            <form id="cloudProfileForm" class="cloud-form">
              <label><span>الاسم الظاهر</span><input name="display_name" autocomplete="name" minlength="2" maxlength="120" required></label>
              <label><span>اسم المستخدم</span><input name="username" autocomplete="username" dir="ltr" pattern="[a-zA-Z][a-zA-Z0-9_]{2,29}" minlength="3" maxlength="30" required></label>
              <p class="cloud-hint">من 3 إلى 30 حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية، ويبدأ بحرف.</p>
              <label><span>البريد الإلكتروني (اختياري)</span><input name="contact_email" type="email" autocomplete="email" dir="ltr" maxlength="320"></label>
              <p class="cloud-hint">بريد للتواصل. يبقى تسجيل الدخول باسم المستخدم؛ إضافة البريد لا تجعله وسيلة لاستعادة الحساب.</p>
              <label><span>كلمة المرور الحالية لتأكيد التعديل</span><input name="current_password" type="password" autocomplete="current-password" required></label>
              <button class="cloud-btn primary" type="submit">حفظ بيانات الحساب</button>
              <div class="cloud-msg" id="cloudProfileMsg" role="status" aria-live="polite"></div>
            </form>
            <form id="cloudPasswordForm" class="cloud-form" style="margin-top:18px">
              <strong>تغيير كلمة المرور</strong>
              <label><span>كلمة المرور الحالية</span><input name="current_password" type="password" autocomplete="current-password" required></label>
              <label><span>كلمة المرور الجديدة</span><input name="new_password" type="password" autocomplete="new-password" minlength="12" maxlength="256" required></label>
              <label><span>تأكيد كلمة المرور الجديدة</span><input name="confirm_password" type="password" autocomplete="new-password" minlength="12" maxlength="256" required></label>
              <p class="cloud-hint">12 حرفًا على الأقل. بعد التغيير ستدخل بكلمة المرور الجديدة.</p>
              <button class="cloud-btn" type="submit">تغيير كلمة المرور</button>
              <div class="cloud-msg" id="cloudPasswordMsg" role="status" aria-live="polite"></div>
            </form>
          </details>
          <div class="cloud-section">
            <strong>كود دعوة الدائرة الحالية</strong>
            <div class="invite-row"><div class="invite-code" id="cloudInviteCode">غير متاح</div><button class="cloud-btn" id="cloudCopyInvite" type="button">نسخ</button></div>
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
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)closeCloud();});

    document.getElementById('cloudAuthForm')?.addEventListener('submit', handleAuthSubmit);
    document.getElementById('cloudProfileForm')?.addEventListener('submit', saveProfile);
    document.getElementById('cloudPasswordForm')?.addEventListener('submit', savePassword);
    document.getElementById('cloudSignupBtn')?.addEventListener('click', toggleAuthMode);
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
    if(mode==='manage'&&!currentUser)mode='auth';
    const overlay = document.getElementById('cloudOverlay');
    if (!overlay) return;
    if(overlay.hidden)lastCloudFocus=document.activeElement;
    overlay.hidden = false;
    document.getElementById('cloudAuthPane').hidden = mode !== 'auth';
    document.getElementById('cloudManagePane').hidden = mode !== 'manage';
    if (mode === 'auth') setAuthMode('signin');
    if (mode === 'manage') {refreshManagePane();window.RBGov?.renderManagement?.().catch(e=>setMsg('cloudManageMsg',e.message));}
    overlay.querySelector('[role="dialog"]').setAttribute('aria-labelledby',mode==='manage'?'cloudManageTitle':'cloudTitle');
    document.querySelector(mode==='manage'?'#cloudCloseBtn':'#cloudAuthForm input[name="identifier"]')?.focus();
  }
  function closeCloud(){ const o=document.getElementById('cloudOverlay'); if(o)o.hidden=true;lastCloudFocus?.focus?.(); }

  function setMsg(id, msg){ const el=document.getElementById(id); if(el)el.textContent=msg||''; }

  function setAuthMode(mode){
    const form=document.getElementById('cloudAuthForm');
    if(!form)return;
    const signup=mode==='signup';
    form.dataset.mode=signup?'signup':'signin';
    const nameField=document.getElementById('cloudNameField');
    const nameInput=nameField?.querySelector('input');
    const submit=document.getElementById('cloudAuthSubmit');
    const toggle=document.getElementById('cloudSignupBtn');
    const password=form.elements.password;
    if(nameField)nameField.hidden=!signup;
    if(nameInput){nameInput.required=signup;if(!signup)nameInput.value=''}
    if(submit)submit.textContent=signup?'إنشاء الحساب':'دخول';
    if(toggle)toggle.textContent=signup?'لدي حساب':'إنشاء حساب';
    if(password)password.autocomplete=signup?'new-password':'current-password';
    if(password){password.minLength=signup?12:1;password.maxLength=256;}
    const identifier=form.elements.identifier;
    if(identifier){identifier.maxLength=signup?30:320;identifier.pattern=signup?'[a-zA-Z][a-zA-Z0-9_]{2,29}':'.*';}
    document.getElementById('cloudIdentifierLabel').textContent=signup?'اسم المستخدم':'اسم المستخدم أو البريد الإلكتروني';
    document.getElementById('cloudContactField').hidden=!signup;
    document.getElementById('cloudInviteField').hidden=!signup;
    form.elements.invite_code.required=signup;
    form.elements.invite_code.value=localStorage.getItem(PENDING_INVITE_KEY)||form.elements.invite_code.value||'';
    document.getElementById('cloudAuthHint').textContent=signup?'إنشاء الحساب يتطلب دعوة. اختر اسم مستخدم وكلمة مرور من 12 حرفًا على الأقل.':'استخدم بيانات حسابك للدخول.';
    const title=document.getElementById('cloudTitle');
    if(title)title.textContent=signup?'إنشاء حساب':'تسجيل الدخول';
    setMsg('cloudAuthMsg','');
  }

  function toggleAuthMode(){
    const form=document.getElementById('cloudAuthForm');
    setAuthMode(form?.dataset.mode==='signup'?'signin':'signup');
  }

  async function handleAuthSubmit(e){
    const form=e.currentTarget;
    e.preventDefault();
    if(form.dataset.busy)return;
    form.dataset.busy='1';
    const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
    try{
      if(form?.dataset.mode==='signup')await signUp();
      else await signIn(e);
    }catch{setMsg('cloudAuthMsg','تعذر الاتصال. تحقق من الإنترنت وحاول مجددًا.');}
    finally{delete form.dataset.busy;buttons.forEach(b=>b.disabled=false);}
  }

  async function signIn(e){
    e.preventDefault();
    setMsg('cloudAuthMsg','جارٍ التحقق...');
    const fd = new FormData(e.currentTarget);
    const identifier = String(fd.get('identifier')||'').trim();
    const password = String(fd.get('password')||'');
    const result=await invokeAccount({action:'signin',identifier,password});
    if(result.error){setMsg('cloudAuthMsg',accountMessage(result.error));return;}
    const {error}=await db.auth.setSession(result.session);
    if(error){setMsg('cloudAuthMsg',authMessage(error));return;}
    setMsg('cloudAuthMsg','تم الدخول.');
    closeCloud();
  }

  async function signUp(){
    const form = document.getElementById('cloudAuthForm');
    const fd = new FormData(form);
    const name = String(fd.get('display_name')||'').trim();
    const username = String(fd.get('identifier')||'').trim().toLowerCase();
    const contact_email = String(fd.get('contact_email')||'').trim();
    const password = String(fd.get('password')||'');
    if (name.length < 2) { setMsg('cloudAuthMsg','اكتب الاسم.'); return; }
    if (!/^[a-z][a-z0-9_]{2,29}$/.test(username) || password.length < 12) { setMsg('cloudAuthMsg','تحقق من اسم المستخدم وكلمة المرور.'); return; }

    setMsg('cloudAuthMsg','جارٍ إنشاء الحساب...');
    const pendingInvite=String(fd.get('invite_code')||'').trim().toLowerCase();
    if(!/^[a-f0-9]{12}$/.test(pendingInvite)){setMsg('cloudAuthMsg','أدخل كود دعوة صالحًا لإنشاء الحساب.');return;}
    localStorage.setItem(PENDING_INVITE_KEY,pendingInvite);
    const {data,error}=await db.functions.invoke('rb-invite-signup',{body:{
      display_name:name,username,contact_email,password,invite_code:pendingInvite
    }});

    if(error||!data?.ok){
      const code=data?.error||(await functionError(error))||'';
      if(code==='invite_required'||code==='invalid_invite'){setMsg('cloudAuthMsg','الدعوة غير صالحة.');return}
      if(code==='exists'){setMsg('cloudAuthMsg','البريد مسجل مسبقا. استخدم تسجيل الدخول.');return}
      if(code==='username_taken'){setMsg('cloudAuthMsg','اسم المستخدم مستخدم. اختر اسمًا آخر.');return;}
      setMsg('cloudAuthMsg','تعذر إنشاء الحساب الآن.');return;
    }

    if(data.circle_id) nativeSetItem.call(localStorage,CIRCLE_KEY,data.circle_id);
    const signed=await invokeAccount({action:'signin',identifier:username,password});
    if(signed.error){setMsg('cloudAuthMsg','تم إنشاء الحساب. حاول تسجيل الدخول.');return;}
    const sessionResult=await db.auth.setSession(signed.session);
    if(sessionResult.error){setMsg('cloudAuthMsg','تم إنشاء الحساب. حاول تسجيل الدخول.');return;}
    setMsg('cloudAuthMsg','تم الدخول.');
    closeCloud();
  }

  function authMessage(error){
    const m=String(error?.message||'').toLowerCase();
    if(m.includes('invalid login')) return 'بيانات الدخول غير صحيحة.';
    if(m.includes('email not confirmed')) return 'الحساب يحتاج تأكيد البريد أولا.';
    if(m.includes('already registered')) return 'البريد مسجل مسبقا. استخدم تسجيل الدخول.';
    return 'تعذر إكمال العملية الآن.';
  }

  async function functionError(error){
    try{return (await error?.context?.json())?.error||'';}catch{return '';}
  }
  async function invokeAccount(body){
    const {data,error}=await db.functions.invoke('rb-account',{body});
    return error?{error:(await functionError(error))||'unavailable'}:data||{error:'unavailable'};
  }
  function accountMessage(code){
    return ({invalid_credentials:'اسم المستخدم أو كلمة المرور غير صحيحة.',rate_limit:'محاولات كثيرة. انتظر 10 دقائق ثم حاول مجددًا.',current_password:'كلمة المرور الحالية غير صحيحة.',username_taken:'اسم المستخدم مستخدم. اختر اسمًا آخر.',username_format:'ابدأ اسم المستخدم بحرف إنجليزي، واستخدم 3 إلى 30 حرفًا أو رقمًا أو شرطة سفلية.',name:'اكتب اسمًا من حرفين على الأقل.',email:'تحقق من صيغة البريد الإلكتروني.',password_length:'كلمة المرور الجديدة يجب أن تكون من 12 إلى 256 حرفًا.',invalid_session:'انتهت الجلسة. سجل الدخول مجددًا.',profile_partial:'حُفظ اسم المستخدم، لكن تعذر تحديث الاسم الظاهر. أعد المحاولة.'})[code]||'تعذر حفظ التعديل الآن. حاول مجددًا.';
  }
  async function saveProfile(e){
    e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');if(button.disabled)return;
    button.disabled=true;setMsg('cloudProfileMsg','جارٍ حفظ بيانات الحساب…');
    try{
      const values=Object.fromEntries(new FormData(form));
      const result=await invokeAccount({action:'profile',...values});
      if(result.error){setMsg('cloudProfileMsg',accountMessage(result.error));return;}
      handleProfile={user_id:currentUser.id,username:result.username,contact_email:result.contact_email};
      form.elements.current_password.value='';
      await db.auth.refreshSession();
      setMsg('cloudProfileMsg','تم حفظ بيانات الحساب.');
    }catch{setMsg('cloudProfileMsg','تعذر الاتصال. حاول مجددًا.');}finally{button.disabled=false;}
  }
  async function savePassword(e){
    e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');if(button.disabled)return;
    const values=Object.fromEntries(new FormData(form));
    if(values.new_password!==values.confirm_password){setMsg('cloudPasswordMsg','كلمتا المرور غير متطابقتين.');return;}
    button.disabled=true;setMsg('cloudPasswordMsg','جارٍ تغيير كلمة المرور…');
    try{
      const result=await invokeAccount({action:'password',current_password:values.current_password,new_password:values.new_password});
      if(result.error){setMsg('cloudPasswordMsg',accountMessage(result.error));return;}
      await db.auth.signOut({scope:'local'});form.reset();location.reload();
    }catch{setMsg('cloudPasswordMsg','تعذر الاتصال. حاول مجددًا.');}finally{button.disabled=false;}
  }
  const filterExamples=query=>examplesHidden?query.eq('is_example',false):query;

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
      if(pill) pill.textContent='';
      if(reset) reset.hidden=false;
      return;
    }

    if(currentUser && !currentCircle){
      if(auth){auth.textContent='بانتظار دعوة';auth.className='cloud-btn';}
      if(manage) manage.hidden=false;
      if(select) select.hidden=true;
      if(pill) pill.textContent='';
      if(reset) reset.hidden=true;
      return;
    }

    if(auth){auth.textContent=currentUser?.user_metadata?.display_name||'الحساب';auth.className='cloud-btn ok';}
    if(manage) manage.hidden=false;
    if(select) select.hidden=false;
    if(pill) pill.textContent=currentCircle?.name || 'حساب سحابي';
    if(reset) reset.hidden=true;

    document.querySelectorAll('.demo-badge').forEach(el => el.textContent='بيانات الدائرة');
    const meta=document.querySelector('.footer-meta');
    if(meta) meta.textContent='';
  }

  async function ensureCircle(){
    const { data: memberships, error: memberError } = await db.from('rb_circle_members').select('circle_id,role').eq('user_id',currentUser.id);
    if (memberError) throw memberError;
    const roleMap=new Map((memberships||[]).map(m=>[m.circle_id,m.role]));

    let ids = (memberships||[]).map(x=>x.circle_id);
    if (!ids.length) {currentCircle=null;updateChrome();return false;}

    const { data: allCircles, error: circleError } = await db.from('rb_circles').select('id,name,invite_code,created_by,active,is_example,partnerships_enabled').in('id',ids).eq('active',true).order('created_at');
    if (circleError) throw circleError;
    let circles=allCircles||[];
    if(examplesHidden){
      const real=await db.rpc('rb_circles_with_real_data');
      if(real.error)throw real.error;
      const keep=new Set((real.data||[]).map(x=>x.circle_id));
      circles=circles.filter(c=>!c.is_example||keep.has(c.id));
    }
    if (!circles?.length) return false;

    const select=document.getElementById('cloudCircleSelect');
    if(select){
      select.innerHTML=circles.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    }

    const wanted = localStorage.getItem(CIRCLE_KEY);
    const chosen = circles.find(c=>c.id===wanted) || (!wanted&&currentUser.email?.endsWith('@accounts.relations-bank.invalid')?circles.find(c=>c.is_example):null) || circles[0];
    currentCircle={...chosen,role:roleMap.get(chosen.id)||'member'};
    nativeSetItem.call(localStorage,CIRCLE_KEY,chosen.id);
    if(select)select.value=chosen.id;
    updateChrome();
    return true;
  }

  async function selectCircle(id, reload){
    const { data, error }=await db.from('rb_circles').select('id,name,invite_code,created_by,active,is_example,partnerships_enabled').eq('id',id).single();
    if(error) throw error;
    currentCircle=data;
    nativeSetItem.call(localStorage,CIRCLE_KEY,id);
    updateChrome();
    await hydrateFromCloud(reload);
  }

  async function loadRemoteState(){
    const circleId=currentCircle.id;
    const [peopleRes, knowledgeRes, introRes]=await Promise.all([
      filterExamples(db.from('rb_people').select('*')).eq('circle_id',circleId).order('created_at',{ascending:false}),
      filterExamples(db.from('rb_knowledge').select('*')).eq('circle_id',circleId).order('created_at',{ascending:false}),
      filterExamples(db.from('rb_introductions').select('*')).eq('circle_id',circleId).order('created_at',{ascending:false})
    ]);
    if(peopleRes.error) throw peopleRes.error;
    if(knowledgeRes.error) throw knowledgeRes.error;
    if(introRes.error) throw introRes.error;

    owners.people.clear(); owners.knowledge.clear(); owners.introductions.clear();

    const people=(peopleRes.data||[]).map(p=>{
      owners.people.set(p.id,p.created_by);
      return {id:p.id,name:p.name,company:p.company,role:p.role_title,city:p.city,sector:p.field,owner:p.relationship_owner,strength:p.relationship_strength,scope:p.scope,note:p.notes,createdBy:p.created_by,isExample:p.is_example};
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

      const intros=state.introductions.filter(i=>!owners.introductions.has(i.id)||owners.introductions.get(i.id)===currentUser.id).filter(i=>isUuid(i.id));
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
    if(userLabel)userLabel.textContent=handleProfile?.username||currentUser.email||'حساب مسجل';
    const profile=document.getElementById('cloudProfileForm');
    if(profile){
      profile.elements.display_name.value=currentUser.user_metadata?.display_name||'';
      profile.elements.username.value=handleProfile?.username||'';
      profile.elements.contact_email.value=handleProfile?.contact_email||(!currentUser.email?.endsWith('.invalid')?currentUser.email:'')||'';
      profile.elements.current_password.value='';
    }
    const invite=document.getElementById('cloudInviteCode');
    if(invite)invite.textContent=currentCircle?.invite_code||'غير متاح';
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
    const button=document.getElementById('cloudCreateCircleBtn');if(button.disabled)return;
    const name=String(document.getElementById('cloudNewCircleName')?.value||'').trim();
    if(name.length<2){setMsg('cloudManageMsg','اكتب اسم الدائرة.');return;}
    button.disabled=true;setMsg('cloudManageMsg','جارٍ إنشاء دائرتك…');
    try{const result=await window.RBGov.api('create_circle',{name});nativeSetItem.call(localStorage,CIRCLE_KEY,result.circle.id);await ensureCircle();await selectCircle(result.circle.id,true);}
    catch(e){setMsg('cloudManageMsg',e.message);}finally{button.disabled=false;}
  }

  async function handleSession(session){
    currentUser=session?.user||null;
    cloudReady=false;
    if(!currentUser){ currentCircle=null; updateChrome(); emitAccess(); return; }
    try{
      const [handle,pref]=await Promise.all([
        db.from('rb_login_handles').select('user_id,username,contact_email').eq('user_id',currentUser.id).maybeSingle(),
        db.from('rb_example_preferences').select('hidden,guide_seen').eq('user_id',currentUser.id).maybeSingle()
      ]);
      if(handle.error||pref.error)throw handle.error||pref.error;
      await window.RBGov?.refresh?.();
      handleProfile=handle.data;examplesHidden=!!pref.data?.hidden;guideSeen=!!pref.data?.guide_seen;
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
      emitAccess();
      renderExamplesGuide();
      window.RBGov?.refresh?.().then(()=>window.RBGov.renderPendingLink()).catch(()=>{});
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
    let validSession=session;
    if(session){
      const checked=await db.auth.getUser();
      if(checked.error||!checked.data?.user){
        try{await db.auth.signOut({scope:'local'})}catch{}
        localStorage.removeItem(CIRCLE_KEY);
        validSession=null;
      }
    }
    await handleSession(validSession);
    db.auth.onAuthStateChange((_event,session)=>{ setTimeout(()=>handleSession(session),0); });
  }

  function renderExamplesGuide(){
    if(!currentCircle)return;
    let banner=document.getElementById('rbExamplesGuide');
    if(!banner){banner=document.createElement('section');banner.id='rbExamplesGuide';banner.className='rb-quick-guide';document.querySelector('main')?.prepend(banner);}
    banner.innerHTML='<details id="rbGuideDetails" '+(!guideSeen&&!examplesHidden?'open':'')+'><summary>دليل سريع للمنصة</summary><div class="rb-guide-body"><p>اختر دائرة تحمل كلمة «مثال» لتتعرف على المنصة. الأسماء والجهات فيها افتراضية.</p><ol><li><strong>افتح ملف شخص</strong><span>شاهد مجاله وعلاقاته وما يستطيع المساعدة فيه.</span></li><li><strong>جرّب طلبًا</strong><span>راجع المرشحين وسبب ترشيح كل شخص.</span></li><li><strong>تابع الفرصة</strong><span>التعارف والمكافأة يداران وفق الصلاحيات والموافقات.</span></li></ol><button class="cloud-btn" id="rbGuideDone" type="button">فهمت</button></div></details><div class="rb-guide-tools"><button class="cloud-btn" id="rbExamplesAction" type="button">'+(examplesHidden?'إعادة الأمثلة':'مسح الأمثلة')+'</button>'+(examplesHidden?'<span>إضافاتك محفوظة</span>':'')+'</div><p id="rbExamplesMsg" role="status" aria-live="polite"></p>';
    const markSeen=async()=>{
      if(guideSeen)return;
      const saved=await db.from('rb_example_preferences').upsert({user_id:currentUser.id,hidden:examplesHidden,guide_seen:true},{onConflict:'user_id'});
      if(!saved.error)guideSeen=true;
    };
    document.getElementById('rbGuideDone').onclick=()=>{document.getElementById('rbGuideDetails').open=false;markSeen();};
    document.getElementById('rbGuideDetails').addEventListener('toggle',e=>{if(!e.target.open)markSeen();});
    document.getElementById('rbExamplesAction').onclick=async()=>{
      const button=document.getElementById('rbExamplesAction');button.disabled=true;
      try{
        clearTimeout(syncTimer);await syncRaw(localStorage.getItem(STORAGE_KEY)||'');
        const next=!examplesHidden;
        const result=await db.from('rb_example_preferences').upsert({user_id:currentUser.id,hidden:next,guide_seen:true},{onConflict:'user_id'});
        if(result.error)throw result.error;
        examplesHidden=next;guideSeen=true;
        await ensureCircle();await hydrateFromCloud(true);
      }catch{setMsg('rbExamplesMsg','تعذر تحديث الأمثلة الآن. حاول مجددًا.');button.disabled=false;}
    };
  }
  window.relationsBankCloud={db,filterExamples,examplesVisible:()=>!examplesHidden,hydrate:()=>hydrateFromCloud(true),getAccess:()=>({authenticated:!!currentUser,member:!!currentCircle,circle:currentCircle,user:currentUser}),openAuth:()=>openCloud('auth'),openSignup:()=>{openCloud('auth');setAuthMode('signup');},openManage:()=>openCloud('manage')};
  init();
})();
