// Futures Atlas G1 preview - proruin.js : Self-destruction ruin city (swap r7 S; new generator, our own code).
// Tegmark, Life 3.0 ch.5 "Self-destruction": superintelligence is never created because humanity drives itself extinct or into collapse
// first (nuclear war, an engineered pandemic, AI-assisted conflict, other catastrophe - not only nuclear). Describe, never judge.
// What the city literally shows: a dead city around the old impact scar (the terrain crater at the centre): broken tower stumps whose
// facade columns end at ragged heights with floor slabs sagging out of them, toppled towers lying in segments across the streets,
// roofless low shells, rubble mounds and burnt-out vehicles on a cracked street grid under grey ash; overgrowth starting - moss and
// grass reclaiming the streets toward the edge, shrubs at wall feet, a few young trees, vines on the stumps; bent bare utility masts.
// Light = a few smouldering embers in the rubble and thin smoke wisps (Q17a); no windows, no lamps, nothing powered.
// Contract: FA.PRORUIN.build(site, ctx) -> {near, mid, anim(t), stats, anchors}; site {x,z,y,radius,seed,rm,params{avoid}}.
// Uses FA.G1KIT from js/prorev.js (glow / smoke points, merged parts, MID clone). Built in its own frame at host scale 1.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
FA.PRORUIN={build(site,ctx){const K=FA.G1KIT;if(!K)throw new Error('FA.G1KIT missing (js/prorev.js)');const{hash,rng,smooth,vn,lin,Parts}=K;
 const t0=performance.now(),near=new THREE.Group();near.name='selfdestruct_near';const R=site.radius||11,y0=site.y,hA=ctx.heightAt||(()=>y0),H=(x,z)=>hA(site.x+x,site.z+z)-y0;
 const r=rng((site.seed|0)||6606),TU={uT:{value:0},uAn:{value:site.rm?0:1}},glows=[],smokes=[],mats=ctx.mats||{},PT=Parts();
 const avoid=(site.params&&site.params.avoid)||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const ph=[0,1,2,3].map(i=>hash((site.seed||5)*.17+i,1.9)*6.283),rOut=a=>R*1.5*(1+.1*Math.sin(2*a+ph[0])+.07*Math.sin(3*a+ph[1])+.05*Math.sin(5*a+ph[2])+.03*Math.sin(9*a+ph[3]));
 const CR=6.4;   // impact scar (terrain crater pit + rim, owned by the terrain) -> no buildings inside
 const GA=.42,gu=[Math.cos(GA),Math.sin(GA)],gv=[-Math.sin(GA),Math.cos(GA)],BL=3.3;   // street grid (rotated), block pitch
 const toG=(x,z)=>[x*gu[0]+z*gu[1],x*gv[0]+z*gv[1]],fromG=(a,b)=>[a*gu[0]+b*gv[0],a*gu[1]+b*gv[1]];
 const streetD=(x,z)=>{const[a,b]=toG(x,z),fa=Math.abs(a/BL-Math.round(a/BL))*BL,fb=Math.abs(b/BL-Math.round(b/BL))*BL;return Math.min(fa,fb);};
 // density: falls off outward (outskirts thin), zero in the scar
 const dens=(x,z)=>{const rr=Math.hypot(x,z),ro=rOut(Math.atan2(z,x));return rr<CR?0:(1-smooth(.55,1,rr/ro))*smooth(CR,CR+1.5,rr);};
 // palette (linear; the host lifts vertex colours to display space and applies the v4.4 night grade)
 const CON=lin('#6E6862'),CON2=lin('#5A5450'),SOOT=lin('#2A2624'),RUST=lin('#5A3E30'),MOSS=lin('#3E4A34'),LEAF=lin('#46563A'),ASH=lin('#4C4652'),CHAR=lin('#2E2A2E'),
  DUST=lin('#4E4848'),GRASS=lin('#4A5838'),ROAD=lin('#242124');
 const cv=(c,k)=>[c.r*k,c.g*k,c.b*k],mix=(a,b,t)=>[a.r+(b.r-a.r)*t,a.g+(b.g-a.g)*t,a.b+(b.b-a.b)*t];
 const B=mats.building,ST=mats.stone||B,FO=mats.foliage||B,ME=mats.metal||B;
 const lowY=(x,z,w,d)=>{let lo=1e9;for(const e of[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,0]])lo=Math.min(lo,H(x+e[0]*w,z+e[1]*d));return lo;};
 const placed=[],okAt=(x,z,rad)=>free(x,z,rad)&&placed.every(p=>Math.hypot(x-p[0],z-p[1])>rad+p[2]);
 // ---- broken tower stumps: facade columns end at ragged heights, floor slabs sag out at the break, dark hollow core ----
 const towers=[];for(let t=0;t<240&&towers.length<13;t++){const a=r()*6.283,rr=CR+1.2+r()*(R*1.05-CR-1.2),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(r()>dens(x,z)+.15)continue;
  const w=1.3+r()*1.0,d=1.2+r()*.9;if(!okAt(x,z,Math.max(w,d)*.8+.5)||streetD(x,z)<.9)continue;placed.push([x,z,Math.max(w,d)*.8]);towers.push({x,z,w,d,h:2.6+r()*5.2*(1-.4*(rr-CR)/R),ry:GA+(r()<.5?0:Math.PI/2),toward:Math.atan2(-z,-x)});}
 for(const T of towers){const y=lowY(T.x,T.z,T.w,T.d)-.15,c=Math.cos(T.ry),s=Math.sin(T.ry),L=(lx,lz)=>[T.x+lx*c+lz*s,T.z-lx*s+lz*c],FH=.55,nf=Math.floor(T.h/FH);
  const scorch=.75+.25*Math.cos(Math.atan2(T.z,T.x)-T.toward);   // faces toward the scar are darker
  PT.add(ST,PT.G.box(),T.x,y,T.z,T.w*.86,T.h*.45,T.d*.86,0,T.ry,0,cv(SOOT,.8));   // dark hollow core read through the gaps
  const ca=r()*6.283,cdx=Math.cos(ca),cdz=Math.sin(ca);   // collapse direction: the facade breaks off diagonally (high side / low side), notched
  for(const[ax,len,o]of[[0,T.w,T.d/2],[0,T.w,-T.d/2],[1,T.d,T.w/2],[1,T.d,-T.w/2]]){const nc=Math.max(2,Math.round(len/.42));for(let k=0;k<nc;k++){const u=(k+.5)/nc-.5,lx=ax?o:u*len,lz=ax?u*len:o,pj=(lx*cdx+lz*cdz)/(Math.hypot(T.w,T.d)*.5);
    const hc=T.h*(.22+.78*(.5+.5*pj))*(.62+.45*r())*(r()<.15?.45:1);
    const p=ax?L(o,u*len):L(u*len,o),cw=len/nc*.88,col=mix(CON,SOOT,(1-scorch)*.8+.25*r());PT.add(B,PT.G.box(),p[0],y,p[1],ax?.14:cw,hc,ax?cw:.14,0,T.ry,0,[col[0]*(.85+.3*r()),col[1]*(.85+.3*r()),col[2]*(.85+.3*r())]);
    if(r()<.22&&hc>1.2){const vh=hc*(.25+.4*r());PT.add(FO,PT.G.box(),p[0],y,p[1],ax?.17:cw*.8,vh,ax?cw*.8:.17,0,T.ry,0,cv(MOSS,.9+.3*r()));}}}   // vines climbing the lower facade
  const top=Math.max(1,Math.floor(nf*.4)-((r()*2)|0));for(let f=1;f<=top;f++){const yy=y+f*FH;PT.add(ST,PT.G.box(),T.x,yy-.06,T.z,T.w*.98,.07,T.d*.98,0,T.ry,0,cv(CON2,.9));}
  for(let k=0;k<2+((r()*3)|0);k++){const sd=r()<.5?1:-1,yy=y+(top-k*.6)*FH,p=L((r()-.5)*T.w*.5,sd*T.d*.5);PT.add(ST,PT.G.box(),p[0],yy,p[1],T.w*(.4+.4*r()),.07,.9+r()*.6,(r()-.5)*.6+sd*.35,T.ry,(r()-.5)*.3,cv(CON2,.85));}   // slabs sagging out of the break
  for(let k=0;k<5;k++){const a=r()*6.283,dd=Math.max(T.w,T.d)*.55+r()*1.1,x=T.x+Math.cos(a)*dd,z=T.z+Math.sin(a)*dd,s2=.3+r()*.5;PT.add(ST,PT.G.ico(0),x,H(x,z)+s2*.15,z,s2*1.3,s2*.55,s2,r(),r()*3,r(),cv(DUST,.8+.3*r()));}   // debris at the foot
  if(r()<.6){const a=r()*6.283,x=T.x+Math.cos(a)*(T.w*.7+.3),z=T.z+Math.sin(a)*(T.d*.7+.3);PT.add(FO,PT.G.ico(1),x,H(x,z)+.18,z,.38,.3,.38,0,0,0,cv(LEAF,.9+.3*r()));}
  if(r()<.7)glows.push({x:T.x+(r()-.5)*T.w*.6,y:y+.35,z:T.z+(r()-.5)*T.d*.6,size:.7+r()*.45,c:lin('#C2502A').multiplyScalar(.7+.3*r()),an:[.35,2.5+r()*3,r()*6,1]});}
 // ---- toppled towers: lying in 2-3 broken segments across the streets (fallen away from the scar on the inner ring, random outside) ----
 const fallen=[];for(let t=0;t<120&&fallen.length<4;t++){const a=r()*6.283,rr=CR+1+r()*(R-CR),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(r()>dens(x,z)+.1||!okAt(x,z,1.2))continue;
  const dir=rr<R*.7?Math.atan2(z,x)+(r()-.5)*.6:r()*6.283,len=5+r()*4,w=1+r()*.6;let ok=true;for(let s=.3;s<=1;s+=.35){const px=x+Math.cos(dir)*len*s,pz=z+Math.sin(dir)*len*s;if(Math.hypot(px,pz)<CR+.5||!free(px,pz,.8))ok=false;}if(!ok)continue;
  fallen.push(1);placed.push([x,z,1.2]);let u=0;const nseg=2+((r()*2)|0);for(let k=0;k<nseg;k++){const sl=len/nseg*(.85+.2*r()),cx=x+Math.cos(dir)*(u+sl/2),cz=z+Math.sin(dir)*(u+sl/2),yy=H(cx,cz)-.12;u+=sl+.25+r()*.4;
   const ry=-dir+Math.PI/2+(r()-.5)*.12,sh=.9+r()*.3;PT.add(B,PT.G.box(),cx,yy,cz,w,sh,sl,(r()-.5)*.08,ry,(r()-.5)*.14,cv(CON,.8+.25*r()));
   for(let j=0;j<Math.round(sl/.55);j++){const q=-sl/2+(j+.5)*sl/Math.round(sl/.55),px=cx+Math.cos(dir)*q,pz=cz+Math.sin(dir)*q;PT.add(ST,PT.G.box(),px,yy+sh-.02,pz,w*1.02,.05,.08,0,ry,0,cv(SOOT,1));}   // window-band seams on the fallen face
   for(let j=0;j<3;j++){const a2=r()*6.283,px=cx+Math.cos(a2)*(w*.7+r()*.6),pz=cz+Math.sin(a2)*(w*.7+r()*.6),s2=.25+r()*.4;PT.add(ST,PT.G.ico(0),px,H(px,pz)+s2*.12,pz,s2*1.2,s2*.5,s2,r(),r()*3,r(),cv(DUST,.8+.3*r()));}}}
 // ---- roofless low shells (2-3 storeys): four walls broken to jagged stubs, collapsed roof slab leaning inside ----
 let shells=0;for(let t=0;t<500&&shells<26;t++){const a=r()*6.283,rr=CR+.8+Math.pow(r(),.8)*(rOut(a)*.9-CR-.8),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(r()>dens(x,z)+.08)continue;
  const w=1+r()*1.3,d=.9+r()*1.0;if(!okAt(x,z,Math.max(w,d)*.6+.25)||streetD(x,z)<.7)continue;placed.push([x,z,Math.max(w,d)*.6]);shells++;
  const ry=GA+(r()<.5?0:Math.PI/2)+(r()-.5)*.1,c=Math.cos(ry),s=Math.sin(ry),y=lowY(x,z,w,d)-.1,hh=.7+r()*1.0,L=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c];
  for(const[ax,len,o]of[[0,w,d/2],[0,w,-d/2],[1,d,w/2],[1,d,-w/2]]){const nc=Math.max(2,Math.round(len/.36));for(let k=0;k<nc;k++){if(r()<.18)continue;const u=(k+.5)/nc-.5,p=ax?L(o,u*len):L(u*len,o),cw=len/nc*.95,h2=hh*(.35+.65*r());
    PT.add(B,PT.G.box(),p[0],y,p[1],ax?.12:cw,h2,ax?cw:.12,0,ry,0,cv(r()<.5?CON:CON2,.8+.3*r()));}}
  PT.add(ST,PT.G.box(),x,y+.1,z,w*.5,.06,d*.45,(r()<.5?-1:1)*(.5+.5*r()),ry,(r()-.5)*.6,cv(SOOT,1.1));   // fallen roof slab leaning inside (interior stays open)
  if(r()<.45){const p=L((r()-.5)*w*.6,(r()-.5)*d*.6);PT.add(FO,PT.G.ico(1),p[0],H(p[0],p[1])+.15,p[1],.3+r()*.2,.25,.3+r()*.2,0,0,0,cv(LEAF,.8+.4*r()));}   // shrub growing inside
  if(r()<.2)glows.push({x:x+(r()-.5)*w*.5,y:y+.25,z:z+(r()-.5)*d*.5,size:.45+r()*.25,c:lin('#C2502A').multiplyScalar(.45+.2*r()),an:[.4,2+r()*3,r()*6,1]});}
 // ---- rubble mounds, burnt-out vehicles, bent bare masts, young trees, overgrowth clumps ----
 for(let t=0;t<700;t++){const a=r()*6.283,rr=CR*.92+Math.pow(r(),.9)*(rOut(a)*.95-CR*.92),x=Math.cos(a)*rr,z=Math.sin(a)*rr,de=dens(x,z)+(rr<CR+1.5&&rr>CR*.92?.25:0);if(r()>de||!free(x,z,.3))continue;
  // concrete chunks: mostly angular blocks (vision r7: big icosahedra read as a boulder field), a few low heaps
  const s2=.12+r()*.3*(rr<CR+2?1.25:1);if(r()<.75)PT.add(ST,PT.G.box(),x,H(x,z)-.04,z,s2*(1+r()),s2*(.35+.5*r()),s2*(.6+r()*.8),(r()-.5)*.7,r()*3,(r()-.5)*.7,cv(r()<.3?SOOT:r()<.6?DUST:CON2,.8+.3*r()));
  else PT.add(ST,PT.G.ico(0),x,H(x,z)+s2*.05,z,s2*1.6,s2*.35,s2*1.3,r()*.3,r()*3,r()*.3,cv(r()<.4?SOOT:DUST,.8+.3*r()));
  if(r()<.035)glows.push({x,y:H(x,z)+.2,z,size:.5+r()*.35,c:lin('#B85A30').multiplyScalar(.6+.3*r()),an:[.45,1.8+r()*2.5,r()*6,1]});}
 for(let k=0;k<6;k++){const a=k/6*6.283+r()*.7,rr=CR+.4+r()*1.2,x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(free(x,z,.3))glows.push({x,y:H(x,z)+.2,z,size:.55+r()*.3,c:lin('#C2502A').multiplyScalar(.6+.3*r()),an:[.4,2+r()*3,r()*6,1]});}   // embers along the crater lip
 for(let t=0;t<200;t++){const a=r()*6.283,rr=CR+1+r()*(R*1.2-CR),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(streetD(x,z)>.35||r()>dens(x,z)*.35||!free(x,z,.4))continue;
  const[ga,gb]=toG(x,z),alongA=Math.abs(gb/BL-Math.round(gb/BL))<Math.abs(ga/BL-Math.round(ga/BL)),ry=GA+(alongA?0:Math.PI/2)+(r()-.5)*.5,yy=H(x,z);
  PT.add(ME,PT.G.box(),x,yy-.01,z,.34,.16,.72,(r()-.5)*.2,-ry,r()<.15?Math.PI*.5:(r()-.5)*.2,cv(r()<.5?RUST:SOOT,.9+.3*r()));PT.add(ME,PT.G.box(),x,yy+.2,z,.3,.12,.38,0,-ry,0,cv(SOOT,.9));}
 for(let k=0;k<5;k++){const a=k/5*6.283+r()*.6,rr=R*(.75+r()*.4),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(!free(x,z,.5))continue;const yy=H(x,z),hh=2.4+r()*1.4,lean=.25+r()*.35,ry=r()*6.283;
  PT.add(ME,PT.G.cyl(5,.75),x,yy-.1,z,.06,hh,.06,lean,ry,0,cv(SOOT,1.2));PT.add(ME,PT.G.box(),x+Math.sin(lean)*hh*.9*Math.sin(ry),yy+Math.cos(lean)*hh*.92,z+Math.sin(lean)*hh*.9*Math.cos(ry),.9,.05,.05,lean,ry,0,cv(SOOT,1.2));}
 for(let t=0;t<900;t++){const a=r()*6.283,rr=CR+.5+Math.sqrt(r())*(rOut(a)*1.02-CR-.5),x=Math.cos(a)*rr,z=Math.sin(a)*rr,og=smooth(R*.35,R*1.25,rr);if(r()>.08+og*.5||!free(x,z,.2))continue;
  if(r()<.12*og+.02){const ts=.6+r()*.7,yy=H(x,z);PT.add(B,PT.G.cyl(5,.7),x,yy,z,.05,ts,.05,0,0,0,cv(SOOT,1.4));PT.add(FO,PT.G.ico(1),x,yy+ts*1.05,z,.34*ts+.12,.42*ts+.1,.34*ts+.12,0,r()*3,0,cv(LEAF,.85+.35*r()));}
  else{const s2=.14+r()*.22;PT.add(FO,PT.G.ico(0),x,H(x,z)+s2*.3,z,s2*1.3,s2*.7,s2*1.3,0,r()*3,0,cv(r()<.5?MOSS:GRASS,.85+.35*r()));}}
 // ---- ground: grey ash over a cracked street grid; char toward the scar; moss / grass reclaiming the streets outward; feathered edge ----
 {const E=R*1.62,N=66,pos=[],col=[],idx=[];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-E+2*E*i/N,z=-E+2*E*j/N,rr=Math.hypot(x,z),ro=rOut(Math.atan2(z,x)),h=H(x,z),n1=vn(x*.45+3,z*.45-2),n2=vn(x*1.3,z*1.3);
   let c=mix(ASH,DUST,.35*n1);const sd=streetD(x,z);if(sd<.46&&rr>CR)c=mix({r:c[0],g:c[1],b:c[2]},ROAD,.85*smooth(.46,.2,sd)*(.6+.4*n2));
   const ch=1-smooth(CR*.8,CR+3.5,rr*(1+.25*(n1-.5)));c=mix({r:c[0],g:c[1],b:c[2]},CHAR,ch*.8);
   const og=smooth(R*.45,R*1.35,rr)*smooth(.35,.7,n1*.6+n2*.4);c=mix({r:c[0],g:c[1],b:c[2]},MOSS,og*.75);
   let al=1-smooth(.72,1,rr/ro);pos.push(x,h+.045,z);col.push(c[0],c[1],c[2],al);}
  const A=k=>col[k*4+3]>.01;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,d=a+N+1,e=d+1;if(A(a)||A(b)||A(d)||A(e))idx.push(a,d,b,b,d,e);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,mats.ground||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));m.name='sd_ground_ash';m.renderOrder=1;near.add(m);}
 // ---- smoke wisps from three smouldering spots (thin, dark grey, slow) ----
 const wisp=glows.filter((g,i)=>i%5===0).slice(0,4);wisp.forEach((g,j)=>{for(let k=0;k<6;k++)smokes.push({x:g.x,y:g.y+.2,z:g.z,period:9+j*1.3,phase:k/6+j*.11,c:new THREE.Color('#8A8290'),size:1.1});});
 const pst=PT.flush(near,'sd_parts'),tb=performance.now();
 const gp=K.glowPoints(glows,near,TU,ctx,1,.85),sp=K.smokePoints(smokes,near,TU,ctx,1,{k:.15,rise:3.2});const T=K.cloneTier(near,'selfdestruct_mid');
 const out={near,mid:T.mid,TU,anim(t){TU.uT.value=t;if(gp)gp.sync();if(sp)sp.sync();}};
 let tris=0,draws=0;near.traverse(m=>{if((m.isMesh||m.isPoints)&&m.geometry){draws++;const g=m.geometry;tris+=m.isPoints?0:(g.index?g.index.count/3:g.attributes.position.count/3);}});
 out.stats={nearTris:Math.round(tris),nearDraws:draws,midTris:Math.round(tris),midDraws:draws,towers:towers.length,fallen:fallen.length,shells,embers:glows.length,smokes:smokes.length,parts:pst,buildMs:+(tb-t0).toFixed(1)};
 out.anchors={scar:{x:0,y:H(0,0),z:0}};return out;}};
})();
