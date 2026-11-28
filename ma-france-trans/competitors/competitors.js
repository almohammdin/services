'use strict';
const $=s=>document.querySelector(s);
let lang='ar';try{const v=localStorage.getItem('maft_language');if(v==='fr'||v==='ar')lang=v}catch(e){}
let sortKey=null,sortDir=1,selected=null,metric='capital',hideBig=true;

const UI={
 fr:{kicker:"Veille concurrentielle · données sourcées",title:"MA France Trans face aux concurrents au Maroc",
  subtitle:"11 sociétés comparées + 5 autres acteurs. Chaque information a une source ouverte ; ce qui est inconnu est affiché « — ». Aucune estimation. Mise à jour après la revue croisée avec ChatGPT (28/11/2026).",
  crumb:"Concurrents",spaceLabel:"Concurrents",navBack:"← Tableau de pilotage",navHere:"Concurrents",sideNote:"Page en lecture seule",
  hSum:"Ce qu'il faut retenir",legendNote:"Chaque donnée porte une étiquette qui dit d'où elle vient :",
  hTable:"Tableau comparatif",tableHelp:"Cliquez sur un titre de colonne pour trier. Cliquez sur une ligne pour voir tous les détails et les liens sources. La ligne dorée est MA France Trans.",
  search:"Rechercher une société, une ville, une ligne…",allCities:"Toutes les villes",onlyFleet:"Seulement ceux avec un nombre de camions",reset:"Réinitialiser",
  tableNote:"« — » = information introuvable dans une source ouverte (jamais estimée). Les annuaires (Telecontact, Charika, Optimus) republient le registre du commerce ; les fourchettes d'effectif viennent de Telecontact/Optimus/Kerix. Quand deux sources se contredisent, la valeur la mieux sourcée est affichée et le conflit est indiqué dans la cellule.",
  cols:{name:"Société",city:"Ville",founded:"Création",capital:"Capital",fleet:"Camions / flotte",employees:"Employés",lanes:"Lignes",loads:"Camion complet / groupage",certs:"Certifications",listed:"Cotée ?"},
  detailTitle:"Détails",close:"Fermer",src:"Sources",
  fields:{city:"Ville / siège",founded:"Année de création",legal:"Forme juridique",capital:"Capital",ids:"Identifiants (RC / ICE)",fleet:"Camions / flotte",employees:"Employés",volume:"Voyages / volumes par an",revenue:"Chiffre d'affaires",lanes:"Lignes (France / Espagne / autres)",loads:"Camion complet (FTL) / groupage",services:"Services",certs:"Certifications (ISO, OEA…)",parent:"Groupe / maison mère",listed:"Société cotée ?",web:"Site web",note:"Note",logo:"Logo (source officielle)"},
  hChart:"En image : seulement les chiffres sourcés",mCapital:"Capital (MAD)",mFleet:"Flotte (chiffres publiés)",mRevenue:"Chiffre d'affaires (MAD)",hideBig:"Masquer SJL (trop grand pour l'échelle)",
  chartCap:"Capital enregistré au registre du commerce / annuaires. SJL : 253 711 500 MAD (masqué pour lisibilité si coché).",
  chartFleet:"Barres hachurées = chiffre auto-déclaré par l'entreprise, non contrôlé ; barres pleines = rapport officiel / BERD (Janou : octobre 2022). Group Inter Five et TIMAR sont absentes : chiffres contradictoires ou trop anciens. MFAH compte camions et remorques séparément (30 + 14). MA France Trans : à demander à Hassan.",
  chartRev:"Chiffre d'affaires sorti des comptes déposés ou audités : TIMAR 2023 (comptes sociaux audités), SDFM et TCL 2024 (comptes sociaux déposés, via Welipro). Les années diffèrent. Les autres : — (non publié). MA France Trans : bilans payants sur Charika, non lus.",
  noValue:"— (à demander à Hassan)",noLogo:"Logo officiel introuvable : initiales à la place (rien d'inventé)",logoSrc:"Source du logo",
  hListed:"Sociétés cotées : résultats financiers",listedIntro:"Aucun des 10 concurrents n'apparaît au bulletin de cote du 27/11/2026. TIMAR (cotée de 2007 à 2024) et sa maison mère CLASQUIN ont quitté la cote ; seule CTM est cotée à Casablanca (concurrent indirect). TIMAR : comptes 2023 audités (AMMC) ajoutés.",
  hNeeds:"Ce qu'il nous faut de Hassan",needsIntro:"Pour remplir la ligne « MA France Trans » avec des chiffres vrais (pas d'estimation) :",
  hDropped:"Sociétés retirées de la première liste",droppedIntro:"Nous les avons remplacées car leurs données de registre ne soutiennent pas ce que leur site annonce.",
  hOthers:"Autres acteurs à surveiller (hors tableau)",othersIntro:"Bien sourcés mais hors des 10 plus pertinents. Golden Way est la seule à avoir un dépôt à Kénitra. Chiffres = ce que les sites publient (auto-déclaré).",
  hSources:"Toutes les sources",srcIntro:"Pages ouvertes et lues le 28 novembre 2026 (heure de Riyad), sauf mention « extrait de recherche ».",
  footer:"Concurrents · données au 28/11/2026",credit:"Préparé par",skip:"Aller au contenu",
  badges:{reg:"Registre / annuaire légal",dir:"Annuaire (fourchette)",self:"Auto-déclaré (site de l'entreprise)",fil:"Rapport / dépôt officiel",unv:"Non vérifié (extrait de recherche)"},
  yes:"Oui",
  sum:[
   "MA France Trans : Kénitra, RC 41789, ICE 000093575000034, SARL à associé unique, capital 2 100 000 MAD, « en activité ». Premier enregistrement publié : 12/07/2013 à Tanger (inscription de Tanger « radiée »). Camions, employés et lignes : à demander à Hassan. La SAS française du même nom est radiée depuis le 10/06/2024.",
   "Par capital enregistré, MA France Trans est 7e sur 11 : au-dessus d'Otmatrans (1 M), RTL (0,5 M), Elza et MFAH (0,1 M chacune) ; en dessous de SJL (253,7 M), TIMAR (30,1 M), Janou (21 M), Group Inter Five (10 M), TCL (4 M) et SDFM (3,9 M).",
   "Flottes publiées : SJL 450 camions + 800 semi-remorques (groupe, auto-déclaré) ; SDFM 348 véhicules (auto-déclaré) ; MFAH 44 en propre (30 camions + 14 remorques) + 120 partenaires ; Janou plus de 45 ensembles frigorifiques (BERD, 2022) ; Golden Way ≈ 40 tracteurs (hors tableau). Group Inter Five se contredit (50 ou 130 ensembles). Les autres : —.",
   "Chiffre d'affaires publié : TIMAR 432,1 MDH (2023, comptes audités, 297 salariés) ; SDFM 123,8 MDH et TCL 117,5 MDH (2024, comptes déposés). Aucun chiffre trouvé pour MA France Trans (bilans payants sur Charika).",
   "Les 10 concurrents font du fret routier Maroc–Europe : 9 sur 10 proposent le camion complet, 6 à 7 le groupage (Elza : camion complet seulement ; SDFM : non précisé). Barcelone : TCL (hub), TIMAR via Saner (départs hebdo), RTL (partenaire Illaexport) ; hors tableau Transunivers, Marglory, GFL.",
   "MA France Trans est la seule des 11 basée à Kénitra, mais Golden Way (≈ 40 tracteurs) y a un dépôt. Aucun concurrent n'est coté aujourd'hui : TIMAR était cotée de 2007 à 2024 ; CTM (cotée) n'est qu'un concurrent indirect."]},
 ar:{kicker:"رصد المنافسين · بيانات موثّقة المصدر",title:"MA France Trans مقابل المنافسين في المغرب",
  subtitle:"مقارنة بين 11 شركة + 5 لاعبين آخرين. لكل معلومة مصدر مفتوح؛ وما هو مجهول يظهر «—». لا توجد أي تقديرات. تم التحديث بعد المراجعة المتقاطعة مع ChatGPT (28/11/2026).",
  crumb:"المنافسون",spaceLabel:"المنافسون",navBack:"→ لوحة القيادة",navHere:"المنافسون",sideNote:"صفحة للقراءة فقط",
  hSum:"أهم ما نخرج به",legendNote:"كل معلومة عليها وسم يبيّن مصدرها:",
  hTable:"جدول المقارنة",tableHelp:"اضغط على عنوان العمود للترتيب. اضغط على أي صف لرؤية كل التفاصيل وروابط المصادر. الصف الذهبي هو MA France Trans.",
  search:"ابحث عن شركة أو مدينة أو خط…",allCities:"كل المدن",onlyFleet:"فقط من لديهم عدد معلن للشاحنات",reset:"إعادة ضبط",
  tableNote:"«—» = لم نجد المعلومة في مصدر مفتوح (لا نقدّرها أبداً). الأدلة (Telecontact وCharika وOptimus) تعيد نشر السجل التجاري؛ وفئات عدد المستخدمين من Telecontact/Optimus/Kerix. عند تعارض مصدرين نعرض القيمة الأفضل توثيقاً ونذكر التعارض في الخلية.",
  cols:{name:"الشركة",city:"المدينة",founded:"التأسيس",capital:"رأس المال",fleet:"الشاحنات / الأسطول",employees:"المستخدمون",lanes:"الخطوط",loads:"شاحنة كاملة / تجميع",certs:"الشهادات",listed:"مدرجة؟"},
  detailTitle:"التفاصيل",close:"إغلاق",src:"المصادر",
  fields:{city:"المدينة / المقر",founded:"سنة التأسيس",legal:"الشكل القانوني",capital:"رأس المال",ids:"المعرّفات (RC / ICE)",fleet:"الشاحنات / الأسطول",employees:"عدد المستخدمين",volume:"الرحلات / الحجم في السنة",revenue:"رقم المعاملات",lanes:"الخطوط (فرنسا / إسبانيا / أخرى)",loads:"شاحنة كاملة (FTL) / تجميع",services:"الخدمات",certs:"الشهادات (ISO، OEA…)",parent:"المجموعة / الشركة الأم",listed:"هل هي مدرجة في البورصة؟",web:"الموقع الإلكتروني",note:"ملاحظة",logo:"الشعار (المصدر الرسمي)"},
  hChart:"بالصورة: الأرقام الموثّقة فقط",mCapital:"رأس المال (درهم)",mFleet:"الأسطول (أرقام منشورة)",mRevenue:"رقم المعاملات (درهم)",hideBig:"إخفاء SJL (كبيرة جداً على المقياس)",
  chartCap:"رأس المال المسجّل في السجل التجاري/الأدلة. SJL: 253 711 500 درهم (مخفية للوضوح عند التحديد).",
  chartFleet:"الأعمدة المخططة = رقم صرّحت به الشركة نفسها دون تدقيق؛ الأعمدة المصمتة = تقرير رسمي / BERD (Janou: أكتوبر 2022). Group Inter Five وTIMAR غير ظاهرتين: أرقام متناقضة أو قديمة جداً. MFAH تحسب الشاحنات والمقطورات منفصلة (30 + 14). MA France Trans: نسأل حسن.",
  chartRev:"رقم المعاملات من حسابات مودعة أو مدققة: TIMAR 2023 (حسابات الشركة المدققة)، SDFM وTCL 2024 (حسابات مودعة، عبر Welipro). السنوات مختلفة. الباقون: — (غير منشور). MA France Trans: ميزانيات مدفوعة في Charika لم نقرأها.",
  noValue:"— (نسأل حسن)",noLogo:"لم نجد شعاراً رسمياً موثوقاً: نعرض الأحرف الأولى (لا شيء مخترع)",logoSrc:"مصدر الشعار",
  hListed:"الشركات المدرجة: النتائج المالية",listedIntro:"لا يظهر أي منافس من العشرة في نشرة التسعيرة ليوم 27/11/2026. TIMAR (مدرجة من 2007 إلى 2024) وشركتها الأم CLASQUIN خرجتا من التسعيرة؛ والمدرجة الوحيدة في الدار البيضاء هي CTM (منافس غير مباشر). أضفنا حسابات TIMAR المدققة لسنة 2023 (AMMC).",
  hNeeds:"ما نحتاجه من حسن",needsIntro:"لنملأ صف «MA France Trans» بأرقام حقيقية (دون تقدير):",
  hDropped:"شركات حذفناها من القائمة الأولى",droppedIntro:"استبدلناها لأن بيانات السجل لا تدعم ما يعلنه موقعها.",
  hOthers:"لاعبون آخرون يستحقون المتابعة (خارج الجدول)",othersIntro:"موثّقون جيداً لكنهم خارج الأكثر صلة (10). Golden Way هي الوحيدة التي لها مستودع في القنيطرة. الأرقام = ما تنشره مواقعهم (تصريح ذاتي).",
  hSources:"كل المصادر",srcIntro:"صفحات فتحناها وقرأناها يوم 28 نوفمبر 2026 (توقيت الرياض)، إلا ما كُتب عنه «مقتطف بحث».",
  footer:"المنافسون · بيانات 28/11/2026",credit:"إعداد",skip:"انتقل إلى المحتوى",
  badges:{reg:"سجل / دليل قانوني",dir:"دليل تجاري (فئة)",self:"تصريح ذاتي (موقع الشركة)",fil:"تقرير / إيداع رسمي",unv:"غير متحقق (مقتطف بحث)"},
  yes:"نعم",
  sum:[
   "MA France Trans: القنيطرة، RC 41789، ICE 000093575000034، SARL بشريك وحيد، رأس المال 2 100 000 درهم، حالتها «نشطة». أول تسجيل منشور: 12/07/2013 في طنجة (قيد طنجة «مشطوب»). عدد الشاحنات والمستخدمين والخطوط: نسأل حسن. والشركة الفرنسية SAS بنفس الاسم مشطوبة منذ 10/06/2024.",
   "حسب رأس المال المسجّل، MA France Trans في المرتبة 7 من 11: فوق Otmatrans (1 مليون) وRTL (0,5 مليون) وElza وMFAH (0,1 مليون لكل منهما)؛ وتحت SJL (253,7 مليون) وTIMAR (30,1) وJanou (21) وGroup Inter Five (10) وTCL (4) وSDFM (3,9).",
   "الأساطيل المنشورة: SJL 450 شاحنة + 800 نصف مقطورة (المجموعة، تصريح ذاتي)؛ SDFM 348 مركبة (تصريح ذاتي)؛ MFAH 44 ملك (30 شاحنة + 14 مقطورة) + 120 شريكة؛ Janou أكثر من 45 وحدة مبرّدة (BERD، 2022)؛ Golden Way حوالي 40 رأساً جرّاراً (خارج الجدول). Group Inter Five تناقض نفسها (50 أو 130). الباقون: —.",
   "رقم المعاملات المنشور: TIMAR 432,1 مليون درهم (2023، حسابات مدققة، 297 مستخدماً)؛ SDFM 123,8 مليون وTCL 117,5 مليون (2024، حسابات مودعة). لم نجد أي رقم لـ MA France Trans (ميزانيات مدفوعة في Charika).",
   "المنافسون العشرة كلهم ينقلون بالشاحنات بين المغرب وأوروبا: 9 من 10 يقدمون شاحنة كاملة و6 إلى 7 يقدمون التجميع (Elza شاحنة كاملة فقط؛ SDFM غير محدد). برشلونة: TCL (محطة)، TIMAR عبر Saner (رحلات أسبوعية)، RTL (الشريك Illaexport)؛ وخارج الجدول Transunivers وMarglory وGFL.",
   "MA France Trans هي الوحيدة من الـ11 في القنيطرة، لكن Golden Way (≈ 40 رأساً جرّاراً) لها مستودع هناك. لا منافس مدرج اليوم: TIMAR كانت مدرجة من 2007 إلى 2024؛ وCTM (المدرجة) منافس غير مباشر فقط."]}
};
const T=()=>UI[lang];
const pick=o=>o?o[lang]:'';
const NUMLOCALE=lang=>lang==='ar'?'ar-MA-u-nu-latn':'fr-FR';
const fmt=n=>new Intl.NumberFormat(NUMLOCALE(lang)).format(n);

COMPANIES.forEach(c=>{
 const cf=c.city.fr;c.cityKey=/Kénitra/.test(cf)?'Kénitra':/Tanger/.test(cf)?'Tanger':/Casablanca/.test(cf)?'Casablanca':/Agadir/.test(cf)?'Agadir':cf;
 const e=c.employees.fr;c.empNum=(!c.employees.t)?null:(/Moins/.test(e)?0:(parseInt((e.match(/\d+/)||[null])[0],10)||null));
});

function badge(t){return t?`<span class="bd ${t}" title="${T().badges[t]}">${T().badges[t].split(' (')[0].split(' /')[0]}</span>`:''}
function esc(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function rich(s){const e=esc(s);return lang==='ar'?e.replace(/\d+(?:[ \u00a0,.]\d+)*/g,m=>`<bdi dir="ltr">${m}</bdi>`):e}
function short(s,n){return s.length>n?s.slice(0,n-1).trim()+'…':s}
function cell(v,n){const s=pick(v);const unk=!v.t&&/^—/.test(s);return `<span class="${unk?'dash':''}">${rich(short(s,n||70))}</span>${badge(v.t)}`}


function initials(n){const w=String(n).replace(/\(.*?\)/g,'').replace(/[^A-Za-z0-9À-ÿ ]/g,' ').trim().split(/\s+/).filter(Boolean);return ((w[0]||'?')[0]+((w[1]||'')[0]||(w[0]||'')[1]||'')).toUpperCase()}
function logo(id,name,big){const L=LOGOS[id],cl='lg'+(big?' big':'');
 if(!L)return `<span class="${cl} ph" role="img" aria-label="${esc(name)}" title="${esc(T().noLogo)}">${esc(initials(name))}</span>`;
 return `<span class="${cl}${L.bg==='dark'?' dark':''}"><img src="${L.f}" alt="${esc(name)}" loading="lazy" onerror="this.parentNode.className='${cl} ph';this.parentNode.textContent='${esc(initials(name))}'"></span>`}
function logoSrc(id){const L=LOGOS[id];return L?`<a href="${L.u}" target="_blank" rel="noopener">↗ ${esc(T().logoSrc)}</a> <span class="small">· ${esc(L.how)}</span>`:`<span class="small">${esc(T().noLogo)}</span>`}

function render(){
 const t=T();document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('#lang').value=lang;
 document.title='MA France Trans · '+t.crumb;
 for(const k of ['kicker','title','subtitle','crumb','spaceLabel','navBack','navHere','sideNote','hSum','legendNote','hTable','tableHelp','tableNote','hChart','chartNote','hListed','listedIntro','hNeeds','needsIntro','hDropped','droppedIntro','hOthers','othersIntro','hSources','srcIntro','footerText','credit'])if($('#'+k)&&t[k]!==undefined)$('#'+k).textContent=t[k];
 $('#skip').textContent=t.skip;$('#footerText').textContent=t.footer;
 $('#q').placeholder=t.search;$('#lblFleet').textContent=t.onlyFleet;$('#resetBtn').textContent=t.reset;
 const cities=['Kénitra','Tanger','Casablanca','Agadir'],cur=$('#cityFilter').value||'';
 $('#cityFilter').innerHTML=`<option value="">${t.allCities}</option>`+cities.map(c=>`<option value="${c}">${c}</option>`).join('');$('#cityFilter').value=cur;
 $('#sumList').innerHTML=t.sum.map(x=>`<li>${rich(x)}</li>`).join('');
 $('#legend').innerHTML=Object.keys(t.badges).map(k=>`<span><span class="bd ${k}" style="margin:0">${t.badges[k].split(' (')[0].split(' /')[0]}</span> <span class="small">${t.badges[k]}</span></span>`).join('');
 renderTable();renderDetail();renderChart();renderListed();
 $('#needs').innerHTML=NEEDS.map(n=>`<li>${rich(n[lang])}</li>`).join('');
 $('#others').innerHTML=OTHERS.map(d=>`<div class="drop otherrow ${d.star?'star':''}">${d.id?logo(d.id,d.n):''}<div class="oc"><b>${esc(d.n)}</b> ${badge(d.t)} ${rich(d[lang])}${linksOf(d.s)}</div></div>`).join('');
 $('#dropped').innerHTML=DROPPED.map(d=>`<div class="drop"><b>${esc(d.n)}</b>${rich(d[lang])}${linksOf(d.s)}</div>`).join('');
 const used=Object.keys(SRC);
 $('#sources').innerHTML=used.map(k=>`<li><a href="${SRC[k].u}" target="_blank" rel="noopener">${esc(SRC[k].l)}</a></li>`).join('');
}
function linksOf(ids){return ids&&ids.length?`<span class="dsrc">${ids.map(i=>`<a href="${SRC[i].u}" target="_blank" rel="noopener">↗ ${esc(SRC[i].l)}</a>`).join('')}</span>`:''}

function rows(){
 const q=$('#q').value.trim().toLowerCase(),city=$('#cityFilter').value,onlyFleet=$('#onlyFleet').checked;
 let list=COMPANIES.filter(c=>c.me||((!city||c.cityKey===city)&&(!onlyFleet||c.fleet.num)&&(!q||(c.name+' '+c.city.fr+' '+c.city.ar+' '+c.lanes.fr+' '+c.lanes.ar+' '+c.services.fr+' '+c.services.ar).toLowerCase().includes(q))));
 const me=list.filter(c=>c.me),others=list.filter(c=>!c.me);
 if(sortKey){const val=c=>sortKey==='name'?c.name.toLowerCase():sortKey==='city'?c.cityKey:sortKey==='founded'?c.founded.num:sortKey==='capital'?c.capital.num:sortKey==='fleet'?c.fleet.num:sortKey==='employees'?c.empNum:sortKey==='revenue'?c.revenue.num:sortKey==='listed'?pick(c.listed):pick(c[sortKey]);
  others.sort((a,b)=>{const x=val(a),y=val(b);const nx=x==null||x==='',ny=y==null||y==='';if(nx&&ny)return 0;if(nx)return 1;if(ny)return -1;return (x>y?1:x<y?-1:0)*sortDir})}
 return me.concat(others);
}
function renderTable(){
 const t=T(),keys=['name','city','founded','capital','fleet','employees','lanes','loads','listed'];
 $('#cmp thead').innerHTML='<tr>'+keys.map(k=>`<th scope="col"><button type="button" data-k="${k}" class="${sortKey===k?'on':''}">${t.cols[k]}${sortKey===k?(sortDir>0?' ▲':' ▼'):' ↕'}</button></th>`).join('')+'</tr>';
 $('#cmp thead').querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(sortKey===k)sortDir=-sortDir;else{sortKey=k;sortDir=1}renderTable()});
 $('#cmp tbody').innerHTML=rows().map(c=>`<tr data-id="${c.id}" tabindex="0" class="${c.me?'me':''} ${selected===c.id?'sel':''}"><td><div class="namecell">${logo(c.id,c.name)}<span class="nm">${esc(c.name)}</span></div></td><td>${cell(c.city,40)}</td><td>${cell(c.founded,30)}</td><td>${cell(c.capital,40)}</td><td>${cell(c.fleet,60)}</td><td>${cell(c.employees,40)}</td><td>${cell(c.lanes,60)}</td><td>${cell(c.loads,48)}</td><td>${cell(c.listed,34)}</td></tr>`).join('');
 $('#cmp tbody').querySelectorAll('tr').forEach(r=>{const go=()=>{selected=r.dataset.id;renderTable();renderDetail(true)};r.onclick=go;r.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
}
function renderDetail(scroll){
 const box=$('#detail'),c=COMPANIES.find(x=>x.id===selected);if(!c){box.hidden=true;return}
 const t=T();box.hidden=false;
 const order=['city','founded','legal','capital','ids','fleet','employees','volume','revenue','lanes','loads','services','certs','parent','listed','web'];if(c.note)order.push('note');
 box.innerHTML=`<div class="row"><div><div class="kicker ${c.me?'me':''}">${t.detailTitle}</div><div class="detailhead">${logo(c.id,c.name,true)}<h2>${esc(c.name)}</h2></div></div><button class="secondary" type="button" id="closeDetail">${t.close}</button></div><div class="detailgrid">`+order.map(k=>`<div class="k">${t.fields[k]}</div><div>${rich(pick(c[k]))}${badge(c[k].t)}${linksOf(c[k].s)}</div>`).join('')+`<div class="k">${t.fields.logo}</div><div class="logosrc">${logoSrc(c.id)}</div></div>`;
 $('#closeDetail').onclick=()=>{selected=null;renderTable();renderDetail()};
 if(scroll)box.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderChart(){
 const t=T();
 $('#metricSeg').innerHTML=`<button type="button" data-m="capital" class="${metric==='capital'?'on':''}">${t.mCapital}</button><button type="button" data-m="fleet" class="${metric==='fleet'?'on':''}">${t.mFleet}</button><button type="button" data-m="revenue" class="${metric==='revenue'?'on':''}">${t.mRevenue}</button>`+(metric==='capital'?`<label class="chk"><input type="checkbox" id="hideBig" ${hideBig?'checked':''}><span>${t.hideBig}</span></label>`:'');
 $('#metricSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{metric=b.dataset.m;renderChart()});
 const hb=$('#hideBig');if(hb)hb.onchange=()=>{hideBig=hb.checked;renderChart()};
 let list=COMPANIES.filter(c=>c[metric].num);
 if(metric==='capital'&&hideBig)list=list.filter(c=>c.id!=='sjl');
 list.sort((a,b)=>b[metric].num-a[metric].num);
 const max=Math.max(...list.map(c=>c[metric].num));
 let html=list.map(c=>{const v=c[metric].num,w=Math.max(1,v/max*100);return `<div class="barrow"><div>${esc(c.name)} ${badge(c[metric].t)}</div><div class="bartrack"><div class="barfill ${c.me?'me':''} ${c[metric].t==='self'?'self':''}" style="width:${w}%"></div><span class="barval"><bdi dir="ltr">${fmt(v)}</bdi></span></div></div>`}).join('');
 if(metric!=='capital'){const me=COMPANIES[0];html+=`<div class="barrow"><div><b>${esc(me.name)}</b></div><div class="small">${t.noValue}</div></div>`}
 $('#chart').innerHTML=html;$('#chartNote').textContent=metric==='capital'?t.chartCap:metric==='fleet'?t.chartFleet:t.chartRev;
}
function renderListed(){
 const t=T();
 // build tables explicitly (language-aware first column)
 $('#listed').innerHTML=LISTED.map(l=>{
  const tr=l.rows.map((r,i)=>{const label=r[lang==='ar'?1:0].replace(/^(fr|ar):/,'');const cells=[r[2],r[3]];return i===0?`<tr><th>${esc(label)}</th><th class="n"><bdi dir="ltr">${cells[0]}</bdi></th><th class="n"><bdi dir="ltr">${cells[1]}</bdi></th></tr>`:`<tr><td>${esc(label)}</td><td class="n"><bdi dir="ltr">${cells[0]}</bdi></td><td class="n"><bdi dir="ltr">${cells[1]}</bdi></td></tr>`}).join('');
  return `<div class="card"><h3>${esc(l.name)}</h3><p class="small">${rich(pick(l.status))}${badge(l.status.t)}</p><p class="small">${rich(pick(l.rel))}</p><table>${tr}</table><p class="small">${rich(pick(l.extra))}${badge(l.extra.t)}</p><p class="small">${l.s.map(i=>`<a href="${SRC[i].u}" target="_blank" rel="noopener">↗ ${esc(SRC[i].l)}</a>`).join('<br>')}</p></div>`}).join('');
}
$('#lang').addEventListener('change',e=>{lang=e.target.value;try{localStorage.setItem('maft_language',lang)}catch(x){}render()});
['q','cityFilter','onlyFleet'].forEach(id=>$('#'+id).addEventListener('input',renderTable));
$('#resetBtn').onclick=()=>{$('#q').value='';$('#cityFilter').value='';$('#onlyFleet').checked=false;sortKey=null;sortDir=1;renderTable()};
render();
