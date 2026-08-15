import * as THREE from 'three';

const canvas=document.getElementById('world');
const fallback=document.getElementById('fallback');
const loader=document.getElementById('loader');
const loaderPct=document.getElementById('loaderPct');
const railFill=document.getElementById('railFill');
const mobileFill=document.getElementById('mobileFill');
const railScene=document.getElementById('railScene');
const sceneCode=document.getElementById('sceneCode');
const distance=document.getElementById('distance');
const hint=document.getElementById('hint');
const moments=[...document.querySelectorAll('.moment')];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=()=>innerWidth<780;

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile(),powerPreference:'high-performance'});}catch(err){fallback.hidden=false;throw err;}
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile()?1.25:1.65));renderer.setSize(innerWidth,innerHeight,false);}
resize();

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x010205);
const camera=new THREE.PerspectiveCamera(mobile()?64:53,innerWidth/innerHeight,.08,1100);
const ambient=new THREE.HemisphereLight(0x7fa8c7,0x020204,.58);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xfff7e8,5.8);sun.position.set(-30,18,34);scene.add(sun);
const cold=new THREE.DirectionalLight(0x6bb9ff,1.4);cold.position.set(20,-10,-20);scene.add(cold);

const manager=new THREE.LoadingManager();
manager.onProgress=(u,l,t)=>loaderPct.textContent=String(Math.round(l/Math.max(t,1)*100)).padStart(2,'0');
manager.onLoad=()=>setTimeout(()=>loader.classList.add('done'),250);
const textures=new THREE.TextureLoader(manager);
setTimeout(()=>loader.classList.add('done'),4500);

function canvasTexture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function glowTexture(){return canvasTexture(128,128,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.15,'rgba(255,255,255,.9)');r.addColorStop(.5,'rgba(255,255,255,.16)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});}
const glowTex=glowTexture();
function sprite(color,size,opacity=.8){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.set(size,size,1);return s;}

function starField(){const count=mobile()?2400:5200,pos=new Float32Array(count*3),col=new Float32Array(count*3);for(let i=0;i<count;i++){const z=30-Math.random()*720;const r=18+Math.random()*120;const a=Math.random()*Math.PI*2;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=Math.sin(a)*r*.7;pos[i*3+2]=z;const b=.35+Math.random()*.65;col[i*3]=b*(.78+Math.random()*.18);col[i*3+1]=b*(.82+Math.random()*.16);col[i*3+2]=b;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:mobile()?.055:.065,vertexColors:true,transparent:true,opacity:.88,sizeAttenuation:true}));scene.add(pts);return pts;}
const stars=starField();

function atmosphere(radius,color=0x4da3ff,opacity=.16){return new THREE.Mesh(new THREE.SphereGeometry(radius,64,42),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));}
function planet(radius,color,segments=72){return new THREE.Mesh(new THREE.SphereGeometry(radius,mobile()?48:segments,mobile()?32:48),new THREE.MeshStandardMaterial({color,roughness:.92,metalness:0}));}

// Earth
const earth=new THREE.Group();scene.add(earth);earth.position.set(0,-1,0);
const earthSurface=planet(8,0x244d6a,96);earth.add(earthSurface);
textures.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',t=>{earthSurface.material.map=t;earthSurface.material.color.set(0xffffff);earthSurface.material.needsUpdate=true;},undefined,()=>{});
textures.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',t=>{earthSurface.material.normalMap=t;earthSurface.material.normalScale.set(.45,.45);earthSurface.material.needsUpdate=true;},undefined,()=>{});
const clouds=new THREE.Mesh(new THREE.SphereGeometry(8.08,mobile()?48:80,mobile()?32:48),new THREE.MeshPhongMaterial({color:0xe9f4fa,transparent:true,opacity:.12,depthWrite:false}));earth.add(clouds);
textures.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png',t=>{clouds.material.map=t;clouds.material.alphaMap=t;clouds.material.opacity=.24;clouds.material.needsUpdate=true;},undefined,()=>{});
earth.add(atmosphere(8.42,0x3c9dff,.18));const earthHalo=sprite(0x4b9fff,23,.12);earth.add(earthHalo);

// Cloud cards that pass near the camera during departure
const cloudGroup=new THREE.Group();scene.add(cloudGroup);
const cloudTex=canvasTexture(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<22;i++){const x=Math.random()*w,y=30+Math.random()*68,r=16+Math.random()*36;const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(255,255,255,.22)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}});
for(let i=0;i<(mobile()?8:14);i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(5+Math.random()*7,2.5+Math.random()*4),new THREE.MeshBasicMaterial({map:cloudTex,transparent:true,opacity:.25+Math.random()*.2,depthWrite:false,side:THREE.DoubleSide}));m.position.set((Math.random()-.5)*18,(Math.random()-.5)*10,7+Math.random()*7);m.rotation.z=Math.random()*Math.PI;cloudGroup.add(m);}

// ISS and astronaut
function makeISS(){const g=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xe3e6e3,metalness:.55,roughness:.3});const dark=new THREE.MeshStandardMaterial({color:0x222a2d,metalness:.7,roughness:.24});const blue=new THREE.MeshStandardMaterial({color:0x183e70,metalness:.38,roughness:.3,emissive:0x07182d,emissiveIntensity:.65});const spine=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,5.3,10),white);spine.rotation.z=Math.PI/2;g.add(spine);for(let i=-2;i<=2;i++){const mod=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,1.3,14),i===0?dark:white);mod.rotation.z=Math.PI/2;mod.position.x=i*1.05;g.add(mod);}for(const side of[-1,1])for(const x of[-2.15,2.15]){const panel=new THREE.Mesh(new THREE.BoxGeometry(2.7,.035,.78),blue);panel.position.set(x,side*2,0);panel.rotation.z=side*.03;g.add(panel);const arm=new THREE.Mesh(new THREE.BoxGeometry(.07,1.55,.07),white);arm.position.set(x,side*1.02,0);g.add(arm);}const dish=new THREE.Mesh(new THREE.SphereGeometry(.42,16,8,0,Math.PI*2,0,Math.PI/2),white);dish.rotation.x=Math.PI/2;dish.position.set(.3,.5,.35);g.add(dish);g.scale.setScalar(.88);return g;}
const iss=makeISS();iss.position.set(-4,1.2,-38);iss.rotation.set(.18,.3,-.12);scene.add(iss);
function makeAstronaut(){const g=new THREE.Group();const suit=new THREE.MeshStandardMaterial({color:0xf0f0ea,roughness:.72});const visor=new THREE.MeshPhysicalMaterial({color:0x20160c,metalness:.65,roughness:.1});const body=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.42,5,10),suit);g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),suit);head.position.y=.45;g.add(head);const glass=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),visor);glass.scale.z=.45;glass.position.set(0,.46,.17);g.add(glass);for(const side of[-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.06,.38,4,8),suit);arm.position.set(side*.28,.1,0);arm.rotation.z=side*.65;g.add(arm);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.42,4,8),suit);leg.position.set(side*.12,-.48,0);leg.rotation.z=side*.14;g.add(leg);}g.scale.setScalar(.5);return g;}
const astronaut=makeAstronaut();astronaut.position.set(-1.15,.2,-36.7);astronaut.rotation.z=.55;scene.add(astronaut);
const tetherCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.15,.2,-36.7),new THREE.Vector3(-2,.6,-37),new THREE.Vector3(-3.1,1,-37.7)]);const tether=new THREE.Mesh(new THREE.TubeGeometry(tetherCurve,28,.012,5,false),new THREE.MeshBasicMaterial({color:0xdfe7e9}));scene.add(tether);

function makeCraft(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.28,1.2,7,14),new THREE.MeshStandardMaterial({color:0xd9deda,metalness:.6,roughness:.26}));body.rotation.z=Math.PI/2;g.add(body);const glass=new THREE.Mesh(new THREE.SphereGeometry(.25,16,12),new THREE.MeshPhysicalMaterial({color:0x7cc4e8,metalness:.15,roughness:.1,transparent:true,opacity:.72}));glass.position.x=.55;g.add(glass);for(const side of[-1,1]){const wing=new THREE.Mesh(new THREE.BoxGeometry(.8,.035,1.15),new THREE.MeshStandardMaterial({color:0x192f48,metalness:.4,roughness:.3}));wing.position.set(-.2,0,side*.8);g.add(wing);}const engine=sprite(0x8edcff,1.15,.55);engine.position.x=-1;engine.rotation.y=Math.PI/2;g.add(engine);return g;}
const craft=makeCraft();craft.position.set(3,-1,-58);craft.rotation.y=-.24;scene.add(craft);

// Moon
const moon=new THREE.Group();moon.position.set(3,-1,-92);scene.add(moon);const moonSurface=planet(5.2,0xaaa9a2,80);moon.add(moonSurface);textures.load('https://threejs.org/examples/textures/planets/moon_1024.jpg',t=>{moonSurface.material.map=t;moonSurface.material.bumpMap=t;moonSurface.material.bumpScale=.24;moonSurface.material.color.set(0xffffff);moonSurface.material.needsUpdate=true;},undefined,()=>{});

// Mars
const mars=new THREE.Group();mars.position.set(-6,1,-165);scene.add(mars);const marsTex=canvasTexture(768,384,(g,w,h)=>{g.fillStyle='#8c3c22';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){const a=Math.random()*.2+.03;g.fillStyle=`rgba(${80+Math.random()*90|0},${25+Math.random()*45|0},${15+Math.random()*30|0},${a})`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,1+Math.random()*15,0,Math.PI*2);g.fill();}g.fillStyle='rgba(240,226,205,.6)';g.fillRect(0,0,w,13);});const marsSurface=planet(7.3,0xb64f2c,80);marsSurface.material.map=marsTex;mars.add(marsSurface);mars.add(atmosphere(7.55,0xe58b5b,.055));

// Jupiter
const jupiter=new THREE.Group();jupiter.position.set(10,0,-262);scene.add(jupiter);const jTex=canvasTexture(1024,512,(g,w,h)=>{const bands=['#d7c0a5','#9f755c','#efe1c9','#ae7b5b','#d8b895','#765647','#e8d2b5','#a8785c','#dfc5a8'];let y=0;for(let i=0;i<bands.length;i++){const bh=h/bands.length*(.7+Math.random()*.6);g.fillStyle=bands[i];g.fillRect(0,y,w,bh+3);for(let q=0;q<14;q++){g.fillStyle=`rgba(255,255,255,${Math.random()*.06})`;g.fillRect(0,y+Math.random()*bh,w,1+Math.random()*3);}y+=bh;}g.fillStyle='rgba(142,54,32,.88)';g.beginPath();g.ellipse(w*.67,h*.62,w*.095,h*.055,0,0,Math.PI*2);g.fill();});const jSurface=planet(18,0xffffff,96);jSurface.material.map=jTex;jSurface.material.roughness=.86;jupiter.add(jSurface);jupiter.add(atmosphere(18.35,0xd8b08a,.045));
const europa=planet(2,0xc9c1a5,48);europa.position.set(-24,4,1);jupiter.add(europa);

// Saturn
const saturn=new THREE.Group();saturn.position.set(-6,0,-382);saturn.rotation.z=-.18;scene.add(saturn);const sTex=canvasTexture(1024,512,(g,w,h)=>{for(let y=0;y<h;y++){const k=.5+.5*Math.sin(y*.065)+.16*Math.sin(y*.22);g.fillStyle=`rgb(${205+k*25|0},${183+k*20|0},${132+k*18|0})`;g.fillRect(0,y,w,1);}});const satSurface=planet(13.5,0xffffff,88);satSurface.material.map=sTex;saturn.add(satSurface);const ringTex=canvasTexture(1024,64,(g,w,h)=>{g.clearRect(0,0,w,h);for(let x=0;x<w;x++){const n=x/w;const alpha=n<.08||n>.96?0:.12+.5*Math.abs(Math.sin(n*44)+Math.sin(n*117))*.5;g.fillStyle=`rgba(226,210,169,${alpha})`;g.fillRect(x,0,1,h);}});const ring=new THREE.Mesh(new THREE.RingGeometry(17,31,mobile()?96:180,1),new THREE.MeshBasicMaterial({map:ringTex,transparent:true,opacity:.84,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=Math.PI/2;saturn.add(ring);
const ringDust=new THREE.Group();saturn.add(ringDust);for(let i=0;i<(mobile()?260:700);i++){const a=Math.random()*Math.PI*2,r=17+Math.random()*14,rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.025+Math.random()*.09,0),new THREE.MeshStandardMaterial({color:0xc8b998,roughness:1}));rock.position.set(Math.cos(a)*r,(Math.random()-.5)*.45,Math.sin(a)*r);ringDust.add(rock);}

// Distant nebulae for deep space
const nebula=new THREE.Group();scene.add(nebula);for(let i=0;i<(mobile()?9:16);i++){const s=sprite(i%3===0?0x895fff:i%3===1?0x3f8dff:0xff7a56,24+Math.random()*36,.025+Math.random()*.035);s.position.set((Math.random()-.5)*100,(Math.random()-.5)*55,-470-Math.random()*95);nebula.add(s);}

// Black hole
const blackHole=new THREE.Group();blackHole.position.set(0,0,-620);scene.add(blackHole);const voidSphere=new THREE.Mesh(new THREE.SphereGeometry(9.5,64,48),new THREE.MeshBasicMaterial({color:0x000000}));blackHole.add(voidSphere);const halo=sprite(0xffa04d,33,.22);blackHole.add(halo);for(let i=0;i<11;i++){const tor=new THREE.Mesh(new THREE.TorusGeometry(12+i*.72,.16+.04*Math.sin(i),8,180),new THREE.MeshBasicMaterial({color:i<4?0xffd19a:i<8?0xff8b37:0xc84d16,transparent:true,opacity:.22+.035*(10-i),blending:THREE.AdditiveBlending,depthWrite:false}));tor.rotation.x=Math.PI/2;tor.scale.y=.27;tor.rotation.z=.1*i;blackHole.add(tor);}const lens1=new THREE.Mesh(new THREE.TorusGeometry(10.4,.08,8,200),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));lens1.scale.y=.94;blackHole.add(lens1);const lens2=lens1.clone();lens2.scale.set(1.05,.64,1.05);lens2.material=lens1.material.clone();lens2.material.opacity=.3;blackHole.add(lens2);
const accretion=new THREE.Group();blackHole.add(accretion);for(let i=0;i<(mobile()?340:850);i++){const a=Math.random()*Math.PI*2,r=11+Math.pow(Math.random(),.7)*21,s=sprite(i%4?0xff9d48:0xffe6b3,.08+Math.random()*.22,.28+Math.random()*.5);s.position.set(Math.cos(a)*r,(Math.random()-.5)*1.2,Math.sin(a)*r);s.userData={a,r,speed:.00008+Math.random()*.00018};accretion.add(s);}

// Camera flight path. Position and gaze use separate splines so the camera can arc around objects.
const P=(x,y,z)=>new THREE.Vector3(x,y,z);
let path,lookPath;
function buildPath(){const m=mobile()?1:1;path=new THREE.CatmullRomCurve3([
P(0,1.4,17),P(1.2,2.6,13),P(4.5,5.5,8),P(8,6,-4),P(7,3,-20),
P(2,2,-31),P(-1,1.5,-35),P(-5,1,-39),P(-1,-.2,-45),P(4,-1,-57),
P(8,1,-72),P(8,1,-84),P(5,-1,-91),P(-2,-3,-99),P(-8,0,-118),
P(-12,4,-146),P(-10,3,-158),P(-2,0,-172),P(8,2,-208),P(20,4,-244),
P(25,1,-259),P(19,-3,-274),P(5,-1,-300),P(-10,3,-337),P(-17,5,-365),
P(-20,1,-382),P(-10,-2,-389),P(4,-1,-402),P(15,3,-438),P(8,-1,-484),
P(-4,2,-535),P(-13,4,-575),P(-15,2,-604),P(-10,-1,-614),P(0,.3,-628)
],false,'catmullrom',.45);lookPath=new THREE.CatmullRomCurve3([
P(0,-1,0),P(0,-1,0),P(0,-1,0),P(0,-1,0),P(0,0,-16),
P(-4,1,-38),P(-4,1,-38),P(-4,1,-38),P(1,0,-52),P(3,-1,-92),
P(3,-1,-92),P(3,-1,-92),P(3,-1,-92),P(3,-1,-92),P(-6,1,-165),
P(-6,1,-165),P(-6,1,-165),P(-6,1,-165),P(10,0,-262),P(10,0,-262),
P(10,0,-262),P(10,0,-262),P(-6,0,-382),P(-6,0,-382),P(-6,0,-382),
P(-6,0,-382),P(-6,0,-382),P(0,0,-435),P(0,0,-500),P(0,0,-545),
P(0,0,-620),P(0,0,-620),P(0,0,-620),P(0,0,-620),P(0,0,-620)
],false,'catmullrom',.45);}
buildPath();

const cuts=[.105,.205,.31,.405,.505,.615,.725,.82,.905,1.001];
const labels=['01 / EARTH','02 / ORBIT','03 / TRANSIT','04 / MOON','05 / MARS','06 / JUPITER','07 / SATURN','08 / DEEP SPACE','09 / UNKNOWN','10 / EVENT HORIZON'];
const km=[0,400,384400,384400,225000000,778000000,1400000000,6000000000,12000000000,26000000000];
function sceneIndex(v){for(let i=0;i<cuts.length;i++)if(v<cuts[i])return i;return cuts.length-1;}
function local(v,a,b){return THREE.MathUtils.clamp((v-a)/(b-a),0,1);}
function smooth(v,a,b){return THREE.MathUtils.smoothstep(v,a,b);}

let target=0,progress=0,velocity=0,pointerX=0,pointerY=0,viewX=0,viewY=0,lastScene=-1;
function readScroll(){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);target=THREE.MathUtils.clamp(scrollY/max,0,1);}
addEventListener('scroll',readScroll,{passive:true});
addEventListener('pointermove',e=>{pointerX=(e.clientX/innerWidth-.5)*2;pointerY=(e.clientY/innerHeight-.5)*2;},{passive:true});
addEventListener('resize',()=>{resize();camera.aspect=innerWidth/innerHeight;camera.fov=mobile()?64:53;camera.updateProjectionMatrix();readScroll();},{passive:true});

function updateWorld(t){earthSurface.rotation.y=-1.35+t*.000025;clouds.rotation.y=-1.25-t*.000012;cloudGroup.children.forEach((c,i)=>{c.position.x+=Math.sin(t*.0001+i)*.002;c.material.opacity=.34*(1-smooth(progress,.12,.18));});
iss.rotation.y=.3+Math.sin(t*.00018)*.05;iss.rotation.z=-.12+Math.sin(t*.00013)*.018;astronaut.rotation.y=t*.00012;astronaut.position.y=.2+Math.sin(t*.0008)*.08;craft.position.x=3+Math.sin(t*.00022)*2.4;craft.position.y=-1+Math.sin(t*.00031)*.55;
moonSurface.rotation.y=t*.00002;marsSurface.rotation.y=t*.000018;jSurface.rotation.y=t*.000035;europa.position.x=-24+Math.sin(t*.00012)*2;satSurface.rotation.y=t*.000018;ringDust.rotation.y=t*.000025;
const deep=smooth(progress,.72,.9);nebula.children.forEach((s,i)=>{s.material.opacity=(.022+(i%4)*.006)*deep;});
blackHole.rotation.z=Math.sin(t*.00006)*.035;accretion.children.forEach(s=>{const a=s.userData.a+t*s.userData.speed,r=s.userData.r;s.position.x=Math.cos(a)*r;s.position.z=Math.sin(a)*r;s.position.y=Math.sin(a*3+s.userData.r)*.35;});
const bh=smooth(progress,.89,1);renderer.toneMappingExposure=THREE.MathUtils.lerp(1.08,.82,bh);stars.material.opacity=THREE.MathUtils.lerp(.88,.44,bh);
}

function updateUI(){const idx=sceneIndex(progress);if(idx!==lastScene){moments.forEach((el,i)=>el.classList.toggle('active',i===idx));sceneCode.textContent=labels[idx];railScene.textContent=String(idx+1).padStart(2,'0');lastScene=idx;}const pct=(progress*100).toFixed(2)+'%';railFill.style.height=pct;mobileFill.style.width=pct;const a=cuts[idx-1]||0,b=cuts[idx],q=local(progress,a,b),value=Math.round(THREE.MathUtils.lerp(km[idx],km[Math.min(idx+1,km.length-1)]||km[idx],q));distance.textContent=value<1000?`${value} KM`:value<1000000?`${(value/1000).toFixed(0)}K KM`:`${(value/1000000).toFixed(value<100000000?1:0)}M KM`;hint.classList.toggle('hide',progress>.028);}

const desired=new THREE.Vector3(),gaze=new THREE.Vector3(),tangent=new THREE.Vector3();
let prevT=performance.now();
function frame(now){const dt=Math.min(.034,(now-prevT)/1000||.016);prevT=now;if(reduce){progress=target;velocity=0;}else{const error=target-progress;velocity+=error*dt*11.5;velocity*=Math.pow(.075,dt);velocity=THREE.MathUtils.clamp(velocity,-.52,.52);progress=THREE.MathUtils.clamp(progress+velocity*dt,0,1);}viewX+=(pointerX-viewX)*(1-Math.pow(.035,dt));viewY+=(pointerY-viewY)*(1-Math.pow(.035,dt));path.getPointAt(progress,desired);lookPath.getPointAt(progress,gaze);path.getTangentAt(Math.min(.999,progress),tangent);const side=new THREE.Vector3(tangent.z,0,-tangent.x).normalize();desired.addScaledVector(side,viewX*(mobile()?.18:.42));desired.y-=viewY*(mobile()?.14:.3);camera.position.copy(desired);gaze.addScaledVector(side,viewX*.16);gaze.y-=viewY*.12;camera.lookAt(gaze);const curveBank=THREE.MathUtils.clamp(tangent.x*.11,-.095,.095);camera.rotation.z+=curveBank+viewX*.008;updateWorld(now);updateUI();renderer.render(scene,camera);requestAnimationFrame(frame);}
readScroll();requestAnimationFrame(frame);
