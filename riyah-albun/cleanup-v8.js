(function(){
  const previous=window.transformStudy;
  window.transformStudy=function(html){
    if(typeof previous==='function') html=previous(html);
    const doc=new DOMParser().parseFromString(html,'text/html');

    const removeHeadings=new Set([
      'حزمة حلول عملية داخل المساهمة المبسطة',
      'حزمة التنفيذ المقترحة',
      'الخدمة المقترحة لرياح البن',
      'مرحلة ما بعد الدراسة'
    ]);

    doc.querySelectorAll('section').forEach(section=>{
      const h2=section.querySelector('h2');
      if(h2 && removeHeadings.has(h2.textContent.trim())) section.remove();
    });

    const services=[...doc.querySelectorAll('section')].filter(section=>{
      const h2=section.querySelector('h2');
      return h2 && h2.textContent.trim()==='مسارات تطبيقية يمكن تطويرها عند الحاجة';
    });
    services.slice(1).forEach(section=>section.remove());

    return '<!doctype html>\n'+doc.documentElement.outerHTML;
  };
})();