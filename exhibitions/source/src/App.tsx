import {useEffect,useRef,useState,lazy,Suspense} from 'react';
import {FolderOpen,BookOpen,Plus,Settings,Download,Check,MoreHorizontal,ArrowLeft} from 'lucide-react';
import {registerSW} from 'virtual:pwa-register';
import {AppContext,type ModalState} from './context';
import {emptyState,dateText,today,type Page,type Phase,type State} from './model';
import {loadState,saveState} from './storage';
import {base,BrandSymbol,Button,Empty} from './ui';
import {Events,Plan,Contacts,Results,Knowledge} from './pages';
import {Welcome,JourneyHome} from './experience';
import {addDemo} from './demo';
import {suggestedPhase} from './journey.mjs';
import Forms from './Forms';
const Agenda=lazy(()=>import('./Agenda'));
export default function App(){
 const [state,setState]=useState<State>(emptyState),[demo,setDemo]=useState<State|null>(null),[ready,setReady]=useState(false);
 const [page,setPage]=useState<Page>('home'),[phase,setPhase]=useState<Phase>('before'),[modal,setModal]=useState<ModalState|null>(null);
 const [toast,setToast]=useState(''),[saveStatus,setSaveStatus]=useState(''),[error,setError]=useState(''),[online,setOnline]=useState(navigator.onLine);
 const [install,setInstall]=useState<any>(null),[updateReady,setUpdateReady]=useState(false);
 const initial=useRef(true),toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null),menuRef=useRef<HTMLDetailsElement>(null);
 const updateSW=useRef<((reload?:boolean)=>Promise<void>)|null>(null);
 const notify=(message:string)=>{setToast(message);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4500);};
 useEffect(()=>{
  let mounted=true;
  loadState().then(({state:loaded,restored,migrated})=>{if(!mounted)return;setState(loaded);setReady(true);if(migrated)notify('تم نقل مشاركاتك السابقة');else if(restored){setSaveStatus('تم الحفظ');notify('تمت استعادة مشاركاتك');}}).catch(()=>{if(mounted){setReady(true);setError('تعذر فتح الحفظ. احتفظ بنسخة من عملك قبل مغادرة الصفحة.');}});
  const connection=()=>setOnline(navigator.onLine);window.addEventListener('online',connection);window.addEventListener('offline',connection);
  const prompt=(e:Event)=>{e.preventDefault();setInstall(e);};window.addEventListener('beforeinstallprompt',prompt);
  updateSW.current=registerSW({immediate:true,onNeedRefresh(){setUpdateReady(true);},onRegisterError(){/* Work remains available even when service workers are restricted. */}});
  const outside=(e:PointerEvent)=>{if(menuRef.current&&!menuRef.current.contains(e.target as Node))menuRef.current.open=false;};document.addEventListener('pointerdown',outside);
  return()=>{mounted=false;window.removeEventListener('online',connection);window.removeEventListener('offline',connection);window.removeEventListener('beforeinstallprompt',prompt);document.removeEventListener('pointerdown',outside);if(toastTimer.current)clearTimeout(toastTimer.current);};
 },[]);
 useEffect(()=>{if(!ready)return;if(initial.current){initial.current=false;if(!state.legacyImported)return;}setSaveStatus('جار الحفظ');const timer=setTimeout(()=>saveState(state).then(()=>{setSaveStatus('تم الحفظ');setError('');}).catch(e=>{setSaveStatus('تعذر الحفظ');setError(e.message.includes('نافذة')?e.message:'تعذر حفظ آخر تعديل. احتفظ بنسخة من عملك.');}),250);return()=>clearTimeout(timer);},[state,ready]);
 useEffect(()=>{const unload=(e:BeforeUnloadEvent)=>{if(saveStatus==='جار الحفظ'||error||document.querySelector('dialog[data-dirty="true"]')){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',unload);return()=>window.removeEventListener('beforeunload',unload);},[saveStatus,error]);
 const working=demo||state;const available=working.events.filter(e=>!e.archived);const event=available.find(e=>e.id===working.activeId)||available[0];
 useEffect(()=>{setPhase(demo?'before':suggestedPhase(event,today()) as Phase);},[event?.id]);
 const update=(fn:(s:State)=>State)=>{if(demo)setDemo(s=>fn(s!));else setState(s=>fn(s));};
 const navigate=(p:Page)=>{setPage(p);if(menuRef.current)menuRef.current.open=false;window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>document.querySelector<HTMLElement>('main h1')?.focus({preventScroll:true}));};
 const open=(m:ModalState)=>{if(menuRef.current)menuRef.current.open=false;setModal(m);};
 const startDemo=()=>{setDemo(addDemo(emptyState()));setPage('home');setPhase('before');};
 const endDemo=()=>{setDemo(null);setPage('home');setModal(null);};
 const requiresEvent=!['home','events','knowledge'].includes(page);
 const menuPages:[Page,string][]=[['plan','المهام'],['contacts','اللقاءات والجهات'],['agenda','المواعيد'],['results','ملخص المشاركة']];
 return <AppContext.Provider value={{state:working,event,update,notify,open,navigate,phase,setPhase,startDemo}}><a href="#content" className="skip">انتقل للمحتوى</a><div className="simple-app">
 <header className="simple-header"><button className="simple-brand" onClick={()=>navigate('home')} aria-label="الرئيسية"><BrandSymbol/><span>منصة الاستفادة<small>من المعارض والمؤتمرات</small></span></button><div className="simple-header-actions">
 {event&&<><span className="simple-save" role="status">{demo?'وضع التجربة':error?'تعذر الحفظ':saveStatus}{!online&&' · دون اتصال'}</span><button className="text-button" onClick={()=>navigate('events')}><FolderOpen size={18}/>مشاركاتي</button></>}
 <details className="simple-menu" ref={menuRef}><summary><MoreHorizontal size={22}/><span>{event?'المزيد':'المساعدة'}</span></summary><div className="simple-menu-panel">
 {event&&<><button onClick={()=>{if(demo)setDemo(null);open({type:'event'});}}><Plus size={17}/>مشاركة جديدة</button>{menuPages.map(([key,label])=><button key={key} onClick={()=>navigate(key)}>{label}</button>)}</>}
 <button onClick={()=>navigate('knowledge')}><BookOpen size={17}/>دليل الاستخدام</button><button onClick={()=>open({type:'settings'})}><Settings size={17}/>إعدادات العرض</button>
 {!demo&&<button onClick={()=>open({type:'backup'})}><Download size={17}/>حفظ نسخة أو فتحها</button>}
 {install&&<button onClick={async()=>{await install.prompt();setInstall(null);if(menuRef.current)menuRef.current.open=false;}}>إضافة المنصة إلى جهازك</button>}
 <details className="storage-help"><summary>عن حفظ البيانات</summary><p>تحتفظ هذه النسخة بمشاركاتك داخل هذا المتصفح. يمكنك تنزيل نسخة للاحتفاظ بها أو نقلها إلى جهاز آخر</p></details>
 </div></details></div></header>
 <main id="content" className={'simple-main '+(!event&&page==='home'?'welcome-main':'')}>
 {error&&<div className="notice danger" role="alert">{error}<Button variant="secondary" onClick={()=>open({type:'backup'})}>تنزيل نسخة</Button></div>}
 {updateReady&&<div className="notice update-notice">يتوفر تحديث للمنصة<Button variant="secondary" disabled={!!modal||saveStatus==='جار الحفظ'||!!error} onClick={()=>updateSW.current?.(true)}>تحديث المنصة</Button>{modal&&<small>أكمل الإدخال واحفظه قبل التحديث</small>}</div>}
 {demo&&<div className="demo-banner"><span>مثال ببيانات افتراضية، تجربتك منفصلة عن مشاركاتك</span><Button variant="ghost" onClick={endDemo}>إنهاء التجربة</Button></div>}
 {event&&page!=='home'&&<button className="back-participation text-button" onClick={()=>navigate('home')}><ArrowLeft size={17}/>العودة إلى المشاركة</button>}
 {available.length>1&&page==='home'&&<div className="event-switch"><label>المشاركة الحالية<select value={event?.id} onChange={e=>update(s=>({...s,activeId:e.target.value}))}>{available.map(e=><option key={e.id} value={e.id}>{e.name}{e.demo?' · مثال':''}</option>)}</select></label></div>}
 {!ready?<div className="loading">جار فتح المنصة...</div>:requiresEvent&&!event?<Empty title="ابدأ مشاركتك" text="اختر دورك والهدف الذي تريد الوصول له" action={()=>open({type:'event'})}/>:page==='home'?(event?<JourneyHome/>:<Welcome/>):page==='events'?<Events/>:page==='plan'?<Plan/>:page==='contacts'?<Contacts/>:page==='agenda'?<Suspense fallback={<div className="loading">جار فتح المواعيد...</div>}><Agenda/></Suspense>:page==='results'?<Results/>:<Knowledge/>}
 </main>
 <footer className="app-footer"><div className="footer-identity"><div className="footer-owner"><svg viewBox="134 149 746 269" role="img" aria-label="حتى لحلول الأعمال"><image href={base+'brand/hatta.webp'} width="1000" height="526"/></svg></div><div className="footer-prepared"><span>أعدت بواسطة</span><img src={base+'brand/naif.webp'} alt="نايف المحمدي"/></div></div><div className="footer-social"><div><a href="https://x.com/almohammdin" aria-label="X" target="_blank" rel="noopener">𝕏</a><a href="https://www.linkedin.com/in/almohammdin/" aria-label="LinkedIn" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M5 9h3v11H5zM6.5 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM10 9h3v1.5C14 9 15 8.7 16.5 8.7 20 8.7 20 11 20 14v6h-3v-6c0-1.5 0-2.5-1.6-2.5S13 13 13 14v6h-3Z"/></svg></a><a href="https://www.snapchat.com/add/almohammdin" aria-label="Snapchat" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M12 3c-3 0-4.5 2.3-4.5 5.4v3.2c-.4.6-1 .5-1.8.3-.9-.3-1.5.7-.5 1.2l1.8.9c-.4 2-1.5 3.4-3.5 4 .2.9 1.5 1 2.8 1.2l.5 1.4c2-.6 2.4.8 5.2.8s3.2-1.4 5.2-.8l.5-1.4c1.3-.2 2.6-.3 2.8-1.2-2-.6-3.1-2-3.5-4l1.8-.9c1-.5.4-1.5-.5-1.2-.8.2-1.4.3-1.8-.3V8.4C16.5 5.3 15 3 12 3Z"/></svg></a><a href="https://www.tiktok.com/@almohammdin" aria-label="TikTok" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M15 3h3c.3 2 1.4 3.3 3 3.8v3A9 9 0 0 1 18 8v8a6 6 0 1 1-5-5.9v3a3 3 0 1 0 2 2.9Z"/></svg></a></div><a dir="ltr" href="https://linktr.ee/almohammdin">@almohammdin</a></div><span className="version">مستشار الحوكمة وتطوير الأعمال <bdi>v3.1</bdi></span></footer>
 </div>{toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}{modal&&<Forms modal={modal} close={()=>setModal(null)}/>}</AppContext.Provider>;
}
