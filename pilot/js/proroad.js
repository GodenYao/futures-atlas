// Futures Atlas v4.5 PILOT - proroad.js : Checkpoint C4. Reversion lane network (style=archviz only). Our own code, no assets.
// Meandering packed-earth cart lanes in warm ochre: two wheel ruts, scattered gravel, a few puddles (dark glossy, sky sheen),
// soft irregular edges fading into grass with verge weeds, width variation, draped on the terrain and nudged around steep
// ground and buildings. Cobbles in the village core (plaza disc + the lanes inside r ~5). Lanes link the south-west entrance,
// plaza, mill, both bridge landings, the windmill track, the barn, every cottage door and a few field gates.
// Also: warm ground light pools (doors / lanterns / bonfire, additive, 1 draw). Draws: lanes 1, weeds 1, gravel 1, pools 1, gates (static merge).
// API: FA.PROROAD.plan(PKV) before profarm (returns polylines so the fields keep clear), FA.PROROAD.finish() after profarm.
(function(){
'use strict';
const FA=window.FA;if(!FA||!window.THREE)return;
const L=FA.LOOK;if(!L.archviz)return;
const C=h=>new THREE.Color(h),TAU=Math.PI*2,H=(x,z)=>FA.H(x,z);
const RD=FA.PROROAD={plan,finish,info:{},polys:[],lanterns:[],pools:[]};
const lin=h=>{const c=C(h);return 'vec3('+c.r.toFixed(4)+','+c.g.toFixed(4)+','+c.b.toFixed(4)+')';};
const segD=(x,z,a,b,c,d)=>{const ax=c-a,az=d-b,ll=ax*ax+az*az||1;let t=((x-a)*ax+(z-b)*az)/ll;t=Math.max(0,Math.min(1,t));return Math.hypot(x-a-ax*t,z-b-az*t);};
let S=null,KO=[],LANES=[],rnd=null,PL={x:0,z:0,r:2.9};

// ---------------- routing ----------------
function spaced(ctrl,step){const cu=new THREE.CatmullRomCurve3(ctrl.map(p=>new THREE.Vector3(p[0],0,p[1])),false,'centripetal');const n=Math.max(2,Math.ceil(cu.getLength()/step));return cu.getSpacedPoints(n).map(v=>[v.x,v.z]);}
function nrm(P,i){const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;return[-dz/l,dx/l];}
// perpendicular meander, zero at both ends (lanes land exactly on their nodes)
function meander(P,amp,freq,seed){let s=0;return P.map((p,i)=>{if(i)s+=Math.hypot(p[0]-P[i-1][0],p[1]-P[i-1][1]);const t=i/(P.length-1),env=Math.sin(Math.PI*t),n=nrm(P,i);
  const o=amp*env*(FA.fbm(s*freq+seed,seed*.37+1.3,2)-.5)*2.2;return[p[0]+n[0]*o,p[1]+n[1]*o];});}
// follow the terrain: each interior point may slide sideways to flatter ground and out of buildings / the river; then smooth
function relax(P,ends,it){const a=P[0],b=P[P.length-1];const ko=KO.filter(k=>Math.hypot(a[0]-k.x,a[1]-k.z)>k.r+.2&&Math.hypot(b[0]-k.x,b[1]-k.z)>k.r+.2);
 const cost=(x,z,o)=>{let c=FA.slope(x,z)*2.2+Math.abs(o)*.35;for(const k of ko){const d=Math.hypot(x-k.x,z-k.z);if(d<k.r+.35)c+=6*(1-d/(k.r+.35))+2;}if(x>FA.riverX(z)-1.6&&!ends.river)c+=8;if(H(x,z)<FA.WL+.12)c+=6;return c;};
 for(let r=0;r<(it||3);r++){P=P.map((p,i)=>{if(i<2||i>P.length-3)return p;const n=nrm(P,i);let best=p,bc=1e9;for(const o of[-.45,-.22,0,.22,.45]){const x=p[0]+n[0]*o,z=p[1]+n[1]*o,c=cost(x,z,o);if(c<bc){bc=c;best=[x,z];}}return best;});
  for(let s=0;s<2;s++)P=P.map((p,i)=>(i<2||i>P.length-3)?p:[(P[i-1][0]+2*p[0]+P[i+1][0])/4,(P[i-1][1]+2*p[1]+P[i+1][1])/4]);}
 return P;}
// lane = {P, w (half width), k (0 earth lane, 1 grassy track), fade0/fade1 (taper at the ends)}
function lane(ctrl,w,o){o=o||{};let P=spaced(ctrl,.3);const len=(P.length-1)*.3;P=meander(P,o.amp!=null?o.amp:Math.min(.9,.05*len+.15),o.freq||.16,o.seed||rnd()*40);P=relax(P,o,o.it);P=spaced(P,.22);
 const ln={P,w,k:o.k||0,fade0:o.fade0||0,fade1:o.fade1||0,kind:o.kind||'lane'};LANES.push(ln);return ln;}
const rim=(tx,tz,r)=>{const dx=tx-PL.x,dz=tz-PL.z,l=Math.hypot(dx,dz)||1;return[PL.x+dx/l*(r||PL.r-.5),PL.z+dz/l*(r||PL.r-.5)];};
function nearestOn(x,z,skipDoor){let best=null,bd=1e9;for(const l of LANES){if(skipDoor&&l.kind==='door')continue;for(let i=0;i<l.P.length;i+=2){const p=l.P[i],d=Math.hypot(p[0]-x,p[1]-z);if(d<bd){bd=d;best=p;}}}return[best,bd];}

function plan(pkv){S=pkv;rnd=FA.rng(4711);LANES.length=0;RD.lanterns.length=0;const c=FA.RV,vx=S.vx,vz=S.vz;PL={x:vx,z:vz,r:2.9};
 KO=S.keepOut.filter(k=>!(Math.abs(k.x-vx)<.01&&Math.abs(k.z-vz)<.01));
 const b=S.bridge,W=[b.x-3.5,b.z],E=[b.x+3.5,b.z];
 // 1 entrance road from the south-west (the old data-layer stub route), widest
 lane([[c.x-46,c.z+80],[c.x-24,c.z+38],[c.x-11,c.z+16],[vx-5.6,vz+5.0],rim(vx-3.2,vz+4.2,PL.r-.3)],.36,{amp:1.4,freq:.07,it:4,fade0:6,seed:3});
 // 2 plaza -> bridge west landing (straight run onto the deck), deck, east landing -> on along the far bank
 lane([rim(W[0],W[1]),[(vx+W[0])/2+.6,(vz+W[1])/2+.4],[W[0]-1.3,W[1]+.05],W],.27,{seed:11});
 lane([E,[E[0]+1.2,E[1]-.05],[E[0]+3.6,E[1]-1.6],[E[0]+6.2,E[1]-4.2]],.25,{fade1:2.5,river:true,seed:17,amp:.5});
 // 3 plaza -> mill house door + wheel bank
 const mh=S.millHouse;lane([rim(mh.x,mh.z),[mh.x-1.6,mh.z+1.5],[mh.x-.3,mh.z+1.15]],.25,{seed:23});
 // 4 windmill track: narrower, grass crown between the ruts
 const wm=S.mill;lane([rim(wm.x,wm.z),[(vx+wm.x)/2,(vz+wm.z)/2+.8],[wm.x+1.5,wm.z+1.3]],.2,{k:1,seed:29,amp:.8,freq:.12});
 // 5 barn yard
 const br=S.barn,bf=[br.x+Math.sin(br.ry)*1.7,br.z+Math.cos(br.ry)*1.7];lane([rim(bf[0],bf[1]),bf],.22,{seed:31});
 // 6 cottage door spurs to the plaza rim or the nearest lane (short, narrow, small meander)
 for(const h of S.homes){if(!h.door)continue;const d=[h.door.x,h.door.z];const r0=rim(d[0],d[1]);let [q,qd]=nearestOn(d[0],d[1],true);
  const dr=Math.hypot(d[0]-r0[0],d[1]-r0[1]);const t=(!q||dr<qd)?r0:q;const o=[d[0]+(d[0]-h.x)*.25,d[1]+(d[1]-h.z)*.25];
  lane([d,o,t],.13,{amp:.12,it:1,kind:'door',seed:rnd()*40});}
 // lantern posts on the longer lanes, a few metres out of the plaza
 for(const l of LANES.slice(0,5)){const N=l.P.length,fe=Math.hypot(l.P[N-1][0]-PL.x,l.P[N-1][1]-PL.z)<Math.hypot(l.P[0][0]-PL.x,l.P[0][1]-PL.z),k=Math.min(N-1,14),i=fe?N-1-k:k,p=l.P[i],n=nrm(l.P,i);RD.lanterns.push([p[0]+n[0]*(l.w+.12),p[1]+n[1]*(l.w+.12)]);}
 RD.polys=LANES.map(l=>{const P=l.P.filter((p,i)=>i%3===0);P.push(l.P[l.P.length-1]);return{P,w:l.w,box:bbox(l.P)};});
 return RD.polys;}
function bbox(P){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const p of P){a=Math.min(a,p[0]);b=Math.min(b,p[1]);c=Math.max(c,p[0]);d=Math.max(d,p[1]);}return[a,b,c,d];}
RD.dist=function(x,z){let m=1e9;for(const q of RD.polys){const B=q.box;if(x<B[0]-3||x>B[2]+3||z<B[1]-3||z>B[3]+3)continue;for(let i=0;i+1<q.P.length;i++)m=Math.min(m,segD(x,z,q.P[i][0],q.P[i][1],q.P[i+1][0],q.P[i+1][1])-q.w);}return m;};

// ---------------- lane surface shader ----------------
const HEAD='varying vec3 vR;varying vec3 vWQ;uniform vec3 rdPl;\n'+
 'float rdH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
 'float rdV(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rdH(i),rdH(i+vec2(1.,0.)),f.x),mix(rdH(i+vec2(0.,1.)),rdH(i+vec2(1.,1.)),f.x),f.y);}\n'+
 'vec3 rdN(vec3 sp,vec3 sn,vec2 dH){vec3 sx=dFdx(sp),sy=dFdy(sp);vec3 r1=cross(sy,sn),r2=cross(sn,sx);float det=dot(sx,r1);vec3 g=sign(det)*(dH.x*r1+dH.y*r2);return normalize(abs(det)*sn-g);}\n'+
 // cobble setts: jittered cells in rows (half-bond), dark joints
 'vec3 rdCob(vec2 p){p*=vec2(8.5,10.5);float row=floor(p.y);p.x+=.5*mod(row,2.)+.3*rdH(vec2(row,2.));vec2 id=floor(p),f=fract(p);float j=min(min(f.x,1.-f.x)*1.25,min(f.y,1.-f.y));return vec3(smoothstep(.03,.2,j),rdH(id),rdH(id+3.7));}\n';
const BODY=[
 'float ss=vR.x,ee=abs(vR.y),kk=vR.z;vec2 wq=vWQ.xz;float plz=step(1.5,kk);float trk=step(.5,kk)*(1.-plz);',
 'float n1=rdV(wq*.8+3.),n2=rdV(wq*3.3),n3=rdV(wq*13.),n4=rdV(wq*37.);',
 'float aa=clamp(1.-fwidth(ee)*3.,0.,1.);',
 // irregular soft edge: grass bites in at low frequency, ragged at high frequency
 'float edg=1.-smoothstep(.80+.30*(n1-.5)+.16*(n2-.5),1.28,ee+.06*(n3-.5));',
 // two wheel ruts (none on the plaza), slightly wandering
 'float rp=.44+.05*(rdV(vec2(ss*.35,3.))-.5);float rut=(1.-plz)*(1.-smoothstep(.05,.16,abs(ee-rp)))*aa;',
 'vec3 col=mix('+lin('#86663F')+','+lin('#98784C')+',n1)*(.86+.2*n3);col=mix(col,'+lin('#6E5436')+',smoothstep(.55,.9,n2)*.35);', // C4 record-shot crit: lanes read slightly emissive -> albedo -10 %
 'col=mix(col,'+lin('#5E4630')+',rut*.62);',
 // gravel: sparse pale stones, more toward the shoulders
 'vec2 gc=floor(wq*30.);float gh=rdH(gc);float gv=step(.86-.08*smoothstep(.5,.9,ee),gh)*(1.-rut)*smoothstep(.45,.2,length(fract(wq*30.)-.5));',
 'col=mix(col,'+lin('#A89C86')+'*(.8+.4*rdH(gc+5.)),gv*.75);',
 // grass crown between the ruts on tracks; verge weeds along the shoulders
 'float crown=trk*(1.-smoothstep(.12,.30,ee))*smoothstep(.3,.6,n2);float verge=(1.-plz)*smoothstep(.66,1.0,ee+.18*(n3-.5));',
 'col=mix(col,'+lin('#55613C')+'*(.8+.4*n3),clamp(crown*.85+verge*.7,0.,1.));',
 // cobbled core
 'float dp=length(wq-rdPl.xy);float cb=1.-smoothstep(rdPl.z+1.6,rdPl.z+2.6,dp+1.2*(n1-.5));vec3 cq=rdCob(wq);',
 'vec3 cs='+lin('#8E7C62')+'*(.70+.42*cq.y)*mix(vec3(1.),vec3(.95,.97,1.02),cq.z);cs=mix('+lin('#3C3226')+',cs,cq.x);cs=mix(cs,'+lin('#55613C')+',(1.-cq.x)*smoothstep(.55,.8,n2)*.5);',
 'col=mix(col,cs,cb*aa+cb*(1.-aa)*.7);',
 // plaza kerb: a ring of larger darker edge stones so the cobbles end on a border instead of feathering into grass
 'float kb=plz*smoothstep(.70,.78,ee)*(1.-smoothstep(.93,1.02,ee));vec3 kq=rdCob(wq*.55+7.);col=mix(col,mix('+lin('#3A3026')+','+lin('#6E604C')+'*(.8+.35*kq.y),kq.x),kb);',
 // puddles: few, low-frequency, sitting in the ruts and dips; dark glassy
 'float pd=smoothstep(.735,.765,rdV(wq*.62+17.)*.85+.22*rut+.05*n3-.06*ee)*(1.-verge)*(1.-cb*.7);',
 'col=mix(col,'+lin('#121824')+',pd*.92);',
 'float fH=-rut*.9+gv*.6+n3*.25+cb*(cq.x*.9-.2)-pd*.5;float fRo=mix(mix(.94,.80,cb),.07,pd);',
 'diffuseColor.rgb=col;diffuseColor.a*=edg;'].join('\n');
function laneMat(){const m=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,transparent:true,depthWrite:false,roughness:.92,metalness:0,envMapIntensity:.9,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});
 const U={rdPl:{value:new THREE.Vector3(PL.x,PL.z,PL.r)}};
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aR;varying vec3 vR;varying vec3 vWQ;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvR=aR;vWQ=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+HEAD).replace('#include <color_fragment>','#include <color_fragment>\n'+BODY)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=fRo;')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=rdN(-vViewPosition,normal,vec2(dFdx(fH),dFdy(fH))*.035);');};
 m.customProgramCacheKey=()=>'rdLane';return m;}

// ---------------- geometry ----------------
const CROSS=[-1.32,-1.0,-.7,-.44,-.22,0,.22,.44,.7,1.0,1.32];
function laneGeo(l,pos,aR,col,idx){const P=l.P,N=P.length,NC=CROSS.length;let s=0;const base=pos.length/3;const seed=rnd()*50;const tot=(N-1)*.22;
 for(let i=0;i<N;i++){if(i)s+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);const n=nrm(P,i);
  const wv=l.w*(1+.22*(FA.fbm(s*.35+seed,seed,2)-.5)*2);let a=1;if(l.fade0)a*=FA.smooth(0,l.fade0,s);if(l.fade1)a*=FA.smooth(0,l.fade1,tot-s);
  if(l.kind==='door')a*=FA.smooth(0,.5,s)*.5+.5;
  // drape: crown height = max terrain across the lane (no buried shoulders on terrace risers), shoulders follow the ground
  let ym=-1e9;for(const e of[-1,0,1])ym=Math.max(ym,H(P[i][0]+n[0]*wv*e,P[i][1]+n[1]*wv*e));
  for(const e of CROSS){const x=P[i][0]+n[0]*wv*e,z=P[i][1]+n[1]*wv*e;const yg=H(x,z),t=Math.min(1,Math.abs(e));const y=Math.max(FA.WL+.02,yg*(t*t)+Math.max(yg,ym-.08)*(1-t*t))+.065;
   pos.push(x,y,z);aR.push(s,e,l.k);col.push(1,1,1,a*(.8+.2*Math.min(1,s/.6)));}}
 for(let i=0;i+1<N;i++)for(let k=0;k+1<NC;k++){const A=base+i*NC+k,B=A+NC;idx.push(A,A+1,B,A+1,B+1,B);}}
function plazaGeo(pos,aR,col,idx){const R=PL.r+.35,NR=9,NA=56,base=pos.length/3;pos.push(PL.x,H(PL.x,PL.z)+.07,PL.z);aR.push(0,0,2);col.push(1,1,1,1);
 for(let r=1;r<=NR;r++)for(let a=0;a<NA;a++){const an=a/NA*TAU,k=1+.10*(FA.fbm(Math.cos(an)*1.7+5,Math.sin(an)*1.7+2,2)-.5)*2,rr=R*r/NR*k*(r===NR?1.32:1),x=PL.x+Math.cos(an)*rr,z=PL.z+Math.sin(an)*rr;
  pos.push(x,H(x,z)+.07,z);aR.push(0,r===NR?1.32:r/NR*.85,2);col.push(1,1,1,1);}
 for(let a=0;a<NA;a++){const a1=(a+1)%NA;idx.push(base,base+1+a1,base+1+a);}
 for(let r=1;r<NR;r++)for(let a=0;a<NA;a++){const a1=(a+1)%NA,i0=base+1+(r-1)*NA,i1=base+1+r*NA;idx.push(i0+a,i0+a1,i1+a,i0+a1,i1+a1,i1+a);}}

// ---------------- instanced extras (weeds, gravel, pools) ----------------
function weedGeo(){const pos=[];for(let k=0;k<4;k++){const a=k*1.571+.3,l=.5,cx=Math.cos(a),cz=Math.sin(a);pos.push(-cz*.16,0,cx*.16, cz*.16,0,-cx*.16, cx*l,.9+k*.12,cz*l);}
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.computeVertexNormals();const n=G.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,n.getX(i)*.35,1,n.getZ(i)*.35);return G;}
function instMesh(geo,mat,list,cast){if(!list.length)return 0;const im=new THREE.InstancedMesh(geo,mat,list.length);const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),V=new THREE.Vector3(),S3=new THREE.Vector3();
 list.forEach((s,i)=>{E.set(s[7]||0,s[6]||0,0);Q.setFromEuler(E);M.compose(V.set(s[0],s[1],s[2]),Q,S3.set(s[3],s[4],s[5]));im.setMatrixAt(i,M);im.setColorAt(i,s[8]);});
 geo.computeBoundingSphere();geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(PL.x,0,PL.z),70);im.castShadow=!!cast;im.receiveShadow=true;FA.SC.add(im);(FA.closeOnly=FA.closeOnly||[]).push(im);im.visible=FA.VIEW==='close';
 return (geo.index?geo.index.count:geo.attributes.position.count)/3*list.length;}
function poolTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);
 gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.55)');gr.addColorStop(.7,'rgba(255,255,255,.14)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}

function finish(){if(!S)return null;const t0=performance.now();let tris=0;const QK=FA.QK||1,PF=FA.PROFARM;
 // field gates: short spurs off the entrance road / windmill track to the nearest field edge, with a 5-bar gate
 const gates=[];if(PF&&PF.on){for(const li of[0,4]){const l=LANES[li];if(!l)continue;for(let i=10;i<l.P.length-6;i+=6){const p=l.P[i];if(gates.some(g=>Math.hypot(g.x-p[0],g.z-p[1])<6))continue;
   const n=nrm(l.P,i);let hit=null;for(const sg of[1,-1]){for(let d=l.w+.4;d<4.5;d+=.2){const x=p[0]+n[0]*sg*d,z=p[1]+n[1]*sg*d;if(PF.inField(x,z,0)){hit={x:x-n[0]*sg*.25,z:z-n[1]*sg*.25,d,sg};break;}}if(hit)break;}
   if(!hit||hit.d<.9||Math.hypot(hit.x-PL.x,hit.z-PL.z)<6)continue;if(KO.some(k=>Math.hypot(hit.x-k.x,hit.z-k.z)<k.r))continue;
   const s0=[p[0]+n[0]*hit.sg*l.w*.6,p[1]+n[1]*hit.sg*l.w*.6];lane([s0,[(s0[0]+hit.x)/2,(s0[1]+hit.z)/2],[hit.x,hit.z]],.15,{k:1,amp:.08,it:1,kind:'gate',fade1:.4});
   gates.push({x:hit.x,z:hit.z,ax:-n[1],az:n[0]});if(gates.length>=4)break;}if(gates.length>=4)break;}}
 const wood=new THREE.MeshStandardMaterial({color:'#5C4632',roughness:.9});
 for(const g of gates){const ry=Math.atan2(-g.az,g.ax);for(const s of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(.045,.24,.045),wood);m.position.set(g.x+g.ax*s*.26,H(g.x+g.ax*s*.26,g.z+g.az*s*.26)+.1,g.z+g.az*s*.26);m.castShadow=m.receiveShadow=true;FA.addStatic(m);}
  const y0=H(g.x,g.z);for(const h of[.06,.11,.16,.21]){const b=new THREE.Mesh(new THREE.BoxGeometry(.5,.016,.014),wood);b.position.set(g.x,y0+h,g.z);b.rotation.y=ry;b.castShadow=true;FA.addStatic(b);}
  const br=new THREE.Mesh(new THREE.BoxGeometry(.54,.016,.014),wood);br.position.set(g.x,y0+.135,g.z);br.rotation.set(0,ry,0);br.rotateZ(.29);FA.addStatic(br);}
 // one merged lane + plaza mesh
 const pos=[],aR=[],col=[],idx=[];plazaGeo(pos,aR,col,idx);for(const l of LANES)laneGeo(l,pos,aR,col,idx);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aR',new THREE.Float32BufferAttribute(aR,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
 {const n=g.attributes.normal;for(let i=0;i<n.count;i++)if(n.getY(i)<0)n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i));}
 const me=new THREE.Mesh(g,laneMat());me.name='rd_lanes';me.receiveShadow=true;me.renderOrder=3;FA.SC.add(me);tris+=idx.length/3;
 // verge weeds + gravel (density by quality tier; only within ~26 of the plaza where the close-up can resolve them)
 const WD=[],GV=[],cc=new THREE.Color(),WC=['#55663C','#5E6B40','#6E7044','#7A7248','#4E5E3A'];
 for(const l of LANES){const P=l.P;for(let i=0;i<P.length;i++){const p=P[i];if(Math.hypot(p[0]-PL.x,p[1]-PL.z)>26)continue;const n=nrm(P,i),dp=Math.hypot(p[0]-PL.x,p[1]-PL.z);
  if(dp>PL.r+1.6)for(const sg of[-1,1])for(let r=0;r<3;r++){if(rnd()>.62*QK)continue;const e=l.w*(.95+.45*rnd()),x=p[0]+n[0]*sg*e+(rnd()-.5)*.2,z=p[1]+n[1]*sg*e+(rnd()-.5)*.2,k=.04+.06*rnd();
    WD.push([x,H(x,z)+.03,z,k,k*(.8+.6*rnd()),k,rnd()*TAU,0,cc.set(WC[(rnd()*5)|0]).multiplyScalar(.85+.3*rnd()).clone()]);}
  for(let r=0;r<3;r++)if(rnd()<.8*QK){const e=(rnd()*2-1)*l.w*1.05,x=p[0]+n[0]*e+(rnd()-.5)*.2,z=p[1]+n[1]*e+(rnd()-.5)*.2,k=.009+.014*rnd();GV.push([x,H(x,z)+.07,z,k,k*.6,k*(.8+.4*rnd()),rnd()*TAU,0,cc.set('#9C8E78').multiplyScalar(.7+.5*rnd()).clone()]);}}}
 tris+=instMesh(weedGeo(),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.9,side:THREE.DoubleSide,envMapIntensity:.6}),WD,false);
 tris+=instMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.85,flatShading:true,envMapIntensity:.7}),GV,false);
 // warm ground pools (fire light only: lit doors, lanterns, bonfire); none in day mood
 let np=0;if(L.pc&&L.pc.mood!=='day'){const PO=RD.pools.slice();for(const q of RD.lanterns)PO.push([q[0],q[1],.75,.30]);
  const pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);const pm=new THREE.MeshBasicMaterial({color:'#ffffff',map:poolTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,polygonOffset:true,polygonOffsetFactor:-5,polygonOffsetUnits:-10});
  const im=new THREE.InstancedMesh(pg,pm,PO.length);const M=new THREE.Matrix4(),warm=C('#FF9A52');
  PO.forEach((q,i)=>{const r=q[2]*2;M.makeScale(r,1,r);M.setPosition(q[0],H(q[0],q[1])+.09,q[1]);im.setMatrixAt(i,M);im.setColorAt(i,warm.clone().multiplyScalar(q[3]));});
  im.renderOrder=9;pg.computeBoundingSphere();pg.boundingSphere=new THREE.Sphere(new THREE.Vector3(PL.x,0,PL.z),60);FA.SC.add(im);(FA.closeOnly=FA.closeOnly||[]).push(im);im.visible=FA.VIEW==='close';np=PO.length;}
 // lantern posts (oak post + iron cage) with a small flame glow
 for(const q of RD.lanterns){const y=H(q[0],q[1]);const p=new THREE.Mesh(new THREE.BoxGeometry(.035,.5,.035),wood);p.position.set(q[0],y+.25,q[1]);p.castShadow=true;FA.addStatic(p);
  FA.glow(q[0],y+.52,q[1],.22,'#FFA050',.32,[.10,2.2+.6*FA.hash(q[0],q[1]),q[0],0]);}
 Object.assign(RD.info,{lanes:LANES.length,gates:gates.length,weeds:WD.length,gravel:GV.length,pools:np,lanterns:RD.lanterns.length,tris:Math.round(tris),len:+LANES.reduce((a,l)=>a+(l.P.length-1)*.22,0).toFixed(1),ms:Math.round(performance.now()-t0)});
 return RD.info;}
})();
