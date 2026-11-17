// Futures Atlas G1 preview - prolib.js : Libertarian Utopia zone city (swap r8 W; new generator, our own code) + shared kit FA.G1Z
// (used by js/probene.js and js/proconq.js). Needs FA.G1KIT from js/prorev.js (load after it).
// Tegmark, Life 3.0 ch.5 "Libertarian utopia": humans, cyborgs, uploads and superintelligences coexist peacefully thanks to property
// rights; the world is divided into zones by type: machine zones, mixed zones and human-only zones. Describe, never judge.
// What the city literally shows: three walled districts radiating from one shared central market (market hall + stalls): a dense dark
// machine megastructure zone (stacked blocks, a stepped mega tower, skybridges, roof fins, dim cool seams, no windows, its own perimeter
// fence), a mixed zone of glass towers with warm and cool window floors and balcony rings plus exoframe towers and planted blocks with
// small drones circling, and a low human-only zone of pitched-roof houses on hedged private plots with garden trees and strip fields at
// the edge. Every border is a private wall (tall dark walls on the machine side, a low stone wall + hedge between human and mixed) with
// a gate and a few trading stalls at each gate; cargo pods run from the machine zone through its gate to the market; the road arrives at
// an outer gate and becomes the avenue to the market.
// Contract: FA.PROLIB.build(site, ctx) -> {near, mid, anim(t), stats, anchors, buildNear()}; site {x,z,y,radius,seed,rm,lazyNear,
// params{keepA,avoid}}. NEAR and MID are built separately from the same deterministic layout (see FA.G1Z.city).
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
const K=()=>{const k=FA.G1KIT;if(!k)throw new Error('FA.G1KIT missing (js/prorev.js)');return k;};
// ---------------- shared kit ----------------
let PRISM=null;
function prismGeo(){if(PRISM)return PRISM;const A=[-.5,0,-.5],B=[-.5,0,.5],C=[-.5,1,0],D=[.5,0,-.5],E=[.5,0,.5],F=[.5,1,0],p=[];   // gable roof, ridge along x, base y 0
 for(const t of[[A,B,C],[D,F,E],[A,C,F],[A,F,D],[B,E,F],[B,F,C]])for(const v of t)p.push(v[0],v[1],v[2]);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();PRISM=g;return g;}
// r9 Q2: hyperboloid cooling-tower shell (unit: base radius 1, height 1, waist .64 at .68, flared lip .76), non-indexed, outward faces
let HYP=null;
function hyperGeo(){if(HYP)return HYP;const pr=[[1,0],[.93,.12],[.82,.3],[.71,.5],[.645,.66],[.645,.76],[.69,.88],[.76,.99],[.81,1.0],[.81,1.035],[.74,1.035],[.69,.93],[.65,.8],[.63,.68]].map(p=>new THREE.Vector2(p[0],p[1]));   // outer shell, flared lip, inner throat wall (open top)
 const g=new THREE.LatheGeometry(pr,22).toNonIndexed(),p=g.attributes.position.array,V=THREE.Vector3;
 const a=new V(p[0],p[1],p[2]),b=new V(p[3],p[4],p[5]),c=new V(p[6],p[7],p[8]),n=new V().subVectors(b,a).cross(new V().subVectors(c,a)),m=new V().add(a).add(b).add(c);m.y=0;
 if(n.dot(m)<0)for(let i=0;i<p.length;i+=9)for(let q=0;q<3;q++){const t=p[i+3+q];p[i+3+q]=p[i+6+q];p[i+6+q]=t;}
 g.attributes.position.needsUpdate=true;g.computeVertexNormals();HYP=g;return g;}
function segD(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz;let t=l>0?((px-ax)*dx+(pz-az)*dz)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
// local (lx,lz) of a box rotated by rotation.y = ry, placed at (x,z) -> world
const L2W=(x,z,ry,lx,lz)=>[x+lx*Math.cos(ry)+lz*Math.sin(ry),z-lx*Math.sin(ry)+lz*Math.cos(ry)];
function emitter(site,ctx,near,grp,TU,name){const k=K(),y0=site.y,hA=ctx.heightAt||(()=>y0),m=ctx.mats||{},PT=k.Parts(),sd=(site.seed|0)||1;
 const E={near,grp,name,R:site.radius||11,r:k.rng(sd),d:k.rng(sd+7919),PT,G:PT.G,glows:[],smokes:[],anims:[],info:{},anchors:{},glowK:.85,smokeO:null,prism:prismGeo,hyper:hyperGeo,segD,L2W};
 E.H=(x,z)=>hA(site.x+x,site.z+z)-y0;
 E.lowY=(x,z,w,d)=>{let lo=1e9;for(const e of[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,0]])lo=Math.min(lo,E.H(x+e[0]*w,z+e[1]*d));return lo;};
 E.M={B:m.building,ST:m.stone||m.building,ME:m.metal||m.building,FO:m.foliage||m.building,RF:m.roof||m.building,WD:m.wood||m.building,LT:m.light||m.building};
 E.cv=(h,s)=>{const c=k.lin(h);s=s==null?1:s;return[c.r*s,c.g*s,c.b*s];};
 E.jc=(c,x,z,a)=>{const f=1-a+2*a*k.hash(x*3.17+.3,z*2.71-.7);return[c[0]*f,c[1]*f,c[2]*f];};   // position-hashed jitter (no rng use)
 E.mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 // lvl 1 = NEAR-only detail (never consumes the layout rng E.r, so both tiers keep the same layout)
 E.add=(mat,g,x,y,z,sx,sy,sz,rx,ry,rz,c,lvl)=>{if(lvl&&!near)return;PT.add(mat,g,x,y,z,sx,sy,sz,rx,ry,rz,c);};
 E.box=(mat,x,y,z,sx,sy,sz,ry,c,lvl)=>{if(lvl&&!near)return;PT.add(mat,PT.G.box(),x,y,z,sx,sy,sz,0,ry||0,0,c);};
 E.glow=(x,y,z,size,hex,kk,an,lvl)=>{if(lvl&&!near)return;E.glows.push({x,y,z,size,c:k.lin(hex).multiplyScalar(kk==null?.6:kk),an:an||null});};
 E.smoke=(x,y,z,period,phase,hex,size)=>E.smokes.push({x,y,z,period,phase,c:new THREE.Color(hex||'#8E8A9A'),size:size||1});
 // window floors / light seams = thin unlit ring bands around a block (MID: every other band)
 E.bands=(x,y,z,w,dd,ry,h,step,c,midStep)=>{const st=near?step:(midStep||step*2);for(let yy=y+st*.7;yy<y+h-.22;yy+=st)PT.add(E.M.LT,PT.G.box(),x,yy,z,w+.035,.05,dd+.035,0,ry||0,0,c);};
 // movers: one InstancedMesh per kind; fn(i,t,o) sets o.position/rotation/scale (pure function of t -> frozen at t=0 under reduced motion)
 E.movers=(mat,sx,sy,sz,c,n,fn,lvl)=>{if((lvl&&!near)||n<1)return null;const g=new THREE.BoxGeometry(sx,sy,sz),cc=[];for(let i=0;i<g.attributes.position.count;i++)cc.push(c[0],c[1],c[2]);
  g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));const im=new THREE.InstancedMesh(g,mat,n);im.name=name+'_movers'+E.anims.length;im.frustumCulled=false;const o=new THREE.Object3D();
  const up=t=>{for(let i=0;i<n;i++){o.position.set(0,0,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);fn(i,t,o);o.updateMatrix();im.setMatrixAt(i,o.matrix);}im.instanceMatrix.needsUpdate=true;};
  up(0);E.anims.push(up);grp.add(im);return im;};
 // feathered ground: vertex-alpha grid draped on the terrain (the host mixes it toward the terrain colour by alpha -> no disc / plate)
 E.ground=(N,ext,fn)=>{const pos=[],col=[],idx=[],c=[0,0,0,1];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-ext+2*ext*i/N,z=-ext+2*ext*j/N;c[3]=1;fn(x,z,c);pos.push(x,E.H(x,z)+.045,z);col.push(c[0],c[1],c[2],Math.max(0,Math.min(1,c[3])));}
  const A=q=>col[q*4+3]>.01;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,d=a+N+1,e=d+1;if(A(a)||A(b)||A(d)||A(e))idx.push(a,d,b,b,d,e);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
  const ms=new THREE.Mesh(g,m.ground||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));ms.name=name+'_ground';ms.renderOrder=1;grp.add(ms);return ms;};
 E.finish=()=>{E.info.parts=PT.flush(grp,name+'_parts');E.gp=E.glows.length?k.glowPoints(E.glows,grp,TU,ctx,1,E.glowK):null;
  const so=E.smokeO||{k:.2,rise:3},sctx=so.fog?Object.assign({},ctx,{fog:so.fog}):ctx;   // r9 Q2: optional own fog range (steam fades out at world zoom)
  E.sp=E.smokes.length?k.smokePoints(E.smokes,grp,TU,sctx,1,so):null;E.info.glows=E.glows.length;E.info.smokes=E.smokes.length;};
 E.anim=t=>{for(const f of E.anims)f(t);if(E.gp)E.gp.sync();if(E.sp)E.sp.sync();};
 return E;}
const Z=FA.G1Z={segD,L2W,prismGeo,hyperGeo,
 // run emit(E) once per tier with the same seed: MID now, NEAR now or lazily (site.lazyNear -> out.buildNear() on demand, idempotent)
 city(site,ctx,name,emit){const t0=performance.now(),TU={uT:{value:0},uAn:{value:site.rm?0:1}};
  const mk=nr=>{const g=new THREE.Group();g.name=name+(nr?'_near':'_mid');const E=emitter(site,ctx,nr,g,TU,name+(nr?'_n':'_m'));emit(E);E.finish();return E;};
  const cnt=g=>{let tr=0,dr=0;g.traverse(m=>{if((m.isMesh||m.isPoints)&&m.geometry){dr++;if(!m.isPoints){const q=m.geometry,n=q.index?q.index.count/3:q.attributes.position.count/3;tr+=n*(m.isInstancedMesh?m.count:1);}}});return[Math.round(tr),dr];};
  const M=mk(false),cm=cnt(M.grp),out={mid:M.grp,near:null,TU,anchors:M.anchors,lazy:!!site.lazyNear};
  out.stats={midTris:cm[0],midDraws:cm[1],midMs:+(performance.now()-t0).toFixed(1),info:M.info};
  out.buildNear=()=>{if(!out._N){const t1=performance.now();out._N=mk(true);out.near=out._N.grp;const c=cnt(out.near);out.stats.nearTris=c[0];out.stats.nearDraws=c[1];out.stats.nearMs=+(performance.now()-t1).toFixed(1);out.stats.ninfo=out._N.info;}return out.near;};
  if(!site.lazyNear)out.buildNear();
  out.anim=t=>{TU.uT.value=t;M.anim(t);if(out._N)out._N.anim(t);};return out;}};
// ---------------- Libertarian Utopia ----------------
FA.PROLIB={build(site,ctx){const k=K();return Z.city(site,ctx,'libertarian',E=>{
 const{smooth,vn,hash}=k,R=E.R,r=E.r,d=E.d,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,TAU=Math.PI*2;
 const P=site.params||{},kA=P.keepA!=null?P.keepA:Math.PI/2,avoid=P.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const wrap=a=>((a%TAU)+TAU)%TAU;
 // zones = angular sectors around the central market; the road (kA) enters through the mixed zone; borders = kinked straight walls
 const HW=.96,BA=[kA+HW,kA+HW+2.44,kA-HW+TAU];   // mixed|machine, machine|human, human|mixed (counter-clockwise): mixed 110 deg, machine 140, human 110
 const R0=2.7,RMAX=R*1.42,NB=[];for(let q=0;q<3;q++){const nd=[];for(let rr=R0;rr<=RMAX+.01;rr+=1.85)nd.push([rr,BA[q]+(rr>R0?(r()-.5)*.22:0)]);NB.push(nd);}
 const bAng=(q,rr)=>{const nd=NB[q];if(rr<=nd[0][0])return nd[0][1];for(let i=1;i<nd.length;i++)if(rr<=nd[i][0]){const t=(rr-nd[i-1][0])/(nd[i][0]-nd[i-1][0]);return nd[i-1][1]+(nd[i][1]-nd[i-1][1])*t;}return nd[nd.length-1][1];};
 const zoneOf=(x,z)=>{const rr=Math.hypot(x,z);if(rr<2.5)return'C';const a=Math.atan2(z,x),b0=bAng(0,rr),rel=wrap(a-b0);if(rel<wrap(bAng(1,rr)-b0))return'M';if(rel<wrap(bAng(2,rr)-b0))return'H';return'X';};
 const ph=[0,1,2].map(i=>hash((site.seed||3)*.13+i,2.2)*TAU),ZF={M:1.0,X:1.07,H:1.22,C:1.07};
 const rOut=(a,zn)=>R*ZF[zn]*(1+.07*Math.sin(2*a+ph[0])+.05*Math.sin(5*a+ph[1])+.03*Math.sin(9*a+ph[2]));
 const BP=NB.map(nd=>nd.map(n=>[n[0]*Math.cos(n[1]),n[0]*Math.sin(n[1])]));
 const borderD=(x,z)=>{let b=1e9;for(const p of BP)for(let i=0;i+1<p.length;i++)b=Math.min(b,segD(x,z,p[i][0],p[i][1],p[i+1][0],p[i+1][1]));return b;};
 const ca=Math.cos(kA),sa=Math.sin(kA),avD=(x,z)=>{const t=x*ca+z*sa;return t>0?Math.abs(-x*sa+z*ca):1e9;};
 const st=[];   // stall spots (market + gates)
 // ---- border walls with gates ----
 const SIDES=[['X','M'],['M','H'],['H','X']],WT=[{h:2.0,w:.3,c:'#2C3039'},{h:2.2,w:.32,c:'#282C34'},{h:.75,w:.26,c:'#7A7062',hedge:1}],gates=[];
 for(let q=0;q<3;q++){const T=WT[q],nd=NB[q],pp=BP[q];
  for(let i=0;i+1<nd.length;i++){const lim=Math.max(rOut(nd[i+1][1]+.05,SIDES[q][0]),rOut(nd[i+1][1]-.05,SIDES[q][1]))*.97;if(nd[i][0]>=lim)break;
   let[x0,z0]=pp[i],[x1,z1]=pp[i+1];if(nd[i+1][0]>lim){const t=(lim-nd[i][0])/(nd[i+1][0]-nd[i][0]);x1=x0+(x1-x0)*t;z1=z0+(z1-z0)*t;}
   const L=Math.hypot(x1-x0,z1-z0),ang=Math.atan2(z1-z0,x1-x0),ry=-ang,gate=(i===1)||(q===2&&i===3),n=Math.max(1,Math.ceil(L/1.0)),nx=-Math.sin(ang),nz=Math.cos(ang);
   for(let j=0;j<n;j++){const t=(j+.5)/n;if(gate&&Math.abs(t-.5)*L<.7)continue;const px=x0+(x1-x0)*t,pz=z0+(z1-z0)*t;if(!free(px,pz,.3))continue;
    const ha=H(x0+(x1-x0)*j/n,z0+(z1-z0)*j/n),hb=H(x0+(x1-x0)*(j+1)/n,z0+(z1-z0)*(j+1)/n),y=Math.min(ha,hb)-.2,dy=Math.abs(ha-hb);   // footing follows the slope (no floating ends)
    E.box(M.ST,px,y,pz,L/n*1.03,T.h+.2+dy,T.w,ry,jc(cv(T.c),px,pz,.06));
    if(!T.hedge){E.box(M.ST,px,y+T.h+.2+dy,pz,L/n*1.03,.08,T.w+.08,ry,cv('#6E6C6A'));E.box(M.LT,px,y+T.h+.28+dy,pz,L/n*1.03,.03,T.w*.4,ry,[.2,.3,.36],1);if(j%2===0)E.box(M.ST,px+nx*.2,y,pz+nz*.2,.18,T.h*.8,.2,ry,cv('#30343C'),1);}   // pale coping (reads as a line), cool seam + buttresses (NEAR)
    else{E.box(M.ST,px,y+T.h+.2+dy,pz,L/n*1.03,.06,T.w+.06,ry,cv('#847A6C'));E.box(M.FO,px+nx*.32*(q===2?-1:1),y,pz+nz*.32*(q===2?-1:1),L/n*1.02,.62,.32,ry,jc(cv('#3E4C30'),px,pz,.12));}}   // stone coping + hedge on the human side
   if(gate){const gx=(x0+x1)/2,gz=(z0+z1)/2,gy=H(gx,gz)-.1,ux=Math.cos(ang),uz=Math.sin(ang),hh=T.h+1.0,pc=cv(T.hedge?'#7A7062':'#3C424C');gates.push({x:gx,z:gz,ang,q});
    for(const s of[-1,1])E.box(M.ST,gx+ux*.78*s,gy,gz+uz*.78*s,.42,hh,.42,ry,pc);E.box(M.ST,gx,gy+hh-.05,gz,2.0,.24,.36,ry,pc);
    for(const s of[-1,1])E.glow(gx+ux*.78*s,gy+hh+.15,gz+uz*.78*s,.6,T.hedge?'#D89A5A':'#7894A8',.5,[.2,6,s,0]);
    for(const s of[-1,1])for(const s2 of[-1,1])st.push([gx+nx*1.1*s+ux*.9*s2,gz+nz*1.1*s+uz*.9*s2,ry]);}}}   // trading stalls on both sides of each gate
 // outer gate where the road arrives (the avenue to the market starts here)
 {const rg=rOut(kA,'X')*.95,gx=ca*rg,gz=sa*rg,gy=H(gx,gz)-.1,ry=-(kA+Math.PI/2),ux=-sa,uz=ca;for(const s of[-1,1])E.box(M.ST,gx+ux*.9*s,gy,gz+uz*.9*s,.45,2.4,.45,ry,cv('#4A4E56'));
  E.box(M.ST,gx,gy+2.3,gz,2.3,.26,.4,ry,cv('#4A4E56'));for(const s of[-1,1])E.glow(gx+ux*.9*s,gy+2.6,gz+uz*.9*s,.6,'#C89A66',.5,null);E.anchors.gate={x:gx,y:gy,z:gz};}
 // machine-zone perimeter fence (private wall along its outer edge)
 {let pv=null;for(let a=BA[0]+.03;a<=BA[1]-.03;a+=.11){const rr=rOut(a,'M')*.985,x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(pv&&free(x,z,.3)){const mxx=(x+pv[0])/2,mzz=(z+pv[1])/2,L=Math.hypot(x-pv[0],z-pv[1]);E.box(M.ST,mxx,H(mxx,mzz)-.15,mzz,L*1.04,1.05,.18,-Math.atan2(z-pv[1],x-pv[0]),cv('#2A2D35'));}pv=[x,z];}}
 // ---- lots per zone (zone-aligned grids) ----
 const lots=(zn,pitch,ga,acc)=>{const out=[],u=[Math.cos(ga),Math.sin(ga)],v=[-Math.sin(ga),Math.cos(ga)],n=Math.ceil(RMAX*1.1/pitch);
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const a=i*pitch,b=j*pitch,x=a*u[0]+b*v[0],z=a*u[1]+b*v[1],rr=Math.hypot(x,z);if(rr<3||zoneOf(x,z)!==zn)continue;
   const ro=rOut(Math.atan2(z,x),zn);if(rr>ro*.95)continue;if(r()>(acc?acc(rr/ro):1))continue;
   if(borderD(x,z)<pitch*.45+.3||avD(x,z)<pitch*.5+.55||!free(x,z,pitch*.55))continue;out.push({x,z,f:rr/ro,ry:-ga});}return out;};
 // machine zone (r9 Q2): windowless dark monolith megablocks on one continuous plinth - big flat-topped cubes and tall thin slabs,
 // separated only by narrow dark slots; dim cool vertical seams (MID: one per face, NEAR: three) + a cool roof seam; stepped core tower
 const aM=BA[0]+1.22,LM=lots('M',3.5,aM,f=>1-.25*smooth(.8,1,f)),tall=[];
 let core=null,bd=1e9;for(const L of LM){const q=Math.hypot(L.x-Math.cos(aM)*R*.46,L.z-Math.sin(aM)*R*.46);if(q<bd){bd=q;core=L;}}
 const SEAM=[.17,.28,.36];
 for(const L of LM){const y=E.lowY(L.x,L.z,3.2,3.2)-.18;
  E.box(M.B,L.x,y,L.z,3.56,.9,3.56,L.ry,jc(cv('#14161B'),L.x,L.z,.04));   // continuous plinth
  if(L===core){let yy=y;for(const s of[[3.3,4.2],[2.5,3.8],[1.7,3.0]]){E.box(M.B,L.x,yy,L.z,s[0],s[1]+.05,s[0]*.9,L.ry,jc(cv('#121418'),L.x,yy,.04));yy+=s[1];}
   E.box(M.LT,L.x,yy,L.z,1.75,.04,1.58,L.ry,SEAM);
   E.box(M.ME,L.x,yy,L.z,.14,2.4,.14,0,cv('#3E4652'));E.glow(L.x,yy+2.45,L.z,.8,'#6C88A0',.45,[.3,5,0,0]);tall.push({x:L.x,z:L.z,h:yy-y,y});E.anchors.machine={x:L.x,y:yy,z:L.z};continue;}
  const slab=r()<.35,h=(slab?4.4:2.6)+(slab?2.6:2.6)*(1-smooth(.2,1,L.f))*(.6+.6*r()),w=slab?3.3:3.3*(.9+.08*r()),dd=slab?1.4:3.3*(.9+.08*r());
  const parts=slab?[[0,-.8],[0,.8]]:[[0,0]];
  for(const[ox,oz]of parts){const p=E.L2W(L.x,L.z,L.ry,ox,oz),hh=h*(oz>0?.78:1);
   E.box(M.B,p[0],y,p[1],w,hh+.9,dd,L.ry,jc(cv(r()<.5?'#111317':'#15171C'),p[0],p[1],.04));
   E.box(M.LT,p[0],y+hh+.9,p[1],w*.92,.04,dd*.92,L.ry,SEAM);   // roof seam (cool line around the flat top)
   for(const[fx,fz,sx,sz]of[[0,1,1,0],[0,-1,1,0],[1,0,0,1],[-1,0,0,1]])for(const o of(E.near?[-.33,0,.33]:[0])){const q=E.L2W(p[0],p[1],L.ry,fx*(w/2+.02)+sx*o*w,fz*(dd/2+.02)+sz*o*dd);E.box(M.LT,q[0],y+1.0,q[1],.05,hh-.3,.05,L.ry,SEAM);}   // vertical cool seams, no windows
   tall.push({x:p[0],z:p[1],h:hh+.9,y});}}
 let nb=0;for(let i=0;i<tall.length&&nb<8;i++)for(let j=i+1;j<tall.length&&nb<8;j++){const a=tall[i],b=tall[j],dd=Math.hypot(a.x-b.x,a.z-b.z);if(dd<2.5||dd>4.2||a.h<5||b.h<5)continue;
  const yy=Math.min(a.y+a.h,b.y+b.h)*.7+Math.max(a.y,b.y)*.3,ang=Math.atan2(b.z-a.z,b.x-a.x);E.box(M.ME,(a.x+b.x)/2,yy,(a.z+b.z)/2,dd,.34,.4,-ang,cv('#1C1F25'));nb++;}
 // mixed zone (r9 Q2): slim dark-glass towers with warm + cool window floors and crowns, cyborg-style exoframe towers (solid core +
 // structural X-braced metal cage in both tiers), a few planted podium blocks; low near the market so the centre stays open
 const LX=lots('X',2.15,kA,f=>1-.4*smooth(.55,1,f)),dr=[];
 for(const L of LX){const y=E.lowY(L.x,L.z,1.6,1.6)-.12,t=r(),f=.25+.75*smooth(.3,.55,L.f)*(1-.5*smooth(.8,1,L.f));
  if(t<.5){const h=(3.2+4.6*f)*(.75+.45*r()),w=1.0+.2*r();E.box(M.B,L.x,y,L.z,w,h,w,L.ry,jc(cv('#2C3846'),L.x,L.z,.1));
   let k2=0;for(let yy=y+.45;yy<y+h-.2;yy+=.42,k2++){if(!E.near&&k2%2)continue;E.box(M.LT,L.x,yy,L.z,w+.03,.08,w+.03,L.ry,k2%3===1?[.3,.42,.5]:[.58,.44,.27]);}
   E.box(M.ME,L.x,y+h,L.z,w*.6,.5,w*.6,L.ry,cv('#5E6672'));E.box(M.ME,L.x,y+h+.5,L.z,.06,.9,.06,0,cv('#6A7280'));   // crown + antenna
   for(let yy=y+1.1;yy<y+h-.4;yy+=1.1)E.box(M.ST,L.x,yy,L.z,w+.22,.05,w+.22,L.ry,cv('#5A5E66'),1);dr.push({x:L.x,z:L.z,y:y+h});}
  else if(t<.8){const h=(2.8+3.8*f)*(.75+.45*r()),w=1.15;E.box(M.B,L.x,y,L.z,w,h,w,L.ry,jc(cv('#4A4E58'),L.x,L.z,.08));E.bands(L.x,y,L.z,w,w,L.ry,h,.6,[.52,.42,.3],1.2);
   const o2=w/2+.14;for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(L.x,L.z,L.ry,s[0]*o2,s[1]*o2);E.box(M.ME,p[0],y,p[1],.17,h+.5,.17,L.ry,cv('#7A808A'));}   // exoframe columns
   for(let yy=y+.9;yy<y+h;yy+=2.0)E.box(M.ME,L.x,yy,L.z,w+.34,.1,w+.34,L.ry,cv('#6E747E'));   // ring beams
   for(const s of[-1,1])for(const ax of[0,1])for(let yy=y+.2;yy<y+h-1.4;yy+=2.0)for(const sg of[-1,1]){const p=ax?E.L2W(L.x,L.z,L.ry,s*o2,sg*.6):E.L2W(L.x,L.z,L.ry,sg*.6,s*o2);E.add(M.ME,E.G.box(),p[0],yy,p[1],.08,1.85,.08,ax?-sg*.58:0,L.ry,ax?0:sg*.58,cv('#6A707C'));}   // X braces on every face
   dr.push({x:L.x,z:L.z,y:y+h});}
  else{const h=1.4+.8*r(),w=1.5;E.box(M.ST,L.x,y,L.z,w,h,w*.9,L.ry,jc(cv('#5A5650'),L.x,L.z,.08));E.bands(L.x,y,L.z,w,w*.9,L.ry,h,.6,[.55,.42,.27],1.2);
   E.box(M.FO,L.x,y+h,L.z,w*.9,.12,w*.8,L.ry,cv('#46553A'));for(const s of[-1,1]){const p=E.L2W(L.x,L.z,L.ry,s*.35,0);E.add(M.FO,E.G.ico(1),p[0],y+h+.35,p[1],.3,.3,.3,0,0,0,cv('#405236'));}}}
 if(dr.length&&P.drones){const D=dr.slice(0,6);E.movers(M.LT,.24,.09,.24,[.34,.44,.52],D.length*2,(i,t,o)=>{const c=D[i>>1],a=t*.16*(i%2?1:-1)+i*1.7,rad=1.5+.35*(i%3);o.position.set(c.x+Math.cos(a)*rad,c.y+.6+.25*Math.sin(t*.35+i),c.z+Math.sin(a)*rad);o.rotation.y=-a;});}
 // human-only zone: pitched-roof houses on hedged plots, garden trees, warm windows; strip fields at the edge (ground)
 const aH=BA[1]+.96,LH=lots('H',1.6,aH,f=>1-.82*smooth(.5,1.02,f));
 for(const L of LH){const y=E.lowY(L.x,L.z,1,1)-.1,w=.88+.25*r(),dd=.68+.2*r(),h=.5+.25*r(),rot=L.ry+(r()<.5?0:Math.PI/2),wc=cv(['#8A7C68','#7E766A','#94846C'][(r()*3)|0]),rc=cv(['#5A4A44','#4A4C54','#6A5040'][(r()*3)|0]);
  E.box(M.ST,L.x,y,L.z,w,h+.1,dd,rot,jc(wc,L.x,L.z,.08));E.add(M.RF,E.prism(),L.x,y+h+.1,L.z,w*1.1,.42,dd*1.16,0,rot,0,jc(rc,L.x,L.z,.08));
  if(E.near){for(const s of[-1,1])for(const u of[-.24,.24]){if(d()<.35)continue;const p=E.L2W(L.x,L.z,rot,u*w,s*(dd/2+.012));E.box(M.LT,p[0],y+.32,p[1],.15,.15,.03,rot,[.6,.44,.24]);}
   for(const s of[-1,1]){let p=E.L2W(L.x,L.z,L.ry,0,s*.76);E.box(M.FO,p[0],H(p[0],p[1])-.05,p[1],1.5,.3,.1,L.ry,cv('#3C4A2E'));p=E.L2W(L.x,L.z,L.ry,s*.76,0);E.box(M.FO,p[0],H(p[0],p[1])-.05,p[1],.1,.3,1.5,L.ry,cv('#3C4A2E'));}}   // hedged private plot
  if(r()<.55){const p=E.L2W(L.x,L.z,L.ry,(r()-.5)*.9,.5),ty=H(p[0],p[1]);E.box(M.WD,p[0],ty,p[1],.07,.4,.07,0,cv('#3A2E26'));E.add(M.FO,E.G.ico(1),p[0],ty+.62,p[1],.34,.36,.34,0,0,0,jc(cv('#3E5232'),p[0],p[1],.15));}
  if(hash(L.x*1.3,L.z*.7)<.35)E.glow(L.x,y+h*.6,L.z,.5,'#D9A066',.42,null);}
 // central market: market hall + stalls ring (avenue kept open); lamps
 {const y=E.lowY(0,0,3,1.4)-.1,ry=-(kA+Math.PI/2);E.box(M.ST,0,y,0,3.2,1.15,1.5,ry,cv('#6E665A'));E.add(M.RF,E.prism(),0,y+1.15,0,3.5,.75,1.75,0,ry,0,cv('#5A4A40'));
  for(let q=-3;q<=3;q++){const p=E.L2W(0,0,ry,q*.48,.78);E.box(M.ST,p[0],y,p[1],.1,1.15,.1,ry,cv('#8A8072'));const p2=E.L2W(0,0,ry,q*.48,-.78);E.box(M.ST,p2[0],y,p2[1],.1,1.15,.1,ry,cv('#8A8072'));}   // arcade piers
  for(let i=0;i<12;i++){const a=i/12*TAU+.2,x=Math.cos(a)*2.0,z=Math.sin(a)*2.0;if(avD(x,z)<.8)continue;st.push([x,z,-a]);}
  for(const[x,z,ry2]of st){const yy=H(x,z)-.05,ac=cv(['#6A5A48','#4E5A68','#646048','#5A4E58'][(hash(x,z)*4)|0]);E.box(M.WD,x,yy,z,.56,.4,.44,ry2,cv('#4A3E34'));E.add(M.RF,E.G.box(),x,yy+.52,z,.68,.05,.6,.28,ry2,0,ac);
   if(E.near){const p=E.L2W(x,z,ry2,.3,.2);E.box(M.WD,p[0],yy,p[1],.16,.14,.16,ry2,cv('#5A4A3A'));}}
  for(let i=0;i<4;i++){const a=i/4*TAU+.6;E.glow(Math.cos(a)*1.25,y+.9,Math.sin(a)*1.25,.55,'#D9A066',.5,null);}E.anchors.market={x:0,y,z:0};}
 // cargo pods: machine zone depot -> its gate -> market (slow loop), small cool lamp on each
 {const g=gates.find(q=>q.q===0);if(g){const a0=BA[0]+.55,P0=[Math.cos(a0)*R*.62,Math.sin(a0)*R*.62],P1=[g.x,g.z],P2=[Math.cos(BA[0]-.25)*1.6,Math.sin(BA[0]-.25)*1.6],L1=Math.hypot(P1[0]-P0[0],P1[1]-P0[1]),L2=Math.hypot(P2[0]-P1[0],P2[1]-P1[1]),LT=L1+L2;
  const at=s=>{s=((s%(2*LT))+2*LT)%(2*LT);if(s>LT)s=2*LT-s;if(s<L1){const t=s/L1;return[P0[0]+(P1[0]-P0[0])*t,P0[1]+(P1[1]-P0[1])*t];}const t=(s-L1)/L2;return[P1[0]+(P2[0]-P1[0])*t,P1[1]+(P2[1]-P1[1])*t];};
  E.movers(M.ME,.55,.32,.34,cv('#5E6676'),4,(i,t,o)=>{const p=at(t*.28+i*LT*.5),q=at(t*.28+i*LT*.5+.1);o.position.set(p[0],H(p[0],p[1])+.12,p[1]);o.rotation.y=-Math.atan2(q[1]-p[1],q[0]-p[0]);});}}
 // ---- ground: zone tints with their own grids, wall footings, avenue, strip fields; feathered outline (wider in the human zone) ----
 const CC={C:cv('#5C564E'),M:cv('#2B2E36'),X:cv('#47484E'),H:cv('#4A5838')},LINE=cv('#3C4250'),LANE=cv('#5C5448'),FLD=[cv('#56603C'),cv('#5E5A3C'),cv('#465634')],WALL=cv('#24262C'),AV=cv('#55524C');
 const um=[Math.cos(aM),Math.sin(aM)],uh=[Math.cos(aH),Math.sin(aH)],fr=(v,p)=>Math.abs(((v/p)%1+1)%1-.5)*p;
 E.ground(E.near?84:58,R*1.6,(x,z,c)=>{const rr=Math.hypot(x,z),a=Math.atan2(z,x),zn=zoneOf(x,z),ro=rOut(a,zn),n1=vn(x*.5+3,z*.5-1),n2=vn(x*1.4,z*1.4);let col=CC[zn];
  if(zn==='M'){const sd=Math.min(fr(x*um[0]+z*um[1],3.5),fr(-x*um[1]+z*um[0],3.5));if(sd<.14)col=mx(col,LINE,.8);}
  if(zn==='H'){if(rr>ro*.68)col=FLD[(((Math.floor((x*uh[0]+z*uh[1])/1.25)%3)+3)%3)];const sd=Math.min(fr(x*uh[0]+z*uh[1],1.6),fr(-x*uh[1]+z*uh[0],1.6));if(sd<.12&&rr<ro*.75)col=mx(col,LANE,.7);}
  if(zn==='X'&&n2>.72)col=mx(col,cv('#46553A'),.6);
  if(avD(x,z)<.65&&rr<ro)col=AV;if(rr<2.75){col=mx(cv('#6A6258'),cv('#5A544C'),.5*smooth(.3,.7,n2));if(Math.abs(rr-2.45)<.08||Math.abs(rr-1.6)<.06)col=cv('#4A4640');}   // r9 Q2: pale paved market square with ring kerbs
  const bdd=borderD(x,z);if(bdd<.42)col=mx(col,WALL,.65*(1-bdd/.42));else if(bdd<.85)col=mx(col,cv('#646058'),.75);   // pale lane along every wall
  const f=.9+.18*n1;c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;const q=rr/ro*(1+.1*(n1-.5));c[3]=1-(zn==='H'?smooth(.66,1.06,q):smooth(.84,1.03,q));});
 E.info.lots={M:LM.length,X:LX.length,H:LH.length,gates:gates.length,stalls:st.length,bridges:nb};});}};
})();
