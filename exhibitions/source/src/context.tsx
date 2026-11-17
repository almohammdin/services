import {createContext,useContext} from 'react';
import type {State,Participation,Page,Phase} from './model';
export interface ModalState {type:'event'|'contact'|'task'|'appointment'|'assessment'|'backup'|'settings'|'tips'|'note';data?:any;}
export interface AppContextValue {state:State;event?:Participation;update:(fn:(s:State)=>State)=>void;notify:(s:string)=>void;open:(m:ModalState)=>void;navigate:(p:Page)=>void;phase:Phase;setPhase:(p:Phase)=>void;startDemo:()=>void;}
export const AppContext=createContext<AppContextValue>(null!);
export const useApp=()=>useContext(AppContext);
