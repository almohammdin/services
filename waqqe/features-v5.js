(() => {
  const COLOR_KEY='waqqe_signature_color_v1';
  const FONT_KEY='waqqe_text_font_v1';
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
  const LOCALE={ar:'ar-SA-u-nu-latn',en:'en-US',fr:'fr-FR',es:'es-ES',ur:'ur-PK-u-nu-latn'};
  const HIJRI={ar:'ar-SA-u-ca-islamic-umalqura-nu-latn',en:'en-US-u-ca-islamic-umalqura-nu-latn',fr:'fr-FR-u-ca-islamic-umalqura-nu-latn',es:'es-ES-u-ca-islamic-umalqura-nu-latn',ur:'ur-PK-u-ca-islamic-umalqura-nu-latn'};
  const COPY={
    ar:{color:'لون التوقيع',font:'خط النص',craft:'امتداد',modern:'حديث',classic:'كلاسيكي',traditional:'رسمي'},
    en:{color:'Signature color',font:'Text font',craft:'Emtidad',modern:'Modern',classic:'Classic',traditional:'Formal'},
    fr:{color:'Couleur de signature',font:'Police du texte',craft:'Emtidad',modern:'Moderne',classic:'Classique',traditional:'Formelle'},
    es:{color:'Color de firma',font:'Fuente del texto',craft:'Emtidad',modern:'Moderna',classic:'Clásica',traditional:'Formal'},
    ur:{color:'دستخط کا رنگ',font:'متن کا فونٹ',craft:'امتداد',modern:'جدید',classic:'کلاسک',traditional:'رسمی'}
  };
  let signatureColor='#172A38';
  let textFont='craft';
  let pendingDate=false;
  try{signatureColor=localStorage.getItem(COLOR_KEY)||signatureColor;textFont=localStorage.getItem(FONT_KEY)||textFont}catch{}
  if(!COLORS.some(x=>x.value===signatureColor))signatureColor=COLORS[0].value;
  if(!FONTS.some(x=>x.key===textFont))textFont='craft';

  const q=s=>document.querySelector(s);
  const lang=()=>{try{return localStorage.getItem(LANG_KEY)||document.documentElement.lang||'ar'}catch{return document.documentElement.lang||'ar'}};
  const copy=()=>COPY[lang()]||COPY.ar;

  function dualDate(){
    const l=lang(),now=new Date();
    const greg=new Intl.DateTimeFormat(LOCALE[l]||LOCALE.ar,{year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    const hijri=new Intl.DateTimeFormat(HIJRI[l]||HIJRI.ar,{year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    return `${greg} | ${hijri}`;
  }
  function saveColor(value){
    signatureColor=value;try{localStorage.setItem(COLOR_KEY,value)}catch{}
    document.dispatchEvent(new CustomEvent('waqqe:signaturecolorchange',{detail:{color:value}}));
    syncControls();
  }
  function saveFont(value){textFont=value;try{localStorage.setItem(FONT_KEY,value)}catch{}syncControls()}

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
  function syncControls(){
    const c=copy();
    const colorLabel=q('.signature-color-picker .feature-label');if(colorLabel)colorLabel.textContent=c.color;
    document.querySelectorAll('[data-signature-color]').forEach(b=>b.classList.toggle('active',b.dataset.signatureColor===signatureColor));
    const fontLabel=q('.text-font-picker .feature-label');if(fontLabel)fontLabel.textContent=c.font;
    document.querySelectorAll('[data-text-font]').forEach(b=>{const active=b.dataset.textFont===textFont;b.classList.toggle('active',active);const small=b.querySelector('small');if(small)small.textContent=c[b.dataset.textFont]||b.dataset.textFont});
  }
  function installDualDate(){
    const btn=q('#addDate');if(!btn)return;
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const input=q('#textInput'),confirm=q('#confirmText');if(!input||!confirm)return;
      pendingDate=true;input.value=dualDate();confirm.click();pendingDate=false;
    },true);
  }
  function init(){makeColorPicker();makeFontPicker();syncControls();installDualDate();document.addEventListener('waqqe:languagechange',syncControls)}

  window.WaqqeFeatures={
    getSignatureColor:()=>signatureColor,
    getTextFont:()=>pendingDate?'modern':textFont,
    getDualDate:dualDate
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();