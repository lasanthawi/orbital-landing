import * as THREE from 'three';
window.__orbitalStarted=true;

const $=id=>document.getElementById(id);
const canvas=$('world'), loader=$('loader'), loaderPct=$('loaderPct'), fallback=$('fallback');
const railFill=$('railFill'), mobileFill=$('mobileFill'), railScene=$('railScene'), sceneCode=$('sceneCode'), distance=$('distance'), hint=$('hint');
const moments=[...document.querySelectorAll('.moment')];
const isMobile=()=>innerWidth<780;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile(),powerPreference:'high-performance'});}catch(e){fallback.hidden=false;throw e;}
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=!isMobile();
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const resize=()=>{renderer.setPixelRatio(Math.min(devicePixelRatio||1,isMobile()?1.2:1.55));renderer.setSize(innerWidth,innerHeight,false);};resize();

const scene=new THREE.Scene();scene.background=new THREE.Color(0x010205);
const camera=new THREE.PerspectiveCamera(isMobile()?60:48,innerWidth/innerHeight,.1,1800);
const hemi=new THREE.HemisphereLight(0x6e8fae,0x010103,.42);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff5df,5.5);sun.position.set(-30,20,30);sun.castShadow=!isMobile();scene.add(sun);
const rim=new THREE.DirectionalLight(0x78bfff,1.15);rim.position.set(28,-10,-45);scene.add(rim);

const manager=new THREE.LoadingManager();
manager.onProgress=(u,l,t)=>loaderPct.textContent=String(Math.round(l/Math.max(1,t)*100)).padStart(2,'0');
manager.onLoad=()=>setTimeout(()=>loader.classList.add('done'),220);
setTimeout(()=>loader.classList.add('done'),3200);
const texLoader=new THREE.TextureLoader(manager);

function canvasTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const glowTex=canvasTex(128,128,(g,w,h)=>{const q=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);q.addColorStop(0,'#fff');q.addColorStop(.15,'rgba(255,255,255,.95)');q.addColorStop(.52,'rgba(255,255,255,.14)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,w,h);});
function glow(color,size,opacity=.5){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.set(size,size,1);return s;}
function mat(color,metal=.1,rough=.55){return new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});}
function phys(color,metal=.7,rough=.24){return new THREE.MeshPhysicalMaterial({color,metalness:metal,roughness:rough,clearcoat:.65,clearcoatRoughness:.18});}
function starField(){const n=isMobile()?2800:6200,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const z=45-Math.random()*900,r=24+Math.random()*165,a=Math.random()*Math.PI*2,b=.35+Math.random()*.65;p[i*3]=Math.cos(a)*r;p[i*3+1]=Math.sin(a)*r*.68;p[i*3+2]=z;c[i*3]=b*.82;c[i*3+1]=b*.9;c[i*3+2]=b;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({size:isMobile()?.055:.07,vertexColors:true,transparent:true,opacity:.9,sizeAttenuation:true}));scene.add(pts);return pts;}
const stars=starField();
function atmosphere(r,color,opacity){return new THREE.Mesh(new THREE.SphereGeometry(r,64,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending}));}
function sphere(r,color,seg=80){const m=new THREE.Mesh(new THREE.SphereGeometry(r,isMobile()?48:seg,isMobile()?32:52),mat(color,0,.92));m.receiveShadow=true;return m;}

// EARTH: multi-layer material, night lights, clouds, atmosphere
const earth=new THREE.Group();earth.position.set(0,-2,0);scene.add(earth);
const earthSurface=sphere(9,0xffffff,104);earth.add(earthSurface);
texLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',t=>{earthSurface.material.map=t;earthSurface.material.needsUpdate=true;});
texLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',t=>{earthSurface.material.normalMap=t;earthSurface.material.normalScale.set(.48,.48);earthSurface.material.needsUpdate=true;});
texLoader.load('https://threejs.org/examples/textures/planets/earth_lights_2048.png',t=>{earthSurface.material.emissive=new THREE.Color(0xffb55a);earthSurface.material.emissiveMap=t;earthSurface.material.emissiveIntensity=.26;earthSurface.material.needsUpdate=true;});
const clouds=new THREE.Mesh(new THREE.SphereGeometry(9.075,isMobile()?48:88,isMobile()?32:52),new THREE.MeshPhongMaterial({color:0xffffff,transparent:true,opacity:.19,depthWrite:false}));earth.add(clouds);
texLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png',t=>{clouds.material.map=t;clouds.material.alphaMap=t;clouds.material.needsUpdate=true;});
earth.add(atmosphere(9.42,0x4ba5ff,.18));earth.add(glow(0x4d9cff,25,.11));

// ISS: truss, modules, radiators, solar blankets, antennae, docking nodes
function makeISS(){const g=new THREE.Group(),white=phys(0xdadfdc,.78,.23),dark=phys(0x343a3c,.72,.23),blue=mat(0x173b73,.3,.34),gold=phys(0xb58a3c,.55,.28);const truss=new THREE.Mesh(new THREE.BoxGeometry(8.8,.11,.11),white);g.add(truss);for(let i=-8;i<=8;i++){const brace=new THREE.Mesh(new THREE.BoxGeometry(.07,.8,.07),dark);brace.position.x=i*.5;brace.rotation.x=(i%2?.55:-.55);g.add(brace);}for(let i=-2;i<=2;i++){const mod=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,1.45,18),i===0?dark:white);mod.rotation.z=Math.PI/2;mod.position.x=i*1.1;g.add(mod);const collar=new THREE.Mesh(new THREE.TorusGeometry(.43,.045,8,22),dark);collar.rotation.y=Math.PI/2;collar.position.x=i*1.1;g.add(collar);}for(const sx of[-3.2,3.2])for(const sy of[-1,1]){const mast=new THREE.Mesh(new THREE.BoxGeometry(.08,2.45,.08),white);mast.position.set(sx,sy*1.25,0);g.add(mast);for(const z of[-.48,.48]){const panel=new THREE.Mesh(new THREE.BoxGeometry(2.7,.045,.86),blue);panel.position.set(sx,sy*2.55,z);g.add(panel);for(let k=-3;k<=3;k++){const line=new THREE.Mesh(new THREE.BoxGeometry(.012,.05,.88),new THREE.MeshBasicMaterial({color:0x4671a7}));line.position.set(sx+k*.38,sy*2.55,z+.01);g.add(line);}}}
for(const x of[-1.7,1.7]){const radiator=new THREE.Mesh(new THREE.BoxGeometry(.95,.035,1.6),mat(0xe8e9e1,.15,.55));radiator.position.set(x,-1.25,.7);radiator.rotation.x=.25;g.add(radiator);}const cupola=new THREE.Mesh(new THREE.CylinderGeometry(.3,.42,.42,10),gold);cupola.position.set(.65,-.42,.2);g.add(cupola);for(const x of[-4.25,4.25]){const dish=new THREE.Mesh(new THREE.SphereGeometry(.34,18,10,0,Math.PI*2,0,Math.PI/2),white);dish.rotation.x=Math.PI/2;dish.position.set(x,.5,.3);g.add(dish);}g.scale.setScalar(.86);return g;}
const iss=makeISS();iss.position.set(-5,1.8,-47);iss.rotation.set(.16,.32,-.09);scene.add(iss);

function makeAstronaut(){const g=new THREE.Group(),suit=mat(0xf1f0e9,0,.68),joint=mat(0xc9ccca,.2,.45),glass=new THREE.MeshPhysicalMaterial({color:0x120d08,metalness:.7,roughness:.07,clearcoat:1});const torso=new THREE.Mesh(new THREE.BoxGeometry(.42,.56,.27),suit);g.add(torso);const pack=new THREE.Mesh(new THREE.BoxGeometry(.36,.48,.22),joint);pack.position.z=-.23;g.add(pack);const helmet=new THREE.Mesh(new THREE.SphereGeometry(.25,22,16),suit);helmet.position.y=.45;g.add(helmet);const visor=new THREE.Mesh(new THREE.SphereGeometry(.195,22,16),glass);visor.scale.z=.48;visor.position.set(0,.45,.18);g.add(visor);for(const side of[-1,1]){const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.28,6,10),suit);upper.position.set(side*.28,.08,0);upper.rotation.z=side*.72;g.add(upper);const glove=new THREE.Mesh(new THREE.SphereGeometry(.085,12,9),joint);glove.position.set(side*.48,-.04,0);g.add(glove);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.36,6,10),suit);leg.position.set(side*.12,-.46,0);leg.rotation.z=side*.1;g.add(leg);const boot=new THREE.Mesh(new THREE.BoxGeometry(.13,.12,.22),joint);boot.position.set(side*.14,-.74,.07);g.add(boot);}return g;}
const astronaut=makeAstronaut();astronaut.scale.setScalar(.52);astronaut.position.set(-1.9,.15,-45.6);astronaut.rotation.z=.48;scene.add(astronaut);
const tether=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-1.9,.15,-45.6),new THREE.Vector3(-2.8,.72,-46.2),new THREE.Vector3(-4.1,1.25,-46.8)]),36,.012,5,false),new THREE.MeshBasicMaterial({color:0xe9eeee}));scene.add(tether);

function makeCraft(){const g=new THREE.Group(),shell=phys(0xcbd2d2,.8,.22),dark=phys(0x1e2529,.68,.2),glass=new THREE.MeshPhysicalMaterial({color:0x5eaee0,metalness:.15,roughness:.06,transparent:true,opacity:.72,clearcoat:1});const fuselage=new THREE.Mesh(new THREE.CapsuleGeometry(.42,2.4,10,22),shell);fuselage.rotation.z=Math.PI/2;g.add(fuselage);const nose=new THREE.Mesh(new THREE.SphereGeometry(.48,24,16),glass);nose.scale.x=.68;nose.position.x=1.45;g.add(nose);for(const side of[-1,1]){const wing=new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([]),shell);const shape=new THREE.Shape();shape.moveTo(-.6,0);shape.lineTo(.5,0);shape.lineTo(-.2,side*1.45);shape.closePath();const wg=new THREE.ShapeGeometry(shape);const wm=new THREE.Mesh(wg,dark);wm.rotation.x=Math.PI/2;wm.position.set(-.2,0,side*.25);g.add(wm);}for(let i=0;i<3;i++){const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.13,.19,.4,16),dark);nozzle.rotation.z=Math.PI/2;nozzle.position.set(-1.52,(i-1)*.28,0);g.add(nozzle);const flame=glow(0x79cfff,.72,.5);flame.position.set(-1.9,(i-1)*.28,0);g.add(flame);}return g;}
const craft=makeCraft();craft.position.set(4,-1.4,-68);craft.rotation.set(0,-.3,.08);scene.add(craft);

// Moon
const moon=new THREE.Group();moon.position.set(4,-1,-112);scene.add(moon);const moonSurface=sphere(6,0xffffff,92);moon.add(moonSurface);texLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg',t=>{moonSurface.material.map=t;moonSurface.material.bumpMap=t;moonSurface.material.bumpScale=.34;moonSurface.material.needsUpdate=true;});

// Mars with procedural albedo + crater relief
const mars=new THREE.Group();mars.position.set(-7,1,-190);scene.add(mars);const marsTex=canvasTex(1024,512,(g,w,h)=>{g.fillStyle='#9b4b2b';g.fillRect(0,0,w,h);for(let i=0;i<1800;i++){const r=1+Math.random()*18,a=.04+Math.random()*.18;g.fillStyle=`rgba(${60+Math.random()*100|0},${20+Math.random()*50|0},${10+Math.random()*35|0},${a})`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,r,0,Math.PI*2);g.fill();}g.fillStyle='rgba(238,221,196,.55)';g.fillRect(0,0,w,18);g.fillRect(0,h-14,w,14);});const marsSurface=sphere(8,0xffffff,92);marsSurface.material.map=marsTex;marsSurface.material.bumpMap=marsTex;marsSurface.material.bumpScale=.11;mars.add(marsSurface);mars.add(atmosphere(8.28,0xe47b48,.07));

// Jupiter with many turbulent bands and red spot
const jupiter=new THREE.Group();jupiter.position.set(12,0,-305);scene.add(jupiter);const jTex=canvasTex(1536,768,(g,w,h)=>{const bands=['#d5b99d','#9f7156','#e8d7bc','#b47c5b','#f0dfc4','#7f5948','#d2ab88','#f0dfc3','#a86f52','#d8b38f','#725146','#ead9c0'];let y=0;for(let i=0;i<bands.length;i++){const bh=h/bands.length*(.72+Math.random()*.5);g.fillStyle=bands[i];g.fillRect(0,y,w,bh+3);for(let q=0;q<35;q++){g.fillStyle=`rgba(255,255,255,${Math.random()*.055})`;g.fillRect(0,y+Math.random()*bh,w,1+Math.random()*4);}y+=bh;}g.fillStyle='rgba(146,55,34,.92)';g.beginPath();g.ellipse(w*.68,h*.61,w*.09,h*.052,-.06,0,Math.PI*2);g.fill();g.strokeStyle='rgba(245,184,140,.45)';g.lineWidth=7;g.stroke();});const jSurface=sphere(20,0xffffff,112);jSurface.material.map=jTex;jSurface.material.roughness=.86;jupiter.add(jSurface);jupiter.add(atmosphere(20.4,0xd9b58d,.045));const europa=sphere(2.3,0xd8cfb2,52);europa.position.set(-28,5,1);jupiter.add(europa);

// Saturn with layered rings and ring particles
const saturn=new THREE.Group();saturn.position.set(-8,0,-445);saturn.rotation.z=-.19;scene.add(saturn);const satTex=canvasTex(1536,768,(g,w,h)=>{for(let y=0;y<h;y++){const k=.5+.34*Math.sin(y*.055)+.12*Math.sin(y*.22);g.fillStyle=`rgb(${214+k*20|0},${190+k*18|0},${137+k*15|0})`;g.fillRect(0,y,w,1);}});const satSurface=sphere(15,0xffffff,108);satSurface.material.map=satTex;saturn.add(satSurface);const ringMat=(o)=>new THREE.MeshBasicMaterial({color:0xd8c8a5,transparent:true,opacity:o,side:THREE.DoubleSide,depthWrite:false});[[18,21,.45],[21.5,25,.64],[25.7,28,.32],[29,34,.55]].forEach(([a,b,o])=>{const r=new THREE.Mesh(new THREE.RingGeometry(a,b,isMobile()?128:260),ringMat(o));r.rotation.x=Math.PI/2;saturn.add(r);});const ringDust=new THREE.Group();saturn.add(ringDust);const rockMat=mat(0xc8b894,0,.96);for(let i=0;i<(isMobile()?380:1100);i++){const a=Math.random()*Math.PI*2,r=18+Math.random()*16,s=.025+Math.random()*.09,o=new THREE.Mesh(new THREE.IcosahedronGeometry(s,0),rockMat);o.position.set(Math.cos(a)*r,(Math.random()-.5)*.65,Math.sin(a)*r);ringDust.add(o);}

// Black hole: event sphere, photon rings, accretion disk, lens halo
const blackHole=new THREE.Group();blackHole.position.set(2,0,-650);scene.add(blackHole);const hole=new THREE.Mesh(new THREE.SphereGeometry(8.8,80,54),new THREE.MeshBasicMaterial({color:0x000000}));blackHole.add(hole);const halo=glow(0xffb04d,36,.18);blackHole.add(halo);for(let i=0;i<7;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(11+i*.95,.16+i*.025,12,220),new THREE.MeshBasicMaterial({color:i<3?0xffd28b:0xff7d39,transparent:true,opacity:.5-i*.045,blending:THREE.AdditiveBlending,depthWrite:false}));r.rotation.x=1.18;r.rotation.z=.14;blackHole.add(r);}const disk=new THREE.Group();blackHole.add(disk);for(let i=0;i<(isMobile()?420:1200);i++){const a=Math.random()*Math.PI*2,r=11+Math.pow(Math.random(),.7)*27,s=.035+Math.random()*.11,p=new THREE.Mesh(new THREE.SphereGeometry(s,5,4),new THREE.MeshBasicMaterial({color:r<18?0xffe0a1:r<26?0xff8a42:0xb52f19,transparent:true,opacity:.78,blending:THREE.AdditiveBlending,depthWrite:false}));p.position.set(Math.cos(a)*r,(Math.random()-.5)*.6,Math.sin(a)*r);disk.add(p);}disk.rotation.x=1.18;disk.rotation.z=.14;

// Deep-space nebulae
for(let i=0;i<12;i++){const s=glow(i%3===0?0xa464ff:i%3===1?0x3fa7ff:0xff7658,18+Math.random()*34,.018+Math.random()*.025);s.position.set((Math.random()-.5)*110,(Math.random()-.5)*65,-500-Math.random()*130);scene.add(s);}

// CAMERA: each shot has protected stand-off distance and a separate focus target.
// No keyframe crosses the subject volume. The path approaches tangentially, arcs, and exits tangentially.
const shots=[
{p:0,pos:[0,3,22],look:[0,-2,0],roll:0},
{p:.075,pos:[5,1,19],look:[0,-2,0],roll:-.015},
{p:.145,pos:[12,4,10],look:[0,-2,0],roll:-.025},
{p:.205,pos:[7,4,-34],look:[-5,1.8,-47],roll:-.035},
{p:.265,pos:[1.8,2.2,-39],look:[-5,1.8,-47],roll:.018},
{p:.315,pos:[7,-.5,-58],look:[4,-1.4,-68],roll:.025},
{p:.385,pos:[13,4,-98],look:[4,-1,-112],roll:-.025},
{p:.455,pos:[-2,7,-102],look:[4,-1,-112],roll:-.04},
{p:.535,pos:[5,5,-174],look:[-7,1,-190],roll:.025},
{p:.605,pos:[-19,4,-194],look:[-7,1,-190],roll:.04},
{p:.685,pos:[38,8,-286],look:[12,0,-305],roll:-.035},
{p:.755,pos:[-17,6,-309],look:[12,0,-305],roll:-.05},
{p:.825,pos:[29,10,-421],look:[-8,0,-445],roll:.045},
{p:.875,pos:[-5,2,-409],look:[-8,0,-445],roll:.015},
{p:.915,pos:[26,-7,-455],look:[-8,0,-445],roll:-.03},
{p:.955,pos:[30,9,-612],look:[2,0,-650],roll:.035},
{p:.982,pos:[-18,5,-624],look:[2,0,-650],roll:-.02},
{p:1,pos:[7,1,-620],look:[2,0,-650],roll:0}
];
function smooth5(x){x=THREE.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);}
function sampleShot(pp){let a=shots[0],b=shots.at(-1);for(let i=0;i<shots.length-1;i++){if(pp>=shots[i].p&&pp<=shots[i+1].p){a=shots[i];b=shots[i+1];break;}}const q=smooth5((pp-a.p)/(b.p-a.p));const pos=new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos),q);const look=new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look),q);return{pos,look,roll:THREE.MathUtils.lerp(a.roll,b.roll,q)};}

const thresholds=[.17,.30,.40,.50,.62,.76,.87,.93,.97,1.001];
const labels=['01 / EARTH','02 / ORBIT','03 / MOON TRANSIT','04 / MOON','05 / MARS','06 / JUPITER','07 / SATURN','08 / DEEP SPACE','09 / UNKNOWN','10 / EVENT HORIZON'];
function sceneIndex(p){for(let i=0;i<thresholds.length;i++)if(p<thresholds[i])return i;return thresholds.length-1;}
function local(p,a,b){return THREE.MathUtils.clamp((p-a)/(b-a),0,1);}

let target=0,progress=0,scrollVelocity=0,lastScrollY=scrollY,lastScene=-1,mouseX=0,mouseY=0,px=0,py=0;
const camPos=new THREE.Vector3(...shots[0].pos),camLook=new THREE.Vector3(...shots[0].look),tmpLook=new THREE.Vector3();
function readScroll(){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),y=scrollY||0;target=THREE.MathUtils.clamp(y/max,0,1);scrollVelocity=THREE.MathUtils.lerp(scrollVelocity,(y-lastScrollY)/Math.max(innerHeight,1),.18);lastScrollY=y;}
addEventListener('scroll',readScroll,{passive:true});
addEventListener('pointermove',e=>{mouseX=(e.clientX/innerWidth-.5)*2;mouseY=(e.clientY/innerHeight-.5)*2;},{passive:true});
addEventListener('resize',()=>{resize();camera.aspect=innerWidth/innerHeight;camera.fov=isMobile()?60:48;camera.updateProjectionMatrix();readScroll();},{passive:true});

function updateWorld(t){earthSurface.rotation.y=-1.25+t*.000035;clouds.rotation.y=-1.2+t*.00005;iss.rotation.y=.32+Math.sin(t*.00009)*.025;astronaut.rotation.y=Math.sin(t*.00016)*.18;astronaut.position.y=.15+Math.sin(t*.0007)*.035;craft.position.y=-1.4+Math.sin(t*.00045)*.12;moonSurface.rotation.y=t*.000018;marsSurface.rotation.y=t*.000025;jSurface.rotation.y=t*.000052;satSurface.rotation.y=t*.000035;ringDust.rotation.y=t*.000012;disk.rotation.z=.14+t*.000055;blackHole.rotation.y=t*.000015;
const bh=local(progress,.94,1);renderer.toneMappingExposure=THREE.MathUtils.lerp(1.05,.82,bh);stars.material.opacity=THREE.MathUtils.lerp(.9,.58,bh);}
function updateUI(){const idx=sceneIndex(progress);if(idx!==lastScene){moments.forEach((m,i)=>m.classList.toggle('active',i===idx));sceneCode.textContent=labels[idx];railScene.textContent=String(idx+1).padStart(2,'0');lastScene=idx;}const pct=(progress*100).toFixed(2)+'%';railFill.style.height=pct;mobileFill.style.width=pct;const km=Math.round(progress<.17?progress/.17*400:progress<.5?400+(progress-.17)/.33*384000:384400+(progress-.5)*1600000000);distance.textContent=km>999999?(km/1000000).toFixed(1)+'M KM':km.toLocaleString()+' KM';hint.classList.toggle('hide',progress>.025);}

let prev=performance.now();
function frame(t){const dt=Math.min(.033,(t-prev)/1000||.016);prev=t;
// Cinematic scroll response: slow critically-damped pursuit, with tighter limits after fast swipes.
const response=reduce?1:(isMobile()?.022:.026);progress+=THREE.MathUtils.clamp((target-progress)*response,-.0028,.0028);
scrollVelocity*=.92;px+=(mouseX-px)*.025;py+=(mouseY-py)*.025;
const s=sampleShot(progress);
const posAlpha=1-Math.pow(.0008,dt),lookAlpha=1-Math.pow(.002,dt);
camPos.lerp(s.pos,posAlpha*.42);camLook.lerp(s.look,lookAlpha*.34);
const parallax=isMobile()?.22:.42;camera.position.copy(camPos);camera.position.x+=px*parallax;camera.position.y-=py*parallax*.65;
tmpLook.copy(camLook);tmpLook.x+=px*.09;tmpLook.y-=py*.06;camera.up.set(Math.sin(s.roll),Math.cos(s.roll),0);camera.lookAt(tmpLook);
updateWorld(t);updateUI();renderer.render(scene,camera);requestAnimationFrame(frame);}
readScroll();requestAnimationFrame(frame);
