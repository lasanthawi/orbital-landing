const mobileExperience=()=>{
  if(innerWidth>900 && !('ontouchstart' in window)) return;

  const wrap=document.createElement('div');
  wrap.className='mobile-experience';
  wrap.innerHTML=`<button type="button" class="experience-btn" aria-label="Enter full mobile experience"><span class="experience-icon">⛶</span><span class="experience-copy"><b>FULL EXPERIENCE</b><small>landscape + fullscreen</small></span></button><div class="rotate-note" hidden><span>↻</span><b>ROTATE DEVICE</b><small>Landscape gives the intended cinematic framing.</small></div>`;
  document.body.appendChild(wrap);

  const btn=wrap.querySelector('.experience-btn');
  const note=wrap.querySelector('.rotate-note');
  let immersive=false;

  async function enterFullscreen(){
    const el=document.documentElement;
    try{
      if(!document.fullscreenElement){
        if(el.requestFullscreen) await el.requestFullscreen({navigationUI:'hide'});
        else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      }
    }catch(e){}
  }

  async function lockLandscape(){
    try{
      if(screen.orientation?.lock) await screen.orientation.lock('landscape');
    }catch(e){}
  }

  function updateOrientationUI(){
    const portrait=innerHeight>innerWidth;
    note.hidden=!(immersive && portrait);
    document.documentElement.classList.toggle('cinema-portrait-warning',immersive && portrait);
    document.documentElement.classList.toggle('cinema-landscape',immersive && !portrait);
  }

  btn.addEventListener('click',async()=>{
    immersive=true;
    document.documentElement.classList.add('cinema-mode');
    btn.classList.add('active');
    btn.querySelector('b').textContent='CINEMA MODE';
    btn.querySelector('small').textContent='tap again to exit';
    await enterFullscreen();
    await lockLandscape();
    updateOrientationUI();
  });

  btn.addEventListener('dblclick',async e=>{
    e.preventDefault();
    immersive=false;
    document.documentElement.classList.remove('cinema-mode','cinema-landscape','cinema-portrait-warning');
    btn.classList.remove('active');
    btn.querySelector('b').textContent='FULL EXPERIENCE';
    btn.querySelector('small').textContent='landscape + fullscreen';
    note.hidden=true;
    try{if(document.fullscreenElement) await document.exitFullscreen();}catch(e){}
  });

  addEventListener('orientationchange',()=>setTimeout(updateOrientationUI,120),{passive:true});
  addEventListener('resize',updateOrientationUI,{passive:true});
  document.addEventListener('fullscreenchange',()=>{
    if(!document.fullscreenElement && immersive && innerHeight>innerWidth) note.hidden=false;
  });
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mobileExperience,{once:true});
else mobileExperience();
