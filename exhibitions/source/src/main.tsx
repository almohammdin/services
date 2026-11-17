import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
import './experience.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<main className="fatal"><h1>تحتاج الصفحة إعادة تحميل</h1><p>البيانات المحفوظة تبقى على جهازك. أعد تحميل الصفحة لاستعادة مساحة العمل.</p><button onClick={()=>location.reload()}>إعادة التحميل</button></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
