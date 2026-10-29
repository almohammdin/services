import assert from 'node:assert/strict';
import {translations} from './translations.mjs';
for(const [key,values] of Object.entries(translations)){assert.equal(values.length,2,key);for(const value of values){assert.equal(typeof value,'string',key);assert.ok(value.length,key);if(key!=='مثال: أ ب د 1234')assert.ok(!/[\u0600-\u06ff]/u.test(value),key);}}
globalThis.localStorage={getItem:()=> 'fr'};
const fr=await import('./i18n.mjs?test=fr');assert.equal(fr.currentLanguage(),'fr');assert.equal(fr.locale(),'fr-FR');assert.equal(fr.t('حفظ'),'Enregistrer');assert.equal(fr.ts('＋ إضافة مركبة'),'＋ Ajouter un véhicule');assert.equal(fr.t('Custom user text'),'Custom user text');
globalThis.localStorage={getItem:()=> 'en'};
const en=await import('./i18n.mjs?test=en');assert.equal(en.t('فحص'),'Inspect');assert.equal(en.ts(' كم'),' km');
globalThis.localStorage={getItem:()=> 'invalid'};
const ar=await import('./i18n.mjs?test=ar');assert.equal(ar.currentLanguage(),'ar');assert.equal(ar.t('حفظ'),'حفظ');
console.log('All '+Object.keys(translations).length+' translations and locale fallback verified');
globalThis.localStorage={getItem:()=> 'en'};
const {validateRules}=await import('./domain.mjs');
assert.equal(validateRules([{name:'User text عربي',action:'استبدال',km:10000}])[0].action,'استبدال');
assert.throws(()=>validateRules([{name:'x',km:0,months:0}]),/Item 1: Enter a valid interval/);
console.log('Stored enum compatibility and localized validation verified');
