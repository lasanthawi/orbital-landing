const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const state={sound:false,progress:0,lastScene:-1};
const sceneData=[
 ['EARTH','0 KM','THIS IS HOME.','FOR NOW.'],
 ['ORBIT','400 KM','8 BILLION BELOW.','ONE HUMAN ABOVE.'],
 ['LUNAR TRANSIT','384,400 KM','DISTANCE CHANGES EVERYTHING.',''],
 ['MOON','1.28 LIGHT-SECONDS','THE FIRST WORLD AFTER OURS.',''],
 ['MARS','225M KM','ANOTHER HORIZON.',''],
 ['JUPITER','5.2 AU','SCALE LOSES ITS MEANING.',''],
 ['SATURN','9.5 AU','BEAUTY HAS NO AUDIENCE HERE.',''],
 ['DEEP SPACE','BEYOND HOME','THE FURTHER WE GO','THE SMALLER WE BECOME.'],
 ['ANOMALY','26,000 LIGHT-YEARS','ANOMALY DETECTED',''],
 ['EVENT HORIZON','NO REFERENCE','BEYOND HERE','THE MAP ENDS.']
];

function mountUI(){
 const ui=document.createElement('div');ui.className='experience-v4';ui.innerHTML=`
 <div class="mission-telemetry"><span class="mt-stage">DEPARTURE</span><b class="mt-distance">0 KM</b><i></i><span class="mt-home">DISTANCE FROM HOME</span></div>
 <button class="sound-toggle" type="button"><i></i><span>SOUND OFF</span><small>HEADPHONES RECOMMENDED</small></button>
 <div class="phenomena"><span class="ph-label"></span><b class="ph-title"></b></div>
 <div class="anomaly-ui"><span>GRAVITATIONAL ANOMALY</span><b>REFERENCE FRAME UNSTABLE</b><i></i></div>
 <div class="end-card"><small>OBSERVABLE UNIVERSE</small><h2>WE HAVE<br>BARELY LEFT <em>HOME.</em></h2><button type="button">EXPLORE AGAIN ↑</button></div>`;
 document.body.appendChild(ui);
 $('.sound-toggle',ui).onclick=()=>{state.sound=!state.sound;$('.sound-toggle span',ui).textContent=state.sound?'SOUND ON':'SOUND OFF';document.documentElement.classList.toggle('sound-on',state.sound);if(state.sound) startAudio();};
 $('.end-card button',ui).onclick=()=>scrollTo({top:0,behavior:'smooth'});
 return ui;
}
const ui=mountUI();

let ctx,master,drone;
function startAudio(){
 if(ctx){ctx.resume();return;} const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 ctx=new AC();master=ctx.createGain();master.gain.value=.055;master.connect(ctx.destination);
 drone=ctx.createOscillator();const g=ctx.createGain();drone.type='sine';drone.frequency.value=43;g.gain.value=.35;drone.connect(g).connect(master);drone.start();
 const air=ctx.createOscillator(),ag=ctx.createGain();air.type='triangle';air.frequency.value=86;ag.gain.value=.055;air.connect(ag).connect(master);air.start();
}

function sceneIndex(p){return Math.min(9,Math.floor(p*10));}
function updateCopy(i){
 const [name,dist,a,b]=sceneData[i];$('.mt-stage',ui).textContent=name;$('.mt-distance',ui).textContent=dist;
 const ph=$('.phenomena',ui);const titles=['ATMOSPHERIC DEPARTURE','ORBITAL RENDEZVOUS','EARTH → MOON','LUNAR HORIZON','DUST WORLD','GAS GIANT','RING PLANE','INTERSTELLAR VOID','LIGHT BENDS HERE','EVENT HORIZON'];
 $('.ph-label',ui).textContent=String(i+1).padStart(2,'0')+' / '+name;$('.ph-title',ui).textContent=titles[i];
 if(i!==state.lastScene){ph.classList.remove('flash');requestAnimationFrame(()=>ph.classList.add('flash'));state.lastScene=i;}
 document.documentElement.dataset.chapter=String(i);
}

function update(){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),p=Math.min(1,Math.max(0,scrollY/max));state.progress=p;
 const i=sceneIndex(p);updateCopy(i);
 document.documentElement.style.setProperty('--journey',p.toFixed(4));
 $('.anomaly-ui',ui).classList.toggle('show',p>.84&&p<.975);
 $('.end-card',ui).classList.toggle('show',p>.987);
 if(ctx&&state.sound){const f=43+p*19+(p>.84?18*(p-.84)/.16:0);drone.frequency.setTargetAtTime(f,ctx.currentTime,.6);master.gain.setTargetAtTime(p>.965?.025:.055,ctx.currentTime,.8);}
 requestAnimationFrame(update);
}requestAnimationFrame(update);

// Small window-like parallax. It never takes control away from the authored camera.
let px=0,py=0;addEventListener('pointermove',e=>{px=(e.clientX/innerWidth-.5)*2;py=(e.clientY/innerHeight-.5)*2;document.documentElement.style.setProperty('--px',px.toFixed(3));document.documentElement.style.setProperty('--py',py.toFixed(3));},{passive:true});

// Optional mobile gyroscope after the existing Full Experience user gesture.
addEventListener('deviceorientation',e=>{if(!document.documentElement.classList.contains('cinema-mode'))return;const x=Math.max(-1,Math.min(1,(e.gamma||0)/35)),y=Math.max(-1,Math.min(1,(e.beta||0)/60));document.documentElement.style.setProperty('--px',x.toFixed(3));document.documentElement.style.setProperty('--py',y.toFixed(3));},{passive:true});
