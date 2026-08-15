import * as THREE from 'three';

const originalGetPointAt=THREE.CatmullRomCurve3.prototype.getPointAt;
const subjects=[
  {c:new THREE.Vector3(0,-1,0),r:18},
  {c:new THREE.Vector3(-4,1.2,-38),r:10},
  {c:new THREE.Vector3(3,-1,-92),r:15},
  {c:new THREE.Vector3(-6,1,-165),r:20},
  {c:new THREE.Vector3(10,0,-262),r:48},
  {c:new THREE.Vector3(-6,0,-382),r:62},
  {c:new THREE.Vector3(0,0,-620),r:58}
];

function isCameraCurve(curve){
  const p=curve?.points?.[0];
  return curve?.points?.length===35 && p && p.z>10;
}

THREE.CatmullRomCurve3.prototype.getPointAt=function(u,target){
  const out=originalGetPointAt.call(this,u,target);
  if(!isCameraCurve(this)) return out;

  for(const s of subjects){
    const offset=out.clone().sub(s.c);
    const d=offset.length();
    if(d<s.r){
      if(d<0.001) offset.set(1,.18,.35);
      offset.normalize().multiplyScalar(s.r);
      out.copy(s.c).add(offset);
    }
  }
  return out;
};
