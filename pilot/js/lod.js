// Futures Atlas v4.5 - lod.js : B0 engine foundation (integration plan 2026-11-16 11:07, sec. 4).
// * Site registry (FA.SITES): the 2 detail cities (Gatekeeper, Reversion) + with ?stress=1 eleven stand-ins for the endings
//   that are not built yet, placed at their v4.4 world positions (v4.4 O[].X/Z read from the live v4.4 build, x1.6 to the
//   pilot table, then nudged off the real cities / the river / each other). Stand-ins reuse the Gatekeeper (procity) and
//   Reversion (procottage) generators with an offset seed. They are PLACEHOLDERS for budget measurement, not designs.
// * Three tiers per site: FAR = simplified massing merged ACROSS cities into 4 material-family meshes (mass with shader
//   windows, metal, ground, emit) -> 4 draws for all sites; per-site visibility via a uniform array (no rebuild).
//   MID = full generator, no shadows. NEAR = full generator + castShadow (shadows come ONLY from the NEAR tier).
//   Switching by camera distance with hysteresis; close-up view = the current city NEAR, every other site FAR (real
//   detail cities never drop below MID unless ?lod=all).
// * Lazy build: FAR proxies at start; the full generator runs when the camera gets close (deferred via setTimeout so
//   the interaction frame is not blocked), result cached (LRU, FA.LOD.CACHE stand-ins), evicted builds disposed.
// * World-map idle rule (owner decision 3 option B, 2026-11-16): a mover counts only when its projected DIAMETER is
//   >= FA.IDLE_PX (12 CSS px) in world view (close-up keeps the 1.5 px radius rule); the ending under hover or in its
//   showcase (FA.LOD.showcase(id,ms), hook for the B2 floating titles) renders at 30 fps; else 10; hidden / reduced 0.
// No impostors for cities (owner): FAR is simplified geometry; impostors stay for trees (proflora).
(function(){
'use strict';
const FA=window.FA,Q=FA.QS,C=h=>new THREE.Color(h);
const STRESS=Q.get('stress')==='1'||Q.get('stress')==='13';
const LODALL=Q.get('lod')==='all';
const L=FA.LOD={on:Q.get('lod')!=='0',stress:STRESS,all:LODALL,CACHE:+(Q.get('lodcache')||3),
 // camera-distance thresholds (world units, camera position -> site centre); enter / leave (hysteresis band ~15 %)
 NEAR_IN:95,NEAR_OUT:112,MID_IN:165,MID_OUT:192,MAXMID:2,
 tiers:{},builds:{},log:[],hover:null,show:{},farInfo:null};
FA.IDLE_PX=+(Q.get('idlepx')||12);

// ---- v4.4 world positions (live build futures_atlas_sample_v44_20261115_1524.html, O[].X/Z after its layout solve) ----
const V44={normaltech:[-41.86,-21.49],libertarian:[-13.05,-43.6],egalitarian:[-32.39,-39.34],enslaved:[-35.18,19.32],o1984:[-55.98,43.1],
 gatekeeper:[-10.16,39.9],protector:[19.75,30.96],benevolent:[42.7,41.45],zookeeper:[50.34,16.27],descendants:[40.15,-31],conquerors:[55.44,-9.24],
 reversion:[-75,0],selfdestruct:[6,51]};
const K44=1.6; // v4.4 map (|X|<75,|Z|<51) -> pilot table (280 x 210)
// stand-in generator per ending: 'city' = procity (Gatekeeper generator), 'cot' = procottage (Reversion generator).
// win = lit-window share in the FAR shader (Q17a: uniform for human towns; Conquerors machine indicators only (<0); Self-destruction none)
const STAND={normaltech:{g:'city',n:'Normal technology',win:.45},libertarian:{g:'city',n:'Libertarian Utopia',win:.45},
 egalitarian:{g:'cot',n:'Egalitarian Utopia',win:.45},enslaved:{g:'city',n:'Enslaved God',win:.45,big:1},o1984:{g:'city',n:'1984',win:.45},
 protector:{g:'cot',n:'Protector God',win:.45},benevolent:{g:'city',n:'Benevolent Dictator',win:.45},zookeeper:{g:'cot',n:'Zookeeper',win:.45},
 descendants:{g:'city',n:'Descendants',win:.45},conquerors:{g:'city',n:'Conquerors',win:-.18,dark:1},selfdestruct:{g:'cot',n:'Self-destruction',win:0,ash:1}};
const KS={city:.55,cot:.8},RFULL={city:23,cot:15};
const SITES=FA.SITES=[];
SITES.push({id:'gatekeeper',name:'Gatekeeper',real:1,g:'city',x:FA.GK.x,z:FA.GK.z,r:21.5,h0:2.6,win:.45,i:0});
SITES.push({id:'reversion',name:'Reversion',real:1,g:'cot',x:FA.RV.x-1.5,z:FA.RV.z,r:16,h0:1.0,win:.27,i:1});
// B1: the 11 stand-in positions are solved ALWAYS (FA.SITE_TABLE lists all 13 endings); they are only instantiated (terrain basin,
// FAR proxy, lazy build) with ?stress=1 so the default world view stays the 2-city pilot.
const CAND=[];{let i=2;for(const id in STAND){const s=STAND[id],k=KS[s.g]*(s.big?1.25:1);
  CAND.push({id,name:s.n,real:0,g:s.g,win:s.win,dark:!!s.dark,ash:!!s.ash,x:V44[id][0]*K44,z:V44[id][1]*K44,x44:V44[id][0],z44:V44[id][1],k,r:RFULL[s.g]*k,h0:s.g==='city'?2.6:1.6,seed:i*7919+13,i:i++});}
 // nudge: off the real cities, the river corridor, each other, inside the table rim
 const TW=FA.TW,TD=FA.TD,st=CAND,real=SITES.filter(s=>s.real);
 for(let it=0;it<160;it++){for(const s of st){
  for(const o of real.concat(st)){if(o===s)continue;const dx=s.x-o.x,dz=s.z-o.z,d=Math.hypot(dx,dz)||.01,m=s.r+o.r+(o.real?9:7);if(d<m){const p=(m-d)*(o.real?1:.5);s.x+=dx/d*p;s.z+=dz/d*p;}}
  if(s.z>-80){const rx=FA.riverX(s.z),dx=s.x-rx,m=s.r+8;if(Math.abs(dx)<m)s.x=rx+Math.sign(dx||1)*m;}
  s.x=Math.max(-TW/2+s.r+10,Math.min(TW/2-s.r-10,s.x));s.z=Math.max(-TD/2+s.r+10,Math.min(TD/2-s.r-12,s.z));}}
 for(const s of st)s.nudge=+Math.hypot(s.x-s.x44*K44,s.z-s.z44*K44).toFixed(1);}
if(STRESS)for(const s of CAND)SITES.push(s);
// ---- B1 site table + generator host (parallel_contract_B1_B2.md) ----
// endings whose main body is a contemporary human town -> FA.PROTOWN (integration plan sec. 3 / B3 row); others keep the stand-ins
const PROTOWN_FOR={normaltech:1,o1984:1,protector:1,egalitarian:1};
// B1 round 2 (contract v2, frozen): zookeeper + descendants = COMPOSITE sites (protown preset part + the plan's other part, see compositeSteps)
const COMPOSITE_FOR={zookeeper:1,descendants:1};
FA.SITE_TABLE=SITES.filter(s=>s.real).concat(CAND).map(s=>({id:s.id,ending:s.name,x:+s.x.toFixed(2),z:+s.z.toFixed(2),
 y:s.id==='gatekeeper'?2.6:s.h0,radius:+s.r.toFixed(2),seed:s.seed||(s.id==='gatekeeper'?1505:2031),
 rot:s.real?0:+((((s.seed||0)*2654435761>>>0)%6283)/1000).toFixed(3),   // layout hint for the generator; the engine does NOT rotate the group
 gen:PROTOWN_FOR[s.id]?'protown':COMPOSITE_FOR[s.id]?'composite':s.g==='city'?'procity':'procottage',standin:s.g==='city'?'procity':'procottage',live:SITES.includes(s)}));
for(const s of SITES){const t=FA.SITE_TABLE.find(e=>e.id===s.id);s.gen=t.gen;s.standin=t.standin;s.y=t.y;s.rot=t.rot;}
// generator registry: name -> {version, build(site,ctx), buildSteps?(site,ctx)}; 'protown' resolves to window.FA.PROTOWN at CALL time
// (load order free, zero engine edits once js/protown.js is in index.html). Missing generator -> the site's stand-in.
const GEN=FA.GEN={reg:{},register(n,g){this.reg[n]=g;return g;},get(n){if(n==='protown')return (window.FA&&window.FA.PROTOWN)||null;
  if(n==='composite')return (window.FA&&window.FA.PROTOWN)?this.reg.composite:null;return this.reg[n]||null;},   // composite needs protown for its town part
 resolve(s){const g=this.get(s.gen);return g?{name:s.gen,g}:{name:s.standin,g:this.reg[s.standin]};}};
// shared material families (FA.MATS) for generators: vertex-coloured, sRGB hexes (LOOK.cm colour management), env from the scene IBL
FA.MATS=(()=>{const E=(FA.LOOK.env||.5)*.6,S=o=>new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.84,metalness:0,envMapIntensity:E},o));
 return {building:S({}),stone:S({roughness:.9}),wood:S({roughness:.8}),roof:S({roughness:.7}),metal:S({roughness:.42,metalness:.6}),ground:S({roughness:.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
  glass:new THREE.MeshStandardMaterial({color:'#2A3442',roughness:.08,metalness:.1,envMapIntensity:E*2}),foliage:S({roughness:.9}),light:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:true})};})();
// B1 r2: `ending` handed to a generator = the PRESET id (protown looks up PRESETS[site.ending]; the table's display name
// 'Normal technology' fell back to normaltech for every site) - display name moves to `name` (conflict log 16:xx).
L.siteArg=s=>{const t=FA.SITE_TABLE.find(e=>e.id===s.id);return Object.assign({},t,{ending:t.id,name:t.ending,style:FA.STYLE,q:FA.Q||'mid',mood:FA.QS.get('mood')==='day'?'day':'blue'});};
L.ctx=()=>({THREE,LOOK:FA.LOOK,mats:FA.MATS,heightAt:(x,z)=>FA.Hm?FA.Hm(x,z):FA.H(x,z),rng:FA.rng});
L.site=id=>SITES.find(s=>s.id===id);
// terrain basins for the stand-ins (world.js FA.H reads FA.SITEB): flat floor h0 over the UNSCALED generator footprint
FA.SITEB=SITES.filter(s=>!s.real).map(s=>({x:s.x,z:s.z,h0:s.h0,rb:Math.max(s.r+4,RFULL[s.g]+2)}));
FA.SITEB_ALL=SITES.map(s=>({x:s.x,z:s.z,rb:s.real?(s.id==='gatekeeper'?27:24):Math.max(s.r+4,RFULL[s.g]+2)}));
// B1 r2 keepOut: boot-time scatter / flora / far trees run BEFORE any lazy build, so every live generator site PRE-RESERVES the
// contract footprint (radius*1.15 = the conformance bound) + pad. After a build, the generator's own keepOut circles are checked
// against that disk (L.koCheck) and published in world coords (FA.KEEPOUT) for later placement passes.
L.KO_K=1.15;FA.KEEPOUT=[];
L.inSite=(x,z,pad)=>{for(const s of SITES){if(s.real)continue;if(Math.hypot(x-s.x,z-s.z)<s.r*L.KO_K+(pad==null?4:pad))return true;}return false;};
L.reserved=(x,z,pad)=>L.inSite(x,z,pad==null?2:pad);
L.koCheck={};

// ---- capture: objects a builder adds to the scene (real detail cities) ----
function snap(){return{sc:new Set(FA.SC.children),st:FA.STATIC.length,an:FA.anims.length,mv:FA.MOVERS.length,gl:FA.GLOWS.length,sm:FA.SMOKES.length,ao:FA.AOS.length,
 pl:Object.fromEntries(Object.entries(FA.PL).map(([k,a])=>[k,a.length])),ln:FA.lanes?FA.lanes.length:0,co:FA.closeOnly?FA.closeOnly.length:0};}
const site=id=>SITES.find(s=>s.id===id);
L.capture=function(id,fn){const s=site(id),a=snap();const t0=performance.now();fn();s.buildMs=Math.round(performance.now()-t0);
 for(let i=a.st;i<FA.STATIC.length;i++)FA.STATIC[i].userData.site=id;   // world.js mergeStatic keys on userData.site
 s.direct=FA.SC.children.filter(o=>!a.sc.has(o));};
L.collect=function(){for(const s of SITES){if(!s.real)continue;const objs=(s.direct||[]).slice();
  for(const o of FA.SC.children)if(o.userData.site===s.id&&!objs.includes(o))objs.push(o);
  s.objs=objs;s.meshes=[];for(const o of objs)o.traverse(m=>{if(m.isMesh||m.isInstancedMesh){m.userData.cs0=m.castShadow;s.meshes.push(m);}});s.built=1;
  if(MIDREAL)JOBS.push({s,it:realMidSteps(s),steps:[],work:0,t0:performance.now(),realMid:1});}
 if(JOBS.length)schedule();try{L.warm();}catch(e){L.warmInfo={err:e.message};}};
// B1 r2: protown program WARM-UP at boot. GPU r2: the first protown lazy build had a 433 ms frame = 8 new shader programs compiled on
// first draw (window facade onBeforeCompile etc.), while every build step stayed <= 6.4 ms. Build each preset once at radius 4 and keep the
// groups in the scene (frustumCulled off) for the FIRST rendered frame only, so the boot frame compiles them through the real pipeline
// (composer render target, shadow pass, light state -> identical program keys; renderer.compile() gave mismatched keys = 61 dead programs).
// Removed in the next rAF after their first draw; materials are NOT disposed so the programs stay cached for the real builds. ?ptwarm=0 = off.
L.WARM=Q.get('ptwarm')!=='0';
L.warm=function(){if(!L.WARM||!FA.PROTOWN)return null;const t0=performance.now(),g=new THREE.Group(),ctx=L.ctx();
 const s0=SITES.find(s=>!s.real)||{x:0,z:0,y:0};g.name='protown_warm';
 for(const id of ['normaltech','o1984','protector','egalitarian','zookeeper','descendants']){try{const it=FA.PROTOWN.buildSteps({id:'warm_'+id,ending:id,name:id,x:s0.x,z:s0.z,y:s0.y||0,radius:4,rot:0,seed:7},ctx);
   let r;while(!(r=it.next()).done);const T=r.value;if(T&&T.near)g.add(T.near);if(T&&T.mid)g.add(T.mid);}catch(e){(L.warmErr=L.warmErr||[]).push(id+': '+e.message);}}
 g.position.set(s0.x,(s0.y||0)-30,s0.z);let first=null;g.traverse(o=>{if(o.isMesh||o.isInstancedMesh){o.frustumCulled=false;if(!first)first=o;}});
 L.warmInfo={buildMs:Math.round(performance.now()-t0),err:L.warmErr||null,state:'pending'};if(!first)return L.warmInfo;
 first.onAfterRender=()=>{first.onAfterRender=()=>{};requestAnimationFrame(()=>{FA.SC.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});
   L.warmInfo.state='done';L.warmInfo.programs=FA.R.info.programs.length;L.warmInfo.atMs=Math.round(performance.now()-t0);});};
 FA.SC.add(g);return L.warmInfo;};
// B1: MID tier for the 2 REAL cities (they clamp to MID in world view, B0 rendered them full-detail there: ~140k of the 295k world tris).
// Every mesh is either replaced by a decimated copy (world matrix baked into the copy's matrix) or dropped; movers' objects stay live.
const MIDREAL=Q.get('midreal')!=='0';
function* realMidSteps(s,amin,lvl){amin=amin||MIDA;const g=new THREE.Group();g.name='mid_'+s.id;const live=new Set();
 for(const m of FA.MOVERS)if(m.o)m.o.traverse(x=>live.add(x));for(const o of (FA.closeOnly||[]))o.traverse(x=>live.add(x));   // view-managed close-up extras stay with their owner
 let tw=performance.now();const swap=[];FA.SC.updateMatrixWorld(true);const ws=new THREE.Vector3();
 for(const m of s.meshes){if(live.has(m))continue;let o=null;
  if(m.isInstancedMesh)o=midInst(m);else{m.getWorldScale(ws);const t=triN(m.geometry),rr=radOf(m)*ws.x;
   if(m.material&&m.material.isShaderMaterial)o=new THREE.Mesh(m.geometry,m.material);     // custom shaders (windows / water): keep as is
   else if(t>MIDT)o=new THREE.Mesh(midGeo(m.geometry,amin/(ws.x*ws.x)),m.material);else if(rr>=MIDR*2)o=new THREE.Mesh(m.geometry,m.material);}
  swap.push(m);if(o){o.matrixAutoUpdate=false;o.matrix.copy(m.matrixWorld);o.renderOrder=m.renderOrder;o.receiveShadow=m.receiveShadow;o.frustumCulled=m.frustumCulled;o.castShadow=false;g.add(o);}
  if(performance.now()-tw>L.BUDGET*.75){yield 'realmid';tw=performance.now();}}
 if(s.midG){swapMid(s,g,lvl);return s;}   // B1 r2: distance re-level (tier + swap list unchanged)
 g.visible=false;FA.SC.add(g);s.midG=g;s.midLvl=lvl||0;s.midSwap=swap;s.fx=s.fx||[];s.decals=s.decals||[];s.tris={near:s.meshes.reduce((a,m)=>a+trisM(m),0),mid:trisOf(g)};L.tiers[s.id]=null;return s;}
const trisM=m=>Math.round(triN(m.geometry)*(m.isInstancedMesh?m.count:1));

// ---- FAR proxies: simplified massing, merged across ALL sites per material family ----
const VIS=new Array(16).fill(0);const UV={value:VIS};
const FAM={};const fam=n=>FAM[n]||(FAM[n]={pos:[],nor:[],col:[],s:[],w:[]});
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3(),_c=new THREE.Color();
function add(f,g,x,y,z,ry,sx,sy,sz,hex,si,w){const G=g.index?g.toNonIndexed():g.clone();_m.compose(_p.set(x,y,z),_q.setFromEuler(_e.set(0,ry||0,0)),_s.set(sx||1,sy||1,sz||1));G.applyMatrix4(_m);
 const P=G.attributes.position,N=G.attributes.normal,F=fam(f);_c.set(hex);
 for(let i=0;i<P.count;i++){F.pos.push(P.getX(i),P.getY(i),P.getZ(i));F.nor.push(N.getX(i),N.getY(i),N.getZ(i));F.col.push(_c.r,_c.g,_c.b);F.s.push(si);F.w.push(w||0);}G.dispose();}
const BOX=new THREE.BoxGeometry(1,1,1);BOX.translate(0,.5,0);
const CYL=n=>{const g=new THREE.CylinderGeometry(1,1,1,n);g.translate(0,.5,0);return g;};const CY12=CYL(12),CY40=CYL(40),CY6=CYL(6);
const RING=new THREE.CylinderGeometry(1,1,1,48,1,true);RING.translate(0,.5,0);
const PRISM=(()=>{const g=new THREE.CylinderGeometry(.62,.62,1,3);g.rotateZ(Math.PI/2);g.rotateX(Math.PI/6*0);g.translate(0,.31,0);return g;})();
const SPH=new THREE.SphereGeometry(1,10,6);
function farCity(s,rnd){const r=s.r,y0=s.h0,top=y0+.75,si=s.i,w=s.win,D=s.dark,stone=D?'#3E4048':'#6A6670',conc=D?['#44464E','#3A3C44','#4C4E56']:['#7E7A7E','#8A8682','#6E6B72','#7A7670'];
 add('mass',CY40,s.x,y0-.6,s.z,0,r,1.35,r,stone,si,0);                              // plinth
 add('mass',RING,s.x,top,s.z,0,r-.25,.55,r-.25,D?'#4A4C54':'#827E80',si,0);          // perimeter wall
 add('ground',CY40,s.x,top-.02,s.z,0,r*.3,.05,r*.3,D?'#30323A':'#8E8A84',si,0);      // central plaza
 const g=Math.max(1.05,r/9.5);let n=0;
 for(let gx=-r;gx<=r;gx+=g)for(let gz=-r;gz<=r;gz+=g){const d=Math.hypot(gx,gz);if(d<r*.34||d>r*.9)continue;if(Math.abs(gx)<g*.45||Math.abs(gz)<g*.45)continue; // avenues
  if(rnd()<.12)continue;const tw=rnd()<.06,h=tw?(3.2+rnd()*3.4)*r/12:(.55+rnd()*rnd()*2.4)*r/12;const bw=g*(.62+rnd()*.22),bd=g*(.62+rnd()*.22);
  add('mass',BOX,s.x+gx,top,s.z+gz,0,bw,h,bd,conc[(rnd()*conc.length)|0],si,w);n++;}
 const lh=r*.62; // hero landmark (placeholder: one tall tower + crown light; B1 replaces it with the ending's own landmark)
 add('mass',CY12,s.x,top,s.z,0,r*.06,lh,r*.06,D?'#50525A':'#A6A39F',si,w*.5);add('metal',CY12,s.x,top+lh,s.z,0,r*.085,r*.03,r*.085,'#5A5C66',si,0);
 if(!s.ash)add('emit',SPH,s.x,top+lh+r*.05,s.z,0,r*.035,r*.035,r*.035,w<0?'#9FD8E6':'#FFB866',si,0);
 FA.AOS.push({x:s.x,z:s.z,r:Math.min(13.5,r*1.06),k:.6});return n;}
function farCot(s,rnd){const r=s.r,y0=s.h0,si=s.i,A=s.ash;const FC=A?['#2E2C2E','#3A3634','#262628']:['#3E4A34','#4C5238','#544A34','#3A4630'];
 for(let k=0;k<7;k++){const a=rnd()*6.283,d=r*(.55+rnd()*.4);add('ground',BOX,s.x+Math.cos(a)*d,y0+.01,s.z+Math.sin(a)*d,a,r*(.25+rnd()*.15),.04,r*(.16+rnd()*.1),FC[k%4],si,0);}
 const H=(FA.H(s.x,s.z)>y0+.5)?FA.H(s.x,s.z):y0;let n=0;
 for(let k=0;k<17;k++){const a=k/17*6.283+rnd()*.3,d=r*(.12+rnd()*.42),x=s.x+Math.cos(a)*d,z=s.z+Math.sin(a)*d,ry=a+Math.PI/2+(rnd()-.5)*.6,sc=r/15*(.85+rnd()*.35);
  const ruin=A&&rnd()<.6;add('mass',BOX,x,y0,z,ry,1.15*sc,(ruin?.35:.72)*sc,.8*sc,A?'#4A4644':'#9C9488',si,A?0:s.win);
  if(!ruin)add('mass',PRISM,x,y0+.72*sc,z,ry,1.3*sc,.55*sc,1.0*sc,A?'#2A2826':'#5A4A36',si,0);n++;}
 if(!A){const wx=s.x-r*.55,wz=s.z-r*.35,sc=r/15;add('mass',CY6,wx,y0,wz,0,.45*sc,2.6*sc,.45*sc,'#8E8678',si,0);   // windmill (static at FAR)
  for(let k=0;k<4;k++)add('metal',BOX,wx+.5*sc,y0+2.5*sc,wz,0,.06*sc,1.5*sc,.16*sc,'#6B5A44',si,0);}
 FA.AOS.push({x:s.x,z:s.z,r:Math.min(13.5,r*.8),k:.45});return n;}
function farMat(name,o){const m=new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.86,metalness:0,envMapIntensity:(FA.LOOK.env||.5)*.6},o));
 const WC=C(FA.LOOK.human).multiplyScalar(1.25),AC=C(FA.LOOK.ai).multiplyScalar(.7);
 m.onBeforeCompile=sh=>{sh.uniforms.uVis=UV;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aS;attribute float aW;uniform float uVis[16];varying vec3 vWPf;varying vec3 vWNf;varying float vW;varying float vS;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvWPf=(modelMatrix*vec4(transformed,1.)).xyz;'+(name==='emit'?'vWNf=vec3(0.,1.,0.);':'vWNf=normalize(mat3(modelMatrix)*objectNormal);')+'vW=aW;vS=aS;')
   .replace('#include <project_vertex>','#include <project_vertex>\nif(uVis[int(aS+.5)]<.5)gl_Position=vec4(2.,2.,2.,1.);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWPf;varying vec3 vWNf;varying float vW;varying float vS;')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float wf=abs(vW);vec3 n=normalize(vWNf);if(wf>0.&&abs(n.y)<.35){float u=abs(n.x)>abs(n.z)?vWPf.z:vWPf.x;'+
    'vec2 g=vec2(u/.42,(vWPf.y-.1)/.52);vec2 c=floor(g),f=fract(g);float mk=step(.24,f.x)*step(f.x,.76)*step(.26,f.y)*step(f.y,.68);'+
    'float h=fract(sin(dot(c,vec2(12.9898,78.233))+vS*7.13)*43758.5453);totalEmissiveRadiance+=(vW>0.?vec3('+WC.toArray().map(v=>v.toFixed(3))+'):vec3('+AC.toArray().map(v=>v.toFixed(3))+')*.6)*mk*step(h,wf);}}');};
 m.customProgramCacheKey=()=>'faFar_'+name;return m;}
// B1: generator-supplied FAR ({geom, family} in LOCAL coords, non-indexed or indexed, position/normal/color) -> engine families + aS/aW
const FARFAM={light:'emit',metal:'metal',ground:'ground'};
function farGen(s){let n=0;for(const e of s.farGeoms){const g0=e.geom||e.geometry;if(!g0)continue;const G=g0.index?g0.toNonIndexed():g0,P=G.attributes.position,N=G.attributes.normal,C=G.attributes.color,F=fam(FARFAM[e.family]||'mass');
  for(let i=0;i<P.count;i++){F.pos.push(P.getX(i)+s.x,P.getY(i)+s.y,P.getZ(i)+s.z);if(N)F.nor.push(N.getX(i),N.getY(i),N.getZ(i));else F.nor.push(0,1,0);
   if(C)F.col.push(C.getX(i),C.getY(i),C.getZ(i));else F.col.push(.6,.58,.55);F.s.push(s.i);F.w.push(e.family==='light'?1:0);}if(G!==g0)G.dispose();n++;}return n;}
// B1 r2: FAR re-merge as a time-sliced generator (GPU r2: the sync rebuild after a lazy build was 27-64 ms = the 50-66 ms frame).
// Per-site generation yields at L.BUDGET*.75, one family buffer per step, the swap (remove old, add new, VIS reset) is one cheap step.
// Boot still calls L.far() (drains it synchronously); lazy builds use L.farAsync() (rAF-paced, coalesces repeated requests).
function farMats(){if(L.farMatsC)return L.farMatsC;const mats={mass:farMat('mass'),metal:farMat('metal',{metalness:.55,roughness:.45}),ground:farMat('ground',{roughness:.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
  emit:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:true})};
 {const e=farMat('emit');mats.emit.onBeforeCompile=e.onBeforeCompile;e.dispose();}mats.emit.customProgramCacheKey=()=>'faFar_emit';return L.farMatsC=mats;}
function* farSteps(){const t0=performance.now();let pieces=0,tw=performance.now(),work=0;for(const k in FAM)delete FAM[k];
 for(const s of SITES){const rnd=FA.rng(9001+s.i*131);pieces+=s.farGeoms?farGen(s):s.g==='city'?farCity(s,rnd):farCot(s,rnd);
  if(performance.now()-tw>L.BUDGET*.75){work+=performance.now()-tw;yield 'far:sites';tw=performance.now();}}
 const mats=farMats(),out=[];let tris=0;const fams=Object.keys(FAM).map(k=>[k,FAM[k]]);for(const k in FAM)delete FAM[k];
 for(const [k,F] of fams){if(!F.pos.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(F.pos,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(F.nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(F.col,3));g.setAttribute('aS',new THREE.Float32BufferAttribute(F.s,1));
  g.setAttribute('aW',new THREE.Float32BufferAttribute(F.w,1));g.computeBoundingSphere();const me=new THREE.Mesh(g,mats[k]);me.name='far_'+k;me.castShadow=false;me.receiveShadow=true;out.push(me);tris+=F.pos.length/9;
  work+=performance.now()-tw;yield 'far:'+k;tw=performance.now();}
 if(L.farMeshes)for(const me of L.farMeshes){FA.SC.remove(me);me.geometry.dispose();}   // swap
 for(const me of out)FA.SC.add(me);L.farMeshes=out;for(const s of SITES)VIS[s.i]=0;work+=performance.now()-tw;
 L.farInfo={draws:out.length,tris:Math.round(tris),pieces,ms:Math.round(performance.now()-t0),workMs:Math.round(work),sites:SITES.length};return L.farInfo;}
L.far=function(){const it=farSteps();let r;while(!(r=it.next()).done);return L.farInfo;};
L.farAsync=function(){if(L.farIt){L.farAgain=true;return;}L.farIt=farSteps();let mx=0;const nxt=f=>document.hidden?setTimeout(f,16):requestAnimationFrame(()=>setTimeout(f,0));
 const tick=()=>{const t=performance.now();let r=null;do{r=L.farIt.next();}while(!r.done&&performance.now()-t<L.BUDGET*.5);mx=Math.max(mx,performance.now()-t);
  if(!r.done){nxt(tick);return;}L.farIt=null;L.farMs=+mx.toFixed(1);L.farInfo.maxSliceMs=L.farMs;L.update(true);FA.kick&&FA.kick(300);if(L.farAgain){L.farAgain=false;L.farAsync();}};
 nxt(tick);FA.kick&&FA.kick(400);};

// ---- stand-in markers: DOM plates (0 draws) + ONE LineSegments for all their drop lines ----
L.markers=function(){const st=SITES.filter(s=>!s.real);if(!st.length)return;const P=[];
 for(const s of st){const gy=s.h0+(s.g==='city'?.75:0);P.push(s.x,24,s.z,s.x,gy+.2,s.z);
  const el=document.createElement('div');el.className='mk';el.innerHTML='<i></i><span class="pl"><b>'+s.name+'</b><em>'+(s.gen==='protown'?'protown generator':s.gen==='composite'?'protown + placeholder part':'stand-in · '+(s.g==='city'?'Gatekeeper':'Reversion')+' generator')+'</em></span>';
  document.getElementById('labels').appendChild(el);FA.markers.push({id:s.id,el,line:{visible:true},dot:{visible:true},p:new THREE.Vector3(s.x,24,s.z),anchor:new THREE.Vector3(s.x,gy,s.z),standin:1});}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 const ln=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#E6E0D2',transparent:true,opacity:.45,fog:false,toneMapped:false}));ln.name='standin_lines';FA.SC.add(ln);L.lines=ln;};

// ---- lazy full build of a stand-in (generator reused with an offset seed, scaled by s.k around its centre) ----
// ---- B1 host: stand-in adapters (legacy procity / procottage behind the contract interface) ----
// procity.js / procottage.js are owned by neither B1 nor B2 and still read FA.GK / FA.RV; the adapter is the ONE place that swaps those
// globals (scoped to the generator call, restored in finally). Output = contract result: near (LOCAL coords around the site centre,
// scale k baked into the group), mid (engine-derived: big parts only), casters, fx (per-site glow/smoke batch), kit (per-site instancing).
const MIDR=+(Q.get('midr')||.45);   // MID keeps statics / direct meshes whose bounding radius (generator units) >= MIDR
function* mergeList(list,out){const groups={};for(const m of list){m.updateMatrix();const k=m.material.uuid+'|'+m.castShadow+'|'+m.receiveShadow;(groups[k]=groups[k]||[]).push(m);}
 let tw=performance.now();const tick=()=>performance.now()-tw>L.BUDGET*.7;   // B1: yields inside the merge (between source meshes) -> steps stay ~<= budget
 for(const k in groups){const Lm=groups[k],mat=Lm[0].material;
  if(Lm.length===1){const o=Lm[0].clone();o.matrixAutoUpdate=true;out.push(o);continue;}
  const useUV=!!mat.map,useC=!!mat.vertexColors;const pos=[],nor=[],uv=[],col=[];
  for(const m of Lm){const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone());g.applyMatrix4(m.matrix);const p=g.attributes.position,q=g.attributes.normal;
   for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));nor.push(q.getX(i),q.getY(i),q.getZ(i));
    if(useUV){const a=g.attributes.uv;uv.push(a?a.getX(i):0,a?a.getY(i):0);}if(useC){const a=g.attributes.color;col.push(a?a.getX(i):1,a?a.getY(i):1,a?a.getZ(i):1);}}g.dispose();
   if(tick()){yield 'merge';tw=performance.now();}}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  if(useUV)G.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(useC)G.setAttribute('color',new THREE.Float32BufferAttribute(col,3));G.computeBoundingSphere();
  const me=new THREE.Mesh(G,mat);me.castShadow=Lm[0].castShadow;me.receiveShadow=Lm[0].receiveShadow;me.renderOrder=Lm[0].renderOrder;out.push(me);}
 return out;}
const radOf=o=>{if(!o.geometry)return 1e9;if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();const s=o.scale?Math.max(o.scale.x,o.scale.y,o.scale.z):1;return o.geometry.boundingSphere.radius*s;};
function trisOf(root){let t=0;root.traverse(m=>{if(!(m.isMesh||m.isInstancedMesh)||!m.geometry)return;const g=m.geometry,n=(g.index?g.index.count:g.attributes.position.count)/3;t+=n*(m.isInstancedMesh?m.count:1);});return Math.round(t);}
function* standinSteps(site,ctx){const s=L.site(site.id),T=()=>performance.now();let t0=T();const a=snap();
 const sv={GK:FA.GK,RV:FA.RV,rng:FA.rng,eye:FA.eyePos,pc:FA.PROCITY&&FA.PROCITY.info,pk:FA.PROCOTTAGE&&FA.PROCOTTAGE.info,fl:FA.PROFLORA&&FA.PROFLORA.add,rvs:FA.RVSITE};
 const R0=sv.rng,off=s.seed;const city=s.g==='city';
 try{FA.rng=seed=>R0(((seed|0)+off)>>>0);if(FA.PROFLORA)FA.PROFLORA.add=()=>false;
  if(city){if(!FA.PROCITY)throw new Error('no procity');FA.GK={x:s.x,z:s.z,top:s.h0+1.3};FA.PROCITY.build();}
  else{if(!FA.PROCOTTAGE)throw new Error('no procottage');FA.RV={x:s.x+1.5,z:s.z};if(!FA.PROCOTTAGE.build({}))throw new Error('procottage returned null');}
  s.genInfo=JSON.parse(JSON.stringify((city?FA.PROCITY:FA.PROCOTTAGE).info||{}));}
 finally{FA.GK=sv.GK;FA.RV=sv.RV;FA.rng=R0;FA.eyePos=sv.eye;if(FA.PROCITY)FA.PROCITY.info=sv.pc;if(FA.PROCOTTAGE)FA.PROCOTTAGE.info=sv.pk;if(FA.PROFLORA)FA.PROFLORA.add=sv.fl;FA.RVSITE=sv.rvs;}
 // pull the generator's side effects out of the global lists IMMEDIATELY (before yielding, so nothing else sees them)
 const k=s.k,cx=s.x,cy=s.h0,cz=s.z,G=city?30:26,far=(x,z)=>Math.hypot(x-cx,z-cz)>G,tx=(x,y,z)=>[cx+(x-cx)*k,cy+(y-cy)*k,cz+(z-cz)*k];
 const glows=FA.GLOWS.splice(a.gl).filter(h=>!far(h.x,h.z)),smokes=FA.SMOKES.splice(a.sm).filter(h=>!far(h.x,h.z));
 const kit={};for(const kk in FA.PL){const n0=a.pl[kk]||0;if(FA.PL[kk].length>n0)kit[kk]=FA.PL[kk].splice(n0);}
 if(FA.lanes)FA.lanes.length=a.ln;   // lanes only paint the terrain colour (already built) -> dropped
 const aos=FA.AOS.splice(a.ao).filter(d=>!far(d.x,d.z));const stat=FA.STATIC.splice(a.st);
 const newObjs=FA.SC.children.filter(o=>!a.sc.has(o));for(const o of newObjs)FA.SC.remove(o);
 const newAn=FA.anims.splice(a.an),newMv=FA.MOVERS.splice(a.mv);
 const res={near:new THREE.Group(),mid:new THREE.Group(),far:null,casters:[],movers:[],lights:[],fxObjs:[],decals:[],anims:newAn,legacyMovers:newMv,stats:{}};
 res.near.scale.setScalar(k);res.mid.scale.setScalar(k);res.legacyTx=tx;res.k=k;
 const local=o=>{o.position.x-=cx;o.position.y-=cy;o.position.z-=cz;return o;};const bs=new THREE.Sphere(),wp=new THREE.Vector3();let dropped=0;
 for(const o of newObjs){if(o.isLight){dropped++;continue;}let c=null;o.updateMatrixWorld(true);
  if(o.geometry){if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();bs.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);c=bs.center;}else{o.getWorldPosition(wp);c=wp;}
  if(c&&far(c.x,c.z)&&(Math.hypot(c.x-cx,c.z-cz)-(o.geometry?bs.radius:0))>G*.6&&!(o.isInstancedMesh&&o.frustumCulled===false)){dropped++;if(o.geometry)o.geometry.dispose();continue;}
  local(o);res.near.add(o);
  if(radOf(o)>=MIDR*2.2||o.isInstancedMesh||o.children.length){res.mid.add(o.isInstancedMesh?midInst(o):o.clone());}}   // MID: big direct parts only
 res.stats.dropped=dropped;if(T()-t0>4){yield 'gen';t0=T();}
 // statics: NEAR = all merged per material; MID = only the big ones (radius >= MIDR) merged again
 for(const m of stat){m.position.x-=cx;m.position.y-=cy;m.position.z-=cz;}
 {const o=[];yield* mergeList(stat,o);for(const me of o)res.near.add(me);}yield 'merge-near';
 // (MID for statics is derived by the host from the merged NEAR meshes)
 // per-site kit instancing (FA.put inside the generator): local matrices, the group carries position + scale
 const _t=new THREE.Matrix4().makeTranslation(-cx,-cy,-cz),_m=new THREE.Matrix4();
 for(const kk in kit){const M=FA.MODELS[kk];if(!M)continue;for(const p of M.parts){const im=new THREE.InstancedMesh(p.geo,p.mat,kit[kk].length);
   kit[kk].forEach((mm,i)=>{_m.multiplyMatrices(_t,mm).multiply(p.m);im.setMatrixAt(i,_m);});im.castShadow=im.receiveShadow=true;res.near.add(im);res.mid.add(midInst(im));}}
 // per-site FX batch: glows + smokes mapped through the site scale (world coords; the 2 instanced draws live outside the group)
 if(glows.length||smokes.length){for(const h of glows){const t=tx(h.x,h.y,h.z);h.x=t[0];h.y=t[1];h.z=t[2];h.size*=k;}for(const h of smokes){const t=tx(h.x,h.y,h.z);h.x=t[0];h.y=t[1];h.z=t[2];}
  const nA=FA.anims.length;res.fxObjs=FA.buildFx(glows,smokes);for(const o of res.fxObjs)FA.SC.remove(o);res.fxAnims=FA.anims.splice(nA);res.stats.glows=glows.length;res.stats.smokes=smokes.length;}
 yield 'kit-fx';
 // contact AO decals (scaled, own batch)
 const ao=aos.map(d=>{const t=tx(d.x,d.y==null?cy:d.y,d.z);return Object.assign({},d,{x:t[0],z:t[2],y:d.y==null?undefined:t[1],r:d.r*k,sx:d.sx&&d.sx*k,sz:d.sz&&d.sz*k});});
 const keepAO=FA.AOS;FA.AOS=ao;const b4=new Set(FA.SC.children);try{FA.buildDecals();}finally{FA.AOS=keepAO;}
 res.decals=FA.SC.children.filter(o=>!b4.has(o));for(const o of res.decals)FA.SC.remove(o);
 res.near.traverse(m=>{if((m.isMesh||m.isInstancedMesh)&&m.castShadow)res.casters.push(m);});
 res.mid=null;   // host derives MID from near (area decimation) -> one code path for stand-ins and contract generators
 return res;}
// MID instancing: every 2nd instance (shared geometry / material, new matrix buffer only)
// MID decimation of merged meshes: drop triangles below an area threshold (world u^2; ~2-3 px at the 95-165 u MID band). Cached per source geometry.
const MIDA=+(Q.get('mida')||.05),MIDT=200,MIDC=new WeakMap();
const triN=g=>(g.index?g.index.count:g.attributes.position.count)/3;
function midGeo(g,amin){const key=g,c=MIDC.get(key);if(c&&c.a===amin)return c.g;const src=g.index?g.toNonIndexed():g,P=src.attributes.position,n=P.count/3,keep=[];
 const A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3();
 for(let i=0;i<n;i++){A.fromBufferAttribute(P,i*3);B.fromBufferAttribute(P,i*3+1).sub(A);C.fromBufferAttribute(P,i*3+2).sub(A);if(B.cross(C).length()*.5>=amin)keep.push(i);}
 const G=new THREE.BufferGeometry();for(const nm in src.attributes){const a=src.attributes[nm],sz=a.itemSize,arr=new a.array.constructor(keep.length*3*sz);
  keep.forEach((t,j)=>{for(let v=0;v<3;v++)for(let q=0;q<sz;q++)arr[(j*3+v)*sz+q]=a.array[(t*3+v)*sz+q];});G.setAttribute(nm,new THREE.BufferAttribute(arr,sz,a.normalized));}
 G.computeBoundingSphere();if(src!==g)src.dispose();MIDC.set(key,{a:amin,g:G});MIDOUT.add(G);return G;}
const MIDOUT=new WeakSet();   // B1 r2: geometries made by midGeo (the only ones a MID re-level may dispose)
function midInst(im){const small=radOf(im)*Math.max(im.scale.x,1)<.9;return cloneInst(im,small&&im.count>=24?2:1);}   // halve only small props (lamps, crops, posts)
function cloneInst(im,step){const n=Math.ceil(im.count/step),o=new THREE.InstancedMesh(im.geometry,im.material,n),m=new THREE.Matrix4();
 for(let i=0;i<n;i++){im.getMatrixAt(i*step,m);o.setMatrixAt(i,m);}
 if(im.instanceColor){const c=new THREE.Color();for(let i=0;i<n;i++){im.getColorAt(i*step,c);o.setColorAt(i,c);}}   // keep instanceColor: same program + right colours
 o.position.copy(im.position);o.rotation.copy(im.rotation);o.scale.copy(im.scale);o.frustumCulled=im.frustumCulled;o.receiveShadow=true;o.castShadow=false;o.renderOrder=im.renderOrder;return o;}
GEN.register('procity',{version:1,legacy:1,buildSteps:standinSteps});GEN.register('procottage',{version:1,legacy:1,buildSteps:standinSteps});

// ---- B1 r2: distance-driven MID threshold ----
// Kept triangle area scales with the camera distance^2 (constant ~3 px^2 on screen at 1440x900, fov 40): amin(d) = MIDA*(d/MID_REF)^2,
// quantised to power-of-two levels -2..+2 (amin = MIDA*2^lvl) with a .75-level hysteresis; a level change re-derives the MID as an
// ordinary split job (real cities: realMidSteps over the live meshes; engine-derived stand-in MIDs: deriveMid over the NEAR group).
// Generator-supplied MIDs (protown) are left alone. ?middist=0 = fixed MIDA (round 1), ?midref=<u> moves the reference distance.
L.MIDDIST=Q.get('middist')!=='0';L.MID_REF=+(Q.get('midref')||150);L.midLog=[];
function midLvl(d,cur,fresh){if(!L.MIDDIST)return 0;const raw=2*Math.log2(Math.max(1,d)/L.MID_REF);
 if(!fresh&&Math.abs(raw-cur)<=.75)return cur;return Math.max(-2,Math.min(2,Math.round(raw)));}
function* deriveMid(near,amin){const mid=new THREE.Group();const inv=new THREE.Matrix4();near.updateMatrixWorld(true);inv.copy(near.matrixWorld).invert();const ws=new THREE.Vector3();let tw=performance.now();
 const list=[];near.traverse(m=>{if(m.isMesh||m.isInstancedMesh)list.push(m);});
 for(const m of list){let o=null;if(m.isInstancedMesh)o=midInst(m);else{m.getWorldScale(ws);const t=triN(m.geometry),rr=radOf(m)*ws.x;
   if(t>MIDT)o=new THREE.Mesh(midGeo(m.geometry,amin/(ws.x*ws.x)),m.material);else if(rr>=MIDR*2)o=new THREE.Mesh(m.geometry,m.material);}
  if(!o)continue;o.matrixAutoUpdate=false;o.matrix.multiplyMatrices(inv,m.matrixWorld);o.renderOrder=m.renderOrder;o.receiveShadow=m.receiveShadow;o.frustumCulled=m.frustumCulled;mid.add(o);
  if(performance.now()-tw>L.BUDGET*.75){yield 'mid';tw=performance.now();}}
 mid.scale.copy(near.scale);return mid;}
function* reMidSteps(s,lv){if(!s.pivot||!s.midG)return s;const g=yield* deriveMid(s.pivot,MIDA*Math.pow(2,lv));if(!s.pivot||!s.midG)return s;
 g.position.copy(s.pivot.position);g.traverse(m=>{if(m.isMesh||m.isInstancedMesh){m.castShadow=false;m.userData.cs0=false;}});swapMid(s,g,lv);return s;}
function swapMid(s,g,lv){const old=s.midG;g.name=old.name;g.visible=old.visible;FA.SC.add(g);FA.SC.remove(old);const keep=new Set();g.traverse(m=>{if(m.geometry)keep.add(m.geometry);});
 old.traverse(m=>{if(m.isInstancedMesh&&m.dispose)m.dispose();if(m.geometry&&MIDOUT.has(m.geometry)&&!keep.has(m.geometry))m.geometry.dispose();});
 const t0=s.tris?s.tris.mid:0;s.midG=g;s.midLvl=lv;if(s.tris)s.tris.mid=trisOf(g);L.midLog.push({id:s.id,lvl:lv,amin:+(MIDA*Math.pow(2,lv)).toFixed(3),tris:[t0,s.tris&&s.tris.mid],d:s.dist});FA.kick&&FA.kick(200);}
function midRelevel(T){if(!L.MIDDIST||JOBS.some(j=>j.reMid))return;
 for(const o of T){const s=o.s;if(L.tiers[s.id]!=='mid'||!s.midG||s.midOwn||!s.built||(!s.real&&!s.pivot))continue;const lv=midLvl(o.d,s.midLvl||0,false);if(lv===(s.midLvl||0))continue;
  JOBS.push({s,it:s.real?realMidSteps(s,MIDA*Math.pow(2,lv),lv):reMidSteps(s,lv),steps:[],work:0,t0:performance.now(),realMid:1,reMid:1});schedule();return;}}

// ---- B1 r2: COMPOSITE sites (contract v2 frozen decision): protown preset part + the plan's OTHER part ----
// Plan sec. 3: Zookeeper = tidy town inside a tall transparent enclosure (protown 'zookeeper') + outside it a machine landscape that
// ignores the enclosure (procompute, batch B4); Descendants = old human quarter kept like a museum, slowly emptying (protown
// 'descendants') + a luminous machine-mind city growing out of it (batch B5) + a monument at the seam. procompute / the machine-mind
// generator do not exist yet, so the engine builds a cheap PLACEHOLDER massing for the other part here (same result fields); the real
// generators replace `otherPart` later through COMP[*].other. Q17a light: outside the enclosure machine indicator dots only.
const COMP={zookeeper:{town:.52,off:0,other:'compute'},descendants:{town:.5,off:-.42,other:'mind'}};
const BOXN=(()=>{const g=BOX.toNonIndexed();return{p:g.attributes.position.array,n:g.attributes.normal.array};})();
const lin=h=>{const c=new THREE.Color(h);return[c.r,c.g,c.b];};
function bx(A,x,y,z,w,h,d,ry,c){const cs=Math.cos(ry),sn=Math.sin(ry),P=BOXN.p,N=BOXN.n;
 for(let i=0;i<P.length;i+=3){const px=P[i]*w,py=P[i+1]*h,pz=P[i+2]*d;A.p.push(x+px*cs+pz*sn,y+py,z-px*sn+pz*cs);const nx=N[i],nz=N[i+2];A.n.push(nx*cs+nz*sn,N[i+1],-nx*sn+nz*cs);A.c.push(c[0],c[1],c[2]);}}
const arr=()=>({p:[],n:[],c:[]});
function geoOf(A){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));g.computeBoundingSphere();return g;}
function otherPart(site,ctx,C,tc){const R=site.radius,rot=site.rot||0,cr=Math.cos(rot),sr=Math.sin(rot),rnd=FA.rng((site.seed|0)+977);
 const W=(u,v)=>[u*cr+v*sr,-u*sr+v*cr],yl=(x,z)=>ctx.heightAt(site.x+x,site.z+z)-site.y;   // plan (u,v) -> local (x,z): protown's rotP convention
 const M=arr(),Lt=arr(),F=arr(),lights=[],ko=[];const rt=R*C.town+1.3;let n=0;
 if(C.other==='compute'){const HALL=['#3A3E46','#434750','#30343B'].map(lin),ROOF=lin('#565A62'),DOT=lin('#9FD8E6').map(v=>v*.55),g=1.55;
  for(let u=-R;u<=R;u+=g)for(let v=-R;v<=R;v+=g*.7){const d=Math.hypot(u,v);if(d<rt+.6||d>R*1.08||rnd()<.25)continue;const [x,z]=W(u,v),y=yl(x,z)-.05;
   const w=g*(.72+rnd()*.12),dd=g*.7*(.62+rnd()*.15),h=.32+rnd()*rnd()*.75;bx(M,x,y,z,w,h,dd,rot,HALL[n%3]);bx(F,x,y,z,w,h,dd,rot,HALL[n%3]);
   if(rnd()<.6){const [ox,oz]=W((rnd()-.5)*w*.5,0);bx(M,x+ox,y+h,z+oz,w*.22,.12,dd*.5,rot,ROOF);}
   if(rnd()<.55){const [ox,oz]=W(w*.46,dd*(rnd()-.5)*.6);bx(Lt,x+ox,y+h*.6,z+oz,.05,.05,.05,rot,DOT);}n++;}
  ko.push({x:0,z:0,r:R});}
 else{const TW=['#B6BCC6','#A2AAB6','#C4C8CE'].map(lin),STRIP=lin('#CFE0EC').map(v=>v*.6),cu=R*.46,g=1.05;   // machine-mind city on the far side of the seam
  for(let u=cu-R*.62;u<=cu+R*.62;u+=g)for(let v=-R*.62;v<=R*.62;v+=g){const du=Math.hypot(u-cu,v),d=Math.hypot(u,v);
   if(du>R*.6||d>R*1.05||Math.hypot(u-C.off*R,v)<R*C.town+.9||rnd()<.3)continue;const [x,z]=W(u+(rnd()-.5)*.3,v+(rnd()-.5)*.3),y=yl(x,z)-.05;
   const w=.32+rnd()*.34,h=(1.4+5.2*Math.pow(1-du/(R*.6),1.4))*(.7+rnd()*.5),ry=rot+(rnd()<.3?.785:0);bx(M,x,y,z,w,h,w,ry,TW[n%3]);bx(F,x,y,z,w,h,w,ry,TW[n%3]);
   const [ox,oz]=W(0,w*.52);bx(Lt,x+ox,y+h*.15,z+oz,w*.14,h*.8,.03,ry,STRIP);n++;}
  // seam monument: a sunset arch (two piers + lintel) with one warm lamp (the passed torch) where the quarters meet
  const sm=tc.seam?[tc.seam.x,tc.seam.z]:W((C.off+C.town)*R+.4,0),y=yl(sm[0],sm[1])-.05,ST=lin('#A89C88');
  for(const k of [-1,1]){const [ox,oz]=W(0,k*.55);bx(M,sm[0]+ox,y,sm[1]+oz,.22,2.1,.22,rot,ST);bx(F,sm[0]+ox,y,sm[1]+oz,.22,2.1,.22,rot,ST);}
  bx(M,sm[0],y+2.1,sm[1],.3,.24,1.4,rot,ST);bx(Lt,sm[0],y+2.36,sm[1],.08,.12,.08,rot,lin('#FFB870'));lights.push({x:sm[0],y:y+2.45,z:sm[1],color:'#FFB870',intensity:.6,dist:3});
  ko.push({x:W(cu,0)[0],z:W(cu,0)[1],r:R*.6},{x:sm[0],z:sm[1],r:1});}
 const mB=new THREE.Mesh(geoOf(M),FA.MATS.building);mB.name='comp_'+C.other;mB.castShadow=true;mB.receiveShadow=true;
 const mL=new THREE.Mesh(geoOf(Lt),FA.MATS.light);mL.name='comp_'+C.other+'_lights';
 return{meshes:[mB,mL],casters:[mB],far:[{geom:geoOf(F),family:'building'}],lights,keepOut:ko,n};}
function offGeo(g,dx,dz){const G=g.clone();G.translate(dx,0,dz);return G;}
function* compositeSteps(site,ctx){const C=COMP[site.id];if(!C)throw new Error('no composite plan for '+site.id);const R=site.radius,rot=site.rot||0;
 const px=C.off*R*Math.cos(rot),pz=-C.off*R*Math.sin(rot);   // town part centre (plan u = off*R), local frame
 const part=Object.assign({},site,{ending:site.id,x:site.x+px,z:site.z+pz,radius:+(R*C.town).toFixed(2)});
 const it=FA.PROTOWN.buildSteps(part,ctx);let r;while(!(r=it.next()).done)yield r.value||'protown';const T=r.value;
 if(!T||!T.near)throw new Error('protown part '+site.id+' returned no near group');
 const near=new THREE.Group(),mid=new THREE.Group();T.near.position.set(px,0,pz);near.add(T.near);if(T.mid){T.mid.position.set(px,0,pz);mid.add(T.mid);}
 const sh=o=>Object.assign({},o,{x:o.x+px,z:o.z+pz});const tc={seam:T.anchors&&T.anchors.seam?sh(T.anchors.seam):null};
 yield 'compose:town';
 const O=otherPart(site,ctx,C,tc);for(const m of O.meshes){near.add(m);const c=new THREE.Mesh(m.geometry,m.material);c.name=m.name+'_mid';mid.add(c);}
 yield 'compose:'+C.other;
 const A=T.anchors||{};return{near,mid,far:(T.far||[]).map(e=>({geom:offGeo(e.geom||e.geometry,px,pz),family:e.family})).concat(O.far),
  casters:(T.casters||[]).concat(O.casters),movers:(T.movers||[]).map(sh),lights:(T.lights||[]).map(sh).concat(O.lights),
  anim:T.anim,uniforms:T.uniforms,keepOut:(T.keepOut||[]).map(sh).concat(O.keepOut),
  anchors:{square:A.square?sh(A.square):null,seam:tc.seam,entries:(A.entries||[]).map(sh),parts:{town:{x:px,z:pz,r:part.radius,preset:site.id},other:C.other}},
  stats:{tris:(T.stats&&T.stats.nearTris||0),town:T.stats,other:{pieces:O.n,placeholder:1}},composite:1};}
GEN.register('composite',{version:1,composite:1,buildSteps:compositeSteps});

// ---- B1 host steps: any generator (contract) -> mounted tiers; split over frames by the scheduler below ----
function* hostSteps(s){const t0=performance.now(),R=GEN.resolve(s),site=L.siteArg(s),ctx=L.ctx();s.genName=R.name;let res;
 if(!R.g)throw new Error('no generator for '+s.id);
 if(R.g.buildSteps){const it=R.g.buildSteps(site,ctx);let r;while(!(r=it.next()).done)yield r.value||'gen';res=r.value;}else{res=R.g.build(site,ctx);yield 'gen';}
 if(!res||!res.near)throw new Error('generator '+R.name+' returned no near group');
 const near=res.near;near.position.set(s.x,s.y,s.z);near.name='site_'+s.id;
 const cast=new Set(res.casters||[]);near.traverse(m=>{if(m.isMesh||m.isInstancedMesh){m.userData.cs0=R.g.legacy?m.castShadow:cast.has(m);m.castShadow=false;}});
 let mid=res.mid;s.midOwn=!!mid;if(!mid){const lv=midLvl(s.dist||L.MID_IN,0,true);mid=yield* deriveMid(near,MIDA*Math.pow(2,lv));s.midLvl=lv;}   // engine-derived MID (flattened, decimated by a DISTANCE-driven triangle area)
 mid.position.copy(near.position);mid.name='mid_'+s.id;mid.traverse(m=>{if(m.isMesh||m.isInstancedMesh){m.castShadow=false;m.userData.cs0=false;}});
 yield 'mount';
 // ambient movers / anims: legacy entries were captured by the adapter; contract movers are LOCAL coords (o = any Object3D)
 const pv=near;pv.userData.dead=false;const alive=()=>!pv.userData.dead&&(pv.visible||mid.visible);
 const an=(res.anims||[]).map(f=>{const g=(T,dt)=>{if(alive())f(T,dt);};g.site=s.id;return g;});
 for(const f of (res.fxAnims||[])){f.site=s.id;an.push(f);}
 if(typeof res.anim==='function'){const A=res.anim,U=res.uniforms;const g=(T,dt)=>{if(!alive())return;if(U&&U.uT)U.uT.value=T;A(T,dt);};g.site=s.id;an.push(g);}   // B2 additive: result.anim(T) + uniforms.uT
 FA.anims.push(...an);s.keepOut=res.keepOut||null;s.anchors=res.anchors||null;
 // B1 r2: consume keepOut - world-coords circles published in FA.KEEPOUT (replaced per site) + checked against the boot reservation
 FA.KEEPOUT=FA.KEEPOUT.filter(k=>k.site!==s.id);if(s.keepOut&&s.keepOut.length){let out=0,worst=0;const lim=s.r*L.KO_K+2;
  for(const k of s.keepOut){const d=Math.hypot(k.x,k.z)+(k.r||0);worst=Math.max(worst,d/s.r);if(d>lim)out++;FA.KEEPOUT.push({x:k.x+s.x,z:k.z+s.z,r:k.r||0,site:s.id});}
  L.koCheck[s.id]={n:s.keepOut.length,outside:out,worstR:+worst.toFixed(2)};}
 const tx=res.legacyTx;
 for(const m of (res.legacyMovers||[])){const n=Object.assign({},m,{vis:alive,site:s.id});if(m.x!=null&&!m.o&&!m.p&&!m.fn){const t=tx(m.x,m.y,m.z);n.x=t[0];n.y=t[1];n.z=t[2];}if(m.r)n.r=m.r*(res.k||1);FA.MOVERS.push(n);}
 for(const m of (res.movers||[])){const n=Object.assign({},m,{vis:alive,site:s.id});if(m.x!=null&&!m.o&&!m.p&&!m.fn){n.x=m.x+s.x;n.y=m.y+s.y;n.z=m.z+s.z;}
  if(m.p){const P=m.p,v=new THREE.Vector3();n.p=()=>v.copy(P()).add(near.position);}FA.MOVERS.push(n);}
 // contract lights -> emissive glow sprites in the per-site FX batch (no real lights: engine rule)
 if(res.lights&&res.lights.length){const gl=res.lights.map(l=>({x:l.x+s.x,y:l.y+s.y,z:l.z+s.z,size:Math.max(.3,(l.dist||4)*.25),c:new THREE.Color(l.color||FA.LOOK.human).multiplyScalar((l.intensity==null?.5:l.intensity)*FA.LOOK.glowK),material:{opacity:1},an:null}));
  const nA=FA.anims.length;const fx=FA.buildFx(gl,[]);for(const o of fx)FA.SC.remove(o);for(const f of FA.anims.slice(nA))f.site=s.id;res.fxObjs=(res.fxObjs||[]).concat(fx);}
 if(res.far&&res.far.length){s.farGeoms=res.far;L.farDirty=true;}
 FA.SC.add(near);FA.SC.add(mid);for(const o of (res.fxObjs||[]))FA.SC.add(o);for(const d of (res.decals||[]))FA.SC.add(d);   // r2: NaN guard now lives in profarm.js pfN
 s.pivot=near;s.midG=mid;s.fx=res.fxObjs||[];s.objs=[near].concat(res.decals||[]);s.decals=res.decals||[];
 s.meshes=[];near.traverse(m=>{if(m.isMesh||m.isInstancedMesh)s.meshes.push(m);});
 s.tris={near:trisOf(near),mid:trisOf(mid)};s.built=1;s.buildMs=Math.round(performance.now()-t0);
 near.visible=mid.visible=false;for(const o of s.fx)o.visible=false;for(const d of s.decals)d.visible=false;
 return s;}
// ---- scheduler: run build steps from rAF with a per-frame budget (L.BUDGET ms, default 8). ?lodsplit=0 = B0 path (one sync chunk) ----
L.BUDGET=+(Q.get('lodms')||8);L.LEGACY=Q.get('lodsplit')==='0';L.SPLIT=Q.get('lodsplit')!=='sync';const JOBS=[];let pumpOn=false;  // ?lodsplit=0 = B0 buildFull (before), =sync = B1 host in one chunk
function pump(){pumpOn=false;const f0=performance.now();
 while(JOBS.length){const j=JOBS[0],t=performance.now();let r;try{r=j.it.next();}catch(e){r={done:true};j.err=e.message;(window.__errs=window.__errs||[]).push('lod build '+j.s.id+': '+e.message);}
  const dt=performance.now()-t;j.steps.push([r.value&&typeof r.value==='string'?r.value:r.value&&r.value.step?String(r.value.step):r.done?'end':'gen',+dt.toFixed(1)]);j.work+=dt;
  if(r.done){JOBS.shift();done(j);}
  if(performance.now()-f0>=L.BUDGET)break;}
 if(JOBS.length)schedule();}
function schedule(){if(pumpOn)return;pumpOn=true;if(document.hidden)setTimeout(pump,16);else requestAnimationFrame(()=>setTimeout(pump,0));FA.kick&&FA.kick(400);}  // rAF -> after this frame's render
function done(j){const s=j.s;pending=JOBS.length?JOBS[0].s.id:null;const ms=Math.round(performance.now()-j.t0);
 const mx=j.steps.reduce((m,x)=>Math.max(m,x[1]),0);
 if(j.realMid){L.log.push({id:s.id,realMid:1,ok:!j.err,err:j.err,workMs:Math.round(j.work),steps:j.steps.length,maxStepMs:+mx.toFixed(1),tris:s.tris});L.update(true);FA.kick&&FA.kick(300);return;}
 L.builds[s.id]=Math.round(j.work);L.log.push({id:s.id,gen:s.genName,ok:!j.err,err:j.err,workMs:Math.round(j.work),wallMs:ms,steps:j.steps.length,maxStepMs:+mx.toFixed(1),maxStep:j.steps.reduce((a,x)=>x[1]>a[1]?x:a,['',0])[0],top:j.steps.slice().sort((a,b)=>b[1]-a[1]).slice(0,4),stepList:j.steps.slice(0,12),tris:s.tris});
 if(!j.err){LRU.push(s.id);for(let i=0;LRU.length>L.CACHE&&i<LRU.length;){const ev=LRU[i];if(L.tiers[ev]==='far'&&ev!==s.id){LRU.splice(i,1);dispose(site(ev));}else i++;}}
 if(L.farDirty){L.farDirty=false;L.farAsync();}   // B1 r2: FAR re-merge time-sliced over frames (the site is NEAR, its FAR slot is hidden by VIS anyway)
 const td=performance.now();L.update(true);FA.shadowDirty=true;FA.kick&&FA.kick(600);L.log[L.log.length-1].doneMs=+(performance.now()-td).toFixed(1);}
function queueBuild(s){if(JOBS.some(j=>j.s===s))return;const j={s,it:hostSteps(s),steps:[],work:0,t0:performance.now()};
 if(!L.SPLIT){pending=s.id;setTimeout(()=>{try{let r;do{r=j.it.next();}while(!r.done);}catch(e){j.err=e.message;(window.__errs=window.__errs||[]).push('lod build '+s.id+': '+e.message);}
   j.work=performance.now()-j.t0;j.steps.push(['sync',+j.work.toFixed(1)]);done(j);pending=null;},0);return;}
 JOBS.push(j);pending=JOBS[0].s.id;schedule();}
L.jobs=()=>JOBS.map(j=>j.s.id);
function buildFull(s){const t0=performance.now();const a=snap();const sv={GK:FA.GK,RV:FA.RV,rng:FA.rng,eye:FA.eyePos,pc:FA.PROCITY&&FA.PROCITY.info,pk:FA.PROCOTTAGE&&FA.PROCOTTAGE.info,
  fl:FA.PROFLORA&&FA.PROFLORA.add,rvs:FA.RVSITE};
 const R0=sv.rng,off=s.seed;let ok=true;
 try{FA.rng=seed=>R0(((seed|0)+off)>>>0);if(FA.PROFLORA)FA.PROFLORA.add=()=>false;
  if(s.g==='city'){if(!FA.PROCITY)throw new Error('no procity');FA.GK={x:s.x,z:s.z,top:s.h0+1.3};FA.PROCITY.build();}
  else{if(!FA.PROCOTTAGE)throw new Error('no procottage');FA.RV={x:s.x+1.5,z:s.z};const res=FA.PROCOTTAGE.build({});if(!res)throw new Error('procottage returned null');}
  s.genInfo=JSON.parse(JSON.stringify((s.g==='city'?FA.PROCITY:FA.PROCOTTAGE).info||{}));}
 catch(e){ok=false;(window.__errs=window.__errs||[]).push('lod build '+s.id+': '+e.message);}
 finally{FA.GK=sv.GK;FA.RV=sv.RV;FA.rng=R0;FA.eyePos=sv.eye;if(FA.PROCITY)FA.PROCITY.info=sv.pc;if(FA.PROCOTTAGE)FA.PROCOTTAGE.info=sv.pk;if(FA.PROFLORA)FA.PROFLORA.add=sv.fl;FA.RVSITE=sv.rvs;}
 const k=s.k,cx=s.x,cy=s.h0,cz=s.z,G=s.g==='city'?30:26,far=(x,z)=>Math.hypot(x-cx,z-cz)>G;
 const tx=(x,y,z)=>[cx+(x-cx)*k,cy+(y-cy)*k,cz+(z-cz)*k];
 // side effects: drop FX/kit/lane entries (FX batches are global; per-site FX batch = B1), keep AO decals (scaled, own batch)
 FA.GLOWS.length=a.gl;FA.SMOKES.length=a.sm;for(const kk in FA.PL)FA.PL[kk].length=a.pl[kk]||0;if(FA.lanes)FA.lanes.length=a.ln;
 const ao=FA.AOS.splice(a.ao).filter(d=>!far(d.x,d.z)).map(d=>{const t=tx(d.x,d.y==null?cy:d.y,d.z);return Object.assign({},d,{x:t[0],z:t[2],y:d.y==null?undefined:t[1],r:d.r*k,sx:d.sx&&d.sx*k,sz:d.sz&&d.sz*k});});
 const stat=FA.STATIC.splice(a.st);const keepAO=FA.AOS;FA.AOS=ao;const before=new Set(FA.SC.children);
 try{const S0=FA.STATIC;FA.STATIC=stat;FA.mergeStatic();FA.STATIC=S0;FA.buildDecals();}catch(e){window.__errs.push('lod merge '+s.id+': '+e.message);}
 FA.AOS=keepAO;
 const newObjs=FA.SC.children.filter(o=>!a.sc.has(o));const decals=newObjs.filter(o=>!before.has(o)&&o.isInstancedMesh&&o.renderOrder===2);
 const pv=new THREE.Group();pv.name='site_'+s.id;pv.position.set(cx,cy,cz);pv.scale.setScalar(k);let dropped=0;
 const bs=new THREE.Sphere(),wp=new THREE.Vector3();
 for(const o of newObjs){FA.SC.remove(o);if(o.isLight){dropped++;continue;}if(decals.includes(o)){s.decals=(s.decals||[]).concat(o);continue;}
  let c=null;o.updateMatrixWorld(true);if(o.geometry){if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();bs.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);c=bs.center;}else{o.getWorldPosition(wp);c=wp;}
  if(c&&far(c.x,c.z)&&(Math.hypot(c.x-cx,c.z-cz)-(o.geometry?bs.radius:0))>G*.6&&!(o.isInstancedMesh&&o.frustumCulled===false)){dropped++;(s.droppedNames=s.droppedNames||[]).push((o.name||o.type)+'@'+Math.round(Math.hypot(c.x-cx,c.z-cz)));if(o.geometry)o.geometry.dispose();continue;}  // stray parts (wheel on the real river, road stub)
  o.position.x-=cx;o.position.y-=cy;o.position.z-=cz;pv.add(o);}
 FA.SC.add(pv);for(const d of (s.decals||[]))FA.SC.add(d);
 pv.userData.dead=false;const alive=()=>!pv.userData.dead&&pv.visible;
 for(let i=a.an;i<FA.anims.length;i++){const f=FA.anims[i];FA.anims[i]=(T,dt)=>{if(alive())f(T,dt);};FA.anims[i].site=s.id;}
 for(let i=a.mv;i<FA.MOVERS.length;i++){const m=FA.MOVERS[i];const n=Object.assign({},m,{vis:alive,site:s.id});if(m.x!=null&&!m.o&&!m.p&&!m.fn){const t=tx(m.x,m.y,m.z);n.x=t[0];n.y=t[1];n.z=t[2];}if(m.r)n.r=m.r*k;FA.MOVERS[i]=n;}
 s.meshes=[];pv.traverse(m=>{if(m.isMesh||m.isInstancedMesh){m.userData.cs0=m.castShadow;s.meshes.push(m);}});s.objs=[pv].concat(s.decals||[]);s.pivot=pv;
 s.built=ok?1:0;s.buildMs=Math.round(performance.now()-t0);L.builds[s.id]=s.buildMs;L.log.push({id:s.id,ms:s.buildMs,meshes:s.meshes.length,dropped,droppedNames:s.droppedNames,ok});return ok;}
function dispose(s){if(!s.pivot)return;s.pivot.userData.dead=true;
 const keep=new Set();for(const k in FA.MODELS)for(const p of (FA.MODELS[k].parts||[]))keep.add(p.geo);const geos=new Set();
 for(const o of s.objs.concat(s.midG?[s.midG]:[],s.fx||[])){FA.SC.remove(o);o.traverse(m=>{if(m.isInstancedMesh&&m.dispose)m.dispose();if(m.geometry&&!keep.has(m.geometry))geos.add(m.geometry);});}
 for(const g of geos)g.dispose();s.midG=null;s.fx=null;   // shared generator geometries re-upload on next use; materials stay (shared)
 FA.anims=FA.anims.filter(f=>f.site!==s.id);FA.MOVERS.splice(0,FA.MOVERS.length,...FA.MOVERS.filter(m=>m.site!==s.id));
 s.pivot=null;s.objs=null;s.meshes=null;s.decals=null;s.built=0;L.log.push({id:s.id,evicted:1});}

// ---- tier selection (camera distance + hysteresis) and application ----
const _cp=new THREE.Vector3();let lastU=0,pending=null;const LRU=[];
function want(s,dist,prev){if(FA.VIEW==='close')return s.id===FA.CITY?'near':(s.real&&!LODALL?'mid':'far');
 const nIn=prev==='near'?L.NEAR_OUT:L.NEAR_IN,mIn=(prev==='mid'||prev==='near')?L.MID_OUT:L.MID_IN;
 let t=dist<nIn?'near':dist<mIn?'mid':'far';if(s.real&&!LODALL&&t==='far')t='mid';return t;}
function apply(s,t){const prev=L.tiers[s.id];
 if(t!=='far'&&!s.built){if(!s.real){if(L.LEGACY){if(!pending){pending=s.id;setTimeout(()=>{const ok=buildFull(s);pending=null;
    if(ok){LRU.push(s.id);for(let i=0;LRU.length>L.CACHE&&i<LRU.length;){const ev=LRU[i];if(L.tiers[ev]==='far'&&ev!==s.id){LRU.splice(i,1);dispose(site(ev));}else i++;}}
    L.update(true);FA.shadowDirty=true;FA.kick&&FA.kick(600);},0);}}else queueBuild(s);}t='far';}  // FAR proxy shown until the full build exists
 if(t!=='far'&&!s.real){const i=LRU.indexOf(s.id);if(i>=0){LRU.splice(i,1);LRU.push(s.id);}}
 VIS[s.i]=t==='far'?1:0;
 if(s.midG&&s.real){const n=t==='near';if(s.midSwap)for(const m of s.midSwap)m.visible=n;s.midG.visible=!n;}   // B1: real-city MID swap
 else if(s.midG){s.pivot.visible=t==='near';s.midG.visible=t==='mid';for(const o of s.decals)o.visible=t!=='far';for(const o of s.fx)o.visible=t!=='far';}   // B1 host: separate MID group
 else if(s.objs)for(const o of s.objs)o.visible=t!=='far';
 if(s.meshes&&prev!==t){for(const m of s.meshes)m.castShadow=!!m.userData.cs0&&t==='near';FA.shadowDirty=true;}
 L.tiers[s.id]=t;}
L.update=function(force){if(!L.farMeshes)return;const n=performance.now();if(!force&&n-lastU<120)return;lastU=n;FA.CAM.getWorldPosition(_cp);
 const D=SITES.map(s=>({s,d:Math.hypot(_cp.x-s.x,_cp.y-(s.h0+2),_cp.z-s.z)}));
 const T=D.map(o=>({s:o.s,d:o.d,t:want(o.s,o.d,L.tiers[o.s.id])}));
 // at most MAXMID stand-ins above FAR at once (closest first)
 T.filter(o=>!o.s.real&&o.t!=='far').sort((a,b)=>a.d-b.d).slice(L.MAXMID).forEach(o=>o.t='far');
 for(const o of T){o.s.dist=Math.round(o.d);apply(o.s,o.t);}
 midRelevel(T);   // B1 r2: distance-driven MID level (one re-derive job at a time)
 {const anyFar=VIS.some(v=>v>0);for(const m of L.farMeshes)m.visible=anyFar;}   // no FAR site -> skip the 4 proxy draws entirely
 if(L.lines)L.lines.visible=FA.VIEW==='world';};
// ---- idle-rule hooks: hover over a marker (screen distance) + showcase window ----
L.showcase=(id,ms)=>{L.show[id]=performance.now()+(ms||6000);};
L.hot=function(){if(FA.VIEW!=='world')return null;const n=performance.now();if(L.hover)return L.hover;for(const id in L.show)if(L.show[id]>n)return id;return null;};
{const v=new THREE.Vector3();addEventListener('pointermove',e=>{if(e.buttons){L.hover=null;return;}let best=null,bd=26;
 for(const m of FA.markers||[]){if(m.el.style.display==='none')continue;v.copy(m.p).project(FA.CAM);const X=(v.x*.5+.5)*innerWidth,Y=(-v.y*.5+.5)*innerHeight,d=Math.hypot(X-e.clientX,Y-e.clientY);if(d<bd){bd=d;best=m.id;}}
 L.hover=best;});}
L.hud=()=>{const c={near:0,mid:0,far:0};for(const k in L.tiers)c[L.tiers[k]]++;return 'lod N'+c.near+' M'+c.mid+' F'+c.far+(pending?' (building '+pending+')':'')+' · ter '+FA.TER;};
L.info=()=>({tiers:Object.assign({},L.tiers),dist:Object.fromEntries(SITES.map(s=>[s.id,s.dist])),builds:Object.assign({},L.builds),far:L.farInfo,lru:LRU.slice(),pending,
 koCheck:Object.assign({},L.koCheck),warm:L.warmInfo||null,farMs:L.farMs,midLvl:Object.fromEntries(SITES.filter(s=>s.midG).map(s=>[s.id,s.midOwn?'own':s.midLvl||0])),midLog:L.midLog.slice(-8),
 gens:Object.fromEntries(SITES.map(s=>[s.id,s.genName||s.gen])),
 sites:SITES.map(s=>({id:s.id,real:s.real,g:s.g,x:+s.x.toFixed(1),z:+s.z.toFixed(1),r:+s.r.toFixed(1),nudge:s.nudge||0})),log:L.log.slice(-12)});
// test helper: aim the world camera at a site from distance d (world view), then update tiers
L.look=function(id,d){const s=site(id);if(!s)return null;FA.VIEW='world';Object.assign(FA.rig,{tx:s.x,ty:s.h0,tz:s.z,d:d||60});FA.applyCam();L.update(true);return L.info().tiers[id];};
})();
