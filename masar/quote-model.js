
export const quoteContentFields=['brandMode','client','clientId','quoteNo','issuedDate','service','serviceName','successRate','successBasis','successTerms','amount','validDays','duration','scope','expertise','studyImpact','deliverables','extras','payment','terms','outSummary','outPoints','outRecs','outNext','freeNotes','owner','followDate','customName','customCR','customEmail','customPhone','customWeb','customSocial','customLogo'];
export const isIssued=row=>Boolean(row?.sentAt)||['تم إرسال العرض','مقبول'].includes(row?.status);
export function fingerprint(row){const {updatedAtIso,...data}=row||{};return JSON.stringify(Object.keys(data).sort().map(k=>[k,data[k]]));}
export function preserveIssuedContent(previous,current){
 if(!isIssued(previous))return current;
 const next={...current};
 for(const key of quoteContentFields){if(Object.hasOwn(previous,key))next[key]=previous[key];else if(key!=='issuedDate')delete next[key];}
 return next;
}
export function renameClientQuotes(quotes,clientId,oldName,newName){
 const normalized=s=>String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ar');
 return quotes.map(q=>{
  if(q.clientId!==clientId&&normalized(q.client)!==normalized(oldName))return q;
  return {...q,clientId,client:isIssued(q)?q.client:newName};
 });
}

export function buildMigrationPlan(userId,data){
 if(!userId||!data||typeof data!=='object')throw new Error('A user and source snapshot are required');
 const documents=[],seen=new Set(),deleted=new Set(data.pricingTool_v1?.deletedQuoteIds||[]);
 const add=(collection,id,record)=>{if(!id)throw new Error('Missing record ID: '+collection);const path='users/'+encodeURIComponent(userId)+'/'+collection+'/'+encodeURIComponent(id);if(seen.has(path))throw new Error('Duplicate record ID: '+id);seen.add(path);documents.push({path,data:structuredClone(record)});};
 for(const q of data.pricingTool_v1?.quotes||[]){const id=String(q.id||q.quoteNo||'');if(!deleted.has(id))add('masarQuotes',id,q);}
 for(const client of data.pricingClients_v1?.clients||[])add('masarClients',client.id,client);
 for(const [clientId,matrix] of Object.entries(data.authorityMatrices_v1?.matrices||{}))add('masarMatrices',clientId,matrix);
 return {version:2,sourceRetained:true,userId,documents,deletedQuoteIds:[...deleted],currentQuoteId:data.pricingTool_v1?.currentQuoteId||null};
}
