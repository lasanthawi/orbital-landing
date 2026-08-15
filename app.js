import * as THREE from 'three';
import {glowTexture,stars,earthWorld,coreWorld,portalWorld,moonWorld,finaleWorld} from './objects.js';
THREE.Cache.enabled=true;
const canvas=document.getElementById('world'),fallback=document.getElementById('fallback'),loader=document.getElementById('loader'),loaderPct=document.getElementById('loaderPct'),meterFill=document.getElementById('meterFill'),mobileFill=document.getElementById('mobileFill'),meterScene=document.getElementById('meterScene'),sceneCode=document.getElementById('sceneCode'),depthValue=document.getElementById('depthValue'),hint=document.getElementById('hint'),panels=[...document.querySelectorAll('.story-panel')];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,isMobile=()=>innerWidth<780;let renderer,quality=1,paused=false;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile(),alpha:false,powerPreference:'high-performance'})}catch(e){fallback.hidden=false;throw e}
function size(){const cap=isMobile()?1.22:1.5;renderer.setPixelRatio(Math.min(devicePixelRatio||1,cap)*quality);renderer.setSize(innerWidth,innerHeight,false)}size();renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x020405);scene.fog=new THREE.FogExp2(0x020405,isMobile()?.014:.01);const camera=new THREE.PerspectiveCamera(isMobile()?58:52,innerWidth/innerHeight,.08,220);scene.add(new THREE.HemisphereLight(0xa3c4d5,0x080a0b,.86));const keyLight=new THREE.DirectionalLight(0xf2f7ff,3.7);keyLight.position.set(8,8,10);scene.add(keyLight);const rim=new THREE.DirectionalLight(0x72bfea,1.65);rim.position.set(-8,2,-6);scene.add(rim);
const manager=new THREE.LoadingManager();manager.onProgress=(u,l,t)=>loaderPct.textContent=String(Math.round(l/Math.max(1,t)*100)).padStart(2,'0');manager.onLoad=()=>setTimeout(()=>loader.classList.add('done'),220);const tex=glowTexture();scene.add(stars(isMobile()));
const earth=earthWorld(isMobile(),tex,manager);scene.add(earth.group);earth.group.position.set(0,isMobile()?-1.7:-.7,0);const core=coreWorld(tex);scene.add(core.group);core.group.position.z=-18;core.group.scale.setScalar(isMobile()?.82:.92);const portal=portalWorld(tex);scene.add(portal);portal.position.z=-34;const moon=moonWorld(isMobile(),tex);scene.add(moon.group);moon.group.position.z=-49;const finale=finaleWorld(tex,manager,isMobile());scene.add(finale.group);finale.group.position.z=-88;
const mapLoader=new THREE.TextureLoader(manager);function enhanceEarth(mesh,cloudMesh){const mat=mesh.material;mat.roughness=.5;mat.metalness=.025;mat.emissive=new THREE.Color(0x6598b6);mat.emissiveIntensity=.32;mapLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',t=>{mat.normalMap=t;mat.normalScale=new THREE.Vector2(.62,.62);mat.needsUpdate=true},undefined,()=>{});mapLoader.load('https://threejs.org/examples/textures/planets/earth_lights_2048.png',t=>{t.colorSpace=THREE.SRGBColorSpace;mat.emissiveMap=t;mat.needsUpdate=true},undefined,()=>{});if(cloudMesh)mapLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png',t=>{t.colorSpace=THREE.SRGBColorSpace;cloudMesh.material.map=t;cloudMesh.material.opacity=.18;cloudMesh.material.alphaTest=.02;cloudMesh.material.needsUpdate=true},undefined,()=>{})}enhanceEarth(earth.earth,earth.clouds);enhanceEarth(finale.earth,null);
const heroKey=new THREE.DirectionalLight(0xfaffff,4.8);heroKey.position.set(-2.3,3.8,11);heroKey.target=earth.group;scene.add(heroKey);const heroFill=new THREE.PointLight(0x77c8ff,2.2,28,1.6);heroFill.position.set(4,-1,8);scene.add(heroFill);const finaleKey=new THREE.DirectionalLight(0xffffff,5.2);finaleKey.position.set(-4,5,-76);finaleKey.target=finale.group;scene.add(finaleKey);
function makeKeys(){if(isMobile())return[
{p:0,pos:[0,1.35,16],look:[0,-1.9,0]},
{p:.12,pos:[1.5,.35,11.3],look:[0,-1.8,0]},
{p:.235,pos:[2.7,.15,8.2],look:[1.2,-1.45,1.5]},
{p:.285,pos:[.3,.55,-10.8],look:[0,-.25,-18]},
{p:.385,pos:[2,.3,-12.4],look:[0,-.2,-18]},
{p:.47,pos:[.4,.1,-27],look:[0,-.1,-35.5]},
{p:.57,pos:[0,.05,-32],look:[0,-.15,-40]},
{p:.64,pos:[3.6,1.8,-41.5],look:[-1.2,-1.55,-48.5]},
{p:.735,pos:[2.8,1.15,-44.5],look:[-1.3,-1.85,-49]},
{p:.795,pos:[8.2,3.35,-50.8],look:[2.1,-1.45,-54.4]},
{p:.895,pos:[6.4,2.2,-52.8],look:[2.1,-1.35,-54.4]},
{p:.94,pos:[0,6.7,-70],look:[0,-.45,-79]},
{p:1,pos:[0,6.7,-70],look:[0,-.45,-79]}];return[
{p:0,pos:[0,1.2,14.8],look:[0,-.9,0]},
{p:.13,pos:[1.9,.25,9.8],look:[0,-1,0]},
{p:.235,pos:[3.1,.1,7.4],look:[1.8,-.9,1.5]},
{p:.285,pos:[.4,.45,-10.5],look:[0,0,-18]},
{p:.385,pos:[2.4,.25,-12.2],look:[0,0,-18]},
{p:.47,pos:[.6,.1,-27],look:[0,0,-35.5]},
{p:.57,pos:[0,.05,-32],look:[0,-.1,-40]},
{p:.64,pos:[4.4,1.7,-41.2],look:[-1.4,-1.45,-48.5]},
{p:.735,pos:[3.2,1.05,-44.2],look:[-1.4,-1.7,-49]},
{p:.795,pos:[9.1,3.35,-50.5],look:[2.1,-1.35,-54.4]},
{p:.895,pos:[7.1,2.2,-52.7],look:[2.1,-1.25,-54.4]},
{p:.94,pos:[0,7,-69.5],look:[0,-.35,-79]},
{p:1,pos:[0,7,-69.5],look:[0,-.35,-79]}]}
let keys=makeKeys();const ranges=[.12,.255,.42,.585,.755,.925,1.001],labels=['01 / EARTH','02 / NETWORK','03 / CORE','04 / TRANSIT','05 / MOON','06 / BUILD','07 / RETURN'];
function interp(pp){let a=keys[0],b=keys.at(-1);for(let i=0;i<keys.length-1;i++)if(pp>=keys[i].p&&pp<=keys[i+1].p){a=keys[i];b=keys[i+1];break}let q=(pp-a.p)/(b.p-a.p);q=q*q*(3-2*q);return{pos:a.pos.map((v,i)=>THREE.MathUtils.lerp(v,b.pos[i],q)),look:a.look.map((v,i)=>THREE.MathUtils.lerp(v,b.look[i],q))}}
function sceneIndex(pp){for(let i=0;i<ranges.length;i++)if(pp<ranges[i])return i;return 6}function local(pp,a,b){return THREE.MathUtils.clamp((pp-a)/(b-a),0,1)}let target=0,p=0,tx=0,ty=0,px=0,py=0,last=-1;
function scrollProgress(){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);target=THREE.MathUtils.clamp((scrollY||0)/max,0,1)}
function alphaGroup(o,a){const show=a>.003;o.visible=show;if(!show)return;o.traverse(x=>{if(x.material){const mats=Array.isArray(x.material)?x.material:[x.material];mats.forEach(m=>{if(m.userData.baseOpacity==null)m.userData.baseOpacity=m.opacity==null?1:m.opacity;m.transparent=m.transparent||a<.999;m.opacity=m.userData.baseOpacity*a})}})}
function windowAlpha(pp,inA,inB,outA,outB){return THREE.MathUtils.smoothstep(pp,inA,inB)*(1-THREE.MathUtils.smoothstep(pp,outA,outB))}
function updateWorld(t){
 const earthA=1-THREE.MathUtils.smoothstep(p,.235,.285);alphaGroup(earth.group,earthA);earth.group.position.y=THREE.MathUtils.lerp(isMobile()?-1.7:-.7,isMobile()?-2:-1.1,local(p,.06,.23));earth.group.position.x=-THREE.MathUtils.smoothstep(p,.235,.285)*(isMobile()?13:16);earth.earth.rotation.y=-1.35+t*.00004+p*.72;earth.clouds.rotation.y=-1.28-t*.00002+p*.45;earth.network.rotation.y=p*.95+t*.000025;earth.network.rotation.z=Math.sin(t*.00013)*.02;
 const coreA=windowAlpha(p,.235,.27,.43,.485);alphaGroup(core.group,coreA);const cp=local(p,.26,.42);core.group.rotation.y=.25+t*.00012+cp*.42;core.inner.rotation.x=t*.00025;core.inner.rotation.y=-t*.0002;core.components.forEach((m,i)=>{const e=THREE.MathUtils.smoothstep(cp,.15,.78);m.position.copy(m.userData.base).multiplyScalar(.38+e*.72);m.rotation.x=e*(i%2?.12:-.1);m.rotation.y=e*(i%2?-.18:.16)});
 const portalA=windowAlpha(p,.405,.455,.575,.62);alphaGroup(portal,portalA);portal.rotation.z=t*.00008;
 const moonA=windowAlpha(p,.555,.605,.915,.95);alphaGroup(moon.group,moonA);const mp=local(p,.61,.755);moon.rover.position.x=-4.6+mp*6.8;moon.rover.position.z=2.1-Math.sin(mp*Math.PI)*.65;moon.rover.rotation.y=-.33+mp*.34;moon.rover.traverse(o=>{if(o.userData.wheel)o.rotation.x-=.018});
 const build=local(p,.765,.91);moon.modules.forEach((m,i)=>{const q=THREE.MathUtils.smoothstep(build,i*.1,Math.min(1,i*.1+.28));m.scale.setScalar(Math.max(.001,q));m.position.y=(1-q)*-.28});moon.solarArrays.forEach((a,i)=>{const q=THREE.MathUtils.smoothstep(build,.34+i*.12,.68+i*.12);a.scale.setScalar(Math.max(.001,q));a.rotation.y=(1-q)*(i?-.7:.7)});moon.tower.scale.y=Math.max(.001,THREE.MathUtils.smoothstep(build,.54,.86));moon.guideLights.visible=build>.68;
 const finalA=THREE.MathUtils.smoothstep(p,.915,.95);alphaGroup(finale.group,finalA);finale.earth.rotation.y=-1.18+t*.000045+p*.55;finale.ring.rotation.z=t*.00007;finale.moon.rotation.y=t*.00003;
}
function updateUI(){const idx=sceneIndex(p);if(idx!==last){panels.forEach((el,i)=>el.classList.toggle('active',i===idx));meterScene.textContent=String(idx+1).padStart(2,'0');sceneCode.textContent=labels[idx];last=idx}const pct=(p*100).toFixed(2)+'%';meterFill.style.height=pct;mobileFill.style.width=pct;const z=interp(p).pos[2];depthValue.textContent=(z>=0?'+':'')+Math.round(z).toString().padStart(3,'0')+' KM';hint.classList.toggle('hide',p>.035)}
addEventListener('scroll',scrollProgress,{passive:true});addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2},{passive:true});addEventListener('touchmove',e=>{if(e.touches[0]){tx=(e.touches[0].clientX/innerWidth-.5)*2;ty=(e.touches[0].clientY/innerHeight-.5)*2}},{passive:true});addEventListener('resize',()=>{size();keys=makeKeys();camera.aspect=innerWidth/innerHeight;camera.fov=isMobile()?58:52;camera.updateProjectionMatrix();scrollProgress()},{passive:true});document.addEventListener('visibilitychange',()=>{paused=document.hidden;if(!paused)requestAnimationFrame(frame)});
const look=new THREE.Vector3();let slowFrames=0,lastT=0;function frame(t){if(paused)return;if(lastT&&t-lastT>26)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);lastT=t;if(slowFrames>75&&quality>.72){quality=.72;size();slowFrames=0}p+=(target-p)*(reduce?1:.082);px+=(tx-px)*(reduce?.1:.04);py+=(ty-py)*(reduce?.1:.04);const k=interp(p);camera.position.set(k.pos[0]+px*(isMobile()?.18:.42),k.pos[1]-py*(isMobile()?.14:.3),k.pos[2]);look.set(k.look[0]+px*.1,k.look[1]-py*.08,k.look[2]);camera.lookAt(look);updateWorld(t);updateUI();renderer.render(scene,camera);requestAnimationFrame(frame)}scrollProgress();requestAnimationFrame(frame);setTimeout(()=>loader.classList.add('done'),5000);
