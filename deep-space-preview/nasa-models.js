import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';

const previousRender=THREE.WebGLRenderer.prototype.render;
const loader=new GLTFLoader();
let initialized=false;

const urls={
  iss:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/international-space-station-%28iss%29-%28b%29/International%20Space%20Station%20%28ISS%29%20%28B%29.glb',
  astronaut:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/extravehicular-mobility-unit/Extravehicular%20Mobility%20Unit.glb',
  shuttle:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/space-shuttle-%28d%29/Space%20Shuttle%20%28D%29.glb'
};

function near(obj,x,y,z,tol=3){return obj?.position&&Math.abs(obj.position.x-x)<tol&&Math.abs(obj.position.y-y)<tol&&Math.abs(obj.position.z-z)<tol;}
function hideProcedural(scene){scene.children.forEach(obj=>{if(near(obj,-5,1.8,-47,4)) obj.visible=false;if(near(obj,-1.9,.15,-45.6,2)) obj.visible=false;if(near(obj,4,-1.4,-68,4)) obj.visible=false;if(obj?.geometry?.type==='TubeGeometry') obj.visible=false;});}
function fitModel(root,targetSize){const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();box.getSize(size);root.scale.multiplyScalar(targetSize/(Math.max(size.x,size.y,size.z)||1));const box2=new THREE.Box3().setFromObject(root),center=new THREE.Vector3();box2.getCenter(center);root.position.sub(center);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.envMapIntensity=.9;o.material.needsUpdate=true;}}});return root;}
function mount(scene,url,{position,rotation=[0,0,0],size,name}){const holder=new THREE.Group();holder.name=name;holder.position.set(...position);holder.rotation.set(...rotation);holder.visible=false;scene.add(holder);loader.load(url,gltf=>{holder.add(fitModel(gltf.scene,size));holder.userData.loaded=true;holder.visible=true;},undefined,err=>console.error(`NASA model failed: ${name}`,url,err));return holder;}
function init(scene){initialized=true;hideProcedural(scene);const iss=mount(scene,urls.iss,{position:[-5,1.8,-47],rotation:[.12,.34,-.08],size:12.8,name:'NASA ISS'});const astronaut=mount(scene,urls.astronaut,{position:[-1.6,-.3,-45.2],rotation:[0,.65,.45],size:1.65,name:'NASA EMU'});const shuttle=mount(scene,urls.shuttle,{position:[4,-1.4,-68],rotation:[0,-.58,.08],size:7.4,name:'NASA Shuttle'});const start=performance.now();function animate(){const t=(performance.now()-start)*.001;if(iss.userData.loaded){iss.rotation.y=.34+Math.sin(t*.18)*.025;iss.rotation.z=-.08+Math.sin(t*.13)*.008;}if(astronaut.userData.loaded){astronaut.position.y=-.3+Math.sin(t*.45)*.08;astronaut.rotation.y=.65+Math.sin(t*.2)*.08;}if(shuttle.userData.loaded){shuttle.position.y=-1.4+Math.sin(t*.24)*.12;shuttle.rotation.z=.08+Math.sin(t*.17)*.008;}requestAnimationFrame(animate);}animate();}
THREE.WebGLRenderer.prototype.render=function(scene,camera){if(!initialized)init(scene);return previousRender.call(this,scene,camera);};
