(()=>{
  const NativeFile=window.File;
  let desiredName='';

  const uiCopy={
    ar:{rename:'عدل الاسم',save:'حفظ',cancel:'إلغاء',empty:'اكتب اسم الملف'},
    en:{rename:'Rename',save:'Save',cancel:'Cancel',empty:'Enter a file name'},
    fr:{rename:'Renommer',save:'Enregistrer',cancel:'Annuler',empty:'Saisissez un nom de fichier'},
    es:{rename:'Cambiar nombre',save:'Guardar',cancel:'Cancelar',empty:'Escribe un nombre de archivo'},
    ur:{rename:'نام بدلیں',save:'محفوظ کریں',cancel:'منسوخ',empty:'فائل کا نام لکھیں'},
    tr:{rename:'Adı değiştir',save:'Kaydet',cancel:'İptal',empty:'Dosya adı girin'},
    zh:{rename:'修改名称',save:'保存',cancel:'取消',empty:'请输入文件名'},
    ko:{rename:'이름 변경',save:'저장',cancel:'취소',empty:'파일 이름을 입력하세요'},
    hi:{rename:'नाम बदलें',save:'सहेजें',cancel:'रद्द करें',empty:'फ़ाइल का नाम लिखें'}
  };

  const lang=()=>window.WaqqeI18n?.getLang?.()||document.documentElement.lang||'ar';
  const copy=()=>uiCopy[lang()]||uiCopy.en;

  function suffixFor(base){
    if(/[\u3040-\u30ff]/.test(base))return '署名済み';
    if(/[\uac00-\ud7af]/.test(base))return '서명됨';
    if(/[\u4e00-\u9fff]/.test(base))return '已签署';
    if(/[\u0900-\u097f]/.test(base))return 'हस्ताक्षरित';
    if(/[\u0400-\u04ff]/.test(base))return 'подписано';
    if(/[\u0600-\u06ff]/.test(base)){
      if(/[ٹپچڈڑژںھہے]/.test(base))return 'دستخط شدہ';
      return 'موقع';
    }
    const selected=lang();
    return ({fr:'signé',es:'firmado',tr:'imzalı',en:'signed'}[selected]||'signed');
  }

  function defaultSignedName(name){
    const base=String(name||'document.pdf').replace(/\.pdf$/i,'').replace(/\s*-\s*signed$/i,'').trim();
    return `${base} - ${suffixFor(base)}.pdf`;
  }

  function cleanStem(v){
    return String(v||'').replace(/\.pdf$/i,'').replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
  }

  window.File=function(bits,name,options){
    let finalName=name;
    if(options?.type==='application/pdf'&&/-signed\.pdf$/i.test(String(name||''))){
      finalName=defaultSignedName(name);
      desiredName=finalName;
    }
    return new NativeFile(bits,finalName,options);
  };
  window.File.prototype=NativeFile.prototype;
  Object.setPrototypeOf(window.File,NativeFile);

  if(navigator.share){
    const nativeShare=navigator.share.bind(navigator);
    navigator.share=async data=>{
      if(desiredName&&data?.files?.length){
        data={...data,files:data.files.map(f=>f?.type==='application/pdf'?new NativeFile([f],desiredName,{type:f.type,lastModified:f.lastModified}):f)};
      }
      return nativeShare(data);
    };
  }

  const nativeAnchorClick=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    if(desiredName&&this.download&&/\.pdf$/i.test(this.download))this.download=desiredName;
    return nativeAnchorClick.call(this);
  };

  function setLabels(){
    const c=copy();
    const l=document.querySelector('#renameResultLabel');if(l)l.textContent=c.rename;
    const s=document.querySelector('#saveRename');if(s)s.textContent=c.save;
    const x=document.querySelector('#cancelRename');if(x)x.textContent=c.cancel;
  }

  function installUi(){
    const resultFile=document.querySelector('.result-file');
    const resultName=document.querySelector('#resultName');
    if(!resultFile||!resultName||document.querySelector('#renameResult'))return;
    const holder=resultName.parentElement;
    holder.classList.add('result-file-main');
    const row=document.createElement('div');row.className='result-name-row';
    holder.insertBefore(row,resultName);row.appendChild(resultName);
    const btn=document.createElement('button');btn.id='renameResult';btn.type='button';btn.className='rename-file-btn';btn.innerHTML='<span class="rename-pencil" aria-hidden="true">✎</span><span id="renameResultLabel">عدل الاسم</span>';
    row.appendChild(btn);
    const editor=document.createElement('div');editor.id='renameEditor';editor.className='rename-editor hidden';editor.innerHTML='<input id="renameInput" type="text" maxlength="180" autocomplete="off"><span class="rename-extension">.pdf</span><button class="save-rename" id="saveRename" type="button">حفظ</button><button id="cancelRename" type="button">إلغاء</button>';
    row.after(editor);

    const input=editor.querySelector('#renameInput');
    btn.addEventListener('click',()=>{
      const current=(desiredName||resultName.textContent||'document.pdf').replace(/\.pdf$/i,'');
      input.value=current;editor.classList.remove('hidden');btn.classList.add('hidden');
      requestAnimationFrame(()=>{input.focus();input.select()});
    });
    editor.querySelector('#cancelRename').addEventListener('click',()=>{editor.classList.add('hidden');btn.classList.remove('hidden')});
    const save=()=>{
      const stem=cleanStem(input.value);if(!stem){input.focus();return}
      desiredName=stem+'.pdf';resultName.textContent=desiredName;
      editor.classList.add('hidden');btn.classList.remove('hidden');
    };
    editor.querySelector('#saveRename').addEventListener('click',save);
    input.addEventListener('keydown',e=>{if(e.key==='Enter')save();if(e.key==='Escape')editor.querySelector('#cancelRename').click()});
    setLabels();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installUi,{once:true});else installUi();
  new MutationObserver(setLabels).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
})();
