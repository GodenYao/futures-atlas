// Futures Atlas v4.5 PILOT - protown.js : B2 round 1. Contemporary / ordinary human-town generator, six endings via presets
// (normaltech, o1984, protector, egalitarian, zookeeper, descendants). STANDALONE: defines only FA.PROTOWN, reads no engine
// globals, no camera/DOM, adds nothing to a scene - it RETURNS groups/geometry (parallel_contract_B1_B2.md + b2_protown_notes.md).
// Everything is procedural (no assets, no third-party code). Classic script, ES2017. Apache-2.0. Written by Fable 5.2.
// Frames: all emitters work in the PLAN frame (unrotated); T.yl(x,z) samples the terrain at the point rotated by site.rot;
// the finished groups carry an inner group rotated by site.rot (far geoms are baked), the engine only translates.
(function(){
'use strict';
const root=typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:{});
root.FA=root.FA||{};

// ======================= (1) utils, rng, colour =======================
const TAU=Math.PI*2,PI=Math.PI,STOREY=.32,BAY=.3;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
function perr(m){try{(root.__errs=root.__errs||[]).push('protown: '+m);}catch(e){}}
function safe(name,fn){try{return fn();}catch(e){perr(name+': '+(e&&e.message?e.message:e));return null;}}
function mulberry32(a){a=a>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function hash2(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
// plan rotation, same convention as Object3D.rotation.y: local x axis -> (cos,-sin), local z axis -> (sin,cos)
function rotP(x,z,a){const c=Math.cos(a),s=Math.sin(a);return[x*c+z*s,-x*s+z*c];}
// sRGB hex -> LINEAR [r,g,b] (own conversion: independent of THREE.ColorManagement state)
const HEXC={};
function hex(h,k){let c=HEXC[h];if(!c){const n=parseInt(h.slice(1),16),f=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  c=HEXC[h]=[f(n>>16&255),f(n>>8&255),f(n&255)];}
 k=k==null?1:k;return[c[0]*k,c[1]*k,c[2]*k];}
const tone=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
const PAL={concrete0:'#8E8A84',concrete1:'#A29E96',brick0:'#7A4E3C',brick1:'#8C5A44',timber:'#6B5440',timberL:'#86705A',stone:'#8A8274',
 glass:'#5F7380',asphalt:'#25272B',roof0:'#4B4F55',roof1:'#5A4A3E',greenRoof:'#55654A',foliage:'#3E5238',grass:'#46553A',pave:'#6C6964',
 path:'#8A826E',dark:'#33363B',steel:'#7C8086',warm:'#FFB870',lamp:'#FFC890',cool:'#9FD8E6',solar:'#1E2A3C',soil:'#4A3E32',kerb:'#8E8A82',mark:'#BDB7A8'};

// ======================= (2) presets (any field overridable via site.params) =======================
const SP=s=>s.split(' ');
// B2 r3: fray (irregular footprint strength), fields / farms (outskirts), pz (window patch size bays x storeys), alb (albedo)
const PRESETS={
 normaltech:{layout:'grid',lit:.62,em:1.8,walls:SP('concrete0 concrete1 brick0 brick1'),roofs:SP('roof0 roof1'),roof:'mix',storeys:[2,6],density:.88,blockMin:3.3,
  streetW:.62,jitter:.4,green:.25,props:1,cars:36,moving:4,lamps:1,lampStep:2.6,trees:40,out:0,fray:.7,fields:12,farms:5,pz:[4,3],special:SP('square regulator substation pylons datacenter')},
 o1984:{layout:'strict',lit:.45,em:1.7,alb:.7,walls:SP('concrete0 concrete1'),roofs:SP('roof0'),roof:'flat',storeys:[9,12],density:1,blockMin:4,
  streetW:.8,jitter:0,green:0,props:.6,cars:5,moving:0,lamps:1,lampStep:4,trees:0,out:0,fray:.8,fields:0,farms:0,pz:[12,2],special:SP('camPoles checkpoints ministry searchlights')},
 protector:{layout:'organic',lit:.7,em:1.9,walls:SP('timber timberL stone'),roofs:SP('roof1 roof0'),roof:'pitched',storeys:[2,3],density:.92,blockMin:3,
  streetW:.54,jitter:.6,green:.9,props:1,cars:8,moving:2,lamps:1,lampStep:2.4,trees:130,out:0,fray:.8,fields:10,farms:5,pz:[4,3],special:SP('dome anomaly')},
 egalitarian:{layout:'ring',lit:.65,em:1.8,walls:SP('timber concrete1'),roofs:SP('greenRoof'),roof:'green',storeys:[2,2],density:1,blockMin:3,
  streetW:.44,jitter:0,green:.6,props:1,cars:0,moving:0,lamps:1,lampStep:3.2,trees:70,out:0,fray:.6,fields:9,farms:0,pz:[3,2],special:SP('commons amphitheatre workshop library')},
 zookeeper:{layout:'cluster',lit:.9,em:2.2,alb:1.06,walls:SP('concrete1 brick1 timberL'),roofs:SP('roof1 roof0'),roof:'pitched',storeys:[2,2],density:1,blockMin:3,
  streetW:.42,jitter:.2,green:.3,props:1,cars:0,moving:0,lamps:1,lampStep:2.8,trees:0,out:0,fray:0,fields:0,farms:0,pz:[3,2],special:SP('enclosure gardens playground tree')},
 descendants:{layout:'old',lit:.5,em:1.6,walls:SP('stone brick0 brick1'),roofs:SP('roof1 roof0'),roof:'pitched',storeys:[3,5],density:.84,blockMin:2.4,
  streetW:.48,jitter:.5,green:.1,props:.7,cars:0,moving:0,lamps:1,lampStep:3.4,trees:14,out:.12,fray:1,fields:6,farms:3,pz:[4,3],special:SP('plaza seam emptying')}
};
const ALIAS={'1984':'o1984','normal':'normaltech','normal-tech':'normaltech','protectorgod':'protector','egalitarianutopia':'egalitarian','zoo':'zookeeper'};

// ======================= (3) town context (site + ctx -> T) =======================
function mkTown(site,ctx){site=site||{};ctx=ctx||{};const THREE=ctx.THREE||root.THREE;
 let id=String(site.ending==null?'normaltech':site.ending);id=ALIAS[id]||id;
 if(!PRESETS[id]){perr('unknown ending "'+id+'" -> normaltech');id='normaltech';}
 const P=Object.assign({},PRESETS[id],site.params||{});
 const R=site.radius>0?+site.radius:14,rot=+site.rot||0,cr=Math.cos(rot),sr=Math.sin(rot),sx=+site.x||0,sz=+site.z||0;
 const hA=typeof ctx.heightAt==='function'?ctx.heightAt:null;let y0=0;
 if(hA){y0=site.y!=null?+site.y:+hA(sx,sz);if(!isFinite(y0))y0=0;}
 const seed=(site.seed==null?1:site.seed)>>>0;let rnd=null;
 if(typeof ctx.rng==='function'){try{rnd=ctx.rng(seed);}catch(e){rnd=null;}}
 if(typeof rnd!=='function')rnd=mulberry32(seed);
 const T={THREE:THREE,site:site,ctx:ctx,id:id,P:P,R:R,rot:rot,seed:seed,rnd:rnd,mood:site.mood==='day'?'day':'blue',
  q:({low:.5,mid:.75,high:1})[site.q]||1,maxLots:340,
  has:n=>P.special.indexOf(n)>=0,ri:(a,b)=>a+Math.floor(rnd()*(b-a+1)),rr:(a,b)=>a+rnd()*(b-a),
  toLocal:(x,z)=>[x*cr+z*sr,-x*sr+z*cr],
  yl:hA?function(x,z){const v=hA(sx+x*cr+z*sr,sz-x*sr+z*cr)-y0;return isFinite(v)?v:0;}:function(){return 0;}};
 T.A=T.mood==='day'?1:(+P.alb||.82);                          // albedo scale: facades sit below a blue-hour sky (zookeeper brighter, r3)
 // B2 r3 (owner 11-16: "every ending sits on a round disc, looks stiff"): noise-warped town boundary b(a). Lots fray and thin
 // out towards b, ground decals carry a vertex alpha T.fa(x,z) that feathers into the terrain (no plate / ring edge).
 // Phases come from hash2(seed) so the layout rnd() stream is untouched. P.fray 0..1 blends b towards the plain radius.
 const q1=hash2(seed*.131,1.7)*TAU,q2=hash2(seed*.317,4.1)*TAU,q3=hash2(seed*.513,8.3)*TAU,fr=P.fray==null?1:+P.fray;
 T.fray=fr;T.rb=a=>lerp(R-.5,clamp(R*(.72+.12*Math.sin(2*a+q1)+.07*Math.sin(3*a+q2)+.04*Math.sin(5*a+q3)),R*.5,R-.6),fr);
 T.bAt=(x,z)=>T.rb(Math.atan2(z,x));
 T.fa=(x,z)=>{const r=Math.hypot(x,z),a=Math.atan2(z,x),b=T.rb(a),c=R*(.93+.05*Math.sin(4*a+q2));return(1-ss(b*.92,b*1.42,r))*(1-ss(c*.78,c,r));};
 return T;}
const ss=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};

// ======================= (4) materials + window shader =======================
// aWin = (u in bays, v in storeys, lit share (0 = plain wall), integer seed). Windows live in the emissive slot of the OWN
// facade material; one uniform set {uT,uOut,uLit} per build (exposed in result.uniforms), uGain = emission level (mood-aware).
const WIN_FS_HEAD='uniform float uT,uOut,uLit,uGain;uniform vec3 uWarm;uniform vec2 uPz;varying vec4 vWin;\nfloat ptH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n';
const WIN_FS_BODY=[
'if(vWin.z>.001){vec2 g=vWin.xy;vec2 id=floor(g);vec2 f=fract(g);float sd=floor(vWin.w+.5);',
' float fw=max(fwidth(g.x),fwidth(g.y));float kk=smoothstep(.9,.35,fw);float e=fw+.02;',
' float mx=smoothstep(.2,.2+e,f.x)*(1.-smoothstep(.8-e,.8,f.x));float my=smoothstep(.26,.26+e,f.y)*(1.-smoothstep(.84-e,.84,f.y));float m=mx*my;',
// B2 r4 (fineness): pale window surround/frame ring + a transom (all) and a mullion (half the buildings), NEAR band only (kk)
' float fx=smoothstep(.14,.14+e,f.x)*(1.-smoothstep(.86-e,.86,f.x));float fy=smoothstep(.2,.2+e,f.y)*(1.-smoothstep(.9-e,.9,f.y));float frm=clamp(fx*fy-m,0.,1.);',
' float bar=m*max(1.-smoothstep(.012,.012+e,abs(f.y-.64)),(1.-smoothstep(.012,.012+e,abs(f.x-.5)))*step(.5,fract(sd*.37)));',
' float share=clamp(vWin.z*uLit*(.42+1.16*ptH(vec2(sd*.73,2.9))),0.,1.);',   // B2 r2: wider per-building spread
// B2 r2: lit share varies in patches of ~4 bays x 3 storeys per building (near AND distance term), so facades read as a mix
// of lit and dark floors instead of one uniform glow at distance (vision r1: o1984 windows near-uniform)
// B2 r3 (vision r2: window variance still near-uniform at distance): patches are near-binary (smoothstep on the patch hash),
// patch size per preset via uPz (o1984 = whole-floor bands of 2 storeys x 12 bays), dark patches ~1.5 % of a lit one
' float zr=ptH(floor(g/uPz)+vec2(sd*1.7,sd*.31));float zp=smoothstep(.4,.6,zr);float zn=zp*(.75+.5*zr)*(.6+.8*share);',
' float on=step(ptH(id+sd*vec2(.37,1.71)),clamp(share*(.08+1.75*zp),0.,1.));',
' float ord=ptH(id*vec2(1.31,.77)+vec2(sd*.113+5.,sd*.071));on*=step(uOut,ord);',           // deterministic going-out order
' float fl=step(.9993,ptH(id*vec2(.37,.91)+vec2(sd,floor(uT/7.+ord*11.))));on=mix(on,1.-on,fl*step(uOut,ord));', // sparse window life
' float inten=.55+.9*ptH(id.yx+sd+3.1);vec3 warm=uWarm*mix(vec3(1.),vec3(1.,1.12,1.32),ptH(id+sd+7.));',
' float em=mix(share*(1.-uOut)*(.01+.72*zn),on*inten*m,kk);',
' diffuseColor.rgb*=mix(1.,.62+.38*zp,(1.-kk)*step(.001,share));',   // B2 r3: dark patches also read darker as wall at distance
' diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.045,.058,.072),m*kk*.92);roughnessFactor=mix(roughnessFactor,.2,m*kk);',
' diffuseColor.rgb*=1.+.18*frm*kk;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.16,.15),bar*kk*.9);em*=1.-.88*bar*kk;',
' totalEmissiveRadiance+=warm*em*uGain;}'].join('\n');
function facadeMat(T,U){const THREE=T.THREE,m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.86,metalness:0});
 m.onBeforeCompile=sh=>{sh.uniforms.uT=U.uT;sh.uniforms.uOut=U.uOut;sh.uniforms.uLit=U.uLit;sh.uniforms.uGain=U.uGain;sh.uniforms.uWarm=U.uWarm;sh.uniforms.uPz=U.uPz;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 aWin;varying vec4 vWin;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvWin=aWin;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+WIN_FS_HEAD)
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+WIN_FS_BODY+'\n');};
 m.customProgramCacheKey=()=>'ptFacade4';m.name='pt_facade';return m;}
function domeMat(T,U){const THREE=T.THREE,c=hex('#BFD6E6');
 const m=new THREE.ShaderMaterial({uniforms:{uT:U.uT,uC:{value:new THREE.Vector3(c[0],c[1],c[2])},uK:{value:T.mood==='day'?.5:1}},
  vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uT,uK;uniform vec3 uC;varying vec3 vN;varying vec3 vV;void main(){float f=1.-abs(dot(normalize(vN),normalize(vV)));'+
   'float a=(.018+.44*pow(f,2.4)+.17*pow(f,9.))*(.93+.07*sin(uT*.35+vN.y*9.))*uK;a=min(a,.62);gl_FragColor=vec4(uC,a);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}',
  transparent:true,depthWrite:false,side:THREE.DoubleSide});m.name='pt_dome';return m;}
// B2 r3 searchlight beam (vision r2: grey wedges in stills): additive soft cone, smooth radial normals -> bright core, edges
// fade to 0 (facing^1.6), fades along the beam (tip 0, short ramp at the lamp), fades with view distance (no fog:false
// stray beam on the horizon), instanced. aU = 0 at the lamp .. 1 at the tip.
function beamMat(T){const THREE=T.THREE,c=hex('#DCE6F0');
 const m=new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Vector3(c[0],c[1],c[2])},uK:{value:T.mood==='day'?.05:.3}},
  vertexShader:'attribute float aU;varying float vU;varying vec3 vN;varying vec3 vV;void main(){vec4 p=vec4(position,1.);vec3 n=normal;\n#ifdef USE_INSTANCING\np=instanceMatrix*p;n=mat3(instanceMatrix)*n;\n#endif\nvec4 mv=modelViewMatrix*p;vN=normalize(normalMatrix*n);vV=-mv.xyz;vU=aU;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uK;varying float vU;varying vec3 vN;varying vec3 vV;void main(){float d=length(vV);float f=abs(dot(normalize(vN),vV/d));'+
   'float a=pow(f,1.6)*pow(1.-vU,1.4)*smoothstep(0.,.06,vU)*(1.-smoothstep(45.,170.,d))*uK;gl_FragColor=vec4(uC,a);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}',
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});m.name='pt_beam';return m;}
function beamGeo(T){const THREE=T.THREE,Lb=5.5,rb=.8,n=16,P=[],N=[],U=[];
 for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,am=(a0+a1)/2;
  P.push(0,0,0,Lb,Math.cos(a1)*rb,Math.sin(a1)*rb,Lb,Math.cos(a0)*rb,Math.sin(a0)*rb);
  N.push(0,Math.cos(am),Math.sin(am),0,Math.cos(a1),Math.sin(a1),0,Math.cos(a0),Math.sin(a0));U.push(0,1,1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 g.setAttribute('aU',new THREE.Float32BufferAttribute(U,1));g.computeBoundingSphere();return g;}
// families: ctx.mats[key] when it is a THREE.Material (except building: own window-capable facade), otherwise own materials
function makeMats(T){const THREE=T.THREE,cm=T.ctx.mats||{},used={},M={};
 const U={uT:{value:0},uOut:{value:+T.P.out||0},uLit:{value:1},uGain:{value:(+T.P.em||1.6)*(T.mood==='day'?.15:1)},uWarm:{value:new THREE.Vector3()},
  uPz:{value:new THREE.Vector2((T.P.pz||[4,3])[0],(T.P.pz||[4,3])[1])}};
 const w=hex(PAL.warm);U.uWarm.value.set(w[0],w[1],w[2]);
 const pick=(k,mk)=>{if(cm[k]&&cm[k].isMaterial){used[k]='ctx';return cm[k];}used[k]='own';const m=mk();m.name='pt_'+k;return m;};
 const std=o=>new THREE.MeshStandardMaterial(Object.assign({color:0xffffff,vertexColors:true},o));
 M.building=facadeMat(T,U);used.building=cm.building&&cm.building.isMaterial?'own facade (ctx.building supplied, not used: window shader)':'own facade';
 M.metal=pick('metal',()=>std({roughness:.5,metalness:.55}));
 // B2 r3: ground decals feather into the terrain via vertex alpha (RGBA colour attribute) -> always the OWN transparent
 // ground material (ctx.mats.ground is opaque); drawn first among transparents (renderOrder 1, chunks keep buffer order)
 M.ground=std({roughness:.95,metalness:0,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});M.ground.name='pt_ground_feather';
 used.ground=cm.ground&&cm.ground.isMaterial?'own feather (ctx.ground supplied, not used: vertex alpha)':'own feather';
 M.light=pick('light',()=>new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true}));
 M.glass=pick('glass',()=>std({roughness:.08,metalness:.3,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide}));
 M.foliage=pick('foliage',()=>std({roughness:.95,metalness:0,flatShading:true}));
 M.beam=beamMat(T);
 if(T.id==='zookeeper'){M.glass=std({roughness:.06,metalness:.2,transparent:true,opacity:.08,depthWrite:false,side:THREE.DoubleSide});M.glass.name='pt_glass_encl';used.glass='own (zookeeper: paler enclosure glass)';}
 M.dome=domeMat(T,U);
 return{M:M,U:U,used:used};}

// ======================= (5) geometry emit helpers (non-indexed soup: position, normal, colour, optional aWin) =======================
// B2 r3: af = optional alpha function (x,z)->0..1 (feathered ground decals); such buffers carry b.a (1 alpha per vertex)
function buf(win,af){return{p:[],n:[],c:[],w:win?[]:null,af:af||null,a:af?[]:null};}
const bufTris=b=>b.p.length/9;
function tri(b,p0,p1,p2,col){const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2];
 let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
 if(b.af)b.a.push(b.af(p0[0],p0[2]),b.af(p1[0],p1[2]),b.af(p2[0],p2[2]));
 b.p.push(p0[0],p0[1],p0[2],p1[0],p1[1],p1[2],p2[0],p2[1],p2[2]);
 for(let i=0;i<3;i++){b.n.push(nx,ny,nz);b.c.push(col[0],col[1],col[2]);}
 if(b.w)b.w.push(0,0,0,0,0,0,0,0,0,0,0,0);}
// quad p0(bottom-left) p1(bottom-right) p2(top-right) p3(top-left), CCW seen from outside; w=[u0,v0,u1,v1,lit,seed] or null
function quad(b,p0,p1,p2,p3,col,w){const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p3[0]-p0[0],vy=p3[1]-p0[1],vz=p3[2]-p0[2];
 let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
 if(b.af){const a0=b.af(p0[0],p0[2]),a2=b.af(p2[0],p2[2]);b.a.push(a0,b.af(p1[0],p1[2]),a2,a0,a2,b.af(p3[0],p3[2]));}
 b.p.push(p0[0],p0[1],p0[2],p1[0],p1[1],p1[2],p2[0],p2[1],p2[2],p0[0],p0[1],p0[2],p2[0],p2[1],p2[2],p3[0],p3[1],p3[2]);
 for(let i=0;i<6;i++){b.n.push(nx,ny,nz);b.c.push(col[0],col[1],col[2]);}
 if(b.w){if(w){const L=w[4],S=w[5];b.w.push(w[0],w[1],L,S,w[2],w[1],L,S,w[2],w[3],L,S,w[0],w[1],L,S,w[2],w[3],L,S,w[0],w[3],L,S);}
  else b.w.push(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);}}
// same as quad/tri but flips the winding so the face normal points up (draped ground pieces)
function quadUp(b,p0,p1,p2,p3,col){const ux=p1[0]-p0[0],uz=p1[2]-p0[2],vx=p3[0]-p0[0],vz=p3[2]-p0[2];
 if(uz*vx-ux*vz>=0)quad(b,p0,p1,p2,p3,col,null);else quad(b,p0,p3,p2,p1,col,null);}
function triUp(b,p0,p1,p2,col){const ux=p1[0]-p0[0],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vz=p2[2]-p0[2];
 if(uz*vx-ux*vz>=0)tri(b,p0,p1,p2,col);else tri(b,p0,p2,p1,col);}
// vertical wall from (ax,az) to (bx,bz); outward normal = (-dz,0,dx). win={bay,st,lit,seed} adds the window grid
function wall(b,ax,az,bx,bz,y0,y1,col,win){let w=null;
 if(win&&win.lit>0){const len=Math.hypot(bx-ax,bz-az);w=[0,0,Math.max(1,Math.round(len/(win.bay||BAY))),Math.max(1,Math.round((y1-y0)/(win.st||STOREY))),win.lit,win.seed||1];}
 quad(b,[ax,y0,az],[bx,y0,az],[bx,y1,bz],[ax,y1,bz],col,w);}
// footprint corners of a rotated rectangle, in the order every prism expects (CCW seen from above with x right, z down)
function rectPts(x,z,w,d,ry){const hx=w/2,hz=d/2,c=Math.cos(ry||0),s=Math.sin(ry||0),o=[[hx,-hz],[-hx,-hz],[-hx,hz],[hx,hz]];
 for(let i=0;i<4;i++){const lx=o[i][0],lz=o[i][1];o[i]=[x+lx*c+lz*s,z-lx*s+lz*c];}return o;}
// convex prism over footprint pts (order as rectPts); top fan in topCol (false = open top)
function prism(b,pts,y0,y1,col,win,topCol){const n=pts.length;
 for(let i=0;i<n;i++){const a=pts[i],c=pts[(i+1)%n];wall(b,a[0],a[1],c[0],c[1],y0,y1,col,win);}
 if(topCol!==false){const tc=topCol||col;for(let i=1;i<n-1;i++)tri(b,[pts[0][0],y1,pts[0][1]],[pts[i][0],y1,pts[i][1]],[pts[i+1][0],y1,pts[i+1][1]],tc);}}
function box(b,x,y0,z,w,h,d,ry,col,win,topCol){prism(b,rectPts(x,z,w,d,ry),y0,y0+h,col,win,topCol);}
// pitched roof on a rotated rectangle: kind 'gable' | 'hip', ridge along the longer side; gcol = gable-end (wall) colour
function roof(b,x,y,z,w,d,ry,rh,kind,col,over,gcol){if(d>w){const t=w;w=d;d=t;ry=(ry||0)+PI/2;}over=over==null?.05:over;
 const hx=w/2+over,hz=d/2+over,rx=kind==='hip'?Math.max(.02,hx-hz*.85):hx,c=Math.cos(ry||0),s=Math.sin(ry||0);
 const P3=(lx,ly,lz)=>[x+lx*c+lz*s,y+ly,z-lx*s+lz*c];
 const E0=P3(hx,0,-hz),E1=P3(-hx,0,-hz),E2=P3(-hx,0,hz),E3=P3(hx,0,hz),R0=P3(rx,rh,0),R1=P3(-rx,rh,0),ec=kind==='hip'?col:(gcol||col);
 quad(b,E0,E1,R1,R0,col,null);quad(b,E2,E3,R0,R1,col,null);tri(b,E1,E2,R1,ec);tri(b,E3,E0,R0,ec);}
// vertical cylinder / cone frustum (r0 bottom, r1 top), n sides, optional top cap
function cyl(b,x,y0,z,r0,r1,h,n,col,cap){const y1=y0+h;
 for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
  quad(b,[x+c1*r0,y0,z+s1*r0],[x+c0*r0,y0,z+s0*r0],[x+c0*r1,y1,z+s0*r1],[x+c1*r1,y1,z+s1*r1],col,null);
  if(cap&&r1>0)tri(b,[x,y1,z],[x+c1*r1,y1,z+s1*r1],[x+c0*r1,y1,z+s0*r1],cap===true?col:cap);}}
// thin triangular strut between two 3D points (lattice members, catenary segments, ribs): 6 tris
function strut(b,a,e,r,col){let dx=e[0]-a[0],dy=e[1]-a[1],dz=e[2]-a[2];const L=Math.hypot(dx,dy,dz);if(L<1e-5)return;dx/=L;dy/=L;dz/=L;
 let ux,uy,uz;if(Math.abs(dy)<.9){ux=-dz;uy=0;uz=dx;}else{ux=1;uy=0;uz=0;}
 const k=ux*dx+uy*dy+uz*dz;ux-=dx*k;uy-=dy*k;uz-=dz*k;const ul=Math.hypot(ux,uy,uz)||1;ux/=ul;uy/=ul;uz/=ul;
 const vx=dy*uz-dz*uy,vy=dz*ux-dx*uz,vz=dx*uy-dy*ux,o=[];
 for(let i=0;i<3;i++){const t=i*TAU/3,c=Math.cos(t)*r,s=Math.sin(t)*r;o.push([ux*c+vx*s,uy*c+vy*s,uz*c+vz*s]);}
 for(let i=0;i<3;i++){const p=o[i],q=o[(i+1)%3];
  quad(b,[a[0]+p[0],a[1]+p[1],a[2]+p[2]],[a[0]+q[0],a[1]+q[1],a[2]+q[2]],[e[0]+q[0],e[1]+q[1],e[2]+q[2]],[e[0]+p[0],e[1]+p[1],e[2]+p[2]],col,null);}}
// polyline helpers: cumulative length, point+tangent at arc length t, resample at <= step
function cum(pts){const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return c;}
function polyAt(pts,c,t){let i=1;while(i<pts.length-1&&c[i]<t)i++;const a=pts[i-1],e=pts[i],l=(c[i]-c[i-1])||1e-6,k=clamp((t-c[i-1])/l,0,1);
 return[a[0]+(e[0]-a[0])*k,a[1]+(e[1]-a[1])*k,(e[0]-a[0])/l,(e[1]-a[1])/l];}
function resample(pts,step){const c=cum(pts),L=c[c.length-1],n=Math.max(1,Math.ceil(L/step)),o=[];for(let i=0;i<=n;i++)o.push(polyAt(pts,c,L*i/n));return o;}
// draped ribbon (streets, paths): follows T.yl + lift
function ribbon(b,T,pts,w,col,lift,step){const rs=resample(pts,step||.7),h=w/2;let pl=null,pr=null;lift=lift==null?.02:lift;
 for(let i=0;i<rs.length;i++){const s=rs[i],nx=-s[3],nz=s[2],lx=s[0]+nx*h,lz=s[1]+nz*h,rx=s[0]-nx*h,rz=s[1]-nz*h;
  const l=[lx,T.yl(lx,lz)+lift,lz],r=[rx,T.yl(rx,rz)+lift,rz];if(pl)quadUp(b,pl,pr,r,l,col);pl=l;pr=r;}}
// draped disc (ground plate, plaza, commons): nr rings x ns segments; r0>0 makes an annulus
function disc(b,T,x,z,r,nr,ns,col,lift,r0){lift=lift||0;r0=r0||0;const P3=(rad,a)=>{const px=x+Math.cos(a)*rad,pz=z+Math.sin(a)*rad;return[px,T.yl(px,pz)+lift,pz];};
 for(let i=0;i<nr;i++){const ra=lerp(r0,r,i/nr),rb=lerp(r0,r,(i+1)/nr);
  for(let j=0;j<ns;j++){const a0=j*TAU/ns,a1=(j+1)*TAU/ns;
   if(ra<1e-4)triUp(b,P3(0,0),P3(rb,a0),P3(rb,a1),col);else quadUp(b,P3(ra,a0),P3(rb,a0),P3(rb,a1),P3(ra,a1),col);}}}
// draped rotated rectangle grid (yards, plots, square paving)
function rectGrid(b,T,x,z,w,d,ry,nx,nz,col,lift){lift=lift||0;const c=Math.cos(ry||0),s=Math.sin(ry||0);
 const P3=(i,j)=>{const lx=(i/nx-.5)*w,lz=(j/nz-.5)*d,px=x+lx*c+lz*s,pz=z-lx*s+lz*c;return[px,T.yl(px,pz)+lift,pz];};
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)quadUp(b,P3(i,j),P3(i+1,j),P3(i+1,j+1),P3(i,j+1),col);}
// ground contact of a footprint: lowest / highest terrain sample over corners + centre (plinth goes from lo-.15 to hi)
function seat(T,pts){let lo=1e9,hi=-1e9,sx=0,sz=0;for(let i=0;i<pts.length;i++){const y=T.yl(pts[i][0],pts[i][1]);if(y<lo)lo=y;if(y>hi)hi=y;sx+=pts[i][0];sz+=pts[i][1];}
 const yc=T.yl(sx/pts.length,sz/pts.length);if(yc<lo)lo=yc;if(yc>hi)hi=yc;return{lo:lo,hi:hi};}

// ======================= (6) layout core: lots, streets, slots, keep-outs =======================
// L = {lots[{x,z,w,d,ry,st,kind,seed,r}], streets[{pts,w,kind,closed}], slots{name:{x,z,r,...}}, ko[{x,z,r}], nodes[[x,z]],
//      entries[{x,z,a}], trees[{x,z,s,t}], lamps[{x,z,k}], cars[{x,z,ry}], gardens[{x,z,w,d,ry}], anchors{square,seam,entries}}
// lot frame: w along local x, d along local z, FRONT = local +z (faces the street).
function newLayout(){return{lots:[],streets:[],slots:{},ko:[],nodes:[],entries:[],trees:[],lamps:[],cars:[],gardens:[],anchors:{square:[0,0],seam:null,entries:[]}};}
function addStreet(L,pts,w,kind,closed){const s={pts:pts,w:w,kind:kind||'road',closed:!!closed};L.streets.push(s);return s;}
function addSlot(L,name,o,hard){L.slots[name]=o;if(hard!==false)L.ko.push({x:o.x,z:o.z,r:o.r,n:name});return o;}
function segDist(px,pz,a,e){const dx=e[0]-a[0],dz=e[1]-a[1],l2=dx*dx+dz*dz||1e-9,t=clamp(((px-a[0])*dx+(pz-a[1])*dz)/l2,0,1);return Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t);}
function nearStreet(L,x,z,rad,skip){for(let i=0;i<L.streets.length;i++){const s=L.streets[i];if(s===skip)continue;const p=s.pts,lim=s.w/2+rad;
  for(let j=1;j<p.length;j++)if(segDist(x,z,p[j-1],p[j])<lim)return true;}return false;}
function obbHit(a,b){const dx=b.x-a.x,dz=b.z-a.z;if(dx*dx+dz*dz>(a.r+b.r)*(a.r+b.r))return false;
 for(let k=0;k<2;k++){const p=k?b:a,q=k?a:b,c=Math.cos(p.ry),s=Math.sin(p.ry),cq=Math.cos(q.ry),sq=Math.sin(q.ry);
  for(let i=0;i<2;i++){const ux=i?s:c,uz=i?c:-s,ext=i?p.d/2:p.w/2;
   const proj=Math.abs(ux*cq-uz*sq)*q.w/2+Math.abs(ux*sq+uz*cq)*q.d/2;
   if(Math.abs(dx*ux+dz*uz)>ext+proj+.04)return false;}}
 return true;}
function koHit(L,x,z,rad){for(let i=0;i<L.ko.length;i++){const k=L.ko[i];if(Math.hypot(x-k.x,z-k.z)<k.r+rad)return true;}return false;}
// o={x,z,w,d,ry,st,kind}; chk = also reject lots that sit on a street (skip = own street)
function addLot(T,L,o,chk,skip){if(L.lots.length>=T.maxLots)return false;o.ry=o.ry||0;o.r=Math.hypot(o.w,o.d)/2;const mn=Math.min(o.w,o.d)/2;
 if(Math.hypot(o.x,o.z)+o.r>T.R-.25)return false;
 // B2 r3: irregular footprint - nothing beyond the warped boundary b, density + height fall off over .55b..b (hash, no rnd())
 if(!o.out&&T.fray>0){const r=Math.hypot(o.x,o.z),b=T.bAt(o.x,o.z);if(r>b)return false;const f=ss(.55*b,b,r);
  if(hash2(o.x*1.73+T.seed*.013,o.z*2.31)<f*.8*T.fray)return false;
  if(o.kind!=='slab'&&o.st>T.P.storeys[0])o.st=Math.max(T.P.storeys[0],Math.round(lerp(o.st,T.P.storeys[0],f)));}
 if(koHit(L,o.x,o.z,mn))return false;
 if(chk&&nearStreet(L,o.x,o.z,mn*.9,skip))return false;
 for(let i=0;i<L.lots.length;i++)if(obbHit(o,L.lots[i]))return false;
 o.seed=1+Math.floor(T.rnd()*997);L.lots.push(o);return true;}
// lots on both sides of a street polyline. o={w:[a,b],d:[a,b],set:[a,b],gap:[a,b],st:[a,b],kind,t0,t1,sides:[1,-1]}
function lotsAlong(T,L,s,o){const pts=s.pts,c=cum(pts),len=c[c.length-1],rr=T.rr,sides=o.sides||[1,-1];
 for(let k=0;k<sides.length;k++){const sd=sides[k];let t=(o.t0||0)+T.rnd()*.3;const tEnd=len-(o.t1||0);
  while(t<tEnd){const w=rr(o.w[0],o.w[1]),d=rr(o.d[0],o.d[1]);if(t+w>tEnd)break;
   const p=polyAt(pts,c,t+w/2),nx=-p[3],nz=p[2],off=s.w/2+rr(o.set[0],o.set[1])+d/2;
   if(T.rnd()<T.P.density)addLot(T,L,{x:p[0]+nx*sd*off,z:p[1]+nz*sd*off,w:w,d:d,ry:Math.atan2(-p[3],p[2])+(sd>0?PI:0),st:T.ri(o.st[0],o.st[1]),kind:o.kind||'house'},true,s);
   t+=w+rr(o.gap[0],o.gap[1]);}}}
// axis-aligned block between four street centre lines -> one or two rows of lots facing the z-side streets
function fillBlock(T,L,x0,z0,x1,z1){const P=T.P,rnd=T.rnd,m=P.streetW/2+.14;x0+=m;x1-=m;z0+=m;z1-=m;const W=x1-x0,D=z1-z0;if(W<1||D<1)return;
 const two=D>2.3,dl=two?Math.min(1.25,(D-.25)/2):Math.min(1.3,D),lo=P.storeys[0],hi=P.storeys[1];
 for(let row=0;row<(two?2:1);row++){let x=x0;
  while(x<x1-.7){const w=Math.min(x1-x,lerp(.85,1.9,rnd())),d=dl*(.72+.28*rnd()),cx=x+w/2,cz=row?z1-d/2:z0+d/2;x+=w;
   if(rnd()>P.density){if(rnd()<P.green+.35)L.trees.push({x:cx,z:cz,s:.8+.4*rnd(),t:0});continue;}
   const near=1-clamp(Math.hypot(cx,cz)/T.R,0,1),st=clamp(Math.round(lerp(lo,hi,rnd()*(.25+1.1*near))),lo,hi);
   addLot(T,L,{x:cx,z:cz,w:w-.06,d:d,ry:row?0:PI,st:st,kind:st>=5?'mid':(rnd()<.45?'terrace':'house')},false);}}}
function freeSpot(L,x,z,rad){if(koHit(L,x,z,rad)||nearStreet(L,x,z,rad))return false;
 for(let i=0;i<L.lots.length;i++){const l=L.lots[i];if(Math.hypot(x-l.x,z-l.z)<l.r*.85+rad)return false;}return true;}
function scatterTrees(T,L,n,r0,r1,s0,s1){n=Math.round(n*T.q);for(let i=0,tries=0;i<n&&tries<n*6;tries++){const a=T.rnd()*TAU,r=Math.sqrt(lerp(r0*r0,r1*r1,T.rnd())),x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(!freeSpot(L,x,z,.22))continue;L.trees.push({x:x,z:z,s:T.rr(s0,s1),t:T.rnd()<.35?1:0});i++;}}
// street furniture slots: lamps on alternating sides of 'road' streets, parked cars at the kerb
function dressStreets(T,L){const P=T.P,roads=L.streets.filter(s=>s.kind==='road');
 if(P.lamps)for(let i=0;i<roads.length;i++){const s=roads[i],c=cum(s.pts),len=c[c.length-1];let k=0;
  for(let t=P.lampStep*.5;t<len-.4;t+=P.lampStep/Math.max(.5,T.q),k++){const p=polyAt(s.pts,c,t),sd=k&1?1:-1,off=s.w/2+.07;
   const x=p[0]-p[3]*sd*off,z=p[1]+p[2]*sd*off;if(!koHit(L,x,z,.05)&&Math.hypot(x,z)<T.bAt(x,z)*1.06)L.lamps.push({x:x,z:z,k:'street',tx:p[2],tz:p[3],sd:sd});}}
 const nc=Math.round((P.cars||0)*T.q);
 for(let i=0,tries=0;i<nc&&roads.length&&tries<nc*5;tries++){const s=roads[Math.floor(T.rnd()*roads.length)],c=cum(s.pts),len=c[c.length-1],p=polyAt(s.pts,c,.6+T.rnd()*(len-1.2));
  const sd=T.rnd()<.5?1:-1,off=s.w/2-.11,x=p[0]-p[3]*sd*off,z=p[1]+p[2]*sd*off;if(koHit(L,x,z,.2)||Math.hypot(x,z)>T.bAt(x,z)*.95)continue;
  L.cars.push({x:x,z:z,ry:Math.atan2(-p[3],p[2])+(sd>0?PI:0)});i++;}}
// closed wobbly ring polyline (first point repeated at the end)
function ringPts(T,r,n,w1,w2){const p1=T.rnd()*TAU,p2=T.rnd()*TAU,o=[];
 for(let i=0;i<=n;i++){const a=(i%n)*TAU/n,rr=r+w1*Math.sin(2*a+p1)+w2*Math.sin(3*a+p2);o.push([Math.cos(a)*rr,Math.sin(a)*rr]);}return o;}
const ryIn=a=>Math.atan2(-Math.cos(a),-Math.sin(a));           // lot rotation whose front (+z) faces the site centre from angle a

// ======================= (7) layouts =======================
// --- grid (normaltech): two axes, irregular spacing; square block at the centre; substation + pylons + data centre at the edge
function gridLines(T,hs){const P=T.P,a=[hs],b=[-hs];let p=hs;
 for(;;){p+=P.blockMin*(1+P.jitter*T.rnd());if(p>T.R-1.6)break;a.push(p);}
 p=-hs;for(;;){p-=P.blockMin*(1+P.jitter*T.rnd());if(p<-T.R+1.6)break;b.unshift(p);}
 return b.concat(a);}
function cellCentre(bx,bz,x,z){let cx=x,cz=z;for(let i=1;i<bx.length;i++)if(x>=bx[i-1]&&x<bx[i])cx=(bx[i-1]+bx[i])/2;
 for(let i=1;i<bz.length;i++)if(z>=bz[i-1]&&z<bz[i])cz=(bz[i-1]+bz[i])/2;return[cx,cz];}
function* layGrid(T,L){const R=T.R,P=T.P,sw=P.streetW,hs=2.15,xs=gridLines(T,hs),zs=gridLines(T,hs);
 for(const x of xs){const h=Math.sqrt(Math.max(0,R*R-x*x))-.35;if(h>1.5)addStreet(L,[[x,-h],[x,h]],sw,'road');}
 for(const z of zs){const h=Math.sqrt(Math.max(0,R*R-z*z))-.35;if(h>1.5)addStreet(L,[[-h,z],[h,z]],sw,'road');}
 for(const x of xs)for(const z of zs)if(Math.hypot(x,z)<R-1)L.nodes.push([x,z]);
 const sq=2*hs-sw-.2;addSlot(L,'square',{x:0,z:0,r:hs-.2,w:sq,d:sq,ry:0},false);
 addSlot(L,'regulator',{x:0,z:-sq/2+.75,r:1.3,w:2.5,d:1.0,ry:0},false);
 const bx=[-R].concat(xs,[R]),bz=[-R].concat(zs,[R]);
 const aS=T.rnd()*TAU;let c=cellCentre(bx,bz,Math.cos(aS)*(R-3.6),Math.sin(aS)*(R-3.6));if(Math.hypot(c[0],c[1])>R-2.1)c=[Math.cos(aS)*(R-3.2),Math.sin(aS)*(R-3.2)];
 const sub=addSlot(L,'substation',{x:c[0],z:c[1],r:1.45,w:2.0,d:1.6,ry:0});
 const aD=aS+PI*T.rr(.7,1.3);c=cellCentre(bx,bz,Math.cos(aD)*(R-4),Math.sin(aD)*(R-4));if(Math.hypot(c[0],c[1])>R-2.7)c=[Math.cos(aD)*(R-3.8),Math.sin(aD)*(R-3.8)];
 addSlot(L,'datacenter',{x:c[0],z:c[1],r:2.1,w:3.2,d:1.5,ry:Math.abs(Math.cos(aD))>.7?PI/2:0});
 // pylon line: leaves the substation obliquely and runs out to the town edge
 const py=[];for(const tw of[.95,0]){py.length=0;const sa=Math.atan2(sub.z,sub.x)+tw,dx=Math.cos(sa),dz=Math.sin(sa);
  for(let k=0;k<4;k++){const x=sub.x+dx*(1.9+2.5*k),z=sub.z+dz*(1.9+2.5*k);if(Math.hypot(x,z)<R-.5)py.push({x:x,z:z,r:.32,a:sa});}
  if(py.length>=2)break;}
 if(!py.length)py.push({x:sub.x*.92,z:sub.z*.92+1.7,r:.32,a:aS});
 L.slots.pylons=py.slice();for(const p of py)L.ko.push({x:p.x,z:p.z,r:p.r,n:'pylon'});
 let nb=0;for(let i=1;i<bx.length;i++)for(let j=1;j<bz.length;j++){if(bx[i-1]<0&&bx[i]>0&&bz[j-1]<0&&bz[j]>0)continue;fillBlock(T,L,bx[i-1],bz[j-1],bx[i],bz[j]);if(++nb%10===0)yield 1;}
 for(const e of[[xs[0]>-hs?-hs:-hs,0,PI],[hs,0,0]]){const h=Math.sqrt(R*R-hs*hs)-.35;L.entries.push({x:e[0],z:h,a:PI/2},{x:e[0],z:-h,a:-PI/2});}
 yield 1;scatterTrees(T,L,P.trees,2.5,R-.6,.7,1.1);
 L.anchors.square=[0,0];}
// --- strict (o1984): orthogonal grid, identical slab pairs per block, ministry at the centre, towers on the cardinal blocks
function layStrict(T,L){const R=T.R,P=T.P,sw=P.streetW,p=R/3.5,xs=[-2.5,-1.5,-.5,.5,1.5,2.5].map(k=>k*p);
 for(const x of xs){const h=Math.sqrt(R*R-x*x)-.3;if(h>1.5){addStreet(L,[[x,-h],[x,h]],sw,'road');addStreet(L,[[-h,x],[h,x]],sw,'road');}}
 for(const x of xs)for(const z of xs)if(Math.hypot(x,z)<R-.8)L.nodes.push([x,z]);
 addSlot(L,'ministry',{x:0,z:0,r:p/2-sw/2,w:p-sw-.7,d:p-sw-.7,ry:0});
 const sl=[];for(let k=0;k<4;k++){const a=k*PI/2,o={x:Math.cos(a)*2*p,z:Math.sin(a)*2*p,r:.9,ph:k*1.7+T.rnd()};sl.push(o);L.ko.push({x:o.x,z:o.z,r:o.r,n:'searchlight'});}
 L.slots.searchlights=sl;
 // checkpoints on four entry roads (one per side, pinwheel)
 const h=Math.sqrt(R*R-.25*p*p)-.3,cp=[{x:.5*p,z:-(h-1.5),a:-PI/2},{x:-.5*p,z:h-1.5,a:PI/2},{x:h-1.5,z:.5*p,a:0},{x:-(h-1.5),z:-.5*p,a:PI}];
 L.slots.checkpoints=cp;for(const c of cp)L.entries.push({x:c.x+Math.cos(c.a)*1.5,z:c.z+Math.sin(c.a)*1.5,a:c.a});
 const m=sw/2+.3,W=p-2*m,dS=1.0;
 for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){if(!i&&!j)continue;const cx=i*p,cz=j*p,st=P.storeys[0]+Math.floor(hash2(i+T.seed%97,j)*(P.storeys[1]-P.storeys[0]+1)),alongZ=((i+j)&1)===1;
  for(const s of[-1,1]){const off=s*(p/2-m-dS/2);
   addLot(T,L,alongZ?{x:cx+off,z:cz,w:W,d:dS,ry:s>0?-PI/2:PI/2,st:st,kind:'slab'}:{x:cx,z:cz+off,w:W,d:dS,ry:s>0?0:PI,st:st,kind:'slab'},false);}}
 L.anchors.square=[0,0];}
// --- organic (protector): S-curve high street, wobbly loop, three lanes; irregular lots with setbacks; many trees
function* layOrganic(T,L){const R=T.R,P=T.P,sw=P.streetW,ph=T.rnd()*TAU,A=R*.15,main=[];
 for(let i=0;i<=28;i++){const t=i/28*2-1,x=t*(R-.5),z=A*Math.sin(t*2.3+ph)+R*.05*Math.sin(t*5.1+ph*2);if(Math.hypot(x,z)<R-.45)main.push([x,z]);}
 const sM=addStreet(L,main,sw*1.15,'road'),loop=ringPts(T,R*.5,40,R*.05,R*.03),sL=addStreet(L,loop,sw,'road',true),lanes=[];
 for(let k=0;k<3;k++){const a0=(k+.5)*TAU/3+T.rr(-.3,.3),dr=T.rr(-.25,.25),pts=[];
  for(let j=0;j<=6;j++){const r=lerp(R*.52,R*.86,j/6),a=a0+dr*j/6;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}lanes.push(addStreet(L,pts,sw*.8,'road'));}
 const c=cum(main),mid=polyAt(main,c,c[c.length-1]*.5),g=addSlot(L,'green',{x:mid[0]-mid[3]*1.9,z:mid[1]+mid[2]*1.9,r:1.35});
 const an=polyAt(main,c,c[c.length-1]*.36);addSlot(L,'anomaly',{x:an[0]+an[3]*(sw*.6+.1),z:an[1]-an[2]*(sw*.6+.1),r:.3,ry:Math.atan2(-an[3],an[2])});
 addSlot(L,'dome',{x:0,z:0,r:R*.97,h:R*.55},false);
 const o={w:[.9,1.45],d:[.8,1.1],set:[.14,.5],gap:[.22,.75],st:P.storeys,kind:'house'};
 lotsAlong(T,L,sM,Object.assign({t0:.6,t1:.6},o));yield 1;lotsAlong(T,L,sL,o);yield 1;for(const s of lanes)lotsAlong(T,L,s,Object.assign({t0:.5},o));
 L.entries.push({x:main[0][0],z:main[0][1],a:PI},{x:main[main.length-1][0],z:main[main.length-1][1],a:0});
 for(let i=0;i<5;i++){const a=i*TAU/5;L.trees.push({x:g.x+Math.cos(a)*.8,z:g.z+Math.sin(a)*.8,s:1.1,t:0});}
 yield 1;scatterTrees(T,L,P.trees,1,R-.5,.7,1.25);
 L.anchors.square=[g.x,g.z];}
// --- ring (egalitarian): commons + amphitheatre, three concentric rings of identical houses, workshop + library on ring A
function* layRing(T,L){const R=T.R,P=T.P,sw=P.streetW,rc=R*.3,r1=R*.36,r2=R*.62,hw=1.15,hd=.95,a0=T.rnd()*TAU;
 addSlot(L,'commons',{x:0,z:0,r:rc},false);
 const aA=a0+PI*.5;addSlot(L,'amphitheatre',{x:0,z:0,r:4.45,a:aA},true);   // B2 r3: bowl with berm, r 4.4 (fills the commons)
 const s1=addStreet(L,ringPts(T,r1,48,0,0),sw,'path',true),s2=addStreet(L,ringPts(T,r2,64,0,0),sw,'path',true);
 const rA=r1+sw/2+.28+hd/2,rB=r2+sw/2+.25+hd/2,rC=r2-sw/2-.25-hd/2;
 const aW=a0,aL=a0+PI*T.rr(.62,.78);
 addSlot(L,'workshop',{x:Math.cos(aW)*(rA+.15),z:Math.sin(aW)*(rA+.15),r:1.5,w:2.3,d:1.35,ry:ryIn(aW)});
 addSlot(L,'library',{x:Math.cos(aL)*(rA+.15),z:Math.sin(aL)*(rA+.15),r:1.4,w:2.0,d:1.3,ry:ryIn(aL)});
 for(let k=0;k<6;k++){const a=a0+(k+.5)*TAU/6;addStreet(L,[[Math.cos(a)*r1,Math.sin(a)*r1],[Math.cos(a)*r2,Math.sin(a)*r2],[Math.cos(a)*R*.9,Math.sin(a)*R*.9]],sw*.7,'path');
  L.entries.push({x:Math.cos(a)*R*.9,z:Math.sin(a)*R*.9,a:a});}
 const ringOf=(r,out,ph)=>{const n=Math.floor(TAU*r/(hw+.55));for(let i=0;i<n;i++){const a=a0+ph+(i+.5)*TAU/n;
  addLot(T,L,{x:Math.cos(a)*r,z:Math.sin(a)*r,w:hw,d:hd,ry:ryIn(a)+(out?PI:0),st:2,kind:'plain'},true);}};
 ringOf(rA,false,0);yield 1;ringOf(rC,true,.07);yield 1;ringOf(rB,false,.03);yield 1;
 const nl=Math.max(6,Math.round(12*T.q));for(let i=0;i<nl;i++){const a=a0+(i+.25)*TAU/nl;L.lamps.push({x:Math.cos(a)*(rc+.3),z:Math.sin(a)*(rc+.3),k:'lantern'});}
 scatterTrees(T,L,P.trees*.4,rc*.55,rc-.3,.8,1.2);yield 1;scatterTrees(T,L,P.trees*.6,rB+.9,R-.5,.8,1.3);
 L.anchors.square=[0,0];}
// --- cluster (zookeeper): one oval lane, cottages around it with back gardens, playground + the one tree inside, glass enclosure
function* layCluster(T,L){const R=T.R,P=T.P,sw=P.streetW,re=R*.85,rl=R*.3,a0=T.rnd()*TAU;
 addSlot(L,'enclosure',{x:0,z:0,r:re,h:4.5},false);
 addSlot(L,'tree',{x:0,z:0,r:1.0});
 const aP=a0+2.2;addSlot(L,'playground',{x:Math.cos(aP)*rl*.55,z:Math.sin(aP)*rl*.55,r:1.05,ry:T.rnd()*TAU});
 const sLoop=addStreet(L,ringPts(T,rl,40,R*.02,R*.012),sw,'path',true),lane=[];
 const reF=Math.min(re,rl+sw*1.5+3*.9+.8+1.35+.4+1.7+R*.02); // B2 child fix: lane ends at the fitted enclosure, not at .85 R
 for(let j=0;j<=6;j++){const r=lerp(rl,reF-.35,j/6),a=a0+.18*Math.sin(j*.9);lane.push([Math.cos(a)*r,Math.sin(a)*r]);}
 const sLane=addStreet(L,lane,sw,'path');
 const hw=1.1,hd=.9,rH=rl+sw/2+.4+hd/2+R*.02,n=Math.floor(TAU*rH/(hw+.75));
 for(let i=0;i<n;i++){const a=a0+(i+.5)*TAU/n+T.rr(-.03,.03),r=rH+T.rr(0,.2),lot={x:Math.cos(a)*r,z:Math.sin(a)*r,w:hw,d:hd,ry:ryIn(a),st:2,kind:'cottage'};
  if(addLot(T,L,lot,true,sLoop))L.gardens.push({x:Math.cos(a)*(r+hd/2+.62),z:Math.sin(a)*(r+hd/2+.62),w:hw+.35,d:1.0,ry:lot.ry});}
 const before=L.lots.length;yield 1;lotsAlong(T,L,sLane,{w:[1.05,1.15],d:[.85,.95],set:[.3,.4],gap:[.6,.9],st:[2,2],kind:'cottage',t0:2.3,t1:.9});yield 1;
 for(let i=before;i<L.lots.length;i++){const l=L.lots[i],b=rotP(0,-(l.d/2+.6),l.ry);L.gardens.push({x:l.x+b[0],z:l.z+b[1],w:l.w+.3,d:.95,ry:l.ry});}
 // B2 child fix (vision 11-16: town tiny inside an oversized enclosure): second ring path + outer ring of cottages, then the
 // enclosure is fitted around the built area (machine landscape outside it is procompute's, not drawn here)
 const rP=rH+hd/2+1.35+sw/2;addStreet(L,ringPts(T,rP,48,R*.015,R*.01),sw,'path',true);
 const rH2=rP+sw/2+.4+hd/2,n2=Math.floor(TAU*rH2/(hw+.85));
 for(let i=0;i<n2;i++){const a=a0+(i+.25)*TAU/n2+T.rr(-.02,.02),r=rH2+T.rr(0,.15);if(r+hd/2+1.7>re)break;const lot={x:Math.cos(a)*r,z:Math.sin(a)*r,w:hw,d:hd,ry:ryIn(a),st:2,kind:'cottage'};
  if(addLot(T,L,lot,true,null))L.gardens.push({x:Math.cos(a)*(r+hd/2+.62),z:Math.sin(a)*(r+hd/2+.62),w:hw+.35,d:1.0,ry:lot.ry});}
 let mr=0;for(const l of L.lots)mr=Math.max(mr,Math.hypot(l.x,l.z)+l.r);for(const g of L.gardens)mr=Math.max(mr,Math.hypot(g.x,g.z)+.6);
 L.slots.enclosure.r=Math.min(re,Math.max(rl+2.5,mr+1.1));
 for(const l of L.lots)L.lamps.length<Math.round(10*T.q)&&L.lamps.push({x:l.x*.84,z:l.z*.84,k:'lantern'});
 L.entries.push({x:lane[6][0],z:lane[6][1],a:a0});
 L.anchors.square=[0,0];}
// --- old (descendants): irregular plaza, six crooked radials + two ring lanes, tight terraces; seam slot at the edge
function* layOld(T,L){const R=T.R,P=T.P,sw=P.streetW,rp=R*.19,aS=T.rnd()*TAU,all=[];
 addSlot(L,'plaza',{x:0,z:0,r:rp});
 const seam=addSlot(L,'seam',{x:Math.cos(aS)*(R-1.7),z:Math.sin(aS)*(R-1.7),r:1.45,a:aS});
 for(let k=0;k<6;k++){const a0=aS+k*TAU/6+(k?T.rr(-.16,.16):0),ph=T.rnd()*TAU,amp=k?T.rr(.05,.13):0,end=k?R-.5:R-3.2,pts=[];
  for(let j=0;j<=8;j++){const r=lerp(rp-.1,end,j/8),a=a0+amp*Math.sin(j*1.1+ph)*(j/8);pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
  all.push(addStreet(L,pts,sw*(k%3===0?1.2:1),'path'));if(k)L.entries.push({x:pts[8][0],z:pts[8][1],a:a0});}
 all.push(addStreet(L,ringPts(T,R*.45,44,R*.03,R*.02),sw,'path',true));
 // B2 r3 (vision: outer ring lane read as a round rim): the outer lane is kept only where it runs inside the warped
 // boundary, as separate open arcs that end in the outskirts
 {const rp2=ringPts(T,R*.73,60,R*.03,R*.015);let run=[];const flush=()=>{if(run.length>=4)all.push(addStreet(L,run,sw,'path'));run=[];};
  for(const p of rp2){if(Math.hypot(p[0],p[1])<T.bAt(p[0],p[1])*1.08)run.push(p);else flush();}flush();}
 const o={w:[.7,1.1],d:[.9,1.2],set:[.02,.06],gap:[.01,.07],st:P.storeys,kind:'terrace'};
 // plaza frontage first (taller, facing the plaza), then the lanes
 const nf=Math.floor(TAU*(rp+.65)/1.05);for(let i=0;i<nf;i++){const a=aS+(i+.5)*TAU/nf,r=rp+.62;
  addLot(T,L,{x:Math.cos(a)*r,z:Math.sin(a)*r,w:.95,d:1.05,ry:ryIn(a),st:P.storeys[1],kind:'terrace'},true);}
 yield 1;for(const s of all){lotsAlong(T,L,s,Object.assign({t0:s.closed?0:rp*.2+1.2,t1:.3},o));yield 1;}   // B2 r2: one step per street (cold 9.4 ms in one piece)
 const nl=Math.max(4,Math.round(7*T.q));for(let i=0;i<nl;i++){const a=aS+(i+.5)*TAU/nl;L.lamps.push({x:Math.cos(a)*(rp-.3),z:Math.sin(a)*(rp-.3),k:'lantern'});}
 scatterTrees(T,L,P.trees,rp+2,R-.6,.8,1.2);
 L.anchors.square=[0,0];L.anchors.seam=[seam.x,seam.z];}
const LAYOUTS={grid:layGrid,strict:layStrict,organic:layOrganic,ring:layRing,cluster:layCluster,old:layOld};
// B2 r2: layouts may be generator functions (grid, organic, old yield between blocks / streets); layoutSteps drives them
function* layoutSteps(T){const L=newLayout(),fn=LAYOUTS[T.P.layout]||layGrid;let it=null;
 safe('layout '+T.P.layout,()=>{it=fn(T,L);});
 if(it&&typeof it.next==='function')for(;;){let r;try{r=it.next();}catch(e){perr('layout '+T.P.layout+': '+(e&&e.message?e.message:e));break;}if(r.done)break;yield 1;}
 yield 1;safe('outskirts',()=>outskirts(T,L));safe('dressStreets',()=>dressStreets(T,L));
 L.anchors.entries=L.entries.map(e=>[e.x,e.z]);return L;}
// B2 r3 outskirts (owner: density falls off towards the edge): fields in the band b..1.3b and a few farm houses with yards,
// all hash-placed (layout rnd() stream unchanged), every corner inside .97 R
function outskirts(T,L){const P=T.P,R=T.R,nf=Math.round((P.fields||0)*T.q),nh=P.farms||0;L.fields=[];
 const CF=['#5C6A42','#77704C','#4E5C3C','#6C6046','#64703F'];
 for(let i=0,k=0;i<nf&&k<nf*4;k++){const h=hash2(k*1.37+T.seed*.07,3.3),a=(k+.5*h)*TAU/(nf*1.3)+T.seed,b=T.rb(a),r=lerp(b*.98,b*1.32,hash2(k,T.seed*.11+1.9));
  const w=1.3+1.1*hash2(k,5.5),d=.9+.8*hash2(5.5,k),x=Math.cos(a)*r,z=Math.sin(a)*r,ry=-a+(hash2(k,8.8)-.5)*.5;
  if(r+Math.hypot(w,d)/2>R*.97||koHit(L,x,z,.9)||nearStreet(L,x,z,Math.min(w,d)*.5)||inLot(L,x,z,.5))continue;
  let hit=false;for(const f of L.fields)if(Math.hypot(f.x-x,f.z-z)<(f.r+Math.hypot(w,d)/2)*.85)hit=true;if(hit)continue;
  L.fields.push({x:x,z:z,w:w,d:d,ry:ry,r:Math.hypot(w,d)/2,c:CF[(k+T.seed)%CF.length]});i++;}
 for(let i=0,k=0;i<nh&&k<nh*6;k++){const a=hash2(k*2.9,T.seed*.37)*TAU,b=T.rb(a),r=lerp(b*.95,Math.min(R-1.1,b*1.25),hash2(T.seed*.19,k*1.3)),x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(!freeSpot(L,x,z,.8))continue;let f=false;for(const q of L.fields)if(Math.hypot(q.x-x,q.z-z)<q.r+.5)f=true;if(f)continue;
  if(addLot(T,L,{x:x,z:z,w:.95+.3*hash2(k,1.1),d:.8+.2*hash2(1.1,k),ry:-a+PI/2*Math.round(hash2(k,4.4)*3),st:2,kind:'house',out:true},false)){
   const l=L.lots[L.lots.length-1],o=rotP(0,-(l.d/2+.5),l.ry);(L.gardens.push({x:l.x+o[0],z:l.z+o[1],w:l.w+.4,d:.8,ry:l.ry,yard:1}));
   L.trees.push({x:l.x-o[0]*1.6+.4,z:l.z-o[1]*1.6,s:.9,t:1});i++;}}}
function layout(T){const it=layoutSteps(T);let r=it.next();while(!r.done)r=it.next();return r.value;}

// ---- PART 1 API (used by part 2, same IIFE scope) ----
// utils: root TAU PI STOREY BAY clamp lerp perr safe mulberry32 hash2 rotP hex tone PAL PRESETS ALIAS mkTown(site,ctx)->T
// T: {THREE,site,ctx,id,P,R,rot,seed,rnd,mood,q,A,has(n),ri,rr,toLocal(x,z),yl(x,z)}
// mats: makeMats(T)->{M:{building,metal,ground,light,glass,foliage,beam,dome},U:{uT,uOut,uLit,uGain,uWarm},used}
// emit: buf(win) bufTris tri quad quadUp triUp wall rectPts prism box roof cyl strut cum polyAt resample ribbon disc rectGrid seat
// layout: layout(T)->L {lots,streets,slots,ko,nodes,entries,trees,lamps,cars,gardens,anchors}; addSlot koHit nearStreet freeSpot ryIn
// ======================= (8) build state + small helpers =======================
const now=()=>(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
const palHex=k=>PAL[k]||(typeof k==='string'&&k[0]==='#'&&k.length===7?k:PAL.concrete0);
const wallCol=(T,sd)=>{const w=T.P.walls;return hex(palHex(w[sd%w.length]),T.A*(.86+.26*hash2(sd,3.1)));};
const roofCol=(T,sd)=>{const w=T.P.roofs;return hex(palHex(w[sd%w.length]),T.A*(.85+.2*hash2(sd,7.7)));};
function newBuild(T,L,MM){const THREE=T.THREE,mk=()=>({building:buf(true),metal:buf(),ground:buf(false,T.fa),light:buf(),glass:buf(),foliage:buf()});
 return{T:T,L:L,M:MM.M,U:MM.U,used:MM.used,N:mk(),D:mk(),F:{building:buf(),metal:buf(),ground:buf(),light:buf()},farSp:0,day:T.mood==='day',
  inst:{tree0:[],tree1:[],car:[],lamp:[],pole:[],bench:[],bin:[],shelter:[]},beams:[],moving:[],movers:[],lights:[],anims:[],extra:[],extraMid:[],subTop:null,
  walkers:[],bots:[],drones:[],r4:mulberry32(((T.seed|0)*2654435761)^0x5bd1e995),inB:()=>true,put:()=>false,peoCol:()=>[.5,.5,.5],
  m4:new THREE.Matrix4(),q:new THREE.Quaternion(),v:new THREE.Vector3(),s:new THREE.Vector3(),one:new THREE.Vector3(1,1,1),eul:new THREE.Euler()};}
const em=(B,h,k)=>hex(h,k*(B.day?.35:1));                       // emissive colour for the light family (HDR at blue hour)
function addLight(B,x,y,z,h,i,d){B.lights.push({x:x,y:y,z:z,color:h,intensity:i,dist:d});}
// far proxies of special pieces (budget-capped); same argument order as box()
function farBox(B,fam,x,y0,z,w,h,d,ry,col,top){if(B.farSp>480)return;B.farSp+=10;box(B.F[fam],x,y0,z,w,h,d,ry,col,null,top);}
function geomOf(T,b,bake){const THREE=T.THREE,g=new THREE.BufferGeometry();let p=b.p,n=b.n;
 if(bake&&T.rot){p=p.slice();n=n.slice();for(let i=0;i<p.length;i+=3){let q=T.toLocal(p[i],p[i+2]);p[i]=q[0];p[i+2]=q[1];q=T.toLocal(n[i],n[i+2]);n[i]=q[0];n[i+2]=q[1];}}
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));
 g.setAttribute('color',b.a?new THREE.Float32BufferAttribute(rgba(b,0,b.a.length),4):new THREE.Float32BufferAttribute(b.c,3));if(b.w)g.setAttribute('aWin',new THREE.Float32BufferAttribute(b.w,4));
 g.computeBoundingSphere();return g;}
// list entries: [x,y,z,sx,sy,sz,ry,col|null]
function instMesh(B,name,g,mat,list){const THREE=B.T.THREE,n=list.length;if(!n)return null;const im=new THREE.InstancedMesh(g,mat,n),cc=new Float32Array(n*3);let hasC=false;
 for(let i=0;i<n;i++){const e=list[i],c=e[7];B.eul.set(0,e[6]||0,0,'XYZ');B.q.setFromEuler(B.eul);B.m4.compose(B.v.set(e[0],e[1],e[2]),B.q,B.s.set(e[3],e[4],e[5]));im.setMatrixAt(i,B.m4);
  if(c)hasC=true;cc[i*3]=c?c[0]:1;cc[i*3+1]=c?c[1]:1;cc[i*3+2]=c?c[2]:1;}
 if(hasC)im.instanceColor=new THREE.InstancedBufferAttribute(cc,3);im.instanceMatrix.needsUpdate=true;im.name=name;im.frustumCulled=false;im.receiveShadow=true;return im;}
function trisOf(o){let n=0,d=0;if(o)o.traverse(m=>{if(m.isMesh){const g=m.geometry,c=g.index?g.index.count:g.attributes.position.count;n+=c/3*(m.isInstancedMesh?m.count:1);d++;}});return[Math.round(n),d];}
// 4-leg tapered lattice (pylons, searchlight towers)
function lattice(b,x,y,z,r0,r1,H,n,col,t){const C=[[1,1],[-1,1],[-1,-1],[1,-1]],P3=(i,k)=>{const r=lerp(r0,r1,k/n),c=C[i&3];return[x+c[0]*r,y+H*k/n,z+c[1]*r];};
 for(let i=0;i<4;i++){strut(b,P3(i,0),P3(i,n),t*1.4,col);for(let k=0;k<n;k++){strut(b,P3(i,k+1),P3(i+1,k+1),t,col);strut(b,P3(i,k),P3(i+1,k+1),t,col);}}}

// ======================= (9) ground + streets =======================
const GCOL={grid:['pave',.62],strict:['concrete0',.5],organic:['grass',.9],ring:['grass',.95],cluster:['grass',1],old:['pave',.72]};
// B2 r2 street contrast (vision r1: streets low-contrast at blue hour): pale kerb/pavement strip under every road, darker
// asphalt, pale centre dashes, zebra crossings at grid/strict junctions (NEAR only; MID keeps the plain ribbons)
function dashes(b,T,pts,col,lift,step,len,w){const c=cum(pts),L=c[c.length-1];
 for(let t=step*.5;t<L-step*.3;t+=step){const p=polyAt(pts,c,t),dx=p[2]*len/2,dz=p[3]*len/2,nx=-p[3]*w/2,nz=p[2]*w/2,Y=(x,z)=>T.yl(x,z)+lift;
  const a=[p[0]-dx-nx,0,p[1]-dz-nz],e=[p[0]+dx-nx,0,p[1]+dz-nz],f=[p[0]+dx+nx,0,p[1]+dz+nz],g=[p[0]-dx+nx,0,p[1]-dz+nz];
  for(const q of[a,e,f,g])q[1]=Y(q[0],q[2]);quadUp(b,a,e,f,g,col);}}
function zebras(B,S){const T=B.T,L=B.L,sw=T.P.streetW,col=hex(PAL.mark,.85*T.A);
 for(const n of L.nodes)for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const cx=n[0]+d[0]*(sw/2+.22),cz=n[1]+d[1]*(sw/2+.22);
  if(!nearStreet(L,n[0]+d[0]*(sw/2+.6),n[1]+d[1]*(sw/2+.6),.01)||Math.hypot(cx,cz)>T.R-.6)continue;
  for(let j=0;j<5;j++){const o=(j-2)*sw*.18;rectGrid(S.ground,T,cx+d[1]*o,cz+d[0]*o,d[0]?.2:.07,d[0]?.07:.2,0,1,1,col,.03);}}}
function ground(B,S,mid){const it=groundGen(B,S,mid);while(!it.next().done);}
// B2 r2: generator so buildSteps can slice it (r2 kerbs + dashes + zebras made the NEAR ground step ~2x slower)
function* groundGen(B,S,mid){const T=B.T,L=B.L,g=GCOL[T.P.layout]||GCOL.grid,col=hex(PAL[g[0]],g[1]*T.A),lay=T.P.layout;
 // B2 r3: no round plate - a wide feathered underlay (alpha T.fa: warped boundary, fades to 0 before R) with the same tone
 disc(S.ground,T,0,0,T.R*1.02,mid?6:12,mid?32:56,col,-.03);yield 1;
 // B2 r3 street readability: every street gets an edge strip that contrasts with its surface (roads: pale kerb + dark asphalt
 // + centre dashes; old-quarter lanes: pale kerb + dark setts; garden paths: dark edge + pale gravel). MID keeps the strips.
 const KERB=hex(PAL.kerb,.95*T.A),EDGE=hex('#4A4840',T.A),SETT=hex('#3A3734',T.A),GRAV=hex('#A8A08A',T.A);
 for(const s of L.streets){const rd=s.kind==='road',old=lay==='old',st=mid?2.2:.7;
  if(rd||old){ribbon(S.ground,T,s.pts,s.w+(mid?.3:.26),KERB,.01,st);ribbon(S.ground,T,s.pts,s.w,rd?hex(T.id==='protector'?'#5C564E':PAL.asphalt,T.A):SETT,.02,st);}   // r4: protector = warm block paving, not asphalt
  else{ribbon(S.ground,T,s.pts,s.w+.16,EDGE,.01,st);ribbon(S.ground,T,s.pts,s.w,GRAV,.02,st);}
  if(rd&&!mid&&s.w>=.4)dashes(S.ground,T,s.pts,hex(PAL.mark,.7*T.A),.027,.62,.26,s.w>=.5?.028:.02);yield 1;}
 if(!mid&&(lay==='grid'||lay==='strict')){zebras(B,S);yield 1;}
 // outskirts: fields (furrow stripes NEAR only) + farm yards
 for(const f of(L.fields||[])){const fc=hex(f.c,T.A);rectGrid(S.ground,T,f.x,f.z,f.w,f.d,f.ry,mid?1:2,mid?1:2,fc,.022);
  if(!mid)for(let i=-2;i<=2;i++){const o=rotP(i*f.w*.18,0,f.ry);rectGrid(S.ground,T,f.x+o[0],f.z+o[1],.07,f.d*.92,f.ry,1,2,tone(fc,.72),.026);}}
 if(!T.has('gardens'))for(const gd of L.gardens)if(gd.yard)rectGrid(S.ground,T,gd.x,gd.z,gd.w,gd.d,gd.ry,1,1,hex(PAL.grass,1.25*T.A),.024);
 yield 1;
 const gr=L.slots.green;
 if(gr){disc(S.ground,T,gr.x,gr.z,gr.r,mid?1:3,mid?10:20,hex(PAL.grass,1.2*T.A),.03);
  if(!mid){const y=T.yl(gr.x,gr.z),st=hex(PAL.stone,T.A);cyl(S.building,gr.x,y-.05,gr.z,.2,.2,.17,10,st,tone(st,.5));
   for(let i=0;i<3;i++){const a=i*TAU/3+.4;box(S.building,gr.x+Math.cos(a)*.6,T.yl(gr.x+Math.cos(a)*.6,gr.z+Math.sin(a)*.6)-.02,gr.z+Math.sin(a)*.6,.3,.07,.09,ryIn(a),hex(PAL.timber,T.A));}}}
 // B2 r3: FAR town tone = irregular polygon at .8 b (no round disc)
 if(!mid){const n=18,y=a=>{const r=T.rb(a)*.8;return[Math.cos(a)*r,T.yl(Math.cos(a)*r,Math.sin(a)*r)+.02,Math.sin(a)*r];},c0=[0,T.yl(0,0)+.02,0];
  for(let i=0;i<n;i++)triUp(B.F.ground,c0,y(i*TAU/n),y((i+1)*TAU/n),col);}}

// ======================= (10) buildings (lot -> archetype) =======================
function emitLot(B,l,S,mid){const T=B.T,P=T.P,b=S.building,pts=rectPts(l.x,l.z,l.w,l.d,l.ry),s=seat(T,pts),y0=s.hi+(mid?0:.05),h=l.st*STOREY,y1=y0+h,k=l.kind;
 let wc=wallCol(T,l.seed),win={lit:P.lit,seed:l.seed,bay:k==='slab'?.26:BAY};const rc=roofCol(T,l.seed);
 if(T.id==='normaltech'&&k==='mid'&&l.seed%4===0){wc=hex(['#56646E','#4E5A60','#62686C'][l.seed%3],T.A);win.bay=.2;win.lit=P.lit*1.15;}   // B2 r2: glazed office variant
 if(l.lab){win.lit=P.lit*.04;wc=tone(wc,.62);}                    // B2 r4: o1984 research compound - unlit, darker (NEAR + MID)
 const rk=(k==='slab'||k==='mid')?'flat':P.roof==='mix'?(l.seed%3?'pitched':'flat'):P.roof;
 if(!mid||s.hi-s.lo>.03)prism(b,rectPts(l.x,l.z,l.w+.04,l.d+.04,l.ry),s.lo-.15,y0,tone(wc,.6),null,mid?false:null);
 prism(b,pts,y0,y1,wc,win,rk==='pitched'?false:rc);
 const rh=Math.min(l.w,l.d)*(.34+.1*hash2(l.seed,1.7))*(T.id==='descendants'?1.45:1);   // r4: descendants = steep old roofs (NEAR+MID)
 if(rk==='pitched')roof(b,l.x,y1,l.z,l.w,l.d,l.ry,rh,l.seed%4===0?'hip':'gable',rc,.05,wc);
 else if(rk==='green')box(b,l.x,y1,l.z,l.w+.1,.05,l.d+.1,l.ry,tone(wc,.8),null,hex(PAL.greenRoof,T.A));
 if(mid)return;
 if(rk==='green')box(S.metal,l.x,y1+.05,l.z,l.w*.45,.03,l.d*.5,l.ry,hex(PAL.solar,1));
 if(rk==='pitched'&&l.seed%2){const o=rotP(l.w*.25,0,l.ry);box(b,l.x+o[0],y1,l.z+o[1],.09,rh+.1,.09,l.ry,hex(PAL.brick0,T.A*.9));}
 if(k==='house'||k==='cottage'||k==='plain'){const o=rotP(l.w*.15,l.d/2+.07,l.ry);box(b,l.x+o[0],s.lo-.1,l.z+o[1],.3,y0-s.lo+.36,.14,l.ry,tone(wc,.8),null,rc);}
 if(rk==='flat'){box(b,l.x,y1,l.z,l.w+.05,.07,l.d+.05,l.ry,tone(wc,.85),null,rc);
  if(k==='slab'){for(const sd of[-1,1]){const o=rotP(sd*l.w*.3,0,l.ry);box(b,l.x+o[0],y1+.07,l.z+o[1],.3,.2,.3,l.ry,tone(wc,.8));}}
  else{const o=rotP(-l.w*.2,0,l.ry);box(S.metal,l.x+o[0],y1+.07,l.z+o[1],.3,.14,.24,l.ry,hex(PAL.steel,.8*T.A));}}
 if(k==='mid'){const o=rotP(0,l.d/2+.03,l.ry);for(let i=2;i<l.st&&i<8;i+=2)box(b,l.x+o[0],y0+i*STOREY-.03,l.z+o[1],l.w*.8,.04,.07,l.ry,tone(wc,.7));}
 safe('lotDetail',()=>lotDetail(B,l,S,y0,y1,wc,rc,rk,rh));}
// B2 child addition (vision 11-16: NEAR massing read as toy boxes): NEAR-only facade articulation per lot, ~150-400 tris.
// corner pilasters, plinth course, string courses, cornice/eaves fascia, door recess + step, awnings on ground-floor shops,
// roof plant on flat roofs, dormers / ridge caps on pitched roofs. Deterministic from l.seed (no rnd() draws: layout stream kept).
function lotDetail(B,l,S,y0,y1,wc,rc,rk,rh){const T=B.T,b=S.building,k=l.kind,sd=l.seed,hw=l.w/2,hd=l.d/2,ry=l.ry,dk=hex(PAL.dark,T.A),h=y1-y0;
 const at=(lx,lz)=>{const o=rotP(lx,lz,ry);return[l.x+o[0],l.z+o[1]];},pil=tone(wc,.78),crs=tone(wc,1.1);
 for(const c of[[hw,hd],[-hw,hd],[hw,-hd],[-hw,-hd]]){const p=at(c[0]-Math.sign(c[0])*.02,c[1]-Math.sign(c[1])*.02);box(b,p[0],y0,p[1],.06,h,.06,ry,pil,null,false);}
 box(b,l.x,y0,l.z,l.w+.03,.07,l.d+.03,ry,tone(wc,.62),null,false);                       // plinth course
 const every=k==='slab'?3:(k==='mid'?1:(l.st>=3?1:9));
 for(let i=every;i<l.st;i+=every)box(b,l.x,y0+i*STOREY-.012,l.z,l.w+.025,.024,l.d+.025,ry,crs,null,false); // string courses
 if(rk==='flat'){box(b,l.x,y1+.07,l.z,l.w+.09,.035,l.d+.09,ry,crs,null,tone(rc,1.1));      // cornice cap
  const n=1+(sd%3);for(let i=0;i<n;i++){const p=at((hash2(sd,i)-.5)*l.w*.55,(hash2(i,sd)-.5)*l.d*.5);box(S.metal,p[0],y1+.07,p[1],.12+.08*hash2(sd,i+3),.08,.1,ry,hex(PAL.steel,.75*T.A));}}
 else if(rk==='pitched'){box(b,l.x,y1-.035,l.z,l.w+.1,.035,l.d+.1,ry,tone(wc,.55),null,false); // eaves fascia
  if(l.w>1.05&&sd%3===0){const p=at(-hw*.35,hd*.25);box(b,p[0],y1,p[1],.2,rh*.55,.2,ry,wc,null,false);roof(b,p[0],y1+rh*.55,p[1],.2,.24,ry+PI/2,.1,'gable',rc,.03,wc);}}
 const dp=at((sd%2?.22:-.22)*l.w,hd+.012),door=k==='slab'?.5:.24;box(b,dp[0],y0,dp[1],door,.26,.03,ry,dk,null,false);   // door recess
 const st=at((sd%2?.22:-.22)*l.w,hd+.06);box(b,st[0],y0-.06,st[1],door+.1,.06,.1,ry,tone(wc,.7));                        // step
 if(T.id==='normaltech'&&(k==='mid'||rk==='flat')&&sd%2===0){const a=at(0,hd+.09);box(b,a[0],y0+.3,a[1],l.w*.75,.025,.18,ry,hex(['#5F6B66','#7D6A55','#4E5A63'][sd%3],T.A));}
 lotExtra(B,l,S,y0,y1,wc,rc,rk,rh,at);safe('lotRelief',()=>lotRelief(B,l,S,y0,y1,wc,rc,rk,rh,at));}
// B2 r2 (look round: facade variety + rooftop clutter, NEAR only, deterministic from l.seed, no rnd() draws):
// shopfronts with lit glazing on street-facing ground floors, penthouse setbacks, water tanks, stair housings, antennas,
// AC units; o1984 slabs get one identical roof kit each (repetition is the point there).
function lotExtra(B,l,S,y0,y1,wc,rc,rk,rh,at){const T=B.T,b=S.building,m=S.metal,k=l.kind,sd=l.seed,ry=l.ry,hd=l.d/2,st=hex(PAL.steel,.75*T.A),dk=hex(PAL.dark,T.A),id=T.id;
 const h1=(a,c)=>hash2(sd*.37+a,c);
 if((id==='normaltech'&&(k==='mid'||k==='terrace'))||(id==='descendants'&&k==='terrace'&&sd%3!==0)){const p=at(0,hd+.025);
  box(b,p[0],y0,p[1],l.w*.86,.27,.05,ry,hex('#3A444C',T.A),{lit:.95,seed:sd+500,bay:.34,st:.27},tone(wc,.7));
  const q=at(0,hd+.04);box(b,q[0],y0+.28,q[1],l.w*.88,.05,.04,ry,hex(['#6D6458','#55605E','#6A5A4C','#4F5864'][sd%4],T.A));}
 if(rk==='flat'){const top=y1+.105;
  if(k==='slab'){for(const u of[-.36,-.12,.12,.36]){const p=at(u*l.w,-hd*.3);box(m,p[0],top,p[1],.1,.09,.1,ry,st);}
   const p=at(l.w*.42,0);strut(m,[p[0],top,p[1]],[p[0],top+.55,p[1]],.012,dk);return;}
  if(k==='mid'&&l.st>=5&&sd%3===1){box(b,l.x,top,l.z,l.w*.6,STOREY*.95,l.d*.58,ry,tone(wc,.92),{lit:T.P.lit*1.1,seed:sd+77},tone(rc,1.05));}
  else if(h1(1,2)<.55){const p=at(-l.w*.28,l.d*.18);box(b,p[0],top,p[1],.26,.24,.22,ry,tone(wc,.88),null,tone(rc,1.1));}
  if(h1(3,4)<.45){const p=at(l.w*.27,-l.d*.18),y=top;for(const c of[[1,1],[-1,1],[-1,-1],[1,-1]])strut(m,[p[0]+c[0]*.06,y,p[1]+c[1]*.06],[p[0]+c[0]*.06,y+.12,p[1]+c[1]*.06],.008,st);
   cyl(m,p[0],y+.12,p[1],.1,.1,.17,8,hex(PAL.timberL,.8*T.A),hex(PAL.roof1,T.A));}
  const na=1+Math.floor(h1(5,6)*3);for(let i=0;i<na;i++){const p=at((h1(i,7)-.5)*l.w*.6,(h1(7,i)-.5)*l.d*.55);box(m,p[0],top,p[1],.09,.07,.07,ry+PI/2*(i&1),hex(PAL.concrete1,.8*T.A));}
  if(h1(8,9)<.3){const p=at(-l.w*.38,-l.d*.3);strut(m,[p[0],top,p[1]],[p[0],top+.45+.4*h1(9,8),p[1]],.009,dk);}}
 else if(rk==='pitched'&&id==='protector'&&sd%4===1){const o=at(l.w*.3,hd+.35);box(b,o[0],y0-.05,o[1],.5,.16,.04,ry,hex(PAL.timberL,.9*T.A));}}   // garden fence

// ======================= (11) specials: normaltech =======================
function square(B,S,mid,sl){const T=B.T;rectGrid(S.ground,T,sl.x,sl.z,sl.w,sl.d,0,mid?2:6,mid?2:6,hex(PAL.pave,.95*T.A),.035);if(mid)return;
 const CC=['#7D6A55','#5F6B66','#8A7F6A'],dk=hex(PAL.dark,T.A);
 for(let i=0;i<6;i++){const x=sl.x+(i%3-1)*.95,z=sl.z+.45+Math.floor(i/3)*.75,y=T.yl(x,z);
  for(const c of[[-.2,-.14],[.2,-.14],[.2,.14],[-.2,.14]])strut(S.metal,[x+c[0],y,z+c[1]],[x+c[0],y+.3,z+c[1]],.008,dk);
  box(S.building,x,y+.3,z,.5,.03,.36,0,hex(CC[i%3],T.A));box(S.building,x,y,z,.36,.12,.2,0,hex(PAL.timber,T.A));}
 const h=sl.w/2-.2;for(const c of[[-h,-h],[h,-h],[h,h],[-h,h]])B.L.lamps.push({x:sl.x+c[0],z:sl.z+c[1],k:'street'});
 addLight(B,sl.x-h,T.yl(sl.x-h,sl.z+h)+.6,sl.z+h,PAL.lamp,.5,2.2);addLight(B,sl.x+h,T.yl(sl.x+h,sl.z+h)+.6,sl.z+h,PAL.lamp,.5,2.2);}
function regulator(B,S,mid,sl){const T=B.T,b=S.building,pts=rectPts(sl.x,sl.z,sl.w,sl.d,sl.ry),s=seat(T,pts),y0=s.hi+.12,h=4*STOREY,c=hex(PAL.concrete1,T.A),f=rotP(0,.11,sl.ry);
 prism(b,rectPts(sl.x+f[0],sl.z+f[1],sl.w+.3,sl.d+.6,sl.ry),s.lo-.15,y0,tone(c,.7));
 prism(b,pts,y0,y0+h,c,{lit:.7,seed:11},hex(PAL.roof0,T.A));
 box(b,sl.x+f[0],y0+h,sl.z+f[1],sl.w+.16,.1,sl.d+.5,sl.ry,tone(c,.9));
 if(mid)return;
 for(let i=0;i<6;i++){const o=rotP((i-2.5)*sl.w/6,sl.d/2+.3,sl.ry);cyl(b,sl.x+o[0],y0,sl.z+o[1],.045,.04,h,6,tone(c,1.05));}
 const o=rotP(0,sl.d/2+.5,sl.ry);box(b,sl.x+o[0],s.lo-.15,sl.z+o[1],sl.w*.7,y0-s.lo+.09,.3,sl.ry,tone(c,.75));
 farBox(B,'building',sl.x,s.lo,sl.z,sl.w,h+.3,sl.d,sl.ry,c,hex(PAL.roof0,T.A));}
function substation(B,S,mid,sl){if(mid)return;const T=B.T,m=S.metal,y=T.yl(sl.x,sl.z),st=hex(PAL.steel,.8*T.A),dk=hex(PAL.dark,T.A);
 rectGrid(S.ground,T,sl.x,sl.z,sl.w,sl.d,0,3,3,hex(PAL.pave,.5*T.A),.035);
 for(let i=0;i<3;i++){const x=sl.x-.55+i*.55,z=sl.z+.2;box(m,x,y-.05,z,.34,.35,.26,0,st);box(m,x,y+.06,z,.4,.18,.2,0,dk);
  for(let k=-1;k<=1;k++)cyl(m,x+k*.1,y+.3,z,.015,.01,.12,4,hex(PAL.concrete1,T.A));}
 const g0=[sl.x-.8,y+.95,sl.z-.4],g1=[sl.x+.8,y+.95,sl.z-.4];
 strut(m,[g0[0],y-.1,g0[2]],g0,.025,st);strut(m,[g1[0],y-.1,g1[2]],g1,.025,st);strut(m,g0,g1,.022,st);B.subTop=[sl.x,y+.95,sl.z-.4];
 box(S.building,sl.x+.7,y-.1,sl.z+.5,.4,.42,.36,0,hex(PAL.brick0,T.A),{lit:.3,seed:5},hex(PAL.roof0,T.A));
 const hw=sl.w/2,hd=sl.d/2,C=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]];
 for(let i=0;i<4;i++){const a=C[i],e=C[(i+1)%4];
  for(let k=0;k<5;k++){const x=sl.x+lerp(a[0],e[0],k/5),z=sl.z+lerp(a[1],e[1],k/5),yy=T.yl(x,z);strut(m,[x,yy-.03,z],[x,yy+.2,z],.008,dk);}
  for(const hh of[.1,.19])strut(m,[sl.x+a[0],T.yl(sl.x+a[0],sl.z+a[1])+hh,sl.z+a[1]],[sl.x+e[0],T.yl(sl.x+e[0],sl.z+e[1])+hh,sl.z+e[1]],.005,dk);}
 farBox(B,'metal',sl.x,y,sl.z,1.2,.4,.5,0,st);}
function pylons(B,S,mid,py){if(mid)return;const T=B.T,m=S.metal,H=2.4,st=hex(PAL.steel,.75*T.A),wc=hex(PAL.dark,.8);
 const att=(p,i)=>{const y=T.yl(p.x,p.z),px=-Math.sin(p.a),pz=Math.cos(p.a),s=i===1?1:-1;return i?[p.x+px*.42*s,y+H*.74,p.z+pz*.42*s]:[p.x,y+H,p.z];};
 const wire=(a,e)=>{let q=a;for(let k=1;k<=5;k++){const t=k/5,n=[lerp(a[0],e[0],t),lerp(a[1],e[1],t)-.88*t*(1-t),lerp(a[2],e[2],t)];strut(m,q,n,.006,wc);q=n;}};
 for(let j=0;j<py.length;j++){const p=py[j],y=T.yl(p.x,p.z);lattice(m,p.x,y-.1,p.z,.17,.035,H*.82+.1,3,st,.011);
  strut(m,[p.x,y+H*.82,p.z],att(p,0),.014,st);strut(m,att(p,1),att(p,2),.013,st);
  for(let i=0;i<3;i++){if(j)wire(att(py[j-1],i),att(p,i));else if(B.subTop)wire(B.subTop,att(p,i));}
  farBox(B,'metal',p.x,y,p.z,.14,H,.14,0,st);}}
function datacenter(B,S,mid,sl){const T=B.T,b=S.building,pts=rectPts(sl.x,sl.z,sl.w,sl.d,sl.ry),s=seat(T,pts),y0=s.hi+.04,h=1.0,c=hex(PAL.concrete0,.85*T.A),rc=hex(PAL.roof0,T.A);
 prism(b,rectPts(sl.x,sl.z,sl.w+.06,sl.d+.06,sl.ry),s.lo-.15,y0,tone(c,.6));prism(b,pts,y0,y0+h,c,null,rc);
 if(mid)return;
 for(const hh of[.32,.62])box(b,sl.x,y0+hh,sl.z,sl.w+.03,.07,sl.d+.03,sl.ry,tone(c,.55));
 for(let i=0;i<6;i++){const o=rotP((i-2.5)*sl.w/6.6,0,sl.ry);box(S.metal,sl.x+o[0],y0+h,sl.z+o[1],.3,.13,sl.d*.55,sl.ry,hex(PAL.steel,.8*T.A));}
 for(let i=0;i<5;i++){const o=rotP((i-2)*.55,sl.d/2+.012,sl.ry);box(S.light,sl.x+o[0],y0+.82,sl.z+o[1],.025,.025,.012,sl.ry,em(B,PAL.cool,1.5));}
 farBox(B,'building',sl.x,s.lo,sl.z,sl.w,h+.1,sl.d,sl.ry,c,rc);}

// ======================= (12) specials: o1984 =======================
function camPoles(B,S,mid){if(mid)return;const T=B.T,o=T.P.streetW/2+.06;
 for(const n of B.L.nodes){const k=Math.floor(hash2(n[0],n[1])*4),sx=k&1?1:-1,sz=k&2?1:-1,x=n[0]+sx*o,z=n[1]+sz*o;B.inst.pole.push([x,T.yl(x,z),z,1,1,1,Math.atan2(sz,-sx)+PI/4*0,null]);}}
function checkpoints(B,S,mid,cp){if(mid)return;const T=B.T,sw=T.P.streetW,dk=hex(PAL.dark,T.A),c=hex(PAL.concrete0,.8*T.A);
 for(let i=0;i<cp.length;i++){const p=cp[i],px=-Math.sin(p.a),pz=Math.cos(p.a),y=T.yl(p.x,p.z),e=sw/2+.05;
  const bx=p.x+px*(sw/2+.32),bz=p.z+pz*(sw/2+.32);box(S.building,bx,T.yl(bx,bz)-.1,bz,.34,.48,.34,-p.a,c,{lit:.9,seed:40+i,bay:.17,st:.24},hex(PAL.roof0,T.A));
  box(S.building,bx,T.yl(bx,bz)+.38,bz,.46,.03,.46,-p.a,tone(c,.7));
  for(const s of[-1,1])cyl(S.metal,p.x+px*e*s,y-.03,p.z+pz*e*s,.02,.02,.2,5,dk,true);
  strut(S.metal,[p.x-px*e,y+.14,p.z-pz*e],[p.x+px*e,y+.14,p.z+pz*e],.012,hex(PAL.concrete1,T.A));
  for(const s of[-1,1]){const qx=p.x+Math.cos(p.a)*.4+px*sw*.28*s,qz=p.z+Math.sin(p.a)*.4+pz*sw*.28*s;box(S.building,qx,T.yl(qx,qz)-.03,qz,.22,.11,.1,-p.a,tone(c,.9));}
  B.L.lamps.push({x:p.x-px*(sw/2+.1),z:p.z-pz*(sw/2+.1),k:'street'});addLight(B,bx,T.yl(bx,bz)+.3,bz,PAL.lamp,.5,2);}}
// B2 r2 (vision r1: ministry read weakly against the slabs): ~11 u stepped tower on a wide podium (slabs top out at ~3.9 u),
// vertical fins on every tier, a pale lit crown band + mast lamp that also exist in the FAR light family (skyline at distance)
function ministry(B,S,mid,sl){const T=B.T,b=S.building,W=sl.w,pts=rectPts(sl.x,sl.z,W+.5,W+.5,0),s=seat(T,pts),c=hex(PAL.concrete0,.82*T.A),cl=hex(PAL.concrete1,.9*T.A),rc=hex(PAL.roof0,.9*T.A);
 let y=s.hi+.14;prism(b,pts,s.lo-.15,y,tone(c,.6));
 box(b,sl.x,y,sl.z,W+.36,.64,W+.36,0,cl,{lit:.55,seed:19,bay:.4,st:.32},rc);
 if(!mid){for(let k=0;k<4;k++){const a=k*PI/2,o=rotP(0,W/2+.36,a);box(b,sl.x+o[0],s.lo-.1,sl.z+o[1],W*.5,y-s.lo+.14,.3,a,tone(cl,.8));}
  farBox(B,'building',sl.x,s.lo,sl.z,W+.36,y-s.lo+.64,W+.36,0,cl,rc);}
 y+=.64;
 const TI=[[.86,3.5],[.7,3.2],[.54,2.6],[.36,1.3]];
 for(let i=0;i<TI.length;i++){const w=W*TI[i][0],h=TI[i][1],tc=tone(c,1-.04*i);box(b,sl.x,y,sl.z,w,h,w,0,tc,{lit:[.5,.38,.46,.7][i],seed:20+i,bay:.2},rc);
  if(!mid){farBox(B,'building',sl.x,y,sl.z,w,h,w,0,c,rc);
   box(b,sl.x,y+h,sl.z,w+.08,.07,w+.08,0,tone(c,.75),null,tone(rc,1.1));                            // parapet cap per setback
   if(i<3){const nf=Math.max(3,Math.round(w/.24));
    for(let f=0;f<=nf;f++){const u=(f/nf-.5)*w;for(let k=0;k<4;k++){const a=k*PI/2,o=rotP(u,w/2+.025,a);box(b,sl.x+o[0],y,sl.z+o[1],.035,h,.06,a,tone(c,.72),null,false);}}}}
  y+=h;}
 const wt=W*.36,lc=em(B,'#DCE4EA',1.5);
 box(S.light,sl.x,y-.42,sl.z,wt+.02,.09,wt+.02,0,lc);box(S.light,sl.x,y-.24,sl.z,wt+.02,.05,wt+.02,0,tone(lc,.7));
 if(!mid){strut(S.metal,[sl.x,y,sl.z],[sl.x,y+1.3,sl.z],.03,hex(PAL.dark,1));box(S.light,sl.x,y+1.3,sl.z,.07,.07,.07,0,em(B,'#E8EEF2',2.2));
  addLight(B,sl.x,y-.3,sl.z,'#DCE4EA',1.0,4);farBox(B,'light',sl.x,y-.45,sl.z,wt+.04,.14,wt+.04,0,lc);}}
function searchlights(B,S,mid,list){const T=B.T,H=4,st=hex(PAL.steel,.6*T.A);
 for(let i=0;i<list.length;i++){const o=list[i],y=T.yl(o.x,o.z);
  if(mid){box(S.metal,o.x,y-.1,o.z,.3,H+.1,.3,0,st);continue;}
  lattice(S.metal,o.x,y-.1,o.z,.3,.13,H+.1,4,st,.014);box(S.metal,o.x,y+H,o.z,.44,.05,.44,0,st);box(S.metal,o.x,y+H+.05,o.z,.16,.14,.16,0,hex(PAL.dark,1));
  box(S.light,o.x,y+H+.19,o.z,.1,.03,.1,0,em(B,'#E8EEF2',2.4));
  B.beams.push({x:o.x,y:y+H+.14,z:o.z,ph:o.ph});B.movers.push({x:o.x,y:y+H,z:o.z,r:5.5,n:'searchlight'});
  addLight(B,o.x,y+H+.2,o.z,'#E8EEF2',1.0,3.5);farBox(B,'metal',o.x,y,o.z,.3,H,.3,0,st);}}

// ======================= (13) specials: protector =======================
function dome(B,S,mid,sl){const T=B.T,THREE=T.THREE;
 if(!B.domeG){B.domeG=new THREE.SphereGeometry(sl.r,40,14,0,TAU,0,PI/2);B.domeG.scale(1,sl.h/sl.r,1);B.M.dome.side=THREE.BackSide;}
 const m=new THREE.Mesh(B.domeG,B.M.dome);m.position.set(sl.x,-.6,sl.z);m.renderOrder=6;m.name=mid?'pt_mid_dome':'pt_dome';(mid?B.extraMid:B.extra).push(m);
 // B2 r2: faint footing band where the shell meets the ground, so the rim line reads from oblique views too (same shader)
 if(!mid){if(!B.domeB)B.domeB=new THREE.CylinderGeometry(sl.r*.995,sl.r,.7,64,1,true);const bd=new THREE.Mesh(B.domeB,B.M.dome);bd.position.set(sl.x,-.3,sl.z);bd.renderOrder=6;bd.name='pt_dome_band';B.extra.push(bd);}}
function lampGeos(B){if(B.gLamp)return;const T=B.T,p=buf(),h=buf();cyl(p,0,-.05,0,.014,.01,.63,4,hex(PAL.dark,1));box(p,0,.57,0,.05,.012,.05,0,hex(PAL.dark,1));
 box(h,0,.586,0,.05,.03,.05,0,[1,1,1]);B.gLamp=geomOf(T,p);B.gHead=geomOf(T,h);}
function anomaly(B,S,mid,sl){if(mid)return;const T=B.T,THREE=T.THREE;lampGeos(B);
 const g=new THREE.Group(),a=new THREE.Mesh(B.gLamp,B.M.metal),c=em(B,PAL.lamp,1.8),hm=B.M.light.clone();
 if(hm.color)hm.color.setRGB(c[0],c[1],c[2]);hm.vertexColors=false;const h=new THREE.Mesh(B.gHead,hm);
 a.name='pt_anomaly';h.name='pt_anomaly_head';g.add(a,h);g.position.set(sl.x,T.yl(sl.x,sl.z),sl.z);g.rotation.y=sl.ry||0;g.name='pt_anomaly_grp';B.extra.push(g);
 B.movers.push({x:sl.x,y:T.yl(sl.x,sl.z)+.3,z:sl.z,r:.7,n:'anomaly'});
 const ss=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
 B.anims.push(t=>{const p=((t%40)+40)%40/40;g.rotation.z=.42*(p<.6?1-ss(.08,.6,p):ss(.96,1,p));});}

// ======================= (14) specials: egalitarian =======================
function commons(B,S,mid,sl){const T=B.T;disc(S.ground,T,sl.x,sl.z,sl.r,mid?2:4,mid?16:28,hex(PAL.grass,1.18*T.A),.03);}
// B2 r2: open stepped bowl at the centre of the commons: round stage + low timber stage canopy, 6 tiers over ~230 deg,
// radial aisles; the open side faces sl.a (towards the workshop side of the ring). r ~ 3 u (was 1.6 u, off-centre)
// B2 r3 (scope: "a real sunken bowl, clearly the centre"): the terrain cannot be cut, so the bowl is built UP: a grassed earth
// berm (outer slope r 4.4 -> 3.5, ~1 u high) whose inner face is 8 stone tiers stepping DOWN to a round stage at ground level,
// over ~300 deg with the open mouth towards sl.a; inner tiers darker (bowl shade), lanterns on the rim. MID = berm + 4 tiers.
function amphitheatre(B,S,mid,sl){const T=B.T,b=S.building,y=T.yl(sl.x,sl.z),c=hex(PAL.stone,T.A),gr=hex(PAL.grass,1.05*T.A),a0=(sl.a==null?Math.atan2(sl.z,sl.x):sl.a)+PI;
 const span=5.25,n=mid?14:30,NR=mid?4:8,rS=1.05,rT=3.45,rO=4.4,H=1.0,P3=(r,a,h)=>[sl.x+Math.cos(a)*r,y+h,sl.z+Math.sin(a)*r];
 cyl(b,sl.x,y-.12,sl.z,rS,rS,.15,mid?12:28,tone(c,.75),tone(c,.95));                       // stage at the bottom of the bowl
 for(let k=0;k<NR;k++){const r0=lerp(rS+.12,rT,k/NR),r1=lerp(rS+.12,rT,(k+1)/NR),h=H*(k+1)/NR,tc=tone(c,.62+.42*k/NR),w=2*r1*Math.sin(span/n/2)+.03;
  for(let i=0;i<n;i++){if(!mid&&(i===Math.floor(n/4)||i===Math.floor(n/2)||i===Math.floor(3*n/4)))continue;   // three radial aisles
   const a=a0-span/2+(i+.5)*span/n,rm=(r0+r1)/2;box(b,sl.x+Math.cos(a)*rm,y-.14,sl.z+Math.sin(a)*rm,w,h+.14,r1-r0+.02,ryIn(a),tone(tc,.85),null,tc);}}
 // berm: flat rim walk + outer grassed slope down to the commons (open at the mouth)
 for(let i=0;i<n;i++){const a=a0-span/2+i*span/n,e=a+span/n;
  quadUp(b,P3(rT,a,H),P3(rT,e,H),P3(rT+.3,e,H),P3(rT+.3,a,H),tone(c,1.05));
  quad(b,P3(rO,a,-.08),P3(rO,e,-.08),P3(rT+.3,e,H),P3(rT+.3,a,H),gr,null);quad(b,P3(rO,e,-.08),P3(rO,a,-.08),P3(rT+.3,a,H),P3(rT+.3,e,H),gr,null);}
 for(const s of[-1,1]){const a=a0+s*span/2;quad(b,P3(rS+.12,a,-.1),P3(rO,a,-.1),P3(rT+.3,a,H),P3(rT,a,H),tone(c,.8),null);quad(b,P3(rO,a,-.1),P3(rS+.12,a,-.1),P3(rT,a,H),P3(rT+.3,a,H),tone(c,.8),null);}
 if(!mid){const tb=hex(PAL.timber,T.A),gc=hex(PAL.greenRoof,T.A),ao=a0+PI,bx=sl.x+Math.cos(ao)*.55,bz=sl.z+Math.sin(ao)*.55,ry=ryIn(ao);
  for(const sd of[-1,1]){const o=rotP(sd*.7,0,ry);cyl(b,bx+o[0],y,bz+o[1],.035,.035,.8,5,tb);}
  box(b,bx,y+.8,bz,1.55,.05,.6,ry,tb,null,gc);                                                               // stage canopy
  for(let i=0;i<7;i++){const a=a0-span/2+.25+i*(span-.5)/6;B.L.lamps.push({x:sl.x+Math.cos(a)*(rT+.15),z:sl.z+Math.sin(a)*(rT+.15),k:'lantern',y:H});}
  farBox(B,'building',sl.x,y,sl.z,2*rO*.8,H*.8,2*rO*.8,0,gr);addLight(B,sl.x,y+.5,sl.z,PAL.warm,.9,3);}}
function workshop(B,S,mid,sl){const T=B.T,b=S.building,pts=rectPts(sl.x,sl.z,sl.w,sl.d,sl.ry),s=seat(T,pts),y0=s.hi+.04,h=.62,c=hex(PAL.timber,T.A),rc=hex(PAL.greenRoof,T.A);
 prism(b,rectPts(sl.x,sl.z,sl.w+.05,sl.d+.05,sl.ry),s.lo-.15,y0,tone(c,.6));prism(b,pts,y0,y0+h,c,{lit:.35,seed:27,st:.31},false);
 roof(b,sl.x,y0+h,sl.z,sl.w,sl.d,sl.ry,.36,'gable',rc,.08,c);
 if(mid)return;
 const o=rotP(0,sl.d/2+.008,sl.ry);box(S.light,sl.x+o[0],y0,sl.z+o[1],.9,.44,.014,sl.ry,em(B,PAL.warm,1.25));   // B2 r3: dimmer, NEAR only (orange slab at distance)
 for(const sd of[-1,1]){const q=rotP(sd*.6,sl.d/2+.16,sl.ry);box(b,sl.x+q[0],y0,sl.z+q[1],.36,.44,.03,sl.ry+sd*1.15,tone(c,.85));}
 const q=rotP(0,sl.d/2+.5,sl.ry);box(b,sl.x+q[0]+.3,y0-.04,sl.z+q[1],.5,.16,.22,sl.ry,hex(PAL.timberL,T.A));
 addLight(B,sl.x+q[0],y0+.3,sl.z+q[1],PAL.warm,.8,2.5);farBox(B,'building',sl.x,s.lo,sl.z,sl.w,h+.2,sl.d,sl.ry,c,rc);}
function library(B,S,mid,sl){const T=B.T,b=S.building,pts=rectPts(sl.x,sl.z,sl.w,sl.d,sl.ry),s=seat(T,pts),y0=s.hi+.1,h=.8,c=hex(PAL.concrete1,T.A),rc=hex(PAL.greenRoof,T.A);
 prism(b,rectPts(sl.x,sl.z,sl.w+.2,sl.d+.2,sl.ry),s.lo-.15,y0,tone(c,.65));prism(b,pts,y0,y0+h,c,{lit:.9,seed:31,st:.4,bay:.25},false);
 const f=rotP(0,.12,sl.ry);box(b,sl.x+f[0],y0+h,sl.z+f[1],sl.w+.2,.06,sl.d+.44,sl.ry,tone(c,.85),null,rc);
 if(mid)return;
 for(let i=0;i<5;i++){const o=rotP((i-2)*sl.w/4.4,sl.d/2+.28,sl.ry);cyl(b,sl.x+o[0],y0,sl.z+o[1],.02,.02,h,5,hex(PAL.timber,T.A));}
 farBox(B,'building',sl.x,s.lo,sl.z,sl.w,h+.2,sl.d,sl.ry,c,rc);}

// ======================= (15) specials: zookeeper =======================
function enclosure(B,S,mid,sl){const T=B.T,n=mid?24:48,r=sl.r,top=T.yl(sl.x,sl.z)+sl.h,gc=hex(PAL.glass,1),st=hex(PAL.steel,.9*T.A);
 const P3=(i,up)=>{const a=(i%n)*TAU/n,x=sl.x+Math.cos(a)*r,z=sl.z+Math.sin(a)*r;return[x,up?top:T.yl(x,z)-.12,z];};
 for(let i=0;i<n;i++){quad(S.glass,P3(i,0),P3(i+1,0),P3(i+1,1),P3(i,1),gc,null);tri(S.glass,[sl.x,top,sl.z],P3(i,1),P3(i+1,1),gc);}
 if(mid)return;
 for(let i=0;i<n;i++){strut(S.metal,P3(i,1),P3(i+1,1),.022,st);if(!(i&1))strut(S.metal,P3(i,0),P3(i,1),.024,st);
  if(i%8===0){strut(S.metal,P3(i,1),[sl.x,top,sl.z],.016,st);const p=P3(i,0);farBox(B,'metal',p[0],p[1],p[2],.12,sl.h,.12,0,st);}}}
function gardens(B,S,mid){if(mid)return;const T=B.T;
 for(const g of B.L.gardens){rectGrid(S.ground,T,g.x,g.z,g.w,g.d,g.ry,2,2,hex(PAL.grass,1.3*T.A),.03);
  for(let i=-1;i<=1;i++){const o=rotP(i*g.w*.28,.05,g.ry),x=g.x+o[0],z=g.z+o[1];box(S.ground,x,T.yl(x,z)-.04,z,.17,.08,g.d*.62,g.ry,hex(PAL.soil,T.A),null,hex(PAL.foliage,(1+.2*i)*T.A));}
  const o=rotP(0,-g.d/2,g.ry),x=g.x+o[0],z=g.z+o[1];box(S.ground,x,T.yl(x,z)-.06,z,g.w,.17,.07,g.ry,hex(PAL.foliage,.9*T.A));}}
function playground(B,S,mid,sl){if(mid)return;const T=B.T,m=S.metal,ry=sl.ry||0,y=T.yl(sl.x,sl.z),st=hex(PAL.steel,T.A),tb=hex(PAL.timberL,T.A);
 rectGrid(S.ground,T,sl.x,sl.z,1.6,1.4,ry,3,3,hex('#9A8F78',.85*T.A),.035);
 const W=(lx,ly,lz)=>{const o=rotP(lx,lz,ry);return[sl.x+o[0],y+ly,sl.z+o[1]];};
 for(const sx of[-.62,-.1]){strut(m,W(sx,0,-.42),W(sx,.42,-.3),.012,st);strut(m,W(sx,0,-.18),W(sx,.42,-.3),.012,st);}
 strut(m,W(-.62,.42,-.3),W(-.1,.42,-.3),.012,st);
 for(const sx of[-.46,-.26]){strut(m,W(sx-.04,.42,-.3),W(sx-.04,.12,-.3),.004,st);strut(m,W(sx+.04,.42,-.3),W(sx+.04,.12,-.3),.004,st);strut(m,W(sx-.05,.12,-.3),W(sx+.05,.12,-.3),.012,tb);}
 const p=W(.42,0,-.3);box(m,p[0],y-.03,p[2],.2,.33,.2,ry,tb);strut(m,W(.42,.3,-.2),W(.42,.03,.3),.04,st);
 const c=W(-.3,0,.32);cyl(m,c[0],y+.05,c[2],.17,.17,.03,10,tb,true);cyl(m,c[0],y-.03,c[2],.015,.015,.22,4,st);
 const s2=W(.2,0,.4);box(m,s2[0],y-.03,s2[2],.3,.07,.3,ry,tb,null,hex('#9A8F78',T.A));}
function treeOne(B,S,mid,sl){if(mid)return;const T=B.T;B.L.trees.push({x:sl.x,z:sl.z,s:1.25,t:0});
 cyl(S.building,sl.x,T.yl(sl.x,sl.z)-.06,sl.z,.36,.36,.12,12,hex(PAL.stone,T.A),hex(PAL.soil,T.A));}

// ======================= (16) specials: descendants =======================
function plaza(B,S,mid,sl){const T=B.T,st=hex(PAL.stone,T.A);disc(S.ground,T,sl.x,sl.z,sl.r,mid?2:4,mid?14:24,hex(PAL.stone,.78*T.A),.03);if(mid)return;
 const y=T.yl(sl.x,sl.z);cyl(S.building,sl.x,y-.08,sl.z,.34,.34,.18,12,st,tone(st,.45));cyl(S.building,sl.x,y,sl.z,.06,.05,.46,6,st,true);cyl(S.building,sl.x,y+.46,sl.z,.13,.1,.04,8,st,true);
 addLight(B,sl.x+sl.r*.6,y+.4,sl.z,PAL.lamp,.6,2.5);}
function seam(B,S,mid,sl){const T=B.T;disc(S.ground,T,sl.x,sl.z,sl.r*.9,mid?1:2,mid?10:18,hex(PAL.stone,.7*T.A),.03);
 if(!mid)cyl(S.building,sl.x,T.yl(sl.x,sl.z)-.08,sl.z,.55,.55,.14,14,hex(PAL.stone,.9*T.A),true);}
function emptying(B,S,mid){if(mid)return;const U=B.U,o0=clamp(+B.T.P.out||0,0,.9);
 B.anims.push(t=>{const p=((t/180)%1+1)%1;U.uOut.value=lerp(o0,.92,p<.85?p/.85:(1-p)/.15);});}
const SPECIALS={square:square,regulator:regulator,substation:substation,pylons:pylons,datacenter:datacenter,camPoles:camPoles,checkpoints:checkpoints,ministry:ministry,
 searchlights:searchlights,dome:dome,anomaly:anomaly,commons:commons,amphitheatre:amphitheatre,workshop:workshop,library:library,enclosure:enclosure,gardens:gardens,
 playground:playground,tree:treeOne,plaza:plaza,seam:seam,emptying:emptying};
const MIDSP={square:1,regulator:1,datacenter:1,ministry:1,searchlights:1,dome:1,commons:1,amphitheatre:1,workshop:1,library:1,enclosure:1,plaza:1,seam:1};
const NOSLOT={camPoles:1,gardens:1,emptying:1};
function special(B,name,mid){const fn=SPECIALS[name];if(!fn||(mid&&!MIDSP[name]))return;const sl=B.L.slots[name];if(sl===undefined&&!NOSLOT[name])return;
 safe('special '+name+(mid?' (mid)':''),()=>fn(B,mid?B.D:B.N,mid,sl));}

// ======================= (17) props: trees, lamps, cars (instanced), moving cars =======================
const CARC=['#B9B6AE','#6E7378','#2E3238','#8E949C','#5A4A3E'];
// B2 r2 street furniture + street trees (NEAR, instanced, hash-placed so the layout rnd() stream is unchanged).
// per preset: benches / bins / bus shelters at street lamps, benches ringing the commons / plaza / playground, street trees
// on the kerb strip (normaltech, protector, descendants); o1984 only bins (no benches on its streets).
const FURN={normaltech:{bench:.3,bin:.35,shelter:.09,tree:.5},o1984:{bench:0,bin:.25,shelter:0,tree:0},protector:{bench:.35,bin:.25,shelter:0,tree:.3},
 egalitarian:{bench:0,bin:0,shelter:0,tree:0,ring:16},zookeeper:{bench:0,bin:0,shelter:0,tree:0,ring:6},descendants:{bench:.2,bin:.15,shelter:0,tree:.15,ring:10}};
function inLot(L,x,z,m){for(let i=0;i<L.lots.length;i++){const l=L.lots[i],dx=x-l.x,dz=z-l.z;if(dx*dx+dz*dz>(l.r+m)*(l.r+m))continue;
 const c=Math.cos(l.ry),s=Math.sin(l.ry),lx=dx*c-dz*s,lz=dx*s+dz*c;if(Math.abs(lx)<l.w/2+m&&Math.abs(lz)<l.d/2+m)return true;}return false;}
function propsFurniture(B){const T=B.T,L=B.L,F=FURN[T.id]||FURN.normaltech,I=B.inst,R=T.R,ok=(x,z,m)=>Math.hypot(x,z)<R-.5&&!koHit(L,x,z,m)&&!inLot(L,x,z,m);
 const put=(list,x,z,ry,col)=>{if(ok(x,z,.02))list.push([x,T.yl(x,z),z,1,1,1,ry,col||null]);};
 for(let i=0;i<L.lamps.length;i++){const l=L.lamps[i];if(l.k!=='street'||l.tx==null)continue;const h=hash2(l.x*1.3,l.z*.7),h2=hash2(l.z*2.1,l.x*.9),nx=-l.tz*l.sd,nz=l.tx*l.sd;
  const face=Math.atan2(-nx,-nz);                                                              // bench front (+z) faces the street
  if(h<F.shelter)put(I.shelter,l.x+l.tx*.5+nx*.02,l.z+l.tz*.5+nz*.02,face);
  else if(h<F.shelter+F.bench)put(I.bench,l.x+l.tx*.32,l.z+l.tz*.32,face);
  if(h2<F.bin)put(I.bin,l.x-l.tx*.16,l.z-l.tz*.16,0);
  if(h2>1-F.tree){const x=l.x+l.tx*1.05+nx*.03,z=l.z+l.tz*1.05+nz*.03;if(ok(x,z,.12)&&!nearStreet(L,x,z,.02))L.trees.push({x:x,z:z,s:.62+.25*h,t:h>.5?1:0});}}
 if(F.ring){const c=L.slots.commons||L.slots.plaza||L.slots.playground;if(c){const r=(L.slots.commons?c.r+.5:L.slots.plaza?c.r-.45:(c.r||1)+.35);
  for(let i=0;i<F.ring;i++){const a=i*TAU/F.ring+.13,x=c.x+Math.cos(a)*r,z=c.z+Math.sin(a)*r,tr=L.slots.tree;
   if(Math.hypot(x,z)<R-.5&&!inLot(L,x,z,.08)&&!(tr&&Math.hypot(x-tr.x,z-tr.z)<tr.r+.25))I.bench.push([x,T.yl(x,z),z,1,1,1,Math.atan2(-Math.cos(a),-Math.sin(a)),null]);}}}}
function propsTrees(B){const T=B.T,L=B.L,fc=hex(PAL.foliage,1);
 L.trees=L.trees.filter(t=>Math.hypot(t.x,t.z)+.35*t.s<T.R-.3);                 // B2 r2: keep every tree inside the site (conformance)
 for(let i=0;i<L.trees.length;i++){const t=L.trees[i],h=hash2(t.x*3.1,t.z*1.7),k=(.8+.4*h)*T.A;
  B.inst['tree'+(t.t?1:0)].push([t.x,T.yl(t.x,t.z)-.03,t.z,t.s,t.s*(.9+.3*hash2(t.z,t.x)),t.s,h*TAU,[k,k*(.95+.1*h),k]]);}
 const step=Math.max(1,Math.ceil(L.trees.length/10));
 for(let i=0;i<L.trees.length;i+=step){const t=L.trees[i],y=T.yl(t.x,t.z);cyl(B.D.foliage,t.x,y,t.z,.5*t.s,0,1.0*t.s,5,tone(fc,.9*T.A));}}
// B2 r3 lamp bloom (B1 vision: oversized): dimmer heads (1.8 -> 1.1), engine glow sprites at half size (dist 4 -> 2.2,
// sprite = dist*.25) and lower intensity, FAR lamp quads fewer + smaller (row of horizontal quads read as a slab edge-on)
function propsStreet(B){const T=B.T,L=B.L,lc=em(B,PAL.lamp,1.1),n=Math.min(L.lamps.length,160),ls=Math.max(1,Math.ceil(n/6)),fs=Math.max(1,Math.ceil(n/10));
 for(let i=0;i<n;i++){const l=L.lamps[i],y=T.yl(l.x,l.z)+(l.y||0),sc=l.k==='lantern'?.55:1;B.inst.lamp.push([l.x,y,l.z,1,sc,1,hash2(l.x,l.z)*TAU,lc]);
  if(i%ls===0)addLight(B,l.x,y+.6*sc,l.z,PAL.lamp,.5,2.2);
  if(i%fs===0){const a=.06,yy=y+.6*sc;quad(B.F.light,[l.x-a,yy,l.z+a],[l.x+a,yy,l.z+a],[l.x+a,yy,l.z-a],[l.x-a,yy,l.z-a],lc,null);}}
 for(let i=0;i<L.cars.length;i++){const c=L.cars[i];B.inst.car.push([c.x,T.yl(c.x,c.z)+.02,c.z,1,1,1,c.ry,hex(CARC[Math.floor(hash2(c.x,c.z)*CARC.length)],T.A)]);}
 const roads=L.streets.filter(s=>s.kind==='road'),nm=Math.min(Math.round((+T.P.moving||0)),8);
 for(let i=0;i<nm&&roads.length;i++){const s=roads[Math.floor(T.rnd()*roads.length)],rs=resample(s.pts,.4),path=new Float32Array(rs.length*3),c=cum(s.pts);
  for(let k=0;k<rs.length;k++){path[k*3]=rs[k][0];path[k*3+1]=T.yl(rs[k][0],rs[k][1])+.03;path[k*3+2]=rs[k][1];}
  const len=c[c.length-1];B.moving.push({path:path,n:rs.length,len:len,spd:.45+.25*T.rnd(),off:T.rnd()*len,col:hex(CARC[i%CARC.length],T.A)});
  const m=rs[rs.length>>1];B.movers.push({x:m[0],y:T.yl(m[0],m[1])+.1,z:m[1],r:len/2,n:'car'});}}
function propGeos(B){const T=B.T,fc=hex(PAL.foliage,1),tk=hex(PAL.timber,.6),t0=buf(),t1=buf(),car=buf(),pole=buf(),beam=buf(),dk=hex(PAL.dark,1);
 cyl(t0,0,0,0,.035,.028,.34,4,tk);cyl(t0,0,.28,0,.26,.34,.3,6,fc);cyl(t0,0,.58,0,.34,0,.36,6,tone(fc,1.12));
 cyl(t1,0,0,0,.03,.025,.22,4,tk);cyl(t1,0,.18,0,.3,.1,.42,6,tone(fc,.85));cyl(t1,0,.56,0,.2,0,.5,6,tone(fc,.95));
 box(car,0,0,0,.42,.1,.19,0,[1,1,1]);box(car,-.02,.1,0,.22,.075,.17,0,[.12,.14,.16]);
 cyl(pole,0,-.05,0,.016,.012,1.05,4,dk);strut(pole,[0,.97,0],[.15,1.0,0],.008,dk);box(pole,.17,.95,0,.09,.045,.05,0,dk);
 const c=hex('#E8EEF2',1),Lb=5.5,rb=.75;
 lampGeos(B);
 // B2 r2 furniture geoms (vertex-coloured, metal family): bench, bin, bus shelter
 const bench=buf(),bin=buf(),sh=buf(),tb=hex(PAL.timberL,.9),gl=hex('#46525A',1);
 box(bench,0,.085,0,.28,.022,.085,0,tb);box(bench,0,.11,-.04,.28,.075,.016,0,tb);for(const s of[-1,1])box(bench,s*.11,0,0,.02,.085,.07,0,dk);
 cyl(bin,0,0,0,.032,.036,.1,6,hex('#4A5056',1),hex('#2A2E33',1));
 for(const s of[-1,1])box(sh,s*.24,0,-.05,.025,.3,.025,0,dk);box(sh,0,.3,0,.56,.022,.22,0,hex(PAL.steel,.8));box(sh,0,.04,-.09,.5,.24,.012,0,gl);box(sh,0,.06,-.04,.36,.02,.07,0,tb);
 return{tree0:geomOf(T,t0),tree1:geomOf(T,t1),car:geomOf(T,car),pole:geomOf(T,pole),beam:beamGeo(T),bench:geomOf(T,bench),bin:geomOf(T,bin),shelter:geomOf(T,sh)};}

// ======================= (17b) B2 r4: ending-fidelity cues + fineness of detail (NEAR unless noted) =======================
// Owner after r3: "image precision, fineness of detail, rendering that matches each ending's description". Cue list per
// ending = b2_protown_notes.md §11.1. Everything here draws from an OWN rng stream (B.r4) or hash2, so the layout rnd()
// stream, lot positions and the MID/FAR massing stay as in r3 (MID silhouette pieces: descendants seam spires only).
// Static people / shrubs / extra trees are MERGED into the foliage family (no extra draw); only movers are instanced.
const PEOC=['#6E6A64','#4D5560','#7A6250','#5E6B5A','#8A8478','#3E4450','#9A7E62','#56606C','#7C5A5A','#5A6E78'],SKIN=hex('#B89A80',.9);
const PEO={normaltech:{st:.95,walk:26,bench:.5,bot:5,drone:3,spd:.1},o1984:{st:.08,walk:3,bench:0,file:4,spd:.08},protector:{st:.5,walk:16,bench:.55,spd:.06},
 egalitarian:{st:.4,walk:18,bench:.6,spd:.08},zookeeper:{st:.5,walk:4,bench:.6,bot:6,spd:.05},descendants:{st:.16,walk:5,bench:.3,spd:.045}};
// one tiny figure (~1.9 m): legs, torso (clothing colour), head; seat=1 -> seated (short legs); s = overall scale (children .7)
function personAt(b,x,y,z,ry,c,seat,s){s=(s||1)*1.15;const lg=(seat?.03:.085)*s;box(b,x,y,z,.05*s,lg,.03*s,ry,tone(c,.5),null,false);
 box(b,x,y+lg,z,.062*s,.068*s,.036*s,ry,c,null,false);box(b,x,y+lg+.068*s,z,.034*s,.036*s,.034*s,ry,SKIN);}
// o1984 (cue 5, "bans certain kinds of AI research"): one fenced block whose slabs are unlit; set BEFORE NEAR + MID emit
function r4Prep(T,L){if(T.id!=='o1984')return;const p=T.R/3.5,C=[[2,1],[1,-2],[-2,-1],[-1,2],[2,-1],[-2,1]],k=Math.floor(hash2(T.seed*.71,2.3)*C.length);
 for(let j=0;j<C.length;j++){const c=C[(k+j)%C.length],cx=c[0]*p,cz=c[1]*p,ls=L.lots.filter(l=>Math.abs(l.x-cx)<p/2&&Math.abs(l.z-cz)<p/2);
  if(ls.length){for(const l of ls)l.lab=1;L.lab={x:cx,z:cz,w:p-T.P.streetW-.3};return;}}}
// offset a street polyline sideways by off, keep the longest run inside the town (inB), as a walker / mover path
function offPathIn(T,pts,off,inB){const rs=resample(pts,.35),n=rs.length;if(n<4)return null;const xs=[];
 for(let k=0;k<n;k++){const a=rs[Math.max(0,k-1)],e=rs[Math.min(n-1,k+1)];let dx=e[0]-a[0],dz=e[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;xs.push([rs[k][0]-dz*off,rs[k][1]+dx*off]);}
 let b0=0,bl=0,s0=-1;for(let k=0;k<=n;k++){const ok=k<n&&inB(xs[k][0],xs[k][1]);if(ok&&s0<0)s0=k;if(!ok&&s0>=0){if(k-s0>bl){bl=k-s0;b0=s0;}s0=-1;}}
 if(bl<5)return null;const P=new Float32Array(bl*3);let len=0;
 for(let k=0;k<bl;k++){const q=xs[b0+k];P[k*3]=q[0];P[k*3+1]=T.yl(q[0],q[1])+.005;P[k*3+2]=q[1];if(k)len+=Math.hypot(q[0]-xs[b0+k-1][0],q[1]-xs[b0+k-1][1]);}
 return{path:P,n:bl,len:Math.max(len,.05)};}
// per-lot facade relief + roof variety (called from lotDetail, NEAR only, deterministic from l.seed)
function lotRelief(B,l,S,y0,y1,wc,rc,rk,rh,at){const T=B.T,L=B.L,b=S.building,k=l.kind,sd=l.seed,hw=l.w/2,hd=l.d/2,ry=l.ry,id=T.id,h1=(a,c)=>hash2(sd*.53+a,c);
 const sc=tone(wc,1.24),ns=Math.min(l.st,12),dk=hex(PAL.dark,T.A),house=k==='house'||k==='cottage'||k==='plain';
 // window sills: one ledge per storey just under the shader window band (v .26-.84 of each storey); short faces from 3 storeys
 for(let i=0;i<ns;i++){if(k==='slab')break;if(i===0&&(k==='mid'||k==='terrace'))continue;const y=y0+(i+.26)*STOREY-.02;   // slabs: none (vision r4: read as cages)
  for(const s of[-1,1]){const p=at(0,s*(hd+.014));box(b,p[0],y,p[1],l.w*.97,.02,.028,ry,sc,null,tone(sc,1.08));
   if(l.st>=3){const q=at(s*(hw+.014),0);box(b,q[0],y,q[1],.028,.02,l.d*.97,ry,sc,null,tone(sc,1.08));}}}
 // balconies: normaltech mid blocks (irregular), descendants terraces (iron), o1984 every 3rd slab (every bay: repetition)
 if((id==='normaltech'&&k==='mid')||(id==='descendants'&&k==='terrace')||(id==='o1984'&&k==='slab'&&sd%3===0)){const nb=Math.max(1,Math.floor(l.w/.9));
  for(let i=1;i<ns;i++)for(let j=0;j<nb;j++){if(id!=='o1984'&&h1(i,j)>.5)continue;const u=(j+.5)/nb*l.w-hw,p=at(u,hd+.07),q=at(u,hd+.135),y=y0+i*STOREY;
   box(b,p[0],y,p[1],.36,.025,.14,ry,tone(wc,.92));box(S.metal,q[0],y+.025,q[1],.36,.075,.01,ry,dk);}}
 // blank blade signs on shop streets (no text), door canopies on houses
 if((id==='normaltech'&&(k==='mid'||k==='terrace'))||(id==='descendants'&&k==='terrace')){const p=at((sd%2?-1:1)*(hw-.12),hd+.07);
  box(b,p[0],y0+.36,p[1],.018,.13,.12,ry,hex(['#8A7E6C','#64707A','#7A6458'][sd%3],T.A));}
 if(house){const p=at((sd%2?.22:-.22)*l.w,hd+.06);box(b,p[0],y0+.29,p[1],.32,.025,.12,ry,tone(rc,.95));}
 if(rk==='pitched'){let w=l.w,d=l.d,r2=ry;if(d>w){const t=w;w=d;d=t;r2=ry+PI/2;}const hz=d/2+.05,rx=(sd%4===0)?Math.max(.02,w/2+.05-hz*.85):w/2+.05;
  const c=Math.cos(r2),s=Math.sin(r2),P3=(lx,ly,lz)=>[l.x+lx*c+lz*s,y1+ly,l.z-lx*s+lz*c];
  strut(b,P3(-rx-.01,rh+.01,0),P3(rx+.01,rh+.01,0),.024,tone(rc,.68));                                        // ridge cap
  if(sd%2){const o=at(l.w*.25,0);cyl(b,o[0],y1+rh+.1,o[1],.03,.028,.05,5,hex(PAL.brick1,.8*T.A),true);}            // chimney pot
  if((id==='normaltech'&&h1(2,5)<.35)||(id==='protector'&&h1(2,5)<.1)){const xm=Math.min(rx,w/2)*.72,z0=hz*.2,z1=hz*.8,Y=z=>rh*(1-z/hz)+.014;
   quad(S.metal,P3(-xm,Y(z1),z1),P3(xm,Y(z1),z1),P3(xm,Y(z0),z0),P3(-xm,Y(z0),z0),hex(PAL.solar,1),null);}}       // solar on one slope
 else if(rk==='flat'&&k!=='slab'&&id==='normaltech'){const top=y1+.105,v=h1(4,1);
  if(v<.22){box(S.foliage,l.x,top,l.z,l.w*.62,.035,l.d*.55,ry,hex(PAL.grass,1.1*T.A));}                         // roof garden
  else if(v<.5){for(let i=-1;i<=1;i++){const p=at(i*l.w*.0,(i*.28)*l.d);box(S.metal,p[0],top,p[1],l.w*.6,.03,.11,ry,hex(PAL.solar,1));}}}  // solar rows
 // gardens: hedges + shrubs in front of houses (protector, zookeeper, descendants, egalitarian has NO fences/hedges)
 if(house&&(id==='protector'||id==='zookeeper'||id==='descendants')){const p=at(0,hd+.3),yy=T.yl(p[0],p[1]);
  if(h1(6,2)<.55&&id!=='descendants'&&!nearStreet(L,p[0],p[1],.06))box(S.foliage,p[0],yy-.02,p[1],l.w*.8,.13,.08,ry,hex(PAL.foliage,.95*T.A));
  for(const s of[-1,1]){if(h1(7,s)>.5)continue;const q=at(s*(hw-.08),hd+.2),yq=T.yl(q[0],q[1]);if(nearStreet(L,q[0],q[1],.08))continue;
   cyl(S.foliage,q[0],yq-.02,q[1],.09,.12,.07,6,hex(PAL.foliage,1.05*T.A));cyl(S.foliage,q[0],yq+.05,q[1],.12,.03,.1,6,hex(PAL.foliage,1.15*T.A));}}}
// static people (merged, foliage family) on pavements, benches, squares; walkers + bots + drones collected for instancing
function propsPeople(B){const T=B.T,L=B.L,R=T.R,cf=PEO[T.id]||PEO.normaltech,r=B.r4,id=T.id,f=B.N.foliage,I=B.inst;
 const col=i=>hex(id==='o1984'?'#5C6066':PEOC[i%PEOC.length],T.A*(.85+.3*r()));let np=0;
 const inB=B.inB=(x,z)=>{const q=Math.hypot(x,z);return q<R-.6&&q<T.bAt(x,z)*1.04;};B.peoCol=col;
 const put=B.put=(x,z,ry,seat,s,c)=>{if(!inB(x,z))return false;personAt(f,x,T.yl(x,z)+(seat?.075:0),z,ry,c||col(np),seat,s);np++;return true;};
 for(let i=0;i<L.lamps.length;i++){const l=L.lamps[i];if(l.k!=='street'||l.tx==null)continue;if(r()>cf.st)continue;
  const u=(r()-.5)*1.3,x=l.x+l.tx*u-l.tz*l.sd*.05,z=l.z+l.tz*u+l.tx*l.sd*.05;if(inLot(L,x,z,.03)||koHit(L,x,z,.03))continue;const a=r()*TAU;
  put(x,z,a);if(r()<.4)put(x+Math.sin(a)*.09,z+Math.cos(a)*.09,a+PI);}
 for(const e of I.bench){if(r()>cf.bench)continue;const o=rotP((r()-.5)*.14,.01,e[6]);if(inB(e[0],e[2])){personAt(f,e[0]+o[0],e[1]+.075,e[2]+o[1],e[6],col(np),1);np++;}}
 const sq=L.slots.square;if(id==='normaltech'&&sq){for(let i=0;i<26;i++){const x=sq.x+(r()-.5)*(sq.w-.5),z=sq.z+(r()-.5)*(sq.d-.5);put(x,z,r()*TAU);}}
 const ws=L.streets.filter(s=>s.pts.length>1);
 for(let i=0;i<cf.walk&&ws.length;i++){const s=ws[Math.floor(r()*ws.length)],sd=r()<.5?-1:1,w=offPathIn(T,s.pts,sd*(s.kind==='road'?s.w/2+.1:s.w*.22),inB);if(!w)continue;
  const grp=cf.file||1,spd=cf.spd*(cf.file?1:(.75+.5*r())),off=r()*w.len*2,c0=col(i);
  for(let g=0;g<grp;g++)B.walkers.push({path:w.path,n:w.n,len:w.len,spd:spd,off:off+g*.32,col:cf.file?c0:col(i*3+g)});}
 if(cf.bot){const pc=hex(id==='zookeeper'?'#D2D7DB':'#B8BDC2',T.A);for(let i=0;i<cf.bot*4&&B.bots.length<cf.bot;i++){const s=ws[Math.floor(r()*ws.length)];
  const w=offPathIn(T,s.pts,(r()<.5?-1:1)*(s.kind==='road'?s.w/2+.16:s.w*.1),inB);if(w)B.bots.push({path:w.path,n:w.n,len:w.len,spd:id==='zookeeper'?.035:.07,off:r()*w.len*2,col:pc});}}
 if(cf.drone){for(let i=0;i<cf.drone;i++){const rad=2.4+2.6*r(),a=r()*TAU,cr=Math.max(0,R-2.5-rad)*Math.sqrt(r());B.drones.push({cx:Math.cos(a)*cr,cz:Math.sin(a)*cr,rad:rad,h:2.5+1.1*r(),spd:(.08+.05*r())*(i&1?-1:1),ph:r()*TAU});}}
 B.nPeople=np;}
// ---- per-ending cue builders (NEAR) ----
function r4Normal(B){const T=B.T,L=B.L,S=B.N,m=S.metal,r=B.r4,dk=hex(PAL.dark,T.A),st=hex(PAL.steel,.75*T.A),sw=T.P.streetW,I=B.inst;
 // traffic signals at junctions: dark heads, one dim warm-white lens (no red/green verdict hues)
 for(const n of L.nodes){if(hash2(n[0]*.7,n[1]*1.3)>.65)continue;for(const q of[[1,1],[-1,-1]]){const x=n[0]+q[0]*(sw/2+.09),z=n[1]+q[1]*(sw/2+.09),y=T.yl(x,z);
  if(inLot(L,x,z,.02)||!B.inB(x,z))continue;cyl(m,x,y-.04,z,.012,.01,.52,4,dk);box(m,x,y+.4,z,.045,.13,.045,0,dk);box(S.light,x,y+.49,z,.026,.026,.05,0,em(B,'#F2E6CC',.5));}}
 // buses at two roads + vans among the parked cars
 const roads=L.streets.filter(s=>s.kind==='road');for(let i=0;i<2&&roads.length;i++){const s=roads[(i*5+3)%roads.length],c=cum(s.pts),p=polyAt(s.pts,c,c[c.length-1]*(.35+.3*i)),x=p[0]-p[3]*sw*.24,z=p[1]+p[2]*sw*.24;
  if(B.inB(x,z))I.car.push([x,T.yl(x,z)+.02,z,2.4,1.55,1.12,Math.atan2(-p[3],p[2]),hex(['#7E8A8C','#8C8270'][i],T.A)]);}
 for(let i=0;i<I.car.length;i+=5)if(I.car[i][3]===1){I.car[i][3]=1.22;I.car[i][4]=1.4;}
 // EV charging posts with a cool indicator dot next to some parked cars
 for(let i=0;i<L.cars.length;i++){const c=L.cars[i];if(hash2(c.x*.9,c.z*1.1)>.22)continue;const x=c.x+Math.cos(c.ry)*.3,z=c.z-Math.sin(c.ry)*.3,y=T.yl(x,z);
  if(inLot(L,x,z,.02))continue;box(m,x,y-.03,z,.05,.17,.04,c.ry,hex('#C9CCCF',.8*T.A));box(S.light,x,y+.11,z,.02,.02,.045,c.ry,em(B,PAL.cool,1.2));}
 // two blank billboards on posts near the town edge (pale panel, no text)
 let nb=0;for(let i=0;i<roads.length&&nb<2;i++){const s=roads[(i*7+1)%roads.length],c=cum(s.pts),p=polyAt(s.pts,c,c[c.length-1]*.2),x=p[0]-p[3]*(sw/2+.45),z=p[1]+p[2]*(sw/2+.45);
  if(!B.inB(x,z)||inLot(L,x,z,.4)||koHit(L,x,z,.4)||Math.hypot(x,z)<T.R*.45)continue;const y=T.yl(x,z),ry=Math.atan2(-p[3],p[2]);nb++;
  for(const sd of[-1,1]){const o=rotP(sd*.3,0,ry);cyl(m,x+o[0],y-.04,z+o[1],.018,.018,.62,4,dk);}
  box(S.building,x,y+.6,z,.78,.4,.04,ry,hex('#6A6E72',T.A));box(S.light,x,y+.62,z,.72,.36,.05,ry,em(B,'#D6D2C8',.32));}}
function r4O1984(B){const T=B.T,L=B.L,S=B.N,m=S.metal,b=S.building,dk=hex(PAL.dark,T.A),sw=T.P.streetW,p=T.R/3.5,scr=em(B,'#A9BCCE',.5);
 for(const l of L.lots){if(l.kind!=='slab')continue;const s=seat(T,rectPts(l.x,l.z,l.w,l.d,l.ry)),y0=s.hi+.05,y1=y0+l.st*STOREY,hw=l.w/2,hd=l.d/2;
  const at=(lx,lz)=>{const o=rotP(lx,lz,l.ry);return[l.x+o[0],l.z+o[1]];};
  // wall cameras on block corners (storey 2 + roof edge)
  for(const c of[[1,1],[-1,-1]]){for(const yy of[y0+2*STOREY,y1-.05]){const a=at(c[0]*hw,c[1]*hd),e=at(c[0]*(hw+.09),c[1]*(hd+.09));
   strut(m,[a[0],yy,a[1]],[e[0],yy+.02,e[1]],.008,dk);box(m,e[0],yy-.02,e[1],.05,.035,.08,l.ry+c[0]*PI/4,dk);}}
  // blank lit screens on the faces that look at the ministry (near ring of blocks)
  if(!l.lab&&Math.hypot(l.x,l.z)<1.75*p){const f0=at(0,hd+.02),f1=at(0,-hd-.02),sd=Math.hypot(f0[0],f0[1])<Math.hypot(f1[0],f1[1])?1:-1,q=at(0,sd*(hd+.025));
   box(b,q[0],y0+STOREY*1.05,q[1],Math.min(.98,l.w*.5),.6,.018,l.ry,dk);const q2=at(0,sd*(hd+.035));box(S.light,q2[0],y0+STOREY*1.05+.04,q2[1],Math.min(.9,l.w*.5-.08),.52,.012,l.ry,scr);}}
 const mi=L.slots.ministry;if(mi){const W=mi.w,y=seat(T,rectPts(mi.x,mi.z,W+.5,W+.5,0)).hi+.14;
  for(let k=0;k<4;k++){const a=k*PI/2,o=rotP(0,(W+.36)/2+.02,a);box(S.light,mi.x+o[0],y+.17,mi.z+o[1],W*.45,.3,.014,a,scr);}}
 // fenced, unlit research compound: posts + 2 rails, gate with a barrier, one booth; nobody inside
 const lb=L.lab;if(lb){const h=lb.w/2,C=[[-h,-h],[h,-h],[h,h],[-h,h]],fc=hex(PAL.steel,.7*T.A);
  rectGrid(S.ground,T,lb.x,lb.z,lb.w+.1,lb.w+.1,0,3,3,hex('#24262A',T.A),.026);                 // dark hard-standing inside the fence
  for(const c of C){const x=lb.x+c[0],z=lb.z+c[1],y=T.yl(x,z);strut(m,[x,y-.03,z],[x,y+.62,z],.014,fc);box(m,x,y+.6,z,.07,.05,.07,0,dk);}  // corner posts + lamps off
  for(let i=0;i<4;i++){const a=C[i],e=C[(i+1)%4],n=Math.max(2,Math.round(lb.w/.38));
   for(let k=0;k<n;k++){if(i===0&&(k===Math.floor(n/2)||k===Math.floor(n/2)-1))continue;const x=lb.x+lerp(a[0],e[0],k/n),z=lb.z+lerp(a[1],e[1],k/n),y=T.yl(x,z);strut(m,[x,y-.03,z],[x,y+.46,z],.009,fc);}
   for(const hh of[.18,.44]){const P0=[lb.x+a[0],0,lb.z+a[1]],P1=[lb.x+e[0],0,lb.z+e[1]];P0[1]=T.yl(P0[0],P0[2])+hh;P1[1]=T.yl(P1[0],P1[2])+hh;strut(m,P0,P1,.005,fc);}}
  const gx=lb.x,gz=lb.z-h,gy=T.yl(gx,gz);strut(m,[gx-.35,gy+.16,gz],[gx+.3,gy+.16,gz],.014,hex(PAL.concrete1,T.A));box(b,gx+.5,gy-.05,gz-.25,.26,.36,.26,0,hex(PAL.concrete0,.7*T.A),null,hex(PAL.roof0,T.A));}
 // guards at the checkpoints (dark clothing), in pairs on the barrier side
 for(const c of(L.slots.checkpoints||[])){const px=-Math.sin(c.a),pz=Math.cos(c.a);for(const s of[-1,1]){const x=c.x+px*(sw/2+.12)*s+Math.cos(c.a)*.25,z=c.z+pz*(sw/2+.12)*s+Math.sin(c.a)*.25;
   B.put(x,z,Math.atan2(Math.cos(c.a),Math.sin(c.a))+PI,0,1,hex('#2C3034',T.A));}}
 // slow patrol vehicles (dark) along the roads
 const roads=L.streets.filter(s=>s.kind==='road'),r=B.r4;for(let i=0;i<3&&roads.length;i++){const s=roads[Math.floor(r()*roads.length)],w=offPathIn(T,s.pts,0,B.inB);if(!w)continue;
  B.moving.push({path:w.path,n:w.n,len:w.len,spd:.2,off:r()*w.len,col:hex('#2A2F36',T.A)});}}
function r4Protector(B){const T=B.T,L=B.L,S=B.N,g=L.slots.green;if(!g)return;const tb=hex(PAL.timber,T.A),cr=hex('#C8BCA2',T.A),dk=hex(PAL.dark,T.A);
 // cafe tables with parasols on the green, people seated around them (small groups, unhurried)
 for(let i=0;i<4;i++){const a=i*TAU/4+.4,x=g.x+Math.cos(a)*.62,z=g.z+Math.sin(a)*.62,y=T.yl(x,z);if(nearStreet(L,x,z,.15))continue;
  cyl(S.building,x,y-.02,z,.075,.075,.1,8,tb,true);strut(S.metal,[x,y+.08,z],[x,y+.3,z],.006,dk);cyl(S.building,x,y+.26,z,.24,0,.08,8,cr,true);
  for(let k=0;k<3;k++){if(B.r4()<.25)continue;const b2=a+k*TAU/3,px=x+Math.cos(b2)*.15,pz=z+Math.sin(b2)*.15;personAt(S.foliage,px,y+.075,pz,Math.atan2(-Math.cos(b2),-Math.sin(b2)),B.peoCol(i*3+k),1);}}}
function r4Egal(B){const T=B.T,L=B.L,S=B.N,r=B.r4,tb=hex(PAL.timberL,T.A),tbd=hex(PAL.timber,T.A),dk=hex(PAL.dark,T.A),f=S.foliage;
 const am=L.slots.amphitheatre;if(am){const y=T.yl(am.x,am.z),a0=(am.a==null?Math.atan2(am.z,am.x):am.a)+PI,span=5.25,n=30,NR=8,rS=1.05,rT=3.45,H=1.0;
  for(let k=1;k<NR;k++){const r0=lerp(rS+.12,rT,k/NR),r1=lerp(rS+.12,rT,(k+1)/NR),h=H*(k+1)/NR,rm=(r0+r1)/2;
   for(let i=0;i<n;i++){if(i===7||i===15||i===22||r()>.42)continue;const a=a0-span/2+(i+.2+.6*r())*span/n;personAt(f,am.x+Math.cos(a)*rm,y+h,am.z+Math.sin(a)*rm,ryIn(a),B.peoCol(k*n+i),1);}}
  for(let i=0;i<3;i++){const a=r()*TAU,x=am.x+Math.cos(a)*.4,z=am.z+Math.sin(a)*.4;personAt(f,x,y+.03,z,r()*TAU,B.peoCol(i+50));}
  // (vision r4: tables inside the bowl read as stray slabs -> communal tables now sit by the allotments, below)
 }
 // open workshop: workbenches outside the open bay with people working; library reading porch bench
 const ws=L.slots.workshop;if(ws){for(const s of[-1,1]){const o=rotP(s*.55,ws.d/2+.75,ws.ry),x=ws.x+o[0],z=ws.z+o[1],y=T.yl(x,z);
   box(S.building,x,y-.02,z,.5,.13,.2,ws.ry,tbd,null,tone(tb,1.05));box(S.metal,x+.08,y+.11,z,.12,.04,.07,ws.ry,hex(PAL.steel,.8*T.A));
   const q=rotP(s*.55,ws.d/2+.95,ws.ry);personAt(f,ws.x+q[0],T.yl(ws.x+q[0],ws.z+q[1]),ws.z+q[1],ws.ry+PI,B.peoCol(s+40));
   const q2=rotP(s*.55+.22,ws.d/2+.55,ws.ry);personAt(f,ws.x+q2[0],T.yl(ws.x+q2[0],ws.z+q2[1]),ws.z+q2[1],ws.ry,B.peoCol(s+44));}}
 const lib=L.slots.library;if(lib){const o=rotP(0,lib.d/2+.55,lib.ry),x=lib.x+o[0],z=lib.z+o[1],y=T.yl(x,z);box(S.building,x,y-.02,z,1.1,.08,.1,lib.ry,tbd);
  for(let j=0;j<3;j++){const u=rotP((j-1)*.3,lib.d/2+.55,lib.ry);personAt(f,lib.x+u[0],y+.05,lib.z+u[1],lib.ry,B.peoCol(j+30),1);}}
 // shared bike racks next to the library and the workshop (open, unlocked rows of bikes)
 for(const sl of[lib,ws]){if(!sl)continue;const o=rotP(1.45,sl.d/2+.3,sl.ry),x=sl.x+o[0],z=sl.z+o[1],y=T.yl(x,z);if(nearStreet(L,x,z,.05))continue;
  strut(S.metal,[x-.3*Math.cos(sl.ry),y+.07,z+.3*Math.sin(sl.ry)],[x+.3*Math.cos(sl.ry),y+.07,z-.3*Math.sin(sl.ry)],.008,dk);
  for(let j=0;j<4;j++){const u=rotP((j-1.5)*.15,0,sl.ry),bx=x+u[0],bz=z+u[1];for(const w of[-1,1]){const v=rotP(0,w*.07,sl.ry);box(S.metal,bx+v[0],y,bz+v[1],.012,.1,.1,sl.ry,dk,null,false);}
   const v0=rotP(0,-.07,sl.ry),v1=rotP(0,.07,sl.ry);strut(S.metal,[bx+v0[0],y+.06,bz+v0[1]],[bx+v1[0],y+.09,bz+v1[1]],.006,hex(['#6E7A70','#7A6E62','#5E6A78'][j%3],T.A));}}
 // allotment plots outside the outer ring (shared growing land)
 let na=0;for(let i=0;i<40&&na<7;i++){const a=hash2(i*.37,T.seed*.1)*TAU,rr=T.R*(.7+.18*hash2(i,3.3)),x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  if(!B.inB(x,z)||inLot(L,x,z,.6)||nearStreet(L,x,z,.55)||koHit(L,x,z,.55))continue;na++;const ry=ryIn(a);
  rectGrid(S.ground,T,x,z,1.0,.8,ry,2,2,hex(PAL.soil,T.A),.03);for(let k=-1;k<=1;k++){const o=rotP(k*.28,0,ry);box(S.ground,x+o[0],T.yl(x+o[0],z+o[1])-.04,z+o[1],.14,.08,.62,ry,hex(PAL.soil,.8*T.A),null,hex(PAL.foliage,(1.1+.15*k)*T.A));}
  if(r()<.6)personAt(f,x+.3,T.yl(x+.3,z),z,r()*TAU,B.peoCol(i+60));
  if(na<=3){const o=rotP(0,.75,ry),tx=x+o[0],tz=z+o[1],yy=T.yl(tx,tz);if(nearStreet(L,tx,tz,.3)||inLot(L,tx,tz,.3))continue;   // long communal table + benches
   box(S.building,tx,yy-.02,tz,.95,.12,.2,ry,tb,null,tone(tb,1.1));for(const q of[-1,1]){const v=rotP(0,q*.2,ry);box(S.building,tx+v[0],yy-.02,tz+v[1],.95,.07,.07,ry,tbd);
    for(let j=0;j<4;j++){if(r()<.3)continue;const u=rotP((j-1.5)*.24,q*.2,ry);personAt(f,tx+u[0],yy+.05,tz+u[1],ry+(q>0?PI:0),B.peoCol(j+q*7+20+i),1);}}}}}
function r4Zoo(B){const T=B.T,L=B.L,S=B.N,THREE=T.THREE,r=B.r4,sl=L.slots.enclosure;if(!sl)return;const st=hex(PAL.steel,.9*T.A),pale=hex('#D3D8DC',T.A),y0=T.yl(sl.x,sl.z),top=y0+sl.h,f=S.foliage;
 const tr=L.slots.tree,pg=L.slots.playground,far=(x,z,o,d)=>!o||Math.hypot(x-o.x,z-o.z)>d;
 // supply pod: pad on a free spot, roof hatch frame above it; the pod travels roof <-> pad on a 70 s cycle
 let pad=null;for(let i=0;i<36&&!pad;i++){const a=i*TAU/12+.3,rr=1.6+.45*Math.floor(i/12),x=sl.x+Math.cos(a)*rr,z=sl.z+Math.sin(a)*rr;
  if(!nearStreet(L,x,z,.3)&&!inLot(L,x,z,.3)&&far(x,z,tr,1.3)&&far(x,z,pg,1.3))pad=[x,z];}
 if(pad){const py=T.yl(pad[0],pad[1]);cyl(S.building,pad[0],py-.06,pad[1],.34,.34,.08,14,tone(pale,.75),true);
  for(const c of[[-1,-1,1,-1],[1,-1,1,1],[1,1,-1,1],[-1,1,-1,-1]])strut(S.metal,[pad[0]+c[0]*.3,top-.02,pad[1]+c[1]*.3],[pad[0]+c[2]*.3,top-.02,pad[1]+c[3]*.3],.02,st);
  const pb=buf();cyl(pb,0,0,0,.19,.21,.24,10,pale,true);cyl(pb,0,.24,0,.21,.07,.09,10,tone(pale,.9),true);cyl(pb,0,-.04,0,.12,.19,.04,10,tone(pale,.7));
  const pm=new THREE.Mesh(geomOf(T,pb),B.M.metal);pm.name='pt_pod';pm.position.set(pad[0],top-.4,pad[1]);B.extra.push(pm);
  const yb=py+.03,yt=top-.4;B.anims.push(t=>{const p=((t%70)+70)%70/70;pm.position.y=p<.25?lerp(yt,yb,ss(0,.25,p)):p<.5?yb:p<.75?lerp(yb,yt,ss(.5,.75,p)):yt;});
  B.movers.push({x:pad[0],y:py+1,z:pad[1],r:sl.h,n:'pod'});}
 // airlock / supply hatch in the enclosure wall (glass vestibule, frame, dark door) - no road leads out
 const aH=hash2(T.seed*.37,5.5)*TAU,hx=sl.x+Math.cos(aH)*sl.r,hz=sl.z+Math.sin(aH)*sl.r,hy=T.yl(hx,hz),ry=ryIn(aH);
 box(S.building,hx,hy-.05,hz,.9,.95,.6,ry,tone(pale,.92),null,tone(pale,.8));box(S.building,hx,hy+.9,hz,1.0,.07,.7,ry,st);   // solid lock chamber through the wall
 for(const c of[[1,1],[-1,1],[1,-1],[-1,-1]]){const o=rotP(c[0]*.45,c[1]*.3,ry);strut(S.metal,[hx+o[0],hy-.05,hz+o[1]],[hx+o[0],hy+.9,hz+o[1]],.02,st);}
 {for(const q of[.31,-.31]){const o=rotP(0,q,ry);box(S.building,hx+o[0],hy-.05,hz+o[1],.42,.72,.02,ry,hex(PAL.dark,T.A));}
  const o=rotP(0,-.32,ry);box(S.light,hx+o[0],hy+.74,hz+o[1],.3,.03,.012,ry,em(B,PAL.cool,.9));}
 // people standing at the glass looking out; children at the playground
 for(let i=0;i<6;i++){const a=aH+.7+i*.85+.2*r(),x=sl.x+Math.cos(a)*(sl.r-.28),z=sl.z+Math.sin(a)*(sl.r-.28);if(inLot(L,x,z,.05))continue;
  personAt(f,x,T.yl(x,z),z,Math.atan2(Math.cos(a),Math.sin(a)),B.peoCol(i+70));}
 if(pg)for(let i=0;i<4;i++){const o=rotP((r()-.5)*1.2,(r()-.5)*1.0,pg.ry||0),x=pg.x+o[0],z=pg.z+o[1];personAt(f,x,T.yl(x,z),z,r()*TAU,B.peoCol(i+80),0,.68);}}
// descendants: pale slender machine spires growing at the seam edge of the old quarter (MID too: silhouette), few cool dots
function seamSpires(B,S,mid){const T=B.T,L=B.L,sl=L.slots.seam;if(!sl)return;const a=sl.a==null?Math.atan2(sl.z,sl.x):sl.a,ox=Math.cos(a),oz=Math.sin(a),pc=hex('#B6BEC4',T.A),out=[];
 // vision r4: "radio-mast cluster on one spot" -> spread along the edge of the quarter (lateral -2.3..2.3), skip lots, dimmer
 const SP=[[.55,-2.3,3.0],[.85,-1.15,4.0],[1.0,0,4.9],[.85,1.15,3.6],[.55,2.3,2.6]];
 for(const q of SP){let x=0,z=0,ok=false;for(const dr of[0,.35,-.35,.7]){x=sl.x+ox*(q[0]+dr)-oz*q[1];z=sl.z+oz*(q[0]+dr)+ox*q[1];if(Math.hypot(x,z)<T.R-.5&&!inLot(L,x,z,.22)){ok=true;break;}}
  if(!ok)continue;const y=T.yl(x,z);out.push([x,y,z,q[2]]);
  cyl(S.building,x,y-.08,z,.17,.045,q[2],6,pc,true);if(mid)continue;cyl(S.building,x,y-.08,z,.27,.17,.24,6,tone(pc,.8));
  if(out.length%2)for(let k=1;k<=2;k++)box(S.light,x,y+q[2]*k*.3,z,.028,.028,.028,0,em(B,PAL.cool,.8));farBox(B,'metal',x,y,z,.2,q[2],.2,0,pc);}
 if(mid)return;for(let i=1;i<out.length;i++){const p=out[i-1],e=out[i],h=Math.min(p[3],e[3])*.55;strut(S.building,[p[0],p[1]+h,p[2]],[e[0],e[1]+h*.9,e[2]],.03,pc);}
 // low pale ribs running from the spires into the quarter (the machine city growing out of it)
 for(const p of out){const x1=p[0]-ox*1.1,z1=p[2]-oz*1.1;box(S.building,(p[0]+x1)/2,T.yl((p[0]+x1)/2,(p[2]+z1)/2)-.04,(p[2]+z1)/2,.07,.08,1.1,Math.atan2(ox,oz),tone(pc,.9));}}
function r4Desc(B){const T=B.T,L=B.L,S=B.N,pl=L.slots.plaza,stn=hex(PAL.stone,T.A);seamSpires(B,S,false);if(!pl)return;
 // planters with shrubs around the plaza (kept tidy), lit portico on the lot nearest the plaza
 for(let i=0;i<8;i++){const a=i*TAU/8+.2,x=pl.x+Math.cos(a)*(pl.r-.35),z=pl.z+Math.sin(a)*(pl.r-.35),y=T.yl(x,z);if(nearStreet(L,x,z,.05))continue;
  box(S.building,x,y-.04,z,.26,.14,.26,a,tone(stn,.9),null,hex(PAL.soil,T.A));cyl(S.foliage,x,y+.1,z,.12,.04,.14,6,hex(PAL.foliage,1.2*T.A));}
 let best=null,bd=1e9;for(const l of L.lots){const d=Math.hypot(l.x-pl.x,l.z-pl.z)-l.r;if(d<bd&&l.w>.9){bd=d;best=l;}}
 if(best){const l=best,s=seat(T,rectPts(l.x,l.z,l.w,l.d,l.ry)),y0=s.hi+.05,at=(lx,lz)=>{const o=rotP(lx,lz,l.ry);return[l.x+o[0],l.z+o[1]];};
  const f0=at(0,l.d/2),f1=at(0,-l.d/2),sd=Math.hypot(f0[0]-pl.x,f0[1]-pl.z)<Math.hypot(f1[0]-pl.x,f1[1]-pl.z)?1:-1;
  for(let i=0;i<4;i++){const p=at((i-1.5)*l.w*.22,sd*(l.d/2+.16));cyl(S.building,p[0],y0-.05,p[1],.035,.03,STOREY*1.5,6,tone(stn,1.15));}
  const e=at(0,sd*(l.d/2+.16));box(S.building,e[0],y0+STOREY*1.5-.05,e[1],l.w*.78,.08,.22,l.ry,tone(stn,1.1));const dl=at(0,sd*(l.d/2+.015));
  box(S.light,dl[0],y0,dl[1],.2,.26,.012,l.ry,em(B,PAL.warm,.8));addLight(B,e[0],y0+.3,e[1],PAL.warm,.4,1.8);}}
function r4Specials(B){const id=B.T.id;if(id==='normaltech')r4Normal(B);else if(id==='o1984')r4O1984(B);else if(id==='protector')r4Protector(B);
 else if(id==='egalitarian')r4Egal(B);else if(id==='zookeeper')r4Zoo(B);else if(id==='descendants')r4Desc(B);}
function r4Mid(B){if(B.T.id==='descendants')seamSpires(B,B.D,true);}
// movers: walkers ping-pong along their path (no pop at the ends), drones circle slowly (period >= 45 s)
function animWalk(B,im,list){return t=>{for(let i=0;i<list.length;i++){const c=list[i],P=c.path,L2=c.len*2;let d=((t*c.spd+c.off)%L2+L2)%L2,dir=1;if(d>c.len){d=L2-d;dir=-1;}
  const f=d/c.len*(c.n-1),k=Math.min(c.n-2,Math.floor(f)),u=f-k,j=k*3,dx=(P[j+3]-P[j])*dir,dz=(P[j+5]-P[j+2])*dir;
  B.eul.set(0,Math.atan2(dx,dz),0,'XYZ');B.q.setFromEuler(B.eul);B.m4.compose(B.v.set(P[j]+(P[j+3]-P[j])*u,P[j+1]+(P[j+4]-P[j+1])*u,P[j+2]+(P[j+5]-P[j+2])*u),B.q,B.one);im.setMatrixAt(i,B.m4);}
 im.instanceMatrix.needsUpdate=true;};}
function animDrones(B,im){const dr=B.drones;return t=>{for(let i=0;i<dr.length;i++){const o=dr[i],a=o.ph+t*o.spd;B.eul.set(0,Math.atan2(-Math.sin(a)*Math.sign(o.spd),Math.cos(a)*Math.sign(o.spd))+PI/2,0,'XYZ');B.q.setFromEuler(B.eul);
  B.m4.compose(B.v.set(o.cx+Math.cos(a)*o.rad,o.h+.06*Math.sin(t*.6+o.ph),o.cz+Math.sin(a)*o.rad),B.q,B.one);im.setMatrixAt(i,B.m4);}im.instanceMatrix.needsUpdate=true;};}
function r4Geos(B){const T=B.T,pe=buf(),bo=buf(),dr=buf(),dk=hex(PAL.dark,1);
 personAt(pe,0,0,0,0,[1,1,1]);box(bo,0,0,0,.075,.05,.1,0,[1,1,1]);box(bo,0,.05,-.015,.06,.02,.05,0,[.5,.52,.55]);
 box(dr,0,0,0,.06,.022,.06,0,dk);box(dr,0,.008,0,.24,.008,.016,PI/4,dk);box(dr,0,.008,0,.24,.008,.016,-PI/4,dk);
 for(const c of[[1,1],[-1,1],[1,-1],[-1,-1]])box(dr,c[0]*.085,.016,c[1]*.085,.06,.004,.06,0,[.5,.52,.56]);
 return{person:geomOf(T,pe),bot:geomOf(T,bo),drone:geomOf(T,dr)};}

// ======================= (18) merge: near, mid, far =======================
function wrap(B,name){const THREE=B.T.THREE,g=new THREE.Group(),inner=new THREE.Group();g.name=name;inner.name=name+'_rot';inner.rotation.y=B.T.rot;g.add(inner);return{g:g,inner:inner};}
function addFam(B,inner,bufs,prefix,casters){const THREE=B.T.THREE;
 for(const k of['ground','building','metal','light','foliage','glass']){const b=bufs[k];if(!b||!bufTris(b))continue;const m=new THREE.Mesh(geomOf(B.T,b),B.M[k]);m.name=prefix+k;m.receiveShadow=k!=='light'&&k!=='glass';
  if(k==='glass')m.renderOrder=3;if(k==='ground')m.renderOrder=1;if(casters&&(k==='building'||k==='metal')){m.castShadow=true;casters.push(m);}inner.add(m);}}
function animBeams(B,im){const bm=B.beams;return t=>{for(let i=0;i<bm.length;i++){const o=bm[i];B.eul.set(0,o.ph+t*.17*(i&1?-1:1),-(.3+.1*Math.sin(t*.11+o.ph)),'YXZ');B.q.setFromEuler(B.eul);
  B.m4.compose(B.v.set(o.x,o.y,o.z),B.q,B.one);im.setMatrixAt(i,B.m4);}im.instanceMatrix.needsUpdate=true;};}
function animCars(B,im){const mv=B.moving;return t=>{for(let i=0;i<mv.length;i++){const c=mv[i],P=c.path,d=((t*c.spd+c.off)%c.len+c.len)%c.len,f=d/c.len*(c.n-1),k=Math.min(c.n-2,Math.floor(f)),u=f-k,j=k*3;
  let dx=P[j+3]-P[j],dz=P[j+5]-P[j+2];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;B.eul.set(0,Math.atan2(-dz,dx),0,'XYZ');B.q.setFromEuler(B.eul);
  B.m4.compose(B.v.set(P[j]+(P[j+3]-P[j])*u-dz*.13,P[j+1]+(P[j+4]-P[j+1])*u,P[j+2]+(P[j+5]-P[j+2])*u+dx*.13),B.q,B.one);im.setMatrixAt(i,B.m4);}im.instanceMatrix.needsUpdate=true;};}
function mergeNear(B){const j=nearJobs(B);for(const f of j)f();mergeNearB(B);}
// B2 r2: NEAR families are merged as jobs of <= CHUNK tris each (one mesh per chunk, typed arrays filled by a plain loop), so
// buildSteps can time-slice the merge (r1: merge:nearA 9.8 ms cold in one piece for normaltech)
const CHUNK=6000;   // B2 r3: 8000 -> 6000 (cold merge:nearA 10.6 ms on T4 for normaltech)
// vertex range [v0,v1) of a feathered buffer as interleaved RGBA
function rgba(b,v0,v1){const o=new Float32Array((v1-v0)*4);for(let v=v0,j=0;v<v1;v++,j+=4){o[j]=b.c[v*3];o[j+1]=b.c[v*3+1];o[j+2]=b.c[v*3+2];o[j+3]=b.a[v];}return o;}
function geomRange(T,b,t0,t1){const THREE=T.THREE,g=new THREE.BufferGeometry(),a=t0*9,n=(t1-t0)*9,P=new Float32Array(n),N=new Float32Array(n),C=b.a?null:new Float32Array(n);
 for(let i=0;i<n;i++){P[i]=b.p[a+i];N[i]=b.n[a+i];if(C)C[i]=b.c[a+i];}
 g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));
 g.setAttribute('color',C?new THREE.BufferAttribute(C,3):new THREE.BufferAttribute(rgba(b,t0*3,t1*3),4));
 if(b.w){const aw=t0*12,nw=(t1-t0)*12,W=new Float32Array(nw);for(let i=0;i<nw;i++)W[i]=b.w[aw+i];g.setAttribute('aWin',new THREE.BufferAttribute(W,4));}
 g.computeBoundingSphere();return g;}
function nearJobs(B){const W=B._W=wrap(B,'pt_near'),jobs=[],THREE=B.T.THREE;B.casters=[];
 for(const k of['ground','building','metal','light','foliage','glass']){const b=B.N[k],nt=b?bufTris(b):0;if(!nt)continue;const CK=k==='ground'?4000:CHUNK;   // B2 r3: RGBA ground chunks smaller (cold 10.6 ms)
  for(let t=0;t<nt;t+=CK){const t0=t,t1=Math.min(nt,t+CK),sfx=nt>CK?'_'+(t0/CK):'';
   jobs.push(()=>{const m=new THREE.Mesh(geomRange(B.T,b,t0,t1),B.M[k]);m.name='pt_'+k+sfx;m.receiveShadow=k!=='light'&&k!=='glass';if(k==='glass')m.renderOrder=3;if(k==='ground')m.renderOrder=1+t0/CK*.001;
    if(k==='building'||k==='metal'){m.castShadow=true;B.casters.push(m);}W.inner.add(m);});}}
 return jobs;}
function mergeNearB(B){const W=B._W,I=B.inst,G=propGeos(B),add=m=>{if(m)W.inner.add(m);return m;};
 add(instMesh(B,'pt_trees0',G.tree0,B.M.foliage,I.tree0));add(instMesh(B,'pt_trees1',G.tree1,B.M.foliage,I.tree1));
 add(instMesh(B,'pt_cars',G.car,B.M.metal,I.car));add(instMesh(B,'pt_lamps',B.gLamp,B.M.metal,I.lamp));add(instMesh(B,'pt_lampheads',B.gHead,B.M.light,I.lamp));
 add(instMesh(B,'pt_poles',G.pole,B.M.metal,I.pole));
 add(instMesh(B,'pt_benches',G.bench,B.M.metal,I.bench));add(instMesh(B,'pt_bins',G.bin,B.M.metal,I.bin));add(instMesh(B,'pt_shelters',G.shelter,B.M.metal,I.shelter));
 if(B.beams.length)safe('beams',()=>{const im=add(instMesh(B,'pt_beams',G.beam,B.M.beam,B.beams.map(o=>[o.x,o.y,o.z,1,1,1,o.ph,null])));im.renderOrder=5;im.receiveShadow=false;B.anims.push(animBeams(B,im));});
 if(B.moving.length)safe('moving cars',()=>{const im=add(instMesh(B,'pt_movers',G.car,B.M.metal,B.moving.map(c=>[c.path[0],c.path[1],c.path[2],1,1,1,0,c.col])));B.anims.push(animCars(B,im));});
 const G4=safe('r4 geos',()=>r4Geos(B));
 if(G4&&B.walkers.length)safe('walkers',()=>{const im=add(instMesh(B,'pt_walkers',G4.person,B.M.foliage,B.walkers.map(c=>[c.path[0],c.path[1],c.path[2],1,1,1,0,c.col])));B.anims.push(animWalk(B,im,B.walkers));});
 if(G4&&B.bots.length)safe('bots',()=>{const im=add(instMesh(B,'pt_bots',G4.bot,B.M.metal,B.bots.map(c=>[c.path[0],c.path[1],c.path[2],1,1,1,0,c.col])));B.anims.push(animWalk(B,im,B.bots));});
 if(G4&&B.drones.length)safe('drones',()=>{const im=add(instMesh(B,'pt_drones',G4.drone,B.M.metal,B.drones.map(o=>[o.cx,o.h,o.cz,1,1,1,0,null])));B.anims.push(animDrones(B,im));});
 for(const e of B.extra)W.inner.add(e);
 B.near=W.g;}
function midLots(B){const L=B.L;ground(B,B.D,true);for(let i=0;i<L.lots.length;i++)emitLot(B,L.lots[i],B.D,true);}
function mergeMid(B){for(const n of B.T.P.special)special(B,n,true);safe('r4 mid',()=>r4Mid(B));const W=wrap(B,'pt_mid');addFam(B,W.inner,B.D,'pt_mid_',null);for(const e of B.extraMid)W.inner.add(e);B.mid=W.g;}
function mergeFar(B){const T=B.T,lots=B.L.lots.slice().sort((a,b)=>b.w*b.d*b.st-a.w*a.d*a.st).slice(0,120),out=[];
 for(const l of lots){const s=seat(T,rectPts(l.x,l.z,l.w,l.d,l.ry));box(B.F.building,l.x,s.lo-.1,l.z,l.w,s.hi-s.lo+.1+l.st*STOREY+(T.P.roof==='pitched'?.15:0),l.d,l.ry,wallCol(T,l.seed),null,roofCol(T,l.seed));}
 let tris=0;for(const k of['building','metal','ground','light']){const b=B.F[k];if(!bufTris(b))continue;tris+=bufTris(b);out.push({geom:geomOf(T,b,true),family:k});}
 B.far=out;B.farTris=tris;}

// ======================= (19) result, buildSteps, build =======================
function emptyResult(id,msg){perr(msg);return{near:null,mid:null,far:[],casters:[],movers:[],lights:[],stats:{tris:0,ms:0,nearTris:0,midTris:0,farTris:0,nearDraws:0,midDraws:0,steps:[]},
 anim:function(){},anchors:{square:null,seam:null,entries:[]},keepOut:[],uniforms:{uT:{value:0},uOut:{value:0},uLit:{value:1}},ending:id};}
function finalize(B,steps,ms){const T=B.T,L=B.L,U=B.U,an=B.anims,P3=(x,z,y)=>{const q=T.toLocal(x,z);return{x:q[0],y:y==null?T.yl(x,z):y,z:q[1]};};
 const nt=trisOf(B.near),mt=trisOf(B.mid);
 const res={near:B.near,mid:B.mid,far:B.far||[],casters:B.casters||[],
  movers:B.movers.map(m=>{const q=T.toLocal(m.x,m.z);return{x:q[0],y:m.y,z:q[1],r:m.r,n:m.n};}),
  lights:B.lights.slice(0,12).map(l=>{const q=T.toLocal(l.x,l.z);return{x:q[0],y:l.y,z:q[1],color:l.color,intensity:l.intensity*(B.day?.3:1),dist:l.dist};}),
  stats:{tris:nt[0],ms:Math.round(ms*10)/10,nearTris:nt[0],midTris:mt[0],farTris:B.farTris||0,nearDraws:nt[1],midDraws:mt[1],steps:steps},
  anim:function(t){t=+t||0;U.uT.value=t;for(let i=0;i<an.length;i++)an[i](t);},
  anchors:{square:P3(L.anchors.square[0],L.anchors.square[1]),seam:L.anchors.seam?P3(L.anchors.seam[0],L.anchors.seam[1]):null,entries:L.entries.map(e=>P3(e.x,e.z))},
  keepOut:L.ko.map(k=>{const q=T.toLocal(k.x,k.z);return{x:q[0],z:q[1],r:k.r};}),
  uniforms:{uT:U.uT,uOut:U.uOut,uLit:U.uLit},ending:T.id,matsUsed:B.used};
 safe('anim(0)',()=>res.anim(0));
 PT.info.last={ending:T.id,stats:res.stats};PT.info.matsUsed=B.used;return res;}
// B2 r2: time-sliced steps. SL = slice budget per step (ms, site.sliceMs overrides); loops stop starting new work once SL is
// used, so a step costs <= SL + one unit (one lot / one chunk). Geometry does not depend on where the slices fall.
function* buildSteps(site,ctx){const steps=[];let ts=now(),total=0;const SL=site&&+site.sliceMs>0?+site.sliceMs:3.5;
 const mark=n=>{const ms=now()-ts;total+=ms;const o={step:n,ms:Math.round(ms*100)/100};steps.push(o);ts=now();return o;};
 // drive a unit generator; yield a step whenever the slice budget is used (a step = <= SL + one unit)
 const run=function*(name,gen){let t0=now(),any=false;for(;;){let r;try{r=gen.next();}catch(e){perr(name+': '+(e&&e.message?e.message:e));break;}
  if(r.done)break;any=true;if(now()-t0>=SL){yield mark(name);t0=now();any=false;}}if(any)yield mark(name);};
 const each=function*(arr,fn){for(let i=0;i<arr.length;i++){const a=arr[i];safe('unit',()=>fn(a,i));yield 1;}};
 const T=safe('mkTown',()=>mkTown(site,ctx));
 if(!T||!T.THREE)return emptyResult(T?T.id:'normaltech','THREE not available (ctx.THREE / window.THREE)');
 const LG=layoutSteps(T);let L=null;
 for(;;){let r;try{r=LG.next();}catch(e){perr('layout: '+(e&&e.message?e.message:e));return emptyResult(T.id,'layout failed');}if(r.done){L=r.value;break;}yield mark('layout');}
 const MM=safe('materials',()=>makeMats(T));if(!MM)return emptyResult(T.id,'materials failed');
 safe('r4 prep',()=>r4Prep(T,L));const B=newBuild(T,L,MM);yield mark('materials');
 yield* run('ground',groundGen(B,B.N,false));
 yield* run('buildings',each(L.lots,l=>emitLot(B,l,B.N,false)));
 for(const n of T.P.special){special(B,n,false);yield mark('special:'+n);}
 safe('furniture',()=>propsFurniture(B));yield mark('props:furniture');
 safe('trees',()=>propsTrees(B));yield mark('props:trees');
 safe('street props',()=>propsStreet(B));yield mark('props:street');
 safe('people',()=>propsPeople(B));yield mark('props:people');            // B2 r4
 safe('r4 cues',()=>r4Specials(B));yield mark('special:r4');
 const J=safe('merge near jobs',()=>nearJobs(B))||[];yield mark('merge:prep');
 for(let j=0;j<J.length;j++){safe('merge near',J[j]);yield mark('merge:nearA');}
 safe('merge near B',()=>mergeNearB(B));yield mark('merge:near');
 yield* run('mid:ground',groundGen(B,B.D,true));
 yield* run('mid:buildings',each(L.lots,l=>emitLot(B,l,B.D,true)));
 safe('merge mid',()=>mergeMid(B));yield mark('merge:mid');
 safe('merge far',()=>mergeFar(B));yield mark('merge:far');
 const res=safe('finalize',()=>finalize(B,steps,total));
 return res||emptyResult(T.id,'finalize failed');}
function build(site,ctx){const it=buildSteps(site,ctx);let r=it.next();while(!r.done)r=it.next();return r.value;}

// ======================= (20) register =======================
const PT={version:1,presets:PRESETS,build:build,buildSteps:buildSteps,info:{version:1,presets:Object.keys(PRESETS),last:null,matsUsed:null}};
root.FA.PROTOWN=PT;
})();
