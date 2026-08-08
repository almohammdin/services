(() => {
  const LANGUAGE_NAMES={ar:'العربية',en:'English',fr:'Français',es:'Español',ur:'اردو',tr:'Türkçe',zh:'中文',ko:'한국어',hi:'हिन्दी'};
  const ORDER=['ar','en','fr','es','ur','tr','zh','ko','hi'];
  const LANG_KEY='waqqe_lang_v1';
  let cycleTimer=null;
  let cycleRunning=false;

  const q=s=>document.querySelector(s);
  const currentLang=()=>{
    try{return localStorage.getItem(LANG_KEY)||document.documentElement.lang||'ar'}catch{return document.documentElement.lang||'ar'}
  };
  const currentName=()=>LANGUAGE_NAMES[currentLang()]||LANGUAGE_NAMES.ar;

  function stopCycle(chip){
    if(cycleTimer){clearInterval(cycleTimer);cycleTimer=null}
    cycleRunning=false;
    if(chip){chip.classList.remove('changing');chip.textContent=currentName()}
  }

  function changeChip(chip,label){
    chip.classList.add('changing');
    setTimeout(()=>{chip.textContent=label;chip.classList.remove('changing')},130);
  }

  function startCycle(chip){
    if(!chip)return;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){stopCycle(chip);return}
    cycleRunning=true;
    let index=0;
    chip.textContent=LANGUAGE_NAMES[ORDER[index]];
    cycleTimer=setInterval(()=>{
      index+=1;
      if(index>=ORDER.length){stopCycle(chip);return}
      changeChip(chip,LANGUAGE_NAMES[ORDER[index]]);
    },1000);
  }

  function installLanguageHint(){
    const switcher=q('.language-switcher');
    const globe=switcher?.querySelector('.language-button');
    const menu=switcher?.querySelector('.language-menu');
    if(!switcher||!globe||!menu||q('.language-cycle-button'))return;

    const chip=document.createElement('button');
    chip.type='button';
    chip.className='language-cycle-button';
    chip.textContent=currentName();
    chip.setAttribute('aria-label',globe.getAttribute('aria-label')||'Languages');
    chip.title=globe.title||'';
    switcher.insertBefore(chip,globe);

    chip.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      stopCycle(chip);
      globe.click();
    });

    globe.addEventListener('click',()=>stopCycle(chip));
    menu.addEventListener('click',()=>stopCycle(chip));
    document.addEventListener('waqqe:languagechange',()=>stopCycle(chip));

    startCycle(chip);
  }

  function syncPrivacy(){
    const privacy=q('.footer-privacy');
    const i18n=window.WaqqeI18n;
    if(privacy&&i18n?.t)privacy.textContent=i18n.t('privacy');
  }

  function init(){
    installLanguageHint();
    syncPrivacy();
    document.addEventListener('waqqe:languagechange',syncPrivacy);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else setTimeout(init,0);
})();