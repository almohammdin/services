export const photoAssets={
 camry:{file:'images/camry-xv80.jpg',author:'MercurySable99 · Alex Neman',source:'https://commons.wikimedia.org/wiki/File:2025_Toyota_Camry_LE,_front_left.jpg',description:'2025 Toyota Camry LE (XV80), USA; illustrative of the generation, not an exact Saudi 2026 trim.'},
 hilux:{file:'images/hilux-2020.jpg',author:'Chanokchon',source:'https://commons.wikimedia.org/wiki/File:2020_Toyota_Hilux_Revo_4x4_Double-Cab_2.8_Rocco.jpg',description:'2020 Toyota Hilux Revo 2.8 Rocco, Thailand; trim and engine differ from the fictional example.'},
 corolla:{file:'images/corolla-2015.jpg',author:'Kevauto',source:'https://commons.wikimedia.org/wiki/File:2015_Toyota_Corolla_LE_front_5.6.18.jpg',description:'2015 Toyota Corolla LE, North America; regional styling differs from Saudi trims.'}
};
const keys=['camry','hilux','corolla'];
export async function hydrateDemoPhotos(state,load){let changed=false;for(let i=0;i<keys.length;i++){const id='de000000-0000-4000-8000-'+String(i+1).padStart(12,'0');const v=state.vehicles.find(v=>v.id===id&&v.demo);if(!v||v.photo||v.photoAssetVersion===1)continue;try{v.photo=await load(photoAssets[keys[i]].file);v.photoCredit=keys[i];v.photoAssetVersion=1;changed=true;}catch{/* Keep existing data; retry download on next page load. */}}return changed;}
