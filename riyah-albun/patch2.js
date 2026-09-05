(()=>{
const previous=window.transformStudy;
window.transformStudy=function(h){
  if(previous) h=previous(h);
  const doc=new DOMParser().parseFromString(h,'text/html');
  doc.title='قراءة في مسودة تحول شركة رياح البن - من زاوية المؤسس والحوكمة';

  const style=doc.createElement('style');
  style.textContent="@font-face{font-family:Riyal;src:url('https://raw.githubusercontent.com/abdulrysrr/new-saudi-riyal-symbol/main/font-files/saudiriyalsymbol.woff2')}.sar{font-family:Riyal!important;font-weight:400!important}";
  doc.head.appendChild(style);

  const cover=doc.querySelector('section.cover');
  if(cover){
    const h1=cover.querySelector('h1'),lead=cover.querySelector('.lead');
    if(h1) h1.textContent='قراءة في مسودة تحول شركة رياح البن';
    if(lead) lead.textContent='قراءة من زاوية المؤسس والحوكمة تركز على أثر مواد المسودة في الملكية والمجلس والتصويت ودخول المستثمر، ثم تعرض فرصا يمكن الاستفادة منها بعد التحول.';
  }

  const root=doc.querySelector('.document'), footer=root&&root.querySelector('footer.footer');
  if(!root||!footer) return h;

  const sections=[...root.querySelectorAll(':scope > section:not(.cover)')];
  const byTitle=t=>sections.find(s=>s.querySelector('h2')?.textContent.trim()===t);
  const first=byTitle('النتيجة التنفيذية');
  const notes=byTitle('الملاحظات ذات الأولوية على المسودة الحالية');
  const founder=byTitle('مركز سلطان بعد التحول');
  const shares=byTitle('فئات الأسهم المقترحة لرياح البن');
  const investor=byTitle('دخول المستثمر: ثلاثة أبواب وثلاث نتائج مختلفة');
  const marketing=sections.find(s=>/من التحليل إلى مخرجات|مسارات تطبيقية/.test(s.querySelector('h2')?.textContent||''));

  if(first){
    first.querySelector('h2').textContent='قراءة في قرار التحول';
    first.querySelector('.sub').textContent='التحول إلى شركة مساهمة مبسطة يتماشى مع توسع رياح البن وحاجتها إلى مجلس وأسهم وآليات دخول مستثمر أكثر مرونة، بشرط ضبط مواد النظام الأساس قبل اعتماده.';
    first.querySelectorAll('.card').forEach((c,i)=>{if(i>1)c.remove()});
    const cards=first.querySelectorAll('.card');
    if(cards[0]){cards[0].querySelector('.kicker')?.replaceChildren('المرحلة الحالية');cards[0].querySelector('h3').textContent='شركة مساهمة مبسطة';cards[0].querySelector('p').textContent='مرونة في الإدارة والتعيين والعزل وفئات الأسهم وأنصبة القرارات، وهو ما يخدم الملكية الحالية والاستثمار الخاص.'}
    if(cards[1]){cards[1].querySelector('.kicker')?.replaceChildren('عند قرب المستثمر المؤسسي أو سوق المال');cards[1].querySelector('h3').textContent='شركة مساهمة غير مدرجة';cards[1].querySelector('p').textContent='مرحلة أقرب عندما تصبح الأولوية لبنية مجلس ولجان وإفصاح أكثر ألفة للمستثمر المؤسسي والمستشار المالي.'}
  }
  if(notes){notes.querySelector('h2').textContent='أهم الملاحظات على المسودة الحالية'}
  if(investor){investor.querySelector('h2').textContent='دخول المستثمر'}

  sections.forEach(s=>{
    if(![first,notes,founder,shares,investor,marketing].includes(s)) s.remove();
  });

  const expansion=doc.createElement('section');
  expansion.className='section';
  expansion.innerHTML=`<div class="section-head"><div><h2>استخدام المساهمة المبسطة في تمويل التوسع</h2><p class="sub">يمكن تحويل جولة التوسع إلى شركة مستقلة تجمع رياح البن ومستثمرين محددين في مشروع فروع جديد.</p></div><span class="tag">مقترح استراتيجي</span></div>
  <div class="callout gold"><h3>شركة رياح البن الرئيسة</h3><p>تبقى مركز العلامة والمعرفة التشغيلية والمشتريات والمعايير، وتشارك في شركات التوسع وفق الهيكل الاستثماري لكل جولة.</p></div>
  <div style="height:12px"></div>
  <div class="grid2">
   <div class="card"><div class="kicker">شركة توسع 1</div><h3>مساهمة مبسطة · <span class="sar">&#xea;</span> 3–5 مليون</h3><p>رياح البن + مجموعة مستثمرين + قوائم مستقلة لتمويل مجموعة فروع جديدة.</p><div class="fact" style="margin-top:9px"><b>5 فروع</b><span>مثال تشغيلي للجولة.</span></div></div>
   <div class="card"><div class="kicker">شركة توسع 2</div><h3>جولة جديدة ومستثمرون جدد</h3><p>يمكن أن تضم مستثمرين مختلفين وفئات أسهم تناسب طبيعة الجولة ومخاطرها.</p><div class="fact" style="margin-top:9px"><b>5 فروع</b><span>مثال قابل للتغيير بحسب اقتصاديات المشروع.</span></div></div>
  </div>
  <div style="height:12px"></div>
  <div class="grid3">
   <div class="card"><h3>فصل نتائج كل جولة</h3><p>رأس المال والمستثمرون والفروع والقوائم داخل شركة مرتبطة بالجولة.</p></div>
   <div class="card"><h3>تحديد نطاق المستثمر</h3><p>المستثمر يشارك في مجموعة فروع محددة بدل الدخول في جميع أصول الشركة الرئيسة.</p></div>
   <div class="card"><h3>تكرار النموذج</h3><p>عند نجاح الجولة يمكن إطلاق شركة توسع أخرى بمنطقة أو مجموعة فروع جديدة.</p></div>
  </div>
  <div style="height:10px"></div>
  <div class="callout"><h3>متى تستخدم شركة توسع مستقلة؟</h3><p>عندما تكون جولة التمويل مستقلة، أو تختلف مجموعة المستثمرين، أو توجد حاجة لفصل نتائج ومخاطر مجموعة الفروع. عدد 5 فروع مثال وليس شرطا ثابتا.</p></div>`;

  if(marketing){
    const mh=marketing.querySelector('h2'); if(mh) mh.textContent='مسارات تطبيقية يمكن تطويرها عند الحاجة';
    const ms=marketing.querySelector('.sub'); if(ms) ms.textContent='إذا رغبت الشركة في تحويل أي محور من هذه القراءة إلى وثائق وقرارات قابلة للاعتماد، يمكن تطويره كمسار مستقل يكمل أعمال المستشارين الحاليين.';
  }

  [first,notes,founder,shares,investor].forEach(s=>{if(s) footer.before(s)});
  footer.before(expansion);
  if(marketing) footer.before(marketing);

  return '<!doctype html>\n'+doc.documentElement.outerHTML;
};
})();