// Futures Atlas G1 - prolib_mega.js : Libertarian Utopia, "megastructure / hero landmark" variant (independently written procedural code).
// Load right after js/prolib.js (needs FA.G1Z + FA.G1KIT). Tegmark, Life 3.0 ch.5 "Libertarian utopia": humans, cyborgs, uploads and
// superintelligences coexist peacefully thanks to property rights; the world is divided into machine zones, mixed zones and human-only
// zones, with shared trade between them. Describe, never judge.
// What it shows: three walled districts meeting at one shared market (rough triangular paved plaza, market hall, stall ring).
//  - machine zone (far side from the camera): the Monolith Array = 5 sheer, flat-topped, windowless graphite prisms (24/16/12/8/5.5 u)
//    on one shared dark footing, pale-cool roof edge lines + thin vertical seams; low windowless blocks on a strict orthogonal grid,
//    dark ground with a cool grid, a private perimeter wall. No houses, no trees.
//  - mixed zone (road side): slim glass towers + exoframe towers (<= 10 u), planted podium blocks, optional drones.
//  - human-only zone: pitched-roof houses on hedged plots (hedge lines also drawn on the ground so they read at MID), trees, strip fields.
//  - pale stone walls along all three borders (one gate + two lit pylons each) with a pale paved lane beside every wall; cargo pods
//    shuttle from the monolith depot through the machine gate to the market; the avenue runs from the outer gate to the market.
// Contract: FA.PROLIB_MEGA.build(site,ctx) -> FA.G1Z.city(...) result. Layout uses only E.r, NEAR-only detail uses lvl=1 / E.d.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
// ---- fog-floor material (hero prisms, border walls, copings, gate pylons): fog can never wash out more than FOGMAX ----
const FOGMAX=.38;
const FOGCHUNK=['#ifdef USE_FOG','	#ifdef FOG_EXP2','		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );','	#else',
 '		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );','	#endif','	fogFactor = min( fogFactor, '+FOGMAX.toFixed(3)+' );',
 '	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );','#endif'].join('\n');
const MEGA_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.12});MEGA_MAT.name='g1z_megafog';
MEGA_MAT.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <fog_fragment>',FOGCHUNK);};
MEGA_MAT.customProgramCacheKey=()=>'g1zmegafog';
// ---- tunables ----
const HW=.96,MW=2.44;                       // mixed half-width, machine width (rad): mixed 110 deg, machine 140, human 110
const HERO=[[0,0,6,3.6,13.5,0],[-5.0,.5,2.6,2.8,9.5,0],[5.0,.8,2.4,2.4,7.5,0],[-1.4,3.3,2.8,1.6,5,.1],[1.9,3.4,1.8,1.8,3.8,.1]];   // dx,dz,w,d,h,base drop (+z = toward camera); mega r1 (Opus, after the first record shot): main 24 -> 13.5 u, wider footprint (at world zoom 1 u ~ 7 px; 24 u reached the name disc under the nav clamp)
// mega r1 (Opus): ground with the same fog floor (zone tints were washed out on the map). Clone of the host ground material with userData
// reset so the host g1Patch still applies its feather / dither / ambient patch on top (it chains this onBeforeCompile); one per base material.
const GFOG=.5,GCH=FOGCHUNK.replace(FOGMAX.toFixed(3),GFOG.toFixed(3)),GMC=new Map();
const megaGround=base=>{if(!base||!base.isMaterial)return base;if(!GMC.has(base)){const g=base.clone();g.userData={};g.name='g1z_megaground';
 g.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <fog_fragment>',GCH);};g.customProgramCacheKey=()=>'g1zmegaground';GMC.set(base,g);}return GMC.get(base);};
const BP_=2.3;                              // machine block grid pitch
FA.PROLIB_MEGA={build(site,ctx){const Z=FA.G1Z,k=FA.G1KIT;if(!Z||!k)throw new Error('FA.G1Z / FA.G1KIT missing (js/prolib.js, js/prorev.js)');
return Z.city(site,ctx,'libertarian',E=>{
 const{smooth,vn,hash}=k,segD=Z.segD,R=E.R,r=E.r,d=E.d,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,PI=Math.PI,TAU=PI*2,BOX=E.G.box();
 const P=site.params||{},kA=P.keepA!=null?P.keepA:PI/2,avoid=P.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const wrap=a=>((a%TAU)+TAU)%TAU,angd=a=>wrap(a+PI)-PI;
 // ---- sectors: the road (kA) stays inside the mixed zone; order mirrored / shifted (<= .3 rad) so the machine zone faces -z (far side) ----
 let mir=1,sh=0,be=1e9;for(const m of[1,-1]){const res=angd(-PI/2-(kA+m*(HW+MW/2))),s=Math.max(-.3,Math.min(.3,res)),e=Math.abs(res-s);if(e<be-1e-6){be=e;mir=m;sh=s;}}
 const c0=kA+sh,BA=[c0+mir*HW,c0+mir*(HW+MW),c0-mir*HW],aC=c0+mir*(HW+MW/2),aH=c0+mir*(HW+MW+(TAU-2*HW-MW)/2);   // borders: mixed|machine, machine|human, human|mixed
 const R0=3.0,RMAX=R*1.42,NB=[];
 for(let q=0;q<3;q++){const nd=[];for(let rr=R0;rr<RMAX-.8;rr+=2.6)nd.push([rr,BA[q]+(rr>R0?(r()-.5)*.2:0)]);nd.push([RMAX,BA[q]+(r()-.5)*.2]);NB.push(nd);}
 const bAng=(q,rr)=>{const nd=NB[q];if(rr<=nd[0][0])return nd[0][1];for(let i=1;i<nd.length;i++)if(rr<=nd[i][0]){const t=(rr-nd[i-1][0])/(nd[i][0]-nd[i-1][0]);return nd[i-1][1]+(nd[i][1]-nd[i-1][1])*t;}return nd[nd.length-1][1];};
 const zoneOf=(x,z)=>{const rr=Math.hypot(x,z);if(rr<2.5)return'C';const a=Math.atan2(z,x),b0=bAng(0,rr),rel=wrap(mir*(a-b0));if(rel<wrap(mir*(bAng(1,rr)-b0)))return'M';if(rel<wrap(mir*(bAng(2,rr)-b0)))return'H';return'X';};
 const ph=[0,1,2].map(i=>hash((site.seed||3)*.13+i,2.2)*TAU),ZF={M:1.14,X:1.07,H:1.2,C:1.07};
 const rOut=(a,zn)=>{let v=R*ZF[zn]*(1+.07*Math.sin(2*a+ph[0])+.05*Math.sin(5*a+ph[1])+.03*Math.sin(9*a+ph[2]));if(zn==='M'){const q=angd(a-aC)/.9;v*=1+.12*Math.exp(-q*q);}return Math.min(RMAX,v);};   // machine zone bulges behind the hero
 const BP=NB.map(nd=>nd.map(n=>[n[0]*Math.cos(n[1]),n[0]*Math.sin(n[1])]));
 const borderD=(x,z)=>{let b=1e9;for(const p of BP)for(let i=0;i+1<p.length;i++)b=Math.min(b,segD(x,z,p[i][0],p[i][1],p[i+1][0],p[i+1][1]));return b;};
 const ca=Math.cos(kA),sa=Math.sin(kA),avD=(x,z)=>{const t=x*ca+z*sa;return t>0?Math.abs(-x*sa+z*ca):1e9;};
 // market plaza outline: rough triangle, corners point down the three borders (never a disc)
 const pr=a=>{let m=0;for(let q=0;q<3;q++){const t=angd(a-BA[q])/.42;m=Math.max(m,Math.exp(-t*t));}return 2.5+1.5*m;};
 const st=[],gates=[];
 // ---- hero position: far side (most negative z) of the machine zone, clear of borders, market and neighbours (no rng) ----
 let hx=0,hz=0,hb=1e9;
 for(let t=-.5;t<=.501;t+=.1)for(const f of[.6,.66,.72]){const a=aC+t,rr=rOut(a,'M')*f,x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  let s=z+Math.max(0,6.4-borderD(x,z))*4+Math.max(0,9-rr)*3+(free(x,z,6.5)?0:60)+(zoneOf(x,z)==='M'?0:99);
  for(const sx of[-5.9,5.9]){const cx=x+sx,cz=z-1.9;if(Math.hypot(cx,cz)>rOut(Math.atan2(cz,cx),'M')*.95)s+=6;}
  if(s<hb){hb=s;hx=x;hz=z;}}
 // ---- border walls (fog-floor material) with one gate each ----
 const SIDES=[['X','M'],['M','H'],['H','X']],WT=[{h:1.8,c:cv('#9A9488')},{h:1.8,c:cv('#9E988C')},{h:1.2,c:cv('#A8A296')}];
 const COPE=cv('#BCB6AA'),PYL=cv('#A39D91'),SEAM=[.2,.31,.4],EDGE=cv('#9FB4C6',.82),EDGE2=cv('#9FB4C6',.5),AMB=[.6,.44,.24],HEDGE=cv('#3C4A2E');
 const run=(xa,za,xb,zb,T,q)=>{const L=Math.hypot(xb-xa,zb-za);if(L<.12)return;const n=Math.max(1,Math.ceil(L/1.1)),ang=Math.atan2(zb-za,xb-xa),ry=-ang,nx=-Math.sin(ang),nz=Math.cos(ang),l=L/n*1.03;
  for(let j=0;j<n;j++){const t=(j+.5)/n,px=xa+(xb-xa)*t,pz=za+(zb-za)*t;if(!free(px,pz,.35))continue;
   const ha=H(xa+(xb-xa)*j/n,za+(zb-za)*j/n),hc=H(xa+(xb-xa)*(j+1)/n,za+(zb-za)*(j+1)/n),y=Math.min(ha,hc)-.25,hh=T.h+.25+Math.abs(ha-hc);   // footing follows the slope
   E.add(MEGA_MAT,BOX,px,y,pz,l,hh,.55,0,ry,0,jc(T.c,px,pz,.05));E.add(MEGA_MAT,BOX,px,y+hh,pz,l,.12,.7,0,ry,0,COPE);   // wall + pale coping
   if(q<2)E.box(M.LT,px,y+hh+.12,pz,l,.035,.16,ry,SEAM);   // cool seam on machine-side walls
   if(q>0){const s=zoneOf(px+nx*.8,pz+nz*.8)==='H'?1:-1;E.box(M.FO,px+nx*.47*s,y,pz+nz*.47*s,l,.8,.3,ry,jc(HEDGE,px,pz,.12));}}};   // hedge on the human side
 for(let q=0;q<3;q++){const T=WT[q],nd=NB[q],pp=BP[q];
  for(let i=0;i+1<nd.length;i++){const lim=Math.max(rOut(nd[i+1][1]+.05,SIDES[q][0]),rOut(nd[i+1][1]-.05,SIDES[q][1]))*.97;if(nd[i][0]>=lim)break;
   let[x0,z0]=pp[i],[x1,z1]=pp[i+1];if(nd[i+1][0]>lim){const t=(lim-nd[i][0])/(nd[i+1][0]-nd[i][0]);x1=x0+(x1-x0)*t;z1=z0+(z1-z0)*t;}
   if(i!==1){run(x0,z0,x1,z1,T,q);continue;}
   const ang=Math.atan2(z1-z0,x1-x0),ry=-ang,ux=Math.cos(ang),uz=Math.sin(ang),nx=-uz,nz=ux,gx=(x0+x1)/2,gz=(z0+z1)/2,gy=H(gx,gz)-.25,hh=T.h+1.15;   // gate: 2.2 u gap, two pylons (+.9 u), lamps
   run(x0,z0,gx-ux*1.1,gz-uz*1.1,T,q);run(gx+ux*1.1,gz+uz*1.1,x1,z1,T,q);gates.push({x:gx,z:gz,ang,q,nx,nz});
   for(const s of[-1,1]){const px=gx+ux*1.3*s,pz=gz+uz*1.3*s;E.add(MEGA_MAT,BOX,px,gy,pz,.6,hh,.6,0,ry,0,PYL);E.add(MEGA_MAT,BOX,px,gy+hh,pz,.72,.1,.72,0,ry,0,COPE);
    E.box(M.LT,px,gy+hh+.1,pz,.3,.07,.3,ry,q<2?SEAM:AMB);E.glow(px,gy+hh+.3,pz,.65,q<2?'#8FB0C8':'#D89A5A',.5,[.2,6,s,0]);
    for(const s2 of[-1,1])st.push([gx+nx*1.05*s2+ux*2.0*s,gz+nz*1.05*s2+uz*2.0*s,ry]);}}}   // trading stalls on both sides of each gate
 // outer gate where the road arrives (avenue to the market starts here)
 {const rg=rOut(kA,'X')*.95,gx=ca*rg,gz=sa*rg,gy=H(gx,gz)-.1,ry=-(kA+PI/2),ux=-sa,uz=ca;for(const s of[-1,1])E.box(M.ST,gx+ux*.9*s,gy,gz+uz*.9*s,.45,2.4,.45,ry,cv('#6A6860'));
  E.box(M.ST,gx,gy+2.3,gz,2.3,.26,.4,ry,cv('#6A6860'));for(const s of[-1,1])E.glow(gx+ux*.9*s,gy+2.6,gz+uz*.9*s,.6,'#C89A66',.5,null);E.anchors.gate={x:gx,y:gy,z:gz};}
 // machine-zone private perimeter wall along its outer edge
 {let pv=null;for(let t=.03;t<=MW-.03;t+=.09){const a=BA[0]+mir*t,rr=rOut(a,'M')*.985,x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  if(pv&&free(x,z,.3)){const xm=(x+pv[0])/2,zm=(z+pv[1])/2,L=Math.hypot(x-pv[0],z-pv[1]);E.box(M.ST,xm,H(xm,zm)-.2,zm,L*1.04,1.75,.24,-Math.atan2(z-pv[1],x-pv[0]),cv('#6A6E76'));}pv=[x,z];}}
 // ---- cargo path: monolith depot -> machine gate -> market corner ----
 let PATH=null,SL=[],LT=0;{const g=gates.find(q=>q.q===0);if(g){const s=zoneOf(g.x+g.nx*.9,g.z+g.nz*.9)==='M'?1:-1,b=BA[0];
  PATH=[[hx+.4,hz+4.9],[g.x+g.nx*.9*s,g.z+g.nz*.9*s],[g.x-g.nx*.9*s,g.z-g.nz*.9*s],[Math.cos(b)*3.5-g.nx*.8*s,Math.sin(b)*3.5-g.nz*.8*s]];
  for(let i=0;i<3;i++){const l=Math.hypot(PATH[i+1][0]-PATH[i][0],PATH[i+1][1]-PATH[i][1])||1e-3;SL.push(l);LT+=l;}}}
 const pathD=(x,z)=>{let b=1e9;if(PATH)for(let i=0;i<3;i++)b=Math.min(b,segD(x,z,PATH[i][0],PATH[i][1],PATH[i+1][0],PATH[i+1][1]));return b;};
 // ---- machine zone: the Monolith Array (hero) + low windowless blocks, all axis-aligned (broad faces toward the camera) ----
 const G0=cv('#16191F'),G1=cv('#1C2027');
 const mono=(mat,x,z,w,dd,h,yb,col,hero)=>{E.add(mat,BOX,x,yb,z,w,h,dd,0,0,0,col);const yt=yb+h,ec=hero?EDGE:EDGE2,offs=hero?[0,-.3,.3]:[0];
  if(hero)for(const s of[-1,1]){E.add(mat,BOX,x,yb,z+s*dd/2,w-.04,h-.02,.02,0,0,0,mx(G0,G1,s>0?.6+.4*hash(x+1,z*1.7):.5*hash(x-1,z*1.7)));   // per-face graphite jitter
   E.add(mat,BOX,x+s*w/2,yb,z,.02,h-.02,dd-.04,0,0,0,mx(G0,G1,.6*hash(z-s,x*1.3)));}
  for(const s of[-1,1]){E.box(M.LT,x,yt-.06,z+s*dd/2,w+.07,.07,.07,0,ec);E.box(M.LT,x+s*w/2,yt-.06,z,.07,.07,dd+.07,0,ec);   // crisp roof edge line (both tiers)
   for(const o of[0]){E.box(M.LT,x+o*w,yb+.4,z+s*(dd/2+.015),.05,h-.9,.04,0,SEAM,0);E.box(M.LT,x+s*(w/2+.015),yb+.4,z+o*dd,.04,h-.9,.05,0,SEAM,0);}}};   // vertical seams: 1 per face in both tiers (mega r1: 3 per face read as window columns in the close-up record shot)
 {let lo=1e9,hi=-1e9;for(let i=-3;i<=3;i++)for(let j=0;j<=3;j++){const h=H(hx+i*2,hz-1.9+j*2.1);lo=Math.min(lo,h);hi=Math.max(hi,h);}
  const yT=hi+.3,yB=lo-.3,FOOT=cv('#101216'),top=yT+HERO[0][4];
  E.box(M.B,hx-.1,yB,hz+.25,11.9,yT-yB,4.3,0,FOOT);E.box(M.B,hx,yB,hz+3.2,6.5,yT-yB-.1,2.5,0,FOOT);   // shared irregular footing (T-shaped, stepped)
  for(const[dx,dz,w,dd,h,dp]of HERO)mono(MEGA_MAT,hx+dx,hz+dz,w,dd,h,yT-dp,G0,1);
  for(const sx of[-1,1])for(const sz of[-1,1])E.glow(hx+sx*2.5,top+.1,hz+sz*1.6,.7,'#9FB4C6',.32,null);
  E.anchors.machine={x:hx,y:top,z:hz};E.anchors.hero={x:hx,z:hz,top,h:HERO[0][4],w:HERO[0][2]};}
 const blocks=[];
 for(let i=-7;i<7;i++)for(let j=-5;j<=5;j++){const dx=(i+.5)*BP_,dz=1.6+j*BP_,x=hx+dx,z=hz+dz,rr=Math.hypot(x,z),a=Math.atan2(z,x);
  if(dx>-7.4&&dx<7.2&&dz>-3.3&&dz<5.8)continue;if(zoneOf(x,z)!=='M'||rr>rOut(a,'M')*.9||rr<pr(a)+1.0)continue;
  if(borderD(x,z)<1.9||pathD(x,z)<1.5||!free(x,z,1.8))continue;blocks.push({x,z,dz,q:Math.hypot(dx,dz*1.2)});}
 blocks.sort((a,b)=>a.q-b.q);blocks.length=Math.min(blocks.length,10);
 for(const b of blocks){const w=1.5+.4*hash(b.x,b.z+3),dd=1.5+.4*hash(b.z,b.x-2),y=E.lowY(b.x,b.z,w,dd)-.2;let h=1.8+1.8*hash(b.x*.7+1,b.z*.9);if(b.dz>4)h=Math.min(h,2.2);   // low between hero and camera (mega r1: 2-5 -> 1.8-3.6 so the 13.5 u hero stays 4x)
  mono(M.B,b.x,b.z,w,dd,h+.2,y,jc(cv('#1A1D23'),b.x,b.z,.06),0);}
 // ---- lots per zone (zone-aligned grids) ----
 const lots=(zn,pitch,ga,acc)=>{const out=[],u=[Math.cos(ga),Math.sin(ga)],v=[-Math.sin(ga),Math.cos(ga)],n=Math.ceil(RMAX*1.1/pitch);
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const a=i*pitch,b=j*pitch,x=a*u[0]+b*v[0],z=a*u[1]+b*v[1],rr=Math.hypot(x,z);if(rr<3||zoneOf(x,z)!==zn)continue;
   const an=Math.atan2(z,x),ro=rOut(an,zn);if(rr>ro*.95||rr<pr(an)+pitch*.45)continue;if(r()>(acc?acc(rr/ro):1))continue;
   if(borderD(x,z)<pitch*.45+.45||avD(x,z)<pitch*.5+.55||!free(x,z,pitch*.55))continue;out.push({x,z,f:rr/ro,ry:-ga});}return out;};
 // mixed zone: slim glass towers (warm + cool floors), exoframe towers, planted podium blocks; <= 10 u, low near the market
 const LX=lots('X',2.4,kA,f=>1-.4*smooth(.55,1,f)),dr=[];
 for(const L of LX){const y=E.lowY(L.x,L.z,1.6,1.6)-.12,t=r(),f=.25+.75*smooth(.3,.55,L.f)*(1-.5*smooth(.8,1,L.f));
  if(t<.5){const h=Math.min(6.4,(3.2+4.6*f)*(.75+.45*r())),w=1.0+.2*r();E.box(M.B,L.x,y,L.z,w,h,w,L.ry,jc(cv('#2C3846'),L.x,L.z,.1));
   let k2=0;for(let yy=y+.45;yy<y+h-.2;yy+=.42,k2++){if(!E.near&&k2%2)continue;E.box(M.LT,L.x,yy,L.z,w+.03,.08,w+.03,L.ry,k2%3===1?[.3,.42,.5]:[.58,.44,.27]);}
   E.box(M.ME,L.x,y+h,L.z,w*.6,.5,w*.6,L.ry,cv('#5E6672'));E.box(M.ME,L.x,y+h+.5,L.z,.06,.8,.06,0,cv('#6A7280'));
   for(let yy=y+1.1;yy<y+h-.4;yy+=1.1)E.box(M.ST,L.x,yy,L.z,w+.22,.05,w+.22,L.ry,cv('#5A5E66'),1);dr.push({x:L.x,z:L.z,y:y+h});}
  else if(t<.8){const h=Math.min(7.0,(2.8+3.8*f)*(.75+.45*r())),w=1.15;E.box(M.B,L.x,y,L.z,w,h,w,L.ry,jc(cv('#4A4E58'),L.x,L.z,.08));E.bands(L.x,y,L.z,w,w,L.ry,h,.6,[.52,.42,.3],1.2);
   const o2=w/2+.14;for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(L.x,L.z,L.ry,s[0]*o2,s[1]*o2);E.box(M.ME,p[0],y,p[1],.17,h+.5,.17,L.ry,cv('#7A808A'));}   // exoframe columns
   for(let yy=y+.9;yy<y+h;yy+=2.0)E.box(M.ME,L.x,yy,L.z,w+.34,.1,w+.34,L.ry,cv('#6E747E'));
   for(const s of[-1,1])for(const ax of[0,1])for(let yy=y+.2;yy<y+h-1.4;yy+=2.0)for(const sg of[-1,1]){const p=ax?E.L2W(L.x,L.z,L.ry,s*o2,sg*.6):E.L2W(L.x,L.z,L.ry,sg*.6,s*o2);E.add(M.ME,BOX,p[0],yy,p[1],.08,1.85,.08,ax?-sg*.58:0,L.ry,ax?0:sg*.58,cv('#6A707C'));}   // X braces
   dr.push({x:L.x,z:L.z,y:y+h});}
  else{const h=1.4+.8*r(),w=1.5;E.box(M.ST,L.x,y,L.z,w,h,w*.9,L.ry,jc(cv('#5A5650'),L.x,L.z,.08));E.bands(L.x,y,L.z,w,w*.9,L.ry,h,.6,[.55,.42,.27],1.2);
   E.box(M.FO,L.x,y+h,L.z,w*.9,.12,w*.8,L.ry,cv('#46553A'));for(const s of[-1,1]){const p=E.L2W(L.x,L.z,L.ry,s*.35,0);E.add(M.FO,E.G.ico(1),p[0],y+h+.35,p[1],.3,.3,.3,0,0,0,cv('#405236'));}}}
 if(dr.length&&P.drones){const D=dr.slice(0,6);E.movers(M.LT,.24,.09,.24,[.34,.44,.52],D.length*2,(i,t,o)=>{const c=D[i>>1],a=t*.16*(i%2?1:-1)+i*1.7,rad=1.5+.35*(i%3);o.position.set(c.x+Math.cos(a)*rad,c.y+.6+.25*Math.sin(t*.35+i),c.z+Math.sin(a)*rad);o.rotation.y=-a;});}
 // human-only zone: pitched-roof houses on hedged plots, garden trees, warm windows (NEAR); max ~1.3 u
 const LH=lots('H',1.6,aH,f=>1-.82*smooth(.5,1.02,f));
 for(const L of LH){const y=E.lowY(L.x,L.z,1,1)-.1,w=.88+.25*r(),dd=.68+.2*r(),h=.5+.25*r(),rot=L.ry+(r()<.5?0:PI/2),wc=cv(['#8A7C68','#7E766A','#94846C'][(r()*3)|0]),rc=cv(['#5A4A44','#4A4C54','#6A5040'][(r()*3)|0]);
  E.box(M.ST,L.x,y,L.z,w,h+.1,dd,rot,jc(wc,L.x,L.z,.08));E.add(M.RF,E.prism(),L.x,y+h+.1,L.z,w*1.1,.42,dd*1.16,0,rot,0,jc(rc,L.x,L.z,.08));
  if(E.near){for(const s of[-1,1])for(const u of[-.24,.24]){if(d()<.35)continue;const p=E.L2W(L.x,L.z,rot,u*w,s*(dd/2+.012));E.box(M.LT,p[0],y+.32,p[1],.15,.15,.03,rot,AMB);}
   for(const s of[-1,1]){let p=E.L2W(L.x,L.z,L.ry,0,s*.78);E.box(M.FO,p[0],H(p[0],p[1])-.05,p[1],1.56,.33,.1,L.ry,HEDGE);p=E.L2W(L.x,L.z,L.ry,s*.78,0);E.box(M.FO,p[0],H(p[0],p[1])-.05,p[1],.1,.33,1.56,L.ry,HEDGE);}}   // real hedges (NEAR); ground lines carry them at MID
  if(r()<.55){const p=E.L2W(L.x,L.z,L.ry,(r()-.5)*.9,.5),ty=H(p[0],p[1]);E.box(M.WD,p[0],ty,p[1],.07,.4,.07,0,cv('#3A2E26'));E.add(M.FO,E.G.ico(1),p[0],ty+.62,p[1],.34,.36,.34,0,0,0,jc(cv('#3E5232'),p[0],p[1],.15));}
  if(hash(L.x*1.3,L.z*.7)<.3)E.glow(L.x,y+h*.6,L.z,.5,'#D9A066',.42,null);}
 // ---- shared market: hall + arcade piers, stall ring (+ gate stalls), lamps ----
 {const y=E.lowY(0,0,3,1.4)-.1,ry=-(kA+PI/2);E.box(M.ST,0,y,0,3.2,1.15,1.5,ry,cv('#8A8072'));E.add(M.RF,E.prism(),0,y+1.15,0,3.5,.75,1.75,0,ry,0,cv('#5A4A40'));
  for(let q=-3;q<=3;q++)for(const s of[-1,1]){const p=E.L2W(0,0,ry,q*.48,.78*s);E.box(M.ST,p[0],y,p[1],.1,1.15,.1,ry,cv('#A0968A'));}
  for(let i=0;i<12;i++){const a=i/12*TAU+.2,x=Math.cos(a)*2.05,z=Math.sin(a)*2.05;if(avD(x,z)<.8)continue;st.push([x,z,-a]);}
  for(const[x,z,ry2]of st){if(!free(x,z,.3))continue;const yy=H(x,z)-.05,ac=cv(['#7A6A54','#566676','#746E54','#6A5C68'][(hash(x,z)*4)|0]);E.box(M.WD,x,yy,z,.56,.4,.44,ry2,cv('#4A3E34'));E.add(M.RF,BOX,x,yy+.52,z,.68,.05,.6,.28,ry2,0,ac);
   if(E.near){const p=E.L2W(x,z,ry2,.3,.2);E.box(M.WD,p[0],yy,p[1],.16,.14,.16,ry2,cv('#5A4A3A'));}}
  for(let i=0;i<4;i++){const a=i/4*TAU+.6;E.glow(Math.cos(a)*1.3,y+.9,Math.sin(a)*1.3,.55,'#D9A066',.5,null);}E.anchors.market={x:0,y,z:0};}
 // cargo pods (one InstancedMesh): slow ping-pong along the path
 if(PATH){const at=s=>{s=((s%(2*LT))+2*LT)%(2*LT);if(s>LT)s=2*LT-s;for(let i=0;i<3;i++){if(s<=SL[i]||i===2){const t=Math.min(1,s/SL[i]),a=PATH[i],b=PATH[i+1];return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}s-=SL[i];}return PATH[0];};
  E.movers(M.ME,.55,.32,.34,cv('#76808E'),3,(i,t,o)=>{const s=t*.3+i*LT*2/3,p=at(s),q=at(s+.12);o.position.set(p[0],H(p[0],p[1])+.12,p[1]);o.rotation.y=-Math.atan2(q[1]-p[1],q[0]-p[0]);});}
 // ---- ground: zone tints, machine grid, hedge lines, fields, avenue, pale wall lanes, triangular market paving; feathered outline ----
 const CC={C:cv('#7C7468'),M:cv('#22262E'),X:cv('#4A4B50'),H:cv('#52683A')},LINE=cv('#50627A'),CLANE=cv('#59606C'),HEDG=cv('#2C3822'),GRN=cv('#46553A'),
  FLD=[cv('#5E6A3E'),cv('#6A6440'),cv('#48582F')],AV=cv('#6E6A62'),LANE=cv('#928C80'),MK=cv('#7C7468'),MK2=cv('#6E675C'),KERB=cv('#565048');
 const uh=[Math.cos(aH),Math.sin(aH)],fr=(v,p)=>Math.abs(((v/p)%1+1)%1-.5)*p;
 E.ground(E.near?110:72,R*1.6,(x,z,c)=>{const rr=Math.hypot(x,z),a=Math.atan2(z,x),zn=zoneOf(x,z),ro=rOut(a,zn),n1=vn(x*.5+3,z*.5-1),n2=vn(x*1.4,z*1.4);let col=CC[zn];
  if(zn==='M'){const sd=Math.min(fr(x-hx-BP_/2,BP_),fr(z-hz-1.6,BP_));col=mx(col,LINE,.85*(1-smooth(.06,.26,sd)));if(pathD(x,z)<.34)col=CLANE;}   // cool grid on the block lanes + cargo lane
  else if(zn==='H'){const u=x*uh[0]+z*uh[1],v=-x*uh[1]+z*uh[0];if(rr>ro*.7)col=FLD[((Math.floor(u/1.25)%3)+3)%3];else col=mx(col,HEDG,.9*(1-smooth(.08,.26,Math.min(fr(u,1.6),fr(v,1.6)))));}   // strip fields / plot hedge lines
  else if(zn==='X'&&n2>.7)col=mx(col,GRN,.6);
  if(avD(x,z)<.7&&rr<ro*1.1)col=AV;
  const bd=borderD(x,z);if(bd<.98&&rr>2)col=mx(col,LANE,bd<.75?1:.6);   // pale paved lane along every wall (bright border lines at world zoom)
  const pp=pr(a)*(1+.12*(n2-.5));if(rr<pp)col=rr>pp-.2?KERB:mx(MK,MK2,smooth(.3,.7,n2));
  const f=.92+.16*n1;c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;const q=rr/ro*(1+.1*(n1-.5));c[3]=1-(zn==='H'?smooth(.66,1.06,q):smooth(.84,1.03,q));});
 {const gm=E.grp.children.find(m=>/_ground$/.test(m.name||''));if(gm)gm.material=megaGround(gm.material);}
 E.info.lots={M:blocks.length+HERO.length,X:LX.length,H:LH.length,gates:gates.length,stalls:st.length,bridges:0,mir,shift:+sh.toFixed(2)};});}};
// mega r1 integration (Opus): called by prolib.js after a successful build. (1) close-up camera adapts to the tall hero (UI fixed):
// review 11-18 'camera too low/close' -> d 43.7 -> 57 (x1.3), target raised (ly 4 -> 6) and pulled toward the hero so the Monolith Array
// sits mid-frame between the title block and the card; ?megacam=d,ly,dx,dz overrides for tuning. (2) label anchor height AH (fa4_labels.js) follows the hero so the name disc / stem lift
// clears its roof at world zoom, capped at the current global label plane (no other site's marker moves).
FA.PROLIB_MEGA.hook=(o,site)=>{const h=o.anchors&&o.anchors.hero;if(!h)return;
 const q=(new URLSearchParams(location.search).get('megacam')||'').split(',').map(Number),v=(i,d)=>isFinite(q[i])&&q[i]!==0?q[i]:d;
 try{if(window.CLOSECAM)window.CLOSECAM.libertarian={d:v(0,78),pit:.45,yaw:0,ly:v(1,6),dx:v(2,h.x*.5+1.2),dz:v(3,h.z*.35+.6)};}catch(e){}
 try{if(typeof AH!=='undefined'&&typeof O!=='undefined'){let top=-1e9;for(const s of O)if(s.id!=='libertarian')top=Math.max(top,(s.gy||0)+(AH[s.id]||5));
  const gy=(typeof byId!=='undefined'&&byId.libertarian&&byId.libertarian.gy)||site.y||0;AH.libertarian=Math.max(AH.libertarian||4.2,Math.min(h.top+1,top-gy));}}catch(e){}};
})();
