/* BCA Studio point forms.
   Each form is sampled once on the CPU as anatomy (where the lines, veins, membranes and rings are)
   and animated on the GPU by bcaLife(), which carries the motion physics:
   butterfly wing strokes, peony bloom breathing, Keplerian orbits and lensing around a black hole,
   jet propulsion of a jellyfish bell with delayed tentacles.

   Per point: position (xyz) and detail (x feature, y part, z, w).
   - feature: line emphasis 0..1; a negative value marks a dust point and gives its scatter radius.
   - part, z, w: form-specific parameters read by bcaLife (angles, radii, arc length, side...).
   For forms whose motion is computed from parameters (orbits, bell, tentacles) the position
   attribute holds small offsets, not final coordinates; bcaLife always produces the final shape. */
(function(){
  'use strict';
  const PI=Math.PI,TAU=PI*2,D2R=PI/180;
  function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function gauss(r){return Math.sqrt(-2*Math.log(Math.max(1e-6,r())))*Math.cos(TAU*r());}
  /* smooth interpolation through a table of [x, y] rows */
  function table(rows){
    return x=>{
      if(x<=rows[0][0])return rows[0][1];
      for(let i=1;i<rows.length;i++){
        if(x<=rows[i][0]){const a=rows[i-1],b=rows[i],t=(x-a[0])/(b[0]-a[0]),s=t*t*(3-2*t);return a[1]+(b[1]-a[1])*s;}
      }
      return rows[rows.length-1][1];
    };
  }

  /* ---------------- butterfly: a swallowtail, read as an x-ray ----------------
     wings are polar fans from the wing base: radius R(theta) per wing, veins at fixed angles */
  const FORE={base:[.10,.22],lo:-12,hi:62,R:table([[-12,.35],[-6,1.15],[0,1.5],[10,1.82],[20,2.15],[30,2.5],[38,2.72],[45,2.64],[51,2.38],[57,1.7],[62,.45]]),
    veins:[-7,-1,6,13,20,27,33,39,45,51,56],spotU:.885,cellA:[16,38]};
  const HIND={base:[.10,.04],lo:-104,hi:-2,R:table([[-104,.3],[-96,1.0],[-86,1.32],[-74,1.5],[-60,1.58],[-45,1.56],[-30,1.48],[-16,1.32],[-7,.95],[-2,.3]]),
    veins:[-97,-88,-78,-67,-55,-43,-31,-19,-9],spotU:.80,cellA:[-70,-34]};
  function wingR(w,th,hind){
    let R=w.R(th);
    if(hind){
      R+=.82*Math.exp(-Math.pow((th+80)/2.6,2));                 // the tail
      R*=1-.045*Math.pow(.5+.5*Math.cos((th+97)/11.8*TAU),2);    // scalloped margin between veins
    }else R*=1-.012*(.5+.5*Math.cos((th+7)/6.5*TAU));
    return R;
  }
  function wingPoint(w,hind,th,u){
    const R=wingR(w,th,hind)*u,a=th*D2R;
    const x=w.base[0]+Math.cos(a)*R,y=w.base[1]+Math.sin(a)*R;
    const z=(hind?-.035:0)+.16*u*u+.025*Math.sin(u*PI)*Math.sin(th*.31);
    return [x,y,z];
  }
  function butterfly(r,o){
    const q=r(),side=r()<.5?-1:1;
    if(q<.075){                                                     // body
      const k=r();
      if(k<.18){const a=r()*TAU,b=Math.acos(2*r()-1);o(side*Math.abs(.10*Math.sin(b)*Math.cos(a)),.47+.10*Math.cos(b),.10*Math.sin(b)*Math.sin(a),.75,0,side,0);return;}
      if(k<.5){const a=r()*TAU,b=Math.acos(2*r()-1);o(.14*Math.sin(b)*Math.cos(a),.08+.34*Math.cos(b),.14*Math.sin(b)*Math.sin(a),.55,0,side,0);return;}
      const t=r(),y=-.26-1.25*t,rad=.12*Math.pow(1-t,.55)*(1-.12*Math.pow(Math.cos(t*PI*9),8)),a=r()*TAU;
      o(Math.cos(a)*rad,y,Math.sin(a)*rad,Math.abs(Math.cos(t*PI*9))>.97?.85:.45,0,side,t);return;
    }
    if(q<.105){                                                     // antennae with clubs, legs
      if(r()<.62){
        const t=r(),x=.04+.42*t+.05*Math.sin(t*PI),y=.52+1.05*t+.08*t*t,club=t>.9?(t-.9)*1.2:0;
        o(side*(x+club*(r()-.5)),y+club*(r()-.5),.02*Math.sin(t*PI),t>.9?.95:.8,3,side,t);return;
      }
      const leg=Math.floor(r()*3),t=r(),y0=.18-leg*.16;
      o(side*(.10+.34*t),y0-.22*t-.25*t*t*(leg===2?1:.6),-.12*t,.7,3,side,t);return;
    }
    const hind=r()<.4,w=hind?HIND:FORE,part=hind?2:1;
    let th=w.lo+(w.hi-w.lo)*r(),u,f;
    const s=r();
    if(s<.20){u=r()<.6?1:.965;f=.95;}                                // margin, doubled
    else if(s<.45){                                                 // veins, gently curved
      const v=w.veins[Math.floor(r()*w.veins.length)];u=Math.pow(r(),.8);th=v+5*u*(1-u)*(v>w.veins[Math.floor(w.veins.length/2)]?1:-1);f=.78;
    }else if(s<.50){                                                 // discal cell
      const p=r()*TAU;th=(w.cellA[0]+w.cellA[1])/2+(w.cellA[1]-w.cellA[0])/2*Math.cos(p);u=.36+.12*Math.sin(p);f=.72;
    }else if(s<.60){                                                 // submarginal lunules between veins
      const i=Math.floor(r()*(w.veins.length-1)),a=w.veins[i],b=w.veins[i+1],p=r()*TAU,rr=Math.sqrt(r());
      th=(a+b)/2+(b-a)*.26*Math.cos(p)*rr;u=w.spotU+.045*Math.sin(p)*rr;f=rr>.85?.85:.42;
    }else{                                                          // membrane: denser toward the margin, like an x-ray
      u=r()<.55?1-Math.pow(r(),2.2)*.75:Math.sqrt(r());f=.12+.18*u*u;
    }
    const p=wingPoint(w,hind,th,u);
    o(p[0]*side,p[1],p[2],f,part,side,u);
  }

  /* ---------------- peony: ten whorls of ruffled petals around a crown of stamens ---------------- */
  const LAYERS=10;
  const LAYER_CDF=(()=>{const w=[];let sum=0;for(let l=0;l<LAYERS;l++){const k=l/(LAYERS-1);sum+=(1.95-.95*k)*(.95-.45*k)*(5+Math.round(l*1.15))*Math.pow(1-.62*k,2);w.push(sum);}return w.map(x=>x/sum);})();
  function petalPoint(layer,petal,count,s,v,jit){
    const k=layer/(LAYERS-1);                                       // 0 outer .. 1 inner
    const r0=.10+.36*(1-k),L=1.9-.95*k,W=.98-.45*k,e0=.18+1.0*k,c=-.12+1.65*k;
    const a=petal/count*TAU+layer*2.39996+jit*.18;
    const e=e0+c*s,cc=Math.abs(c)<1e-3?1e-3:c;
    const rho=r0+L*(Math.sin(e)-Math.sin(e0))/cc,h=-L*(Math.cos(e)-Math.cos(e0))/cc;
    const w=W*Math.pow(Math.max(0,s),.55)*Math.pow(Math.max(0,1-Math.pow(s,5)),.5)*1.08;
    const cup=(.18+.22*k)*v*v*w;
    const ruff=(.09-.04*k)*Math.sin(v*7.3+s*11+petal*1.7+layer)*Math.pow(s,2.6)+.03*Math.sin(v*23+layer*3)*Math.pow(s,4);
    const n=cup+ruff,nr=-Math.sin(e),ny=Math.cos(e);                // petal normal in the radial plane
    const R=rho+nr*n,Y=.18+h+ny*n,ca=Math.cos(a),sa=Math.sin(a);
    return [ca*R-sa*v*w,Y,sa*R+ca*v*w];
  }
  function flower(r,o){
    const q=r();
    if(q<.035){                                                     // stamens and carpels
      const t=r();
      if(t<.12){const k=Math.floor(r()*5),a=k/5*TAU,b=r()*TAU,c=r()*PI;o(Math.cos(a)*.09+.06*Math.sin(c)*Math.cos(b),.30+.10*Math.cos(c),Math.sin(a)*.09+.06*Math.sin(c)*Math.sin(b),.7,0,0,0);return;}
      const id=Math.floor(r()*260),a=id*2.39996,rad=.10+.34*Math.sqrt(id/260),hgt=.30+.10*Math.sin(id*1.3);
      const along=t<.55?r():1;
      const x=Math.cos(a)*rad*(.55+.45*along),z=Math.sin(a)*rad*(.55+.45*along),y=.22+hgt*along;
      if(along===1){const b=r()*TAU;o(x+.018*Math.cos(b),y+.012*Math.sin(b*2),z+.018*Math.sin(b),.9,0,0,1);}
      else o(x,y,z,.5,0,0,along);
      return;
    }
    const lr=r();let layer=0;while(layer<LAYERS-1&&LAYER_CDF[layer]<lr)layer++;const lc=layer,count=5+Math.round(lc*1.15),petal=Math.floor(r()*count),jit=Math.sin(petal*12.9+layer*4.1);
    let s=r(),v=r()*2-1,f;
    const m=r();
    if(m<.22){v=r()<.5?-1:1;s=Math.min(s,.985);f=.9-.35*layer/(LAYERS-1);}               // outline
    else if(m<.50){v=(Math.floor(r()*9)/8)*2-1;v*=.92;s=Math.pow(s,.8);f=.55-.25*layer/(LAYERS-1);}   // veins fanning along the petal
    else{s=Math.sqrt(s);f=(.08+.2*Math.pow(Math.abs(v),3)+.12*s*s)*(1-.5*layer/(LAYERS-1));}
    const p=petalPoint(layer,petal,count,s,v,jit);
    o(p[0],p[1],p[2],f,1,layer/(LAYERS-1),s);
  }

  /* ---------------- cosmos: a three-fold manifold through a ringed disk, with two chart planes ---------------- */
  function chartPlane(r,o,cx,cy,cz,rz,ry,A,B){
    const m=r();let x,y,f;
    if(m<.32){const a=r()*TAU,k=r()<.7?1:.94;x=A*k*Math.cos(a);y=B*k*Math.sin(a);f=.9;}
    else if(m<.62){const n=Math.floor(r()*7)+1,a=r()*TAU,rr=n/8;x=A*rr*Math.cos(a)+A*.18*(1-rr);y=B*rr*.92*Math.sin(a)-B*.1*(1-rr);f=.45;}
    else if(m<.78){const t=r()*2-1;x=A*.15*t;y=B*.98*t;f=r()<.4?1:.7;}       // the bright axis
    else if(m<.88){const n=Math.floor(r()*5)-2,t=r()*2-1;y=B*n/3.2;x=t*A*Math.sqrt(Math.max(0,1-(y*y)/(B*B)));f=.35;}
    else{let a=r()*TAU,rr=Math.sqrt(r());x=A*rr*Math.cos(a);y=B*rr*Math.sin(a);f=.12;}
    let X=x,Y=y,Z=0;
    const cz2=Math.cos(rz),sz=Math.sin(rz);[X,Y]=[X*cz2-Y*sz,X*sz+Y*cz2];
    const cy2=Math.cos(ry),sy=Math.sin(ry);[X,Z]=[X*cy2+Z*sy,-X*sy+Z*cy2];
    o(X+cx,Y+cy,Z+cz,f,3,0,0);
  }
  function cosmos(r,o){
    const q=r();
    if(q<.04){const g=Math.abs(gauss(r))*.22,a=r()*TAU,b=Math.acos(2*r()-1);o(g*Math.sin(b)*Math.cos(a),g*Math.cos(b)*.6,g*Math.sin(b)*Math.sin(a),.95,0,0,0);return;}
    if(q<.32){                                                      // ringed disk, Keplerian
      const ring=r()<.75,rr=ring?.3+Math.pow(Math.floor(r()*44)/43,1.25)*3.1:.3+Math.pow(r(),1.4)*3.1;
      o(0,gauss(r)*.012*(1+rr),0,ring?(Math.floor(rr*7)%3===0?.85:.55):.15,1,r()*TAU,rr);return;
    }
    if(q<.74){                                                      // monkey-saddle sheets: contour loops, meridians, membrane
      const sheet=r()<.62?0:1,m=r();let rr,a=r()*TAU,f;
      if(m<.60){rr=(Math.floor(r()*14)+1)/14*2.05;f=.78;}
      else if(m<.76){a=Math.floor(r()*18)/18*TAU;rr=r()*2.05;f=.55;}
      else{rr=Math.sqrt(r())*2.05;f=.12;}
      o(sheet,gauss(r)*.008,0,f,2,a,rr);return;
    }
    if(q<.86){if(r()<.5)chartPlane(r,o,-1.9,1.55,-.8,-.45,.55,1.0,1.95);else chartPlane(r,o,2.0,-1.6,.5,-.45,-.6,.95,1.85);return;}
    if(q<.93){const a=r()*TAU,b=Math.acos(2*r()-1),rr=2.2+r()*2.2;o(rr*Math.sin(b)*Math.cos(a),rr*Math.cos(b)*.75,rr*Math.sin(b)*Math.sin(a),r()<.1?.8:.2,4,0,0);return;}
    const a=r()*TAU,rr=.4+Math.pow(r(),.6)*3.2;o(0,gauss(r)*.25,0,.12,1,a,rr);  // diffuse disk haze
  }

  /* ---------------- black hole: thin disk, lensed halo, photon ring, infalling streams ---------------- */
  /* in units of the shadow radius (√27 M ≈ 5.2 M): the photon ring sits at ~1, the disk's inner edge at the
     innermost stable orbit (6 M ≈ 1.15), and the far side of the disk is lensed over and under the shadow */
  function blackhole(r,o){
    const q=r();
    if(q<.40){                                                      // thin disk, denser and brighter inward
      const ring=r()<.18;let rr;
      if(ring)rr=1.18+Math.pow(Math.floor(r()*22)/21,1.7)*2.4;
      else rr=1.18+2.4*Math.pow(r(),2.1);
      const a=r()*TAU,f=(ring?.42:.18)+.5*Math.exp(-(rr-1.18)*2.2);
      o(gauss(r)*.01,gauss(r)*.012*rr,0,Math.min(1,f),1,a,rr);return;
    }
    if(q<.48){                                                      // hot clumps that orbit and shear
      const k=Math.floor(r()*16),rr=1.25+1.9*Math.pow(((k*.618)%1),1.3)+gauss(r)*.03,a=k*2.4+gauss(r)*.18;
      o(0,gauss(r)*.01,0,.85,1,a,rr);return;
    }
    if(q<.68){                                                      // lensed far side: p.y flags the upper/lower image
      const up=r()<.7,rr=1.18+2.4*Math.pow(r(),2.4),band=r()<.22;
      const rd=band?1.18+2.4*Math.pow(Math.floor(r()*9)/8,1.6):rr;
      o(gauss(r)*.004,up?0:1,0,Math.min(1,.2+.75*Math.exp(-(rd-1.18)*2.2)+(band?.12:0)),2,-r()*PI,rd);return;
    }
    if(q<.75){const a=r()*TAU,rr=.98+(r()<.7?0:.05)+gauss(r)*.004;o(0,0,0,.95,4,a,rr);return;}   // photon ring
    if(q<.88){const arm=Math.floor(r()*3);o(gauss(r)*.03,gauss(r)*.02,0,.5,5,arm/3*TAU+r()*.25,r());return;}  // infall
    const a=r()*TAU,rr=3.7+r()*1.6;o(gauss(r)*.2,gauss(r)*.25,0,.12,1,a,rr);  // outer dust lane
  }

  /* ---------------- jellyfish: bell, radial canals, gonads, oral arms, marginal tentacles ---------------- */
  function jellyfish(r,o){
    const q=r();
    if(q<.30){                                                      // bell: a wide, slightly flattened lens
      let a=r()*TAU,s,inset=0,f;const m=r();
      if(m<.38){s=Math.sqrt(r());f=.11;}                            // translucent exumbrella
      else if(m<.46){s=(Math.floor(r()*5)+1)/6+gauss(r)*.006;f=.32;} // faint growth bands
      else if(m<.54){a=Math.floor(r()*32)/32*TAU+(r()-.5)*.004;s=.2+.8*r();f=.34;}  // fine radial canals
      else if(m<.68){s=.975+r()*.025;f=.95;}                        // rim
      else if(m<.74){s=1;inset=-1;f=.62;a=r()*TAU;}                 // short marginal fringe
      else{s=Math.sqrt(r());inset=1;f=.13;}                         // subumbrella, seen through the bell
      o(inset,r(),0,f,1,a,Math.min(1,Math.max(0,s)));return;
    }
    if(q<.42){const k=Math.floor(r()*13);o(Math.sin(k*7.31),Math.cos(k*3.7),0,.55,2,k/13*TAU+.3,Math.pow(r(),.75));return;}  // thin marginal tentacles
    // oral arms: four long, pleated curtains with lobed, frilled hems, spiralling down from the centre
    const arm=Math.floor(r()*4),layer=Math.floor(r()*2),s=Math.pow(r(),.9);let v=r()*2-1,f=.14;
    const e=r();
    if(e<.30){v=v<0?-1:1;f=.9;}                                     // frilled hems
    else if(e<.40){v=(Math.floor(r()*5)-2)/2.5;f=.4;}               // pleat creases
    o(v,layer,0,f,3,arm/4*TAU+PI/4+layer*.6,s);
  }

  /* ---------------- bouquet: translucent cupped flowers on long stems, each turned its own way ---------------- */
  const BQ_W=[1.25,1.3,1.0,1.2,.95].map(x=>x*x);const BQ_SUM=BQ_W.reduce((a,b)=>a+b,0);
  function bouquet(r,o){
    let u=r()*BQ_SUM,id=0;while(id<4&&u>BQ_W[id]){u-=BQ_W[id];id++;}
    const q=r();
    if(q<.17){o(gauss(r)*.012,0,gauss(r)*.012,r()<.15?.7:.42,3,id,r());return;}   // stem
    if(q<.30){                                                      // stamens: filaments with glowing anthers
      const k=Math.floor(r()*90),a=k*2.39996+id,rad=.06+.30*Math.sqrt(k/90),hgt=.16+.22*(1-k/90)+.05*Math.sin(k*1.7);
      const t=r()<.45?1:r();
      if(t===1){const b=r()*TAU,c=r()*PI;o(Math.cos(a)*rad+.022*Math.sin(c)*Math.cos(b),.02+hgt+.022*Math.cos(c),Math.sin(a)*rad+.022*Math.sin(c)*Math.sin(b),.95,2,id,1);}
      else o(Math.cos(a)*rad*t,.02+hgt*t,Math.sin(a)*rad*t,.45,2,id,t);
      return;
    }
    const n=6,k=Math.floor(r()*n),outer=k%2===0;                    // six broad petals, alternating inner/outer
    let sv=r(),v=r()*2-1,f;const m=r();
    if(m<.30){if(r()<.55)v=v<0?-1:1;else sv=.985+r()*.015;f=.9;}   // outline and rippled rim
    else if(m<.48){v=(Math.floor(r()*7)-3)/3.4;sv=Math.pow(sv,.7);f=.5;}  // veins
    else{sv=Math.sqrt(sv);f=.1+.12*sv*sv;}                          // translucent membrane
    const a=k/n*TAU+id*.7+(outer?0:.08),span=(PI/n)*(.62+.62*sv)*(outer?1.08:.92);
    const sc=outer?1:.86;
    let rho=(.10+.80*sv+.30*sv*sv*sv)*sc,h=(.95*Math.pow(sv,.8)-.12*sv*sv*sv)*sc*(outer?1:1.08);
    const rim=Math.pow(sv,4);
    rho+=.06*Math.sin(v*7+k*2.1+id)*rim;h+=.08*Math.sin(v*5.3+k*1.3+id*2)*rim;
    const cup=.08*(1-v*v)*sv;                                       // each petal is dished
    const aa=a+span*v;rho-=cup;
    o(Math.cos(aa)*rho,h,Math.sin(aa)*rho,f,1,id,sv);
  }

  const names=['Kelebek','Çiçek','Uzay','Kara delik','Denizanası','Çiçekler'];
  const samplers=[butterfly,flower,cosmos,blackhole,jellyfish,bouquet];
  const DUST=[.08,.08,.07,.06,.08,.07],DUSTR=[.55,.5,.8,.7,.6,.7];
  function make(index,count){
    const r=random(4103+index*7919),positions=new Float32Array(count*3),details=new Float32Array(count*4);
    let i=0;
    const out=(x,y,z,f,part,c,d)=>{positions[i*3]=x;positions[i*3+1]=y;positions[i*3+2]=z;details[i*4]=f;details[i*4+1]=part;details[i*4+2]=c;details[i*4+3]=d;};
    const dust=Math.floor(count*DUST[index]);
    for(;i<count-dust;i++)samplers[index](r,out);
    /* dust: copies of the anatomy, scattered by a negative feature radius so they ride the same motion */
    for(;i<count;i++){
      const j=Math.floor(r()*(count-dust));
      positions[i*3]=positions[j*3];positions[i*3+1]=positions[j*3+1];positions[i*3+2]=positions[j*3+2];
      details[i*4]=-(.08+DUSTR[index]*Math.pow(r(),1.6));details[i*4+1]=details[j*4+1];details[i*4+2]=details[j*4+2];details[i*4+3]=details[j*4+3];
    }
    return {positions,details};
  }

  /* GPU half: final position of a point of form `kind` at time t. Shared by the Studio and the Welcome stage. */
  const glsl=`
  mat2 bcaRot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
  vec3 bcaHash3(vec3 q){return fract(sin(vec3(dot(q,vec3(127.1,311.7,74.7)),dot(q,vec3(269.5,183.3,246.1)),dot(q,vec3(113.5,271.9,124.6))))*43758.5453)*2.-1.;}
  float bcaPulse(float f){return f<.28?sin(f/.28*1.5707963):.5+.5*cos((f-.28)/.72*3.1415927);}
  float bcaGlow=1.;
  vec3 bcaLife(vec3 p,vec4 d,float kind,float t){
    bcaGlow=1.;
    vec3 seedv=bcaHash3(p*3.17+d.yzw*1.31+vec3(d.x));
    float part=d.y;
    if(kind<.5){
      /* butterfly: wings rotate about the body axis; the downstroke is faster than the upstroke,
         the hindwing trails the forewing and the wing tips trail their roots */
      float w=5.2,ph=t*w;
      if(part>.5&&part<2.5){
        float lag=(part>1.5?.30:0.)+d.w*.32;
        float q=ph-lag;
        float flap=.15+.92*sin(q+.42*sin(q));
        float hinge=.06,x=abs(p.x)-hinge;
        float side=sign(d.z);
        float nx=hinge+x*cos(flap)-p.z*sin(flap)*.3;
        p.z=x*sin(flap)+p.z*cos(flap);
        p.x=side*nx;
      }else if(part>2.5){
        p.x+=sign(d.z)*.03*sin(ph*.5+d.w*3.);
      }else{
        p.y+=.04*sin(ph*.5)*d.w;                  /* abdomen sways */
      }
      p.y+=-.11*cos(ph);                          /* the body lifts on each downstroke */
      p.yz=bcaRot(-.95+.05*sin(ph))*p.yz;
      p.xz=bcaRot(.38*sin(t*.21))*p.xz;
      p.xy=bcaRot(.22+.10*sin(t*.29))*p.xy;
      p*=1.38;
      p+=vec3(.32*sin(t*.33),.22*sin(t*.51),.18*sin(t*.27));
    }else if(kind<1.5){
      /* peony: the whorls breathe open in sequence from outside in; petal margins tremble */
      if(part>.5){
        float k=d.z,s=d.w;
        float open=.055*sin(t*.55-k*3.4)*s*s;
        float r=length(p.xz);
        p.xz*=1.+open;
        p.y-=open*r*.55;
        p+=vec3(.012,.018,.012)*sin(t*1.7+k*31.+s*9.+p.x*4.)*s*s*s;
      }else{
        p.xz*=1.+.04*sin(t*.9+p.y*12.);
      }
      p.xz=bcaRot(t*.045)*p.xz;
      p.y-=.35;
      p.yz=bcaRot(.95+.05*sin(t*.31))*p.yz;
      p.xy=bcaRot(-.10+.08*sin(t*.23))*p.xy;
    }else if(kind<2.5){
      /* cosmos: Keplerian disk, slowly twisting three-fold sheets, drifting chart planes */
      if(part<.5){p*=1.+.07*sin(t*1.6+seedv.x*3.);}
      else if(part<1.5){float r=d.w,a=d.z+t*.42*pow(r+.15,-1.5);p=vec3(r*cos(a),p.y,r*sin(a));}
      else if(part<2.5){
        float k=p.x,r=d.w,a=d.z+t*(.04+.035*k);
        float amp=(k<.5?.24:-.21)*(1.+.12*sin(t*.33+k*2.1));
        vec3 q=vec3(r*cos(a),amp*r*r*r*cos(3.*(a+k*1.0472))+p.y,r*sin(a));
        if(k>.5){q*=.82;q.yz=bcaRot(.62)*q.yz;q.xy=bcaRot(.35)*q.xy;}
        p=q;
      }else if(part<3.5){p.xz=bcaRot(.05*sin(t*.12))*p.xz;p.y+=.06*sin(t*.2+p.x);}
      p.xz=bcaRot(t*.035)*p.xz;
      p.yz=bcaRot(.40)*p.yz;
      p.xy=bcaRot(-.32)*p.xy;
      p*=.86;
    }else if(kind<3.5){
      /* black hole: the disk turns at the Keplerian rate (inner orbits faster); its far side is lensed
         into the arcs above and below the shadow, which stays empty */
      float incl=.20;
      float W0=.55;                                                 // orbital rate at r=1; Omega ∝ r^-1.5 (Kepler)
      if(part<1.5||part>4.5){
        float r=d.w,a;
        if(part>4.5){float s=fract(d.w+t*.035);r=3.8-2.62*s;a=d.z+3.6*s;}   // spiralling in, then plunging past the ISCO
        else a=d.z;
        a-=t*W0*pow(r,-1.5);
        vec3 q=vec3((r+p.x)*cos(a),p.y,(r+p.x)*sin(a));
        /* relativistic beaming: the side coming toward us is brighter; orbital speed ∝ r^-1/2 */
        float beta=.55*pow(1.18/max(r,1.18),.5);
        bcaGlow=clamp(pow(1.+beta*(-cos(a)),3.)/pow(1.+beta*.0,3.),.25,2.4);
        q.yz=bcaRot(incl)*q.yz;
        if(q.z<0.&&length(q.xy)<1.04)q.xy=normalize(q.xy+vec2(1e-4))*(1.04+.04*abs(seedv.x));
        p=q;
      }else if(part<2.5){
        /* the lensed image moves with the far side of the disk at the same Kepler rate */
        float rd=d.w,a=d.z-t*W0*pow(rd,-1.5);
        a=-mod(-a,3.1415927);                                       // keep within the far half (-π..0)
        float rho=1.06+(rd-1.18)*.42+p.x;
        float up=p.y<.5?1.:0.;
        float beta=.55*pow(1.18/rd,.5);
        bcaGlow=clamp(pow(1.+beta*(-cos(a)),3.),.25,2.4);
        p=vec3(rho*cos(a),rho*abs(sin(a))*(up>.5?1.:-.62),-.15);
      }else{
        float rr=d.w*(1.+.006*sin(t*3.+d.z*9.));
        bcaGlow=1.+.5*(-cos(d.z));
        p=vec3(rr*cos(d.z),rr*sin(d.z),.05);
      }
      p.xy=bcaRot(-.16+.025*sin(t*.12))*p.xy;
    }else if(kind<4.5){
      /* jellyfish: a fast bell contraction (a jet) then a slow recovery; it rises in pulses,
         rests and sinks; tentacles and oral arms answer the stroke with a delay along their length */
      float P=2.5,ph=t/P,cyc=floor(ph),f=fract(ph),n=mod(cyc,10.);
      float act=step(n,5.5);
      float c=bcaPulse(f)*act;
      float g=(1.-exp(-5.*f))/(1.-exp(-5.));
      float rise=act>.5?(n+g)*.30:1.8*(1.-smoothstep(6.,10.,n+f));
      float R=1.36*(1.-.20*c),H=.70*(1.+.24*c);
      if(part<1.5){
        float s=d.w,a=d.z,inset=p.x,lap=smoothstep(.86,1.,s);
        float rr=R*pow(sin(s*1.5707963),.8)*(1.-.07*max(inset,0.));
        rr-=.10*c*smoothstep(.5,1.,s);
        float y=H*pow(cos(s*1.5707963),1.3)-.14*lap*lap-max(inset,0.)*(.08+.30*(1.-s*s));
        if(inset<-.5){float k=p.y;rr*=1.-.04*k;y-=.10*k+.03*sin(a*40.);}   // fringe hangs off the margin
        p=vec3(rr*cos(a),y,rr*sin(a));
      }else if(part<2.5){
        float s=d.w,a=d.z,sd=p.x,sd2=p.y;
        float cs=bcaPulse(fract(f-s*.3))*act;
        float L=5.4*(1.+.03*cs);
        float tx=(.55+1.05*sd)*pow(s,1.35);                         // most trail down-right, a few to the left
        float curl=(.10+.38*s)*sin(s*(5.+3.*sd2)-t*.9+sd*5.)*(.5+.5*(1.-cs));
        vec3 radial=vec3(cos(a),0.,sin(a)),tang=vec3(-sin(a),0.,cos(a));
        p=vec3(R*.97*cos(a),-.14,R*.97*sin(a))*(1.-.45*s)+vec3(tx,-L*s,0.)+tang*curl+radial*curl*.4*sd2;
      }else{
        float s=d.w,v=p.x,layer=p.y;
        float cs=bcaPulse(fract(f-s*.22))*act;
        float ang=d.z+s*2.1+.22*sin(t*.4-s*3.);
        float w=(.34+.40*sin(3.1415927*pow(s,.65)))*(1.-.45*pow(s,2.6))*(1.-.10*cs);
        float r=.12+.22*s+.06*sin(s*4.+t*.4+layer*2.);
        float y=-.30-4.5*s*(1.-.05*cs);
        vec3 radial=vec3(cos(ang),0.,sin(ang)),tang=vec3(-sin(ang),0.,cos(ang));
        float edge=smoothstep(.65,1.,abs(v));
        float pleat=.48*w*sin(v*4.7+layer*1.3+s*7.-t*.5);
        float lobe=.85*w*pow(max(0.,sin(s*7.5+d.z*3.+layer)),2.)*(.3+.7*edge);
        float frill=((.06+.07*s)*sin(s*26.+v*7.-t*1.1)+.014*sin(s*90.+v*18.+t))*edge;
        p=radial*(r+pleat+lobe*.6+frill)+vec3(0.,y+.09*sin(s*14.+v*3.-t*.7)*edge,0.)+tang*(v*w+lobe*sign(v)*.8)+vec3(-.35*pow(s,1.3),0.,0.);
      }
      p*=1.12;
      p.y+=rise*.5+1.5;
      p.yz=bcaRot(-.10)*p.yz;
      p.xy=bcaRot(.40+.05*sin(t*.11)+.03*sin(t*2.513))*p.xy;
      p.x+=.35*sin(t*.09)-.4;
    }
    else{
      /* bouquet: heads sway on their stems around a fixed root, cups breathe open and closed */
      float id=d.z;
      vec4 hd=vec4(-1.35,2.25,.2,1.25);vec2 tl=vec2(.42,.55);
      if(id>.5){hd=vec4(1.05,1.45,-.3,1.3);tl=vec2(-.48,.42);}
      if(id>1.5){hd=vec4(-2.0,.15,.4,1.0);tl=vec2(.62,.35);}
      if(id>2.5){hd=vec4(1.45,-1.15,0.,1.2);tl=vec2(-.35,.5);}
      if(id>3.5){hd=vec4(-1.15,-2.05,.3,.95);tl=vec2(.28,.6);}
      vec3 root=vec3(-.1+.12*id-.25,-7.2,0.);
      float sw=.045*sin(t*.33+id*1.9)+.02*sin(t*.71+id*3.1);
      vec3 head=hd.xyz;head.xy=root.xy+bcaRot(sw)*(head.xy-root.xy);
      float tz=tl.x+sw*1.6+.04*sin(t*.5+id);
      if(part<2.5){
        float open=1.+.07*sin(t*.42+id*1.3)*(part<1.5?d.w:.5);
        vec3 q=p;q.xz*=open;q.y*=1.-.04*(open-1.)*8.;
        if(part>1.5)q.y+=.012*sin(t*1.3+seedv.x*6.);
        q.yz=bcaRot(tl.y)*q.yz;q.xy=bcaRot(tz)*q.xy;
        p=head+q*hd.w;
      }else{
        float s=d.w;
        vec3 base=head+vec3(bcaRot(tz)*vec2(0.,-.04),0.)*hd.w;
        vec3 ctrl=vec3(mix(base.x,root.x,.25)+.35*sin(id*2.3),mix(base.y,root.y,.45),base.z*.5);
        p=(1.-s)*(1.-s)*base+2.*s*(1.-s)*ctrl+s*s*root+p*(1.+1.5*s);
      }
      p.xz=bcaRot(.12*sin(t*.07))*p.xz;
      p*=.95;
    }
    if(d.x<0.){
      vec3 drift=vec3(sin(t*.23+seedv.x*6.),cos(t*.19+seedv.y*6.),sin(t*.17+seedv.z*6.))*.12;
      p+=normalize(seedv+vec3(1e-3))*(-d.x)*(.55+.45*abs(seedv.y))+drift*(-d.x)*2.;
    }
    return p;
  }`;
  /* One shared clock for every view that shows these forms (Studio and Welcome), so both always show the
     same form at the same moment of its motion. Pausing in one pauses the clock for both. */
  const HOLD=9,MORPH=3,SPEED=.36;let pausedAt=null,pausedTotal=0;
  const reducedMQ=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  const now=()=>(typeof performance!=='undefined'?performance.now():Date.now());
  function clock(){return((pausedAt!==null?pausedAt:now())-pausedTotal)/1000;}
  function setPaused(p){if(p&&pausedAt===null)pausedAt=now();else if(!p&&pausedAt!==null){pausedTotal+=now()-pausedAt;pausedAt=null;}}
  function state(){
    const c=clock(),cyc=HOLD+MORPH,i=Math.floor(c/cyc),fr=c-i*cyc,n=names.length,a=i%n,b=(a+1)%n;
    let m=fr<HOLD?0:(fr-HOLD)/MORPH;
    if(reducedMQ.matches)return{t:0,a:m<.5?a:b,b:m<.5?a:b,m:0};
    return{t:c*SPEED,a,b,m};
  }
  window.BCAStudioForms={names,make,glsl,clock,state,setPaused,isPaused:()=>pausedAt!==null,HOLD,MORPH};
})();
