/* Hatta ambient network: decorative only; no changes to tool data or navigation. */
(() => {
 'use strict';
 const hero = document.querySelector('.hero');
 const chart = document.querySelector('#explorer .chart-side');
 const slides = [...document.querySelectorAll('.slide:not(.tool-slide)')];
 if (!hero && !chart && !slides.length) return;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const fine = matchMedia('(hover: hover) and (pointer: fine)');
 const css = document.createElement('style');
 css.id = 'hatta-ambient-style';
 css.textContent = `
 .hatta-ambient-host{isolation:isolate}
 .hatta-ambient-host:not(.slide){position:relative}
 .slide>.hatta-ambient{z-index:-1!important}
 .slide:not(.cover):not(.contact-slide)>.hatta-ambient{opacity:.85;mask-image:linear-gradient(90deg,#000,#0008 18%,transparent 38%,transparent 78%,#000)}
 .hatta-ambient-host>.hatta-ambient{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;border-radius:inherit}
 .hero.hatta-ambient-host{background:radial-gradient(ellipse at 8% 70%,#11366a 0,transparent 62%),var(--navy)}
 .hero.hatta-ambient-host:before{opacity:.28}
 .hero.hatta-ambient-host>.hero-grid,.chart-side.hatta-ambient-host>.canvas,.chart-side.hatta-ambient-host>.hint,.inspector.hatta-ambient-host>:not(.hatta-ambient){position:relative;z-index:1}
 .chart-side.hatta-ambient-host{background:radial-gradient(ellipse at 0 100%,#f3ecdF,transparent 52%),#fff}
 .chart-side>.hatta-ambient{mask-image:radial-gradient(ellipse at center,transparent 24%,#000 74%);-webkit-mask-image:radial-gradient(ellipse at center,transparent 24%,#000 74%)}
 .inspector>.hatta-ambient{mask-image:linear-gradient(transparent 40%,#000);-webkit-mask-image:linear-gradient(transparent 40%,#000);opacity:.6}
 @media print{.hatta-ambient{display:none!important}.hero.hatta-ambient-host,.chart-side.hatta-ambient-host{background:transparent}}
 `;
 document.head.append(css);
 const surfaces = slides.length ? slides : [hero || chart, ...(!hero ? [document.querySelector('.inspector')] : [])].filter(Boolean);
 surfaces.forEach((host, surface) => {
  const rgb = getComputedStyle(host).backgroundColor.match(/[0-9.]+/g);
  const dark = host === hero || (rgb && rgb.length >= 3 && (Number(rgb[0])*.2126+Number(rgb[1])*.7152+Number(rgb[2])*.0722)<100 && (rgb.length<4 || Number(rgb[3])>0));
  const panel = host.classList.contains('inspector');
  const canvas = document.createElement('canvas');
  canvas.className = 'hatta-ambient';
  canvas.setAttribute('aria-hidden','true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  host.classList.add('hatta-ambient-host'); host.prepend(canvas);
  let width=0,height=0,points=[],frame=0,last=0,time=0,visible=false,pulse=0;
  let renderCount=0;
  let pointer={x:-1000,y:-1000}, drift={x:0,y:0};
  let seed=47+surface;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  function resize(){
   width=host.clientWidth; height=host.clientHeight;
   if(!width||!height){stop();return;}
   const ratio=Math.min(window.devicePixelRatio||1,1.75);
   canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
   ctx.setTransform(ratio,0,0,ratio,0,0);
   seed=47+surface;
   const count=panel?20:width<600?38:host.matches('.slide')?88:72;
   points=Array.from({length:count},(_,i)=>({
    x:random()*width,y:random()*height,phase:random()*Math.PI*2,
    speed:.36+random()*.3,r:i%7===0?3.8:2,depth:.4+random()*.6
   }));
   draw();sync();
  }
  function strength(x,y){
   if(panel)return .24;
   if(!dark)return host.matches('.cover,.contact-slide') ? .88 : .62;
   const edge=Math.pow(Math.abs(x/width-.5)*2,1.15);
   // Keep the title and copy quiet, with brighter geometry on the opposite side.
   return .2+edge*(x<width*.48?.8:.5);
  }
  function draw(){
   if(!width||!height)return;
   canvas.dataset.frame=String(++renderCount);
   ctx.clearRect(0,0,width,height);
   const mobile=width<600, reach=panel?125:mobile?140:host.matches('.slide')?235:190;
   const ps=points.map(p=>({
    ...p,x:p.x+Math.sin(time*p.speed+p.phase)*(mobile?22:42)+drift.x*p.depth,
    y:p.y+Math.cos(time*p.speed*.8+p.phase)*(mobile?17:32)+drift.y*p.depth
   }));
   if(dark){
    const glow=ctx.createRadialGradient(width*.16,height*.65,0,width*.16,height*.65,width*.43);
    glow.addColorStop(0,'rgba(210,160,90,.065)');glow.addColorStop(1,'rgba(210,160,90,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
   }
   for(let i=0;i<ps.length;i++){
    const p=ps[i];
    for(let j=i+1;j<ps.length;j++){
     const q=ps[j],dist=Math.hypot(p.x-q.x,p.y-q.y);
     if(dist>reach)continue;
     const alpha=(1-dist/reach)*strength((p.x+q.x)/2,(p.y+q.y)/2);
     ctx.strokeStyle='rgba(180,122,45,'+(alpha*(dark?.72:.72)+pulse*.05)+')';
     ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
     if(!panel&&(i+j)%5===0){
      const progress=(time*.18+i*.137)%1;
      ctx.fillStyle=(dark?'rgba(245,219,164,':'rgba(160,105,35,')+Math.min(.9,alpha*1.4)+')';
      ctx.beginPath();ctx.arc(p.x+(q.x-p.x)*progress,p.y+(q.y-p.y)*progress,2.6,0,Math.PI*2);ctx.fill();
     }
    }
    const nearby=Math.max(0,1-Math.hypot(p.x-pointer.x,p.y-pointer.y)/160);
    const opacity=strength(p.x,p.y)*(.65+.25*Math.sin(time*1.15+p.phase))+nearby*.18;
    ctx.fillStyle=(dark?'rgba(230,210,174,':'rgba(146,99,38,')+opacity+')';
    ctx.beginPath();ctx.arc(p.x,p.y,p.r+nearby*.8,0,Math.PI*2);ctx.fill();
    if(p.r>2){
     ctx.strokeStyle='rgba(210,160,90,'+opacity*.2+')';ctx.lineWidth=.7;
     ctx.beginPath();ctx.arc(p.x,p.y,6+pulse*5,0,Math.PI*2);ctx.stroke();
    }
   }
  }
  function tick(stamp){
   frame=0;
   if(!visible||document.hidden||reduced.matches)return;
   if(stamp-last>=33){
    const dt=Math.min((stamp-last)/1000,.05);last=stamp;time+=dt;pulse=Math.max(0,pulse-dt);
    const targetX=pointer.x<0?0:(pointer.x/width-.5)*10;
    const targetY=pointer.y<0?0:(pointer.y/height-.5)*8;
    drift.x+=(targetX-drift.x)*.035;drift.y+=(targetY-drift.y)*.035;draw();
   }
   frame=requestAnimationFrame(tick);
  }
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
  function sync(){if(reduced.matches||!visible||document.hidden||!width||!height){stop();if(reduced.matches){time=0;drift={x:0,y:0};pointer={x:-1000,y:-1000};draw();}}else if(!frame)frame=requestAnimationFrame(tick);}
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});
  intersection.observe(host);
  new ResizeObserver(resize).observe(host);
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  host.addEventListener('pointermove',e=>{
   if(!fine.matches||reduced.matches)return;
   const rect=host.getBoundingClientRect();pointer={x:(e.clientX-rect.left)*width/rect.width,y:(e.clientY-rect.top)*height/rect.height};
  },{passive:true});
  host.addEventListener('pointerleave',()=>{pointer={x:-1000,y:-1000};},{passive:true});
  if(chart&&!panel){
   const detail=document.getElementById('detail');
   if(detail)new MutationObserver(()=>{if(!reduced.matches)pulse=1;}).observe(detail,{childList:true});
  }
  resize();
 });
})();
