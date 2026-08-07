const $=s=>document.querySelector(s);
const addSignature=$('#addSignature');
const manageSignature=$('#manageSignature');
const signatureState=$('#signatureState');
const signatureModal=$('#signatureModal');
const saveSignature=$('#saveSignature');
const savedSignatureBox=$('#savedSignatureBox');
const toast=$('#toast');

function signatureReady(){return !!signatureState?.classList.contains('ready')}
function syncSignatureCopy(){
  if(!signatureState)return;
  const stateLabel=signatureState.querySelector('span');
  if(stateLabel){
    const text=signatureReady()?'التوقيع جاهز':'أنشئ توقيعك للبدء';
    if(stateLabel.textContent!==text)stateLabel.textContent=text;
  }
  const manageLabel=manageSignature?.querySelector('span');
  if(manageLabel){
    const text=signatureReady()?'تغيير التوقيع':'إنشاء توقيع';
    if(manageLabel.textContent!==text)manageLabel.textContent=text;
  }
  const empty=savedSignatureBox?.querySelector('.signature-empty');
  if(empty)empty.innerHTML='أنشئ توقيعك من الرسم أو أضف صورة.';
}

signatureState&&new MutationObserver(syncSignatureCopy).observe(signatureState,{attributes:true,childList:true,subtree:true});
savedSignatureBox&&new MutationObserver(syncSignatureCopy).observe(savedSignatureBox,{childList:true,subtree:true});
syncSignatureCopy();

addSignature?.addEventListener('click',()=>{
  setTimeout(()=>{
    if(signatureModal&&!signatureModal.classList.contains('hidden')) saveSignature.textContent='حفظ وإضافة للمستند';
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
  setTimeout(()=>{
    if(signatureModal&&!signatureModal.classList.contains('hidden')) saveSignature.textContent='حفظ التوقيع';
  },0);
});

toast&&new MutationObserver(()=>{
  if(toast.textContent.includes('تعذر حفظ التوقيع محليًا')) toast.textContent='سيستخدم التوقيع في الجلسة الحالية';
}).observe(toast,{childList:true,subtree:true});
