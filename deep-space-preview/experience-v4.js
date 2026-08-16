const $=(s,r=document)=>r.querySelector(s);
const state={sound:false,progress:0,lastScene:-1};
window.__orbitalPanX=0;

const sceneData=[['EARTH','0 KM'],['ORBIT','400 KM'],['LUNAR TRANSIT','384,400 KM'],['MOON','1.28 LIGHT-SECONDS'],['MARS','225M KM'],['JUPITER','5.2 AU'],['SATURN','9.5 AU'],['DEEP SPACE','BEYOND HOME'],['ANOMALY','26,000 LIGHT-YEARS'],['EVENT HORIZON','NO REFERENCE']];

function mountUI(){
 const ui=document.createElement('div');ui.className='experience-v4';ui.innerHTML=`<div class="mission-telemetry"><span class="mt-stage">DEPARTURE</span><b class="mt-distance">0 KM</b><i></i><span class="mt-home">DISTANCE FROM HOME</span></div><button class="sound-toggle" type="button"><i></i><span>SOUND OFF</span><small>TAP FOR CINEMATIC AUDIO</small></button><div class="phenomena"><span class="ph-label"></span><b class="ph-title"></b></div><div class="anomaly-ui"><span>GRAVITATIONAL ANOMALY</span><b>REFERENCE FRAME UNSTABLE</b><i></i></div><div class="end-card"><small>OBSERVABLE UNIVERSE</small><h2>WE HAVE<br>BARELY LEFT <em>HOME.</em></h2><button type="button">EXPLORE AGAIN ↑</button></div>`;document.body.appendChild(ui);
 $('.sound-toggle',ui).addEventListener('click',toggleSound);
 $('.end-card button',ui).onclick=()=>scrollTo({top:0,behavior:'smooth'});
 return ui;
}
const ui=mountUI();

let ctx,master,drone,air,pulse;
async function toggleSound(){
 state.sound=!state.sound;$('.sound-toggle span',ui).textContent=state.sound?'SOUND ON':'SOUND OFF';document.documentElement.classList.toggle('sound-on',state.sound);
 if(state.sound){await startAudio();if(ctx) master.gain.setTargetAtTime(.12,ctx.currentTime,.08);}else if(ctx){master.gain.setTargetAtTime(0,ctx.currentTime,.12);}
}
async function startAudio(){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 if(ctx){await ctx.resume();return;}
 ctx=new AC();master=ctx.createGain();master.gain.value=.12;master.connect(ctx.destination);
 drone=ctx.createOscillator();const dg=ctx.createGain();drone.type='sine';drone.frequency.value=46;dg.gain.value=.62;drone.connect(dg).connect(master);drone.start();
 air=ctx.createOscillator();const ag=ctx.createGain();air.type='triangle';air.frequency.value=92;ag.gain.value=.18;air.connect(ag).connect(master);air.start();
 pulse=ctx.createOscillator();const pg=ctx.createGain();pulse.type='sine';pulse.frequency.value=138;pg.gain.value=.055;pulse.connect(pg).connect(master);pulse.start();
}

const titles=['ATMOSPHERIC DEPARTURE','ORBITAL RENDEZVOUS','EARTH → MOON','LUNAR HORIZON','DUST WORLD','GAS GIANT','RING PLANE','INTERSTELLAR VOID','LIGHT BENDS HERE','EVENT HORIZON'];
function updateCopy(i){const [name,dist]=sceneData[i];$('.mt-stage',ui).textContent=name;$('.mt-distance',ui).textContent=dist;const ph=$('.phenomena',ui);$('.ph-label',ui).textContent=String(i+1).padStart(2,'0')+' / '+name;$('.ph-title',ui).textContent=titles[i];if(i!==state.lastScene){ph.classList.remove('flash');requestAnimationFrame(()=>ph.classList.add('flash'));state.lastScene=i;}document.documentElement.dataset.chapter=String(i);}

let lastScrollY=scrollY,panTarget=0;
addEventListener('scroll',()=>{if(Math.abs(scrollY-lastScrollY)>1){panTarget=0;lastScrollY=scrollY;}},{passive:true});

function update(){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),p=Math.min(1,Math.max(0,scrollY/max));state.progress=p;updateCopy(Math.min(9,Math.floor(p*10)));document.documentElement.style.setProperty('--journey',p.toFixed(4));document.documentElement.classList.toggle('initial-flight',p<.012);$('.anomaly-ui',ui).classList.toggle('show',p>.84&&p<.975);$('.end-card',ui).classList.toggle('show',p>.987);
 window.__orbitalPanX+=(panTarget-window.__orbitalPanX)*.12;
 if(ctx&&state.sound){drone.frequency.setTargetAtTime(46+p*22,ctx.currentTime,.5);air.frequency.setTargetAtTime(92+p*36,ctx.currentTime,.7);}
 requestAnimationFrame(update);
}requestAnimationFrame(update);

if(!('ontouchstart' in window)) addEventListener('pointermove',e=>{document.documentElement.style.setProperty('--px',((e.clientX/innerWidth-.5)*2).toFixed(3));document.documentElement.style.setProperty('--py',((e.clientY/innerHeight-.5)*2).toFixed(3));},{passive:true});

const canvas=document.getElementById('world');
if(canvas&&('ontouchstart' in window)){
 let sx=0,sy=0,active=false;
 canvas.style.touchAction='pan-y';
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;sx=e.clientX;sy=e.clientY;active=true;},{passive:true});
 canvas.addEventListener('pointermove',e=>{if(!active||e.pointerType!=='touch')return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>Math.abs(dy)*1.2){panTarget=Math.max(-1,Math.min(1,dx/(innerWidth*.38)));}},{passive:true});
 const end=()=>{active=false};canvas.addEventListener('pointerup',end,{passive:true});canvas.addEventListener('pointercancel',end,{passive:true});
}
