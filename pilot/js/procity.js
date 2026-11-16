// Futures Atlas v4.5 PILOT - procity.js : Checkpoint B0. Procedural arch-viz future city for Gatekeeper (style=archviz only).
// Concentric master plan around the eye spire: plaza, ring canal + piers, boulevard, four districts (glass-tower grid,
// composite slabs + twisted tower, honeycomb pavilions, garden + ribbed dome), monorail truss ring, outer ring road,
// thin sensor rail. GPU-baked texture families projected in world space (works on instanced geometry, no uv attributes).
// Everything is generated in code; no external assets; no third-party code. Classic script, uses globals THREE + FA.
// Written by Fable 5.2 (review/fable_procity_20261115_2015.md + _cont_20261115_2029.md); copied verbatim, integration fixes marked 'B1 fix'.
(function(){
'use strict';
const FA=window.FA;if(!FA||!window.THREE)return;
const L=FA.LOOK,SC=FA.SC,R=FA.R,C=h=>new THREE.Color(h);
const P=Object.assign({R:21.5,lit:1,line:1,mood:'blue'},L.pc||{});
const PC=FA.PROCITY={mood:P.mood,info:{},build:build};
// plan radii (units): canal 5.0-7.6, boulevard 9.2-10.6, districts to 17.6, outer road to 19.2, monorail 15.6
const RC0=5.0,RC1=7.6,RB0=9.2,RB1=10.6,RD=17.6,RO1=19.2,RM=15.6,AW=.7,FLR=.4,BAY=.5,TAU=Math.PI*2;
const UP=new THREE.Vector3(0,1,0),m4=new THREE.Matrix4(),v3=new THREE.Vector3(),q4=new THREE.Quaternion(),s3=new THREE.Vector3(),W1=[1,1,1];
let cx=0,cz=0,Y=0,rnd=null,TEX=null,stats=null;const M={},B={},G={},KO=[];
const col=(h,k)=>{const c=C(h);k=k==null?1:k;return[c.r*k,c.g*k,c.b*k];};
const fl=n=>Math.max(FLR,Math.round(n/FLR)*FLR);
const rot=(ox,oz,ry)=>[ox*Math.cos(ry)+oz*Math.sin(ry),-ox*Math.sin(ry)+oz*Math.cos(ry)];
const pt=(r,a,y)=>new THREE.Vector3(cx+Math.cos(a)*r,y,cz+Math.sin(a)*r);
const free=(x,z,rad)=>{for(const k of KO)if(Math.hypot(x-k[0],z-k[1])<k[2]+rad)return false;return true;};
let SIL,DARK;const NNC={};

// ======================= (1) GPU texture bake =======================
const BAKE_FS=[
'uniform int fam;varying vec2 vU;',
'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'float pn(vec2 p,vec2 q){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(mod(i,q)),h1(mod(i+vec2(1.,0.),q)),f.x),mix(h1(mod(i+vec2(0.,1.),q)),h1(mod(i+vec2(1.,1.),q)),f.x),f.y);}',
'void main(){vec2 u=vU;vec4 c=vec4(1.);',
// 0 composite panels (tile 4u): 0.8 x 0.4 panels, hairline joints, +-4 % tone, ~7 % dark panels. rgb albedo factor, a joint mask
' if(fam==0){vec2 g=u*vec2(5.,10.);vec2 id=floor(g);vec2 f=fract(g)*vec2(.8,.4);float dj=min(min(f.x,.8-f.x),min(f.y,.4-f.y));float j=smoothstep(.008,.022,dj);',
'  float tone=(.94+.08*h1(id+2.3))*mix(1.,.42,step(.93,h1(id+9.1)));c=vec4(vec3(tone*(.985+.03*pn(u*24.,vec2(24.))))*mix(.5,1.,j),j);}',
// 1 curtain wall (tile 4u): 8 bays x 10 floors. r frame mask, g interior brightness (ceiling gradient, blinds), b spandrel, a cell random
' else if(fam==1){vec2 g=u*vec2(8.,10.);vec2 id=floor(g);vec2 f=fract(g);float mu=1.-smoothstep(.05,.08,min(f.x,1.-f.x));float tr=1.-smoothstep(.06,.10,min(f.y,1.-f.y));',
'  float sp=1.-smoothstep(.2,.24,f.y);float r=h1(id+4.7);float be=1.-.6*h1(id+5.);float blind=mix(1.,.45,step(.55,h1(id+11.3))*smoothstep(be,be+.03,f.y));',
'  float it=(.45+.55*r)*mix(.35,1.,smoothstep(.2,.95,f.y))*blind*(1.-.75*sp);c=vec4(max(mu,tr),it,sp,r);}',
// 2 PV cells (tile 2u): 0.25 cells, silver grid + fine busbars
' else if(fam==2){vec2 g=u*8.;vec2 id=floor(g);vec2 f=fract(g);float ln=1.-smoothstep(.03,.07,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));float bb=(1.-smoothstep(.0,.03,abs(fract(f.y*3.)-.5)))*.25;',
'  vec3 cell=vec3(.035,.10,.26)*(.8+.4*h1(id+1.9));c=vec4(mix(cell,vec3(.5,.55,.62),max(ln,bb)),ln);}',
// 3 asphalt grain (tile 4u)
' else if(fam==3){float n=pn(u*32.,vec2(32.))*.5+pn(u*96.,vec2(96.))*.5;c=vec4(vec3(.85+.3*n),1.);}',
// 4 turf (tile 4u): mottle + mow stripes
' else if(fam==4){float n=pn(u*6.,vec2(6.))*.5+pn(u*40.,vec2(40.))*.5;float st=.97+.06*step(.5,fract(u.y*4.));c=vec4(vec3(.8+.35*n)*st*vec3(1.,1.,.88),1.);}',
// 5 honeycomb paving (tile 3 x 3.464u): hexes 0.5 wide, 3 flat tones, dark joints
' else{vec2 p=u*vec2(6.,6.9282032);vec2 r=vec2(1.,1.7320508);vec2 h=r*.5;vec2 a=mod(p,r)-h;vec2 b=mod(p-h,r)-h;vec2 g=dot(a,a)<dot(b,b)?a:b;',
'  float d=max(abs(g.x),dot(abs(g),vec2(.5,.8660254)));vec2 id=p-g;vec2 ci=mod(vec2(floor(id.x*2.+.5),floor(id.y/.8660254+.5)),vec2(12.,8.));',
'  float j=1.-smoothstep(.44,.475,d);float tone=.9+.1*floor(h1(ci+3.3)*3.)/2.;c=vec4(vec3(tone)*mix(.55,1.,j),j);}',
' gl_FragColor=c;}'].join('\n');
let BAKED=null;   // B1 r5: the bake is seed-independent (shader + family uniform only) -> bake once, reuse for every stand-in (was 6 new RTs + GPU stall per build)
function bake(){if(BAKED){TEX=BAKED;PC.info.bakeMs=0;return;}const t0=performance.now(),sc=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const mat=new THREE.ShaderMaterial({uniforms:{fam:{value:0}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:BAKE_FS,depthTest:false,depthWrite:false});
 const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);q.frustumCulled=false;sc.add(q);const prev=R.getRenderTarget();TEX=[];
 [512,512,256,256,256,512].forEach((N,f)=>{const rt=new THREE.WebGLRenderTarget(N,N,{depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.RepeatWrapping,wrapT:THREE.RepeatWrapping,anisotropy:4});
  mat.uniforms.fam.value=f;R.setRenderTarget(rt);R.render(sc,cam);TEX.push(rt.texture);});
 R.setRenderTarget(prev);mat.dispose();q.geometry.dispose();BAKED=TEX;PC.info.bakeMs=Math.round(performance.now()-t0);}

// ======================= (2) world-space materials =======================
// The baked family is sampled in the fragment shader from the world position (vFogWP, provided by the patched fog chunks,
// instancing-aware): vertical faces use (distance along the face tangent, height above deck), horizontal faces use xz.
const WS_HEAD='uniform sampler2D pcT;uniform vec4 pcS;uniform vec2 pcO;uniform vec3 pcC;uniform float uT,uAn;\nfloat pcH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
 'float pcN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(pcH(i),pcH(i+vec2(1.,0.)),f.x),mix(pcH(i+vec2(0.,1.)),pcH(i+vec2(1.,1.)),f.x),f.y);}\n'+
 'float pcBand(float rr,float ang,float rc,float hw,float fw){float dr=abs(rr-rc);float e=1.-smoothstep(.025,.025+fw,abs(dr-(hw-.12)));float d=step(fract(ang*rc/1.3),.45)*(1.-smoothstep(.022,.022+fw,dr));return max(e,d)*step(dr,hw);}\n';
const WS_PRE='vec3 nW=inverseTransformDirection(normal,viewMatrix);vec3 wp=vFogWP;wp.xz-=pcO;wp.y-=pcS.z;float tp=step(.6,abs(nW.y));vec2 tg=normalize(vec2(-nW.z,nW.x)+vec2(1e-4,0.));\n'+
 'vec2 q=mix(vec2(dot(wp.xz,tg),wp.y),wp.xz,tp);vec4 tx=texture2D(pcT,q*pcS.xy);float ao=mix(.5+.5*smoothstep(0.,1.2,wp.y),1.,tp);\n#ifdef USE_COLOR\nvec3 vc=vColor.rgb;\n#else\nvec3 vc=vec3(1.);\n#endif\n';
const f2=v=>v.toFixed(3);
const WS_KIND={
 // B2 (Fable crit fix 2): fine vertical fin engraving on composite faces; glass: darker panes, hashed lit floors with HDR warmth
 comp:'diffuseColor.rgb=pcC*vc*tx.rgb*ao;roughnessFactor=mix(.72,.5,tx.a);\n'+
  'float en=(1.-tp)*step(.84,fract(q.x*4.))*smoothstep(.5,.15,fwidth(q.x)*4.);diffuseColor.rgb*=1.-.22*en;',
 flat:'diffuseColor.rgb=pcC*vc*tx.rgb*ao;',
 // asphalt: baked grain + analytic lane markings (polar on the two ring roads, axial on the avenues), fwidth-antialiased
 asph:'diffuseColor.rgb=pcC*tx.rgb;vec2 fwv=fwidth(wp.xz);float fw=max(fwv.x,fwv.y)+1e-4;float rr=length(wp.xz);float ang=atan(wp.z,wp.x);\n'+
  'float b1=step(abs(rr-'+f2((RB0+RB1)/2)+'),'+f2((RB1-RB0)/2)+');float b2=step(abs(rr-'+f2((RD+RO1)/2)+'),'+f2((RO1-RD)/2)+');\n'+
  'float mk=max(pcBand(rr,ang,'+f2((RB0+RB1)/2)+','+f2((RB1-RB0)/2)+',fw),pcBand(rr,ang,'+f2((RD+RO1)/2)+','+f2((RO1-RD)/2)+',fw));\n'+
  'float ax=min(abs(wp.x),abs(wp.z));float al=max(abs(wp.x),abs(wp.z));float av=max(1.-smoothstep(.025,.025+fw,abs(ax-'+f2(AW-.1)+')),step(fract(al/1.3),.45)*(1.-smoothstep(.022,.022+fw,ax)))*(1.-max(b1,b2));\n'+
  'mk=max(mk,av)*(.07/(.07+fw))*tp;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.73,.74),mk);roughnessFactor=mix(roughnessFactor,.6,mk);'+
  // C2b (blue hour) wet asphalt: low roughness with puddle-like low-frequency patches -> sky + lamp pools land with a soft sheen
  (P.mood!=='day'?'{float wn=pcN(wp.xz*.55)*.65+pcN(wp.xz*2.3+7.)*.35;float wt=smoothstep(.40,.72,wn)*(1.-mk);roughnessFactor=mix(.46,.17,wt);metalnessFactor=mix(.10,.30,wt);diffuseColor.rgb*=mix(1.,.74,wt);}':''),
 // curtain wall: mullions/transoms, sky-reflecting glass, hashed warm interiors per floor + per unit (seed = instance colour r)
 // C1: per-building lit-floor share hashed 40-70 % (whole floors on/off around the building), a few units lit on dark floors,
 // amber 2700-3000 K (linear rgb), far-field value keeps the floor mask instead of a uniform 0.34 glow (which read as 100 % lit)
 glass:'vec2 cs=vec2('+f2(BAY)+','+f2(FLR)+');vec2 cid=floor(q/cs);float sd=floor(vc.r*997.);float face=pcH(floor(nW.xz*4.+.5)+sd);\n'+
  'float frac=(.26+.28*pcH(vec2(sd*.37+1.3,7.1)))*mix(1.,.30,step(pcH(vec2(sd*.13,3.7)),.20))*(1.-.45*smoothstep(2.4,6.5,wp.y));float hF=pcH(vec2(cid.y*1.13+.7,sd*.71));float hC=pcH(cid+vec2(sd*1.7,face*57.));float on=step(hF,frac);float lit=step(hC,mix(.05,.52,on));\n'+
  // C2: sparse window life - each unit re-rolls every 6 s (staggered phase); ~0.05 % flip on/off at any moment -> a change every few seconds in frame
  'lit=abs(lit-step(.9995,pcH(cid*vec2(.37,.91)+vec2(sd,floor(uT*uAn/6.+hC*11.)))*uAn));\n'+
  'float fwq=max(fwidth(q.x)/cs.x,fwidth(q.y)/cs.y);float kk=smoothstep(.7,.3,fwq);float fr=tx.r;float inten=tx.g*(.6+.8*pcH(cid.yx+sd));\n'+
  'float em=mix(on*.30+.04,lit*inten,kk)*(1.-fr)*pcS.w*(1.-tp);vec3 warm='+(P.mood!=='day'?'mix(vec3(1.,.44,.14),vec3(1.,.52,.21),pcH(cid+sd+3.))':'mix(vec3(1.,.62,.32),vec3(1.,.74,.48),pcH(cid+sd+3.))')+';\n'+
  'vec3 gl=pcC*vc.g*mix(1.,.7,tx.b);diffuseColor.rgb=mix(gl,vec3(.30,.31,.33),fr)*ao;metalnessFactor=mix(.92,.4,fr)*(1.-.6*lit*kk*pcS.w);roughnessFactor=mix(.08+.1*tx.a,.45,fr);\n'+
  'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.10,.105,.12),tp);metalnessFactor=mix(metalnessFactor,0.,tp);roughnessFactor=mix(roughnessFactor,.8,tp);totalEmissiveRadiance+=warm*em*'+(P.mood!=='day'?'1.55':'3.4')+';', // C2b: x2.4 -> x1.55 (-35 %)
 // C2b plaza paving: hex tones + low-frequency mottle + ~6 % replaced slabs, so the deck is not one uniform tone
 pave:'float pm=pcN(q*.42)*.6+pcN(q*1.7+3.1)*.4;float rp=step(.94,pcH(floor(q*1.15)+.5));diffuseColor.rgb=pcC*vc*tx.rgb*ao*(.84+.26*pm)*mix(1.,.86,rp);roughnessFactor=mix(.86,.62,pm);'
};
function wsMat(kind,ti,hex,tile,o){o=o||{};const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:o.rough!=null?o.rough:.7,metalness:o.metal||0,envMapIntensity:o.env!=null?o.env:1,flatShading:true,side:o.side||THREE.FrontSide});
 if(o.po){m.polygonOffset=true;m.polygonOffsetFactor=-o.po;m.polygonOffsetUnits=-2*o.po;}
 const U={pcT:{value:TEX[ti]},pcS:{value:new THREE.Vector4(1/tile[0],1/tile[1],FA.GK.top,P.lit)},pcO:{value:new THREE.Vector2(FA.GK.x,FA.GK.z)},pcC:{value:C(hex)},uT:FA.TU.uT,uAn:FA.TU.uAn};
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+WS_HEAD)
  .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_FOG\n{'+WS_PRE+WS_KIND[kind]+'}\n#endif\n');
  // C2b: o.spec = [direct, indirect] specular scale (ground decks: the ported cool fill + moon rim made grazing blue glare on the wet road / paving)
  if(o.spec)sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.directSpecular*='+o.spec[0].toFixed(3)+';reflectedLight.indirectSpecular*='+o.spec[1].toFixed(3)+';');};
 m.customProgramCacheKey=()=>'pc_'+kind+(o.spec?'_s'+o.spec.join('_'):'');return m;}
// B2 (Fable crit fix 1): mood-aware palette - blue hour scales IBL (E) and albedo (A) so facades sit below sky luminance
// C1: world.js now caps the blue-hour IBL gain (LOOK.ibl.cap 3.6 instead of 14), so the crush factors are relaxed (E .34 -> .85, A .6 -> .85)
function mats(){const blue=P.mood!=='day',E=P.env!=null?P.env:(blue?.85:1),A=P.alb!=null?P.alb:(blue?.85:1);
 // E scales IBL (the blue-hour iblGain saturates at 14 -> daylight-level ambient), A scales albedo; knobs: LOOK.pc.env / LOOK.pc.alb
 const tone=(h,k)=>C(h).multiplyScalar(k==null?A:k);
 const std=o=>{o.envMapIntensity=(o.envMapIntensity!=null?o.envMapIntensity:1)*E;return new THREE.MeshStandardMaterial(o);};
 const hot=(h,k)=>new THREE.MeshBasicMaterial({color:C(h).multiplyScalar(k),polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});
 M.comp=wsMat('comp',0,tone('#D6D3CD'),[4,4],{rough:.6,env:E});
 M.glass=wsMat('glass',1,tone('#5F7690',blue?.75:1),[4,4],{rough:.12,metal:.9,env:blue?.5:1.15});
 M.pv=wsMat('flat',2,tone('#FFFFFF',blue?.8:1),[2,2],{rough:.25,metal:.5,env:blue?.5:1.2,side:THREE.DoubleSide});
 M.asph=wsMat('asph',3,tone('#34373E',blue?.7:1),[4,4],{rough:blue?.4:.85,po:1,env:blue?1.25*E:E,spec:blue?[.12,.75]:null}); // C2b: wet sheen in blue hour (env sheen, direct glare cut)
 M.turf=wsMat('flat',4,tone('#5E7A48'),[4,4],{rough:.95,env:.6*E,po:2});
 M.pave=wsMat(blue?'pave':'flat',5,tone('#A9A6A2',blue?.5:1),[3,3.4641016],{rough:.8,env:.8*E,spec:blue?[.25,.8]:null}); // C2b: 'pave' = mottled tones
 M.shell=std({color:tone('#D0CDC8',blue?.72:1),roughness:.38,metalness:.05});
 M.base=std({color:tone('#8E9098',blue?.38:.8),roughness:.5,metalness:.1});
 M.quay=std({color:tone('#7C7F88'),roughness:.7,side:THREE.DoubleSide});
 M.metal=std({color:tone('#ffffff'),roughness:.36,metalness:.65,envMapIntensity:1.1});
 M.dome=std({color:tone('#8FA6C0',blue?.8:1),roughness:.1,metalness:.9,envMapIntensity:blue?1.5:1.2});
 M.paint=std({color:tone('#ffffff'),roughness:.45,metalness:.1});
 M.tree=std({color:tone('#ffffff',blue?.72:1),vertexColors:true,roughness:.9,flatShading:true,envMapIntensity:blue?1.0:.7}); // C2b: .5 -> .72 + more cool env fill (trees no longer black blobs)
 M.solar=std({color:tone('#ffffff'),vertexColors:true,roughness:.3,metalness:.3,flatShading:true});
 M.plate=std({color:'#090B10',roughness:blue?.62:.16,metalness:blue?.45:.8,envMapIntensity:blue?.8:1.3}); // C1: was 2.6 (read as a glowing cobalt rim once the IBL gain cap and E were fixed)
 // C2 wrap-up: blue hour roughness .16 -> .62, metal .8 -> .45: the ported v4.4 cool fill (#6A8EE6, world.js A.fill) put a grazing specular
 // streak on the glossy apron ring that saturated (~(130,155,242), >240 blue) over ~17k px at the bottom of the close-up - more than the spire
 // C1: amber 2700-3000 K light lines / crowns with HDR headroom (> bloom threshold 1.15) in blue hour; day keeps the old cream
 // C2 lighting hierarchy (blue hour): tier 1 = spire collars / spire crown / eye (M.collar, M.spireW, iris), tier 2 = windows,
 // street lamps, building crowns (M.crown 2.3 -> 1.8, glass x3.0 -> x2.4), tier 3 = ring / road / canal light lines (M.warm 1.7 -> 1.0,
 // M.cool 1.5 -> .9). Bloom threshold is .80 (world.js), so tier 3 barely blooms and tier 1 blooms most.
 M.warm=blue?hot('#FFB468',.75*P.line):hot('#FFE0B4',1.25*P.line);M.cool=hot(L.ai,(.4+1.1*P.lit)*(blue?.6:1));M.crown=blue?hot('#FFA858',1.25*P.lit):hot('#FFD9A8',.35+2.3*P.lit); // C2b: warm 1.0 -> .75, crown 1.8 -> 1.25
 M.collar=blue?hot('#E2F7FF',5.0):M.cool;M.spireW=blue?hot('#FFC27E',4.2):M.warm;
 M.eyeRim=blue?hot('#CFF6FF',9.0):hot('#CFF6FF',1.4); // C2b: self-luminous iris rim + socket hairline = tier 0 (hottest point)
 SIL=[.62,.64,.67];DARK=[.05,.055,.07];}

// ======================= (3) geometry helpers: statics (merged per material) + instanced batches =======================
function S(g,mat,x,y,z,cast,ry){const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=!!cast;m.receiveShadow=true;FA.addStatic(m);return m;}
function ring(r0,r1,y,mat,a0,a1){const full=a0==null;const g=new THREE.RingGeometry(r0,r1,full?128:40,1,full?0:-a1,full?TAU:a1-a0);g.rotateX(-Math.PI/2);return S(g,mat,cx,y,cz,false);}
function strip(a,r0,r1,w,y,mat,off){const g=new THREE.PlaneGeometry(r1-r0,w);g.rotateX(-Math.PI/2);const rm=(r0+r1)/2,o=off||0;
 return S(g,mat,cx+Math.cos(a)*rm-Math.sin(a)*o,y,cz+Math.sin(a)*rm+Math.cos(a)*o,false,-a);}
function tor(r,tube,y,mat,cast,x,z,arc,a0){const g=new THREE.TorusGeometry(r,tube,4,arc?48:Math.max(24,Math.round(r*9)),arc||TAU);g.rotateX(Math.PI/2);return S(g,mat,x==null?cx:x,y,z==null?cz:z,cast,a0?-a0:0);}
function strut(a,b,r,mat){const d=new THREE.Vector3().subVectors(b,a),l=d.length();const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,4,1,true),mat);
 m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(UP,d.normalize());m.castShadow=true;m.receiveShadow=true;FA.addStatic(m);}
function mergeG(parts){const pos=[],nor=[],cc=[];for(const pr of parts){const g=pr[0].index?pr[0].toNonIndexed():pr[0],c=pr[1],p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(n.getX(i),n.getY(i),n.getZ(i));cc.push(c[0],c[1],c[2]);}}
 const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));o.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));return o;}
function batch(geo,mat,cast){const MM=[],CC=[];return{n:0,
 add(x,y,z,sx,sy,sz,ry,c){m4.compose(v3.set(x,y,z),q4.setFromAxisAngle(UP,ry||0),s3.set(sx,sy,sz));for(let i=0;i<16;i++)MM.push(m4.elements[i]);c=c||W1;CC.push(c[0],c[1],c[2]);this.n++;},
 done(){if(!this.n)return 0;const im=new THREE.InstancedMesh(geo,mat,this.n);im.instanceMatrix.array.set(MM);im.instanceMatrix.needsUpdate=true;
  im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(CC),3);im.castShadow=cast!==false;im.receiveShadow=true;im.frustumCulled=false;SC.add(im);return this.n;}};}
function geos(){G.box=new THREE.BoxGeometry(1,1,1);G.box.translate(0,.5,0);G.hex=new THREE.CylinderGeometry(1,1,1,6);G.hex.translate(0,.5,0);
 G.rib=new THREE.TorusGeometry(1,.03,4,14,Math.PI);
 const cn=new THREE.IcosahedronGeometry(.3,1);cn.scale(1,1.2,1);cn.translate(0,.62,0);const tk=new THREE.CylinderGeometry(.03,.04,.4,5);tk.translate(0,.2,0);
 G.tree=mergeG([[cn,[1,1,1]],[tk,[.3,.24,.2]]]);
 const st=new THREE.CylinderGeometry(.03,.045,1.1,6);st.translate(0,.55,0);const cp=new THREE.CylinderGeometry(.55,.5,.04,6);cp.rotateX(.14);cp.translate(0,1.12,0);
 G.solar=mergeG([[st,[.6,.62,.65]],[cp,col('#1E3A6E')]]);
 B.glass=batch(G.box,M.glass);B.comp=batch(G.box,M.comp);B.metal=batch(G.box,M.metal);B.paint=batch(G.box,M.paint);B.crown=batch(G.box,M.crown,false);B.pv=batch(G.box,M.pv);
 B.gHex=batch(G.hex,M.glass);B.cHex=batch(G.hex,M.comp);B.tHex=batch(G.hex,M.turf);B.tree=batch(G.tree,M.tree);B.solar=batch(G.solar,M.solar);B.rib=batch(G.rib,M.shell);}
const GREENS=['#4F6B46','#5E7A48','#6F8650','#587350'],GREENS_B=['#434E47','#4A5547','#525B4C','#465048']; // C1: blue-hour greens desaturated
let TC=0;const POOLS=[];
// C1 blue hour: every 2nd tree dropped (~50 % thinner); the rnd() draws are kept so the rest of the layout is unchanged
function tree(x,z,s,y){const blue=P.mood!=='day';const g=col((blue?GREENS_B:GREENS)[(rnd()*4)|0],.85+.3*rnd());const sy=s*(.9+.3*rnd()),ry=rnd()*TAU;
 if(blue&&(TC++&1))return;if(FA.PROFLORA&&FA.PROFLORA.on&&FA.PROFLORA.add('park',x,y==null?Y:y,z,s,sy,ry,g))return;B.tree.add(x,y==null?Y:y,z,s,sy,s,ry,g);} // C5: proflora 'park'
// C1: warm light-pool decal on the deck (additive, 1 instanced draw for all of them; built in buildPools)
// C2: every pool breathes (an = [amp .10-.15, period 4-9 s, phase, switch]); lamp pools share their lamp's glow params
const anOf=(x,z,sw)=>{const h1=FA.hash(x*1.7+.3,z*2.9),h2=FA.hash(z*.7,x*3.3+1.1),h3=FA.hash(x+z*1.3,x-z);return[.10+.05*h1,4+5*h2,h3*6.2832,sw&&h1>.9?1:0];};
function pool(x,z,r,k,y,an,hex){if(P.mood==='day')return;POOLS.push([x,y==null?Y+.06:y,z,r,k,an||anOf(x,z,false),hex||null]);}
const LAMPC=['#FFB866','#FFC47E','#FFAA5A']; // C2: three lamp temperatures (~2700-3300 K), picked by position hash
function lamp(x,z,h,sz){B.metal.add(x,Y,z,.03,h,.03,0,DARK);const hv=FA.hash(x*.71+2.,z*1.31),hx=LAMPC[(hv*3)|0],an=anOf(x,z,true);
 FA.glow(x,Y+h+.05,z,sz||.8,hx,.36*(.85+.3*FA.hash(z*3.7,x*.3)),an);
 // C2b: fewer, larger, softer pools with varied size (~40 % of lamps cast none -> no bead strings); radius x1.5 / k x.5
 const hp=FA.hash(x*2.3+.7,z*.37+5.1);if(P.mood!=='day'&&hp<.40)return;
 pool(x,z,(1.35+2.6*(sz||.8))*(.65+.7*FA.hash(x*3.1,z*1.7)),.33*(.6+.8*FA.hash(z*2.3,x*.9)),null,an,hx);}
function poolTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);
 [[0,1],[.12,.84],[.28,.52],[.46,.26],[.66,.09],[.84,.02],[1,0]].forEach(s=>gr.addColorStop(s[0],'rgba(255,255,255,'+s[1]+')'));g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);} // C2b: gaussian-like falloff (softer edge)
function buildPools(){if(!POOLS.length)return 0;const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
 const m=new THREE.MeshBasicMaterial({color:'#ffffff',map:poolTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8});
 const im=new THREE.InstancedMesh(g,m,POOLS.length),w=C('#FFA45C'),cc=new THREE.Color(),BA=new Float32Array(POOLS.length*4);
 POOLS.forEach((p,i)=>{m4.compose(v3.set(p[0],p[1],p[2]),q4.identity(),s3.set(p[3]*2,1,p[3]*2));im.setMatrixAt(i,m4);im.setColorAt(i,cc.copy(p[6]?C(p[6]):w).multiplyScalar(p[4]*.72));BA.set(p[5],i*4);}); // C2b: all pools x.72
 g.setAttribute('aB',new THREE.InstancedBufferAttribute(BA,4));
 m.onBeforeCompile=sh=>{sh.uniforms.uT=FA.TU.uT;sh.uniforms.uAn=FA.TU.uAn;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;'+FA.BREATH_GLSL+'attribute vec4 aB;varying float vBr;').replace('#include <begin_vertex>','#include <begin_vertex>\nvBr=faBr(aB,uT);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vBr;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=vBr;');};
 m.customProgramCacheKey=()=>'pcPool';
 im.renderOrder=3;im.frustumCulled=false;im.castShadow=im.receiveShadow=false;SC.add(im);return POOLS.length;}

// ======================= (4) ground, roads, base, light lines =======================
function ground(){ring(0,RC0,Y,M.pave);ring(RC1,RB0,Y,M.pave);ring(RB0,RB1,Y,M.asph);ring(RB1,RD,Y,M.pave);ring(RD,RO1,Y,M.asph);ring(RO1,P.R,Y,M.pave);
 // B2 (Fable crit fix 3) model base: thin white lip, recessed dark drum (shadow gap), hairline warm seam under the lip, polished dark plate = table reflection
 const lip=.35;S(new THREE.CylinderGeometry(P.R,P.R,lip,128,1,true),M.shell,cx,Y-lip/2,cz,true);
 S(new THREE.CylinderGeometry(P.R-.14,P.R+.12,Y-lip-2.2,128,1,true),M.base,cx,(Y-lip+2.2)/2,cz,true);
 tor(P.R-.1,.02,Y-lip-.03,M.warm);
 ring(P.R+.1,P.R+1.5,2.7,M.plate);ring(P.R+.26,P.R+.3,2.73,M.warm);
 // thin warm-white light lines: canal edges, both ring roads, deck rim (low intensity; brass stays reserved for the data layer)
 for(const r of[RC0-.07,RC1+.02,RB0,RB1-.05,RD,RO1-.05,P.R-.12])ring(r,r+.05,Y+.04,M.warm);
 // radial avenues (asphalt strips between the ring roads, bridge span included) with light-line edges
 for(let k=0;k<4;k++){const a=k*Math.PI/2;for(const sp of[[RC0-.15,RB0],[RB1,RD],[RO1,P.R]]){strip(a,sp[0],sp[1],AW*2,Y+.02,M.asph);for(const s of[-1,1])strip(a,sp[0],sp[1],.04,Y+.045,M.warm,s*(AW+.07));}}}

// ======================= (5) ring canal: water, quay walls, bridges, piers, boats =======================
// B2 (Fable crit fix 7): dark sky-mirror water, calmer normals, waterline light seams
function canal(){const blue=P.mood!=='day',yw=Y-.45,wn=NNC.w||(NNC.w=FA.noiseNormal(128,1.8,37));wn.repeat.set(11,11); // B1 r5: one shared (deterministic) normal map; was ~20 ms CPU per stand-in build
 const wm=new THREE.MeshStandardMaterial({color:blue?'#0C1826':'#0F2233',roughness:blue?.08:.05,metalness:.7,normalMap:wn,normalScale:new THREE.Vector2(.1,.1),envMapIntensity:blue?1.5:1.5});
 // C2b moat: no black void - sky gradient by view angle (fresnel) + broken vertical streaks of the warm city lights on the far quay,
 // rippled by time; all in the emissive slot (cheap, no reflection pass)
 if(blue){wm.onBeforeCompile=sh=>{sh.uniforms.uT=FA.TU.uT;sh.uniforms.pcO={value:new THREE.Vector2(cx,cz)};
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT;uniform vec2 pcO;float mH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_FOG\n{vec2 d=vFogWP.xz-pcO;float ang=atan(d.y,d.x);float rr=length(d);vec3 V=normalize(vFogWP-cameraPosition);float fr=pow(1.-abs(V.y),3.);'+
   'float a=ang*38.;float id=floor(a);float st=smoothstep(.5,.0,abs(fract(a)-.5)-.18)*step(.45,mH(vec2(id,3.1)));float rip=.55+.45*sin(rr*34.+uT*1.1+mH(vec2(id,1.))*6.)*sin(rr*11.-uT*.7);'+
   'totalEmissiveRadiance+=mix(vec3(.10,.13,.24),vec3(.30,.24,.30),fr)*(.35+.65*fr)+vec3(1.,.55,.24)*st*rip*.30*(.5+.5*mH(vec2(id,7.)));}\n#endif');};
  wm.customProgramCacheKey=()=>'pcMoat';}
 const wg=new THREE.RingGeometry(RC0-.05,RC1+.05,128,1);wg.rotateX(-Math.PI/2);const w=new THREE.Mesh(wg,wm);w.position.set(cx,yw,cz);w.receiveShadow=true;SC.add(w);
 FA.anims.push(T=>{wn.offset.set(T*.008,T*.013);});
 for(const r of[RC0,RC1])S(new THREE.CylinderGeometry(r,r,1,96,1,true),M.quay,cx,Y-.5,cz,false);
 ring(RC0,RC0+.035,yw+.02,M.warm);ring(RC1-.035,RC1,yw+.02,M.warm);                    // waterline light seams
 for(let k=0;k<4;k++){const a=k*Math.PI/2,rm=(RC0+RC1)/2,len=RC1-RC0;S(new THREE.BoxGeometry(len,.2,AW*2+.5),M.comp,cx+Math.cos(a)*rm,Y-.1,cz+Math.sin(a)*rm,true,-a);
  for(const s of[-1,1]){const o=AW+.22;S(new THREE.BoxGeometry(len,.14,.04),M.shell,cx+Math.cos(a)*rm-Math.sin(a)*o*s,Y+.07,cz+Math.sin(a)*rm+Math.cos(a)*o*s,true,-a);}}
 const BC=['#D8D6D0','#AEB4BC','#2E3A4E','#C9C3B6'];
 for(let k=0;k<8;k++){const a=k*Math.PI/4+Math.PI/8,rm=RC1-.55;S(new THREE.BoxGeometry(1.15,.12,.32),M.comp,cx+Math.cos(a)*rm,Y-.31,cz+Math.sin(a)*rm,true,-a);
  FA.glow(cx+Math.cos(a)*(RC1-1.05),Y-.1,cz+Math.sin(a)*(RC1-1.05),.55,L.human,.3,anOf(cx+Math.cos(a)*RC1,cz+Math.sin(a)*RC1,false));
   for(const s of[-1,1]){const bc=col(BC[(rnd()*4)|0]),bx=cx+Math.cos(a)*rm-Math.sin(a)*.34*s,bz=cz+Math.sin(a)*rm+Math.cos(a)*.34*s;
   B.paint.add(bx,yw-.02,bz,.62,.1,.2,-a,bc);B.paint.add(bx+Math.cos(a)*.08,yw+.08,bz+Math.sin(a)*.08,.24,.07,.14,-a,[.8,.8,.78]);}}}

// ======================= (6) central plaza + spire (ceramic core in a hyperboloid diagrid) =======================
function plaza(){S(new THREE.CylinderGeometry(2.4,2.5,.22,64),M.shell,cx,Y+.11,cz,true);S(new THREE.CylinderGeometry(1.75,1.8,.22,64),M.shell,cx,Y+.33,cz,true);
 ring(3.1,3.14,Y+.04,M.cool);ring(2.28,2.32,Y+.235,M.warm);
 for(let i=0;i<12;i++){const a=(i+.5)*TAU/12;tree(cx+Math.cos(a)*4.05,cz+Math.sin(a)*4.05,.9);}
 for(let i=0;i<8;i++){const a=i*TAU/8+.39;lamp(cx+Math.cos(a)*4.6,cz+Math.sin(a)*4.6,.6,.7);}}
// B2 (Fable crit fix 6): engineered instrument - flared rib skirt, heavier diagrid with hoops at every level, waist lens deck
function spire(){const sy=Y+.44,Hs=12.6,pr=[],cr=t=>.5-.2*t;
 for(let i=0;i<=28;i++){const t=i/28,r=cr(t),y=t*Hs;pr.push(new THREE.Vector2(r,y));
  if(i%4===3)pr.push(new THREE.Vector2(r-.035,y+.02),new THREE.Vector2(r-.035,y+.07),new THREE.Vector2(r-.01,y+.09));} // hairline grooves
 pr.push(new THREE.Vector2(0,Hs));S(new THREE.LatheGeometry(pr,32),M.shell,cx,sy,cz,true);
 for(const i of[7,15,23]){const t=i/28;tor(cr(t)-.022,.016,sy+t*Hs+.045,M.collar);}                           // cool light seams in three grooves (C2: tier-1 collar)
 // diagrid: two counter-wound strut families on a hyperboloid (waist at 60 % height), hoops at every node level
 const NL=9,NS=10,Hd=Hs-.25,rad=t=>.74+.8*(t-.6)*(t-.6)/.36,node=(j,i,d)=>pt(rad(j/NL),(i+d*j*.5)*TAU/NS,sy+j/NL*Hd);
 for(let j=0;j<NL;j++)for(let i=0;i<NS;i++)for(const d of[-1,1])strut(node(j,i,d),node(j+1,i,d),.038,M.shell);
 for(let j=0;j<=NL;j++)tor(rad(j/NL),j%3===0?.04:.022,sy+j/NL*Hd,M.shell,j%3===0);
 // flared rib skirt: 12 swept ribs from the plaza step up into the diagrid (level 2)
 const y0=Y+.22,y1=sy+2/NL*Hd,r0=2.2,r1=rad(2/NL)+.02;
 for(let i=0;i<12;i++){const a=i*TAU/12;let p0=pt(r0,a,y0);for(let k=1;k<=6;k++){const u=k/6*Math.PI/2,p1=pt(r0-(r0-r1)*Math.sin(u),a,y0+(y1-y0)*(1-Math.cos(u)));strut(p0,p1,.045,M.shell);p0=p1;}}
 tor(r1,.03,y1,M.shell,true);
 // waist lens deck (instrument platform) with a cool hairline rim
 const yd=sy+6/NL*Hd,dk=[[.5,-.05],[1.22,0],[1.26,.05],[.5,.1]].map(p=>new THREE.Vector2(p[0],p[1]));
 S(new THREE.LatheGeometry(dk,40),M.shell,cx,yd,cz,true);tor(1.27,.014,yd+.03,M.collar);
 const ys=sy+Hs,sp=[[.34,-.12],[1.45,.12],[1.5,.2],[.55,.4],[0,.42]].map(p=>new THREE.Vector2(p[0],p[1]));
 S(new THREE.LatheGeometry(sp,48),M.shell,cx,ys,cz,true);tor(1.515,.018,ys+.16,M.collar);
 // C1 spire top light crown: amber hairline under the saucer rim + a ring of small warm sprites (the eye itself stays cool)
 // C2: crown = tier 1 (M.spireW 4.2, sprites .32 -> .55, steady - no breath); waist/skirt hairlines stay tier 3 (M.warm)
 if(P.mood!=='day'){tor(1.44,.02,ys+.05,M.spireW);for(let i=0;i<12;i++){const a=i*TAU/12;FA.glow(cx+Math.cos(a)*1.47,ys+.06,cz+Math.sin(a)*1.47,.55,'#FFC27E',.55);}
  tor(1.24,.012,yd-.03,M.warm);tor(r1,.012,y1-.05,M.warm);pool(cx,cz,4.6,.22,Y+.47);}
 return ys+.42;}

// ======================= (7) eye (own copy of the cities.js behaviour: same seeds, timings and contract) =======================
function irisTex(){const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
 const gr=g.createLinearGradient(0,0,0,128);[[0,'#04060A'],[.30,'#04060A'],[.33,'#1E4C58'],[.52,'#7CC2CC'],[.74,'#3F8794'],[.87,'#245562'],[.9,'#0E1E24'],[1,'#0E1E24']].forEach(s=>gr.addColorStop(s[0],s[1]));
 g.fillStyle=gr;g.fillRect(0,0,256,128);const r=FA.rng(3);
 for(let i=0;i<150;i++){const x=r()*256;g.strokeStyle=r()<.5?'rgba(200,240,245,'+(.10+r()*.22)+')':'rgba(5,20,26,'+(.15+r()*.25)+')';g.lineWidth=.6+r()*1.6;g.beginPath();g.moveTo(x,40);g.lineTo(x+(r()-.5)*6,110);g.stroke();}
 g.fillStyle='#04060A';g.fillRect(0,0,256,40);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
function buildEye(yb){const E=new THREE.Vector3(cx,yb+1.3,cz);FA.eyePos=E;const std=o=>new THREE.MeshStandardMaterial(o);
 const alloy=std({color:'#3A3F4C',roughness:.32,metalness:.75,side:THREE.DoubleSide}),lidM=std({color:'#9A9CA2',roughness:.38,metalness:.35,side:THREE.DoubleSide});
 const sock=new THREE.Group();sock.position.copy(E);sock.rotation.y=-.22;SC.add(sock);const EB=()=>FA.eyeBase!=null?FA.eyeBase:-.22;
 const tr=new THREE.Mesh(new THREE.TorusGeometry(1.06,.11,12,48),alloy);tr.position.z=.12;tr.castShadow=true;sock.add(tr);
 const yg=new THREE.TorusGeometry(1.28,.075,6,28,Math.PI);yg.rotateZ(Math.PI);const yoke=new THREE.Mesh(yg,M.shell);yoke.position.z=-.16;yoke.castShadow=true;sock.add(yoke); // U-yoke carrying the lens
 const up=new THREE.Mesh(new THREE.SphereGeometry(1.0,40,16,0,TAU,0,Math.PI/2),lidM),lo=new THREE.Mesh(new THREE.SphereGeometry(1.0,40,16,0,TAU,Math.PI/2,Math.PI/2),lidM);
 up.castShadow=lo.castShadow=true;sock.add(up,lo);
 const ball=new THREE.Group();ball.position.copy(E);SC.add(ball);
 ball.add(new THREE.Mesh(new THREE.SphereGeometry(.93,40,28),std({color:'#D2CFC8',roughness:.3,envMapIntensity:.8,emissive:C('#DCEAF0'),emissiveIntensity:P.mood!=='day'?.32:0}))); // C2b: sclera faintly self-lit
 const it=irisTex(),ig=new THREE.SphereGeometry(.936,40,10,0,TAU,0,.6);ig.rotateX(Math.PI/2);
 ball.add(new THREE.Mesh(ig,std({map:it,emissiveMap:it,emissive:C('#9FE6F0'),emissiveIntensity:P.mood!=='day'?4.8:.32,roughness:.35}))); // C2: iris .7 -> 1.6; C2b: 1.6 -> 4.8 (tier 0)
 // C2b: luminous limbal rim around the iris (on the ball, follows the gaze) + hairline on the socket ring
 const rim=new THREE.Mesh(new THREE.TorusGeometry(.936*Math.sin(.6),.022,6,48),M.eyeRim);rim.position.z=.936*Math.cos(.6)+.006;ball.add(rim);
 const sr=new THREE.Mesh(new THREE.TorusGeometry(.955,.016,6,64),M.eyeRim);sr.position.z=.25;sock.add(sr);
 const cg=new THREE.SphereGeometry(.975,40,12,0,TAU,0,.75);cg.rotateX(Math.PI/2);
 ball.add(new THREE.Mesh(cg,std({color:'#ffffff',transparent:true,opacity:.14,roughness:.04,envMapIntensity:1.5,depthWrite:false})));
 const halo=FA.glow(E.x,E.y,E.z,3.2,L.ai,P.mood!=='day'?.22:.12); // C2: halo .12 -> .22 in blue hour
 // attention clock: new target every 4-7 s, blink every 8-14 s (0.32 s), lids open again at once
 const rr=FA.rng(77),sched=[];let t0=0;while(t0<4000){sched.push({t:t0,yaw:(rr()-.5)*1.5,pitch:-.12-rr()*.42});t0+=4+rr()*3;}
 const blinks=[];t0=2.2;while(t0<4000){blinks.push(t0);t0+=8+rr()*6;}
 const qT=new THREE.Quaternion(),eul=new THREE.Euler(0,0,0,'YXZ');let bi=0;
 FA.anims.push((T,dt)=>{let i=0;while(i+1<sched.length&&sched[i+1].t<=T)i++;const s=sched[i];eul.set(-s.pitch,s.yaw+EB(),0);qT.setFromEuler(eul);sock.rotation.y=EB();
  ball.quaternion.slerp(qT,1-Math.exp(-dt*7));if(FA.TFIX!=null)ball.quaternion.copy(qT);
  while(bi+1<blinks.length&&blinks[bi+1]<=T)bi++;const bt=T-blinks[bi];const k=bt>=0&&bt<.32?Math.sin(Math.PI*bt/.32):0;
  up.rotation.x=-.56*(1-k);lo.rotation.x=.50*(1-k);halo.material.opacity=1-k*.8;});}

// ======================= (8) districts =======================
const gseed=()=>[rnd(),.85+.2*rnd(),1];                      // glass instance colour: r = window seed, g = tint
const okR=r=>r>RB1+.9&&r<RD-.85&&Math.abs(r-RM)>.9;
// +x/-z : rigid glass-tower grid, three archetypes
function towers(){for(let gx=1.6;gx<RD;gx+=1.9)for(let gz=-1.6;gz>-RD;gz-=1.9){const r=Math.hypot(gx,gz);if(!okR(r))continue;const x=cx+gx,z=cz+gz;
  if(rnd()<.08){tree(x-.3,z,.9);tree(x+.3,z+.2,.8);continue;}
  const k=(rnd()*3)|0,h=fl(3+rnd()*4.6);pool(x,z,1.9,.46);
  if(k===0){const h2=fl(1+rnd()*1.6);B.comp.add(x,Y,z,1.35,.4,1.35,0);B.glass.add(x,Y+.4,z,.95,h,.95,0,gseed());
   for(const s of[-1,1])for(const o of[-.3,0,.3]){B.metal.add(x+o,Y+.4,z+s*.5,.03,h,.07,0,SIL);B.metal.add(x+s*.5,Y+.4,z+o,.07,h,.03,0,SIL);}
   B.glass.add(x,Y+.4+h,z,.6,h2,.6,0,gseed());B.crown.add(x,Y+.4+h+h2-.06,z,.63,.03,.63,0);}
  else if(k===1){let y=Y;[[1.15,.5],[.88,.32],[.6,.24]].forEach(t=>{const hh=fl(h*t[1]+.4);B.glass.add(x,y,z,t[0],hh,t[0],0,gseed());y+=hh;B.comp.add(x,y,z,t[0]+.08,.06,t[0]+.08,0);y+=.06;});
   B.crown.add(x,y-.1,z,.71,.03,.71,0);}
  else{const ry=rnd()<.5?0:Math.PI/2;B.comp.add(x,Y,z,1.25,h,.62,ry);B.glass.add(x,Y+.2,z,1.09,fl(h-.4),.68,ry,gseed());B.pv.add(x,Y+h,z,1.0,.03,.42,ry);if(P.mood!=='day')B.crown.add(x,Y+h-.07,z,1.27,.03,.64,ry);}}}
// icon landmark: twisted glass tower (22 floor slabs, each rotated a little further)
function twist(){const a=Math.PI/4,x=cx+Math.cos(a)*13.9,z=cz+Math.sin(a)*13.9,c=[rnd(),1.05,1];KO.push([x,z,1.2]);
 B.comp.add(x,Y,z,1.6,.3,1.6,a);for(let i=0;i<22;i++){const w=.98-.012*i;B.glass.add(x,Y+.3+i*FLR,z,w,FLR,w,a+i*.075,c);
  if(P.mood!=='day'&&i%6===5)B.crown.add(x,Y+.3+(i+1)*FLR-.012,z,w+.03,.018,w+.03,a+i*.075);} // C1 landmark hairline seams
 pool(x,z,2.4,.3);
 const yt=Y+.3+22*FLR;B.crown.add(x,yt-.05,z,.76,.03,.76,a+22*.075);B.metal.add(x,yt,z,.04,1.3,.04,0,SIL);}
// +x/+z : white composite slabs with glass bands on three arcs
function slabs(){for(const r of[12,13.9,16.75]){const span=Math.PI/2-.3,n=Math.floor(span*r/1.75);
  for(let i=0;i<n;i++){const a=.15+(i+.5)*span/n,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(!free(x,z,.9))continue;if(rnd()<.1){tree(x,z,1);continue;}
   const h=fl(1.4+rnd()*2.6),ry=Math.PI/2-a;B.comp.add(x,Y,z,1.35,h,.6,ry);B.glass.add(x,Y+.4,z,1.2,fl(h-.8),.66,ry,gseed());pool(x,z,1.6,.24);
   if(P.mood!=='day'&&i%3===0)B.crown.add(x,Y+h-.06,z,1.37,.025,.62,ry);
   if(rnd()<.4)B.pv.add(x,Y+h,z,1.1,.03,.4,ry);}}}
// -x/+z : honeycomb pavilions, hex parks, solar trees
// B2 (Fable crit fix 5) secondary icons: faceted glass bullet tower tied to the west station by a skybridge, canopy ("solar parasol") towers
function icons(){const a=.75*Math.PI,bx=cx+Math.cos(a)*12.5,bz=cz+Math.sin(a)*12.5,c=[rnd(),1.0,1],N=18;KO.push([bx,bz,1.5]);
 const br=i=>.2+.85*Math.sqrt(1-Math.pow(i/N,2.4));
 B.cHex.add(bx,Y,bz,1.25,.24,1.25,0);
 for(let i=0;i<N;i++){const r=br(i);B.gHex.add(bx,Y+.24+i*FLR,bz,r,FLR,r,(i%2)*Math.PI/6,c);}
 for(const k of[5,10,14]){const r=br(k)+.05;B.cHex.add(bx,Y+.24+k*FLR-.025,bz,r,.05,r,0);}
 const yt=Y+.24+N*FLR;B.crown.add(bx,yt,bz,.3,.03,.3,0);B.metal.add(bx,yt,bz,.035,1.1,.035,0,SIL);
 B.comp.add(cx+Math.cos(a)*14.25,Y+2.0,cz+Math.sin(a)*14.25,1.75,.1,.34,-a);B.crown.add(cx+Math.cos(a)*14.25,Y+1.98,cz+Math.sin(a)*14.25,1.75,.02,.36,-a);
 for(const p of[[Math.PI+.52,13.3],[Math.PI+1.05,13.6],[.5*Math.PI+.35,13.3],[Math.PI-.3,13.5]]){const x=cx+Math.cos(p[0])*p[1],z=cz+Math.sin(p[0])*p[1],h=fl(2.9+rnd()*.9);KO.push([x,z,1.15]);
  B.paint.add(x,Y,z,.14,h,.14,0,[.8,.8,.79]);B.gHex.add(x,Y+h-.4,z,.5,.4,.5,0,gseed());B.cHex.add(x,Y+h,z,1.05,.07,1.05,0);
  for(let i=0;i<4;i++)B.rib.add(x,Y+h+.07,z,1.0,.5,1.0,i*Math.PI/4);
  FA.glow(x,Y+h-.55,z,1.1,L.human,.3,anOf(x,z,false));pool(x,z,1.6,.3);}}
// -x/+z : honeycomb pavilions (a quarter grow into stacked hex towers), hex parks, solar trees
function honey(){const p=1.34;for(let i=0;i<14;i++)for(let j=0;j<14;j++){const lx=-(1.6+i*p*.866),lz=1.6+(j+(i%2)*.5)*p,r=Math.hypot(lx,lz);if(!okR(r))continue;
  const x=cx+lx,z=cz+lz,u=rnd();if(!free(x,z,.7))continue;
  if(u<.6){const tall=rnd()<.28,h=tall?fl(1.6+rnd()*2.4):fl(.4+rnd()*.9);B.gHex.add(x,Y,z,.56,h,.56,0,gseed());B.cHex.add(x,Y+h,z,.66,.1,.66,0);
   if(tall){const h2=fl(.8+rnd()*1.2);B.gHex.add(x,Y+h+.1,z,.38,h2,.38,Math.PI/6,gseed());B.cHex.add(x,Y+h+.1+h2,z,.44,.06,.44,Math.PI/6);}
   else if(rnd()<.4)B.tHex.add(x,Y+h+.1,z,.52,.03,.52,0);}
  else if(u<.82){B.tHex.add(x,Y,z,.62,.05,.62,0);const n=2+((rnd()*2)|0);for(let k=0;k<n;k++){const a=rnd()*TAU;tree(x+Math.cos(a)*.3,z+Math.sin(a)*.3,.75+rnd()*.3,Y+.04);}}
  else{B.solar.add(x,Y,z,1,1,1,rnd()*TAU);if(rnd()<.5)lamp(x+.4,z+.3,.4,.5);}}}
// -x/-z : garden sector (turf, terraced mounds, trees, solar trees) + ribbed glass dome
function garden(){const a0=Math.PI+.1,a1=1.5*Math.PI-.1;ring(RB1+.3,RD-.3,Y+.02,M.turf,a0,a1);
 const da=1.25*Math.PI,dx=cx+Math.cos(da)*13.2,dz=cz+Math.sin(da)*13.2;KO.push([dx,dz,2.1]);
 S(new THREE.SphereGeometry(1.7,24,10,0,TAU,0,Math.PI/2),M.dome,dx,Y,dz,true);for(let i=0;i<8;i++)B.rib.add(dx,Y,dz,1.73,1.73,1.73,i*Math.PI/8);
 tor(1.74,.05,Y+.05,M.shell,true,dx,dz);tor(1.8,.016,Y+.05,M.warm,false,dx,dz);pool(dx,dz,3.0,.3);
 for(const m of[[Math.PI+.3,12.4],[Math.PI+.42,16.6],[Math.PI+1.27,12.6]]){const x=cx+Math.cos(m[0])*m[1],z=cz+Math.sin(m[0])*m[1];KO.push([x,z,.9]);
  [1.6,1.1,.6].forEach((rr,k)=>B.tHex.add(x,Y+k*.2,z,rr,.2,rr,k*.3));tree(x,z,1.1,Y+.58);}
 let n=0;for(let i=0;i<160&&n<80;i++){const a=a0+.04+rnd()*(a1-a0-.08),r=RB1+.6+rnd()*(RD-RB1-1.2),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(!free(x,z,.3))continue;tree(x,z,.8+rnd()*.5);n++;}
 for(let i=0;i<7;i++){const a=a0+.1+rnd()*(a1-a0-.2),r=11.6+rnd()*5,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(free(x,z,.7))B.solar.add(x,Y,z,1.1,1.1,1.1,rnd()*TAU);}}

// ======================= (9) elevated monorail truss ring, ribbed PV stations, train =======================
function transit(){const yb=Y+2.05,yt=Y+2.4;tor(RM,.06,yt,M.shell,true);tor(RM,.04,yb,M.shell,true);
 for(let i=0;i<48;i++){const o=i%2;strut(pt(RM,i*TAU/48,o?yt:yb),pt(RM,(i+1)*TAU/48,o?yb:yt),.025,M.shell);}
 for(let i=0;i<24;i++){const a=(i+.5)*TAU/24;B.paint.add(cx+Math.cos(a)*RM,Y,cz+Math.sin(a)*RM,.09,2.05,.09,-a,[.75,.75,.74]);}
 for(const a of[-Math.PI/4,.75*Math.PI,1.25*Math.PI+.45]){const x=cx+Math.cos(a)*RM,z=cz+Math.sin(a)*RM,ry=Math.PI/2-a;
  B.comp.add(x,Y+2.0,z,2.7,.08,1.15,ry);B.pv.add(x,yt+.72,z,2.5,.03,.75,ry);
  for(let k=-3;k<=3;k++){const o=k*.42;B.rib.add(x-Math.sin(a)*o,yt-.3,z+Math.cos(a)*o,.62,1.0,.62,-a);}
  B.crown.add(x,Y+1.97,z,2.72,.02,1.17,ry);pool(x,z,2.2,.3);}
 const im=new THREE.InstancedMesh(G.box,M.paint,4);im.frustumCulled=false;im.castShadow=false;SC.add(im);
 FA.anims.push(T=>{for(let c=0;c<4;c++){const a=T*.045+c*.062;m4.compose(v3.set(cx+Math.cos(a)*RM,yt+.06,cz+Math.sin(a)*RM),q4.setFromAxisAngle(UP,Math.PI/2-a),s3.set(.85,.2,.24));im.setMatrixAt(c,m4);}im.instanceMatrix.needsUpdate=true;});FA.mover&&FA.mover({x:cx,y:yt,z:cz,r:RM,n:'spire'});}

// ======================= (10) vehicles, street lamps, perimeter sensor rail + gates =======================
function traffic(){const VC=['#D8D6D0','#8E949C','#2E3238','#B9BEC6'];
 // B2 (Fable crit fix 4): street-light plan traces both ring roads and the avenues; all cars lit
 const car=(x,z,ry,i)=>{B.paint.add(x,Y+.03,z,.42,.13,.2,ry,col(VC[(rnd()*4)|0]));FA.glow(x,Y+.14,z,i%3===0?.34:.22,'#FFE8C8',.22);};
 for(let i=0;i<30;i++){const out=i>=13,rm=out?(RD+RO1)/2:(RB0+RB1)/2,a=rnd()*TAU,r=rm+(rnd()<.5?-.33:.33);car(cx+Math.cos(a)*r,cz+Math.sin(a)*r,Math.PI/2-a,i);}
 for(let i=0;i<6;i++){const a=((rnd()*4)|0)*Math.PI/2,r=11+rnd()*6,o=rnd()<.5?-.33:.33;car(cx+Math.cos(a)*r-Math.sin(a)*o,cz+Math.sin(a)*r+Math.cos(a)*o,-a,i);}
 const near=a=>Math.abs(((a+Math.PI/4)%(Math.PI/2))-Math.PI/4);                       // angular distance to the nearest avenue
 for(let i=0;i<20;i++){const a=(i+.5)*TAU/20;lamp(cx+Math.cos(a)*(RB0-.3),cz+Math.sin(a)*(RB0-.3),.55,.75);}
 for(let i=0;i<40;i++){const a=(i+.5)*TAU/40;if(near(a)<.06)continue;lamp(cx+Math.cos(a)*(RO1+.3),cz+Math.sin(a)*(RO1+.3),.5,.6);}
 for(let k=0;k<4;k++){const a=k*Math.PI/2;for(let r=RB1+.8;r<RD-.3;r+=1.5)for(const s of[-1,1]){const o=(AW+.28)*s;
   lamp(cx+Math.cos(a)*r-Math.sin(a)*o,cz+Math.sin(a)*r+Math.cos(a)*o,.45,.55);}}}
function perimeter(){const rr=P.R-.55,gap=.075,arc=Math.PI/2-2*gap;
 for(let k=0;k<4;k++){const a=k*Math.PI/2;tor(rr,.045,Y+.36,M.shell,true,cx,cz,arc,a+gap);tor(rr,.016,Y+.43,M.cool,false,cx,cz,arc,a+gap);
  for(const s of[-1,1]){const o=AW+.5,x=cx+Math.cos(a)*rr-Math.sin(a)*o*s,z=cz+Math.sin(a)*rr+Math.cos(a)*o*s;B.comp.add(x,Y,z,.22,1.5,.22,-a);FA.glow(x,Y+1.58,z,.5,L.ai,.3);}}
 for(let i=0;i<72;i++){const a=(i+.5)*TAU/72,d=Math.abs(((a+Math.PI/4)%(Math.PI/2))-Math.PI/4);if(d<gap)continue;B.metal.add(cx+Math.cos(a)*rr,Y,cz+Math.sin(a)*rr,.04,.36,.04,-a,SIL);}}

// ======================= (11) build =======================
// B1 r5: the build is a generator (buildSteps) sliced between plan parts, so the LOD host can spread a stand-in build over frames
// (each step a few ms). Same call order and the same rnd() draws as before -> identical geometry by seed. build() = drain it (sync API
// kept for the two detail cities). Module state (cx, cz, Y, rnd, M, B, G, KO, POOLS) lives across the yields: one build at a time.
function* buildSteps(opts){const t0=performance.now();const c=FA.GK;cx=c.x;cz=c.z;Y=c.top;rnd=FA.rng(1505);KO.length=0;TC=0;POOLS.length=0;
 bake();yield 'pc:bake';mats();geos();yield 'pc:mats';ground();yield 'pc:ground';canal();yield 'pc:canal';plaza();yield 'pc:plaza';
 const top=spire();yield 'pc:spire';buildEye(top);yield 'pc:eye';
 towers();yield 'pc:towers';twist();yield 'pc:twist';icons();yield 'pc:icons';slabs();yield 'pc:slabs';honey();yield 'pc:honey';garden();yield 'pc:garden';
 transit();yield 'pc:transit';traffic();yield 'pc:traffic';perimeter();yield 'pc:perimeter';
 if(P.mood!=='day')for(let i=0;i<44;i++){const a=(i+.5)*TAU/44,rr=P.R+2.2;pool(cx+Math.cos(a)*rr,cz+Math.sin(a)*rr,5.0,.085,Y-.25);} // C1 warm spill onto the apron
 const pools=buildPools();yield 'pc:pools';
 let inst=0,draws=0,k2=0;for(const k in B){const n=B[k].done();if(n){inst+=n;draws++;}if((++k2&3)===0)yield 'pc:batch';}
 // data-layer road stub (kept): arrives at the south gate of the base plate
 FA.road([[cx+16,cz+92],[cx+7,cz+52],[cx+1.6,cz+34],[cx,cz+P.R+2.1]],.9,L.road);
 Object.assign(PC.info,{buildMs:Math.round(performance.now()-t0),instances:inst,instDraws:draws,R:P.R,mood:P.mood,pools:pools});return PC.info;}
function build(opts){const it=buildSteps(opts);let r;while(!(r=it.next()).done);return r.value;}
PC.buildSteps=buildSteps;
})();
