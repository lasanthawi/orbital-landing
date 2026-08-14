(()=>{
const progress=document.getElementById('progressFill');
const topbar=document.getElementById('topbar');
const toTop=document.getElementById('toTop');
const reveals=[...document.querySelectorAll('.reveal')];
const sections=[...document.querySelectorAll('[data-section]')];
const parallax=[...document.querySelectorAll('.media-parallax img')];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');revealObserver.unobserve(entry.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
reveals.forEach(el=>revealObserver.observe(el));
function activeTone(){const y=82;let current=sections[0];for(const s of sections){const r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y){current=s;break}}topbar.classList.toggle('light',current?.dataset.section==='light')}
function update(){const y=window.scrollY||0;const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress.style.width=(y/max*100)+'%';topbar.classList.toggle('scrolled',y>24);toTop.classList.toggle('visible',y>innerHeight*.75);activeTone();if(!reduce&&innerWidth>900){parallax.forEach(img=>{const box=img.parentElement.getBoundingClientRect();if(box.bottom>0&&box.top<innerHeight){const p=(innerHeight-box.top)/(innerHeight+box.height)-.5;img.style.transform=`scale(1.06) translate3d(0,${p*28}px,0)`}})}else{parallax.forEach(img=>img.style.transform='')}}
let raf=0;function onScroll(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;update()})}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});toTop.addEventListener('click',()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'}));update();
})();