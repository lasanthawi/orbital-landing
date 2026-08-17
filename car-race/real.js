import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $=id=>document.getElementById(id);
const canvas=$('stage'),loader=$('loader'),pct=$('loaderPct'),gesture=$('gesture'),progress=$('progressBar'),sceneCode=$('sceneCode'),sceneName=$('sceneName'),rpm=$('rpmValue'),giant=$('giantNumber'),micro=$('microCopy'),flash=$('flash'),chapters=[...document.querySelectorAll('.chapter')];
const MOBILE=matchMedia('(max-width:780px)').matches;
const renderer=new THREE.WebGLRenderer({canvas,antialias:!MOBILE,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight,false);renderer.setPixelRatio(Math.min(devicePixelRatio,MOBILE?1.15:1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;renderer.shadowMap.enabled=!MOBILE;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x040404);scene.fog=new THREE.FogExp2(0x050505,.018);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,150);camera.position.set(4.6,1.4,-6);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.add(new THREE.HemisphereLight(0x6e86a0,0x050505,.34));
const key=new THREE.DirectionalLight(0xffffff,4.5);key.position.set(-4,7,-5);key.castShadow=!MOBILE;scene.add(key);
const rim=new THREE.DirectionalLight(0x87bfff,3.5);rim.position.set(5,3,4);scene.add(rim);
const redKick=new THREE.PointLight(0xff2b18,0,13,2);redKick.position.set(-2,.8,-1);scene.add(redKick);
const amberKick=new THREE.PointLight(0xffa000,0,12,2);amberKick.position.set(2,1.1,1);scene.add(amberKick);
const floorMat=new THREE.MeshStandardMaterial({color:0x080808,roughness:.43,metalness:.22});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,120),floorMat);floor.rotation.x=-Math.PI/2;floor.receiveShadow=!MOBILE;scene.add(floor);

const carRoot=new THREE.Group();scene.add(carRoot);
const materials={
  0:new THREE.MeshStandardMaterial({color:0x505154,metalness:.5,roughness:.34}),
  1:new THREE.MeshPhysicalMaterial({color:0xf0efe9,metalness:.72,roughness:.19,clearcoat:1,clearcoatRoughness:.1}),
  2:new THREE.MeshPhysicalMaterial({color:0x101820,metalness:.08,roughness:.08,transmission:.18,transparent:true,opacity:.72}),
  3:new THREE.MeshStandardMaterial({color:0x090909,metalness:.38,roughness:.38}),
  4:new THREE.MeshStandardMaterial({color:0xe8f4ff,emissive:0xbfdfff,emissiveIntensity:1.25,roughness:.16,metalness:.05}),
  5:new THREE.MeshStandardMaterial({color:0x080808,roughness:.82,metalness:.02}),
  6:new THREE.MeshStandardMaterial({color:0x333438,metalness:.9,roughness:.2}),
  7:new THREE.MeshStandardMaterial({color:0xc52217,metalness:.75,roughness:.27,emissive:0x220000,emissiveIntensity:.7}),
  8:new THREE.MeshStandardMaterial({color:0x202225,metalness:.78,roughness:.34})
};

async function gunzip(ab){
  if('DecompressionStream' in window){const ds=new DecompressionStream('gzip');return await new Response(new Blob([ab]).stream().pipeThrough(ds)).arrayBuffer()}
  const {ungzip}=await import('https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm');return ungzip(new Uint8Array(ab)).buffer;
}
function readF32(dv,state){const v=dv.getFloat32(state.o,true);state.o+=4;return v}
function readU16(dv,state){const v=dv.getUint16(state.o,true);state.o+=2;return v}
function readU32(dv,state){const v=dv.getUint32(state.o,true);state.o+=4;return v}
async function loadE92(){
  loader.querySelector('b').textContent='LOADING REAL E92';pct.textContent='08';
  const res=await fetch('./e92/e92-geometry.bin.gz?v=1',{cache:'no-store'});if(!res.ok)throw new Error('E92 asset '+res.status);pct.textContent='38';
  const raw=await gunzip(await res.arrayBuffer());pct.textContent='62';
  const dv=new DataView(raw),s={o:0};
  const magic=String.fromCharCode(dv.getUint8(s.o++),dv.getUint8(s.o++),dv.getUint8(s.o++),dv.getUint8(s.o++));
  if(magic!=='E92G')throw new Error('E92 geometry signature');
  const version=dv.getUint8(s.o++);if(version!==1)throw new Error('E92 geometry version');
  const count=readU16(dv,s);const mn=[readF32(dv,s),readF32(dv,s),readF32(dv,s)],mx=[readF32(dv,s),readF32(dv,s),readF32(dv,s)];
  for(let m=0;m<count;m++){
    const cat=dv.getUint8(s.o++),vc=readU32(dv,s),fc=readU32(dv,s),pos=new Float32Array(vc*3);
    for(let j=0;j<vc;j++)for(let a=0;a<3;a++){const q=readU16(dv,s);pos[j*3+a]=mn[a]+q/65535*(mx[a]-mn[a])}
    const ind=new Uint16Array(fc*3);for(let j=0;j<ind.length;j++)ind[j]=readU16(dv,s);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(new THREE.BufferAttribute(ind,1));g.computeVertexNormals();g.computeBoundingSphere();
    const mesh=new THREE.Mesh(g,materials[cat]||materials[0]);mesh.castShadow=!MOBILE;mesh.receiveShadow=!MOBILE;carRoot.add(mesh);
    pct.textContent=String(Math.min(94,62+Math.round((m+1)/count*32))).padStart(2,'0');
  }
  const box=new THREE.Box3().setFromObject(carRoot),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  carRoot.position.sub(center);const scale=4.55/Math.max(size.x,size.z,1);carRoot.scale.setScalar(scale);
  const box2=new THREE.Box3().setFromObject(carRoot);carRoot.position.y-=box2.min.y;carRoot.position.y+=.035;
  pct.textContent='100';loader.querySelector('b').textContent='E92 READY';setTimeout(()=>loader.classList.add('done'),260);
}

const env={studio:new THREE.Group(),grid:new THREE.Group(),track:new THREE.Group(),brakes:new THREE.Group()};scene.add(env.studio,env.grid,env.track,env.brakes);
const wall=new THREE.Mesh(new THREE.PlaneGeometry(26,9),new THREE.MeshStandardMaterial({color:0x090909,roughness:.78}));wall.position.set(0,3.8,7);wall.rotation.y=Math.PI;env.studio.add(wall);
for(const x of[-4.7,4.7]){const s=new THREE.Mesh(new THREE.PlaneGeometry(.7,5.2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.11,side:THREE.DoubleSide}));s.position.set(x,3,0);s.rotation.y=Math.PI/2;env.studio.add(s)}
const topStrip=new THREE.Mesh(new THREE.PlaneGeometry(6,.16),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.18,side:THREE.DoubleSide}));topStrip.position.set(0,5,-1);topStrip.rotation.x=Math.PI/2;env.studio.add(topStrip);
for(let z=-8;z<8;z+=2){const l=new THREE.Mesh(new THREE.PlaneGeometry(5,.035),new THREE.MeshBasicMaterial({color:z%4?0x777777:0xff2b18,transparent:true,opacity:.34}));l.rotation.x=-Math.PI/2;l.position.set(0,.008,z);env.grid.add(l)}
const road=new THREE.Mesh(new THREE.PlaneGeometry(11,100),new THREE.MeshStandardMaterial({color:0x0b0b0b,roughness:.9}));road.rotation.x=-Math.PI/2;env.track.add(road);env.dashes=[];
for(let z=-45;z<45;z+=5)for(const x of[-2.25,2.25]){const d=new THREE.Mesh(new THREE.PlaneGeometry(.1,2),new THREE.MeshBasicMaterial({color:0xd8d5ce,transparent:true,opacity:.7}));d.rotation.x=-Math.PI/2;d.position.set(x,.01,z);env.track.add(d);env.dashes.push(d)}
for(const x of[-5.2,5.2]){const b=new THREE.Mesh(new THREE.BoxGeometry(.18,1.15,90),new THREE.MeshStandardMaterial({color:0x171717,metalness:.45,roughness:.55}));b.position.set(x,.57,0);env.track.add(b)}
env.gantries=[];for(let z=-38;z<34;z+=12){const g=new THREE.Group();for(const x of[-5,5]){const p=new THREE.Mesh(new THREE.BoxGeometry(.12,3.8,.12),materials[8]);p.position.set(x,1.9,z);g.add(p)}const beam=new THREE.Mesh(new THREE.BoxGeometry(10.1,.13,.16),materials[8]);beam.position.set(0,3.72,z);g.add(beam);const light=new THREE.Mesh(new THREE.BoxGeometry(3.8,.04,.18),new THREE.MeshBasicMaterial({color:0xffa000}));light.position.set(0,3.62,z-.02);g.add(light);env.track.add(g);env.gantries.push(g)}
for(const x of[-.91,.91]){const d=new THREE.Mesh(new THREE.CircleGeometry(.28,32),new THREE.MeshBasicMaterial({color:0xff351d,transparent:true,opacity:0,depthWrite:false}));d.position.set(x,.42,-1.48);env.brakes.add(d)}
const headSpots=[];for(const x of[-.57,.57]){const h=new THREE.SpotLight(0xdcecff,0,24,Math.PI/7,.55,1.8);h.position.set(x,.64,-2.15);h.target.position.set(x,.2,-12);scene.add(h,h.target);headSpots.push(h)}

const names=['IGNITION','FRONT ATTACK','BRAKE ZONE','SIDE DRAFT','AERO','HERO GRID','FULL ATTACK','AFTERMATH'],micros=['S65 // 4.0 V8','FRONT // ATTACK','100 → 0 // COMMIT','SIDE // DRAFT','WAKE // AERO','GRID // 001','8400 // REDLINE','HEAT // OFF'],cuts=[0,.12,.25,.38,.51,.64,.76,.9,1];
const shots=[[[4.5,1.3,-5.8],[0,.68,0],43],[[3.6,.9,-4.7],[0,.62,-.9],38],[[-1.7,.62,-2.05],[-.85,.43,-1.4],29],[[-5.2,1,-1],[0,.62,-.2],39],[[4.2,1.2,4.5],[0,.66,.8],39],[[4.7,1.8,-6],[0,.7,0],42],[[3.1,1.02,-5.5],[0,.62,-.5],42],[[-4.5,1.45,5.3],[0,.66,.5],43]];
let tp=0,sp=0,current=-1,drag=0,targetDrag=0,startX=0,startY=0,dragging=false,horizontal=false,lastScroll=0;
function idx(p){for(let i=7;i>=0;i--)if(p>=cuts[i])return i;return 0}function local(p,i){return THREE.MathUtils.clamp((p-cuts[i])/(cuts[i+1]-cuts[i]),0,1)}
function updateScene(i,l){
  if(i!==current){current=i;chapters.forEach((c,n)=>c.classList.toggle('active',n===i));sceneCode.textContent=String(i+1).padStart(2,'0');sceneName.textContent=names[i];giant.textContent=String(i+1).padStart(2,'0');micro.textContent=micros[i];flash.classList.remove('hit');void flash.offsetWidth;flash.classList.add('hit')}
  env.studio.visible=i!==6;env.grid.visible=i===1||i===5;env.track.visible=i===6;env.brakes.visible=i===2;
  key.intensity=[1.15,5.6,3.8,4.6,3.4,6.1,4.3,2.2][i];rim.intensity=[2,4.2,2.6,5.5,4.8,5.1,3.2,3.5][i];redKick.intensity=i===2?15*Math.sin(Math.PI*l):i===7?3:0;amberKick.intensity=i===4?7:i===6?5:0;headSpots.forEach(h=>h.intensity=(i===1||i===6)?22:0);renderer.toneMappingExposure=[.55,.94,.81,.85,.8,1,.84,.68][i];scene.fog.density=i===6?.031:i===7?.023:.016;floorMat.roughness=i===5?.27:.45;if(env.brakes.visible)env.brakes.children.forEach(d=>d.material.opacity=.18+.66*Math.sin(Math.PI*Math.min(1,l*1.25)));
}
function cameraShot(i,l){let p=[...shots[i][0]],t=[...shots[i][1]],f=shots[i][2],roll=0;if(i===0)p=[4.5-.35*l,1.3+.05*l,-5.8+.25*l];if(i===1)p=[3.6-.35*l,.9+.04*l,-4.7+.18*l];if(i===2)p=[-1.7+.08*l,.62,-2.05+.1*l];if(i===3){p=[-5.2,1,-1.5+3*l];t=[0,.62,-1+2*l]}if(i===4)p=[4.2-.2*l,1.2+.07*l,4.5-.28*l];if(i===5)p=[4.7-.65*l,1.8-.12*l,-6+.45*l];if(i===6){p=[3.1-.4*l,1.02+.05*Math.sin(l*Math.PI),-5.5+.2*l];roll=-.025+.012*Math.sin(l*Math.PI*2)}if(i===7)p=[-4.5+.2*l,1.45,5.3-.18*l];const pos=new THREE.Vector3(...p),tar=new THREE.Vector3(...t);const dir=new THREE.Vector3().subVectors(tar,pos).normalize(),right=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0)).normalize();tar.addScaledVector(right,drag*.9);camera.position.lerp(pos,.095);const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position,tar,new THREE.Vector3(0,1,0)));camera.quaternion.slerp(q,.11);camera.rotateZ(roll);camera.fov+=(f-camera.fov)*.08;camera.updateProjectionMatrix()}
function read(){const m=Math.max(1,document.documentElement.scrollHeight-innerHeight);tp=THREE.MathUtils.clamp(scrollY/m,0,1);targetDrag=0;if(scrollY!==lastScroll){gesture.classList.add('hide');lastScroll=scrollY}}addEventListener('scroll',read,{passive:true});read();
canvas.addEventListener('touchstart',e=>{gesture.classList.add('hide');if(!e.touches[0])return;startX=e.touches[0].clientX;startY=e.touches[0].clientY;dragging=true;horizontal=false},{passive:true});
canvas.addEventListener('touchmove',e=>{if(!dragging||!e.touches[0])return;const dx=e.touches[0].clientX-startX,dy=e.touches[0].clientY-startY;if(!horizontal&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.18)horizontal=true;if(horizontal){e.preventDefault();targetDrag=THREE.MathUtils.clamp(dx/innerWidth,-.8,.8)}},{passive:false});
canvas.addEventListener('touchend',()=>{dragging=false;horizontal=false;targetDrag*=.4},{passive:true});canvas.addEventListener('pointerdown',e=>{gesture.classList.add('hide');if(e.pointerType==='touch')return;dragging=true;startX=e.clientX});canvas.addEventListener('pointermove',e=>{if(dragging&&e.pointerType!=='touch')targetDrag=THREE.MathUtils.clamp((e.clientX-startX)/innerWidth,-.8,.8)});addEventListener('pointerup',()=>{dragging=false;targetDrag*=.4});

const clock=new THREE.Clock();let last=0;function loop(t){requestAnimationFrame(loop);if(MOBILE&&t-last<30)return;last=t;const dt=Math.min(.05,clock.getDelta());sp+=(tp-sp)*.065;drag+=(targetDrag-drag)*.12;if(!dragging)targetDrag*=.9;progress.style.width=(sp*100)+'%';document.documentElement.style.setProperty('--p',sp.toFixed(4));const i=idx(sp),l=local(sp,i);updateScene(i,l);cameraShot(i,l);rpm.textContent=String(Math.round(([800,3400,6100,5200,7000,7600,8400,1200][i]+(i===6?1200*l:0))/50)*50).padStart(4,'0');carRoot.rotation.y+=(0-carRoot.rotation.y)*.07;carRoot.position.x=0;carRoot.rotation.z=0;if(i===0)carRoot.rotation.y=-.06+.05*l;if(i===3)carRoot.position.z=.1*Math.sin(l*Math.PI);if(i===5)carRoot.rotation.y=.08*Math.sin(l*Math.PI);if(i===6){carRoot.position.y=.035+Math.sin(t*.024)*.006;carRoot.rotation.z=Math.sin(t*.018)*.0015;const speed=dt*(22+38*l);env.dashes.forEach(d=>{d.position.z+=speed;if(d.position.z>22)d.position.z-=90});env.gantries.forEach(g=>{g.position.z+=speed*.7;if(g.position.z>28)g.position.z-=84})}else carRoot.position.y=.035;renderer.render(scene,camera)}
requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:780px)').matches?1.15:1.6))},{passive:true});

loadE92().catch(err=>{console.error(err);loader.querySelector('b').textContent='E92 ASSET FAILED';pct.textContent='ERR';});