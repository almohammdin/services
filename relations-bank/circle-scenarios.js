(() => {
const scenes={
 leader:{name:'دائرة يقودها رئيس',badge:'الرئيس مدعو',text:'رئيس الدائرة يدخل بدعوة، ثم يبني شبكته داخل الدائرة. الأشخاص الذين يضيفهم قد يكونون بلا حساب ولا يحتاجون معرفة أنهم مسجلون كعلاقات داخلية.',nodes:[
  ['platform','المنصة','دعوة رئيس الدائرة','platform',3,1],['leader','رئيس الدائرة','حساب داخل المنصة','leader',3,2],['m1','عضو 1','علاقة داخلية','accountless',1,4],['m2','عضو 2','علاقة داخلية','accountless',3,4],['m3','عضو 3','علاقة داخلية','accountless',5,4],['reward','استحقاق الرئيس','عند تحقق العملية','reward',5,2]
 ],edges:[
  ['platform','leader','دعوة','invite'],['leader','m1','يضيف','normal'],['leader','m2','يضيف','normal'],['leader','m3','يضيف','normal'],['m3','leader','فرصة','normal'],['leader','reward','مكافأة نجاح','money']
 ],chips:['أعضاء الدائرة قد يكونون بلا حساب','الفرصة تمر عبر رئيس الدائرة','استحقاق الرئيس مرتبط بنتيجة فعلية']},
 dual:{name:'عضو هنا ورئيس هناك',badge:'أدوار متعددة',text:'الشخص نفسه يمكن أن يكون عضوا داخل دائرة، وفي الوقت نفسه رئيسا لدائرة مستقلة أخرى. كل دائرة لها بياناتها وصلاحياتها واستحقاقاتها.',nodes:[
  ['a','دائرة A','رئيسها: نورة','leader',2,1],['person','سلمان','عضو في A · رئيس B','member',3,2],['b','دائرة B','رئيسها: سلمان','leader',4,3],['a1','عضو داخل A','علاقة داخلية','accountless',1,4],['b1','عضو داخل B','علاقة داخلية','accountless',5,4]
 ],edges:[
  ['a','person','عضو','normal'],['person','b','يرأس','invite'],['a','a1','شبكة A','normal'],['b','b1','شبكة B','normal']
 ],chips:['الدائرتان مستقلتان','الدور يختلف من دائرة لأخرى','الصلاحيات لا تنتقل تلقائيا']},
 bridge:{name:'فرصة داخل الدائرة',badge:'مطابقة',text:'عضو يملك احتياجا وعضو آخر يملك علاقة أو قدرة. المنصة تكشف التكامل، ثم يبدأ التعارف عبر صاحب العلاقة.',nodes:[
  ['leader','رئيس الدائرة','يدير الوصول','leader',3,1],['need','احتياج','عضو أو طلب داخل الدائرة','member',1,3],['match','فرصة مرشحة','تكامل مكتشف','platform',3,3],['access','صاحب العلاقة','يفتح الباب','member',5,3],['result','نتيجة','اجتماع · عقد · تحصيل','reward',3,4]
 ],edges:[
  ['need','match','احتياج','normal'],['access','match','وصول','normal'],['leader','match','إدارة','invite'],['match','result','تعارف','normal'],['result','leader','استحقاق','money']
 ],chips:['المطابقة تسبق كشف العلاقة','صاحب العلاقة يتحكم بالتعارف','الاستحقاق يظهر عند الحدث المتفق عليه']},
 circles:{name:'دوائر مستقلة تتقاطع بالأشخاص',badge:'خصوصية',text:'يمكن أن يظهر الشخص في أكثر من دائرة، لكن وجوده في واحدة لا يكشف تلقائيا ما تعرفه عنه الدائرة الأخرى.',nodes:[
  ['c1','دائرة القهوة','رئيس مستقل','leader',2,1],['p','شخص مشترك','يظهر بسياقين مختلفين','member',3,2],['c2','دائرة الاستثمار','رئيس مستقل','leader',4,1],['k1','معلومة داخل القهوة','صلاحيتها للدائرة الأولى','accountless',1,4],['k2','معلومة داخل الاستثمار','صلاحيتها للدائرة الثانية','accountless',5,4]
 ],edges:[
  ['c1','p','عضوية/علاقة','normal'],['c2','p','عضوية/علاقة','normal'],['c1','k1','سياق مستقل','invite'],['c2','k2','سياق مستقل','invite']
 ],chips:['نفس الشخص لا يعني نفس البيانات','كل دائرة تملك سياقها','الخصوصية مرتبطة بمصدر المعلومة']}
};
let current='leader',raf=0,paths=[],dots=[],motion=matchMedia('(prefers-reduced-motion: reduce)').matches===false;
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function mount(){
 if(document.getElementById('circleScenariosFold'))return;
 const footer=document.querySelector('footer');if(!footer)return setTimeout(mount,120);
 const wrap=document.createElement('section');wrap.className='rb-circles-wrap';
 wrap.innerHTML='<div class="shell"><details class="rb-circles-fold" id="circleScenariosFold"><summary><span class="rb-circles-head"><small>الدوائر</small><b>كيف تتحرك العلاقات داخل المنصة؟</b></span></summary><div class="rb-circles-body"><div class="rb-scenario-tabs" id="rbScenarioTabs"></div><div class="rb-scene-card"><div class="rb-scene-top"><div><h3 id="rbSceneTitle"></h3><p id="rbSceneText"></p></div><span class="rb-scene-badge" id="rbSceneBadge"></span></div><div class="rb-network" id="rbCircleNetwork"><svg class="rb-network-svg"></svg><div class="rb-network-nodes"></div></div><div class="rb-scene-caption" id="rbSceneChips"></div><div class="rb-legend"><span><i></i>علاقة / مسار</span><span class="i"><i></i>دعوة / صلاحية</span><span class="m"><i></i>استحقاق مالي</span></div></div></div></details></div>';
 footer.parentNode.insertBefore(wrap,footer);
 const tabs=document.getElementById('rbScenarioTabs');
 Object.entries(scenes).forEach(([id,s],i)=>{const b=document.createElement('button');b.className='rb-scenario-tab'+(i===0?' active':'');b.textContent=s.name;b.onclick=()=>render(id);tabs.appendChild(b)});
 document.getElementById('circleScenariosFold').addEventListener('toggle',e=>{if(e.target.open){render(current);setTimeout(draw,80)}else stop()});
 render(current);
 addEventListener('resize',()=>{if(document.getElementById('circleScenariosFold')?.open){cancelAnimationFrame(raf);setTimeout(draw,80)}},{passive:true});
}
function render(id){
 current=id;const s=scenes[id];if(!s)return;
 document.querySelectorAll('.rb-scenario-tab').forEach((b,i)=>b.classList.toggle('active',Object.keys(scenes)[i]===id));
 document.getElementById('rbSceneTitle').textContent=s.name;document.getElementById('rbSceneText').textContent=s.text;document.getElementById('rbSceneBadge').textContent=s.badge;
 document.getElementById('rbSceneChips').innerHTML=s.chips.map(x=>'<span class="rb-scene-chip">'+esc(x)+'</span>').join('');
 const host=document.querySelector('#rbCircleNetwork .rb-network-nodes');
 host.innerHTML=s.nodes.map(n=>'<div class="rb-net-node '+n[3]+'" data-node="'+n[0]+'" style="grid-column:'+n[4]+';grid-row:'+n[5]+'"><span class="orb">'+(n[3]==='leader'?'◉':n[3]==='platform'?'✦':n[3]==='reward'?'SAR':'●')+'</span><b>'+esc(n[1])+'</b><small>'+esc(n[2])+'</small></div>').join('');
 if(document.getElementById('circleScenariosFold')?.open)setTimeout(draw,60);
}
function stop(){cancelAnimationFrame(raf);raf=0;paths=[];dots=[]}
function draw(){
 stop();const box=document.getElementById('rbCircleNetwork'),svg=box?.querySelector('.rb-network-svg');if(!box||!svg)return;
 const s=scenes[current],rect=box.getBoundingClientRect(),mobile=matchMedia('(max-width:720px)').matches;
 svg.setAttribute('viewBox','0 0 '+rect.width+' '+rect.height);svg.innerHTML='<defs><marker id="rbArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10" fill="#7898AC"/></marker><marker id="rbArrowM" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10" fill="#C9853C"/></marker><marker id="rbArrowI" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10" fill="#165A3D"/></marker></defs>';
 box.querySelectorAll('.rb-edge-label').forEach(x=>x.remove());
 s.edges.forEach((e,idx)=>{
  const a=box.querySelector('[data-node="'+e[0]+'"]'),b=box.querySelector('[data-node="'+e[1]+'"]');if(!a||!b)return;
  const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
  let x1=ar.left+ar.width/2-rect.left,y1=ar.top+ar.height/2-rect.top,x2=br.left+br.width/2-rect.left,y2=br.top+br.height/2-rect.top;
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  let d;if(mobile){const mid=(y1+y2)/2;d='M'+x1+','+y1+' C'+x1+','+mid+' '+x2+','+mid+' '+x2+','+y2}else{const mid=(x1+x2)/2;d='M'+x1+','+y1+' C'+mid+','+y1+' '+mid+','+y2+' '+x2+','+y2}
  p.setAttribute('d',d);p.setAttribute('class','rb-flow-line '+(e[3]==='money'?'money':e[3]==='invite'?'invite':''));p.setAttribute('marker-end',e[3]==='money'?'url(#rbArrowM)':e[3]==='invite'?'url(#rbArrowI)':'url(#rbArrow)');svg.appendChild(p);paths.push(p);
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','4.5');dot.setAttribute('class','rb-flow-dot');dot.style.fill=e[3]==='money'?'#C9853C':e[3]==='invite'?'#165A3D':'#7898AC';svg.appendChild(dot);dots.push(dot);
  const lab=document.createElement('span');lab.className='rb-edge-label';lab.textContent=e[2];lab.style.left=((x1+x2)/2)+'px';lab.style.top=((y1+y2)/2)+'px';box.appendChild(lab);
 });
 if(motion)animate();
}
function animate(){
 let t=0;const tick=()=>{t+=.0045;paths.forEach((p,i)=>{const len=p.getTotalLength(),phase=(t+i*.18)%1,pt=p.getPointAtLength(len*phase);dots[i]?.setAttribute('cx',pt.x);dots[i]?.setAttribute('cy',pt.y)});raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)
}
mount();
})();