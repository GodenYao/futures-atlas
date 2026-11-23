// Futures Atlas G1 - prolib_mega.js : Libertarian Utopia, "megastructure / hero landmark" variant - mega r2b (Fable 5.2) close-up refine.
// Load right after js/prolib.js (needs FA.G1Z + FA.G1KIT). Tegmark, Life 3.0 ch.5 "Libertarian utopia": humans, cyborgs, uploads and
// superintelligences coexist peacefully thanks to property rights; machine zones, mixed zones and human-only zones, trade between them.
// Describe, never judge. Layout (approved in r1, unchanged in logic): three sectors meeting at one triangular market; hero Monolith Array on
// the far side of the machine zone; three border walls with one gate each; cargo path depot -> machine gate -> market; outer gate on the road.
// r2: contact-shadow decals, key light + rim wrapper, metre basis (1 u = 8 m), chamfered monoliths, 4 house variants, spline walls, height fog.
// r2b: NEAR detail pass (facade louvres / slot glazing / panels, entrance, crane, wall caps + conduit + plants, house eaves / frames / gardens /
// fences, market crates / bulbs / benches / clerestory, tower balconies / roof gardens, block fans / cable trays, street clutter); roof bevel
// strips on both tiers; perimeter wall piers at gaps; shader guards.
// Contract: FA.PROLIB_MEGA.build(site,ctx) -> FA.G1Z.city(...) result. Layout uses only E.r (identical in both tiers); NEAR detail = lvl 1 / hashes / E.d.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
// ---- metre basis: U = 8 m per unit ----
const UM=8,S=3.2/UM;                                   // storey .4 u
const WALL_H=[10/UM,10/UM,6/UM],WALL_T=.4,COPE_H=.05,PIER_K=1.12,PYL_K=1.5,PIER_W=.6,GATE_W=1.6,GH=GATE_W/2+PIER_W;   // walls 1.25 / 1.25 / .75 u
const PLZ0=5,PLZ1=1.5;                                 // plaza radius 5 .. 6.5 u (40-52 m)
const HALL=[6,2.8,1.6],STALL=[.45,.4,.6],LAMP_H=.5,HEDGE_H=.18,HEDGE_T=.12,POD=.5;
const HW=.96,MW=2.44,BP_=2.3,NJ=2.6;                   // mixed half-width, machine width (rad), machine grid pitch, wall joint spacing
const HERO=[[0,0,6,3.6,13.5,0],[-5.0,.5,2.6,2.8,9.5,0],[5.0,.8,2.4,2.4,7.5,0],[-1.4,3.3,2.8,1.6,5,.1],[1.9,3.4,1.8,1.8,3.8,.1]];   // dx,dz,w,d,h,base drop
// ---- shared uniforms + material wrapper (key light, fresnel rim, height + distance fog) ----
const KEY=new THREE.Vector3(-.48,.75,.30).normalize(),SHD=[.848,-.53];   // key light direction (world) and ground shadow direction (+x / -z)
const DK=+(new URLSearchParams(location.search).get('megash')||1.55);   // r2 Opus: contact-shadow strength (GPU review: decals too faint)
// r2 Opus: GPU review 11-24 'lit vs unlit faces only mildly different' -> stronger key term + darker unlit faces
const MU={uKeyW:{value:KEY},uKeyC:{value:new THREE.Color('#6A6050')},uShade:{value:.62},uRimC:{value:new THREE.Color('#5E7A98')},
 uY0:{value:0},uHF:{value:6},uHT:{value:.45},uD0:{value:60},uD1:{value:140},uDA:{value:0}};
const FDECL='varying vec3 vMgW;uniform vec3 uKeyW;uniform vec3 uKeyC;uniform vec3 uRimC;uniform float uShade;uniform float uY0;uniform float uHF;uniform float uHT;uniform float uD0;uniform float uD1;uniform float uDA;';
// fog chunk: whole block under USE_FOG (vFogDepth / fogColor only exist there)
const fogChunk=cap=>['#ifdef USE_FOG','	#ifdef FOG_EXP2','		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );','	#else',
 '		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );','	#endif','	fogFactor = max( fogFactor, uDA * smoothstep( uD0, uD1, vFogDepth ) );',
 '	fogFactor *= mix( 1., uHT, clamp( ( vMgW.y - uY0 ) / uHF, 0., 1. ) );','	fogFactor = min( fogFactor, '+cap.toFixed(3)+' );',
 '	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );','#endif'].join('\n');
// lit chunk (MeshStandardMaterial only: normal / vViewPosition / diffuseColor / outgoingLight are in scope before output_fragment)
const litChunk=rim=>'{vec3 mgN=normalize(normal);float kd=max(dot(mgN,normalize((viewMatrix*vec4(uKeyW,0.)).xyz)),0.);outgoingLight*=mix(uShade,1.,kd);'+
 'outgoingLight+=diffuseColor.rgb*uKeyC*kd;outgoingLight+=uRimC*pow(1.-abs(dot(mgN,normalize(vViewPosition))),3.)*'+rim.toFixed(2)+';}\n';
const mgPatch=(m,cap,rim,std,key)=>{m.onBeforeCompile=s=>{if(s.vertexShader.indexOf('vMgW')>=0)return;Object.assign(s.uniforms,MU);   // guard: never declare twice
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMgW;').replace('#include <fog_vertex>',
   '#include <fog_vertex>\n{vec4 mgP=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nmgP=instanceMatrix*mgP;\n#endif\nvMgW=(modelMatrix*mgP).xyz;}');
  let f=s.fragmentShader.replace('#include <common>','#include <common>\n'+FDECL).replace('#include <fog_fragment>',fogChunk(cap));
  if(std)f=f.replace(/#include <(?:output|opaque)_fragment>/,q=>litChunk(rim)+q);s.fragmentShader=f;};m.customProgramCacheKey=()=>key;return m;};
const KIND={mono:[.38,.55],wall:[.38,.25],std:[.5,.15]},MC=new Map();   // [FOGMAX, RIM]
// mgMat(base,kind): cached clone of a host material (userData reset so the host g1Patch chains on top); base null -> own standard material
const mgMat=(base,kind)=>{kind=KIND[kind]?kind:'std';const own=!base||!base.isMaterial,key=own?'own_'+kind:base;let c=MC.get(key);if(!c)MC.set(key,c={});
 if(!c[kind]){const m=own?new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.1}):base.clone();m.userData={};
  m.name='g1z_mg_'+kind+(own?'':'_'+(base.name||base.uuid.slice(0,5)));const std=!!m.isMeshStandardMaterial;
  mgPatch(m,KIND[kind][0],KIND[kind][1],std,'g1zmg_'+kind+(std?'_s':'_b'));c[kind]=m;}return c[kind];};
// ground: fog-floor clone with the same height + distance chunk (cap .5), fog only
const GMC=new Map();
const megaGround=base=>{if(!base||!base.isMaterial)return base;if(!GMC.has(base)){const g=base.clone();g.userData={};g.name='g1z_megaground';mgPatch(g,.5,0,false,'g1zmegaground2');GMC.set(base,g);}return GMC.get(base);};
// contact-shadow decal material (unfogged so distant decals never turn into pale fog quads)
const SHM=new THREE.MeshBasicMaterial({color:'#04050A',vertexColors:true,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,fog:false});SHM.name='g1z_mg_cshadow';
FA.PROLIB_MEGA={U:MU,mgMat,build(site,ctx){const Z=FA.G1Z,k=FA.G1KIT;if(!Z||!k)throw new Error('FA.G1Z / FA.G1KIT missing (js/prolib.js, js/prorev.js)');MU.uY0.value=site.y||0;
return Z.city(site,ctx,'libertarian',E=>{
 const{smooth,vn,hash}=k,segD=Z.segD,R=E.R,r=E.r,d=E.d,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,PI=Math.PI,TAU=PI*2,BOX=E.G.box(),near=E.near;
 const W={B:mgMat(M.B),ST:mgMat(M.ST),ME:mgMat(M.ME),FO:mgMat(M.FO),RF:mgMat(M.RF),WD:mgMat(M.WD),LT:mgMat(M.LT),MO:mgMat(null,'mono'),WL:mgMat(null,'wall')};
 const P=site.params||{},kA=P.keepA!=null?P.keepA:PI/2,avoid=P.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const wrap=a=>((a%TAU)+TAU)%TAU,angd=a=>wrap(a+PI)-PI;
 const CY8=E.G.cyl(8,1),CYD=[.1,.3,.36];   // 8-seg cylinder, dim cyan (unlit)
 const lb=(m,x,z,ry,lx,lz,y,sx,sy,sz,c)=>{const p=E.L2W(x,z,ry,lx,lz);E.box(m,p[0],y,p[1],sx,sy,sz,ry,c);return p;};   // box at a local offset
 // ---- cached geometries: chamfered box (45-deg corner bevels, 28 tris), hip pyramid, barrel vault ----
 const chGeo=(w,dd,c)=>Z.geo('mgc'+w.toFixed(2)+'_'+dd.toFixed(2)+'_'+c.toFixed(2),()=>{const a=w/2,b=dd/2,p=[[a-c,-b],[a,c-b],[a,b-c],[a-c,b],[c-a,b],[-a,b-c],[-a,c-b],[c-a,-b]],v=[],V=(i,y)=>v.push(p[i%8][0],y,p[i%8][1]);
  for(let i=0;i<8;i++){V(i,0);V(i+1,1);V(i+1,0);V(i,0);V(i,1);V(i+1,1);}for(let i=1;i<7;i++){V(0,1);V(i+1,1);V(i,1);V(0,0);V(i,0);V(i+1,0);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));return g;});
 const PYR=Z.geo('mgpyr',()=>{const g=new THREE.ConeGeometry(Math.SQRT1_2,1,4,1,false,PI/4);g.translate(0,.5,0);return g;});
 const VAULT=Z.geo('mgvault',()=>{const g=new THREE.CylinderGeometry(.5,.5,1,6,1,false,-PI/2,PI);g.rotateX(-PI/2);return g;});
 // ---- contact-shadow decals (4x4 grid draped on the terrain, alpha 0 at the rim, tail away from the key light) ----
 const SP=[],SC=[],SI=[];let SN=0;
 const shadow=(x,z,w,dd,ry,h,a,nearOnly)=>{if(!near&&(nearOnly||Math.max(w,dd)<.8||SN>=110))return;SN++;ry=ry||0;
  const tl=Math.min(4,.35*h),c=Math.cos(ry),s=Math.sin(ry),tu=(SHD[0]*c-SHD[1]*s)*tl,tv=(SHD[0]*s+SHD[1]*c)*tl,hw=(w+.5+Math.abs(tu))/2,hd=(dd+.5+Math.abs(tv))/2,b=SP.length/3,
   ix=Math.max(.3,1-.45/hw),iz=Math.max(.3,1-.45/hd),fx=[-1,-ix,ix,1],fz=[-1,-iz,iz,1];
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){const p=E.L2W(x,z,ry,tu/2+fx[i]*hw,tv/2+fz[j]*hd);SP.push(p[0],H(p[0],p[1])+.05,p[1]);SC.push(1,1,1,(i%3&&j%3)?Math.min(.9,a*DK):0);}
  for(let j=0;j<3;j++)for(let i=0;i<3;i++){const q=b+j*4+i;SI.push(q,q+4,q+1,q+1,q+4,q+5);}};
 // ---- sectors (r1): the road (kA) stays inside the mixed zone; machine zone faces -z (far side) ----
 let mir=1,sh=0,be=1e9;for(const m of[1,-1]){const res=angd(-PI/2-(kA+m*(HW+MW/2))),s=Math.max(-.3,Math.min(.3,res)),e=Math.abs(res-s);if(e<be-1e-6){be=e;mir=m;sh=s;}}
 const c0=kA+sh,BA=[c0+mir*HW,c0+mir*(HW+MW),c0-mir*HW],aC=c0+mir*(HW+MW/2),aH=c0+mir*(HW+MW+(TAU-2*HW-MW)/2);   // borders: mixed|machine, machine|human, human|mixed
 const R0=PLZ0+PLZ1+1.1,RMAX=R*1.42,RG=R0+1.9;        // walls start >= 1 u outside the plaza kerb; gate radius
 const bp=[0,1,2].map(()=>[r()*TAU,r()*TAU]);
 const bAng=(q,rr)=>BA[q]+smooth(R0-1,R0+2.5,rr)*(.038*Math.sin(rr*.3+bp[q][0])+.02*Math.sin(rr*.64+bp[q][1]));
 const cr=(Pt,u)=>{const n=Pt.length-1,i=Math.max(0,Math.min(n-1,Math.floor(u))),t=u-i,a=Pt[Math.max(0,i-1)],b=Pt[i],c=Pt[i+1],e=Pt[Math.min(n,i+2)],o=[0,0];   // Catmull-Rom
  for(let j=0;j<2;j++)o[j]=.5*(2*b[j]+(c[j]-a[j])*t+(2*a[j]-5*b[j]+4*c[j]-e[j])*t*t+(3*b[j]-3*c[j]+e[j]-a[j])*t*t*t);return o;};
 const NP=[0,1,2].map(q=>{const nd=[];for(let i=0;;i++){const rr=R0+i*NJ,a=bAng(q,rr);nd.push([rr*Math.cos(a),rr*Math.sin(a)]);if(i>=1&&rr>=RMAX)break;}return nd;});   // joints every 2.6 u
 const wp=(q,rr)=>cr(NP[q],(rr-R0)/NJ),tanA=(q,rr)=>{const a=wp(q,rr-.2),b=wp(q,rr+.2);return Math.atan2(b[1]-a[1],b[0]-a[0]);};
 const zoneOf=(x,z)=>{const rr=Math.hypot(x,z);if(rr<4)return'C';const a=Math.atan2(z,x),b0=bAng(0,rr),rel=wrap(mir*(a-b0));if(rel<wrap(mir*(bAng(1,rr)-b0)))return'M';if(rel<wrap(mir*(bAng(2,rr)-b0)))return'H';return'X';};
 const ph=[0,1,2].map(i=>hash((site.seed||3)*.13+i,2.2)*TAU),ZF={M:1.14,X:1.07,H:1.2,C:1.07};
 const rOut=(a,zn)=>{let v=R*ZF[zn]*(1+.07*Math.sin(2*a+ph[0])+.05*Math.sin(5*a+ph[1])+.03*Math.sin(9*a+ph[2]));if(zn==='M'){const q=angd(a-aC)/.9;v*=1+.12*Math.exp(-q*q);}return Math.min(RMAX,v);};
 const SIDES=[['X','M'],['M','H'],['H','X']],LIM=[0,1,2].map(q=>{const a=bAng(q,RMAX*.85);return Math.min(RMAX,Math.max(rOut(a+.05,SIDES[q][0]),rOut(a-.05,SIDES[q][1]))*.97);});
 const BP=[0,1,2].map(q=>{const p=[];for(let rr=R0;;rr+=.9){p.push(wp(q,Math.min(rr,LIM[q])));if(rr>=LIM[q])break;}return p;});   // dense wall polylines (distance queries)
 const borderD=(x,z)=>{let b=1e9;for(const p of BP)for(let i=0;i+1<p.length;i++)b=Math.min(b,segD(x,z,p[i][0],p[i][1],p[i+1][0],p[i+1][1]));return b;};
 const ca=Math.cos(kA),sa=Math.sin(kA),avD=(x,z)=>{const t=x*ca+z*sa;return t>0?Math.abs(-x*sa+z*ca):1e9;};
 // market plaza outline: rough triangle, corners point down the three borders (never a disc); radius 5 .. 6.5 u
 const pr=a=>{let m=0;for(let q=0;q<3;q++){const t=angd(a-BA[q])/.42;m=Math.max(m,Math.exp(-t*t));}return PLZ0+PLZ1*m;};
 const st=[],gates=[];
 // ---- hero position (r1 search, no rng): far side of the machine zone ----
 let hx=0,hz=0,hb=1e9;
 for(let t=-.5;t<=.501;t+=.1)for(const f of[.66,.72,.78]){const a=aC+t,rr=rOut(a,'M')*f,x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  let s=z+Math.max(0,6.4-borderD(x,z))*4+Math.max(0,10.8-rr)*3+(free(x,z,6.5)?0:60)+(zoneOf(x,z)==='M'?0:99);
  for(const sx of[-5.9,5.9]){const cx=x+sx,cz=z-1.9;if(Math.hypot(cx,cz)>rOut(Math.atan2(cz,cx),'M')*.95)s+=6;}
  if(s<hb){hb=s;hx=x;hz=z;}}
 // ---- colours ----
 const WT=[{h:WALL_H[0],c:cv('#98938A')},{h:WALL_H[1],c:cv('#9C968C')},{h:WALL_H[2],c:cv('#A8A296')}],COPE=cv('#BCB6AA'),PYL=cv('#A39D91'),WSK=cv('#4A4844'),WJ=cv('#B0AAA0');
 const SEAM=[.2,.31,.4],EDGE=cv('#9FB4C6',.82),EDGE2=cv('#9FB4C6',.5),AMB=[.6,.44,.24],MKL=[.8,.72,.55],COOLB=[.3,.42,.5],WARMB=[.58,.44,.27],HEDGE=cv('#38422E');
 const G0=cv('#171A20'),G1=cv('#1D2128'),G2=cv('#272C35'),SK=cv('#0A0C0F'),EQ=cv('#2A2F38'),FC=cv('#4A525C'),FB=cv('#B4AC9C'),STN=cv('#7A746A');
 // NEAR street furniture (hash / position only)
 const bench=(x,z,ry)=>{const gy=H(x,z)-.03,c=cv('#6A5644');E.box(W.WD,x,gy+.07,z,.24,.02,.08,ry,c);for(const s of[-1,1])lb(W.ME,x,z,ry,s*.09,0,gy,.02,.07,.07,cv('#3E424A'));lb(W.WD,x,z,ry,0,.04,gy+.09,.24,.07,.015,c);};
 const lamp=(x,z,cool)=>{if(!free(x,z,.1))return;const gy=H(x,z)-.03;E.box(W.ME,x,gy,z,.03,LAMP_H,.03,0,cv('#4A4E56'));E.box(W.ME,x,gy,z,.07,.05,.07,0,cv('#3A3E46'));
  E.box(W.LT,x,gy+LAMP_H,z,.08,.04,.08,0,cool?SEAM:AMB);E.glow(x,gy+LAMP_H+.06,z,.4,cool?'#8FB0C8':'#D9A066',.45,null);};
 // ---- border walls: smooth curve, <= .9 u segments, level top per segment, footing follows the slope ----
 const pier=(q,rr,cap)=>{if(Math.abs(Math.abs(rr-RG)-GH)<.02)return;const T=WT[q],p=wp(q,rr),ry=-tanA(q,rr),y=E.lowY(p[0],p[1],PIER_W,PIER_W)-.2,top=H(p[0],p[1])+T.h*PIER_K,hh=top-y;
  E.add(W.WL,BOX,p[0],y,p[1],PIER_W,hh,PIER_W,0,ry,0,PYL);E.add(W.WL,BOX,p[0],top,p[1],PIER_W+.08,COPE_H,PIER_W+.08,0,ry,0,COPE);E.add(W.WL,BOX,p[0],y,p[1],PIER_W+.12,.33,PIER_W+.12,0,ry,0,WSK);
  E.add(W.WL,BOX,p[0],top+COPE_H,p[1],PIER_W-.22,.06,PIER_W-.22,0,ry,0,WJ,1);E.add(W.WL,BOX,p[0],y,p[1],PIER_W+.26,.25,PIER_W+.26,0,ry,0,WSK,1);   // cap stone + battered footing (NEAR)
  shadow(p[0],p[1],PIER_W,PIER_W,ry,T.h*PIER_K,.5);
  if(cap)for(const[o,f]of[[.5,.6],[.92,.3]]){const e=wp(q,rr+o),ey=E.lowY(e[0],e[1],.45,.45)-.2;E.add(W.WL,BOX,e[0],ey,e[1],.45,T.h*f+.2,.45,0,ry,0,PYL);E.add(W.WL,BOX,e[0],ey+T.h*f+.2,e[1],.5,COPE_H,.5,0,ry,0,COPE);}};   // end cap steps down to the terrain
 const wseg=(q,ra,rb)=>{const T=WT[q],a=wp(q,ra),b=wp(q,rb),px=(a[0]+b[0])/2,pz=(a[1]+b[1])/2;if(!free(px,pz,.35))return false;
  // r2 Opus (GPU review 11-24: level-top segments stair-stepped on slopes = 'zigzag / crenellated'): every segment piece is TILTED
  // along its length (rz = slope) so the wall top and coping follow the terrain as one continuous sloped line; footing stays buried.
  const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]),ry=-ang,nx=-Math.sin(ang),nz=Math.cos(ang),l=L*1.03,ha=H(a[0],a[1]),hc=H(b[0],b[1]),gm=(ha+hc)/2,
   sl=Math.atan2(hc-ha,L),y=Math.min(gm,E.lowY(px,pz,.5,.5))-.3,top=gm+T.h,hh=top-y;
  E.add(W.WL,BOX,px,y,pz,l,hh,WALL_T,0,ry,sl,jc(T.c,px,pz,.04));E.add(W.WL,BOX,px,top,pz,l,COPE_H,WALL_T+.08,0,ry,sl,COPE);   // wall + thin coping
  E.add(W.WL,BOX,px,y,pz,l,gm-y+.13,WALL_T+.1,0,ry,sl,WSK);   // dark plinth line
  if(q<2)E.add(W.LT,BOX,px,top+COPE_H,pz,l,.025,.1,0,ry,sl,SEAM);   // cool seam on machine-side walls
  E.add(W.WL,BOX,a[0],Math.min(ha,hc)-.3,a[1],.04,ha+T.h-Math.min(ha,hc)+.28,WALL_T+.05,0,ry,0,WJ,1);   // panel joint relief (NEAR)
  if(near){const zz=zoneOf(px+nx*.8,pz+nz*.8),o=WALL_T/2+.02;
   E.add(W.WL,BOX,px,y,pz,l,gm-y+.05,WALL_T+.22,0,ry,sl,WSK);   // battered footing step
   for(const f of[.3,.68])E.add(W.WL,BOX,px,gm+T.h*f,pz,l,.02,WALL_T+.03,0,ry,sl,WJ);   // course lines (both faces)
   if(q===2)E.add(W.WL,BOX,px,top+COPE_H,pz,l,.03,WALL_T-.14,0,ry,sl,WJ);   // cap stone
   if(q<2){const s=zz==='M'?1:-1;E.add(W.LT,BOX,px+nx*o*s,gm+T.h*.5,pz+nz*o*s,l,.025,.03,0,ry,sl,CYD);   // cyan conduit on the machine face + brackets
    for(const e of[[a,ha],[b,hc]])E.box(W.ME,e[0][0]+nx*o*s,e[1]+T.h*.5-.03,e[0][1]+nz*o*s,.05,.08,.05,ry,FC);}
   if(q>0){const s=zz==='H'?1:-1,qx=px+nx*.5*s,qz=pz+nz*.5*s;E.box(W.FO,qx,H(qx,qz)-.03,qz,l,HEDGE_H,HEDGE_T,ry,jc(HEDGE,px,pz,.12));   // hedge on the human side
    if(hash(px*3.1,pz*2.3)<.45)for(let i=0;i<4;i++){const sz=.2+.2*hash(px+i,pz),u=(hash(pz+i,px)-.5)*l*.7;   // climbing plants
     E.box(W.FO,px+nz*u+nx*o*s,gm+hash(px-i,pz+i)*(T.h-sz*1.4),pz-nx*u+nz*o*s,sz,sz*(.8+.6*hash(i,px)),.05,ry,jc(cv('#3A4A34'),px+i,pz,.2));}}}
  shadow(px,pz,l,WALL_T,ry,T.h,.5);return true;};
 for(let q=0;q<3;q++){const T=WT[q],lim=LIM[q];if(lim<R0+1)continue;const cuts=[];for(let rr=R0+NJ;rr<lim-.4;rr+=NJ)cuts.push(rr);
  // gate: 1.6 u opening between two pylons (1.5 x wall height), thin lintel (NEAR), one lamp per pylon
  const g=wp(q,RG),ang=tanA(q,RG),ry=-ang,ux=Math.cos(ang),uz=Math.sin(ang),nx=-uz,nz=ux;gates.push({x:g[0],z:g[1],ang,q,nx,nz,ux,uz});let lt=1e9;
  for(const s of[-1,1]){const px=g[0]+ux*(GATE_W/2+PIER_W/2)*s,pz=g[1]+uz*(GATE_W/2+PIER_W/2)*s,y=E.lowY(px,pz,PIER_W,PIER_W)-.2,top=H(px,pz)+T.h*PYL_K;lt=Math.min(lt,top);
   E.add(W.WL,BOX,px,y,pz,PIER_W,top-y,PIER_W,0,ry,0,PYL);E.add(W.WL,BOX,px,top,pz,PIER_W+.1,COPE_H,PIER_W+.1,0,ry,0,COPE);E.add(W.WL,BOX,px,y,pz,PIER_W+.12,.33,PIER_W+.12,0,ry,0,WSK);
   E.add(W.WL,BOX,px,y,pz,PIER_W+.26,.25,PIER_W+.26,0,ry,0,WSK,1);E.add(W.WL,BOX,px,H(px,pz)+T.h,pz,PIER_W+.05,.04,PIER_W+.05,0,ry,0,WJ,1);
   E.box(W.LT,px,top+COPE_H,pz,.22,.06,.22,ry,q<2?SEAM:AMB);E.glow(px,top+.25,pz,.6,q<2?'#8FB0C8':'#D9A066',.5,[.2,6,s,0]);shadow(px,pz,PIER_W,PIER_W,ry,T.h*PYL_K,.5);
   for(const s2 of[-1,1])st.push([g[0]+nx*1.05*s2+ux*2.1*s,g[1]+nz*1.05*s2+uz*2.1*s,ry]);}   // trading stalls on both sides of each gate
  E.add(W.WL,BOX,g[0],lt-.2,g[1],GATE_W+.1,.1,.3,0,ry,0,COPE,1);   // lintel beam (NEAR)
  // runs: piers at every joint, at both ends, and on both sides of a gap blocked by free()
  for(const[a,b]of[[R0,RG-GH],[RG+GH,lim]]){if(b-a<.15)continue;const br=[a,...cuts.filter(c=>c>a+.3&&c<b-.3),b];let prev=false;
   for(let i=0;i+1<br.length;i++){const n=Math.max(1,Math.ceil((br[i+1]-br[i])/.9));
    for(let j=0;j<n;j++){const r0=br[i]+(br[i+1]-br[i])*j/n,r1=br[i]+(br[i+1]-br[i])*(j+1)/n,ok=wseg(q,r0,r1);if(ok?(j===0||!prev):prev)pier(q,r0,0);prev=ok;}}
   if(prev)pier(q,b,b===lim);}}
 // outer gate where the road arrives (avenue to the market starts here): two posts + beam, 12 m
 {const rg=rOut(kA,'X')*.95,gx=ca*rg,gz=sa*rg,gy=E.lowY(gx,gz,2.2,2.2)-.1,ry=-(kA+PI/2),ux=-sa,uz=ca,C=cv('#6A6860');for(const s of[-1,1]){E.box(W.ST,gx+ux*.95*s,gy,gz+uz*.95*s,.4,1.6,.4,ry,C);E.glow(gx+ux*.95*s,gy+1.8,gz+uz*.95*s,.55,'#D9A066',.5,null);
   E.box(W.ST,gx+ux*.95*s,gy,gz+uz*.95*s,.52,.3,.52,ry,cv('#4A4844'),1);E.box(W.ST,gx+ux*.95*s,gy+1.66,gz+uz*.95*s,.3,.08,.4,ry,cv('#8A867C'),1);}
  E.box(W.ST,gx,gy+1.5,gz,2.4,.16,.3,ry,C);shadow(gx,gz,2.3,.4,ry,1.6,.45);E.anchors.gate={x:gx,y:gy,z:gz};}
 // machine-zone private perimeter wall along its outer edge (10 m): a run always ends with a capped pier (also at gaps blocked by free())
 {let pv=null,prev=false;const PC=cv('#6A6E76'),PK=cv('#8A8E96'),pp=q=>{const y=E.lowY(q[0],q[1],.4,.4)-.2,t=H(q[0],q[1])+WALL_H[0]*1.12,ry=-Math.atan2(q[1],q[0]);
   E.add(W.WL,BOX,q[0],y,q[1],.4,t-y,.4,0,ry,0,cv('#5E626A'));E.add(W.WL,BOX,q[0],t,q[1],.46,.05,.46,0,ry,0,PK);};
  for(let t=.03;t<=MW-.03;t+=.09){const a=BA[0]+mir*t,rr=rOut(a,'M')*.985,x=Math.cos(a)*rr,z=Math.sin(a)*rr;let ok=false;
   if(pv){const xm=(x+pv[0])/2,zm=(z+pv[1])/2;ok=free(x,z,.3)&&free(xm,zm,.3)&&free(pv[0],pv[1],.3);
    if(ok){const L=Math.hypot(x-pv[0],z-pv[1]),h0=H(x,z),h1=H(pv[0],pv[1]),y=Math.min(h0,h1,H(xm,zm))-.2,top=Math.max(h0,h1)+WALL_H[0],ry=-Math.atan2(z-pv[1],x-pv[0]);
     E.add(W.WL,BOX,xm,y,zm,L*1.04,top-y,.24,0,ry,0,PC);E.add(W.WL,BOX,xm,top,zm,L*1.04,.04,.32,0,ry,0,PK,1);E.add(W.WL,BOX,xm,y,zm,L*1.04,Math.max(h0,h1)-y+.1,.36,0,ry,0,WSK,1);
     shadow(xm,zm,L,.24,ry,WALL_H[0],.45,1);if(!prev)pp(pv);}else if(prev)pp(pv);}
   prev=ok;pv=[x,z];}
  if(prev)pp(pv);}
 // ---- cargo path = Catmull-Rom spline depot -> machine gate (centred) -> market corner; pods ride the same polyline ----
 let PL=null,CL=[0],LT=0;{const g=gates.find(q=>q.q===0);if(g){const s=zoneOf(g.x+g.nx*.9,g.z+g.nz*.9)==='M'?1:-1,b=BA[0],rc=PLZ0+PLZ1-.4;
  const PATH=[[hx+.4,hz+4.9],[g.x+g.nx*1.8*s,g.z+g.nz*1.8*s],[g.x,g.z],[g.x-g.nx*1.8*s,g.z-g.nz*1.8*s],[Math.cos(b)*rc-g.nx*s,Math.sin(b)*rc-g.nz*s]];
  PL=[];for(let i=0;i<=32;i++)PL.push(cr(PATH,i/8));for(let i=1;i<PL.length;i++){LT+=Math.hypot(PL[i][0]-PL[i-1][0],PL[i][1]-PL[i-1][1]);CL.push(LT);}}}
 const pathD=(x,z)=>{let b=1e9;if(PL)for(let i=0;i+1<PL.length;i++)b=Math.min(b,segD(x,z,PL[i][0],PL[i][1],PL[i+1][0],PL[i+1][1]));return b;};
 const FP=gates.filter(g=>g.q>0).map(g=>[g.x+g.nx*2.2,g.z+g.nz*2.2,g.x-g.nx*2.2,g.z-g.nz*2.2]),fpD=(x,z)=>{let b=1e9;for(const f of FP)b=Math.min(b,segD(x,z,f[0],f[1],f[2],f[3]));return b;};   // foot paths through the other two gates
 // ---- machine zone: the Monolith Array: chamfered prisms, setbacks, relief grid, roof plant, cyan roof edge lines; NEAR: louvres, panels, slot glazing ----
 const slabEdge=(x,yt,z,w,dd,c)=>E.box(W.LT,x,yt-.07,z,w+.07,.06,dd+.07,0,c);   // crisp roof edge line (1 box, both tiers)
 const mono=(x,z,w,dd,h,yb,ent)=>{const steps=h>12?2:h>=7?1:0,hb0=steps?h*(steps>1?.84:.9):h,hp=n=>hash(x*1.7+n*3.1,z*1.3-n*4.7);
  E.add(W.MO,chGeo(w,dd,.14),x,yb,z,1,hb0,1,0,0,0,jc(G0,x,z,.05));E.box(W.MO,x,yb,z,w+.2,.13,dd+.2,0,SK);slabEdge(x,yb+hb0,z,w,dd,EDGE);   // body + dark skirt
  let tw=w,td=dd,y=yb+hb0;for(let s=0;s<steps;s++){tw-=.6;td-=.5;const hs=(h-hb0)/steps;E.add(W.MO,chGeo(tw,td,.12),x,y,z,1,hs,1,0,0,0,G1);
   E.box(W.LT,x,y+.06,z,tw+.03,.03,td+.03,0,CYD,1);y+=hs;slabEdge(x,y,z,tw,td,EDGE);}   // crown setbacks (both tiers) + lit maintenance band (NEAR)
  const nv=near?Math.max(2,Math.round(w/.8)):3,nd=near?Math.max(2,Math.round(dd/.8)):3;   // facade grid: relief strips .025 u proud
  for(const s of[-1,1]){for(let i=1;i<nv;i++)E.box(W.MO,x+(i/nv-.5)*w,yb+.13,z+s*(dd/2+.012),.045,hb0-.3,.025,0,G2);for(let i=1;i<nd;i++)E.box(W.MO,x+s*(w/2+.012),yb+.13,z+(i/nd-.5)*dd,.025,hb0-.3,.045,0,G2);}
  if(near)for(let yy=yb+3*S;yy<yb+hb0-.3;yy+=3*S)E.box(W.MO,x,yy,z,w+.05,.03,dd+.05,0,G2);else for(let i=1;i<=3;i++)E.box(W.MO,x,yb+hb0*i/4,z,w+.05,.03,dd+.05,0,G2);
  const n=2+((hp(1)*3)|0);for(let i=0;i<n;i++){const bw=Math.min(.9,tw*.28)*(.75+.45*hp(2+i)),bd=Math.min(.7,td*.3)*(.75+.45*hp(6+i)),bh=.3+.3*hp(10+i),px=x+((i+.5)/n-.5)*(tw-.5)*.9,pz=z+(hp(14+i)-.5)*Math.max(0,td-bd-.4);
   E.box(W.MO,px,y,pz,bw,bh,bd,0,EQ);if(i<2)E.add(W.ME,CY8,px,y+bh,pz,bw*.3,.05,bw*.3,0,0,0,FC,1);}   // plant blocks (both tiers) + fans (NEAR)
  if(near){for(let i=0;i<2;i++)E.add(W.ME,E.G.cyl(8,.8),x+(hp(20+i)-.5)*(tw-.6),y,z+td*.32*(i?1:-1),.09,.15,.09,0,0,0,FC);   // vents
   E.box(W.ME,x+tw*.36,y,z-td*.34,.03,.9,.03,0,cv('#5A626E'));   // antenna mast
   for(const s of[-1,1]){E.box(W.ME,x,y+.07,z+s*(td/2-.07),tw-.2,.015,.015,0,cv('#566070'));E.box(W.ME,x+s*(tw/2-.07),y+.07,z,.015,.015,td-.2,0,cv('#566070'));}   // maintenance rails
   // camera-facing faces (+z, +-x): louvres on the lower 2 storeys, storey panels, slot glazing on the upper third (every other bay)
   const GL=cv('#26384A'),FN=cv('#343A46');
   for(const[ax,s,nb,fw]of[[0,1,nv,w],[1,1,nd,dd],[1,-1,nd,dd]]){const bw=fw/nb,ww=bw-.3,
    fb=(m,u,yy,wd,ht,th,c,o)=>ax?E.box(m,x+s*(w/2+o),yy,z+u,th,ht,wd,0,c):E.box(m,x+u,yy,z+dd/2+o,wd,ht,th,0,c);
    for(let i=0;i<nb;i++){const u=(i+.5-nb/2)*bw;
     if(!(ent&&!ax&&Math.abs(u-.5)<.7))for(let j=0;j<10;j++)fb(W.MO,u,yb+.2+j*.078,ww,.03,.04,FN,.02);
     for(let yy=yb+3*S,j=0;yy+S<yb+hb0*.66;yy+=S,j++)fb(W.MO,u,yy+.045,ww,S-.06,.012,jc(G1,u+yy,x+i+ax,.14),.008);
     if((i+ax)%2===0)for(let yy=yb+hb0*.67;yy<yb+hb0-.35;yy+=S){fb(W.LT,u,yy,ww*.5,S*.72,.012,mx(GL,COOLB,.3*hp(i*7+yy)),.004);
      fb(W.MO,u,yy-.03,ww*.5+.08,.03,.05,G2,.025);fb(W.MO,u,yy+S*.72,ww*.5+.08,.02,.04,G2,.02);}}}
   if(ent){const ex=x+.5,ez=z+dd/2;E.box(W.MO,ex,yb,ez+.03,.8,.78,.06,0,SK);E.box(W.LT,ex,yb+.7,ez+.065,.7,.03,.01,0,CYD);E.box(W.MO,ex,yb+.82,ez+.25,1.1,.05,.5,0,G2);   // entrance recess + canopy
    for(const s of[-1,1])E.box(W.MO,ex+s*.48,yb,ez+.2,.06,.82,.4,0,G1);E.box(W.MO,ex,yb,ez+.3,1.2,.05,.6,0,EQ);E.box(W.ME,ex,yb+.05,ez+.063,.3,.5,.012,0,cv('#30363E'));}
   if(steps>1){const C=cv('#6A727E'),cz=z-td*.15;for(const s of[-1,1])E.box(W.ME,x+s*.6,y,cz,.05,.55,.05,0,C);E.box(W.ME,x+.35,y+.55,cz,2.3,.05,.06,0,C);   // roof gantry crane
    E.box(W.ME,x+1.2,y+.38,cz,.1,.17,.1,0,EQ);E.box(W.ME,x+1.2,y+.1,cz,.012,.3,.012,0,C);E.box(W.ME,x-.2,y+.55,cz,.04,.37,.04,0,C);
    Z.beam(E,W.ME,x-.6,y+.58,cz,x-.2,y+.9,cz,.03,C);Z.beam(E,W.ME,x-.2,y+.9,cz,x+1.5,y+.6,cz,.03,C);}}
  shadow(x,z,w,dd,0,h,.7);};
 const FTC=[hx-.1,hz+.25,5.95,2.15],FTA=[hx,hz+3.2,3.25,1.25];
 {let lo=1e9,hi=-1e9;for(let i=-3;i<=3;i++)for(let j=0;j<=3;j++){const h=H(hx+i*2,hz-1.9+j*2.1);lo=Math.min(lo,h);hi=Math.max(hi,h);}
  const yT=hi+.3,yB=lo-.3,FOOT=cv('#101216'),top=yT+HERO[0][4];
  E.box(W.B,hx-.1,yB,hz+.25,11.9,yT-yB,4.3,0,FOOT);E.box(W.B,hx,yB,hz+3.2,6.5,yT-yB-.1,2.5,0,FOOT);   // shared T-shaped stepped footing
  shadow(hx-.1,hz+.25,11.9,4.3,0,1,.55);shadow(hx,hz+3.2,6.5,2.5,0,.8,.5);
  for(const[dx,dz,w,dd,h,dp]of HERO)mono(hx+dx,hz+dz,w,dd,h,yT-dp,h>12);
  for(const sx of[-1,1])for(const sz of[-1,1])E.glow(hx+sx*2.2,top+.1,hz+sz*1.3,.7,'#9FB4C6',.32,null);
  E.anchors.machine={x:hx,y:top,z:hz};E.anchors.hero={x:hx,z:hz,top,h:HERO[0][4],w:HERO[0][2]};}
 // low windowless blocks on the strict grid (data halls 14-29 m): skirt, edge line, roof units; NEAR: loading bay, ribs, fans, cable trays
 const blocks=[];
 for(let i=-7;i<7;i++)for(let j=-5;j<=5;j++){const dx=(i+.5)*BP_,dz=1.6+j*BP_,x=hx+dx,z=hz+dz,rr=Math.hypot(x,z),a=Math.atan2(z,x);
  if(dx>-7.4&&dx<7.2&&dz>-3.3&&dz<5.8)continue;if(zoneOf(x,z)!=='M'||rr>rOut(a,'M')*.9||rr<pr(a)+1.2)continue;
  if(borderD(x,z)<1.9||pathD(x,z)<1.5||!free(x,z,1.8))continue;blocks.push({x,z,dz,q:Math.hypot(dx,dz*1.2)});}
 blocks.sort((a,b)=>a.q-b.q);blocks.length=Math.min(blocks.length,10);
 for(const b of blocks){const w=1.5+.4*hash(b.x,b.z+3),dd=1.5+.4*hash(b.z,b.x-2),y=E.lowY(b.x,b.z,w+.2,dd+.2)-.2;let h=2+1.8*hash(b.x*.7+1,b.z*.9);if(b.dz>4)h=Math.min(h,2.4);b.y=y;
  const yt=y+h;E.box(W.B,b.x,y,b.z,w,h,dd,0,jc(cv('#1B1F26'),b.x,b.z,.06));E.box(W.B,b.x,y,b.z,w+.16,.34,dd+.16,0,SK);slabEdge(b.x,yt,b.z,w,dd,EDGE2);
  E.box(W.B,b.x-w*.2,yt,b.z+dd*.1,w*.3,.3,dd*.4,0,EQ);E.box(W.B,b.x+w*.22,yt,b.z-dd*.15,w*.26,.32,dd*.3,0,EQ);   // roof units
  if(near){const fz=b.z+dd/2;E.box(W.ME,b.x-w*.15,y+.2,fz+.005,.5,.55,.03,0,cv('#30363E'));E.box(W.LT,b.x-w*.15,y+.77,fz+.01,.5,.025,.03,0,CYD);   // loading door + dim cyan strip
   E.box(W.ST,b.x-w*.15,y+.12,fz+.12,.7,.09,.24,0,cv('#3A3E46'));for(const s of[-1,1])E.box(W.ME,b.x-w*.15+s*.32,y+.2,fz+.2,.03,.14,.03,0,FC);   // dock + guard posts
   for(const s of[-1,1])E.box(W.B,b.x+s*w*.33,y+.34,fz+.004,.04,h-.5,.025,0,G2);
   for(const u of[-.3,0,.3]){for(const s of[-1,1])E.box(W.B,b.x+s*(w/2+.004),y+.34,b.z+u*dd,.025,h-.5,.04,0,G2);E.box(W.B,b.x+u*w,y+.34,b.z-dd/2-.004,.04,h-.5,.025,0,G2);}   // side / rear ribs
   E.box(W.B,b.x,y+h*.55,b.z,w+.03,.025,dd+.03,0,G2);E.add(W.ME,E.G.cyl(8,.8),b.x+w*.3,yt,b.z+dd*.3,.08,.12,.08,0,0,0,FC);
   const nf=2+((hash(b.x+5,b.z)*3)|0);for(let i=0;i<nf;i++){const u1=i<2,fx=u1?b.x-w*.2:b.x+w*.22,fzz=u1?b.z+dd*.1+(i-.5)*dd*.2:b.z-dd*.15+(i-2.5)*dd*.15,fy=yt+(u1?.3:.32),fr=w*(u1?.09:.065);   // roof cooling fans
    E.add(W.ME,CY8,fx,fy,fzz,fr,.04,fr,0,0,0,FC);E.add(W.ME,CY8,fx,fy+.04,fzz,fr*.4,.02,fr*.4,0,0,0,SK);}}
  shadow(b.x,b.z,w,dd,0,h,.55);}
 if(near)for(let i=0;i<blocks.length;i++)for(let j=i+1;j<blocks.length;j++){const a=blocks[i],b=blocks[j],dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z);if(dx+dz>BP_*1.05||dx+dz<1)continue;   // cable trays between neighbours
  const ax=dx>dz,xm=(a.x+b.x)/2,zm=(a.z+b.z)/2,gy=H(xm,zm)-.05,ty=Math.max(a.y,b.y)+1.4;if(pathD(xm,zm)<.5)continue;
  E.box(W.ME,xm,ty,zm,ax?1.1:.14,.04,ax?.14:1.1,0,FC);E.box(W.LT,xm,ty+.04,zm,ax?1.1:.02,.015,ax?.02:1.1,0,CYD);E.box(W.ME,xm,gy,zm,.04,ty-gy,.04,0,FC);}
 // ---- lots per zone (r1 zone-aligned grids) ----
 const lots=(zn,pitch,ga,acc)=>{const out=[],u=[Math.cos(ga),Math.sin(ga)],v=[-Math.sin(ga),Math.cos(ga)],n=Math.ceil(RMAX*1.1/pitch);
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const a=i*pitch,b=j*pitch,x=a*u[0]+b*v[0],z=a*u[1]+b*v[1],rr=Math.hypot(x,z);if(rr<3||zoneOf(x,z)!==zn)continue;
   const an=Math.atan2(z,x),ro=rOut(an,zn);if(rr>ro*.95||rr<pr(an)+pitch*.45+.3)continue;if(r()>(acc?acc(rr/ro):1))continue;
   if(borderD(x,z)<pitch*.45+.65||avD(x,z)<pitch*.5+.55||pathD(x,z)<pitch*.45+.4||fpD(x,z)<pitch*.45+.3||!free(x,z,pitch*.55))continue;out.push({x,z,f:rr/ro,ry:-ga});}return out;};
 const bands=(x,y,z,w,dd,ry,h,step,c,mid)=>{const s=near?step:mid;for(let yy=y+s*.7;yy<y+h-.22;yy+=s)E.box(W.LT,x,yy,z,w+.035,.05,dd+.035,ry,c);};
 const canopy=(L,o,y)=>{lb(W.ME,L.x,L.z,L.ry,0,o+.14,y+.52,.5,.03,.28,cv('#5E6672'));lb(W.ME,L.x,L.z,L.ry,0,o+.012,y+.12,.3,.38,.02,cv('#20262E'));
  for(const s of[-1,1])lb(W.ME,L.x,L.z,L.ry,s*.22,o+.25,y+.1,.025,.42,.025,cv('#5E6672'));};   // entrance canopy + door + posts (NEAR)
 const shrubs=(L,y,n,rad)=>{for(let i=0;i<n;i++){const a=i/n*TAU+hash(L.x,L.z+i)*.8,s=.06+.05*hash(L.z,L.x+i),p=E.L2W(L.x,L.z,L.ry,Math.cos(a)*rad,Math.sin(a)*rad*.9);E.add(W.FO,E.G.ico(0),p[0],y+s*.6,p[1],s,s*.8,s,0,i,0,jc(cv('#3A4836'),p[0],p[1],.2));}};
 // mixed zone: neutral grey-blue glass towers, exoframe towers, planted podium blocks; <= 7 u
 const LX=lots('X',2.4,kA,f=>1-.4*smooth(.55,1,f)),dr=[];
 for(const L of LX){const t=r(),f=.25+.75*smooth(.3,.55,L.f)*(1-.5*smooth(.8,1,L.f));
  if(t<.5){const h=Math.min(5.8,(3+4.2*f)*(.75+.45*r())),w=1.0+.2*r(),y=E.lowY(L.x,L.z,w+.3,w+.3)-.12;E.box(W.B,L.x,y,L.z,w,h,w,L.ry,jc(cv('#2E3A48'),L.x,L.z,.1));
   let k2=0;for(let yy=y+S;yy<y+h-.15;yy+=S,k2++){if(!near&&k2%3)continue;E.box(W.LT,L.x,yy,L.z,w+.03,.07,w+.03,L.ry,(near?k2%3===1:(k2/3)%2===1)?COOLB:WARMB);}
   E.box(W.ME,L.x,y+h,L.z,w*.6,.4,w*.6,L.ry,cv('#5E6672'));E.box(W.ME,L.x,y+h+.4,L.z,.05,.6,.05,0,cv('#6A7280'));   // crown setback + mast
   E.box(W.ST,L.x,y+h-.04,L.z,w+.06,.035,w+.06,L.ry,cv('#7C8692'));   // lighter roof bevel strip (both tiers)
   for(let yy=y+3*S;yy<y+h-.4;yy+=3*S)E.box(W.ST,L.x,yy,L.z,w+.16,.04,w+.16,L.ry,cv('#5A5E66'),1);
   if(near){for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(L.x,L.z,L.ry,s[0]*w/2,s[1]*w/2);E.box(W.ME,p[0],y,p[1],.05,h,.05,L.ry,cv('#4E5866'));}   // corner mullions
    for(const s of[-1,1])for(const u of[-.2,.2]){lb(W.ME,L.x,L.z,L.ry,s*(w/2+.012),u*w,y,.025,h,.025,cv('#4E5866'));lb(W.ME,L.x,L.z,L.ry,u*w,s*(w/2+.012),y,.025,h,.025,cv('#4E5866'));}
    for(let yy=y+2*S;yy<y+h-.3;yy+=2*S){lb(W.ST,L.x,L.z,L.ry,0,w/2+.07,yy,w*.62,.03,.14,cv('#6A6E76'));lb(W.ME,L.x,L.z,L.ry,0,w/2+.135,yy+.03,w*.62,.07,.012,cv('#8A929C'));}   // balconies every 2 storeys
    shrubs(L,y+h,3+((hash(L.x,L.z+7)*3)|0),w*.4);canopy(L,w/2,y);}
   shadow(L.x,L.z,w,w,L.ry,h,.5);dr.push({x:L.x,z:L.z,y:y+h});}
  else if(t<.8){const h=Math.min(6.4,(2.8+3.6*f)*(.75+.45*r())),w=1.15,y=E.lowY(L.x,L.z,w+.4,w+.4)-.12;E.box(W.B,L.x,y,L.z,w,h,w,L.ry,jc(cv('#4A4E58'),L.x,L.z,.08));bands(L.x,y,L.z,w,w,L.ry,h,S*1.5,[.52,.42,.3],S*3);
   const o2=w/2+.14;for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(L.x,L.z,L.ry,s[0]*o2,s[1]*o2);E.box(W.ME,p[0],y,p[1],.15,h+.4,.15,L.ry,cv('#7A808A'));   // exoframe columns
    if(near){for(let yy=y+.9;yy<y+h;yy+=2.0)E.box(W.ME,p[0],yy-.03,p[1],.22,.15,.22,L.ry,cv('#8E949E'));E.box(W.ME,p[0],y,p[1],.24,.14,.24,L.ry,cv('#55595F'));}}   // node plates + bases
   for(let yy=y+.9;yy<y+h;yy+=2.0)E.box(W.ME,L.x,yy,L.z,w+.34,.09,w+.34,L.ry,cv('#6E747E'));
   for(const s of[-1,1])for(const ax of[0,1])for(let yy=y+.2;yy<y+h-1.4;yy+=2.0)for(const sg of[-1,1]){const p=ax?E.L2W(L.x,L.z,L.ry,s*o2,sg*.6):E.L2W(L.x,L.z,L.ry,sg*.6,s*o2);E.add(W.ME,BOX,p[0],yy,p[1],.07,1.85,.07,ax?-sg*.58:0,L.ry,ax?0:sg*.58,cv('#6A707C'),1);}   // X braces (NEAR)
   if(near)canopy(L,w/2,y);
   E.box(W.ST,L.x,y+h-.04,L.z,w+.06,.035,w+.06,L.ry,cv('#868C96'));shadow(L.x,L.z,w+.3,w+.3,L.ry,h,.5);dr.push({x:L.x,z:L.z,y:y+h});}
  else{const h=1.4+.8*r(),w=1.5,y=E.lowY(L.x,L.z,w+.2,w+.2)-.12;E.box(W.ST,L.x,y,L.z,w,h,w*.9,L.ry,jc(cv('#5A5650'),L.x,L.z,.08));bands(L.x,y,L.z,w,w*.9,L.ry,h,S*1.5,[.55,.42,.27],S*3);
   E.box(W.FO,L.x,y+h,L.z,w*.9,.1,w*.8,L.ry,cv('#434E3C'));E.box(W.ST,L.x,y+h-.04,L.z,w+.06,.035,w*.9+.06,L.ry,cv('#8A857C'));
   if(near){shrubs(L,y+h+.1,5,w*.3);canopy(L,w*.45,y);E.box(W.ST,L.x,y+h+.1,L.z,w*.94,.03,w*.84,L.ry,cv('#6E6A62'));}   // roof garden + kerb
   shadow(L.x,L.z,w,w*.9,L.ry,h,.5);}}
 if(dr.length&&P.drones){const D=dr.slice(0,6);E.movers(W.LT,.24,.09,.24,[.34,.44,.52],D.length*2,(i,t,o)=>{const c=D[i>>1],a=t*.16*(i%2?1:-1)+i*1.7,rad=1.5+.35*(i%3);o.position.set(c.x+Math.cos(a)*rad,c.y+.6+.25*Math.sin(t*.35+i),c.z+Math.sin(a)*rad);o.rotation.y=-a;});}
 // ---- trees: conifer = 2 stacked 7-sided cones, broadleaf = 2-3 icosahedron blobs; 7-14 m ----
 const TC=[cv('#2E423E'),cv('#3A4630'),cv('#34443A')],TRK=cv('#3A2E26');
 const tree=(x,z)=>{const t=n=>hash(x*2.3+n*5.7,z*1.9-n*2.1),ht=.9+.85*t(1),ty=H(x,z)-.04,tk=.25+.15*t(2),con=t(3)<.45,c=jc(con?TC[0]:TC[1+((t(4)*2)|0)],x,z,.12);
  if(con){const cr1=.25+.1*t(5),hc=ht-tk;E.box(W.WD,x,ty,z,.06,tk+.1,.06,0,TRK);E.add(W.FO,E.G.cone(7),x,ty+tk,z,cr1,hc*.62,cr1,0,t(6)*TAU,0,c);E.add(W.FO,E.G.cone(7),x,ty+tk+hc*.38,z,cr1*.68,hc*.62,cr1*.68,0,t(7)*TAU,0,mx(c,[.3,.36,.34],.25));}
  else{const nb=2+(t(5)>.5?1:0),cr1=.25+.12*t(6);E.box(W.WD,x,ty,z,.07,ht-cr1,.07,0,TRK);
   for(let i=0;i<nb;i++){const a=t(7+i)*TAU,o=i?cr1*.6:0,rr=cr1*(i?.7:1);E.add(W.FO,E.G.ico(0),x+Math.cos(a)*o,ty+ht-cr1*(i?1.45:1),z+Math.sin(a)*o,rr,rr*.9,rr,0,a,0,i?mx(c,[.2,.26,.2],.3):c);}}
  shadow(x,z,.6,.6,0,ht,.42);};
 // ---- human-only zone: 4 house variants by position hash (gable / hipped / L-shaped / flat modern), 1-2 storeys, warm plaster ----
 const LH=lots('H',1.6,aH,f=>1-.82*smooth(.5,1.02,f));
 const PL6=['#9A8870','#8E8274','#A39078','#86796A','#9C8E80','#7E6E5C'].map(h=>cv(h)),RFC=['#4A4E58','#7A5A4A','#4E4038'].map(h=>cv(h));   // plaster / timber; slate, clay, dark timber
 for(const L of LH){const hs=n=>hash(L.x*1.3+n*7.13,L.z*.7-n*3.31),sc=.88+.24*hs(1),v=(hs(2)*4)|0,two=hs(3)<.4;
  let w=Math.min(1.3,(.9+.3*hs(4))*sc);const dd=Math.min(.95,(.68+.2*hs(5))*sc);if(v===2)w=Math.min(w,1.1);
  const e=two?.8+.05*hs(6):.45+.07*hs(6),rise=.28+.17*hs(7),rot=L.ry+(hs(8)-.5)*.28+(hs(9)<.5?0:PI/2),y=E.lowY(L.x,L.z,1.3,1.3)-.06,hh=e+.06,yt=y+hh,
   wc=jc(PL6[(hs(10)*6)|0],L.x,L.z,.06),rc=jc(RFC[(hs(11)*3)|0],L.x,L.z,.07);
  E.box(W.ST,L.x,y,L.z,w,hh,dd,rot,wc);
  if(v===0||v===2)E.add(W.RF,E.prism(),L.x,yt,L.z,w*1.08,rise,dd*1.14,0,rot,0,rc);
  else if(v===1)E.add(W.RF,PYR,L.x,yt,L.z,w*1.1,rise*1.1,dd*1.14,0,rot,0,rc);   // hipped = 4-sided pyramid
  else{E.box(W.ST,L.x,yt,L.z,w*1.04,.06,dd*1.06,rot,cv('#A8A296'));const p=E.L2W(L.x,L.z,rot,w*.2,0);E.add(W.ME,BOX,p[0],yt+.07,p[1],w*.45,.03,dd*.62,.2,rot,0,cv('#2A3442'));}   // flat roof + PV panel
  if(v===2){const p=E.L2W(L.x,L.z,rot,w*.24,dd*.5),wl=.62*sc,ww=w*.48;E.box(W.ST,p[0],y,p[1],wl,hh-.06,ww,rot+PI/2,wc);E.add(W.RF,E.prism(),p[0],yt-.06,p[1],wl*1.08,rise*.85,ww*1.14,0,rot+PI/2,0,rc);}   // L wing
  if(near){let p=E.L2W(L.x,L.z,rot,-w*.24,dd/2+.012);E.box(W.WD,p[0],y+.06,p[1],.14,.27,.03,rot,cv('#3E3028'));   // door
   p=E.L2W(L.x,L.z,rot,-w*.24,dd/2+.14);E.box(W.ST,p[0],y,p[1],.3,.1,.24,rot,STN);E.box(W.WD,p[0],y+.36,p[1],.32,.03,.26,rot,rc);   // porch step + canopy
   for(let i=0;i<3;i++){const q=E.L2W(L.x,L.z,rot,-w*.24+.03*(i%2),dd/2+.36+i*.13);E.box(W.ST,q[0],H(q[0],q[1])-.035,q[1],.1,.1,.08,rot,STN);}   // stepping stones
   if(v<3){E.box(W.WD,L.x,yt-.012,L.z,w*1.14,.024,dd*1.2,rot,mx(rc,[.2,.18,.16],.4));for(const s of[-1,1])lb(W.WD,L.x,L.z,rot,0,s*dd*.6,yt-.04,w*1.14,.035,.018,FB);}   // eaves overhang + fascia boards
   for(const s of[-1,1])for(let fl=0;fl<(two?2:1);fl++)for(const u of[-.3,.04,.32]){if((s>0&&!fl&&u<-.2)||(v===2&&s>0&&u>0)||d()<.3)continue;const q=E.L2W(L.x,L.z,rot,u*w,s*(dd/2+.012)),wy=y+.24+fl*S;
    E.box(W.LT,q[0],wy,q[1],.12,.13,.03,rot,AMB);lb(W.ST,L.x,L.z,rot,u*w,s*(dd/2+.006),wy-.02,.17,.17,.03,FB);E.box(W.ST,q[0],wy-.025,q[1],.19,.02,.05,rot,FB);   // warm window + frame + sill
    for(const e2 of[-1,1])lb(W.WD,L.x,L.z,rot,u*w+e2*.085,s*(dd/2+.01),wy,.035,.13,.02,rc);}   // shutters
   if(v<3){p=E.L2W(L.x,L.z,rot,w*.27,-dd*.12);E.box(W.ST,p[0],yt,p[1],.1,rise*.7+.14,.1,rot,cv('#6A6058'));E.box(W.ST,p[0],yt+rise*.7+.14,p[1],.13,.025,.13,rot,cv('#8A8076'));}   // chimney + cap
   else{p=E.L2W(L.x,L.z,rot,-w*.28,dd*.2);E.add(W.FO,E.G.ico(0),p[0],yt+.14,p[1],.1,.09,.1,0,0,0,cv('#3A4836'));E.box(W.ME,L.x,yt+.06,L.z,w*1.02,.1,.015,rot,cv('#6A707A'));}   // terrace planter + rail
   // garden items by position hash: bench / shed / vegetable bed / rain barrel
   const gi=(kk,lx,lz)=>{const q=E.L2W(L.x,L.z,L.ry,lx,lz),gy=H(q[0],q[1])-.03;
    if(kk===0)bench(q[0],q[1],L.ry);
    else if(kk===1){E.box(W.WD,q[0],gy,q[1],.3,.24,.26,L.ry,cv('#5A4A3C'));E.add(W.RF,E.prism(),q[0],gy+.24,q[1],.34,.1,.3,0,L.ry,0,rc);}
    else if(kk===2)for(let i=0;i<3;i++){const b=lb(W.WD,q[0],q[1],L.ry,0,(i-1)*.11,gy,.42,.035,.08,cv('#3A3028'));E.box(W.FO,b[0],gy+.035,b[1],.38,.03,.04,L.ry,jc(cv('#4A5C38'),b[0],b[1],.2));}
    else{E.add(W.WD,CY8,q[0],gy,q[1],.06,.17,.06,0,0,0,cv('#5A4636'));E.add(W.ME,CY8,q[0],gy+.17,q[1],.065,.012,.065,0,0,0,cv('#3A3E46'));}};
   const g0=(hs(12)*4)|0;gi(g0,-.62,-.62);if(hs(13)<.6)gi((g0+1+((hs(14)*3)|0))%4,.62,-.62);
   const fen=hs(15)<.4;   // 40 %: picket / low stone fence on the street side instead of the hedge
   for(const s of[-1,1]){p=E.L2W(L.x,L.z,L.ry,0,s*.78);
    if(fen&&s>0){if(hs(16)<.5){for(let i=0;i<20;i++){const q=E.L2W(L.x,L.z,L.ry,(i-9.5)*.08,.78);E.box(W.WD,q[0],H(q[0],q[1])-.03,q[1],.03,.17,.02,L.ry,FB);}
      for(const yy of[.05,.12])E.box(W.WD,p[0],H(p[0],p[1])-.03+yy,p[1],1.56,.02,.012,L.ry,FB);}
     else for(let i=0;i<7;i++){const q=E.L2W(L.x,L.z,L.ry,(i-3)*.225,.78);E.box(W.ST,q[0],H(q[0],q[1])-.04,q[1],.215,.1+.04*hash(q[0],q[1]),.1,L.ry,jc(STN,q[0],q[1],.15));}}
    else E.box(W.FO,p[0],H(p[0],p[1])-.04,p[1],1.56,HEDGE_H,HEDGE_T,L.ry,HEDGE);
    p=E.L2W(L.x,L.z,L.ry,s*.78,0);E.box(W.FO,p[0],H(p[0],p[1])-.04,p[1],HEDGE_T,HEDGE_H,1.56,L.ry,HEDGE);}}   // plot hedges (ground lines carry them at MID)
  shadow(L.x,L.z,w,dd,rot,e+rise*.5,.48);
  if(r()<.55){const p=E.L2W(L.x,L.z,L.ry,(r()<.5?-1:1)*.57,.57);tree(p[0],p[1]);}
  if(hash(L.x*1.3,L.z*.7)<.3)E.glow(L.x,y+e*.6,L.z,.5,'#D9A066',.42,null);}
 // ---- shared market: chamfered pale stone hall with barrel-vault rows, arcade pavilion, stall ring, warm-white lamps ----
 let nSt=0;{const ry=-(kA+PI/2),y=E.lowY(0,0,6,6)-.1,hh=HALL[2]+.1,yt=y+hh,HB=cv('#A69E90'),MK8=mx(MKL,[0,0,0],.2);
  E.add(W.ST,chGeo(HALL[0],HALL[1],.15),0,y,0,1,hh,1,0,ry,0,HB);E.box(W.ST,0,y,0,HALL[0]+.2,.22,HALL[1]+.2,ry,cv('#6E675C'));   // hall + plinth
  for(let i=0;i<4;i++){const p=E.L2W(0,0,ry,(i-1.5)*1.5,0);E.add(W.RF,VAULT,p[0],yt,p[1],1.5,1.1,HALL[1]+.1,0,ry,0,jc(cv('#7E888E'),i+1,2,.05));}   // 4 vault rows
  for(const s of[-1,1]){const p=E.L2W(0,0,ry,0,s*(HALL[1]/2+.02));E.box(W.LT,p[0],yt-.22,p[1],HALL[0]-.4,.05,.04,ry,MKL);}   // warm-white light line under the eaves
  E.box(W.ST,0,yt-.03,0,HALL[0]+.08,.05,HALL[1]+.08,ry,cv('#C2BBAE'));   // lighter eaves bevel strip (both tiers)
  shadow(0,0,HALL[0],HALL[1],ry,HALL[2]+.5,.55);
  if(near){for(const s of[-1,1]){let p=E.L2W(0,0,ry,0,s*(HALL[1]/2+.3));E.box(W.RF,p[0],y+1.12,p[1],HALL[0]-.3,.05,.6,ry,cv('#6E787E'));   // arcade canopy
    for(let q=-5;q<=5;q++){p=E.L2W(0,0,ry,q*.55,s*(HALL[1]/2+.52));E.box(W.ST,p[0],y,p[1],.09,1.12,.09,ry,cv('#B0A89C'));E.box(W.ST,p[0],y,p[1],.14,.12,.14,ry,cv('#8E867A'));}   // arcade piers + bases
    for(let q=-8;q<=8;q++)lb(W.LT,0,0,ry,q*.35,s*(HALL[1]/2+.6),y+1.08,.035,.035,.035,MKL);   // bulbs along the canopy edge
    for(const u of[-2,0,2]){p=E.L2W(0,0,ry,u,s*(HALL[1]/2+.012));E.box(W.WD,p[0],y+.1,p[1],.5,.8,.03,ry,cv('#4A3E34'));}
    for(const u of[-2.6,-1.3,-.7,.7,1.3,2.6]){p=E.L2W(0,0,ry,u,s*(HALL[1]/2+.012));E.box(W.LT,p[0],y+.75,p[1],.2,.3,.03,ry,MKL);}
    for(let i=0;i<4;i++)for(const u of[-.4,0,.4])lb(W.LT,0,0,ry,(i-1.5)*1.5+u,s*(HALL[1]/2+.06),yt+.06,.26,u?.2:.34,.03,MK8);}   // clerestory lunette windows at the vault bases
   for(const[u,v2,r2]of[[-1.2,-2.3,0],[1.2,-2.3,0],[-3.5,.9,1],[3.5,-.9,1],[-3.5,-.9,1],[3.5,.9,1]]){const p=E.L2W(0,0,ry,u,v2);bench(p[0],p[1],ry+r2*PI/2);}   // plaza benches
   for(const s of[-1,1]){const p=E.L2W(0,0,ry,s*2.5,-2.35);E.box(W.ST,p[0],H(p[0],p[1])-.03,p[1],.42,.1,.42,ry,cv('#8A8478'));tree(p[0],p[1]);}}   // 2 trees in planters
  const pv=E.L2W(0,0,ry,0,2.95),py=E.lowY(pv[0],pv[1],3.4,3.4)-.05;   // second pavilion: covered arcade behind the hall
  E.box(W.RF,pv[0],py+.85,pv[1],3.4,.07,1.2,ry,cv('#6E7A80'));E.add(W.RF,E.prism(),pv[0],py+.92,pv[1],3.4,.28,1.2,0,ry,0,cv('#77838A'));
  for(let i=0;i<5;i++)for(const s of[-1,1]){const p=E.L2W(pv[0],pv[1],ry,(i-2)*.8,s*.5);E.box(W.ST,p[0],py,p[1],.09,.86,.09,ry,cv('#A0988C'),i%4?1:0);}
  E.box(W.LT,pv[0],py+.8,pv[1],3.0,.03,.04,ry,MKL,1);shadow(pv[0],pv[1],3.4,1.2,ry,1,.45);
  for(let i=0;i<12;i++){const a=i/12*TAU+.2,x=Math.cos(a)*4.1,z=Math.sin(a)*4.1;if(avD(x,z)<.9||Math.hypot(x-pv[0],z-pv[1])<1)continue;st.push([x,z,-a]);}
  const CAN=['#8A7448','#4E6A70','#6A5064','#9A8E72'].map(h=>cv(h));   // ochre, slate teal, plum, sand
  for(const[x,z,ry2]of st){if(!free(x,z,.3)||pathD(x,z)<.7)continue;nSt++;const yy=E.lowY(x,z,.5,.5)-.04;
   E.box(W.WD,x,yy,z,STALL[0],.34,STALL[1],ry2,cv('#4A3E34'));E.add(W.RF,BOX,x,yy+.5,z,STALL[2],.04,.56,.22,ry2,0,CAN[(hash(x,z)*4)|0]);   // counter + canopy
   if(near){for(const s of[-1,1]){const p=E.L2W(x,z,ry2,s*.26,-.2);E.box(W.WD,p[0],yy,p[1],.03,.58,.03,ry2,cv('#5A4A3A'));}
    for(let i=0;i<3;i++){const p=E.L2W(x,z,ry2,(i-1)*.13,.05);E.box(W.WD,p[0],yy+.34,p[1],.09,.05+.04*hash(x+i,z),.12,ry2,jc(CAN[(i+1+((hash(z,x)*4)|0))%4],x+i,z,.2));}   // goods
    const nc=3+((hash(x+1,z-1)*3)|0),sd=hash(z,x)<.5?-1:1;for(let i=0;i<nc;i++){const cs=.09+.03*hash(x+i,z+i);   // goods crates beside the stall
     lb(W.WD,x,z,ry2,(.36+.12*(i&1))*sd,(((i>>1)%2)-.5)*.15,yy+(i>3?.1:0),cs,cs*.85,cs,jc(cv('#6A5440'),x+i,z,.25));}
    E.box(W.LT,x,yy+.46,z,.06,.04,.06,ry2,MKL);}
   shadow(x,z,.6,.56,ry2,.5,.45);}
  let pl=null;for(let i=0;i<8;i++){const a=i/8*TAU+.46,x=Math.cos(a)*4.7,z=Math.sin(a)*4.7;if(avD(x,z)<.6){pl=null;continue;}const ly=H(x,z)-.03;   // lamp posts .5 u + string lights
   E.box(W.ME,x,ly,z,.04,LAMP_H,.04,0,cv('#5A5E66'),1);E.box(W.LT,x,ly+LAMP_H,z,.1,.07,.1,0,MKL,1);E.glow(x,ly+LAMP_H+.1,z,.6,'#F2E4C4',.68,null);
   if(pl){Z.beam(E,W.LT,pl[0],pl[1],pl[2],x,ly+LAMP_H+.03,z,.02,[.6,.54,.42],1);
    if(near){const n=Math.round(Math.hypot(x-pl[0],z-pl[2])/.35);for(let j=1;j<n;j++){const t=j/n;E.box(W.LT,pl[0]+(x-pl[0])*t,pl[1]+(ly+LAMP_H+.03-pl[1])*t-.035,pl[2]+(z-pl[2])*t,.035,.035,.035,0,MKL);}}}   // hanging bulbs every .35 u
   pl=[x,ly+LAMP_H+.03,z];}
  for(let i=0;i<4;i++){const a=i/4*TAU+.6;E.glow(Math.cos(a)*3.5,y+1.1,Math.sin(a)*3.5,.6,'#F2E4C4',.62,null);}E.anchors.market={x:0,y,z:0};}
 // ---- ground clutter (NEAR): avenue bollards + street lamps, foot-path lamps, stacked cargo containers at the cargo path start ----
 if(near){const BC=cv('#5A5E66'),CTN=['#5A6470','#6A5648','#4E5A52'].map(h=>cv(h));
  for(let t=pr(kA)+.4,i=0;t<rOut(kA,'X')*.95-.5;t+=.625,i++)for(const s of[-1,1]){const x=ca*t-sa*.8*s,z=sa*t+ca*.8*s;if(!free(x,z,.1))continue;
   E.add(W.ME,CY8,x,H(x,z)-.03,z,.03,.15,.03,0,0,0,BC);if(i%4===1&&s===(i%8<4?1:-1))lamp(ca*t-sa*.95*s,sa*t+ca*.95*s);}
  for(const f of FP){const ux=(f[2]-f[0])/4.4,uz=(f[3]-f[1])/4.4;for(const t of[.15,.85])lamp(f[0]+(f[2]-f[0])*t-uz*.42,f[1]+(f[3]-f[1])*t+ux*.42);}
  if(PL)lamp(PL[4][0]+.45,PL[4][1],1);
  for(let i=0;i<4;i++){const x=hx+1.5+i*.62,z=hz+4.95+.1*hash(i,hx),n=2+(hash(i+3,hz)>.5?1:0),gy=E.lowY(x,z,.5,.22)-.03;if(!free(x,z,.3)||pathD(x,z)<.4)continue;
   for(let j=0;j<n;j++)E.box(W.ME,x,gy+j*.225,z,.5,.22,.22,(hash(i,j)-.5)*.1,jc(CTN[(i+j)%3],x+j,z,.15));shadow(x,z,.5,.22,0,.6,.4,1);}}
 // cargo pods (one InstancedMesh, .5 u): slow ping-pong along the spline
 if(PL){const at=s=>{s=((s%(2*LT))+2*LT)%(2*LT);if(s>LT)s=2*LT-s;let i=1;while(i<PL.length-1&&CL[i]<s)i++;const t=Math.max(0,Math.min(1,(s-CL[i-1])/((CL[i]-CL[i-1])||1e-3)));return[PL[i-1][0]+(PL[i][0]-PL[i-1][0])*t,PL[i-1][1]+(PL[i][1]-PL[i-1][1])*t];};
  E.movers(W.ME,POD,.28,.3,cv('#76808E'),3,(i,t,o)=>{const s=t*.3+i*LT*2/3,p=at(s),q=at(s+.12);o.position.set(p[0],H(p[0],p[1])+.17,p[1]);o.rotation.y=-Math.atan2(q[1]-p[1],q[0]-p[0]);});}
 // ---- ground: zone tints, cool machine grid, hedge lines + strip fields, avenue, wall lanes, cargo lane, market paving (radial stripes) + kerb, AO ----
 const CC={C:cv('#7C7468'),M:cv('#20242C'),X:cv('#484A50'),H:cv('#4C563C')},LINE=cv('#4E6480'),CLANE=cv('#6E7A88'),HEDG=cv('#2E3828'),GRN=cv('#445040'),
  FLD=[cv('#5C6040'),cv('#6A6244'),cv('#4A5236')],AV=cv('#6E6A62'),LANE=cv('#8E897E'),MK=cv('#8A8274'),MK2=cv('#7A7366'),KERB=cv('#565048');
 const uh=[Math.cos(aH),Math.sin(aH)],fr=(v,p)=>Math.abs(((v/p)%1+1)%1-.5)*p,rectD=(x,z,q)=>Math.hypot(Math.max(Math.abs(x-q[0])-q[2],0),Math.max(Math.abs(z-q[1])-q[3],0));
 E.ground(near?130:80,R*1.6,(x,z,c)=>{const rr=Math.hypot(x,z),a=Math.atan2(z,x),zn=zoneOf(x,z),ro=rOut(a,zn),n1=vn(x*.5+3,z*.5-1),n2=vn(x*1.4,z*1.4);let col=CC[zn];
  if(zn==='M'){const sd=Math.min(fr(x-hx-BP_/2,BP_),fr(z-hz-1.6,BP_));col=mx(col,LINE,.85*(1-smooth(.06,.26,sd)));}   // cool grid on the block lanes
  else if(zn==='H'){const u=x*uh[0]+z*uh[1],v=-x*uh[1]+z*uh[0];if(rr>ro*.7)col=FLD[((Math.floor(u/1.25)%3)+3)%3];else col=mx(col,HEDG,.9*(1-smooth(.08,.26,Math.min(fr(u,1.6),fr(v,1.6)))));}   // strip fields / plot hedge lines
  else if(zn==='X'&&n2>.7)col=mx(col,GRN,.5);
  if(avD(x,z)<.7&&rr<ro*1.1)col=AV;if(fpD(x,z)<.3)col=AV;
  const pd=pathD(x,z);if(pd<.36)col=mx(col,CLANE,1-smooth(.22,.36,pd));   // smooth cargo lane (pale cool)
  const bd=borderD(x,z);if(bd<.98)col=mx(col,LANE,bd<.75?1:.6);   // pale paved lane along every wall
  const pp=pr(a)*(1+.06*(n2-.5));if(rr<pp)col=rr>pp-.22?KERB:mx(mx(MK,MK2,smooth(.3,.7,n2)),KERB,.45*(1-smooth(.04,.17,Math.min(fr(a,TAU/24)*rr,Math.abs(rr-3.75))))*smooth(1.8,2.6,rr));   // paving stripes radiating from the hall + one ring
  const f=(.92+.16*n1)*(1-.4*(1-smooth(.2,1,bd)))*(1-.45*(1-smooth(0,.8,Math.min(rectD(x,z,FTC),rectD(x,z,FTA)))));   // soft AO ring at wall / hero feet
  c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;const q=rr/ro*(1+.1*(n1-.5));c[3]=1-(zn==='H'?smooth(.66,1.06,q):smooth(.84,1.03,q));});
 {const gm=E.grp.children.find(m=>/_ground$/.test(m.name||''));if(gm)gm.material=megaGround(gm.material);}
 // contact-shadow decal mesh (one extra draw per tier)
 if(SI.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(SP,3));g.setAttribute('color',new THREE.Float32BufferAttribute(SC,4));g.setIndex(SI);
  // r2 Opus: GPU review 11-24 saw no contact shadows -> draw after the feathered (transparent) ground and every other site mesh
  const ms=new THREE.Mesh(g,SHM);ms.name=E.name+'_cshadow';ms.renderOrder=12;E.grp.add(ms);}
 E.info.lots={M:blocks.length+HERO.length,X:LX.length,H:LH.length,gates:gates.length,stalls:nSt,bridges:0,mir,shift:+sh.toFixed(2)};E.info.decals=SN;});}};
// mega r1 integration (Opus): called by prolib.js after a successful build. (1) close-up camera adapts to the tall hero (UI fixed):
// review 11-18 'camera too low/close' -> d 43.7 -> 57 (x1.3), target raised (ly 4 -> 6) and pulled toward the hero so the Monolith Array
// sits mid-frame between the title block and the card; ?megacam=d,ly,dx,dz overrides for tuning. (2) label anchor height AH (fa4_labels.js) follows the hero so the name disc / stem lift
// clears its roof at world zoom, capped at the current global label plane (no other site's marker moves).
FA.PROLIB_MEGA.hook=(o,site)=>{const h=o.anchors&&o.anchors.hero;if(!h)return;
 const q=(new URLSearchParams(location.search).get('megacam')||'').split(',').map(Number),v=(i,d)=>isFinite(q[i])&&q[i]!==0?q[i]:d;
 try{if(window.CLOSECAM)window.CLOSECAM.libertarian={d:v(0,78),pit:.45,yaw:0,ly:v(1,6),dx:v(2,h.x*.5+1.2),dz:v(3,h.z*.35+.6)};}catch(e){}
 try{if(typeof AH!=='undefined'&&typeof O!=='undefined'){let top=-1e9;for(const s of O)if(s.id!=='libertarian')top=Math.max(top,(s.gy||0)+(AH[s.id]||5));
  const gy=(typeof byId!=='undefined'&&byId.libertarian&&byId.libertarian.gy)||site.y||0;AH.libertarian=Math.max(AH.libertarian||4.2,Math.min(h.top+1,top-gy));}}catch(e){}
 try{FA.PROLIB_MEGA.live(o,site);}catch(e){(window.__errs=window.__errs||[]).push('mega live0: '+(e&&e.message));}};
// ---- mega r2 integration (Opus): runtime hooks that need host globals (ANIM, IM, SC, CAM, sun, view, focusO). Everything here runs
// only under ?mega=1 (this file is loaded only then). (1) problem 2 'floating debris': the probe (11-23, GPU box) found the brown cubes /
// dark cones around the close-up are WORLD scatter props of fa4_world.js (sid null: 32 houses + gable roofs, 17 conifers, 12 graphite
// 'crystal' octahedra, trees) 20-47 u from the site centre; they sit on the terrain (sink <= .24 u) but read as floating in the fog at the
// low close-up pitch. World props inside the mega footprint (R*1.55) are hidden permanently; in the libertarian close-up every world prop
// within 70 u is hidden too (restored on leaving). Instances are zero-scaled (matrices saved), so the shared instanced meshes stay intact.
// (2) problem 6: close-up depth gradient: the site's own materials get uD0/uD1/uDA from the camera distance; the host linear fog
// (210..460 = no fog at d ~80) is pulled in behind the site during this close-up only (desktop; M3 phones manage fog themselves).
// (3) key-light uniform follows the host sun direction. ?megacull / megaccull / megada / megad0 / megad1 / megafn / megaff / megafog=0 tune.
FA.PROLIB_MEGA.live=(o,site)=>{if(FA.PROLIB_MEGA._live||typeof ANIM==='undefined')return;FA.PROLIB_MEGA._live=1;
 const U=FA.PROLIB_MEGA.U,Q=new URLSearchParams(location.search),num=(k,d)=>{const v=parseFloat(Q.get(k));return isFinite(v)?v:d;};
 const R=(site.radius||11),FR=R*num('megacull',1.55),CR=num('megaccull',70),sx=site.x,sz=site.z,ZM=new THREE.Matrix4().makeScale(0,0,0),mt=new THREE.Matrix4();
 let perm=null,cl=null,clOn=false,fogS=null,k=0,chk=0;
 const collect=rad=>{const out=[];if(typeof IM==='undefined')return out;for(const[m,L]of IM){const idx=[];for(const p of L){if(p.sid)continue;if(Math.hypot(p.X-sx,p.Z-sz)<rad)idx.push(p.i);}if(idx.length)out.push([m,idx,null]);}return out;};
 const hide=S=>{for(const s of S){const[m,idx]=s;if(!s[2]){s[2]=new Float32Array(idx.length*16);idx.forEach((i,j)=>{m.getMatrixAt(i,mt);mt.toArray(s[2],j*16);});}for(const i of idx)m.setMatrixAt(i,ZM);m.instanceMatrix.needsUpdate=true;}};
 const show=S=>{for(const[m,idx,a]of S){if(!a)continue;idx.forEach((i,j)=>{mt.fromArray(a,j*16);m.setMatrixAt(i,mt);});m.instanceMatrix.needsUpdate=true;}};
 const zeroAt=s=>{s[0].getMatrixAt(s[1][0],mt);return mt.elements[0]===0&&mt.elements[5]===0;};
 ANIM.push(()=>{try{
  if(!perm){if(typeof IM==='undefined'||!IM.length)return;perm=collect(FR);hide(perm);FA.PROLIB_MEGA.culled=perm.reduce((a,s)=>a+s[1].length,0);}
  else if(++chk%90===0&&perm.length&&!zeroAt(perm[0])){for(const s of perm)s[2]=null;hide(perm);}   // placeProps() re-ran: re-hide
  const foc=typeof view!=='undefined'&&view!=='world'&&typeof focusO!=='undefined'&&!!focusO&&focusO.id==='libertarian';
  if(foc&&!clOn){if(!cl){cl=collect(CR).map(s=>{const pm=perm.find(q=>q[0]===s[0]);if(pm){const hs=new Set(pm[1]);s[1]=s[1].filter(i=>!hs.has(i));}return s;}).filter(s=>s[1].length);}hide(cl);clOn=true;FA.PROLIB_MEGA.cullC=cl.reduce((a,s)=>a+s[1].length,0);}
  else if(!foc&&clOn){show(cl);clOn=false;}
  // close-up depth gradient (site materials) + host fog pulled in behind the site (eased; restored exactly on leaving)
  const cd=typeof CAM!=='undefined'?Math.hypot(CAM.position.x-sx,CAM.position.y-(site.y||0),CAM.position.z-sz):100;
  const tA=foc?num('megada',.42):0;U.uDA.value+=(tA-U.uDA.value)*.12;U.uD0.value=cd-num('megad0',14);U.uD1.value=cd+num('megad1',48);
  const mob=window.M3&&M3.on;
  if(typeof SC!=='undefined'&&SC.fog&&!mob&&!/[?&]megafog=0/.test(location.search)){
   if(foc){if(!fogS)fogS=[SC.fog.near,SC.fog.far];k+=(1-k)*.1;}else if(fogS){k+=(0-k)*.14;if(k<.01){SC.fog.near=fogS[0];SC.fog.far=fogS[1];fogS=null;k=0;}}
   if(fogS){SC.fog.near=fogS[0]+(cd+num('megafn',22)-fogS[0])*k;SC.fog.far=fogS[1]+(cd+num('megaff',230)-fogS[1])*k;}}
  if(typeof sun!=='undefined'&&U.uKeyW&&U.uKeyW.value&&U.uKeyW.value.isVector3){U.uKeyW.value.copy(sun.position).sub(sun.target.position).normalize();}
 }catch(e){(window.__errs=window.__errs||[]).push('mega live: '+(e&&e.message));}});};
})();
