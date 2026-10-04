class RelationsBankVoicePlayback extends AudioWorkletProcessor{
 constructor(){super();this.queue=[];this.offset=0;this.port.onmessage=e=>{if(e.data?.type==='clear'){this.queue=[];this.offset=0;return}const s=e.data?.samples??e.data;if(s instanceof Float32Array&&s.length)this.queue.push(s)}}
 process(inputs,outputs){const c=outputs[0]?.[0];if(!c)return true;let i=0;while(i<c.length&&this.queue.length){const cur=this.queue[0],n=Math.min(c.length-i,cur.length-this.offset);c.set(cur.subarray(this.offset,this.offset+n),i);i+=n;this.offset+=n;if(this.offset>=cur.length){this.queue.shift();this.offset=0}}if(i<c.length)c.fill(0,i);return true}
}
registerProcessor('relations-bank-voice-playback',RelationsBankVoicePlayback);