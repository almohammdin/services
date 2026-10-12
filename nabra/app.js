import {METERS,strip,skeleton,splitPoem,analyze,extendWord,inferPoem} from './prosody.js?v=2';
import {planLayout} from './layout.js?v=2';
const $=id=>document.getElementById(id), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults={poem:'',poemTitle:'',author:'',genre:'auto',meter:'auto',ending:'saturate',reference:'',locked:'',intent:'',theme:'paper',format:'content',layout:'auto',fontSize:64,lineGap:1.65,columnGap:60,stretch:2,equalize:true,showPattern:true,showBrand:true,transparent:false,showDiacritics:true,manual:{}};
let state={...defaults},revision=0,fontsReady=false,formatted=[],imageOverflow=false,saveTimer,toastTimer,busy=false;const history=[];
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}}};
state={...defaults,...storage.get('nabra-current-v1',{}),manual:storage.get('nabra-current-v1',{}).manual||{}};
if(!storage.get('nabra-layout-v2',false)){state.format='content';state.layout='auto';state.fontSize=64;state.lineGap=1.65;storage.set('nabra-layout-v2',true);}
const themes={paper:{bg:'#f5f0e6',ink:'#382847',accent:'#aa6854',muted:'#8d7889'},ink:{bg:'#382847',ink:'#f6efe3',accent:'#d4aa86',muted:'#ad93ab'},clay:{bg:'#b76b57',ink:'#fff4e5',accent:'#f4d2a7',muted:'#ebbeaa'},sage:{bg:'#dbe2cf',ink:'#354e40',accent:'#6a7960',muted:'#768776'},night:{bg:'#202b35',ink:'#f1ece2',accent:'#c19c75',muted:'#8d9ca9'}};
for(const m of METERS)$('meter').add(new Option(m.name,m.name));
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4000);}
function syncUI(){for(const key of Object.keys(defaults)){const el=$(key);if(!el)continue;if(el.type==='checkbox')el.checked=!!state[key];else el.value=state[key];}document.querySelectorAll('[data-theme]').forEach(b=>{b.classList.toggle('active',b.dataset.theme===state.theme);b.setAttribute('aria-pressed',b.dataset.theme===state.theme);});update();}
function pushHistory(){history.push(JSON.stringify(state));if(history.length>30)history.shift();}
function changed(key,value){state[key]=value;revision++;if(['poem','genre','meter','reference','ending'].includes(key)){discoveryCache=null;$('discovery').replaceChildren();}if(key==='poem'){state.manual={};$('suggestions').replaceChildren();$('analysis').innerHTML='<div class="notice">تغير النص. افحص الوزن لعرض نتيجة محدثة.</div>';}update();}
function update(){['fontSize','lineGap','columnGap','stretch'].forEach(k=>$(k+'Out').value=state[k]);const v=splitPoem(state.poem);$('lineCount').textContent=v.length+' أبيات';$('draftCount').textContent=storage.get('nabra-drafts-v1',[]).length;const prev=$('wordPick').value;$('wordPick').replaceChildren();v.forEach((a,i)=>a.forEach((s,j)=>s.split(/\s+/).filter(Boolean).forEach((w,k)=>$('wordPick').add(new Option(`${i+1} · ${strip(w)}`,`${i}-${j}-${k}`)))));$('wordPick').value=prev||$('wordPick').options[0]?.value||'';render();clearTimeout(saveTimer);saveTimer=setTimeout(()=>{$('autosave').textContent=storage.set('nabra-current-v1',state)?'حفظ تلقائي على هذا الجهاز ✓':'تعذر الحفظ المحلي. نزل النص للاحتفاظ به.';},500);}
for(const key of Object.keys(defaults)){const el=$(key);if(el)el.addEventListener('input',()=>changed(key,el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value));}
function tab(name){document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===name;b.classList.toggle('active',active);b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;});['write','meter','design'].forEach(k=>$(k+'Panel').hidden=k!==name);}
document.querySelectorAll('[data-tab]').forEach((b,i)=>{b.onclick=()=>tab(b.dataset.tab);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tabs=[...document.querySelectorAll('[data-tab]')];const n=(i+(e.key==='ArrowLeft'?1:-1)+3)%3;tab(tabs[n].dataset.tab);tabs[n].focus();}};});
$('toMeter').onclick=()=>{tab('meter');aiAction('detect');};
$('sampleBtn').onclick=()=>{if(state.poem&&!confirm('استبدال النص الحالي بالمثال؟ يمكنك حفظه كمسودة أولا.'))return;pushHistory();state={...state,poemTitle:'على قدر أهل العزم',author:'المتنبي',genre:'classical',meter:'الطويل',manual:{},poem:'عَلَى قَدْرِ أَهْلِ الْعَزْمِ تَأْتِي الْعَزَائِمُ * وَتَأْتِي عَلَى قَدْرِ الْكِرَامِ الْمَكَارِمُ\nوَتَعْظُمُ فِي عَيْنِ الصَّغِيرِ صِغَارُهَا * وَتَصْغُرُ فِي عَيْنِ الْعَظِيمِ الْعَظَائِمُ'};revision++;syncUI();};
$('clearBtn').onclick=()=>{if(state.poem&&!confirm('بدء قصيدة جديدة؟ احفظ مسودتك أولا إن أردت الرجوع إليها.'))return;pushHistory();state={...defaults,manual:{}};revision++;syncUI();$('analysis').replaceChildren();$('suggestions').replaceChildren();$('discovery').replaceChildren();discoveryCache=null;};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!['TEXTAREA','INPUT'].includes(e.target.tagName)&&history.length){e.preventDefault();state=JSON.parse(history.pop());revision++;syncUI();toast('تراجع عن آخر تعديل');}});
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{state.theme=b.dataset.theme;syncUI();});
$('moreStretch').onclick=()=>manualStretch(1);$('lessStretch').onclick=()=>manualStretch(-1);function manualStretch(d){const k=$('wordPick').value;if(!k)return;pushHistory();state.manual[k]=Math.max(-8,Math.min(30,(state.manual[k]||0)+d));update();}
$('fitImage').onclick=()=>{pushHistory();state.format='content';state.layout='auto';state.fontSize=64;state.lineGap=1.65;syncUI();toast('أصبحت الصورة على قدر الأبيات');};
$('resetStretch').onclick=()=>{state.manual={};update();};$('resetDesign').onclick=()=>{pushHistory();['theme','format','layout','fontSize','lineGap','columnGap','stretch','equalize','showPattern','showBrand','transparent','showDiacritics'].forEach(k=>state[k]=defaults[k]);state.manual={};syncUI();};
function motif(ctx,x,y,size,color,alpha=1){ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=size*.085;ctx.lineCap='round';[[0,.4],[.24,.12],[.48,.65],[.72,.25],[.96,.5]].forEach(([dx,dy])=>{ctx.beginPath();ctx.moveTo(x+dx*size,y);ctx.lineTo(x+dx*size,y+dy*size);ctx.stroke();});ctx.restore();}
function pattern(ctx,W,H,color){for(let y=80;y<H;y+=105)for(let x=35;x<W;x+=165)motif(ctx,x,y,46,color,.055);}
function displayShatr(s,key,ctx,target){const clean=state.showDiacritics?s.replace(/ـ/g,''):strip(s);let words=clean.split(/\s+/).filter(Boolean),counts=words.map((w,i)=>Math.max(0,Number(state.stretch)+(state.manual[key+'-'+i]||0)));let out=words.map((w,i)=>extendWord(w,counts[i]));if(state.equalize&&target){let loops=0,lastWidth=ctx.measureText(out.join(' ')).width;while(lastWidth<target-3&&loops<240){const i=loops%words.length;if(!words.length)break;counts[i]++;const n=extendWord(words[i],counts[i]);const before=out[i];out[i]=n;const width=ctx.measureText(out.join(' ')).width;if(width>target){out[i]=before;break;}lastWidth=width;loops++;}}return out.join(' ');}
function render(){
 if(!fontsReady)return;
 const c=$('art'),ctx=c.getContext('2d');let verses=splitPoem(state.poem),empty=!verses.length;if(empty)verses=[['هنا تبدأ قصيدتك','وهنا يأخذ الحرف مساحته']];
 const W=state.format==='landscape'?1600:1080,font=Number(state.fontSize)*(W/1080);ctx.font=`${font}px Thmanyah`;
 let prepared=verses.map((a,i)=>a.map((s,j)=>displayShatr(s,`${i}-${j}`,ctx,0)));
 const plan=planLayout({verses:prepared,format:state.format,layout:state.layout,fontSize:Number(state.fontSize),lineGap:Number(state.lineGap),columnGap:Number(state.columnGap),title:state.poemTitle,author:state.author,brand:state.showBrand,measure:t=>ctx.measureText(t).width});
 c.width=plan.W;c.height=plan.H;imageOverflow=plan.overflow;const colors=themes[state.theme]||themes.paper;
 if(!state.transparent){ctx.fillStyle=colors.bg;ctx.fillRect(0,0,plan.W,plan.H);}if(state.showPattern)pattern(ctx,plan.W,plan.H,colors.ink);
 ctx.direction='rtl';ctx.textAlign='center';ctx.fillStyle=colors.accent;ctx.font=`${plan.titleFont}px Thmanyah`;let y=plan.start;
 for(const line of plan.titleLines){ctx.fillText(line,plan.W/2,y+plan.titleFont);y+=plan.titleFont*1.4;}
 const top=plan.start+plan.titleH;ctx.font=`${plan.font}px Thmanyah`;ctx.fillStyle=colors.ink;
 // Kashida is applied after line wrapping, without changing font size or losing words.
 const justify=text=>{if(!state.equalize)return text;const words=text.split(/\s+/),base=words.map(w=>w.replace(/ـ/g,'')),counts=words.map(w=>(w.match(/ـ/g)||[]).length);let out=words.slice();for(let n=0;n<200&&ctx.measureText(out.join(' ')).width<plan.width-3;n++){const k=n%words.length,old=out[k];out[k]=extendWord(base[k],++counts[k]);if(ctx.measureText(out.join(' ')).width>plan.width){out[k]=old;break;}}return out.join(' ');};
 const exported=verses.map(()=>['','']);
 for(const row of plan.rows){
  if(plan.resolved==='columns'){ctx.textAlign='right';row.pair.forEach((lines,j)=>{exported[row.i][j]=lines.map(justify).join(' ');lines.forEach((line,n)=>ctx.fillText(justify(line),j?plan.W/2-plan.gap/2:plan.W-plan.pad,top+row.y+n*plan.lineH+plan.font));});}
  else{const line=justify(row.text);exported[row.i][row.j]+=(exported[row.i][row.j]?' ':'')+line;ctx.textAlign=plan.resolved==='staggered'?'right':'center';ctx.fillText(line,plan.resolved==='staggered'?plan.W-plan.pad-(row.j?60*(plan.W/1080):0):plan.W/2,top+row.y+plan.font);}
 }
 formatted=empty?[]:exported;ctx.textAlign='center';const bodyBottom=plan.start+plan.contentH-2*plan.pad-plan.brandH-plan.authorH;
 if(state.author){ctx.font=`${28*(plan.W/1080)}px Thmanyah`;ctx.fillStyle=colors.accent;ctx.fillText(state.author,plan.W/2,bodyBottom+35,plan.W-2*plan.pad);}
 if(state.showBrand){const bottom=plan.start+plan.contentH-2*plan.pad;ctx.fillStyle=colors.muted;ctx.font=`${22*(plan.W/1080)}px Thmanyah`;ctx.fillText('نبرة',plan.W/2,bottom-3);motif(ctx,plan.W/2-16,bottom-43,32,colors.accent,.65);}
 $('previewNote').textContent=`${plan.W} × ${plan.H} · حجم الخط ${state.fontSize} · ${state.format==='content'?'صورة على قدر الأبيات':'مقاس ثابت'}${plan.resolved==='columns'?' · شطران متقابلان':' · أشطر متتابعة'}`;
 if(imageOverflow)$('previewNote').textContent='النص يتجاوز هذا المقاس. اختر «على قدر الأبيات» أو خفف الحجم / المد.';
 c.setAttribute('aria-label',state.poem||'معاينة القصيدة');
}
function doScan(reading=state.poem,selectedOverride=''){const verses=splitPoem(reading);if(!verses.length){toast('اكتب بيتا أولا');return;}if(state.genre==='nabati'){$('analysis').innerHTML='<div class="notice">الشعر النبطي يحتاج قراءة لهجية. استخدم اقتراح الصياغات للمساعدة، ثم راجع الوزن بالإلقاء. الفحص العددي هنا مخصص للفصيح.</div>';return;}
let selected=selectedOverride||state.meter;if(!selectedOverride&&state.reference.trim()){const ref=analyze(state.reference,'auto',state.ending);if(!ref.exact){$('analysis').innerHTML='<div class="notice">الشطر المرجعي يحتاج قراءة مشكولة تطابق إحدى الصور المدعومة قبل استخدام وزنه.</div>';return;}selected=ref.best.name;}
let html='<p class="hint">النتائج تخص القراءة المكتوبة والصور المدعومة. المواضع الملونة مواقع اختلاف محتملة، وقد يتغير تفسيرها بتغيير النطق.</p>';
for(const [i,pair] of verses.entries())for(const [j,line] of pair.entries()){if(!line)continue;const r=analyze(line,selected,state.ending);if(!r.best){html+='<div class="notice">الشطر '+(i+1)+' طويل جدا للفحص أو لا يحتوي حروفا عربية.</div>';continue;}const unknown=r.unknown.length>0;const status=unknown?'يحتاج ضبط القراءة':r.exact?'مطابقة ضمن الصور المدعومة':'أقرب صورة تحتاج مراجعة';const wordHtml=r.words.map((w,k)=>`<${(!unknown&&r.badWords.includes(k))?'mark':'span'}>${esc(w)}</${(!unknown&&r.badWords.includes(k))?'mark':'span'}>`).join(' ');html+=`<article class="result"><div class="result-head"><span>البيت ${i+1} · ${j?'العجز':'الصدر'}</span><span class="status ${r.exact?'ok':''}">${status}</span></div><p class="verse">${wordHtml}</p><strong>${unknown?'قراءة غير مكتملة':esc(r.best.name)}</strong>${unknown?`<p class="hint">اضبط: ${r.unknown.map(k=>esc(r.words[k])).join('، ')}. استخدم التشكيل الذكي أو أضف الحركات يدويا.</p>`:`<div class="feet">${r.best.feet.map(esc).join(' / ')}</div><p class="hint">${r.best.changes.map(esc).join(' · ')}</p>`}<details><summary>التقطيع والمقارنة</summary><div class="rhythm">${r.pattern.replace(/1/g,'/').replace(/0/g,'○')}</div><p>/ متحرك · ○ ساكن · ? قراءة ناقصة</p>${!unknown?`<p>الصورة المقارنة:</p><div class="rhythm">${r.best.pattern.replace(/1/g,'/').replace(/0/g,'○')}</div><p>${r.exact?'مطابقة الإيقاع لا تغني عن مراجعة اللغة والمعنى.':'اختلافات صوتية: '+r.best.distance+'. النتيجة لا تستبعد صورة عروضية أخرى خارج الجدول.'}</p>`:''}</details></article>`;}
$('analysis').innerHTML=html;}
$('scanBtn').onclick=()=>aiAction('detect');
function fingerprint(){return JSON.stringify([state.poem,state.meter,state.genre,state.ending,state.locked,state.reference,state.intent]);}
let discoveryCache=null;
function poemKey(){return JSON.stringify([state.poem,state.genre,state.meter,state.reference,state.ending]);}
function sameReading(a,b){return JSON.stringify(splitPoem(a).map(p=>p.map(skeleton)))===JSON.stringify(splitPoem(b).map(p=>p.map(skeleton)));}
function canonMeter(name){const n=String(name||'').replace(/بحر/g,'').trim();return METERS.find(m=>m.name.replace(/^ال/,'')===n.replace(/^ال/,''))?.name||n;}
async function discoverCore(askAI,payload){
 const cached=discoveryCache;if(cached&&cached.key===poemKey())return cached;
 let reading=payload.poem,genre=payload.genre,aiCandidates=[],note='';
 const local=inferPoem(reading,state.ending);
 if(!local.ready||genre==='auto'||genre==='nabati'){
  const response=await askAI('detect',payload);genre=['classical','nabati'].includes(response.genre)?response.genre:genre;
  if(typeof response.poem==='string'&&sameReading(response.poem,payload.poem))reading=response.poem;
  aiCandidates=Array.isArray(response.candidates)?response.candidates.slice(0,3).filter(c=>typeof c.name==='string').map(c=>({name:canonMeter(c.name),reason:String(c.reason||'ترجيح مبدئي من الإيقاع')})):[];
  note=String(response.note||'');
 }
 let rank=genre==='classical'?inferPoem(reading,state.ending):null;
 let candidates=rank?.ready?rank.candidates.map(c=>({name:c.name,reason:`${c.matched} من ${c.total} أشطر تطابق الصور المسجلة؛ مجموع الاختلافات الصوتية ${c.distance}.`})):aiCandidates;
 let target=payload.meter!=='auto'?payload.meter:candidates[0]?.name||'';
 if(payload.reference.trim()){
  const ref=analyze(payload.reference,'auto',state.ending);if(ref.exact)target=ref.best.name;
  else {const resp=await askAI('detect',{...payload,poem:payload.reference,reference:''});if(resp.poem&&sameReading(resp.poem,payload.reference)){const ranked=inferPoem(resp.poem,state.ending);if(ranked.ready)target=ranked.best.name;}}
 }
 if(genre==='classical'&&target&&!METERS.some(m=>m.name===target))target=rank?.best?.name||'';
 return {key:poemKey(),reading,genre,target,candidates,rank,note};
}
function showDiscovery(d){
 const box=$('discovery');box.replaceChildren();const card=document.createElement('div');card.className='discovery-card';
 const title=document.createElement('h3');title.textContent=d.target?`البحر الأقرب: ${d.target}`:'الإيقاع يحتاج قراءة إضافية';card.append(title);
 const text=document.createElement('p');text.textContent=d.genre==='nabati'?'قراءة شعر نبطي / شعبي. هذا ترجيح لغوي مرتبط باللهجة والإلقاء.':d.rank?.ambiguous?'تتقارب أكثر من قراءة؛ هذا الترجيح مبني على القصيدة كاملة.':'الترجيح مبني على إيقاع الأشطر مجتمعة، ثم يقارن كل شطر بالبحر نفسه.';card.append(text);
 for(const c of d.candidates.slice(0,2)){const p=document.createElement('p');p.className='hint';p.textContent=c.name+' · '+c.reason;card.append(p);}
 if(d.note){const p=document.createElement('p');p.className='hint';p.textContent=d.note;card.append(p);}
 box.append(card);
 if(d.genre==='classical'&&METERS.some(m=>m.name===d.target))doScan(d.reading,d.target);
 else $('analysis').innerHTML='<p class="notice">سيحافظ الاقتراح على اللهجة والقافية، مع بيان موضع التعديل. تأكيد وزن النبطي يتطلب مراجعة النطق.</p>';
}
function wordChanges(original,proposed){const a=strip(original).split(/\s+/),b=strip(proposed).split(/\s+/);const old=a.filter(w=>!b.includes(w)&&!/^[*#|]$/.test(w)),added=b.filter(w=>!a.includes(w)&&!/^[*#|]$/.test(w));return {old:[...new Set(old)],added:[...new Set(added)],count:old.length+added.length};}
function checkSuggestion(s,payload,d){
 if(typeof s?.poem!=='string'||s.poem.length>5000)return null;
 const pairs=splitPoem(s.poem),sourcePairs=splitPoem(payload.poem);if(pairs.length!==sourcePairs.length||pairs.some((a,i)=>a.filter(Boolean).length!==sourcePairs[i].filter(Boolean).length))return null;
 const locks=payload.locked.split(/[,،\n]/).map(x=>skeleton(x.trim())).filter(Boolean);if(locks.some(w=>!skeleton(s.poem).includes(w)))return null;
 const lines=pairs.flat().filter(Boolean),results=d.genre==='classical'&&METERS.some(m=>m.name===d.target)?lines.map(l=>analyze(l,d.target,state.ending)):[];
 const matched=results.filter(r=>r.exact).length,changes=wordChanges(payload.poem,s.poem);if(!changes.count)return null;
 return {...s,results,matched,verified:results.length>0&&matched===results.length,changes};
}
async function aiAction(task){
 if(busy)return;if(!state.poem.trim()){toast('اكتب أبياتك أولا');return;}if(state.poem.length>2400){toast('للدقة، حلل حتى 2400 حرف في كل طلب.');return;}
 busy=true;const ids=['scanBtn','diacritizeBtn','suggestBtn'],id=task==='detect'?'scanBtn':task==='diacritize'?'diacritizeBtn':'suggestBtn',button=$(id),old=button.textContent,fp=fingerprint(),key=poemKey();
 ids.forEach(k=>$(k).disabled=true);button.textContent=task==='diacritize'?'يجري ضبط القراءة…':'يجري اكتشاف الإيقاع…';
 const payload={poem:state.poem,genre:state.genre,meter:state.meter,reference:state.reference,locked:state.locked,intent:state.intent};
 try{
  const {askAI}=await import('./ai.js?v=2');
  if(task==='diacritize'){
   const out=await askAI(task,payload);if(fp!==fingerprint()){toast('تغير النص. أعد الطلب للأبيات الجديدة.');return;}
   if(typeof out.poem!=='string'||!sameReading(out.poem,state.poem))throw Error('changed-text');pushHistory();state.poem=out.poem;discoveryCache=null;syncUI();doScan();toast('تم ضبط القراءة مع إبقاء الكلمات كما هي.');return;
  }
  const d=await discoverCore(askAI,payload);if(fp!==fingerprint()){toast('تغير النص. أعد الطلب للأبيات الجديدة.');return;}discoveryCache={...d,key};showDiscovery(d);if(task==='detect')return;
  if(!d.target)throw Error('no-meter');button.textContent=`يجري تعديل الأبيات على ${d.target}…`;
  const baseline=d.genre==='classical'?splitPoem(d.reading).flat().filter(Boolean).map(l=>analyze(l,d.target,state.ending)):[];
  if(baseline.length&&baseline.every(r=>r.exact)&&!payload.intent.trim()){$('suggestions').innerHTML='<div class="notice">الأبيات تطابق الصور المدعومة على '+esc(d.target)+'. يمكنك تحديد ما تريد تحسينه في المعنى لاقتراح تعديل مقصود.</div>';return;}
  const request={...payload,genre:d.genre,meter:d.target,reading:d.reading,diagnosis:baseline.map(r=>({text:r.words.join(' '),matched:r.exact,unknown:r.unknown.length,feet:r.best?.feet,nearWords:r.badWords?.map(i=>r.words[i])}))};
  let out=await askAI('suggest',request);if(fp!==fingerprint()){toast('تغير النص. أعد الطلب.');return;}
  let suggestions=(out.suggestions||[]).slice(0,3).map(s=>checkSuggestion(s,payload,d)).filter(Boolean);
  // One bounded repair pass uses actual local feedback rather than repeating the same prompt.
  if(d.genre==='classical'&&suggestions.length&&!suggestions.some(s=>s.verified)){
   button.textContent='تجري مراجعة الوزن وتقليل التعديلات…';const revised=await askAI('repair',{...request,previous:suggestions.map(s=>({poem:s.poem,issues:s.results.map((r,i)=>({shatr:i+1,matched:r.exact,unknown:r.unknown.length,distance:r.best?.distance,feet:r.best?.feet}))}))});
   if(fp!==fingerprint()){toast('تغير النص. أعد الطلب.');return;}suggestions.push(...(revised.suggestions||[]).slice(0,3).map(s=>checkSuggestion(s,payload,d)).filter(Boolean));
  }
  suggestions.sort((a,b)=>Number(b.verified)-Number(a.verified)||b.matched-a.matched||a.changes.count-b.changes.count);
  const seen=new Set();suggestions=suggestions.filter(s=>{const k=skeleton(s.poem);if(seen.has(k))return false;seen.add(k);return true;}).slice(0,3);
  $('suggestions').replaceChildren();if(!suggestions.length)throw Error('locks');
  for(const s of suggestions){
   const card=document.createElement('article');card.className='suggestion';const h=document.createElement('h4');h.textContent=String(s.label||'أقل تعديل مقترح');card.append(h);
   const verse=document.createElement('p');verse.className='verse';verse.style.whiteSpace='pre-line';verse.textContent=s.poem;card.append(verse);
   const changes=document.createElement('p');changes.className='change-summary';changes.textContent='التغيير: '+(s.changes.old.length?s.changes.old.join('، '):'إضافة')+' ← '+(s.changes.added.length?s.changes.added.join('، '):'حذف الكلمات الزائدة');card.append(changes);
   const why=document.createElement('p');why.textContent=String(s.reason||'');card.append(why);
   const badge=document.createElement('p');badge.className='status'+(s.verified?' ok':'');badge.textContent=d.genre==='nabati'?`اقتراح على ${d.target} · يحتاج مراجعة بالإلقاء`:`${s.matched} من ${s.results.length} أشطر تطابق ${d.target}${s.verified?'':' · الوزن يحتاج مراجعة'}`;card.append(badge);
   const apply=document.createElement('button');apply.className='secondary';apply.textContent=s.verified?'استخدام التعديل':'تجربة الصياغة';apply.onclick=()=>{if(fingerprint()!==fp){toast('تغير النص. اطلب اقتراحات جديدة.');return;}pushHistory();state.poem=s.poem;state.manual={};discoveryCache=null;syncUI();doScan(state.poem,d.target);$('suggestions').replaceChildren();toast('طبقت الصياغة. يمكنك التراجع عن التعديل.');};card.append(apply);$('suggestions').append(card);
  }
 }catch(e){const message=e.message==='changed-text'?'لم تحافظ القراءة المقترحة على الكلمات، لذلك احتفظنا بالنص الأصلي.':e.message==='no-meter'?'تعذر ترجيح بحر من هذه القراءة. أضف شطرا آخر أو وضح النطق في ملاحظة التعديل.':e.message==='locks'?'تعذر إنتاج تعديل يحافظ على الأبيات والكلمات المثبتة. جرب توضيح المعنى المطلوب.':e.message==='timeout'?'تأخر اتصال المساعد. حاول مرة أخرى.':'تعذر اتصال المساعد حاليا. يمكنك متابعة التنسيق والتصدير.';toast(message);const p=document.createElement('p');p.className='notice';p.textContent=message;$(task==='suggest'?'suggestions':'analysis').prepend(p);console.warn('Nabra AI:',e.code||e.message);}
 finally{busy=false;button.textContent=old;ids.forEach(k=>$(k).disabled=false);}
}
$('diacritizeBtn').onclick=()=>aiAction('diacritize');$('suggestBtn').onclick=()=>aiAction('suggest');
function textExport(){if(!state.poem.trim())throw Error('empty');let body=(fontsReady?formatted:splitPoem(state.poem)).map(a=>state.layout==='columns'?a.filter(Boolean).join('     *     '):a.filter(Boolean).join('\n')).join('\n');return [state.poemTitle,body,state.author].filter(Boolean).join('\n\n');}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
async function imageBlob(){if(!fontsReady)throw Error('font');if(!state.poem.trim())throw Error('empty');render();if(imageOverflow)throw Error('overflow');return new Promise((resolve,reject)=>$('art').toBlob(b=>b?resolve(b):reject(Error('export')),'image/png'));}
$('downloadBtn').onclick=async()=>{try{download(await imageBlob(),'nabra-poem.png');toast('الصورة جاهزة');}catch(e){toast(e.message==='overflow'?'اختر «على قدر الأبيات» أو خفف حجم الخط / المد لتظهر الكلمات كاملة.':'اكتب أبياتك وانتظر تحميل الخط أولا');}};
$('copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(textExport());toast('نسخ النص مع المد والتنسيق');}catch{toast('تعذر النسخ. استخدم تنزيل TXT.');}};
$('txtBtn').onclick=()=>{try{download(new Blob(['\ufeff'+textExport()],{type:'text/plain;charset=utf-8'}),'nabra-poem.txt');}catch{toast('اكتب أبياتك أولا');}};
$('shareBtn').onclick=async()=>{try{const blob=await imageBlob(),file=new File([blob],'nabra-poem.png',{type:'image/png'});if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:state.poemTitle||'قصيدتي'});else{download(blob,'nabra-poem.png');toast('تم تنزيل الصورة لتشاركها في تطبيقك المفضل');}}catch(e){if(e.name!=='AbortError')toast('تعذرت المشاركة. جرب تنزيل الصورة.');}};
$('saveBtn').onclick=()=>{if(!state.poem.trim()){toast('اكتب أبياتك أولا');return;}const drafts=storage.get('nabra-drafts-v1',[]);drafts.unshift({id:Date.now(),state:JSON.parse(JSON.stringify(state))});if(storage.set('nabra-drafts-v1',drafts.slice(0,30))){toast('حفظت في مسودات هذا الجهاز');update();}else toast('تعذر الحفظ. نزل نسخة TXT.');};
$('draftsBtn').onclick=()=>{const list=$('draftList');list.replaceChildren();const drafts=storage.get('nabra-drafts-v1',[]);if(!drafts.length)list.textContent='ستجد قصائدك المحفوظة هنا.';drafts.forEach(d=>{const row=document.createElement('div');row.className='draft';const title=document.createElement('div');title.textContent=d.state.poemTitle||strip(d.state.poem).slice(0,35);const date=document.createElement('small');date.textContent=new Date(d.id).toLocaleDateString('ar-SA-u-nu-latn',{calendar:'gregory'});title.append(date);const open=document.createElement('button');open.className='secondary';open.textContent='فتح';open.onclick=()=>{if(state.poem&&state.poem!==d.state.poem&&!confirm('فتح المسودة بدلا من النص الحالي؟'))return;pushHistory();state={...defaults,...d.state};revision++;syncUI();$('analysis').replaceChildren();$('suggestions').replaceChildren();$('discovery').replaceChildren();discoveryCache=null;$('draftsDialog').close();};const del=document.createElement('button');del.className='quiet';del.textContent='حذف';del.onclick=()=>{if(!confirm('حذف هذه المسودة؟'))return;storage.set('nabra-drafts-v1',storage.get('nabra-drafts-v1',[]).filter(x=>x.id!==d.id));row.remove();update();};row.append(title,open,del);list.append(row);});$('draftsDialog').showModal();};
$('helpBtn').onclick=()=>$('helpDialog').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
syncUI();Promise.all([document.fonts.load('400 42px Thmanyah'),document.fonts.load('700 42px Thmanyah')]).then(v=>{if(v.some(a=>!a.length))throw Error('font');fontsReady=true;$('fontLoading').hidden=true;render();}).catch(()=>{$('fontLoading').textContent='تعذر تحميل خط ثمانية. أعد تحميل الصفحة لإكمال المعاينة والتصدير.';});
