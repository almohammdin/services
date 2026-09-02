const $=s=>document.querySelector(s);
const addSignature=$('#addSignature');
const manageSignature=$('#manageSignature');
const signatureState=$('#signatureState');
const signatureModal=$('#signatureModal');
const saveSignature=$('#saveSignature');
const savedSignatureBox=$('#savedSignatureBox');
const toast=$('#toast');
const signatureActionHint=$('#signatureActionHint');
let signatureAddMode=false;

const tr=(key,fallback)=>window.WaqqeI18n?.t?.(key)||fallback;
function signatureReady(){return !!signatureState?.classList.contains('ready')}
function syncSignatureActionHint(){
  if(!signatureActionHint)return;
  signatureActionHint.textContent=tr('dragSignature','سيظهر التوقيع داخل الصفحة لتضعه في مكانه');
  signatureActionHint.hidden=!signatureAddMode||!!signatureModal?.classList.contains('hidden');
}
function syncSignatureCopy(){
  if(!signatureState)return;
  const stateLabel=signatureState.querySelector('span');
  if(stateLabel){
    const value=signatureReady()?tr('signatureReady','التوقيع جاهز'):tr('signatureStart','أنشئ توقيعك للبدء');
    if(stateLabel.textContent!==value)stateLabel.textContent=value;
  }
  const manageLabel=manageSignature?.querySelector('span');
  if(manageLabel){
    const value=signatureReady()?tr('changeSignature','تغيير التوقيع'):tr('createSignature','إنشاء توقيع');
    if(manageLabel.textContent!==value)manageLabel.textContent=value;
  }
  const empty=savedSignatureBox?.querySelector('.signature-empty');
  if(empty){
    const value=tr('emptySignature','أنشئ توقيعك من الرسم أو أضف صورة.');
    if(empty.textContent!==value)empty.textContent=value;
  }
  syncSignatureActionHint();
}

signatureState&&new MutationObserver(syncSignatureCopy).observe(signatureState,{attributes:true,childList:true,subtree:true});
savedSignatureBox&&new MutationObserver(syncSignatureCopy).observe(savedSignatureBox,{childList:true,subtree:true});
signatureModal&&new MutationObserver(()=>{if(signatureModal.classList.contains('hidden'))signatureAddMode=false;syncSignatureActionHint()}).observe(signatureModal,{attributes:true,attributeFilter:['class']});
document.addEventListener('waqqe:languagechange',syncSignatureCopy);
syncSignatureCopy();

addSignature?.addEventListener('click',()=>{
  signatureAddMode=true;
  setTimeout(()=>{
    if(signatureModal&&!signatureModal.classList.contains('hidden')) saveSignature.textContent=tr('saveAdd','حفظ وإضافة للمستند');
    syncSignatureActionHint();
  },0);
});

manageSignature?.addEventListener('click',e=>{
  if(!signatureReady()){
    e.preventDefault();
    e.stopImmediatePropagation();
    addSignature?.click();
  }
},true);

manageSignature?.addEventListener('click',()=>{
  signatureAddMode=false;
  setTimeout(()=>{
    if(signatureModal&&!signatureModal.classList.contains('hidden')) saveSignature.textContent=tr('saveSignature','حفظ التوقيع');
    syncSignatureActionHint();
  },0);
});

toast&&new MutationObserver(()=>{
  if(toast.textContent.includes('تعذر حفظ التوقيع محليًا')) toast.textContent=tr('sessionSignature','سيستخدم التوقيع في الجلسة الحالية');
}).observe(toast,{childList:true,subtree:true});
