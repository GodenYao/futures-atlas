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
const Hm=(x,z)=>FA.Hm?FA.Hm(x,z):FA.H(x,z); // C6: exact facet-terrain height (what the eye sees)
const HK=1.35; // C6: hedge height factor (proflora hedge height = 2*sy*HK): ~25-45 % of the cottage height, clearly above the dry-stone walls
let DITCH=[],PATHS=[];
const STR=()=>!!(FA.PROSTREAM&&FA.PROSTREAM.on); // C7: prostream brook replaces the straight ditch (keep-outs below)

// ---------------- where farmland may go ----------------
function valid(x,z,clr){const vx=O.vx,vz=O.vz,RV=FA.RV;clr=clr||0;
 if(Math.hypot((x-vx)/1.25,z-vz)<7.5)return false;const dv=Math.hypot(x-vx,z-vz);if(dv>24.5)return false;
 const dr=Math.hypot(x-RV.x,z-RV.z);if(dr>22.6||(z<RV.z-12&&dr>12.6))return false;             // stay inside the scatter keep-out (no forest on fields)
 if(x>FA.riverX(z)-3.6)return false;if(Math.hypot(x-O.wmx,z-O.wmz)<4.6+clr)return false;
 for(const l of O.lanes){if(Math.hypot(l[2]-l[0],l[3]-l[1])>4&&segD(x,z,l[0],l[1],l[2],l[3])<.55+clr)return false;}
 if(polyD(x,z,O.road)<1.4+clr)return false;if(O.polys&&FA.PROROAD&&FA.PROROAD.dist(x,z)<.45+clr)return false;if(DITCH.length&&polyD(x,z,DITCH)<.45+clr)return false;
 if(STR()&&FA.PROSTREAM.dist(x,z)<1.95+clr)return false;                                          // C7: brook + its bank ribbon
 if(O.keepOut)for(const k of O.keepOut)if(Math.hypot(x-k.x,z-k.z)<k.r+.6+clr)return false; // C3: procottage hamlet footprint (FA.RVSITE.keepOut)
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
 'vec3 pfN(vec3 sp,vec3 sn,vec2 dH){vec3 sx=dFdx(sp),sy=dFdy(sp);vec3 r1=cross(sy,sn),r2=cross(sn,sx);float det=dot(sx,r1);vec3 g=sign(det)*(dH.x*r1+dH.y*r2);vec3 n=abs(det)*sn-g;'+
 // B1 r2 NaN guard (moved here from the chained cities.js FA.guardNaN): at world-view distance the derivative determinant underflows,
 // normalize(0) = NaN on ANGLE-GL (T4) and bloom smears it into a white blob -> no bump beyond 70 u or on a non-finite / degenerate normal
 'vec3 r=n*inversesqrt(max(dot(n,n),1e-30));return (dot(r,r)>.5&&length(sp)<70.)?r:sn;}\n';
const BODY=[
 'float fT=floor(vTy.x+.5),sd=vTy.y,PP=vTy.z;vec2 wq=vWQ.xz;',
 'float n1=pfV(wq*.55+sd*17.),n2=pfV(wq*2.6+sd*7.),n3=pfV(wq*13.);float ss=vR.y,rr=vR.x,ee=min(min(vB.x,vB.y),min(vB.z,vB.w));', // C6: exact edge distance (vB is linear in position)
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
// C6 verge: ragged grass margin outside the field rectangle (world-space noise -> overlapping verges of neighbours draw identically),
// width capped per vertex by the clearance to lanes / road / ditch / river (vVg); discards inside its own field (the field mesh wins there).
const VERGE=[
 '#ifdef PF_VERGE',
 'if(ee>0.)discard;float vo=length(vec2(max(0.,-min(vB.x,vB.y)),max(0.,-min(vB.z,vB.w))));float nv=pfV(wq*2.3)*.55+pfV(wq*7.1)*.30+pfH(floor(wq*26.))*.15;',
 'float vl=min(vVg,'+'0.95)*(.30+.85*nv);if(vo>vl)discard;diffuseColor.a=1.-smoothstep(vl*.35,vl,vo);', // C6 review: feathered (blended) outer edge - a hard ragged edge read as sawtooth bites
 'float wd=smoothstep(.55,.85,pfV(wq*5.3+3.1)),m1=pfV(wq*.55+4.2),m2=pfV(wq*2.6+7.7);col=mix('+lin('#4F5839')+','+lin('#576040')+',m1)*(.84+.22*m2);col=mix(col,'+lin('#404A33')+',wd*.6);',
 'col*=1.-.14*smoothstep(.2,.9,vo/max(vVg,.05));fH=n3*.5+wd*.4;fRo=.96;',
 '#endif'].join('\n');
function fieldMat(verge){const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.92,metalness:0,envMapIntensity:.55,polygonOffset:true,polygonOffsetFactor:verge?-1:-2,polygonOffsetUnits:verge?-2:-4});
 if(verge){m.defines={PF_VERGE:1};m.transparent=true;m.depthWrite=false;}
 m.onBeforeCompile=sh=>{const BL=!((FA.LOOK||{}).pc&&FA.LOOK.pc.mood==='day'),KF=BL?(verge?'vec3(.46,.46,.53)':'vec3(.32,.32,.38)'):'vec3(1.)'; // C6: blue hour - fields no brighter than the ground key (readback: pasture Y 81 vs ground 50 at .56)
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aR;attribute vec3 aT;attribute vec4 aB;attribute float aV;varying vec3 vR;varying vec3 vTy;varying vec3 vWQ;varying vec4 vB;varying float vVg;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvR=aR;vTy=aT;vB=aB;vVg=aV;vWQ=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+HEAD+'varying vec4 vB;varying float vVg;\n').replace('#include <color_fragment>','#include <color_fragment>\n'+BODY.replace('diffuseColor.rgb=col;',VERGE+'\ndiffuseColor.rgb=col*'+KF+';'))
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=fRo;')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=pfN(-vViewPosition,normal,vec2(dFdx(fH),dFdy(fH))*.045);');}; // C4: .02 -> .045 (row relief at the tighter close-up)
 m.customProgramCacheKey=()=>verge?'pfVerge':'pfField';return m;}
// C6: clip a convex polygon (survey-frame [u,w] points) to a*u+b*w<=c
function clipL(P,a,b,c){const o=[];for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],dp=a*p[0]+b*p[1]-c,dq=a*q[0]+b*q[1]-c;if(dp<=0)o.push(p);
  if((dp<0&&dq>0)||(dp>0&&dq<0)){const t=dp/(dp-dq);o.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}return o;}
// C6: emit the pieces of the REAL facet terrain triangles inside the survey rectangle [u0,u1]x[w0,w1] (exact drape, no terrain poke-through).
// Fallback (no facet grid): .5 grid on the analytic height.
function drapeRect(u0,u1,w0,w1,emit){const G=FA.tgrid&&FA.tgrid();
 if(!G){const st=.5,nu=Math.max(2,Math.ceil((u1-u0)/st)),nw=Math.max(2,Math.ceil((w1-w0)/st));for(let j=0;j<nw;j++)for(let i=0;i<nu;i++){const q=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const p=toW(u0+(u1-u0)*a/nu,w0+(w1-w0)*b/nw);return[p[0],H(p[0],p[1])+.03,p[1]];});emit(q);}return;}
 const cs=[toW(u0,w0),toW(u1,w0),toW(u1,w1),toW(u0,w1)];let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const c of cs){x0=Math.min(x0,c[0]);x1=Math.max(x1,c[0]);z0=Math.min(z0,c[1]);z1=Math.max(z1,c[1]);}
 const c0=FA.terCell(x0,z0),c1=FA.terCell(x1,z1),X=G.VX,Z=G.VZ,Y=G.VH;
 for(let j=Math.max(0,c0[1]-1);j<=Math.min(G.NZ-2,c1[1]+1);j++)for(let i=Math.max(0,c0[0]-1);i<=Math.min(G.NX-2,c1[0]+1);i++)for(const t of FA.terTris(i,j)){
  let P=t.map(k=>toL(X[k],Z[k]));P=clipL(P,-1,0,-u0);if(P.length<3)continue;P=clipL(P,1,0,u1);if(P.length<3)continue;P=clipL(P,0,-1,-w0);if(P.length<3)continue;P=clipL(P,0,1,w1);if(P.length<3)continue;
  const a=t[0],b=t[1],d=t[2],ax=X[b]-X[a],az=Z[b]-Z[a],bx=X[d]-X[a],bz=Z[d]-Z[a],den=ax*bz-bx*az;if(Math.abs(den)<1e-9)continue;
  emit(P.map(l=>{const p=toW(l[0],l[1]),px=p[0]-X[a],pz=p[1]-Z[a],uu=(px*bz-bx*pz)/den,vv=(ax*pz-px*az)/den;return[p[0],Y[a]+(Y[b]-Y[a])*uu+(Y[d]-Y[a])*vv,p[1]];}));}}
const VM=.95; // verge width (survey units)
function clearAt(x,z){let d=VM;for(const l of O.lanes)if(Math.hypot(l[2]-l[0],l[3]-l[1])>4)d=Math.min(d,segD(x,z,l[0],l[1],l[2],l[3])-.3);
 if(O.polys&&FA.PROROAD)d=Math.min(d,FA.PROROAD.dist(x,z)-.18);d=Math.min(d,polyD(x,z,O.road)-.9);if(DITCH.length)d=Math.min(d,polyD(x,z,DITCH)-.32);if(STR())d=Math.min(d,FA.PROSTREAM.dist(x,z)-1.75);d=Math.min(d,FA.riverX(z)-3.1-x);
 if(O.keepOut)for(const k of O.keepOut)d=Math.min(d,Math.hypot(x-k.x,z-k.z)-k.r-.1);return Math.max(0,d);}
function fieldMesh(F,verge){const pos=[],nor=[],aR=[],aT=[],aB=[],aV=[],idx=[];const e=.35,m=verge?VM:0,lift=verge?.012:.02;
 for(const f of F){const nx=-f.tz,nz=f.tx;
  drapeRect(f.u0-m,f.u1+m,f.w0-m,f.w1+m,P=>{const b=pos.length/3;for(const p of P){const x=p[0],z=p[2],l=toL(x,z),dx=x-f.x,dz=z-f.z;
    pos.push(x,p[1]+lift,z);const gx=(H(x+e,z)-H(x-e,z))/(2*e),gz=(H(x,z+e)-H(x,z-e))/(2*e),gl=Math.hypot(gx,1,gz);nor.push(-gx/gl,1/gl,-gz/gl); // smooth shading on the exact facet drape
    aR.push(dx*f.tx+dz*f.tz,dx*nx+dz*nz,0);aT.push(f.t,f.seed,PER[f.t]);aB.push(l[0]-f.u0,f.u1-l[0],l[1]-f.w0,f.w1-l[1]);aV.push(verge?clearAt(x,z):1);}
   for(let k=1;k+1<P.length;k++)idx.push(b,b+k,b+k+1);});}
 // wind every triangle counter-clockwise seen from above (front faces up)
 for(let t=0;t<idx.length;t+=3){const A=idx[t]*3,B=idx[t+1]*3,Cc=idx[t+2]*3;const cy=(pos[Cc]-pos[A])*(pos[B+2]-pos[A+2])-(pos[Cc+2]-pos[A+2])*(pos[B]-pos[A]);if(cy<0){const s=idx[t+1];idx[t+1]=idx[t+2];idx[t+2]=s;}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('aR',new THREE.Float32BufferAttribute(aR,3));
 g.setAttribute('aT',new THREE.Float32BufferAttribute(aT,3));g.setAttribute('aB',new THREE.Float32BufferAttribute(aB,4));g.setAttribute('aV',new THREE.Float32BufferAttribute(aV,1));g.setIndex(idx);
 const me=new THREE.Mesh(g,fieldMat(verge));me.name=verge?'pf_verge':'pf_fields';me.receiveShadow=true;me.castShadow=false;me.renderOrder=1;SC.add(me);return idx.length/3;}

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
 // C3 fix: wind every triangle counter-clockwise seen from above (all 174 ditch-water tris faced down -> back-face culled, the ditch never drew)
 for(let t=0;t<idx.length;t+=3){const A=idx[t]*3,B=idx[t+1]*3,Cc=idx[t+2]*3;const cy=(pos[Cc]-pos[A])*(pos[B+2]-pos[A+2])-(pos[Cc+2]-pos[A+2])*(pos[B]-pos[A]);if(cy<0){const s=idx[t+1];idx[t+1]=idx[t+2];idx[t+2]=s;}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
 const n=g.attributes.normal;for(let i=0;i<n.count;i++)if(n.getY(i)<0)n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i));return g;}
function mergeRibbons(gs){const pos=[],col=[],nor=[],idx=[];for(const g of gs){const b=pos.length/3;pos.push(...g.attributes.position.array);col.push(...g.attributes.color.array);nor.push(...g.attributes.normal.array);for(const i of g.index.array)idx.push(i+b);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setIndex(idx);return g;}
const rgb=(h,a)=>{const c=C(h);return[c.r,c.g,c.b,a==null?1:a];};

// ---------------- boundaries: hedgerows, dry-stone walls, paths ----------------
function nearLane(x,z,d){for(const l of O.lanes)if(Math.hypot(l[2]-l[0],l[3]-l[1])>4&&segD(x,z,l[0],l[1],l[2],l[3])<d)return true;return false;}
function besideField(u,w,du,dw){const a=toW(u+du,w+dw),b=toW(u-du,w-dw);return inField(a[0],a[1],.05)||inField(b[0],b[1],.05);}
function boundaries(lay){const HB=[],TR=[],ST=[],PL=[];const HG=['#3F5E40','#466440','#3C5A42','#4A6440'],SC2=['#8A8577','#7E796C','#857E70']; // C4: lifted off near-black; C6: deeper green hints
 // C4: continuous shrub masses - each step lays one elongated, line-aligned lump (overlapping its neighbours at the .30 step) + a crown lump
 const hedgeAt=(x,z,k,ang)=>{const y=FA.Hm?FA.Hm(x,z):H(x,z);const c=CC.set(HG[(rnd()*4)|0]).multiplyScalar(.85+.3*rnd()).clone();const s=.13+.06*rnd();const r1=rnd(),r2=rnd(),r3=rnd(),r4=rnd(),r5=rnd();const FLh=!!(FA.PROFLORA&&FA.PROFLORA.on&&FA.PROFLORA.add('hedge',x,y,z,s,s*(1+.3*r2)*HK,(r3-.5)*.2,c,ang||0)); // C5: proflora hedge step (C6: HK height)
  if(!FLh)HB.push([x,y+s*.62,z,.25+.05*r1,s*(1.2+.45*r2),s*1.12,(ang||0)+(r3-.5)*.25,0,0,c]);if(!FLh)HB.push([x+(r4-.5)*.1,y+s*1.42,z+(r5-.5)*.1,.18+.06*r1,s*(.8+.35*r2),s*.85,(ang||0)+(r3-.5)*.7,0,0,c.clone().multiplyScalar(1.1)]);
  if(rnd()<(k?.16:.10)){const ts=.42+.25*rnd();const tr=[x,y,z,ts,ts*(1.0+.3*rnd()),ts,rnd()*TAU,0,0,CC.set(HG[(rnd()*4)|0]).multiplyScalar(.9+.25*rnd()).clone()];if(!(FA.PROFLORA&&FA.PROFLORA.on&&FA.PROFLORA.add('broad',x,y,z,tr[3]*2.5,tr[4]*2,tr[6],tr[9])))TR.push(tr);}};
 const wallAt=(x,z,ang)=>{const y=FA.Hm?FA.Hm(x,z):H(x,z);for(let c=0;c<3;c++){if(c===2&&rnd()<.35)continue;const k=c===2?.8:1;
  ST.push([x+(rnd()-.5)*.03,y+.035+c*.05,z+(rnd()-.5)*.03,(.085+rnd()*.035)*k,(.032+rnd()*.012)*k,(.06+rnd()*.02)*k,ang+(rnd()-.5)*.5,(rnd()-.5)*.3,(rnd()-.5)*.3,CC.set(SC2[(rnd()*3)|0]).multiplyScalar(.78+.3*rnd()).clone()]);}};
 const okB=(x,z)=>!nearLane(x,z,.7)&&!(O.polys&&FA.PROROAD&&FA.PROROAD.dist(x,z)<.45)&&!(DITCH.length&&polyD(x,z,DITCH)<.5)&&!(STR()&&FA.PROSTREAM.dist(x,z)<1.5)&&polyD(x,z,O.road)>1.5&&x<FA.riverX(z)-3.4&&Math.hypot((x-O.vx)/1.25,z-O.vz)>7.8;
 const angU=Math.atan2(-uz,ux),angW=Math.atan2(-wz,wx);let hedgeLen=0,wallLen=0;const pathLines=[];
 // column boundaries (long lines along w): 50 % hedgerow, 22 % wall, rest open balk (some carry a footpath)
 // C6: hedge / wall mix balanced by running length (~50/50), fewer open balks; hedges laid at a tighter .22 step (continuous masses)
 const pick=(pOpen)=>{const k=rnd(),f=rnd();if(k<pOpen)return 'n';const pref=hedgeLen<=wallLen?'h':'s';return f<.78?pref:(pref==='h'?'s':'h');};
 for(let i=1;i<lay.cols.length;i++){const ub=lay.cols[i][0],kind=pick(.16);const gate=-20+rnd()*40;let run=[];
  const step=kind==='h'?.22:kind==='s'?.19:.35;
  for(let w=-26;w<=26;w+=step){const p=toW(ub,w);const ok=besideField(ub,w,.45,0)&&okB(p[0],p[1])&&Math.abs(w-gate)>.7;
   if(kind==='n'){if(ok)run.push(p);else{if(run.length>6)pathLines.push(run);run=[];}continue;}
   if(!ok)continue;if(kind==='h'){hedgeAt(p[0],p[1],true,angW);hedgeLen+=step;}else{wallAt(p[0],p[1],angW);wallLen+=step;}}
  if(run.length>6)pathLines.push(run);}
 // cut lines inside a column (short lines along u): 30 % wall, 15 % hedge
 lay.cuts.forEach((cl,ci)=>{const c=lay.cols[ci];for(let j=1;j<cl.length;j++){const wb=cl[j][0],kind=pick(.30);if(kind==='n')continue;const step=kind==='h'?.22:.19;
  for(let u=c[0]+.2;u<=c[1]-.2;u+=step){const p=toW(u,wb);if(!besideField(u,wb,0,.45)||!okB(p[0],p[1]))continue;if(kind==='h'){hedgeAt(p[0],p[1],false,angU);hedgeLen+=step;}else{wallAt(p[0],p[1],angU);wallLen+=step;}}}});
 // footpaths: up to 3 open balks + the cart tracks (lanes) out to the bridge and the windmill
 pathLines.sort((a,b)=>b.length-a.length).slice(0,3).forEach(r=>PL.push({P:r,w:.07}));
 for(const l of O.lanes)if(Math.hypot(l[2]-l[0],l[3]-l[1])>4)PL.push({P:[[l[0],l[1]],[l[2],l[3]]],w:.15});
 return {HB,TR,ST,PL,hedgeLen:+hedgeLen.toFixed(1),wallLen:+wallLen.toFixed(1)};}

// ---------------- build ----------------
function build(opts){const t0=performance.now();O=opts;rnd=FA.rng(91);ox=O.vx;oz=O.vz;const ang=.32;ux=Math.cos(ang);uz=Math.sin(ang);wx=-uz;wz=ux;DITCH=[];
 DITCH=STR()?[]:ditch();
 const lay=layout();PF.fields=lay.F;PF.toL=toL;PF.on=true;let tris=fieldMesh(lay.F);tris+=fieldMesh(lay.F,true); // C6: exact facet drape + ragged grass verges
 const B=boundaries(lay);
 const hedgeM=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.92,flatShading:true,envMapIntensity:1.0});
 tris+=inst(new THREE.IcosahedronGeometry(1,1),hedgeM,B.HB,true); // C4: detail 0 -> 1 (rounder shrub masses at the close-up distance)
 const stoneM=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.93,flatShading:true,envMapIntensity:.9});
 tris+=inst(new THREE.IcosahedronGeometry(1,0),stoneM,B.ST,false); // stones ~1.3 m: shadow pass not worth 20k tris
 // trees: hedgerow oaks + orchard rows (one merged crown+trunk geometry, instance colour)
 const cr=new THREE.IcosahedronGeometry(1,1);cr.scale(1,.85,1);cr.translate(0,1.25,0);const tk=new THREE.CylinderGeometry(.06,.09,.9,5);tk.translate(0,.45,0);
 const treeG=mergeG([[cr,[1,1,1]],[tk,[.42,.36,.30]]]);
 const OT=[],RK=[];for(const f of lay.F){const P=PER[f.t];
  if(f.t===4){const nx=-f.tz,nz=f.tx,R=Math.hypot(f.u1-f.u0,f.w1-f.w0)/2;for(let s=-R+P*.5;s<R;s+=P)for(let r=-R;r<R;r+=1.05){const x=f.x+f.tx*r+nx*s,z=f.z+f.tz*r+nz*s;const lc=toL(x,z);
    const e=Math.min(lc[0]-f.u0,f.u1-lc[0],lc[1]-f.w0,f.w1-lc[1]);if(e<.4||rnd()<.06)continue;const sc=(.17+.05*rnd())*1.8; // C6: orchard trees x1.8 (were bonsai next to the cottages), spacing .78 -> 1.05
    const ot=[x+(rnd()-.5)*.06,Hm(x,z),z+(rnd()-.5)*.06,sc,sc*(.9+.25*rnd()),sc,rnd()*TAU,0,0,CC.set(rnd()<.5?'#44553A':'#4C5B3C').multiplyScalar(.85+.3*rnd()).clone()];if(!(FA.PROFLORA&&FA.PROFLORA.on&&FA.PROFLORA.add('orchard',ot[0],ot[1],ot[2],ot[3],ot[4],ot[6],ot[9])))OT.push(ot);}}
  if((f.t===3||f.t===0)&&rnd()<.35){const n=2+((rnd()*3)|0);for(let k=0;k<n;k++){const u=f.u0+.6+rnd()*(f.u1-f.u0-1.2),w=f.w0+.6+rnd()*(f.w1-f.w0-1.2),p=toW(u,w);
    RK.push([p[0],Hm(p[0],p[1])+.02,p[1],.15+.03*rnd(),.15+.04*rnd(),.15+.03*rnd(),rnd()*TAU,0,0,CC.set('#8C7A4C').multiplyScalar(.8+.25*rnd()).clone()]);}}}
 const treeM=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.9,flatShading:true,envMapIntensity:1.0});
 // C6: surface life on EVERY field (close-up only, density by tier FA.QK), all on the exact facet height Hm:
 //  wheat = dense blade/ear strips in drill rows; veg = soil ridges + leafy mounds; fallow = clod ridges + sparse stubble;
 //  pasture = grass tufts (proflora) + a few muted flowers; orchard = grass tufts under the trees; every field edge = weeds on the verge.
 const CS=[],CL=[],WB=[],FW=[],QK=FA.QK||1,FL=FA.PROFLORA&&FA.PROFLORA.on;let nTuft=0;
 const yMin=(x,z,dx,dz)=>Math.min(Hm(x,z),Hm(x+dx,z+dz),Hm(x-dx,z-dz));
 const tuft=(x,z,s,hex)=>{if(FL&&FA.PROFLORA.add('tuft',x,null,z,s,null,0,hex))nTuft++;};
 for(const f of lay.F){const P=PER[f.t],nx=-f.tz,nz=f.tx,R=Math.hypot(f.u1-f.u0,f.w1-f.w0)/2,ang=Math.atan2(-f.tz,f.tx),A=(f.u1-f.u0)*(f.w1-f.w0);
  const eAt=(x,z)=>{const lc=toL(x,z);return Math.min(lc[0]-f.u0,f.u1-lc[0],lc[1]-f.w0,f.w1-lc[1]);};
  if(f.t<=2){const rs=QK<1&&f.t!==1?2:1;for(let k=Math.ceil(-R/P);k*P<R;k+=rs){const s=k*P,sl=f.t===1?.2:f.t===0?.42:.7;
   for(let r=-R;r<R;r+=sl){const x=f.x+f.tx*(r+sl/2)+nx*s,z=f.z+f.tz*(r+sl/2)+nz*s;const e=eAt(x,z);if(e<.22)continue;const hx=f.tx*sl*.48,hz=f.tz*sl*.48;
    if(f.t===0){const ripe=f.seed>.55?'#7E7C54':'#8E8058';WB.push([x,yMin(x,z,hx,hz)+.012,z,sl*1.02,(.075+.02*rnd())*(e<.5?.8:1),P*.66,ang,0,0,CC.set(ripe).multiplyScalar(.78+.22*rnd()).clone()]);}
    else if(f.t===2){CS.push([x,yMin(x,z,hx,hz)+.012,z,sl*.97,.022+.01*rnd(),P*.5,ang,0,0,CC.set('#5A4D3D').multiplyScalar(.85+.3*rnd()).clone()]);
     if(rnd()<.55*QK)WB.push([x+nx*P*.25,yMin(x,z,hx,hz)+.01,z+nz*P*.25,sl*.9,.022+.008*rnd(),P*.3,ang,0,0,CC.set('#6A6250').multiplyScalar(.75+.25*rnd()).clone()]);}
    else{CS.push([x,yMin(x,z,hx,hz)+.008,z,sl*1.02,.016,P*.42,ang,0,0,CC.set('#463A2E').multiplyScalar(.85+.25*rnd()).clone()]);
     if(rnd()<.85*QK){const sc=.045+.02*rnd();CL.push([x,Hm(x,z)+.04+sc*.3,z,sc,sc*.8,sc,rnd()*TAU,0,0,CC.set(rnd()<.5?'#536340':'#5E6C40').multiplyScalar(.82+.3*rnd()).clone()]);}}}}}
  if(f.t>=3){const n=Math.round(A*(f.t===3?1.5:1.0)*(QK<1?.5:1));for(let i=0;i<n;i++){const u=f.u0+.15+rnd()*(f.u1-f.u0-.3),w=f.w0+.15+rnd()*(f.w1-f.w0-.3),p=toW(u,w);tuft(p[0],p[1],.25+.3*rnd(),f.t===3?'#56643E':'#5A6440');}
   if(f.t===3){const nf=Math.round(A*.9*QK);for(let i=0;i<nf;i++){const u=f.u0+.2+rnd()*(f.u1-f.u0-.4),w=f.w0+.2+rnd()*(f.w1-f.w0-.4),p=toW(u,w),sc=.010+.006*rnd();
     FW.push([p[0],Hm(p[0],p[1])+.03,p[1],sc,sc*.7,sc,rnd()*TAU,0,0,CC.set(rnd()<.6?'#9C9682':'#7E7A92').multiplyScalar(.7+.2*rnd()).clone()]);}}}
  // field-edge weeds on the verge
  const per=2*((f.u1-f.u0)+(f.w1-f.w0)),nw=Math.round(per*1.6*(QK<1?.5:1));for(let i=0;i<nw;i++){let t=rnd()*per,u,w;const o=.06+rnd()*.5,lu=f.u1-f.u0,lw=f.w1-f.w0;
   if(t<lu){u=f.u0+t;w=f.w0-o;}else if((t-=lu)<lw){u=f.u1+o;w=f.w0+t;}else if((t-=lw)<lu){u=f.u1-t;w=f.w1+o;}else{t-=lu;u=f.u0-o;w=f.w1-t;}
   const p=toW(u,w);if(clearAt(p[0],p[1])<o+.1)continue;tuft(p[0],p[1],.35+.4*rnd(),rnd()<.5?'#4E5A3A':'#5C6242');}}
 // wheat / stubble blade strip: 22 blades + ears in a unit box (x along the row, y up, z across); normals up so strips shade like the field
 const wbG=(function(){const r=FA.rng(313),p=[],c=[],n=[];const NB=QK<1?12:22;for(let i=0;i<NB;i++){const bx=r()-.5,bz=(r()-.5)*.9,a=r()*TAU,w=.035,h=.75+.25*r(),lx=(r()-.5)*.12,lz=(r()-.5)*.25;
   const ca=Math.cos(a)*w,sa=Math.sin(a)*w;p.push(bx-ca,0,bz-sa*4, bx+ca,0,bz+sa*4, bx+lx,h,bz+lz);c.push(.50,.50,.50,.50,.50,.50,1,1,1);
   if(i%3!==2){const ex=bx+lx*.9,ez=bz+lz*.9,ey=h*.82;p.push(ex-.02,ey,ez, ex+.02,ey,ez, ex+lx*.15,h*1.06,ez+lz*.1);c.push(1.08,1.08,1.08,1.08,1.08,1.08,1.15,1.15,1.15);}}
  for(let i=0;i<p.length/3;i++)n.push(0,1,0);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));return g;})();
 const KB=((FA.LOOK||{}).pc&&FA.LOOK.pc.mood==='day')?1:.42,KBc=new THREE.Color(KB,KB,KB*1.08); // C6: blue-hour crop key (same rule as the field surface)
 const wbM=new THREE.MeshStandardMaterial({color:KBc,vertexColors:true,roughness:.9,metalness:0,envMapIntensity:.5,side:THREE.DoubleSide});
 wbM.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal*=faceDirection;\n#endif');};wbM.customProgramCacheKey=()=>'pfBlade'; // undo the back-face flip: blades shade like the field
 const bx1=new THREE.BoxGeometry(1,1,1);bx1.translate(0,.5,0);const crM=new THREE.MeshStandardMaterial({color:KBc,roughness:.9,flatShading:true,envMapIntensity:.8});
 const nC0=SC.children.length;tris+=inst(bx1,crM,CS,false);tris+=inst(new THREE.IcosahedronGeometry(1,0),crM,CL.concat(FW),true);tris+=inst(wbG,wbM,WB,false);PF.crop={strips:CS.length,clumps:CL.length,blades:WB.length,flowers:FW.length,tufts:nTuft};
 for(const o of SC.children.slice(nC0))if(o.isInstancedMesh){(FA.closeOnly=FA.closeOnly||[]).push(o);o.visible=FA.VIEW==='close';} // C4: close-up extras hidden in the world view (keeps world budget)
 tris+=inst(treeG,treeM,B.TR.concat(OT),true);
 const rk1=new THREE.CylinderGeometry(1,1.05,1,9);rk1.translate(0,.5,0);const rk2=new THREE.ConeGeometry(1.02,.95,9);rk2.translate(0,1.45,0);
 tris+=inst(mergeG([[rk1,[1,1,1]],[rk2,[.92,.9,.86]]]),new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.95,flatShading:true,envMapIntensity:.8}),RK,true);
 // footpaths + cart tracks: soft-edged earth ribbons (vertex alpha), worn centre lighter
 const PA=[];for(const p of B.PL){const w=p.w;PA.push(ribbon(p.P,[[-w*1.9,0,...rgb('#4A4436',0)],[-w,0,...rgb('#544B3C',.75)],[0,0,...rgb('#5C5241',.85)],[w,0,...rgb('#544B3C',.75)],[w*1.9,0,...rgb('#4A4436',0)]],(c,x,z)=>H(x,z)+.06,.35));} // C3: darker + softer (now that ribbons face up they drew as pale 'light ray' fans)
 if(PA.length){const pm=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,transparent:true,depthWrite:false,roughness:.95,envMapIntensity:.5,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});
  const m=new THREE.Mesh(mergeRibbons(PA),pm);m.receiveShadow=true;m.renderOrder=2;SC.add(m);tris+=m.geometry.index.count/3;}
 // irrigation ditch: earthen banks (raised lips, wet inner faces) + a level water strip, sluice gate at the river
 let dl=0;if(DITCH.length>2){for(let i=0;i+1<DITCH.length;i++)dl+=Math.hypot(DITCH[i+1][0]-DITCH[i][0],DITCH[i+1][1]-DITCH[i][1]);
  const yC=(c,x,z)=>H(c[0],c[1]);
  const bk=ribbon(DITCH,[[-.42,0,...rgb('#4C5437')],[-.26,.10,...rgb('#544C3A')],[-.15,.01,...rgb('#1E1C1A')],[.15,.01,...rgb('#1E1C1A')],[.26,.10,...rgb('#544C3A')],[.42,0,...rgb('#4C5437')]], // C3: higher lips; trough kept above the coarse terrain mesh
   (c,x,z)=>Math.max(H(x,z),H(c[0],c[1])-.02),.3);
  const bm=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.95,envMapIntensity:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  const bmesh=new THREE.Mesh(bk,bm);bmesh.receiveShadow=true;SC.add(bmesh);tris+=bk.index.count/3;
  const wa=ribbon(DITCH,[[-.17,0,...rgb('#ffffff')],[.17,0,...rgb('#ffffff')]],(c,x,z)=>Math.max(H(x,z),H(c[0],c[1]))+.06,.3); // C3: was H(c)+.035 -> hidden under the coarse terrain mesh (only the brown hook band showed)
  const wn=FA.noiseNormal?FA.noiseNormal(64,1.6,41):null; // C3: read as water at blue hour = dark glassy body + sky-tinted sheen (was a grey metal slab)
  const W=FA.LOOK.water||{c:'#3A5A6E'},wmat=new THREE.MeshStandardMaterial({color:W.c,roughness:.22,metalness:0,envMapIntensity:.55,emissive:C('#2C4C78'),emissiveIntensity:.32,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6}); // C3: river palette (teal-slate), not a mirror
  if(wn){wn.repeat.set(8,8);wmat.normalMap=wn;wmat.normalScale=new THREE.Vector2(.14,.14);FA.anims.push(T=>{wn.offset.set(T*.01,-T*.03);});}
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
function hook(x,z,c){if(!PF.on)return false;if(DITCH.length&&polyD(x,z,DITCH)<.6){c.lerp(DITCHC,.6);return true;}return false;} // C6: per-face balk colour removed (it made the stair-step edges); the verge mesh does the transition
})();
