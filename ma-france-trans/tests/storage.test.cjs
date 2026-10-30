const storage=new Map();
const fs=require('fs'),vm=require('vm'),assert=require('assert');const el=()=>({addEventListener(){},innerHTML:'',textContent:'',value:'',style:{},focus(){},close(){}}),els={};const ctx={console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:s=>els[s]??=el(),documentElement:{},activeElement:null},setTimeout(){},clearTimeout(){},URL,Blob,Intl,Date,Math,crypto:require('crypto').webcrypto,location:{hash:''},history:{replaceState(){}},window:{scrollTo(){}},confirm:()=>true,navigator:{},FormData};vm.createContext(ctx);for(const file of ['domain.js','app.js','i18n.js','content.js','operations.js','init.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..',file),'utf8'),ctx);
(async()=>{
await vm.runInContext(`(async()=>{
if(!persist())throw Error('initial save');
const count=data.tasks.length, target=data.tasks[0].id;
removeItem('tasks',target);
if(rows('tasks').length!==count-1)throw Error('trash');
restoreRecord('tasks',target);
if(rows('tasks').length!==count)throw Error('restore');
const before=JSON.stringify(data);
await importBackup({target:{files:[{size:2,text:async()=>'{"version":9}'}],value:'x'}});
if(JSON.stringify(data)!==before)throw Error('invalid import mutated data');
const next=JSON.parse(before);next.settings.editor='QA';
await importBackup({target:{files:[{size:100,text:async()=>JSON.stringify(next)}],value:'x'}});
if(data.settings.editor!=='QA')throw Error('valid import');
if(!JSON.parse(localStorage.getItem(KEY+'_snapshots')).length)throw Error('no snapshots');
const stable=JSON.stringify(data);data.tasks[0].status='invalid';
if(persist()||JSON.stringify(data)!==stable)throw Error('rollback');
localStorage.setItem(KEY,JSON.stringify({...data,settings:{...data.settings,editor:'other tab'}}));
data.settings.editor='overwrite';if(persist())throw Error('concurrent overwrite');
})()`,ctx);
console.log('PASS: persistence, recoverable delete, restore, valid/invalid imports, snapshots, invalid-data rollback and cross-tab conflict refusal');
})().catch(e=>{console.error(e);process.exitCode=1});
