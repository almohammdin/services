const fs=require('fs'),vm=require('vm'),assert=require('assert');const el=()=>({addEventListener(){},innerHTML:'',textContent:'',value:'',style:{},focus(){}}),els={};const ctx={console,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:s=>els[s]??=el(),documentElement:{},activeElement:null},setTimeout(){},clearTimeout(){},URL,Blob,Intl,Date,Math,crypto:require('crypto').webcrypto,location:{hash:''},history:{replaceState(){}},window:{scrollTo(){}},confirm:()=>true,navigator:{},FormData};vm.createContext(ctx);for(const file of ['domain.js','app.js','i18n.js','content.js','operations.js','init.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..',file),'utf8'),ctx);vm.runInContext(`
for(const l of ['ar','fr','en','es']){lang=l;for(const p of ['dashboard','diagnosis','returns','tasks','leads','finance','marketing','plan','team','settings']){page=p;render();if(/undefined|NaN/.test($('#main').innerHTML))throw Error(l+' '+p)}}
if(data.tasks.length!==21)throw Error('plan');
if(!valid(data))throw Error('baseline invalid');
const invalid=JSON.parse(JSON.stringify(data));invalid.tasks[0].id="');alert(1);('";if(valid(invalid))throw Error('unsafe id');
for(const key in words){if(words[key].length!==4)throw Error('missing locale '+key)}
`,ctx);console.log('PASS: 40 localized views, 21 planned tasks, locale completeness, data and unsafe-ID validation');
