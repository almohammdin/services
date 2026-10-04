/** Encrypted local workspace; keys exist only in this module's memory. */
import {validateState} from './core.js';
const KEY='knowledge_bank_v1_encrypted';
const ITERATIONS=600000;
let activeKey=null,salt=null,lastRaw=null,queue=Promise.resolve();
const enc=new TextEncoder(),dec=new TextDecoder();
function b64(bytes){let s='';for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);return btoa(s);}
function unb64(text){if(typeof text!=='string'||text.length>8_000_000)throw Error('ملف النسخة غير صالح.');return Uint8Array.from(atob(text),c=>c.charCodeAt(0));}
async function derive(password,s){const raw=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:s,iterations:ITERATIONS,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
function envelope(raw){const x=JSON.parse(raw);if(x?.format!=='knowledge-bank-vault'||x.version!==1||x.iterations!==ITERATIONS||typeof x.data!=='string')throw Error('هذا الملف ليس نسخة احتياطية متوافقة.');const s=unb64(x.salt),iv=unb64(x.iv);if(s.length!==16||iv.length!==12)throw Error('ملف النسخة غير صالح.');return {...x,s,ivBytes:iv};}
async function encode(state,key,s){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode('knowledge-bank-v1')},key,enc.encode(JSON.stringify(state)));return JSON.stringify({format:'knowledge-bank-vault',version:1,iterations:ITERATIONS,salt:b64(s),iv:b64(iv),data:b64(data)});}
async function decode(raw,password){const e=envelope(raw);const key=await derive(password,e.s);try{const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:e.ivBytes,additionalData:enc.encode('knowledge-bank-v1')},key,unb64(e.data));return {state:validateState(JSON.parse(dec.decode(clear))),key,s:e.s};}catch{throw Error('كلمة المرور غير صحيحة أو ملف النسخة تالف.');}}
export function exists(){try{return !!localStorage.getItem(KEY);}catch{return false;}}
export function supported(){return !!crypto?.subtle;}
export function isOpen(){return !!activeKey;}
export async function create(password,state){if(exists())throw Error('توجد مساحة محفوظة. افتحها أو استعد نسختها.');if(password.length<12)throw Error('استخدم كلمة مرور من 12 حرفا على الأقل.');const s=crypto.getRandomValues(new Uint8Array(16));const key=await derive(password,s);const raw=await encode(validateState(state),key,s);localStorage.setItem(KEY,raw);salt=s;activeKey=key;lastRaw=raw;}
export async function unlock(password){const raw=localStorage.getItem(KEY);if(!raw)throw Error('لم نجد مساحة محفوظة في هذا المتصفح.');const result=await decode(raw,password);activeKey=result.key;salt=result.s;lastRaw=raw;return result.state;}
export function save(state){if(!activeKey)return Promise.reject(Error('المساحة مقفلة.'));const snapshot=structuredClone(state),key=activeKey,s=salt;const operation=queue.catch(()=>{}).then(async()=>{const raw=await encode(snapshot,key,s);if(localStorage.getItem(KEY)!==lastRaw)throw Error("تغيرت المساحة في نافذة أخرى. افتحها من جديد قبل الحفظ.");localStorage.setItem(KEY,raw);lastRaw=raw;});queue=operation.catch(()=>{});return operation;}
export async function lock(){await queue;activeKey=null;salt=null;lastRaw=null;}
export async function backup(){await queue;const raw=localStorage.getItem(KEY);if(!raw)throw Error('المساحة غير موجودة.');return raw;}
export async function restore(raw,password){await queue;const result=await decode(raw,password);localStorage.setItem(KEY,raw);activeKey=result.key;salt=result.s;lastRaw=raw;return result.state;}
export async function erase(){await queue;localStorage.removeItem(KEY);activeKey=null;salt=null;lastRaw=null;}
export const storageKey=KEY;
