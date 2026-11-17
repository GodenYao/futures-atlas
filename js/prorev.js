// Futures Atlas G1 preview - prorev.js : host adapter for the pilot Reversion hamlet (swap r7 S).
// Tegmark, Life 3.0 ch.5 "Reversion": technological progress is stopped by rolling technology back to a pre-industrial level
// (e.g. a totalitarian or Amish-like rollback). What the city literally shows: timber-frame cottages with thatch / slate / shingle roofs,
// an aisled barn, a stone mill with an undershot WATER WHEEL turning on a brook, a post WINDMILL with turning lattice sails, a trestle
// bridge, a well and a bonfire on the green, carts and hay wagons, an orchard, strip fields with hedgerows, haystacks and grazing sheep.
// Light = sparse fire light only (Q17a: a few lit window panes, two door lanterns, the bonfire); chimney smoke; no electric light,
// no power lines, no paved roads, no neon.
// Contract (same as FA.PROTOWN / FA.PROGATE): FA.PROREV.build(site, ctx) -> {near, mid, anim(t), stats, anchors}
//   site {x,z,y,radius,seed,rm,params}; ctx {THREE, mats, heightAt(x,z), renderer, camera, fog}.
// The hamlet itself = js/procottage.js (copy of pilot_v45/js/procottage.js, 2 G1 edits: sRGB->linear palette, vFogWP from FA.PKI).
// This file supplies the pilot engine pieces procottage needs (FA.H, FA.riverX, FA.WL, FA.SC, FA.R, FA.glow, FA.smoke, FA.anims, FA.TU,
// FA.hash/rng/smooth, FA.AOS), plus what pilot profarm.js / prostream.js did there (fields, hedges, brook) as light host-side geometry.
// The pilot PointLight of the bonfire is removed (a scene light would recompile every v4.4 material); the bonfire is a glow point.
// MID tier = deep clone of NEAR with its own geometry copies (graded by the host's MID night grade), cross-faded by g1_cities.js.
// Also exports FA.G1KIT (glow points, smoke points, merged-box builder, tier clone) used by js/proruin.js.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
function hash(x,y){const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h);}
const rng=function(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function vn(x,z){const i=Math.floor(x),j=Math.floor(z);let u=x-i,v=z-j;u=u*u*(3-2*u);v=v*v*(3-2*v);const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const lin=h=>{const c=new THREE.Color(h);c.convertSRGBToLinear();return c;};
const BREATH='uniform float uAn;float faBr(vec4 b,float t){if(uAn<.5||b.y<=0.)return 1.;float w=1.+b.x*sin(6.2832*t/b.y+b.z);'+
 'if(b.w>0.){float s=floor(t/(b.y*2.7)+b.z);float h=fract(sin(s*91.7+b.z*37.1)*4375.85);w*=1.-.88*step(.72,h);}return w;}\n';
// ---- glow handles -> one additive Points draw (per-point size / colour / breath; faded by the scene fog distance) ----
function glowPoints(H,grp,TU,ctx,scl,K){if(!H.length)return null;const n=H.length,P=new Float32Array(n*3),Cc=new Float32Array(n*3),S=new Float32Array(n),O=new Float32Array(n),B=new Float32Array(n*4);
 H.forEach((h,i)=>{P.set([h.x,h.y,h.z],i*3);Cc.set([h.c.r,h.c.g,h.c.b],i*3);S[i]=h.size;O[i]=1;if(h.an)B.set(h.an,i*4);});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(Cc,3));
 g.setAttribute('aS',new THREE.BufferAttribute(S,1));const ao=new THREE.BufferAttribute(O,1);ao.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aO',ao);g.setAttribute('aB',new THREE.BufferAttribute(B,4));
 const f=ctx.fog||{near:210,far:460},U={uT:TU.uT,uAn:TU.uAn,uH:{value:900},uSc:{value:scl},uFn:{value:f.near},uFf:{value:f.far},uK:{value:K==null?1:K}};
 const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute vec3 color;attribute float aS;attribute float aO;attribute vec4 aB;uniform float uT,uH,uSc,uFn,uFf,uK;varying vec3 vC;varying float vA;\n'+BREATH+
   'void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float d=max(.1,-mv.z);float px=aS*uSc*projectionMatrix[1][1]*uH*.5/d;'+
   'float a=uK*aO*faBr(aB,uT)*(1.-smoothstep(uFn,uFf,d));if(px<1.6){a*=px/1.6;px=1.6;}gl_PointSize=min(px,64.);vC=color;vA=a;}',
  fragmentShader:'varying vec3 vC;varying float vA;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;gl_FragColor=vec4(vC*vA*exp(-r*4.5),1.);}'});
 const pts=new THREE.Points(g,m);pts.name='g1k_glows';pts.frustumCulled=false;pts.renderOrder=3;grp.add(pts);
 return{pts,ao,U,sync(){let ch=0;for(let i=0;i<H.length;i++){const o=H[i].material?H[i].material.opacity:1;if(ao.array[i]!==o){ao.array[i]=o;ch=1;}}if(ch)ao.needsUpdate=true;
  if(ctx.renderer){const s=ctx.renderer.getDrawingBufferSize(new THREE.Vector2());U.uH.value=s.y;}}};}
// ---- smoke puffs -> one Points draw: each puff rises / drifts / grows / fades over its period (pure function of uT; frozen at its phase when uAn = 0) ----
function smokePoints(L,grp,TU,ctx,scl,o){if(!L.length)return null;o=o||{};const n=L.length,P=new Float32Array(n*3),A=new Float32Array(n*3),Cc=new Float32Array(n*3);
 L.forEach((s,i)=>{P.set([s.x,s.y,s.z],i*3);A.set([s.period,s.phase,s.size||1],i*3);Cc.set([s.c.r,s.c.g,s.c.b],i*3);});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('aP',new THREE.BufferAttribute(A,3));g.setAttribute('color',new THREE.BufferAttribute(Cc,3));
 const f=ctx.fog||{near:210,far:460},U={uT:TU.uT,uAn:TU.uAn,uH:{value:900},uSc:{value:scl},uFn:{value:f.near},uFf:{value:f.far},uK:{value:o.k!=null?o.k:.3},uRise:{value:o.rise||2.4}};
 const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,
  vertexShader:'attribute vec3 aP;attribute vec3 color;uniform float uT,uAn,uH,uSc,uFn,uFf,uK,uRise;varying vec3 vC;varying float vA;\n'+
   'void main(){float k=uAn>.5?fract(uT/aP.x+aP.y):aP.y;vec3 p=position+vec3(k*.7,k*uRise,-k*.35)*aP.z;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;'+
   'float d=max(.1,-mv.z);float px=(.3+k*1.05)*aP.z*uSc*projectionMatrix[1][1]*uH*.5/d;float a=uK*(1.-k)*min(1.,k*6.)*(1.-smoothstep(uFn,uFf,d));if(px<1.2){a*=px/1.2;px=1.2;}gl_PointSize=min(px,72.);vC=color;vA=a;}',
  fragmentShader:'varying vec3 vC;varying float vA;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;gl_FragColor=vec4(vC,vA*exp(-r*2.6));}'});
 const pts=new THREE.Points(g,m);pts.name='g1k_smoke';pts.frustumCulled=false;pts.renderOrder=3;grp.add(pts);
 return{pts,U,sync(){if(ctx.renderer){const s=ctx.renderer.getDrawingBufferSize(new THREE.Vector2());U.uH.value=s.y;}}};}
// ---- merged vertex-coloured parts (boxes / ico / cylinders, any transform) -> one mesh per material ----
function Parts(){const B=new Map(),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),S=new THREE.Vector3(),P=new THREE.Vector3(),N3=new THREE.Matrix3(),v=new THREE.Vector3(),GC={};
 const geo=(k,mk)=>{if(!GC[k]){let g=mk();if(g.index)g=g.toNonIndexed();if(!g.attributes.normal)g.computeVertexNormals();GC[k]=g;}return GC[k];};
 const G={box:()=>geo('box',()=>{const g=new THREE.BoxGeometry(1,1,1);g.translate(0,.5,0);return g;}),ico:d=>geo('ico'+d,()=>new THREE.IcosahedronGeometry(1,d)),
  cyl:(s,rt)=>geo('cy'+s+'_'+rt,()=>{const g=new THREE.CylinderGeometry(rt,1,1,s);g.translate(0,.5,0);return g;}),cone:s=>geo('co'+s,()=>{const g=new THREE.ConeGeometry(1,1,s);g.translate(0,.5,0);return g;})};
 function add(mat,g,x,y,z,sx,sy,sz,rx,ry,rz,c,order){E.set(rx||0,ry||0,rz||0,order||'YXZ');Q.setFromEuler(E);M4.compose(P.set(x,y,z),Q,S.set(sx,sy,sz));N3.getNormalMatrix(M4);
  let b=B.get(mat);if(!b){b={p:[],n:[],c:[]};B.set(mat,b);}const pa=g.attributes.position,na=g.attributes.normal;
  for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(M4);b.p.push(v.x,v.y,v.z);v.fromBufferAttribute(na,i).applyMatrix3(N3).normalize();b.n.push(v.x,v.y,v.z);b.c.push(c[0],c[1],c[2]);}}
 function flush(grp,prefix){let n=0,tris=0;for(const[mat,b]of B){if(!b.p.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));
   g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.computeBoundingSphere();
   const m=new THREE.Mesh(g,mat);m.name=prefix+'_'+(mat.name||n);grp.add(m);n++;tris+=b.p.length/9;}B.clear();return{draws:n,tris};}
 return{G,add,flush};}
// ---- MID tier = deep clone with geometry copies (the host grades each tier's vertex colours separately); named movers are mirrored ----
function cloneTier(near,name,drop){const mid=near.clone(true);mid.name=name;const a=[],b=[];near.traverse(o=>a.push(o));mid.traverse(o=>b.push(o));const pairs=[],rm=[];
 for(let i=0;i<b.length;i++){const o=b[i];if(drop&&o.isMesh&&drop.test(o.name||'')){rm.push(o);continue;}if((o.isMesh)&&o.geometry&&o.geometry.attributes.color&&!(o.material&&o.material.isShaderMaterial))o.geometry=o.geometry.clone();
  if(o.isGroup&&/G$|_mv$/.test(o.name||''))pairs.push([a[i],o]);}
 for(const o of rm)o.parent.remove(o);   // MID-only drops: sub-pixel detail at world zoom (tris budget)
 return{mid,mirror(){for(const[s,d]of pairs){d.position.copy(s.position);d.quaternion.copy(s.quaternion);d.scale.copy(s.scale);}}};}
FA.G1KIT={hash,rng,smooth,vn,lin,glowPoints,smokePoints,Parts,cloneTier};

// ======================= Reversion =======================
const RREF=13;   // the hamlet is authored for ~13 u plan radius (pilot units): host scale = site.radius / RREF
FA.PROREV={build(site,ctx){const PK=FA.PROCOTTAGE;if(!PK||typeof PK.build!=='function')throw new Error('FA.PROCOTTAGE missing');
 const t0=performance.now(),near=new THREE.Group();near.name='reversion_near';const RAD=site.radius||13,scl=RAD/RREF;near.scale.setScalar(scl);
 const y0=site.y,hA=ctx.heightAt||(()=>y0),H=(x,z)=>(hA(site.x+x*scl,site.z+z*scl)-y0)/scl;
 const TU={uT:{value:0},uAn:{value:site.rm?0:1}},anims=[],glows=[],smokes=[],AOS=[];
 // brook east of the green (pilot: the village stream), water level at the wheel
 const riverX=z=>6.4+.7*Math.sin(z*.13+.6)+.3*Math.sin(z*.37);const WL=H(riverX(2.5),2.5)+.06;
 FA.PKI=FA.PKI||{value:new THREE.Matrix4()};FA.PKI.value.compose(new THREE.Vector3(site.x,y0,site.z),new THREE.Quaternion(),new THREE.Vector3(scl,scl,scl)).invert();
 const keep={};for(const k of['H','riverX','WL','SC','R','RV','TU','anims','glow','smoke','mover','AOS','lanes','hash','rng','smooth','PROROAD','PROFLORA','LOOK'])keep[k]=FA[k];
 Object.assign(FA,{H,riverX,WL,SC:near,R:ctx.renderer,RV:{x:1.5,z:0},TU,anims,hash,rng,smooth,AOS,lanes:[],mover:null,PROROAD:null,PROFLORA:null,LOOK:FA.LOOK||{},
  glow:(x,y,z,size,hex,k,an)=>{const h={x,y,z,size,c:lin(hex).multiplyScalar(k==null?.6:k),material:{opacity:1},an:an||null};glows.push(h);return h;},
  smoke:(x,y,z,period,phase,hex)=>{smokes.push({x,y,z,period,phase,c:new THREE.Color('#8E8A9A'),size:.9});}});
 let D=null;try{D=PK.build({});}finally{for(const k in keep)FA[k]=keep[k];}
 if(!D)throw new Error('procottage build failed');const tb=performance.now();
 // the pilot bonfire PointLight -> removed (glow point carries it)
 const lights=[];near.traverse(o=>{if(o.isLight)lights.push(o);});for(const l of lights)l.parent.remove(l);
 // the pilot village-green dirt disc (hard ring edge on the host terrain, vision r7) -> removed; the field ground paints a feathered green instead
 const dd=[];near.traverse(o=>{if(o.isMesh&&o.name==='pk_dirt')dd.push(o);});for(const o of dd)o.parent.remove(o);
 // ---- fields, hedgerows, haystacks, sheep, lanes, brook (pilot profarm / prostream / proroad stand-ins) ----
 const R2=rng((site.seed|0)||2031),KO=(D.keepOut||[]).slice(),PT=Parts(),mats=ctx.mats||{};const FR=RAD*1.32/scl;   // field reach (local units)
 const ph=[0,1,2,3].map(i=>hash((site.seed||7)*.11+i,3.3)*6.283),rOut=a=>FR*(1+.1*Math.sin(2*a+ph[0])+.07*Math.sin(3*a+ph[1])+.05*Math.sin(5*a+ph[2]));
 const ang=.32,ux=Math.cos(ang),uz=Math.sin(ang),PW=5.4,PD=2.2;const ty=['wheat','green','fallow','stubble','pasture','wheat','fallow','green'];   // r8 F: long strip fields (was 4.6 x 3.6 parcels)
 const CF={wheat:lin('#C09A48'),green:lin('#4C7A2C'),fallow:lin('#6A4A2E'),pasture:lin('#6C8A46'),stubble:lin('#A08E58')},MEAD=lin('#56603F'),DIRT=lin('#7A6446'),BANK=lin('#44523A'),HEDGE=lin('#26361F'),GRN=lin('#6A8A44');   // r8 F: stronger crop contrast (vision r7: fields invisible)
 const cellOf=(x,z)=>{const a=x*ux+z*uz,b=-x*uz+z*ux,i=Math.floor(a/PW+.5),j=Math.floor(b/PD+.5);return{i,j,a:a-i*PW,b:b-j*PD,cx:i*PW*ux-j*PD*uz,cz:i*PW*uz+j*PD*ux};};
 const inKO=(x,z,m)=>KO.some(k=>Math.hypot(x-k.x,z-k.z)<k.r+(m||0));
 const fieldAt=(x,z)=>{const c=cellOf(x,z),d=Math.hypot(c.cx+.5,c.cz),rr=Math.hypot(x,z);if(d<7||c.cx>riverX(c.cz)-3.4||rr>rOut(Math.atan2(z,x))*.96)return null;
  if(Math.hypot(c.cx-(D.mill?D.mill.x:-10.5),c.cz-(D.mill?D.mill.z:-8))<3.6)return null;if(inKO(c.cx,c.cz,.4))return null;const h=hash(c.i*1.7+3.1,c.j*2.3+.7);return{c,t:ty[(((c.j*3+c.i*5+(h>.7?1:0))%ty.length)+ty.length)%ty.length],h};};   // r8 F2: neighbouring strips always differ
 // lanes from the hamlet (procottage result) + the entrance track toward the road spur (keepA = spur end angle in the host frame)
 const lanes=(D.lanes||[]).slice(),ka=site.params&&site.params.keepA!=null?site.params.keepA:2.3;lanes.push([D.vx||0,D.vz||0,Math.cos(ka)*FR*1.05,Math.sin(ka)*FR*1.05]);
 // r8 F: dirt lanes also link neighbouring cottages (ring of door-to-door tracks, sorted by angle around the green)
 {const hs=(D.homes||[]).map(h=>({x:h.door.x,z:h.door.z,a:Math.atan2(h.door.z-(D.vz||0),h.door.x-(D.vx||0))})).sort((a,b)=>a.a-b.a);for(let i=0;i<hs.length;i++){const p=hs[i],q=hs[(i+1)%hs.length];if(Math.hypot(p.x-q.x,p.z-q.z)<6.5)lanes.push([p.x,p.z,q.x,q.z]);}}
 const laneD=(x,z)=>{let best=9;for(const l of lanes){const ax=l[2]-l[0],az=l[3]-l[1],ll=ax*ax+az*az||1;let t=((x-l[0])*ax+(z-l[1])*az)/ll;t=Math.max(0,Math.min(1,t));best=Math.min(best,Math.hypot(x-l[0]-ax*t,z-l[1]-az*t));}return best;};
 // ground: square grid draped on the terrain; vertex alpha feathers to 0 at a noise-warped edge and where the ground climbs the cliff
 let fv=0,fvt=0;{const N=92,E=FR*1.04,pos=[],col=[],idx=[],c=new THREE.Color();const hc=H(0,0);
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-E+2*E*i/N,z=-E+2*E*j/N,r=Math.hypot(x,z),a=Math.atan2(z,x),ro=rOut(a),h=H(x,z);
   const f=fieldAt(x,z);if(f){c.copy(CF[f.t]);const s=f.t==='pasture'?1:f.t==='fallow'||f.t==='green'?.9+.14*Math.sin(f.c.b*13+f.h*6):.94+.08*Math.sin(f.c.a*2.2+f.h*6);c.multiplyScalar(s*(.9+.2*f.h));
     const e=Math.max(Math.abs(f.c.a)/(PW/2),Math.abs(f.c.b)/(PD/2));if(e>.86)c.lerp(HEDGE,.45*smooth(.86,1,e));}
   else c.copy(MEAD).multiplyScalar(.94+.12*vn(x*.6,z*.6));
   const ld=laneD(x,z);if(ld<.75)c.lerp(DIRT,.85*smooth(.75,.3,ld));
   const bd=Math.abs(x-riverX(z));if(bd<1.6)c.lerp(BANK,.6*smooth(1.6,.6,bd));
   {const rq=r*(1+.3*(vn(x*1.7,z*1.7)-.5));if(rq<3.8)c.lerp(GRN,.7*smooth(3.8,2.6,rq));if(rq<1.4)c.lerp(DIRT,.6*smooth(1.4,.6,rq));}   // r8 F: village green (grass) with a worn centre
   for(const o of AOS){const d=Math.hypot(x-o.x,z-o.z);if(d<o.r*1.25)c.multiplyScalar(1-.35*(o.k||.4)*smooth(o.r*1.25,o.r*.4,d));}
   let al=1-smooth(.78,1,r/ro);al*=1-smooth(1.4,3.0,h-hc);   // feather: warped outer edge + no field on the cliff face
   if(f){fvt++;if(al>.5)fv++;}
   pos.push(x,h+.04,z);col.push(c.r,c.g,c.b,al);}
  // quads with all four corners at alpha 0 are dropped (the host turns alpha into the terrain colour; no square outline past the feather)
  const A=k=>col[k*4+3]>.01;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,d=a+N+1,e=d+1;if(A(a)||A(b)||A(d)||A(e))idx.push(a,d,b,b,d,e);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
  const gm=mats.ground||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
  const m=new THREE.Mesh(g,gm);m.name='rv_ground_fields';m.renderOrder=1;near.add(m);}
 // hedgerows + hedge trees on parcel borders (not every border), haystacks on fallow, sheep on pasture
 // r8 F: continuous hedgerows (low box runs, not balls) on every furlong border (3 strips) and on the strip ends, hedge trees on some
 {const seen=new Set(),foli=mats.foliage||mats.building,wood=mats.wood||mats.building,HC=[HEDGE.r*1.1,HEDGE.g*1.1,HEDGE.b*1.1];
  const hc0=H(0,0),onG=(x,z)=>H(x,z)-hc0<1.3&&Math.hypot(x,z)<rOut(Math.atan2(z,x))*.88;   // r8 F2: nothing on the cliff face / past the feather (stray cone on the lowland)
  const hedge=(x,z,len,along)=>{if(inKO(x,z,.2)||Math.abs(x-riverX(z))<1.4||!onG(x,z))return;const y=H(x,z),hh=.26+.1*hash(x,z),k=.85+.3*hash(z,x);
   PT.add(foli,PT.G.ico(1),x,y+hh*.3,z,along?len*.58:.19,hh,along?.19:len*.58,0,-ang,0,[HC[0]*k,HC[1]*k,HC[2]*k]);};   // lumpy continuous hedge (r8 F2: boxes read as battlements)
  for(let i=-7;i<=7;i++)for(let j=-14;j<=14;j++){const cx=i*PW*ux-j*PD*uz,cz=i*PW*uz+j*PD*ux,f=fieldAt(cx,cz);if(!f)continue;const k=i+','+j;if(seen.has(k))continue;seen.add(k);
   const hv=hash(i*3.1+.2,j*1.9+.5);
   if(((j%3)+3)%3===0)for(let s=-1;s<=1;s++){const a=s*PW/3,x=cx+ux*a+uz*PD/2,z=cz+uz*a-ux*PD/2;hedge(x,z,PW/3*.98,true);
     if(onG(x,z)&&hash(x*.7,z*.3)<.16){const y=H(x,z),ts=.6+.3*hash(z,x);PT.add(wood,PT.G.cyl(5,.7),x,y,z,.06,ts*.9,.06,0,0,0,[.12,.09,.06]);PT.add(foli,PT.G.ico(1),x,y+ts*1.05,z,.42*ts+.1,.45*ts,.42*ts+.1,0,0,0,[.07,.10,.05]);}}
   {const x=cx-ux*PW/2,z=cz-uz*PW/2;hedge(x,z,PD*.98,false);}
   if(f.t==='fallow'||f.t==='stubble'||f.t==='wheat'&&hv>.8){for(const a of[-1.6,0,1.6]){if(hash(a*5+i,j)<.4)continue;const x=cx+ux*a,z=cz+uz*a,y=H(x,z);if(!onG(x,z))continue;
     PT.add(wood,PT.G.cyl(9,.92),x,y-.02,z,.34,.4,.34,0,0,0,[.44,.30,.08]);PT.add(wood,PT.G.cone(9),x,y+.36,z,.36,.36,.36,0,0,0,[.44,.30,.08]);}}
   if(f.t==='pasture'){const n=2+((hv*7)|0)%3;for(let s=0;s<n;s++){const x=cx+ux*(hash(s,i)*4-2)-uz*(hash(j,s)*.9-.45),z=cz+uz*(hash(s,i)*4-2)+ux*(hash(j,s)*.9-.45),y=H(x,z),ry=hash(x,s)*6.3;if(!onG(x,z))continue;
     PT.add(foli,PT.G.box(),x,y+.1,z,.26,.17,.15,0,ry,0,[.30,.29,.26]);PT.add(foli,PT.G.box(),x+Math.cos(ry)*.16,y+.16,z-Math.sin(ry)*.16,.09,.09,.08,0,ry,0,[.12,.11,.10]);}}}}
 // brook: dark water ribbon along riverX (pilot prostream stand-in), alpha fades at both ends; banks of reeds
 {const pos=[],col=[],idx=[],W=.46,N=60,z0=-FR*.98,z1=FR*.98,wc=lin('#16203A');
  for(let s=0;s<=N;s++){const z=z0+(z1-z0)*s/N,x=riverX(z),u=s/N,al=Math.min(1,u/.14,(1-u)/.14),dz=(z1-z0)/N,dx=riverX(z+dz)-x,l=Math.hypot(dx,dz),nx=dz/l,nz=-dx/l,w=W*(1+.25*Math.sin(z*.4));
   for(const sd of[-1,1]){const X=x+nx*w*sd,Z=z+nz*w*sd,h=Math.max(H(X,Z),H(x,z));const hc=H(0,0),cl=1-smooth(1.4,3,h-hc);pos.push(X,Math.min(h,H(x,z))+.07,Z);col.push(wc.r,wc.g,wc.b,al*cl*.92);}}
  for(let s=0;s<N;s++){const a=s*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
  const wm=new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,depthWrite:false,roughness:.5,metalness:0,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});wm.name='rv_water';
  const m=new THREE.Mesh(g,wm);m.name='rv_brook';m.renderOrder=2;near.add(m);}
 const pst=PT.flush(near,'rv_parts');
 // glow + smoke draws (shared by both tiers through the clone; additive / alpha, not graded)
 const gp=glowPoints(glows,near,TU,ctx,scl,.9),sp=smokePoints(smokes,near,TU,ctx,scl,{k:.26,rise:2.6});
 // mark the pilot movers for the MID mirror (pk_wheelG / pk_sailsG end in 'G')
 const T=cloneTier(near,'reversion_mid',/^pk_oak$/);   // MID: the oak frame strips (22k tris) are sub-pixel at world zoom
 let tl=null;const r={near,mid:T.mid,TU,
  anim(t){const dt=tl==null?0:Math.max(0,Math.min(.2,t-tl));tl=t;TU.uT.value=t;for(const f of anims)f(t,dt);T.mirror();if(gp)gp.sync();if(sp)sp.sync();}};
 let tris=0,draws=0;near.traverse(m=>{if((m.isMesh||m.isPoints)&&m.geometry){draws++;const g=m.geometry,c=g.index?g.index.count/3:g.attributes.position.count/3;tris+=m.isPoints?0:c;}});
 r.stats={nearTris:Math.round(tris),nearDraws:draws,midTris:Math.round(tris),midDraws:draws,glows:glows.length,smokes:smokes.length,parts:pst,buildMs:+(tb-t0).toFixed(1),postMs:+(performance.now()-tb).toFixed(1),pk:PK.info,lightsRemoved:lights.length,fieldV:fv,fieldVT:fvt};
 const S=v=>({x:v.x*scl,y:H(v.x,v.z)*scl,z:v.z*scl});
 r.anchors={wheel:D.wheel&&S(D.wheel),windmill:D.mill&&S(D.mill),bridge:D.bridge&&S(D.bridge),green:{x:0,y:H(0,0)*scl,z:0}};
 return r;}};
})();
