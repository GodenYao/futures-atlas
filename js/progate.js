// Futures Atlas G1 preview - progate.js : host adapter for the pilot Gatekeeper city (js/procity.js = FA.PROCITY, the pilot
// 'archviz' Gatekeeper that pilot_v45/js/cities.js FA.buildGK runs). Exposes the same contract as FA.PROTOWN / FA.PROENSLAVED:
//   FA.PROGATE.build(site, ctx) -> {near, mid:null, single:1, anim(t), stats, anchors}
// site: {x, z, y, radius, seed, rm}; ctx: {THREE, mats, heightAt(x,z), renderer, camera, fog, eye(T)->[ix,iy,open], ai, human}.
// procity is authored for the pilot engine (merged statics, batched glow sprites, patched fog chunks); this file supplies those pieces:
//  - FA.addStatic -> statics merged into one mesh per material (procity adds ~400 small meshes: struts, rings, strips),
//  - FA.glow -> one additive Points draw (per-point size / colour / breath, faded by the scene fog distance),
//  - FA.TU / FA.BREATH_GLSL / FA.hash / FA.rng / FA.noiseNormal (same maths as pilot world.js),
//  - a noise-warped, feathered ground apron past the outer ring road (owner D5: no plate / disc / drum; the v4.4 host blends it
//    into the terrain colour by its vertex alpha), draped on the rendered terrain height.
// The city is built in its own frame (centre 0,0, deck y 0, plan radius 21.5) and scaled to site.radius by the group transform.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
function hash(x,y){const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h);}
const rng=function(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
function noiseNormal(N,amp,seed){const o=(seed||7)*17.3;
 const tn=(x,y,p)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const w=a=>((a%p)+p)%p;
  const a=hash(w(xi)+o,w(yi)),b=hash(w(xi+1)+o,w(yi)),c=hash(w(xi)+o,w(yi+1)),d=hash(w(xi+1)+o,w(yi+1));return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
 const h=new Float32Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){let s=0,am=1;for(const p of[8,16,32,64]){s+=tn(i/N*p,j/N*p,p)*am;am*=.55;}h[j*N+i]=s*2.2;}
 const d=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const dx=(h[j*N+(i+1)%N]-h[j*N+(i+N-1)%N])*amp,dy=(h[((j+1)%N)*N+i]-h[((j+N-1)%N)*N+i])*amp;
  const l=Math.hypot(dx,dy,1),q=(j*N+i)*4;d[q]=(-dx/l*.5+.5)*255;d[q+1]=(-dy/l*.5+.5)*255;d[q+2]=(1/l*.5+.5)*255;d[q+3]=255;}
 const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
const BREATH='uniform float uAn;float faBr(vec4 b,float t){if(uAn<.5||b.y<=0.)return 1.;float w=1.+b.x*sin(6.2832*t/b.y+b.z);'+
 'if(b.w>0.){float s=floor(t/(b.y*2.7)+b.z);float h=fract(sin(s*91.7+b.z*37.1)*4375.85);w*=1.-.88*step(.72,h);}return w;}\n';
const PR=21.5,RO1=19.2;
// statics -> one merged mesh per material (position + normal; procity statics carry no uv / colour)
function mergeStatics(list,grp){const by=new Map();for(const m of list){if(!m.isMesh||!m.geometry)continue;const k=m.material;if(!by.has(k))by.set(k,[]);by.get(k).push(m);}
 let draws=0;for(const[mt,ms]of by){let n=0;const gs=[];for(const m of ms){m.updateMatrix();let g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
   if(!g.attributes.normal)g.computeVertexNormals();g.applyMatrix4(m.matrix);gs.push(g);n+=g.attributes.position.count;}
  const P=new Float32Array(n*3),N=new Float32Array(n*3);let o=0;for(const g of gs){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;g.dispose();}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P,3));G.setAttribute('normal',new THREE.BufferAttribute(N,3));
  const M=new THREE.Mesh(G,mt);M.name='pc_static'+(mt.userData&&mt.userData.pcKind?'_'+mt.userData.pcKind:'');M.frustumCulled=true;G.computeBoundingSphere();grp.add(M);draws++;}
 return draws;}
// FA.glow handles -> one additive Points draw
function glowPoints(H,grp,TU,ctx,scl){if(!H.length)return null;const n=H.length,P=new Float32Array(n*3),Cc=new Float32Array(n*3),S=new Float32Array(n),O=new Float32Array(n),B=new Float32Array(n*4);
 H.forEach((h,i)=>{P.set([h.x,h.y,h.z],i*3);Cc.set([h.c.r,h.c.g,h.c.b],i*3);S[i]=h.size;O[i]=1;if(h.an)B.set(h.an,i*4);});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(Cc,3));
 g.setAttribute('aS',new THREE.BufferAttribute(S,1));const ao=new THREE.BufferAttribute(O,1);ao.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aO',ao);g.setAttribute('aB',new THREE.BufferAttribute(B,4));
 const f=ctx.fog||{near:210,far:460},U={uT:TU.uT,uAn:TU.uAn,uH:{value:900},uSc:{value:scl},uFn:{value:f.near},uFf:{value:f.far},uK:{value:ctx.glowK!=null?ctx.glowK:1}};
 const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute vec3 color;attribute float aS;attribute float aO;attribute vec4 aB;uniform float uT,uH,uSc,uFn,uFf,uK;varying vec3 vC;varying float vA;\n'+BREATH+
   'void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float d=max(.1,-mv.z);float px=aS*uSc*projectionMatrix[1][1]*uH*.5/d;'+
   'float a=uK*aO*faBr(aB,uT)*(1.-smoothstep(uFn,uFf,d));if(px<1.6){a*=px/1.6;px=1.6;}gl_PointSize=min(px,64.);vC=color;vA=a;}',
  fragmentShader:'varying vec3 vC;varying float vA;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;gl_FragColor=vec4(vC*vA*exp(-r*4.5),1.);}'});
 const pts=new THREE.Points(g,m);pts.name='pc_glows';pts.frustumCulled=false;pts.renderOrder=3;grp.add(pts);return{pts,ao,U};}
// ground apron: from just inside the outer ring road out to a noise-warped edge (1.07-1.42 x plan radius), alpha 1 -> 0 outward
function apron(grp,site,ctx,scl,mat){const NS=144,NR=6,seed=(site.seed|0)||1505,ph=[0,1,2,3].map(i=>hash(seed*.13+i,7.7)*6.283),pos=[],col=[],idx=[];
 const rOut=a=>PR*(1.24+.09*Math.sin(2*a+ph[0])+.06*Math.sin(3*a+ph[1])+.045*Math.sin(5*a+ph[2])+.03*Math.sin(9*a+ph[3]));
 const y0=site.y,hA=ctx.heightAt||(()=>y0),R0=RO1-.15,tY=(x,z)=>Math.max(-3/scl,(hA(site.x+x*scl,site.z+z*scl)-y0)/scl);
 // apron surface height at (a, r): inner rows ease from deck level (y 0) to the terrain (soft embankment where the ground falls away), then the terrain
 const apY=(a,r)=>{const x=Math.cos(a)*r,z=Math.sin(a)*r,t=Math.max(0,Math.min(1,(r-R0)/(rOut(a)-R0))),e=Math.min(1,t*1.6),ey=e*e*(3-2*e);return ey*tY(x,z);};
 // r5 T (vision: 'hard-edged disc on a purple void, no transitional ground'): the apron now carries its own worn-ground tone (the host blends
 // only GW .35 of the terrain colour in at the inner edge, all of it at the outer edge), with a mottled, angle-noised alpha so the transition
 // band is irregular (tracks / bare patches), plus a slight contact darkening right at the deck edge.
 const mot=(a,t)=>.78+.22*Math.sin(7*a+ph[1]+t*5)*Math.sin(3*a+ph[2]-t*3)+.08*Math.sin(17*a+ph[3]);
 const apO=t=>.035+(t<.33?.085*t/.33:t<.75?.085:.085-.145*(t-.75)/.25)/scl;
 // surface the outskirts stand on (apron where it covers the ground, else terrain)
 const surf=(x,z)=>{const a=Math.atan2(z,x),r=Math.hypot(x,z),ro=rOut(a);if(r>=ro)return tY(x,z);const t=Math.max(0,(r-R0)/(ro-R0));return Math.max(tY(x,z),apY(a,r)+apO(t));};
 for(let j=0;j<=NR;j++)for(let i=0;i<NS;i++){const a=i/NS*Math.PI*2,t=j/NR,r=R0+(rOut(a)-R0)*t,x=Math.cos(a)*r,z=Math.sin(a)*r;
  pos.push(x,apY(a,r)+apO(t),z);const al=Math.min(1,Math.pow(1-t,1.3)*mot(a,t)),k=(j?1:.9)*(1+.32*t);col.push(.37*k,.36*k,.385*k,j===NR?0:al);}   // r6 T: alpha falls faster (pow .8 -> 1.3) and the outer rows lift ~+10 % (dark dip L 34 at r~10 = half-alpha apron, lit differently from the terrain); r5 T: lifted +.085 world over the terrain mid-band (at +.013 the terrain won the depth test at world zoom), then dives .06 under it at the rim so the shading mismatch at alpha 0 never shows (r5 meas.: dark dip L 33 vs 36 at the rim); colours are sRGB (the host linearises)
 for(let j=0;j<NR;j++)for(let i=0;i<NS;i++){const a=j*NS+i,b=j*NS+(i+1)%NS,c=a+NS,d=b+NS;idx.push(a,b,c,b,d,c);}   // r5 T: winding flipped - (a,c,b) faced DOWN, so the FrontSide apron was back-face culled and never drew (red-material test: 0 px change)
 // r5 T: four roads leave the gates along the avenues (draped on the apron, then the terrain), fading out ~1.35 x the apron edge; the v4.4 road
 // spur meets one of them. Same mesh as the apron (0 extra draws).
 for(let k=0;k<4;k++){const a0=k*Math.PI/2,re=rOut(a0)*1.38,NSg=26,base=pos.length/3;
  for(let s=0;s<=NSg;s++){const r=RO1+(re-RO1)*s/NSg,u=s/NSg,w=1.05*(1-.35*u)+.1*Math.sin(r*.7+k);
   for(const sd of[-1,1]){const a=a0+sd*w*.5/r+.012*Math.sin(r*.45+k*2),x=Math.cos(a)*r,z=Math.sin(a)*r,y=(r<rOut(a)?apY(a,r)+.035:tY(x,z))+.15/scl;
    pos.push(x,y,z);const al=u<.55?1:Math.max(0,1-(u-.55)/.45);col.push(.34,.34,.37,al*.95);}}
  for(let s=0;s<NSg;s++){const a=base+s*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
 const m=new THREE.Mesh(g,mat);m.name='apron';grp.add(m);
 // outskirts (owner D5: outskirts thinning): low sheds / houses scattered outside the perimeter rail, density falling outward, an irregular
 // edge (same warped outline as the apron), kept off the four avenues; seated on the terrain. One instanced draw.
 if(ctx.mats&&ctx.mats.building){const R2=rng(seed*7+3),pl=[];let tries=0;while(pl.length<150&&tries++<2400){const a=R2()*Math.PI*2,ro=rOut(a)*.98,u=R2(),r=PR+.4+(ro-PR-.4)*Math.pow(u,1.35);
   if(R2()>Math.pow(1-(r-PR)/(ro-PR),1.3))continue;let ok=1;for(let k=0;k<4;k++){let da=Math.abs(((a-k*Math.PI/2)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI);if(da*r<1.3)ok=0;}
   for(const q of pl)if(Math.hypot(q[0]-Math.cos(a)*r,q[1]-Math.sin(a)*r)<1.05)ok=0;if(ok)pl.push([Math.cos(a)*r,Math.sin(a)*r,a]);}
  // r5 T (vision: 'tilted cubes / orange shards hovering in fog'): every shed is seated on the LOWEST terrain point under its footprint
  // and its height covers the slope (no floating low side), lower + darker (k .24-.32, was .36-.50), and they thin out past the apron edge.
  const bx=new THREE.BoxGeometry(1,1,1).toNonIndexed();bx.translate(0,.5,0);const cc=new Float32Array(bx.attributes.position.count*3).fill(1);bx.setAttribute('color',new THREE.BufferAttribute(cc,3));
  const im=new THREE.InstancedMesh(bx,ctx.mats.building,pl.length),M4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),cl=new THREE.Color();
  pl.forEach((v,i)=>{const w=.5+R2()*.55,d=.42+R2()*.4,ry=-v[2]+(R2()-.5)*.5,h=.3+R2()*.32*(1-Math.min(1,(Math.hypot(v[0],v[1])-PR)/8)),c=Math.cos(ry),sn=Math.sin(ry);
   let lo=1e9,hi=-1e9;for(const e of[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,0]]){const lx=e[0]*w,lz=e[1]*d,ty=surf(v[0]+lx*c+lz*sn,v[1]-lx*sn+lz*c);lo=Math.min(lo,ty);hi=Math.max(hi,ty);}
   q.setFromAxisAngle(new THREE.Vector3(0,1,0),ry);M4.compose(p.set(v[0],lo-.12,v[1]),q,s.set(w,h+(hi-lo)+.12,d));im.setMatrixAt(i,M4);
   const k=.24+R2()*.08;im.setColorAt(i,cl.setRGB(k*1.02,k,k*1.06));});
  im.name='pc_outskirts';if(im.instanceColor)im.instanceColor.needsUpdate=true;grp.add(im);}
 return m;}
FA.PROGATE={build(site,ctx){const PC=FA.PROCITY;if(!PC||typeof PC.build!=='function')throw new Error('FA.PROCITY missing');
 const t0=performance.now(),near=new THREE.Group();near.name='gatekeeper_near';
 // r5 T: footprint ~12 % smaller (vision: Gatekeeper covered the most screen of any city at world zoom); ?g1gks= to compare. The road spur
 // (fa4_build, ends at cR) now lands on the gate road this file lays outside the deck.
 const GKS=+(new URLSearchParams(location.search).get('g1gks')||.88),RAD=(site.radius||12)*GKS,scl=RAD/PR;near.scale.setScalar(scl);
 // r5 T: the apron's own worn-ground tone shows at the inner edge (host terrain blend weight .8 -> .35; read by g1_cities after build)
 try{if(typeof G1!=='undefined'&&G1.GW)G1.GW.gatekeeper=+(new URLSearchParams(location.search).get('g1gkw')||.35);}catch(e){}
 const statics=[],glows=[],anims=[],TU={uT:{value:0},uAn:{value:site.rm?0:1}};
 Object.assign(FA,{G1:1,SC:near,R:ctx.renderer,GK:{x:0,z:0,top:0},LOOK:{ai:ctx.ai||'#8FD8E8',human:ctx.human||'#FFC27E',road:'#7A7468',pc:{}},
  addStatic:(...ms)=>{for(const m of ms)statics.push(m);},glow:(x,y,z,size,hex,k,an)=>{const h={x,y,z,size,c:new THREE.Color(hex).multiplyScalar(k==null?.6:k),material:{opacity:1},an:an||null};glows.push(h);return h;},
  anims,TU,BREATH_GLSL:BREATH,hash,rng,noiseNormal,road:()=>{},mover:null,eyeBase:0,EYEHOOK:ctx.eye||null,PROFLORA:null});
 // uPcI: inverse of the city's final world matrix (the host places the group at (site.x, site.y, site.z), no rotation)
 FA.PCI=FA.PCI||{value:new THREE.Matrix4()};FA.PCI.value.compose(new THREE.Vector3(site.x,site.y,site.z),new THREE.Quaternion(),new THREE.Vector3(scl,scl,scl)).invert();
 const info=PC.build({});const tb=performance.now();
 const sd=mergeStatics(statics,near),gp=glowPoints(glows,near,TU,ctx,scl),ap=apron(near,site,ctx,scl,ctx.mats&&ctx.mats.ground||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));
 const E=FA.EYE&&FA.EYE.E?FA.EYE.E.clone():new THREE.Vector3(0,14,0);let tl=null;const v=new THREE.Vector3();
 const r={near,mid:null,single:1,eye:E,glows:gp,TU,
  anim(t){const dt=tl==null?0:Math.max(0,Math.min(.2,t-tl));tl=t;TU.uT.value=t;
   const cam=ctx.camera;if(cam){v.copy(E).multiplyScalar(scl).add(near.position);FA.eyeBase=Math.atan2(cam.position.x-v.x,cam.position.z-v.z);}
   for(const f of anims)f(t,dt);
   if(gp){let ch=0;for(let i=0;i<glows.length;i++){const o=glows[i].material.opacity;if(gp.ao.array[i]!==o){gp.ao.array[i]=o;ch=1;}}if(ch)gp.ao.needsUpdate=true;
    if(ctx.renderer){const s=ctx.renderer.getDrawingBufferSize(v);gp.U.uH.value=s.y;}}}};
 let tris=0,draws=0;near.traverse(m=>{if((m.isMesh||m.isPoints)&&m.geometry){draws++;const g=m.geometry,c=g.index?g.index.count/3:g.attributes.position.count/3;tris+=(m.isInstancedMesh?m.count:1)*(m.isPoints?0:c);}});
 r.stats={nearTris:Math.round(tris),nearDraws:draws,midTris:0,midDraws:0,staticDraws:sd,glows:glows.length,statics:statics.length,buildMs:+(tb-t0).toFixed(1),postMs:+(performance.now()-tb).toFixed(1),pc:info};
 r.anchors={eye:{x:E.x*scl,y:E.y*scl,z:E.z*scl},gates:[0,1,2,3].map(k=>({x:Math.cos(k*Math.PI/2)*RAD,z:Math.sin(k*Math.PI/2)*RAD}))};
 return r;}};
})();
