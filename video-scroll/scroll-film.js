(()=>{
const films=[document.getElementById('filmA'),document.getElementById('filmB')];
const beats=[...document.querySelectorAll('.beat')];
const rail=document.getElementById('railFill');
const code=document.getElementById('chapterCode');
const timeCode=document.getElementById('timeCode');
const loading=document.getElementById('loading');
const loadPct=document.getElementById('loadPct');
const cue=document.getElementById('scrollCueText');
const rotateBtn=document.getElementById('rotateBtn');
const rotateLabel=document.getElementById('rotateLabel');
const fullscreenNote=document.getElementById('fullscreenNote');
let durations=[10,10],ready=[false,false],total=20,current=0,target=0,renderP=0,raf=0,lastBeat=-1,directed=false,idleLast=performance.now(),idleIndex=0,idleStarted=false;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
function rawProgress(){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);return clamp((scrollY||0)/max)}
function formatTime(t){const sec=Math.max(0,t),s=Math.floor(sec),h=Math.floor((sec-s)*100);return`00:${String(s).padStart(2,'0')}.${String(h).padStart(2,'0')}`}
function segment(p,i){return clamp(p*beats.length-i)}
function visibility(lp){const enter=smooth((lp-.02)/.20);const exit=1-smooth((lp-.76)/.22);return clamp(Math.min(enter,exit))}
function updateChapter(p){const idx=Math.min(beats.length-1,Math.floor(clamp(p,.0001,.9999)*beats.length));if(idx!==lastBeat){code.textContent=beats[idx]?.dataset.chapter||'';lastBeat=idx}}
function choreograph(p){
 beats.forEach((beat,i)=>{
  const c=beat.querySelector('.copy'); if(!c)return;
  const lp=segment(p,i),v=visibility(lp),enter=smooth((lp-.02)/.28),exit=smooth((lp-.72)/.26);
  c.style.opacity=String(v);
  beat.classList.toggle('active',v>.02);
  const title=c.querySelector('h1,h2'),body=c.querySelector(':scope > span'),eyebrow=c.querySelector(':scope > p');
  if(i===0){
   const fill=c.querySelector('.fill'),line=c.querySelector('.draw-line');
   const f=smooth((lp-.04)/.50);
   if(fill)fill.style.clipPath=`inset(${100-f*100}% 0 0 0)`;
   if(line){line.style.opacity=String(clamp((f-.03)*4)*(1-clamp((f-.84)*6)));line.style.transform=`translate3d(0,${lerp(6,94,f)}px,0)`}
   c.style.transform=`translate3d(0,${lerp(28,-18,exit)-lerp(28,0,enter)}px,0) scale(${lerp(.985,1,enter)})`;
  }else if(i===1){
   c.style.transform=`translate3d(${lerp(18,-4,enter)-exit*5}vw,0,0)`;
   if(title)title.style.transform=`translateX(${lerp(28,0,enter)}px)`;
   if(body)body.style.transform=`translateX(${lerp(46,0,smooth((lp-.10)/.26))}px)`;
  }else if(i===2){
   c.style.transform=`translate3d(${lerp(-7,1.5,enter)}vw,${lerp(4,-2,exit)}vh,0) rotate(${lerp(-1.2,.25,enter)}deg)`;
   if(title)title.style.transform=`scale(${lerp(.94,1,enter)})`;
  }else if(i===3){
   c.style.transform=`translate3d(${lerp(10,-2,enter)}vw,${lerp(-2,1,exit)}vh,0)`;
   if(eyebrow)eyebrow.style.transform=`translateX(${lerp(40,0,enter)}px)`;
   if(title)title.style.transform=`translateX(${lerp(70,0,enter)}px)`;
   if(body)body.style.transform=`translateX(${lerp(100,0,enter)}px)`;
  }else if(i===4){
   const s=lerp(.46,1.02,enter)+exit*.08;
   c.style.transform=`scale(${s}) translateZ(0)`;
   c.style.filter=`blur(${lerp(22,0,enter)+exit*4}px)`;
   if(title)title.style.letterSpacing=`${lerp(-.02,-.075,enter)}em`;
  }
  if(title)title.style.opacity=String(clamp(v*1.08));
  if(eyebrow)eyebrow.style.opacity=String(clamp(v*1.2));
  if(body)body.style.opacity=String(clamp((v-.08)*1.22));
 });
}
function setFilmOpacity(t){
 const d0=durations[0],blend=.35;
 let a=1,b=0;
 if(t>d0-blend&&t<d0+blend){const m=smooth((t-(d0-blend))/(blend*2));a=1-m;b=m}else if(t>=d0+blend){a=0;b=1}
 films[0].style.opacity=a.toFixed(3); films[1].style.opacity=b.toFixed(3);
}
function seekFilm(film,time){if(!film||film.readyState<1)return;try{if(Math.abs(film.currentTime-time)>.028)film.currentTime=time}catch(e){}}
function syncFilms(t){const d0=durations[0];seekFilm(films[0],clamp(t,0,Math.max(.01,d0-.04)));seekFilm(films[1],clamp(t-d0,0,Math.max(.01,durations[1]-.04)));setFilmOpacity(t)}
function refreshTotal(){total=durations[0]+durations[1];target=rawProgress()*total;current=target;syncFilms(current)}
function markReady(i){if(ready[i])return;ready[i]=true;if(Number.isFinite(films[i].duration)&&films[i].duration>0)durations[i]=films[i].duration;loadPct.textContent=ready.every(Boolean)?'100':ready.filter(Boolean).length===1?'50':'75';refreshTotal();if(ready.every(Boolean)){setTimeout(()=>loading.classList.add('done'),120);startIdlePlayback()}}
films.forEach((film,i)=>{
 film.muted=true;film.playsInline=true;film.preload='auto';
 film.addEventListener('loadedmetadata',()=>markReady(i));
 film.addEventListener('loadeddata',()=>markReady(i));
 film.addEventListener('canplay',()=>markReady(i));
 film.addEventListener('error',()=>{loading.querySelector('span').textContent='RETRYING FILM';setTimeout(()=>{film.load()},700)});
 film.load();
});
async function safePlay(f){try{f.muted=true;f.playbackRate=.35;await f.play();return true}catch(e){return false}}
async function startIdlePlayback(){if(directed||idleStarted||!ready.some(Boolean))return;idleStarted=true;idleIndex=0;films.forEach(f=>{try{f.pause()}catch(e){}});const ok=await safePlay(films[0]);if(!ok){idleStarted=false}}
function takeControl(){if(directed)return;directed=true;cue.textContent='SCROLL TO SCRUB FILM';films.forEach(f=>{try{f.pause()}catch(e){}});target=rawProgress()*total;current=target}
addEventListener('scroll',takeControl,{passive:true,once:true});
addEventListener('wheel',takeControl,{passive:true,once:true});
addEventListener('pointerdown',e=>{if(e.target===rotateBtn||rotateBtn?.contains(e.target))return;takeControl()},{passive:true,once:true});
function idleTick(){if(directed||!idleStarted)return;const f=films[idleIndex];if(!f||f.readyState<2)return;if(idleIndex===0&&f.currentTime>=Math.max(.1,durations[0]-.45)){idleIndex=1;safePlay(films[1]);}if(idleIndex===1&&films[1].currentTime>=Math.max(.1,durations[1]-.08)){films[0].currentTime=0;films[1].currentTime=0;films[1].pause();idleIndex=0;safePlay(films[0])}current=(idleIndex===0?films[0].currentTime:durations[0]+films[1].currentTime);setFilmOpacity(current)}
async function toggleFullscreen(){
 const root=document.documentElement;
 const isFull=!!(document.fullscreenElement||document.webkitFullscreenElement);
 try{
  if(isFull){if(document.exitFullscreen)await document.exitFullscreen();else if(document.webkitExitFullscreen)document.webkitExitFullscreen()}
  else if(root.requestFullscreen){await root.requestFullscreen({navigationUI:'hide'});if(screen.orientation?.lock){try{await screen.orientation.lock('landscape')}catch(e){}}}
  else if(root.webkitRequestFullscreen){root.webkitRequestFullscreen()}
  else{document.body.classList.toggle('pseudo-fullscreen');fullscreenNote.classList.add('show');setTimeout(()=>fullscreenNote.classList.remove('show'),2200)}
 }catch(e){document.body.classList.toggle('pseudo-fullscreen');fullscreenNote.classList.add('show');setTimeout(()=>fullscreenNote.classList.remove('show'),2200)}
}
rotateBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();takeControl();toggleFullscreen()});
function syncFullscreenLabel(){const isFull=!!(document.fullscreenElement||document.webkitFullscreenElement)||document.body.classList.contains('pseudo-fullscreen');if(rotateLabel)rotateLabel.textContent=isFull?'EXIT':'FULLSCREEN'}
document.addEventListener('fullscreenchange',syncFullscreenLabel);document.addEventListener('webkitfullscreenchange',syncFullscreenLabel);
function loop(now){
 const raw=rawProgress();renderP+= (raw-renderP)*(Math.abs(raw-renderP)>.08?.16:.105);
 if(directed){target=renderP*total;current+= (target-current)*(Math.abs(target-current)>.8?.20:.12);syncFilms(current)}else{idleTick()}
 rail.style.height=`${raw*100}%`;timeCode.textContent=formatTime(current);updateChapter(renderP);choreograph(renderP);raf=requestAnimationFrame(loop)
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);films.forEach(f=>f.pause())}else{idleLast=performance.now();if(!directed){idleStarted=false;startIdlePlayback()}raf=requestAnimationFrame(loop)}});
renderP=rawProgress();choreograph(renderP);raf=requestAnimationFrame(loop);
})();