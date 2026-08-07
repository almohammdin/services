(() => {
  function init(){
    const STORAGE_KEY='waqqe_lang_v1';
    const RTL=new Set(['ar','ur']);
    const LOCALE={ar:'ar-SA-u-nu-latn',en:'en-US',fr:'fr-FR',es:'es-ES',ur:'ur-PK-u-nu-latn'};
    const names={ar:'العربية',en:'English',fr:'Français',es:'Español',ur:'اردو'};

    const copy={
      ar:{
        pageTitle:'وقّع | توقيع ملفات PDF',meta:'أداة بسيطة لتوقيع ملفات PDF من الجوال أو الكمبيوتر ثم مشاركة النسخة الموقعة.',language:'اختيار اللغة',hero:'ارفع، <strong>وقّع</strong>، وشارك',heroDesc:'اختر ملف PDF، ضع توقيعك في مكانه، ثم أنشئ نسخة جديدة وأرسلها من قائمة مشاركة جهازك.',step1:'ارفع PDF',step2:'ضع التوقيع',step3:'شارك الملف',choosePdf:'اختر ملف PDF',chooseHint:'من الملفات أو البريد أو واتساب.',uploadPdf:'رفع PDF',currentFile:'الملف الحالي',addToDoc:'أضف إلى المستند',addSignature:'أضف التوقيع',date:'التاريخ',text:'نص',signature:'التوقيع',signatureStart:'أنشئ توقيعك للبدء',signatureReady:'التوقيع جاهز',createSignature:'إنشاء توقيع',changeSignature:'تغيير التوقيع',page:'الصفحة',undo:'تراجع',changeFile:'تغيير الملف',ready:'جاهز؟',newCopy:'ينشئ نسخة PDF موقعة جديدة',createSigned:'إنشاء الملف الموقع',fileReady:'الملف جاهز',fileReadyDesc:'تم تثبيت التوقيع والعناصر داخل PDF. أرسله من قائمة مشاركة جهازك أو نزّله.',share:'مشاركة إلى واتساب أو البريد',download:'تنزيل PDF',back:'العودة للمستند',role:'مستشار الحوكمة وتطوير الأعمال',yourSignature:'توقيعك',saved:'المحفوظ',uploadImage:'رفع صورة',drawSignature:'ارسم التوقيع',deleteSignature:'حذف التوقيع المحفوظ',chooseSignatureImage:'اختر صورة توقيع',imagePrep:'تهيأ الصورة تلقائيًا لتناسب المستند',clearDrawing:'مسح الرسم',saveSignature:'حفظ التوقيع',saveAdd:'حفظ وإضافة للمستند',addText:'إضافة نص',textPlaceholder:'اكتب النص هنا',textHelp:'يمكن تحريك النص وتغيير حجمه بعد إضافته',add:'إضافة',preparing:'جاري تجهيز الملف…',pages:'صفحة',emptySignature:'أنشئ توقيعك من الرسم أو أضف صورة.',selectPdf:'اختر ملف PDF',largeFile:'الملف كبير جدًا لهذه النسخة',openError:'تعذر فتح الملف. قد يكون محميًا أو تالفًا.',typeText:'اكتب النص أولًا',dragSignature:'اسحب التوقيع إلى مكانه',itemAdded:'تمت الإضافة، يمكنك تحريكها',imageReady:'تم تجهيز صورة التوقيع',imageTypes:'استخدم PNG أو JPG أو WebP',imageError:'تعذر قراءة صورة التوقيع',sessionSignature:'سيستخدم التوقيع في الجلسة الحالية',signatureSaved:'تم حفظ التوقيع',signatureDeleted:'تم حذف التوقيع المحفوظ',addFirst:'أضف التوقيع أو عنصرًا إلى المستند أولًا',fixingPdf:'جاري تثبيت العناصر داخل PDF…',signedReady:'تم إنشاء الملف الموقع',createError:'تعذر إنشاء الملف. قد يكون PDF محميًا ضد التعديل.',downloadAttach:'تم تنزيل الملف. أرفقه في واتساب أو البريد.',downloadFallback:'تم تنزيل الملف بدل المشاركة',openingPdf:'جاري فتح ملف PDF…',close:'إغلاق'
      },
      en:{
        pageTitle:'Waqqe | Sign PDF files',meta:'A simple tool to sign PDF files on mobile or desktop and share the signed copy.',language:'Choose language',hero:'Upload, <strong>sign</strong>, and share',heroDesc:'Choose a PDF, place your signature, create a signed copy, and share it from your device.',step1:'Upload PDF',step2:'Place signature',step3:'Share file',choosePdf:'Choose a PDF',chooseHint:'From Files, email, or WhatsApp.',uploadPdf:'Upload PDF',currentFile:'Current file',addToDoc:'Add to document',addSignature:'Add signature',date:'Date',text:'Text',signature:'Signature',signatureStart:'Create your signature to start',signatureReady:'Signature ready',createSignature:'Create signature',changeSignature:'Change signature',page:'Page',undo:'Undo',changeFile:'Change file',ready:'Ready?',newCopy:'Creates a new signed PDF copy',createSigned:'Create signed PDF',fileReady:'File ready',fileReadyDesc:'Your signature and added items are fixed in the PDF. Share or download it.',share:'Share via WhatsApp or email',download:'Download PDF',back:'Back to document',role:'Governance & Business Development Consultant',yourSignature:'Your signature',saved:'Saved',uploadImage:'Upload image',drawSignature:'Draw signature',deleteSignature:'Delete saved signature',chooseSignatureImage:'Choose a signature image',imagePrep:'The image is prepared automatically for the document',clearDrawing:'Clear drawing',saveSignature:'Save signature',saveAdd:'Save and add to document',addText:'Add text',textPlaceholder:'Type text here',textHelp:'Move and resize the text after adding it',add:'Add',preparing:'Preparing file…',pages:'pages',emptySignature:'Draw your signature or add an image.',selectPdf:'Choose a PDF file',largeFile:'This file is too large for this version',openError:'The PDF could not be opened. It may be protected or damaged.',typeText:'Enter the text first',dragSignature:'Drag the signature into position',itemAdded:'Added. You can move it now',imageReady:'Signature image is ready',imageTypes:'Use PNG, JPG, or WebP',imageError:'The signature image could not be read',sessionSignature:'The signature will be used for this session',signatureSaved:'Signature saved',signatureDeleted:'Saved signature deleted',addFirst:'Add a signature or another item first',fixingPdf:'Applying items to the PDF…',signedReady:'Signed PDF created',createError:'The PDF could not be created. The file may be protected from editing.',downloadAttach:'The file was downloaded. Attach it in WhatsApp or email.',downloadFallback:'The file was downloaded instead',openingPdf:'Opening PDF…',close:'Close'
      },
      fr:{
        pageTitle:'Waqqe | Signer des fichiers PDF',meta:'Un outil simple pour signer des fichiers PDF sur mobile ou ordinateur puis partager la copie signée.',language:'Choisir la langue',hero:'Importez, <strong>signez</strong>, partagez',heroDesc:'Choisissez un PDF, placez votre signature, créez une copie signée puis partagez-la depuis votre appareil.',step1:'Importer le PDF',step2:'Placer la signature',step3:'Partager le fichier',choosePdf:'Choisir un fichier PDF',chooseHint:'Depuis Fichiers, e-mail ou WhatsApp.',uploadPdf:'Importer le PDF',currentFile:'Fichier actuel',addToDoc:'Ajouter au document',addSignature:'Ajouter la signature',date:'Date',text:'Texte',signature:'Signature',signatureStart:'Créez votre signature pour commencer',signatureReady:'Signature prête',createSignature:'Créer une signature',changeSignature:'Modifier la signature',page:'Page',undo:'Annuler',changeFile:'Changer de fichier',ready:'Prêt ?',newCopy:'Crée une nouvelle copie PDF signée',createSigned:'Créer le PDF signé',fileReady:'Fichier prêt',fileReadyDesc:'La signature et les éléments ajoutés sont intégrés au PDF. Partagez-le ou téléchargez-le.',share:'Partager via WhatsApp ou e-mail',download:'Télécharger le PDF',back:'Retour au document',role:'Consultant en gouvernance et développement des affaires',yourSignature:'Votre signature',saved:'Enregistrée',uploadImage:'Importer une image',drawSignature:'Dessiner la signature',deleteSignature:'Supprimer la signature enregistrée',chooseSignatureImage:'Choisir une image de signature',imagePrep:'L’image est préparée automatiquement pour le document',clearDrawing:'Effacer',saveSignature:'Enregistrer la signature',saveAdd:'Enregistrer et ajouter au document',addText:'Ajouter du texte',textPlaceholder:'Saisissez le texte ici',textHelp:'Vous pourrez déplacer et redimensionner le texte après l’ajout',add:'Ajouter',preparing:'Préparation du fichier…',pages:'pages',emptySignature:'Dessinez votre signature ou ajoutez une image.',selectPdf:'Choisissez un fichier PDF',largeFile:'Ce fichier est trop volumineux pour cette version',openError:'Impossible d’ouvrir le PDF. Il peut être protégé ou endommagé.',typeText:'Saisissez d’abord le texte',dragSignature:'Faites glisser la signature à l’endroit souhaité',itemAdded:'Ajouté. Vous pouvez maintenant le déplacer',imageReady:'L’image de signature est prête',imageTypes:'Utilisez PNG, JPG ou WebP',imageError:'Impossible de lire l’image de signature',sessionSignature:'La signature sera utilisée pour cette session',signatureSaved:'Signature enregistrée',signatureDeleted:'Signature enregistrée supprimée',addFirst:'Ajoutez d’abord une signature ou un autre élément',fixingPdf:'Intégration des éléments au PDF…',signedReady:'PDF signé créé',createError:'Impossible de créer le PDF. Le fichier peut être protégé contre la modification.',downloadAttach:'Le fichier a été téléchargé. Joignez-le dans WhatsApp ou votre e-mail.',downloadFallback:'Le fichier a été téléchargé',openingPdf:'Ouverture du PDF…',close:'Fermer'
      },
      es:{
        pageTitle:'Waqqe | Firmar archivos PDF',meta:'Una herramienta sencilla para firmar archivos PDF desde el móvil o el ordenador y compartir la copia firmada.',language:'Elegir idioma',hero:'Sube, <strong>firma</strong> y comparte',heroDesc:'Elige un PDF, coloca tu firma, crea una copia firmada y compártela desde tu dispositivo.',step1:'Subir PDF',step2:'Colocar firma',step3:'Compartir archivo',choosePdf:'Elige un archivo PDF',chooseHint:'Desde Archivos, correo o WhatsApp.',uploadPdf:'Subir PDF',currentFile:'Archivo actual',addToDoc:'Añadir al documento',addSignature:'Añadir firma',date:'Fecha',text:'Texto',signature:'Firma',signatureStart:'Crea tu firma para empezar',signatureReady:'Firma lista',createSignature:'Crear firma',changeSignature:'Cambiar firma',page:'Página',undo:'Deshacer',changeFile:'Cambiar archivo',ready:'¿Listo?',newCopy:'Crea una nueva copia PDF firmada',createSigned:'Crear PDF firmado',fileReady:'Archivo listo',fileReadyDesc:'La firma y los elementos añadidos quedan integrados en el PDF. Compártelo o descárgalo.',share:'Compartir por WhatsApp o correo',download:'Descargar PDF',back:'Volver al documento',role:'Consultor de gobernanza y desarrollo empresarial',yourSignature:'Tu firma',saved:'Guardada',uploadImage:'Subir imagen',drawSignature:'Dibujar firma',deleteSignature:'Eliminar firma guardada',chooseSignatureImage:'Elige una imagen de firma',imagePrep:'La imagen se prepara automáticamente para el documento',clearDrawing:'Borrar dibujo',saveSignature:'Guardar firma',saveAdd:'Guardar y añadir al documento',addText:'Añadir texto',textPlaceholder:'Escribe el texto aquí',textHelp:'Podrás mover y cambiar el tamaño del texto después de añadirlo',add:'Añadir',preparing:'Preparando archivo…',pages:'páginas',emptySignature:'Dibuja tu firma o añade una imagen.',selectPdf:'Elige un archivo PDF',largeFile:'Este archivo es demasiado grande para esta versión',openError:'No se pudo abrir el PDF. Puede estar protegido o dañado.',typeText:'Escribe el texto primero',dragSignature:'Arrastra la firma hasta su lugar',itemAdded:'Añadido. Ya puedes moverlo',imageReady:'La imagen de la firma está lista',imageTypes:'Usa PNG, JPG o WebP',imageError:'No se pudo leer la imagen de la firma',sessionSignature:'La firma se usará durante esta sesión',signatureSaved:'Firma guardada',signatureDeleted:'Firma guardada eliminada',addFirst:'Añade primero una firma u otro elemento',fixingPdf:'Aplicando elementos al PDF…',signedReady:'PDF firmado creado',createError:'No se pudo crear el PDF. El archivo puede estar protegido contra edición.',downloadAttach:'El archivo se descargó. Adjútalo en WhatsApp o correo.',downloadFallback:'El archivo se descargó',openingPdf:'Abriendo PDF…',close:'Cerrar'
      },
      ur:{
        pageTitle:'وقّع | PDF فائلوں پر دستخط',meta:'موبائل یا کمپیوٹر سے PDF فائل پر دستخط کرنے اور دستخط شدہ کاپی شیئر کرنے کا آسان ٹول۔',language:'زبان منتخب کریں',hero:'اپ لوڈ کریں، <strong>دستخط کریں</strong>، شیئر کریں',heroDesc:'PDF منتخب کریں، دستخط مطلوبہ جگہ پر رکھیں، دستخط شدہ کاپی بنائیں اور اپنے ڈیوائس سے شیئر کریں۔',step1:'PDF اپ لوڈ کریں',step2:'دستخط رکھیں',step3:'فائل شیئر کریں',choosePdf:'PDF فائل منتخب کریں',chooseHint:'فائلز، ای میل یا واٹس ایپ سے۔',uploadPdf:'PDF اپ لوڈ کریں',currentFile:'موجودہ فائل',addToDoc:'دستاویز میں شامل کریں',addSignature:'دستخط شامل کریں',date:'تاریخ',text:'متن',signature:'دستخط',signatureStart:'شروع کرنے کے لیے دستخط بنائیں',signatureReady:'دستخط تیار ہیں',createSignature:'دستخط بنائیں',changeSignature:'دستخط تبدیل کریں',page:'صفحہ',undo:'واپس',changeFile:'فائل تبدیل کریں',ready:'تیار؟',newCopy:'نئی دستخط شدہ PDF کاپی بناتا ہے',createSigned:'دستخط شدہ PDF بنائیں',fileReady:'فائل تیار ہے',fileReadyDesc:'دستخط اور شامل کردہ عناصر PDF میں شامل ہو گئے ہیں۔ اب اسے شیئر یا ڈاؤن لوڈ کریں۔',share:'واٹس ایپ یا ای میل سے شیئر کریں',download:'PDF ڈاؤن لوڈ کریں',back:'دستاویز پر واپس جائیں',role:'گورننس اور بزنس ڈیولپمنٹ کنسلٹنٹ',yourSignature:'آپ کے دستخط',saved:'محفوظ',uploadImage:'تصویر اپ لوڈ کریں',drawSignature:'دستخط بنائیں',deleteSignature:'محفوظ دستخط حذف کریں',chooseSignatureImage:'دستخط کی تصویر منتخب کریں',imagePrep:'تصویر خودکار طور پر دستاویز کے لیے تیار کی جاتی ہے',clearDrawing:'صاف کریں',saveSignature:'دستخط محفوظ کریں',saveAdd:'محفوظ کریں اور دستاویز میں شامل کریں',addText:'متن شامل کریں',textPlaceholder:'یہاں متن لکھیں',textHelp:'شامل کرنے کے بعد متن کو منتقل اور اس کا سائز تبدیل کیا جا سکتا ہے',add:'شامل کریں',preparing:'فائل تیار ہو رہی ہے…',pages:'صفحات',emptySignature:'دستخط بنائیں یا تصویر شامل کریں۔',selectPdf:'PDF فائل منتخب کریں',largeFile:'یہ فائل اس ورژن کے لیے بہت بڑی ہے',openError:'PDF کھولی نہیں جا سکی۔ فائل محفوظ یا خراب ہو سکتی ہے۔',typeText:'پہلے متن لکھیں',dragSignature:'دستخط کو مطلوبہ جگہ پر لے جائیں',itemAdded:'شامل ہو گیا۔ اب اسے منتقل کر سکتے ہیں',imageReady:'دستخط کی تصویر تیار ہے',imageTypes:'PNG، JPG یا WebP استعمال کریں',imageError:'دستخط کی تصویر پڑھی نہیں جا سکی',sessionSignature:'یہ دستخط موجودہ سیشن میں استعمال ہوں گے',signatureSaved:'دستخط محفوظ ہو گئے',signatureDeleted:'محفوظ دستخط حذف ہو گئے',addFirst:'پہلے دستخط یا کوئی عنصر شامل کریں',fixingPdf:'PDF میں عناصر شامل کیے جا رہے ہیں…',signedReady:'دستخط شدہ PDF تیار ہے',createError:'PDF تیار نہیں ہو سکی۔ فائل ایڈیٹنگ سے محفوظ ہو سکتی ہے۔',downloadAttach:'فائل ڈاؤن لوڈ ہو گئی۔ اسے واٹس ایپ یا ای میل میں منسلک کریں۔',downloadFallback:'فائل ڈاؤن لوڈ ہو گئی',openingPdf:'PDF کھولی جا رہی ہے…',close:'بند کریں'
      }
    };

    const q=s=>document.querySelector(s);
    let lang='ar',saveMode='save',applying=false;
    const t=k=>(copy[lang]&&copy[lang][k])||copy.ar[k]||k;
    const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value};
    const text=(selector,value)=>setText(q(selector),value);
    const html=(selector,value)=>{const el=q(selector);if(el&&el.innerHTML!==value)el.innerHTML=value};
    const buttonLabel=(selector,label)=>{
      const el=q(selector);if(!el)return;
      let own=el.querySelector(':scope > span:not(.social-icon)');
      if(own){setText(own,label);return}
      [...el.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());
      own=el.querySelector(':scope > .i18n-label');
      if(!own){own=document.createElement('span');own.className='i18n-label';el.appendChild(own)}
      setText(own,label);
    };

    function createSwitcher(){
      const host=q('.topbar-inner');if(!host||q('.language-switcher'))return;
      const wrap=document.createElement('div');wrap.className='language-switcher';
      wrap.innerHTML=`<button class="language-button" type="button" aria-expanded="false" aria-haspopup="menu"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3C9.6 5.5 8.4 8.5 8.4 12S9.6 18.5 12 21"/></svg></button><div class="language-menu" role="menu" hidden>${Object.keys(names).map(code=>`<button class="language-option" type="button" role="menuitemradio" data-lang="${code}"><span>${names[code]}</span><b class="lang-check">✓</b></button>`).join('')}</div>`;
      host.appendChild(wrap);
      const btn=wrap.querySelector('.language-button'),menu=wrap.querySelector('.language-menu');
      btn.addEventListener('click',e=>{e.stopPropagation();const open=menu.hidden;menu.hidden=!open;btn.setAttribute('aria-expanded',String(open))});
      menu.addEventListener('click',e=>{const opt=e.target.closest('[data-lang]');if(!opt)return;setLanguage(opt.dataset.lang);menu.hidden=true;btn.setAttribute('aria-expanded','false')});
      document.addEventListener('click',()=>{menu.hidden=true;btn.setAttribute('aria-expanded','false')});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.hidden=true;btn.setAttribute('aria-expanded','false')}});
    }

    function updateSignatureState(){
      const box=q('#signatureState');if(!box)return;
      const ready=box.classList.contains('ready');
      setText(box.querySelector('span'),ready?t('signatureReady'):t('signatureStart'));
      buttonLabel('#manageSignature',ready?t('changeSignature'):t('createSignature'));
      setText(q('#savedSignatureBox .signature-empty'),t('emptySignature'));
    }

    function updateFileInfo(){
      const el=q('#fileInfo');if(!el||el.textContent==='—')return;
      const m=el.textContent.match(/^(.*?)\s*·\s*(\d+)\s+(.+)$/);if(!m)return;
      const next=`${m[1]} · ${m[2]} ${t('pages')}`;setText(el,next);
    }

    function updateSaveButton(){buttonLabel('#saveSignature',saveMode==='add'?t('saveAdd'):t('saveSignature'))}

    const toastMap={'اختر ملف PDF':'selectPdf','الملف كبير جدًا لهذه النسخة':'largeFile','تعذر فتح الملف. قد يكون محميًا أو تالفًا.':'openError','اكتب النص أولًا':'typeText','اسحب التوقيع إلى مكانه':'dragSignature','تمت الإضافة، يمكنك تحريكها':'itemAdded','تم تجهيز صورة التوقيع':'imageReady','استخدم PNG أو JPG أو WebP':'imageTypes','تعذر قراءة صورة التوقيع':'imageError','سيستخدم التوقيع في الجلسة الحالية':'sessionSignature','تعذر حفظ التوقيع محليًا، سيبقى لهذه الجلسة فقط':'sessionSignature','تم حفظ التوقيع':'signatureSaved','تم حذف التوقيع المحفوظ':'signatureDeleted','أضف التوقيع أو عنصرًا إلى المستند أولًا':'addFirst','تم إنشاء الملف الموقع':'signedReady','تعذر إنشاء الملف. قد يكون PDF محميًا ضد التعديل.':'createError','تم تنزيل الملف. أرفقه في واتساب أو البريد.':'downloadAttach','تم تنزيل الملف بدل المشاركة':'downloadFallback'};
    const loadingMap={'جاري تجهيز الملف…':'preparing','جاري فتح ملف PDF…':'openingPdf','جاري تثبيت العناصر داخل PDF…':'fixingPdf'};
    function translateDynamicNode(el,map){if(!el||applying)return;const key=map[el.textContent.trim()];if(key){applying=true;setText(el,t(key));applying=false}}

    function applyStatic(){
      applying=true;
      document.documentElement.lang=lang;document.documentElement.dir=RTL.has(lang)?'rtl':'ltr';document.body.dataset.uiLang=lang;
      document.title=t('pageTitle');
      const meta=q('meta[name="description"]');if(meta)meta.content=t('meta');
      const og=q('meta[property="og:description"]');if(og)og.content=t('heroDesc');
      const langBtn=q('.language-button');if(langBtn){langBtn.setAttribute('aria-label',t('language'));langBtn.title=t('language')}
      document.querySelectorAll('.language-option').forEach(opt=>{const active=opt.dataset.lang===lang;opt.setAttribute('aria-current',String(active));opt.setAttribute('aria-checked',String(active))});
      html('.hero h1',t('hero'));text('.hero p',t('heroDesc'));
      document.querySelectorAll('.step').forEach((el,i)=>{const next=`<b>${i+1}</b>${t('step'+(i+1))}`;if(el.innerHTML!==next)el.innerHTML=next});
      text('.upload-zone h2',t('choosePdf'));text('.upload-zone p',t('chooseHint'));buttonLabel('#pickPdf',t('uploadPdf'));
      text('.file-meta small',t('currentFile'));
      const titles=document.querySelectorAll('.tool-title');if(titles[0])setText(titles[0],t('addToDoc'));if(titles[1])setText(titles[1],t('signature'));
      buttonLabel('#addSignature',t('addSignature'));buttonLabel('#addDate',t('date'));buttonLabel('#addText',t('text'));
      text('.viewer-status span',t('page'));buttonLabel('#undoBtn',t('undo'));buttonLabel('#changeFile',t('changeFile'));
      text('.export-copy strong',t('ready'));text('.export-copy span',t('newCopy'));buttonLabel('#exportPdf',t('createSigned'));
      text('#resultPanel h2',t('fileReady'));text('#resultPanel p',t('fileReadyDesc'));buttonLabel('#shareResult',t('share'));buttonLabel('#downloadResult',t('download'));buttonLabel('#backToEdit',t('back'));
      text('.footer-copy p',t('role'));
      text('#signatureTitle',t('yourSignature'));q('#closeSignature')?.setAttribute('aria-label',t('close'));
      document.querySelectorAll('[data-sig-tab]').forEach(tab=>{if(tab.dataset.sigTab==='saved')setText(tab,t('saved'));if(tab.dataset.sigTab==='upload')setText(tab,t('uploadImage'));if(tab.dataset.sigTab==='draw')setText(tab,t('drawSignature'))});
      buttonLabel('#deleteSavedSignature',t('deleteSignature'));text('[data-sig-pane="upload"] .upload-label strong',t('chooseSignatureImage'));text('[data-sig-pane="upload"] .upload-label small',t('imagePrep'));buttonLabel('#clearSignature',t('clearDrawing'));
      text('#textTitle',t('addText'));q('#closeText')?.setAttribute('aria-label',t('close'));const input=q('#textInput');if(input)input.placeholder=t('textPlaceholder');text('#textModal .modal-foot small',t('textHelp'));buttonLabel('#confirmText',t('add'));
      updateSignatureState();updateFileInfo();updateSaveButton();
      const load=q('#loadingText');if(load){const key=loadingMap[load.textContent.trim()];if(key)setText(load,t(key))}
      applying=false;
    }

    function setLanguage(next){if(!copy[next])next='ar';lang=next;try{localStorage.setItem(STORAGE_KEY,lang)}catch{}applyStatic();document.dispatchEvent(new CustomEvent('waqqe:languagechange',{detail:{lang}}))}

    createSwitcher();
    try{lang=localStorage.getItem(STORAGE_KEY)||'ar'}catch{lang='ar'}

    const sig=q('#signatureState');if(sig)new MutationObserver(()=>{if(!applying)updateSignatureState()}).observe(sig,{attributes:true,childList:true,subtree:true});
    const saved=q('#savedSignatureBox');if(saved)new MutationObserver(()=>{if(!applying)updateSignatureState()}).observe(saved,{childList:true,subtree:true});
    const info=q('#fileInfo');if(info)new MutationObserver(()=>{if(!applying)updateFileInfo()}).observe(info,{childList:true,subtree:true});
    const toast=q('#toast');if(toast)new MutationObserver(()=>translateDynamicNode(toast,toastMap)).observe(toast,{childList:true,subtree:true});
    const loading=q('#loadingText');if(loading)new MutationObserver(()=>translateDynamicNode(loading,loadingMap)).observe(loading,{childList:true,subtree:true});

    q('#addSignature')?.addEventListener('click',()=>setTimeout(()=>{if(!q('#signatureModal')?.classList.contains('hidden')){saveMode='add';updateSaveButton()}},0));
    q('#manageSignature')?.addEventListener('click',()=>setTimeout(()=>{if(!q('#signatureModal')?.classList.contains('hidden')&&q('#signatureState')?.classList.contains('ready')){saveMode='save';updateSaveButton()}},0));
    q('#closeSignature')?.addEventListener('click',()=>{saveMode='save'});

    q('#addDate')?.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const input=q('#textInput'),confirm=q('#confirmText');if(!input||!confirm)return;
      input.value=new Intl.DateTimeFormat(LOCALE[lang]||LOCALE.ar,{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());confirm.click();
    },true);

    setLanguage(lang);
    window.WaqqeI18n={t:key=>t(key),getLang:()=>lang,setLang:setLanguage,locale:()=>LOCALE[lang]||LOCALE.ar};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else setTimeout(init,0);
})();
