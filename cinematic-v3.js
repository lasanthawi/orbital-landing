import * as THREE from 'three';

// Wide-shot camera director. It wraps the existing world renderer and replaces only
// the final camera composition, keeping all scene animation and UI logic intact.
const originalRender=THREE.WebGLRenderer.prototype.render;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const mobile=()=>innerWidth<780;

const subjects=[
  {c:V(0,-2,0),r:34},
  {c:V(-5,1.8,-47),r:27},
  {c:V(4,-1.4,-68),r:14},
  {c:V(4,-1,-112),r:31},
  {c:V(-7,1,-190),r:40},
  {c:V(12,0,-305),r:86},
  {c:V(-8,0,-445),r:126},
  {c:V(2,0,-650),r:145}
];

const shots=[
  {p:0,pos:[0,10,40],look:[-5,-2,0],roll:0},
  {p:.075,pos:[18,12,36],look:[-5,-2,0],roll:-.006},
  {p:.155,pos:[30,14,26],look:[-4,-2,0],roll:-.009},
  {p:.18,pos:[20,12,-23],look:[-1,1.8,-47],roll:-.008},
  {p:.225,pos:[4,16,-18],look:[-1,1.8,-47],roll:.004},
  {p:.285,pos:[-17,10,-28],look:[-1,1.8,-47],roll:.008},
  {p:.315,pos:[21,6,-50],look:[2,-1.4,-68],roll:.006},
  {p:.365,pos:[30,10,-80],look:[7,-1,-112],roll:-.004},
  {p:.405,pos:[30,9,-89],look:[9,-1,-112],roll:-.007},
  {p:.45,pos:[39,7,-112],look:[9,-1,-112],roll:0},
  {p:.495,pos:[29,5,-137],look:[9,-1,-112],roll:.006},
  {p:.515,pos:[28,13,-165],look:[-13,1,-190],roll:.006},
  {p:.565,pos:[38,9,-190],look:[-13,1,-190],roll:0},
  {p:.615,pos:[28,6,-216],look:[-13,1,-190],roll:-.006},
  {p:.635,pos:[103,22,-265],look:[20,0,-305],roll:-.007},
  {p:.69,pos:[111,16,-305],look:[20,0,-305],roll:0},
  {p:.755,pos:[95,18,-351],look:[20,0,-305],roll:.007},
  {p:.77,pos:[105,34,-332],look:[-8,0,-445],roll:.008},
  {p:.805,pos:[150,26,-404],look:[-8,0,-445],roll:.004},
  {p:.84,pos:[152,16,-486],look:[-8,0,-445],roll:-.004},
  {p:.875,pos:[105,-12,-558],look:[-8,0,-445],roll:-.008},
  {p:.905,pos:[48,24,-535],look:[0,3,-570],roll:-.004},
  {p:.935,pos:[122,48,-542],look:[2,0,-650],roll:.005},
  {p:.965,pos:[171,32,-650],look:[2,0,-650],roll:0},
  {p:.985,pos:[122,18,-770],look:[2,0,-650],roll:-.005},
  {p:1,pos:[72,12,-795],look:[2,0,-650],roll:0}
];

function smoother(x){x=THREE.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);}
function sample(p){
  let a=shots[0],b=shots.at(-1);
  for(let i=0;i<shots.length-1;i++) if(p>=shots[i].p&&p<=shots[i+1].p){a=shots[i];b=shots[i+1];break;}
  const q=smoother((p-a.p)/(b.p-a.p));
  return {pos:V(...a.pos).lerp(V(...b.pos),q),look:V(...a.look).lerp(V(...b.look),q),roll:THREE.MathUtils.lerp(a.roll,b.roll,q)};
}

function enforceEnvelope(pos){
  for(const s of subjects){
    const off=pos.clone().sub(s.c),d=off.length();
    if(d<s.r){if(d<.001) off.set(1,.15,.3);pos.copy(s.c).add(off.normalize().multiplyScalar(s.r));}
  }
  return pos;
}

let wideProgress=0,last=performance.now();
const widePos=V(...shots[0].pos),wideLook=V(...shots[0].look);

THREE.WebGLRenderer.prototype.render=function(scene,camera){
  const now=performance.now(),dt=Math.min(.034,(now-last)/1000||.016);last=now;
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const target=THREE.MathUtils.clamp((scrollY||0)/max,0,1);
  const response=mobile()?.018:.02;
  wideProgress+=THREE.MathUtils.clamp((target-wideProgress)*response,-.0017,.0017);
  const s=sample(wideProgress);
  const posA=1-Math.pow(.0016,dt),lookA=1-Math.pow(.0024,dt);
  widePos.lerp(s.pos,posA*.30);wideLook.lerp(s.look,lookA*.26);enforceEnvelope(widePos);
  camera.position.copy(widePos);camera.up.set(Math.sin(s.roll),Math.cos(s.roll),0);camera.lookAt(wideLook);
  const wantedFov=mobile()?58:50;
  if(Math.abs(camera.fov-wantedFov)>.01){camera.fov=wantedFov;camera.updateProjectionMatrix();}
  return originalRender.call(this,scene,camera);
};

await import('./cinematic-v2.js');
await import('./nasa-models.js');
