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
 glass:'#5F7380',asphalt:'#34363B',roof0:'#4B4F55',roof1:'#5A4A3E',greenRoof:'#55654A',foliage:'#3E5238',grass:'#4C5B3F',pave:'#7C7871',
 path:'#8A826E',dark:'#33363B',steel:'#7C8086',warm:'#FFB870',lamp:'#FFC890',cool:'#9FD8E6',solar:'#1E2A3C',soil:'#4A3E32',kerb:'#8E8A82',mark:'#BDB7A8'};

// ======================= (2) presets (any field overridable via site.params) =======================
const SP=s=>s.split(' ');
// B2 r3: fray (irregular footprint strength), fields / farms (outskirts), pz (window patch size bays x storeys), alb (albedo)
const PRESETS={
 normaltech:{layout:'grid',lit:.62,em:1.8,walls:SP('concrete0 concrete1 brick0 brick1'),roofs:SP('roof0 roof1'),roof:'mix',storeys:[2,4],density:.8,blockMin:3.3,
  streetW:.62,jitter:.4,green:.25,props:1,cars:36,moving:8,lamps:1,lampStep:2.6,trees:40,out:0,fray:.7,fields:12,farms:5,pz:[4,3],nf:.55,nf0:3.0,nfc:[-1.3,2.0],special:SP('square regulator substation pylons datacenter nearfuture')},   // r5 C: near-future core (nf) + sky/rail layer, moving 4 -> 8 (autonomous traffic)
 o1984:{layout:'strict',lit:.3,em:1.05,alb:.7,walls:SP('#7E8186 #8A8D92'),roofs:SP('#55585E'),roof:'flat',storeys:[9,12],density:1,blockMin:4,   // S2 (review 11-18 'cosy warm downtown'): cool grey concrete + grey roofs (were concrete0/1 cream + roof0), window light ~-60 % (lit .45 -> .3, em 1.7 -> 1.05)
  streetW:.8,jitter:0,green:0,props:.6,cars:5,moving:0,lamps:1,lampStep:4,trees:0,out:0,fray:.8,fields:0,farms:0,pz:[12,2],under:0,special:SP('camPoles checkpoints ministry searchlights')},
 protector:{layout:'organic',lit:.7,em:1.9,walls:SP('timber timberL stone'),roofs:SP('roof1 roof0'),roof:'pitched',storeys:[2,3],density:.92,blockMin:3,
  streetW:.54,jitter:.6,green:.9,props:1,cars:8,moving:2,lamps:1,lampStep:2.4,trees:130,out:0,fray:.8,fields:10,farms:5,pz:[4,3],midWin:.75,midWinK:2,midWinY:.62,special:SP('dome anomaly')},
 egalitarian:{layout:'ring',lit:.5,em:1.5,walls:SP('timber concrete1'),roofs:SP('greenRoof'),roof:'green',storeys:[2,2],density:1,blockMin:3,
  streetW:.44,jitter:0,green:.6,props:1,cars:0,moving:0,lamps:1,lampStep:4.4,trees:70,out:0,fray:.6,fields:9,farms:0,pz:[3,2],under:0,midWin:.55,midWinK:2,special:SP('commons amphitheatre workshop library')},   // r10 B: lit .65/em 1.8/lamps 3.2/midWin .7 -> orange light ring at world zoom
 zookeeper:{layout:'cluster',lit:.6,em:1.7,alb:.94,walls:SP('concrete1 brick1 timberL'),roofs:SP('roof1 roof0'),roof:'pitched',storeys:[2,2],density:1,blockMin:3,
  streetW:.42,jitter:.2,green:.3,props:1,cars:0,moving:0,lamps:1,lampStep:4.0,trees:0,out:0,fray:0,fields:0,farms:0,pz:[3,2],special:SP('enclosure gardens playground tree machines')},   // G1 S2 r5: + machines; r10 B: lit .9/em 2.2/alb 1.06/lamps 2.8 = brightest ring at world zoom (+20 L)
 descendants:{layout:'old',lit:.3,em:1.6,walls:SP('stone brick0 brick1'),roofs:SP('roof1 roof0'),roof:'pitched',storeys:[3,5],density:.84,blockMin:2.4,
  streetW:.48,jitter:.5,green:.1,props:.7,cars:0,moving:0,lamps:1,lampStep:4.6,trees:14,out:.3,fray:1,fields:6,farms:3,pz:[4,3],under:0,special:SP('plaza seam emptying machcity')}   // G1 S2 r5: + machcity (new machine city growing out of the seam), no underlay disc; r10 B: lampStep 3.4 -> 4.6 (world vision: concentric lit rings)
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
function domeMat(T,U){const THREE=T.THREE,c=hex('#9AB0CC');   // B2 r5: sky-blue tone (was pale #BFD6E6), blends into the blue-hour sky
 // B2 r5 (vision r4: the dome was the loudest element; Tegmark: the protector hides so well many doubt it exists): no bright
 // rim - alpha ~.006 face-on, max ~.11 at grazing, faded out near the ground (no footing line) and toward the apex (no cap glint)
 const m=new THREE.ShaderMaterial({uniforms:{uT:U.uT,uC:{value:new THREE.Vector3(c[0],c[1],c[2])},uK:{value:T.mood==='day'?.5:1}},
  vertexShader:'varying vec3 vN;varying vec3 vV;varying float vH;varying float vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vD=length(mv.xyz);vH=normal.y;gl_Position=projectionMatrix*mv;}',
  // G1 r6 N (world view: 'a pale dome sliver'): grazing rim fades with view distance (x.3 beyond ~190 u); close-ups unchanged
  fragmentShader:'uniform float uT,uK;uniform vec3 uC;varying vec3 vN;varying vec3 vV;varying float vH;varying float vD;void main(){float f=1.-abs(dot(normalize(vN),normalize(vV)));'+
   'float a=(.01+.15*pow(f,3.)+.03*pow(f,8.))*(.9+.1*sin(uT*.21+vN.y*7.))*uK*smoothstep(.02,.3,abs(vH))*(1.-.5*smoothstep(.7,1.,abs(vH)));a=min(a,.17)*(1.-.92*smoothstep(55.,150.,vD));gl_FragColor=vec4(uC,a);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}',
  transparent:true,depthWrite:false,side:THREE.DoubleSide});m.name='pt_dome';return m;}
// B2 r3 searchlight beam (vision r2: grey wedges in stills): additive soft cone, smooth radial normals -> bright core, edges
// fade to 0 (facing^1.6), fades along the beam (tip 0, short ramp at the lamp), fades with view distance (no fog:false
// stray beam on the horizon), instanced. aU = 0 at the lamp .. 1 at the tip.
// B2 o1984 pass (owner: "four big soft white orbs, no visible beams"): the beam is now THE readable element and never blooms -
// additive cool cone, output capped (a <= .34, colour <= .9 -> 4 overlapping beams stay under the bloom threshold 1.4),
// toneMapped off (fixed intensity), fade near the camera (1-4 u, no wash when the street camera stands in a beam) and a long
// distance fade (150-420 u) so the sweep reads at world zoom; truncated cone with SHARED per-angle normals (the r3 apex used one
// normal per triangle -> 16 bright wedges = the dashed ellipse in the owner's shot).
function beamMat(T){const THREE=T.THREE,c=hex('#C9D6E4');
 const m=new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Vector3(c[0],c[1],c[2])},uK:{value:T.mood==='day'?.06:.34}},
  vertexShader:'attribute float aU;varying float vU;varying vec3 vN;varying vec3 vV;varying float vA;void main(){vec4 p=vec4(position,1.);vec3 n=normal;vec3 ax=vec3(1.,0.,0.);\n#ifdef USE_INSTANCING\np=instanceMatrix*p;n=mat3(instanceMatrix)*n;ax=mat3(instanceMatrix)*ax;\n#endif\nvec4 mv=modelViewMatrix*p;vN=normalize(normalMatrix*n);vV=-mv.xyz;vU=aU;vA=abs(dot(normalize(normalMatrix*ax),normalize(-mv.xyz+vec3(1e-5))));gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uK;varying float vU;varying vec3 vN;varying vec3 vV;varying float vA;void main(){float d=max(length(vV),1e-4);float f=abs(dot(normalize(vN+vec3(1e-5)),vV/d));'+
   'float g=smoothstep(50.,130.,d);float a=pow(f,1.3)*pow(1.-vU,1.7)*smoothstep(0.,.1,vU)*smoothstep(1.,4.,d)*(1.+.9*g)*(1.-.75*smoothstep(170.,420.,d))*(1.-.85*smoothstep(.86,.98,vA))*uK;a=min(a,mix(.3,.42,g));gl_FragColor=vec4(min(uC,vec3(.9)),a);\n#include <encodings_fragment>\n}',
  transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});m.name='pt_beam';return m;}
function beamGeo(T){const THREE=T.THREE,Lb=7,rb=.95,r0=.05,n=16,P=[],N=[],U=[],ny=(rb-r0)/Lb;
 for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
  P.push(0,c0*r0,s0*r0,Lb,c1*rb,s1*rb,Lb,c0*rb,s0*rb, 0,c0*r0,s0*r0,0,c1*r0,s1*r0,Lb,c1*rb,s1*rb);
  N.push(-ny,c0,s0,-ny,c1,s1,-ny,c0,s0, -ny,c0,s0,-ny,c1,s1,-ny,c1,s1);U.push(0,1,1,0,0,1);}
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
 // B2 r5 street-level brightness: additive warm lamp pools on the ground (radial vertex alpha), one NEAR draw
 M.pool=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});M.pool.name='pt_lamp_pool';
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
 // B2 fix (owner 11-16 "1984 building bodies see-through"; protector MID "tilted boxes"): the corners were [bx,y0,AZ] / [ax,y1,BZ],
 // i.e. bottom edge along x only and top edge sheared -> every wall running along z collapsed to 2 zero-area triangles (open
 // building sides, background visible through the body) and every rotated wall was a twisted, tilted plane. Correct corners below.
 quad(b,[ax,y0,az],[bx,y0,bz],[bx,y1,bz],[ax,y1,az],col,w);}
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
function obbHit(a,b){const dx=b.x-a.x,dz=b.z-a.z,PAD=lotAligned(a,b)?.04:LOTPAD;if(dx*dx+dz*dz>(a.r+b.r+PAD)*(a.r+b.r+PAD))return false;
 for(let k=0;k<2;k++){const p=k?b:a,q=k?a:b,c=Math.cos(p.ry),s=Math.sin(p.ry),cq=Math.cos(q.ry),sq=Math.sin(q.ry);
  for(let i=0;i<2;i++){const ux=i?s:c,uz=i?c:-s,ext=i?p.d/2:p.w/2;
   const proj=Math.abs(ux*cq-uz*sq)*q.w/2+Math.abs(ux*sq+uz*cq)*q.d/2;
   if(Math.abs(dx*ux+dz*uz)>ext+proj+PAD)return false;}}
 return true;}
// aligned = same orientation (mod 90 deg): terraced rows may share a party wall; skewed neighbours keep LOTPAD clear
function lotAligned(a,b){const d=Math.abs((((a.ry||0)-(b.ry||0))%(PI/2)+PI/2)%(PI/2));return d<.03||d>PI/2-.03;}
// B2 r5 (vision r4: lots interpenetrate in descendants / protector / zookeeper): lot-lot clearance = eaves + relief (.05 eaves
// and up to ~.07 sills/pilasters per side) -> LOTPAD .16; lots vs keep-outs test the RECTANGLE (corners), not the inner
// half-width circle (r4 let lot corners cut into slots / spires). Conformance checks real footprints (res.footprints).
const LOTPAD=.16;
function rectCircleDist(o,x,z){const c=Math.cos(o.ry||0),s=Math.sin(o.ry||0),dx=x-o.x,dz=z-o.z,lx=dx*c-dz*s,lz=dx*s+dz*c;
 return Math.hypot(Math.max(0,Math.abs(lx)-o.w/2),Math.max(0,Math.abs(lz)-o.d/2));}
function koHitRect(L,o,pad){for(let i=0;i<L.ko.length;i++){const k=L.ko[i];if(rectCircleDist(o,k.x,k.z)<k.r+pad)return true;}return false;}
function koHit(L,x,z,rad){for(let i=0;i<L.ko.length;i++){const k=L.ko[i];if(Math.hypot(x-k.x,z-k.z)<k.r+rad)return true;}return false;}
// o={x,z,w,d,ry,st,kind}; chk = also reject lots that sit on a street (skip = own street)
function addLot(T,L,o,chk,skip){if(L.lots.length>=T.maxLots)return false;o.ry=o.ry||0;o.r=Math.hypot(o.w,o.d)/2;const mn=Math.min(o.w,o.d)/2;
 if(Math.hypot(o.x,o.z)+o.r>T.R-.25)return false;
 // B2 r3: irregular footprint - nothing beyond the warped boundary b, density + height fall off over .55b..b (hash, no rnd())
 if(!o.out&&T.fray>0){const r=Math.hypot(o.x,o.z),b=T.bAt(o.x,o.z);if(r>b)return false;const f=ss(.55*b,b,r);
  if(hash2(o.x*1.73+T.seed*.013,o.z*2.31)<f*.8*T.fray)return false;
  if(o.kind!=='slab'&&o.st>T.P.storeys[0])o.st=Math.max(T.P.storeys[0],Math.round(lerp(o.st,T.P.storeys[0],f)));}
 if(koHitRect(L,o,.08))return false;
 if(chk&&nearStreet(L,o.x,o.z,mn*.9,skip))return false;
 for(let i=0;i<L.lots.length;i++)if(obbHit(o,L.lots[i]))return false;
 for(let i=0;i<L.gardens.length;i++){const g=L.gardens[i];g.r=g.r||Math.hypot(g.w,g.d)/2;if(obbHit(o,g))return false;}   // r5: no lot on a garden
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
   // B2 r5 (normaltech "less downtown"): top storey band = 'mid' (mixed office), the rest a terrace/house mix
   addLot(T,L,{x:cx,z:cz,w:w-.06,d:d,ry:row?0:PI,st:st,kind:(st>=5||(hi<=4&&st>=4&&rnd()<.6))?'mid':(rnd()<.45?'terrace':'house')},false);}}}
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
 // G1 r6 N (world view: 'dark square slab with hard edges'): every grid street used to run to the same circle, so the town ended
 // on one crisp round/square edge. Streets off the two central axes now stop near the warped boundary b(a) (x a per-end jitter),
 // so the edge is ragged and the outskirts (fields, farms, the rail and pylons running out) take over irregularly.
 const sEnd=(o,sg,vert)=>{let h=Math.sqrt(Math.max(0,R*R-o*o))-.35;if(Math.abs(o)<=hs+.1)return h;const j=.9+.32*hash2(o*1.37+sg*.71,T.seed*.01+(vert?1:2));
  for(;h>1.2;h-=.25){const x=vert?o:sg*h,z=vert?sg*h:o;if(Math.hypot(x,z)<=T.bAt(x,z)*1.08*j)break;}return h;};
 const inT=(x,z)=>Math.abs(x)<=hs+.1||Math.abs(z)<=hs+.1||Math.hypot(x,z)<T.bAt(x,z)*1.1;
 for(const x of xs){const h1=sEnd(x,1,1),h0=sEnd(x,-1,1);if(h1+h0>3)addStreet(L,[[x,-h0],[x,h1]],sw,'road');}
 for(const z of zs){const h1=sEnd(z,1,0),h0=sEnd(z,-1,0);if(h1+h0>3)addStreet(L,[[-h0,z],[h1,z]],sw,'road');}
 for(const x of xs)for(const z of zs)if(Math.hypot(x,z)<R-1&&inT(x,z))L.nodes.push([x,z]);
 const sq=2*hs-sw-.2;addSlot(L,'square',{x:0,z:0,r:hs-.2,w:sq,d:sq,ry:0},false);
 addSlot(L,'regulator',{x:0,z:-sq/2+.75,r:1.3,w:2.5,d:1.0,ry:0},false);
 const bx=[-R].concat(xs,[R]),bz=[-R].concat(zs,[R]);
 const aS=T.rnd()*TAU;let c=cellCentre(bx,bz,Math.cos(aS)*(R-3.6),Math.sin(aS)*(R-3.6));if(Math.hypot(c[0],c[1])>R-2.1)c=[Math.cos(aS)*(R-3.2),Math.sin(aS)*(R-3.2)];
 const sub=addSlot(L,'substation',{x:c[0],z:c[1],r:1.62,w:2.4,d:1.9,ry:0});   // B2 r5: bigger fenced yard (was 2.0 x 1.6)
 const aD=aS+PI*T.rr(.7,1.3);c=cellCentre(bx,bz,Math.cos(aD)*(R-4),Math.sin(aD)*(R-4));if(Math.hypot(c[0],c[1])>R-2.7)c=[Math.cos(aD)*(R-3.8),Math.sin(aD)*(R-3.8)];
 // B2 r5: data-centre campus = fenced yard (two long low halls inside), clamped to the cell so the fence never crosses a street
 {const ry=Math.abs(Math.cos(aD))>.7?PI/2:0,cw=(a,v)=>{for(let i=1;i<a.length;i++)if(v>=a[i-1]&&v<a[i])return a[i]-a[i-1];return 9;},iw=cw(bx,c[0])-sw-.3,id=cw(bz,c[1])-sw-.3;
  const W=clamp(ry?id:iw,2.6,3.7),D=clamp(ry?iw:id,1.7,2.35);addSlot(L,'datacenter',{x:c[0],z:c[1],r:Math.hypot(W,D)/2+.1,w:W,d:D,ry:ry});}
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
 const sM=addStreet(L,main,sw*1.15,'road'),loop=ringPts(T,R*.5,40,R*.12,R*.06).slice(0,29),sL=addStreet(L,loop,sw,'road',false),lanes=[];   // r8 F: open, more wobbly 3/4 arc (a closed round loop read as a crater-like ring at world zoom)
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
  if(addLot(T,L,lot,true,sLoop))L.gardens.push({x:Math.cos(a)*(r+hd/2+.62),z:Math.sin(a)*(r+hd/2+.62),w:hw+.35,d:1.0,ry:lot.ry,o:L.lots.length-1});}
 const before=L.lots.length;yield 1;lotsAlong(T,L,sLane,{w:[1.05,1.15],d:[.85,.95],set:[.3,.4],gap:[.6,.9],st:[2,2],kind:'cottage',t0:2.3,t1:.9});yield 1;
 for(let i=before;i<L.lots.length;i++){const l=L.lots[i],b=rotP(0,-(l.d/2+.6),l.ry);L.gardens.push({x:l.x+b[0],z:l.z+b[1],w:l.w+.3,d:.95,ry:l.ry,o:i});}
 // B2 child fix (vision 11-16: town tiny inside an oversized enclosure): second ring path + outer ring of cottages, then the
 // enclosure is fitted around the built area (machine landscape outside it is procompute's, not drawn here)
 const rP=rH+hd/2+1.35+sw/2;addStreet(L,ringPts(T,rP,48,R*.015,R*.01),sw,'path',true);
 const rH2=rP+sw/2+.4+hd/2,n2=Math.floor(TAU*rH2/(hw+.85));
 for(let i=0;i<n2;i++){const a=a0+(i+.25)*TAU/n2+T.rr(-.02,.02),r=rH2+T.rr(0,.15);if(r+hd/2+1.7>re)break;const lot={x:Math.cos(a)*r,z:Math.sin(a)*r,w:hw,d:hd,ry:ryIn(a),st:2,kind:'cottage'};
  if(addLot(T,L,lot,true,null))L.gardens.push({x:Math.cos(a)*(r+hd/2+.62),z:Math.sin(a)*(r+hd/2+.62),w:hw+.35,d:1.0,ry:lot.ry,o:L.lots.length-1});}
 let mr=0;for(const l of L.lots)mr=Math.max(mr,Math.hypot(l.x,l.z)+l.r);for(const g of L.gardens)mr=Math.max(mr,Math.hypot(g.x,g.z)+.6);
 L.slots.enclosure.r=Math.min(re,Math.max(rl+2.5,mr+1.1));
 for(const l of L.lots)L.lamps.length<Math.round(10*T.q)&&L.lamps.push({x:l.x*.84,z:l.z*.84,k:'lantern'});
 L.entries.push({x:lane[6][0],z:lane[6][1],a:a0});
 L.anchors.square=[0,0];}
// --- old (descendants): irregular plaza, six crooked radials + two ring lanes, tight terraces; seam slot at the edge
function* layOld(T,L){const R=T.R,P=T.P,sw=P.streetW,rp=R*.19,aS=T.rnd()*TAU,all=[];
 addSlot(L,'plaza',{x:0,z:0,r:rp});
 const seam=addSlot(L,'seam',{x:Math.cos(aS)*(R-1.7),z:Math.sin(aS)*(R-1.7),r:1.45,a:aS});
 // B2 r5 (vision r4: spires read as detached antennas, ribs cut into terraces): the machine edge is reserved BEFORE any lot -
 // 5 spire plinths along the seam edge + the conduit runs between them are keep-outs, seamSpires() builds exactly here
 L.spires=[];{const ox=Math.cos(aS),oz=Math.sin(aS);for(const q of[[.55,-2.3,3.0],[.85,-1.15,4.0],[1.0,0,4.9],[.85,1.15,3.6],[.55,2.3,2.6]]){
  const x=seam.x+ox*q[0]-oz*q[1],z=seam.z+oz*q[0]+ox*q[1];if(Math.hypot(x,z)>R-.75)continue;L.spires.push([x,z,q[2]]);L.ko.push({x:x,z:z,r:.6,n:'spire'});}
  for(let i=1;i<L.spires.length;i++){const p=L.spires[i-1],e=L.spires[i];L.ko.push({x:(p[0]+e[0])/2,z:(p[1]+e[1])/2,r:.42,n:'conduit'});}}
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
   const l=L.lots[L.lots.length-1],o=rotP(0,-(l.d/2+.5),l.ry),gy={x:l.x+o[0],z:l.z+o[1],w:l.w+.4,d:.8,ry:l.ry};gy.r=Math.hypot(gy.w,gy.d)/2;
   let yh=false;for(let j=0;j<L.lots.length-1&&!yh;j++)if(obbHit(gy,L.lots[j]))yh=true;if(yh){L.lots.pop();continue;}   // r5: yard must not cut a lot
   (L.gardens.push({x:gy.x,z:gy.z,w:gy.w,d:gy.d,ry:l.ry,yard:1,o:L.lots.length-1}));
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
function newBuild(T,L,MM){const THREE=T.THREE;T.pc=[0,0,1];const poolA=(x,z)=>1-clamp(Math.hypot(x-T.pc[0],z-T.pc[1])/T.pc[2],0,1);
 const mk=()=>({building:buf(true),metal:buf(),ground:buf(false,T.fa),light:buf(),glass:buf(),foliage:buf(),pool:buf(false,poolA)});
 return{T:T,L:L,M:MM.M,U:MM.U,used:MM.used,N:mk(),D:mk(),F:{building:buf(),metal:buf(),ground:buf(),light:buf()},farSp:0,day:T.mood==='day',
  inst:{tree0:[],tree1:[],car:[],lamp:[],pole:[],bench:[],bin:[],shelter:[]},beams:[],solids:[],moving:[],movers:[],lights:[],anims:[],extra:[],extraMid:[],subTop:null,
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
 // r6 N (world vision: normaltech MID = 'a dark rectangular gridded slab'): at MID the grey pave underlay + wide asphalt grid made a
 // plate; normaltech MID now drops the underlay and draws narrower, lighter roads (kerb +.12) so the town sits on the terrain
 const ntm=mid&&T.id==='normaltech';
 // r10 B: protector underlay off by default (world vision r9: 'dark disc / dome base'); ?g1ptu=1 restores it (A/B probe)
 const ptu=T.id!=='protector'||/[?&]g1ptu=1/.test(location.search);
 if(T.P.under!==0&&ptu&&!ntm&&!(mid&&T.id==='zookeeper'))disc(S.ground,T,0,0,T.R*1.02,mid?6:12,mid?32:56,col,-.03);yield 1;   // C1 r5: o1984/egalitarian under:0 = no underlay (D5: it read as a plate); r7 P: zookeeper MID too (lighter round apron at world zoom)
 // B2 r3 street readability: every street gets an edge strip that contrasts with its surface (roads: pale kerb + dark asphalt
 // + centre dashes; old-quarter lanes: pale kerb + dark setts; garden paths: dark edge + pale gravel). MID keeps the strips.
 const KERB=hex(PAL.kerb,.95*T.A),EDGE=hex('#4A4840',T.A),SETT=hex('#3A3734',T.A),GRAV=hex('#A8A08A',T.A);
 const zdm=mid&&(T.id==='zookeeper'||T.id==='descendants');   // r7 P (world vision r5/r6: zookeeper 'concentric halo', descendants 'gridded radial disc'): MID ring lanes / radials = one dark ground path, no pale kerb / gravel line
 for(const s of L.streets){const rd=s.kind==='road',old=lay==='old',st=mid?2.2:.7;
  if(zdm){ribbon(S.ground,T,s.pts,s.w*.8,tone(EDGE,.82),.012,st);yield 1;continue;}
  if(ntm&&rd){ribbon(S.ground,T,s.pts,s.w*.7+.12,tone(KERB,.62),.01,st);ribbon(S.ground,T,s.pts,s.w*.7,tone(hex(PAL.asphalt,T.A),1.1),.02,st);}
  else if(rd||old){ribbon(S.ground,T,s.pts,s.w+(mid?.3:.26),KERB,.01,st);ribbon(S.ground,T,s.pts,s.w,rd?hex(T.id==='protector'?'#5C564E':PAL.asphalt,T.A):SETT,.02,st);}   // r4: protector = warm block paving, not asphalt
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
// ======================= (10b) G1 S2 r5 task C: Normal technology as a visible near future (~2035, no magic) =======================
// P.nf = share of the town radius that becomes a mid/high-rise core: lots there get 6-20 storeys, mostly photovoltaic-glass towers
// (dark blue-grey glazing, one dim cool band under the crown on a few), max 2 mass-timber towers with planted terraces; flat roofs in
// the ring outside the core get rooftop farms (planted rows + a small greenhouse). Deterministic from l.seed, NEAR and MID alike.
// G1 r6 N (vision r5: still 'an ordinary 6-12 storey town'): the core became a uniform block of 7-11 storey PV boxes = one dark mass.
// Now an explicit SKYLINE: nfPick chooses 5 well-spaced core lots (>= 2.6 u apart) and makes them slender towers (footprint <= 1.2 x
// 1.1 u, 13-20 storeys + crown) with distinct silhouettes: 'step' (two setbacks + mast light), 'twin' (offset taller slab),
// 'mast' (slimmest; carries the high vertiport deck), 'crown' (hipped glass crown + 2 cool bands), 'tim' (mass timber, planted
// terraces). Other core lots = 5-9 storey podium blocks, under half of them PV glass (the rest keep concrete/brick) so the core
// no longer reads as one dark slab.
function nfPick(B){const L=B.L;if(L._nfp)return;L._nfp=1;const T=B.T,R=T.R,lim=R*T.P.nf;
 for(const l of L.lots)nfLot(B,l);   // podium / PV assignment first (deterministic per lot)
 // r6 N v3: skyline cluster centred on P.nfc (town-local) = left-centre of the default close-up frame (camera sits at ~(0.8,25,27)
 // looking at ~(3.8,0,2.4); the Visions card covers screen x 565-945 / y 140-312, i.e. world x ~1-8 behind the square)
 const C0=T.P.nfc||[0,0],dC=l=>Math.hypot(l.x-C0[0],l.z-C0[1]);
 const c=L.lots.filter(l=>l.nf&&!l.lab&&!l.out&&l.w>=.85&&l.d>=.8&&Math.hypot(l.x,l.z)<lim).sort((a,b)=>dC(a)-dC(b)),tw=[];
 for(const l of c){if(tw.length>=5)break;if(tw.some(o=>Math.hypot(o.x-l.x,o.z-l.z)<2.6))continue;tw.push(l);}
 const ST=[22,19,17,15,12],SH=['mast','step','crown','twin','tim'],FW=[.85,1.0,.95,1.05,1.1],FD=[.85,.95,.95,.9,1.0];   // v3: mast (tallest + high deck) nearest nfc
 tw.forEach((l,i)=>{l.tw=SH[i];l.st=ST[i];l.kind='mid';l.nf=SH[i]==='tim'?'tim':'pv';l.nfd=1;l.w=Math.min(l.w,FW[i]);l.d=Math.min(l.d,FD[i]);l.r=Math.hypot(l.w,l.d)/2;});
 // vertiports: one high deck on the 'mast' tower + up to 2 pads on the tallest wide PV podium roofs (>= 3.2 u apart, clear of towers)
 const top=l=>seat(T,rectPts(l.x,l.z,l.w,l.d,l.ry)).hi+.05+l.st*STOREY,pads=[];L._pads=pads;
 const mt=L.lots.find(l=>l.tw==='mast');if(mt){const y=top(mt);pads.push({x:mt.x,z:mt.z,y:y+.4,r:.88,ry:mt.ry,y0:y,hi:1});}
 const pod=L.lots.filter(l=>l.nf&&!l.tw&&l.st>=5&&l.w>=1.05&&l.d>=.9).sort((a,b)=>(b.nf==='pv')-(a.nf==='pv')||dC(a)-dC(b));
 for(const l of pod){if(pads.length>=3)break;if(pads.some(p=>Math.hypot(p.x-l.x,p.z-l.z)<3.2)||L.lots.some(o=>o.tw&&Math.hypot(o.x-l.x,o.z-l.z)<1.7))continue;
  l.pad=1;const y=top(l);pads.push({x:l.x,z:l.z,y:y+.17,r:Math.min(.85,Math.max(l.w,l.d)*.5),ry:l.ry,y0:y});}
 if(pads.length>2)pads[pads.length-1].park=1;}
function nfLot(B,l){if(l.nfd)return;l.nfd=1;const T=B.T,L=B.L,R=T.R,n0=+T.P.nf0||0,f=Math.max(0,(Math.hypot(l.x,l.z)-n0)/(R*T.P.nf-n0));if(f>=1||l.w<.8||l.d<.8||l.lab)return;   // nf0 = square/civic radius (nearest lots ~3.2 u)
 const st=Math.round(4+3*Math.pow(1-f,.8)*(.55+.45*hash2(l.seed*.13,2.9)));l.st=Math.max(l.st,st);l.kind='mid';   // r6 N v2: podiums 4-7 so the towers stand clear
 l.nf=hash2(l.seed*.53,4.7)<.45?'pv':'pod';}
function nfDeco(B,l,S,mid,y0,y1,wc){const T=B.T,b=S.building,ry=l.ry,hd=l.d/2;
 if(l.nf==='pod')return;
 if(l.nf==='pv'){const tw=l.tw,W={lit:T.P.lit*1.1,seed:l.seed+7,bay:.18},x=l.x,z=l.z,cb=em(B,PAL.cool,mid?.26:.32);
  if((tw||(l.st>=8&&l.seed%3!==1))&&tw!=='crown')for(const sd of[-1,1]){const o=rotP(0,sd*(hd+.012),ry);box(S.light,x+o[0],y1-.2,z+o[1],l.w*.86,.045,.012,ry,cb);}
  if(!mid)for(const sd of[-1,1]){const o=rotP(sd*(l.w/2+.012),0,ry);box(b,x+o[0],y0+.3,z+o[1],.025,y1-y0-.3,l.d*.9,ry,tone(wc,1.25));}   // fin strips (PV-glass frame)
  if(tw&&tw!=='tim')for(const c of[[1,1],[-1,-1]]){const o=rotP(c[0]*(l.w/2+.01),c[1]*(hd+.01),ry);box(S.light,x+o[0],y0+.35,z+o[1],mid?.06:.03,y1-y0-.45,mid?.06:.03,ry,em(B,PAL.cool,mid?.2:.24));}   // r6 N v2: dim cool corner lines = tower silhouette at dusk
  if(tw==='step'){const h1=3*STOREY,h2=2*STOREY;box(b,x,y1,z,l.w*.7,h1,l.d*.7,ry,wc,W,tone(wc,.9));box(b,x,y1+h1,z,l.w*.42,h2,l.d*.42,ry,wc,W,tone(wc,.9));
   strut(S.metal,[x,y1+h1+h2,z],[x,y1+h1+h2+1.1,z],mid?.05:.03,hex(PAL.steel,T.A));box(S.light,x,y1+h1+h2+1.1,z,mid?.12:.07,mid?.12:.07,mid?.12:.07,0,em(B,PAL.lamp,.7));}
  else if(tw==='twin'){const o=rotP(l.w*.27,0,ry);box(b,x+o[0],y1,z+o[1],l.w*.46,5*STOREY,l.d*.92,ry,wc,W,tone(wc,.9));
   const q=rotP(l.w*.27,hd*.92+.012,ry);box(S.light,x+q[0],y1+5*STOREY-.2,z+q[1],l.w*.4,.045,.012,ry,cb);}
  else if(tw==='crown'){for(const yb of[y1-.2,y0+(y1-y0)*.55])for(const sd of[-1,1]){const o=rotP(0,sd*(hd+.012),ry);box(S.light,x+o[0],yb,z+o[1],l.w*.86,.04,.012,ry,cb);}
   box(b,x,y1,z,l.w*.86,.12,l.d*.86,ry,tone(wc,.8),null,tone(wc,.85));roof(b,x,y1+.12,z,l.w*.86,l.d*.86,ry,.9,'hip',hex('#4A5866',T.A),.0,wc);}
  return;}
 const gr=hex(PAL.greenRoof,T.A*1.1),sh=hex('#4A6440',T.A),stp=mid?6:3;
 for(let i=stp;i<l.st;i+=stp){const y=y0+i*STOREY-.04;box(b,l.x,y,l.z,l.w+.22,.05,l.d+.22,ry,tone(wc,.75),null,gr);
  if(!mid)for(const c of[[1,1],[-1,1],[1,-1],[-1,-1]]){const o=rotP(c[0]*(l.w/2+.04),c[1]*(hd+.04),ry);box(S.foliage,l.x+o[0],y+.05,l.z+o[1],.12,.1+.06*hash2(i,c[0]+l.seed),.12,ry,sh);}}}
function nfFarm(B,l,S,mid,y1){const T=B.T,ry=l.ry,top=y1+(mid?.005:.105),gr=hex(PAL.greenRoof,T.A*(mid?1.3:1.15));
 if(mid){box(S.building,l.x,top,l.z,l.w*.78,.03,l.d*.7,ry,gr);return;}
 for(let i=-1;i<=1;i++){const o=rotP(-l.w*.12,i*l.d*.2,ry);box(S.foliage,l.x+o[0],top,l.z+o[1],l.w*.5,.05,.08,ry,gr);}
 const o=rotP(l.w*.3,0,ry);box(S.glass,l.x+o[0],top,l.z+o[1],l.w*.26,.2,l.d*.62,ry,hex(PAL.glass,T.A));}
function emitLot(B,l,S,mid){if(B.T.P.nf){nfPick(B);nfLot(B,l);}const T=B.T,P=T.P,b=S.building,pts=rectPts(l.x,l.z,l.w,l.d,l.ry),s=seat(T,pts),y0=s.hi+(mid?0:.05),h=l.st*STOREY,y1=y0+h,k=l.kind;
 let wc=wallCol(T,l.seed),win={lit:P.lit,seed:l.seed,bay:k==='slab'?.26:BAY};const rc=roofCol(T,l.seed);
 if(T.id==='normaltech'&&k==='mid'&&l.seed%4===0){wc=hex(['#56646E','#4E5A60','#62686C'][l.seed%3],T.A);win.bay=.2;win.lit=P.lit*1.15;}   // B2 r2: glazed office variant
 if(l.nf==='pv'){wc=hex(l.tw?['#4E5C6C','#56636F','#4A5766'][l.seed%3]:['#34404E','#3A4652','#303B47'][l.seed%3],T.A);win.bay=.18;win.lit=P.lit*(l.tw?1.25:1.1);}else if(l.nf==='tim'){wc=hex(PAL.timberL,T.A);win.bay=.24;}   // r5 C; r6 N: towers a lighter blue-grey glass + more lit bays so they stand off the podiums
 if(l.lab){win.lit=P.lit*.04;wc=tone(wc,.62);}                    // B2 r4: o1984 research compound - unlit, darker (NEAR + MID)
 const rk=(k==='slab'||k==='mid')?'flat':P.roof==='mix'?(l.seed%3?'pitched':'flat'):P.roof;
 if(!mid||s.hi-s.lo>.03)prism(b,rectPts(l.x,l.z,l.w+.04,l.d+.04,l.ry),s.lo-.15,y0,tone(wc,.6),null,mid?false:null);
 prism(b,pts,y0,y1,wc,win,rk==='pitched'?false:rc);
 const rh=Math.min(l.w,l.d)*(.34+.1*hash2(l.seed,1.7))*(T.id==='descendants'?1.45:1);   // r4: descendants = steep old roofs (NEAR+MID)
 if(rk==='pitched')roof(b,l.x,y1,l.z,l.w,l.d,l.ry,rh,l.seed%4===0?'hip':'gable',rc,.05,wc);
 else if(rk==='green')box(b,l.x,y1,l.z,l.w+.1,.05,l.d+.1,l.ry,tone(wc,.8),null,hex(PAL.greenRoof,T.A*(mid?1.35:1)));   // C1 r5: MID roofs lighter so each house reads against the ring lane
 if(l.nf&&l.nf!=='pod')nfDeco(B,l,S,mid,y0,y1,wc);else if(P.nf&&rk==='flat'&&!l.lab&&!l.pad&&hash2(l.seed*.29,6.1)<(l.nf?.55:.4))nfFarm(B,l,S,mid,y1);   // r5 C; r6 N: podium roofs farmed too
 if(mid){   // C1 r5: MID-only sparse warm window points (world zoom: the facade shader's distance glow averages into the wall, so
  // egalitarian/protector showed 0 % warm pixels); one small lit pane per chosen house, alternating faces; P.midWin = share of lots
  if(P.midWin&&hash2(l.seed*.77,5.3)<P.midWin){const sd=l.seed%2?1:-1,o=rotP(0,sd*(l.d/2+.02),l.ry);box(S.light,l.x+o[0],y0+h*(P.midWinY||.36),l.z+o[1],l.w*.5,Math.min(.32,h*.45),.03,l.ry,em(B,PAL.warm,P.midWinK||1));}
  return;}
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
// B2 r5: substation reads as one - gravel yard, 3 transformers with radiator fins + bushings, two H-frame gantries, a tall
// 3-rail fence with posts every ~.35 u, brick control hut. Yard size from the slot (2.4 x 1.9).
function substation(B,S,mid,sl){if(mid)return;const T=B.T,m=S.metal,y=T.yl(sl.x,sl.z),st=hex(PAL.steel,.8*T.A),dk=hex(PAL.dark,T.A);
 rectGrid(S.ground,T,sl.x,sl.z,sl.w,sl.d,0,3,3,hex(PAL.pave,.78*T.A),.035);
 for(let i=0;i<3;i++){const x=sl.x-.7+i*.62,z=sl.z+.25;box(m,x,y-.05,z,.42,.44,.32,0,st);box(m,x,y+.08,z,.48,.2,.24,0,dk);
  for(const s of[-1,1])for(let f=0;f<4;f++)box(m,x+(f-1.5)*.09,y,z+s*.2,.02,.32,.08,0,tone(st,.85));                     // radiator fins
  for(let k=-1;k<=1;k++)cyl(m,x+k*.12,y+.39,z,.018,.012,.18,4,hex(PAL.concrete1,1.1*T.A));}
 for(const gx of[-.85,.85]){const g0=[sl.x+gx,y+1.05,sl.z-.55-.18],g1=[sl.x+gx,y+1.05,sl.z-.55+.18];
  strut(m,[g0[0],y-.1,g0[2]],g0,.022,st);strut(m,[g1[0],y-.1,g1[2]],g1,.022,st);strut(m,g0,g1,.02,st);}
 strut(m,[sl.x-.85,y+1.05,sl.z-.55],[sl.x+.85,y+1.05,sl.z-.55],.018,st);B.subTop=[sl.x,y+1.05,sl.z-.55];
 box(S.building,sl.x+.8,y-.1,sl.z+.62,.5,.46,.38,0,hex(PAL.brick0,T.A),{lit:.3,seed:5},hex(PAL.roof0,T.A));
 const hw=sl.w/2,hd=sl.d/2,C=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]];
 for(let i=0;i<4;i++){const a=C[i],e=C[(i+1)%4],n=Math.max(4,Math.round(Math.hypot(e[0]-a[0],e[1]-a[1])/.35));
  for(let k=0;k<n;k++){const x=sl.x+lerp(a[0],e[0],k/n),z=sl.z+lerp(a[1],e[1],k/n),yy=T.yl(x,z);strut(m,[x,yy-.03,z],[x,yy+.38,z],.009,dk);}
  for(const hh of[.1,.24,.37])strut(m,[sl.x+a[0],T.yl(sl.x+a[0],sl.z+a[1])+hh,sl.z+a[1]],[sl.x+e[0],T.yl(sl.x+e[0],sl.z+e[1])+hh,sl.z+e[1]],.005,dk);}
 farBox(B,'metal',sl.x,y,sl.z,1.6,.5,.6,0,st);}
function pylons(B,S,mid,py){if(mid)return;const T=B.T,m=S.metal,H=2.4,st=hex(PAL.steel,.75*T.A),wc=hex(PAL.dark,.8);
 const att=(p,i)=>{const y=T.yl(p.x,p.z),px=-Math.sin(p.a),pz=Math.cos(p.a),s=i===1?1:-1;return i?[p.x+px*.42*s,y+H*.74,p.z+pz*.42*s]:[p.x,y+H,p.z];};
 const wire=(a,e)=>{let q=a;for(let k=1;k<=5;k++){const t=k/5,n=[lerp(a[0],e[0],t),lerp(a[1],e[1],t)-.88*t*(1-t),lerp(a[2],e[2],t)];strut(m,q,n,.006,wc);q=n;}};
 for(let j=0;j<py.length;j++){const p=py[j],y=T.yl(p.x,p.z);lattice(m,p.x,y-.1,p.z,.17,.035,H*.82+.1,3,st,.011);
  strut(m,[p.x,y+H*.82,p.z],att(p,0),.014,st);strut(m,att(p,1),att(p,2),.013,st);
  for(let i=0;i<3;i++){if(j)wire(att(py[j-1],i),att(p,i));else if(B.subTop)wire(B.subTop,att(p,i));}
  farBox(B,'metal',p.x,y,p.z,.14,H,.14,0,st);}}
// B2 r5 (scope: "identifiable data centre + substation"): campus yard (gravel, perimeter fence with gate) holding two long low
// windowless halls with a service lane between them; rows of rooftop cooling fans, a ground chiller row and backup generator
// containers at one end, loading doors, a raised cable tray running to the substation. MID = the two halls.
function datacenter(B,S,mid,sl){const T=B.T,b=S.building,m=S.metal,ry=sl.ry,W=sl.w-.7,D1=(sl.d-.6-.3)/2,c=hex(PAL.concrete1,.82*T.A),rc=hex('#53585C',T.A),st=hex(PAL.steel,.85*T.A),dk=hex(PAL.dark,T.A);
 const at=(lx,lz)=>{const o=rotP(lx,lz,ry);return[sl.x+o[0],sl.z+o[1]];},y=T.yl(sl.x,sl.z);let lo=1e9,hi=-1e9;
 for(const s of[-1,1]){const p=at(-.12,s*(D1/2+.15)),pts=rectPts(p[0],p[1],W,D1,ry),q=seat(T,pts);lo=Math.min(lo,q.lo);hi=Math.max(hi,q.hi);
  prism(b,rectPts(p[0],p[1],W+.05,D1+.05,ry),q.lo-.15,q.hi+.04,tone(c,.6));prism(b,pts,q.hi+.04,q.hi+.66,c,null,rc);   // long low windowless hall
  if(mid)continue;const y0=q.hi+.04;box(b,p[0],y0+.62,p[1],W+.04,.06,D1+.04,ry,tone(c,.72));                              // parapet band
  const nf=Math.max(3,Math.floor(W/.48));for(let i=0;i<nf;i++){const f=at(-.12+(i-(nf-1)/2)*W/nf,s*(D1/2+.15));                   // rooftop cooling fans
   box(m,f[0],y0+.66,f[1],.34,.1,.34,ry,st);cyl(m,f[0],y0+.76,f[1],.13,.13,.012,10,dk);}
  for(const e of[-1,1]){const d=at(-.12+e*W*.3,s*(D1+.155+.012));box(b,d[0],y0-.02,d[1],.3,.36,.02,ry,hex(PAL.dark,1.2*T.A));     // loading doors on the outer faces
   const lq=at(-.12+e*W*.3,s*(D1+.155+.03));box(S.light,lq[0],y0+.38,lq[1],.04,.02,.012,ry,em(B,PAL.cool,.9));}}
 if(mid)return;
 rectGrid(S.ground,T,sl.x,sl.z,sl.w,sl.d,ry,4,3,hex(PAL.pave,.82*T.A),.032);                                                  // gravel yard
 for(let i=0;i<3;i++){const g=at(sl.w/2-.25,(i-1)*.42),gy=T.yl(g[0],g[1]);box(m,g[0],gy-.05,g[1],.32,.3,.34,ry,hex('#5B625A',T.A));   // backup generators
  cyl(m,g[0],gy+.25,g[1],.025,.025,.2,5,dk);}
 for(let i=0;i<4;i++){const h=at(-sl.w/2+.2,(i-1.5)*.36),hy=T.yl(h[0],h[1]);box(m,h[0],hy-.05,h[1],.26,.24,.3,ry,st);cyl(m,h[0],hy+.19,h[1],.09,.09,.01,8,dk);}   // chiller row
 const hw=sl.w/2,hd=sl.d/2,C=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]];                                                          // perimeter fence, gate gap on one long side
 for(let i=0;i<4;i++){const a=C[i],e=C[(i+1)%4],L2=Math.hypot(e[0]-a[0],e[1]-a[1]),n=Math.max(2,Math.round(L2/.45));
  for(let k=0;k<n;k++){const u=k/n;if(i===0&&Math.abs(u-.5)<.12)continue;const p=at(lerp(a[0],e[0],u),lerp(a[1],e[1],u)),py=T.yl(p[0],p[1]);strut(m,[p[0],py-.03,p[1]],[p[0],py+.34,p[1]],.009,dk);}
  for(const hh of[.12,.32]){const segs=i===0?[[0,.38],[.62,1]]:[[0,1]];for(const sg of segs){const p0=at(lerp(a[0],e[0],sg[0]),lerp(a[1],e[1],sg[0])),p1=at(lerp(a[0],e[0],sg[1]),lerp(a[1],e[1],sg[1]));
   strut(m,[p0[0],T.yl(p0[0],p0[1])+hh,p0[1]],[p1[0],T.yl(p1[0],p1[1])+hh,p1[1]],.006,dk);}}}
 let ss=null,sd2=1e9;for(const q of[B.L.slots.substation].concat(B.L.slots.pylons||[])){if(!q)continue;const d=Math.hypot(q.x-sl.x,q.z-sl.z);if(d<sd2){sd2=d;ss=q;}}
 if(ss){const dx=ss.x-sl.x,dz=ss.z-sl.z,dl=Math.hypot(dx,dz);if(dl>1e-3&&dl<13){const ux=dx/dl,uz=dz/dl,t0=Math.hypot(sl.w,sl.d)/2+.1,t1=dl-(ss.w?1.35:.4);   // cable tray to the grid
  const n=Math.max(1,Math.round((t1-t0)/.9));let prev=null;for(let k=0;k<=n;k++){const t=lerp(t0,t1,k/n),x=sl.x+ux*t,z=sl.z+uz*t;
   if(inLot(B.L,x,z,.1)||nearStreet(B.L,x,z,.05)){prev=null;continue;}const p=[x,T.yl(x,z)+.22,z];strut(m,[x,p[1]-.25,z],p,.012,dk);if(prev)strut(m,prev,p,.022,st);prev=p;}}}
 farBox(B,'building',sl.x,lo,sl.z,sl.w-.6,hi-lo+.7,sl.d-.6,ry,c,rc);}

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
 const wt=W*.36,lc=em(B,'#DCE4EA',1.1);   // o1984 pass: crown band 1.5 -> 1.1 (was the brightest spot, competed with the beams)
 box(S.light,sl.x,y-.42,sl.z,wt+.02,.09,wt+.02,0,lc);box(S.light,sl.x,y-.24,sl.z,wt+.02,.05,wt+.02,0,tone(lc,.7));
 if(!mid){strut(S.metal,[sl.x,y,sl.z],[sl.x,y+1.3,sl.z],.03,hex(PAL.dark,1));box(S.light,sl.x,y+1.3,sl.z,.06,.06,.06,0,em(B,'#E8EEF2',.9));   // o1984 pass: mast tip 2.2 -> .9, crown sprite 1.0/4 -> .18/2.4 (no bloom orb on the tower)
  addLight(B,sl.x,y-.3,sl.z,'#DCE4EA',.18,2.4);farBox(B,'light',sl.x,y-.45,sl.z,wt+.04,.14,wt+.04,0,lc);}}
function searchlights(B,S,mid,list){const T=B.T,H=4,st=hex(PAL.steel,.6*T.A);
 for(let i=0;i<list.length;i++){const o=list[i],y=T.yl(o.x,o.z);
  if(mid){box(S.metal,o.x,y-.1,o.z,.3,H+.1,.3,0,st);continue;}
  lattice(S.metal,o.x,y-.1,o.z,.3,.13,H+.1,4,st,.014);box(S.metal,o.x,y+H,o.z,.44,.05,.44,0,st);box(S.metal,o.x,y+H+.05,o.z,.16,.14,.16,0,hex(PAL.dark,1));
  // o1984 pass: lamp head small + dim (2.4 -> .75, below the bloom threshold), NO engine glow sprite (the 1.0 x glowK x HDR-core
  // sprite was the white orb); a tiny dim lens dot stays (0.1 -> .3 u sprite, peak .1*1.2*7 = .84 < thr 1.4)
  box(S.light,o.x,y+H+.19,o.z,.08,.025,.08,0,em(B,'#C9D6E4',.75));
  B.beams.push({x:o.x,y:y+H+.14,z:o.z,ph:o.ph});B.movers.push({x:o.x,y:y+H,z:o.z,r:7,n:'searchlight'});
  addLight(B,o.x,y+H+.2,o.z,'#C9D6E4',.1,1.2);farBox(B,'metal',o.x,y,o.z,.3,H,.3,0,st);}}

// ======================= (13) specials: protector =======================
function dome(B,S,mid,sl){const T=B.T,THREE=T.THREE;
 if(!B.domeG){B.domeG=new THREE.SphereGeometry(sl.r,40,14,0,TAU,0,PI/2);B.domeG.scale(1,sl.h/sl.r,1);B.M.dome.side=THREE.BackSide;}
 const m=new THREE.Mesh(B.domeG,B.M.dome);m.position.set(sl.x,-.6,sl.z);m.renderOrder=6;m.name=mid?'pt_mid_dome':'pt_dome';(mid?B.extraMid:B.extra).push(m);
 // B2 r5: footing band removed (it drew a bright line where the shell meets the ground)
}
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
  for(let i=0;i<n;i++){const a=a0-span/2+(i+.5)*span/n,rm=(r0+r1)/2;
   if(!mid&&(i===Math.floor(n/4)||i===Math.floor(n/2)||i===Math.floor(3*n/4))){   // three radial aisles: B2 r5 paved stone steps (r4 gap showed a grass wedge)
    box(b,sl.x+Math.cos(a)*rm,y-.14,sl.z+Math.sin(a)*rm,w,h+.14-H/NR*.5,r1-r0+.02,ryIn(a),tone(c,.8),null,tone(c,1.12));continue;}
   box(b,sl.x+Math.cos(a)*rm,y-.14,sl.z+Math.sin(a)*rm,w,h+.14,r1-r0+.02,ryIn(a),tone(tc,.85),null,tc);}}
 // B2 r5: the open mouth is a paved stone forecourt from the stage out to the berm foot (no grass wedge into the bowl)
 {const m0=a0+span/2,mspan=TAU-span,nm=mid?3:8;for(let i=0;i<nm;i++){const a=m0+i*mspan/nm,e=m0+(i+1)*mspan/nm;quadUp(b,P3(rS,a,-.035),P3(rS,e,-.035),P3(rO,e,-.035),P3(rO,a,-.035),tone(c,.9));}}
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
// B2 r5 (vision r4: \"reads as a wireframe cage\", bright stray rib + base line across houses): a calm glass garden reserve -
// low planted stone plinth, faint glass from the plinth up, only 8 thin dark mullions, a thin dark eaves ring, no roof spokes,
// a hedge + shrub belt along the inside of the plinth. FAR keeps 8 thin posts.
function enclosure(B,S,mid,sl){const T=B.T,n=mid?24:48,r=sl.r,top=T.yl(sl.x,sl.z)+sl.h,gc=hex(mid?'#4E585C':'#8FA6A8',1),mu=hex('#4A5258',T.A),stn=hex(mid?'#4A4E56':PAL.stone,(mid?.8:.95)*T.A),PH=.32;   // r7 P: MID glass + plinth darker (world: pale halo ring); the enclosure itself stays (ending-defining). r9 Q3: still the brightest ring at world zoom (+38 L over the terrain at r ~7.5) -> MID plinth = dark slate, glass '#66767A' -> '#4E585C'
 const P3=(i,up,rr)=>{const a=(i%n)*TAU/n,R0=rr||r,x=sl.x+Math.cos(a)*R0,z=sl.z+Math.sin(a)*R0;return[x,up===1?top:up===2?T.yl(x,z)+PH:T.yl(x,z)-.12,z];};
 for(let i=0;i<n;i++){quad(S.glass,P3(i,2),P3(i+1,2),P3(i+1,1),P3(i,1),gc,null);tri(S.glass,[sl.x,top,sl.z],P3(i,1),P3(i+1,1),gc);
  const a=(i+.5)*TAU/n,x=sl.x+Math.cos(a)*r,z=sl.z+Math.sin(a)*r;box(S.building,x,T.yl(x,z)-.12,z,2*r*Math.sin(PI/n)+.03,PH+.12,.26,-a+PI/2,stn,null,tone(stn,1.08));}
 if(mid)return;
 for(let i=0;i<n;i++){strut(S.metal,P3(i,1),P3(i+1,1),.012,mu);if(i%6===0){strut(S.metal,P3(i,2),P3(i,1),.012,mu);const p=P3(i,0);farBox(B,'metal',p[0],p[1],p[2],.06,sl.h,.06,0,mu);}
  const a=(i+.5)*TAU/n,ri=r-.32,x=sl.x+Math.cos(a)*ri,z=sl.z+Math.sin(a)*ri,y=T.yl(x,z);
  box(S.foliage,x,y-.04,z,2*ri*Math.sin(PI/n)+.02,.24,.2,-a+PI/2,hex(PAL.foliage,1.05*T.A),null,hex(PAL.foliage,1.2*T.A));
  if(i%3===1){const q=r-.62,sx=sl.x+Math.cos(a)*q,sz=sl.z+Math.sin(a)*q;if(!inLot(B.L,sx,sz,.15))cyl(S.foliage,sx,T.yl(sx,sz)-.03,sz,.2,0,.55+.25*hash2(i,3.1),6,hex(PAL.foliage,(.95+.2*hash2(i,1.7))*T.A));}}}
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
function plaza(B,S,mid,sl){const T=B.T,st=hex(PAL.stone,T.A);disc(S.ground,T,sl.x,sl.z,sl.r,mid?2:4,mid?14:24,hex(PAL.stone,(mid?.56:.78)*T.A),.03);if(mid)return;   // r7 P: MID plaza disc darker (hub of the 'radial disc' read)
 const y=T.yl(sl.x,sl.z);cyl(S.building,sl.x,y-.08,sl.z,.34,.34,.18,12,st,tone(st,.45));cyl(S.building,sl.x,y,sl.z,.06,.05,.46,6,st,true);cyl(S.building,sl.x,y+.46,sl.z,.13,.1,.04,8,st,true);
 addLight(B,sl.x+sl.r*.6,y+.4,sl.z,PAL.lamp,.6,2.5);}
function seam(B,S,mid,sl){const T=B.T;disc(S.ground,T,sl.x,sl.z,sl.r*.9,mid?1:2,mid?10:18,hex(PAL.stone,.7*T.A),.03);
 if(!mid)cyl(S.building,sl.x,T.yl(sl.x,sl.z)-.08,sl.z,.55,.55,.14,14,hex(PAL.stone,.9*T.A),true);}
function emptying(B,S,mid){if(mid)return;const U=B.U,o0=clamp(+B.T.P.out||0,0,.9);
 B.anims.push(t=>{const p=((t/180)%1+1)%1;U.uOut.value=lerp(o0,.92,p<.85?p/.85:(1-p)/.15);});}
// ======================= (16b) G1 S2 r5: the world OUTSIDE the zookeeper fence and the growing machine city of descendants =======
// Both are placed from their own seeded stream (mulberry32 of the town seed), computed ONCE per build and emitted by the NEAR and the
// MID pass from the same list, so the MID silhouette matches NEAR. Density thins outward (no ring edge); P.keepA (host: road-spur
// direction) keeps a clear corridor for the road. Colours: low-chroma slate / pale machine grey, a few dim cool indicator dots only.
function keepClear(T,x,z,w){const a=T.P.keepA;if(a==null)return false;const ux=Math.cos(a),uz=Math.sin(a),t=x*ux+z*uz;return t>0&&Math.abs(-x*uz+z*ux)<w;}
function zooMachines(B,S,mid){const T=B.T,L=B.L,sl=L.slots.enclosure;if(!sl)return;
 if(!B._zm){const r=mulberry32(((T.seed|0)*31+977)>>>0),r0=sl.r+1.05,r1=T.R*(+T.P.machR||1.45),it=[];
  for(let k=0;k<900&&it.length<(+T.P.machN||78);k++){const a=r()*TAU,u=r(),rr=r0-.6+(r1-r0+.6)*u+(r()-.5)*1.1,x=sl.x+Math.cos(a)*rr,z=sl.z+Math.sin(a)*rr,ty=r(),s=.7+r()*.6,ry=r()*PI,hr=r();   // r7 P: inner edge jittered (no crisp concentric ring of obelisks)
   if(rr<sl.r+.55)continue;
   if(r()<ss(.3,1,u)*.8)continue;if(keepClear(T,x,z,1.5))continue;const rad=ty<.42?.3*s:ty<.8?.62*s:1.0*s;
   if(it.some(o=>Math.hypot(o.x-x,o.z-z)<o.rad+rad+.25))continue;
   const f=1-.55*u;   // heights fall off outward
   it.push({x,z,ty:ty<.42?'ob':ty<.8?'st':'hall',s,ry,rad,h:(ty<.42?2.6+hr*3.6:ty<.8?1.1+hr*2.2:.45+hr*.35)*f,u,lit:hr>.55});}
  // one slow gantry crane in the machine land (v4.4 cue: a machine crane swinging outside the fence)
  const ca=(T.P.keepA!=null?+T.P.keepA:0)+2.3;B._zm={it,crane:[sl.x+Math.cos(ca)*(r0+1.6),sl.z+Math.sin(ca)*(r0+1.6)]};}
 const ZM=B._zm,dk=hex('#4A4F5B',T.A),dk2=hex('#3B404A',T.A),ob=hex('#6E7080',T.A),ob2=hex('#5A5C6C',T.A),hall=hex('#565B66',T.A);   // r7 P: obelisks '#8A8AA2' -> slate (vision: 'icy spire forest')
 for(const o of ZM.it){const s=seat(T,rectPts(o.x,o.z,o.rad*2,o.rad*2,o.ry)),y=s.lo-.1;
  if(o.ty==='ob'){cyl(S.building,o.x,y,o.z,o.rad*1.25,o.rad*1.1,.22,4,dk2,true);cyl(S.building,o.x,y+.2,o.z,o.rad,o.rad*.18,o.h,4,ob,true);   // crystal obelisk on a dark footing
   if(!mid){cyl(S.building,o.x,y+.2+o.h*.98,o.z,o.rad*.2,.005,o.h*.08,4,ob2,true);if(o.lit)box(S.light,o.x,y+o.h*.55,o.z,.05,.05,.05,0,em(B,PAL.cool,.55));}}
  else if(o.ty==='st'){const w=o.rad*1.35,d=o.rad*.95;box(S.building,o.x,y,o.z,w,o.h,d,o.ry,dk,null,dk2);   // compute stack: dark block, stepped crown, thin lit seam
   box(S.building,o.x,y+o.h,o.z,w*.7,.22,d*.7,o.ry,dk2,null,tone(dk2,1.1));
   if(o.lit){const p=rotP(0,d/2+.012,o.ry);box(S.light,o.x+p[0],y+o.h*.35,o.z+p[1],w*.7,.035,.01,o.ry,em(B,PAL.cool,mid?.45:.5));}
   if(!mid)for(let k=0;k<3;k++){const p=rotP((k-1)*w*.3,-(d/2+.06),o.ry);box(S.metal,o.x+p[0],y,o.z+p[1],.08,o.h*.8,.1,o.ry,dk2);}}
  else{box(S.building,o.x,y,o.z,o.rad*2.4,o.h,o.rad*.9,o.ry,hall,null,tone(hall,1.12));if(!mid){for(let k=-2;k<=2;k++){const p=rotP(k*o.rad*.45,0,o.ry);box(S.metal,o.x+p[0],y+o.h,o.z+p[1],.05,.06,o.rad*.9,o.ry,dk2);}}}
  if(!mid&&B.farSp<=480)farBox(B,'building',o.x,y,o.z,o.rad*1.4,o.h,o.rad*1.4,o.ry,dk);}
 // crane (separate mesh per tier, slow swing; frozen at t=0 under reduced motion by the host)
 const THREE=T.THREE,cx=ZM.crane[0],cz=ZM.crane[1],cy=T.yl(cx,cz)-.1,cb=buf(),cc=hex('#5A606C',T.A);
 box(cb,0,0,0,.5,.18,.5,0,dk2);lattice(cb,0,.18,0,.16,.12,4.6,6,cc,.018);box(cb,-.9,4.78,0,4.2,.14,.14,0,cc);box(cb,-2.7,4.6,0,.35,.3,.3,0,dk2);
 if(!mid)strut(cb,[1.1,4.86,0],[1.1,3.2,0],.01,cc);
 const cm=new THREE.Mesh(geomOf(T,cb),B.M.metal);cm.name='pt_crane';cm.position.set(cx,cy,cz);(mid?B.extraMid:B.extra).push(cm);
 (ZM.cm=ZM.cm||[]).push(cm);if(!mid)B.anims.push(t=>{for(const m of ZM.cm)m.rotation.y=.6+Math.sin(t*.11)*.9;});}
function descCity(B,S,mid){const T=B.T,L=B.L,sl=L.slots.seam;if(!sl)return;const R=T.R,aS=sl.a==null?Math.atan2(sl.z,sl.x):sl.a;
 if(!B._dc){const r=mulberry32(((T.seed|0)*17+4421)>>>0),it=[],HW=+T.P.mcHW||.82;
  for(let k=0;k<1400&&it.length<(+T.P.mcN||86);k++){const da=(r()*2-1)*HW,u=r(),rr=R*(.86+.72*u),a=aS+da*(1+.35*u),x=Math.cos(a)*rr,z=Math.sin(a)*rr,ty=r(),hr=r(),ry=a+(r()<.5?0:PI/2);
   const edge=Math.abs(da)/HW;if(r()<Math.max(ss(.45,1,u),ss(.55,1,edge))*.85)continue;if(keepClear(T,x,z,1.4))continue;
   if(inLot(L,x,z,.45)||nearStreet(L,x,z,.25))continue;if(L.spires&&L.spires.some(q=>Math.hypot(q[0]-x,q[1]-z)<1.0))continue;
   const rad=ty<.45?.24:ty<.85?.45:.7;if(it.some(o=>Math.hypot(o.x-x,o.z-z)<o.rad+rad+.2))continue;
   const f=(1-.6*u)*(1-.45*edge);it.push({x,z,ty:ty<.45?'sp':ty<.85?'tw':'deck',rad,ry,h:(ty<.45?2.4+hr*3.6:ty<.85?1.4+hr*3.0:.35+hr*.3)*f+.3,lit:hr>.6,u});}
  // three towers still being assembled (they rise slowly; host freezes them at t=0 under reduced motion)
  const g=[];for(const o of it)if(o.ty==='tw'&&o.u>.15&&o.u<.6&&g.length<3){o.grow=1;g.push(o);}
  B._dc={it,g};}
 const DC=B._dc,pc=hex('#868C94',T.A),pc2=hex('#737980',T.A),dk=hex('#555A63',T.A),THREE=T.THREE;   // r5: pale grey -> 1 step darker; r7 P: one more step ('#9CA3AB'/'#858C95'; vision 'icy-blue spire forest')
 for(const o of DC.it){const s=seat(T,rectPts(o.x,o.z,o.rad*2,o.rad*2,o.ry)),y=s.lo-.1;if(o.grow)continue;
  if(o.ty==='sp'){cyl(S.building,o.x,y,o.z,o.rad*1.2,o.rad,.25,6,dk,true);cyl(S.building,o.x,y+.25,o.z,o.rad*.7,o.rad*.16,o.h,6,pc,true);
   if(!mid){for(let k=0;k<3;k++){const b=o.ry+k*TAU/3,p=[Math.cos(b)*o.rad*.5,Math.sin(b)*o.rad*.5];box(S.building,o.x+p[0],y+.25,o.z+p[1],.02,o.h*.5,.08,-b,pc2);}
    if(o.lit)box(S.light,o.x,y+.25+o.h*.7,o.z,.04,.04,.04,0,em(B,PAL.cool,.5));}}
  else if(o.ty==='tw'){const w=o.rad*1.5,d=o.rad*1.1;box(S.building,o.x,y,o.z,w,o.h*.62,d,o.ry,pc2,null,pc);box(S.building,o.x,y+o.h*.62,o.z,w*.72,o.h*.38,d*.72,o.ry,pc,null,tone(pc,1.06));
   if(o.lit){const p=rotP(0,d*.36+.012,o.ry);box(S.light,o.x+p[0],y+o.h*.8,o.z+p[1],w*.4,.03,.01,o.ry,em(B,PAL.cool,.45));}}
  else{box(S.building,o.x,y,o.z,o.rad*2.2,o.h,o.rad*1.5,o.ry,dk,null,pc2);}
  if(!mid&&B.farSp<=480)farBox(B,'building',o.x,y,o.z,o.rad*1.4,o.h,o.rad*1.4,o.ry,pc2);}
 for(const o of DC.g){const s=seat(T,rectPts(o.x,o.z,o.rad*2,o.rad*2,o.ry)),y=s.lo-.1,b=buf(),w=o.rad*1.5,d=o.rad*1.1,H=o.h*1.25;
  box(b,0,0,0,w,H,d,o.ry,pc2,null,pc);if(!mid){for(const c of[[1,1],[-1,1],[1,-1],[-1,-1]]){const p=rotP(c[0]*(w/2+.05),c[1]*(d/2+.05),o.ry);box(b,p[0],H-.02,p[1],.04,.5,.04,o.ry,dk);}
   box(b,0,H+.48,0,w+.14,.04,.04,o.ry,dk);}
  const m=new THREE.Mesh(geomOf(T,b),B.M.metal);m.name='pt_grow';m.position.set(o.x,y,o.z);(mid?B.extraMid:B.extra).push(m);(o.ms=o.ms||[]).push(m);}
 if(!mid)B.anims.push(t=>{for(let i=0;i<DC.g.length;i++){const o=DC.g[i],p=((t/240+i*.31)%1+1)%1,k=p<.82?lerp(.3,1,ss(0,.82,p)):lerp(1,.3,ss(.82,1,p));if(o.ms)for(const m of o.ms)m.scale.y=k;}});}
// r5 C: sky + rail layer of the near-future town. 2-3 rooftop vertiports (dark pad, ring of warm pad lights) on the tallest PV towers,
// eVTOL air taxis (pod + 4 rotor arms, rotors not spinning) flying slow fixed legs pad->pad (rise, cruise, descend, ~30 s a leg), a
// delivery-drone corridor (small quads streaming one way, shrinking to 0 at the corridor ends), and an elevated light-rail line on
// pillars along the most central street with one 3-car train shuttling slowly. Instanced (1 draw per kind and tier); anim(0) = frozen.
function nearFuture(B,S,mid){const T=B.T,L=B.L,R=T.R,THREE=T.THREE;
 if(!B._nf){nfPick(B);const pads=L._pads||[];
  let st=null,bd=1e9;for(const s of L.streets){if(s.closed||s.pts.length!==2)continue;const a=s.pts[0],e=s.pts[1],len=Math.hypot(e[0]-a[0],e[1]-a[1]),dm=Math.abs((a[0]+e[0])/2)+Math.abs((a[1]+e[1])/2);
   if(len>R*1.2&&dm+Math.abs(Math.min(Math.abs(a[0]-e[0]),Math.abs(a[1]-e[1])))<bd&&dm>.9){bd=dm;st=s;}}
  // r6 N: the rail line spans the whole town and runs out past its edge (deck 2.25 over the highest ground under the inner 70 %)
  let rail=null;if(st){const a=st.pts[0],e=st.pts[1],n=Math.hypot(e[0]-a[0],e[1]-a[1]),dx=(e[0]-a[0])/n,dz=(e[1]-a[1])/n,t0=a[0]*dx+a[1]*dz,ox=a[0]-dx*t0,oz=a[1]-dz*t0,Lr=R*1.08,N=Math.ceil(2*Lr/1.75),pts=[];let ym=-1e9;
   for(let i=0;i<=N;i++){const s=-Lr+2*Lr*i/N,x=ox+dx*s,z=oz+dz*s;if(Math.abs(s)<R*.7)ym=Math.max(ym,T.yl(x,z));pts.push([x,z,s]);}
   const y=ym+2.25,q=pts.filter(p=>T.yl(p[0],p[1])<y-.6);if(q.length>3)rail={pts:q,y:y,a:Math.atan2(dz,dx),dx,dz,ox,oz,s0:q[0][2],s1:q[q.length-1][2]};}
  const hp=pads.length?Math.max(...pads.map(p=>p.y)):T.yl(0,0)+5,lp=pads.filter(p=>!p.hi),lh=lp.length?Math.max(...lp.map(p=>p.y)):T.yl(0,0)+2.6;
  // r6 N v3 (vision: taxis at 'tower top + 1.1' flew off the top of the close-up frame): corridor lanes cruise low (podium pads +1.3,
  // between the towers); the lane angle is chosen from 36 candidates for the largest clearance from the 5 towers (3 lanes, 1.3 apart)
  const TW=L.lots.filter(l=>l.tw),C0=T.P.nfc||[0,0],K=[C0[0]+2.5,C0[1]+.2];let ca=(rail?rail.a:0)+PI/2+.35,bc=-1;
  for(let k=0;k<36;k++){const a=k/36*PI,ux=Math.cos(a),uz=Math.sin(a);let m=1e9;for(const o of TW)for(let i=-1;i<=1;i++)m=Math.min(m,Math.abs(-uz*(o.x-K[0])+ux*(o.z-K[1])-i*1.3));if(m>bc){bc=m;ca=a;}}
  const cy=lh+1.3,dy=lh+.9;
  B._nf={pads,rail,cy,hp,dy,ca,K,tx:[],trl:[],drB:[],drL:[],tr:[]};}
 const NF=B._nf,dk=hex('#2E3238',T.A),pd=hex('#3A3F46',T.A),cc=hex('#8A8C90',T.A),ls=mid?1.8:1,C4=[[1,1],[-1,1],[1,-1],[-1,-1]];
 // vertiports: dark deck + a continuous ring of warm pad lights (brighter every 5th) + dim cool cross; the high deck sits on a collar
 for(const p of NF.pads){if(p.hi)cyl(S.metal,p.x,p.y0-.02,p.z,.28,.4,p.y-p.y0-.03,8,dk,dk);else box(S.metal,p.x,p.y0-.02,p.z,.34,p.y-p.y0-.03,.34,p.ry,dk);
  cyl(S.metal,p.x,p.y-.05,p.z,p.r,p.r,.05,mid?12:20,pd,pd);const n=mid?10:20;
  for(let i=0;i<n;i++){const a=(i+.5)/n*TAU,rr=p.r*.9;box(S.light,p.x+Math.cos(a)*rr,p.y,p.z+Math.sin(a)*rr,TAU*rr/n*.66,.03*ls,.07*ls,-a+PI/2,em(B,PAL.lamp,i%5===0?.8:.62));}
  if(!mid){const ir=p.r*.5;for(let i=0;i<12;i++){const a=(i+.5)/12*TAU;box(S.light,p.x+Math.cos(a)*ir,p.y,p.z+Math.sin(a)*ir,TAU*ir/12*.5,.012,.03,-a+PI/2,em(B,PAL.cool,.3));}}}
 // elevated light rail: one long concrete deck on T-capped pillars (every ~1.75 u), dim cool edge strips, station by the square
 if(NF.rail){const r=NF.rail,ry=-r.a,q=r.pts,len=r.s1-r.s0,sm=(r.s0+r.s1)/2,mx=r.ox+r.dx*sm,mz=r.oz+r.dz*sm;
  box(S.metal,mx,r.y-.14,mz,len,.12,.36,ry,cc,null,tone(cc,1.05));
  for(const sd of[-1,1]){const o=rotP(0,sd*.186,ry);box(S.light,mx+o[0],r.y-.1,mz+o[1],len,.03*ls,.012,ry,em(B,PAL.cool,mid?.2:.24));}
  for(const p of q){const gy=T.yl(p[0],p[1]);box(S.metal,p[0],gy-.1,p[1],.13*ls,r.y-.14-gy+.1,.13*ls,ry,cc);if(!mid)box(S.metal,p[0],r.y-.22,p[1],.22,.08,.48,ry,cc);}
  const sx=r.ox,sz=r.oz;for(const sd of[-1,1]){const o=rotP(0,sd*.38,ry);box(S.metal,sx+o[0],r.y-.18,sz+o[1],2.3,.1,.34,ry,pd,null,tone(cc,.9));}
  box(S.metal,sx,r.y+.62,sz,2.5,.05,1.16,ry,dk,null,pd);box(S.light,sx,r.y+.6,sz,2.2,.02,.05,ry,em(B,PAL.lamp,.5));
  if(!mid)for(const c of C4){const o=rotP(c[0]*1.05,c[1]*.54,ry);box(S.metal,sx+o[0],r.y-.18,sz+o[1],.04,.8,.04,ry,dk);}}
 // movers (instanced, 1 draw per kind and tier): eVTOL body + nav lights share matrices; light trails; drones + blinking lights; train
 // r6 N v2 (vision: the X-quads read as 'drones', not air taxis): winged passenger eVTOL - fuselage with a lit cabin band, dark
 // canopy, high wing with 4 rotors + 2 canard rotors, tail boom + fin; ~1.1 u long
 const pb=buf(),bdy=hex('#B4B8BE',T.A),rt=hex('#5A6068',T.A);box(pb,0,0,0,1.0,.3,.34,0,bdy,null,tone(bdy,1.06));box(pb,.24,.2,0,.4,.12,.3,0,hex('#2E3A48',T.A));
 box(pb,-.05,.28,0,.3,.04,1.6,0,bdy);box(pb,-.66,.1,0,.42,.08,.09,0,bdy);box(pb,-.84,.18,0,.14,.26,.04,0,tone(bdy,.9));
 for(const zr of[-.74,-.4,.4,.74])cyl(pb,-.05,.34,zr,.17,.17,.02,10,rt,rt);for(const zr of[-.3,.3]){box(pb,.46,.12,zr*.8,.12,.03,.32,0,bdy);cyl(pb,.46,.17,zr*1.3,.13,.13,.02,10,rt,rt);}
 const k2=mid?2.4:1.6,lb=buf();box(lb,.02,.11,0,.62,.1,.35,0,em(B,PAL.lamp,.55));for(const sd of[-1,1])box(lb,-.05,.3,sd*.8,.06*k2,.05*k2,.06*k2,0,em(B,sd>0?PAL.cool:PAL.lamp,.8));box(lb,-.9,.32,0,.05*k2,.05*k2,.05*k2,0,em(B,PAL.lamp,.8));
 const trb=buf();box(trb,0,0,0,.08*k2,.05*k2,.08*k2,0,em(B,PAL.lamp,.42));
 const db=buf();box(db,0,0,0,.16,.06,.16,0,hex('#5A6068',T.A));for(const c of C4)box(db,c[0]*.12,.05,c[1]*.12,.1,.012,.1,0,hex('#3A3E44',T.A));
 const dlb=buf();box(dlb,0,-.03,0,.07*k2,.05*k2,.07*k2,0,em(B,PAL.lamp,.7));
 const PD=NF.pads,mv=PD.filter(p=>!p.park),legs=[];for(let i=0;i<mv.length-1;i++)legs.push([mv[i],mv[i+1]]);if(mv.length>2)legs.push([mv[mv.length-1],mv[0]]);
 const pk=PD.filter(p=>p.park),nL=legs.length*2,nC=3,nT=nL+nC+pk.length,NTR=6,nTr=(nL+nC)*NTR,nD=mid?6:12;   // r7 P: 6 trail dots (was 4)
 const IM=(bb,mat,n,nm,list)=>{const m=new THREE.InstancedMesh(geomOf(T,bb),mat,n);m.name=nm;m.frustumCulled=false;(mid?B.extraMid:B.extra).push(m);list.push(m);return m;};
 IM(pb,B.M.metal,nT,'pt_evtol',NF.tx);IM(lb,B.M.light,nT,'pt_evtol_nav',NF.tx);IM(trb,B.M.light,nTr,'pt_evtol_trail',NF.trl);
 IM(db,B.M.metal,nD,'pt_drones',NF.drB);IM(dlb,B.M.light,nD,'pt_drone_lights',NF.drL);
 if(NF.rail){const tb=buf(),tl=buf(),bc=hex('#A4AAB0',T.A);for(let k=0;k<3;k++){box(tb,(k-1)*1.1,0,0,1.04,.3,.32,0,bc,null,tone(bc,1.05));box(tl,(k-1)*1.1,.12,0,.92,.12,.336,0,em(B,PAL.lamp,.62));box(tl,(k-1)*1.1,.3,0,.8,.012,.06,0,em(B,PAL.cool,.22));}
  for(const sd of[-1,1])box(tl,sd*1.64,.05,0,.03,.07,.22,0,em(B,PAL.lamp,.7));
  const tm=new THREE.Mesh(geomOf(T,tb),B.M.metal),tlm=new THREE.Mesh(geomOf(T,tl),B.M.light);tm.name='pt_train';tlm.name='pt_train_lit';(mid?B.extraMid:B.extra).push(tm,tlm);NF.tr.push(tm,tlm);}
 if(NF.an)return;NF.an=1;   // one anim drives both tiers (the lists hold NEAR and MID meshes)
 const O=new THREE.Object3D(),u=[Math.cos(NF.ca),Math.sin(NF.ca)],cor=(s,h,off)=>[NF.K[0]+u[0]*s-u[1]*off,h,NF.K[1]+u[1]*s+u[0]*off],v=[Math.cos(NF.ca+1.1),Math.sin(NF.ca+1.1)];
 const pos=(j,t)=>{if(j<nL){const lg=legs[j>>1],o=j&1,ph=((t/64+o*.5)%1+1)%1,fw=ph<.5,p=fw?ph*2:(ph-.5)*2,a=fw?lg[0]:lg[1],e=fw?lg[1]:lg[0],h=Math.max(a.y,e.y)+.7+o*.45,yw=-Math.atan2(e.z-a.z,e.x-a.x);
   if(p<.12)return[a.x,a.y+.02,a.z,yw,0];if(p>.88)return[e.x,e.y+.02,e.z,yw,0];
   const q=(p-.12)/.76,m=ss(.2,.8,q),y=q<.2?lerp(a.y+.02,h,ss(0,.2,q)):q>.8?lerp(h,e.y+.02,ss(.8,1,q)):h+.1*Math.sin(q*PI*3);return[lerp(a.x,e.x,m),y,lerp(a.z,e.z,m),yw,q>.04&&q<.96?1:0];}
  const i=j-nL,ph=((t/(84+14*i)+i*.33)%1+1)%1,s=(ph<.5?ss(0,.5,ph):1-ss(.5,1,ph))*2-1,c=cor(s*R*1.1,NF.cy+.5+i*.4,(i-1)*1.3);return[c[0],c[1],c[2],-NF.ca+(ph<.5?0:PI),1];};
 B.anims.push(t=>{const put=(ims,i,x,y,z,yaw,sc)=>{O.position.set(x,y,z);O.rotation.set(0,yaw,0);O.scale.setScalar(Math.max(sc,.001));O.updateMatrix();for(const m of ims)if(i<m.count)m.setMatrixAt(i,O.matrix);};
  // r7 P (vision r7: taxis in flight 'small grey, read as drones', trails not seen): flying taxis x1.5, parked x1.25; soft nav-light
  // trail = 6 dots 1.1 s apart, shrinking 1.5 -> .35 (same .42 lamp emissive, below the .70 bloom threshold)
  for(let j=0;j<nL+nC;j++){const p=pos(j,t),fs=1.5;put(NF.tx,j,p[0],p[1],p[2],p[3],fs);for(let k=1;k<=NTR;k++){const q=pos(j,t-k*1.1);put(NF.trl,j*NTR+k-1,q[0],q[1]+.18,q[2],0,q[4]*p[4]*1.5*(1-k*.13));}}
  for(let i=0;i<pk.length;i++)put(NF.tx,nL+nC+i,pk[i].x,pk[i].y+.02,pk[i].z,-pk[i].ry+.6,1.25);
  for(const L2 of[NF.drB,NF.drL])for(const m of L2){const n=m.count;for(let i=0;i<n;i++){const q=((t/55+i/n)%1+1)%1,sc=ss(0,.06,q)*(1-ss(.94,1,q)),d=(q*2-1)*R*1.4,ln=(i%2?.5:-.5),
   x=NF.K[0]+v[0]*d-v[1]*ln,z=NF.K[1]+v[1]*d+v[0]*ln,bl=L2===NF.drL?(((t*.9+i*.37)%1)<.5?1:0):1;O.position.set(x,NF.dy+.25*(i%3),z);O.rotation.set(0,-NF.ca-1.1,0);O.scale.setScalar(Math.max(sc*bl,.001));O.updateMatrix();m.setMatrixAt(i,O.matrix);}}
  for(const m of NF.tx.concat(NF.trl,NF.drB,NF.drL))m.instanceMatrix.needsUpdate=true;
  if(NF.rail){const r=NF.rail,ph=((t/70)%1+1)%1,m=ph<.5?ss(.05,.45,ph):1-ss(.55,.95,ph),s=lerp(r.s0+1.9,r.s1-1.9,m);
   for(const tm of NF.tr){tm.position.set(r.ox+r.dx*s,r.y-.08,r.oz+r.dz*s);tm.rotation.y=-r.a;}}});}
const SPECIALS={square:square,regulator:regulator,substation:substation,pylons:pylons,datacenter:datacenter,camPoles:camPoles,checkpoints:checkpoints,ministry:ministry,
 searchlights:searchlights,dome:dome,anomaly:anomaly,commons:commons,amphitheatre:amphitheatre,workshop:workshop,library:library,enclosure:enclosure,gardens:gardens,
 playground:playground,tree:treeOne,plaza:plaza,seam:seam,emptying:emptying,machines:zooMachines,machcity:descCity,nearfuture:nearFuture};
const MIDSP={square:1,regulator:1,datacenter:1,ministry:1,searchlights:1,dome:1,commons:1,amphitheatre:1,workshop:1,library:1,enclosure:1,plaza:1,seam:1,machines:1,machcity:1,nearfuture:1};
const NOSLOT={camPoles:1,gardens:1,emptying:1,machines:1,machcity:1,nearfuture:1};
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
// B2 r5: soft additive warm pool under each lamp (centre bright -> rim 0 via radial vertex alpha), follows the terrain
function lampPool(B,x,z,r,yo,k){const T=B.T,b=B.N.pool,n=12,c=hex(PAL.lamp,(B.day?.06:.3)*k);T.pc[0]=x;T.pc[1]=z;T.pc[2]=r;
 const P=a=>{const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;return[px,T.yl(px,pz)+yo+.025,pz];},C=[x,T.yl(x,z)+yo+.025,z];
 for(let i=0;i<n;i++)tri(b,C,P((i+1)*TAU/n),P(i*TAU/n),c);}
function propsStreet(B){const T=B.T,L=B.L,lc=em(B,PAL.lamp,1.1),n=Math.min(L.lamps.length,160),ls=Math.max(1,Math.ceil(n/6)),fs=Math.max(1,Math.ceil(n/10));
 for(let i=0;i<n;i++){const l=L.lamps[i],y=T.yl(l.x,l.z)+(l.y||0),sc=l.k==='lantern'?.55:1;B.inst.lamp.push([l.x,y,l.z,1,sc,1,hash2(l.x,l.z)*TAU,lc]);
  {const st=l.k==='street'&&l.tx!=null,ox=st?l.tz*l.sd*.25:0,oz=st?-l.tx*l.sd*.25:0;lampPool(B,l.x+ox,l.z+oz,l.k==='lantern'?.5:.9,l.y||0,l.k==='lantern'?.6:1);}
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
 return{tree0:geomOf(T,t0),tree1:geomOf(T,t1),car:geomOf(T,car).scale(1.22,1.25,1.22),pole:geomOf(T,pole),beam:beamGeo(T),bench:geomOf(T,bench),bin:geomOf(T,bin),shelter:geomOf(T,sh)};}

// ======================= (17b) B2 r4: ending-fidelity cues + fineness of detail (NEAR unless noted) =======================
// Owner after r3: "image precision, fineness of detail, rendering that matches each ending's description". Cue list per
// ending = b2_protown_notes.md §11.1. Everything here draws from an OWN rng stream (B.r4) or hash2, so the layout rnd()
// stream, lot positions and the MID/FAR massing stay as in r3 (MID silhouette pieces: descendants seam spires only).
// Static people / shrubs / extra trees are MERGED into the foliage family (no extra draw); only movers are instanced.
const PEOC=['#6E6A64','#4D5560','#7A6250','#5E6B5A','#8A8478','#3E4450','#9A7E62','#56606C','#7C5A5A','#5A6E78'],SKIN=hex('#B89A80',.9);
const PEO={normaltech:{st:.95,walk:26,bench:.5,bot:5,drone:3,spd:.1},o1984:{st:.08,walk:3,bench:0,file:4,spd:.08},protector:{st:.5,walk:16,bench:.55,spd:.06},
 egalitarian:{st:.4,walk:18,bench:.6,spd:.08},zookeeper:{st:.5,walk:4,bench:.6,bot:6,spd:.05},descendants:{st:.16,walk:5,bench:.3,spd:.045}};
// one tiny figure (~1.9 m): legs, torso (clothing colour), head; seat=1 -> seated (short legs); s = overall scale (children .7)
function personAt(b,x,y,z,ry,c,seat,s){s=(s||1)*1.55;const lg=(seat?.03:.085)*s;box(b,x,y,z,.05*s,lg,.03*s,ry,tone(c,.5),null,false);   // B2 r5: 1.15 -> 1.55 (street-level readability)
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
 const col=i=>hex(id==='o1984'?'#5C6066':PEOC[i%PEOC.length],T.A*(1.15+.35*r()));let np=0;   // B2 r5: brighter clothing (was .85 + .3 r)
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
 // G1 S2 r5: host passes keepA = road-spur direction -> the supply road ends at the closed airlock
 const aH=T.P.keepA!=null?+T.P.keepA:hash2(T.seed*.37,5.5)*TAU,hx=sl.x+Math.cos(aH)*sl.r,hz=sl.z+Math.sin(aH)*sl.r,hy=T.yl(hx,hz),ry=ryIn(aH);
 box(S.building,hx,hy-.05,hz,.9,.95,.6,ry,tone(pale,.92),null,tone(pale,.8));box(S.building,hx,hy+.9,hz,1.0,.07,.7,ry,st);   // solid lock chamber through the wall
 B.solids.push({n:'airlock',x:hx,z:hz,w:1.0,d:.7,ry:ry});if(pad)B.solids.push({n:'podpad',x:pad[0],z:pad[1],r:.34});
 for(const c of[[1,1],[-1,1],[1,-1],[-1,-1]]){const o=rotP(c[0]*.45,c[1]*.3,ry);strut(S.metal,[hx+o[0],hy-.05,hz+o[1]],[hx+o[0],hy+.9,hz+o[1]],.02,st);}
 {for(const q of[.31,-.31]){const o=rotP(0,q,ry);box(S.building,hx+o[0],hy-.05,hz+o[1],.42,.72,.02,ry,hex(PAL.dark,T.A));}
  const o=rotP(0,-.32,ry);box(S.light,hx+o[0],hy+.74,hz+o[1],.3,.03,.012,ry,em(B,PAL.cool,.9));}
 // people standing at the glass looking out; children at the playground
 for(let i=0;i<6;i++){const a=aH+.7+i*.85+.2*r(),x=sl.x+Math.cos(a)*(sl.r-.52),z=sl.z+Math.sin(a)*(sl.r-.52);if(inLot(L,x,z,.05))continue;   // r5: inside the hedge belt
  personAt(f,x,T.yl(x,z),z,Math.atan2(Math.cos(a),Math.sin(a)),B.peoCol(i+70));}
 if(pg)for(let i=0;i<4;i++){const o=rotP((r()-.5)*1.2,(r()-.5)*1.0,pg.ry||0),x=pg.x+o[0],z=pg.z+o[1];personAt(f,x,T.yl(x,z),z,r()*TAU,B.peoCol(i+80),0,.68);}}
// descendants: pale slender machine spires growing at the seam edge of the old quarter (MID too: silhouette), few cool dots
// B2 r5: integrated machine structures - each spire stands on an old-stone plinth with a pale machine collar, three thin fins,
// low conduits join the plinths along the edge (positions reserved in layOld: L.spires, no lot can touch them), one dim cool dot
function seamSpires(B,S,mid){const T=B.T,L=B.L,sl=L.slots.seam;if(!sl||!L.spires)return;const a=sl.a==null?Math.atan2(sl.z,sl.x):sl.a,pc=hex('#959DA4',T.A),stn=hex(PAL.stone,T.A),out=[];   // r10 B: spires #B6BEC4 -> #959DA4 (pale white spikes at world zoom)
 for(const q of L.spires){const x=q[0],z=q[1],H=q[2],y=T.yl(x,z);out.push([x,y,z,H]);
  box(S.building,x,y-.12,z,.62,.42,.62,a,tone(stn,.92),null,tone(stn,1.05));                         // old-stone plinth
  cyl(S.building,x,y+.3,z,.3,.2,.34,8,tone(pc,.85),true);cyl(S.building,x,y+.6,z,.17,.045,H-.6,6,pc,true);   // collar + spire
  if(mid)continue;
  for(let k=0;k<3;k++){const b=a+k*TAU/3,o=[Math.cos(b)*.15,Math.sin(b)*.15];box(S.building,x+o[0],y+.62,z+o[1],.025,(H-.6)*.55,.1,-b,tone(pc,.92));}
  if(out.length===3)box(S.light,x,y+H*.62,z,.03,.03,.03,0,em(B,PAL.cool,.6));
  farBox(B,'metal',x,y,z,.24,H,.24,0,pc);}
 for(let i=1;i<out.length;i++){const p=out[i-1],e=out[i],mx=(p[0]+e[0])/2,mz=(p[2]+e[2])/2,L2=Math.hypot(e[0]-p[0],e[2]-p[2]),ry=Math.atan2(e[0]-p[0],e[2]-p[2]);
  box(S.building,mx,T.yl(mx,mz)-.06,mz,.2,.22,L2-.5,ry,tone(pc,.78),null,tone(pc,.95));                   // low conduit hall between plinths
  if(mid)continue;B.solids.push({n:'conduit',x:mx,z:mz,w:.2,d:L2-.5,ry:ry});const h=Math.min(p[3],e[3])*.55;strut(S.building,[p[0],p[1]+h,p[2]],[e[0],e[1]+h*.9,e[2]],.03,pc);}}
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
 return{person:geomOf(T,pe),bot:geomOf(T,bo).scale(1.5,1.5,1.5),drone:geomOf(T,dr).scale(1.4,1.4,1.4)};}   // B2 r5: bots / drones larger

// ======================= (18) merge: near, mid, far =======================
function wrap(B,name){const THREE=B.T.THREE,g=new THREE.Group(),inner=new THREE.Group();g.name=name;inner.name=name+'_rot';inner.rotation.y=B.T.rot;g.add(inner);return{g:g,inner:inner};}
function addFam(B,inner,bufs,prefix,casters){const THREE=B.T.THREE;
 for(const k of['ground','building','metal','light','foliage','glass']){const b=bufs[k];if(!b||!bufTris(b))continue;const m=new THREE.Mesh(geomOf(B.T,b),B.M[k]);m.name=prefix+k;m.receiveShadow=k!=='light'&&k!=='glass';
  if(k==='glass')m.renderOrder=3;if(k==='ground')m.renderOrder=1;if(casters&&(k==='building'||k==='metal')){m.castShadow=true;casters.push(m);}inner.add(m);}}
// o1984 pass: the same sweep drives the MID beam copy (B.beamMid, built later in mergeMid) - world zoom shows MID, so the
// beams must exist there too (r5: MID had only the glow-sprite orbs and no beam)
function animBeams(B,im){const bm=B.beams;return t=>{const tg=B.beamMid?[im,B.beamMid]:[im];for(let i=0;i<bm.length;i++){const o=bm[i];B.eul.set(0,o.ph+t*.17*(i&1?-1:1),-(.36+.08*Math.sin(t*.11+o.ph)),'YXZ');B.q.setFromEuler(B.eul);
  B.m4.compose(B.v.set(o.x,o.y,o.z),B.q,B.one);for(const m of tg)m.setMatrixAt(i,B.m4);}for(const m of tg)m.instanceMatrix.needsUpdate=true;};}
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
 for(const k of['ground','building','metal','light','foliage','glass','pool']){const b=B.N[k],nt=b?bufTris(b):0;if(!nt)continue;const CK=k==='ground'?4000:CHUNK;   // B2 r3: RGBA ground chunks smaller (cold 10.6 ms)
  for(let t=0;t<nt;t+=CK){const t0=t,t1=Math.min(nt,t+CK),sfx=nt>CK?'_'+(t0/CK):'';
   jobs.push(()=>{const m=new THREE.Mesh(geomRange(B.T,b,t0,t1),B.M[k]);m.name='pt_'+k+sfx;m.receiveShadow=k!=='light'&&k!=='glass'&&k!=='pool';if(k==='glass')m.renderOrder=3;if(k==='ground')m.renderOrder=1+t0/CK*.001;if(k==='pool')m.renderOrder=2;
    if(k==='building'||k==='metal'){m.castShadow=true;B.casters.push(m);}W.inner.add(m);});}}
 return jobs;}
function mergeNearB(B){const W=B._W,I=B.inst,G=propGeos(B),add=m=>{if(m)W.inner.add(m);return m;};
 add(instMesh(B,'pt_trees0',G.tree0,B.M.foliage,I.tree0));add(instMesh(B,'pt_trees1',G.tree1,B.M.foliage,I.tree1));
 add(instMesh(B,'pt_cars',G.car,B.M.metal,I.car));add(instMesh(B,'pt_lamps',B.gLamp,B.M.metal,I.lamp));add(instMesh(B,'pt_lampheads',B.gHead,B.M.light,I.lamp));
 add(instMesh(B,'pt_poles',G.pole,B.M.metal,I.pole));
 add(instMesh(B,'pt_benches',G.bench,B.M.metal,I.bench));add(instMesh(B,'pt_bins',G.bin,B.M.metal,I.bin));add(instMesh(B,'pt_shelters',G.shelter,B.M.metal,I.shelter));
 if(B.beams.length)safe('beams',()=>{const im=add(instMesh(B,'pt_beams',G.beam,B.M.beam,B.beams.map(o=>[o.x,o.y,o.z,1,1,1,o.ph,null])));im.renderOrder=5;im.receiveShadow=false;B.gBeam=G.beam;B.anims.push(animBeams(B,im));});
 if(B.moving.length)safe('moving cars',()=>{const im=add(instMesh(B,'pt_movers',G.car,B.M.metal,B.moving.map(c=>[c.path[0],c.path[1],c.path[2],1,1,1,0,c.col])));B.anims.push(animCars(B,im));});
 const G4=safe('r4 geos',()=>r4Geos(B));
 if(G4&&B.walkers.length)safe('walkers',()=>{const im=add(instMesh(B,'pt_walkers',G4.person,B.M.foliage,B.walkers.map(c=>[c.path[0],c.path[1],c.path[2],1,1,1,0,c.col])));B.anims.push(animWalk(B,im,B.walkers));});
 if(G4&&B.bots.length)safe('bots',()=>{const im=add(instMesh(B,'pt_bots',G4.bot,B.M.metal,B.bots.map(c=>[c.path[0],c.path[1],c.path[2],1,1,1,0,c.col])));B.anims.push(animWalk(B,im,B.bots));});
 if(G4&&B.drones.length)safe('drones',()=>{const im=add(instMesh(B,'pt_drones',G4.drone,B.M.metal,B.drones.map(o=>[o.cx,o.h,o.cz,1,1,1,0,null])));B.anims.push(animDrones(B,im));});
 for(const e of B.extra)W.inner.add(e);
 B.near=W.g;}
function midLots(B){const L=B.L;ground(B,B.D,true);for(let i=0;i<L.lots.length;i++)emitLot(B,L.lots[i],B.D,true);}
function mergeMid(B){for(const n of B.T.P.special)special(B,n,true);safe('r4 mid',()=>r4Mid(B));
 if(B.beams.length&&B.gBeam)safe('mid beams',()=>{const im=instMesh(B,'pt_mid_beams',B.gBeam,B.M.beam,B.beams.map(o=>[o.x,o.y,o.z,1,1,1,o.ph,null]));im.renderOrder=5;im.receiveShadow=false;B.beamMid=im;B.extraMid.push(im);});
 const W=wrap(B,'pt_mid');addFam(B,W.inner,B.D,'pt_mid_',null);for(const e of B.extraMid)W.inner.add(e);B.mid=W.g;}
function mergeFar(B){const T=B.T,lots=B.L.lots.slice().sort((a,b)=>b.w*b.d*b.st-a.w*a.d*a.st).slice(0,120),out=[];
 for(const l of lots){const s=seat(T,rectPts(l.x,l.z,l.w,l.d,l.ry));box(B.F.building,l.x,s.lo-.1,l.z,l.w,s.hi-s.lo+.1+l.st*STOREY+(T.P.roof==='pitched'?.15:0),l.d,l.ry,wallCol(T,l.seed),null,roofCol(T,l.seed));}
 let tris=0;for(const k of['building','metal','ground','light']){const b=B.F[k];if(!bufTris(b))continue;tris+=bufTris(b);out.push({geom:geomOf(T,b,true),family:k});}
 B.far=out;B.farTris=tris;}

// ======================= (19) result, buildSteps, build =======================
// B2 r5: footprints in the LAYOUT frame (before site.rot) for the conformance overlap check (tools/protown_conformance.js):
// lots = wall rect + eaves [x,z,w,d,ry], solids = special structures {n,x,z,w,d,ry}|{n,x,z,r}, gardens [x,z,w,d,ry,ownerLot]
const SOLID={regulator:1,substation:1,datacenter:1,ministry:1,workshop:1,library:1,amphitheatre:1,playground:1,tree:1,seam:1};
function footOf(B){const L=B.L,sol=[],SR={amphitheatre:4.4,seam:.55,tree:.4,playground:.85};
 for(const n in L.slots){const s=L.slots[n];if(!SOLID[n]||!s||Array.isArray(s))continue;
  if(s.w&&s.d)sol.push({n:n,x:s.x,z:s.z,w:s.w,d:s.d,ry:s.ry||0});else sol.push({n:n,x:s.x,z:s.z,r:SR[n]||s.r});}
 for(const p of(L.slots.pylons||[]))sol.push({n:'pylon',x:p.x,z:p.z,r:.2});
 for(const q of(L.spires||[]))sol.push({n:'spire',x:q[0],z:q[1],r:.44});
 for(const s of B.solids)sol.push(s);
 return{frame:'layout',lots:L.lots.map(l=>[l.x,l.z,l.w+.1,l.d+.1,l.ry,l.out?1:0]),solids:sol,gardens:L.gardens.map(g=>[g.x,g.z,g.w,g.d,g.ry,g.o==null?-1:g.o])};}
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
  uniforms:{uT:U.uT,uOut:U.uOut,uLit:U.uLit},ending:T.id,matsUsed:B.used,footprints:safe('footprints',()=>footOf(B))};
 safe('anim(0)',()=>res.anim(0));
 PT.info.last={ending:T.id,stats:res.stats};PT.info.matsUsed=B.used;return res;}
// B2 r2: time-sliced steps. SL = slice budget per step (ms, site.sliceMs overrides); loops stop starting new work once SL is
// used, so a step costs <= SL + one unit (one lot / one chunk). Geometry does not depend on where the slices fall.
function* buildSteps(site,ctx){if(zooNew(site))return zooG1Z(site,ctx);const steps=[];let ts=now(),total=0;const SL=site&&+site.sliceMs>0?+site.sliceMs:3.5;
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
function build(site,ctx){if(zooNew(site))return zooG1Z(site,ctx);const it=buildSteps(site,ctx);let r=it.next();while(!r.done)r=it.next();return r.value;}

// ======================= (19b) r11 Z: Zookeeper rebuilt from the book cues on the FA.G1Z kit (js/prolib.js) =======================
// Tegmark, Life 3.0 ch.5 "Zookeeper": an omnipotent AI keeps some humans around, who feel treated like zoo animals and lament their
// fate; it provides food, safety and enough enrichment to keep them interesting to watch, and uses the rest of Earth for its own ends.
// Cues Z1-Z5 (PREVIEW_NOTES 'conq+zoo r11 (Z)'); references re-imagined in our own geometry: Eden Project linked geodesic biomes,
// Biosphere 2, Gardens by the Bay grid-shells; the machine land outside reuses the Conquerors vocabulary at lower detail.
//  Z1 two linked geodesic glass domes (faceted panes + strut lattice, fresnel-edged glass) standing straight on the ground;
//  Z2 inside: a tidy idealised village - cottages with pitched roofs round a green with one big tree, a pond, curving paths, garden
//     plots, an orchard + vegetable rows in the small dome, warm lamps, a few people (some stand at the glass, looking out);
//  Z3 an angular observation gallery of the AI's world around the domes: raised decks on piers, dark viewing glass facing IN, sensor
//     booms leaning over the big dome;
//  Z4 supply conduits from the machine land into feeding hatches at the dome foot (pods glide along them), service drones to a crown
//     port; the road ends at a closed airlock in the gallery (no road leads inside);
//  Z5 outside: a dark orthogonal machine landscape (compute blocks, radiator combs, tall stacks, cool seams) that dominates the frame.
// ?zoov=0 = the r10 protown 'cluster' zookeeper.
function zooNew(site){if(!site)return false;let id=String(site.ending==null?'':site.ending);id=ALIAS[id]||id;if(id!=='zookeeper')return false;
 const F=root.FA;if(!F||!F.G1Z||!F.G1Z.dome||!F.G1KIT)return false;try{if(/[?&]zoov=0/.test(root.location&&root.location.search||''))return false;}catch(e){}return true;}
function zooG1Z(site,ctx){const Z=root.FA.G1Z,k=root.FA.G1KIT,THREE=ctx.THREE||root.THREE;
 const res=Z.city(site,ctx,'zookeeper',E=>{
 const{smooth,vn,hash}=k,R=E.R,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,TAU=Math.PI*2,NR=E.near;
 const P=site.params||{},kA=P.keepA!=null?P.keepA:Math.PI/2,avoid=P.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const GA=kA,u=[Math.cos(GA),Math.sin(GA)],v=[-u[1],u[0]],ry=-GA,W=(a,b)=>[a*u[0]+b*v[0],a*u[1]+b*v[1]],LOC=(x,z)=>[x*u[0]+z*u[1],x*v[0]+z*v[1]];
 const IND='#5C7A8E',SLIT=[.17,.25,.31],WARM=[.86,.6,.32];
 // ---- Z1 domes (frame: u = toward the arriving road) ----
 const D1={c:W(-.4,-1.2),r:4.4,h:3.6},D2={c:W(-.7,3.55),r:2.45,h:2.05},DOM=[D1,D2],S1=D1.r/4.7;
 // the close-up camera (CLOSECAM zookeeper yaw -1.6, fa4_build.js, V2's row): CBz = direction toward it; the machine land is kept low there
 const CBz=Math.atan2(Math.cos(-1.6),Math.sin(-1.6)),wrapz=a=>{a=((a%TAU)+TAU)%TAU;return a>Math.PI?a-TAU:a;},dodge=a=>{const d=wrapz(a-kA);return Math.abs(d)<.6?kA+(d<0?-.6:.6):a;};
 const inDome=(x,z,m)=>DOM.some(d=>Math.hypot(x-d.c[0],z-d.c[1])<d.r-(m||0));
 const domeY=(d,x,z)=>{const q=Math.hypot(x-d.c[0],z-d.c[1])/d.r;return q>=1?0:d.h*Math.sqrt(1-q*q);};
 const gm=Z.glassMat('#6E86A0',.2,'#9AB4CA'),strut=cv('#76808A'),rim=cv('#3E4248');
 for(const d of DOM){const gy=H(d.c[0],d.c[1])-.04,big=d===D1,G=Z.dome(NR?(big?3:2):1);
  E.add(gm,G.geo,d.c[0],gy,d.c[1],d.r,d.h,d.r,0,0,0,[1,1,1]);
  const ew=NR?(big?.05:.045):.09;for(const e of G.edges)Z.beam(E,M.ME,d.c[0]+e[0]*d.r,gy+e[1]*d.h,d.c[1]+e[2]*d.r,d.c[0]+e[3]*d.r,gy+e[4]*d.h,d.c[1]+e[5]*d.r,ew,strut);
  const ns=NR?40:20;for(let q=0;q<ns;q++){const a0=q/ns*TAU,a1=(q+1)/ns*TAU,x0=d.c[0]+Math.cos(a0)*d.r,z0=d.c[1]+Math.sin(a0)*d.r,x1=d.c[0]+Math.cos(a1)*d.r,z1=d.c[1]+Math.sin(a1)*d.r;   // low dark footing (no slab)
   const mxx=(x0+x1)/2,mzz=(z0+z1)/2;E.box(M.ST,mxx,H(mxx,mzz)-.12,mzz,Math.hypot(x1-x0,z1-z0)*1.03,.26,.16,-Math.atan2(z1-z0,x1-x0),rim);}
  if(big){E.add(M.ME,E.G.cyl(12,1),d.c[0],gy+d.h-.03,d.c[1],.55,.14,.55,0,0,0,cv('#5A626C'));E.add(M.ME,E.G.cyl(12,.8),d.c[0],gy+d.h+.1,d.c[1],.32,.22,.32,0,0,0,cv('#3E444E'));   // crown port for drones
   E.glow(d.c[0],gy+d.h+.4,d.c[1],.4,IND,.42,[.4,5,0,0]);E.anchors.crown={x:d.c[0],y:gy+d.h+.3,z:d.c[1]};}}
 // ---- Z2 village inside the big dome, orchard + plots in the small one ----
 const cx=D1.c[0],cz=D1.c[1],yA=H(cx,cz),homes=[],TREES=[];
 {const n=11;for(let q=0;q<n;q++){const a=q/n*TAU+.35,rr=(2.75+.25*((q%2)?1:-1)*.6)*S1,x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr,ro=-a+Math.PI/2;   // ring of cottages facing the green
   const y=E.lowY(x,z,.8,.7)-.05,w=.74+.12*hash(q,2),dd=.56+.08*hash(q,5),h=.42+.1*hash(q,7);homes.push({x,z,a});
   E.box(M.ST,x,y,z,w,h,dd,ro,jc(cv(['#B8AC96','#C2B49A','#AEA28E'][q%3]),x,z,.05));
   E.add(M.RF,E.prism(),x,y+h,z,w*1.12,.34,dd*1.16,0,ro,0,jc(cv(['#7A5244','#6A4E46','#84604A'][q%3]),x,z,.06));
   if(NR){E.box(M.ST,E.L2W(x,z,ro,w*.3,0)[0],y+h+.12,E.L2W(x,z,ro,w*.3,0)[1],.09,.32,.09,ro,cv('#8A7A6A'));   // chimney
    for(const s of[-1,1])for(const t of[-.22,.22]){const p=E.L2W(x,z,ro,t*w,s*(dd/2+.01));E.box(M.LT,p[0],y+.15,p[1],.15,.15,.02,ro,WARM);}
    {const p=E.L2W(x,z,ro,0,dd/2+.12);E.glow(p[0],y+.3,p[1],.42,'#E6A866',.42,null);}   // porch light
    const g=E.L2W(x,z,ro,0,dd/2+.36);for(const s of[-1,1]){const p=E.L2W(g[0],g[1],ro,s*.42,0);E.box(M.FO,p[0],H(p[0],p[1])-.04,p[1],.06,.16,.5,ro,cv('#4A6034'));}   // front-garden hedges
    E.box(M.FO,E.L2W(g[0],g[1],ro,0,.26)[0],H(g[0],g[1])-.04,E.L2W(g[0],g[1],ro,0,.26)[1],.86,.14,.06,ro,cv('#4A6034'));}
   else E.box(M.LT,E.L2W(x,z,ro,0,dd/2+.01)[0],y+.16,E.L2W(x,z,ro,0,dd/2+.01)[1],w*.6,.12,.02,ro,WARM);}}
 // the one big tree on the green + small trees, gazebo, pond, path lamps
 E.box(M.WD,cx,yA-.05,cz,.14,1.0,.14,0,cv('#4A3A2C'));for(const[o,s]of[[[0,1.45,0],1.25],[[.5,1.15,.25],.75],[[-.45,1.25,-.3],.8],[[.1,1.95,-.1],.7]])E.add(M.FO,E.G.ico(NR?2:1),cx+o[0],yA+o[1],cz+o[2],s,s*.82,s,0,0,0,jc(cv('#47663A'),cx+o[0],cz+o[2],.12));
 {const p=[cx+Math.cos(GA+2.3)*1.0,cz+Math.sin(GA+2.3)*1.0];const gx=p[0],gz=p[1],gy=H(gx,gz)-.03;E.add(M.ST,E.G.cyl(8,1),gx,gy,gz,.42,.08,.42,0,0,0,cv('#A49A88'));for(let q=0;q<6;q++){const a=q/6*TAU;E.box(M.WD,gx+Math.cos(a)*.36,gy,gz+Math.sin(a)*.36,.04,.42,.04,0,cv('#6A5A48'),1);}
  E.add(M.RF,E.G.cone(6),gx,gy+.42,gz,.5,.3,.5,0,0,0,cv('#6E5446'));}
 const PD=[cx+Math.cos(GA-.7)*1.02,cz+Math.sin(GA-.7)*1.02];   // pond centre (on the green, inside the path ring)
 for(let q=0;q<10;q++){const a=q/10*TAU+.2,x=cx+Math.cos(a)*1.85*S1,z=cz+Math.sin(a)*1.85*S1,y=H(x,z);E.box(M.ME,x,y-.03,z,.035,.36,.035,0,cv('#4A4E54'),1);E.glow(x,y+.38,z,.5,'#E6B07A',.55,null);}
 for(let q=0;q<7;q++){const a=q/7*TAU,x=cx+Math.cos(a)*3.9*S1,z=cz+Math.sin(a)*3.9*S1;if(Math.hypot(x-D2.c[0],z-D2.c[1])<D2.r+.3)continue;TREES.push([x,z,.3+.08*hash(q,1)]);}
 {const c2=D2.c;for(let a=-1;a<=2;a++)for(let b=-1;b<=1;b++){const p=E.L2W(c2[0],c2[1],ry,a*.62,b*.62+.5);if(Math.hypot(p[0]-c2[0],p[1]-c2[1])>D2.r-.5)continue;TREES.push([p[0],p[1],.24]);}}   // orchard grid
 for(const[x,z,s]of TREES){const y=H(x,z);E.box(M.WD,x,y-.04,z,.05,.34,.05,0,cv('#4A3A2C'),1);E.add(M.FO,E.G.ico(1),x,y+.3+s*.6,z,s,s*.9,s,0,0,0,jc(cv('#4E6E3C'),x,z,.14));}
 {const c2=D2.c;const p=E.L2W(c2[0],c2[1],ry,-1.25,-.55);E.box(M.ST,p[0],H(p[0],p[1])-.04,p[1],.9,.4,.6,ry,cv('#B4A890'));E.add(M.RF,E.prism(),p[0],H(p[0],p[1])+.36,p[1],1.0,.28,.68,0,ry,0,cv('#7A5A48'));   // garden barn / tool house
  if(NR)E.box(M.LT,E.L2W(p[0],p[1],ry,.18,-.31)[0],H(p[0],p[1])+.12,E.L2W(p[0],p[1],ry,.18,-.31)[1],.14,.12,.02,ry,WARM);}
 // people: a few walk the path ring, three stand at the glass looking out (slow; static under reduced motion)
 E.movers(M.ST,.1,.26,.1,cv('#E0CCB0'),6,(i,t,o)=>{const a=t*.018*(i%2?1:-1)+i*1.05,rr=(1.85+(i%3)*.06)*S1,x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;o.position.set(x,H(x,z)-.02,z);});
 {const L=[];for(const a of[GA+.3,GA+2.6,GA-2.2]){L.push([cx+Math.cos(a)*(D1.r-.55),cz+Math.sin(a)*(D1.r-.55)]);}
  for(const[x,z]of L)for(const s of[0,1]){const p=[x+(s?.12:0),z+(s?.1:0)];E.box(M.ST,p[0],H(p[0],p[1])-.02,p[1],.07,.2-.03*s,.07,0,cv(s?'#9A8C7C':'#B8A890'),0);}}
 // ---- Z3 observation gallery (octagon of raised decks with dark glass facing IN; gaps at the airlock and the conduits) ----
 const GC=W(-.5,.3),GU=6.2,GV=7.5,NG=8,gpt=q=>{const a=q/NG*TAU+Math.PI/NG;const l=W(Math.cos(a)*GU,Math.sin(a)*GV);return[GC[0]+l[0],GC[1]+l[1]];};
 const vg=Z.glassMat('#1E2A34',.42,'#6A8496'),GH=2.0,dark=cv('#2C3038'),deck=cv('#3E434B');let gate=null;
 for(let q=0;q<NG;q++){const A=gpt(q),B=gpt(q+1),mx_=(A[0]+B[0])/2,mz=(A[1]+B[1])/2,L=Math.hypot(B[0]-A[0],B[1]-A[1]),an=Math.atan2(B[1]-A[1],B[0]-A[0]),r_=-an;
  const lc=LOC(mx_-GC[0],mz-GC[1]),isGate=lc[0]>3.5&&Math.abs(lc[1])<3.5;const nx=-(mz-GC[1]),nz=(mx_-GC[0]),nl=Math.hypot(nx,nz);
  const ix=-(mx_-GC[0])/Math.hypot(mx_-GC[0],mz-GC[1]),iz=-(mz-GC[1])/Math.hypot(mx_-GC[0],mz-GC[1]);   // unit vector pointing IN
  const gy=Math.min(H(A[0],A[1]),H(B[0],B[1]),H(mx_,mz))-.1;
  if(isGate){gate={x:mx_,z:mz,ry:r_,gy,ix,iz};continue;}
  const Lx=L*.86;E.box(M.B,mx_,gy+GH,mz,Lx,.16,1.0,r_,deck);E.box(M.LT,mx_,gy+GH-.03,mz,Lx*.98,.03,1.02,r_,SLIT);   // deck + cool soffit seam
  const np=NR?4:2;for(let s=0;s<np;s++){const t=(s+.5)/np-.5,p=[mx_+Math.cos(an)*t*Lx,mz+Math.sin(an)*t*Lx];E.box(M.ST,p[0],H(p[0],p[1])-.15,p[1],.2,gy+GH-H(p[0],p[1])+.17,.2,r_,dark);}   // slender piers (open below)
  {const o=[mx_-ix*.45,mz-iz*.45];E.box(M.B,o[0],gy+GH+.16,o[1],Lx,.8,.12,r_,dark);}   // low outer wall (AI side)
  {const o=[mx_+ix*.45,mz+iz*.45];E.add(vg,E.G.box(),o[0],gy+GH+.16,o[1],Lx,.95,.04,0,r_,0,[1,1,1]);   // inner viewing glass (faces the domes)
   {const b=[mx_-ix*.3,mz-iz*.3];E.box(M.LT,b[0],gy+GH+.5,b[1],Lx*.9,.05,.02,r_,[.22,.34,.42]);}   // cool lit instrument band behind the glass (the watchers' side)
   E.box(M.ME,o[0],gy+GH+1.1,o[1],Lx,.06,.08,r_,cv('#4E555E'));E.box(M.ME,o[0],gy+GH+.16,o[1],Lx,.08,.1,r_,cv('#4E555E'));
   const nm=NR?7:3;for(let s=0;s<=nm;s++){const t=s/nm-.5,p=[o[0]+Math.cos(an)*t*Lx,o[1]+Math.sin(an)*t*Lx];E.box(M.ME,p[0],gy+GH+.16,p[1],.05,.95,.06,r_,cv('#4E555E'));}}   // mullions
  E.box(M.B,mx_,gy+GH+1.16,mz,Lx*1.02,.08,1.2,r_,cv('#30343C'));   // flat canopy
  if(NR)for(let s=0;s<3;s++){const t=(s+.5)/3-.5,p=[mx_+Math.cos(an)*t*Lx+ix*.45,mz+Math.sin(an)*t*Lx+iz*.45];E.glow(p[0],gy+GH+1.05,p[1],.26,IND,.32,null);}   // cool downlights under the canopy
  if(q%3===1){const b0=[mx_-ix*.3,mz-iz*.3],bt=[mx_+ix*3.2,mz+iz*3.2],by=gy+GH+1.5;   // sensor boom leaning over the domes
   Z.beam(E,M.ME,b0[0],by,b0[1],bt[0],by+2.4,bt[1],.12,cv('#555C66'));Z.beam(E,M.ME,b0[0],gy+GH+.3,b0[1],(b0[0]+bt[0])/2,by+1.2,(b0[1]+bt[1])/2,.07,cv('#4E555E'),1);
   E.add(M.ME,E.G.ico(1),bt[0],by+2.4,bt[1],.2,.16,.2,0,0,0,cv('#2C3038'));E.glow(bt[0]+ix*.12,by+2.32,bt[1]+iz*.12,.34,'#7E98AA',.5,[.3,6.5,q,0]);}}
 if(gate){const g=gate,ux_=-g.iz,uz_=g.ix;for(const s of[-1,1])E.box(M.ST,g.x+ux_*1.0*s,g.gy,g.z+uz_*1.0*s,.5,2.9,.9,g.ry,dark);   // closed airlock where the road ends
  E.box(M.B,g.x,g.gy+2.4,g.z,2.5,.5,1.0,g.ry,dark);E.box(M.ME,g.x,g.gy,g.z,1.5,2.4,.18,g.ry,cv('#454B54'));E.box(M.LT,g.x-g.ix*.1,g.gy+2.1,g.z-g.iz*.1,1.4,.04,.02,g.ry,SLIT);
  E.glow(g.x-g.ix*.2,g.gy+2.65,g.z-g.iz*.2,.36,IND,.45,[.5,4.4,0,1]);E.anchors.airlock={x:g.x,y:g.gy+1,z:g.z};}
 // ---- Z4 supply conduits (machine land -> feeding hatches at the dome foot), pods + service drones ----
 const CON=[],a2=Math.atan2(D2.c[1],D2.c[0]);for(const a of[dodge(CBz+.55),dodge(CBz-.6),dodge(CBz+Math.PI-.3)]){const dd=Math.cos(a-a2)>.55?D2:D1,dx_=Math.cos(a),dz_=Math.sin(a),bq=dd.c[0]*dx_+dd.c[1]*dz_,cq=dd.c[0]*dd.c[0]+dd.c[1]*dd.c[1]-11.0*11.0,Lr=-bq+Math.sqrt(Math.max(0,bq*bq-cq));   // conduit runs out to r 11 (two on the camera side)
  const hx=dd.c[0]+dx_*dd.r,hz=dd.c[1]+dz_*dd.r,ox=dd.c[0]+dx_*Lr,oz=dd.c[1]+dz_*Lr;
  const ex=dd.c[0]+Math.cos(a)*(dd.r+.35),ez=dd.c[1]+Math.sin(a)*(dd.r+.35);CON.push([ex,ez,ox,oz]);const hy=H(hx,hz)-.08;
  const ns=NR?10:5;for(let s=0;s<ns;s++){const t0=s/ns,t1=(s+1)/ns,x0=ex+(ox-ex)*t0,z0=ez+(oz-ez)*t0,x1=ex+(ox-ex)*t1,z1=ez+(oz-ez)*t1;
   for(const sd of[-1,1]){const px=-(oz-ez)/Math.hypot(ox-ex,oz-ez)*.16*sd,pz=(ox-ex)/Math.hypot(ox-ex,oz-ez)*.16*sd;Z.beam(E,M.ME,x0+px,H(x0,z0)+.32,z0+pz,x1+px,H(x1,z1)+.32,z1+pz,.15,cv(sd>0?'#5E6670':'#525A64'));}
   if(NR)E.box(M.ST,x0,H(x0,z0)-.1,z0,.12,.42,.44,-Math.atan2(oz-ez,ox-ex),dark);}
  E.box(M.ME,ex,hy,ez,.7,.75,.6,-a,cv('#4A515A'));E.box(M.LT,ex+Math.cos(a)*.31,hy+.45,ez+Math.sin(a)*.31,.46,.12,.02,-a,WARM);E.glow(ex+Math.cos(a)*.4,hy+.6,ez+Math.sin(a)*.4,.4,'#E6A866',.4,null);}   // hatch (warm = the inside)
 E.movers(M.ME,.26,.2,.2,cv('#8A929C'),CON.length*2,(i,t,o)=>{const C=CON[i>>1],q=(t/38+(i&1)*.5+i*.13)%1,x=C[2]+(C[0]-C[2])*q,z=C[3]+(C[1]-C[3])*q;o.position.set(x,H(x,z)+.5,z);o.rotation.y=-Math.atan2(C[1]-C[3],C[0]-C[2]);const s=q>.92?Math.max(0,1-(q-.92)/.06):1;o.scale.set(s,s,s);});   // supply pods (into the hatch)
 {const cr=E.anchors.crown,ST=[];for(let q=0;q<4;q++){const a=GA+.8+q*1.55,p=[GC[0]+Math.cos(a)*7.8,GC[1]+Math.sin(a)*7.8];ST.push(p);}
  E.movers(M.ME,.34,.1,.34,cv('#AAB2BA'),4,(i,t,o)=>{const S=ST[i],q=(t/30+i*.27)%1,e=q<.5?q*2:2-q*2,s=e*e*(3-2*e),x=S[0]+(cr.x-S[0])*s,z=S[1]+(cr.z-S[1])*s,y=H(S[0],S[1])+3.6+(cr.y+.4-H(S[0],S[1])-3.6)*s+Math.sin(s*Math.PI)*1.2;
   o.position.set(x,y,z);o.rotation.y=Math.atan2(cr.x-S[0],cr.z-S[1]);const sc=e>.94?Math.max(0,1-(e-.94)/.05):1;o.scale.set(sc,sc,sc);});}   // service drones: machine land -> crown port and back
 // ---- Z5 the AI's world outside: dark orthogonal machine landscape (lower detail), thickest away from the road ----
 const ph=[0,1,2].map(i=>hash((site.seed||7)*.31+i,4.1)*TAU),rOut=a=>R*1.27*(1+.05*Math.sin(2*a+ph[0])+.04*Math.sin(3*a+ph[1])+.03*Math.sin(7*a+ph[2]));
 const galD=(x,z)=>{const l=LOC(x-GC[0],z-GC[1]);return Math.hypot(l[0]/GU,l[1]/GV);},conD=(x,z)=>Math.min(...CON.map(C=>E.segD(x,z,C[0],C[1],C[2],C[3])));
 const PI_=1.95,mc=[],nn=Math.ceil(R*1.4/PI_);
 for(let i=-nn;i<=nn;i++)for(let j=-nn;j<=nn;j++){const p=W(i*PI_,j*PI_),x=p[0],z=p[1],rr=Math.hypot(x,z),f=rr/rOut(Math.atan2(z,x));
  if(f>.95||galD(x,z)<1.3||conD(x,z)<.8||!free(x,z,1.1))continue;if(i*PI_>0&&Math.abs(j*PI_)<1.2)continue;   // road corridor
  if(hash(i*.71+.3,j*1.37)>1-.7*smooth(.72,.95,f))continue;mc.push({x,z,i,j,f,h:hash(i*1.9,j*.41)});}
 for(const c of mc){const y=E.lowY(c.x,c.z,1.9,1.9)-.14,fr_=Math.max(0,Math.cos(Math.atan2(c.z,c.x)-CBz)),far=(((c.x-GC[0])*-u[0]+(c.z-GC[1])*-u[1])>0?1:.7)*(1-.72*fr_);   // low toward the camera, tall behind
  if(c.h<.16){for(let q=0;q<(NR?8:3);q++){const t=(q+.5)/(NR?8:3)-.5,p=E.L2W(c.x,c.z,ry,t*1.7,0);E.box(M.ME,p[0],y,p[1],NR?.05:.12,1.7,1.2,ry,cv('#454C56'));}   // radiator comb
   E.box(M.ME,c.x,y+1.66,c.z,1.85,.1,.1,ry,cv('#59616C'));continue;}
  const ht=(.8+2.8*smooth(.5,.95,c.f)*far)*(.7+.6*c.h)*(1-.5*fr_),tall=c.h>.86&&c.f>.6&&fr_<.3,w=tall?1.0:1.5,d=tall?1.0:1.3,bc=jc(cv(['#262A31','#2B2F36','#30343B'][(c.h*3)|0]),c.x,c.z,.04);
  const hh=tall?ht+2.4:ht;E.box(M.B,c.x,y,c.z,w,hh,d,ry,bc);E.box(M.LT,c.x,y+hh-.08,c.z,w+.03,.035,d+.03,ry,SLIT);
  if(hh>2.2)E.box(M.B,c.x,y+hh*.62,c.z,w+.08,.06,d+.08,ry,cv('#3A3F48'),1);
  if(NR){for(const sd of[-1,1]){const p=E.L2W(c.x,c.z,ry,0,sd*(d/2+.02));for(let f=0;f<4;f++){const q=E.L2W(p[0],p[1],ry,(f-1.5)*w*.24,0);E.box(M.ME,q[0],y+.1,q[1],.06,hh-.25,.08,ry,cv('#4A525E'));}}}   // vertical fins
  E.box(M.ME,c.x,y+hh,c.z,.4,.18,.4,ry,cv('#454B55'),tall?0:1);if(c.h>.7)E.glow(E.L2W(c.x,c.z,ry,w/2+.03,0)[0],y+.5,E.L2W(c.x,c.z,ry,w/2+.03,0)[1],.36,IND,.4,[.45,3+c.h*2,c.i,1]);}
 // ---- ground: lawns, paths, plots and the pond inside; dark gravel between dome and gallery; slate paving + lanes outside ----
 const LAWN=cv('#56703F'),PATH=cv('#9A9078'),PLOT=cv('#5E4E38'),POND=cv('#587A92'),GRV=cv('#3C3E40'),PAV=cv('#42433E'),LANE=cv('#323438'),fr=(x,p)=>Math.abs(((x/p)%1+1)%1-.5)*p;
 E.ground(NR?80:52,R*1.42,(x,z,c)=>{const rr=Math.hypot(x,z),ro=rOut(Math.atan2(z,x)),n1=vn(x*.6+2,z*.6-4),au=x*u[0]+z*u[1],av=x*v[0]+z*v[1];let col;
  const d1=Math.hypot(x-cx,z-cz),d2=Math.hypot(x-D2.c[0],z-D2.c[1]);
  if(d1<D1.r-.05||d2<D2.r-.05){col=mx(LAWN,cv('#4E6838'),.5*vn(x*1.7,z*1.7));
   if(Math.abs(d1-1.85*S1)<.15||Math.abs(d1-3.55*S1)<.12)col=PATH;   // path rings
   for(const h of homes){const ax=Math.cos(h.a),az=Math.sin(h.a),t=(x-cx)*ax+(z-cz)*az,s=Math.abs(-(x-cx)*az+(z-cz)*ax);if(s<.09&&t>1.85*S1&&t<2.5*S1)col=PATH;   // garden path to each door
    if(t>3.2*S1&&t<4.2*S1&&s<.4&&d1<D1.r-.3)col=fr(t,.22)<.05?mx(PLOT,LAWN,.4):PLOT;}   // back-garden plots
   if(Math.hypot(x-PD[0],z-PD[1])<.5*(1+.15*Math.sin(Math.atan2(z-PD[1],x-PD[0])*3)))col=POND;   // r .5
   if(d2<D2.r-.05&&d1>D1.r){const l=LOC(x-D2.c[0],z-D2.c[1]);if(l[1]<-.2&&Math.abs(l[0])<1.5)col=fr(l[0],.25)<.07?mx(PLOT,LAWN,.5):PLOT;}}   // vegetable rows
  else if(galD(x,z)<1.12){col=GRV;}
  else{col=rr/ro>.8?mx(PAV,cv('#3E413E'),.5):PAV;if(fr(au-PI_/2,PI_)<.2||fr(av-PI_/2,PI_)<.2)col=mx(col,LANE,.85);}
  if(au>0&&Math.abs(av-LOC(gate?gate.x:0,gate?gate.z:0)[1])<.42&&galD(x,z)>1.02)col=mx(col,cv('#56524C'),.8);   // road apron to the airlock
  const f=.92+.16*n1;c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;c[3]=1-smooth(.82,1.03,rr/ro*(1+.1*(n1-.5)));});
 E.anchors.square={x:cx,y:yA,z:cz};E.info.homes=homes.length;E.info.machine=mc.length;});
 res.ending='zookeeper';res.far=res.far||[];res.casters=[];res.movers=[];res.lights=[];res.keepOut=[];res.uniforms={uT:res.TU.uT,uOut:{value:0},uLit:{value:1}};
 return res;}

// ======================= (20) register =======================
const PT={version:1,presets:PRESETS,build:build,buildSteps:buildSteps,info:{version:1,presets:Object.keys(PRESETS),last:null,matsUsed:null}};
root.FA.PROTOWN=PT;
})();
