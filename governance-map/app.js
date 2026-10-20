'use strict';
const axes=[
 ['���� �韫������','���� �鬩� ��� ����� ����� ��� ���� 穟����? �� ����� ��� ��� �짟� ���? �� ꩟㟡 秩�� ��� �韫�꩟� �����.',3],
 ['������ 횭��� ��ꭟ�','���� ����� ��� �鬩� �꫟���� ��᩟� ��ꢚ��� ������? ����� ����� ����� ��꬟�� ������ ��㟧�.',3],
 ['�� �靧��� ��餟�','��� ���� 秩�� ��� ������ ��矠� �� ��� ����� �럫�? ퟦ������ ꥧ��? ퟤ��㟢 �뢤�? ������ ꫢ�.',4],
 ['���� �靧��� ������','���� ���� ������ ��� ����� 㠩 ����� �隧ퟩ? ������ ��韥? ��꫟�� ���� ퟫ�꩟�� ����.',3],
 ['��몟� ����� ������','���� 몟� ��穟� ������ ������ �� ��ꭟ� �鬦�� �����韢 ��ꩢ�� ����� ������ �靠��.',3],
 ['��ꦟ� ��颪�� ��矠�','���� ��ꦟ� ���穟���? ����� ��颪�꟢ ������? ����� �ퟠ� 矠� ��ꢟ�� �韦����.',3],
 ['��꩟�� �颚�� ��ꫢ��','��� ����� ꫢ�� ����� ����� ��矠�? ����� 뢟�� ��꩟�� �������� ���� 朗� �颥�� �� �����.',3],
 ['��孟� ������꟢','��� ��ꫢ���� ����꟢ ����� �� ���� ���럫�? �� �� ���� ���럢 ������ ���� �����.',3]
];
const rows=[
 ['���� �����','��� ���� ����� ��� ���� �鬩� ����? ����� ����� ����� ��� ������ �� ����� ��穟�.','��� ���� �����','�� ����� 婭� ���? 廉�� ���� ������ �� �� �鬩� ����� �� ��꟧�.'],
 ['�韫������','���� ���� �鬩� ��� �짟� ���� ��ퟩ� �ꫛ�� �ꛬ��� ꢟ��.','�짟� ��� ��ꧡ','��� �鬩� �� ���� ���� ����� ��ꫢ�� ���犯�� ��ꫛ�� ����� ꩟�� �隧��.'],
 ['�韫���� �����','��� ��� ����� ��� ���� ������ ��� 秩� �鬩� ��� �ퟭ� ����� ����� �� ���著�.','��� ���� �隤� ���� �����','��� �鬩� ����� ������ �饩� ��� 韫�꩟� �颬��� �� ���� �����.'],
 ['���� ��꫟����','���� ����� ��ꩢ�� �������? �� ��� ������꟢ ��꬟�� ����� ����� ���� ��៩ ������.','���� 㟧� ���� �����','���� ������꟢ ��韪� 韢��� ��穟� ��꫟���� ��� ������� ����� ꢫ�.'],
 ['���� �颭��','���� ꬟�� ��꫟���� �� ��穟��� �駟�� �� ��������? �� ����� ���ퟢ �颭�� ��뢟��.','꬟�� �穟���','恵� ���� ����� ���矢�? ����� �隭ퟢ ��嵐 �� �� �� �� �����.'],
 ['����� ��ꭟ�','��� ��᩟� ��ꢚ��� ����� �鬩� ����� �� ��ퟭ� ��� ����� �韥⟢� ���餡 ���꟢�.','�ퟩ ����꟢','���� �鬩� �럡 韫�砟� ���� �������� �ꫛ�� ����餡 �ꧡ �驧.'],
 ['�颬��� �韫����','著�� ����� ���� ���� �馠��� ��秩� ��� ���� ��ꫢ��? �� ��孟� �� ����矢 ��ꛣ��.','�쟩�� �穟��� ������','����� ���� �쟩�� ����? ����� �穟��� �韫���� ����� �� ��� �����.'],
 ['�������� ��餟�','���� ��� �� �� ����� �韥�� ����� ����� �꫟��� ��� ���� ��矩��.','�ퟣ�� ��ꧡ','��� ���� �� ��� ��꩟�� 不� ���� ������� ퟤ��㟢� ��矩� ��� �����.'],
 ['�韤��㟢 ��穟���','���� �㧟� �韤��㟢 ����� ������꟢ ������ ��꧟�韢 ��穟��� �ꢟ�� �����.','꥟� �ꢟ��','﫤� �� 穟� �� ��ꫛ�� �� ����� ����� ��ꫢ��? �� ��� ��� ����� �� �韤��� �颟��.'],
 ['������ �颥���','著�� ���� �餟�� ������ ����� ������꟢ ���矬 ��ꢟ��? �� ��� ��뢟�� ��� ��ퟢ �����.','����� ���� �餟��','��� ����� ���� ���� ����矢? ���� ��㧟 ��� 革���� ��� ��颪�� ��.'],
 ['����� �隧ퟩ','��� � 廉� �� ����� ���� �靧��� ������? �� ��� ��꩟�� �� ���꟧.','�� ������ �� �����','��� ���� �韢��� ���犯��? ������ �靧��� ���� ��� ��� �韥� ���� �矩� �隧��.'],
 ['������ ��꫟��','���� �� �韥� ����� �ꫛ�� ��� ���� ����? �� �矘 ��꫟�� ꩢ�� �����.','���� �韥','���� ���� ��ꬢ� �� ��� ��� 著�� ��� ���? ����� ��ꠟ�� ��� ꫢ��.'],
 ['���� ����','���� ����噢 ��隧�� ����� �韫����? ���� ����� ��� �隧ퟩ ���� �� �饟��.','�� ��噢 ��� ���','��� ꛬ��� ���� ���� ������? �不� ���� �� ��� ���� ��ꩬ��� ����.'],
 ['�㟩� ��ꭟ�','��� �饟韢 ��� � ���� ��� �饡 ���� �� ��� ��� ������ ��穟�.','�孟� ����','�孥 ��� ���� �� ��� �������? ����� �� ��꬟�� �� ��穟� ������ �� ��� �靤��� ������.'],
 ['��᩟� ��� �����','���� �����韢 �� ��᩟� ��ꩢ�� ��鬩� �꫟� ꩟�� ��꟧ �럫� ����� �� �����.','꩟�� ��꟧','����� ���� ���� �矩 �� �� ꩢ�� ��矩� ������ ���� �� ��� ������ �� ���꟧ ��ꦢ��.'],
 ['����� �靠��','���� ����� ������ ���� �靠�� �� ��ꦟ�埢 㠩 �럡 ���� �髩� ����� ����餡 �����.','��� ��럡 ���','� ������ �靠�� ���� �� ��� ���? �� �� �颥��� �� �鬦� ����� �� ���.'],
 ['���� ��ꦟ�','���� �� ﬩� ��� ��ꦟ� ��� ���? �ꫢ�� ��ꦟ� ������ ����� ����餡 �颭��.','��� ꦟ� ���� ��餡','��� �鬩� ����� �韞��� ����� ������� ����� �� ������ ������� ����.'],
 ['��颪��','省� ����頟� ������ ����� ������ �不� ꫛ��� ꢟ��� 흣��� ���埘 ��.','��� ��颪�꟢','褐� ��� ��颪�꟢ �� ���� ���� ����� ��ꫛ�� ��� ����� ���� �颤��.'],
 ['��矠� �駟���','���� ������� ���� ����� ��� �颤��� ������ �� �� �靤����� ���� �� ���꟩��.','�ퟠ� ퟦ���� ����','��� �韥� �묟� ������ �� ��꟧ ����? ������ ��럢 �颥�� �� ���� ����.'],
 ['��꩟�� �駟���','���� ����� ꫢ�� ������� ���� ����� 흧��� ��ꦟ� ��矠�? ���� ��뢟�� ��� �� �靬��� ���럫��.','���� ꫢ��','����� ��꩟�� �駟��� ���� ��ꬢ� ��� �� ��� ��� ��ꦟ�? ����� 뢟��� ��� �� ��꩟��.'],
 ['��꩟�� �馟���','��� ��꩟�� �馟��� ���� ������ ��ꫢ�� �� ���ퟞ� ����� ��� ��� ������ ������ �����.','��� ��꩟��','��� ���� �� ��� ��ꦢ�� ��� ��꩟�� ��� ��뢟�� ��꫟�� ��� ������ ��ꢟ��.'],
 ['��餡 ���韥⟢','����� 뢟�� ��꩟�� ��� ������� ���� �ꫛ�� �����? �� �颥�� �� ���� ����餡 �� �����.','���� �����','��� �靧��� �筟 �� �韥 �����? �� ����� ��꩟�� �� ����� �� ���� ���韥�.'],
 ['��矩� ��孟�','���� ������꟢ ����� ��� ����� ��� ��� ��ꫢ����? ����� 묩� �ꫛ��� ꩟��� ��꟧�.','����꟢ ��� ��� ���','��� ����� ��矩� 不� ���럢 ������� 묩�? ��� 著���? ����� ������.'],
 ['���� ���럢','���� �� ���럢 ����� ퟢ���� ������� ����� ���� ꭧ��.','��럢 �����','�០� ���� ����㟢 ��� ����� �颬���� ���� ����� �� ��� ��� �隧�� ����.'],
 ['��� ������꟢','���� �韥 ������ ��� ������꟢ ������� ����� �� �럫� ������ ���頟� ����.','�韥 ���� ����','��� ����� ���� ������� �������? ������ ��韥 �� ���� �隧ퟩ �� ��쟘 ������.']
];
let offset=0;axes.forEach((a,i)=>{a[3]=offset;offset+=a[2];});
const $=id=>document.getElementById(id),parts=[...document.querySelectorAll('.hotspot')];
let currentAxis=0,currentTopic=-1,pinned=false,zoom=1;
function escapeText(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(a,t=-1,kind='axis',updateHash=false){
 currentAxis=a;currentTopic=t;const ax=axes[a],row=t<0?null:rows[t];
 $('axisSelect').value=a;
 $('level').textContent=(kind==='practice'?'�����':row?'�������':'�����')+' � '+String(a+1).padStart(2,'0')+' / 08';
 $('detail').innerHTML=row?'<h2>'+escapeText(kind==='practice'?row[2]:row[0])+'</h2><p>'+row[1]+'</p><h3>��ꦩ� ������</h3><div class="application">'+row[2]+'</div><h3>꣟�</h3><p>'+row[3]+'</p><p class="axis-description">��� ��� <b>'+ax[0]+'</b></p>':'<h2>'+ax[0]+'</h2><p>'+ax[1]+'</p><h3>����㟢 �����</h3><p>'+rows.slice(ax[3],ax[3]+ax[2]).map(r=>r[0]).join(' � ')+'</p><div class="application">���� ����� 韫�謟� ���� ������</div>';
 $('topicButtons').replaceChildren(...rows.slice(ax[3],ax[3]+ax[2]).map((r,i)=>{const b=document.createElement('button');b.type='button';b.textContent=r[0];b.setAttribute('aria-pressed',String(t===ax[3]+i));b.onclick=()=>{setPin(true);render(a,ax[3]+i,'topic',true)};return b}));
 for(const p of parts){const same=Number(p.dataset.axis)===a&&(t<0?Number(p.dataset.topic)===-1:Number(p.dataset.topic)===t);p.classList.toggle('active',same);p.setAttribute('aria-pressed',String(same));}
 if(updateHash)history.replaceState(null,'','#axis-'+(a+1)+(t>=0?'-topic-'+(t-ax[3]+1):''));
}
function setPin(value){pinned=value;$('unpin').hidden=!value;}
axes.forEach((a,i)=>{$('axisSelect').add(new Option(String(i+1).padStart(2,'0')+' � '+a[0],i));});
parts.forEach((p,i)=>{const a=Number(p.dataset.axis),t=Number(p.dataset.topic),k=p.dataset.kind;const label=t<0?axes[a][0]:rows[t][k==='practice'?2:0];p.setAttribute('aria-label',label);const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=label;p.append(title);
 p.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!pinned)render(a,t,k)});
 p.addEventListener('focus',()=>{if(!pinned)render(a,t,k)});
 p.addEventListener('click',()=>{setPin(true);render(a,t,k,true)});
 p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();p.click();}if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();setPin(false);parts[(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+parts.length)%parts.length].focus();}});
});
$('axisSelect').onchange=e=>{setPin(false);render(Number(e.target.value),-1,'axis',true)};
$('unpin').onclick=()=>setPin(false);
$('previous').onclick=()=>{setPin(false);render((currentAxis+7)%8,-1,'axis',true)};
$('next').onclick=()=>{setPin(false);render((currentAxis+1)%8,-1,'axis',true)};
function changeZoom(v){zoom=Math.max(1,Math.min(3,v));$('drawing').style.width=zoom===1?'':(zoom*100)+'%';$('zoomLabel').textContent=Math.round(zoom*100)+'%';$('zoomOut').disabled=zoom===1;$('zoomIn').disabled=zoom===3;}
$('zoomIn').onclick=()=>changeZoom(zoom+.25);$('zoomOut').onclick=()=>changeZoom(zoom-.25);
$('reset').onclick=()=>{setPin(false);changeZoom(1);$('canvas').scrollTo(0,0);render(0,-1,'axis',true)};
const explorer=$('explorer');function syncFullscreen(){const expanded=!!document.fullscreenElement||explorer.classList.contains('expanded');$('fullscreen').textContent=expanded?'��쟘 �� �鬟�� ?':'�� �鬟�� ?';$('fullscreen').setAttribute('aria-pressed',String(expanded));}
function closeFallback(){explorer.classList.remove('expanded');document.body.classList.remove('has-expanded');syncFullscreen();}
$('fullscreen').onclick=async()=>{if(document.fullscreenElement){await document.exitFullscreen();return;}if(explorer.classList.contains('expanded')){closeFallback();return;}try{if(!explorer.requestFullscreen)throw Error('fallback');await explorer.requestFullscreen();}catch{explorer.classList.add('expanded');document.body.classList.add('has-expanded');}syncFullscreen();};
document.addEventListener('fullscreenchange',syncFullscreen);document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeFallback();setPin(false);}});
function fromHash(){const m=location.hash.match(/^#axis-([1-8])(?:-topic-([1-4]))?$/);if(m){const a=Number(m[1])-1,t=m[2]?Number(m[2])-1:-1;render(a,t>=0&&t<axes[a][2]?axes[a][3]+t:-1);setPin(true);}else render(0);}
window.addEventListener('hashchange',fromHash);fromHash();changeZoom(1);syncFullscreen();
