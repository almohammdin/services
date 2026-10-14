(()=>{
 'use strict';
 class FushaQueue{
  constructor(options){this.options=options;this.translation=Promise.resolve();this.speech=Promise.resolve();this.prior='';this.accepting=true;this.voiceEpoch=0;}
  enqueue(segment){
   if(!this.accepting)return Promise.resolve();
   const epoch=this.voiceEpoch,voiced=this.options.wantsVoice();
   const work=this.translation.then(async()=>{
    const result=await this.options.request('/api/translate',{source:segment.source,prior:this.prior});
    this.prior=(segment.source+'\n'+result.text).slice(-1000);
    this.options.onTarget(segment,result.text);
    if(voiced&&this.options.wantsVoice()&&epoch===this.voiceEpoch){
     this.speech=this.speech.then(async()=>{
      if(!this.accepting||epoch!==this.voiceEpoch||!this.options.wantsVoice())return;
      const audio=await this.options.request('/api/speech',{text:result.text});
      if(this.accepting&&epoch===this.voiceEpoch&&this.options.wantsVoice())await this.options.play(audio);
     }).catch(error=>this.options.onVoiceError(error));
    }
   });
   this.translation=work.catch(error=>this.options.onError(segment,error));
   return this.translation;
  }
  cancelVoice(){this.voiceEpoch++;}
  async drain(){await this.translation;await this.speech;}
  close(){this.accepting=false;this.cancelVoice();}
 }
 window.TarjumanFushaQueue=FushaQueue;
 class FushaFinalizer{
  constructor(onFinal){this.onFinal=onFinal;this.waiting=false;this.candidate=null;this.timer=null;this.turn=0;this.lastTurn=-1;this.lastText='';}
  beginSpeech(){this.turn++;if(!this.waiting)this.candidate=null;}
  beginFinal(){if(this.waiting)return false;this.waiting=true;this.finalTurn=this.turn;if(this.candidate)this.arm(1500);return true;}
  arm(delay=1200){clearTimeout(this.timer);this.timer=setTimeout(()=>this.commit(),delay);}
  accept(text,language){if(!text||(this.turn===this.lastTurn&&text===this.lastText))return;this.candidate={text,language};if(this.waiting)this.arm();}
  commit(){if(!this.waiting||!this.candidate)return;const value=this.candidate;this.waiting=false;this.candidate=null;clearTimeout(this.timer);this.lastTurn=this.finalTurn;this.lastText=value.text;this.onFinal(value.text,value.language);}
  close(){clearTimeout(this.timer);this.waiting=false;this.candidate=null;}
 }
 window.TarjumanFushaFinalizer=FushaFinalizer;
})();
