export type Page='home'|'events'|'plan'|'contacts'|'agenda'|'results'|'knowledge';
export type Role='visitor'|'exhibitor';
export type Goal='suppliers'|'learning'|'network'|'market'|'leads'|'distributors'|'product';
export type Phase='before'|'during'|'after';
export type ContactStatus='new'|'followup'|'offer'|'won'|'later';
export type Evidence='estimate'|'organizer'|'source';
export interface Answer {value:number|null;evidence:Evidence;source:string;}
export interface Participation {id:string;name:string;kind:string;role:Role;goal:Goal;city:string;country:string;start:string;end:string;timezone:string;url:string;objective:string;target:number;actual:number;budget:number;cost:number;margin:number;conversion:number;answers:Answer[];notes:string;createdAt:string;updatedAt:string;archived:boolean;demo:boolean;}
export interface Task {id:string;eventId:string;title:string;phase:Phase;due:string;owner:string;done:boolean;}
export interface Contact {id:string;eventId:string;name:string;company:string;job:string;phone:string;email:string;website:string;booth:string;note:string;interest:string;nextStep:string;followup:string;owner:string;status:ContactStatus;qualified:boolean;value:number;contribution:number;price:number;warranty:string;delivery:string;rating:number;card?:string;createdAt:string;}
export interface Appointment {id:string;eventId:string;title:string;type:'meeting'|'session'|'visit';start:string;end:string;location:string;note:string;insight:string;action:string;}
export interface State {version:3;events:Participation[];tasks:Task[];contacts:Contact[];appointments:Appointment[];activeId:string;dateMode:'both'|'gregorian'|'hijri';legacyImported?:boolean;}
export const goals:Record<Goal,{label:string;metric:string;hint:string}>={suppliers:{label:'البحث عن موردين',metric:'عروض قابلة للمقارنة',hint:'مثال: مقارنة 3 عروض معدات مع الضمان والصيانة'},learning:{label:'التعلم والتطوير',metric:'أفكار طبقتها',hint:'مثال: تطبيق فكرتين لتحسين تجربة العميل'},network:{label:'بناء علاقات',metric:'علاقات لها خطوة تالية',hint:'مثال: ترتيب 4 لقاءات مع شركاء محتملين'},market:{label:'استكشاف سوق',metric:'فرص جرى التحقق منها',hint:'مثال: فهم قنوات التوزيع ومقابلة 3 جهات'},leads:{label:'توليد فرص بيعية',metric:'فرص مؤهلة',hint:'مثال: الوصول إلى 20 فرصة تناسب منتجك'},distributors:{label:'البحث عن موزعين',metric:'موزعون مناسبون',hint:'مثال: الحصول على 3 عروض توزيع'},product:{label:'اختبار منتج',metric:'تجارب موثقة',hint:'مثال: جمع 15 تجربة مع ملاحظات محددة'}};
export const roleGoals:Record<Role,Goal[]>={visitor:['suppliers','learning','network','market'],exhibitor:['leads','distributors','product','market']};
export const phaseNames:Record<Phase,string>={before:'قبل الفعالية',during:'أثناء الفعالية',after:'بعد الفعالية'};
export const statusNames:Record<ContactStatus,string>={new:'جهة جديدة',followup:'متابعة',offer:'عرض أو مقترح',won:'نتيجة تحققت',later:'مؤجلة'};
export const emptyState=():State=>({version:3,events:[],tasks:[],contacts:[],appointments:[],activeId:'',dateMode:'both'});
export const uid=()=>crypto.randomUUID();
export const today=()=>new Date().toLocaleDateString('en-CA');
export function makeEvent(partial:Partial<Participation>={}):Participation{return {id:uid(),name:'',kind:'معرض',role:'visitor',goal:'suppliers',city:'',country:'',start:'',end:'',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Riyadh',url:'',objective:'',target:3,actual:0,budget:0,cost:0,margin:0,conversion:20,answers:Array.from({length:5},()=>({value:null,evidence:'estimate',source:''})),notes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),archived:false,demo:false,...partial};}
export function makeContact(eventId:string,partial:Partial<Contact>={}):Contact{return{id:uid(),eventId,name:'',company:'',job:'',phone:'',email:'',website:'',booth:'',note:'',interest:'',nextStep:'',followup:'',owner:'',status:'new',qualified:false,value:0,contribution:0,price:0,warranty:'',delivery:'',rating:0,createdAt:new Date().toISOString(),...partial};}
export const n=(v:unknown)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
export const num=(v:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);
export const safeUrl=(value:string)=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}};
export function dateText(value:string,mode:State['dateMode']='gregorian'){if(!value)return 'حدد الموعد';const date=new Date(value.slice(0,10)+'T12:00:00');if(!Number.isFinite(+date))return 'راجع التاريخ';const greg=new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory',{day:'numeric',month:'long',year:'numeric'}).format(date);const hij=new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(date);return mode==='gregorian'?greg+' م':mode==='hijri'?hij+' هـ':hij+' هـ | '+greg+' م';}
