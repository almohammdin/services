'use strict';
const $=s=>document.querySelector(s);
let lang='ar';try{const v=localStorage.getItem('maft_language');if(v==='fr'||v==='ar')lang=v}catch(e){}
let sortKey='capital',flt={ftl:false,grp:false,bcn:false};

const UI={
 fr:{kicker:"Concurrents · données sourcées",title:"MA France Trans face à ses concurrents",
  subtitle:"11 sociétés, 5 autres acteurs. Touchez une carte pour voir détails et sources.",
  crumb:"Concurrents",spaceLabel:"Concurrents",navBack:"← Tableau de pilotage",navHere:"Concurrents",sideNote:"Lecture seule",skip:"Aller au contenu",
  kRank:"Rang par capital (sur 11)",kRankS:"Capital 2,1 M MAD",kFleet:"Plus grande flotte publiée",kKen:"Seule société du tableau basée à Kénitra",kKenV:"Kénitra",kList:"Concurrents cotés en Bourse",
  sort:"Trier :",sorts:{capital:"Capital",fleet:"Flotte",revenue:"Chiffre d'affaires",staff:"Employés"},
  chips:{ftl:"Camion complet",grp:"Groupage",bcn:"Barcelone",ken:"Kénitra",del:"Décotée 2024"},
  fig:{capital:"Capital (MAD)",fleet:"Flotte",staff:"Employés",rev:"CA (MAD)"},
  legend:"* auto-déclaré · bordure pointillée = non vérifié · « — » = non publié",
  me:"Nous",more:"Détails et sources ›",close:"Fermer",
  hOthers:"Autres acteurs",hListed:"Résultats financiers publiés",hDropped:"Écartées de la liste",hSources:"Toutes les sources",
  src:"Sources",logoSrc:"Source du logo",noLogo:"Logo officiel introuvable : initiales",
  badges:{reg:"Registre / annuaire légal",dir:"Annuaire (fourchette)",self:"Auto-déclaré",fil:"Rapport / dépôt officiel",unv:"Non vérifié"},
  fields:{city:"Ville",founded:"Création",legal:"Forme juridique",capital:"Capital",ids:"RC / ICE",fleet:"Flotte",employees:"Employés",volume:"Volumes par an",revenue:"Chiffre d'affaires",lanes:"Lignes",loads:"Camion complet / groupage",services:"Services",certs:"Certifications",parent:"Groupe",listed:"Cotée en Bourse ?",web:"Site web",note:"Note"},
  footer:"Données au 28/11/2026",credit:"Préparé par"},
 ar:{kicker:"المنافسون · بيانات موثّقة",title:"MA France Trans والمنافسون",
  subtitle:"11 شركة و5 لاعبين آخرين. اضغط على البطاقة لترى التفاصيل والمصادر.",
  crumb:"المنافسون",spaceLabel:"المنافسون",navBack:"→ لوحة القيادة",navHere:"المنافسون",sideNote:"للقراءة فقط",skip:"انتقل إلى المحتوى",
  kRank:"الترتيب حسب رأس المال (من 11)",kRankS:"رأس المال 2.1 مليون درهم",kFleet:"أكبر أسطول معلن",kKen:"الشركة الوحيدة في الجدول من القنيطرة",kKenV:"القنيطرة",kList:"منافسون مدرجون في البورصة",
  sort:"ترتيب:",sorts:{capital:"رأس المال",fleet:"الأسطول",revenue:"رقم المعاملات",staff:"المستخدمون"},
  chips:{ftl:"شاحنة كاملة",grp:"تجميع",bcn:"برشلونة",ken:"القنيطرة",del:"خرجت من البورصة 2024"},
  fig:{capital:"رأس المال (درهم)",fleet:"الأسطول",staff:"المستخدمون",rev:"رقم المعاملات (درهم)"},
  legend:"* تصريح ذاتي · إطار منقّط = غير متحقق منه · «—» = غير منشور",
  me:"نحن",more:"التفاصيل والمصادر ›",close:"إغلاق",
  hOthers:"لاعبون آخرون",hListed:"النتائج المالية المنشورة",hDropped:"شركات مستبعدة من القائمة",hSources:"كل المصادر",
  src:"المصادر",logoSrc:"مصدر الشعار",noLogo:"لم نجد شعاراً رسمياً: الأحرف الأولى",
  badges:{reg:"السجل / دليل قانوني",dir:"دليل (فئة)",self:"تصريح ذاتي",fil:"تقرير / إيداع رسمي",unv:"غير متحقق منه"},
  fields:{city:"المدينة",founded:"التأسيس",legal:"الشكل القانوني",capital:"رأس المال",ids:"RC / ICE",fleet:"الأسطول",employees:"المستخدمون",volume:"الحجم السنوي",revenue:"رقم المعاملات",lanes:"الخطوط",loads:"شاحنة كاملة / تجميع",services:"الخدمات",certs:"الشهادات",parent:"المجموعة",listed:"مدرجة في البورصة؟",web:"الموقع",note:"ملاحظة"},
  footer:"بيانات 28/11/2026",credit:"إعداد"}
};
const T=()=>UI[lang],pick=o=>o?o[lang]:'';
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const rich=s=>{const e=esc(s);return lang==='ar'?e.replace(/\d+(?:[ \u00a0,.]\d+)*/g,m=>`<bdi dir="ltr">${m}</bdi>`):e};
function badge(t){return t?`<span class="bd ${t}" title="${esc(T().badges[t])}">${esc(T().badges[t])}</span>`:''}
function fmtM(n){if(n==null)return null;const v=n/1e6;const s=v>=100?Math.round(v).toString():(Math.round(v*10)/10).toString();return (lang==='fr'?s.replace('.',','):s)+' M'}
function initials(n){const w=String(n).replace(/\(.*?\)/g,'').replace(/[^A-Za-z0-9À-ÿ ]/g,' ').trim().split(/\s+/).filter(Boolean);return ((w[0]||'?')[0]+((w[1]||'')[0]||(w[0]||'')[1]||'')).toUpperCase()}
function logo(id,name,size){const L=LOGOS[id],cl='lg'+(size?' '+size:'');
 if(!L)return `<span class="${cl} ph" role="img" aria-label="${esc(name)}" title="${esc(T().noLogo)}">${esc(initials(name))}</span>`;
 return `<span class="${cl}${L.bg==='dark'?' dark':''}"><img src="${L.f}" alt="${esc(name)}" loading="lazy" onerror="this.parentNode.className='${cl} ph';this.parentNode.textContent='${esc(initials(name))}'"></span>`}
function linksOf(ids){return ids&&ids.length?`<span class="msrc">${ids.map(i=>`<a href="${SRC[i].u}" target="_blank" rel="noopener">↗ ${esc(SRC[i].l)}</a>`).join('')}</span>`:''}

/* key figures */
function figs(c){const k=CARD[c.id]||{},t=T();
 const star=a=>a&&a[1]?'<sup>*</sup>':'';
 const cap=c.capital&&c.capital.num!=null?fmtM(c.capital.num):null;
 const rev=c.revenue&&c.revenue.num!=null?fmtM(c.revenue.num):null;
 const fl=k.fleet?k.fleet[0]+star(k.fleet):null,st=k.staff?k.staff[0]+star(k.staff):null;
 return [['capital',cap],['fleet',fl],['staff',st],['rev',rev]].map(([key,v])=>`<div class="fig"><b class="${v?'':'na'}">${v||'—'}</b><small>${t.fig[key]}</small></div>`).join('')}
function chipsOf(id){const k=CARD[id]||{},t=T();
 const icon={ftl:'🚛',grp:'📦',bcn:'📍',ken:'📍',del:'⛔'};
 return (k.chips||[]).map(x=>{const u=x.endsWith('?'),key=u?x.slice(0,-1):x;return `<span class="chip ${key} ${u?'unv':''}">${icon[key]} ${esc(t.chips[key])}</span>`}).join('')}

function sortVal(c){const k=CARD[c.id]||{};
 if(sortKey==='capital')return c.capital.num;
 if(sortKey==='revenue')return c.revenue.num;
 if(sortKey==='fleet')return k.fleet?parseFloat(k.fleet[0].replace(/[^\d.]/g,'')):null;
 if(sortKey==='staff')return k.staff?parseFloat(k.staff[0].replace(/[^\d.]/g,'')):null}
function visible(){
 let list=COMPANIES.filter(c=>c.me||Object.keys(flt).every(k=>!flt[k]||(CARD[c.id].chips||[]).includes(k)));
 const me=list.filter(c=>c.me),o=list.filter(c=>!c.me);
 o.sort((a,b)=>{const x=sortVal(a),y=sortVal(b),nx=x==null||isNaN(x),ny=y==null||isNaN(y);if(nx&&ny)return 0;if(nx)return 1;if(ny)return -1;return y-x});
 return me.concat(o)}

function card(c){const city=pick(c.city);
 return `<article class="co${c.me?' me':''}" tabindex="0" role="button" data-id="${c.id}" aria-label="${esc(c.name)}">
 <div class="top">${logo(c.id,c.name,'big')}<div class="who"><h3>${esc(c.name)}${c.me?`<span class="me-tag">${esc(T().me)}</span>`:''}</h3><div class="city">📍 ${rich(city.split(/ \(/)[0])}</div></div></div>
 <div class="figs">${figs(c)}</div><div class="chips">${chipsOf(c.id)}</div><div class="more">${T().more}</div></article>`}
function miniCard(d){
 return `<article class="co mini${d.star?' star':''}" tabindex="0" role="button" data-o="${d.id}" aria-label="${esc(d.n)}">
 <div class="top">${logo(d.id,d.n)}<div class="who"><h3>${esc(d.n)}</h3></div></div><p>${rich(SHORT[d.id][lang])}</p><div class="chips">${chipsOf(d.id)}</div><div class="more">${T().more}</div></article>`}

function kpis(){const t=T();
 const withCap=COMPANIES.filter(c=>c.capital.num!=null).sort((a,b)=>b.capital.num-a.capital.num);
 const rank=withCap.findIndex(c=>c.me)+1;
 let best=null;COMPANIES.forEach(c=>{const k=CARD[c.id];if(k&&k.fleet){const n=parseFloat(k.fleet[0].replace(/[^\d.]/g,''));if(!best||n>best.n)best={n,c}}});
 const listed=0;
 $('#kpis').innerHTML=
  `<div class="kpi me"><b>${rank} / ${COMPANIES.length}</b><span>${t.kRank}</span><span>${rich(t.kRankS)}</span></div>
   <div class="kpi"><b>${best.n}*</b><span>${t.kFleet}</span><span><strong>${esc(best.c.name)}</strong></span></div>
   <div class="kpi"><b>${t.kKenV}</b><span>${t.kKen}</span></div>
   <div class="kpi"><b>${listed} / ${COMPANIES.length-1}</b><span>${t.kList}</span></div>`}

function modalFor(c,isOther){const t=T();
 let h='';
 if(isOther){
  const d=c;
  h=`<div class="mhead">${logo(d.id,d.n,'xl')}<div><h2 id="mTitle">${esc(d.n)}</h2></div></div><div class="chips">${chipsOf(d.id)}</div>
  <div class="mrow"><div class="k">${t.fields.note}</div><div class="v">${rich(d[lang])} ${badge(d.t)}${linksOf(d.s)}</div></div>
  <div class="mrow"><div class="k">${t.logoSrc}</div><div class="v">${logoSrc(d.id)}</div></div>`;
 }else{
  h=`<div class="mhead">${logo(c.id,c.name,'xl')}<div><h2 id="mTitle">${esc(c.name)}</h2><div class="city">📍 ${rich(pick(c.city))}</div></div></div>
  <div class="mfigs">${figs(c)}</div><div class="chips">${chipsOf(c.id)}</div>`;
  for(const k of Object.keys(t.fields)){if(!c[k]||typeof c[k]!=='object')continue;const v=c[k],s=pick(v);if(!s)continue;
   const dash=!v.t&&/^—/.test(s);
   h+=`<div class="mrow"><div class="k">${t.fields[k]}</div><div class="v ${dash?'dash':''}">${k==='web'&&!dash&&/^https?:/.test(s)?`<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a>`:rich(s)}${badge(v.t)}${linksOf(v.s)}</div></div>`}
  h+=`<div class="mrow"><div class="k">${t.logoSrc}</div><div class="v">${logoSrc(c.id)}</div></div>`;
 }
 return h}
function logoSrc(id){const L=LOGOS[id];return L?`<a href="${L.u}" target="_blank" rel="noopener">↗ ${esc(T().logoSrc)}</a> <span class="small">· ${esc(L.how)}</span>`:`<span class="small">${esc(T().noLogo)}</span>`}

let lastFocus=null;
function openModal(html){lastFocus=document.activeElement;$('#mBody').innerHTML=html;$('#mClose').setAttribute('aria-label',T().close);$('#modal').hidden=false;document.body.classList.add('modal-open');$('.sheet').scrollTop=0;$('#mClose').focus()}
function closeModal(){$('#modal').hidden=true;document.body.classList.remove('modal-open');if(lastFocus&&lastFocus.focus)lastFocus.focus()}

function renderGrid(){
 $('#grid').innerHTML=visible().map(card).join('');
 $('#sortSeg').innerHTML=`<span class="small">${T().sort}</span>`+Object.keys(T().sorts).map(k=>`<button type="button" data-sort="${k}" class="${sortKey===k?'on':''}" aria-pressed="${sortKey===k}">${T().sorts[k]}</button>`).join('');
 const icon={ftl:'🚛',grp:'📦',bcn:'📍'};
 $('#filters').innerHTML=['ftl','grp','bcn'].map(k=>`<button type="button" data-flt="${k}" class="${flt[k]?'on':''}" aria-pressed="${flt[k]}">${icon[k]} ${T().chips[k]}</button>`).join('')}

function renderListed(){
 $('#listed').innerHTML=LISTED.map(l=>{
  const tr=l.rows.map((r,i)=>{const label=r[lang==='ar'?1:0].replace(/^(fr|ar):/,'');const tag=i===0?'th':'td';return `<tr><${tag}>${esc(label)}</${tag}><${tag} class="n"><bdi dir="ltr">${r[2]}</bdi></${tag}><${tag} class="n"><bdi dir="ltr">${r[3]}</bdi></${tag}></tr>`}).join('');
  return `<div class="card"><h3>${esc(l.name)}</h3><p class="small">${rich(pick(l.status))}${badge(l.status.t)}</p><p class="small">${rich(pick(l.rel))}</p><table>${tr}</table><p class="small">${rich(pick(l.extra))}${badge(l.extra.t)}</p><p class="small">${l.s.map(i=>`<a href="${SRC[i].u}" target="_blank" rel="noopener">↗ ${esc(SRC[i].l)}</a>`).join('<br>')}</p></div>`}).join('')}

function render(){
 const t=T();document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('#lang').value=lang;
 document.title='MA France Trans · '+t.crumb;
 for(const k of ['kicker','title','subtitle','crumb','spaceLabel','navBack','navHere','sideNote','hOthers','hListed','hDropped','hSources'])$('#'+k).textContent=t[k];
 $('#skip').textContent=t.skip;$('#footerText').textContent=t.footer;$('#credit').textContent=t.credit;$('#legendLine').textContent=t.legend;
 kpis();renderGrid();
 $('#others').innerHTML=OTHERS.map(miniCard).join('');
 renderListed();
 $('#dropped').innerHTML=DROPPED.map(d=>`<div class="drop"><b>${esc(d.n)}</b>${rich(d[lang])}${linksOf(d.s)}</div>`).join('');
 $('#sources').innerHTML=Object.keys(SRC).map(k=>`<li><a href="${SRC[k].u}" target="_blank" rel="noopener">${esc(SRC[k].l)}</a></li>`).join('');
 if(!$('#modal').hidden)closeModal();
}
function activate(el){const a=el.closest('.co');if(!a)return;
 if(a.dataset.id){openModal(modalFor(COMPANIES.find(c=>c.id===a.dataset.id),false))}
 else if(a.dataset.o){openModal(modalFor(OTHERS.find(d=>d.id===a.dataset.o),true))}}
document.addEventListener('click',e=>{
 const s=e.target.closest('[data-sort]');if(s){sortKey=s.dataset.sort;renderGrid();return}
 const f=e.target.closest('[data-flt]');if(f){flt[f.dataset.flt]=!flt[f.dataset.flt];renderGrid();return}
 if(e.target.closest('#mClose')||e.target.id==='modal'){closeModal();return}
 if(e.target.closest('a'))return;
 if(e.target.closest('.co'))activate(e.target)});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('#modal').hidden)closeModal();
 if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('co')){e.preventDefault();activate(e.target)}});
$('#lang').addEventListener('change',e=>{lang=e.target.value;try{localStorage.setItem('maft_language',lang)}catch(x){}render()});
render();
