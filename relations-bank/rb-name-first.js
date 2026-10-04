import {getNameState,saveMemberName} from './rb-name-tool.js?v=1';

const yes=/^(اي|ايوه|أيوه|نعم|صح|صحيح|تمام|يب|yes)$/i;
function add(role,text){
  const host=document.getElementById('rbAiChat');if(!host||!text)return;
  const el=document.createElement('div');el.className='rb-ai-msg '+role;el.textContent=text;host.appendChild(el);host.scrollTop=host.scrollHeight;
}
function extract(text,current){
  const value=String(text||'').trim();
  if(current&&yes.test(value))return current;
  const m=value.match(/(?:اسمي|أنا|انا)\s+(.{2,80})$/);
  return (m?.[1]||value).replace(/[.!؟]+$/,'').trim();
}
async function bind(){
  const form=document.getElementById('rbAiForm'),input=document.getElementById('rbAiText');
  if(!form||!input)return setTimeout(bind,120);
  form.addEventListener('submit',async event=>{
    let state;try{state=await getNameState()}catch{return}
    if(state?.confirmed)return;
    event.preventDefault();event.stopImmediatePropagation();
    const raw=input.value.trim();if(!raw)return;
    input.value='';add('user',raw);
    const name=extract(raw,state?.name&&state.name!=='عضو'?state.name:'');
    if(!name||name.length<2){add('assistant','وش الاسم اللي نعتمده؟');return}
    try{
      const saved=await saveMemberName(name);
      if(!saved?.ok)return;
      add('assistant','حياك الله '+saved.name+'.');
      const live=document.getElementById('rbAiLive');if(live)live.textContent='حياك الله '+saved.name+'.';
      const gap=await window.RBExecuteTool?.('get_next_gap',{});
      if(gap?.next?.prompt)add('assistant',gap.next.prompt);
    }catch(error){console.error(error)}
  },true);
}
bind();