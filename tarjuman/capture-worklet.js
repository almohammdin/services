class TarjumanCapture extends AudioWorkletProcessor {
 constructor(){super();this.phase=0;this.sum=0;this.count=0;this.samples=new Int16Array(1600);this.cursor=0;this.energy=0;}
 process(inputs){const input=inputs[0]?.[0];if(!input)return true;for(let i=0;i<input.length;i++){this.sum+=input[i];this.count++;this.phase+=16000/sampleRate;if(this.phase>=1){const x=Math.max(-1,Math.min(1,this.sum/this.count));this.samples[this.cursor++]=Math.round(x*(x<0?32768:32767));this.energy+=x*x;this.phase-=1;this.sum=0;this.count=0;if(this.cursor===1600){const pcm=this.samples.buffer;this.port.postMessage({pcm,rms:Math.sqrt(this.energy/1600)},[pcm]);this.samples=new Int16Array(1600);this.cursor=0;this.energy=0;}}}return true;}
}
registerProcessor('tarjuman-capture',TarjumanCapture);
