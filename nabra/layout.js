// Layout keeps the requested font size. Long text wraps; it is never silently shrunk.
export function wrapText(text,measure,width){const words=text.split(/\s+/).filter(Boolean),lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(line&&measure(next)>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
export function planLayout({verses,format='content',layout='auto',fontSize=64,lineGap=1.65,columnGap=60,title='',author='',brand=true,measure}){
 const W=format==='landscape'?1600:1080,scale=W/1080,pad=60*scale,gap=columnGap*scale,font=fontSize*scale;
 const contentW=W-pad*2;const widest=Math.max(0,...verses.flat().map(measure));const resolved=layout==='auto'?(widest<=(contentW-gap)/2?'columns':'stacked'):layout;
 const width=resolved==='columns'?(contentW-gap)/2:contentW-(resolved==='staggered'?60*scale:0),lineH=font*lineGap;
 const rows=[];let y=0;
 verses.forEach((pair,i)=>{
  if(resolved==='columns'){const a=pair.map(s=>wrapText(s,measure,width));const n=Math.max(1,...a.map(x=>x.length));rows.push({pair:a,i,y});y+=n*lineH+font*.25;}
  else pair.forEach((s,j)=>{if(!s)return;const a=wrapText(s,measure,width);for(const text of a){rows.push({text,i,j,y});y+=lineH;}if(j===1)y+=font*.24;});
 });
 const titleFont=Math.min(44*scale,font*.72),titleLines=title?wrapText(title,t=>measure(t)*titleFont/font,contentW):[];
 const titleH=titleLines.length?titleLines.length*titleFont*1.4+28*scale:0,authorH=author?58*scale:0,brandH=brand?64*scale:0;
 const contentH=Math.max(font,y)+titleH+authorH+brandH+2*pad,desired=format==='content'?Math.ceil(contentH):({square:1080,portrait:1350,story:1920,landscape:900}[format]||1080);
 const H=Math.min(8192,desired),overflow=contentH>H+1||verses.flat().some(s=>s.split(/\s+/).some(w=>measure(w)>width));
 return {W,H,pad,gap,font,width,lineH,rows,resolved,titleFont,titleLines,titleH,authorH,brandH,contentH,overflow,start:Math.max(pad,(H-contentH)/2+pad)};
}
