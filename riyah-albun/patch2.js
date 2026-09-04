(()=>{
const previous=window.transformStudy;
window.transformStudy=function(h){
  if(previous) h=previous(h);
  if(h.includes('استخدام المساهمة المبسطة في تمويل التوسع')) return h;

  const css=`.expansion-zone{background:linear-gradient(180deg,#fff,#fbfcfe)}
.expansion-idea{display:grid;grid-template-columns:.92fr 1.08fr;gap:16px;align-items:stretch}
.expansion-parent{border-radius:19px;background:linear-gradient(150deg,#0b1f33,#173e68);color:#fff;padding:20px;position:relative;overflow:hidden}
.expansion-parent:after{content:"";position:absolute;width:160px;height:160px;border:1px solid rgba(255,255,255,.08);border-radius:50%;left:-55px;bottom:-75px}
.expansion-parent small{display:block;color:#d8b66c;font-size:10px;font-weight:700;margin-bottom:6px}
.expansion-parent h3{margin:0 0 8px;font-size:19px;position:relative;z-index:1}
.expansion-parent p{margin:0;color:#d8e2eb;font-size:12px;position:relative;z-index:1}
.parent-assets{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:13px;position:relative;z-index:1}
.parent-assets span{border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:8px 9px;font-size:10.5px;color:#e7edf2;background:rgba(255,255,255,.04)}
.expansion-stack{display:grid;gap:10px}
.expansion-company{border:1px solid var(--line);border-radius:18px;background:#fff;padding:15px 16px;display:grid;grid-template-columns:54px 1fr auto;gap:12px;align-items:center}
.expansion-company .ecode{width:54px;height:54px;border-radius:15px;background:#f4efe5;color:#87651f;display:grid;place-items:center;font-size:18px;font-weight:700}
.expansion-company h3{font-size:14.5px;margin:0 0 3px}
.expansion-company p{margin:0;color:var(--muted);font-size:11.3px}
.expansion-company .branches{min-width:92px;text-align:center;border-right:1px solid var(--line);padding-right:12px}
.expansion-company .branches b{display:block;font-size:21px;color:var(--blue);line-height:1.2}
.expansion-company .branches span{font-size:10px;color:var(--muted)}
.expansion-caption{margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.expansion-caption div{border:1px solid var(--line);border-radius:13px;padding:10px 11px;background:#fff}
.expansion-caption b{display:block;font-size:11px;color:var(--navy);margin-bottom:3px}
.expansion-caption span{font-size:10.6px;color:var(--muted)}
.expansion-split{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:12px}
.expansion-split .mini-card{border-radius:15px;padding:13px 14px;border:1px solid var(--line);background:#fff}
.expansion-split .mini-card h3{font-size:13.5px;margin:0 0 6px}
.expansion-split .mini-card p{font-size:11.2px;color:var(--muted);margin:0}
.expansion-rule{margin-top:12px;padding:13px 14px;border-radius:14px;background:#f7f3eb;border:1px solid #e5d7bc}
.expansion-rule b{display:block;color:#6d531d;font-size:11px;margin-bottom:3px}
.expansion-rule span{font-size:11px;color:#5b6470}
@media(max-width:850px){.expansion-idea,.expansion-split{grid-template-columns:1fr}.expansion-caption{grid-template-columns:1fr}.expansion-company{grid-template-columns:48px 1fr}.expansion-company .branches{grid-column:1/-1;border-right:0;border-top:1px solid var(--line);padding:9px 0 0}}
@media print{.expansion-idea,.expansion-caption,.expansion-split{display:block!important}.expansion-parent,.expansion-company,.expansion-caption div,.expansion-split .mini-card,.expansion-rule{break-inside:avoid;page-break-inside:avoid;margin-bottom:3mm}}`;

  const section=`<section class="section expansion-zone">
<div class="section-head"><div><h2>استخدام المساهمة المبسطة في تمويل التوسع</h2><p class="sub">يمكن تحويل جولة التوسع إلى شركة مستقلة تجمع رياح البن والمستثمرين في مشروع محدد، مع بقاء العلامة والمعرفة التشغيلية في الشركة الرئيسة.</p></div><span class="tag">مقترح للتوسع</span></div>

<div class="expansion-idea">
  <div class="expansion-parent">
    <small>الشركة الرئيسة</small>
    <h3>شركة رياح البن</h3>
    <p>تحتفظ بمركز العلامة والإدارة والمعرفة التشغيلية، وتشارك في شركات التوسع كمساهم مؤسس وفق الهيكل المعتمد.</p>
    <div class="parent-assets"><span>العلامة التجارية</span><span>المعايير والتشغيل</span><span>المشتريات والخدمات المشتركة</span><span>اختيار المواقع وإدارة الفروع</span></div>
  </div>
  <div class="expansion-stack">
    <div class="expansion-company"><div class="ecode">1</div><div><h3>شركة توسع أولى · مساهمة مبسطة</h3><p>رأس مال استرشادي SAR 3–5 مليون · رياح البن + مجموعة مستثمرين · حسابات وقوائم مستقلة.</p></div><div class="branches"><b>5</b><span>فروع مستهدفة كمثال</span></div></div>
    <div class="expansion-company"><div class="ecode">2</div><div><h3>شركة توسع ثانية · مساهمة مبسطة</h3><p>جولة تمويل جديدة يمكن أن تضم مستثمرين مختلفين وشروط أسهم تناسب هذه الجولة.</p></div><div class="branches"><b>5</b><span>فروع مستهدفة كمثال</span></div></div>
  </div>
</div>

<div class="expansion-caption">
  <div><b>فصل كل جولة</b><span>كل شركة تحمل رأس مالها ومستثمريها ونتائجها المالية، فتظهر ربحية الجولة ومخاطرها بصورة مستقلة.</span></div>
  <div><b>مرونة المستثمر</b><span>المستثمر يدخل في مشروع توسع محدد بدلاً من الدخول مباشرة في جميع أصول وتاريخ الشركة الرئيسة.</span></div>
  <div><b>تكرار النموذج</b><span>عند نجاح الجولة يمكن تكرار الهيكل في منطقة أو مجموعة فروع جديدة برأس مال ومستثمرين جدد.</span></div>
</div>

<div class="expansion-split">
  <div class="mini-card"><h3>أثر النموذج على رياح البن</h3><p>تمويل للتوسع، حصة في شركة المشروع، مقابل خدمات الإدارة أو استخدام العلامة وفق العقود، مع إمكانية تخصيص فئة للمؤسس تحمل حقوقاً أعلى في الإدارة أو التصويت.</p></div>
  <div class="mini-card"><h3>أثر النموذج على المستثمر</h3><p>ملكية في كيان محدد النطاق، قوائم مستقلة، معرفة الفروع التي مولها، وحقوق أسهم وخروج تصمم مسبقاً وفق النظام الأساس وشروط الإصدار.</p></div>
</div>

<div class="expansion-rule"><b>متى يكون إنشاء شركة توسع مستقلة مناسباً؟</b><span>استقلال جولة التمويل، اختلاف مجموعة المستثمرين، أو الحاجة إلى فصل نتائج ومخاطر مجموعة الفروع. عدد الفروع يستخدم كهدف تشغيلي للجولة؛ ويمكن أن يكون 5 فروع أو أكثر بحسب اقتصاديات المشروع.</span></div>
</section>`;

  const title='<h2>دخول المستثمر: ثلاثة أبواب وثلاث نتائج مختلفة</h2>';
  const i=h.indexOf(title);
  if(i>=0){
    const e=h.indexOf('</section>',i);
    if(e>=0) h=h.slice(0,e+10)+section+h.slice(e+10);
  }
  h=h.replace('</style>',css+'</style>');
  return h;
};
})();