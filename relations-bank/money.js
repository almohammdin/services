(() => {
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const value=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-US',{maximumFractionDigits:2}):'غير محدد';
 const symbolHtml='<span class="rb-riyal-symbol" role="img" aria-label="ريال سعودي"></span>';
 window.RBMoney={symbolHtml,text:(n,c='SAR')=>value(n)+' '+(c==='SAR'?'ريال سعودي':c),html:(n,c='SAR')=>'<bdi class="rb-money" dir="ltr">'+(c==='SAR'?symbolHtml:esc(c))+'<span>'+value(n)+'</span></bdi>'};
})();
