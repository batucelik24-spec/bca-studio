(function(){
  'use strict';
  const T=window.THREE,F=window.BCAStudioForms,view=document.getElementById('v-studio'),canvas=document.getElementById('s-form');
  if(!T||!F||!view||!canvas)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:760px)').matches;
  const count=mobile?52000:150000,ambientCount=mobile?16000:56000;
  const forms=F.names.map((_,i)=>F.make(i,count));
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});}catch(e){canvas.dataset.renderer='unavailable';return;}
  renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.5:1.8));
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-5,5,4,-4,.1,100);camera.position.z=12;
  const uniforms={uTime:{value:0},uMix:{value:0},uFrom:{value:0},uTo:{value:0},uSize:{value:renderer.getPixelRatio()},uPointer:{value:new T.Vector2()},uCenter:{value:new T.Vector2()},uHalf:{value:new T.Vector2(5,4)},uMobile:{value:mobile?1:0},uPresence:{value:1}};
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(forms[0].positions.slice(),3));
  geometry.setAttribute('aNext',new T.BufferAttribute(forms[0].positions.slice(),3));
  geometry.setAttribute('aDetail',new T.BufferAttribute(forms[0].details.slice(),4));
  geometry.setAttribute('aNextDetail',new T.BufferAttribute(forms[0].details.slice(),4));
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms,
    vertexShader:`
      attribute vec3 aNext;attribute vec4 aDetail,aNextDetail;
      uniform float uTime,uMix,uFrom,uTo,uSize,uMobile,uPresence;
      uniform vec2 uPointer,uCenter,uHalf;
      varying float vAlpha,vFeature,vDepth;
      `+F.glsl+`
      void main(){
        float slow=uTime;vec3 a=bcaLife(position,aDetail,uFrom,slow);float ga=bcaGlow;vec3 b=bcaLife(aNext,aNextDetail,uTo,slow);float glow=mix(ga,bcaGlow,smoothstep(0.,1.,uMix));
        float k=smoothstep(0.,1.,uMix),burst=sin(k*3.14159265);
        float fx=mix(aDetail.x<0.?.1:aDetail.x,aNextDetail.x<0.?.1:aNextDetail.x,k);vec3 p=mix(a,b,k);
        float seed=fract(sin(dot(position,vec3(12.9898,78.233,39.425)))*43758.54);
        p+=vec3(sin(seed*47.+uTime*.35),cos(seed*61.),sin(seed*89.))*burst*.20;
        p.xy+=uPointer*.08;p.xy+=uCenter;
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        vFeature=fx;vDepth=clamp((p.z+3.)/6.,0.,1.);
        vec2 uv=(p.xy+uHalf)/(2.*uHalf);
        float quiet=(1.-smoothstep(.30,.53,uv.x))*smoothstep(.20,.38,uv.y)*(1.-smoothstep(.86,.98,uv.y));
        if(uMobile>.5)quiet=smoothstep(.65,.83,uv.y);
        vAlpha=clamp(mix(.42,.86,fx)*(.45+.55*glow),0.,1.)*mix(.72,1.,vDepth)*(1.-quiet*.8)*uPresence;
        gl_PointSize=uSize*mix(1.0,1.7,fx)*(.8+.2*glow)*mix(.9,1.18,vDepth);
      }`,
    fragmentShader:`varying float vAlpha,vFeature,vDepth;
      void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float soft=1.-smoothstep(.16,.5,d);
      vec3 ink=mix(vec3(.137,.251,.902),vec3(.12,.19,.52),vFeature*.35);
      gl_FragColor=vec4(ink,vAlpha*soft);
      }`
  });
  const points=new T.Points(geometry,material);points.frustumCulled=false;scene.add(points);

  // Uneven, overlapping eddies: larger densities around plumes, generous quiet gaps.
  const ag=new T.BufferGeometry(),ap=new Float32Array(ambientCount*3),as=new Float32Array(ambientCount*3);
  let seed=83249;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<ambientCount;i++){ap.set([rand(),rand(),rand()],i*3);as.set([rand(),rand(),rand()],i*3);}
  ag.setAttribute('position',new T.BufferAttribute(ap,3));ag.setAttribute('aSeed',new T.BufferAttribute(as,3));
  const am=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms,
    vertexShader:`attribute vec3 aSeed;uniform float uTime,uSize,uMobile;uniform vec2 uHalf,uCenter;varying float vOpacity;
      void main(){
        float t=uTime*.025;float cluster=floor(position.z*7.);float a=position.x*6.283185+cluster*.9;
        float rr=pow(position.y,1.7),width=.13+.08*sin(cluster*2.7);
        vec2 anchor=vec2(.5+.36*sin(cluster*2.4+t*.8),.5+.38*cos(cluster*1.7+t*.6));
        vec2 uv=anchor+vec2(cos(a+t*(.4+position.z)),sin(a-t*.6))*rr*vec2(.38,.31);
        uv+=vec2(sin(uv.y*9.+t*1.4+aSeed.x*2.),cos(uv.x*7.-t+aSeed.x*2.))*.055;
        if(aSeed.z>.80)uv=fract(position.xy+vec2(sin(t+position.y*5.)*.06,-t*.035));
        uv=fract(uv);vec2 p=(uv*2.-1.)*uHalf;
        float quiet=(1.-smoothstep(.28,.57,uv.x))*smoothstep(.14,.35,uv.y)*(1.-smoothstep(.86,.98,uv.y));
        if(uMobile>.5)quiet=smoothstep(.61,.82,uv.y);
        vOpacity=(.14+.29*aSeed.y)*(1.-quiet*.82);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,-2.,1.);
        gl_PointSize=uSize*(.65+.75*pow(aSeed.y,4.));
      }`,fragmentShader:`varying float vOpacity;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.137,.251,.902,vOpacity*(1.-smoothstep(.15,.5,d)));}`
  });
  const ambient=new T.Points(ag,am);ambient.frustumCulled=false;ambient.renderOrder=-1;scene.add(ambient);
  const controls=document.createElement('div');controls.className='studio-form-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Stüdyo nokta animasyonu');
  controls.innerHTML='<button type="button" class="form-pause" aria-label="Animasyonu duraklat">Duraklat</button>';
  view.querySelector('.s-hero').append(controls);
  let slotA=-1,slotB=-1,last=0,paused=F.isPaused(),raf=0,dirty=true;
  const pause=controls.querySelector('.form-pause');
  // The form and its motion phase come from the shared clock, so Studio and Welcome stay in step.
  function load(a,b){
    if(a!==slotA){geometry.attributes.position.array.set(forms[a].positions);geometry.attributes.aDetail.array.set(forms[a].details);geometry.attributes.position.needsUpdate=geometry.attributes.aDetail.needsUpdate=true;slotA=a;}
    if(b!==slotB){geometry.attributes.aNext.array.set(forms[b].positions);geometry.attributes.aNextDetail.array.set(forms[b].details);geometry.attributes.aNext.needsUpdate=geometry.attributes.aNextDetail.needsUpdate=true;slotB=b;}
    uniforms.uFrom.value=a;uniforms.uTo.value=b;
  }
  controls.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;{
    paused=!paused;F.setPaused(paused);pause.textContent=paused?'Devam et':'Duraklat';pause.setAttribute('aria-label',paused?'Animasyonu sürdür':'Animasyonu duraklat');canvas.dataset.paused=String(paused);dirty=true;start();
  }});
  view.addEventListener('pointermove',e=>{uniforms.uPointer.value.set((e.clientX/innerWidth-.5)*2,(.5-e.clientY/innerHeight)*2);},{passive:true});
  view.addEventListener('pointerleave',()=>uniforms.uPointer.value.set(0,0));
  function presence(){
    const bottom=view.querySelector('.s-hero').getBoundingClientRect().bottom;
    const k=Math.max(0,Math.min(1,(bottom/innerHeight-.22)/.35));
    uniforms.uPresence.value=k*k*(3-2*k);points.visible=k>.001;
    if(paused||reduced.matches){dirty=true;start();}
  }
  addEventListener('scroll',presence,{passive:true});
  function size(){
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);const halfH=4.4,halfW=halfH*w/h;
    camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();
    const small=w<=760;uniforms.uHalf.value.set(halfW,halfH);uniforms.uMobile.value=small?1:0;
    const scale=small?Math.min(1.05,halfW*.40):Math.min(1.75,halfW*.62);
    points.scale.setScalar(scale);
    // Offset is expressed in object units because the point group scales as a whole.
    const centerX=small?.25:halfW*.53,centerY=small?-.95:.15;
    uniforms.uCenter.value.set(centerX/scale,centerY/scale);
    canvas.dataset.pointCount=String(count);canvas.dataset.ambientCount=String(ambientCount);presence();dirty=true;start();
  }
  function tick(now){
    raf=0;if(view.hidden||document.hidden){last=0;return;}
    const S=F.state();load(S.a,S.b);
    uniforms.uMix.value=S.m;uniforms.uTime.value=S.t;
    canvas.dataset.form=F.names[S.m<.5?S.a:S.b];canvas.dataset.transition=S.m>0&&S.m<1?'morphing':'settled';
    renderer.render(scene,camera);dirty=false;
    if(!paused&&!reduced.matches&&!raf)raf=requestAnimationFrame(tick);
  }
  function start(){if(!raf&&!view.hidden&&!document.hidden){last=0;raf=requestAnimationFrame(tick);}}
  new ResizeObserver(size).observe(canvas);
  new MutationObserver(()=>{if(!view.hidden){size();start();}else if(raf){cancelAnimationFrame(raf);raf=0;last=0;}}).observe(view,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start();else if(raf){cancelAnimationFrame(raf);raf=0;last=0;}});
  reduced.addEventListener('change',()=>{dirty=true;start();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;canvas.dataset.renderer='context-lost';});
  canvas.addEventListener('webglcontextrestored',()=>{canvas.dataset.renderer='webgl';size();start();});
  canvas.dataset.renderer='webgl';canvas.dataset.form=F.names[0];canvas.dataset.paused='false';size();start();
})();
