import * as THREE from 'three';

const subjects=[
  {c:new THREE.Vector3(0,-2,0),r:26,focus:34},
  {c:new THREE.Vector3(-5,1.8,-47),r:18,focus:24},
  {c:new THREE.Vector3(4,-1.4,-68),r:14,focus:20},
  {c:new THREE.Vector3(4,-1,-112),r:26,focus:34},
  {c:new THREE.Vector3(-7,1,-190),r:34,focus:44},
  {c:new THREE.Vector3(12,0,-305),r:72,focus:92},
  {c:new THREE.Vector3(-8,0,-445),r:96,focus:118},
  {c:new THREE.Vector3(2,0,-650),r:90,focus:118}
];
const originalLookAt=THREE.PerspectiveCamera.prototype.lookAt;
const target=new THREE.Vector3();
THREE.PerspectiveCamera.prototype.lookAt=function(x,y,z){
  if(x?.isVector3) target.copy(x); else target.set(x,y,z);
  let active=null,best=Infinity;
  for(const s of subjects){const d=target.distanceTo(s.c);if(d<s.focus&&d<best){active=s;best=d;}}
  if(active){const offset=this.position.clone().sub(active.c),d=offset.length();if(d<active.r){if(d<.001)offset.set(1,.18,.4);offset.normalize().multiplyScalar(active.r);this.position.copy(active.c).add(offset);}}
  return originalLookAt.call(this,target);
};
