// Futures Atlas v4.5 PILOT - cities.js : Gatekeeper + Reversion dioramas (Tegmark, Life 3.0 ch.5), scatter, start-up.
// Kit props: KayKit City Builder Bits / Medieval Hexagon / Space Base Bits (CC0, Kay Lousberg). Landmarks stay procedural.
(function(){
'use strict';
const FA=window.FA,SC=FA.SC,H=FA.H,smooth=FA.smooth,L=FA.LOOK,C=h=>new THREE.Color(h);
const K='assets/';
FA.LIST={
 bA:K+'kk_city/building_A_withoutBase.gltf',bB:K+'kk_city/building_B_withoutBase.gltf',bC:K+'kk_city/building_C_withoutBase.gltf',
 bD:K+'kk_city/building_D_withoutBase.gltf',bE:K+'kk_city/building_E_withoutBase.gltf',bF:K+'kk_city/building_F_withoutBase.gltf',
 lamp:K+'kk_city/streetlight.gltf',bush:K+'kk_city/bush.gltf',car:K+'kk_city/car_sedan.gltf',bench:K+'kk_city/bench.gltf',
 homeA:K+'kk_hex/building_home_A_yellow.gltf',homeB:K+'kk_hex/building_home_B_yellow.gltf',windmill:K+'kk_hex/building_windmill_yellow.gltf',
 watermill:K+'kk_hex/building_watermill_yellow.gltf',well:K+'kk_hex/building_well_yellow.gltf',
 fence:K+'kk_hex/fence_wood_straight.gltf',
 treesA:K+'kk_hex/trees_A_medium.gltf',treesB:K+'kk_hex/trees_B_small.gltf',treeA:K+'kk_hex/tree_single_A.gltf',treeB:K+'kk_hex/tree_single_B.gltf',
 rock:K+'kk_hex/rock_single_A.gltf',sack:K+'kk_hex/sack.gltf',barrel:K+'kk_hex/barrel.gltf',barrow:K+'kk_hex/wheelbarrow.gltf',lumber:K+'kk_hex/resource_lumber.gltf'
};

// ======================= GATEKEEPER =======================
// One superintelligence whose only goal is to block any other; human society runs on at roughly today's (capped) tech.
// Read: an ordinary town on a stone plinth inside ONE perimeter wall, a pale spire carrying a single watching eye.
function irisTex(){const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
 const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#04060A');gr.addColorStop(.30,'#04060A');gr.addColorStop(.33,'#1E4C58');gr.addColorStop(.52,'#7CC2CC');gr.addColorStop(.74,'#3F8794');gr.addColorStop(.87,'#245562');gr.addColorStop(.9,'#0E1E24');gr.addColorStop(1,'#0E1E24');
 g.fillStyle=gr;g.fillRect(0,0,256,128);const r=FA.rng(3);
 for(let i=0;i<150;i++){const x=r()*256;g.strokeStyle=r()<.5?'rgba(200,240,245,'+(.10+r()*.22)+')':'rgba(5,20,26,'+(.15+r()*.25)+')';g.lineWidth=.6+r()*1.6;g.beginPath();g.moveTo(x,40);g.lineTo(x+(r()-.5)*6,110);g.stroke();}
 g.fillStyle='#04060A';g.fillRect(0,0,256,40);return new THREE.CanvasTexture(c);}
function pavingTex(R,builds){const N=512,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');const px=v=>(v/(2*R)+.5)*N,s=N/(2*R);
 g.fillStyle='#64625D';g.fillRect(0,0,N,N);const r=FA.rng(9);
 for(let i=0;i<N;i+=s*.7)for(let j=0;j<N;j+=s*.7){g.fillStyle='rgba('+(r()<.5?'255,250,240,':'20,22,30,')+(.03+r()*.05)+')';g.fillRect(i,j,s*.68,s*.68);} // slabs
 g.fillStyle='#4A4D57';g.fillRect(px(-.62),0,1.24*s,N);g.fillRect(0,px(-.62),N,1.24*s);                                      // avenues
 g.strokeStyle='#4A4D57';g.lineWidth=.9*s;g.beginPath();g.arc(N/2,N/2,6.95*s,0,6.29);g.stroke();                          // ring lane inside the wall
 g.strokeStyle='rgba(230,226,215,.30)';g.lineWidth=.06*s;g.setLineDash([.4*s,.4*s]);for(const k of[-1,1]){g.beginPath();g.moveTo(N/2,0);g.lineTo(N/2,N);g.stroke();g.beginPath();g.moveTo(0,N/2);g.lineTo(N,N/2);g.stroke();}g.setLineDash([]);
 g.fillStyle='#8F8B82';g.beginPath();g.arc(N/2,N/2,3.25*s,0,6.29);g.fill();                                               // plaza
 g.strokeStyle='rgba(40,42,50,.35)';g.lineWidth=.05*s;for(const rr of[1.6,2.2,2.8]){g.beginPath();g.arc(N/2,N/2,rr*s,0,6.29);g.stroke();}
 for(const b of builds){const gr=g.createRadialGradient(px(b[0]),px(b[1]),0,px(b[0]),px(b[1]),b[2]*s);gr.addColorStop(0,'rgba(10,10,18,.55)');gr.addColorStop(.6,'rgba(10,10,18,.30)');gr.addColorStop(1,'rgba(10,10,18,0)');g.fillStyle=gr;g.fillRect(0,0,N,N);} // baked contact AO
 const gr=g.createRadialGradient(N/2,N/2,7.2*s,N/2,N/2,7.9*s);gr.addColorStop(0,'rgba(10,10,18,0)');gr.addColorStop(1,'rgba(10,10,18,.5)');g.fillStyle=gr;g.fillRect(0,0,N,N);
 const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}

FA.buildGK=function(){const c=FA.GK,r=FA.rng(15),top=c.top,cx=c.x,cz=c.z;
 const stone=new THREE.MeshStandardMaterial({color:'#3E404D',roughness:.85,envMapIntensity:.5});
 const s1=new THREE.Mesh(new THREE.CylinderGeometry(10.5,11.1,1.5,72),stone);s1.position.set(cx,top-.3-.75,cz);
 const s2=new THREE.Mesh(new THREE.CylinderGeometry(9.95,10.25,.3,72),new THREE.MeshStandardMaterial({color:'#4C4D57',roughness:.78,envMapIntensity:.5}));s2.position.set(cx,top-.15,cz);
 [s1,s2].forEach(m=>{m.castShadow=m.receiveShadow=true;SC.add(m);});
 FA.AOS.push({x:cx,z:cz,r:11.6,k:.55});
 const builds=[];
 // town: ordinary low/mid-rise blocks on a grid (kit), facing the two avenues
 const keys=['bA','bB','bC','bD','bE','bF'];
 for(let gx=-6.3;gx<=6.31;gx+=1.4)for(let gz=-6.3;gz<=6.31;gz+=1.4){const rr=Math.hypot(gx,gz);if(rr<3.7||rr>6.35)continue;if(Math.abs(gx)<1.0||Math.abs(gz)<1.0)continue;if(r()<.1)continue;
  const ry=Math.abs(gx)<Math.abs(gz)?(gx>0?-Math.PI/2:Math.PI/2):(gz>0?Math.PI:0);const k=keys[(r()*6)|0];
  const q=FA.put(k,cx+gx,cz+gz,{y:top,w:1.12+r()*.12,ry,ao:false});if(q)builds.push([gx,gz,q.fw*.85]);}
 // street lamps (warm human light) + a few cars, benches and bushes
 for(const sg of[-1,1])for(const t of[3.95,5.2,6.3]){for(const[x,z,ry]of[[.78,t*sg,0],[-.78,t*sg,Math.PI],[t*sg,.78,Math.PI/2],[t*sg,-.78,-Math.PI/2]]){
   FA.put('lamp',cx+x,cz+z,{y:top,h:.95,ry,ao:false});FA.glow(cx+x*.8,top+.9,cz+z*.98,.75,L.human,.42);}}
 for(const[x,z,ry]of[[.32,4.6,0],[-.32,-5.6,Math.PI],[5.0,-.3,Math.PI/2],[-4.2,.3,-Math.PI/2]])FA.put('car',cx+x,cz+z,{y:top,w:.62,ry,ao:false});
 for(let i=0;i<10;i++){const a=i/10*6.283+.3,x=Math.cos(a)*2.95,z=Math.sin(a)*2.95;if(Math.abs(x)<.9||Math.abs(z)<.9)continue;FA.put('bush',cx+x,cz+z,{y:top,w:.5+r()*.2,ao:false});builds.push([x,z,.4]);}
 for(const a of[.79,2.36,3.93,5.5])FA.put('bench',cx+Math.cos(a)*2.45,cz+Math.sin(a)*2.45,{y:top,w:.55,ry:-a+Math.PI/2,ao:false});
 const pav=new THREE.Mesh(new THREE.CircleGeometry(9.95,72),new THREE.MeshStandardMaterial({map:pavingTex(9.95,builds),roughness:.86,envMapIntensity:.55}));
 pav.rotation.x=-Math.PI/2;pav.position.set(cx,top+.003,cz);pav.receiveShadow=true;SC.add(pav);
 // ONE perimeter wall (4 arcs, gates on the avenues), chamfered top, faint cyan-white sensor line = the AI's only light
 const prof=[[7.38,0],[7.38,1.25],[7.48,1.42],[7.82,1.42],[7.92,1.25],[7.92,0]].map(p=>new THREE.Vector2(p[0],p[1]));
 const wallM=new THREE.MeshStandardMaterial({color:'#474C58',roughness:.62,envMapIntensity:.7,side:THREE.DoubleSide});const senM=new THREE.MeshBasicMaterial({color:C(L.ai).multiplyScalar(.62),toneMapped:false,side:THREE.DoubleSide});
 const sen=[[7.925,.98],[7.935,.98],[7.935,1.04],[7.925,1.04]].map(p=>new THREE.Vector2(p[0],p[1]));const gap=.24;
 const twG=new THREE.CylinderGeometry(.42,.5,1,6),capG=new THREE.CylinderGeometry(.5,.44,.16,6),bandG=new THREE.CylinderGeometry(.505,.505,.05,6),twM=new THREE.MeshStandardMaterial({color:'#3E434E',roughness:.6,envMapIntensity:.7});
 const tower=(a,h)=>{const x=cx+Math.sin(a)*7.65,z=cz+Math.cos(a)*7.65;const t=new THREE.Mesh(twG,twM);t.scale.y=h;t.position.set(x,top+h/2,z);t.rotation.y=a;const cp=new THREE.Mesh(capG,twM);cp.position.set(x,top+h+.08,z);cp.rotation.y=a;
  const b=new THREE.Mesh(bandG,senM);b.position.set(x,top+h-.25,z);b.rotation.y=a;[t,cp].forEach(m=>{m.castShadow=m.receiveShadow=true;});SC.add(t,cp,b);};
 for(let q=0;q<4;q++){const ph=q*Math.PI/2+gap/2,pl=Math.PI/2-gap;const w=new THREE.Mesh(new THREE.LatheGeometry(prof,40,ph,pl),wallM);w.position.set(cx,top,cz);w.castShadow=w.receiveShadow=true;SC.add(w);
  const sn=new THREE.Mesh(new THREE.LatheGeometry(sen,40,ph,pl),senM);sn.position.set(cx,top,cz);SC.add(sn);
  for(const a of[ph-.03,ph+pl+.03])tower(a,2.15);tower(ph+pl/2,1.75);}
 // spire: pale ceramic lathe with dark seams + thin AI rings, on a podium
 const pod=new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.45,.36,48),new THREE.MeshStandardMaterial({color:'#6F717C',roughness:.6}));pod.position.set(cx,top+.18,cz);pod.castShadow=pod.receiveShadow=true;SC.add(pod);
 const SYK=1.32;const sp=[[1.3,0],[1.3,.35],[1.05,.55],[.98,2.5],[1.04,2.62],[.86,2.8],[.82,4.9],[.88,5.0],[.70,5.18],[.64,6.9],[.58,7.05],[.42,7.3],[.40,7.45],[.0,7.46]].map(p=>new THREE.Vector2(p[0],p[1]*SYK));
 const spM=new THREE.MeshStandardMaterial({color:'#9A9EA9',roughness:.42,metalness:.08,envMapIntensity:.8});
 const spire=new THREE.Mesh(new THREE.LatheGeometry(sp,48),spM);const sy=top+.36;spire.position.set(cx,sy,cz);spire.castShadow=spire.receiveShadow=true;SC.add(spire);
 const ringM=new THREE.MeshBasicMaterial({color:C(L.ai).multiplyScalar(.55),toneMapped:false});
 for(const[y,rad]of[[2.7*SYK,.93],[5.08*SYK,.79]]){const t=new THREE.Mesh(new THREE.TorusGeometry(rad,.035,6,48),ringM);t.rotation.x=Math.PI/2;t.position.set(cx,sy+y,cz);SC.add(t);}
 // eye: socket + collar, sclera, iris cap with radial fibres, cornea, two eyelids (blink, never rests closed)
 const E=new THREE.Vector3(cx,sy+7.46*SYK+1.1,cz);FA.eyePos=E;const metal=new THREE.MeshStandardMaterial({color:'#30353F',roughness:.32,metalness:.75,envMapIntensity:1.0,side:THREE.DoubleSide});
 const collar=new THREE.Mesh(new THREE.CylinderGeometry(.62,.42,1.25,32),metal);collar.position.set(cx,sy+7.46*SYK+.2,cz);collar.castShadow=true;SC.add(collar);
 const sock=new THREE.Group();sock.position.copy(E);sock.rotation.y=-.22;SC.add(sock);
 const tor=new THREE.Mesh(new THREE.TorusGeometry(1.06,.13,14,48),metal);tor.position.z=.12;tor.castShadow=true;sock.add(tor);
 const lidM=new THREE.MeshStandardMaterial({color:'#5C6370',roughness:.4,metalness:.55,envMapIntensity:1.0,side:THREE.DoubleSide});
 const up=new THREE.Mesh(new THREE.SphereGeometry(1.0,40,16,0,Math.PI*2,0,Math.PI/2),lidM),lo=new THREE.Mesh(new THREE.SphereGeometry(1.0,40,16,0,Math.PI*2,Math.PI/2,Math.PI/2),lidM);
 up.castShadow=lo.castShadow=true;sock.add(up,lo);
 const ball=new THREE.Group();ball.position.copy(E);SC.add(ball);
 const scl=new THREE.Mesh(new THREE.SphereGeometry(.93,40,28),new THREE.MeshStandardMaterial({color:'#D2CFC8',roughness:.3,envMapIntensity:.8}));ball.add(scl);
 const it=irisTex();it.encoding=THREE.sRGBEncoding;const ig=new THREE.SphereGeometry(.936,40,10,0,Math.PI*2,0,.6);ig.rotateX(Math.PI/2);
 const iris=new THREE.Mesh(ig,new THREE.MeshStandardMaterial({map:it,emissiveMap:it,emissive:C('#9FE6F0'),emissiveIntensity:.32,roughness:.35}));ball.add(iris);
 const cg=new THREE.SphereGeometry(.975,40,12,0,Math.PI*2,0,.75);cg.rotateX(Math.PI/2);
 ball.add(new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:'#ffffff',transparent:true,opacity:.14,roughness:.04,envMapIntensity:1.5,depthWrite:false})));
 const halo=FA.glow(E.x,E.y,E.z,3.2,L.ai,.12);
 // attention clock: new target every 4-7 s, blink every 8-14 s (0.32 s), lids open again at once
 const rr=FA.rng(77),sched=[];let t0=0;while(t0<4000){sched.push({t:t0,yaw:-.22+(rr()-.5)*1.5,pitch:-.12-rr()*.42});t0+=4+rr()*3;}
 const blinks=[];t0=2.2;while(t0<4000){blinks.push(t0);t0+=8+rr()*6;}
 const qT=new THREE.Quaternion(),eul=new THREE.Euler(0,0,0,'YXZ');let bi=0;
 FA.anims.push((T,dt)=>{let i=0;while(i+1<sched.length&&sched[i+1].t<=T)i++;const s=sched[i];eul.set(-s.pitch*-1,s.yaw,0);eul.x=-s.pitch;qT.setFromEuler(eul);
  ball.quaternion.slerp(qT,1-Math.exp(-dt*7));if(FA.TFIX!=null)ball.quaternion.copy(qT);
  while(bi+1<blinks.length&&blinks[bi+1]<=T)bi++;const bt=T-blinks[bi];const k=bt>=0&&bt<.32?Math.sin(Math.PI*bt/.32):0;
  up.rotation.x=-.56*(1-k);lo.rotation.x=.50*(1-k);halo.material.opacity=1-k*.8;});
 // gate lintels over the four avenue gaps (the wall is closed except where the Gatekeeper lets traffic through)
 const linG=new THREE.BoxGeometry(2.6,.34,.62);for(let q=0;q<4;q++){const a=q*Math.PI/2;const l=new THREE.Mesh(linG,twM);l.position.set(cx+Math.sin(a)*7.65,top+1.75,cz+Math.cos(a)*7.65);l.rotation.y=a;l.castShadow=true;SC.add(l);
  const b=new THREE.Mesh(new THREE.BoxGeometry(2.62,.05,.64),senM);b.position.copy(l.position).y-=.1;b.rotation.y=l.rotation.y;SC.add(b);}
 // road stub (data layer) up to the plinth foot at the south gate
 FA.road([[cx+16,cz+92],[cx+7,cz+52],[cx+1.6,cz+24],[cx,cz+11.3]],.9,L.road);
};

// ======================= REVERSION =======================
// Technology rolled back to a pre-industrial level (Amish-like): farms, a water wheel on the stream, a windmill,
// chimney smoke, sparse fire light; no paved roads, no power lines, no electric light.
FA.fields=[];FA.lanes=[];
FA.buildRV=function(){const c=FA.RV,r=FA.rng(20),vx=c.x-1.5,vz=c.z;
 FA.put('well',vx,vz,{w:1.0});
 const homes=[];
 for(let i=0;i<11;i++){const a=i/11*6.283+r()*.35+.2,rr=3.6+r()*3.2;let x=vx+Math.cos(a)*rr*1.2,z=vz+Math.sin(a)*rr;if(x>FA.riverX(z)-3.3)x=FA.riverX(z)-3.3-r()*.8;
  const ry=Math.atan2(vx-x,vz-z)+(r()-.5)*.5;const q=FA.put(r()<.55?'homeA':'homeB',x,z,{w:1.55+r()*.35,ry,aok:.45});homes.push({x,z,h:q?q.h:1.4,ry});FA.lanes.push([vx,vz,x,z]);}
 // sparse fire light (hearths / lanterns) + chimney smoke
 homes.forEach((h,i)=>{if(i%2===0){const f=FA.glow(h.x+Math.sin(h.ry)*.75,H(h.x,h.z)+.42,h.z+Math.cos(h.ry)*.75,.55,'#FF9040',.34);const ph=i*1.7;FA.anims.push(T=>{f.material.opacity=.75+.25*Math.sin(T*9+ph)*Math.sin(T*3.1+ph*2);});}});
 const puffs=[];homes.filter((h,i)=>i%4===1).forEach((h,j)=>{for(let k=0;k<10;k++){const m=new THREE.SpriteMaterial({map:FA.puffTex,color:C('#C9C5D0'),transparent:true,depthWrite:false,fog:false,opacity:0});
  const s=new THREE.Sprite(m);SC.add(s);puffs.push({s,x:h.x+.22,y:H(h.x,h.z)+h.h*.92,z:h.z-.1,ph:k/10,sp:5.5+j*.7});}});
 FA.anims.push(T=>{for(const p of puffs){const u=((T/p.sp)+p.ph)%1;p.s.position.set(p.x+u*1.6+Math.sin(u*6+p.ph*9)*.12,p.y+u*3.4,p.z+u*.5);const sc=.4+u*1.7;p.s.scale.set(sc,sc,1);p.s.material.opacity=.6*(1-u)*smooth(0,.08,u);}});
 // bonfire on the green: the only real point light, small radius, flickering
 const bfx=vx+2.2,bfz=vz+2.6;FA.put('lumber',bfx,bfz,{w:.7});const bf=new THREE.PointLight('#FF9548',1.3,8,2);bf.position.set(bfx,H(bfx,bfz)+.7,bfz);SC.add(bf);
 const bg=FA.glow(bfx,H(bfx,bfz)+.55,bfz,1.1,'#FF8438',.36);FA.anims.push(T=>{const f=.8+.2*Math.sin(T*11)*Math.sin(T*4.3);bf.intensity=1.3*f;bg.material.opacity=f;});
 // water wheel on the stream (watermill kit oriented so its wheel side faces the water; wheel spins), plank footbridge, windmill on the knoll (fan spins)
 const z0=vz+2.5;let wry=Math.PI/2,woff=1.2;const WM=FA.MODELS.watermill;
 if(WM){const bc=new THREE.Vector3();WM.box.getCenter(bc);const wp=WM.parts.find(p=>p.name.toLowerCase().includes('wheel'));if(wp){wp.geo.computeBoundingBox();const wc=new THREE.Vector3();wp.geo.boundingBox.getCenter(wc).applyMatrix4(wp.m);
  const ox=wc.x-bc.x,oz=wc.z-bc.z;wry=Math.atan2(oz,ox);const sx=WM.box.max.x-WM.box.min.x,sz=WM.box.max.z-WM.box.min.z;woff=Math.hypot(ox,oz)*2.7/Math.max(sx,sz);}}
 const wx=FA.riverX(z0)-1.05-woff;const wm=FA.single('watermill',wx,z0,{w:2.7,ry:wry,y:H(wx,z0)-.45});
 if(wm){const sp=wm.spinner('wheel');if(sp)FA.anims.push(T=>sp(T*.9));}
 const bz=vz-7.5,bxc=FA.riverX(bz);{const wood=new THREE.MeshStandardMaterial({color:'#6B5038',roughness:.9});const deck=new THREE.Mesh(new THREE.BoxGeometry(5.6,.14,1.0),wood);deck.position.set(bxc,1.12,bz);
  const r1=new THREE.Mesh(new THREE.BoxGeometry(5.6,.07,.07),wood),r2=r1.clone();r1.position.set(bxc,1.55,bz-.46);r2.position.set(bxc,1.55,bz+.46);[deck,r1,r2].forEach(m=>{m.castShadow=m.receiveShadow=true;SC.add(m);});
  for(let i=-2;i<=2;i++)for(const s of[-.46,.46]){const p=new THREE.Mesh(new THREE.BoxGeometry(.09,1.3,.09),wood);p.position.set(bxc+i*1.35,.95,bz+s);p.castShadow=true;SC.add(p);}}
 FA.lanes.push([vx,vz,bxc-2.6,bz]);
 const wmx=c.x-12,wmz=c.z-8;const wd=FA.single('windmill',wmx,wmz,{w:2.6,ry:.5});if(wd){const sp=wd.spinner('fan');if(sp)FA.anims.push(T=>sp(T*.55));}
 FA.lanes.push([vx,vz,wmx,wmz]);
 // fields: rotated parcels west/south of the village (crops in vertex colour + furrows, wheat kit pieces, wood fences)
 const ang=.32,ux=Math.cos(ang),uz=Math.sin(ang),wxv=-uz,wzv=ux;const types=['wheat','olive','fallow','pasture','wheat','olive'];const rows=[],stacks=[];
 for(let i=-4;i<=2;i++)for(let j=-2;j<=3;j++){const px=vx-3+ux*i*4.6+wxv*j*3.6,pz=vz+uz*i*4.6+wzv*j*3.6;const dv=Math.hypot(px-vx,pz-vz);
  if(dv<8.6||dv>21||px>FA.riverX(pz)-4.2)continue;if(Math.hypot(px-wmx,pz-wmz)<4)continue;const ty=types[(r()*types.length)|0];FA.fields.push({x:px,z:pz,ux,uz,wx:wxv,wz:wzv,ty});
  if(ty==='wheat'||ty==='olive'){const col=ty==='wheat'?'#86703C':'#5A6834';for(let b=-1.2;b<=1.21;b+=.4)rows.push([px+wxv*b,pz+wzv*b,-ang,col]);}
  if(ty==='fallow'&&r()<.6)for(const a of[-.9,.7])stacks.push([px+ux*a,pz+uz*a]);
  if(r()<.5){const sgn=r()<.5?-1:1;for(let a=-1.85;a<=1.86;a+=.74)FA.put('fence',px+ux*a+wxv*sgn*1.75,pz+uz*a+wzv*sgn*1.75,{w:.78,along:Math.atan2(-uz,ux),ao:false});}}
 // crop rows (instanced, two crops) + haystacks: low 3D relief so the parcels read as farmland, not decals
 {const g=new THREE.BoxGeometry(3.9,.22,.2);g.translate(0,.11,0);const im=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.92,envMapIntensity:.4}),rows.length);const m=new THREE.Matrix4(),cc=new THREE.Color();
  rows.forEach((q,i)=>{m.makeRotationY(q[2]);m.setPosition(q[0],H(q[0],q[1])-.03,q[1]);im.setMatrixAt(i,m);im.setColorAt(i,cc.set(q[3]).multiplyScalar(.9+r()*.2));});im.castShadow=im.receiveShadow=true;im.frustumCulled=false;SC.add(im);
  const hm=new THREE.MeshStandardMaterial({color:'#9C8550',roughness:.95});for(const s of stacks){const y=H(s[0],s[1]);const a=new THREE.Mesh(new THREE.CylinderGeometry(.34,.38,.42,10),hm),b=new THREE.Mesh(new THREE.ConeGeometry(.36,.36,10),hm);a.position.set(s[0],y+.2,s[1]);b.position.set(s[0],y+.59,s[1]);[a,b].forEach(q=>{q.castShadow=q.receiveShadow=true;SC.add(q);});FA.AOS.push({x:s[0],z:s[1],r:.5,k:.4});}}
 // orchard + yard props
 for(let i=0;i<4;i++)for(let j=0;j<3;j++){const x=vx-1+i*1.5,z=vz-9.5-j*1.5;FA.put('treeA',x,z,{w:1.0+r()*.2,ry:r()*6});}
 for(const h of homes){if(r()<.6)FA.put(r()<.5?'barrel':'sack',h.x+Math.cos(h.ry)*.9,h.z-Math.sin(h.ry)*.9,{w:.28,ao:false});}
 FA.put('barrow',wx-1.3,z0+1.2,{w:.55,ry:1.2});FA.put('sack',wx-.9,z0-1.3,{w:.3});FA.put('sack',wx-1.2,z0-1.1,{w:.28});FA.put('lumber',wmx+1.8,wmz+1.0,{w:.9});
 // road stub (data layer) from the south-west into the green
 FA.road([[c.x-46,c.z+80],[c.x-24,c.z+38],[c.x-11,c.z+16],[vx-3.2,vz+4.2]],.9,L.road);
};
// terrain colour hook: Reversion parcels + dirt lanes (Gatekeeper sits on its paved plinth)
const CF={wheat:C('#8C7A48'),olive:C('#66733F'),fallow:C('#5E5038'),pasture:C('#5F7048')},DIRT=C('#6E604A');
FA.colorHook=function(x,z,h,sl,c){const rv=FA.RV;if(Math.abs(x-rv.x)>26||Math.abs(z-rv.z)>26)return;
 for(const f of FA.fields){const dx=x-f.x,dz=z-f.z,a=dx*f.ux+dz*f.uz,b=dx*f.wx+dz*f.wz;if(Math.abs(a)<2.05&&Math.abs(b)<1.55){c.lerp(CF[f.ty],.85);if(f.ty!=='pasture')c.multiplyScalar(.9+.1*Math.sin(b*10));return;}}
 for(const l of FA.lanes){const ax=l[2]-l[0],az=l[3]-l[1],ll=ax*ax+az*az;let t=((x-l[0])*ax+(z-l[1])*az)/ll;t=Math.max(0,Math.min(1,t));const d=Math.hypot(x-l[0]-ax*t,z-l[1]-az*t);if(d<.55){c.lerp(DIRT,.75*smooth(.55,.25,d));return;}}
 if(Math.hypot(x-(rv.x-1.5),z-rv.z)<2.4)c.lerp(DIRT,.55);};

// ======================= scatter (forests, rocks, grass) =======================
FA.scatter=function(){const r=FA.rng(5),tufts=[];const gk=FA.GK,rv=FA.RV;
 for(let i=0;i<5200;i++){const x=(r()-.5)*(FA.TW-12),z=(r()-.5)*(FA.TD-12);const h=H(x,z);const dg=Math.hypot(x-gk.x,z-gk.z),dr=Math.hypot(x-rv.x,z-rv.z);
  if(dg<19||Math.abs(x-FA.riverX(z))<3.3||h>21)continue;if(dr<23&&!(z<rv.z-12&&dr>13))continue;const sl=FA.slope(x,z);
  const forest=FA.fbm(x*.045+7,z*.045+3,3);
  if(forest>.56&&sl<.75&&r()<.42){const k=r();FA.put(k<.45?'treesA':k<.75?'treesB':k<.9?'treeA':'treeB',x,z,{w:k<.75?1.35+r()*.8:.7+r()*.3,ry:r()*6.3,aok:.3});}
  else if(sl>.38&&sl<.9&&r()<.05)FA.put('rock',x,z,{w:.7+r()*1.1,ry:r()*6.3,sink:.15});
  if((dg<34||dr<34)&&sl<.4&&r()<.45)tufts.push([x+(r()-.5)*2,z+(r()-.5)*2]);}
 for(let i=0;i<450;i++){const a=r()*6.283,d=8+r()*20,x=rv.x+Math.cos(a)*d,z=rv.z+Math.sin(a)*d;if(Math.abs(x-FA.riverX(z))>2.8)tufts.push([x,z]);}
 FA.tuftList=tufts;};

// ======================= HUD + start =======================
const TXT={gatekeeper:['Gatekeeper','one superintelligence whose only goal is to block any other'],reversion:['Reversion','technology rolled back to a pre-industrial level']};
FA.ui=function(){document.querySelectorAll('[data-city]').forEach(b=>b.classList.toggle('on',b.dataset.city===FA.CITY));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===FA.VIEW));
 const t=TXT[FA.CITY];document.getElementById('cur').innerHTML='<b>'+t[0]+'</b><span>'+t[1]+'</span>';};
FA.go=function(city,view){if(city)FA.CITY=city;if(view)FA.VIEW=view;const q=new URLSearchParams(location.search);q.set('city',FA.CITY);q.set('view',FA.VIEW);history.replaceState(null,'','?'+q.toString());FA.setView();};
document.querySelectorAll('[data-city]').forEach(b=>b.addEventListener('click',()=>FA.go(b.dataset.city)));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>FA.go(null,b.dataset.view)));
addEventListener('keydown',e=>{if(e.key==='1')FA.go('gatekeeper');if(e.key==='2')FA.go('reversion');if(e.key==='v')FA.go(null,FA.VIEW==='world'?'close':'world');});
FA.start=async function(){const t0=performance.now();await FA.load(FA.LIST);const t1=performance.now();
 FA.buildGK();FA.buildRV();FA.scatter();FA.buildTerrain(FA.colorHook);FA.tufts(FA.tuftList);const n=FA.buildInstances();
 FA.marker('gatekeeper','Gatekeeper','eye on the spire',FA.GK.x,FA.GK.top,FA.GK.z);FA.marker('reversion','Reversion','water wheel, windmill',FA.RV.x-1.5,H(FA.RV.x-1.5,FA.RV.z),FA.RV.z);
 FA.setView();FA.frame();FA.loop();FA.boot={loadMs:Math.round(t1-t0),buildMs:Math.round(performance.now()-t1),instGroups:n};document.body.classList.add('ready');window.__ready=true;};
FA.start().catch(e=>window.__errs.push('start:'+e.message));
})();
