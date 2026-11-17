// Futures Atlas G1 preview - proruin.js : Self-destruction ruin city (swap r7 S; fix r8 F; new generator, our own code).
// Tegmark, Life 3.0 ch.5 "Self-destruction": superintelligence is never created because humanity drives itself extinct or into collapse
// first (nuclear war, an engineered pandemic, AI-assisted conflict, other catastrophe - not only nuclear). Describe, never judge.
// What the city literally shows: a dead city around the old impact scar (the terrain crater at the centre, dark char floor, pale ash lip,
// burn streaks radiating out over grey ash): broken tower stumps whose facades end in jagged diagonal breaks with a missing corner,
// floor-slab edges and rebar stubs sticking out and the roof collapsed inside; three towers that toppled and lie in broken segments
// across the streets from their stumps; roofless low shells; low rubble heaps sunk into the ground at every wall foot; burnt-out
// vehicles on a cracked street grid; overgrowth starting - low irregular scrub, creeping vines on walls and rubble, a few bare dead
// trees; bent bare utility masts. Light = clusters of smouldering embers and soft smoke columns (Q17a); nothing powered.
// r8 F (owner: too close to Gatekeeper / Protector at world zoom): footprint x.74 of site.radius, outskirts 1.5 -> 1.28 R and squashed
// on the north side (toward both neighbours); crater ring CR follows the terrain crater x.8 (fa4_world CRK).
// Contract: FA.PRORUIN.build(site, ctx) -> {near, mid, anim(t), stats, anchors}; site {x,z,y,radius,seed,rm,params{avoid}}.
// Uses FA.G1KIT from js/prorev.js (glow / smoke points, merged parts, MID clone). Built in its own frame at host scale 1.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
FA.PRORUIN={build(site,ctx){const K=FA.G1KIT;if(!K)throw new Error('FA.G1KIT missing (js/prorev.js)');const{hash,rng,smooth,vn,lin,Parts}=K;
 const t0=performance.now(),near=new THREE.Group();near.name='selfdestruct_near';const R=(site.radius||11)*.74,y0=site.y,hA=ctx.heightAt||(()=>y0),H=(x,z)=>hA(site.x+x,site.z+z)-y0;
 const r=rng((site.seed|0)||6606),TU={uT:{value:0},uAn:{value:site.rm?0:1}},glows=[],smokes=[],mats=ctx.mats||{},PT=Parts();
 const avoid=(site.params&&site.params.avoid)||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const ph=[0,1,2,3].map(i=>hash((site.seed||5)*.17+i,1.9)*6.283);
 const rOut=a=>R*1.28*(1+.1*Math.sin(2*a+ph[0])+.07*Math.sin(3*a+ph[1])+.05*Math.sin(5*a+ph[2])+.03*Math.sin(9*a+ph[3]))*(1-.32*Math.max(0,-Math.sin(a))-.1*Math.max(0,Math.sin(a)));   // north (-z, toward Gatekeeper / Protector) side squashed; south a little (timeline)
 const CR=5.1;   // impact scar = terrain crater (fa4_world: pit 4.4, rim 5.3 at CRK .8) -> no buildings inside
 const GA=.42,gu=[Math.cos(GA),Math.sin(GA)],gv=[-Math.sin(GA),Math.cos(GA)],BL=2.9;   // street grid (rotated), block pitch
 const toG=(x,z)=>[x*gu[0]+z*gu[1],x*gv[0]+z*gv[1]];
 const streetD=(x,z)=>{const[a,b]=toG(x,z),fa=Math.abs(a/BL-Math.round(a/BL))*BL,fb=Math.abs(b/BL-Math.round(b/BL))*BL;return Math.min(fa,fb);};
 const dens=(x,z)=>{const rr=Math.hypot(x,z),ro=rOut(Math.atan2(z,x));return rr<CR?0:(1-smooth(.5,.95,rr/ro))*smooth(CR,CR+1.2,rr);};
 // palette (linear; the host lifts vertex colours to display space and applies the v4.4 night grade)
 const CON=lin('#6E6862'),CON2=lin('#5A5450'),EDGE=lin('#7C766E'),SOOT=lin('#2A2624'),RUST=lin('#5A3E30'),REBAR=lin('#3A2A24'),MOSS=lin('#3A4630'),SCRUB=lin('#4A5234'),
  DRY=lin('#5A5440'),ASH=lin('#5E5862'),LIP=lin('#8A8286'),CHAR=lin('#1E1A1E'),DUST=lin('#575050'),ROAD=lin('#242124'),DEAD=lin('#2E2826');   // r8 F2: lighter ash vs darker char (streak contrast)
 const cv=(c,k)=>[c.r*k,c.g*k,c.b*k],mix=(a,b,t)=>({r:a.r+(b.r-a.r)*t,g:a.g+(b.g-a.g)*t,b:a.b+(b.b-a.b)*t}),jit=(c,k)=>cv(c,k*(.88+.24*r()));
 const B=mats.building,ST=mats.stone||B,FO=mats.foliage||B,ME=mats.metal||B;
 const box=(m,x,y,z,sx,sy,sz,rx,ry,rz,c)=>PT.add(m,PT.G.box(),x,y,z,sx,sy,sz,rx,ry,rz,c);
 const lowY=(x,z,w,d)=>{let lo=1e9;for(const e of[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,0]])lo=Math.min(lo,H(x+e[0]*w,z+e[1]*d));return lo;};
 const placed=[],okAt=(x,z,rad)=>free(x,z,rad)&&placed.every(p=>Math.hypot(x-p[0],z-p[1])>rad+p[2]);
 // ---- shared pieces ----
 // low rubble heap sunk into the ground: one flattened mound + embedded angular chunks (no free cubes: every chunk cuts the ground)
 function heap(x,z,s,dir){const y=H(x,z);PT.add(ST,PT.G.ico(0),x,y-s*.3,z,s*1.3,s*.5,s*1.1,(r()-.5)*.25,r()*3,(r()-.5)*.25,jit(r()<.5?CON2:SOOT,r()<.5?.75:1.1));   // r8 F2: faceted, darker, deeper (vision: 'pale smooth eggs')
  const n=3+((r()*4)|0);for(let k=0;k<n;k++){const a=r()*6.283,d=s*(.25+.8*r()),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d,c=s*(.22+.3*r());
   box(ST,px,H(px,pz)-c*.45,pz,c*(1.2+r()),c*(.5+.5*r()),c*(.7+r()*.8),(r()-.5)*.5,r()*3,(r()-.5)*.5,jit(r()<.35?SOOT:r()<.6?CON:CON2,.85));}
  if(r()<.35){const a=dir==null?r()*6.283:dir,px=x+Math.cos(a)*s*.4,pz=z+Math.sin(a)*s*.4;box(ST,px,H(px,pz)-.05,pz,s*1.1,.07,s*.5,(r()-.5)*.5,-a,(r()<.5?-1:1)*(.25+.3*r()),jit(CON2,.9));}   // a slab leaning on the heap
  if(r()<.4)vine(x,z,s*1.3);}
 function vine(x,z,len){const a=r()*6.283;for(let k=0;k<3;k++){const q=(k-1)*len*.35,px=x+Math.cos(a)*q,pz=z+Math.sin(a)*q;box(FO,px,H(px,pz)-.01,pz,.11+.06*r(),.05,len*.4,0,-a+(r()-.5)*.5,0,jit(MOSS,.9));}}
 function scrub(x,z,s){const n=2+((r()*3)|0);for(let k=0;k<n;k++){const a=r()*6.283,d=s*.6*r(),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d,q=s*(.5+.5*r());
  PT.add(FO,PT.G.ico(0),px,H(px,pz)-q*.12,pz,q*(.9+.5*r()),q*(.32+.2*r()),q*(.8+.5*r()),(r()-.5)*.3,r()*3,(r()-.5)*.3,jit(r()<.45?SCRUB:r()<.7?MOSS:DRY,.95));}}
 function deadTree(x,z){const y=H(x,z),hh=.9+r()*.8;PT.add(B,PT.G.cyl(5,.55),x,y-.05,z,.055,hh,.055,(r()-.5)*.12,0,(r()-.5)*.12,cv(DEAD,1));
  for(let k=0;k<3+((r()*2)|0);k++){const t=.45+.45*r(),bl=.3+.35*r();box(B,x,y+t*hh,z,.025,bl,.025,.6+.5*r(),r()*6.283,0,cv(DEAD,1.05));}}
 function emberCluster(x,z,k){const n=3+((r()*3)|0);for(let i=0;i<n;i++){const px=x+(r()-.5)*.8,pz=z+(r()-.5)*.8;glows.push({x:px,y:H(px,pz)+.15,z:pz,size:.55+r()*.4,c:lin(r()<.5?'#FF5A1E':'#E8481A').multiplyScalar((.75+.25*r())*(k||1)),an:[.4,1.6+r()*2.4,r()*6,1]});}
  glows.push({x,y:H(x,z)+.3,z,size:2.2,c:lin('#B8401A').multiplyScalar(.32*(k||1)),an:[.25,.9+r(),r()*6,1]});}   // r8 F2: bigger ember points + one soft halo per cluster
 const embers=[];
 // ---- broken tower stumps: jagged diagonal break, missing corner, slab edges + rebar at the break, roof collapsed inside ----
 const towers=[];for(let t=0;t<260&&towers.length<9;t++){const a=r()*6.283,rr=CR+1.1+r()*(R*1.08-CR-1.1),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(r()>dens(x,z)+.2)continue;
  const w=1.4+r()*.9,d=1.3+r()*.8;if(!okAt(x,z,Math.max(w,d)*.75+.45)||streetD(x,z)<.85)continue;placed.push([x,z,Math.max(w,d)*.75]);towers.push({x,z,w,d,h:3.2+r()*3.6*(1-.35*(rr-CR)/R),ry:GA+(r()<.5?0:Math.PI/2)});}
 for(const T of towers){const y=lowY(T.x,T.z,T.w,T.d)-.2,c=Math.cos(T.ry),s=Math.sin(T.ry),L=(lx,lz)=>[T.x+lx*c+lz*s,T.z-lx*s+lz*c],FH=.5,dg=Math.hypot(T.w,T.d)*.5;
  const ca=r()*6.283,cdx=Math.cos(ca),cdz=Math.sin(ca),cc=r()*6.283,ccx=Math.cos(cc),ccz=Math.sin(cc);   // break slope direction, missing corner direction
  const scorch=.7+.3*Math.cos(Math.atan2(T.z,T.x)-Math.atan2(-T.z,-T.x)+Math.PI);
  const hAt=(lx,lz)=>{const pj=(lx*cdx+lz*cdz)/dg;let h=T.h*(.18+.82*(.5+.5*pj));const q=(lx*ccx+lz*ccz)/dg;if(q>.45)h=Math.min(h,T.h*(.1+.12*r()));return h;};
  box(ST,T.x,y,T.z,T.w*.84,Math.min(T.h*.3,1.6),T.d*.84,0,T.ry,0,cv(SOOT,.75));   // dark hollow core read through the gaps
  let lo=1e9;
  for(const[ax,len,o]of[[0,T.w,T.d/2],[0,T.w,-T.d/2],[1,T.d,T.w/2],[1,T.d,-T.w/2]]){const nc=Math.max(3,Math.round(len/.38));for(let k=0;k<nc;k++){const u=(k+.5)/nc-.5,lx=ax?o:u*len,lz=ax?u*len:o;
    const hc=Math.max(.35,hAt(lx,lz)*(.65+.7*r())-(r()<.35?FH*(1+3*r()):0));lo=Math.min(lo,hc);   // r8 F2: stronger sawtooth
    const p=L(lx,lz),cw=len/nc*.62,col=mix(CON,SOOT,(1-scorch)*.9+.2*r());box(B,p[0],y,p[1],ax?.15:cw,hc,ax?cw:.15,0,T.ry,0,jit(col,1));
    if(hc>.8&&r()<.55)for(let j=0;j<3;j++){const q=L(lx+(r()-.5)*.1,lz+(r()-.5)*.1);box(ME,q[0],y+hc-.02,q[1],.04,.35+.35*r(),.04,(r()-.5)*1.1,r()*3,(r()-.5)*1.1,cv(REBAR,.8));}   // rebar stubs
    if(r()<.3&&hc>1){box(FO,p[0],y,p[1],ax?.18:cw*.9,hc*(.2+.45*r()),ax?cw*.9:.18,0,T.ry,0,jit(MOSS,.95));}}}   // vines climbing the lower facade
  // floor slabs: full plates up to the lowest break; above it only 2-3 broken plates hanging from the high side (r8 F2: the shrinking
  // partial plates read as a stair / Jenga stack)
  const nf=Math.floor(lo/FH);for(let f=1;f<=nf;f++){const yy=f*FH;if(yy<lo-.1)box(ST,T.x,y+yy-.05,T.z,T.w*.99,.08,T.d*.99,0,T.ry,0,cv(EDGE,.9+.1*r()));}
  for(let k=0;k<2+((r()*2)|0);k++){const yy=lo+(T.h-lo)*(.2+.6*r()),ox=-cdx*T.w*.3,oz=-cdz*T.d*.3,pp=L(ox,oz);
   box(ST,pp[0],y+yy,pp[1],T.w*(.45+.3*r()),.09,T.d*(.45+.3*r()),(r()<.5?-1:1)*(.55+.35*r()),T.ry+(r()-.5)*.3,(r()<.5?-1:1)*(.3+.3*r()),cv(EDGE,.85+.15*r()));}
  {const p=L(-cdx*.15,-cdz*.15);box(ST,p[0],y+Math.max(.6,lo*.55),p[1],T.w*.75,.09,T.d*.7,(r()<.5?-1:1)*(.45+.2*r()),T.ry,(r()-.5)*.35,cv(SOOT,1.2));}   // roof / upper floors collapsed inside, leaning
  // rubble heaps at the foot on the low side + around
  heap(T.x+cdx*(dg+.4),T.z+cdz*(dg+.4),.75+.35*r(),ca);heap(T.x+ccx*(dg+.25),T.z+ccz*(dg+.25),.55+.3*r());if(r()<.6){const a=r()*6.283;heap(T.x+Math.cos(a)*(dg+.3),T.z+Math.sin(a)*(dg+.3),.4+.25*r());}
  if(r()<.4){const a=r()*6.283;scrub(T.x+Math.cos(a)*(dg+.5),T.z+Math.sin(a)*(dg+.5),.35);}
  if(r()<.75){emberCluster(T.x+cdx*(dg+.3),T.z+cdz*(dg+.3));embers.push([T.x,T.z]);}}
 // ---- toppled towers: a short stump + the body lying in 2-3 broken segments along / across the streets, debris at each break ----
 let fallen=0;for(let t=0;t<220&&fallen<3;t++){const a=r()*6.283,rr=CR+1+r()*(R*.95-CR-1),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(r()>dens(x,z)+.25||!okAt(x,z,1.2))continue;
  const ax=GA+(r()<.5?0:Math.PI/2)+(r()<.5?0:Math.PI)+(r()-.5)*.25,dx=Math.cos(ax),dz=Math.sin(ax),len=5+r()*2.5,w=1.15+r()*.4;let ok=true;
  for(let q=.15;q<=1.05;q+=.15){const px=x+dx*len*q,pz=z+dz*len*q;if(Math.hypot(px,pz)<CR-.3||!free(px,pz,.7)||placed.some(p=>Math.hypot(px-p[0],pz-p[1])<p[2]+.5))ok=false;}if(!ok)continue;
  fallen++;placed.push([x,z,1.1]);for(let q=.35;q<=1;q+=.3)placed.push([x+dx*len*q,z+dz*len*q,w*.6]);
  const ry0=Math.atan2(dx,dz),ys=lowY(x,z,w,w)-.15;   // standing stump (jagged columns) where it broke off
  for(let k=0;k<4;k++)for(const sg of[-1,1]){const u=(k+.5)/4-.5,lx=u*w,lz=sg*w/2;const px=x+lx*Math.cos(ry0)+lz*Math.sin(ry0),pz=z-lx*Math.sin(ry0)+lz*Math.cos(ry0);
   box(B,px,ys,pz,w/4*.6,.6+r()*(sg>0?1.4:.6),.15,0,ry0,0,jit(CON2,.95));}
  let u=w*.55;const nseg=2+((r()*2)|0);for(let k=0;k<nseg;k++){const sl=(len-w*.55)/nseg*(.85+.15*r()),cx=x+dx*(u+sl/2),cz=z+dz*(u+sl/2),yy=Math.min(H(cx-dx*sl*.4,cz-dz*sl*.4),H(cx+dx*sl*.4,cz+dz*sl*.4))-.18;
   const ry=ry0+(r()-.5)*.5,sh=w*(.8+.15*r()),rz=(r()-.5)*.35,rx=(r()-.5)*.22;box(B,cx,yy-.1,cz,w,sh,sl,rx,ry,rz,jit(CON,.9));   // r8 F2: segments knocked askew + sunk
   const nb=Math.max(3,Math.round(sl/.5));for(let j=0;j<nb;j++){const q=-sl/2+(j+.5)*sl/nb,px=cx+dx*q,pz=cz+dz*q;   // floor-band seams on the top + both sides
    box(ST,px,yy+sh-.015,pz,w*1.02,.04,.07,0,ry,0,cv(SOOT,1));for(const sg of[-1,1]){const ox=Math.cos(ry)*sg*(w/2+.005),oz=-Math.sin(ry)*sg*(w/2+.005);box(ST,px+ox,yy+.12,pz+oz,.03,sh-.22,.07,0,ry,0,cv(SOOT,1.1));}}
   box(ST,cx+dx*sl/2,yy+.05,cz+dz*sl/2,w*.95,sh*.85,.06,0,ry,0,cv(SOOT,.8));   // dark broken end face (hollow floors)
   u+=sl+.75+r()*.5;heap(x+dx*(u-.45),z+dz*(u-.45),.75+.3*r(),ax);for(let q=0;q<3;q++){const px=x+dx*(u-.45)+(r()-.5)*1.2,pz=z+dz*(u-.45)+(r()-.5)*1.2,c=.25+.25*r();box(ST,px,H(px,pz)-.1,pz,c*2,c,c*1.4,(r()-.5)*.8,r()*3,(r()-.5)*.8,jit(CON2,.9));}}   // wide gap + crushed chunks fanning out at each break
  heap(x+dx*(w*.3),z+dz*(w*.3),.65,ax);emberCluster(x+dx*len*.5,z+dz*len*.5,.9);embers.push([x+dx*len*.5,z+dz*len*.5]);}
 // ---- roofless low shells (2-3 storeys): walls broken to jagged stubs, roof slab collapsed inside, rubble heap filling the room ----
 let shells=0;for(let t=0;t<600&&shells<20;t++){const a=r()*6.283,rr=CR+.7+Math.pow(r(),.8)*(rOut(a)*.88-CR-.7),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(r()>dens(x,z)+.1)continue;
  const w=.9+r()*1.1,d=.8+r()*.9;if(!okAt(x,z,Math.max(w,d)*.6+.2)||streetD(x,z)<.65)continue;placed.push([x,z,Math.max(w,d)*.6]);shells++;
  const ry=GA+(r()<.5?0:Math.PI/2)+(r()-.5)*.1,c=Math.cos(ry),s=Math.sin(ry),y=lowY(x,z,w,d)-.12,hh=.7+r()*.9,L=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c],cd=r()*6.283;
  for(const[ax,len,o]of[[0,w,d/2],[0,w,-d/2],[1,d,w/2],[1,d,-w/2]]){const nc=Math.max(2,Math.round(len/.32));for(let k=0;k<nc;k++){if(r()<.2)continue;const u=(k+.5)/nc-.5,lx=ax?o:u*len,lz=ax?u*len:o,p=L(lx,lz),cw=len/nc*.95;
    const pj=(lx*Math.cos(cd)+lz*Math.sin(cd))/(Math.hypot(w,d)*.5),h2=Math.max(.2,hh*(.3+.7*(.5+.5*pj))*(.75+.4*r()));box(B,p[0],y,p[1],ax?.12:cw,h2,ax?cw:.12,0,ry,0,jit(r()<.5?CON:CON2,.9));}}
  box(ST,x,y+.15,z,w*.55,.06,d*.5,(r()<.5?-1:1)*(.5+.4*r()),ry,(r()-.5)*.5,cv(SOOT,1.1));heap(x,z,Math.min(w,d)*.42);
  if(r()<.4){const a2=r()*6.283;scrub(x+Math.cos(a2)*w*.7,z+Math.sin(a2)*d*.7,.3);}
  if(r()<.2){emberCluster(x,z,.7);}}
 // ---- crater lip: raised, light-catching ejecta rim (r8 F2: vision 'no rim, reads as a vortex') + blasted debris half-buried on it ----
 for(let k=0;k<40;k++){const a=k/40*6.283+r()*.08,rr=CR*(1.02+.08*r()),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(!free(x,z,.2))continue;const s=.9+.5*r();
  PT.add(ST,PT.G.ico(0),x,H(x,z)-.25*s,z,s*.9,s*(.45+.25*r()),s*1.3,(r()-.5)*.3,-a+(r()-.5)*.4,(r()-.5)*.3,jit(LIP,1.05));}
 for(let k=0;k<22;k++){const a=k/22*6.283+r()*.2,rr=CR*(.9+.2*r()),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(free(x,z,.3))heap(x,z,.3+.3*r(),a);}
 for(let k=0;k<16;k++){const a=r()*6.283,rr=CR*(1.2+.9*r()),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(free(x,z,.3)&&okAt(x,z,.2))box(ST,x,H(x,z)-.06,z,.18,.1,.7+.8*r(),(r()-.5)*.2,-a+Math.PI/2+(r()-.5)*.3,0,jit(SOOT,1));}   // radial ejecta shards
 for(let k=0;k<4;k++){const a=k/4*6.283+r()*.8,rr=CR*(.35+.4*r()),x=Math.cos(a)*rr,z=Math.sin(a)*rr;emberCluster(x,z,.85);if(k<2)embers.push([x,z]);}
 // ---- street rubble, burnt-out vehicles, bent masts ----
 for(let t=0;t<260;t++){const a=r()*6.283,rr=CR+.5+Math.pow(r(),.9)*(rOut(a)*.92-CR-.5),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(r()>dens(x,z)*.8||!free(x,z,.3)||!okAt(x,z,.15))continue;heap(x,z,.22+.3*r());}
 for(let t=0;t<160;t++){const a=r()*6.283,rr=CR+.8+r()*(R*1.15-CR),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(streetD(x,z)>.3||r()>dens(x,z)*.3||!free(x,z,.4)||!okAt(x,z,.2))continue;
  const[ga,gb]=toG(x,z),alongA=Math.abs(gb/BL-Math.round(gb/BL))<Math.abs(ga/BL-Math.round(ga/BL)),ry=GA+(alongA?0:Math.PI/2)+(r()-.5)*.5,yy=H(x,z);
  box(ME,x,yy-.03,z,.32,.16,.68,(r()-.5)*.15,-ry,r()<.12?Math.PI*.45:(r()-.5)*.15,jit(r()<.5?RUST:SOOT,1));box(ME,x,yy+.12,z,.28,.11,.34,0,-ry,0,cv(SOOT,.9));}
 for(let k=0;k<4;k++){const a=k/4*6.283+r()*.7,rr=R*(.8+r()*.3),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(!free(x,z,.5))continue;const yy=H(x,z),hh=2+r()*1.2,lean=.3+r()*.4,ry=r()*6.283;
  PT.add(ME,PT.G.cyl(5,.75),x,yy-.1,z,.055,hh,.055,lean,ry,0,cv(SOOT,1.2));box(ME,x+Math.sin(lean)*hh*.9*Math.sin(ry),yy+Math.cos(lean)*hh*.92,z+Math.sin(lean)*hh*.9*Math.cos(ry),.8,.045,.045,lean,ry,0,cv(SOOT,1.2));}
 // ---- overgrowth: low irregular scrub + creeping vines thicken outward, a few bare dead trees (no round crowns) ----
 for(let t=0;t<520;t++){const a=r()*6.283,rr=CR+.6+Math.sqrt(r())*(rOut(a)*1.0-CR-.6),x=Math.cos(a)*rr,z=Math.sin(a)*rr,og=smooth(R*.3,R*1.15,rr);if(r()>.16+og*.6||!free(x,z,.2))continue;
  const q=r();if(q<.05+.06*og)deadTree(x,z);else if(q<.35)vine(x,z,.6+.7*r());else scrub(x,z,.3+.3*r()*(.6+og));}
 // ---- ground: char bowl, pale ash lip, burn streaks radiating over grey ash, cracked dark street grid, moss reclaiming outward ----
 {let E=0;for(let k=0;k<64;k++)E=Math.max(E,rOut(k/64*6.283));E*=1.04;const N=62,pos=[],col=[],idx=[];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-E+2*E*i/N,z=-E+2*E*j/N,rr=Math.hypot(x,z)+1e-4,ro=rOut(Math.atan2(z,x)),h=H(x,z),n1=vn(x*.45+3,z*.45-2),n2=vn(x*1.3,z*1.3),ux=x/rr,uz=z/rr;
   let c=mix(ASH,DUST,.35*n1);
   const st=smooth(.5,.72,vn(ux*4.2+7,uz*4.2+3)*.65+vn(ux*11+1,uz*11+5)*.35)*(1-smooth(CR+3,R*1.25,rr))*smooth(CR*.8,CR*1.2,rr);c=mix(c,CHAR,st*.75);   // burn streaks
   const sd=streetD(x,z);if(sd<.42&&rr>CR*1.1){const ck=smooth(.62,.7,vn(x*3.1,z*3.1));c=mix(c,ROAD,(.8*smooth(.42,.18,sd)*(.6+.4*n2))*(1-.6*ck));}   // street, cracked (lighter breaks)
   const lip=Math.exp(-Math.pow((rr*(1+.18*(n1-.5))-CR*1.02)/(CR*.13),2));c=mix(c,LIP,lip*.7);   // pale ash lip of the crater rim
   const bowl=1-smooth(CR*.62,CR*.95,rr*(1+.2*(n1-.5)));c=mix(c,CHAR,bowl*.85);
   const og=smooth(R*.45,R*1.2,rr)*smooth(.35,.7,n1*.6+n2*.4);c=mix(c,MOSS,og*.65);
   const al=1-smooth(.7,1,rr/ro);pos.push(x,h+.045,z);col.push(c.r,c.g,c.b,al);}
  const A=k=>col[k*4+3]>.01;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,d=a+N+1,e=d+1;if(A(a)||A(b)||A(d)||A(e))idx.push(a,d,b,b,d,e);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,mats.ground||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));m.name='sd_ground_ash';m.renderOrder=1;near.add(m);}
 // ---- smoke: 4 soft grey columns rising from ember spots ----
 embers.slice(0,4).forEach((e,j)=>{const y=H(e[0],e[1])+.3;for(let k=0;k<12;k++)smokes.push({x:e[0]+(r()-.5)*.3,y,z:e[1]+(r()-.5)*.3,period:11+j*1.4,phase:k/12+j*.07,c:new THREE.Color('#9A949E'),size:2.3});});
 const pst=PT.flush(near,'sd_parts'),tb=performance.now();
 const gp=K.glowPoints(glows,near,TU,ctx,1,1.2),sp=K.smokePoints(smokes,near,TU,ctx,1,{k:.36,rise:6});const T=K.cloneTier(near,'selfdestruct_mid');
 const out={near,mid:T.mid,TU,anim(t){TU.uT.value=t;if(gp)gp.sync();if(sp)sp.sync();}};
 let tris=0,draws=0;near.traverse(m=>{if((m.isMesh||m.isPoints)&&m.geometry){draws++;const g=m.geometry;tris+=m.isPoints?0:(g.index?g.index.count/3:g.attributes.position.count/3);}});
 out.stats={nearTris:Math.round(tris),nearDraws:draws,midTris:Math.round(tris),midDraws:draws,towers:towers.length,fallen,shells,embers:glows.length,smokes:smokes.length,parts:pst,buildMs:+(tb-t0).toFixed(1),R:+R.toFixed(2)};
 out.anchors={scar:{x:0,y:H(0,0),z:0}};return out;}};
})();
