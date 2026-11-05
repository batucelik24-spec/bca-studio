/* Reference reconstructions for the portfolio's particle previews.
 * These are spatial interpretations of the supplied drawings, not surveyed models.
 * Sources, observed geometry and limits are documented in holograms-notes.md. */
(function () {
  'use strict';
  const T = window.THREE;
  if (!T) return;
  const PI=Math.PI, TAU=PI*2, V=(x,y,z)=>new T.Vector3(x,y,z);
  const skin=new T.MeshBasicMaterial({side:T.DoubleSide});
  const glazing=new T.MeshBasicMaterial({side:T.DoubleSide});
  glazing.userData={density:.12,occludes:false};
  const edge=new T.LineBasicMaterial();
  const fine=new T.LineBasicMaterial();fine.userData={density:.3};
  const makers={};
  function part(g,name,density=1,occludes=true){const p=new T.Group();p.name=name;p.userData={density,occludes};g.add(p);return p;}
  function mesh(g,geo,mat=skin,edges=true){const m=new T.Mesh(geo,mat);g.add(m);if(edges)m.add(new T.LineSegments(new T.EdgesGeometry(geo,24),edge));return m;}
  function box(g,x,y,z,w,h,d,mat=skin){const m=mesh(g,new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return m;}
  function line(g,pts,mat=edge,closed=false){const m=new (closed?T.LineLoop:T.Line)(new T.BufferGeometry().setFromPoints(pts.map(p=>Array.isArray(p)?V(...p):p)),mat);g.add(m);return m;}
  function beam(g,a,b,r=.015){const av=V(...a),bv=V(...b),m=mesh(g,new T.CylinderGeometry(r,r,av.distanceTo(bv),6),skin,false);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),bv.sub(av).normalize());return m;}
  function cylinder(g,x,y,z,r,h,mat=skin,n=40){const m=mesh(g,new T.CylinderGeometry(r,r,h,n),mat,false);m.position.set(x,y,z);return m;}
  function path(g,points,depth=.035){const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(g,new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32}));}
  function slab(g,points,y,depth=.035){const m=path(g,points.map(p=>[p[0],-p[1]]),depth);m.rotation.x=-PI/2;m.position.y=y;return m;}
  function grid(g,fn,nu=40,nv=12,mat=skin,lines=0){
    const p=[],idx=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)p.push(...fn(i/nu,j/nv));
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1;idx.push(a,b,c,b,c+1,c);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();const m=mesh(g,geo,mat,false);
    if(lines){for(let j=0;j<=nv;j+=lines)line(g,Array.from({length:nu+1},(_,i)=>fn(i/nu,j/nv)),fine);for(let i=0;i<=nu;i+=lines)line(g,Array.from({length:nv+1},(_,j)=>fn(i/nu,j/nv)),fine);}
    return m;
  }
  function ring(g,x,y,z,a,b=a,mat=edge){return line(g,Array.from({length:96},(_,i)=>[x+a*Math.cos(i*TAU/96),y,z+b*Math.sin(i*TAU/96)]),mat,true);}
  function torus(g,x,y,z,r,t=.016,horizontal=false){const m=mesh(g,new T.TorusGeometry(r,t,6,64),skin,false);m.position.set(x,y,z);if(horizontal)m.rotation.x=PI/2;return m;}
  function arch(g,w,h,z=0,r=.02){const pts=[[-w/2,0,z],[-w/2,h-w/2,z]];for(let i=0;i<=24;i++){const a=PI-i*PI/24;pts.push([w/2*Math.cos(a),h-w/2+w/2*Math.sin(a),z]);}pts.push([w/2,0,z]);for(let i=1;i<pts.length;i++)beam(g,pts[i-1],pts[i],r);}
  function roundedRect(w,h,r){const s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}

  makers.OPR=g=>{
    const roofs=part(g,'Twin concave tent roofs',2.5), halls=part(g,'Separate oval auditoria',.3), lattice=part(g,'Central glazed cleft and radial roof seams',1.8,false);
    for(const side of [-1,1]){
      const roof=(u,v)=>{const a=(v-.5)*PI;return [side*(.15+2.75*u*Math.cos(a)),.28+2.04*Math.pow(1-u,1.85)+.07*Math.pow(u,12),1.8*u*Math.sin(a)];};
      grid(roofs,roof,42,56);
      for(let k=0;k<=28;k++)line(lattice,Array.from({length:45},(_,i)=>roof(i/44,k/28)),fine);
      for(let k=2;k<=14;k++)line(lattice,Array.from({length:65},(_,i)=>roof(k/14,i/64)),fine);
      for(const end of [0,1]){
        grid(halls,(u,v)=>{const p=roof(u,end);return [p[0],p[1]*v,p[2]];},36,5,glazing);
        for(let j=0;j<18;j++){const p=roof(j/18,end),q=roof((j+1)/18,end);line(lattice,[[p[0],0,p[2]],[q[0],q[1],q[2]]]);}
        line(roofs,Array.from({length:45},(_,i)=>roof(i/44,end)));
      }
      line(roofs,Array.from({length:80},(_,i)=>roof(1,i/79)));
      for(let j=1;j<18;j++){const p=roof(1,j/18);beam(halls,[p[0],.02,p[2]],[p[0],p[1],p[2]],.012);}
      const hall=cylinder(halls,side*1.25,.34,0,.61,.61,glazing);hall.scale.z=1.7;
      ring(halls,side*1.25,.65,0,.61,1.037);
    }
    const podium=part(g,'Low podium and passage',.07);box(podium,0,-.03,0,5.95,.06,3.75);line(lattice,[[0,.015,-1.85],[0,.015,1.85]]);
  };

  const superPoint=(t,a,b,n)=>[a*Math.sign(Math.cos(t))*Math.pow(Math.abs(Math.cos(t)),2/n),b*Math.sign(Math.sin(t))*Math.pow(Math.abs(Math.sin(t)),2/n)];
  // Equal-distance perimeter sampling prevents compressed arches at rounded corners.
  function perimeter(a,b,n,count){const p=Array.from({length:2049},(_,i)=>superPoint(i*TAU/2048,a,b,n)),dist=[0];for(let i=1;i<p.length;i++)dist.push(dist[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return Array.from({length:count},(_,i)=>{const d=i*dist[2048]/count;let k=1;while(dist[k]<d)k++;const t=(d-dist[k-1])/(dist[k]-dist[k-1]);return [p[k-1][0]+t*(p[k][0]-p[k-1][0]),p[k-1][1]+t*(p[k][1]-p[k-1][1])];});}
  function bowl(g,a,b,n){const tiers=part(g,'Open seating bowl and pitch',.2);for(let j=0;j<12;j++)grid(tiers,(u,v)=>{const p=superPoint(u*TAU,a,b,n),r=.49+j*.026+v*.024;return [p[0]*r,.07+j*.052,p[1]*r];},96,1);line(tiers,[[-1.02,.035,-.64],[1.02,.035,-.64],[1.02,.035,.64],[-1.02,.035,.64]],edge,true);line(tiers,[[0,.035,-.64],[0,.035,.64]]);ring(tiers,0,.035,0,.18);}
  makers.TAS=g=>{
    const a=2.5,b=2.15,n=3.6; bowl(g,a,b,n);
    const roof=part(g,'Pleated ring roof with open oculus',.7), portals=part(g,'Round arch colonnade',3);
    grid(roof,(u,v)=>{const t=u*TAU,p=superPoint(t,a,b,n),r=.57+.43*v;return [p[0]*r,.88+.18*v+.022*Math.cos(t*56)*v,p[1]*r];},224,12);
    const pp=perimeter(a,b,n,56),step=pp.reduce((s,p,i)=>s+Math.hypot(p[0]-pp[(i+1)%56][0],p[1]-pp[(i+1)%56][1]),0)/56;
    pp.forEach((p,i)=>{const prev=pp[(i+55)%56],next=pp[(i+1)%56],bay=part(portals,'Round portal '+i);bay.position.set(p[0],.16,p[1]);bay.rotation.y=-Math.atan2(next[1]-prev[1],next[0]-prev[0])+(i%2?-.10:.10);arch(bay,step*.84,.85,0,.021);line(bay,[[-step*.48,0,.035],[-step*.48,.9,.035]],fine);});
    const base=part(g,'Recessed podium',.14);grid(base,(u,v)=>{const p=superPoint(u*TAU,a*1.02,b*1.02,n);return [p[0],v*.15,p[1]];},112,1);for(let i=0;i<56;i++){const p=pp[i];beam(base,[p[0]*.99,0,p[1]*.99],[p[0]*.99,.15,p[1]*.99],.014);}
  };
  makers.ALJ=g=>{
    const a=2.6,b=1.92,n=2.5;bowl(g,a,b,n);
    const ribbon=part(g,'Continuous lifted ribbon shell',2.3),fins=part(g,'Inclined perimeter fins',1.2),plinth=part(g,'Entry deck',.12);
    const height=t=>.95+.23*Math.cos(2*t-.4)+.07*Math.sin(t);
    const shape=(t,r)=>{const p=superPoint(t,a,b,n);return [p[0]*r,p[1]*r];};
    grid(ribbon,(u,v)=>{const t=u*TAU,[x,z]=shape(t,.55+.46*v);return [x,.84+(height(t)-.84)*v+.12*Math.sin(PI*v),z];},160,20);
    grid(ribbon,(u,v)=>{const t=u*TAU,[x,z]=shape(t,1+.01*Math.sin(v*PI));return [x,height(t)-v*.27,z];},160,5);
    for(const offset of [0,-.27])line(ribbon,Array.from({length:161},(_,i)=>{const t=i*TAU/160,[x,z]=shape(t,1);return [x,height(t)+offset,z];}));
    for(let i=0;i<112;i++){const t=i*TAU/112,p=shape(t-.035,.91),q=shape(t,1);beam(fins,[p[0],.18,p[1]],[q[0],height(t)-.25,q[1]],.009);}
    for(const t of [.2,PI+.2]){const p=shape(t,1.01),l=shape(t-.13,1.01),r=shape(t+.13,1.01);line(ribbon,[[l[0],.16,l[1]],[p[0],.68,p[1]],[r[0],.16,r[1]]]);}
    grid(plinth,(u,v)=>{const p=shape(u*TAU,.84+.22*v);return [p[0],.13,p[1]];},128,2);
  };

  makers.WA=g=>{
    const fh=.30,w=1.08,h=19*fh;
    const slabs=part(g,'Nineteen levels and diagonal passage',.65),braces=part(g,'Triangulated external frame',3),fins=part(g,'Slender facade ribs',.8),green=part(g,'Facade-bound diagonal planted band',.55,false);
    for(let i=0;i<=19;i++){
      if(i>=3&&i<=5){for(const side of [-1,1])slab(slabs,[[side*w/2,side*w/2],[side*w/2,-side*.30],[-side*.30,side*w/2]],i*fh,.022);}
      else box(slabs,0,i*fh,0,w,.022,w);
    }
    for(const side of [-1,1])box(slabs,side*.32,h/2,-side*.32,.14,h,.14,glazing);
    for(const x of [-w/2,w/2])for(const z of [-w/2,w/2])beam(braces,[x,0,z],[x,h,z],.019);
    for(let side=0;side<4;side++){
      const face=part(braces,'Diagonal facade '+side);face.rotation.y=side*PI/2;
      for(let j=0;j<3;j++){const x=-w/2+j*w/3;for(let i=0;i<19;i+=3){const y=i*fh,top=Math.min(19,i+3)*fh;beam(face,[x,y,w/2+.012],[x+w/3,top,w/2+.012],.012);beam(face,[x+w/3,y,w/2+.012],[x,top,w/2+.012],.012);}}
      const rib=part(fins,'Vertical fins '+side);rib.rotation.y=side*PI/2;for(let i=1;i<9;i++){const x=-w/2+i*w/9;line(rib,[[x,0,w/2+.016],[x,h,w/2+.016]],fine);}
      const band=part(green,'Planted diagonal '+side);band.rotation.y=side*PI/2;
      for(let i=0;i<19;i++){const t=((i+side*4.75)/19)%1,x=-w/2+w*t;for(let j=0;j<3;j++)box(band,x-.07+j*.07,(i+.48)*fh,w/2+.021,.045,.20,.035,glazing);}
    }
    for(const i of [2,6])box(slabs,0,i*fh,0,1.40,.037,1.40);
    box(slabs,0,-.06,0,1.35,.09,1.35);
  };
  makers.ALT=g=>{
    const h=5.6,fh=h/24,w=1.26,d=1.08;
    const mass=part(g,'Chamfered twenty-four-storey tower',.4),base=part(g,'Masonry base',1.2),crown=part(g,'One full-width crown arch on each elevation',3),mullions=part(g,'Upper glazing rhythm',.8,false);
    const polygon=[[-w/2+.12,-d/2],[w/2-.12,-d/2],[w/2,-d/2+.12],[w/2,d/2-.12],[w/2-.12,d/2],[-w/2+.12,d/2],[-w/2,d/2-.12],[-w/2,-d/2+.12]];
    for(let i=0;i<=24;i++)slab(mass,polygon,i*fh,.018);
    for(let side=0;side<4;side++){
      const wall=part(base,'Stone elevation '+side);wall.rotation.y=side*PI/2;const width=side%2?d:w,z=(side%2?w:d)/2;
      for(let col=0;col<4;col++){const x=-width*.38+col*width*.253;box(wall,x,.80,z,.035,1.6,.045);for(let floor=1;floor<6;floor++)box(wall,x,(floor+.5)*fh,z,.14,.155,.024,glazing);}
      for(const x of [-width*.27,width*.27]){const portal=part(wall,'Ground arch');portal.position.set(x,.02,z);arch(portal,width*.32,.39,0,.018);}
      const upper=part(mullions,'Glass elevation '+side);upper.rotation.y=side*PI/2;
      for(let col=0;col<=10;col++){const x=-width*.40+col*width*.08;line(upper,[[x,fh*7,z+.006],[x,fh*21,z+.006]],fine);}
      const cap=part(crown,'Crown arch '+side);cap.rotation.y=side*PI/2;cap.position.y=fh*20.5;arch(cap,width*.79,fh*3.5,z+.012,.036);
      for(const x of [-width*.45,width*.45])box(cap,x,fh*1.75,z,.075,fh*3.5,.075);
    }
    for(const i of [6,7,24])slab(base,polygon.map(([x,z])=>[x*1.06,z*1.06]),i*fh,.045);
  };

  makers.STC=g=>{
    const roof=part(g,'Branched and bent folded roofs',2.1),body=part(g,'Glazed multi-level wings',.35),frames=part(g,'Branching facade structure',2),planet=part(g,'Independent circular planetarium',1.6);
    // Plan coordinates preserve the open court between the two distinct footprints.
    const rear=[[-2.6,-.85],[-1.5,-1.28],[.1,-1.38],[2.65,-.68],[1.62,-.50],[.18,-.77],[-.45,-.65],[.26,-.04],[-.42,-.16],[-1.1,-.60],[-2.35,-.30]];
    const front=[[-2.25,.45],[-1.86,.10],[-1.05,.02],[-.42,.35],[.12,.88],[1.80,1.10],[2.65,1.58],[1.65,1.72],[-.08,1.35],[-.80,.93],[-1.65,.87],[-2.25,1.1]];
    function wing(poly,tip){
      const top=(x,z)=>.72+tip+.12*(x+2.6)/5.2+.13*Math.sin((x+z)*1.1);
      const shape=new T.Shape();poly.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();
      const geo=new T.ShapeGeometry(shape,1),p=geo.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),z=-p.getY(i);p.setXYZ(i,x,top(x,z),z);}geo.computeVertexNormals();mesh(roof,geo,skin,false);
      for(const y of [.05,.26,.48])slab(body,poly,y,.022);
      poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(len/.28));
        grid(body,(u,v)=>{const x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u;return [x,.08+v*(top(x,z)-.08),z];},n,2,glazing);
        line(roof,[[a[0],top(...a),a[1]],[b[0],top(...b),b[1]]]);
        for(let j=0;j<n;j++){const u=(j+.5)/n,x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u,dx=(b[0]-a[0])/n*.44,dz=(b[1]-a[1])/n*.44;beam(frames,[x,.06,z],[x,.41,z],.013);beam(frames,[x,.41,z],[x-dx,top(x-dx,z-dz),z-dz],.014);beam(frames,[x,.41,z],[x+dx,top(x+dx,z+dz),z+dz],.014);}
      });
    }
    wing(rear,.24);wing(front,.02);
    // A shallow domed volume stands within the courtyard, not on a wing's roof.
    const px=.98,pz=.34,rad=.46;cylinder(planet,px,.20,pz,rad,.36);
    grid(planet,(u,v)=>{const t=u*TAU,r=rad*v;return [px+r*Math.cos(t),.38+.13*(1-v*v),pz+r*Math.sin(t)];},64,12);
    ring(planet,px,.04,pz,rad);ring(planet,px,.38,pz,rad);
    const link=part(g,'Short entrance link',.22);box(link,-1.95,.20,-.04,.35,.12,.55,glazing);
  };
  makers.SOC=g=>{
    const fh=.29,slabs=part(g,'L-shaped stepped housing blocks',.7),terraces=part(g,'Open street and stepped terraces',1.6),core=part(g,'Recessed junction core',.35);
    // The arms meet at a right angle. Long arm: ten levels; short return: seven.
    function arm(group,len,levels,stepped){
      const windows=part(group,'Projecting box windows',2.8),rails=part(group,'Open street railings',2.2),walls=part(group,'Recessed opaque facade behind the window bays',.22);
      for(let i=0;i<=levels;i++){
        const cut=stepped?Math.max(0,i-3)*.19:0,L=len-cut;
        box(group,L/2,i*fh,0,L,.026,.79);
        if(i===levels)continue;
        const bays=Math.floor(L/.33);
        for(let j=0;j<bays;j++)for(const side of [-1,1]){
          const x=.18+j*.33,y=(i+.5)*fh,open=side===1&&i>=3&&i<=4&&j>0&&j<bays-1;
          if(open){if(i===3)line(rails,[[x-.15,i*fh+.10,side*.43],[x+.15,i*fh+.10,side*.43]],fine);continue;}
          const depth=(i+j)%3===0?.15:.075,z=side*(.4+depth/2);
          // The white facade and deep reveals hide the far arm's windows.
          // Keeping only transparent panes makes this read as an undifferentiated
          // X-ray instead of the projecting window rhythm in the elevations.
          box(walls,x,y,side*.395,.33,fh,.024);
          box(windows,x,y,z,.245,.215,depth,glazing);
          for(const dx of [-.135,.135])box(walls,x+dx,y,z,.024,.25,depth);
          for(const dy of [-.12,.12])box(walls,x,y+dy,z,.29,.024,depth);
          line(windows,[[x-.13,y-.115,side*(.4+depth)],[x+.13,y-.115,side*(.4+depth)],[x+.13,y+.115,side*(.4+depth)],[x-.13,y+.115,side*(.4+depth)]],edge,true);
          for(const dx of [-.13,.13])line(windows,[[x+dx,y-.115,side*.4],[x+dx,y-.115,side*(.4+depth)]]);
        }
        if(stepped&&cut>0){line(group,[[L,i*fh+.11,-.4],[L,i*fh+.11,.4]]);}
      }
    }
    const long=part(slabs,'Long arm');long.position.set(-1.95,0,-.48);arm(long,3.9,10,false);
    const short=part(slabs,'Perpendicular stepped return');short.position.set(-1.56,0,-.08);short.rotation.y=-PI/2;arm(short,2.25,7,true);
    box(core,-1.42,1.42,-.30,.35,2.84,.35);box(core,-1.42,3.01,-.30,.35,.23,.35);
    // Upper two floors are read as a continuous glazed band, not an oversized cap.
    for(const y of [8*fh,10*fh])box(terraces,.05,y,-.48,3.9,.027,.93);
    for(let j=0;j<28;j++)line(terraces,[[-1.9+j*.14,8*fh,.005],[-1.9+j*.14,10*fh,.005]],fine);
    const base=part(g,'Low building plinth',.08);slab(base,[[-2.08,-.98],[2.08,-.98],[2.08,.05],[-1.07,.05],[-1.07,2.32],[-2.08,2.32]],-.09,.07);
  };

  makers.DYF=g=>{
    const panels=part(g,'Individually pivoted two-sided panels',2.3),rails=part(g,'Three-dimensional pavilion frame',.9);
    const w=3.1,d=1.72,h=2.08;
    const roof=part(g,'Opaque roof and lower fascia',.55);
    box(roof,0,h+.43,0,w+.08,.10,d+.08);
    box(roof,0,.38,0,w+.08,.08,d+.08);
    for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])beam(rails,[x,0,z],[x,h+.38,z],.023);
    for(const y of [.40,h+.40]){box(rails,0,y,-d/2,w,.055,.06);box(rails,0,y,d/2,w,.055,.06);box(rails,-w/2,y,0,.06,.055,d);box(rails,w/2,y,0,.06,.055,d);}
    for(let side=0;side<4;side++){
      const face=part(panels,'Pivot field '+side);face.rotation.y=side*PI/2;const width=side%2?d:w,z=(side%2?w:d)/2,cols=side%2?7:13;
      for(let col=0;col<cols;col++){
        const x=-width/2+(col+.5)*width/cols;line(face,[[x,.4,z],[x,h+.4,z]],fine);
        for(let row=0;row<8;row++){
          const p=part(face,'Hinged panel');p.position.set(x,.4+(row+.5)*h/8,z);p.rotation.y=.18+1.20*(.5+.5*Math.sin(col*.53+row*.73+side));
          box(p,0,0,0,width/cols*.92,h/8*.90,.024);
        }
      }
    }
  };
  makers.HMP=g=>{
    const frame=part(g,'Modular kiosk frame',1),wall=part(g,'Hemp panel grid',1.5),open=part(g,'Unfolded canopy, side wall and platform',2);
    box(frame,0,.02,0,2.88,.07,1.92);box(frame,0,1.97,0,2.88,.055,1.92);
    for(const x of [-1.44,1.44])for(const z of [-.96,.96])beam(frame,[x,0,z],[x,2,z],.025);
    for(let i=0;i<6;i++)for(let j=0;j<4;j++)box(wall,-1.20+i*.48,.25+j*.48,-.96,.445,.445,.06);
    // Only the left side stays shut; the right-hand wall is the actual hinged leaf.
    for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(wall,-1.44,.25+j*.48,-.72+i*.48,.06,.445,.445);
    box(frame,0,.70,.83,2.6,.055,.55);box(wall,0,.34,.94,2.65,.64,.055);
    const canopy=part(open,'Raised service canopy');canopy.position.set(0,1.96,.96);canopy.rotation.x=.14;
    for(let i=0;i<6;i++)for(let j=0;j<3;j++)box(canopy,-1.2+i*.48,0,.24+j*.48,.445,.045,.445,glazing);
    for(const x of [-1.33,1.33])beam(open,[x,1.14,.96],[x,1.78,2.28],.015);
    const side=part(open,'Swung side grid');side.position.set(1.44,0,-.96);side.rotation.y=-.38;
    for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(side,.24+i*.48,.25+j*.48,0,.445,.445,.055,glazing);
    box(open,2.27,.015,0,1.62,.045,1.92);for(let i=0;i<4;i++)line(open,[[1.49,.043,-.72+i*.48],[3.06,.043,-.72+i*.48]],fine);
  };
  makers.CBR=g=>{
    const bar=part(g,'Sinuous island counter',3),stools=part(g,'Checker stools',1.5),screens=part(g,'Curved translucent mesh screens',.32,false),base=part(g,'Round stepped platform',.12);
    const curve=new T.CatmullRomCurve3([V(-1.6,0,.44),V(-1.28,0,-.54),V(-.35,0,-.82),V(.82,0,-.65),V(1.35,0,.03),V(.64,0,.64),V(-.20,0,.29)],false,'catmullrom',.5),outline=[];
    for(const side of [1,-1])for(let j=0;j<=100;j++){const t=side===1?j/100:1-j/100,p=curve.getPoint(t),dir=curve.getTangent(t);outline.push([p.x+dir.z*.24*side,p.z-dir.x*.24*side]);}
    slab(bar,outline,.10,.70);slab(bar,outline.map(p=>[p[0]*1.035,p[1]*1.035]),.80,.045);
    for(const [x,z] of [[-1.32,1],[-.4,1.22],[.62,1.22],[1.48,.75]]){box(stools,x,.29,z,.39,.39,.39,glazing);for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2===0)box(stools,x-.145+i*.097,.49,z-.145+j*.097,.096,.008,.096);}
    for(const [start,end] of [[.10,1.56],[1.84,3.56],[3.87,4.62]]){
      grid(screens,(u,v)=>{const t=start+(end-start)*u;return [2.12*Math.cos(t),.1+1.82*v,1.73*Math.sin(t)];},40,12,glazing);
      for(let i=0;i<=34;i++){const t=start+(end-start)*i/34;line(screens,[[2.12*Math.cos(t),.10,1.73*Math.sin(t)],[2.12*Math.cos(t),1.92,1.73*Math.sin(t)]],fine);}
      for(let j=0;j<=12;j++)line(screens,Array.from({length:50},(_,i)=>{const t=start+(end-start)*i/49;return [2.12*Math.cos(t),.1+j*1.82/12,1.73*Math.sin(t)];}),fine);
    }
    for(let i=0;i<3;i++)cylinder(base,0,.012+i*.024,0,2.35-i*.06,.025);
  };
  makers.OVS=g=>{
    const sculpture=part(g,'Headphone display object',5),cubes=part(g,'Rotated display cubes',.4),ground=part(g,'Installation footprint',.035,false);
    const main=box(cubes,0,.47,0,.70,.94,.70);main.rotation.y=.12;
    for(const [x,z,h,angle] of [[-1,-.45,.55,.3],[.9,-.7,.48,.7],[-.95,.62,.36,-.4],[1,.5,.33,.25],[-.25,1.1,.25,.6],[.26,-1.1,.32,-.24],[-1.47,.1,.23,.5],[1.48,-.07,.20,.7]]){const m=box(cubes,x,h/2,z,.43,h,.43);m.rotation.y=angle;}
    // A volumetric headband with separate ear shells, cushions and angled yokes.
    grid(sculpture,(u,v)=>{const t=u*PI;return [.35*Math.cos(t),1.2+.48*Math.sin(t),(v-.5)*.15];},60,5);
    for(const z of [-.077,.077])line(sculpture,Array.from({length:65},(_,i)=>[.35*Math.cos(i*PI/64),1.2+.48*Math.sin(i*PI/64),z]));
    for(const side of [-1,1]){const cup=part(sculpture,'Ear cup');cup.position.set(side*.34,1.13,0);cup.rotation.z=side*.13;const shell=cylinder(cup,0,0,0,.17,.09,skin,48);shell.rotation.z=PI/2;shell.scale.x=1.28;const cushion=torus(cup,-side*.055,0,0,.14,.032);cushion.rotation.y=PI/2;cushion.scale.y=1.23;beam(sculpture,[side*.35,1.33,-.08],[side*.36,1.14,-.08],.018);}
    box(ground,0,-.015,0,3.4,.025,2.8);
  };
  makers.HKK=g=>{
    const curtains=part(g,'Four hollow pleated curtain enclosures',2),room=part(g,'Minimal room context',.06,false),details=part(g,'Ring lights, benches and circular rug',.9),art=part(g,'Back ink-tree artwork',.45,false);
    for(const [x,z] of [[-1.38,-.87],[1.38,-.87],[-1.38,.98],[1.38,.98]]){
      const center=Math.atan2(-z,-x),gap=.78,start=center+gap/2,span=TAU-gap;
      grid(curtains,(u,v)=>{const a=start+u*span,r=.48+.025*Math.cos(u*span*32);return [x+r*Math.cos(a),.04+2.05*v,z+r*Math.sin(a)];},180,12);
      for(let j=0;j<=40;j++){const a=start+j*span/40,r=.48+.025*Math.cos(j*span/40*32);line(curtains,[[x+r*Math.cos(a),.04,z+r*Math.sin(a)],[x+r*Math.cos(a),2.09,z+r*Math.sin(a)]],fine);}
    }
    cylinder(details,0,.035,.13,.94,.014,glazing);ring(details,0,.045,.13,.94);
    for(const [z,y,r] of [[-.87,2.2,.39],[.1,2.22,.60],[1.02,2.20,.42]])torus(details,0,y,z,r,.013,true);
    for(const side of [-1,1]){box(details,side*1.45,.38,.10,.20,.05,.75);for(const z of [-.19,.39])beam(details,[side*1.45,0,z],[side*1.45,.36,z],.015);}
    line(art,[[-.46,.45,-1.62],[.46,.45,-1.62],[.46,1.75,-1.62],[-.46,1.75,-1.62]],edge,true);
    for(let i=0;i<16;i++){const y=.52+i*.067,x=.07*Math.sin(i*.7),s=i%2?1:-1;line(art,[[x,y,-1.615],[x+s*(.08+(16-i)*.013),y+.15,-1.615],[x+s*(.12+(16-i)*.014),y+.2,-1.615]],fine);}
    box(room,0,-.018,0,3.95,.025,3.45);
  };
  makers.BDP=g=>{
    const tubes=part(g,'Six contiguous horizontal speaker chambers',1.3),grilles=part(g,'Recessed grille faces and rims',2.5),detail=part(g,'Seams and small badge',1.4);
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      const x=(col-1)*.82,y=(row-.5)*.82;
      grid(tubes,(u,v)=>{const t=u*TAU;return [x+.414*Math.cos(t),y+.414*Math.sin(t),-1.08+v*2.16];},64,8);
      for(const z of [-1.08,1.08]){torus(grilles,x,y,z,.393,.020);const disk=mesh(grilles,new T.CircleGeometry(.371,48),glazing,false);disk.position.set(x,y,z);for(let i=-7;i<=7;i++){const xx=i*.047,yy=Math.sqrt(.36*.36-xx*xx);line(grilles,[[x+xx,y-yy,z],[x+xx,y+yy,z]],fine);}}
      for(const t of [PI/4,PI*5/4])line(detail,[[x+.416*Math.cos(t),y+.416*Math.sin(t),-1.06],[x+.416*Math.cos(t),y+.416*Math.sin(t),1.06]],fine);
    }
    box(detail,0,-.48,1.10,.21,.066,.013);
  };
  makers.ABR=g=>{
    const webs=part(g,'Extruded prototype cell walls',1.6),arches=part(g,'Pointed lens arch and central cross',3.4),flutes=part(g,'Fine exterior flutes',.35);
    const W=3,H=1.90,d=1.36,t=.043;
    for(const y of [-H/2,H/2])box(webs,0,y,0,W,t,d);
    for(const x of [-W/2,W/2])box(webs,x,0,0,t,H,d);
    for(const y of [-.59,.59])box(webs,0,y,0,W,t,d);
    for(const x of [-1,-.5,0,.5,1])for(const y of [-.77,.77])box(webs,x,y,0,t,.36,d);
    for(const x of [-1,1])box(webs,x,0,0,t,1.18,d);
    box(arches,0,0,0,t,1.18,d);
    // Two bowed webs meet at pointed ends; this is not an elliptical hole.
    for(const side of [-1,1]){
      const curve=u=>{const x=(u-.5)*2.04;return [x,side*.59*(1-Math.pow(Math.abs(x/1.02),1.65))];};
      const outline=[];for(let i=0;i<=80;i++){const p=curve(i/80);outline.push([p[0],p[1]+t/2]);}for(let i=80;i>=0;i--){const p=curve(i/80);outline.push([p[0],p[1]-t/2]);}
      const m=path(arches,outline,d);m.position.z=-d/2;
    }
    box(arches,0,0,0,W,t,d);
    for(const x of [-1.524,1.524])for(let i=0;i<26;i++)line(flutes,[[x,-.92,-d/2+i*d/25],[x,.92,-d/2+i*d/25]],fine);
    for(const y of [-.974,.974])for(let i=0;i<57;i++)line(flutes,[[-1.48+i*2.96/56,y,-d/2],[-1.48+i*2.96/56,y,d/2]],fine);
  };

  makers.PCE=g=>{
    const frame=part(g,'Rounded phone enclosure',.65),buttons=part(g,'Side controls and bezel',1.8),back=part(g,'Phone back',.06);
    const w=1.65,h=3.42,s=roundedRect(w,h,.20),hole=roundedRect(1.48,3.16,.135);s.holes.push(new T.Path(hole.getPoints(16)));
    const m=mesh(frame,new T.ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:2,curveSegments:24}));m.position.z=-.07;
    const rear=mesh(back,new T.ShapeGeometry(roundedRect(w,h,.20)));rear.position.z=-.078;
    box(buttons,-.838,.58,0,.033,.29,.065);box(buttons,.838,.49,0,.033,.40,.065);
    // Actual PACE home-screen pixels are sampled on this flat screen plane only.
    // The enclosure is fully three-dimensional; UI pixels never become relief.
    g.userData.screen={src:'img/pace/home.webp',width:1.46,height:3.14,z:.091};
  };

  makers.HUB=g=>{
    const floors=part(g,'Curved civic bar on pilotis',.6),screen=part(g,'Screened bays and double-height terrace openings',1.4),route=part(g,'Public stairs and elevated circulation',3),halls=part(g,'Conference and council volumes',.9);
    const curve=x=>.14-.028*x*x,fh=.38,w=6.4,d=.74;
    for(let level=1;level<=4;level++)grid(floors,(u,v)=>{const x=(u-.5)*w;return [x,level*fh,curve(x)+(v-.5)*(d+.1)];},64,2);
    for(let i=0;i<=16;i++){const x=-3.2+i*.4;for(const side of [-1,1])beam(floors,[x,0,curve(x)+side*.26],[x,4*fh,curve(x)+side*.26],.017);}
    // Elevation-defined terrace bays: open two-storey slots aligned vertically.
    const terraces=[[-2.63,-2.19,1,3],[-1.25,-.80,2,4],[.22,.68,1,3],[1.85,2.30,2,4]];
    for(let level=1;level<4;level++)for(let bay=0;bay<64;bay++){
      const x=-3.15+bay*.1,voided=terraces.some(([a,b,lo,hi])=>x>a&&x<b&&level>=lo&&level<hi);
      for(const side of [-1,1]){
        if(voided){if(bay%4===0)box(screen,x,(level+.5)*fh,curve(x)-side*.15,.08,fh*.85,.015,glazing);continue;}
        const z=curve(x)+side*d/2;box(screen,x,(level+.5)*fh,z,.092,fh*.90,.012,glazing);line(screen,[[x,level*fh+.02,z],[x,(level+1)*fh-.02,z]],fine);
      }
    }
    // The front route is continuous: plaza stair, first-level bridge, return stair.
    for(let i=0;i<16;i++)box(route,-1.25,(i+.5)*fh/16,1.30-i*.054,.70,.024,.058);
    box(route,-.33,fh,.48,2.55,.055,.28);
    for(let i=0;i<14;i++)box(route,.85+i*.056,fh+(i+.5)*fh/14,.46,.061,.024,.28);
    box(route,1.78,fh*2,.46,.55,.055,.28);
    line(route,[[-1.62,.08,1.35],[-1.62,fh+.10,.44],[.77,fh+.10,.44],[1.62,fh*2+.10,.44],[2.04,fh*2+.10,.44]]);
    cylinder(halls,-2.42,.27,1.17,.55,.54,glazing);ring(halls,-2.42,.55,1.17,.55);ring(halls,-2.42,.27,1.17,.55);
    cylinder(halls,2.24,.60,curve(2.24),.28,.78,glazing);
    const context=part(g,'Ground datum',.025,false);line(context,[[-3.4,-.03,-.66],[3.4,-.03,-.66],[3.4,-.03,1.82],[-3.4,-.03,1.82]],fine,true);
  };
  makers.AUL=g=>{
    const frame=part(g,'Stiffened reaction frame',.42),specimen=part(g,'Layered wall specimen',2.2),loading=part(g,'Vertical and horizontal loading train',3),gauges=part(g,'Independent measurement frame and gauges',2),equipment=part(g,'Camera, lamps and console',.28);
    function steelBeam(x,y,z,w,h=.33,d=.40){box(frame,x,y,z,w,h,.035);for(const side of [-1,1])box(frame,x,y+side*h/2,z,w,.035,d);for(let xx=x-w/2+.2;xx<x+w/2;xx+=.5)box(frame,xx,y,z,.026,h,d);}
    function column(group,x,y,z,h,w=.32,d=.42){box(group,x,y,z,.04,h,d);for(const side of [-1,1])box(group,x+side*w/2,y,z,.035,h,d);for(let yy=y-h/2+.2;yy<y+h/2;yy+=.47)box(group,x,yy,z,w,.028,d);}
    steelBeam(0,.19,0,4.8,.34,.48);steelBeam(0,3.24,0,4.5,.42,.46);
    for(const x of [-2.22,2.22]){
      column(frame,x,1.85,0,3.5);box(frame,x,.01,0,.55,.05,1.35);
      for(const z of [-.23,.23]){const s=x<0?1:-1,m=path(frame,[[x,2.99],[x+s*.40,2.99],[x,2.64]],.03);m.position.z=z;}
      for(const y of [.42,2.95,3.43])for(const z of [-.21,.21])cylinder(frame,x+.16,y,z,.021,.05,skin,6);
    }
    box(specimen,.1,.48,0,1.65,.23,.50);
    for(let i=0;i<25;i++){const sh=roundedRect(1.48,.052,.022),m=mesh(specimen,new T.ExtrudeGeometry(sh,{depth:.28,bevelEnabled:false,curveSegments:5}),skin,false);m.position.set(.10,.63+i*.055,-.14);}
    box(loading,.1,2.15,0,1.62,.18,.34);
    for(let i=0;i<14;i++){const roller=cylinder(loading,-.62+i*.111,2.035,0,.022,.32,skin,10);roller.rotation.x=PI/2;}
    cylinder(loading,.1,3.43,0,.105,.50);cylinder(loading,.1,2.88,0,.053,.46);cylinder(loading,.1,2.56,0,.09,.17);beam(loading,[.1,2.48,0],[.1,2.25,0],.04);
    box(loading,-2.18,1.94,0,.06,.48,.54);beam(loading,[-2.1,1.94,0],[-1.56,1.94,0],.10);beam(loading,[-1.56,1.94,0],[-.66,1.94,0],.033);
    for(const x of [-2.02,-1.52])box(loading,x,1.94,0,.033,.29,.29);
    for(const y of [1.82,2.06])for(const z of [-.12,.12])line(loading,[[-2.02,y,z],[-1.52,y,z]]);
    column(gauges,1.3,1.12,.08,1.44,.16,.22);
    for(const y of [.72,1.83]){beam(gauges,[.87,y,.19],[1.3,y,.19],.008);box(gauges,1.08,y,.19,.17,.034,.034);}
    for(const x of [-.52,.72]){box(gauges,x,.83,.18,.033,.24,.034);line(gauges,[[x,.60,.18],[x,1.03,.18]]);}
    for(const side of [-1,1])line(gauges,[[.1+side*.58,.72,-.155],[.1-side*.58,1.89,-.155]],fine);
    function tripod(x,z,h){beam(equipment,[x,.04,z],[x,h,z],.012);for(let i=0;i<3;i++){const a=i*TAU/3;beam(equipment,[x,h*.42,z],[x+.22*Math.cos(a),.02,z+.22*Math.sin(a)],.009);}}
    tripod(0,.91,1.10);box(equipment,0,1.14,.91,.15,.10,.08);
    for(const [x,z,h] of [[-.74,.80,1.36],[.73,.82,1.23],[-.38,1.03,1.08]]){tripod(x,z,h);const disk=cylinder(equipment,x,h+.09,z,.10,.012,glazing,24);disk.rotation.x=PI/2;}
    box(equipment,-2.85,.45,.06,.43,.90,.39);box(equipment,-2.85,.93,.10,.54,.04,.47);box(equipment,-2.85,1.04,.05,.28,.19,.024,glazing);
  };

  // Yaw/elevation are chosen from the views that actually explain each project.
  const views={OPR:[.16,.39],TAS:[.58,.59],ALJ:[.30,.49],WA:[.55,.12],ALT:[.52,.10],STC:[-.24,.67],SOC:[.58,.34],DYF:[.62,.27],HMP:[.56,.38],CBR:[.16,.55],OVS:[.30,.29],HKK:[.10,.45],BDP:[.49,.23],ABR:[.32,.20],PCE:[.17,.06],HUB:[-.25,.28],AUL:[.27,.18]};
  window.BCAHologramModels={makers,views};
})();
