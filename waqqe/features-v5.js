(() => {
  const COLOR_KEY='waqqe_signature_color_v1';
  const FONT_KEY='waqqe_text_font_v1';
  const DATE_KEY='waqqe_date_calendar_v1';
  const LANG_KEY='waqqe_lang_v1';
  const COLORS=[
    {key:'ink',value:'#172A38'},
    {key:'navy',value:'#0D3656'},
    {key:'blue',value:'#1D4E89'},
    {key:'green',value:'#276749'}
  ];
  const FONTS=[
    {key:'craft',family:"NaifCraft, Tahoma, Arial, sans-serif"},
    {key:'modern',family:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"},
    {key:'classic',family:"Georgia, 'Times New Roman', serif"},
    {key:'traditional',family:"'Times New Roman', Tahoma, serif"}
  ];
  const LOCALE={ar:'ar-SA-u-nu-latn',en:'en-US',fr:'fr-FR',es:'es-ES',ur:'ur-PK-u-nu-latn',tr:'tr-TR',zh:'zh-CN',ko:'ko-KR',hi:'hi-IN-u-nu-latn'};
  const HIJRI={ar:'ar-SA-u-ca-islamic-umalqura-nu-latn',en:'en-US-u-ca-islamic-umalqura-nu-latn',fr:'fr-FR-u-ca-islamic-umalqura-nu-latn',es:'es-ES-u-ca-islamic-umalqura-nu-latn',ur:'ur-PK-u-ca-islamic-umalqura-nu-latn',tr:'tr-TR-u-ca-islamic-umalqura-nu-latn',zh:'zh-CN-u-ca-islamic-umalqura-nu-latn',ko:'ko-KR-u-ca-islamic-umalqura-nu-latn',hi:'hi-IN-u-ca-islamic-umalqura-nu-latn'};
  const COPY={
    ar:{color:'لون التوقيع',font:'خط النص',craft:'امتداد',modern:'حديث',classic:'كلاسيكي',traditional:'رسمي',hijri:'هجري',gregorian:'ميلادي'},
    en:{color:'Signature color',font:'Text font',craft:'Emtidad',modern:'Modern',classic:'Classic',traditional:'Formal',hijri:'Hijri',gregorian:'Gregorian'},
    fr:{color:'Couleur de signature',font:'Police du texte',craft:'Emtidad',modern:'Moderne',classic:'Classique',traditional:'Formelle',hijri:'Hégirien',gregorian:'Grégorien'},
    es:{color:'Color de firma',font:'Fuente del texto',craft:'Emtidad',modern:'Moderna',classic:'Clásica',traditional:'Formal',hijri:'Hégira',gregorian:'Gregoriano'},
    ur:{color:'دستخط کا رنگ',font:'متن کا فونٹ',craft:'امتداد',modern:'جدید',classic:'کلاسک',traditional:'رسمی',hijri:'ہجری',gregorian:'عیسوی'},
    tr:{color:'İmza rengi',font:'Metin yazı tipi',craft:'Emtidad',modern:'Modern',classic:'Klasik',traditional:'Resmî',hijri:'Hicri',gregorian:'Miladi'},
    zh:{color:'签名颜色',font:'文本字体',craft:'Emtidad',modern:'现代',classic:'经典',traditional:'正式',hijri:'回历',gregorian:'公历'},
    ko:{color:'서명 색상',font:'텍스트 글꼴',craft:'Emtidad',modern:'모던',classic:'클래식',traditional:'정식',hijri:'히즈리력',gregorian:'그레고리력'},
    hi:{color:'हस्ताक्षर का रंग',font:'टेक्स्ट फ़ॉन्ट',craft:'Emtidad',modern:'आधुनिक',classic:'क्लासिक',traditional:'औपचारिक',hijri:'हिजरी',gregorian:'ग्रेगोरियन'}
  };
  let signatureColor='#172A38';
  let textFont='craft';
  let dateType='gregorian';
  let pendingDate=false;
  try{
    signatureColor=localStorage.getItem(COLOR_KEY)||signatureColor;
    textFont=localStorage.getItem(FONT_KEY)||textFont;
    dateType=localStorage.getItem(DATE_KEY)||dateType;
  }catch{}
  if(!COLORS.some(x=>x.value===signatureColor))signatureColor=COLORS[0].value;
  if(!FONTS.some(x=>x.key===textFont))textFont='craft';
  if(!['hijri','gregorian'].includes(dateType))dateType='gregorian';

  const q=s=>document.querySelector(s);
  const lang=()=>{try{return localStorage.getItem(LANG_KEY)||document.documentElement.lang||'ar'}catch{return document.documentElement.lang||'ar'}};
  const copy=()=>COPY[lang()]||COPY.ar;

  function formatDate(kind){
    const l=lang(),now=new Date();
    const locale=kind==='hijri'?(HIJRI[l]||HIJRI.ar):(LOCALE[l]||LOCALE.ar);
    return new Intl.DateTimeFormat(locale,{year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  }
  function saveColor(value){
    signatureColor=value;try{localStorage.setItem(COLOR_KEY,value)}catch{}
    document.dispatchEvent(new CustomEvent('waqqe:signaturecolorchange',{detail:{color:value}}));
    syncControls();
  }
  function saveFont(value){textFont=value;try{localStorage.setItem(FONT_KEY,value)}catch{}syncControls()}
  function saveDateType(value){dateType=value;try{localStorage.setItem(DATE_KEY,value)}catch{}syncControls()}

  function makeColorPicker(){
    const modal=q('#signatureModal .modal-body');if(!modal||q('.signature-color-picker'))return;
    const row=document.createElement('div');row.className='feature-row signature-color-picker';
    row.innerHTML=`<span class="feature-label"></span><div class="color-options">${COLORS.map(c=>`<button type="button" class="color-dot" data-signature-color="${c.value}" style="--dot:${c.value}" aria-label="${c.key}"></button>`).join('')}</div>`;
    const tabs=modal.querySelector('.signature-tabs');tabs?.after(row);
    row.addEventListener('click',e=>{const b=e.target.closest('[data-signature-color]');if(b)saveColor(b.dataset.signatureColor)});
  }
  function makeFontPicker(){
    const body=q('#textModal .modal-body');if(!body||q('.text-font-picker'))return;
    const row=document.createElement('div');row.className='feature-row text-font-picker';
    row.innerHTML=`<span class="feature-label"></span><div class="font-options">${FONTS.map(f=>`<button type="button" class="font-option" data-text-font="${f.key}" style="font-family:${f.family}"><span class="font-sample">Aa</span><small></small></button>`).join('')}</div>`;
    body.appendChild(row);
    row.addEventListener('click',e=>{const b=e.target.closest('[data-text-font]');if(b)saveFont(b.dataset.textFont)});
  }
  function makeDatePicker(){
    if(q('.date-choice-popover'))return;
    const pop=document.createElement('div');
    pop.className='date-choice-popover';pop.hidden=true;
    pop.innerHTML='<button type="button" data-date-type="hijri"></button><button type="button" data-date-type="gregorian"></button>';
    document.body.appendChild(pop);
    pop.addEventListener('click',e=>{
      const b=e.target.closest('[data-date-type]');if(!b)return;
      saveDateType(b.dataset.dateType);addChosenDate(b.dataset.dateType);closeDatePicker();
    });
  }
  function placeDatePicker(){
    const btn=q('#addDate'),pop=q('.date-choice-popover');if(!btn||!pop||pop.hidden)return;
    const r=btn.getBoundingClientRect(),w=pop.offsetWidth||190;
    const left=Math.max(10,Math.min(r.left+(r.width-w)/2,window.innerWidth-w-10));
    const below=r.bottom+8,above=r.top-pop.offsetHeight-8;
    pop.style.left=left+'px';
    pop.style.top=((below+pop.offsetHeight<window.innerHeight-8||above<8)?below:above)+'px';
  }
  function openDatePicker(){const pop=q('.date-choice-popover');if(!pop)return;pop.hidden=false;syncControls();placeDatePicker()}
  function closeDatePicker(){const pop=q('.date-choice-popover');if(pop)pop.hidden=true}
  function addChosenDate(kind){
    const input=q('#textInput'),confirm=q('#confirmText');if(!input||!confirm)return;
    pendingDate=true;input.value=formatDate(kind);confirm.click();pendingDate=false;
  }
  function installDateChoice(){
    const btn=q('#addDate');if(!btn)return;
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const pop=q('.date-choice-popover');if(!pop)return;
      if(pop.hidden)openDatePicker();else closeDatePicker();
    },true);
    document.addEventListener('click',e=>{if(!e.target.closest('#addDate')&&!e.target.closest('.date-choice-popover'))closeDatePicker()});
    window.addEventListener('resize',()=>{closeDatePicker()},{passive:true});
    window.addEventListener('scroll',()=>{closeDatePicker()},{passive:true,capture:true});
  }
  function syncControls(){
    const c=copy();
    const colorLabel=q('.signature-color-picker .feature-label');if(colorLabel)colorLabel.textContent=c.color;
    document.querySelectorAll('[data-signature-color]').forEach(b=>b.classList.toggle('active',b.dataset.signatureColor===signatureColor));
    const fontLabel=q('.text-font-picker .feature-label');if(fontLabel)fontLabel.textContent=c.font;
    document.querySelectorAll('[data-text-font]').forEach(b=>{const active=b.dataset.textFont===textFont;b.classList.toggle('active',active);const small=b.querySelector('small');if(small)small.textContent=c[b.dataset.textFont]||b.dataset.textFont});
    document.querySelectorAll('[data-date-type]').forEach(b=>{const key=b.dataset.dateType;b.textContent=c[key];b.classList.toggle('active',key===dateType)});
  }
  function init(){
    makeColorPicker();makeFontPicker();makeDatePicker();syncControls();installDateChoice();
    document.addEventListener('waqqe:languagechange',()=>{syncControls();closeDatePicker()});
  }

  window.WaqqeFeatures={
    getSignatureColor:()=>signatureColor,
    getTextFont:()=>pendingDate?'modern':textFont,
    getDateType:()=>dateType,
    getDate:()=>formatDate(dateType)
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();