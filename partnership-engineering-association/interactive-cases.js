(() => {
'use strict';
const rights=document.getElementById('rightsScene');
const meter=rights.querySelector('.decision-meter');
meter.innerHTML=`<div class="vote-controls"><label>الموافقة المطلوبة <select id="voteThreshold"><option value="51">51%</option><option value="75" selected>75%</option><option value="100">100%</option></select></label><label>ملكية المؤسس <output id="founderShare">40%</output><input id="equitySlider" type="range" min="1" max="99" value="40" aria-label="نسبة ملكية المؤسس"></label></div><div class="voter-buttons" role="group" aria-label="اختر الأطراف الموافقة"><button type="button" id="founderVote" aria-pressed="false">المؤسس <span>40%</span></button><button type="button" id="investorVote" aria-pressed="true">المستثمر <span>60%</span></button></div><div class="vote-progress" role="meter" aria-label="نسبة الأصوات الموافقة" aria-valuemin="0" aria-valuemax="100"><div id="voteFill"></div><i id="voteTarget"></i></div><div id="voteResult" role="status" aria-live="polite"></div><div class="vote-note"><small>نموذج توضيحي: حقوق تصويت متساوية لكل سهم، والنسبة من إجمالي الأسهم.</small><button type="button" id="voteReset">إعادة المثال</button></div>`;
let founder=false,investor=true;
const $=id=>document.getElementById(id);
function render(){
 const share=Number($('equitySlider').value),other=100-share,threshold=Number($('voteThreshold').value);
 const total=(founder?share:0)+(investor?other:0),passed=total>=threshold;
 $('founderShare').textContent=share+'%';
 rights.querySelectorAll('.equity-labels b').forEach((el,i)=>el.textContent=(i?other:share)+'%');
 rights.querySelectorAll('.equity-bar i').forEach((el,i)=>el.style.width=(i?other:share)+'%');
 $('founderVote').querySelector('span').textContent=share+'%';$('investorVote').querySelector('span').textContent=other+'%';
 $('founderVote').setAttribute('aria-pressed',String(founder));$('investorVote').setAttribute('aria-pressed',String(investor));
 $('voteFill').style.width=total+'%';$('voteTarget').style.right=threshold+'%';
 meter.querySelector('[role="meter"]').setAttribute('aria-valuenow',total);
 $('voteResult').dataset.passed=passed;
 $('voteResult').textContent=`${passed?'تحققت الموافقة':'لم تتحقق الموافقة'} · ${total}% من ${threshold}% المطلوبة`;
 if(rights.dataset.phase==='3'){
 $('rightFocusTitle').textContent='من يستطيع تمرير القرار؟';
 $('rightFocusBody').textContent='اختر الأطراف الموافقة وغيّر النسب لاختبار النتيجة.';
 $('rightsCaption').textContent=total===0?'لم يوافق أي طرف حتى الآن.':passed?`الأصوات الموافقة بلغت ${total}%؛ تحقق الحد المطلوب في هذا النموذج.`:`يلزم ${threshold-total} نقطة مئوية إضافية من الأصوات الموافقة لبلوغ الحد المطلوب.`;
 }
}
$('founderVote').onclick=()=>{founder=!founder;render();};$('investorVote').onclick=()=>{investor=!investor;render();};
$('equitySlider').oninput=render;$('voteThreshold').onchange=render;
$('voteReset').onclick=()=>{founder=false;investor=true;$('equitySlider').value=40;$('voteThreshold').value=75;render();};
new MutationObserver(render).observe(rights,{attributes:true,attributeFilter:['data-phase']});render();
const scene=$('propertyScene'),slide=scene.closest('.slide');
const controls=document.createElement('div');controls.className='comparison-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','طريقة عرض الحالة');
controls.innerHTML='<button type="button" data-comparison="false" aria-pressed="true">الشرح المتدرج</button><button type="button" data-comparison="true" aria-pressed="false">قارن العلاقات</button>';
scene.before(controls);
const comparison=document.createElement('div');comparison.className='property-comparison';comparison.hidden=true;
comparison.innerHTML=`<div class="comparison-heading"><span>موضع المقارنة</span><strong>العلاقات الحالية في المثال</strong><strong>التنظيم المقترح</strong></div><div class="comparison-row"><h3>المستثمر</h3><p>حقوق موزعة بين عقود مضاربة قائمة</p><p>مساهم في شركة المشروع بحقوق محددة</p></div><div class="comparison-row"><h3>الأصل</h3><p>نحدد مالكه وحقوق الأطراف بفحص العقود</p><p>شركة المشروع تملك الأصل</p></div><div class="comparison-row"><h3>المطور</h3><p>يدير التنفيذ؛ نفحص صلاحياته والتزاماته</p><p>عقد تطوير يحدد الأعمال والأتعاب والصلاحيات</p></div><div class="comparison-row"><h3>حصيلة البيع</h3><p>نتحقق من مسار التحصيل والتسوية القائم</p><p>تدخل حساب الشركة، ثم تسوى الالتزامات وتعتمد التوزيعات</p></div><p class="comparison-condition">تصور لإعادة التنظيم بعد فحص الحالة وموافقة أصحاب الحقوق؛ الانتقال يحتاج إجراءات ووثائق.</p>`;
scene.after(comparison);
function compare(enabled){
 slide.classList.toggle('comparing',enabled);comparison.hidden=!enabled;scene.hidden=enabled;$('propertyDocs').hidden=enabled;
 controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.comparison==='true')===enabled)));
}
controls.querySelectorAll('button').forEach(b=>b.onclick=()=>compare(b.dataset.comparison==='true'));
new MutationObserver(()=>compare(false)).observe(scene,{attributes:true,attributeFilter:['data-phase']});
window.addEventListener('beforeprint',()=>compare(false));
})();
