import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js';

const previousRender=THREE.WebGLRenderer.prototype.render;
const loader=new GLTFLoader();
let initialized=false, envMap=null;

const urls={
  iss:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/international-space-station-%28iss%29-%28b%29/International%20Space%20Station%20%28ISS%29%20%28B%29.glb',
  astronaut:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/extravehicular-mobility-unit/Extravehicular%20Mobility%20Unit.glb',
  shuttle:'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/space-shuttle-%28d%29/Space%20Shuttle%20%28D%29.glb'
};

function near(obj,x,y,z,tol=3){return obj?.position&&Math.abs(obj.position.x-x)<tol&&Math.abs(obj.position.y-y)<tol&&Math.abs(obj.position.z-z)<tol;}
function hideProcedural(scene){scene.children.forEach(obj=>{if(near(obj,-5,1.8,-47,4))obj.visible=false;if(near(obj,-1.9,.15,-45.6,2))obj.visible=false;if(near(obj,4,-1.4,-68,4))obj.visible=false;if(obj?.geometry?.type==='TubeGeometry')obj.visible=false;});}

function textureCanvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
const solarTex=textureCanvas(512,256,(g,w,h)=>{g.fillStyle='#06101f';g.fillRect(0,0,w,h);const grad=g.createLinearGradient(0,0,w,h);grad.addColorStop(0,'rgba(35,86,143,.34)');grad.addColorStop(.5,'rgba(4,20,47,.1)');grad.addColorStop(1,'rgba(18,58,110,.32)');g.fillStyle=grad;g.fillRect(0,0,w,h);g.strokeStyle='rgba(101,157,214,.45)';g.lineWidth=1;for(let x=0;x<=w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=0;y<=h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}g.strokeStyle='rgba(199,126,48,.35)';for(let x=16;x<w;x+=64){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}});
solarTex.repeat.set(1.5,1.5);
const roughTex=textureCanvas(256,256,(g,w,h)=>{const id=g.createImageData(w,h);for(let i=0;i<id.data.length;i+=4){const v=160+Math.random()*70;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}g.putImageData(id,0,0);});
roughTex.colorSpace=THREE.NoColorSpace;roughTex.repeat.set(5,5);

function ensureEnvironment(renderer){if(envMap)return;const pmrem=new THREE.PMREMGenerator(renderer);envMap=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose();}
function originalColor(mat){return mat?.color?.isColor?mat.color.clone():new THREE.Color(0xbfc4c3);}
function profileMesh(mesh){
  const geo=mesh.geometry;if(!geo)return 'metal';geo.computeBoundingBox();const b=geo.boundingBox;if(!b)return 'metal';const s=new THREE.Vector3();b.getSize(s);const dims=[Math.abs(s.x),Math.abs(s.y),Math.abs(s.z)].sort((a,b)=>a-b);const flat=dims[0]/Math.max(dims[2],1e-6)<.045;const name=((mesh.name||'')+' '+(mesh.material?.name||'')).toLowerCase();const c=originalColor(mesh.material);const blueBias=c.b>c.r*1.12&&c.b>c.g*.98;
  if(/solar|array|photovolta|panel/.test(name)||(flat&&blueBias))return 'solar';
  if(/window|glass|visor|cupola/.test(name))return 'glass';
  if(/gold|foil|kapton|thermal|mli/.test(name)||(c.r>.55&&c.g>.34&&c.g<c.r*.82&&c.b<c.g*.72))return 'gold';
  if(flat&&c.r>.55&&c.g>.55&&c.b>.55)return 'radiator';
  if(/black|carbon|nozzle|engine|rcs/.test(name)||(c.r<.18&&c.g<.2&&c.b<.22))return 'dark';
  return 'metal';
}
function makeMaterial(mesh,profile){const hasUV=!!mesh.geometry?.attributes?.uv;const base={envMap,envMapIntensity:.55,side:THREE.FrontSide};
  if(profile==='solar')return new THREE.MeshPhysicalMaterial({...base,color:0x07152b,map:hasUV?solarTex:null,metalness:.22,roughness:.28,clearcoat:1,clearcoatRoughness:.12,sheen:1,sheenColor:new THREE.Color(0x173c72),sheenRoughness:.24});
  if(profile==='glass')return new THREE.MeshPhysicalMaterial({...base,color:0x183044,metalness:.08,roughness:.08,clearcoat:1,clearcoatRoughness:.02,transmission:.12,transparent:true,opacity:.92});
  if(profile==='gold')return new THREE.MeshPhysicalMaterial({...base,color:0xb77b25,metalness:.72,roughness:.29,clearcoat:.3,clearcoatRoughness:.16,roughnessMap:hasUV?roughTex:null});
  if(profile==='radiator')return new THREE.MeshPhysicalMaterial({...base,color:0xe6e7e2,metalness:.08,roughness:.58,clearcoat:.12,roughnessMap:hasUV?roughTex:null});
  if(profile==='dark')return new THREE.MeshPhysicalMaterial({...base,color:0x161b20,metalness:.62,roughness:.32,clearcoat:.35,clearcoatRoughness:.18});
  const c=originalColor(mesh.material);if(c.r>.88&&c.g>.88&&c.b>.88)c.set(0xcbd0cf);else c.lerp(new THREE.Color(0xaeb7ba),.35);return new THREE.MeshPhysicalMaterial({...base,color:c,metalness:.38,roughness:.38,clearcoat:.2,clearcoatRoughness:.22,roughnessMap:hasUV?roughTex:null});
}
function applyRealMaterials(root){root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.layers.enable(1);const p=profileMesh(o);o.material=makeMaterial(o,p);o.material.needsUpdate=true;});}
function fitModel(root,targetSize){const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();box.getSize(size);root.scale.multiplyScalar(targetSize/(Math.max(size.x,size.y,size.z)||1));const box2=new THREE.Box3().setFromObject(root),center=new THREE.Vector3();box2.getCenter(center);root.position.sub(center);applyRealMaterials(root);return root;}
function mount(scene,url,{position,rotation=[0,0,0],size,name}){const holder=new THREE.Group();holder.name=name;holder.position.set(...position);holder.rotation.set(...rotation);holder.visible=false;holder.layers.enable(1);scene.add(holder);loader.load(url,gltf=>{holder.add(fitModel(gltf.scene,size));holder.userData.loaded=true;holder.visible=true;},undefined,err=>console.error(`NASA model failed: ${name}`,url,err));return holder;}
function addModelLights(scene){const key=new THREE.DirectionalLight(0xfff3dd,7.5);key.position.set(-18,16,24);key.layers.set(1);scene.add(key);const bounce=new THREE.DirectionalLight(0x6fa9d7,1.15);bounce.position.set(10,-18,8);bounce.layers.set(1);scene.add(bounce);const rim=new THREE.DirectionalLight(0xb9d8ff,.75);rim.position.set(22,8,-30);rim.layers.set(1);scene.add(rim);}
function init(scene,renderer){initialized=true;ensureEnvironment(renderer);hideProcedural(scene);addModelLights(scene);const iss=mount(scene,urls.iss,{position:[-5,1.8,-47],rotation:[.12,.34,-.08],size:13.5,name:'NASA ISS'});const astronaut=mount(scene,urls.astronaut,{position:[-1.6,-.3,-45.2],rotation:[0,.65,.45],size:1.65,name:'NASA EMU'});const shuttle=mount(scene,urls.shuttle,{position:[4,-1.4,-68],rotation:[0,-.58,.08],size:7.4,name:'NASA Shuttle'});const start=performance.now();function animate(){const t=(performance.now()-start)*.001;if(iss.userData.loaded){iss.rotation.y=.34+Math.sin(t*.16)*.018;iss.rotation.z=-.08+Math.sin(t*.12)*.006;}if(astronaut.userData.loaded){astronaut.position.y=-.3+Math.sin(t*.4)*.06;astronaut.rotation.y=.65+Math.sin(t*.17)*.055;}if(shuttle.userData.loaded){shuttle.position.y=-1.4+Math.sin(t*.2)*.09;shuttle.rotation.z=.08+Math.sin(t*.14)*.006;}requestAnimationFrame(animate);}animate();}
THREE.WebGLRenderer.prototype.render=function(scene,camera){if(!initialized)init(scene,this);camera.layers.enable(1);return previousRender.call(this,scene,camera);};
