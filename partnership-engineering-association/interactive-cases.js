(() => {
'use strict';
const $=id=>document.getElementById(id);
function mount(root){
 root.classList.add('share-lab');root.innerHTML=`<div class="share-allocation"><h3>توزيع رأس المال على الأسهم</h3><div class="share-rows"><div class="share-row"><span>عادية</span><output data-out="ordinary"></output><small>النسبة المتبقية</small></div>${[['preferred','ممتازة',30,50],['redeemable','قابلة للاسترداد',20,50],['staff','عادية للموظفين',10,100]].map(([key,title,value,max])=>`<label class="share-row"><span>${title}</span><output data-out="${key}"></output><input data-input="${key}" aria-label="نسبة الأسهم ${title}" type="range" min="0" max="${max}" value="${value}"></label>`).join('')}</div><p class="share-limit"></p></div><div class="share-voting"><h3>الأصوات الموافقة من المساهمين</h3><label class="share-yes"><input data-input="yes" aria-label="عدد الأصوات الموافقة من المساهمين" type="range" min="0" max="50" value="40"><output data-out="yes"></output></label><label class="share-threshold">الموافقة المطلوبة <select aria-label="نسبة الموافقة المطلوبة"><option>51</option><option selected>75</option><option>100</option></select><span>%</span></label><div class="share-track" role="meter" aria-label="نسبة الأصوات الموافقة" aria-valuemin="0" aria-valuemax="100"><i></i><b></b></div><p class="share-result" role="status"></p><p class="share-assumption">صوت لكل سهم عادي. الممتازة والقابلة للاسترداد دون تصويت كأصل عام. النسبة من إجمالي حقوق التصويت مع اكتمال الحضور.</p></div><div class="share-actions"><button data-action="reset">إعادة المثال</button><button data-action="ordinary">مقارنة: أسهم عادية فقط</button><button data-action="rules">ضوابط المثال</button></div>`;
 const q=s=>root.querySelector(s),input=k=>q(`[data-input="${k}"]`),out=k=>q(`[data-out="${k}"]`),nf=new Intl.NumberFormat('en',{maximumFractionDigits:1});
 function update(){const p=+input('preferred').value,r=+input('redeemable').value,e=+input('staff').value,o=100-p-r-e,total=100-p-r;
 input('preferred').max=Math.min(50-r,100-r-e);input('redeemable').max=Math.min(50-p,100-p-e);input('staff').max=100-p-r;input('yes').max=total;
 const yes=+input('yes').value,pct=100*yes/total,need=+q('select').value,pass=100*yes>=need*total;
 Object.entries({ordinary:o,preferred:p,redeemable:r,staff:e}).forEach(([k,v])=>out(k).textContent=v+'%');
 out('yes').textContent=`${yes} من ${total} صوتا`;
 q('.share-limit').textContent=`المجموع 100% · الممتازة والاسترداد ${p+r}% من حد 50%`;
 q('.share-result').textContent=`${pass?'تحققت الموافقة':'لم تتحقق الموافقة'} · ${nf.format(pct)}% من ${need}% المطلوبة`;
 q('.share-result').dataset.passed=pass;q('.share-track i').style.width=pct+'%';q('.share-track b').style.right=need+'%';q('[role="meter"]').setAttribute('aria-valuenow',pct);
 }
 function preset(values,yes){['preferred','redeemable','staff'].forEach((k,i)=>{input(k).max=100;input(k).value=values[i]});input('yes').max=100;input('yes').value=yes;q('select').value=75;update()}
 root.querySelectorAll('input').forEach(el=>el.oninput=update);q('select').onchange=update;q('[data-action="reset"]').onclick=()=>preset([30,20,10],40);q('[data-action="ordinary"]').onclick=()=>preset([0,0,0],60);
 const dialog=document.createElement('dialog');dialog.className='share-rules';dialog.innerHTML=`<button class="share-close" aria-label="إغلاق ضوابط المثال">×</button><h3>ضوابط المثال</h3><p><b>رأس المال:</b> 100 سهم مصدر × 1,000 ريال = 100,000 ريال مدفوعة بالكامل. المصرح به 200,000 ريال، يتيح زيادة المصدر لاحقا وفق الإجراءات النظامية.</p><p><b>الممتازة والقابلة للاسترداد:</b> حدها مجتمعة 50% من رأس المال؛ أي 50 سهما في المثال. الإصدار وفق النظام الأساس والموافقات والضوابط النظامية، مع سداد المصدر وقيمة هذه الأسهم بالكامل.</p><p><b>أسهم الموظفين:</b> تخصيص من الأسهم العادية في المثال، ويبدأ التصويت بها بعد إصدارها وتملكها.</p><p>النسب والحقوق أمثلة تعليمية تصاغ وفق احتياج الشركة ونظامها الأساس.</p>`;document.body.append(dialog);q('[data-action="rules"]').onclick=()=>dialog.showModal();dialog.querySelector('button').onclick=()=>dialog.close();update();
}
const rights=$('rightsScene');
if(rights){const lab=rights.querySelector('.share-lab');mount(lab);function phase(){lab.dataset.mode=rights.dataset.phase==='2'?'allocation':'voting';lab.hidden=!['2','3'].includes(rights.dataset.phase)}new MutationObserver(phase).observe(rights,{attributes:true,attributeFilter:['data-phase']});phase();}
const preview=$('previewLab');if(preview)mount(preview);
const scene=$('propertyScene');if(!scene)return;const slide=scene.closest('.slide');
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
