'use strict';
function profitSplitValues(base){
 const rate=Math.max(0,Math.min(50,Number(document.getElementById('companyShare').value)||0));
 const companyCents=Math.round(base.profit*rate/100);
 return {rate,companyCents,investorCents:base.profit-companyCents,company:document.getElementById('companyName').value.trim()||'الشركة',investor:document.getElementById('investorName').value.trim()||'المستثمر'};
}
function renderProfitSplit(base,error){
 const v=profitSplitValues(base), host=document.getElementById('profitSplit');
 document.getElementById('companyShareLabel').textContent=v.rate+'%';
 document.querySelectorAll('[data-share]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.share)===v.rate);b.setAttribute('aria-pressed',String(Number(b.dataset.share)===v.rate));});
 if(error){host.innerHTML='<p class="split-note">أكمل بيانات البيع وجدول السداد لعرض حصص الربح.</p>';return;}
 host.innerHTML='<div class="split-total"><span>ربح الصفقة قبل المصروفات</span><strong>'+money(base.profit/100)+'</strong></div><div class="split-grid"><div><span>'+esc(v.company)+' · <bdi>'+v.rate+'%</bdi></span><strong>'+money(v.companyCents/100)+'</strong></div><div><span>'+esc(v.investor)+' · <bdi>'+(100-v.rate)+'%</bdi></span><strong>'+money(v.investorCents/100)+'</strong></div></div><p class="capital-line">أصل مال '+esc(v.investor)+': <strong>'+money(base.principal/100)+'</strong> مستقل عن توزيع الربح.</p><p class="split-note">الدفعات التزام على المشتري بثمن المبيع. هذه الحصص تقديرية عند اكتمال التحصيل وقبل المصروفات؛ توقيت توزيع الربح ورد رأس المال يخضع لاتفاق الاستثمار والتسوية الفعلية.</p>'+(v.rate===0?'<p class="zero-note">عند 0% يخصص كامل الربح للمستثمر. يحتاج الاتفاق مراجعة تكييفه وصياغته عند عمل الشركة دون حصة من الربح.</p>':'');
}
document.addEventListener('input',event=>{if(['companyShare','companyName','investorName'].includes(event.target.id))calculate();});
document.addEventListener('click',event=>{const b=event.target.closest('[data-share]');if(b){document.getElementById('companyShare').value=b.dataset.share;calculate();}});
