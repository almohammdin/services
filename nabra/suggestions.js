import {splitPoem,skeleton} from './prosody.js?v=20';
export function preservesScope(original,proposed,target='all'){
 const a=splitPoem(original),b=splitPoem(proposed);
 if(a.length!==b.length||a.some((p,i)=>p.filter(Boolean).length!==b[i].filter(Boolean).length))return false;
 if(target==='all')return true;
 if(!/^\d+-[01]$/.test(target))return false;
 const [bi,sj]=target.split('-').map(Number);if(!a[bi]?.[sj])return false;
 return a.every((p,i)=>p.every((s,j)=>i===bi&&j===sj||skeleton(s)===skeleton(b[i][j]||'')));
}
export function applyScoped(original,proposed,target='all'){
 if(!preservesScope(original,proposed,target))throw Error('scope');
 if(target==='all')return proposed;
 const a=splitPoem(original),b=splitPoem(proposed),[i,j]=target.split('-').map(Number);
 a[i][j]=b[i][j];return a.map(p=>p.filter(Boolean).join(' * ')).join('\n');
}
