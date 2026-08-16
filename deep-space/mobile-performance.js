import * as THREE from 'three';

if(innerWidth<=900 || 'ontouchstart' in window){
  const originalRender=THREE.WebGLRenderer.prototype.render;
  let lastDraw=0;
  THREE.WebGLRenderer.prototype.render=function(scene,camera){
    const now=performance.now();
    if(now-lastDraw<32) return;
    lastDraw=now;
    if(!this.userData.mobileBudgetApplied){
      this.userData.mobileBudgetApplied=true;
      this.setPixelRatio(Math.min(devicePixelRatio||1,.9));
      this.shadowMap.enabled=false;
      scene.traverse(o=>{
        if(o.isPointLight){o.intensity*=.45;o.distance=Math.min(o.distance||12,14);}
        if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}
      });
    }
    return originalRender.call(this,scene,camera);
  };

  document.documentElement.classList.add('mobile-performance');
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) document.documentElement.classList.add('scene-paused');
    else document.documentElement.classList.remove('scene-paused');
  });
}
