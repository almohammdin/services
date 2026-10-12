import {METERS} from './meters.js';
export {METERS};
export const strip=s=>String(s).normalize('NFC').replace(/[\u064B-\u065F\u0670ـ]/g,'');
export const skeleton=s=>strip(s).replace(/[^\u0621-\u063A\u0641-\u064A]/g,'');
export function splitPoem(s){const lines=String(s).split(/\n/).map(s=>s.trim()).filter(Boolean);const verses=[];for(let i=0;i<lines.length;i++){if(/[*#|]/.test(lines[i])){const a=lines[i].split(/\s*[*#|]\s*/);verses.push([a[0],a.slice(1).join(' ')]);}else if(lines[i+1]&&!/[*#|]/.test(lines[i+1])){verses.push([lines[i],lines[++i]]);}else verses.push([lines[i],'']);}return verses;}
const vowels=/[ًٌٍَُِ]/,marks=/[\u064B-\u065F\u0670]/,sun='تثدذرزسشصضطظلن';
export function scan(text,ending='saturate'){
 const raw=String(text).normalize('NFC').replace(/ـ/g,'').replace(/آ/g,'أَا').replace(/ٰ/g,'ا').replace(/ٱ/g,'ا');
 const words=raw.match(/[\u0621-\u065F\u0670]+/g)||[];let units=[],uncertain=[];
 words.forEach((word,wi)=>{
  let chars=[];for(const c of word){if(marks.test(c)&&chars.length)chars.at(-1).m+=c;else if(/[ء-ي]/.test(c))chars.push({c,m:''});}
  // Unwritten alif in common demonstratives; spelling remains untouched in the editor.
  const bare=chars.map(c=>c.c).join('');let hidden=bare==='هذا'?0:bare==='هذه'?0:bare==='ذلك'?0:bare==='لكن'?0:-1;
  let article=chars[0]?.c==='ا'&&chars[1]?.c==='ل'?0:-1;
  if('وفبك'.includes(chars[0]?.c)&&chars[1]?.c==='ا'&&chars[2]?.c==='ل')article=1;
  const startsWasl=chars[0]?.c==='ا';
  if(wi>0&&startsWasl&&units.at(-1)?.long)units.pop();
  chars.forEach((g,i)=>{
   const prev=chars[i-1],next=chars[i+1];
   const add=(b,c=g.c,long=false)=>units.push({b,c,word:wi,long});
   if(i===article){if(wi===0&&i===0)add('1');return;}
   if(article>=0&&i===article+1){if(sun.includes(next?.c))return;add('0');return;}
   if(g.c==='ا'&&i===0&&wi>0&&!g.m){return;}
   if(g.c==='ا'&&i===chars.length-1&&(prev?.m.includes('ً')||prev?.c==='و'&&i>1&&chars[i-2]?.m.includes('ُ')))return;
   const forcedShadda=article>=0&&i===article+2&&sun.includes(g.c);
   if(g.m.includes('ّ')||forcedShadda)add('0');
   if(vowels.test(g.m)){add('1');if(/[ًٌٍ]/.test(g.m))add('0','ن');}
   else if(g.m.includes('ْ'))add('0');
   else if(/[اى]/.test(g.c)&&i>0)add('0',g.c,true);
   else if(g.c==='و'&&prev?.m.includes('ُ')||g.c==='ي'&&prev?.m.includes('ِ'))add('0',g.c,true);
   else if(i===0&&g.c==='ا')add('1');
   else{add('?');uncertain.push(wi);}
   if(hidden===i)add('0','ا',true);
  });
 });
 if(units.length&&units.at(-1).b==='1'){if(ending==='saturate')units.push({b:'0',c:'ـ',word:words.length-1,long:true});else units.at(-1).b='0';}
 return {pattern:units.map(u=>u.b).join(''),units,words,unknown:[...new Set(uncertain)],phonetic:units.map(u=>u.c).join('')};
}
export function align(a,b){const d=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=0;i<=a.length;i++)d[i][0]=i;for(let j=0;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]||a[i-1]==='?'?0:1));let i=a.length,j=b.length,wrong=[];while(i||j){if(i&&j&&d[i][j]===d[i-1][j-1]+(a[i-1]===b[j-1]||a[i-1]==='?'?0:1)){if(a[i-1]!==b[j-1]&&a[i-1]!=='?')wrong.push(i-1);i--;j--;}else if(i&&d[i][j]===d[i-1][j]+1){wrong.push(i-1);i--;}else{wrong.push(Math.max(0,i-1));j--;}}return {distance:d[a.length][b.length],wrong};}
export function analyze(text,meter='auto',ending='saturate'){
 const s=scan(text,ending);if(!s.pattern)return {...s,candidates:[],exact:false};
 if(s.pattern.length>200)return {...s,candidates:[],exact:false,tooLong:true};
 const results=[];for(const b of METERS){if(meter!=='auto'&&meter!==b.name)continue;let best=null;for(const f of b.forms){const delta=align(s.pattern,f.pattern);if(!best||delta.distance<best.distance)best={...f,...delta,name:b.name};}if(best)results.push(best);}
 results.sort((a,b)=>a.distance-b.distance);const best=results[0];const badWords=best?[...new Set(best.wrong.map(i=>s.units[i]?.word).filter(i=>i!==undefined))]:[];
 return {...s,best,candidates:results.slice(0,3),badWords,exact:!!best&&best.distance===0&&!s.unknown.length};
}
const joins='بتثجحخسشصضطظعغفقكلمنهيئ';
export function extendWord(word,count){let clusters=Array.from(word.matchAll(/[\u0621-\u064A][\u064B-\u065F\u0670]*/g));if(clusters.map(x=>x[0]).join('')!==word)return word;const slots=[];for(let i=0;i<clusters.length-1;i++){const c=clusters[i][0][0],n=clusters[i+1][0][0];if(joins.includes(c)&&n!=='ء'&&!(c==='ل'&&'اأإآ'.includes(n)))slots.push(i);}if(!slots.length)return word;const additions={};for(let i=0;i<Math.min(40,Math.max(0,count));i++){const slot=slots[(slots.length-1)-(i%slots.length)];additions[slot]=(additions[slot]||0)+1;}return clusters.map((m,i)=>m[0]+'ـ'.repeat(additions[i]||0)).join('');}

// Rank one shared meter for the entire poem, not a separate guess per line.
export function inferPoem(poem,ending='saturate'){
 const lines=splitPoem(poem).flat().filter(Boolean),readings=lines.map(s=>scan(s,ending));
 if(!lines.length||readings.some(s=>s.unknown.length||!s.pattern||s.pattern.length>200))return {ready:false,candidates:[],lines:lines.length};
 const candidates=METERS.map(m=>{const results=lines.map(s=>analyze(s,m.name,ending));return {name:m.name,matched:results.filter(r=>r.exact).length,total:lines.length,distance:results.reduce((a,r)=>a+(r.best?.distance??200),0),score:results.reduce((a,r)=>a+(r.best?.distance??200)/Math.max(1,r.pattern.length),0)/lines.length,results};}).sort((a,b)=>a.score-b.score||b.matched-a.matched);
 const [first,second]=candidates;return {ready:true,candidates:candidates.slice(0,3),best:first,ambiguous:!!second&&Math.abs(second.score-first.score)<.025,lines:lines.length};
}
