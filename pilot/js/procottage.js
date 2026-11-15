// Futures Atlas v4.5 PILOT - procottage.js : Checkpoint C3. Procedural pre-industrial hamlet for Reversion (style=archviz only).
// Timber-frame cottages (thatch / stone slate / oak shingle), aisled barn, stone mill + undershot water wheel on a timber flume,
// post windmill with lattice sails, trestle bridge, well, carts, hay wagon, yard props, orchard. Fire light only.
// GPU-baked texture families (rgb albedo factor, a height) projected in world space; everything merged per material.
// Everything is generated in code; no external assets; no third-party code. Classic script, uses globals THREE + FA.
// Knobs: LOOK.pk = {alb, env, lit, share, green}. Fields / crops / parcels are NOT built here (profarm.js).
(function(){
'use strict';
const FA=window.FA;if(!FA||!window.THREE)return;
const L=FA.LOOK||{},C=h=>new THREE.Color(h),TAU=Math.PI*2;
const P=Object.assign({alb:1,env:.6,lit:1,share:.36,green:true},L.pk||{}); // C3: share .28 -> .36 (hash gave 20 % lit at .28; target ~28 %)
const PK=FA.PROCOTTAGE={info:{},uFlick:{value:1},build:build};
const UP=new THREE.Vector3(0,1,0),F=new THREE.Matrix4(),ML=new THREE.Matrix4(),MW=new THREE.Matrix4(),N3=new THREE.Matrix3();
const E=new THREE.Euler(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),VN=new THREE.Vector3(),S3=new THREE.Vector3();
const VB=new THREE.Vector3(),QB=new THREE.Quaternion(),EB=new THREE.Euler(),W1=[1,1,1];
let rnd=null,TEX=null,SETS=null,SET=null,gy=0,AOK=.45,TRIS=0,DRAWS=0,LIT=0,WINS=0,DL=1,DW=1;const M={},GC={},POST=[];
const col=(h,k)=>{const c=C(h);k=k==null?1:k;return[c.r*k,c.g*k,c.b*k];};
const tn=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
// palette (sRGB hexes -> linear vertex colours)
const PLA=col('#B9B2A2'),OAK=col('#4A3A2C'),OAKW=col('#54422F'),THA=col('#8B7550'),SLA=col('#4F5560'),SHI=col('#6A5A48'),STO=col('#7A7468');
const BRD=col('#6A5642'),CAN=col('#CFC6B0'),LOG=col('#5A4634'),WAT=col('#6E5C44'),SOIL=col('#3A3028'),LEAF=col('#4A5A40'),HAY=col('#9A8556');
const DARK=col('#0C0B0A'),IRON=col('#22211F'),DIRTC=col('#5A5046');

// ======================= (1) GPU texture bake (rgb = albedo factor <= 1, a = height) =======================
const BAKE_FS=[
'uniform int fam;varying vec2 vU;',
'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'float pn(vec2 p,vec2 q){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(mod(i,q)),h1(mod(i+vec2(1.,0.),q)),f.x),mix(h1(mod(i+vec2(0.,1.),q)),h1(mod(i+vec2(1.,1.),q)),f.x),f.y);}',
'void main(){vec2 u=vU;vec3 c=vec3(1.);float h=.5;',
// 0 lime plaster: mottle + faint vertical trowel streaks
' if(fam==0){float n=pn(u*6.,vec2(6.))*.45+pn(u*24.,vec2(24.))*.35+pn(u*90.,vec2(90.))*.2;float tr=pn(u*vec2(3.,40.),vec2(3.,40.));c=vec3(.8+.18*n)*(.96+.04*tr);h=n*.7+tr*.3;}',
// 1 oak: long grain + checks
' else if(fam==1){float g=pn(u*vec2(4.,60.),vec2(4.,60.))*.6+pn(u*vec2(12.,150.),vec2(12.,150.))*.4;float ck=smoothstep(.78,.9,pn(u*vec2(3.,26.),vec2(3.,26.)));c=vec3(.64+.36*g)*(1.-.4*ck);h=g*(1.-.8*ck);}',
// 2 thatch: combed strands running down the slope, 5 overlapping layers per tile
' else if(fam==2){float s=pn(u*vec2(110.,6.),vec2(110.,6.))*.55+pn(u*vec2(240.,14.),vec2(240.,14.))*.45;float l=fract(u.y*5.+.25*pn(u*vec2(8.,5.),vec2(8.,5.)));',
'  c=vec3(.6+.4*s)*mix(1.,.68,smoothstep(.7,1.,l))*mix(vec3(1.,.97,.9),vec3(.92,.95,1.),pn(u*4.,vec2(4.)));h=s*.5+(1.-l)*.5;}',
// 3 stone slate / shingle: 16 courses x 10 units, half-bond, per-slate tone, lap shadow
' else if(fam==3){vec2 g=u*vec2(10.,16.);float row=floor(g.y);g.x+=.5*mod(row,2.);vec2 id=mod(vec2(floor(g.x),row),vec2(10.,16.));vec2 f=fract(g);',
'  float jx=smoothstep(0.,.07,min(f.x,1.-f.x));float tone=.68+.32*h1(id+1.7);c=vec3(tone)*mix(.55,1.,jx)*mix(1.,.55,smoothstep(.8,1.,f.y))*(.94+.06*pn(u*50.,vec2(50.)));h=((1.-f.y)*.7+.3*h1(id+4.1))*jx;}',
// 4 rubble stone: wrapped cellular stones, dark recessed mortar
' else if(fam==4){vec2 q=vec2(7.,9.);vec2 p=u*q;vec2 ip=floor(p),fp=fract(p);float d1=9.,d2=9.;vec2 id=vec2(0.);',
'  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 cc=mod(ip+o,q);vec2 r=(o+vec2(h1(cc+.7),h1(cc+5.3))*.8+.1-fp)*vec2(1.,1.3);float d=dot(r,r);if(d<d1){d2=d1;d1=d;id=cc;}else if(d<d2){d2=d;}}',
'  float m=smoothstep(.04,.17,sqrt(d2)-sqrt(d1));c=vec3(.62+.38*h1(id+2.1))*mix(.42,1.,m)*(.9+.1*pn(u*40.,vec2(40.)));h=m*(.7+.3*pn(u*20.,vec2(20.)));}',
// 5 boards: 8 planks per tile, gaps, per-plank tone and grain
' else if(fam==5){float g=u.x*8.;float id=floor(g);float f=fract(g);float gap=smoothstep(0.,.08,min(f,1.-f));float gr=pn(vec2(u.x*64.,u.y*6.+h1(vec2(id,3.))*6.),vec2(64.,6.));',
'  c=vec3(.7+.3*h1(vec2(id,7.)))*(.86+.14*gr)*mix(.4,1.,gap);h=gap*(.6+.4*gr);}',
// 6 canvas weave
' else if(fam==6){float w=.5+.25*sin(u.x*402.124)+.25*sin(u.y*402.124);float st=pn(u*5.,vec2(5.));c=vec3(.84+.1*w+.06*st);h=w;}',
// 7 compacted dirt
' else{float n=pn(u*5.,vec2(5.))*.4+pn(u*20.,vec2(20.))*.35+pn(u*70.,vec2(70.))*.25;float pb=smoothstep(.72,.8,pn(u*34.,vec2(34.)));c=vec3(.72+.24*n)+.04*pb;h=n*.7+pb*.3;}',
' gl_FragColor=vec4(c,h);}'].join('\n');
function bake(){const t0=performance.now(),R=FA.R,sc=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const mat=new THREE.ShaderMaterial({uniforms:{fam:{value:0}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:BAKE_FS,depthTest:false,depthWrite:false});
 const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);q.frustumCulled=false;sc.add(q);const prev=R.getRenderTarget();TEX=[];
 [256,256,512,512,512,256,256,256].forEach((N,f)=>{const rt=new THREE.WebGLRenderTarget(N,N,{depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.RepeatWrapping,wrapT:THREE.RepeatWrapping,anisotropy:4});
  mat.uniforms.fam.value=f;R.setRenderTarget(rt);R.render(sc,cam);TEX.push(rt.texture);});
 R.setRenderTarget(prev);mat.dispose();q.geometry.dispose();PK.info.bakeMs=Math.round(performance.now()-t0);}

// ======================= (2) materials =======================
// world-space projection from vFogWP (patched fog chunks, as procity.js): u = distance along the horizontal face tangent, v = world y
// (so roof courses / thatch layers stay level on any building yaw); flat faces use xz. Height channel bumps the normal, fwidth-faded.
const WS_FRAG='#ifdef USE_FOG\n{vec3 nW=inverseTransformDirection(normal,viewMatrix);float tp=step(.93,abs(nW.y));vec2 tg=normalize(vec2(-nW.z,nW.x)+vec2(1e-4,0.));\n'+
 'vec2 q=mix(vec2(dot(vFogWP.xz,tg),vFogWP.y),vFogWP.xz,tp)*pkS.xy;vec4 tx=texture2D(pkT,q);float kk=smoothstep(.6,.12,max(fwidth(q.x),fwidth(q.y))*pkS.w);\n'+
 'diffuseColor.rgb*=pkC*mix(vec3(.84),tx.rgb,.35+.65*kk);roughnessFactor=clamp(roughnessFactor+(.5-tx.a)*pkX.x*kk+pkRV(pkX.y,vFogWP),.3,1.);\n'+
 'vec3 sX=dFdx(-vViewPosition),sY=dFdy(-vViewPosition);vec3 r1=cross(sY,normal),r2=cross(normal,sX);float det=dot(sX,r1);\n'+
 'vec2 dh=vec2(dFdx(tx.a),dFdy(tx.a))*pkS.z*kk;normal=normalize(abs(det)*normal-sign(det)*(dh.x*r1+dh.y*r2));}\n#else\ndiffuseColor.rgb*=pkC*.84;\n#endif\n';
// C4: patchy weathering on roughness (thatch: damp / moss / fresh patches at ~3 m), world-space value noise
const PKRV='float pkRH(vec2 p){return fract(sin(dot(p,vec2(41.3,17.9)))*4375.85);}float pkRV(float k,vec3 wp){if(k<=0.)return 0.;vec2 p=wp.xz*3.1+wp.y*1.7;vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);'+
 'float n=mix(mix(pkRH(i),pkRH(i+vec2(1.,0.)),f.x),mix(pkRH(i+vec2(0.,1.)),pkRH(i+vec2(1.,1.)),f.x),f.y);return (n-.5)*k*2.;}';
function ws(fam,tile,bump,freq,rough,o){o=o||{};const m=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,flatShading:true,roughness:rough,metalness:0,envMapIntensity:P.env});
 if(o.po){m.polygonOffset=true;m.polygonOffsetFactor=-o.po;m.polygonOffsetUnits=-2*o.po;}
 const U={pkT:{value:TEX[fam]},pkS:{value:new THREE.Vector4(1/tile,1/tile,bump,freq)},pkC:{value:new THREE.Vector3(1.12*P.alb,1.12*P.alb,1.12*P.alb)},pkX:{value:new THREE.Vector2(o.rv!=null?o.rv:.18,o.rb||0)}}; // C4: pkX = (strand roughness variation, patchy weathering)
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D pkT;uniform vec4 pkS;uniform vec3 pkC;uniform vec2 pkX;'+PKRV)
  .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+WS_FRAG);};
 m.customProgramCacheKey=()=>'pk_ws';return m;}
// window panes: dark glazing; vertex colour = (lit gain, phase, tint). Fire-light emissive flickers in the shader (uT), master gain uFlick.
function glazeMat(){const m=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.25,metalness:0,envMapIntensity:.9});
 const U={uT:FA.TU.uT,uAn:FA.TU.uAn||{value:1},pkF:PK.uFlick,pkL:{value:2.8*P.lit}}; // C3: 1.5 -> 2.1 (lit panes read ~10 % at close-up distance); C4: 2.1 -> 2.8 (owner: slightly stronger window glow)
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT,uAn,pkF,pkL;')
  .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n{float ph=vColor.g*6.2832;float fl=.8+.2*uAn*(sin(uT*7.3+ph*5.)*sin(uT*2.9+ph*3.)+.35*sin(uT*13.1+ph*9.));\n'+
   'totalEmissiveRadiance+=mix(vec3(1.,.27,.03),vec3(1.,.36,.07),vColor.b)*vColor.r*fl*pkF*pkL;diffuseColor.rgb=vec3(.02,.024,.032);}\n#endif\n');};
 m.customProgramCacheKey=()=>'pk_glaze';return m;}
function mats(){const std=o=>new THREE.MeshStandardMaterial(Object.assign({color:'#ffffff',vertexColors:true,flatShading:true,roughness:.85,metalness:0,envMapIntensity:P.env},o||{}));
 M.plaster=ws(0,1.6,.006,24,.9);M.oak=ws(1,.8,.008,12,.82);M.thatch=ws(2,1.2,.04,12,.93,{rv:.42,rb:.16});M.slate=ws(3,1.4,.02,16,.7);
 M.stone=ws(4,1.3,.03,9,.88);M.boards=ws(5,1.0,.012,8,.84);M.canvas=ws(6,.5,.003,20,.9);M.dirt=ws(7,2.5,.015,24,.96,{po:2});
 M.plain=std();M.spin=std({roughness:.82});M.glaze=glazeMat();}

// ======================= (3) geometry kit: everything is appended into per-material buckets =======================
function geo(key,mk){let g=GC[key];if(!g){g=mk();if(g.index)g=g.toNonIndexed();GC[key]=g;}return g;}
const gBox=()=>geo('box',()=>new THREE.BoxGeometry(1,1,1));
const gCyl=(s,rt)=>geo('cy'+s+'_'+rt,()=>new THREE.CylinderGeometry(rt,1,1,s));
const gIco=d=>geo('ico'+d,()=>new THREE.IcosahedronGeometry(1,d));
const gTor=()=>geo('tor',()=>new THREE.TorusGeometry(1,.07,4,20));
const gBarrel=()=>geo('brl',()=>new THREE.LatheGeometry([[.8,0],[1,.33],[1,.67],[.8,1]].map(p=>new THREE.Vector2(p[0],p[1])),8));
function gPrism(){return geo('prism',()=>{const A=[-.5,0,.5],B=[.5,0,.5],Cc=[0,1,.5],a=[-.5,0,-.5],b=[.5,0,-.5],c=[0,1,-.5];
 const t=[A,B,Cc, b,a,c, a,b,B, a,B,A, B,b,c, B,c,Cc, A,Cc,c, A,c,a],p=[];t.forEach(v=>p.push(v[0],v[1],v[2]));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;});}
const use=n=>{SET=SETS[n];AOK=n==='main'?.45:0;};
function setF(x,y,z,ry){F.makeRotationY(ry||0);F.setPosition(x,y,z);gy=y;}
const wpt=(x,y,z)=>new THREE.Vector3(x,y,z).applyMatrix4(F);
const dyl=(h,lx,lz)=>{const c=Math.cos(h.ry),s=Math.sin(h.ry);return FA.H(h.x+lx*c+lz*s,h.z-lx*s+lz*c)-h.g;};
// append geometry g (local transform inside the current frame F) to bucket bk with colour c x baked contact AO
function add(bk,g,x,y,z,c,rx,ry,rz,sx,sy,sz){const b=SET[bk]||(SET[bk]={p:[],n:[],c:[]});c=c||W1;
 ML.compose(V.set(x,y,z),Q.setFromEuler(E.set(rx||0,ry||0,rz||0)),S3.set(sx==null?1:sx,sy==null?1:sy,sz==null?1:sz));MW.multiplyMatrices(F,ML);N3.getNormalMatrix(MW);
 const p=g.attributes.position,n=g.attributes.normal,ao=AOK&&bk!=='glaze'?AOK:0;
 for(let i=0;i<p.count;i++){V.fromBufferAttribute(p,i).applyMatrix4(MW);VN.fromBufferAttribute(n,i).applyMatrix3(N3).normalize();
  const a=ao?1-ao*FA.smooth(.22,0,V.y-gy):1;b.p.push(V.x,V.y,V.z);b.n.push(VN.x,VN.y,VN.z);b.c.push(c[0]*a,c[1]*a,c[2]*a);}
 TRIS+=p.count/3;}
const box=(bk,w,h,d,x,y,z,c,rx,ry,rz)=>add(bk,gBox(),x,y,z,c,rx,ry,rz,w,h,d);                       // centred box
const cyl=(bk,r,h,x,y,z,c,s,rx,rz,rt)=>add(bk,gCyl(s||8,rt==null?1:rt),x,y,z,c,rx,0,rz,r,h,r);       // centred, axis y (rx/rz to lay it down)
function beam(bk,ax,ay,az,bx,by,bz,w,c,d){VB.set(bx-ax,by-ay,bz-az);const l=VB.length();QB.setFromUnitVectors(UP,VB.divideScalar(l));EB.setFromQuaternion(QB);
 box(bk,w,l,d||w,(ax+bx)/2,(ay+by)/2,(az+bz)/2,c,EB.x,EB.y,EB.z);}
// spoked wheel: rim torus + nsp through-spokes (= 2*nsp spokes) + hub; ax=0 axle along local z, ax=1 axle along local x
function wheel(bk,x,y,z,r,ax,nsp,c){add(bk,gTor(),x,y,z,c,0,ax?Math.PI/2:0,0,r,r,r);
 for(let k=0;k<nsp;k++){const a=k*Math.PI/nsp;if(ax)box(bk,r*.07,r*1.94,r*.09,x,y,z,c,a);else box(bk,r*.09,r*1.94,r*.07,x,y,z,c,0,0,a);}
 cyl(bk,r*.17,r*.34,x,y,z,tn(c,.8),8,ax?0:Math.PI/2,ax?Math.PI/2:0);}
// wall-face placer for the current body (DL x DW): (s along the face, y, w, h, lean, bucket, colour, thickness, outward offset)
const face=(ax,sg)=>(s,y,w,h,rot,bk,c,t,o)=>{t=t||.035;o=sg*((ax==='z'?DW:DL)/2+(o||0));
 if(ax==='z')box(bk||'oak',w,h,t,s,y,o,c||OAK,0,0,-(rot||0));else box(bk||'oak',t,h,w,o,y,s,c||OAK,rot||0);};
function mesh(set,bk,mat,parent,cast){const b=set[bk];if(!b||!b.p.length)return null;const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));
 g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.name='pk_'+bk;m.castShadow=cast!==false;m.receiveShadow=true;parent.add(m);DRAWS++;return m;}

// ======================= (4) building parts =======================
// oak frame on all four faces: sill, mid rail, top plate, posts, corner braces (thin proud strips)
function timber(y0,y1){const ym=(y0+y1)/2;for(const pr of[['z',DL],['x',DW]])for(const sg of[-1,1]){const f=face(pr[0],sg),len=pr[1],n=Math.max(2,Math.round(len/.48)),bw=len/n*.55,bh=ym-y0;
  f(0,y0+.03,len+.045,.06);f(0,y1-.03,len+.045,.06);f(0,ym,len,.04);
  for(let k=0;k<=n;k++)f(-len/2+len*k/n,ym,k%n?.045:.06,y1-y0);
  for(const s of[-1,1])f(s*(len/2-bw/2),y0+bh/2,.038,Math.hypot(bw,bh),Math.atan2(-s*bw,bh));}}
function gables(e,rh,bk,c,oak){for(const s of[-1,1]){add(bk,gPrism(),s*(DL/2-.03),e,0,c,0,Math.PI/2,0,DW,rh,.06);
  if(oak){box('oak',.035,rh*.78,.055,s*DL/2,e+rh*.39,0,OAK);box('oak',.035,.045,DW*.52,s*DL/2,e+rh*.42,0,OAK);}}}
// gable roof, ridge along local x: thatch = thick slabs + rounded eave rolls + ridge roll; slate/shingle = thin slabs + barge boards + ridge tiles
function roof(e,pit,bk,c,t,oh){const og=.1,m=(DW/2+oh)/2,sl=(DW/2+oh)/Math.cos(pit),yr=e+DW/2*Math.tan(pit),len=DL+2*og,yc=yr-m*Math.tan(pit)+t*.5/Math.cos(pit)-.01;
 for(const s of[-1,1]){box(bk,len,t,sl,0,yc,s*m,c,s*pit);
  if(bk==='thatch'){cyl(bk,t*.62,len,0,yr-2*m*Math.tan(pit)+t*.55,s*(2*m-.02),tn(c,.86),8,0,Math.PI/2);
   // C4 thatch craft: stepped eave courses (darker weathered drip edge), sedge ridge saddle with hazel liggers + spars
   const sp=Math.sin(pit),cp=Math.cos(pit),at=(u,v)=>[yc-sp*u+cp*v,s*(m+cp*u+sp*v)];let q;
   q=at(sl*.37,t*.72);box(bk,len+.05,t*.44,sl*.26,0,q[0],q[1],tn(c,.72),s*pit);
   q=at(sl*.14,t*.62);box(bk,len+.025,t*.24,sl*.22,0,q[0],q[1],tn(c,.88),s*pit);
   q=at(-sl*.37,t*.75);box(bk,len+.08,t*.5,sl*.27,0,q[0],q[1],tn(c,.64),s*pit);
   for(const u of[-sl*.44,-sl*.28]){q=at(u,t*1.02);box('oak',len+.08,.014,.016,0,q[0],q[1],tn(OAK,1.15),s*pit);}
   q=at(-sl*.36,t*1.0);for(let x=-len/2+.07;x<len/2-.03;x+=.14)box('oak',.012,.012,sl*.2,x,q[0],q[1],tn(OAK,1.1),s*pit);}
  else for(const g of[-1,1])box('oak',.03,.06,sl,g*len/2,yc-.03,s*m,OAK,s*pit);}
 if(bk==='thatch')cyl(bk,.085,len+.09,0,yr+t*1.15,0,tn(c,.6),8,0,Math.PI/2);else box(bk,len+.02,.07,.07,0,yr+t+.012,0,tn(c,.75),Math.PI/4);
 return yr;}
function door(f,s,dh,w,yb){w=w||.17;yb=yb==null?.12:yb;f(s,yb+dh/2,w,dh,0,'boards',tn(BRD,.8),.03,.012);
 f(s-w/2-.02,yb+dh/2,.04,dh+.04);f(s+w/2+.02,yb+dh/2,.04,dh+.04);f(s,yb+dh+.02,w+.12,.045);}
// small framed window: dark pane (lit 20-35 %, hashed by id) + proud oak frame, sill and mullions
function win(id,f,s,y,w,h,dark){const lit=!dark&&FA.hash(id*.731+3.1,id*1.37+7.7)<P.share;WINS++;if(lit){LIT++;if(CURH)CURH.lit=(CURH.lit||0)+1;}
 f(s,y,w,h,0,'glaze',[lit?.55+.45*FA.hash(id,3.3):0,FA.hash(id*1.3,9.1),FA.hash(id*2.1,1.7)],.012,.008);
 f(s,y+h/2+.012,w+.06,.03);f(s,y-h/2-.014,w+.08,.035);f(s-w/2-.012,y,.03,h);f(s+w/2+.012,y,.03,h);f(s,y,.014,h,0,'oak',OAK,.03);f(s,y,w,.012,0,'oak',OAK,.03);}
function chimney(x,z,top){box('stone',.24,top+.3,.2,x,(top-.3)/2,z,STO);box('stone',.3,.05,.26,x,top+.025,z,tn(STO,.8));box('stone',.15,.07,.12,x,top+.085,z,tn(STO,.55));}

// ======================= (5) cottages + yard extras =======================
const OBST=[];let CURH=null;
// C4 grounding: small front yards (45 % of cottages) - wattle-grey oak paling posts + two rails on three sides, gap at the door
function yard(h,i,ds){if(FA.hash(i*3.31,1.93)>.45)return;const z0=DW/2+.34,z1=DW/2+.92,x0=-DL/2-.04,x1=DL/2+.04,c=Math.cos(h.ry),s=Math.sin(h.ry),zc=(z0+z1)/2;
 const cx=h.x+zc*s,cz=h.z+zc*c;if(cx>FA.riverX(cz)-3.0)return;for(const o of OBST)if(o!==h&&Math.hypot(cx-o.x,cz-o.z)<(o.r||1.3)+.55)return;
 const PC=tn(OAKW,.95);let prev=null;const run=(ax,az,bx,bz,gap)=>{prev=null;const n=Math.max(1,Math.round(Math.hypot(bx-ax,bz-az)/.17));
  for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n;if(gap&&Math.abs(x-ds)<.2){prev=null;continue;}const y=dyl(h,x,z);
   box('oak',.022,.17+.02*FA.hash(x*9,z*7),.022,x,y+.07,z,PC);if(prev){for(const hy of[.06,.13])beam('oak',prev[0],prev[1]+hy,prev[2],x,y+hy,z,.012,PC);}prev=[x,y,z];}};
 run(x0,z1,x1,z1,true);run(x0,z0,x0,z1,false);run(x1,z0,x1,z1,false);}
function cottage(h,i){CURH=h;setF(h.x,h.g,h.z,h.ry);DL=h.L;DW=h.W;const e=h.e,th=h.roof===0,pit=th?.87:.74,id=i*16,pv=.88+.16*rnd();
 // C4: per-house limewash tint (white / ochre / pink / buff / straw) and a night factor (plaster read too bright at blue hour)
 const TW=[[1,1,1],[1.05,.96,.82],[1.04,.92,.87],[.95,.94,.90],[1.03,1,.84]],tw=TW[(FA.hash(i*1.73,4.21)*TW.length)|0],NK=(L.pc&&L.pc.mood!=='day')?.76:1,pc=[PLA[0]*pv*tw[0]*NK,PLA[1]*pv*tw[1]*NK,PLA[2]*pv*tw[2]*NK];
 // C4 grounding: deeper stone plinth (digs into the downhill side) + projecting plinth course
 let dmin=0;for(const a of[-1,1])for(const b of[-1,1])dmin=Math.min(dmin,dyl(h,a*DL/2,b*DW/2));const ph=.5+Math.max(0,-dmin-.3);
 box('stone',DL+.16,ph,DW+.16,0,.14-ph/2,0,tn(STO,.9+.2*rnd()));box('stone',DL+.21,.045,DW+.21,0,.125,0,tn(STO,.72));box('plaster',DL,e-.12,DW,0,(e+.12)/2,0,pc);timber(.14,e);
 const rc=th?tn(THA,.85+.25*rnd()):h.roof===1?tn(SLA,.9+.25*rnd()):tn(SHI,.85+.3*rnd()),rh=DW/2*Math.tan(pit);
 gables(e,rh,'plaster',pc,true);const yr=roof(e,pit,th?'thatch':'slate',rc,th?.13:.05,th?.15:.12);
 const fz=face('z',1),bz=face('z',-1),ds=(rnd()-.5)*DL*.3,wy=.14+(e-.14)*.68;let k=0;
 door(fz,ds,.3,.17,.14);box('stone',.32,.07,.13,ds,.105,DW/2+.165,tn(STO,.85));box('stone',.38,.2,.14,ds,-.035,DW/2+.30,tn(STO,.76)); // C4: two worn door steps
 yard(h,i,ds);
 for(const s of[-1,1]){const sx=ds+s*(.34+.1*rnd());if(Math.abs(sx)<DL/2-.14)win(id+k++,fz,sx,wy,.13,.15);}
 for(const s of[-.27,.27])win(id+k++,bz,s*DL,wy,.13,.15);
 const cs=rnd()<.5?-1:1;win(id+k++,face('x',-cs),DW*.2,wy,.12,.14);chimney(cs*(DL/2+.09),0,yr+.24);
 h.h=yr+.13;h.ds=ds;h.cs=cs;h.rc=rc;h.th=th;h.chim=wpt(cs*(DL/2+.09),yr+.34,0);h.door=wpt(ds,.3,DW/2+.3);
 FA.AOS.push({x:h.x,z:h.z,r:DL*.62+.3,k:.45,sq:true,ry:h.ry,sx:DL+.3,sz:DW+.3});extras(h);}
// lean-to porch, woodpile under the gable, bench, water butt, kitchen garden (all seeded)
function extras(h){const cs=h.cs,ds=h.ds,zf=DW/2;
 if(rnd()<.45){box(h.th?'thatch':'slate',.5,.045,.36,ds,.56,zf+.15,h.rc,.36);for(const s of[-1,1])box('oak',.04,.5,.04,ds+s*.21,.25,zf+.29,OAK);}
 if(rnd()<.6){const x0=-cs*(DL/2+.19);for(let r=0;r<3;r++)for(let c=0;c<6-r;c++)cyl('oak',.034,.3,x0,.05+r*.062,(c-2.5+r*.5)*.07,tn(LOG,.75+.5*rnd()),6,0,Math.PI/2);}
 if(rnd()<.5){const bx=ds+(ds>0?-1:1)*.42;box('boards',.34,.025,.11,bx,.25,zf+.09,BRD);for(const s of[-1,1])box('oak',.03,.25,.09,bx+s*.13,.12,zf+.09,OAK);}
 if(rnd()<.5){const x=cs*(DL/2-.12),z=zf+.11;add('boards',gBarrel(),x,.02,z,BRD,0,0,0,.08,.22,.08);cyl('plain',.066,.01,x,.225,z,DARK,8);}
 if(rnd()<.55)garden(h);}
// wattle-fenced kitchen garden behind the house, draped per segment on FA.H
function garden(h){const zc=-(DW/2+.85),c=Math.cos(h.ry),s=Math.sin(h.ry),gx=h.x+zc*s,gz=h.z+zc*c;
 if(gx>FA.riverX(gz)-3.3)return;for(const o of OBST)if(o!==h&&Math.hypot(gx-o.x,gz-o.z)<(o.r||1.3)+.9)return;
 const hw=.62,hd=.5,seg=(x0,z0,x1,z1)=>{const n=Math.max(1,Math.round(Math.hypot(x1-x0,z1-z0)/.31));for(let k=0;k<n;k++){const t=(k+.5)/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t,y=dyl(h,x,z);
   box('oak',x0===x1?.02:.3,.13,x0===x1?.3:.02,x,y+.085,z,tn(WAT,.8+.3*rnd()));box('oak',.028,.2,.028,x0+(x1-x0)*k/n,y+.09,z0+(z1-z0)*k/n,OAK);}};
 seg(-hw,zc-hd,hw,zc-hd);seg(-hw,zc+hd,.2,zc+hd);seg(-hw,zc-hd,-hw,zc+hd);seg(hw,zc-hd,hw,zc+hd);
 for(let b=-1;b<=1;b++){const z=zc+b*.3,y=dyl(h,0,z);box('plain',1.0,.06,.2,0,y+.02,z,SOIL);
  for(let k=0;k<6;k++)add('plain',gIco(0),-.42+k*.17,y+.07,z,tn(LEAF,.7+.5*rnd()),0,rnd()*3,0,.05,.04,.05);}
 OBST.push({x:gx,z:gz,r:1.0});h.gard={x:gx,z:gz};}

// ======================= (6) barn, carts, well, yard props =======================
function barn(b){setF(b.x,b.g,b.z,b.ry);DL=3.3;DW=2.1;const e=1.0,pit=.8,rh=DW/2*Math.tan(pit);
 box('stone',DL+.08,.4,DW+.08,0,-.04,0,STO);box('boards',DL,e-.14,DW,0,(e+.14)/2,0,tn(BRD,.9));timber(.16,e);gables(e,rh,'boards',tn(BRD,.8),true);
 b.h=roof(e,pit,'thatch',tn(THA,.9),.15,.2);const f=face('z',1);
 f(.24,.56,.47,.8,0,'plain',DARK,.012,.004);f(-.24,.56,.47,.8,0,'boards',tn(BRD,.7),.03,.012);f(-.24,.56,.5,.04,.9,'oak',OAK,.02,.03);
 box('boards',.47,.8,.03,.48-.235*Math.cos(.9),.56,DW/2+.02+.235*Math.sin(.9),tn(BRD,.7),0,.9);   // leaf ajar
 f(0,.99,1.1,.06);f(-.5,.56,.06,.84);f(.5,.56,.06,.84);
 const lx=-DL/2-.55;box('thatch',1.15,.09,1.7,lx,.74,0,tn(THA,.8),0,0,.38);for(const s of[-1,1])box('oak',.06,.8,.06,lx-.45,.2,s*.75,OAK);
 FA.AOS.push({x:b.x,z:b.z,r:2.4,k:.5,sq:true,ry:b.ry,sx:DL+.4,sz:DW+.4});const p=wpt(lx,0,.1);cart(p.x,p.z,b.ry+Math.PI/2,{});}
// cart {len, four (wagon), hay}: plank bed, side boards, axle(s), 8-spoke wheels, shafts
function cart(x,z,ry,o){setF(x,FA.H(x,z),z,ry);const l=o.len||.5,c=tn(BRD,.85+.2*rnd()),r=.11,xs=o.four?[-l*.32,l*.32]:[0];
 box('boards',l,.03,.26,0,.18,0,c);for(const s of[-1,1]){box('boards',l,.08,.016,0,.235,s*.13,c);box('boards',.016,.08,.26,s*l/2,.235,0,c);}
 for(const wx of xs){cyl('oak',.014,.38,wx,r,0,OAK,6,Math.PI/2);for(const s of[-1,1])wheel('oak',wx,r,s*.18,r,0,4,OAKW);}
 for(const s of[-1,1])beam('oak',l/2,.17,s*.09,l/2+.42,o.four?.17:.04,s*.09,.02,OAK);
 if(o.hay)add('plain',gIco(1),0,.33,0,HAY,0,0,0,l*.52,.17,.17);
 FA.AOS.push({x,z,r:l*.6+.15,k:.35});}
const WSC=new THREE.Matrix4().makeScale(.62,.62,.62); // C4: well was door-height (rim .3 = door .3); scaled to ~waist height vs the doors
function well(x,z){setF(x,FA.H(x,z),z,.4);F.multiply(WSC);cyl('stone',.21,.3,0,.08,0,STO,10);cyl('plain',.15,.01,0,.232,0,DARK,10);
 for(const s of[-1,1])box('oak',.04,.52,.04,s*.2,.34,0,OAK);cyl('oak',.022,.46,0,.42,0,OAKW,6,0,Math.PI/2);
 box('plain',.012,.09,.012,.24,.385,0,IRON);box('plain',.006,.16,.006,0,.34,0,HAY);cyl('boards',.035,.06,.1,.265,.12,BRD,6,0,0,1.2);
 DL=.46;DW=.4;roof(.58,.7,'slate',tn(SHI,.9),.035,.08);FA.AOS.push({x,z,r:.32,k:.45});}
function barrel(x,z,k){setF(x,FA.H(x,z),z,0);k=k||1;add('boards',gBarrel(),0,0,0,tn(BRD,.8+.3*rnd()),0,rnd()*3,0,.075*k,.18*k,.075*k);cyl('boards',.06*k,.012,0,.18*k,0,tn(BRD,.7),8);}
function sack(x,z){setF(x,FA.H(x,z),z,0);add('canvas',gIco(1),0,.06,0,tn(CAN,.6+.2*rnd()),0,rnd()*3,.2,.075,.08,.055);}
function lumber(x,z,ry){setF(x,FA.H(x,z),z,ry);for(let r=0;r<3;r++)for(let c=0;c<4-r;c++)box('boards',.8,.035,.07,(rnd()-.5)*.06,.03+r*.04,(c-1.5+r*.5)*.085,tn(BRD,.8+.4*rnd()));FA.AOS.push({x,z,r:.5,k:.3});}
function stone(x,z){setF(x,FA.H(x,z),z,rnd()*3);cyl('stone',.1+.05*rnd(),.04,0,.012,0,tn(STO,.7+.3*rnd()),7,0,0,.85);}
function tree(x,z){setF(x,FA.H(x,z),z,rnd()*6);const s=.85+.4*rnd();cyl('oak',.03*s,.36*s,0,.16*s,0,LOG,5,0,0,.7);add('plain',gIco(1),0,.52*s,0,tn(LEAF,.75+.4*rnd()),0,0,0,.3*s,.26*s,.3*s);FA.AOS.push({x,z,r:.45*s,k:.3});}

// ======================= (7) mill house, flume, undershot wheel, foam =======================
function mill(m){setF(m.x,m.g,m.z,0);DL=1.6;DW=1.5;const e=.85,pit=.74,rh=DW/2*Math.tan(pit);
 box('stone',DL,e+.6,DW,0,(e-.6)/2,0,STO);gables(e,rh,'stone',STO,false);m.h=roof(e,pit,'slate',SLA,.05,.12);
 const f=face('z',1);door(f,-.3,.3,.18,.08);win(900,f,.35,.5,.13,.15);win(901,face('z',-1),0,.5,.13,.15);win(902,face('x',-1),0,.5,.13,.15);
 chimney(-(DL/2+.09),0,m.h+.22);m.chim=wpt(-(DL/2+.09),m.h+.32,0);FA.AOS.push({x:m.x,z:m.z,r:1.4,k:.5,sq:true,ry:0,sx:DL+.3,sz:DW+.3});}
// stone piers + bearing blocks, timber flume walls on posts, sluice frame with raised gate; wheel group spins about its axle (local x)
function waterwheel(w){const WL=FA.WL,ay=.62,R=.82;setF(w.x,WL,w.z,0);
 for(const s of[-1,1]){box('stone',.2,1.2,.36,s*.44,ay-.67,0,STO);box('oak',.17,.1,.16,s*.44,ay-.02,0,OAK);
  box('boards',.03,.5,2.9,s*.31,-.1,-.2,BRD);for(let z=-1.6;z<=1.21;z+=.7)box('oak',.05,.8,.05,s*.345,-.05,z,OAK);
  box('oak',.06,1.0,.06,s*.345,.3,-1.35,OAK);}
 box('oak',.8,.06,.06,0,.8,-1.35,OAK);box('boards',.58,.26,.025,0,.5,-1.35,tn(BRD,.8));
 use('wheel');F.identity();
 for(const s of[-1,1]){add('spin',gTor(),s*.16,0,0,OAKW,0,Math.PI/2,0,R,R,R);for(let k=0;k<5;k++)box('spin',.045,R*1.96,.055,s*.16,0,0,OAK,k*Math.PI/5);}
 for(let k=0;k<20;k++){const a=k*TAU/20;box('spin',.44,.22,.022,0,(R-.06)*Math.cos(a),(R-.06)*Math.sin(a),tn(BRD,.75+.3*FA.hash(k,2.2)),a);}
 cyl('spin',.1,.46,0,0,0,OAK,8,0,Math.PI/2);cyl('spin',.035,1.9,-.4,0,0,tn(OAK,.7),6,0,Math.PI/2);use('main');
 const g=new THREE.Group();g.name='pk_wheelG';g.position.set(w.x,WL+ay,w.z);mesh(SETS.wheel,'spin',M.spin,g);FA.SC.add(g);
 FA.anims.push(T=>{g.rotation.x=-T*.9;});foam(w.x,WL+.035,w.z);}
// white water downstream of the paddles: one small plane, scrolling noise in the fragment shader (uT)
function foam(x,y,z){const g=new THREE.PlaneGeometry(.56,1.7);g.rotateX(-Math.PI/2);
 const m=new THREE.ShaderMaterial({uniforms:{uT:FA.TU.uT},transparent:true,depthWrite:false,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT;varying vec2 vU;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
   'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}\n'+
   'void main(){vec2 u=vU;float a=n(vec2(u.x*7.,u.y*5.+uT*1.6))*.6+n(vec2(u.x*15.,u.y*11.+uT*2.6))*.4;\n'+
   'float m=smoothstep(0.,.25,u.x)*smoothstep(1.,.75,u.x)*smoothstep(1.,.9,u.y)*u.y;gl_FragColor=vec4(vec3(.17,.20,.38),smoothstep(.42,.72,a)*m*.85);\n#include <encodings_fragment>\n}'});
 const me=new THREE.Mesh(g,m);me.position.set(x,y,z+.75);me.renderOrder=2;FA.SC.add(me);DRAWS++;TRIS+=2;}

// ======================= (8) post windmill (sails face local +x) =======================
function windmill(w){setF(w.x,w.g,w.z,w.ry);cyl('stone',.78,.75,0,.2,0,STO,14);cyl('slate',.92,.36,0,.75,0,SLA,14,0,0,.22);cyl('oak',.1,.8,0,1.15,0,OAK,8);
 DL=1.6;DW=1.25;const y0=1.2,e=3.15,pit=.75,rh=DW/2*Math.tan(pit);box('boards',DL,e-y0,DW,0,(e+y0)/2,0,BRD);
 for(const pr of[['z',DL],['x',DW]])for(const sg of[-1,1]){const f=face(pr[0],sg);for(const y of[y0+.04,(y0+e)/2,e-.04])f(0,y,pr[1]+.05,.07);for(const s of[-1,1])f(s*pr[1]/2,(y0+e)/2,.07,e-y0);}
 gables(e,rh,'boards',tn(BRD,.85),false);roof(e,pit,'boards',tn(BRD,.7),.05,.1);
 win(950,face('z',1),.2,2.6,.13,.15,true);win(951,face('z',-1),.2,2.6,.13,.15,true);win(952,face('x',1),0,2.2,.13,.15,true);
 door(face('x',-1),0,.34,.18,y0+.06);
 const yl=dyl(w,-1.55,0),yt=dyl(w,-2.5,0);for(const s of[-1,1])beam('oak',-1.55,yl,s*.1,-.82,y0+.06,s*.1,.03,OAK);
 for(let k=1;k<7;k++){const t=k/7;box('oak',.03,.02,.2,-1.55+.73*t,yl+(y0+.06-yl)*t,0,OAK);}
 beam('oak',-.8,y0+.15,0,-2.5,yt+.3,0,.07,OAK);wheel('oak',-2.5,yt+.14,0,.14,1,3,OAKW);
 beam('oak',.5,3.3,0,1.32,3.415,0,.1,OAK);FA.AOS.push({x:w.x,z:w.z,r:1.5,k:.5});sails(w);}
// 4 lattice sails (stock, 12 bars, 3 laths); two with spread canvas, two furled; group spins about the tilted windshaft (local z)
function sails(w){use('sails');
 for(let k=0;k<4;k++){F.makeRotationZ(k*Math.PI/2);box('spin',.055,2.0,.055,0,1.0,0,OAK);
  for(let j=0;j<12;j++)box('spin',.36,.02,.02,.2,.42+j*.138,.012,OAKW);for(const x of[.13,.26,.375])box('spin',.02,1.56,.02,x,1.18,.012,OAKW);
  if(k%2===0)box('spin',.33,1.5,.008,.205,1.18,-.006,tn(CAN,.62));else box('spin',.06,1.5,.035,.06,1.18,-.012,tn(CAN,.55));}
 F.identity();cyl('spin',.1,.2,0,0,0,OAK,8,Math.PI/2);use('main');setF(w.x,w.g,w.z,w.ry);
 const hp=wpt(1.3,3.412,0),g=new THREE.Group();g.name='pk_sailsG';g.position.copy(hp);g.rotation.order='YXZ';g.rotation.set(-.14,w.ry+Math.PI/2,0);
 mesh(SETS.sails,'spin',M.spin,g);FA.SC.add(g);FA.anims.push(T=>{g.rotation.z=T*.55;});w.tip=hp.y+2-w.g;}

// ======================= (9) trestle bridge, green, bonfire =======================
function bridge(b){const WL=FA.WL,yb=Math.max(FA.H(b.x-2.7,b.z),FA.H(b.x+2.7,b.z)),yd=Math.max(WL+.7,Math.min(WL+1.1,yb+.06));setF(b.x,0,b.z,0);gy=WL-.3;
 // C4: deck narrowed .92 -> .62, rails .42 -> .26 high, 30 -> 64 planks (plank / rail scale was 2-3x the door scale)
 for(const s of[-1,1]){box('oak',5.3,.07,.07,0,yd-.075,s*.21,OAK);box('oak',5.2,.035,.035,0,yd+.26,s*.30,OAK);box('oak',5.2,.022,.022,0,yd+.14,s*.30,OAK);
  for(let x=-2.4;x<=2.41;x+=.6)box('oak',.035,.32,.035,x,yd+.12,s*.30,OAK);
  const xe=s*3.5,ye=FA.H(b.x+xe,b.z);beam('boards',s*2.6,yd-.02,0,xe,ye+.01,0,.03,tn(BRD,.8),.6);}
 for(let k=0;k<64;k++)box('boards',5.2/64-.01,.025,.62+.03*(rnd()-.5),-2.6+(k+.5)*5.2/64,yd-.022,0,tn(BRD,.72+.38*rnd()));
 for(const x of[-1.8,-.6,.6,1.8]){for(const s of[-1,1])beam('oak',x,yd-.12,s*.21,x,WL-.7,s*.38,.06,OAK);box('oak',.08,.06,.74,x,yd-.145,0,OAK);beam('oak',x,yd-.2,-.24,x,WL+.05,.32,.03,OAK);}
 b.y=yd;}
function green(vx,vz){F.identity();gy=-99;
 if(P.green&&!FA.PROROAD){let g=new THREE.RingGeometry(.02,2.7,22,4);g.rotateX(-Math.PI/2);g=g.toNonIndexed();const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),k=1+.25*(FA.hash(Math.round(Math.atan2(z,x)*7)+.5,3.7)-.5)*Math.hypot(x,z)/2.7,wx=vx+x*k,wz=vz+z*k;p.setXYZ(i,wx,FA.H(wx,wz)+.05,wz);}
  add('dirt',g,0,0,0,tn(DIRTC,.6));}
 for(let k=0;k<9;k++){const a=.6+k*.09,d=1.2+k*.42;stone(vx+Math.cos(a)*d+(rnd()-.5)*.2,vz+Math.sin(a)*d+(rnd()-.5)*.2);}}
// the only real point light: small radius, flickering (pure function of T)
function bonfire(x,z){const y=FA.H(x,z);setF(x,y,z,0);
 for(let k=0;k<6;k++){const a=k*TAU/6+.3;beam('oak',Math.cos(a)*.2,0,Math.sin(a)*.2,Math.cos(a+2.6)*.03,.36,Math.sin(a+2.6)*.03,.035,tn(LOG,.5+.3*rnd()));}
 for(let k=0;k<8;k++){const a=k*TAU/8;cyl('stone',.05,.05,Math.cos(a)*.3,.02,Math.sin(a)*.3,tn(STO,.6),6);}
 for(const a of[.4,2.5,4.4])cyl('oak',.06,.5,Math.cos(a)*.85,.06,Math.sin(a)*.85,LOG,7,Math.PI/2);
 const bf=new THREE.PointLight('#FF9548',1.3,8,2);bf.position.set(x,y+.7,z);FA.SC.add(bf);const bg=FA.glow(x,y+.42,z,1.0,'#FF8438',.34);
 FA.anims.push(T=>{const f=.8+.2*Math.sin(T*11)*Math.sin(T*4.3);bf.intensity=1.3*f;bg.material.opacity=f;});FA.AOS.push({x,z,r:.6,k:.4});}

// ======================= (10) layout, props, light, build =======================
function layout(c,vx,vz){const z0=vz+2.5,rx0=FA.riverX(z0),bz=vz-7.5,D={vx,vz};
 D.mill={x:rx0-3.35,z:z0};D.wheel={x:rx0-1.7,z:z0};
 // C3 fix: the wheel stood on the bank shelf (paddle bottom WL-.2 sat .2 below the bed). Step it toward the channel until the bed under the
 // whole paddle width is below WL-.3 (bottom paddles in water, clear of the bed), and keep the mill house 1.65 behind it on dry ground.
 {const bed=x=>Math.max(FA.H(x-.3,z0),FA.H(x,z0),FA.H(x+.3,z0),FA.H(x,z0-.6),FA.H(x,z0+.6));let x=D.wheel.x;while(x<rx0-.5&&bed(x)>FA.WL-.3)x+=.05;D.wheel.x=x;
  let mx=x-1.65;while(mx>x-2.6&&FA.H(mx,z0)<FA.WL+.12)mx-=.05;D.mill.x=mx;}
 D.mill.g=FA.H(D.mill.x,z0);
 D.barn={x:vx-8.2,z:vz+3.4};D.barn.ry=Math.atan2(vx-D.barn.x,vz-D.barn.z);D.barn.g=FA.H(D.barn.x,D.barn.z);
 D.wind={x:c.x-12,z:c.z-8,ry:-.6};D.wind.g=FA.H(D.wind.x,D.wind.z);D.bridge={x:FA.riverX(bz),z:bz};D.fire={x:vx+2.2,z:vz+2.6};
 OBST.length=0;OBST.push({x:D.mill.x,z:z0,r:1.7},{x:D.wheel.x,z:z0,r:1.3},{x:D.barn.x,z:D.barn.z,r:2.5},{x:D.fire.x,z:D.fire.z,r:1.0},{x:vx-3.2,z:vz+4.2,r:.9},
  {x:vx+1.25,z:vz-11,r:2.9},{x:D.bridge.x-3,z:bz,r:1.2},{x:vx,z:vz,r:2.6});
 D.homes=[];for(let i=0;i<11;i++)for(let t=0;t<14;t++){const a=i/11*TAU+rnd()*.35+.2+t*.21,rr=3.9+rnd()*3.1;let x=vx+Math.cos(a)*rr*1.2;const z=vz+Math.sin(a)*rr;
   const lim=FA.riverX(z)-3.6;if(x>lim)x=lim-rnd()*.8;if(OBST.some(o=>Math.hypot(x-o.x,z-o.z)<(o.r||1.3)+1.15))continue;
   const h={x,z,r:1.3,g:FA.H(x,z),ry:Math.atan2(vx-x,vz-z)+(rnd()-.5)*.5,L:1.5+rnd()*.5,W:1.1+rnd()*.3,e:.56+rnd()*.16,roof:rnd()<.6?0:rnd()<.5?1:2};D.homes.push(h);OBST.push(h);break;}
 return D;}
function props(D){const vx=D.vx,vz=D.vz,m=D.mill,b=D.barn,sx=Math.sin(b.ry),sz=Math.cos(b.ry);
 for(const h of D.homes)if(rnd()<.6){const c=Math.cos(h.ry),s=Math.sin(h.ry),lx=h.cs*(h.L/2+.2),x=h.x+lx*c+.32*s,z=h.z-lx*s+.32*c;if(rnd()<.5)barrel(x,z);else sack(x,z);}
 sack(m.x-1.1,m.z+1.0);sack(m.x-1.3,m.z+.85);sack(m.x-1.15,m.z+.7);barrel(m.x-1.05,m.z-.6,1.2);barrel(m.x-1.25,m.z-.75);cart(m.x-1.5,m.z+1.7,1.2,{});
 cart(vx-1.6,vz+1.9,.5,{len:.78,four:true,hay:true});cart(b.x+sx*2.1+.6,b.z+sz*2.1,b.ry+.4,{hay:true});
 barrel(b.x+sx*1.3-sz*.9,b.z+sz*1.3+sx*.9);barrel(b.x+sx*1.3-sz*1.1,b.z+sz*1.3+sx*1.1,1.15);
 lumber(D.fire.x+1.3,D.fire.z+.6,.5);lumber(D.wind.x-.4,D.wind.z+2.1,.4);
 for(let i=0;i<4;i++)for(let j=0;j<3;j++){const x=vx-1+i*1.5+(rnd()-.5)*.3,z=vz-9.5-j*1.5+(rnd()-.5)*.3;if(x<FA.riverX(z)-2.2)tree(x,z);}}
// two small door glows (shader breath, no CPU), smoke from 3 cottage chimneys + the mill (7 puffs each, staggered)
// C4: + warm ground pools (fire light at lit doors / the bonfire) handed to proroad's single additive pool mesh
function lights(D){let n=0;const PO=[];D.homes.forEach((h,i)=>{if(i%4===1&&n<3){n++;FA.glow(h.door.x,h.door.y+.02,h.door.z,.42,'#FF9040',.26,[.14,3+2*FA.hash(i,1.1),i*1.7,0]);PO.push([h.door.x,h.door.z,.62,.30]);}
  else if(h.lit>0)PO.push([h.door.x,h.door.z,.42,.10+.05*Math.min(2,h.lit)]);});
 PO.push([D.fire.x,D.fire.z,1.5,.36]);if(FA.PROROAD)FA.PROROAD.pools=PO;
 const ch=D.homes.filter((h,i)=>i%2===0).slice(0,3).map(h=>h.chim);ch.push(D.mill.chim);
 ch.forEach((p,j)=>{for(let k=0;k<7;k++)FA.smoke(p.x,p.y,p.z,5.5+j*.7,k/7+j*.13,'#C9C5D0');});}
function result(D){const vx=D.vx,vz=D.vz,b=D.barn,lanes=[],KO=[];
 D.homes.forEach(h=>{lanes.push([vx,vz,h.door.x,h.door.z]);KO.push({x:h.x,z:h.z,r:1.6});if(h.gard)KO.push({x:h.gard.x,z:h.gard.z,r:1.1});});
 lanes.push([vx,vz,D.mill.x-.3,D.mill.z+1.2],[vx,vz,D.bridge.x-2.7,D.bridge.z],[vx,vz,D.wind.x,D.wind.z],[vx,vz,b.x+Math.sin(b.ry)*1.6,b.z+Math.cos(b.ry)*1.6]);
 if(FA.lanes)for(const l of lanes)FA.lanes.push(l);
 KO.push({x:b.x,z:b.z,r:2.9},{x:D.mill.x,z:D.mill.z,r:1.9},{x:D.wheel.x,z:D.wheel.z,r:1.4},{x:D.wind.x,z:D.wind.z,r:2.8},{x:D.bridge.x-3,z:D.bridge.z,r:1.4},{x:vx,z:vz,r:2.9},{x:vx+1.25,z:vz-11,r:3.2});
 return{vx,vz,homes:D.homes.map(h=>({x:h.x,z:h.z,h:h.h,ry:h.ry,door:{x:h.door.x,z:h.door.z},lit:h.lit||0})),wheel:{x:D.wheel.x,z:D.wheel.z},mill:{x:D.wind.x,z:D.wind.z},millHouse:{x:D.mill.x,z:D.mill.z},
  barn:{x:b.x,z:b.z,ry:b.ry},bridge:{x:D.bridge.x,z:D.bridge.z,y:D.bridge.y},lanes,keepOut:KO};}
function build(opts){const t0=performance.now();
 try{const c=FA.RV,vx=c.x-1.5,vz=c.z;rnd=FA.rng(2031);SETS={main:{},wheel:{},sails:{}};TRIS=DRAWS=LIT=WINS=0;
  bake();mats();use('main');const D=layout(c,vx,vz);
  green(vx,vz);well(vx,vz);bonfire(D.fire.x,D.fire.z);D.homes.forEach((h,i)=>cottage(h,i));barn(D.barn);mill(D.mill);waterwheel(D.wheel);windmill(D.wind);bridge(D.bridge);
  props(D);lights(D);
  for(const bk in SETS.main)mesh(SETS.main,bk,M[bk],FA.SC,bk!=='dirt');
  const out=result(D);
  Object.assign(PK.info,{draws:DRAWS,tris:Math.round(TRIS),homes:D.homes.length,lit:LIT,windows:WINS,sailTip:+D.wind.tip.toFixed(2),buildMs:Math.round(performance.now()-t0)});
  return out;}
 catch(e){(window.__errs=window.__errs||[]).push('procottage:'+(e&&e.message));return null;}}
})();
