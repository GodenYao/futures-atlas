// Futures Atlas v4.5 PILOT - proflora.js : Checkpoint C5. Procedural vegetation for style=archviz.
// Replaces every faceted plant stamp (KayKit trees, far facet trees, profarm hedges / trees, procottage + procity trees, tufts)
// with card-based plants: one GPU-baked atlas (needle spray, 2 leaf clusters, grass blades, bark), trunk + cards merged per
// archetype (1 draw per archetype x LOD), bent normals, transmission term, vertex-shader wind, alpha-tested shadows.
// Everything is generated in code; no external assets; no third-party code. Classic script, uses globals THREE + FA.
(function(){
'use strict';
const FA=window.FA;if(!FA||!window.THREE)return;
const TAU=Math.PI*2,C=h=>new THREE.Color(h),now=()=>performance.now(),errs=()=>(window.__errs=window.__errs||[]);
const PF=FA.PROFLORA={on:false,prepare:prepare,add:add,build:build,setView:setView,moving:moving,info:{},uWind:{value:1}};
const KINDS=['conifer','broad','park','orchard','hedge','shrub','tuft'];
// add() scale mapping: [crown width per s, height per sy] ; NW = natural crown width of the unit-height archetype
const KM={conifer:[.55,1.3],broad:[.8,1.05],park:[.62,.95],orchard:[2,2.1],shrub:[1,.8]};
const NW={conifer:.72,broad:.95,park:.62,orchard:1,shrub:1};
// atlas cells [u0,v0,u1,v1]
const NE=[.004,.004,.496,.496],LA=[.504,.004,.996,.496],LB=[.004,.504,.496,.996],BL=[.504,.504,.746,.996],BK=[.80,.56,.96,.94];
const W1=[1,1,1],Z3=[0,0,0];
let TEX=null,TEXN=1024,MAT=null,MATG=null,DEP=null,BLUE=true,HI=true,RN=28,BARKC=W1,FRUITC=W1,PAL=null;
const GEO={},REC=[],IL={},SETS={},ALL=[];
const M4=new THREE.Matrix4(),Q4=new THREE.Quaternion(),EU=new THREE.Euler(),V3=new THREE.Vector3(),S3=new THREE.Vector3(),TC=new THREE.Color(),TH=new THREE.Color();

// ======================= (1) GPU atlas bake =======================
const BAKE_FS=[
'uniform float sd;varying vec2 vU;',
'float h1(float n){return fract(sin(n*127.1+sd)*43758.5453);}',
'float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}',
// needle spray: spine (base at v=0), 9 side twigs with 14 needles each, 36 short needles on the spine; tone lighter toward the tips
'vec2 spray(vec2 p){float a=smoothstep(.014,.007,seg(p,vec2(.5,0.),vec2(.5,.93)));float tn=.4;',
' for(int j=0;j<9;j++){float fj=float(j),t=(fj+.5)/9.,s=mod(fj,2.)*2.-1.;vec2 b=vec2(.5,.03+.86*t);',
'  float an=.45+.35*h1(fj+3.)+.25*t,L=(.40*(1.-.72*t)+.05)*(.8+.4*h1(fj+9.));vec2 dr=vec2(s*cos(an),sin(an)),nr=vec2(-dr.y,dr.x);',
'  float k=smoothstep(.009,.004,seg(p,b,b+dr*L));if(k>a){a=k;tn=.42;}',
'  for(int i=0;i<14;i++){float fi=float(i),u=(fi+.6)/14.,q=mod(fi,2.)*2.-1.;vec2 c=b+dr*L*u;float nl=.06*(1.-.5*u)*(.7+.6*h1(fj*17.+fi));',
'   float kk=smoothstep(.0065,.0025,seg(p,c,c+(nr*q*.8+dr*.6)*nl));if(kk>.02){a=max(a,kk);tn=mix(tn,.6+.5*u+.15*t,kk);}}}',
' for(int i=0;i<36;i++){float fi=float(i),u=(fi+.5)/36.,q=mod(fi,2.)*2.-1.;vec2 c=vec2(.5,.04+.9*u);float nl=.07*(1.-.4*u)*(.7+.6*h1(fi+70.));',
'  float kk=smoothstep(.0065,.0025,seg(p,c,c+vec2(q*.75,.66)*nl));if(kk>.02){a=max(a,kk);tn=mix(tn,.7+.4*u,kk);}}',
' return vec2(a,tn);}',
// leaf cluster: many small pointed ellipses in a disc, later leaves on top and lighter, dark midrib; v = variant (fewer, larger)
'vec2 leaves(vec2 p,float v){float a=0.,tn=.62;',
' for(int i=0;i<96;i++){float fi=float(i)+v*131.;float r=.37*sqrt(h1(fi)),th=6.2832*h1(fi+.37);vec2 c=vec2(.5)+r*vec2(cos(th),sin(th));',
'  float ro=th+(h1(fi+.71)-.5)*2.2;vec2 q=p-c;q=vec2(q.x*cos(ro)+q.y*sin(ro),-q.x*sin(ro)+q.y*cos(ro));',
'  float sz=(.055+.035*h1(fi+.13))*(1.+.35*v);float d=length(q/vec2(sz,sz*.45))+.35*abs(q.x)/sz*abs(q.y)/(sz*.45);',
'  float k=smoothstep(1.,.82,d)*step(float(i),mix(95.,62.,v));',
'  if(k>.01){float t=(.58+.5*h1(fi+.91))*(.72+.28*float(i)/96.)*(1.-.2*smoothstep(.1,0.,abs(q.y)/sz));a=max(a,k);tn=mix(tn,t,k);}}',
' return vec2(a,tn);}',
// grass strip: 9 tapered leaning blades, dark base -> light tip
'vec2 blades(vec2 p){float a=0.,tn=.6;',
' for(int i=0;i<9;i++){float fi=float(i);float x0=.14+.72*(fi+.5*h1(fi+5.))/9.,hh=.55+.42*h1(fi+11.),ln=(h1(fi+17.)-.5)*.4;',
'  float t=p.y/hh;float cx=x0+ln*t*t*hh;float w=.034*pow(max(1.-t,0.),.6);float k=smoothstep(w,w*.6,abs(p.x-cx))*step(t,1.);',
'  if(k>.01){a=max(a,k);tn=mix(tn,.45+.7*t,k);}}return vec2(a,tn);}',
'void main(){vec2 g=vU*2.,c=floor(g),f=fract(g);vec2 r=vec2(0.,.7);',
' if(c.y<.5){if(c.x<.5)r=spray(f);else r=leaves(f,0.);}',
' else if(c.x<.5)r=leaves(f,1.);',
' else if(f.x<.5)r=blades(vec2(f.x*2.,f.y));',
' else r=vec2(1.,.7+.3*h2(floor(vec2(f.x*90.,f.y*14.))));',
' gl_FragColor=vec4(vec3(r.y),r.x);}'].join('\n');
function bake(){const t0=now(),R=FA.R,sc=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);TEXN=HI?1024:512;
 const mat=new THREE.ShaderMaterial({uniforms:{sd:{value:1.7}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:BAKE_FS,depthTest:false,depthWrite:false});
 const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);q.frustumCulled=false;sc.add(q);const prev=R.getRenderTarget();
 const rt=new THREE.WebGLRenderTarget(TEXN,TEXN,{depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,anisotropy:4});
 let ok=false;
 try{R.setRenderTarget(rt);R.render(sc,cam);
  // sanity read-back: bark patch must be opaque, spray spine must be covered (a failed shader compile leaves the target empty)
  const b=new Uint8Array(4);R.readRenderTargetPixels(rt,(TEXN*.88)|0,(TEXN*.75)|0,1,1,b);const a1=b[3];
  R.readRenderTargetPixels(rt,(TEXN*.25)|0,(TEXN*.1)|0,1,1,b);ok=a1>200&&b[3]>100;}
 finally{R.setRenderTarget(prev);mat.dispose();q.geometry.dispose();}
 if(!ok){rt.dispose();throw new Error('atlas bake empty');}
 TEX=rt.texture;PF.info.bakeMs=Math.round(now()-t0);}

// ======================= (2) materials (standard + alpha-tested depth, shared wind) =======================
const V_HEAD='attribute vec3 aW;uniform float uT,uAn,uWd;uniform vec2 pfK;varying float vPf;';
// aW = (sway weight 0..1 by height, flutter weight, bark flag). Sway periods 4.8 / 2.9 / 5.9 s, flutter 0.68 Hz. Phase from instance position.
const V_WIND=['{',
'#ifdef USE_INSTANCING',
' vec2 pfO=instanceMatrix[3].xz;',
'#else',
' vec2 pfO=vec2(0.);',
'#endif',
' float pfP=pfO.x*.37+pfO.y*.53,pfG=uAn*uWd,pfH=aW.x*aW.x;',
' transformed.x+=pfH*pfK.x*pfG*(sin(uT*1.31+pfP)+.45*sin(uT*2.17+pfP*1.7));',
' transformed.z+=pfH*pfK.x*pfG*.7*sin(uT*1.07+pfP*1.3+1.6);',
' transformed+=normal*(aW.y*pfK.y*pfG*sin(uT*4.3+pfP*3.1+position.x*23.+position.y*17.));',
' vPf=aW.y*(1.-aW.z);}'].join('\n');
function patchV(s,col){s=s.replace('#include <common>','#include <common>\n'+V_HEAD).replace('#include <begin_vertex>','#include <begin_vertex>\n'+V_WIND);
 return col?s.replace('#include <color_vertex>','#include <color_vertex>\n#ifdef USE_COLOR\nvColor.xyz=mix(vColor.xyz,color.xyz,aW.z);\n#endif'):s;} // bark / fruit keep their own colour (no instance tint)
function patchF(s){return s.replace('#include <common>','#include <common>\nuniform vec3 pfSun,pfLC,pfHz;varying float vPf;')
 // bent crown normals must not flip on back faces (the crown shades as one soft volume)
 .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal*=faceDirection;\n#endif')
 // keep coverage in the far mips + soft dithered edge
 .replace('#include <alphatest_fragment>','#ifdef USE_UV\ndiffuseColor.a*=1.+.45*clamp(log2(max(fwidth(vUv.x),fwidth(vUv.y))*'+TEXN.toFixed(1)+'),0.,4.);\n#endif\n'+
  'diffuseColor.a+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.2;\n#include <alphatest_fragment>')
 // transmission toward the key light (back-lit leaves) + wrap + cool indirect fill (never black)
 .replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n{vec3 pl=normalize((viewMatrix*vec4(pfSun,0.)).xyz),pv=normalize(vViewPosition);'+
  'float tr=.7*pow(clamp(dot(-pv,pl),0.,1.),2.)+.3*clamp(.6-.4*dot(normal,pl),0.,1.);reflectedLight.directDiffuse+=diffuseColor.rgb*pfLC*tr*vPf;'+
  'reflectedLight.indirectDiffuse+=diffuseColor.rgb*pfHz*(.4+.6*vPf);}');}
function mkMat(sway,flut,a2c){const TU=FA.TU||{},sun=FA.sun;
 const U={uT:TU.uT||{value:0},uAn:TU.uAn||{value:1},uWd:PF.uWind,pfK:{value:new THREE.Vector2(sway,flut)},
  pfSun:{value:FA.SUNDIR||new THREE.Vector3(-.5,.7,.3).normalize()},pfLC:{value:sun?sun.color.clone().multiplyScalar(sun.intensity*.35):new THREE.Color(.3,.25,.2)},
  pfHz:{value:BLUE?new THREE.Vector3(.16,.20,.30):new THREE.Vector3(.10,.10,.08)}};
 const m=new THREE.MeshStandardMaterial({color:C('#ffffff').multiplyScalar(BLUE?.85:1),map:TEX,alphaTest:.42,side:THREE.DoubleSide,vertexColors:true,roughness:.88,metalness:0,envMapIntensity:BLUE?1:.7});
 m.alphaToCoverage=a2c;m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader=patchV(sh.vertexShader,true);sh.fragmentShader=patchF(sh.fragmentShader);};
 m.customProgramCacheKey=()=>'pflora'+TEXN;m.userData.U=U;return m;}
function mats(){const R=FA.R;let a2c=false;try{a2c=!!(R.capabilities.isWebGL2&&R.getContextAttributes().antialias);}catch(e){}
 MAT=mkMat(.035,.012,a2c);MATG=mkMat(.10,0,a2c);const U=MAT.userData.U;
 DEP=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:TEX,alphaTest:.42,side:THREE.DoubleSide});
 DEP.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{uT:U.uT,uAn:U.uAn,uWd:U.uWd,pfK:U.pfK});sh.vertexShader=patchV(sh.vertexShader,false);};
 DEP.customProgramCacheKey=()=>'pfloraD';}
// palettes (sRGB): blue hour = cool blue-green / slate-teal / muted olive; day = fresher greens
function palette(){const col=(h,k)=>{const c=C(h);return[c.r*k,c.g*k,c.b*k];};
 PAL=BLUE?{conifer:['#3C5A60','#42625C','#38545E','#466660'],broad:['#4C6658','#55694F','#476260','#5A6C56'],park:['#4A6660','#506A58','#46625E'],
   orchard:['#566A50','#4E6654','#5C6C52'],hedge:['#4E6E4E','#587248','#4A6A56'],shrub:['#4E6E4E','#587248'],tuft:['#62784E','#6C7C48','#5A7456']} // C5 integration: hedge/tuft ~10% greener + lighter (readback: they sank into the violet ground)
  :{conifer:['#3F6146','#48694A','#3A5A48'],broad:['#5E7A48','#6F8650','#587350'],park:['#4F6B46','#5E7A48','#6F8650','#587350'],
   orchard:['#6A8650','#5E7E4C'],hedge:['#506B40','#5A7444'],shrub:['#506B40','#5A7444'],tuft:['#7A8E52','#6E8648']};
 BARKC=col('#4A4038',BLUE?.8:1);FRUITC=col(BLUE?'#7A5648':'#A8523C',BLUE?.8:1);}

// ======================= (3) geometry kit: cards + tubes appended into one buffer per archetype =======================
const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const c01=v=>v<0?0:v>1?1:v;
function GB(){return{p:[],n:[],u:[],c:[],w:[],i:[]};}
function vtx(g,x,y,z,n,u,v,col,k,sw,fl,bk){g.p.push(x,y,z);g.n.push(n[0],n[1],n[2]);g.u.push(u,v);g.c.push(col[0]*k,col[1]*k,col[2]*k);g.w.push(sw,fl,bk);}
// card: base mid o, half-width vector r, spine vector u, droop vector drp (x t^2), atlas cell, normals bent `bend` toward (vertex - ctr),
// tone k0 (base) -> k1 (tip), sway weight = y/H, flutter f0 -> f1, seg segments along the spine, bk = bark/solid flag
function card(g,o,r,u,drp,cell,ctr,bend,k0,k1,col,H,f0,f1,seg,bk){let fn=nrm(crs(r,u));
 if(fn[0]*(o[0]+u[0]*.5-ctr[0])+fn[1]*(o[1]+u[1]*.5-ctr[1])+fn[2]*(o[2]+u[2]*.5-ctr[2])<0)fn=[-fn[0],-fn[1],-fn[2]];
 const b0=g.p.length/3;
 for(let j=0;j<=seg;j++){const t=j/seg,q=t*t;for(let s=-1;s<=1;s+=2){
   const x=o[0]+u[0]*t+drp[0]*q+r[0]*s,y=o[1]+u[1]*t+drp[1]*q+r[1]*s,z=o[2]+u[2]*t+drp[2]*q+r[2]*s,d=nrm([x-ctr[0],y-ctr[1],z-ctr[2]]);
   vtx(g,x,y,z,nrm([fn[0]*(1-bend)+d[0]*bend,fn[1]*(1-bend)+d[1]*bend,fn[2]*(1-bend)+d[2]*bend]),
    cell[0]+(cell[2]-cell[0])*(s+1)/2,cell[1]+(cell[3]-cell[1])*t,col,k0+(k1-k0)*t,c01(y/H),f0+(f1-f0)*t,bk);}}
 for(let j=0;j<seg;j++){const a=b0+j*2;g.i.push(a,a+1,a+3,a,a+3,a+2);}}
// tapered tube a -> b (bark patch, radial normals, darker base)
function tube(g,a,b,ra,rb,n,col,H){const d=nrm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]),x=nrm(crs(d,Math.abs(d[1])>.9?[1,0,0]:[0,1,0])),y=crs(d,x),b0=g.p.length/3;
 for(let e=0;e<2;e++){const c=e?b:a,rr=e?rb:ra;for(let i=0;i<=n;i++){const an=i/n*TAU,cs=Math.cos(an),sn=Math.sin(an),nx=[x[0]*cs+y[0]*sn,x[1]*cs+y[1]*sn,x[2]*cs+y[2]*sn];
   vtx(g,c[0]+nx[0]*rr,c[1]+nx[1]*rr,c[2]+nx[2]*rr,nx,BK[0]+(BK[2]-BK[0])*i/n,BK[1]+(BK[3]-BK[1])*e,col,e?1:.72,c01((c[1]+nx[1]*rr)/H),0,1);}}
 for(let i=0;i<n;i++){const p=b0+i,q=b0+n+1+i;g.i.push(p,q,p+1,p+1,q,q+1);}}
// one leaf-cluster card centred at pos, facing roughly along d (jittered), random in-plane rotation
function leafCard(g,r,pos,d,sz,ctr,ao,H){const n0=nrm([d[0]+(r()-.5)*.9,d[1]+(r()-.5)*.9,d[2]+(r()-.5)*.9]),t1=nrm(crs(n0,Math.abs(n0[1])>.9?[1,0,0]:[0,1,0])),t2=crs(n0,t1);
 const th=r()*TAU,cs=Math.cos(th),sn=Math.sin(th),h=sz/2;
 const rr=[(t1[0]*cs+t2[0]*sn)*h,(t1[1]*cs+t2[1]*sn)*h,(t1[2]*cs+t2[2]*sn)*h],uu=[(t2[0]*cs-t1[0]*sn)*sz,(t2[1]*cs-t1[1]*sn)*sz,(t2[2]*cs-t1[2]*sn)*sz];
 card(g,[pos[0]-uu[0]/2,pos[1]-uu[1]/2,pos[2]-uu[2]/2],rr,uu,Z3,r()<.5?LA:LB,ctr,.8,ao*.92,ao*1.08,W1,H,.4,1,1,0);}
function fin(g){const b=new THREE.BufferGeometry();b.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));b.setAttribute('normal',new THREE.Float32BufferAttribute(g.n,3));
 b.setAttribute('uv',new THREE.Float32BufferAttribute(g.u,2));b.setAttribute('color',new THREE.Float32BufferAttribute(g.c,3));b.setAttribute('aW',new THREE.Float32BufferAttribute(g.w,3));b.setIndex(g.i);return b;}

// ======================= (4) archetypes (unit height, base at y=0) =======================
// conifer: tapered trunk, tiers of rolled drooping needle cards shrinking upward, crossed leader tip
function conifer(r,lod){const g=GB(),nT=lod?4:(HI?7:5);tube(g,[0,0,0],[0,.95,0],.034,.006,lod?4:7,BARKC,1);
 for(let i=0;i<nT;i++){const t=i/(nT-1),y=.17+.66*t+(r()-.5)*.03,len=(.30*(1-t)+.075)*(.85+.3*r()),y0=r()*TAU,kt=.88+.24*r();
  const nc=lod?3:Math.max(3,(HI?5:3)+((r()*2)|0)-(t>.7?1:0));
  for(let c=0;c<nc;c++){const a=y0+c*TAU/nc+(r()-.5)*.5,dx=Math.cos(a),dz=Math.sin(a),l=len*(.8+.4*r()),w=l*.45,ro=(c&1?1:-1)*(.45+.5*r()),cr=Math.cos(ro)*w,sr=Math.sin(ro)*w;
   card(g,[dx*.01,y,dz*.01],[-dz*cr,sr,dx*cr],[dx*l,l*.14,dz*l],[0,-l*(.28+.3*r()),0],NE,[0,y-.3,0],.6,.55*kt,1.05*kt,W1,1,.15,1,lod?1:2,0);}}
 for(let c=0;c<2;c++){const a=r()*TAU+c*1.57;card(g,[0,.74,0],[Math.cos(a)*.07,0,Math.sin(a)*.07],[0,.28,0],Z3,NE,[0,.5,0],.5,.8,1.15,W1,1,.5,1,1,0);}
 return fin(g);}
// broadleaf family: trunk + limbs + leaf-cluster cards on a lumpy crown (lobes), AO toward the interior, optional muted fruit dots
function crown(r,o){const g=GB(),H=1,ctr=[0,o.cy,0],L=[];
 for(let i=0;i<o.lobes;i++){const a=r()*TAU,d=o.lobes>1?o.rx*.38:0;L.push([Math.cos(a)*d,o.cy+(o.lobes>1?(r()-.5)*o.ry*.5:0),Math.sin(a)*d]);}
 if(o.th>0){tube(g,[0,0,0],[0,o.th+.1,0],o.tr,o.tr*.6,o.sides,BARKC,H);
  for(let i=0;i<o.limbs;i++){const l=L[i%L.length],a=r()*TAU;
   tube(g,[0,o.th*(.7+.3*r()),0],[l[0]+Math.cos(a)*o.rx*.3,l[1]+o.ry*.2,l[2]+Math.sin(a)*o.rx*.3],o.tr*.45,o.tr*.15,5,BARKC,H);}}
 const k=o.lobes>1?.68:1;
 for(let i=0;i<o.n;i++){const l=L[i%L.length],d=nrm([r()-.5,r()*1.1-.35,r()-.5]),q=.78+.22*r();
  const pos=[l[0]+d[0]*o.rx*k*q,l[1]+d[1]*o.ry*k*q,l[2]+d[2]*o.rx*k*q];
  const ao=(.5+.5*c01(Math.hypot(pos[0],pos[1]-o.cy,pos[2])/o.rx))*(.85+.3*r())+.1*d[1];
  leafCard(g,r,pos,d,o.sz*(.8+.4*r()),ctr,ao,H);}
 for(let i=0;i<(o.fruit||0);i++){const d=nrm([r()-.5,r()*.8-.3,r()-.5]),p=[d[0]*o.rx*.95,o.cy+d[1]*o.ry*.95,d[2]*o.rx*.95];
  card(g,[p[0],p[1]-.016,p[2]],[.016,0,0],[0,.032,0],Z3,BK,ctr,.8,.9,1,FRUITC,H,0,0,1,1);card(g,[p[0],p[1]-.016,p[2]],[0,0,.016],[0,.032,0],Z3,BK,ctr,.8,.9,1,FRUITC,H,0,0,1,1);}
 return fin(g);}
// hedge step: cards on a rounded elongated volume (local x = line direction, x in -.5..+.5, height 1, depth 1)
function hedge(r,lod){const g=GB(),n=lod?5:(HI?14:8);
 for(let i=0;i<n;i++){const x=(i+.5)/n-.5+(r()-.5)*.12,ph=(r()*2-1)*1.85,cs=Math.cos(ph),sn=Math.sin(ph);
  leafCard(g,r,[x*1.05,.5+.46*cs*(.8+.2*r()),.5*sn],[x*.5,cs,sn],(lod?1.05:.8)*(.8+.4*r()),[x*.6,.3,0],(.62+.38*c01(.5+.5*cs))*(.85+.3*r()),3.3);}
 return fin(g);}
// grass clump: crossed blade-strip cards, normals bent up so the clump shades like the ground it stands on
function tuft(r){const g=GB(),n=HI?3:2;
 for(let i=0;i<n;i++){const a=i*Math.PI/n+r()*.5;card(g,[(r()-.5)*.1,0,(r()-.5)*.1],[Math.cos(a)*.42,0,Math.sin(a)*.42],[(r()-.5)*.3,1,(r()-.5)*.3],Z3,BL,[0,-2,0],.85,.6,1.1,W1,1,0,0,1,0);}
 return fin(g);}
function geos(){const r=FA.rng(9173),n=(a,b)=>HI?a:b;
 GEO.conifer=[conifer(r,false),conifer(r,true)];
 GEO.broad=[crown(r,{th:.36,cy:.66,rx:.40,ry:.30,n:n(30,15),sz:.36,lobes:3,limbs:3,tr:.042,sides:8}),crown(r,{th:.36,cy:.66,rx:.36,ry:.28,n:7,sz:.52,lobes:1,limbs:0,tr:.042,sides:4})];
 GEO.park=[crown(r,{th:.40,cy:.69,rx:.25,ry:.28,n:n(22,11),sz:.26,lobes:1,limbs:2,tr:.03,sides:7}),crown(r,{th:.40,cy:.69,rx:.24,ry:.27,n:6,sz:.38,lobes:1,limbs:0,tr:.03,sides:4})];
 GEO.orchard=[crown(r,{th:.28,cy:.60,rx:.42,ry:.30,n:n(16,9),sz:.38,lobes:2,limbs:3,fruit:n(6,3),tr:.045,sides:7}),crown(r,{th:.28,cy:.60,rx:.38,ry:.28,n:5,sz:.56,lobes:1,limbs:0,tr:.045,sides:4})];
 GEO.hedge=[hedge(r,false),hedge(r,true)];
 GEO.shrub=[crown(r,{th:0,cy:.42,rx:.44,ry:.42,n:n(10,6),sz:.5,lobes:1}),crown(r,{th:0,cy:.42,rx:.42,ry:.40,n:4,sz:.7,lobes:1})];
 GEO.tuft=[tuft(r),null];}

// ======================= (5) API: prepare / add =======================
function prepare(){PF.on=false;
 try{if(!FA.R||!FA.rng||!FA.H)throw new Error('engine not ready');const L=FA.LOOK||{};BLUE=!(L.pc&&L.pc.mood==='day');HI=FA.Q!=='low';RN=HI?28:20;
  REC.length=0;bake();palette();mats();geos();PF.info.tier=FA.Q||'high';PF.on=true;}
 catch(e){errs().push('proflora:prepare:'+(e&&e.message));PF.on=false;}
 return PF.on;}
function add(kind,x,y,z,s,sy,ry,hex,ang){if(!PF.on||(!KM[kind]&&kind!=='hedge'&&kind!=='tuft'&&kind!=='clump'))return false;
 REC.push([kind,x,y,z,s==null?1:s,sy,ry||0,hex,ang]);return true;}

// ======================= (6) expand records into per-archetype instance lists =======================
// instance entry: [x,y,z,sx,sy,sz,ry,r,g,b,leanX,leanZ]
function tint(kind,hint,r){const P=PAL[kind],c=TC.set(P[(r()*P.length)|0]);
 if(hint!=null){if(hint.isColor)TH.copy(hint);else if(Array.isArray(hint))TH.setRGB(hint[0],hint[1],hint[2]);else TH.set(hint);c.lerp(TH,.45);}
 return c.multiplyScalar(.85+.3*r());}
const nearC=(x,z,c)=>!!c&&Math.hypot(x-c.x,z-c.z)<RN;
function expand(){const R=FA.rng(7711),H=FA.H;for(const k of KINDS)IL[k]=[];
 const tree=(k,x,y,z,W,Hh,ry,hint,lean)=>{const c=tint(k,hint,R),sx=W/NW[k];
  IL[k].push([x,(y==null?H(x,z):y)-.03,z,sx,Hh,sx,ry,c.r,c.g,c.b,lean?(R()-.5)*.12:0,lean?(R()-.5)*.12:0]);};
 // a multi-tree spot (KayKit treesA/treesB stamp or a far-field spot): 2-5 mixed trees, bigger toward the middle
 const clump=(x,z,w,ao)=>{const n=w>1.2?3+((R()*3)|0):2+((R()*2)|0);
  for(let i=0;i<n;i++){const a=R()*TAU,d=Math.sqrt(R())*w*.42,con=R()<.6,hh=w*(.5+.35*R())*(con?1.15:1)*(1.1-.2*d/(w*.42+.01));
   tree(con?'conifer':'broad',x+Math.cos(a)*d,null,z+Math.sin(a)*d,hh*(con?.46:.85),hh,R()*TAU,null,true);}
  if(ao&&FA.AOS)FA.AOS.push({x:x,z:z,r:w*.62+.3,k:.3});};
 const tuftAt=(x,z,hex,sc)=>{if(!nearC(x,z,FA.GK)&&!nearC(x,z,FA.RV))return;if(!HI&&FA.hash&&FA.hash(x*1.31,z*.77)>.4)return;
  const hh=Math.min(.24,.1+.14*(sc||.45)*(.6+.8*R())),c=tint('tuft',hex,R),w=hh*1.3;IL.tuft.push([x,H(x,z)-.01,z,w,hh,w,R()*TAU,c.r,c.g,c.b,0,0]);};
 for(const e of REC){const k=e[0],x=e[1],y=e[2],z=e[3],s=e[4],sy=e[5]==null?s:e[5];
  if(k==='clump')clump(x,z,s,true);
  else if(k==='hedge'){const c=tint(k,e[7],R);IL.hedge.push([x,(y==null?H(x,z):y)-.02,z,.46,sy*2,.24+.06*R(),(e[8]||0)+e[6],c.r,c.g,c.b,0,0]);}
  else if(k==='tuft')tuftAt(x,z,e[7],s);
  else{const m=KM[k];tree(k,x,y,z,m[0]*s,m[1]*sy,e[6],e[7],k!=='park');if(k!=='park'&&FA.AOS)FA.AOS.push({x:x,z:z,r:m[0]*s*.55+.15,k:.3});}}
 for(const t of FA.FARTREES||[])clump(t.x,t.z,t.w,false);            // scatter already pushed their contact decals
 for(const t of FA.tuftList||[])tuftAt(t[0],t[1],t[2],t[3]);}

// ======================= (7) instanced meshes + LOD sets =======================
function mkIM(geo,list,cast,grass){const n=list.length,im=new THREE.InstancedMesh(geo,grass?MATG:MAT,n),cc=new Float32Array(n*3);
 for(let i=0;i<n;i++){const e=list[i];EU.set(e[10],e[6],e[11],'YXZ');Q4.setFromEuler(EU);M4.compose(V3.set(e[0],e[1],e[2]),Q4,S3.set(e[3],e[4],e[5]));im.setMatrixAt(i,M4);cc[i*3]=e[7];cc[i*3+1]=e[8];cc[i*3+2]=e[9];}
 im.instanceMatrix.needsUpdate=true;im.instanceColor=new THREE.InstancedBufferAttribute(cc,3);
 im.castShadow=!!cast;im.receiveShadow=true;im.frustumCulled=false;if(cast)im.customDepthMaterial=DEP;im.name='pf_flora';FA.SC.add(im);ALL.push(im);return im;}
// per archetype: m1 = LOD of [others | near GK] (count switches the near-GK tail off in the GK close-up), m2 = LOD of [near RV],
// ng / nr = full-card sets near Gatekeeper / Reversion (visible only in that close-up). Tufts have no LOD set (none in the world view).
function meshes(){for(const k of KINDS){const L=IL[k];if(!L||!L.length)continue;const O=[],G=[],V=[];
  for(const e of L)(nearC(e[0],e[2],FA.GK)?G:nearC(e[0],e[2],FA.RV)?V:O).push(e);
  const s=SETS[k]={n0:O.length,n1:O.length+G.length,g:G.length,v:V.length,big:k==='conifer'||k==='broad'},tf=k==='tuft';
  if(!tf){if(s.n1)s.m1=mkIM(GEO[k][1],O.concat(G),s.big);if(V.length)s.m2=mkIM(GEO[k][1],V,s.big);}
  if(G.length)s.ng=mkIM(GEO[k][0],G,!tf,tf);if(V.length)s.nr=mkIM(GEO[k][0],V,!tf,tf);}}
// last resort: the old look (faceted crowns + trunks, 2 instanced draws) so nothing disappears
function fallback(){const L=[];for(const k of KINDS)if(k!=='tuft'&&IL[k])for(const e of IL[k])L.push(e);if(!L.length)return;
 const cn=new THREE.ConeGeometry(.36,.78,6);cn.translate(0,.6,0);const tk=new THREE.CylinderGeometry(.03,.045,.3,5);tk.translate(0,.15,0);
 const mk=(g,m,tr)=>{const im=new THREE.InstancedMesh(g,m,L.length);L.forEach((e,i)=>{Q4.setFromAxisAngle(V3.set(0,1,0),e[6]);M4.compose(V3.set(e[0],e[1],e[2]),Q4,S3.set(e[3],e[4],e[5]));im.setMatrixAt(i,M4);
   im.setColorAt(i,tr?TC.setRGB(.06,.045,.035):TC.setRGB(e[7],e[8],e[9]));});im.castShadow=im.receiveShadow=true;im.frustumCulled=false;FA.SC.add(im);};
 mk(cn,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.9,flatShading:true}),false);mk(tk,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.9,flatShading:true}),true);
 PF.info.fallback=L.length;}
function stats(){const tr=g=>g?g.index.count/3:0;let w=0,cg=0,cr=0,dw=0,dg=0,dr=0;
 for(const k in SETS){const s=SETS[k],lt=tr(GEO[k][1]),ft=tr(GEO[k][0]);
  w+=lt*(s.n1+(s.m2?s.v:0));dw+=(s.m1?1:0)+(s.m2?1:0);
  cg+=lt*(s.m1?s.n0:0)+lt*(s.m2?s.v:0)+ft*s.g;dg+=(s.m1&&s.n0?1:0)+(s.m2?1:0)+(s.ng?1:0);
  cr+=lt*(s.m1?s.n1:0)+ft*s.v;dr+=(s.m1?1:0)+(s.nr?1:0);}
 const counts={};for(const k of KINDS)counts[k]=IL[k]?IL[k].length:0;
 PF.info.draws={world:dw,close:Math.max(dg,dr)};PF.info.tris={world:Math.round(w),close:Math.round(Math.max(cg,cr))};PF.info.counts=counts;}

// ======================= (8) API: build / setView / moving =======================
function build(){const t0=now();if(!PF.on)return PF.info;
 try{expand();meshes();stats();}
 catch(e){errs().push('proflora:build:'+(e&&e.message));
  for(const m of ALL)FA.SC.remove(m);ALL.length=0;for(const k in SETS)delete SETS[k];
  try{fallback();}catch(e2){errs().push('proflora:fallback:'+(e2&&e2.message));}}
 FA.FARTREES=[];FA.tuftList=[];REC.length=0;
 PF.info.buildMs=Math.round(now()-t0);PF.info.tier=FA.Q||'high';if(FA.VIEW)setView();return PF.info;}
function setView(){if(!PF.on)return;const cl=FA.VIEW==='close',g=cl&&FA.CITY==='gatekeeper',r=cl&&FA.CITY==='reversion';
 for(const k in SETS){const s=SETS[k];
  if(s.m1){s.m1.count=g?s.n0:s.n1;s.m1.visible=s.m1.count>0;}
  if(s.m2)s.m2.visible=!r;if(s.ng)s.ng.visible=g;if(s.nr)s.nr.visible=r;}
 FA.shadowDirty=true;}
function moving(){if(!PF.on||FA.VIEW!=='close'||!FA.TU||!(FA.TU.uAn.value>0)||!(PF.uWind.value>0))return false;
 const g=FA.CITY==='gatekeeper';for(const k in SETS){const s=SETS[k];if(g?s.ng:s.nr)return true;}return false;}
})();
