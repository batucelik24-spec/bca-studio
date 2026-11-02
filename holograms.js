/* BCA — reference-led schematic 3D reconstructions, not construction models.
 * Every object below has XYZ surfaces. No photograph, alpha silhouette or
 * luminance depth is used by the renderer. Reference notes: holograms-notes.md.
 */
(function () {
  'use strict';
  const T = window.THREE;
  document.documentElement.dataset.holoLibrary=T?'ready':'three-missing';
  if (!T) return;
  const TAU = Math.PI * 2, V = (x,y,z) => new T.Vector3(x,y,z);
  const surface = new T.MeshPhongMaterial({color:0x135969,emissive:0x042733,shininess:65,side:T.DoubleSide});
  const glass = new T.MeshPhongMaterial({color:0x125364,emissive:0x031c25,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});
  const bright = new T.MeshPhongMaterial({color:0x48d7e5,emissive:0x104655,shininess:80});
  const edge = new T.LineBasicMaterial({color:0x62e6ff,transparent:true,opacity:.72});
  const fine = new T.LineBasicMaterial({color:0x42c9e2,transparent:true,opacity:.36});
  function mesh(g,geo,mat=surface,edges=true) {
    const m = new T.Mesh(geo,mat);g.add(m);
    if(edges) m.add(new T.LineSegments(new T.EdgesGeometry(geo,25),edge));
    return m;
  }
  function box(g,x,y,z,w,h,d,mat=surface) {const m=mesh(g,new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return m;}
  function line(g,pts,mat=edge,closed=false) {const l=new (closed?T.LineLoop:T.Line)(new T.BufferGeometry().setFromPoints(pts.map(p=>Array.isArray(p)?V(...p):p)),mat);g.add(l);return l;}
  function beam(g,a,b,r=.018,mat=bright) {a=V(...a);b=V(...b);const m=mesh(g,new T.CylinderGeometry(r,r,a.distanceTo(b),5),mat,false);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),b.sub(a).normalize());return m;}
  function cylinder(g,x,y,z,r,h,mat=surface,segments=48) {const m=mesh(g,new T.CylinderGeometry(r,r,h,segments),mat);m.position.set(x,y,z);return m;}
  function panel(g,pts,thick=.05) {const s=new T.Shape();pts.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(g,new T.ExtrudeGeometry(s,{depth:thick,bevelEnabled:false,curveSegments:24}));}
  function gridSurface(g,fn,nu=32,nv=16,mat=surface) {
    const pos=[],idx=[];
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)pos.push(...fn(i/nu,j/nv));
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1;idx.push(a,c,b,b,c,c+1);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,mat,false);
    for(let j=0;j<=nv;j+=2)line(g,Array.from({length:nu+1},(_,i)=>fn(i/nu,j/nv)),fine);
    for(let i=0;i<=nu;i+=2)line(g,Array.from({length:nv+1},(_,j)=>fn(i/nu,j/nv)),fine);
  }
  function ellipse(g,a,b,y,mat=edge) {line(g,Array.from({length:128},(_,i)=>[a*Math.cos(i*TAU/128),y,b*Math.sin(i*TAU/128)]),mat,true);}
  function rectRing(g,w,d,y) {line(g,[[-w/2,y,-d/2],[w/2,y,-d/2],[w/2,y,d/2],[-w/2,y,d/2]],edge,true);}
  const makers={};

  makers.PCE=function(g){
    // The interface is presented on a phone: sample its frame, screen and controls in XYZ.
    const w=1.65,h=3.4,r=.22,s=new T.Shape();
    s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
    s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);
    s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    const frame=mesh(g,new T.ExtrudeGeometry(s,{depth:.13,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3,curveSegments:16}));frame.position.z=-.065;
    box(g,0,0,.09,1.47,3.12,.012,glass);
    box(g,0,1.37,.12,.47,.11,.025,bright);
    box(g,0,-1.35,.12,.48,.026,.016,bright);
    box(g,-.84,.67,0,.045,.32,.07,bright);box(g,.84,.48,0,.045,.46,.07,bright);
    box(g,-.34,.65,.12,.58,.14,.014,bright);box(g,0,-.76,.12,1.2,.28,.018,bright);
    for(let j=0;j<3;j++)box(g,0,-.18-j*.17,.12,1.15,.025,.018,bright);
  };

  makers.BDP=function(g){
    // Six cylindrical speaker chambers, 3 across × 2 high, black end grilles, on a single pole with a round foot.
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      const x=(col-1)*.84,y=(row-.5)*.84;
      const m=mesh(g,new T.CylinderGeometry(.42,.42,2.0,64),surface);m.rotation.x=Math.PI/2;m.position.set(x,y,0);
      for(const z of [-1.0,1.0]){
        const disk=mesh(g,new T.CircleGeometry(.4,48),glass,false);disk.position.set(x,y,z);
        const ring=mesh(g,new T.TorusGeometry(.4,.02,6,64),bright,false);ring.position.set(x,y,z);
        for(let k=-5;k<=5;k++){const xx=k*.066,yy=Math.sqrt(.36*.36-xx*xx);line(g,[[x+xx,y-yy,z],[x+xx,y+yy,z]],fine);}
      }
    }
    cylinder(g,0,-2.35,0,.07,3.1,bright,16);                          // pole
    cylinder(g,0,-3.9,0,.85,.06,surface,64);                          // round foot
    box(g,0,-.95,0,.5,.12,.5);                                        // mount
  };

  makers.ABR=function(g){
    // Open through-cells. One ellipse intersected by the central cross, plus perimeter cells.
    const depth=1.25,t=.045;
    for(const y of [-.93,-.56,0,.56,.93])box(g,0,y,0,3.08,t,depth);
    for(const x of [-1.52,1.52])box(g,x,0,0,t,1.9,depth);
    for(const x of [-1.02,1.02])box(g,x,0,0,t,1.86,depth);
    box(g,0,0,0,t,1.86,depth);
    for(const x of [-.51,.51])for(const y of [-.745,.745])box(g,x,y,0,t,.37,depth);
    // Extruded elliptical annulus: hollow all the way to the back face.
    const s=new T.Shape();s.absellipse(0,0,1.055,.57,0,TAU,false,0);
    const hole=new T.Path();hole.absellipse(0,0,1.012,.527,0,TAU,true,0);s.holes.push(hole);
    const ring=mesh(g,new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:80}));ring.position.z=-depth/2;
    for(const x of [-1.55,1.55])for(let z=-.55;z<=.55;z+=.105)beam(g,[x,-.91,z],[x,.91,z],.007,bright);
  };

  makers.WA=function(g){
    const h=5.7,fh=h/19,w=1.25;
    for(let i=0;i<=19;i++){
      const y=i*fh;
      if(i>=4&&i<=6){
        // Opposite triangular plates leave the documented diagonal urban passage open.
        for(const sign of [-1,1]){const slab=panel(g,[[sign*.625,-.625],[sign*.625,sign*.625],[-sign*.28,-sign*.625]],.035);slab.rotation.x=-Math.PI/2;slab.position.y=y;}
      }else box(g,0,y,0,w,.028,w);
    }
    for(const x of [-.625,.625])for(const z of [-.625,.625])beam(g,[x,0,z],[x,h,z],.028);
    for(let side=0;side<4;side++){
      const wall=new T.Group();wall.rotation.y=side*Math.PI/2;g.add(wall);
      for(let bay=0;bay<3;bay++){
        const x=-.625+bay*w/3;
        beam(wall,[x,0,.64],[x,h,.64],.011);
        for(let i=0;i<18;i+=3){const lo=i*fh,hi=Math.min(h,(i+3)*fh);beam(wall,[x,lo,.65],[x+w/3,hi,.65],.016);beam(wall,[x+w/3,lo,.65],[x,hi,.65],.016);}
      }
      // Perforated diagonal facade band represented by its real segmented frame.
      for(let i=0;i<19;i++){const x=.49*Math.sin((i/19)*TAU+side*1.5);box(wall,x,(i+.5)*fh,.66,.20,fh*.88,.025,glass);}
    }
    for(const y of [3*fh,7*fh])box(g,0,y,0,1.63,.055,1.63);
    box(g,0,-.12,0,1.75,.14,1.75);
  };

  function archOutline(g,width,height,x,y,z,pointed=false){
    const pts=[[x-width/2,y,z],[x-width/2,y+height*.55,z]];
    for(let i=0;i<=24;i++){const t=i/24*Math.PI;pts.push([x-width/2*Math.cos(t),y+height*.55+height*.45*(pointed?1-Math.abs(Math.cos(t)):Math.sin(t)),z]);}
    pts.push([x+width/2,y,z]);line(g,pts,edge);
    for(let i=1;i<pts.length;i++)beam(g,pts[i-1],pts[i],.018);
  }
  makers.ALT=function(g){
    const fh=.235,h=24*fh;
    for(let i=0;i<=24;i++)box(g,0,i*fh,0,i<7?1.4:1.27,.025,i<7?1.15:1.02);
    for(let side=0;side<4;side++){
      const wall=new T.Group();wall.rotation.y=side*Math.PI/2;g.add(wall);
      for(const x of [-.64,0,.64])beam(wall,[x,0,.55],[x,h,.55],.018);
      for(let i=7;i<21;i++)for(let j=0;j<6;j++)box(wall,-.54+j*.215,(i+.5)*fh,.525,.014,fh,.025,bright);
      for(let i=0;i<20;i+=4){beam(wall,[-.64,i*fh,.535],[.64,(i+4)*fh,.535],.017);beam(wall,[.64,i*fh,.535],[-.64,(i+4)*fh,.535],.017);}
      for(const x of [-.36,.36])archOutline(wall,.59,.72,x,20.8*fh,.56);
      for(let i=0;i<3;i++)for(const x of [-.48,0,.48])archOutline(wall,.3,fh*.85,x,i*fh,.59);
    }
    box(g,0,h+.05,0,1.38,.1,1.13);box(g,0,-.1,0,1.65,.15,1.4);
  };

  function superPoint(t,a,b,n=3){return [a*Math.sign(Math.cos(t))*Math.pow(Math.abs(Math.cos(t)),2/n),b*Math.sign(Math.sin(t))*Math.pow(Math.abs(Math.sin(t)),2/n)];}
  function stadium(g,kind){
    const tas=kind==='TAS',n=tas?3.4:2.6,a=2.5,b=1.95;
    // Open bowl: terraces follow the actual rounded-rectangular plan, not a filled disc.
    for(let tier=0;tier<15;tier++){
      const r=.49+tier*.026,y=.12+tier*.047;
      gridSurface(g,(u,v)=>{const p=superPoint(u*TAU,a,b,n);return [p[0]*(r+v*.024),y,p[1]*(r+v*.024)];},96,1);
    }
    box(g,0,.04,0,2.15,.035,1.3,glass);rectRing(g,2.1,1.26,.065);line(g,[[0,.066,-.63],[0,.066,.63]],edge);ellipse(g,.20,.20,.07);
    // Roof annulus with true central opening and an asymmetric wind-shaped Al-Jazira edge.
    gridSurface(g,(u,v)=>{const t=u*TAU,r=.53+v*.48,p=superPoint(t,a,b,n),wave=tas?0:.07*Math.sin(t*3+.8);return [p[0]*r,1.02+.12*Math.sin(v*Math.PI)+wave,p[1]*r];},128,10);
    if(tas){
      // Pointed portals repeat around the full perimeter, including the back elevation.
      const count=56;
      for(let i=0;i<count;i++){
        const t=i/count*TAU,p=superPoint(t,a,b,n),next=superPoint((i+.15)/count*TAU,a,b,n);
        const bay=new T.Group();bay.position.set(p[0],.06,p[1]);bay.rotation.y=Math.atan2(next[0]-p[0],next[1]-p[1])+Math.PI/2;g.add(bay);
        archOutline(bay,.21,.89,0,0,0,true);box(bay,-.13,.49,0,.045,.98,.09);
      }
    }else{
      // Continuous layered facade bands and fine radial fins seen in model and axonometric.
      for(const y of [.18,.40,.67,.89])gridSurface(g,(u,v)=>{const t=u*TAU,p=superPoint(t,a*(.97+.018*Math.sin(t*3)),b,n);return [p[0],y+v*.075+.075*Math.sin(t*3+.8),p[1]];},128,1);
      for(let i=0;i<104;i++){const t=i/104*TAU,p=superPoint(t,a,b,n);beam(g,[p[0]*.96,.28,p[1]*.96],[p[0],1.04+.07*Math.sin(t*3+.8),p[1]],.012);}
    }
    const base=cylinder(g,0,-.04,0,2.5,.07,glass);base.scale.z=.79;
  }
  makers.TAS=g=>stadium(g,'TAS');makers.ALJ=g=>stadium(g,'ALJ');

  makers.OPR=function(g){
    // Two tent-like roof wings. Each rises to a single sharp peak on its inner edge at mid-depth and falls
    // concavely to low eaves on every other side; the wings are split by a daylight slot that widens upward.
    // Two oval auditoria sit under the wings; lattice glass walls line the slot.
    const Lx=2.9,Lz=1.7,Hp=2.25,eave=.32,pw=4.5;
    for(const side of [-1,1]){
      const roof=(u,v,off=0)=>{
        const a=(v-.5)*Math.PI,ca=Math.cos(a),sa=Math.sin(a);
        const ex=Math.sign(ca)*Math.pow(Math.abs(ca),2/pw),ez=Math.sign(sa)*Math.pow(Math.abs(sa),2/pw);
        const rho=u,lean=.10*(1-rho);
        const x=side*(.12+lean+Lx*ex*rho),z=Lz*ez*rho;
        const y=eave+(Hp-eave)*Math.pow(1-rho,1.6)+.05*Math.pow(Math.max(0,rho-.82)/.18,2)+off;
        return [x,y,z];
      };
      gridSurface(g,(u,v)=>roof(u,v),28,40);
      gridSurface(g,(u,v)=>roof(u,v,-.05),20,28);
      gridSurface(g,(v,k)=>roof(1,v,-.05*k),40,1);                    // eave edge thickness
      // oval auditorium under each wing
      const hall=cylinder(g,side*1.25,.42,0,.62,.72,glass,64);hall.scale.z=1.45;
      ellipse(g,.62,.62*1.45,.78);
      // lattice glass wall following the slot, from the floor up to the roof's inner edge
      const wall=(u,v)=>{const p=roof(u*.0+.02,.02+v*.96);return [side*.16,v<0?0:u*p[1]*.96,p[2]];};
      gridSurface(g,(u,v)=>{const p=roof(.02,.04+u*.92);return [side*(.16+.05*Math.sin(u*Math.PI)),v*p[1]*.95,p[2]];},18,10,glass);
      for(let i=0;i<=8;i++){const p=roof(.02,.04+i/8*.92);beam(g,[side*.17,0,p[2]],[side*.17,p[1]*.95,p[2]],.012);}
      for(let i=0;i<=10;i++){const p=roof(1,i/10);beam(g,[p[0],.06,p[2]],[p[0],p[1],p[2]],.014);}   // eave columns
    }
    box(g,0,0,0,6.4,.08,4.1);                                        // podium
    box(g,0,.06,0,.2,.03,3.6,bright);                                // slot axis
  };

  makers.STC=function(g){
    // Separate tapered research wings, connecting concourse, central circular auditorium.
    box(g,0,.12,0,4.7,.12,3.7,glass);
    const wing=(x,z,angle,len,rise)=>{
      const w=new T.Group();w.position.set(x,0,z);w.rotation.y=angle;g.add(w);
      box(w,0,.26,0,len,.35,.68,glass);
      const shape=[[-len/2,.42],[-len/2-.30,.93],[-len/2-.14,rise],[len/2,rise*.69],[len/2,.48]];
      const side=panel(w,shape,.07);side.position.z=-.51;
      const back=panel(w,shape,.07);back.position.z=.44;
      // Sloped solid roof joins both elevations in depth.
      gridSurface(w,(u,v)=>[-len/2-.14+u*(len+.14),rise*(1-u*.31),-.51+v*1.02],20,6);
      for(let i=0;i<7;i++){const xx=-len/2+i*len/6;beam(w,[xx,.49,.52],[xx,rise*(1-(i/6)*.31),.52],.013);}
      // Branching diagonal facade structure, based on curved-window studies.
      for(const sign of [-1,1])for(let i=0;i<4;i++)beam(w,[-len/2+.12,.5,sign*.535],[-len/2+.42+i*.3,rise*(.92-i*.10),sign*.535],.032);
    };
    wing(-1.15,.9,-.3,2.45,1.35);wing(1.1,-.9,.3,2.7,1.7);
    box(g,0,.36,0,1.45,.3,.8,glass);cylinder(g,.9,.38,1,.52,.46);ellipse(g,.52,.52,.62);
    for(let i=0;i<16;i++){const t=i*TAU/16;beam(g,[.9+.5*Math.cos(t),.18,1+.5*Math.sin(t)],[.9+.5*Math.cos(t),.63,1+.5*Math.sin(t)],.012);}
  };

  makers.SOC=function(g){
    // Eleven-storey block on a podium: a tower of framed bay windows on the right, a wing on the left whose
    // glazed terraces step back as it rises, and a cantilevered glazed band bridging both near the top.
    const fh=.29,n=11;
    box(g,0,-.16,0,3.1,.32,2.1);                                     // podium / garage plinth
    for(let i=0;i<=n;i++){
      const y=i*fh;
      box(g,.72,y,0,1.5,.035,1.7);                                     // tower slabs
      if(i<n)for(let k=0;k<4;k++){
        if((i+k)%2===0||i>7){box(g,.16+k*.37,y+.14,.9,.28,.22,.12,glass);}
        const fx=.16+k*.37;line(g,[[fx-.15,y+.02,.97],[fx+.15,y+.02,.97],[fx+.15,y+.27,.97],[fx-.15,y+.27,.97]],edge,true);
        const fz=-.6+k*.4;line(g,[[1.5,y+.02,fz-.15],[1.5,y+.02,fz+.15],[1.5,y+.27,fz+.15],[1.5,y+.27,fz-.15]],edge,true);
        if((i+k)%2===1)box(g,1.53,y+.14,fz,.1,.22,.28,glass);
      }
      if(i<=7){                                                      // left wing: terraces step back upward
        const x0=-1.45+i*.07,w=-x0;
        box(g,x0+w/2,y,.05,w,.035,1.55);
        box(g,x0+w/2+.08,y+.14,-.05,w-.16,.25,1.25,glass);
        line(g,[[x0,y+.11,.8],[0,y+.11,.8]],edge);line(g,[[x0,y+.11,-.7],[x0,y+.11,.8]],edge);
        for(let j=0;j<6;j++)beam(g,[x0+j*w/5,y,.8],[x0+j*w/5,y+.11,.8],.005);
      }
    }
    // cantilevered glazed band across floors 7–8, fins all round
    box(g,-.05,2.32,.1,2.3,.04,1.7);box(g,-.05,2.9,.1,2.3,.04,1.7);
    box(g,-.05,2.61,.1,2.2,.54,1.6,glass);
    for(let j=0;j<=16;j++){const x=-1.2+j*2.3/16;beam(g,[x,2.32,.95],[x,2.9,.95],.008);}
    box(g,1.0,3.35,-.35,.9,.9,.9);                                   // stair/lift crown
  };

  makers.DYF=function(g){
    // Actual suspended pivot panels, each with thickness and an independent yaw.
    box(g,0,1.2,-.28,3.6,2.6,.1,glass);
    for(let col=0;col<14;col++){
      const x=-1.69+col*.26;beam(g,[x,-.1,.05],[x,2.7,.05],.009);
      for(let row=0;row<9;row++){
        const pivot=new T.Group();pivot.position.set(x,.1+row*.29,.1);pivot.rotation.y=Math.sin(col*.65+row*.45)*.9;g.add(pivot);
        box(pivot,0,0,0,.235,.255,.045,(row+col)%3===0?glass:surface);
        if(!g.userData.panels)g.userData.panels=[];g.userData.panels.push({pivot,phase:col*.65+row*.45});
      }
    }
    for(const y of [-.03,2.7])box(g,0,y,.03,3.75,.06,.25);
  };

  makers.HMP=function(g){
    // Modular kiosk with open service front, folded canopy, hinged side wall.
    box(g,0,.02,0,2.9,.08,1.9);box(g,0,1.95,0,2.9,.08,1.9);
    for(const x of [-1.45,1.45])for(const z of [-.95,.95])beam(g,[x,0,z],[x,2,z],.025);
    for(let i=0;i<6;i++)for(let j=0;j<4;j++)box(g,-1.2+i*.48,.27+j*.48,-.94,.46,.46,.07);
    for(const x of [-1.45,1.45])for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(g,x,.27+j*.48,-.72+i*.48,.06,.46,.46);
    box(g,0,.58,.84,2.3,.12,.53);box(g,0,.31,.88,2.3,.51,.1,glass);
    const canopy=new T.Group();canopy.position.set(0,1.7,.95);canopy.rotation.x=-.12;g.add(canopy);
    for(let i=0;i<6;i++)for(let j=0;j<3;j++)box(canopy,-1.2+i*.48,0,.24+j*.48,.46,.055,.46,glass);
    for(const x of [-1.35,1.35])beam(g,[x,.92,.95],[x,1.68,2.3],.012);
    const hinge=new T.Group();hinge.position.set(1.48,0,-.92);hinge.rotation.y=-.65;g.add(hinge);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(hinge,.24+i*.48,.27+j*.48,0,.46,.46,.06,glass);
  };

  makers.CBR=function(g){
    // Sinuous island bar, rippled perimeter screen, checker cube stools.
    const curve=new T.CatmullRomCurve3([V(-1.7,.85,.5),V(-1,.85,-.65),V(.2,.85,-.75),V(1.4,.85,-.1),V(.7,.85,.65),V(-.2,.85,.3)],false,'catmullrom',.5);
    const pts=curve.getPoints(100);
    const outline=[];for(let i=0;i<pts.length;i++){const dir=curve.getTangent(i/100);outline.push([pts[i].x+dir.z*.25,pts[i].z-dir.x*.25]);}
    for(let i=pts.length-1;i>=0;i--){const dir=curve.getTangent(i/100);outline.push([pts[i].x-dir.z*.25,pts[i].z+dir.x*.25]);}
    const counter=panel(g,outline,.75);counter.rotation.x=Math.PI/2;counter.position.y=.87;
    line(g,pts,edge);const plinth=cylinder(g,0,.04,0,2.25,.08);plinth.scale.z=.82;
    for(const [x,z] of [[-1.25,1.0],[-.35,1.25],[.65,1.2],[1.55,.75]]){
      box(g,x,.25,z,.4,.4,.4,glass);for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0)box(g,x-.15+i*.1,.455,z-.15+j*.1,.1,.008,.1,bright);
    }
    for(let i=0;i<64;i++){const t=.2+i/63*Math.PI*1.45,x=2.25*Math.cos(t),z=1.8*Math.sin(t);beam(g,[x,.1,z],[x,2.15+.08*Math.sin(t*4),z],.008);}
  };

  makers.OVS=function(g){
    // Cutaway room: blue wall rhythm, red coffered ceiling and central cube installation.
    box(g,0,0,0,4.4,.12,3.4);
    box(g,0,1.15,-1.65,4.4,2.3,.06,glass);box(g,-2.17,1.15,0,.06,2.3,3.3,glass);
    for(let i=0;i<11;i++)beam(g,[-2.1+i*.42,0,-1.60],[-2.1+i*.42,2.3,-1.6],.012);
    // Ceiling frame kept open as a cutaway so the interior remains readable on rotation.
    for(const z of [-1.5,0,1.5])box(g,0,2.35,z,4.4,.15,.12);
    for(const x of [-2.1,0,2.1])box(g,x,2.35,0,.12,.15,3.1);
    for(const [x,z,h] of [[-.7,0,.6],[0,-.35,.75],[.6,.1,.56],[-.25,.6,.38],[.85,-.5,.62],[-1,.6,.22],[1,.7,.2]])box(g,x,h/2+.09,z,.48,h,.48);
    // The headphones are the designed display object, without reconstructing the photographic peacock.
    const band=mesh(g,new T.TorusGeometry(.18,.017,6,36,Math.PI),bright,false);band.position.set(0,1.03,-.35);
    for(const x of [-.18,.18])box(g,x,.99,-.35,.06,.14,.09,bright);
  };

  const cache=new Map();
  function model(code){
    if(cache.has(code))return cache.get(code);
    if(!makers[code])return null;
    const g=new T.Group();makers[code](g);g.updateMatrixWorld(true);
    const bb=new T.Box3().setFromObject(g),center=bb.getCenter(new T.Vector3()),size=bb.getSize(new T.Vector3());
    const scale=3.2/Math.max(size.x,size.y,size.z);
    const pivot=new T.Group();g.position.copy(center).multiplyScalar(-scale);g.scale.setScalar(scale);pivot.add(g);
    pivot.userData={sourceModel:g,extent:[size.x,size.y,size.z],code};cache.set(code,pivot);return pivot;
  }
  let renderer;
  function getRenderer(){if(!renderer){renderer=new T.WebGLRenderer({alpha:false,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x020b12);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.domElement.className='holo';renderer.domElement.setAttribute('aria-hidden','true');}return renderer;}
  const particleCache=new Map();
  function particles(code){
    if(particleCache.has(code))return particleCache.get(code);
    const root=model(code);if(!root)return null;root.rotation.set(0,0,0);root.updateMatrixWorld(true);
    // Area-weighted sampling of actual XYZ triangles, on front, back and inner walls.
    // This replaces raster sampling completely; rotations reveal distinct surfaces.
    const triangles=[],weights=[];let total=0;
    root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry,p=geo.attributes.position,idx=geo.index;
      const n=idx?idx.count:p.count;
      for(let i=0;i<n;i+=3){const a=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i):i).applyMatrix4(o.matrixWorld),b=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+1):i+1).applyMatrix4(o.matrixWorld),c=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+2):i+2).applyMatrix4(o.matrixWorld);
        const normal=b.clone().sub(a).cross(c.clone().sub(a)),area=normal.length()*.5;if(area<1e-9)continue;normal.normalize();total+=area;triangles.push({a,b,c,normal});weights.push(total);
      }
    });
    let seed=code.split('').reduce((s,c)=>s+c.charCodeAt(0),321);
    const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
    const positions=[],normals=[],seeds=[],ambient=[],features=[];
    const count=innerWidth<760?12500:23000;
    for(let i=0;i<count;i++){
      const r=random()*total;let lo=0,hi=weights.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(weights[mid]<r)lo=mid+1;else hi=mid;}
      const tri=triangles[lo],u=Math.sqrt(random()),v=random();const p=tri.a.clone().multiplyScalar(1-u).addScaledVector(tri.b,u*(1-v)).addScaledVector(tri.c,u*v);
      // Loose rather than crisp: every sample drifts a little off its surface, and some drift well clear of it.
      const g1=(random()+random()+random()-1.5)*.04,g2=(random()+random()+random()-1.5)*.04,g3=(random()+random()+random()-1.5)*.04;
      p.x+=g1;p.y+=g2;p.z+=g3;p.addScaledVector(tri.normal,(random()-.5)*.06);
      if(random()<.14){const t=random()*TAU,c=random()*2-1,sn=Math.sqrt(1-c*c),k=.08+.38*random()*random();p.x+=k*sn*Math.cos(t);p.y+=k*c;p.z+=k*sn*Math.sin(t);}
      positions.push(p.x,p.y,p.z);normals.push(tri.normal.x,tri.normal.y,tri.normal.z);seeds.push(random());ambient.push(0);features.push(0);
    }
    const segments=[],lengths=[];let length=0;
    root.traverse(o=>{if(!o.isLine)return;const p=o.geometry.attributes.position;const add=(i,j)=>{const a=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld),b=new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld),len=a.distanceTo(b);if(len<1e-8)return;length+=len;segments.push({a,b});lengths.push(length);};
      if(o.isLineSegments){for(let i=0;i<p.count-1;i+=2)add(i,i+1);}else{for(let i=0;i<p.count-1;i++)add(i,i+1);if(o.isLineLoop)add(p.count-1,0);}
    });
    if(segments.length)for(let i=0;i<3200;i++){
      const r=random()*length;let lo=0,hi=lengths.length-1;while(lo<hi){const m=(lo+hi)>>1;if(lengths[m]<r)lo=m+1;else hi=m;}
      const s=segments[lo],p=s.a.clone().lerp(s.b,random());p.x+=(random()-.5)*.05;p.y+=(random()-.5)*.05;p.z+=(random()-.5)*.05;positions.push(p.x,p.y,p.z);normals.push(0,0,1);seeds.push(random());ambient.push(0);features.push(1);
    }
    // Sparse, irregular satellite clouds, rather than an evenly filled box around the object.
    for(let i=0;i<4500;i++){
      const t=random()*TAU,cost=random()*2-1,sint=Math.sqrt(1-cost*cost),radius=1.25+Math.pow(random(),1.6)*1.5;
      positions.push(radius*sint*Math.cos(t),radius*cost*.8,radius*sint*Math.sin(t));normals.push(0,1,0);seeds.push(random());ambient.push(1);features.push(0);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('aNormal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('aSeed',new T.Float32BufferAttribute(seeds,1));geo.setAttribute('aAmbient',new T.Float32BufferAttribute(ambient,1));geo.setAttribute('aFeature',new T.Float32BufferAttribute(features,1));
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{uTime:{value:0},uReveal:{value:0},uPointScale:{value:1}},
      vertexShader:`attribute vec3 aNormal;attribute float aSeed,aAmbient,aFeature;uniform float uTime,uReveal,uPointScale;varying float vLight,vAmbient,vSeed,vScan,vFeature;
        void main(){vAmbient=aAmbient;vSeed=aSeed;vFeature=aFeature;
          vec3 p=position;float travel=mod(uTime*.75,5.2);float scanY=2.6-travel;
          vScan=exp(-pow((p.y-scanY)/.105,2.));
          float delay=(1.7-p.y)/3.4*.38;float form=smoothstep(delay,delay+.6,uReveal);
          vec3 cloud=p+vec3(sin(aSeed*91.),cos(aSeed*53.),sin(aSeed*37.))*1.25;
          p=mix(cloud,p,form);
          if(aAmbient>.5){p+=vec3(sin(uTime*.31+aSeed*37.),cos(uTime*.27+aSeed*29.),sin(uTime*.23+aSeed*61.))*.14;}
          vec3 n=normalize(normalMatrix*aNormal);vLight=.3+.7*abs(dot(n,normalize(vec3(.4,.6,1.))));
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp((aAmbient>.5?8.:13.+aSeed*5.+aFeature*3.+vScan*8.)*uPointScale/(-mv.z),.65,4.4);
        }`,
      fragmentShader:`varying float vLight,vAmbient,vSeed,vScan,vFeature;
        void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float soft=1.-smoothstep(.18,.5,r);
          float alpha=(vAmbient>.5?.12+.13*vSeed:.30+.40*vLight+vFeature*.18)*soft;
          vec3 color=mix(vec3(.20,.70,.88),vec3(.62,.97,1.),vLight*.55+vScan*.45);
          gl_FragColor=vec4(color,alpha*(1.+vScan*1.5));
        }`
    });
    const points=new T.Points(geo,material);points.userData={code,extent:root.userData.extent,pointCount:count,geometryType:'sampled_xyz_surfaces'};particleCache.set(code,points);return points;
  }
  const depthCache=new Map();
  function depthModel(code){
    if(depthCache.has(code))return depthCache.get(code);
    const root=model(code);root.rotation.set(0,0,0);root.updateMatrixWorld(true);const xyz=[];
    root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,idx=o.geometry.index,n=idx?idx.count:p.count;
      for(let i=0;i<n;i++){const v=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i):i).applyMatrix4(o.matrixWorld);xyz.push(v.x,v.y,v.z);}
    });
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
    // Invisible depth pre-pass suppresses points behind the nearest real surface.
    // It writes no color: there are no visible solid faces in the hologram.
    const m=new T.Mesh(geo,new T.MeshBasicMaterial({colorWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:2}));
    depthCache.set(code,m);return m;
  }
  window.BCAHolograms={codes:Object.keys(makers),model,particles,depthModel,getRenderer};
})();
