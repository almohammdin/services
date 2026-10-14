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
})();
