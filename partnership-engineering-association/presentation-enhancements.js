/* Funding/rights journeys: Anime.js. Detail navigation: Panzoom. */
(()=>{'use strict';
const stage=document.getElementById('stage'),viewport=document.getElementById('viewport'),panel=document.getElementById('annotationPanel');if(!stage||!panel)return;
const controls=document.createElement('div');controls.className='presentation-controls';controls.innerHTML='<div class="detail-zoom"><button type="button" data-detail="in" aria-label="تكبير التفاصيل">تكبير +</button><output id="detailScale">100%</output><button type="button" data-detail="out" aria-label="تصغير التفاصيل">تصغير −</button></div><div class="detail-actions"><button type="button" data-detail="pan" aria-pressed="false">تحريك الجزء المكبر</button><button type="button" data-detail="reset">استعادة العرض</button></div><button type="button" id="replayJourney">إعادة حركة الأموال والحقوق</button>';panel.insertBefore(controls,panel.querySelector('.annotation-help'));
const originalOverflow=viewport.style.overflow;
const zoom=Panzoom(stage,{minScale:1,maxScale:2.5,step:.3,disablePan:true,disableZoom:false,noBind:true,cursor:'',animate:false});let dragging=false;
viewport.style.overflow=originalOverflow;stage.style.touchAction="";viewport.style.touchAction="";stage.style.userSelect="";
function scaleLabel(){controls.querySelector('#detailScale').textContent=Math.round(zoom.getScale()*100)+'%'}
stage.addEventListener('panzoomchange',scaleLabel);
function pan(value){dragging=value;if(value)zoom.bind();else zoom.destroy();stage.style.touchAction=value?'none':'';viewport.style.touchAction=value?'none':'';zoom.setOptions({disablePan:!value,cursor:value?'grab':''});document.body.classList.toggle('detail-panning',value);controls.querySelector('[data-detail="pan"]').setAttribute('aria-pressed',String(value));if(value)panel.querySelector('[data-mode="browse"]').click()}
function reset(){pan(false);zoom.reset({animate:false});scaleLabel()}
controls.querySelector('[data-detail="in"]').onclick=()=>{zoom.zoomIn();scaleLabel()};controls.querySelector('[data-detail="out"]').onclick=()=>{zoom.zoomOut();scaleLabel();if(zoom.getScale()===1)pan(false)};controls.querySelector('[data-detail="pan"]').onclick=()=>{if(zoom.getScale()===1)zoom.zoom(1.5);pan(!dragging)};controls.querySelector('[data-detail="reset"]').onclick=reset;
// Panzoom excludes native buttons/inputs; intercept deck navigation only during explicit panning.
['click','touchstart','touchend'].forEach(type=>viewport.addEventListener(type,e=>{if(dragging&&!e.target.closest('button,input,select,a,summary'))e.stopImmediatePropagation()},true));
panel.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode!=='browse')pan(false)}));
let emphasis=null;let emphasisTimer;function clearEmphasis(){clearTimeout(emphasisTimer);if(emphasis){emphasis.remove();emphasis=null}}
function emphasize(){clearEmphasis();const slide=document.querySelector('.slide:not([hidden])');if(!slide)return;let target;const j=slide.querySelector('#jvScene'),p=slide.querySelector('#propertyScene'),r=slide.querySelector('#rightsScene');if(j){target=j.dataset.phase==='1'?document.getElementById('jvFunding'):j.dataset.phase==='3'?document.getElementById('jvReward'):j.querySelector('#jvFocusTitle')}else if(p){target=p.dataset.phase==='1'?p.querySelector('.vehicle-node h3'):p.dataset.phase==='3'?p.querySelector('.property-payout strong'):null}else if(r&&r.dataset.phase==='3'){target=r.querySelector('.share-result')}if(target&&target.getBoundingClientRect().height&&window.RoughNotation){emphasis=RoughNotation.annotate(target,{type:'underline',color:'#b47a2d',strokeWidth:2,padding:3,multiline:true,iterations:1,animationDuration:700,animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});emphasis.show()}}
let active=[];const liveScenes=[document.getElementById('jvScene'),document.getElementById('propertyScene')].filter(Boolean);let scheduled;
function cancel(){clearEmphasis();active.forEach(a=>a.pause());active=[];document.querySelectorAll('.journey-overlay').forEach(e=>e.remove());clearTimeout(scheduled)}
function point(scene,element){const r=scene.getBoundingClientRect(),e=element.getBoundingClientRect(),sx=scene.clientWidth/r.width,sy=scene.clientHeight/r.height;return {x:(e.left+e.width/2-r.left)*sx,y:(e.top+e.height/2-r.top)*sy}}
function journeys(scene){const step=+scene.dataset.phase;const $=s=>scene.querySelector(s);if(scene.id==='jvScene'){if(step===1)return [[$('.jv-funders'),$('.jv-company'),'5 ملايين · تمويل'],[$('.jv-company'),$('.jv-funders'),'أسهم وحقوق']];if(step===2)return [[$('.jv-company'),$('.jv-branches'),'تجهيز وتشغيل'],[$('.jv-owner'),$('.jv-branches'),'خبرة وتشغيل']];if(step===3)return [[$('.jv-company'),$('.jv-branches>div:last-child'),'حوافز الإدارة']];return []}
if(step===1)return [[$('.investors-node'),$('.vehicle-node'),'تمويل'],[$('.vehicle-node'),$('.investors-node'),'أسهم وحقوق'],[$('.vehicle-node'),$('.property-asset'),'تملك الأصل']];if(step===2)return [[$('.vehicle-node'),$('.developer-node'),'عقد وأتعاب'],[$('.developer-node'),$('.property-asset'),'تطوير']];if(step===3)return [[$('.property-asset'),$('.vehicle-node'),'حصيلة البيع'],[$('.vehicle-node'),$('.investors-node'),'توزيعات']];return []}
function currentScene(){return liveScenes.find(s=>!s.closest('.slide').hidden&&!s.hidden)}
function replay(){cancel();const scene=currentScene();const routes=scene?journeys(scene):[];controls.querySelector('#replayJourney').disabled=!routes.length;emphasisTimer=setTimeout(emphasize,1100);if(!routes.length)return;
const overlay=document.createElement('div');overlay.className='journey-overlay';overlay.setAttribute('aria-hidden','true');scene.append(overlay);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
routes.forEach(([from,to,label],index)=>{const a=point(scene,from),b=point(scene,to),token=document.createElement('div');token.className='journey-token';token.textContent=label;overlay.append(token);
const path=document.createElementNS('http://www.w3.org/2000/svg','svg');path.setAttribute('viewBox',`0 0 ${scene.clientWidth} ${scene.clientHeight}`);path.setAttribute('preserveAspectRatio','none');path.innerHTML=`<path d="M${a.x} ${a.y} L${b.x} ${b.y}"/>`;path.style.opacity='0';overlay.append(path);
if(reduced){token.style.transform=`translate(${(a.x+b.x)/2}px,${(a.y+b.y)/2}px)`;token.style.opacity='1';return}
const delay=index*1650;
active.push(anime.animate(path,{opacity:[0,.65,0],duration:1500,delay,ease:'linear'}));
active.push(anime.animate(token,{translateX:[a.x,b.x],translateY:[a.y,b.y],opacity:[{to:1,duration:150},{to:1,duration:1100},{to:0,duration:250}],duration:1500,delay,ease:'inOutSine',onComplete:()=>{token.remove();path.remove()}}));
});}
controls.querySelector('#replayJourney').onclick=replay;
function schedule(){cancel();reset();scheduled=setTimeout(replay,300)}
document.querySelectorAll('.slide').forEach(s=>new MutationObserver(schedule).observe(s,{attributes:true,attributeFilter:['hidden','data-step']}));liveScenes.forEach(s=>new MutationObserver(()=>{if(!s.closest('.slide').hidden)schedule()}).observe(s,{attributes:true,attributeFilter:['hidden']}));
['jvReward'].forEach(id=>{const e=document.getElementById(id);if(e)new MutationObserver(()=>{if(!e.closest('.slide').hidden){clearEmphasis();emphasisTimer=setTimeout(emphasize,80)}}).observe(e,{childList:true,characterData:true,subtree:true})});
window.addEventListener('resize',()=>{reset();cancel()});window.addEventListener('beforeprint',()=>{reset();cancel()});document.addEventListener('fullscreenchange',()=>{reset();cancel()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&zoom.getScale()>1){reset()}},true);schedule();
})();
