'use strict';
const byId = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const events = [
  {name:'Cafe Show Seoul 2026', kind:'معرض', sector:'القهوة والضيافة', country:'كوريا الجنوبية', city:'سيول', month:11, date:'11–14 نوفمبر 2026', url:'https://www.coex.co.kr/en/exhibitions/the-25th-seoul-intl-cafe-show/', note:'11 و12 نوفمبر للمهنيين والمشترين، و13 و14 نوفمبر للجمهور.'},
  {name:'CES 2027', kind:'معرض', sector:'التقنية والابتكار', country:'الولايات المتحدة', city:'لاس فيغاس', month:1, date:'6–9 يناير 2027', url:'https://www.ces.tech/attend/registration-notification', note:'راجع شروط الحضور والمشاركة قبل التخطيط للسفر.'},
  {name:'Cityscape Global', kind:'معرض', sector:'العقار والاستثمار', country:'السعودية', city:'الرياض', month:2, date:'1–4 فبراير 2027', url:'https://cityscapeglobal.com/frequently-asked-questions', note:'الموعد المحدّث لدى المنظم بعد تأجيل نسخة نوفمبر 2026.'},
  {name:'اليوم الدولي للقهوة', kind:'مناسبة', sector:'القهوة والضيافة', country:'دولي', city:'', month:10, date:'1 أكتوبر من كل عام', url:'https://www.un.org/en/node/246274', note:'مناسبة سنوية. لكل فعالية مرتبطة بها موعد ومكان ومنظم.'},
  {name:'ICRA 2027', kind:'مؤتمر', sector:'الروبوتات والأتمتة', country:'كوريا الجنوبية', city:'سيول', parts:['معرض','منتدى','ورشة عمل'], month:5, date:'24–28 مايو 2027', url:'https://2027.ieee-icra.org/about/', note:'مؤتمر IEEE يضم معرضًا ومنتديات وورش عمل. راجع برنامج كل جزء لدى المنظم.'}
];
const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const option = (value, label) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(label) + '</option>';
byId('country').insertAdjacentHTML('beforeend', [...new Set(events.map(event => event.country))].map(country => option(country,country)).join(''));
byId('month').insertAdjacentHTML('beforeend', months.map((month,index) => option(index+1,month)).join(''));

function renderCalendar() {
  const term = byId('query').value.trim().toLowerCase();
  const kind = byId('kind').value;
  const country = byId('country').value;
  const month = byId('month').value;
  const matches = events.filter(event =>
    [event.name,event.sector,event.city,event.country].join(' ').toLowerCase().includes(term) &&
    (!kind || event.kind === kind || event.parts?.includes(kind)) &&
    (!country || event.country === country) && (!month || event.month === Number(month)));
  byId('calendar-count').textContent = matches.length ? 'النتائج (' + matches.length + ')' : 'جرّب نوعًا أو شهرًا آخر.';
  byId('events').innerHTML = matches.map(event => {
    const index = events.indexOf(event);
    const scope = event.parts?.includes(kind) ? kind : '';
    const exhibitorScope = event.kind === 'معرض' ? '' : 'معرض';
    return '<article><span class="tag">' + event.kind + '</span>' +
      (event.parts ?? []).map(part => '<span class="tag">يتضمن ' + part + '</span>').join('') +
      '<h3>' + event.name + '</h3><p>' + [event.date,event.city,event.sector].filter(Boolean).join(' · ') + '</p><p>' + event.note + '</p>' +
      (event.url ? '<a class="source" href="' + event.url + '">مصدر الموعد ↗</a><br><small>آخر تحقق 9 نوفمبر 2026</small>' : '') +
      (event.kind === 'مناسبة' ? '' : '<div class="controls"><button class="action secondary" data-start="visitor" data-event="' + index + '" data-scope="' + scope + '">قيّم الزيارة</button><button class="action secondary" data-start="exhibitor" data-event="' + index + '" data-scope="' + exhibitorScope + '">قيّم المشاركة</button></div>') +
      '</article>';
  }).join('');
}
['query','kind','country','month'].forEach(id => byId(id).addEventListener('input',renderCalendar));

const tracks = {
  visitor: {
    goals:['البحث عن موردين','التعلم والتطوير','استكشاف سوق','بناء علاقات'],
    questions:[
      ['تطابق البرنامج مع هدفك',30,'هل وجدت جهات أو جلسات تخدم هدفك مباشرة؟','راجع دليل العارضين والبرنامج، واختر أهم 5 أسماء.'],
      ['الوصول إلى الجهات',25,'إلى أي مدى تستطيع ترتيب لقاءات أو دخول الجلسات المطلوبة؟','أكد مواعيدك وشروط الدخول قبل حجز الرحلة.'],
      ['قيمة التجربة المباشرة',20,'ما قيمة تجربة المنتجات أو حضور الجلسات بالنسبة لهدفك؟','حدد تجربة أو سؤالًا يستحق الحضور من أجله.'],
      ['ملاءمة الوقت والتكلفة',15,'هل وقت الزيارة والسفر وتكاليفهما ضمن حدودك؟','اجمع تكلفة الرحلة وقارن يومًا واحدًا ببرنامج أطول.'],
      ['المتابعة بعد الزيارة',10,'هل تستطيع تحويل ما تجمعه إلى خطوة عملية بعد العودة؟','حدد موعدًا لمقارنة العروض أو تطبيق ما تعلمته.']
    ],
    plans:['حدد أهم الجهات والجلسات، وجهز سؤالًا لكل لقاء.','سجل النتيجة والخطوة التالية لكل لقاء أو جلسة.','قارن النتائج بهدف الزيارة، وحدد مسؤولًا وموعدًا للمتابعة.']
  },
  exhibitor: {
    goals:['توليد فرص بيعية','البحث عن موزعين','اختبار منتج','دخول سوق جديد'],
    questions:[
      ['تطابق الجمهور مع هدفك',30,'إلى أي مدى يطابق جمهور المعرض العملاء أو الشركاء الذين تستهدفهم؟','اطلب بيانات الجمهور حسب الوظيفة والقطاع من آخر نسخة.'],
      ['جدوى التكلفة',25,'هل تتناسب تكلفة الجناح والفريق والسفر والمتابعة مع النتيجة المتوقعة؟','اطلب عرض تكلفة مكتوبًا وأضف الشحن والتجهيز ووقت الفريق.'],
      ['الوصول لأصحاب القرار',20,'ما فرصة ترتيب لقاءات مع المشترين أو الموزعين المستهدفين؟','جهز قائمة الجهات وابدأ حجز اللقاءات قبل المعرض.'],
      ['جاهزية الفريق',15,'هل المنتج والمواد والفريق والمتابعة جاهزة في الموعد؟','وزع الأدوار وحدد من يؤهل الفرص ويتابعها.'],
      ['القيمة الاستراتيجية',10,'هل تخدم المشاركة هدف دخول السوق أو اختبار المنتج أو بناء علاقات؟','حدد مؤشرًا للنجاح، مثل طلبات العينات أو اجتماعات الموزعين.']
    ],
    plans:['قارن الجناح المستقل والجناح المشترك والزيارة التجارية.','سجل الفرص المؤهلة واتفق على الخطوة التالية مع كل جهة.','راجع تكلفة الفرصة والصفقات المحققة قبل قرار النسخة المقبلة.']
  }
};
const fields = {name:'event-name',scope:'scope',goal:'goal',url:'event-url'};
const storageKey = 'hatta-exhibitions-v1';
let stored;
try { stored = JSON.parse(localStorage.getItem(storageKey)); } catch {}
let role = stored?.role === 'exhibitor' ? 'exhibitor' : 'visitor';
let drafts = stored?.drafts ?? {};
let saved = Array.isArray(stored?.saved) ? stored.saved.slice(0,2) : [];
let draft;
let step = 0;
const blank = () => ({name:'',scope:'',goal:'',url:'',answers:[],step:0,plan:'',finance:{}});
function persist() {
  draft.step = step;
  try { localStorage.setItem(storageKey,JSON.stringify({role,drafts,saved})); } catch {}
}
function loadRole(nextRole) {
  role = nextRole;
  draft = drafts[role] ??= blank();
  step = Math.min(4,Math.max(0,Number(draft.step) || 0));
  byId('role').value = role;
  byId('goal').innerHTML = tracks[role].goals.map(goal => option(goal,goal)).join('');
  draft.goal ||= tracks[role].goals[0];
  Object.entries(fields).forEach(([key,id]) => byId(id).value = draft[key]);
  byId('result').hidden = true;
  renderQuestion();
  persist();
}
function renderQuestion() {
  const [label,weight,prompt,hint] = tracks[role].questions[step];
  const answer = draft.answers[step];
  byId('step-label').textContent = 'السؤال ' + (step+1) + ' من 5';
  byId('progress').value = draft.answers.filter(Boolean).length;
  byId('back').disabled = step === 0;
  byId('next').textContent = step === 4 ? 'عرض النتيجة ←' : 'التالي ←';
  byId('question').innerHTML = '<h3 id="question-title" tabindex="-1">' + label + ' <span class="tag">وزن ' + weight + ' من 100</span></h3><p>' + prompt + '</p>' +
    '<div class="question-options" role="group" aria-labelledby="question-title">' +
    ['0 · معدوم','1 · ضعيف','2 · محدود','3 · متوسط','4 · جيد','5 · قوي','قيد التحقق'].map((choice,index) =>
      '<label><input type="radio" name="rating" value="' + index + '" required ' + (answer?.value === index ? 'checked' : '') + '> ' + choice + '</label>').join('') +
    '</div><label class="field">حالة الدليل<select id="evidence"><option value="estimate">تقدير شخصي</option><option value="organizer">معلن من المنظم</option><option value="verified">موثق بمصدر</option></select></label><p><small>' + hint + '</small></p>';
  byId('evidence').value = answer?.evidence ?? 'estimate';
  byId('evidence').disabled = answer?.value === 6;
}
function recordAnswer() {
  const checked = byId('question').querySelector('input:checked');
  if (!checked) return;
  draft.answers[step] = {value:Number(checked.value),evidence:byId('evidence').value};
  byId('evidence').disabled = checked.value === '6';
  byId('progress').value = draft.answers.filter(Boolean).length;
  byId('result').hidden = true;
  persist();
}
function scoreAnswers(questions,answers) {
  let points = 0, rated = 0, evidence = 0;
  questions.forEach((question,index) => {
    const answer = answers[index];
    if (!answer || answer.value === 6) return;
    const weight = question[1];
    points += weight * answer.value / 5;
    rated += weight;
    if (answer.evidence !== 'estimate') evidence += weight;
  });
  return {score:rated ? Math.round(100 * points / rated) : null,evidence,low:Math.round(points),high:Math.round(points + 100 - rated),rated};
}
function recommendation(metrics) {
  if (metrics.rated < 100 || metrics.evidence < 60) return role === 'visitor' ? 'زيارة مشروطة بالتحقق' : 'تحقق من البيانات قبل الالتزام بجناح';
  if (role === 'visitor') return metrics.score >= 75 ? 'زيارة مركزة' : metrics.score >= 55 ? 'حضور الأجزاء الأقرب لهدفك' : 'قارن بفعالية أخرى';
  return metrics.score >= 75 ? 'ادرس عرض جناح مستقل' : metrics.score >= 55 ? 'قارن جناحًا مشتركًا بزيارة تجارية' : 'زيارة استكشافية أو تأجيل المشاركة';
}
const financeFields = [['cost','التكلفة الكاملة'],['margin','هامش المساهمة لكل صفقة'],['rate','نسبة التحويل المتوقعة']];
let currentSummary;
function showResult() {
  const track = tracks[role];
  const metrics = scoreAnswers(track.questions,draft.answers);
  const recommendationText = recommendation(metrics);
  const priorities = track.questions.map((question,index) => ({question,answer:draft.answers[index]}))
    .sort((a,b) => priority(b) - priority(a)).slice(0,2).map(item => item.question[3]);
  const name = draft.name.trim();
  currentSummary = {name,role,goal:draft.goal,scope:draft.scope,metrics,recommendation:recommendationText,priorities};
  const result = byId('result');
  result.innerHTML = '<div class="eyebrow">ملخص القرار</div><h3 tabindex="-1" id="result-title">' + escapeHtml(name) + '</h3><p>' + escapeHtml(draft.goal) + ' · ' + escapeHtml(draft.scope || 'الفعالية كاملة') + '</p><p><strong>' + recommendationText + '</strong></p>' +
    '<p>ملاءمة الإجابات المتاحة <strong>' + (metrics.score === null ? 'بانتظار بيانات' : metrics.score + ' من 100') + '</strong> · تغطية الأدلة <strong>%' + metrics.evidence + '</strong></p>' +
    (metrics.score === null ? '' : '<div class="heat" aria-hidden="true"><i style="right:' + metrics.score + '%"></i></div>') +
    (metrics.rated < 100 ? '<p>النطاق المحتمل بعد استكمال البيانات: ' + metrics.low + ' إلى ' + metrics.high + ' من 100.</p>' : '') +
    '<details><summary>تفاصيل المصفوفة والأوزان</summary><ul>' + track.questions.map(([label,weight],index) => {
      const answer = draft.answers[index];
      return '<li>' + label + ' · وزن ' + weight + ' · ' + (answer.value === 6 ? 'قيد التحقق' : answer.value + ' من 5') + '</li>';
    }).join('') + '</ul></details>' +
    '<h3>ما الذي تراجعه أولًا؟</h3><ul>' + priorities.map(item => '<li>' + item + '</li>').join('') + '</ul><h3>خطة العمل</h3><ol>' + track.plans.map(item => '<li>' + item + '</li>').join('') + '</ol>' +
    '<label class="field">ملاحظات وخطوات خاصة بفعاليتك<textarea id="plan">' + escapeHtml(draft.plan) + '</textarea></label>' +
    (role === 'exhibitor' ? '<h3>نقطة التعادل التقديرية</h3><div class="filters">' + financeFields.map(([id,label]) => '<label>' + label + (id === 'rate' ? ' (%)' : ' (⃁)') + '<input id="' + id + '" type="number" min="0" step="any" ' + (id === 'rate' ? 'max="100"' : '') + ' value="' + escapeHtml(draft.finance[id]) + '"></label>').join('') + '</div><p id="finance-output" role="status"></p>' : '') +
    '<div class="controls"><button class="action primary" id="share">مشاركة الملخص</button><button class="action secondary" id="print">طباعة أو حفظ PDF</button><button class="action secondary" id="save-comparison">أضف للمقارنة</button></div><p id="share-status" role="status"></p>';
  result.hidden = false;
  byId('result-title').focus();
  byId('plan').addEventListener('input',event => { draft.plan = event.target.value; persist(); });
  byId('share').addEventListener('click',shareSummary);
  byId('print').addEventListener('click',() => window.print());
  byId('save-comparison').addEventListener('click',saveComparison);
  if (role === 'exhibitor') {
    financeFields.forEach(([id]) => byId(id).addEventListener('input',event => {draft.finance[id] = event.target.value; persist(); renderFinance();}));
    renderFinance();
  }
}
function priority(item) {
  const {value,evidence} = item.answer;
  return item.question[1] * (value === 6 ? 7 : 5-value + (evidence === 'estimate' ? 1 : 0));
}
function renderFinance() {
  const cost = Number(draft.finance.cost), margin = Number(draft.finance.margin), rate = Number(draft.finance.rate);
  const deals = Math.ceil(cost / margin);
  byId('finance-output').textContent = cost > 0 && margin > 0 && Number.isFinite(deals)
    ? 'لتغطية التكلفة تحتاج ' + deals + ' صفقات' + (rate > 0 && rate <= 100 ? '، أي ' + Math.ceil(deals * 100 / rate) + ' فرصة مؤهلة بالتقدير المدخل.' : '. أدخل نسبة تحويل بين 0 و100 لحساب الفرص.')
    : 'أدخل التكلفة الكاملة وهامش المساهمة لحساب عدد الصفقات.';
}
async function shareSummary() {
  const summary = currentSummary;
  const text = [summary.name,summary.goal + ' · ' + (summary.scope || 'الفعالية كاملة'),summary.recommendation,
    'الملاءمة: ' + (summary.metrics.score ?? 'قيد التحقق') + ' · تغطية الأدلة: %' + summary.metrics.evidence,
    ...summary.priorities,location.href.split('#')[0]].join('\n');
  try {
    if (navigator.share) { await navigator.share({title:'حتى للمعارض والمؤتمرات',text}); return; }
    await navigator.clipboard.writeText(text);
    byId('share-status').textContent = 'تم نسخ الملخص.';
  } catch (error) {
    if (error.name !== 'AbortError') byId('share-status').textContent = 'يمكنك حفظ الملخص من زر الطباعة.';
  }
}
function saveComparison() {
  const summary = currentSummary;
  saved = saved.filter(item => [item.name,item.role,item.goal,item.scope].join('|') !== [summary.name,summary.role,summary.goal,summary.scope].join('|'));
  saved.push(summary);
  saved = saved.slice(-2);
  persist();
  renderComparison();
}
function renderComparison() {
  const compare = byId('compare');
  compare.hidden = !saved.length;
  compare.innerHTML = '<h3>مقارنة تقييمين</h3><p>تعرض المقارنة أحدث تقييمين محفوظين. تختلف دلالة الدرجة عند اختلاف الهدف أو صفة المشاركة.</p><table><thead><tr><th>البند</th>' +
    saved.map(item => '<th>' + escapeHtml(item.name) + '</th>').join('') + '</tr></thead><tbody>' +
    [['المسار',item => (item.role === 'visitor' ? 'زائر' : 'عارض') + ' · ' + item.goal],
      ['النطاق',item => item.scope || 'الفعالية كاملة'],['الملاءمة',item => item.metrics.score ?? 'قيد التحقق'],
      ['تغطية الأدلة',item => '%' + item.metrics.evidence],['القرار',item => item.recommendation]].map(([label,value]) =>
      '<tr><th scope="row">' + label + '</th>' + saved.map(item => '<td>' + escapeHtml(value(item)) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table><button class="action secondary" id="clear-comparison">مسح المقارنة</button>';
  byId('clear-comparison').addEventListener('click',() => {saved = []; persist(); renderComparison();});
}
function start(nextRole,event,scope) {
  if (event) drafts[nextRole] = {...blank(),name:event.name,url:event.url ?? '',scope:scope || ''};
  loadRole(nextRole);
  byId('assessment').scrollIntoView();
  byId('event-name').focus({preventScroll:true});
}
document.addEventListener('click',event => {
  const button = event.target.closest('[data-start]');
  if (button) start(button.dataset.start,events[button.dataset.event],button.dataset.scope);
});
byId('role').addEventListener('change',event => loadRole(event.target.value));
Object.entries(fields).forEach(([key,id]) => byId(id).addEventListener('input',event => {
  if (key === 'goal' && draft.goal !== event.target.value) {
    draft.answers = []; step = 0; renderQuestion();
  }
  draft[key] = event.target.value;
  byId('result').hidden = true;
  persist();
}));
byId('question').addEventListener('change',recordAnswer);
byId('back').addEventListener('click',() => {step--; renderQuestion(); persist(); byId('question-title').focus();});
byId('wizard').addEventListener('submit',event => {
  event.preventDefault();
  if (!draft.name.trim()) {byId('event-name').focus(); return;}
  recordAnswer();
  if (step === 4) {showResult(); return;}
  step++; renderQuestion(); persist(); byId('question-title').focus();
});
byId('example').addEventListener('click',() => {
  const exhibitor = role === 'exhibitor';
  drafts[role] = {...blank(),name:events[0].name,url:events[0].url,scope:'المعرض التجاري · مثال تدريبي',
    goal:tracks[role].goals[exhibitor ? 1 : 0],step:4,
    answers:(exhibitor ? [4,6,3,4,5] : [5,4,5,3,4]).map((value,index) => ({value,evidence:index < 3 ? 'organizer' : 'estimate'})),
    finance:exhibitor ? {cost:'60000',margin:'15000',rate:'20'} : {}};
  loadRole(role);
  showResult();
});
renderCalendar();
loadRole(role);
renderComparison();

document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click',() => {
  loadRole(button.dataset.demo);
  byId('example').click();
  byId('result').scrollIntoView({behavior:'smooth'});
}));
