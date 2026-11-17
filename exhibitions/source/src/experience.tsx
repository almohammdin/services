import {useState} from 'react';
import {ArrowLeft,Plus,CalendarDays,Users,Check,FileText,Share2,Copy,Download,ClipboardList,Lightbulb} from 'lucide-react';
import {useApp} from './context';
import {BrandIcon,Button,Field,Dialog} from './ui';
import {goals,roleGoals,makeEvent,uid,today,dateText,type Role,type Goal,type Participation,type Appointment} from './model';
import {initialTasks,answerCount,sourceSummary} from './journey.mjs';
import {questionSets,score,decision} from './logic.mjs';

export function Welcome(){
 const {open,startDemo}=useApp();
 return <section className="welcome" aria-labelledby="welcome-title">
  <span className="welcome-label">منصة الاستفادة من المعارض والمؤتمرات</span>
  <h1 id="welcome-title" tabIndex={-1}>خطط لمشاركتك<br/><em>وتابع نتائجها</em></h1>
  <p>جهز زيارتك أو جناحك، وسجل لقاءاتك، وتابع ما تحقق</p>
  <h2>كيف ستشارك؟</h2>
  <div className="role-choices">
   <button className="role-choice" onClick={()=>open({type:'event',data:{role:'visitor'}})}><BrandIcon kind="badge"/><strong>زائر</strong><span>أزور المعرض أو أحضر المؤتمر</span><ArrowLeft aria-hidden="true" size={20}/></button>
   <button className="role-choice" onClick={()=>open({type:'event',data:{role:'exhibitor'}})}><BrandIcon kind="flags"/><strong>عارض</strong><span>أشارك بجناح وأستقبل الزوار</span><ArrowLeft aria-hidden="true" size={20}/></button>
  </div>
  <button className="text-button welcome-example" onClick={startDemo}>شاهد مثال <ArrowLeft size={16}/></button>
 </section>;
}

export function QuickStart({role:initialRole='visitor',close}:{role?:Role;close:()=>void}){
 const {update,notify,navigate,setPhase}=useApp();
 const [role,setRole]=useState<Role>(initialRole),[name,setName]=useState(''),[goal,setGoal]=useState<Goal|''>(''),[error,setError]=useState('');
 return <form className="quick-start" onSubmit={e=>{e.preventDefault();if(!name.trim())return setError('اكتب اسم المعرض أو المؤتمر');if(!goal)return setError('اختر هدفك الرئيسي');const event=makeEvent({role,name:name.trim(),goal});const tasks=initialTasks(event.id,goal,uid);update(s=>({...s,events:[event,...s.events],tasks:[...s.tasks,...tasks],activeId:event.id}));setPhase('before');close();navigate('home');notify('جهزنا لك خطة مقترحة، عدلها حسب مشاركتك');}}>
  <p className="form-intro">اكتب اسم الفعالية واختر هدفك، ثم ابدأ بخطة مقترحة</p>
  <div className="role-toggle" role="group" aria-label="نوع المشاركة">{(['visitor','exhibitor'] as Role[]).map(r=><button type="button" key={r} aria-pressed={role===r} onClick={()=>{setRole(r);setGoal('');}}>{r==='visitor'?'زائر':'عارض'}</button>)}</div>
  <Field label="اسم الفعالية"><input required autoFocus maxLength={200} value={name} onChange={e=>{setName(e.target.value);setError('');}} placeholder="اسم المعرض أو المؤتمر"/></Field>
  <fieldset className="goal-choices"><legend>{role==='visitor'?'ما هدفك من الزيارة؟':'ما هدفك من المشاركة؟'}</legend>{roleGoals[role].map(g=><label key={g} className={goal===g?'selected':''}><input type="radio" name="goal" value={g} checked={goal===g} onChange={()=>{setGoal(g);setError('');}}/><span>{goals[g].label}</span><small>{goals[g].hint.replace('مثال: ','')}</small></label>)}</fieldset>
  <p className="field-note">يمكنك إضافة الموعد والميزانية وبقية التفاصيل من داخل المشاركة</p>
  {error&&<p role="alert" className="form-error">{error}</p>}
  <div className="form-actions"><Button type="submit">عرض خطتي <ArrowLeft size={18}/></Button><Button type="button" variant="ghost" onClick={close}>رجوع</Button></div>
 </form>;
}

export function JourneyHome(){
 const {state,event,open,update,navigate,phase,setPhase}=useApp();
 if(!event)return <Welcome/>;
 const tasks=state.tasks.filter(t=>t.eventId===event.id&&t.phase===phase);
 const contacts=state.contacts.filter(c=>c.eventId===event.id);
 const pending=contacts.filter(c=>!['won','later'].includes(c.status)).sort((a,b)=>(a.followup||'9999').localeCompare(b.followup||'9999'));
 const appointments=state.appointments.filter(a=>a.eventId===event.id&&a.end>=today()+'T00:00').sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3);
 const titles={before:'خطة مشاركتك',during:'سجل ما يهمك في المشاركة',after:'تابع ما تحقق من مشاركتك'};
 return <>
  <header className="journey-heading"><div><span className="eyebrow">{event.role==='visitor'?'زيارة':'مشاركة بجناح'} · {goals[event.goal].label}</span><h1 tabIndex={-1}>{event.name}</h1>{event.objective&&<p>{event.objective}</p>}</div><button className="text-button" onClick={()=>open({type:'event',data:event})}>تفاصيل المشاركة</button></header>
  <nav className="phase-tabs" aria-label="مراحل المشاركة">{(['before','during','after'] as const).map((p,i)=><button key={p} aria-current={phase===p?'step':undefined} className={phase===p?'active':''} onClick={()=>setPhase(p)}><span>{i+1}</span>{['قبل المشاركة','أثناء المشاركة','بعد المشاركة'][i]}</button>)}</nav>
  <section className="journey-stage" aria-label={titles[phase]}>
   <div className="stage-heading"><h2>{titles[phase]}</h2>{phase==='before'&&<button className="text-button" onClick={()=>navigate('plan')}>كل المهام <ArrowLeft size={16}/></button>}</div>
   {phase==='before'?<>
    <p className="stage-intro">ابدأ بهذه الخطوات وعدلها حسب احتياجك</p>
    <div className="starter-tasks">{tasks.slice(0,3).map(t=><div className={'starter-task '+(t.done?'done':'')} key={t.id}><label><input type="checkbox" checked={t.done} onChange={()=>update(s=>({...s,tasks:s.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)}))}/><span>{t.title}</span></label><button className="text-button" aria-label={'تعديل '+t.title} onClick={()=>open({type:'task',data:t})}>تعديل</button></div>)}{tasks.length===0&&<div className="quiet-empty"><p>جهز أول خطوة لمشاركتك</p><Button variant="secondary" onClick={()=>navigate('plan')}>جهز الخطة</Button></div>}</div>
    <div className="stage-actions"><Button onClick={()=>open({type:'contact'})}><Plus size={18}/>{event.goal==='suppliers'?(contacts.length?'أضف مورد':'أضف أول مورد'):'أضف جهة تريد مقابلتها'}</Button><Button variant="secondary" onClick={()=>open({type:'appointment'})}><CalendarDays size={18}/>رتب موعد</Button></div>
    <details className="assessment-entry"><summary>هل المشاركة مناسبة لك؟</summary><p>أجب عن 5 أسئلة لمراجعة مدى مناسبة المشاركة لهدفك</p><Button variant="secondary" onClick={()=>open({type:'assessment'})}>{answerCount(event.answers)?'راجع تقييمك':'ابدأ التقييم'}</Button>{answerCount(event.answers)>0&&<button className="text-button" onClick={()=>navigate('results')}>عرض النتيجة</button>}</details>
   </>:phase==='during'?<>
    <p className="stage-intro">احتفظ بتفاصيل لقاءاتك والأفكار التي تستحق المتابعة</p>
    <div className="stage-actions"><Button onClick={()=>open({type:'contact'})}><Plus size={18}/>سجل لقاء</Button><Button variant="secondary" onClick={()=>open({type:'note'})}><Lightbulb size={18}/>سجل فكرة</Button></div>
    {appointments.length>0&&<div className="stage-list"><h3>مواعيدك القادمة</h3>{appointments.map(a=><button key={a.id} onClick={()=>open({type:'appointment',data:a})}><CalendarDays size={19}/><span><strong>{a.title}</strong><small>{dateText(a.start,state.dateMode)} · <bdi>{a.start.slice(11)}</bdi></small></span><ArrowLeft size={16}/></button>)}</div>}
    <div className="stage-list"><h3>آخر اللقاءات</h3>{contacts.length?contacts.slice(0,3).map(c=><button key={c.id} onClick={()=>open({type:'contact',data:c})}><Users size={19}/><span><strong>{c.company||c.name}</strong><small>{c.note||c.nextStep||'أكمل تفاصيل اللقاء وقت ما يناسبك'}</small></span><ArrowLeft size={16}/></button>):<p className="quiet-empty">لقاءاتك ستظهر هنا بعد تسجيل أول لقاء</p>}</div>
    {event.notes&&<details className="source-details"><summary>أفكار وملاحظات المشاركة</summary><p style={{whiteSpace:'pre-wrap'}}>{event.notes}</p></details>}<div className="stage-links"><button className="text-button" onClick={()=>navigate('contacts')}>كل اللقاءات <ArrowLeft size={16}/></button><button className="text-button" onClick={()=>navigate('agenda')}>كل المواعيد <ArrowLeft size={16}/></button></div>
   </>:<>
    <p className="stage-intro">راجع الجهات التي تحتاج تواصل، ثم حدث النتائج التي حققتها</p>
    <div className="stage-actions"><Button onClick={()=>navigate('contacts')}><Users size={18}/>متابعة الجهات</Button><Button variant="secondary" onClick={()=>navigate('results')}><FileText size={18}/>ملخص المشاركة</Button></div>
    <div className="stage-list"><h3>جهات تحتاج متابعة</h3>{pending.length?pending.slice(0,4).map(c=><button key={c.id} onClick={()=>open({type:'contact',data:c})}><Users size={19}/><span><strong>{c.company||c.name}</strong><small>{c.nextStep||'حدد الخطوة القادمة'}{c.followup?' · '+dateText(c.followup,state.dateMode):''}</small></span><ArrowLeft size={16}/></button>):<div className="quiet-empty"><p>{contacts.length?'يمكنك مراجعة نتائج لقاءاتك من ملخص المشاركة':'أضف الجهات التي قابلتها لتبدأ المتابعة'}</p>{!contacts.length&&<Button variant="secondary" onClick={()=>open({type:'contact'})}>أضف لقاء</Button>}</div>}</div>
    {tasks.length>0&&<button className="text-button" onClick={()=>navigate('plan')}>مهام ما بعد المشاركة <ArrowLeft size={16}/></button>}
   </>}
  </section>
 </>;
}

export function QuickNote({close}:{close:()=>void}){
 const {event,update,notify}=useApp();const [text,setText]=useState('');
 return <form onSubmit={e=>{e.preventDefault();if(!text.trim())return;update(s=>({...s,events:s.events.map(e=>e.id===event!.id?{...e,notes:[e.notes,'فكرة: '+text.trim()].filter(Boolean).join('\n\n'),updatedAt:new Date().toISOString()}:e)}));notify('تم حفظ الفكرة ضمن مخرجات المشاركة');close();}}><Field label="الفكرة التي تريد الاحتفاظ بها"><textarea autoFocus required rows={5} maxLength={3000} value={text} onChange={e=>setText(e.target.value)} placeholder="معلومة من جلسة أو فكرة تريد تطبيقها"/></Field><div className="form-actions"><Button type="submit">حفظ الفكرة</Button><Button type="button" variant="ghost" onClick={close}>رجوع</Button></div></form>;
}

export function AssessmentResult({event}:{event:Participation}){
 const {open,notify}=useApp();const [sharing,setSharing]=useState(false);
 const qs=questionSets[event.goal],result=score(event.answers,qs),count=answerCount(event.answers);
 const missing=qs.filter((_:any,i:number)=>event.answers[i]?.value===null);
 const weak=qs.map((q:any,i:number)=>({q,v:event.answers[i]?.value})).filter((x:any)=>typeof x.v==='number').sort((a:any,b:any)=>a.v-b.v)[0];
 const next=count<5?'استكمل المعلومات عن '+(missing[0]?.[0]||'الجوانب المتبقية'):weak&&Number(weak.v)<3?weak.q[3]:'رتب لقاءاتك مع الجهات التي تخدم هدفك';
 const summary=['تقييم المشاركة',event.name,'الهدف: '+goals[event.goal].label,decision(result),`الملاءمة: ${result.fit??'لم يبدأ'} / 100`,`أجبت عن ${count} من 5 أسئلة`,sourceSummary(event.answers),'الخطوة المقترحة: '+next,'تقييم استرشادي مبني على إجابات المستخدم'].join('\n');
 async function copy(){try{await navigator.clipboard.writeText(summary);notify('تم نسخ ملخص التقييم');}catch{notify('يمكنك تحديد النص في المعاينة ونسخه');}}
 const download=()=>{const url=URL.createObjectURL(new Blob([summary],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ملخص-تقييم-المشاركة.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <section className="panel evaluation-panel simple-assessment"><div className="panel-heading"><h2>هل المشاركة مناسبة لك؟</h2><button className="text-button" onClick={()=>open({type:'assessment'})}>{count?'تعديل الإجابات':'ابدأ التقييم'}</button></div>{count?<><span className="pill">{count<5?'تقييم أولي':'حسب إجاباتك'}</span><div className="evaluation-score"><strong dir="ltr">{result.fit}<small> / 100</small></strong><p>{decision(result)}</p></div><p className="assessment-next"><strong>الخطوة المقترحة</strong>{next}</p><p className="field-note">أجبت عن {count} من 5 أسئلة</p><details className="source-details"><summary>على ماذا بني التقييم؟</summary><p>{sourceSummary(event.answers)}</p><p>تصنيف المصادر حسب إدخالك. راجع تفاصيل الفعالية قبل اتخاذ القرار</p></details><Button variant="secondary" onClick={()=>setSharing(true)}><Share2 size={17}/>مشاركة النتيجة</Button></>:<p className="field-note">أجب عن 5 أسئلة لتظهر النتيجة والخطوة المقترحة</p>}{sharing&&<Dialog title="معاينة ملخص التقييم" onClose={()=>setSharing(false)}><p className="field-note">المشاركة تشمل النص الظاهر هنا فقط</p><textarea readOnly rows={12} aria-label="ملخص التقييم للمشاركة" value={summary}/><div className="share-actions">{typeof navigator.share==='function'&&<Button onClick={async()=>{try{await navigator.share({title:'تقييم المشاركة',text:summary});}catch(e){if((e as DOMException).name!=='AbortError')notify('تعذرت المشاركة، يمكنك نسخ الملخص');}}}><Share2 size={17}/>مشاركة</Button>}<Button variant="secondary" onClick={copy}><Copy size={17}/>نسخ الملخص</Button><Button variant="ghost" onClick={download}><Download size={17}/>تنزيل الملخص</Button></div></Dialog>}</section>;
}
