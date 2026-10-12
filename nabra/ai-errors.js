export function aiErrorInfo(error){
 const raw=String(error?.message||''),code=String(error?.code||error?.name||'unknown');
 const status=Number(error?.customData?.status||raw.match(/\[(\d{3})\b/)?.[1]||0);
 let message;
 if(/app.?check|recaptcha/i.test(code+' '+raw))message='تعذر التحقق من حماية الاتصال. أعد تحميل الصفحة؛ إذا استمر الخطأ، يحتاج إعداد حماية المساعد إلى مراجعة.';
 else if(status===429||/quota|resource.exhausted/i.test(raw))message='وصل المساعد إلى حد الاستخدام المتاح. حاول لاحقا؛ إذا تكرر الخطأ، تحتاج حصة الخدمة إلى مراجعة.';
 else if(status===404||/model.*(not found|not supported|not available)/i.test(raw))message='نموذج المساعد غير متاح لهذا المشروع حاليا. يحتاج إعداد النموذج إلى تحديث.';
 else if(status===401||status===403||/api.not.enabled|permission.denied|SERVICE_DISABLED/i.test(code+' '+raw))message='خدمة المساعد رفضت الطلب بسبب إعدادات الوصول. يحتاج ربط الخدمة إلى مراجعة.';
 else if(code==='SyntaxError'||/parse|json|response-error|response-blocked/i.test(code))message='وصل رد من المساعد لكن تعذرت قراءته. حاول مرة أخرى.';
 else if(raw==='timeout'||error?.name==='AbortError')message='استغرق المساعد وقتا أطول من المتاح. حاول مرة أخرى.';
 else message='تعذر إكمال طلب المساعد. أعد المحاولة بعد قليل.';
 // Technical diagnostics omit URLs, credentials and response bodies / poem text.
 const detail=raw.split(/Response body|response body/)[0].replace(/https?:\/\/\S+/g,'[service]').replace(/AIza[\w-]+/g,'[redacted]').slice(0,700);
 return {message,code,status,detail};
}
