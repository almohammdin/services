// Add published tools here. Each tool must implement the public/private contract in README.md.
export const TOOLS=Object.freeze([
 {id:'authority-matrix',name:'مصفوفة الصلاحيات',category:'الحوكمة',description:'توزيع مسؤوليات القرار والاعتماد والمراجعة، وإعداد مصفوفة شاملة وعروض حسب المنصب.',url:'/services/masar/authority-matrix/',outputs:'PDF · JSON',workspaceField:'authorityMatrices_v1'}
]);
export function toolUrl(tool,clientId=''){
 const url=new URL(tool.url,location.origin);
 if(clientId)url.searchParams.set('clientId',clientId);
 return url.pathname+url.search;
}
