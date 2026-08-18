class GanacsiVoicePlayback extends AudioWorkletProcessor{
  constructor(){super();this.queue=[];this.offset=0;this.port.onmessage=event=>{if(event.data?.type==='clear'){this.queue=[];this.offset=0;return}const samples=event.data?.samples??event.data;if(samples instanceof Float32Array&&samples.length)this.queue.push(samples)}}
  process(inputs,outputs){const channel=outputs[0]?.[0];if(!channel)return true;let i=0;while(i<channel.length&&this.queue.length){const current=this.queue[0],count=Math.min(channel.length-i,current.length-this.offset);channel.set(current.subarray(this.offset,this.offset+count),i);i+=count;this.offset+=count;if(this.offset>=current.length){this.queue.shift();this.offset=0}}if(i<channel.length)channel.fill(0,i);return true}
}
registerProcessor('ganacsi-voice-playback',GanacsiVoicePlayback);
