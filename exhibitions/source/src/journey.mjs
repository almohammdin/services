// Goal-specific starting tasks. Persisted data keeps the existing v3 schema.
const goals = {
  suppliers: ['حدد الموردين الذين تريد مقابلتهم', 'جهز أسئلة السعر والضمان والصيانة', 'رتب موعد مع مورد مناسب', 'سجل عروض الموردين', 'دون ملاحظات التجربة', 'قارن العروض حسب احتياجك', 'تواصل مع المورد المناسب'],
  learning: ['حدد الموضوعات التي تريد تعلمها', 'اختر الجلسات المناسبة لهدفك', 'جهز أسئلة للمتحدثين', 'سجل الأفكار المهمة', 'ناقش فكرة مع أحد المختصين', 'اختر فكرة قابلة للتطبيق', 'حدد موعد لتجربتها ومراجعتها'],
  network: ['حدد الجهات التي تريد التعرف عليها', 'جهز تعريف مختصر بأعمالك', 'رتب لقاء مع جهة مناسبة', 'سجل اهتمامات كل جهة', 'اتفق على خطوة متابعة', 'تواصل مع الجهات ذات الأولوية', 'حدد اللقاء القادم'],
  market: ['حدد الأسئلة التي تريد إجابات لها', 'اختر جهات تمثل السوق', 'جهز نقاط المقارنة', 'سجل ما تعلمته من الجهات', 'قارن الملاحظات بين أكثر من مصدر', 'حدد الفرص التي تستحق الدراسة', 'رتب خطوة للتحقق من كل فرصة'],
  leads: ['حدد العميل الذي تستهدفه', 'جهز العرض وأسئلة معرفة الاحتياج', 'جهز طريقة تسجيل لقاءات الجناح', 'سجل احتياج كل عميل', 'اتفق على موعد للمتابعة', 'تواصل مع العملاء المناسبين', 'راجع العروض والنتائج'],
  distributors: ['حدد مواصفات الموزع المناسب', 'جهز شروط التوزيع الأولية', 'رتب لقاءات مع موزعين محتملين', 'سجل إمكانات كل موزع', 'ناقش شروط التعاون', 'قارن عروض التوزيع', 'حدد خطوة التفاوض القادمة'],
  product: ['حدد ما تريد اختباره في المنتج', 'جهز أسئلة تجربة المنتج', 'حدد الأشخاص المناسبين للتجربة', 'سجل ملاحظات المستخدمين', 'دون التعديلات المقترحة', 'رتب التحسينات حسب الأولوية', 'حدد موعد لتجربة النسخة المحسنة']
};
export function initialTasks(eventId, goal, makeId) {
  return (goals[goal] || goals.market).map((title, i) => ({id:makeId(), eventId, title, phase:i<3?'before':i<5?'during':'after', due:'', owner:'', done:false}));
}
export function suggestedPhase(event, day) {
  if (event?.end && event.end < day) return 'after';
  if (event?.start && event.start <= day && (!event.end || day <= event.end)) return 'during';
  return 'before';
}
export function answerCount(answers) {
  return answers.filter(a=>a && Number.isFinite(a.value) && a.value>=0 && a.value<=5).length;
}
export function sourceSummary(answers) {
  const answered=answers.filter(a=>a && Number.isFinite(a.value));
  const linked=answered.filter(a=>a.evidence==='source' && /^https?:\/\//.test(a.source||'')).length;
  const organizer=answered.filter(a=>a.evidence==='organizer').length;
  const personal=answered.length-linked-organizer;
  if (!answered.length) return 'ابدأ بالإجابة عن الأسئلة';
  if (personal===answered.length) return 'مبني على تقديرك الشخصي';
  return `تقديرات شخصية: ${personal} · معلومات من المنظم: ${organizer} · روابط أرفقتها: ${linked}`;
}
