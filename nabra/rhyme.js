import {strip,splitPoem} from './prosody.js?v=20';
const banks=[
 ['شهود','وعود','عهود','وجود','حدود','ورود','خلود','صدود','جود','سجود','صمود','عود'],
 ['حنين','سنين','يقين','أنين','عين','لين','ثمين','جبين','حزين','أمين','معين'],
 ['سلام','كلام','غرام','منام','هيام','مقام','ظلام','وئام','تمام','زحام'],
 ['حياة','نجاة','صلاة','فلاة','فتاة'],
 ['نور','سرور','حضور','شعور','عبور','زهور','بحور','صدور','عطور'],
 ['ليالي','خيالي','غالي','بالي','وصالي','حالي','سؤالي'],
 ['ديار','نهار','قرار','انتظار','اعتذار','مسار','انتصار','أسرار'],
 ['حبيب','قريب','غريب','نصيب','طبيب','رقيب','مجيب'],
 ['قلب','درب','قرب','حب','عتب'],
 ['يردها','يصدها','وعدها','عهدها','وردها','خدها','حدها','سعدها','بعدها','وحدها'],
 ['وقتها','صوتها','بيتها','ليلتها','صورتها','بسمتها','هيبتها'],
 ['معناها','لقياها','ذكراها','محياها','هواها','سماها'],
 ['نصيبه','حبيبه','قريبه','طبيبه','غريبه'],
 ['عيون','شجون','ظنون','سكون','حنون','غصون','جنون','حصون']
];
export function endingKey(word){
 const w=strip(word).replace(/[^ء-ي]/g,'').replace(/ى/g,'ا');
 if(w.length<2)return w;
 return w.endsWith('ها')?w.slice(-3):w.slice(-2);
}
export function rhymeReport(poem,side='1'){
 const endings=splitPoem(poem).map((pair,i)=>{const text=pair[Number(side)]||'';const word=text.match(/[ء-ي\u064B-\u065F]+/g)?.at(-1)||'';return {bayt:i+1,word,key:endingKey(word)};}).filter(x=>x.word);
 const counts=new Map();endings.forEach(x=>counts.set(x.key,(counts.get(x.key)||0)+1));
 const ranked=[...counts].sort((a,b)=>b[1]-a[1]);
 const dominant=ranked[0]?.[0]||'',tied=ranked.length>1&&ranked[0][1]===ranked[1][1];
 return {endings,dominant,tied,groups:ranked.length,repeated:endings.filter((x,i)=>endings.findIndex(y=>strip(y.word)===strip(x.word))!==i).map(x=>x.word)};
}
export function rhymeWords(word){const key=endingKey(word);return [...new Set(banks.flat())].filter(w=>endingKey(w)===key&&strip(w)!==strip(word)).slice(0,14);}
