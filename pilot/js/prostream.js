// Futures Atlas v4.5 PILOT - prostream.js : Checkpoint C7. Reversion watercourses (style=archviz only). Our own code.
// Replaces profarm's straight two-leg irrigation ditch (an extruded gutter sitting ON the terrain) with:
//  1. a meandering brook taken off the river just below the water wheel, looping west / south-west through the farmland
//     (contour-following water level, width 0.6-1.4x along its course) and rejoining the river downstream;
//  2. a mill race in the river margin: a dry-stone training wall from an intake upstream guides water into the wheel flume.
// The brook is INCISED: FA.H gets a carve hook (trench under the bank mesh, so the 1.1-u facet grid never shapes the channel),
// and a fine bank ribbon (mud -> wet mud -> silt bed, feathered grass rims) carries the visible profile. Water ribbon: river
// blue-hour palette, dark centre -> lighter edges, scrolling flow ripples (moving element only while on screen, FA.mover).
// Banks: reeds (1 instanced draw), stones (1), grass tufts via proflora. Lanes cross on small plank bridges (merged static).
// API: FA.PROSTREAM.plan(PKV) right after FA.PROROAD.plan (installs FA.carveH before any terrain grid exists), then build();
//      dist(x,z) = distance to the brook's water edge (fields / hedges / scatter keep clear), info = counts / tris / ms.
(function(){
'use strict';
const FA=window.FA;if(!FA||!window.THREE)return;
const L=FA.LOOK;if(!L.archviz)return;
const C=h=>new THREE.Color(h),TAU=Math.PI*2,SC=FA.SC;
const ST=FA.PROSTREAM={on:false,info:{},plan,build,dist};
const DAY=!!(L.pc&&L.pc.mood==='day');
const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const BK=.8;            // bank width (water edge -> bank top)
let P=[],GRID=null,BB=null,CS=1.5,RACE=[],S=null,rnd=null;

// ---------------- geometry helpers ----------------
function cr(ctrl,step){const out=[];const n=ctrl.length;for(let i=0;i<n-1;i++){const p0=ctrl[Math.max(0,i-1)],p1=ctrl[i],p2=ctrl[i+1],p3=ctrl[Math.min(n-1,i+2)];
  const l=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),k=Math.max(2,Math.ceil(l/step));
  for(let j=0;j<k;j++){const t=j/k,t2=t*t,t3=t2*t;const f=(a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);out.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
 out.push(ctrl[n-1].slice());return out;}
function resample(Q,step){let tot=0;const cum=[0];for(let i=1;i<Q.length;i++){tot+=Math.hypot(Q[i][0]-Q[i-1][0],Q[i][1]-Q[i-1][1]);cum.push(tot);}
 const n=Math.max(2,Math.round(tot/step)),out=[];let j=0;for(let k=0;k<=n;k++){const s=tot*k/n;while(j<Q.length-2&&cum[j+1]<s)j++;const t=(s-cum[j])/Math.max(1e-6,cum[j+1]-cum[j]);out.push([lerp(Q[j][0],Q[j+1][0],t),lerp(Q[j][1],Q[j+1][1],t)]);}return out;}
function nrm(Q,i){const a=Q[Math.max(0,i-1)],b=Q[Math.min(Q.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;return[-dz/l,dx/l];}
function edgeX(z,inset){return FA.riverX(z)-(FA.riverE(z)-(inset||0));}

// ---------------- spatial grid for the carve / distance queries ----------------
function buildGrid(){GRID=new Map();BB=[1e9,1e9,-1e9,-1e9];const R=.45+BK+.9;
 for(let i=0;i+1<P.length;i++){const a=P[i],b=P[i+1];const x0=Math.min(a.x,b.x)-R,x1=Math.max(a.x,b.x)+R,z0=Math.min(a.z,b.z)-R,z1=Math.max(a.z,b.z)+R;
  BB=[Math.min(BB[0],x0),Math.min(BB[1],z0),Math.max(BB[2],x1),Math.max(BB[3],z1)];
  for(let gx=Math.floor(x0/CS);gx<=Math.floor(x1/CS);gx++)for(let gz=Math.floor(z0/CS);gz<=Math.floor(z1/CS);gz++){const k=gx*4096+gz;let l=GRID.get(k);if(!l)GRID.set(k,l=[]);l.push(i);}}}
// nearest point on the brook centreline: {d, i, t} (segment index + fraction) or null when far
function near(x,z){if(!GRID||x<BB[0]||x>BB[2]||z<BB[1]||z>BB[3])return null;const l=GRID.get(Math.floor(x/CS)*4096+Math.floor(z/CS));if(!l)return null;
 let bd=1e9,bi=-1,bt=0;for(const i of l){const a=P[i],b=P[i+1],ax=b.x-a.x,az=b.z-a.z,ll=ax*ax+az*az||1;let t=((x-a.x)*ax+(z-a.z)*az)/ll;t=Math.max(0,Math.min(1,t));
  const d=Math.hypot(x-a.x-ax*t,z-a.z-az*t);if(d<bd){bd=d;bi=i;bt=t;}}
 return bi<0?null:{d:bd,i:bi,t:bt};}
const at=(q,k)=>lerp(P[q.i][k],P[q.i+1][k],q.t);
function dist(x,z){const q=near(x,z);if(!q)return 1e9;return q.d-at(q,'w');}
// terrain carve (FA.H hook): flat trench below the bank ribbon, smooth return to the natural ground beyond the bank top
function carve(x,z,h){const q=near(x,z);if(!q)return h;const w=at(q,'w'),R1=w+BK+.55;if(q.d>R1)return h;
 const bed=at(q,'y')-at(q,'dep')-.12,R0=w+.32;const y=q.d<R0?bed:lerp(bed,h,sm(R0,R1,q.d));return Math.min(h,y);}

// ---------------- plan: routes, widths, water level ----------------
function plan(pkv){const t0=performance.now();S=pkv;rnd=FA.rng(6151);const W=pkv.wheel,vx=pkv.vx,vz=pkv.vz,H0=FA.H;
 const za=W.z+7.2,zb=W.z+20.6;
 const ctrl=[[edgeX(za,.55),za],[edgeX(za,-.6),za+.35],[vx+3.6,vz+10.4],[vx+.8,vz+9.8],[vx-2,vz+9.3],[vx-4.8,vz+9.7],[vx-7.4,vz+10.8],[vx-9.5,vz+12.8],
  [vx-10.4,vz+15.6],[vx-9.2,vz+18.3],[vx-6.3,vz+19.9],[vx-2.6,vz+20.7],[vx+1.4,vz+21.8],[vx+5.2,vz+22.6],[edgeX(zb,-.6),zb-.3],[edgeX(zb,.55),zb]];
 let Q=resample(cr(ctrl,.3),.25);
 // meander: perpendicular fbm offset, zero at both river mouths
 let s=0;const N0=Q.length,tot=(N0-1)*.25;Q=Q.map((p,i)=>{if(i)s+=.25;const env=Math.min(1,s/3.2,(tot-s)/3.2),n=nrm(Q,i);const o=.55*env*(FA.fbm(s*.21+3.7,1.9,2)-.5)*2.4;return[p[0]+n[0]*o,p[1]+n[1]*o];});
 // keep clear of cottages / barn / mill (keepOut) with room for the banks, then relax
 const ko=pkv.keepOut;for(let it=0;it<6;it++){Q=Q.map((p,i)=>{if(i<6||i>Q.length-7)return p;let x=p[0],z=p[1];
   for(const k of ko){const dx=x-k.x,dz=z-k.z,d=Math.hypot(dx,dz)||1e-3,m=k.r+1.95;if(d<m){x=k.x+dx/d*m;z=k.z+dz/d*m;}}return[x,z];});
  for(let r=0;r<2;r++)Q=Q.map((p,i)=>(i<2||i>Q.length-3)?p:[(Q[i-1][0]+2*p[0]+Q[i+1][0])/4,(Q[i-1][1]+2*p[1]+Q[i+1][1])/4]);}
 Q=resample(Q,.2);
 // attributes along s: half width (0.6-1.4 x .27, wider mouths), natural ground, water level (smoothed ground - .2, never below WL), depth
 P=[];s=0;const WL=FA.WL;for(let i=0;i<Q.length;i++){if(i)s+=Math.hypot(Q[i][0]-Q[i-1][0],Q[i][1]-Q[i-1][1]);const x=Q[i][0],z=Q[i][1],n=nrm(Q,i);
  const k=Math.min(1.4,Math.max(.6,1+.55*(FA.fbm(s*.16+11.3,4.1,2)-.5)*2.6));const mouth=1-Math.min(1,s/2.2,(tot-s)/2.2);
  const w=.27*k*(1+.35*mouth);const gw=Math.min(H0(x,z),H0(x+n[0]*(w+.35),z+n[1]*(w+.35)),H0(x-n[0]*(w+.35),z-n[1]*(w+.35)));
  P.push({x,z,s,w,g:gw,n,dep:.12+.07*FA.fbm(s*.3+2.2,.7,2)});}
 const len=s;for(let i=0;i<P.length;i++){let a=0,c=0;for(let j=Math.max(0,i-7);j<=Math.min(P.length-1,i+7);j++){a+=P[j].g;c++;}P[i].y=Math.max(WL+.005,Math.min(P[i].g-.17,a/c-.21));}
 for(let r=0;r<3;r++)for(let i=1;i<P.length-1;i++)P[i].y=(P[i-1].y+2*P[i].y+P[i+1].y)/4;
 P[0].y=P[P.length-1].y=WL+.005;
 buildGrid();FA.carveH=carve;ST.on=true;
 // mill race: water from an intake upstream, guided along the bank by a dry-stone training wall into the wheel flume
 const zr0=W.z-7.8,zr1=W.z-1.75;RACE=[];for(let k=0;k<=24;k++){const t=k/24,z=lerp(zr0,zr1,t),e=sm(0,1,t);RACE.push([lerp(edgeX(z,.55),W.x,e),z]);}
 ST.info={len:+len.toFixed(1),pts:P.length,wMin:+Math.min(...P.map(p=>p.w)).toFixed(2),wMax:+Math.max(...P.map(p=>p.w)).toFixed(2),planMs:Math.round(performance.now()-t0)};
 return ST.info;}

// ---------------- meshes ----------------
const rgbA=(h,a)=>{const c=C(h);return[c.r,c.g,c.b,a];};
function faceUp(pos,idx){for(let t=0;t<idx.length;t+=3){const A=idx[t]*3,B=idx[t+1]*3,Cc=idx[t+2]*3;const cy=(pos[Cc]-pos[A])*(pos[B+2]-pos[A+2])-(pos[Cc+2]-pos[A+2])*(pos[B]-pos[A]);if(cy<0){const q=idx[t+1];idx[t+1]=idx[t+2];idx[t+2]=q;}}}
function fixN(g){g.computeVertexNormals();const n=g.attributes.normal;for(let i=0;i<n.count;i++)if(n.getY(i)<0)n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i));}
function riverFade(x,z){return sm(-.1,.9,FA.riverD(x,z)-FA.riverE(z));}
// natural (uncarved) ground: the bank ribbon carries the visible profile above the deliberately deeper trench
function H0(x,z){const c=FA.carveH;FA.carveH=null;const h=FA.H(x,z);FA.carveH=c;return h;}
// bank surface height at offset u beyond the water edge (u <= 0: waterline)
function bankY(p,u,x,z){return u<=0?p.y+.03:lerp(p.y+.03,Math.max(H0(x,z),p.y+.03)+.01,sm(0,BK,u));}
function build(){if(!ST.on)return null;const t0=performance.now();let tris=0,draws=0;const Hm=(x,z)=>FA.Hm(x,z),H=H0,WL=FA.WL,P2=L.ter.P;
 // bank ribbon: profile from the silt bed through wet mud to the grass rim; outer rim follows the facet terrain, feathered out
 const grass=C(P2.lo).lerp(C(P2.mid),.55).multiplyScalar(DAY?.95:.9),G=[grass.r,grass.g,grass.b];
 const CL=DAY?{mud:'#5A4E3C',wet:'#3E362C',silt:'#4A5450',bed:'#3A4442'}:{mud:'#171822',wet:'#0E0F17',silt:'#121729',bed:'#0C1122'};
 const X=[[-1,0],[-.55,1],[-0,2],[.18,3],[.55,4],[BK,5],[BK+.42,6],[BK+.95,7]]; // [offset beyond the water edge (neg = under water, x w), slot]
 const cols=[rgbA(CL.bed,1),rgbA(CL.silt,1),rgbA(CL.wet,1),rgbA(CL.mud,1),[...C(CL.mud).lerp(grass,.55).toArray(),1],[...G,1],[...G,.75],[...G,0]];
 const pos=[],col=[],idx=[];const NC=X.length*2;
 for(const p of P){const fd=1;for(const sd of[-1,1])for(let c=0;c<X.length;c++){const k=sd<0?X.length-1-c:c,o=X[k][0];
   const r=o<=0?p.w*(1+o):p.w+o;const x=p.x+p.n[0]*r*sd,z=p.z+p.n[1]*r*sd;let y;
   if(o<=0){const u=1+o;y=p.y-p.dep+(p.dep+.03)*u*u;}
   else if(o<=BK)y=bankY(p,o,x,z);
   else y=Math.max(Hm(x,z),H(x,z))+.014;
   pos.push(x,y,z);col.push(...cols[k].slice(0,3).map(v=>v*(.94+.12*FA.hash(x*2.3,z*1.7))),cols[k][3]);}}
 for(let i=0;i+1<P.length;i++)for(let k=0;k+1<NC;k++){if(k===X.length-1)continue;const a=i*NC+k,b=a+NC;idx.push(a,b,a+1,a+1,b,b+1);} // slot 7|8 = both halves' centre (same point)
 faceUp(pos,idx);let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);fixN(g);
 const bm=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,transparent:true,roughness:.93,metalness:0,envMapIntensity:L.envTer!=null?L.envTer:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
 const bank=new THREE.Mesh(g,bm);bank.name='st_bank';bank.receiveShadow=true;bank.renderOrder=1;SC.add(bank);tris+=idx.length/3;draws++;
 // water ribbon: aW = -1..1 across, aS = arclength (flow), aF = fade into the river at both mouths
 const wp=[],wa=[],ws=[],wf=[],wu=[],wi=[];const WX=[-1.04,-.5,0,.5,1.04];
 for(const p of P){for(const e of WX){const x=p.x+p.n[0]*p.w*e,z=p.z+p.n[1]*p.w*e;wp.push(x,p.y+.004,z);wa.push(e);ws.push(p.s);wf.push(riverFade(x,z));wu.push(p.s*.45,e*.35);}}
 for(let i=0;i+1<P.length;i++)for(let k=0;k<WX.length-1;k++){const a=i*WX.length+k,b=a+WX.length;wi.push(a,b,a+1,a+1,b,b+1);}
 faceUp(wp,wi);const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));wg.setAttribute('aW',new THREE.Float32BufferAttribute(wa,1));
 wg.setAttribute('aS',new THREE.Float32BufferAttribute(ws,1));wg.setAttribute('aF',new THREE.Float32BufferAttribute(wf,1));wg.setAttribute('uv',new THREE.Float32BufferAttribute(wu,2));wg.setIndex(wi);fixN(wg);
 const Wt=L.water,wn=FA.noiseNormal(64,1.7,57);wn.wrapS=wn.wrapT=THREE.RepeatWrapping;
 const wm=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:Math.min(.3,Wt.r||.2),metalness:0,normalMap:wn,normalScale:new THREE.Vector2(.22,.22),envMapIntensity:Wt.env!=null?Wt.env:.6,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});
 const v3=h=>{const q=C(h);return 'vec3('+q.r.toFixed(4)+','+q.g.toFixed(4)+','+q.b.toFixed(4)+')';};
 wm.onBeforeCompile=sh=>{sh.uniforms.uT=FA.TU.uT;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aW,aS,aF;varying float vW,vS,vF;').replace('#include <begin_vertex>','#include <begin_vertex>\nvW=aW;vS=aS;vF=aF;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT;varying float vW,vS,vF;float sH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float sN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sH(i),sH(i+vec2(1,0)),f.x),mix(sH(i+vec2(0,1)),sH(i+vec2(1,1)),f.x),f.y);}')
   .replace('#include <color_fragment>','{float e=abs(vW),c=1.-e*e;float st=sN(vec2(vS*1.3-uT*.42,vW*2.6+3.));diffuseColor.rgb=mix('+v3(Wt.sh)+','+v3(Wt.dp)+',smoothstep(.05,.9,c)*.92)*(1.+.14*(st-.5));'+
    'diffuseColor.a=mix(.66,.92,c)*(1.-smoothstep(.84,1.02,e))*vF;}')
   .replace('#include <output_fragment>','{float e=abs(vW),c=1.-e*e;outgoingLight*=1.-.34*smoothstep(.25,1.,c);float f=(1.-smoothstep(0.,.07,abs(e-.8)))*smoothstep(.5,.7,sN(vec2(vS*2.2-uT*.6,vW*4.)))*.30;outgoingLight=mix(outgoingLight,'+v3(Wt.foam||'#6E78A8')+'*.55,f);}\n#include <output_fragment>');};
 wm.customProgramCacheKey=()=>'stW';
 const water=new THREE.Mesh(wg,wm);water.name='st_water';water.renderOrder=3;water.receiveShadow=true;SC.add(water);tris+=wi.length/3;draws++;
 FA.anims.push(T=>{wn.offset.set(-T*.07,Math.sin(T*.2)*.02);});
 // movers: the flow ripples count as a moving element only while this stretch is on screen
 if(FA.mover)for(const f of[.15,.4,.65,.9]){const p=P[Math.floor(f*(P.length-1))];FA.mover({x:p.x,y:p.y,z:p.z,r:2.2,n:'stream'});}
 // ---- banks: reeds, stones, grass; race wall; plank bridges; intake sluice
 const BR=bridges();
 const nearBridge=(x,z)=>BR.some(b=>Math.hypot(x-b.x,z-b.z)<1.5);
 const RE=[],SN=[];
 for(let i=2;i<P.length-2;i++){const p=P[i];for(const sd of[-1,1]){const x0=p.x+p.n[0]*p.w*sd,z0=p.z+p.n[1]*p.w*sd;if(nearBridge(x0,z0)||FA.riverD(x0,z0)<FA.riverE(z0)+.4)continue;
   const r=rnd();if(r<.34){const o=p.w+(rnd()-.35)*.16,x=p.x+p.n[0]*o*sd,z=p.z+p.n[1]*o*sd;const y=Math.min(p.y+.01,bankY(p,o-p.w,x,z)-.01);RE.push([x,y,z,.85+.5*rnd(),rnd()*TAU]);}
   if(r>.86){const o=p.w+.04+rnd()*.32,x=p.x+p.n[0]*o*sd,z=p.z+p.n[1]*o*sd;SN.push([x,bankY(p,o-p.w,x,z),z,.025+.035*rnd()]);}
   if(FA.PROFLORA&&FA.PROFLORA.on&&rnd()<.55){const o=p.w+BK+.38+rnd()*.5,x=p.x+p.n[0]*o*sd,z=p.z+p.n[1]*o*sd;FA.PROFLORA.add('tuft',x,null,z,.5+.3*rnd(),null,rnd()*TAU,null);}}}
 // race training wall: two courses of stones just above / below the waterline, on the river side of the race
 for(let k=0;k+1<RACE.length;k++){const a=RACE[k],b=RACE[k+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=(b[1]-a[1])/l,nz=-(b[0]-a[0])/l;const m=Math.max(1,Math.round(l/.11));
  for(let j=0;j<m;j++){const t=j/m,x=lerp(a[0],b[0],t)+nx*.42,z=lerp(a[1],b[1],t)+nz*.42;SN.push([x,WL-.04,z,.05+.02*rnd()]);if(rnd()<.8)SN.push([x+(rnd()-.5)*.04,WL+.03,z+(rnd()-.5)*.04,.04+.015*rnd()]);}}
 const reedG=reedGeo(),reedM=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.85,metalness:0,side:THREE.DoubleSide,envMapIntensity:.7,vertexColors:true});
 const RC=DAY?['#7A7A50','#6E7448','#857E58']:['#2C3828','#33402C','#28342A'];
 const M4=new THREE.Matrix4(),Qt=new THREE.Quaternion(),V=new THREE.Vector3(),S3=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0),cc=new THREE.Color();
 const bs=new THREE.Sphere(new THREE.Vector3((BB[0]+BB[2])/2,1,(BB[1]+BB[3])/2),Math.hypot(BB[2]-BB[0],BB[3]-BB[1])/2+6);
 const closeOnly=FA.closeOnly=FA.closeOnly||[];
 if(RE.length){const im=new THREE.InstancedMesh(reedG,reedM,RE.length);RE.forEach((r,i)=>{Qt.setFromAxisAngle(Y,r[4]);M4.compose(V.set(r[0],r[1],r[2]),Qt,S3.set(r[3],r[3]*(.8+.4*FA.hash(i,.3)),r[3]));im.setMatrixAt(i,M4);im.setColorAt(i,cc.set(RC[i%3]).multiplyScalar(.85+.3*FA.hash(i,1.7)));});
  reedG.boundingSphere=bs;im.frustumCulled=true;im.name='st_reeds';im.receiveShadow=true;SC.add(im);closeOnly.push(im);im.visible=FA.VIEW==='close';tris+=reedG.index.count/3*RE.length;draws++;}
 if(SN.length){const sg=new THREE.IcosahedronGeometry(1,0);const sm2=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.92,flatShading:true,envMapIntensity:.8});const im=new THREE.InstancedMesh(sg,sm2,SN.length);
  const SCL=DAY?['#8A8577','#7E796C','#857E70']:['#4A4C5C','#44465A','#505262'];
  SN.forEach((r,i)=>{Qt.setFromAxisAngle(Y,FA.hash(i,4.4)*TAU);M4.compose(V.set(r[0],r[1],r[2]),Qt,S3.set(r[3]*1.3,r[3]*.7,r[3]));im.setMatrixAt(i,M4);im.setColorAt(i,cc.set(SCL[i%3]).multiplyScalar(.8+.35*FA.hash(i,2.9)));});
  sg.boundingSphere=new THREE.Sphere(new THREE.Vector3(S.wheel.x,1,(BB[1]+S.wheel.z)/2),40);im.frustumCulled=true;im.name='st_stones';im.receiveShadow=true;SC.add(im);closeOnly.push(im);im.visible=FA.VIEW==='close';tris+=20*SN.length;draws++;}
 // intake sluice (brook): two posts + a raised board at the river end
 {const wood=new THREE.MeshStandardMaterial({color:DAY?'#6A5038':'#3E3226',roughness:.9});const p0=P[3],p1=P[4],ang=Math.atan2(-(p1.z-p0.z),p1.x-p0.x);
  for(const sd of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(.05,.34,.05),wood);m.position.set(p0.x+p0.n[0]*(p0.w+.05)*sd,p0.y+.1,p0.z+p0.n[1]*(p0.w+.05)*sd);m.castShadow=m.receiveShadow=true;FA.addStatic(m);}
  const bd=new THREE.Mesh(new THREE.BoxGeometry(.035,.1,p0.w*2+.12),wood);bd.position.set(p0.x,p0.y+.2,p0.z);bd.rotation.y=ang;bd.castShadow=bd.receiveShadow=true;FA.addStatic(bd);}
 ST.info=Object.assign(ST.info,{bridges:BR.length,reeds:RE.length,stones:SN.length,draws,tris:Math.round(tris),ms:Math.round(performance.now()-t0)});
 return ST.info;}
// 6 tapered blades leaning out (12 tris), unit height ~.2
function reedGeo(){const pos=[],col=[],idx=[];for(let b=0;b<6;b++){const a=b/6*TAU+.4*Math.sin(b*2.1),lean=.05+.05*((b*7)%3)/2,h=.15+.07*((b*5)%4)/3,w=.011;
  const ca=Math.cos(a),sa=Math.sin(a),bx=ca*.018,bz=sa*.018,tx=ca*lean,tz=sa*lean;const px=-sa*w,pz=ca*w;const o=pos.length/3;
  pos.push(bx-px,0,bz-pz,bx+px,0,bz+pz,tx,h,tz);col.push(.55,.55,.55,.62,.62,.62,1.08,1.08,1.08);idx.push(o,o+1,o+2);
  // second half-blade (wider look from the side)
  pos.push(bx-pz,0,bz+px,bx+pz,0,bz-px,tx*.8,h*.86,tz*.8);col.push(.55,.55,.55,.62,.62,.62,1.0,1.0,1.0);idx.push(o+3,o+4,o+5);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
// plank bridges where a lane (w >= .2) crosses the brook
function bridges(){const out=[];if(!FA.PROROAD||!FA.PROROAD.polys)return out;const wood=new THREE.MeshStandardMaterial({color:DAY?'#6E5438':'#43362A',roughness:.88}),stone=new THREE.MeshStandardMaterial({color:DAY?'#86827A':'#484A58',roughness:.95,flatShading:true});
 const X=(a,b,c,d)=>{const r=(b[0]-a[0])*(d[1]-c[1])-(b[1]-a[1])*(d[0]-c[0]);if(Math.abs(r)<1e-9)return null;const t=((c[0]-a[0])*(d[1]-c[1])-(c[1]-a[1])*(d[0]-c[0]))/r,u=((c[0]-a[0])*(b[1]-a[1])-(c[1]-a[1])*(b[0]-a[0]))/r;return(t>=0&&t<=1&&u>=0&&u<=1)?t:null;};
 for(const ln of FA.PROROAD.polys){if(ln.w<.2)continue;for(let i=0;i+1<ln.P.length;i++){const a=ln.P[i],b=ln.P[i+1];
   for(let j=0;j+1<P.length;j++){const c=[P[j].x,P[j].z],d=[P[j+1].x,P[j+1].z];const t=X(a,b,c,d);if(t==null)continue;
    const x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t);if(out.some(o=>Math.hypot(o.x-x,o.z-z)<2))continue;const p=P[j],L2=p.w+.55;
    const y=Math.max(H0(x+p.n[0]*L2,z+p.n[1]*L2),H0(x-p.n[0]*L2,z-p.n[1]*L2),p.y+.12)+.03,ang=Math.atan2(-p.n[1],p.n[0]),bw=ln.w*2+.1;
    const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ang;
    for(let k=0;k<7;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(L2*2+.1,.03,bw/7*.86),wood);m.position.set(0,0,-bw/2+bw/7*(k+.5));g.add(m);}
    for(const sd of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(L2*2+.1,.035,.035),wood);r.position.set(0,-.035,sd*(bw/2-.02));g.add(r);
     const ab=new THREE.Mesh(new THREE.BoxGeometry(.22,.2,bw+.08),stone);ab.position.set(sd*(L2+.02),-.12,0);g.add(ab);}
    g.updateMatrixWorld(true);g.children.forEach(m=>{m.matrix.copy(m.matrixWorld);m.matrix.decompose(m.position,m.quaternion,m.scale);m.castShadow=m.receiveShadow=true;FA.addStatic(m);});
    out.push({x,z,y});}}}
 return out;}
})();
