/* Continue the live XYZ point cloud into the cover's image plane. */
(function(){
  'use strict';
  window.BCAHologramTransition={create({THREE:T,model,depth,camera,image,renderer,opacity}){
    if(!image?.complete||!image.naturalWidth)return null;
    const geometry=model.geometry.clone(),time=model.material.uniforms.uTime.value,reveal=model.material.uniforms.uReveal.value;
    model.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const mv=new T.Matrix4().multiplyMatrices(camera.matrixWorldInverse,model.matrixWorld),mvp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,mv);
    const position=geometry.attributes.position,seed=geometry.attributes.aSeed,ambient=geometry.attributes.aAmbient,count=position.count;
    const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
    // Match nearby projected points to nearby photo pixels, avoiding a random tangle.
    const projected=[],v=new T.Vector3();
    for(let i=0;i<count;i++){
      const s=seed.getX(i);v.fromBufferAttribute(position,i);const delay=Math.max(0,Math.min(1,(1.7-v.y)/3.4))*.65,f=1-smooth(delay,delay+.32,reveal);
      v.x+=Math.sin(s*91)*1.25*f;v.y+=Math.cos(s*53)*1.25*f;v.z+=Math.sin(s*37)*1.25*f;
      if(ambient.getX(i)>.5){v.x+=Math.sin(time*.31+s*37)*.07;v.y+=Math.cos(time*.27+s*29)*.07;v.z+=Math.sin(time*.23+s*61)*.07;}
      v.applyMatrix4(mvp);projected.push({i,x:v.x,y:v.y});
    }
    projected.sort((a,b)=>b.y-a.y);
    const aspect=image.parentElement.getBoundingClientRect().width/image.parentElement.getBoundingClientRect().height;
    const columns=Math.ceil(Math.sqrt(count*aspect)),rows=Math.ceil(count/columns),uv=new Float32Array(count*2);
    for(let row=0;row<rows;row++){
      const band=projected.slice(row*columns,(row+1)*columns).sort((a,b)=>a.x-b.x);
      band.forEach((p,col)=>{uv[p.i*2]=(col+.5)/band.length;uv[p.i*2+1]=1-(row+.5)/rows;});
    }
    geometry.setAttribute('aPhotoUV',new T.BufferAttribute(uv,2));
    const texture=new T.Texture(image);texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
    const normal=new T.Matrix3().getNormalMatrix(mv);
    // Preserve the preview's surface visibility at the instant of clicking. Rear
    // points enter gradually as the spatial cloud resolves into the photograph.
    let sourceDepth=null;
    if(depth&&(renderer.capabilities.isWebGL2||renderer.extensions.has('WEBGL_depth_texture'))){
      const size=renderer.getDrawingBufferSize(new T.Vector2()),previousTarget=renderer.getRenderTarget(),autoClear=renderer.autoClear;
      sourceDepth=new T.WebGLRenderTarget(size.x,size.y);sourceDepth.depthTexture=new T.DepthTexture(size.x,size.y);
      const depthScene=new T.Scene();depthScene.add(depth.clone());
      try{renderer.setRenderTarget(sourceDepth);renderer.autoClear=true;renderer.render(depthScene,camera);}
      finally{renderer.setRenderTarget(previousTarget);renderer.autoClear=autoClear;}
    }
    const uniforms={uTime:{value:time},uReveal:{value:reveal},uProgress:{value:0},uSourceMV:{value:mv},uSourceMVP:{value:mvp},uNormal:{value:normal},uSourceScale:{value:1},uSourceDPR:{value:1},uDensityScale:{value:model.material.uniforms.uDensityScale.value},uPixelSize:{value:5},uPhoto:{value:texture},uCrop:{value:new T.Vector4(1,1,0,0)},uSourceDepth:{value:sourceDepth?.depthTexture||null},uHasDepth:{value:sourceDepth?1:0}};
    // Start with the same additive light as the preview, then introduce normal
    // photo opacity as the points settle. This avoids a dark flash on clicking.
    const material=new T.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,blendEquation:T.AddEquation,
      vertexShader:`
        attribute vec3 aNormal;attribute float aSeed,aAmbient,aFeature;attribute vec2 aPhotoUV;
        uniform float uTime,uReveal,uProgress,uSourceScale,uSourceDPR,uDensityScale,uPixelSize;uniform mat4 uSourceMV,uSourceMVP;uniform mat3 uNormal;
        varying vec2 vUV;varying vec3 vSource;varying float vLight,vAmbient,vSeed,vScan,vFeature,vMix;
        void main(){
          vUV=aPhotoUV;vAmbient=aAmbient;vSeed=aSeed;vFeature=aFeature;
          vec3 p=position;float scanY=1.8-mod(uTime*2.1,6.2);vScan=exp(-pow((p.y-scanY)/.09,2.));
          float delay=clamp((1.7-p.y)/3.4,0.,1.)*.65,form=smoothstep(delay,delay+.32,uReveal);
          p=mix(p+vec3(sin(aSeed*91.),cos(aSeed*53.),sin(aSeed*37.))*1.25,p,form);
          if(aAmbient>.5)p+=vec3(sin(uTime*.31+aSeed*37.),cos(uTime*.27+aSeed*29.),sin(uTime*.23+aSeed*61.))*.07;
          vLight=.42+.58*abs(dot(normalize(uNormal*aNormal),normalize(vec3(.4,.6,1.))));
          vec4 clip=uSourceMVP*vec4(p,1.);vec3 start=clip.xyz/clip.w;
          vSource=start*.5+.5;vSource.z-=.000006;
          float stagger=(1.-aPhotoUV.y)*.08+aSeed*.05;
          float k=smoothstep(stagger,.86+stagger,uProgress);vMix=k;
          vec3 dest=vec3(aPhotoUV*2.-1.,0.);vec3 point=mix(start,dest,k);
          point.xy+=vec2(sin(aSeed*23.+k*3.5),cos(aSeed*17.+k*2.5))*sin(k*3.14159265)*.055;
          gl_Position=vec4(point,1.);
          float z=-(uSourceMV*vec4(p,1.)).z;
          float size=clamp((aAmbient>.5?5.5:10.+aSeed*2.+aFeature*5.+vScan*5.)*uSourceDPR*uDensityScale/z,.75,3.1)*uSourceScale;
          gl_PointSize=mix(size,uPixelSize,smoothstep(.35,.95,k));
        }`,
      fragmentShader:`
        uniform sampler2D uPhoto,uSourceDepth;uniform float uHasDepth;uniform vec4 uCrop;varying vec2 vUV;varying vec3 vSource;varying float vLight,vAmbient,vSeed,vScan,vFeature,vMix;
        void main(){
          float r=length(gl_PointCoord-.5);if(r>.5)discard;float soft=1.-smoothstep(.17,.5,r);
          vec3 holo=mix(vec3(.24,.68,.84),vec3(.66,.97,1.),vLight*.53+vScan*.47);
          vec3 photo=texture2D(uPhoto,vUV*uCrop.xy+uCrop.zw).rgb;
          float a=(vAmbient>.5?.075+.12*vSeed:.40+.36*vLight+.16*vFeature)*(1.+vScan*1.4);
          float visible=1.;
          if(uHasDepth>.5&&vSource.x>=0.&&vSource.x<=1.&&vSource.y>=0.&&vSource.y<=1.){
            float nearest=texture2D(uSourceDepth,vSource.xy).x;
            if(vSource.z>nearest+.000003)visible=smoothstep(.04,.5,vMix);
          }
          float photoMix=smoothstep(.08,.8,vMix),alpha=mix(a,1.,vMix)*soft*visible;
          gl_FragColor=vec4(mix(holo,photo,photoMix)*alpha,alpha*photoMix);
        }`
    });
    const scene=new T.Scene(),points=new T.Points(geometry,material);points.frustumCulled=false;scene.add(points);
    const flatCamera=new T.Camera();let frame=0,disposed=false,canvas=null;
    return {count,reveal,mount(cover,from,to,duration){
      canvas=renderer.domElement;renderer.setSize(to.width,to.height,false);renderer.setClearColor(0x020b12);
      canvas.className='arch-morph-cover arch-particle-bridge';canvas.style.cssText=cover.style.cssText;canvas.style.zIndex='6';
      canvas.dataset.transition='xyz-to-cover';canvas.dataset.points=String(count);canvas.dataset.progress='0';
      cover.after(canvas);
      const animation=cover.getAnimations()[0];if(animation)canvas.animate(animation.effect.getKeyframes(),{duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
      const dpr=renderer.getPixelRatio();uniforms.uSourceDPR.value=dpr;uniforms.uSourceScale.value=to.width/from.width;uniforms.uPixelSize.value=to.width/columns*dpr*1.65;
      const ia=image.naturalWidth/image.naturalHeight,va=to.width/to.height,sx=Math.min(1,va/ia),sy=Math.min(1,ia/va);
      const pos=(image.style.objectPosition||'50% 50%').split(' ').map(x=>parseFloat(x)/100);
      uniforms.uCrop.value.set(sx,sy,(1-sx)*(Number.isFinite(pos[0])?pos[0]:.5),(1-sy)*(1-(Number.isFinite(pos[1])?pos[1]:.5)));
      const start=performance.now();
      function draw(now){
        if(disposed)return;const t=Math.min(1,(now-start)/duration);uniforms.uProgress.value=t;
        canvas.dataset.progress=t.toFixed(2);canvas.style.opacity=(Math.min(1,opacity+smooth(0,.18,t))*(1-smooth(.79,1,t))).toFixed(3);
        renderer.autoClear=true;renderer.render(scene,flatCamera);if(t<1)frame=requestAnimationFrame(draw);
      }
      draw(start);
    },dispose(){
      if(disposed)return;disposed=true;cancelAnimationFrame(frame);geometry.dispose();material.dispose();texture.dispose();sourceDepth?.dispose();
      if(canvas){canvas.getAnimations().forEach(a=>a.cancel());canvas.remove();canvas.className='holo';canvas.style.cssText='';delete canvas.dataset.transition;delete canvas.dataset.points;delete canvas.dataset.progress;}
    }};
  }};
})();
