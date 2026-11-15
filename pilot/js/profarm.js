// Futures Atlas v4.5 PILOT - profarm.js : Checkpoint C2b. Procedural Reversion farmland (style=archviz only).
// Our own code, no external assets. Field patchwork in a rotated survey frame around the village: 5 field types
// (wheat, vegetables, fallow/ploughed, pasture, orchard) in close low-chroma tones with per-field variation; crop rows /
// furrows run along the terrain contour and are drawn per fragment (analytic stripes + bump, fwidth-faded at distance) on a
// mesh draped over the terrain; earthen balks between fields (terrain colour hook), hedgerows with hedge trees, dry-stone
// walls, an irrigation ditch fed from the river (sluice), footpaths with soft edges, hay ricks, orchard trees.
// Scale = Gatekeeper's: 1 unit ~ 10 m (GK cars are .42 u). Fields 35-70 m, hedges 2-2.5 m, walls ~1.3 m, paths ~1.4 m.
// Every family is ONE draw: fields 1, paths 1, ditch banks 1, ditch water 1, hedges 1, trees 1, stones 1, ricks 1, sluice (merged static).
(function(){
'use strict';
const FA=window.FA;if(!FA||!window.THREE)return;
const L=FA.LOOK;if(!L.archviz)return;
const SC=FA.SC,C=h=>new THREE.Color(h),TAU=Math.PI*2;
const PF=FA.PROFARM={on:false,info:{},fields:[],build,inField,hook};
const lin=h=>{const c=C(h);return 'vec3('+c.r.toFixed(4)+','+c.g.toFixed(4)+','+c.b.toFixed(4)+')';};
const TY=['wheat','veg','fallow','pasture','orchard'],PER=[.15,.30,.22,1.0,.85];
let ux=1,uz=0,wx=0,wz=1,ox=0,oz=0,rnd=null,O=null;const BALK=C('#4C5437'),DITCHC=C('#3E3A2C');
const toW=(u,w)=>[ox+ux*u+wx*w,oz+uz*u+wz*w];
const toL=(x,z)=>{const dx=x-ox,dz=z-oz;return[dx*ux+dz*uz,dx*wx+dz*wz];};
const segD=(x,z,a,b,c,d)=>{const ax=c-a,az=d-b,ll=ax*ax+az*az||1;let t=((x-a)*ax+(z-b)*az)/ll;t=Math.max(0,Math.min(1,t));return Math.hypot(x-a-ax*t,z-b-az*t);};
const polyD=(x,z,P)=>{let m=1e9;for(let i=0;i+1<P.length;i++)m=Math.min(m,segD(x,z,P[i][0],P[i][1],P[i+1][0],P[i+1][1]));return m;};
const H=(x,z)=>FA.H(x,z);
let DITCH=[],PATHS=[];

// ---------------- where farmland may go ----------------
function valid(x,z,clr){const vx=O.vx,vz=O.vz,RV=FA.RV;clr=clr||0;
 if(Math.hypot((x-vx)/1.25,z-vz)<7.5)return false;const dv=Math.hypot(x-vx,z-vz);if(dv>24.5)return false;
 const dr=Math.hypot(x-RV.x,z-RV.z);if(dr>22.6||(z<RV.z-12&&dr>12.6))return false;             // stay inside the scatter keep-out (no forest on fields)
 if(x>FA.riverX(z)-3.6)return false;if(Math.hypot(x-O.wmx,z-O.wmz)<4.6+clr)return false;
 for(const l of O.lanes){if(Math.hypot(l[2]-l[0],l[3]-l[1])>4&&segD(x,z,l[0],l[1],l[2],l[3])<.55+clr)return false;}
 if(polyD(x,z,O.road)<1.4+clr)return false;if(DITCH.length&&polyD(x,z,DITCH)<.45+clr)return false;
 if(FA.slope(x,z)>.42)return false;if(H(x,z)<FA.WL+.3)return false;return true;}
function rectOK(u0,u1,w0,w1){const N=4;for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){const p=toW(u0+(u1-u0)*i/N,w0+(w1-w0)*j/N);if(!valid(p[0],p[1]))return false;}return true;}

// ---------------- irrigation ditch: from a sluice on the river bank, west along the frame, then south ----------------
function ditch(){const zi=O.vz+12.5,xi=FA.riverX(zi)-(FA.riverW?FA.riverW(zi)*.5:1.2)+.15;const pts=[[xi,zi]];let x=xi,z=zi;
 const leg=(dx,dz,n,wob)=>{for(let k=1;k<=n;k++){const s=Math.sin(k*.7+wob)*.18;x+=dx*.6-dz*s*.3;z+=dz*.6+dx*s*.3;pts.push([x,z]);}};
 leg(-ux,-uz,16,0);leg(wx,wz,13,1.3);
 const out=[pts[0]];for(let i=1;i<pts.length;i++){const p=pts[i];if(polyD(p[0],p[1],O.road)<1.8||Math.hypot((p[0]-O.vx)/1.25,p[1]-O.vz)<8.6||Math.hypot(p[0]-O.wmx,p[1]-O.wmz)<5)break;out.push(p);}
 return out;}

// ---------------- field patchwork ----------------
function layout(){const F=[];let u=-26;const cols=[];while(u<26){const cw=4.0+rnd()*2.4;cols.push([u,u+cw]);u+=cw;}
 const cuts=[];
 cols.forEach((c,ci)=>{let w=-26-rnd()*3;const cl=[];while(w<26){const len=3.0+rnd()*3.2;cl.push([w,w+len]);w+=len;}cuts.push(cl);
  for(const s of cl){const bk=.15;const tryR=(u0,u1,w0,w1,depth)=>{if(u1-u0<1.9||w1-w0<1.9)return;
    if(rectOK(u0+bk,u1-bk,w0+bk,w1-bk)){F.push({u0:u0+bk,u1:u1-bk,w0:w0+bk,w1:w1-bk,col:ci});return;}
    if(depth>2)return;if(u1-u0>w1-w0){const m=(u0+u1)/2;tryR(u0,m,w0,w1,depth+1);tryR(m,u1,w0,w1,depth+1);}else{const m=(w0+w1)/2;tryR(u0,u1,w0,m,depth+1);tryR(u0,u1,m,w1,depth+1);}};
   tryR(c[0],c[1],s[0],s[1],0);}});
 // types: kitchen gardens + orchards near the village, grain / pasture / fallow further out, pasture on slopes
 for(const f of F){f.cu=(f.u0+f.u1)/2;f.cw=(f.w0+f.w1)/2;const p=toW(f.cu,f.cw);f.x=p[0];f.z=p[1];const dv=Math.hypot(p[0]-O.vx,p[1]-O.vz),h=rnd(),sl=FA.slope(p[0],p[1]);
  const W=dv<12.5?[.20,.33,.10,.17,.20]:[.36,.10,.18,.24,.12];let a=0,t=0;for(;t<5;t++){a+=W[t];if(h<a)break;}f.t=Math.min(4,t);if(sl>.26&&f.t!==4)f.t=3;
  f.seed=rnd();
  // rows follow the terrain contour where there is a slope, else the long axis of the field
  const e=.6,gx=H(p[0]+e,p[1])-H(p[0]-e,p[1]),gz=H(p[0],p[1]+e)-H(p[0],p[1]-e),gl=Math.hypot(gx,gz);
  let tx,tz;if(gl>.05){tx=-gz/gl;tz=gx/gl;}else if(f.u1-f.u0>f.w1-f.w0){tx=ux;tz=uz;}else{tx=wx;tz=wz;}
  if(gl<=.05&&rnd()<.3){const q=tx;tx=-tz;tz=q;}f.tx=tx;f.tz=tz;}
 return {F,cols,cuts};}

// ---------------- field shader (MeshStandard + per-fragment crop pattern) ----------------
const HEAD='varying vec3 vR;varying vec3 vTy;varying vec3 vWQ;\n'+
 'float pfH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
 'float pfV(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(pfH(i),pfH(i+vec2(1.,0.)),f.x),mix(pfH(i+vec2(0.,1.)),pfH(i+vec2(1.,1.)),f.x),f.y);}\n'+
 'vec3 pfN(vec3 sp,vec3 sn,vec2 dH){vec3 sx=dFdx(sp),sy=dFdy(sp);vec3 r1=cross(sy,sn),r2=cross(sn,sx);float det=dot(sx,r1);vec3 g=sign(det)*(dH.x*r1+dH.y*r2);return normalize(abs(det)*sn-g);}\n';
const BODY=[
 'float fT=floor(vTy.x+.5),sd=vTy.y,PP=vTy.z;vec2 wq=vWQ.xz;',
 'float n1=pfV(wq*.55+sd*17.),n2=pfV(wq*2.6+sd*7.),n3=pfV(wq*13.);float ss=vR.y,rr=vR.x,ee=vR.z;',
 'float aa=clamp(1.-fwidth(ss)/PP*1.6,0.,1.);float ph=fract(ss/PP);float rid=.5+.5*cos(6.2832*ss/PP);float fv=.90+.18*pfH(vec2(sd*3.1,1.7));',
 'vec3 col;float fH=0.;float fRo=.93;float hdK=.8;',
 // wheat: straw ochre, ripeness varies per field (some greener), fine drill rows
 'if(fT<.5){col=mix('+lin('#8A7A4F')+','+lin('#998958')+',n1);col=mix(col,'+lin('#7D7D52')+',smoothstep(.55,.95,sd)*.55);col*=mix(.92,.80+.26*rid,aa)*(.94+.1*n3);fH=rid*aa;fRo=.86;}',
 // vegetables: dark soil + planted rows broken into clumps, crop changes every 5 rows (3 greens)
 'else if(fT<1.5){float rw=floor(ss/PP);float inR=1.-smoothstep(.16,.27,abs(ph-.5));float cl=smoothstep(.30,.62,pfV(vec2(rr*4.2,rw*3.7)+sd*9.));float hc=pfH(vec2(floor(rw/5.),sd*11.));',
 ' vec3 cc=hc<.34?'+lin('#55663F')+':(hc<.67?'+lin('#5C6A55')+':'+lin('#677249')+');float pl=inR*mix(.55,1.,cl);vec3 so='+lin('#4A3E31')+'*(.88+.2*n2);',
 ' col=mix(mix(so,cc,.42),mix(so,cc*(.85+.3*n3),pl),aa);fH=pl*aa*1.4;fRo=.9;}',
 // fallow / ploughed: brown-grey furrows, older plots weedier
 'else if(fT<2.5){col=mix('+lin('#5A4C3C')+','+lin('#65563F')+',n1)*(.92+.14*n3);col=mix(col,'+lin('#5D6242')+',smoothstep(.6,1.,sd)*.5*n2);col*=mix(.89,.70+.36*rid,aa);fH=rid*aa*1.2;fRo=.96;}',
 // pasture: mottled grass, rush patches
 'else if(fT<3.5){col=mix('+lin('#55643E')+','+lin('#606F49')+',n1)*(.86+.22*n2)*(.95+.08*n3);col=mix(col,'+lin('#4A5539')+',smoothstep(.62,.8,pfV(wq*1.3+sd*5.))*.5);fH=n3*.25;hdK=.25;fRo=.95;}',
 // orchard: grass with lighter mown strips under the tree rows
 'else{float st=1.-smoothstep(.10,.22,abs(ph-.5));col=mix('+lin('#55643E')+','+lin('#606F49')+',n1*.6)*(.9+.16*n2);col=mix(col,'+lin('#6A7650')+'*(.9+.15*n3),st*.55);fH=st*.3;hdK=.35;fRo=.94;}',
 // headland: rows end in a grassy margin with a noisy edge (no hard cut), field-level tone variation
 'float hd=1.-smoothstep(.06,.55,ee+.12*(n2-.5));col=mix(col,'+lin('#59603F')+'*(.85+.25*n2),hd*hdK);fH*=1.-hd;col*=fv;',
 'diffuseColor.rgb=col;'].join('\n');
function fieldMat(){const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.92,metalness:0,envMapIntensity:.55,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aR;attribute vec3 aT;varying vec3 vR;varying vec3 vTy;varying vec3 vWQ;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvR=aR;vTy=aT;vWQ=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+HEAD).replace('#include <color_fragment>','#include <color_fragment>\n'+BODY)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=fRo;')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=pfN(-vViewPosition,normal,vec2(dFdx(fH),dFdy(fH))*.02);');};
 m.customProgramCacheKey=()=>'pfField';return m;}
function fieldMesh(F){const pos=[],aR=[],aT=[],idx=[];const st=.5;
 for(const f of F){const nu=Math.max(2,Math.ceil((f.u1-f.u0)/st)),nw=Math.max(2,Math.ceil((f.w1-f.w0)/st)),base=pos.length/3,nx=-f.tz,nz=f.tx;
  for(let j=0;j<=nw;j++)for(let i=0;i<=nu;i++){const u=f.u0+(f.u1-f.u0)*i/nu,w=f.w0+(f.w1-f.w0)*j/nw,p=toW(u,w),dx=p[0]-f.x,dz=p[1]-f.z;
   pos.push(p[0],H(p[0],p[1])+.05,p[1]);aR.push(dx*f.tx+dz*f.tz,dx*nx+dz*nz,Math.min(u-f.u0,f.u1-u,w-f.w0,f.w1-w));aT.push(f.t,f.seed,PER[f.t]);}
  for(let j=0;j<nw;j++)for(let i=0;i<nu;i++){const k=base+j*(nu+1)+i;idx.push(k,k+nu+1,k+1,k+1,k+nu+1,k+nu+2);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aR',new THREE.Float32BufferAttribute(aR,3));g.setAttribute('aT',new THREE.Float32BufferAttribute(aT,3));g.setIndex(idx);g.computeVertexNormals();
 const n=g.attributes.normal;for(let i=0;i<n.count;i++)if(n.getY(i)<0)n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i));
 const m=new THREE.Mesh(g,fieldMat());m.receiveShadow=true;m.castShadow=false;m.renderOrder=1;SC.add(m);return idx.length/3;}

// ---------------- instancing / ribbons ----------------
function mergeG(parts){const pos=[],nor=[],cc=[];for(const pr of parts){const g=pr[0].index?pr[0].toNonIndexed():pr[0],c=pr[1],p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n.getX(i),n.getY(i),n.getZ(i));cc.push(c[0],c[1],c[2]);}}
 const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));o.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));return o;}
const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),V=new THREE.Vector3(),S3=new THREE.Vector3(),CC=new THREE.Color();
function inst(geo,mat,list,cast){if(!list.length)return 0;const im=new THREE.InstancedMesh(geo,mat,list.length);
 list.forEach((s,i)=>{E.set(s[7]||0,s[6]||0,s[8]||0);Q.setFromEuler(E);M4.compose(V.set(s[0],s[1],s[2]),Q,S3.set(s[3],s[4],s[5]));im.setMatrixAt(i,M4);im.setColorAt(i,s[9]);});
 im.castShadow=!!cast;im.receiveShadow=true;geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(ox,0,oz),34);im.frustumCulled=true;SC.add(im); // farm-wide bound: culled in Gatekeeper views (main + shadow pass)
 return geo.index?geo.index.count/3*list.length:geo.attributes.position.count/3*list.length;}
// ribbon along a polyline: cross = [[offset, dy, r,g,b,a], ...]; y follows the terrain at each cross vertex
function ribbon(P,cross,yOff,step){const pts=[];for(let i=0;i+1<P.length;i++){const a=P[i],b=P[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(l/step));for(let k=0;k<n;k++)pts.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}
 pts.push(P[P.length-1]);const pos=[],col=[],idx=[];const NC=cross.length;
 pts.forEach((p,i)=>{const q=pts[Math.min(pts.length-1,i+1)],o=pts[Math.max(0,i-1)];let dx=q[0]-o[0],dz=q[1]-o[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;const nx=-dz,nz=dx;
  const vn=.92+.16*FA.hash(p[0]*3.1,p[1]*2.7);
  for(const c of cross){const x=p[0]+nx*c[0],z=p[1]+nz*c[0];pos.push(x,(yOff==null?H(x,z):yOff(p,x,z))+c[1],z);col.push(c[2]*vn,c[3]*vn,c[4]*vn,c[5]);}});
 for(let i=0;i+1<pts.length;i++)for(let k=0;k+1<NC;k++){const a=i*NC+k,b=a+NC;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
 const n=g.attributes.normal;for(let i=0;i<n.count;i++)if(n.getY(i)<0)n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i));return g;}
function mergeRibbons(gs){const pos=[],col=[],nor=[],idx=[];for(const g of gs){const b=pos.length/3;pos.push(...g.attributes.position.array);col.push(...g.attributes.color.array);nor.push(...g.attributes.normal.array);for(const i of g.index.array)idx.push(i+b);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setIndex(idx);return g;}
const rgb=(h,a)=>{const c=C(h);return[c.r,c.g,c.b,a==null?1:a];};

// ---------------- boundaries: hedgerows, dry-stone walls, paths ----------------
function nearLane(x,z,d){for(const l of O.lanes)if(Math.hypot(l[2]-l[0],l[3]-l[1])>4&&segD(x,z,l[0],l[1],l[2],l[3])<d)return true;return false;}
function besideField(u,w,du,dw){const a=toW(u+du,w+dw),b=toW(u-du,w-dw);return inField(a[0],a[1],.05)||inField(b[0],b[1],.05);}
function boundaries(lay){const HB=[],TR=[],ST=[],PL=[];const HG=['#33412F','#3A4833','#2F3D30','#414B35'],SC2=['#8A8577','#7E796C','#857E70'];
 const hedgeAt=(x,z,k)=>{const y=H(x,z);const c=CC.set(HG[(rnd()*4)|0]).multiplyScalar(.85+.3*rnd()).clone();const s=.13+.06*rnd();
  HB.push([x,y+s*.55,z,s*1.1,s*(1.1+.5*rnd()),s*1.1,rnd()*TAU,0,0,c]);HB.push([x+(rnd()-.5)*.12,y+s*1.5,z+(rnd()-.5)*.12,s*.8,s*.9,s*.8,rnd()*TAU,0,0,c.clone().multiplyScalar(1.08)]);
  if(rnd()<(k?.16:.10)){const ts=.42+.25*rnd();TR.push([x,y,z,ts,ts*(1.0+.3*rnd()),ts,rnd()*TAU,0,0,CC.set(HG[(rnd()*4)|0]).multiplyScalar(.9+.25*rnd()).clone()]);}};
 const wallAt=(x,z,ang)=>{const y=H(x,z);for(let c=0;c<3;c++){if(c===2&&rnd()<.35)continue;const k=c===2?.8:1;
  ST.push([x+(rnd()-.5)*.03,y+.035+c*.05,z+(rnd()-.5)*.03,(.085+rnd()*.035)*k,(.032+rnd()*.012)*k,(.06+rnd()*.02)*k,ang+(rnd()-.5)*.5,(rnd()-.5)*.3,(rnd()-.5)*.3,CC.set(SC2[(rnd()*3)|0]).multiplyScalar(.78+.3*rnd()).clone()]);}};
 const okB=(x,z)=>!nearLane(x,z,.7)&&!(DITCH.length&&polyD(x,z,DITCH)<.5)&&polyD(x,z,O.road)>1.5&&x<FA.riverX(z)-3.4&&Math.hypot((x-O.vx)/1.25,z-O.vz)>7.8;
 const angU=Math.atan2(-uz,ux),angW=Math.atan2(-wz,wx);let hedgeLen=0,wallLen=0;const pathLines=[];
 // column boundaries (long lines along w): 50 % hedgerow, 22 % wall, rest open balk (some carry a footpath)
 for(let i=1;i<lay.cols.length;i++){const ub=lay.cols[i][0],k=rnd(),kind=k<.5?'h':k<.72?'s':'n';const gate=-20+rnd()*40;let run=[];
  const step=kind==='h'?.30:kind==='s'?.19:.35;
  for(let w=-26;w<=26;w+=step){const p=toW(ub,w);const ok=besideField(ub,w,.45,0)&&okB(p[0],p[1])&&Math.abs(w-gate)>.7;
   if(kind==='n'){if(ok)run.push(p);else{if(run.length>6)pathLines.push(run);run=[];}continue;}
   if(!ok)continue;if(kind==='h'){hedgeAt(p[0],p[1],true);hedgeLen+=step;}else{wallAt(p[0],p[1],angW);wallLen+=step;}}
  if(run.length>6)pathLines.push(run);}
 // cut lines inside a column (short lines along u): 30 % wall, 15 % hedge
 lay.cuts.forEach((cl,ci)=>{const c=lay.cols[ci];for(let j=1;j<cl.length;j++){const wb=cl[j][0],k=rnd(),kind=k<.30?'s':k<.62?'h':'n';if(kind==='n')continue;const step=kind==='h'?.30:.19;
  for(let u=c[0]+.2;u<=c[1]-.2;u+=step){const p=toW(u,wb);if(!besideField(u,wb,0,.45)||!okB(p[0],p[1]))continue;if(kind==='h'){hedgeAt(p[0],p[1],false);hedgeLen+=step;}else{wallAt(p[0],p[1],angU);wallLen+=step;}}}});
 // footpaths: up to 3 open balks + the cart tracks (lanes) out to the bridge and the windmill
 pathLines.sort((a,b)=>b.length-a.length).slice(0,3).forEach(r=>PL.push({P:r,w:.07}));
 for(const l of O.lanes)if(Math.hypot(l[2]-l[0],l[3]-l[1])>4)PL.push({P:[[l[0],l[1]],[l[2],l[3]]],w:.15});
 return {HB,TR,ST,PL,hedgeLen:+hedgeLen.toFixed(1),wallLen:+wallLen.toFixed(1)};}

// ---------------- build ----------------
function build(opts){const t0=performance.now();O=opts;rnd=FA.rng(91);ox=O.vx;oz=O.vz;const ang=.32;ux=Math.cos(ang);uz=Math.sin(ang);wx=-uz;wz=ux;DITCH=[];
 DITCH=ditch();
 const lay=layout();PF.fields=lay.F;PF.on=true;let tris=fieldMesh(lay.F);
 const B=boundaries(lay);
 const hedgeM=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.92,flatShading:true,envMapIntensity:1.0});
 tris+=inst(new THREE.IcosahedronGeometry(1,0),hedgeM,B.HB,true);
 const stoneM=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.93,flatShading:true,envMapIntensity:.9});
 tris+=inst(new THREE.IcosahedronGeometry(1,0),stoneM,B.ST,false); // stones ~1.3 m: shadow pass not worth 20k tris
 // trees: hedgerow oaks + orchard rows (one merged crown+trunk geometry, instance colour)
 const cr=new THREE.IcosahedronGeometry(1,1);cr.scale(1,.85,1);cr.translate(0,1.25,0);const tk=new THREE.CylinderGeometry(.06,.09,.9,5);tk.translate(0,.45,0);
 const treeG=mergeG([[cr,[1,1,1]],[tk,[.42,.36,.30]]]);
 const OT=[],RK=[];for(const f of lay.F){const P=PER[f.t];
  if(f.t===4){const nx=-f.tz,nz=f.tx,R=Math.hypot(f.u1-f.u0,f.w1-f.w0)/2;for(let s=-R+P*.5;s<R;s+=P)for(let r=-R;r<R;r+=.78){const x=f.x+f.tx*r+nx*s,z=f.z+f.tz*r+nz*s;const lc=toL(x,z);
    const e=Math.min(lc[0]-f.u0,f.u1-lc[0],lc[1]-f.w0,f.w1-lc[1]);if(e<.35||rnd()<.06)continue;const sc=.17+.05*rnd();
    OT.push([x+(rnd()-.5)*.06,H(x,z),z+(rnd()-.5)*.06,sc,sc*(.9+.25*rnd()),sc,rnd()*TAU,0,0,CC.set(rnd()<.5?'#44553A':'#4C5B3C').multiplyScalar(.85+.3*rnd()).clone()]);}}
  if((f.t===3||f.t===0)&&rnd()<.35){const n=2+((rnd()*3)|0);for(let k=0;k<n;k++){const u=f.u0+.6+rnd()*(f.u1-f.u0-1.2),w=f.w0+.6+rnd()*(f.w1-f.w0-1.2),p=toW(u,w);
    RK.push([p[0],H(p[0],p[1])+.02,p[1],.15+.03*rnd(),.15+.04*rnd(),.15+.03*rnd(),rnd()*TAU,0,0,CC.set('#8C7A4C').multiplyScalar(.8+.25*rnd()).clone()]);}}}
 const treeM=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.9,flatShading:true,envMapIntensity:1.0});
 tris+=inst(treeG,treeM,B.TR.concat(OT),true);
 const rk1=new THREE.CylinderGeometry(1,1.05,1,9);rk1.translate(0,.5,0);const rk2=new THREE.ConeGeometry(1.02,.95,9);rk2.translate(0,1.45,0);
 tris+=inst(mergeG([[rk1,[1,1,1]],[rk2,[.92,.9,.86]]]),new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.95,flatShading:true,envMapIntensity:.8}),RK,true);
 // footpaths + cart tracks: soft-edged earth ribbons (vertex alpha), worn centre lighter
 const PA=[];for(const p of B.PL){const w=p.w;PA.push(ribbon(p.P,[[-w*1.9,0,...rgb('#5E5644',0)],[-w,0,...rgb('#6A5E4B',.9)],[0,0,...rgb('#75684F',1)],[w,0,...rgb('#6A5E4B',.9)],[w*1.9,0,...rgb('#5E5644',0)]],(c,x,z)=>H(x,z)+.06,.35));}
 if(PA.length){const pm=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,transparent:true,depthWrite:false,roughness:.95,envMapIntensity:.5,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});
  const m=new THREE.Mesh(mergeRibbons(PA),pm);m.receiveShadow=true;m.renderOrder=2;SC.add(m);tris+=m.geometry.index.count/3;}
 // irrigation ditch: earthen banks (raised lips, wet inner faces) + a level water strip, sluice gate at the river
 let dl=0;if(DITCH.length>2){for(let i=0;i+1<DITCH.length;i++)dl+=Math.hypot(DITCH[i+1][0]-DITCH[i][0],DITCH[i+1][1]-DITCH[i][1]);
  const yC=(c,x,z)=>H(c[0],c[1]);
  const bk=ribbon(DITCH,[[-.36,0,...rgb('#4C5437')],[-.22,.05,...rgb('#544C3A')],[-.12,-.02,...rgb('#2E2A24')],[.12,-.02,...rgb('#2E2A24')],[.22,.05,...rgb('#544C3A')],[.36,0,...rgb('#4C5437')]],
   (c,x,z)=>Math.max(H(x,z),H(c[0],c[1])-.02),.3);
  const bm=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.95,envMapIntensity:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  const bmesh=new THREE.Mesh(bk,bm);bmesh.receiveShadow=true;SC.add(bmesh);tris+=bk.index.count/3;
  const wa=ribbon(DITCH,[[-.13,0,...rgb('#ffffff')],[.13,0,...rgb('#ffffff')]],(c)=>H(c[0],c[1])+.035,.3);
  const wn=FA.noiseNormal?FA.noiseNormal(64,1.6,41):null;
  const wmat=new THREE.MeshStandardMaterial({color:'#142238',roughness:.08,metalness:.55,envMapIntensity:1.4,emissive:C('#1C2846'),emissiveIntensity:.6,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});
  if(wn){wn.repeat.set(8,8);wmat.normalMap=wn;wmat.normalScale=new THREE.Vector2(.08,.08);}
  const wm=new THREE.Mesh(wa,wmat);wm.receiveShadow=true;wm.renderOrder=2;SC.add(wm);tris+=wa.index.count/3;
  const wood=new THREE.MeshStandardMaterial({color:'#5A4632',roughness:.9});const p0=DITCH[0],p1=DITCH[1],da=Math.atan2(-(p1[1]-p0[1]),p1[0]-p0[0]),yb=H(p0[0],p0[1]);
  const nx=-(p1[1]-p0[1]),nz=p1[0]-p0[0],nl=Math.hypot(nx,nz)||1;
  for(const s of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(.05,.26,.05),wood);m.position.set(p0[0]+nx/nl*.17*s,yb+.1,p0[1]+nz/nl*.17*s);m.castShadow=m.receiveShadow=true;FA.addStatic(m);}
  const bd=new THREE.Mesh(new THREE.BoxGeometry(.04,.12,.36),wood);bd.position.set(p0[0],yb+.1,p0[1]);bd.rotation.y=da;bd.castShadow=bd.receiveShadow=true;FA.addStatic(bd);}
 const by=[0,0,0,0,0];for(const f of lay.F)by[f.t]++;
 PF.info={fields:lay.F.length,types:Object.fromEntries(TY.map((t,i)=>[t,by[i]])),hedgeBlobs:B.HB.length,hedgeLen:B.hedgeLen,trees:B.TR.length,orchardTrees:OT.length,stones:B.ST.length,wallLen:B.wallLen,
  ricks:RK.length,paths:B.PL.length,ditchLen:+dl.toFixed(1),tris:Math.round(tris),ms:Math.round(performance.now()-t0)};
 return PF.info;}
// point inside any field (margin m)
function inField(x,z,m){if(!PF.on)return false;m=m||0;const l=toL(x,z);for(const f of PF.fields)if(l[0]>f.u0-m&&l[0]<f.u1+m&&l[1]>f.w0-m&&l[1]<f.w1+m)return true;return false;}
// terrain colour hook: earthen-grass balks under/between fields, earth along the ditch
function hook(x,z,c){if(!PF.on)return false;if(DITCH.length&&polyD(x,z,DITCH)<.6){c.lerp(DITCHC,.6);return true;}if(inField(x,z,.9)){c.lerp(BALK,.72);return true;}return false;}
})();
