import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const SIG_KEY='waqqe_signature_v2';
const LEGACY_SIG_KEY='waqqe_signature_v1';
const SIG_LIBRARY_KEY='waqqe_signatures_v3';
const STAMP_KEY='waqqe_stamp_v1';
const FONT_STACKS={
  craft:"NaifCraft, Tahoma, Arial, sans-serif",
  modern:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  classic:"Georgia, 'Times New Roman', serif",
  traditional:"'Times New Roman', Tahoma, serif"
};
const state={
  file:null,originalBytes:null,pdfjsDoc:null,pages:[],activePage:1,
  overlays:[],history:[],signatures:[],activeSignatureId:null,signature:null,uploadSignature:null,
  stamp:null,uploadStamp:null,
  signaturePad:null,pendingAddSignature:false,outputBlob:null,outputFile:null,
  pendingAddStamp:false,
  renderToken:0,observer:null
};

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const newId=prefix=>crypto.randomUUID?.()||(`${prefix}${Date.now()}${Math.random()}`);
const escapeHtml=t=>String(t).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const getSignatureColor=()=>window.WaqqeFeatures?.getSignatureColor?.()||'#102D43';
const getTextFont=()=>window.WaqqeFeatures?.getTextFont?.()||'craft';
const fontStack=key=>FONT_STACKS[key]||FONT_STACKS.craft;
const prefersReducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior=()=>prefersReducedMotion()?'auto':'smooth';
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2600)}
let placementHintTimer=0,placementHintCloseTimer=0,placementHintToken=0,placementHintKey='';
const placementFallback={dragSignature:'اسحب التوقيع إلى مكانه',dragStamp:'اسحب الختم إلى مكانه',itemAdded:'تمت الإضافة، يمكنك تحريكها'};
function syncPlacementHint(){
  const text=$('#placementHintText'),close=$('#dismissPlacementHint');
  if(text&&placementHintKey)text.textContent=window.WaqqeI18n?.t?.(placementHintKey)||placementFallback[placementHintKey]||placementFallback.itemAdded;
  close?.setAttribute('aria-label',window.WaqqeI18n?.t?.('close')||'إغلاق');
}
function showPlacementHint(key){
  const el=$('#placementHint');if(!el)return;
  placementHintKey=key;syncPlacementHint();clearTimeout(placementHintTimer);clearTimeout(placementHintCloseTimer);
  const token=++placementHintToken;el.classList.remove('hidden');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token===placementHintToken)el.classList.add('is-visible')}));
  placementHintTimer=setTimeout(()=>hidePlacementHint(),5000);
}
function hidePlacementHint(immediate=false){
  const el=$('#placementHint');if(!el)return;
  placementHintToken++;clearTimeout(placementHintTimer);clearTimeout(placementHintCloseTimer);el.classList.remove('is-visible');
  if(immediate||prefersReducedMotion()){el.classList.add('hidden');return}
  placementHintCloseTimer=setTimeout(()=>el.classList.add('hidden'),200);
}
$('#dismissPlacementHint')?.addEventListener('click',()=>hidePlacementHint());
document.addEventListener('waqqe:languagechange',syncPlacementHint);
function loading(on,text='جاري تجهيز الملف…'){$('#loadingText').textContent=text;$('#loading').classList.toggle('hidden',!on)}
function setStep(n){$$('.step').forEach(el=>{const s=+el.dataset.step;el.classList.toggle('active',s===n);el.classList.toggle('done',s<n)})}
function formatBytes(bytes){if(bytes<1024)return bytes+' B';if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';return(bytes/1048576).toFixed(1)+' MB'}
function outputName(){const name=(state.file?.name||'document.pdf').replace(/\.pdf$/i,'');return `${name}-signed.pdf`}
function updateUndo(){$('#undoBtn').disabled=!state.history.length}
function updateActivePageLabel(){$('#activePageLabel').textContent=`${state.activePage} / ${state.pdfjsDoc?.numPages||1}`}
function updateSignatureUi(){
  const ready=state.signatures.length>0, el=$('#signatureState');
  el.classList.toggle('ready',ready);
  el.querySelector('span').textContent=ready?`${state.signatures.length} توقيع محفوظ`:'لم يتم حفظ توقيع بعد';
  $('#deleteSavedSignature')?.classList.toggle('hidden',!ready);
  renderSavedSignature();
}
function persistSignatures(){
  try{
    localStorage.setItem(SIG_LIBRARY_KEY,JSON.stringify(state.signatures));
    localStorage.removeItem(SIG_KEY);localStorage.removeItem(LEGACY_SIG_KEY);
    return true;
  }catch{return false}
}
function selectSignature(id){
  const entry=state.signatures.find(x=>x.id===id)||state.signatures[0]||null;
  state.activeSignatureId=entry?.id||null;state.signature=entry?.data||null;
  persistSignatures();renderSavedSignature();updateSignatureUi();updateSaveButton();
}
function loadSavedSignature(){
  try{
    const parsed=JSON.parse(localStorage.getItem(SIG_LIBRARY_KEY)||'[]');
    state.signatures=Array.isArray(parsed)?parsed.filter(x=>x&&x.id&&/^data:image\//.test(x.data||'')):[];
    const legacy=localStorage.getItem(SIG_KEY)||localStorage.getItem(LEGACY_SIG_KEY)||null;
    if(!state.signatures.length&&legacy)state.signatures=[{id:newId('sig'),data:legacy,createdAt:Date.now()}];
    state.activeSignatureId=state.signatures[0]?.id||null;state.signature=state.signatures[0]?.data||null;
    persistSignatures();
  }catch{state.signatures=[];state.activeSignatureId=null;state.signature=null}
  updateSignatureUi();
}
function renderSavedSignature(){
  const box=$('#savedSignatureBox'); if(!box)return;
  box.innerHTML=state.signatures.length
    ? state.signatures.map((entry,index)=>`<button class="signature-choice${entry.id===state.activeSignatureId?' active':''}" type="button" data-signature-id="${escapeHtml(entry.id)}" aria-label="توقيع ${index+1}"><img src="${entry.data}" alt="توقيع محفوظ ${index+1}"><span class="choice-check">✓</span></button>`).join('')
    : '<div class="signature-empty">لا توجد توقيعات محفوظة على هذا الجهاز.<br>ارفع صورة أو ارسم توقيعًا جديدًا.</div>';
}
$('#savedSignatureBox').addEventListener('click',e=>{const choice=e.target.closest('[data-signature-id]');if(choice)selectSignature(choice.dataset.signatureId)});

function updateStampUi(){
  const ready=!!state.stamp,el=$('#stampState');
  el.classList.toggle('ready',ready);el.querySelector('span').textContent=ready?'الختم محفوظ وجاهز':'لم يتم حفظ ختم بعد';
  $('#deleteSavedStamp')?.classList.toggle('hidden',!ready);renderSavedStamp();
}
function loadSavedStamp(){try{state.stamp=localStorage.getItem(STAMP_KEY)||null}catch{state.stamp=null}updateStampUi()}
function renderSavedStamp(){
  const box=$('#savedStampBox');if(!box)return;
  box.innerHTML=state.stamp?`<img class="saved-preview stamp-preview" src="${state.stamp}" alt="الختم المحفوظ">`:'<div class="signature-empty">لا يوجد ختم محفوظ على هذا الجهاز.<br>ارفع صورة ختم لإضافتها إلى المستند.</div>';
}

$('#pickPdf').addEventListener('click',()=>$('#pdfInput').click());
$('#changeFile').addEventListener('click',()=>$('#pdfInput').click());
$('#pdfInput').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)openPdf(f);e.target.value=''});
const drop=$('#dropZone');
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));
drop.addEventListener('drop',e=>{const f=[...e.dataTransfer.files].find(x=>x.type==='application/pdf'||/\.pdf$/i.test(x.name));f?openPdf(f):toast('اختر ملف PDF')});

async function openPdf(file){
  loading(true,'جاري فتح ملف PDF…');
  try{
    if(file.size>80*1024*1024){toast('الملف كبير جدًا لهذه النسخة');return}
    const bytes=new Uint8Array(await file.arrayBuffer());
    const doc=await pdfjsLib.getDocument({data:bytes.slice()}).promise;
    hidePlacementHint(true);state.file=file;state.originalBytes=bytes;state.pdfjsDoc=doc;state.pages=[];state.activePage=1;
    state.overlays=[];state.history=[];state.outputBlob=null;state.outputFile=null;
    $('#fileName').textContent=file.name;
    $('#fileInfo').textContent=`${formatBytes(file.size)} · ${doc.numPages} صفحة`;
    $('#uploadPanel').classList.add('hidden');$('#resultPanel').classList.add('hidden');$('#workspace').classList.remove('hidden');
    setStep(2);await renderPdf();updateUndo();updateActivePageLabel();
    $('#workspace').scrollIntoView({behavior:scrollBehavior(),block:'start'});
  }catch(err){console.error(err);toast('تعذر فتح الملف. قد يكون محميًا أو تالفًا.')}finally{loading(false)}
}

async function renderPdf(){
  if(!state.pdfjsDoc)return;
  const token=++state.renderToken, stage=$('#pdfStage');
  state.observer?.disconnect();
  stage.innerHTML='';state.pages=[];
  const maxWidth=Math.min(900,Math.max(280,stage.clientWidth-28));
  for(let n=1;n<=state.pdfjsDoc.numPages;n++){
    if(token!==state.renderToken)return;
    const page=await state.pdfjsDoc.getPage(n);
    const unit=page.getViewport({scale:1});
    const scale=maxWidth/unit.width;
    const viewport=page.getViewport({scale});
    const wrap=document.createElement('div');
    wrap.className='page-frame'+(n===state.activePage?' active':'');wrap.dataset.page=n;
    wrap.style.width=viewport.width+'px';wrap.style.height=viewport.height+'px';
    const canvas=document.createElement('canvas'),dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.floor(viewport.width*dpr);canvas.height=Math.floor(viewport.height*dpr);
    canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
    const ctx=canvas.getContext('2d',{alpha:false});
    await page.render({canvasContext:ctx,viewport,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null}).promise;
    const layer=document.createElement('div');layer.className='overlay-layer';layer.dataset.page=n;
    wrap.append(canvas,layer);stage.appendChild(wrap);
    state.pages[n-1]={page,viewport,width:viewport.width,height:viewport.height,rotation:viewport.rotation,wrapper:wrap,layer};
    wrap.addEventListener('pointerdown',e=>{if(e.target===layer||e.target===canvas){setActivePage(n);selectOverlay(null)}});
  }
  state.overlays.forEach(renderOverlay);
  setupPageObserver();
}
function setupPageObserver(){
  if(!('IntersectionObserver' in window))return;
  const root=$('#pdfStage');
  state.observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible?.intersectionRatio>.28)setActivePage(+visible.target.dataset.page);
  },{root,threshold:[.28,.45,.65]});
  $$('.page-frame').forEach(el=>state.observer.observe(el));
}
function setActivePage(n){
  state.activePage=n;
  $$('.page-frame').forEach(x=>x.classList.toggle('active',+x.dataset.page===n));
  updateActivePageLabel();
}
function cleanOverlay(o){const {el,...safe}=o;return safe}
function pushHistory(){state.history.push(JSON.stringify(state.overlays.map(cleanOverlay)));if(state.history.length>30)state.history.shift();updateUndo()}
function clearOverlayEls(){$$('.overlay-item').forEach(el=>el.remove())}
$('#undoBtn').addEventListener('click',()=>{
  if(!state.history.length)return;
  state.overlays=JSON.parse(state.history.pop());clearOverlayEls();state.overlays.forEach(renderOverlay);updateUndo();selectOverlay(null);
});

async function imageAspect(src){
  return new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im.naturalWidth/Math.max(1,im.naturalHeight));im.onerror=()=>resolve(2.5);im.src=src});
}
function hexRgb(hex){
  const value=String(hex||'#102D43').replace('#','').trim();
  const full=value.length===3?value.split('').map(x=>x+x).join(''):value.padEnd(6,'0').slice(0,6);
  return [parseInt(full.slice(0,2),16),parseInt(full.slice(2,4),16),parseInt(full.slice(4,6),16)];
}
async function tintSignature(src,color){
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
  const c=document.createElement('canvas');c.width=Math.max(1,img.naturalWidth);c.height=Math.max(1,img.naturalHeight);
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);
  const data=ctx.getImageData(0,0,c.width,c.height),d=data.data,[r,g,b]=hexRgb(color);
  for(let k=0;k<d.length;k+=4){if(d[k+3]>0){d[k]=r;d[k+1]=g;d[k+2]=b}}
  ctx.putImageData(data,0,0);return c.toDataURL('image/png');
}
$('#addSignature').addEventListener('click',async()=>{
  if(!state.signature){openSignatureModal('draw',true);return}
  await addSignatureOverlay(state.signature);
});
$('#addStamp').addEventListener('click',async()=>{
  if(!state.stamp){openStampModal('upload',true);return}
  await addStampOverlay(state.stamp);
});
$('#addDate').addEventListener('click',()=>{
  const now=new Date();
  const greg=new Intl.DateTimeFormat('ar-SA-u-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const hijri=new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  addTextOverlay('date',`${greg} | ${hijri}`);
});
$('#addText').addEventListener('click',()=>{$('#textInput').value='';$('#textModal').classList.remove('hidden');setTimeout(()=>$('#textInput').focus(),80)});
$('#closeText').addEventListener('click',()=>$('#textModal').classList.add('hidden'));
$('#confirmText').addEventListener('click',()=>{const t=$('#textInput').value.trim();if(!t){toast('اكتب النص أولًا');return}$('#textModal').classList.add('hidden');addTextOverlay('text',t)});
$('#textInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#confirmText').click()});
async function addSignatureOverlay(src){
  const page=state.pages[state.activePage-1];if(!page)return;
  pushHistory();
  const coloredSrc=await tintSignature(src,getSignatureColor());
  const aspect=clamp(await imageAspect(coloredSrc),.2,10);
  const {nw,nh}=initialImageSize(page,aspect,.20,.015,.26);
  const o={id:newId('o'),type:'signature',page:state.activePage,nx:(1-nw)/2,ny:(1-nh)/2,nw,nh,aspect,src:coloredSrc};
  state.overlays.push(o);renderOverlay(o,true);selectOverlay(o.id);showPlacementHint('dragSignature');revealOverlay(o);
}
async function addStampOverlay(src){
  const page=state.pages[state.activePage-1];if(!page)return;
  pushHistory();
  const aspect=clamp(await imageAspect(src),.55,5);
  const {nw,nh}=initialImageSize(page,aspect,.18,.035,.28);
  const o={id:newId('o'),type:'stamp',page:state.activePage,nx:(1-nw)/2,ny:(1-nh)/2,nw,nh,aspect,src};
  state.overlays.push(o);renderOverlay(o,true);selectOverlay(o.id);showPlacementHint('dragStamp');revealOverlay(o);
}
function initialImageSize(page,aspect,preferredWidth,minHeight,maxHeight){
  let nw=preferredWidth,nh=nw*(page.width/page.height)/aspect;
  if(nh<minHeight){nh=minHeight;nw=nh*(page.height/page.width)*aspect}
  if(nh>maxHeight){nh=maxHeight;nw=nh*(page.height/page.width)*aspect}
  if(nw>.62){nw=.62;nh=nw*(page.width/page.height)/aspect}
  return{nw,nh};
}
function revealOverlay(o){
  requestAnimationFrame(()=>{
    const el=o.el,stage=$('#pdfStage');if(!el||!stage)return;
    const itemRect=el.getBoundingClientRect(),stageRect=stage.getBoundingClientRect();
    const outside=itemRect.top<stageRect.top||itemRect.bottom>stageRect.bottom||itemRect.left<stageRect.left||itemRect.right>stageRect.right;
    if(window.innerWidth<=850||outside)el.scrollIntoView({behavior:scrollBehavior(),block:'center',inline:'center'});
  });
}
function addTextOverlay(type,text){
  const page=state.pages[state.activePage-1];if(!page)return;
  pushHistory();const pxW=Math.min(type==='date'?390:300,Math.max(type==='date'?180:120,text.length*12));
  const nw=clamp(pxW/page.width,type==='date'?.24:.16,type==='date'?.62:.48),nh=clamp(42/page.height,.035,.085);
  const fontKey=type==='text'?getTextFont():'modern';
  const o={id:newId('o'),type,page:state.activePage,nx:(1-nw)/2,ny:(1-nh)/2,nw,nh,text,fontKey};
  state.overlays.push(o);renderOverlay(o,true);selectOverlay(o.id);showPlacementHint('itemAdded');revealOverlay(o);
}
function renderOverlay(o,animate=false){
  const page=state.pages[o.page-1];if(!page)return;
  const el=document.createElement('div');el.className='overlay-item'+(animate?' is-entering':'');el.dataset.id=o.id;el.dataset.type=o.type;
  if(o.type==='signature'||o.type==='stamp')el.innerHTML=`<img src="${o.src}" alt="${o.type==='stamp'?'ختم':'توقيع'}"><button class="overlay-delete" type="button" aria-label="حذف">×</button><i class="overlay-handle"></i>`;
  else{
    el.innerHTML=`<div class="overlay-text">${escapeHtml(o.text)}</div><button class="overlay-delete" type="button" aria-label="حذف">×</button><i class="overlay-handle"></i>`;
    el.querySelector('.overlay-text').style.fontFamily=fontStack(o.fontKey);
  }
  page.layer.appendChild(el);o.el=el;applyOverlay(o);wireOverlay(o,el);
  if(animate)requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove('is-entering')));
}
function applyOverlay(o){
  if(!o.el)return;const page=state.pages[o.page-1];if(!page)return;
  o.el.style.left=(o.nx*page.width)+'px';o.el.style.top=(o.ny*page.height)+'px';
  o.el.style.width=(o.nw*page.width)+'px';o.el.style.height=(o.nh*page.height)+'px';
}
function wireOverlay(o,el){
  el.addEventListener('pointerdown',e=>{
    if(e.target.classList.contains('overlay-delete')||e.target.classList.contains('overlay-handle'))return;
    e.preventDefault();hidePlacementHint();selectOverlay(o.id);setActivePage(o.page);pushHistory();
    const page=state.pages[o.page-1],r=page.layer.getBoundingClientRect();
    const sx=e.clientX,sy=e.clientY,startX=o.nx*r.width,startY=o.ny*r.height;
    let nextX=startX,nextY=startY;
    el.classList.add('is-dragging');el.setPointerCapture(e.pointerId);
    const move=ev=>{
      nextX=clamp(startX+(ev.clientX-sx),0,r.width-o.nw*r.width);nextY=clamp(startY+(ev.clientY-sy),0,r.height-o.nh*r.height);
      el.style.transform=`translate3d(${nextX-startX}px,${nextY-startY}px,0)`;
    };
    const up=()=>{
      el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
      o.nx=nextX/r.width;o.ny=nextY/r.height;el.classList.remove('is-dragging');el.style.transform='';applyOverlay(o);
    };
    el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  });
  const handle=el.querySelector('.overlay-handle');
  handle.addEventListener('pointerdown',e=>{
    e.stopPropagation();e.preventDefault();hidePlacementHint();selectOverlay(o.id);pushHistory();
    const page=state.pages[o.page-1],sx=e.clientX,sy=e.clientY,ow=o.nw*page.width,oh=o.nh*page.height;
    el.classList.add('is-resizing');handle.setPointerCapture(e.pointerId);
    const move=ev=>{
      const maxW=page.width-o.nx*page.width,maxH=page.height-o.ny*page.height;
      const isImage=o.type==='signature'||o.type==='stamp',minW=isImage?22:70;
      let nwPx=clamp(ow+(ev.clientX-sx),minW,maxW),nhPx;
      if(isImage){nhPx=nwPx/(o.aspect||2.5);if(nhPx>maxH){nhPx=maxH;nwPx=nhPx*(o.aspect||2.5)}}
      else nhPx=clamp(oh+(ev.clientY-sy),30,maxH);
      o.nw=nwPx/page.width;o.nh=nhPx/page.height;applyOverlay(o);
    };
    const up=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',up);el.classList.remove('is-resizing')};
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',up);
  });
  el.querySelector('.overlay-delete').addEventListener('click',e=>{e.stopPropagation();pushHistory();state.overlays=state.overlays.filter(x=>x.id!==o.id);el.remove();selectOverlay(null)});
}
function selectOverlay(id){$$('.overlay-item').forEach(el=>el.classList.toggle('selected',el.dataset.id===id))}

$('#manageSignature').addEventListener('click',()=>openSignatureModal(state.signature?'saved':'draw',false));
$('#closeSignature').addEventListener('click',closeSignatureModal);
$('#signatureModal').addEventListener('pointerdown',e=>{if(e.target===$('#signatureModal'))closeSignatureModal()});
$$('[data-sig-tab]').forEach(btn=>btn.addEventListener('click',()=>switchSigTab(btn.dataset.sigTab)));
function openSignatureModal(tab='saved',addAfter=false){state.pendingAddSignature=addAfter;$('#signatureModal').classList.remove('hidden');switchSigTab(tab);setTimeout(resizeSignatureCanvas,30)}
function closeSignatureModal(){$('#signatureModal').classList.add('hidden');state.uploadSignature=null;$('#uploadPreviewBox').classList.add('hidden')}
function switchSigTab(tab){$$('[data-sig-tab]').forEach(b=>b.classList.toggle('active',b.dataset.sigTab===tab));$$('[data-sig-pane]').forEach(p=>p.classList.toggle('hidden',p.dataset.sigPane!==tab));$('#saveSignature').dataset.mode=tab;renderSavedSignature();if(tab==='draw')setTimeout(resizeSignatureCanvas,20);updateSaveButton()}
function initSignaturePad(){if(state.signaturePad)return;state.signaturePad=new SignaturePad($('#signatureCanvas'),{minWidth:1.1,maxWidth:2.8,penColor:getSignatureColor(),backgroundColor:'rgba(0,0,0,0)'});state.signaturePad.addEventListener?.('endStroke',updateSaveButton)}
function resizeSignatureCanvas(){
  initSignaturePad();const c=$('#signatureCanvas'),ratio=Math.max(window.devicePixelRatio||1,1),rect=c.getBoundingClientRect();if(!rect.width)return;
  const data=state.signaturePad.isEmpty()?null:state.signaturePad.toData();c.width=Math.round(rect.width*ratio);c.height=Math.round(210*ratio);c.getContext('2d').scale(ratio,ratio);if(data)state.signaturePad.fromData(data);
}
$('#clearSignature').addEventListener('click',()=>{state.signaturePad?.clear();updateSaveButton()});
document.addEventListener('waqqe:signaturecolorchange',e=>{if(state.signaturePad&&e.detail?.color)state.signaturePad.penColor=e.detail.color});
async function dataUrlToPreparedPng(dataUrl){
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=dataUrl});
  const scale=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight));
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);
  const data=ctx.getImageData(0,0,c.width,c.height),d=data.data;
  let minX=c.width,minY=c.height,maxX=-1,maxY=-1;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const k=(y*c.width+x)*4,r=d[k],g=d[k+1],b=d[k+2];
    const hi=Math.min(r,g,b),lo=Math.max(r,g,b),neutral=(lo-hi)<22;
    if(neutral&&hi>242){d[k+3]=0}else if(neutral&&hi>218){d[k+3]=Math.round(d[k+3]*(242-hi)/24)}
    if(d[k+3]>18){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
  }
  ctx.putImageData(data,0,0);
  if(maxX<minX||maxY<minY)return c.toDataURL('image/png');
  const pad=Math.max(4,Math.round(Math.min(c.width,c.height)*.025));
  minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(c.width-1,maxX+pad);maxY=Math.min(c.height-1,maxY+pad);
  const out=document.createElement('canvas');out.width=maxX-minX+1;out.height=maxY-minY+1;out.getContext('2d').drawImage(c,minX,minY,out.width,out.height,0,0,out.width,out.height);
  return out.toDataURL('image/png');
}
$('#signatureUpload').addEventListener('change',e=>{
  const f=e.target.files?.[0];if(!f)return;
  if(!/^image\/(png|jpeg|webp)$/i.test(f.type)){toast('استخدم PNG أو JPG أو WebP');e.target.value='';return}
  const r=new FileReader();
  r.onload=async()=>{try{state.uploadSignature=await dataUrlToPreparedPng(r.result);$('#uploadPreview').src=state.uploadSignature;$('#uploadPreviewBox').classList.remove('hidden');updateSaveButton();toast('تم تجهيز صورة التوقيع')}catch(err){console.error(err);toast('تعذر قراءة صورة التوقيع')}};
  r.readAsDataURL(f);e.target.value='';
});
function updateSaveButton(){const mode=$('#saveSignature').dataset.mode||'saved';const ok=mode==='saved'?!!state.signature:mode==='upload'?!!state.uploadSignature:!!state.signaturePad&&!state.signaturePad.isEmpty();$('#saveSignature').disabled=!ok}
$('#saveSignature').addEventListener('click',async()=>{
  const mode=$('#saveSignature').dataset.mode;let data;
  try{
    if(mode==='saved')data=state.signature;
    else if(mode==='upload')data=state.uploadSignature;
    else if(state.signaturePad&&!state.signaturePad.isEmpty())data=await dataUrlToPreparedPng(state.signaturePad.toDataURL('image/png'));
  }catch(err){console.error(err)}
  if(!data)return;
  const shouldAdd=state.pendingAddSignature;
  let entry=state.signatures.find(x=>x.data===data);
  if(!entry){entry={id:newId('sig'),data,createdAt:Date.now()};state.signatures.push(entry)}
  state.activeSignatureId=entry.id;state.signature=entry.data;
  if(!persistSignatures())toast('تعذر حفظ التوقيع محليًا، سيبقى لهذه الجلسة فقط');
  updateSignatureUi();closeSignatureModal();state.pendingAddSignature=false;toast('تم حفظ التوقيع');
  if(shouldAdd&&state.pdfjsDoc)await addSignatureOverlay(data);
});
$('#deleteSavedSignature').addEventListener('click',()=>{
  if(!state.activeSignatureId)return;
  state.signatures=state.signatures.filter(x=>x.id!==state.activeSignatureId);
  const next=state.signatures[0]||null;state.activeSignatureId=next?.id||null;state.signature=next?.data||null;
  try{localStorage.removeItem(LEGACY_SIG_KEY)}catch{}
  persistSignatures();updateSignatureUi();
  if(!state.signatures.length)switchSigTab('draw');
  toast('تم حذف التوقيع المحفوظ');
});

$('#manageStamp').addEventListener('click',()=>openStampModal(state.stamp?'saved':'upload',false));
$('#closeStamp').addEventListener('click',closeStampModal);
$('#stampModal').addEventListener('pointerdown',e=>{if(e.target===$('#stampModal'))closeStampModal()});
$$('[data-stamp-tab]').forEach(btn=>btn.addEventListener('click',()=>switchStampTab(btn.dataset.stampTab)));
function openStampModal(tab='saved',addAfter=false){state.pendingAddStamp=addAfter;$('#stampModal').classList.remove('hidden');switchStampTab(tab)}
function closeStampModal(){$('#stampModal').classList.add('hidden');state.uploadStamp=null;$('#stampPreviewBox').classList.add('hidden')}
function switchStampTab(tab){
  $$('[data-stamp-tab]').forEach(b=>b.classList.toggle('active',b.dataset.stampTab===tab));
  $$('[data-stamp-pane]').forEach(p=>p.classList.toggle('hidden',p.dataset.stampPane!==tab));
  $('#saveStamp').dataset.mode=tab;renderSavedStamp();updateStampSaveButton();
}
function updateStampSaveButton(){const mode=$('#saveStamp').dataset.mode||'saved';$('#saveStamp').disabled=mode==='saved'?!state.stamp:!state.uploadStamp}
$('#stampUpload').addEventListener('change',e=>{
  const f=e.target.files?.[0];if(!f)return;
  if(!/^image\/(png|jpeg|webp)$/i.test(f.type)){toast('استخدم PNG أو JPG أو WebP');e.target.value='';return}
  const r=new FileReader();
  r.onload=async()=>{try{state.uploadStamp=await dataUrlToPreparedPng(r.result);$('#stampPreview').src=state.uploadStamp;$('#stampPreviewBox').classList.remove('hidden');updateStampSaveButton();toast('تم تجهيز صورة الختم')}catch(err){console.error(err);toast('تعذر قراءة صورة الختم')}};
  r.readAsDataURL(f);e.target.value='';
});
$('#saveStamp').addEventListener('click',async()=>{
  const data=$('#saveStamp').dataset.mode==='upload'?state.uploadStamp:state.stamp;if(!data)return;
  const shouldAdd=state.pendingAddStamp;state.stamp=data;
  try{localStorage.setItem(STAMP_KEY,data)}catch{toast('تعذر حفظ الختم محليًا، سيبقى لهذه الجلسة فقط')}
  updateStampUi();closeStampModal();state.pendingAddStamp=false;toast('تم حفظ الختم');
  if(shouldAdd&&state.pdfjsDoc)await addStampOverlay(data);
});
$('#deleteSavedStamp').addEventListener('click',()=>{
  state.stamp=null;try{localStorage.removeItem(STAMP_KEY)}catch{}
  updateStampUi();switchStampTab('upload');toast('تم حذف الختم المحفوظ');
});

async function textToPng(text,width,height,fontKey='craft'){
  await document.fonts.ready;const scale=2,c=document.createElement('canvas');c.width=Math.ceil(width*scale);c.height=Math.ceil(height*scale);const ctx=c.getContext('2d');ctx.scale(scale,scale);ctx.clearRect(0,0,width,height);ctx.fillStyle='#172A38';ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction=document.documentElement.dir==='ltr'?'ltr':'rtl';ctx.font=`600 ${Math.max(13,Math.min(24,height*.48))}px ${fontStack(fontKey)}`;ctx.fillText(text,width/2,height/2,width-8);return c.toDataURL('image/png');
}
function drawOverlayOnPage(pdfPage,img,o,meta){
  const vp=meta.viewport;
  const left=o.nx*vp.width,top=o.ny*vp.height,right=(o.nx+o.nw)*vp.width,bottom=(o.ny+o.nh)*vp.height;
  const [cx,cy]=vp.convertToPdfPoint(left,bottom);
  const [dx,dy]=vp.convertToPdfPoint(right,bottom);
  const [ax,ay]=vp.convertToPdfPoint(left,top);
  const width=Math.hypot(dx-cx,dy-cy),height=Math.hypot(ax-cx,ay-cy);
  const angle=Math.atan2(dy-cy,dx-cx)*180/Math.PI;
  pdfPage.drawImage(img,{x:cx,y:cy,width,height,rotate:PDFLib.degrees(angle)});
}
async function createSignedPdf(){
  if(!state.originalBytes)return;
  if(!state.overlays.length){toast('أضف التوقيع أو عنصرًا إلى المستند أولًا');return}
  loading(true,'جاري تثبيت العناصر داخل PDF…');
  try{
    const pdfDoc=await PDFLib.PDFDocument.load(state.originalBytes.slice(),{ignoreEncryption:false}),pages=pdfDoc.getPages();
    for(const o of state.overlays){
      const p=pages[o.page-1];if(!p)continue;let src=o.src;
      if(o.type!=='signature'&&o.type!=='stamp'){
        const meta=state.pages[o.page-1],w=o.nw*meta.width,h=o.nh*meta.height;src=await textToPng(o.text,w,h,o.fontKey);
      }
      const img=/^data:image\/jpe?g/i.test(src)?await pdfDoc.embedJpg(src):await pdfDoc.embedPng(src);
      drawOverlayOnPage(p,img,o,state.pages[o.page-1]);
    }
    const out=await pdfDoc.save();state.outputBlob=new Blob([out],{type:'application/pdf'});state.outputFile=new File([state.outputBlob],outputName(),{type:'application/pdf'});
    $('#resultName').textContent=state.outputFile.name;$('#resultInfo').textContent=formatBytes(state.outputFile.size);
    hidePlacementHint(true);$('#resultPanel').classList.remove('hidden');$('#workspace').classList.add('hidden');setStep(3);$('#resultPanel').scrollIntoView({behavior:scrollBehavior(),block:'center'});toast('تم إنشاء الملف الموقع');
  }catch(err){console.error(err);toast('تعذر إنشاء الملف. قد يكون PDF محميًا ضد التعديل.')}finally{loading(false)}
}
$('#exportPdf').addEventListener('click',createSignedPdf);
$('#shareResult').addEventListener('click',shareOutput);
$('#downloadResult').addEventListener('click',downloadOutput);
$('#backToEdit').addEventListener('click',startOver);
function startOver(){
  hidePlacementHint(true);
  state.observer?.disconnect();state.renderToken++;
  Promise.resolve(state.pdfjsDoc?.destroy?.()).catch(()=>{});
  state.file=null;state.originalBytes=null;state.pdfjsDoc=null;state.pages=[];state.activePage=1;
  state.overlays=[];state.history=[];state.outputBlob=null;state.outputFile=null;
  $('#pdfInput').value='';$('#pdfStage').innerHTML='';$('#fileName').textContent='—';$('#fileInfo').textContent='—';
  $('#resultPanel').classList.add('hidden');$('#workspace').classList.add('hidden');$('#uploadPanel').classList.remove('hidden');
  updateUndo();updateActivePageLabel();setStep(1);$('#uploadPanel').scrollIntoView({behavior:scrollBehavior(),block:'center'});
}
async function shareOutput(){
  if(!state.outputFile){await createSignedPdf();if(!state.outputFile)return}
  try{
    if(navigator.share&&navigator.canShare?.({files:[state.outputFile]})) await navigator.share({files:[state.outputFile],title:'ملف موقع'});
    else{downloadOutput();toast('تم تنزيل الملف. أرفقه في واتساب أو البريد.')}
  }catch(err){if(err?.name!=='AbortError'){downloadOutput();toast('تم تنزيل الملف بدل المشاركة')}}
}
function downloadOutput(){if(!state.outputBlob)return;const url=URL.createObjectURL(state.outputBlob),a=document.createElement('a');a.href=url;a.download=outputName();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500)}

let resizeTimer;
window.addEventListener('resize',()=>{
  clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(state.pdfjsDoc&&$('#workspace')&&!$('#workspace').classList.contains('hidden'))renderPdf();if(!$('#signatureModal').classList.contains('hidden'))resizeSignatureCanvas()},260);
});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSignatureModal();closeStampModal();$('#textModal').classList.add('hidden')}});
loadSavedSignature();
loadSavedStamp();
