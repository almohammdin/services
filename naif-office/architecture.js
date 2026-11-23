/* Axonometric drawing in office coordinates. Furniture and walls share one projection. */
function officeDrawing() {
  const point=(x,y,z=0)=>[224+2.1*(x-y),100+.95*(x+y)-2*z];
  const path=(points)=>points.map(p=>point(...p).map(n=>n.toFixed(1)).join(',')).join(' ');
  let shapes='';
  function face(points,color,stroke='#ab9c82',width=.55) {
    shapes+='<polygon points="'+path(points)+'" fill="'+color+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round"/>';
  }
  function line(a,b,color='#aa9d85',width=.6) {
    const [x,y]=point(...a),[u,v]=point(...b);
    shapes+='<path d="M'+x+' '+y+'L'+u+' '+v+'" stroke="'+color+'" stroke-width="'+width+'" fill="none"/>';
  }
  function box(x,y,w,d,h,z,colors) {
    const [top,front,side]=colors;
    face([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],side);
    face([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],front);
    face([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top);
  }
  const stone=['#f5ecd8','#bca988','#d1bea0'],oak=['#d6ac77','#936747','#b78557'],ink=['#446170','#213f4a','#314d59'],sage=['#89998a','#596f66','#708579'];
  function table(x,y,w,d) {
    for(const dx of [1,w-2])for(const dy of [1,d-2])box(x+dx,y+dy,1.2,1.2,9,0,ink);
    box(x,y,w,d,1.5,9,oak);
  }
  function chair(x,y,back=false) {
    box(x+2,y+2,3,3,4,0,ink);box(x,y,7,7,1.8,4,sage);box(x,back?y:y+6,7,1.3,5,5,sage);
  }
  function plant(x,y) {
    box(x-2,y-2,5,5,5,0,stone);
    for(let i=0;i<15;i++) {
      const angle=i*2.4,dx=Math.cos(angle)*5,dy=Math.sin(angle)*5,h=11+(i%4)*2;
      face([[x,y,4],[x+dx*.55-1,y+dy*.55,h*.7],[x+dx,y+dy,h],[x+dx*.55+1,y+dy*.55,h*.8]],i%2?'#83977d':'#5c796c','#678274',.3);
    }
  }
  box(-2,-2,100,68,2,-4,ink);box(-1,-1,98,66,2,-2,stone);
  for(let x=0;x<97;x+=5)line([x,0,0],[x,64,0],'#cdbd9c',.55);
  box(0,0,96,1.3,26,0,stone);box(0,0,1.3,64,26,0,stone);
  for(let x=5;x<58;x+=13){box(x,1.4,11,.8,17,5,ink);face([[x+.8,2.3,6],[x+10.2,2.3,6],[x+10.2,2.3,21],[x+.8,2.3,21]],'#b7cac5');line([x+5.5,2.4,6],[x+5.5,2.4,21],'#657879');}
  for(let z of [7,14,21]){box(66,2,24,3,1,z,oak);for(let j=0;j<11;j++){let c=[sage,ink,oak,stone][j%4];box(67+j*1.8,2.6,1.4,1.6,3+j%3,z+1,c);}}
  plant(5,8);chair(29,6,true);chair(43,6,true);table(23,14,35,14);box(34,18,5,4,.3,10.5,stone);plant(89,8);chair(28,29);chair(43,29);
  box(61,14,1,17,12,0,stone);table(70,17,17,10);box(74,18,8,1,5,10.5,ink);chair(73,28);
  for(let y of [35,48]){box(3,y,9,9,4,0,oak);box(3,y,7,9,2,4,sage);box(3,y,1.5,9,5,5,sage);}
  table(16,43,9,10);box(18,45,4,3,.5,10.5,stone);plant(6,59);
  table(49,43,31,11);box(57,46,8,1,5,10.5,ink);box(70,47,4,3,.3,10.5,stone);chair(59,55);
  return '<svg class="office-art" viewBox="64 43 383 231" aria-hidden="true">'+shapes+'</svg>';
}
