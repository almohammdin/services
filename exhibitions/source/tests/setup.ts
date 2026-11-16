import 'fake-indexeddb/auto';
import {vi} from 'vitest';
Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(){this.open=true;}});
Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(){this.open=false;}});
window.scrollTo=vi.fn();
window.matchMedia=vi.fn().mockImplementation(()=>({matches:false,addListener:vi.fn(),removeListener:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn()}));
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
Object.defineProperty(document,'fonts',{value:{ready:Promise.resolve()}});
