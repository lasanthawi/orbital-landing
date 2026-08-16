import * as THREE from 'three';

const baseRender=THREE.WebGLRenderer.prototype.render;
let installed=false;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

const metal=(c=0xcfd3d2,m=.78,r=.24)=>new THREE.MeshPhysicalMaterial({color:c,metalness:m,roughness:r,clearcoat:.5,clearcoatRoughness:.18});
const matte=(c=0xd9d7cf,r=.62)=>new THREE.MeshStandardMaterial({color:c,metalness:.08,roughness:r});
const glow=(c=0xbaff35,i=1.8)=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:i,roughness:.35});
const glass=(c=0x7bc8e8)=>new THREE.MeshPhysicalMaterial({color:c,metalness:.1,roughness:.06,transmission:.45,transparent:true,opacity:.72,clearcoat:1});
const dark=metal(0x171c20,.72,.27), white=metal(0xd9dedc,.55,.3), gold=metal(0xb78a3c,.55,.27), red=matte(0x9a251f,.46);

function add(scene,o,p){o.position.set(...p);scene.add(o);return o;}
function box(s,m=white){return new THREE.Mesh(new THREE.BoxGeometry(...s),m)}
function cyl(rt,rb,h,m=white,seg=20){return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m)}
function sphere(r,m=white,seg=24){return new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.max(12,seg/2)),m)}
function light(scene,p,c=0xbaff35,intensity=1,dist=18){const l=new THREE.PointLight(c,intensity,dist,2);l.position.set(...p);scene.add(l);return l}

function americanFlag(){
 const g=new THREE.Group();
 const pole=cyl(.025,.025,2.2,metal(0xb9bdba,.8,.28),10);pole.position.y=1.1;g.add(pole);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=144;const x=canvas.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,256,144);
 for(let i=0;i<13;i++){x.fillStyle=i%2===0?'#b22234':'#fff';x.fillRect(0,i*144/13,256,144/13+1)}x.fillStyle='#3c3b6e';x.fillRect(0,0,104,78);
 x.fillStyle='#fff';for(let r=0;r<5;r++)for(let c=0;c<6;c++){x.beginPath();x.arc(9+c*16+(r%2)*7,8+r*14,2.1,0,Math.PI*2);x.fill()}
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.45,.82,14,6),new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:.72}));flag.position.set(.73,1.72,0);g.add(flag);
 return g;
}

function lunarLander(){
 const g=new THREE.Group();const body=cyl(.7,.72,.75,gold,8);body.position.y=.9;g.add(body);
 const top=cyl(.44,.58,.4,white,8);top.position.y=1.46;g.add(top);
 for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;const leg=cyl(.028,.028,1.35,white,8);leg.rotation.z=Math.PI/3;leg.rotation.y=-a;leg.position.set(Math.cos(a)*.48,.5,Math.sin(a)*.48);g.add(leg);const foot=cyl(.15,.15,.035,gold,12);foot.position.set(Math.cos(a)*1.02,.02,Math.sin(a)*1.02);g.add(foot)}
 const dish=new THREE.Mesh(new THREE.SphereGeometry(.28,18,10,0,Math.PI*2,0,Math.PI/2),white);dish.rotation.x=-Math.PI/2;dish.position.set(.2,1.82,.05);g.add(dish);return g;
}

function lunarOutpost(){
 const g=new THREE.Group();
 for(let i=0;i<4;i++){const dome=sphere(.45,glass,24);dome.scale.y=.55;dome.position.set((i-1.5)*1.15,.2,(i%2-.5)*.8);g.add(dome);const base=cyl(.52,.56,.16,dark,20);base.position.set(dome.position.x,.03,dome.position.z);g.add(base)}
 const hub=cyl(.65,.7,.3,white,20);hub.position.y=.15;g.add(hub);
 for(let i=0;i<6;i++){const panel=box([.78,.025,.38],metal(0x112c55,.22,.18));panel.position.set(-2.3+i*.92,.06,1.4);panel.rotation.x=-.18;g.add(panel)}
 for(let i=0;i<7;i++){const beacon=sphere(.035,glow(0x9eefff,2.7),10);beacon.position.set(-1.8+i*.6,.12,-1.25+(i%2)*.12);g.add(beacon)}
 return g;
}

function martianCity(){
 const g=new THREE.Group();
 // pressure domes and central habitat towers
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=1.7+(i%3)*.5;const dome=sphere(.28+(i%4)*.05,glass,20);dome.scale.y=.55;dome.position.set(Math.cos(a)*r,.12,Math.sin(a)*r*.55);g.add(dome);const ring=new THREE.Mesh(new THREE.TorusGeometry(.33+(i%4)*.05,.025,8,24),white);ring.rotation.x=Math.PI/2;ring.position.set(dome.position.x,.08,dome.position.z);g.add(ring)}
 for(let i=0;i<5;i++){const tower=cyl(.16,.22,.8+i*.16,white,14);tower.position.set(-.8+i*.4,.48+i*.08,-.15+(i%2)*.35);g.add(tower);const crown=sphere(.13,glow(0x8ed8ff,2.4),12);crown.position.set(tower.position.x,tower.position.y+.5+i*.08,tower.position.z);g.add(crown)}
 // solar farm
 for(let x=0;x<7;x++)for(let z=0;z<3;z++){const p=box([.55,.018,.22],metal(0x152b4d,.3,.16));p.position.set(-3+x*.65,.04,1.55+z*.28);p.rotation.x=-.16;g.add(p)}
 // landing pads and moving route lights
 for(let i=0;i<3;i++){const pad=cyl(.55,.55,.025,dark,28);pad.position.set(2.4+i*.75,.03,-1.1+i*.35);g.add(pad);const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.018,6,32),glow(0xffb45f,2.5));ring.rotation.x=Math.PI/2;ring.position.copy(pad.position).y=.055;g.add(ring)}
 return g;
}

function orbitalStation(scale=1){
 const g=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(1.2,.12,12,64),white);ring.rotation.x=Math.PI/2;g.add(ring);
 const core=cyl(.34,.34,2.5,dark,20);core.rotation.z=Math.PI/2;g.add(core);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const arm=box([.08,1.4,.08],white);arm.position.set(Math.cos(a)*.62,Math.sin(a)*.62,0);arm.rotation.z=-a;g.add(arm);const pod=cyl(.2,.2,.52,glass,16);pod.rotation.z=Math.PI/2;pod.position.set(Math.cos(a)*1.35,Math.sin(a)*1.35,0);g.add(pod)}
 const axis=cyl(.18,.18,2.8,gold,16);axis.rotation.x=Math.PI/2;g.add(axis);g.scale.setScalar(scale);return g;
}

function companionShip(){
 const g=new THREE.Group();const hull=cyl(.32,.22,2.9,white,20);hull.rotation.z=Math.PI/2;g.add(hull);const nose=cyl(.08,.32,.75,dark,20);nose.rotation.z=-Math.PI/2;nose.position.x=1.78;g.add(nose);
 for(const s of[-1,1]){const boom=box([1.5,.045,.05],white);boom.position.set(-.2,s*.68,0);g.add(boom);const panel=box([1.7,.025,.5],metal(0x102d57,.25,.16));panel.position.set(-.3,s*1.05,0);g.add(panel)}
 for(let i=-1;i<=1;i++){const e=cyl(.07,.11,.28,dark,10);e.rotation.z=Math.PI/2;e.position.set(-1.65,i*.18,0);g.add(e);const lamp=sphere(.065,glow(0x75cfff,4),10);lamp.position.set(-1.86,i*.18,0);g.add(lamp)}return g;
}

function install(scene){
 installed=true;
 // Moon legacy site. Positioned on the near-facing limb for the current camera choreography.
 const moonSite=new THREE.Group();moonSite.position.set(8.1,-3.9,-108.4);moonSite.rotation.set(-.18,.45,.06);moonSite.scale.setScalar(.42);moonSite.add(americanFlag(),lunarLander());const out=lunarOutpost();out.position.set(3.2,.02,-.8);moonSite.add(out);scene.add(moonSite);light(scene,[8.7,-2.9,-108],0xc8e9ff,.55,9);

 // Mars civilization, exaggerated slightly for readable discovery from the wide camera.
 const city=martianCity();city.position.set(-1.2,-3.7,-184);city.rotation.set(-.32,-.5,.08);city.scale.setScalar(.78);scene.add(city);light(scene,[-1,-2.2,-183.5],0xffa15e,1.4,14);light(scene,[-2.8,-2.5,-184],0x74cfff,.8,10);

 // Europa research station and probe.
 const europaStation=orbitalStation(.75);europaStation.position.set(-16,7.8,-301);europaStation.rotation.set(.4,.3,.2);scene.add(europaStation);const probe=companionShip();probe.scale.setScalar(.26);probe.position.set(-17.8,5.4,-302.5);probe.rotation.set(.1,-.8,.15);scene.add(probe);light(scene,[-16,7.8,-301],0x93dfff,.7,12);

 // Saturn-era expansion, a large ring station and traffic silhouettes.
 const satStation=orbitalStation(2.1);satStation.position.set(24,13,-425);satStation.rotation.set(.55,.25,-.18);scene.add(satStation);light(scene,[24,13,-425],0xbaff35,.9,24);
 for(let i=0;i<4;i++){const ship=companionShip();ship.scale.setScalar(.45-i*.045);ship.position.set(18+i*4,8+i*1.3,-422-i*4);ship.rotation.set(.08,-.72+i*.09,.06);scene.add(ship)}

 // Reappearing companion craft connects the entire story.
 const waypoints=[[12,7,-80,.55],[13,1,-157,.62],[49,11,-282,.7],[52,18,-397,.78],[47,8,-548,.86]];
 for(const [x,y,z,s] of waypoints){const ship=companionShip();ship.scale.setScalar(s);ship.position.set(x,y,z);ship.rotation.set(.04,-.72,.03);scene.add(ship)}

 // Colony lights visible on Mars before geometry resolves.
 for(let i=0;i<28;i++){const l=sphere(.035+(i%3)*.012,glow(i%4?0xffb66f:0x85d9ff,3.2),8);const a=i/28*Math.PI*2,r=4.5+Math.sin(i*2.1)*1.1;l.position.set(-7+Math.cos(a)*r*.75,1+Math.sin(i*.7)*.45,-190+Math.sin(a)*r*.3);scene.add(l)}
}

THREE.WebGLRenderer.prototype.render=function(scene,camera){if(!installed)install(scene);return baseRender.call(this,scene,camera)};
