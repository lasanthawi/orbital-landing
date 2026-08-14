(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce)return;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,p)=>a+(b-a)*p;
const ease=p=>p*p*(3-2*p);
const scenes=[
  {section:document.querySelector('.hero'),media:document.querySelector('.hero-media'),img:document.querySelector('.hero-media img'),copy:document.querySelector('.hero-copy'),z:[-38,88],scale:[1.05,1.19],y:[18,-24],rx:[1.2,-1.8],ry:[-1.2,1.6],copyY:[0,-42],copyZ:[20,72],shade:[0,.32]},
  {section:document.querySelector('.platform'),media:document.querySelector('.platform-media'),img:document.querySelector('.platform-media img'),copy:document.querySelector('.platform .section-copy'),z:[-52,74],scale:[1.06,1.16],y:[26,-22],rx:[1.8,-1.2],ry:[1.6,-1.4],copyY:[24,-22],copyZ:[0,46],shade:[.06,.26]},
  {section:document.querySelector('.human'),media:document.querySelector('.human-photo'),img:document.querySelector('.human-photo img'),copy:document.querySelector('.human-copy'),z:[-28,58],scale:[1.02,1.1],y:[20,-18],rx:[1.1,-.8],ry:[-1.8,1.4],copyY:[18,-16],copyZ:[0,38],shade:[0,.1]},
  {section:document.querySelector('.lunar'),media:document.querySelector('.lunar-media'),img:document.querySelector('.lunar-media img'),copy:document.querySelector('.lunar .section-copy'),z:[-46,98],scale:[1.06,1.22],y:[24,-28],rx:[1.5,-1.6],ry:[-1.2,1.2],copyY:[34,-28],copyZ:[0,58],shade:[.02,.34]},
  {section:document.querySelector('.finale'),media:document.querySelector('.finale-media'),img:document.querySelector('.finale-media img'),copy:document.querySelector('.finale-inner'),z:[-40,110],scale:[1.08,1.24],y:[28,-30],rx:[1.2,-1.8],ry:[1,-1],copyY:[28,-34],copyZ:[0,64],shade:[.03,.38]}
].filter(s=>s.section&&s.media&&s.img);
const projects=[...document.querySelectorAll('.project')].map((section,i)=>({section,media:section.querySelector('.project-media'),img:section.querySelector('.project-media img'),meta:section.querySelector('.project-meta'),dir:i%2?1:-1}));
let raf=0;
function progressFor(el){const r=el.getBoundingClientRect();const vh=innerHeight;return clamp((vh-r.top)/(vh+r.height));}
function sceneProgress(el){const r=el.getBoundingClientRect();const vh=innerHeight;const travel=Math.max(1,r.height-vh);if(travel<2)return progressFor(el);return clamp((-r.top)/travel);}
function applyScene(s){const p=ease(sceneProgress(s.section));const centered=progressFor(s.section);const mobile=innerWidth<=900;const z=lerp(s.z[0],s.z[1],p)*(mobile?1:.72);const scale=lerp(s.scale[0],s.scale[1],p);const y=lerp(s.y[0],s.y[1],p)*(mobile?1:.72);const rx=lerp(s.rx[0],s.rx[1],p);const ry=lerp(s.ry[0],s.ry[1],p);s.media.style.setProperty('--depth-p',p.toFixed(3));s.media.style.setProperty('--depth-y',`${lerp(-8,8,p).toFixed(2)}%`);s.img.style.transform=`translate3d(0,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale.toFixed(4)})`;s.img.style.filter=`brightness(${lerp(.86,1.02,centered).toFixed(3)}) saturate(${lerp(.9,1.04,p).toFixed(3)})`;
if(s.copy){const cy=lerp(s.copyY[0],s.copyY[1],p)*(mobile?1:.65);const cz=lerp(s.copyZ[0],s.copyZ[1],p)*(mobile?1:.72);s.copy.style.transform=`translate3d(0,${cy.toFixed(2)}px,${cz.toFixed(2)}px)`;}
}
function applyProject(s){if(!s.media||!s.img)return;const p=ease(progressFor(s.section));const mobile=innerWidth<=900;const tilt=(p-.5)*(mobile?3.2:1.6)*s.dir;const lift=(.5-Math.abs(p-.5))*2;const z=(p-.5)*(mobile?58:30);const scale=1.045+p*(mobile?.085:.045);s.section.style.transform=`translate3d(0,${(lift*-5).toFixed(2)}px,0) rotateX(${((.5-p)*(mobile?1.6:.7)).toFixed(2)}deg)`;s.img.style.transform=`translate3d(${(tilt*2.2).toFixed(2)}px,${((.5-p)*(mobile?34:18)).toFixed(2)}px,${z.toFixed(2)}px) rotateY(${tilt.toFixed(2)}deg) scale(${scale.toFixed(4)})`;if(s.meta)s.meta.style.transform=`translate3d(0,${((.5-p)*(mobile?14:8)).toFixed(2)}px,${(mobile?18:8).toFixed(0)}px)`;}
function update(){raf=0;scenes.forEach(applyScene);projects.forEach(applyProject)}
function queue(){if(raf)return;raf=requestAnimationFrame(update)}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});addEventListener('orientationchange',()=>setTimeout(queue,140),{passive:true});queue();
})();