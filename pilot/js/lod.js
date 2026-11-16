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
if(STRESS){let i=2;for(const id in STAND){const s=STAND[id],k=KS[s.g]*(s.big?1.25:1);
  SITES.push({id,name:s.n,real:0,g:s.g,win:s.win,dark:!!s.dark,ash:!!s.ash,x:V44[id][0]*K44,z:V44[id][1]*K44,x44:V44[id][0],z44:V44[id][1],k,r:RFULL[s.g]*k,h0:s.g==='city'?2.6:1.6,seed:i*7919+13,i:i++});}
 // nudge: off the real cities, the river corridor, each other, inside the table rim
 const TW=FA.TW,TD=FA.TD,st=SITES.filter(s=>!s.real),real=SITES.filter(s=>s.real);
 for(let it=0;it<160;it++){for(const s of st){
  for(const o of real.concat(st)){if(o===s)continue;const dx=s.x-o.x,dz=s.z-o.z,d=Math.hypot(dx,dz)||.01,m=s.r+o.r+(o.real?9:7);if(d<m){const p=(m-d)*(o.real?1:.5);s.x+=dx/d*p;s.z+=dz/d*p;}}
  if(s.z>-80){const rx=FA.riverX(s.z),dx=s.x-rx,m=s.r+8;if(Math.abs(dx)<m)s.x=rx+Math.sign(dx||1)*m;}
  s.x=Math.max(-TW/2+s.r+10,Math.min(TW/2-s.r-10,s.x));s.z=Math.max(-TD/2+s.r+10,Math.min(TD/2-s.r-12,s.z));}}
 for(const s of st)s.nudge=+Math.hypot(s.x-s.x44*K44,s.z-s.z44*K44).toFixed(1);}
// terrain basins for the stand-ins (world.js FA.H reads FA.SITEB): flat floor h0 over the UNSCALED generator footprint
FA.SITEB=SITES.filter(s=>!s.real).map(s=>({x:s.x,z:s.z,h0:s.h0,rb:Math.max(s.r+4,RFULL[s.g]+2)}));
FA.SITEB_ALL=SITES.map(s=>({x:s.x,z:s.z,rb:s.real?(s.id==='gatekeeper'?27:24):Math.max(s.r+4,RFULL[s.g]+2)}));
L.inSite=(x,z,pad)=>{for(const s of SITES){if(s.real)continue;if(Math.hypot(x-s.x,z-s.z)<s.r+(pad||4))return true;}return false;};

// ---- capture: objects a builder adds to the scene (real detail cities) ----
function snap(){return{sc:new Set(FA.SC.children),st:FA.STATIC.length,an:FA.anims.length,mv:FA.MOVERS.length,gl:FA.GLOWS.length,sm:FA.SMOKES.length,ao:FA.AOS.length,
 pl:Object.fromEntries(Object.entries(FA.PL).map(([k,a])=>[k,a.length])),ln:FA.lanes?FA.lanes.length:0,co:FA.closeOnly?FA.closeOnly.length:0};}
const site=id=>SITES.find(s=>s.id===id);
L.capture=function(id,fn){const s=site(id),a=snap();const t0=performance.now();fn();s.buildMs=Math.round(performance.now()-t0);
 for(let i=a.st;i<FA.STATIC.length;i++)FA.STATIC[i].userData.site=id;   // world.js mergeStatic keys on userData.site
 s.direct=FA.SC.children.filter(o=>!a.sc.has(o));};
L.collect=function(){for(const s of SITES){if(!s.real)continue;const objs=(s.direct||[]).slice();
  for(const o of FA.SC.children)if(o.userData.site===s.id&&!objs.includes(o))objs.push(o);
  s.objs=objs;s.meshes=[];for(const o of objs)o.traverse(m=>{if(m.isMesh||m.isInstancedMesh){m.userData.cs0=m.castShadow;s.meshes.push(m);}});s.built=1;}};

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
L.far=function(){const t0=performance.now();let pieces=0;
 for(const s of SITES){const rnd=FA.rng(9001+s.i*131);pieces+=s.g==='city'?farCity(s,rnd):farCot(s,rnd);VIS[s.i]=0;}
 const mats={mass:farMat('mass'),metal:farMat('metal',{metalness:.55,roughness:.45}),ground:farMat('ground',{roughness:.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
  emit:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:true})};
 {const e=farMat('emit');mats.emit.onBeforeCompile=e.onBeforeCompile;e.dispose();}mats.emit.customProgramCacheKey=()=>'faFar_emit';
 L.farMeshes=[];let tris=0;
 for(const k in FAM){const F=FAM[k];if(!F.pos.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(F.pos,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(F.nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(F.col,3));g.setAttribute('aS',new THREE.Float32BufferAttribute(F.s,1));
  g.setAttribute('aW',new THREE.Float32BufferAttribute(F.w,1));g.computeBoundingSphere();const me=new THREE.Mesh(g,mats[k]);me.name='far_'+k;me.castShadow=false;me.receiveShadow=true;FA.SC.add(me);L.farMeshes.push(me);tris+=F.pos.length/9;}
 for(const k in FAM)delete FAM[k];
 L.farInfo={draws:L.farMeshes.length,tris:Math.round(tris),pieces,ms:Math.round(performance.now()-t0),sites:SITES.length};return L.farInfo;};

// ---- stand-in markers: DOM plates (0 draws) + ONE LineSegments for all their drop lines ----
L.markers=function(){const st=SITES.filter(s=>!s.real);if(!st.length)return;const P=[];
 for(const s of st){const gy=s.h0+(s.g==='city'?.75:0);P.push(s.x,24,s.z,s.x,gy+.2,s.z);
  const el=document.createElement('div');el.className='mk';el.innerHTML='<i></i><span class="pl"><b>'+s.name+'</b><em>stand-in · '+(s.g==='city'?'Gatekeeper':'Reversion')+' generator</em></span>';
  document.getElementById('labels').appendChild(el);FA.markers.push({id:s.id,el,line:{visible:true},dot:{visible:true},p:new THREE.Vector3(s.x,24,s.z),anchor:new THREE.Vector3(s.x,gy,s.z),standin:1});}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 const ln=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#E6E0D2',transparent:true,opacity:.45,fog:false,toneMapped:false}));ln.name='standin_lines';FA.SC.add(ln);L.lines=ln;};

// ---- lazy full build of a stand-in (generator reused with an offset seed, scaled by s.k around its centre) ----
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
function dispose(s){if(!s.pivot)return;s.pivot.userData.dead=true;const kill=new Set();
 for(const o of s.objs){FA.SC.remove(o);o.traverse(m=>{if(m.geometry)m.geometry.dispose();const M=m.material;if(M)(Array.isArray(M)?M:[M]).forEach(x=>x.dispose());});}
 FA.anims=FA.anims.filter(f=>f.site!==s.id);FA.MOVERS.splice(0,FA.MOVERS.length,...FA.MOVERS.filter(m=>m.site!==s.id));
 s.pivot=null;s.objs=null;s.meshes=null;s.decals=null;s.built=0;L.log.push({id:s.id,evicted:1});}

// ---- tier selection (camera distance + hysteresis) and application ----
const _cp=new THREE.Vector3();let lastU=0,pending=null;const LRU=[];
function want(s,dist,prev){if(FA.VIEW==='close')return s.id===FA.CITY?'near':(s.real&&!LODALL?'mid':'far');
 const nIn=prev==='near'?L.NEAR_OUT:L.NEAR_IN,mIn=(prev==='mid'||prev==='near')?L.MID_OUT:L.MID_IN;
 let t=dist<nIn?'near':dist<mIn?'mid':'far';if(s.real&&!LODALL&&t==='far')t='mid';return t;}
function apply(s,t){const prev=L.tiers[s.id];
 if(t!=='far'&&!s.built){if(!s.real&&!pending){pending=s.id;setTimeout(()=>{const ok=buildFull(s);pending=null;
    if(ok){LRU.push(s.id);  // cache: keep at most L.CACHE full stand-in builds; evict the least recently used one that is FAR now
     for(let i=0;LRU.length>L.CACHE&&i<LRU.length;){const ev=LRU[i];if(L.tiers[ev]==='far'&&ev!==s.id){LRU.splice(i,1);dispose(site(ev));}else i++;}}
    L.update(true);FA.shadowDirty=true;FA.kick&&FA.kick(600);},0);}t='far';}  // FAR proxy shown until the full build exists
 if(t!=='far'&&!s.real){const i=LRU.indexOf(s.id);if(i>=0){LRU.splice(i,1);LRU.push(s.id);}}
 VIS[s.i]=t==='far'?1:0;
 if(s.objs)for(const o of s.objs)o.visible=t!=='far';
 if(s.meshes&&prev!==t){for(const m of s.meshes)m.castShadow=!!m.userData.cs0&&t==='near';FA.shadowDirty=true;}
 L.tiers[s.id]=t;}
L.update=function(force){if(!L.farMeshes)return;const n=performance.now();if(!force&&n-lastU<120)return;lastU=n;FA.CAM.getWorldPosition(_cp);
 const D=SITES.map(s=>({s,d:Math.hypot(_cp.x-s.x,_cp.y-(s.h0+2),_cp.z-s.z)}));
 const T=D.map(o=>({s:o.s,d:o.d,t:want(o.s,o.d,L.tiers[o.s.id])}));
 // at most MAXMID stand-ins above FAR at once (closest first)
 T.filter(o=>!o.s.real&&o.t!=='far').sort((a,b)=>a.d-b.d).slice(L.MAXMID).forEach(o=>o.t='far');
 for(const o of T){o.s.dist=Math.round(o.d);apply(o.s,o.t);}
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
 sites:SITES.map(s=>({id:s.id,real:s.real,g:s.g,x:+s.x.toFixed(1),z:+s.z.toFixed(1),r:+s.r.toFixed(1),nudge:s.nudge||0})),log:L.log.slice(-12)});
// test helper: aim the world camera at a site from distance d (world view), then update tiers
L.look=function(id,d){const s=site(id);if(!s)return null;FA.VIEW='world';Object.assign(FA.rig,{tx:s.x,ty:s.h0,tz:s.z,d:d||60});FA.applyCam();L.update(true);return L.info().tiers[id];};
})();
