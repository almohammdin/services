const grokLinks=(function(){
  const safeId=/^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;
  const serviceHosts=new Set(['cursor.com','www.cursor.com','x.ai','www.x.ai','grok.com','www.grok.com']);
  function botId(input){
    const raw=String(input||'').trim();
    if(safeId.test(raw))return raw;
    let link;
    try{link=new URL(raw)}catch{return ''}
    const promptLink=link.protocol==='grokbot:'&&link.host==='app'&&link.pathname==='/v1/prompt';
    const webLink=link.protocol==='https:'&&serviceHosts.has(link.host)&&!link.username&&!link.password;
    if(!promptLink&&!webLink)return '';
    const path=link.pathname.split('/').filter(Boolean);
    if(path.some(k=>['plugin','template','templates','onboarding','share-template','signup','sign-in'].includes(k)))return '';
    const fromQuery=link.searchParams.get('id');
    if(promptLink||(webLink&&link.pathname==='/grok-bot/link/v1/prompt'))return safeId.test(fromQuery||'')?fromQuery:'';
    const candidate=path.at(-1)||'';
    if(path.length<2||!safeId.test(candidate)||['bot','bots','grok-bot','prompt','share','new','link','home'].includes(candidate))return '';
    if(!path.slice(0,-1).some(k=>['bot','bots','grok-bot','agent','agents'].includes(k)))return '';
    return candidate
  }
  function launchUrl(id,message=''){
    if(!safeId.test(id))return '';
    const url=new URL('grokbot://app/v1/prompt');
    url.searchParams.set('id',id);
    // Keep longer briefs intact for clipboard handoff.
    if(message&&message.length<=1000)url.searchParams.set('text',message.replace(/\r?\n/g,' '));
    return url.href.replaceAll('+','%20')
  }
  return {botId,launchUrl}
})();
