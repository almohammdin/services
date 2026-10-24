// Add published tools here. Each tool must implement the public/private contract in README.md.
export const TOOLS=Object.freeze([
 {id:'authority-matrix',name:'مصفوفة الصلاحيات',category:'الحوكمة',description:'توزيع مسؤوليات القرار والاعتماد والمراجعة، وإعداد مصفوفة شاملة وعروض حسب المنصب.',url:'/services/masar/authority-matrix/',outputs:'PDF · JSON',workspaceField:'authorityMatrices_v1'},
 {id:'consultation',name:'استكشاف الأعمال وأولويات التعاون',category:'الاستشارات',description:'استبيان تمهيدي لفهم النشاط والأهداف والملكية والإدارة والتوسع، وترتيب أولويات التعاون.',url:'/services/consultation/',outputs:'PDF · TXT · JSON',openLabel:'فتح الاستبيان',clientUrl:'/services/masar/consultation/',clientLabel:'إجابات العميل والمتابعة',workspaceKind:'client-consultation',note:'شارك رابط الاستبيان مع العميل، ثم استورد ملف إجاباته واحفظه في ملفه الخاص داخل مسار.'}
]);
export function toolUrl(tool,clientId=''){
 const url=new URL(clientId&&tool.clientUrl?tool.clientUrl:tool.url,location.origin);
 if(clientId)url.searchParams.set('clientId',clientId);
 return url.pathname+url.search;
}
