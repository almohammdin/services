'use strict';
icons.diagnosis=icons.marketing;icons.returns='M3 7h12v10H3zM15 10h4l3 4v3h-7M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4';
initPlan();data.returns=data.returns||[];applyPlanUpdate();addMarketingWeeks();migrate();
$('#lang').addEventListener('change',e=>{cacheContentDraft();lang=e.target.value;try{localStorage.setItem('maft_language',lang)}catch{}render()});
const hash=location.hash.slice(1);if(Object.keys(icons).includes(hash))page=hash;
render();
