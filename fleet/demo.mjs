// Fictional sample ownership/history. General Saudi Toyota service examples only;
// not a VIN-specific manufacturer schedule or actual prices/service invoices.
export const demoReference='https://www.toyota.com.sa/en/my-toyota/periodic-maintenance';
export const demoProgram='https://www.toyota.com.sa/en/offers/jmp';
export function seedExamples(state,day){
 if(state.settings.examplesSeeded||state.settings.examplesDeleted)return false;
 const ago=n=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()-n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const id=n=>'de000000-0000-4000-8000-'+String(n).padStart(12,'0');
 const list=[{name:'Toyota Camry 2026',year:2026,type:'سيارة ركوب',km:8500,lastKm:0,days:90,color:'#d1d8df',kind:'sedan'}, {name:'Toyota Hilux 2020',year:2020,type:'نقل خفيف',km:129400,lastKm:120000,days:110,color:'#b9ad94',kind:'pickup'}, {name:'Toyota Corolla 2015',year:2015,type:'سيارة ركوب',km:211200,lastKm:200000,days:180,color:'#b3b9c3',kind:'sedan'}];
 list.forEach((c,index)=>{const vehicleId=id(index+1);state.vehicles.push({id:vehicleId,name:c.name,type:c.type,year:c.year,km:c.km,plate:'DEMO '+(index+1),market:'Saudi Arabia',model:'',engine:'Petrol',vin:'',startDate:'',readingDate:day,photo:'',demo:true,demoColor:c.color,demoKind:c.kind});
 const tasks=[['الصيانة الدورية العامة','فحص',10000],['فحص الفرامل والإطارات','فحص',10000],['فحص مرشح الهواء','فحص',10000]];
 tasks.forEach(([name,action,km],j)=>{const ruleId=id(100+index*10+j);state.rules.push({id:ruleId,vehicleId,name,action,condition:'عادي',km,months:0,baseKm:c.lastKm,baseDate:ago(c.days),source:'Toyota KSA — general service example',sourceUrl:demoReference,page:'',demo:true});if(c.lastKm>0){state.records.push({id:id(200+index*10+j),vehicleId,ruleId,name,date:ago(c.days),km:c.lastKm,cost:j===0?(index===1?650:420):0,workshop:'مركز خدمة تجريبي',notes:'بيانات وتكاليف توضيحية؛ ليست فاتورة فعلية أو توصية خاصة بهذا الطراز.',photos:[],demo:true});}});
 });
 state.settings.examplesSeeded=true;return true;
}
export function removeExamples(state){
 const collections=['rules','records','people','documents'];
 // Preserve any edited vehicle or vehicle with user-created/edited dependent data.
 const preserve=new Set(state.vehicles.filter(v=>v.demo&&collections.some(k=>state[k].some(x=>x.vehicleId===v.id&&!x.demo))).map(v=>v.id));
 state.vehicles=state.vehicles.filter(v=>!v.demo||preserve.has(v.id)).map(v=>preserve.has(v.id)?{...v,demo:false}:v);
 const removedRuleIds=new Set(state.rules.filter(r=>r.demo).map(r=>r.id));
 for(const k of collections)state[k]=state[k].filter(x=>!x.demo);
 for(const r of state.records)if(removedRuleIds.has(r.ruleId))r.ruleId='';
 state.settings.examplesDeleted=true;state.settings.examplesSeeded=true;
}
