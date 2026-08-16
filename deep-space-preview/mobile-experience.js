const mobileExperience=()=>{
  if(innerWidth>900 && !('ontouchstart' in window)) return;

  const wrap=document.createElement('div');
  wrap.className='mobile-experience';
  wrap.innerHTML=`<button type="button" class="experience-btn" aria-label="Enter cinema mode"><span class="experience-icon">⛶</span><span class="experience-copy"><b>FULL EXPERIENCE</b><small>tap, then rotate</small></span></button><div class="rotate-note" hidden><span>↻</span><b>ROTATE DEVICE</b><small>Landscape gives the intended cinematic framing.</small></div>`;
  document.body.appendChild(wrap);

  const btn=wrap.querySelector('.experience-btn');
  const note=wrap.querySelector('.rotate-note');
  const copy=btn.querySelector('small');
  let immersive=false;

  async function tryFullscreen(){
    const el=document.documentElement;
    try{
      if(document.fullscreenElement || document.webkitFullscreenElement) return true;
      if(el.requestFullscreen){ await el.requestFullscreen({navigationUI:'hide'}); return true; }
      if(el.webkitRequestFullscreen){ el.webkitRequestFullscreen(); return true; }
    }catch(e){}
    return false;
  }

  async function tryLandscapeLock(){
    try{
      if(screen.orientation?.lock){ await screen.orientation.lock('landscape'); return true; }
    }catch(e){}
    return false;
  }

  function portrait(){ return innerHeight>innerWidth; }

  function updateOrientationUI(){
    const isPortrait=portrait();
    note.hidden=!(immersive && isPortrait);
    document.documentElement.classList.toggle('cinema-portrait-warning',immersive && isPortrait);
    document.documentElement.classList.toggle('cinema-landscape',immersive && !isPortrait);
    if(immersive && !isPortrait){
      copy.textContent=(document.fullscreenElement||document.webkitFullscreenElement)?'fullscreen landscape':'landscape cinema';
    }
  }

  async function enterCinema(){
    immersive=true;
    document.documentElement.classList.add('cinema-mode');
    btn.classList.add('active');
    btn.querySelector('b').textContent='CINEMA MODE';
    const fs=await tryFullscreen();
    await tryLandscapeLock();
    copy.textContent=fs?'rotate to landscape':'rotate to landscape';
    updateOrientationUI();
  }

  async function exitCinema(){
    immersive=false;
    document.documentElement.classList.remove('cinema-mode','cinema-landscape','cinema-portrait-warning');
    btn.classList.remove('active');
    btn.querySelector('b').textContent='FULL EXPERIENCE';
    copy.textContent='tap, then rotate';
    note.hidden=true;
    try{
      if(document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
      else if(document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    }catch(e){}
  }

  btn.addEventListener('click',async()=>{
    if(immersive) await exitCinema(); else await enterCinema();
  });

  const onRotate=()=>setTimeout(()=>{
    updateOrientationUI();
    if(immersive && !portrait() && !(document.fullscreenElement||document.webkitFullscreenElement)){
      copy.textContent='landscape cinema';
    }
  },180);

  addEventListener('orientationchange',onRotate,{passive:true});
  addEventListener('resize',onRotate,{passive:true});
  document.addEventListener('fullscreenchange',updateOrientationUI);
  document.addEventListener('webkitfullscreenchange',updateOrientationUI);
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mobileExperience,{once:true});
else mobileExperience();
