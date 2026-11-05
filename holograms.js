/* Project-specific XYZ reconstructions, rendered only as particles. */
(function(){
  'use strict';
  const T=window.THREE,library=window.BCAHologramModels;
  if(!T||!library)return;
  const {makers,views}=library,cache=new Map(),particleCache=new Map(),depthCache=new Map();
  function model(code){
    if(cache.has(code))return cache.get(code);
    if(!makers[code])return null;
    const g=new T.Group();makers[code](g);g.updateMatrixWorld(true);
    const bb=new T.Box3().setFromObject(g),center=bb.getCenter(new T.Vector3()),size=bb.getSize(new T.Vector3());
    const scale=3.2/Math.max(size.x,size.y,size.z),root=new T.Group();
    g.position.copy(center).multiplyScalar(-scale);g.scale.setScalar(scale);root.add(g);root.updateMatrixWorld(true);
    root.userData={sourceModel:g,extent:size.toArray(),code};cache.set(code,root);return root;
  }
  function properties(o){
    let density=o.material?.userData?.density??1,occludes=o.material?.userData?.occludes!==false;
    for(let p=o;p;p=p.parent){density*=p.userData.density??1;if(p.userData.occludes===false)occludes=false;}
    return {density,occludes};
  }
  function eachTriangle(root,visit){
    root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry,p=geo.attributes.position,idx=geo.index,n=idx?idx.count:p.count,props=properties(o);
      for(let i=0;i<n;i+=3){
        const vertex=j=>new T.Vector3().fromBufferAttribute(p,idx?idx.getX(j):j).applyMatrix4(o.matrixWorld);
        const a=vertex(i),b=vertex(i+1),c=vertex(i+2),normal=b.clone().sub(a).cross(c.clone().sub(a)),area=normal.length()*.5;
        if(area>1e-9)visit({a,b,c,normal:normal.normalize(),area,...props});
      }
    });
  }
  let renderer;
  function getRenderer(){
    if(!renderer){renderer=new T.WebGLRenderer({alpha:false,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x020b12);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.domElement.className='holo';renderer.domElement.setAttribute('aria-hidden','true');}
    return renderer;
  }
  // An authored view makes each project's characteristic face readable immediately.
  // Fit its actual bounds, including tall towers and wide laboratory assemblies.
  function configureCamera(code,camera,aspect){
    const [yaw,elevation]=views[code]||[.45,.35],direction=new T.Vector3(Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation));
    camera.aspect=aspect;camera.position.copy(direction);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    const right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1),root=model(code),tan=Math.tan(camera.fov*Math.PI/360);
    let distance=0;
    // Project real vertices: a box around an L plan invents tall corners above
    // empty courtyards and needlessly shrinks the whole building.
    const p=new T.Vector3();
    root.traverse(o=>{const points=o.geometry?.attributes.position;if(!points)return;
      for(let i=0;i<points.count;i++){
        p.fromBufferAttribute(points,i).applyMatrix4(o.matrixWorld);const depth=p.dot(direction);
        distance=Math.max(distance,depth+Math.abs(p.dot(right))/(tan*aspect)*1.16,depth+Math.abs(p.dot(up))/tan*1.16);
      }
    });
    camera.position.copy(direction).multiplyScalar(distance);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
  }
  function particles(code){
    if(particleCache.has(code))return particleCache.get(code);
    const root=model(code);if(!root)return null;root.updateMatrixWorld(true);
    const triangles=[],weights=[];let total=0;
    eachTriangle(root,tri=>{if(tri.density<=0)return;total+=tri.area*tri.density;triangles.push(tri);weights.push(total);});
    let seed=code.split('').reduce((s,c)=>Math.imul(s,31)+c.charCodeAt(0),321)>>>0;
    const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
    const pick=(arr,cumulative,max)=>{const r=random()*max;let lo=0,hi=cumulative.length-1;while(lo<hi){const m=(lo+hi)>>1;if(cumulative[m]<r)lo=m+1;else hi=m;}return arr[lo];};
    const onTriangle=tri=>{const u=Math.sqrt(random()),v=random();return tri.a.clone().multiplyScalar(1-u).addScaledVector(tri.b,u*(1-v)).addScaledVector(tri.c,u*v);};
    const positions=[],normals=[],seeds=[],ambient=[],features=[];
    const add=(p,n,loose=0,feature=0)=>{positions.push(p.x,p.y,p.z);normals.push(n.x,n.y,n.z);seeds.push(random());ambient.push(loose);features.push(feature);};
    const compact=innerWidth<760,slender=code==='WA'||code==='ALT',count=(compact?13000:26000)*(slender?.58:1);
    // Weight semantic parts, not just their surface area: a large plinth must not
    // steal the samples needed to describe a roof, mechanism or designed product.
    for(let i=0;i<count;i++){
      const tri=pick(triangles,weights,total),p=onTriangle(tri);
      p.x+=(random()-.5)*.003;p.y+=(random()-.5)*.003;p.z+=(random()-.5)*.003;add(p,tri.normal);
    }
    const segments=[],lengths=[];let length=0;
    root.traverse(o=>{if(!o.isLine)return;const p=o.geometry.attributes.position,weight=properties(o).density;
      const segment=(i,j)=>{const a=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld),b=new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld),len=a.distanceTo(b)*weight;if(len<1e-8)return;length+=len;segments.push({a,b});lengths.push(length);};
      if(o.isLineSegments){for(let i=0;i<p.count-1;i+=2)segment(i,i+1);}else{for(let i=0;i<p.count-1;i++)segment(i,i+1);if(o.isLineLoop)segment(p.count-1,0);}
    });
    if(segments.length)for(let i=0;i<(compact?5000:12000)*(slender?.65:1);i++){const s=pick(segments,lengths,length);add(s.a.clone().lerp(s.b,random()),new T.Vector3(0,0,1),0,1);}
    // Loose satellites follow the silhouette, with irregular density and falloff.
    // The core geometry remains legible rather than dissolving into an even box.
    for(let i=0;i<(compact?1900:4800);i++){
      const tri=pick(triangles,weights,total),p=onTriangle(tri),t=random()*Math.PI*2,c=random()*2-1,s=Math.sqrt(1-c*c),r=.045+Math.pow(random(),1.7)*.65;
      p.add(new T.Vector3(s*Math.cos(t),c,s*Math.sin(t)).multiplyScalar(r));add(p,tri.normal,1);
    }
    const geo=new T.BufferGeometry();
    function updateGeometry(){
      geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('aNormal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('aSeed',new T.Float32BufferAttribute(seeds,1));geo.setAttribute('aAmbient',new T.Float32BufferAttribute(ambient,1));geo.setAttribute('aFeature',new T.Float32BufferAttribute(features,1));geo.computeBoundingSphere();
    }
    updateGeometry();
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{uTime:{value:0},uReveal:{value:0},uPointScale:{value:1},uDensityScale:{value:slender?.78:1}},
      vertexShader:`attribute vec3 aNormal;attribute float aSeed,aAmbient,aFeature;uniform float uTime,uReveal,uPointScale,uDensityScale;varying float vLight,vAmbient,vSeed,vScan,vFeature;
        void main(){vAmbient=aAmbient;vSeed=aSeed;vFeature=aFeature;
          vec3 p=position;float scanY=1.8-mod(uTime*2.1,6.2);vScan=exp(-pow((p.y-scanY)/.09,2.));
          float delay=clamp((1.7-p.y)/3.4,0.,1.)*.65;float form=smoothstep(delay,delay+.32,uReveal);
          p=mix(p+vec3(sin(aSeed*91.),cos(aSeed*53.),sin(aSeed*37.))*1.25,p,form);
          if(aAmbient>.5)p+=vec3(sin(uTime*.31+aSeed*37.),cos(uTime*.27+aSeed*29.),sin(uTime*.23+aSeed*61.))*.07;
          vLight=.42+.58*abs(dot(normalize(normalMatrix*aNormal),normalize(vec3(.4,.6,1.))));
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_Position.z-=.000012*gl_Position.w;
          gl_PointSize=clamp((aAmbient>.5?5.5:10.+aSeed*2.+aFeature*5.+vScan*5.)*uPointScale*uDensityScale/(-mv.z),.75,3.1);
        }`,
      fragmentShader:`varying float vLight,vAmbient,vSeed,vScan,vFeature;
        void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float soft=1.-smoothstep(.17,.5,r);
          float alpha=(vAmbient>.5?.075+.12*vSeed:.40+.36*vLight+.16*vFeature)*soft;
          vec3 color=mix(vec3(.24,.68,.84),vec3(.66,.97,1.),vLight*.53+vScan*.47);
          gl_FragColor=vec4(color,alpha*(1.+vScan*1.4));
        }`
    });
    const points=new T.Points(geo,material);points.userData={code,extent:root.userData.extent,pointCount:positions.length/3,geometryType:'reference_xyz_surfaces'};
    particleCache.set(code,points);
    const source=root.userData.sourceModel,screen=source.userData.screen;
    // PACE is a digital product. Its real UI belongs on a planar phone screen;
    // inventing extrusion depth from the screenshot would misrepresent it.
    if(screen)points.userData.screenReady=new Promise(resolve=>{
      const img=new Image();img.onload=()=>{
        try{
          const canvas=document.createElement('canvas');canvas.width=280;canvas.height=Math.round(280*img.naturalHeight/img.naturalWidth);
          const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
          for(let y=0;y<canvas.height;y+=2)for(let x=0;x<canvas.width;x+=2){const i=(y*canvas.width+x)*4,contrast=1-(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255;if(contrast<.18||random()>Math.min(.92,contrast*1.7))continue;
            const p=new T.Vector3((x/canvas.width-.5)*screen.width,(.5-y/canvas.height)*screen.height,screen.z).applyMatrix4(source.matrixWorld);add(p,new T.Vector3(0,0,1),0,1);
          }
          updateGeometry();points.userData.pointCount=positions.length/3;points.userData.screenSource=screen.src;
        }catch(error){console.warn('Hologram screen texture unavailable',error);}
        resolve();
      };img.onerror=resolve;img.src=screen.src;
    });
    return points;
  }
  function depthModel(code){
    if(depthCache.has(code))return depthCache.get(code);
    const root=model(code);if(!root)return null;root.updateMatrixWorld(true);const xyz=[];
    eachTriangle(root,tri=>{if(tri.occludes)for(const p of [tri.a,tri.b,tri.c])xyz.push(p.x,p.y,p.z);});
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
    // Only invisible depth is drawn. Reveal it alongside the downward scan, and
    // leave glazing open so courts, voids and interior mechanisms remain visible.
    const material=new T.ShaderMaterial({colorWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:2,uniforms:{uReveal:{value:0}},
      vertexShader:`varying float vY;void main(){vY=position.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform float uReveal;varying float vY;void main(){float d=clamp((1.7-vY)/3.4,0.,1.)*.65;if(smoothstep(d,d+.32,uReveal)<.94)discard;gl_FragColor=vec4(0.);}`});
    const depth=new T.Mesh(geo,material);depthCache.set(code,depth);return depth;
  }
  window.BCAHolograms={codes:Object.keys(makers),model,particles,depthModel,getRenderer,configureCamera};
})();
