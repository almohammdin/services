/* Dashboard sources:
   Weather: Open-Meteo (https://open-meteo.com/en/docs)
   SAR exchange rates: https://github.com/fawazahmed0/exchange-api
   Country currency codes: Babel/CLDR territory currency reference (data snapshot).
*/
(function(){
"use strict";
var rawCountries="AC:SHP,AD:EUR,AE:AED,AF:AFN,AG:XCD,AI:XCD,AL:ALL,AM:AMD,AO:AOA,AR:ARS,AS:USD,AT:EUR,AU:AUD,AW:AWG,AX:EUR,AZ:AZN,BA:BAM,BB:BBD,BD:BDT,BE:EUR,BF:XOF,BG:BGN,BH:BHD,BI:BIF,BJ:XOF,BL:EUR,BM:BMD,BN:BND,BO:BOB,BQ:USD,BR:BRL,BS:BSD,BT:INR,BV:NOK,BW:BWP,BY:BYN,BZ:BZD,CA:CAD,CC:AUD,CD:CDF,CF:XAF,CG:XAF,CH:CHF,CI:XOF,CK:NZD,CL:CLP,CM:XAF,CN:CNY,CO:COP,CR:CRC,CU:CUP,CV:CVE,CW:XCG,CX:AUD,CY:EUR,CZ:CZK,DE:EUR,DG:USD,DJ:DJF,DK:DKK,DM:XCD,DO:DOP,DZ:DZD,EA:EUR,EC:USD,EE:EUR,EG:EGP,EH:MAD,ER:ERN,ES:EUR,ET:ETB,EU:EUR,FI:EUR,FJ:FJD,FK:FKP,FM:USD,FO:DKK,FR:EUR,GA:XAF,GB:GBP,GD:XCD,GE:GEL,GF:EUR,GG:GBP,GH:GHS,GI:GIP,GL:DKK,GM:GMD,GN:GNF,GP:EUR,GQ:XAF,GR:EUR,GS:GBP,GT:GTQ,GU:USD,GW:XOF,GY:GYD,HK:HKD,HM:AUD,HN:HNL,HR:EUR,HT:HTG,HU:HUF,IC:EUR,ID:IDR,IE:EUR,IL:ILS,IM:GBP,IN:INR,IO:USD,IQ:IQD,IR:IRR,IS:ISK,IT:EUR,JE:GBP,JM:JMD,JO:JOD,JP:JPY,KE:KES,KG:KGS,KH:KHR,KI:AUD,KM:KMF,KN:XCD,KP:KPW,KR:KRW,KW:KWD,KY:KYD,KZ:KZT,LA:LAK,LB:LBP,LC:XCD,LI:CHF,LK:LKR,LR:LRD,LS:ZAR,LT:EUR,LU:EUR,LV:EUR,LY:LYD,MA:MAD,MC:EUR,MD:MDL,ME:EUR,MF:EUR,MG:MGA,MH:USD,MK:MKD,ML:XOF,MM:MMK,MN:MNT,MO:MOP,MP:USD,MQ:EUR,MR:MRU,MS:XCD,MT:EUR,MU:MUR,MV:MVR,MW:MWK,MX:MXN,MY:MYR,MZ:MZN,NA:ZAR,NC:XPF,NE:XOF,NF:AUD,NG:NGN,NI:NIO,NL:EUR,NO:NOK,NP:NPR,NR:AUD,NU:NZD,NZ:NZD,OM:OMR,PA:PAB,PE:PEN,PF:XPF,PG:PGK,PH:PHP,PK:PKR,PL:PLN,PM:EUR,PN:NZD,PR:USD,PS:ILS,PT:EUR,PW:USD,PY:PYG,QA:QAR,RE:EUR,RO:RON,RS:RSD,RU:RUB,RW:RWF,SA:SAR,SB:SBD,SC:SCR,SD:SDG,SE:SEK,SG:SGD,SH:SHP,SI:EUR,SJ:NOK,SK:EUR,SL:SLE,SM:EUR,SN:XOF,SO:SOS,SR:SRD,SS:SSP,ST:STN,SV:USD,SX:XCG,SY:SYP,SZ:SZL,TA:GBP,TC:USD,TD:XAF,TF:EUR,TG:XOF,TH:THB,TJ:TJS,TK:NZD,TL:USD,TM:TMT,TN:TND,TO:TOP,TR:TRY,TT:TTD,TV:AUD,TW:TWD,TZ:TZS,UA:UAH,UG:UGX,UM:USD,US:USD,UY:UYU,UZ:UZS,VA:EUR,VC:XCD,VE:VES,VG:USD,VI:USD,VN:VND,VU:VUV,WF:XPF,WS:WST,XK:EUR,YE:YER,YT:EUR,ZA:ZAR,ZM:ZMW,ZW:USD";
var countryCurrencies={};rawCountries.split(",").forEach(function(x){var p=x.split(":");countryCurrencies[p[0]]=p[1]});
var currencyLabels={SAR:"الريال السعودي",TRY:"الليرة التركية",USD:"الدولار الأمريكي",EUR:"اليورو",GBP:"الجنيه الإسترليني",CNY:"اليوان الصيني",JPY:"الين الياباني",KRW:"الوون الكوري",AED:"الدرهم الإماراتي",EGP:"الجنيه المصري",MYR:"الرينغيت الماليزي",IDR:"الروبية الإندونيسية",THB:"البات التايلندي",INR:"الروبية الهندية",QAR:"الريال القطري",KWD:"الدينار الكويتي",BHD:"الدينار البحريني",OMR:"الريال العماني",JOD:"الدينار الأردني",CHF:"الفرنك السويسري",CAD:"الدولار الكندي",AUD:"الدولار الأسترالي",SGD:"الدولار السنغافوري",RUB:"الروبل الروسي",BRL:"الريال البرازيلي",PEN:"السول البيروفي",VND:"الدونغ الفيتنامي",HKD:"دولار هونغ كونغ",TWD:"دولار تايوان",MXN:"البيزو المكسيكي",MAD:"الدرهم المغربي",TND:"الدينار التونسي",PKR:"الروبية الباكستانية",ZAR:"الراند الجنوب أفريقي",SEK:"الكرونة السويدية",NOK:"الكرونة النرويجية",DKK:"الكرونة الدنماركية",PLN:"الزلوتي البولندي",CZK:"الكورونا التشيكية"};
var aliases={turkey:"TR",turkiye:"TR",türkiye:"TR",turkiya:"TR",turki:"TR",turkye:"TR",turkiye:"TR",الصين:"CN",تركيا:"TR",اليابان:"JP",السعوديه:"SA",السعودية:"SA",الامارات:"AE",الاماراتالعربيهالمتحده:"AE",بريطانيا:"GB",انجلترا:"GB",امريكا:"US",كوريا:"KR",كوريالجنوبيه:"KR",ماليزيــا:"MY",southkorea:"KR",korea:"KR",unitedstates:"US",usa:"US",unitedkingdom:"GB",uk:"GB",uae:"AE"};
var state={tripKey:"",weather:null,weatherUpdated:0,weatherMode:"today",fx:null,fxUpdated:0,currency:"",rate:null,sourceDate:"",weatherReq:0,fxReq:0,unavailableCurrency:false};
function $(id){return document.getElementById(id)}
function safe(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function fmt(n,dp){return Number(n).toLocaleString("en-US",{maximumFractionDigits:dp===undefined?2:dp,minimumFractionDigits:0})}
function norm(s){return String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f\u064b-\u065f]/g,"").replace(/[^a-z0-9\u0600-\u06ff]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه")}
var countryDisplay=[];
try{["ar","en","tr","fr","es"].forEach(function(locale){var d=new Intl.DisplayNames([locale],{type:"region"});Object.keys(countryCurrencies).forEach(function(cc){var n=d.of(cc);if(n!==cc)countryDisplay.push([norm(n),cc])})})}catch(e){}
function codeForCountry(country,stored){
var cc=String(stored||"").toUpperCase();if(countryCurrencies[cc])return cc;
var input=norm(country);if(aliases[input])return aliases[input];
var entry=countryDisplay.find(function(p){return p[0]===input});return entry?entry[1]:"";
}
function currencyForTrip(t){var cc=codeForCountry(t.country,t.countryCode);return String(t.currencyCode||countryCurrencies[cc]||"").toUpperCase()}
function weatherIcon(c){if(c===0)return"☀️";if(c===1||c===2)return"🌤️";if(c===3)return"☁️";if(c===45||c===48)return"🌫️";if(c>=51&&c<=57)return"🌦️";if(c>=61&&c<=67)return"🌧️";if(c>=71&&c<=77)return"🌨️";if(c>=80&&c<=82)return"🌧️";if(c>=85&&c<=86)return"🌨️";if(c>=95)return"⛈️";return"🌤️"}
function weatherLabel(c){if(c===0)return"صحو";if(c===1||c===2)return"غائم جزئيًا";if(c===3)return"غائم";if(c===45||c===48)return"ضباب";if(c>=51&&c<=67)return"أمطار محتملة";if(c>=71&&c<=77)return"ثلوج";if(c>=80&&c<=82)return"زخات مطر";if(c>=85&&c<=86)return"زخات ثلج";if(c>=95)return"عواصف رعدية";return"طقس متغير"}
function dayName(iso){try{return new Intl.DateTimeFormat("ar-SA-u-nu-latn",{weekday:"short",month:"short",day:"numeric"}).format(new Date(iso+"T12:00:00"))}catch(e){return iso}}
function weatherView(){
var w=state.weather,body=$("weatherBody");if(!w){body.innerHTML='<div class="info-error">بيانات الطقس غير متاحة حاليًا.</div>';return}
var curr=w.current||{},daily=w.daily||{},hours=w.hourly||{},code=Number(curr.weather_code||0);
var temp=Number.isFinite(Number(curr.temperature_2m))?fmt(curr.temperature_2m,1)+"°":"—";
var currentHTML='<div class="weather-current"><span class="weather-symbol">'+weatherIcon(code)+'</span><div><div class="weather-main-temp">'+temp+'</div><small>'+weatherLabel(code)+" · "+safe(state.city)+'</small></div></div>'
+'<div class="weather-facts"><span>المحسوسة '+fmt(curr.apparent_temperature,1)+'°</span><span>الرطوبة '+fmt(curr.relative_humidity_2m,0)+'%</span><span>الرياح '+fmt(curr.wind_speed_10m,0)+' كم/س</span></div>';
var opt='<div class="weather-periods"><button data-weather="today" class="'+(state.weatherMode==="today"?"selected":"")+'">اليوم</button><button data-weather="3" class="'+(state.weatherMode==="3"?"selected":"")+'">3 أيام</button><button data-weather="7" class="'+(state.weatherMode==="7"?"selected":"")+'">7 أيام</button></div>';
var cards="";
if(state.weatherMode==="today"){
var hourNow=String(curr.time||"").slice(0,13)+":00",times=hours.time||[],i=times.findIndex(function(t){return t>hourNow});if(i<0)i=Math.max(0,times.length-8);
cards='<div class="weather-hours">'+times.slice(i,i+8).map(function(t,j){var k=i+j;return '<div class="weather-hour"><small>'+safe(t.slice(11,16))+'</small><div>'+weatherIcon(Number((hours.weather_code||[])[k]))+'</div><b>'+fmt((hours.temperature_2m||[])[k],0)+'°</b><small>مطر '+fmt((hours.precipitation_probability||[])[k],0)+'%</small></div>'}).join("")+"</div>";
}else{
var count=state.weatherMode==="3"?3:7;
cards='<div class="weather-list">'+(daily.time||[]).slice(0,count).map(function(t,k){return '<div class="weather-day"><small>'+safe(dayName(t))+'</small><div class="icon">'+weatherIcon(Number((daily.weather_code||[])[k]))+'</div><b>'+fmt((daily.temperature_2m_max||[])[k],0)+'° / '+fmt((daily.temperature_2m_min||[])[k],0)+'°</b><small>احتمال مطر '+fmt((daily.precipitation_probability_max||[])[k],0)+'%</small></div>'}).join("")+"</div>";
}
body.innerHTML=currentHTML+opt+cards;
body.querySelectorAll("[data-weather]").forEach(function(button){button.onclick=function(){state.weatherMode=this.dataset.weather;weatherView()}});
$("weatherStatus").textContent="تحديث "+safe(String(curr.time||"").slice(0,16).replace("T"," "))+" · توقيت الوجهة";
}
function setCurrencyOptions(t){
var sel=$("currencyCode"),v=currencyForTrip(t),codes=Object.keys(currencyLabels);
if(v&&!codes.includes(v))codes.push(v);
codes.sort();
sel.innerHTML='<option value="">اختر العملة</option>'+codes.map(function(cc){return '<option value="'+cc+'">'+safe(cc)+" · "+safe(currencyLabels[cc]||cc)+'</option>'}).join("");
sel.value=v;state.currency=v;
}
function fxView(){
var c=state.currency,toSar=(state.fx&&state.fx.sar&&Number(state.fx.sar[c.toLowerCase()]))||null,amount=Number($("fxAmount").value),dir=$("fxDirection").value;state.rate=toSar;
$("fxTitle").textContent=currencyLabels[c]||c||"عملة الوجهة";
if(!c){$("fxRate").textContent="اختر عملة الوجهة";$("fxReverse").textContent="";$("fxOutput").textContent="";return}
if(c==="SAR")toSar=1;
if(!toSar||!Number.isFinite(toSar)||toSar<=0){$("fxRate").textContent="السعر غير متاح";$("fxReverse").textContent="";$("fxOutput").textContent="";return}
var reverse=1/toSar;
$("fxRate").textContent="1 "+c+" = ⃁ "+fmt(reverse,reverse>=1?4:6);
$("fxReverse").textContent="⃁ 1 = "+fmt(toSar,toSar>=1?4:6)+" "+c;
$("fxFromLabel").textContent=dir==="toSar"?c:"SAR";
$("fxToLabel").textContent=dir==="toSar"?"SAR":c;
var result=dir==="toSar"?amount/toSar:amount*toSar;
$("fxOutput").textContent=Number.isFinite(result)?(dir==="toSar"?"⃁ "+fmt(result,2):fmt(result,2)+" "+c):"";
var note=state.sourceDate?"آخر تحديث للمصدر: "+state.sourceDate:"";
$("fxStatus").textContent=c==="SAR"?"الريال السعودي":note;
}
function cacheGet(k,maxAge){try{var x=JSON.parse(localStorage.getItem(k));if(x&&x.at&&Date.now()-x.at<maxAge)return x.data}catch(e){}return null}
function cachePut(k,x){try{localStorage.setItem(k,JSON.stringify({at:Date.now(),data:x}))}catch(e){}}
async function weatherLoad(trip,force){
var lat=Number(trip.lat),lng=Number(trip.lng),req=++state.weatherReq;
if(!Number.isFinite(lat)||!Number.isFinite(lng)||(lat===20&&lng===0&&Number(trip.zoom)===2)){
state.weather=null;$("weatherBody").innerHTML='<div class="info-error">تحتاج المدينة إلى موقع جغرافي محدد لعرض الطقس. أنشئ رحلة باسم المدينة والدولة أو اختر مدينة معروفة.</div>';$("weatherStatus").textContent="بانتظار تحديد المدينة";return}
var key="trip-weather-"+lat.toFixed(3)+"-"+lng.toFixed(3),cache=force?null:cacheGet(key,15*60*1000);
if(cache){state.weather=cache;weatherView();return}
$("weatherBody").innerHTML='<p class="info-subtle">جاري جلب طقس المدينة...</p>';$("weatherStatus").textContent="يتم التحديث";
var url="https://api.open-meteo.com/v1/forecast?latitude="+encodeURIComponent(lat)+"&longitude="+encodeURIComponent(lng)+"&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto";
try{var res=await fetch(url,{cache:"no-store"});if(!res.ok)throw Error("weather "+res.status);var d=await res.json();if(req!==state.weatherReq)return;if(!d||!d.current||!d.daily)throw Error("weather empty");cachePut(key,d);state.weather=d;weatherView()}
catch(e){if(req!==state.weatherReq)return;var old=cacheGet(key,24*60*60*1000);if(old){state.weather=old;weatherView();$("weatherStatus").textContent="توقعات محفوظة، قد تكون قديمة"}else{$("weatherBody").innerHTML='<div class="info-error">تعذر جلب الطقس. جرّب تحديث البيانات بعد التحقق من اتصال الإنترنت.</div>';$("weatherStatus").textContent="غير متصل"}}
}
async function currencyLoad(force){
var req=++state.fxReq;
if(state.currency==="SAR"){state.fx={sar:{sar:1}};state.sourceDate="";fxView();return}
var cache=force?null:cacheGet("trip-fx-sar-v1",2*60*60*1000);
if(cache){state.fx=cache;state.sourceDate=cache.date||"";fxView();return}
$("fxRate").textContent="جاري تحديث السعر...";$("fxStatus").textContent="";
var sources=["https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/sar.json","https://latest.currency-api.pages.dev/v1/currencies/sar.json"];
try{
var data=null;for(var i=0;i<sources.length;i++){try{var response=await fetch(sources[i],{cache:"no-store"});if(response.ok){data=await response.json();if(data&&data.sar)break;data=null}}catch(e){}}
if(!data)throw Error("no currency response");if(req!==state.fxReq)return;
cachePut("trip-fx-sar-v1",data);state.fx=data;state.sourceDate=data.date||"";fxView();
}catch(e){if(req!==state.fxReq)return;var stale=cacheGet("trip-fx-sar-v1",7*24*60*60*1000);if(stale){state.fx=stale;state.sourceDate=stale.date||"";fxView();$("fxStatus").textContent+=" · بيانات مخزنة، قد تكون قديمة"}else{$("fxRate").textContent="تعذر جلب سعر الصرف";$("fxReverse").textContent="";$("fxOutput").textContent="";$("fxStatus").textContent="تحقق من الاتصال أو اختر عملة أخرى"}}
}
function showTrip(trip){
if(!trip)return;
var key=trip.id+"|"+String(trip.lat)+"|"+String(trip.lng)+"|"+trip.currencyCode;
if(key===state.tripKey)return;state.tripKey=key;state.city=trip.city||trip.name||"المدينة";state.weather=null;state.weatherMode="today";state.fx=null;state.sourceDate="";
$("weatherCity").textContent=state.city;$("fxCity").textContent=[trip.city,trip.country].filter(Boolean).join("، ");
setCurrencyOptions(trip);weatherLoad(trip,false);currencyLoad(false);
}
document.addEventListener("DOMContentLoaded",function(){
$("weatherRefresh").onclick=function(){if(window.TravelDashboard.trip)weatherLoad(window.TravelDashboard.trip,true)};
$("fxRefresh").onclick=function(){currencyLoad(true)};
$("currencyCode").onchange=function(){
state.currency=this.value;
var trip=window.TravelDashboard.trip;if(trip){trip.currencyCode=state.currency;if(typeof window.TravelDashboard.saveTrip==="function")window.TravelDashboard.saveTrip()}
fxView();if(state.currency!=="SAR"&&!state.fx)currencyLoad(false);
};
$("fxDirection").onchange=fxView;$("fxAmount").oninput=fxView;
});
window.TravelDashboard={showTrip:function(t){this.trip=t;showTrip(t)},saveTrip:null};
})();