(() => {
  const key='relations_bank_pending_invite_v1';
  function setup(){
    const form=document.getElementById('cloudAuthForm');
    if(!form) return setTimeout(setup,120);
    if(document.getElementById('cloudResendConfirm')) return;
    const row=document.createElement('div');
    row.className='cloud-actions';
    row.innerHTML='<button class="cloud-btn" type="button" id="cloudResendConfirm">إعادة إرسال التفعيل</button>';
    form.appendChild(row);
    document.getElementById('cloudResendConfirm').onclick=async()=>{
      const email=String(form.elements.email?.value||'').trim();
      const msg=document.getElementById('cloudAuthMsg');
      if(!email){ if(msg) msg.textContent='اكتب البريد الإلكتروني أولا.'; return; }
      const invite=localStorage.getItem(key)||'';
      const redirect=location.origin+location.pathname+(invite?('?invite='+encodeURIComponent(invite)):'');
      if(msg) msg.textContent='جارٍ إرسال رابط جديد...';
      const db=window.relationsBankCloud?.db;
      const {error}=await db.auth.resend({type:'signup',email,options:{emailRedirectTo:redirect}});
      if(msg) msg.textContent=error?'تعذر الإرسال الآن. حاول بعد قليل.':'تم إرسال رابط جديد. استخدم آخر رسالة فقط.';
    };
  }
  setup();
})();