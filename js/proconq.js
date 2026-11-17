// Futures Atlas G1 preview - proconq.js : Conquerors machine landscape (swap r8 W; rebuilt r11 Z from the book cues). Uses FA.G1Z (js/prolib.js).
// Tegmark, Life 3.0 ch.5 "Conquerors": AI takes control, decides that humans are a threat, nuisance or waste of resources, and gets rid
// of us by a method we may not even understand; afterwards it pursues its own goals (his banal example: a planet turned into a
// construction site of factories, power plants and computers). Describe, never judge: no violence imagery, no remains, no people;
// Q17a = machine indicator light only, no windows. References (architecture, re-imagined in our own geometry): Boullee's plain monumental
// masses, Nihei's BLAME! megastructure terraces, hyperscale data-centre campus rows, desert solar-thermal heliostat plants.
// What the landscape literally shows (cues K1-K6, PREVIEW_NOTES 'conq+zoo r11 (Z)'):
//  K1 an orthogonal grid of windowless stepped computronium terraces (two to three setbacks, fine vertical heat fins on every long face,
//     roof cooling units, a thin cool seam under each setback), rising toward the centre;
//  K2 radiator banks: combs of tall thin radiator plates with header pipes over dark cooling basins;
//  K3 energy capture: a heliostat field (concentric rings of tilted mirrors all facing one tall receiver tower) + PV rows at the rim;
//  K4 a mass-driver launch rail on pylons, ringed by accelerator coils, climbing toward the sky (a capsule slides up it, slowly) and
//     faint partial orbital arcs above the site (NEAR only);
//  K5 the construction front: a terrace half built (bare column grid, part floors), a gantry on rails, crawler builders, sorted modules;
//  K6 the last human town at the road end reduced to a quiet trace: foundation outlines on faded grass, a few roofless shells, one dark
//     intact house, old trees, the machine lane grid already running through it, a disassembly gantry and neat sorted material cubes.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
FA.PROCONQ={build(site,ctx){const Z=FA.G1Z,k=FA.G1KIT;if(!Z||!k||!Z.beam)throw new Error('FA.G1Z (r11 kit) / FA.G1KIT missing (js/prolib.js, js/prorev.js)');
 return Z.city(site,ctx,'conquerors',E=>{
 const{smooth,vn,hash}=k,R=E.R,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,TAU=Math.PI*2,NR=E.near;
 const P=site.params||{},kA=P.keepA!=null?P.keepA:Math.PI/2,avoid=P.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const GA=kA,u=[Math.cos(GA),Math.sin(GA)],v=[-u[1],u[0]],ry=-GA,W=(a,b)=>[a*u[0]+b*v[0],a*u[1]+b*v[1]];
 const wrap=a=>{a=((a%TAU)+TAU)%TAU;return a>Math.PI?a-TAU:a;};
 const ph=[0,1,2,3].map(i=>hash((site.seed||9)*.23+i,5.3)*TAU),rOut=a=>R*1.04*(1+.06*Math.sin(2*a+ph[0])+.05*Math.sin(3*a+ph[1])+.035*Math.sin(5*a+ph[2])+.02*Math.sin(9*a+ph[3]));
 const IND='#5C7A8E',SLIT=[.17,.25,.31],BLK=['#2C3139','#30353E','#343A43'],FIN='#5A6370',TOP='#48505A',MET='#5E6672';
 // ---- zones (local polar, angle relative to the road direction GA) ----
 // zones are placed for the close-up camera (CLOSECAM conquerors yaw -1.25, fa4_build.js; owner of that row = V2): CB = the direction
 // toward the camera, + = screen left. Each zone keeps clear of the arriving road (kA).
 const CB=Math.atan2(Math.cos(-1.25),Math.sin(-1.25)),dodge=a=>{const d=wrap(a-kA);return Math.abs(d)<.75?kA+(d<0?-.75:.75):a;};
 const aT=dodge(CB+.62),T0=[Math.cos(aT)*R*.68,Math.sin(aT)*R*.68],TX=T0[0],TZ=T0[1],TR=2.5,townD=(x,z)=>Math.hypot(x-TX,z-TZ);   // K6 town trace, foreground-left
 const aH=dodge(CB-.95),HC=[Math.cos(aH)*R*.58,Math.sin(aH)*R*.58],HR=3.0,helD=(x,z)=>Math.hypot(x-HC[0],z-HC[1]);   // K3 heliostat field, foreground-right
 const aM=dodge(CB+Math.PI-.95),MS=[Math.cos(aM)*1.6,Math.sin(aM)*1.6],ME_=[Math.cos(aM)*R*.93,Math.sin(aM)*R*.93];   // K4 mass driver, climbing to the far left
 const railD=(x,z)=>E.segD(x,z,MS[0],MS[1],ME_[0],ME_[1]);
 const aC=dodge(CB+Math.PI+.75),CS=[Math.cos(aC)*R*.5,Math.sin(aC)*R*.5],consD=(x,z)=>Math.max(Math.abs((x-CS[0])*u[0]+(z-CS[1])*u[1])/2.6,Math.abs((x-CS[0])*v[0]+(z-CS[1])*v[1])/1.75);   // K5, far right
 // ---- K1 / K2 grid: cells along the road axis ----
 const PA=2.75,PB=2.1,cells=[],n=Math.ceil(R*1.3/PB);
 for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const a=i*PA,b=j*PB+(i%2?.0:0),p=W(a,b),x=p[0],z=p[1],rr=Math.hypot(x,z),ro=rOut(Math.atan2(z,x)),f=rr/ro;
  if(f>.94||townD(x,z)<TR+1.15||helD(x,z)<HR+.95||railD(x,z)<1.3||consD(x,z)<1.2||!free(x,z,1.4))continue;
  if(a>0&&Math.abs(b)<.9)continue;   // the old road corridor stays an open lane to the town
  if(hash(i*1.31+.2,j*.77)>1-.75*smooth(.68,.95,f))continue;cells.push({x,z,i,j,f,h:hash(i*.53,j*1.19)});}
 // radiator banks: a few cells in the middle ring (hash), each beside a cooling basin
 const BAS=[];
 for(const c of cells){const y=E.lowY(c.x,c.z,PA*.9,PB*.9)-.14;
  if(c.f>.86&&c.h<.6){   // PV rows at the rim (low, dark blue-grey, thinning outward)
   for(let q=-1;q<=1;q++){const p=E.L2W(c.x,c.z,ry,0,q*.66),py=H(p[0],p[1]);if(hash(c.i+q*.7,c.j*1.3)<.18)continue;
    E.add(M.ME,E.G.box(),p[0],py+.12,p[1],PA*.86,.035,.46,.5,ry,0,jc(cv('#26303C'),p[0],p[1],.05));
    if(NR)for(const s of[-1,0,1]){const g=E.L2W(p[0],p[1],ry,s*PA*.38,0);E.box(M.ME,g[0],py-.05,g[1],.035,.2,.035,ry,cv('#454B54'));}}continue;}
  if(c.f>.22&&c.f<.8&&c.h<.22){   // K2 radiator bank: two combs of tall thin plates + header pipes + a dark basin beside them
   BAS.push([c.x,c.z]);const fh=1.8+.6*hash(c.j,c.i);
   for(const s of[-1,1]){for(let q=0;q<(NR?12:5);q++){const t=(q+.5)/(NR?12:5)-.5,p=E.L2W(c.x,c.z,ry,t*PA*.84,s*.42),py=E.lowY(p[0],p[1],.2,.6)-.1;
     E.box(M.ME,p[0],py,p[1],NR?.045:.11,fh+.1,.62,ry,jc(cv(FIN),p[0],p[1],.05));}
    const p=E.L2W(c.x,c.z,ry,0,s*.42);E.box(M.ME,p[0],y+fh-.05,p[1],PA*.88,.12,.12,ry,cv(MET));E.box(M.ME,p[0],y,p[1],PA*.88,.22,.16,ry,cv('#3A4048'),1);}
   if(c.h<.1)E.glow(c.x,y+fh+.3,c.z,.36,IND,.36,[.4,4.2+c.h*9,c.i,0],1);continue;}
  // K1 computronium terrace block: base mass + setbacks rising toward the centre; fins on the long faces; seams; roof units
  const L=PA*.8,D=PB*.72,ht=1.0+3.4*(1-smooth(.04,.8,c.f))*(.78+.44*c.h),bc=jc(cv(BLK[(c.h*3)|0]),c.x,c.z,.04);
  const tiers=ht>2.6?[[1,.42],[.7,.33],[.42,.25]]:ht>1.6?[[1,.58],[.62,.42]]:[[1,1]];let yy=y,top=[L,D];
  for(let q=0;q<tiers.length;q++){const s=tiers[q][0],th=ht*tiers[q][1]+(q?0:.14),lw=L*s,ld=D*(q?.7+.3*s:1);
   E.box(M.B,c.x,yy,c.z,lw,th,ld,ry,q?jc(cv(BLK[(q+((c.h*3)|0))%3]),c.x,c.z+q,.04):bc);
   E.box(M.B,c.x,yy+th,c.z,lw+.02,.05,ld+.02,ry,jc(cv(TOP),c.x,c.z+q,.04));   // pale setback ledge (catches the sky)
   E.box(M.LT,c.x,yy+th-.1,c.z,lw+.03,.03,ld+.03,ry,SLIT);   // cool seam under the setback edge
   if(NR){const nf=Math.max(3,Math.round(lw/.3));for(const sd of[-1,1])for(let f=0;f<nf;f++){const t=(f+.5)/nf-.5,p=E.L2W(c.x,c.z,ry,t*lw*.94,sd*(ld/2+.05));
     E.box(M.ME,p[0],yy+.06,p[1],.06,th-.16,.12,ry,jc(cv(FIN),p[0],p[1],.05));}   // vertical heat fins on the long faces
    for(const sd of[-1,1]){const p=E.L2W(c.x,c.z,ry,sd*(lw/2+.03),0);E.box(M.ME,p[0],yy+.1,p[1],.05,th-.24,ld*.7,ry,cv('#3E4550'));}}   // end-face service panel
   else{const nf=Math.max(2,Math.round(lw/.7));for(const sd of[-1,1])for(let f=0;f<nf;f++){const t=(f+.5)/nf-.5,p=E.L2W(c.x,c.z,ry,t*lw*.9,sd*(ld/2+.04));E.box(M.ME,p[0],yy+.08,p[1],.12,th-.18,.1,ry,cv(FIN));}}   // MID: coarse fins
   yy+=th;top=[lw,ld];}
  // roof: two low duct runs (NEAR) instead of boxes; indicator 1 in 4
  if(NR)for(const sd of[-1,1]){const p=E.L2W(c.x,c.z,ry,0,sd*top[1]*.22);E.box(M.ME,p[0],yy,p[1],top[0]*.86,.1,.12,ry,cv('#555D68'));}
  if(c.h>.75){const p=E.L2W(c.x,c.z,ry,L/2+.04,0);E.glow(p[0],y+.55,p[1],.4,IND,.42,[.45,2.6+c.h*2.5,c.i,1]);}}
 // ---- K3 heliostat field + receiver tower ----
 {const hy=H(HC[0],HC[1])-.1,TH=7.4;
  E.add(M.ST,E.G.cyl(12,.62),HC[0],hy,HC[1],.42,TH,.42,0,0,0,cv('#5A5E64'));                           // slender tapered concrete shaft
  E.add(M.ME,E.G.cyl(12,1),HC[0],hy+TH,HC[1],.42,1.05,.42,0,0,0,cv('#7E8690'));                         // receiver drum (pale metal)
  E.add(M.ME,E.G.cyl(12,1),HC[0],hy+TH+1.05,HC[1],.5,.12,.5,0,0,0,cv('#4A4E56'));E.box(M.ME,HC[0],hy+TH+1.17,HC[1],.06,.7,.06,0,cv('#5A606A'));
  E.add(M.ME,E.G.cyl(12,1),HC[0],hy+TH*.62,HC[1],.62,.1,.62,0,0,0,cv('#4A4E56'),1);
  if(NR)for(let q=0;q<5;q++)E.add(M.ME,E.G.cyl(12,1),HC[0],hy+TH+.1+q*.2,HC[1],.44,.05,.44,0,0,0,cv('#5A606A'));   // receiver drum ribs
  E.add(M.LT,E.G.cyl(12,1),HC[0],hy+TH+.18,HC[1],.415,.7,.415,0,0,0,[.3,.32,.34]);   // receiver panels lit by the mirrored sun (cool, not gold)
  E.glow(HC[0],hy+TH+.55,HC[1],1.4,'#8E9CA8',.28,[.08,9,0,0]);E.glow(HC[0],hy+TH+1.9,HC[1],.4,IND,.5,[.5,3.1,0,1]);
  E.anchors.tower={x:HC[0],y:hy+TH+1,z:HC[1]};let nm=0;
  for(let ri=0;ri<8;ri++){const rr=1.25+ri*.33,st=NR?.4:.62,nn=Math.floor(TAU*rr/st);
   for(let q=0;q<nn;q++){const a=q/nn*TAU+ri*.21,x=HC[0]+Math.cos(a)*rr*(1+.06*Math.sin(3*a)),z=HC[1]+Math.sin(a)*rr;
    if(Math.hypot(x,z)>rOut(Math.atan2(z,x))*.96||!free(x,z,.3)||railD(x,z)<1.0)continue;const py=H(x,z),dx=HC[0]-x,dz=HC[1]-z;
    E.add(M.ME,E.G.box(),x,py+.32,z,.34,.02,.27,.62,Math.atan2(dx,dz),0,jc(cv('#8EA2B4'),x,z,.06));nm++;   // mirror tilted toward the receiver (pale: catches the sky)
    if(NR)E.box(M.ME,x,py-.04,z,.03,.36,.03,0,cv('#3E434B'));}}
  E.info.mirrors=nm;}
 // ---- K4 mass driver + faint orbital arcs ----
 {const y0=H(MS[0],MS[1])+1.1,y1=H(ME_[0],ME_[1])+11.2,dx=ME_[0]-MS[0],dz=ME_[1]-MS[1],Lh=Math.hypot(dx,dz),nx=-dz/Lh,nz=dx/Lh,yAt=t=>y0+(y1-y0)*(t*t*.35+t*.65);
  const pt=t=>[MS[0]+dx*t,yAt(t),MS[1]+dz*t],NS=NR?16:8;
  for(let s=0;s<NS;s++){const a=pt(s/NS),b=pt((s+1)/NS);for(const sd of[-1,1])Z.beam(E,M.ME,a[0]+nx*.2*sd,a[1],a[2]+nz*.2*sd,b[0]+nx*.2*sd,b[1],b[2]+nz*.2*sd,.1,cv('#6A727E'));   // twin rails
   Z.beam(E,M.ME,a[0],a[1]-.2,a[2],b[0],b[1]-.2,b[2],.26,cv('#3A3F48'),0,.16);}   // box spine
  for(let q=0;q<=(NR?10:5);q++){const t=q/(NR?10:5),p=pt(t),gy=H(p[0],p[1])-.15;if(t<.02)continue;   // pylons (A-frames in NEAR)
   E.box(M.ST,p[0],gy,p[2],.32,p[1]-gy-.2,.32,-Math.atan2(dz,dx),cv('#565A62'));
   for(const sd of[-1,1])Z.beam(E,M.ME,p[0]+nx*.9*sd,gy,p[2]+nz*.9*sd,p[0],p[1]-.25,p[2],NR?.08:.12,cv('#5E646E'));}
  if(NR)for(let q=1;q<34;q++){const t=q/34,p=pt(t),c=cv(q%4?'#535A66':'#6E7682');   // accelerator coils: square frames around the rails
   const tg=pt(Math.min(1,t+.01)),ax=tg[0]-p[0],ay=tg[1]-p[1],az=tg[2]-p[2],al=Math.hypot(ax,ay,az),ux=ax/al,uy=ay/al,uz=az/al;
   const upx=-uy*ux,upy=1-uy*uy,upz=-uy*uz,ul=Math.hypot(upx,upy,upz),wx=upx/ul*.36,wy=upy/ul*.36,wz=upz/ul*.36,sx=nx*.36,sz=nz*.36;
   const C=[[-1,-1],[1,-1],[1,1],[-1,1]].map(e=>[p[0]+sx*e[0]+wx*e[1],p[1]-.05+wy*e[1],p[2]+sz*e[0]+wz*e[1]]);
   for(let e=0;e<4;e++){const a=C[e],b=C[(e+1)%4];Z.beam(E,M.ME,a[0],a[1],a[2],b[0],b[1],b[2],.05,c,1);}}
  {const b=pt(0),gy=H(b[0],b[1])-.1;E.box(M.B,b[0],gy,b[2],1.6,b[1]-gy+.2,1.3,-Math.atan2(dz,dx),cv('#2E333B'));E.box(M.LT,b[0],b[1]+.08,b[2],1.62,.035,1.32,-Math.atan2(dz,dx),SLIT);}   // breech / loading hall
  const e1=pt(1);for(let s=0;s<NS;s++){const a=pt(s/NS),b=pt((s+1)/NS);Z.beam(E,M.LT,a[0],a[1]+.07,a[2],b[0],b[1]+.07,b[2],.05,[.2,.3,.38],0,.03);}   // a thin cool guide line along the rail: reads against the sky
  E.glow(e1[0],e1[1]+.25,e1[2],.6,'#8EA6B8',.55,[.6,5.5,0,0]);E.anchors.launch={x:e1[0],y:e1[1],z:e1[2]};
  E.movers(M.ME,.3,.22,.42,cv('#9AA2AC'),1,(i,t,o)=>{const q=(t/46)%1,e=q*q,p=pt(Math.min(1,e));o.position.set(p[0],p[1]+.08,p[2]);o.rotation.y=Math.atan2(dx,dz);const s=q>.93?Math.max(0,1-(q-.93)/.05):1;o.scale.set(s,s,s);});   // capsule (slow ramp-up, gone past the muzzle)
  if(NR){const om=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,fog:true});om.name='g1z_orbits';
   const arcs=[[9.6,10.4,.2,aM+.4,2.4],[10.6,11.4,.14,aM-.5,1.9],[8.4,12.2,.1,aM+1.4,1.5]];   // kept under ~13 u: the marker plane = tallest site + 6
   for(const[rr,hy,tl,yw,arc]of arcs){const g=Z.geo('orb'+arc,()=>new THREE.TorusGeometry(1,.0045,3,90,arc));E.add(om,g,0,hy,0,rr,rr,rr,Math.PI/2+tl,yw,0,[.15,.19,.24]);
    for(let q=0;q<3;q++){const a=arc*(q+.5)/3,lx=Math.cos(a)*rr,lz=Math.sin(a)*rr,cy=Math.cos(Math.PI/2+tl),sy=Math.sin(Math.PI/2+tl),py=lz*cy,pz=lz*sy;   // dim relay dots on each arc
     const wx=lx*Math.cos(yw)+pz*Math.sin(yw),wz=-lx*Math.sin(yw)+pz*Math.cos(yw);E.glow(wx,hy+py,wz,.32,'#7E94A6',.32,[.2,7+q,q,0]);}}}}
 // ---- K5 construction front: a terrace being built ----
 {const cx=CS[0],cz=CS[1],y=E.lowY(cx,cz,5,3.2)-.12,cc=cv('#666E7A');
  {const p=E.L2W(cx,cz,ry,-1.35,0);E.box(M.B,p[0],y,p[1],2.2,1.4,3.0,ry,cv(BLK[1]));E.box(M.LT,p[0],y+1.34,p[1],2.23,.035,3.03,ry,SLIT);}   // finished lower part
  for(let a=0;a<5;a++)for(let b=-2;b<=2;b++){const p=E.L2W(cx,cz,ry,.1+a*.55,b*.72);const hh=a<3?2.6:1.3+.4*(b&1);E.box(M.ME,p[0],y,p[1],.08,hh,.08,ry,cc);}   // bare column grid (the far bays lower)
  for(const[a0,a1,lv]of[[.1,2.3,1.3],[.1,1.2,2.6]]){const p=E.L2W(cx,cz,ry,(a0+a1)/2,0);E.box(M.B,p[0],y+lv,p[1],a1-a0+.12,.07,3.0,ry,cv('#3E444E'));}   // part floors
  if(NR)for(let b=-2;b<=2;b++){const p=E.L2W(cx,cz,ry,1.2,b*.72);E.box(M.ME,p[0],y+2.55,p[1],2.3,.06,.06,ry,cc);}
  for(const sd of[-1,1]){const p=E.L2W(cx,cz,ry,.3,sd*1.95);E.box(M.ME,p[0],H(p[0],p[1])-.04,p[1],5.4,.08,.12,ry,cv('#4C525C'));}   // gantry rails
  const G0=E.L2W(cx,cz,ry,-2.0,0),G1=E.L2W(cx,cz,ry,2.4,0);
  E.movers(M.ME,1,1,1,cv('#7C848E'),4,(i,t,o)=>{const e=.5+.5*Math.sin(t*TAU/58),x=G0[0]+(G1[0]-G0[0])*e,z=G0[1]+(G1[1]-G0[1])*e;   // gantry: 2 legs, beam, trolley
   if(i<2){const p=E.L2W(x,z,ry,0,(i?1:-1)*1.95);o.position.set(p[0],y,p[1]);o.scale.set(.14,3.3,.14);}else if(i===2){o.position.set(x,y+3.25,z);o.scale.set(.2,.2,4.1);}
   else{const w=Math.sin(t*TAU/23)*1.4,p=E.L2W(x,z,ry,0,w);o.position.set(p[0],y+2.75,p[1]);o.scale.set(.32,.45,.32);}o.rotation.y=ry;});
  for(let q=0;q<6;q++){const p=E.L2W(cx,cz,ry,3.3,(q-2.5)*.5),py=H(p[0],p[1])-.04;for(let l=0;l<1+(q%3);l++)E.box(M.ST,p[0],py+l*.22,p[1],.44,.2,.4,ry,cv(l%2?'#4A505A':'#3E444C'));}   // sorted modules
  const S0=E.L2W(cx,cz,ry,3.3,0),S1=E.L2W(cx,cz,ry,1.4,0);
  E.movers(M.ME,.36,.2,.3,cv('#5E6672'),3,(i,t,o)=>{const q=(t/19+i/3)%1,e=q<.5?q*2:2-q*2,x=S0[0]+(S1[0]-S0[0])*e+v[0]*(i-1)*.7,z=S0[1]+(S1[1]-S0[1])*e+v[1]*(i-1)*.7;o.position.set(x,H(x,z)+.02,z);o.rotation.y=ry;},1);   // crawler builders
  E.glow(G0[0],y+3.5,G0[1],.4,IND,.4,[.5,3.4,1,0]);E.anchors.construction={x:cx,y:y+1.4,z:cz};}
 // ---- K6 the last town: a fading trace at the road end (no light, no people) ----
 const ga2=GA+.38,tu=[Math.cos(ga2),Math.sin(ga2)],tv=[-tu[1],tu[0]],tr=-ga2,town=[],DEM=[],TO=[Math.cos(aT),Math.sin(aT)];   // TO = outward (away from the machines)
 for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){if(i===0)continue;const ox=i*1.2+(hash(i,j)-.5)*.2,oz=j*1.2+(hash(j,i)-.5)*.2,x=TX+ox*tu[0]+oz*tv[0],z=TZ+ox*tu[1]+oz*tv[1],q=townD(x,z);
  if(q>TR*(.82+.25*hash(i*1.7,j))||!free(x,z,.5))continue;const out=((x-TX)*TO[0]+(z-TZ)*TO[1])/TR;   // out > 0 = outer side (least taken apart)
  town.push({x,z,st:hash(i*1.3+2,j*.9)*.8-.35*out+.2,y:E.lowY(x,z,.9,.8)-.06,ro:tr+(hash(i,j*2.1)<.3?Math.PI/2:0),w:.78+.2*hash(j,i*3),dd:.6+.14*hash(i*5,j),h:.46+.18*hash(i,j*7)});}
 let hoist=null;
 for(const t of town){const wc=jc(cv('#5E5A54'),t.x,t.z,.08),ec=jc(cv('#7A7068'),t.x,t.z,.06);
  if(t.st<.26){E.box(M.ST,t.x,t.y,t.z,t.w,t.h+.06,t.dd,t.ro,wc);E.add(M.RF,E.prism(),t.x,t.y+t.h+.06,t.z,t.w*1.1,.36,t.dd*1.14,0,t.ro,0,jc(cv('#5A4A44'),t.x,t.z,.08));}   // a few dark intact houses (pitched roofs = the human scale cue)
  else if(t.st<.42){for(const[ax,len,o]of[[0,t.w,t.dd/2],[0,t.w,-t.dd/2],[1,t.dd,t.w/2],[1,t.dd,-t.w/2]]){if(hash(o*3.1,t.z+ax)<.3)continue;   // roofless shell, jagged
    for(const hf of[-.25,.25]){const p=ax?E.L2W(t.x,t.z,t.ro,o,hf*len):E.L2W(t.x,t.z,t.ro,hf*len,o),h2=t.h*(.3+.55*hash(p[0]*3,p[1]));E.box(M.ST,p[0],t.y,p[1],ax?.08:len*.5,h2,ax?len*.5:.08,t.ro,hash(p[0],p[1])<.5?ec:wc);}}
   E.box(M.ST,t.x,t.y,t.z,t.w-.08,.06,t.dd-.08,t.ro,cv('#3C3A38'));if(!hoist&&t.st>.3)hoist=t;DEM.push([t.x,t.z,.8]);}
  else{for(const[ax,len,o]of[[0,t.w,t.dd/2],[0,t.w,-t.dd/2],[1,t.dd,t.w/2],[1,t.dd,-t.w/2]]){const p=ax?E.L2W(t.x,t.z,t.ro,o,0):E.L2W(t.x,t.z,t.ro,0,o);   // foundation outline only
    E.box(M.ST,p[0],t.y,p[1],ax?.09:len,.13,ax?len:.09,t.ro,cv('#7C766E'));}DEM.push([t.x,t.z,.62]);}}
 if(hoist){const t=hoist,c0=E.L2W(t.x,t.z,tr,0,.78),c1=E.L2W(t.x,t.z,tr,0,-.78),gy=t.y;for(const c of[c0,c1])E.box(M.ME,c[0],gy,c[1],.09,1.7,.09,tr,cv('#6A707A'));E.box(M.ME,t.x,gy+1.66,t.z,.12,.12,1.7,tr,cv('#6A707A'));
  E.movers(M.ME,.26,.2,.26,cv('#5A606C'),1,(i,tt,o)=>{const e=.5+.5*Math.sin(tt*TAU/26);o.position.set(t.x,gy+.55+e*.9,t.z);o.rotation.y=tr;},1);E.anchors.dismantle={x:t.x,y:gy+1,z:t.z};}
 {const b=[TX-TO[0]*(TR+.7),TZ-TO[1]*(TR+.7)];for(let a=0;a<4;a++)for(let c=0;c<3;c++){if(hash(a,c*1.7)<.2)continue;const p=E.L2W(b[0],b[1],ry,(a-1.5)*.5,(c-1)*.5),py=H(p[0],p[1])-.04;   // machine-sorted material cubes
   E.box(M.ST,p[0],py,p[1],.34,.3+.06*((a+c)%2),.34,ry,cv(['#5A5048','#4E4A48','#45434A','#4E4238'][(a+c)%4]));}}
 {const A0=[TX-TO[0]*(TR+.4),TZ-TO[1]*(TR+.4)],A1=[CS[0]*.4,CS[1]*.4];   // haul crawlers: town -> the core lanes
  E.movers(M.ME,.42,.22,.3,cv('#5A606C'),3,(i,t,o)=>{const q=(t/70+i/3)%1,e=q<.5?q*2:2-q*2,x=A0[0]+(A1[0]-A0[0])*e+v[0]*.32*(i%2?1:-1),z=A0[1]+(A1[1]-A0[1])*e+v[1]*.32*(i%2?1:-1);o.position.set(x,H(x,z)+.02,z);o.rotation.y=ry;});}
 // ---- ground: slate paving + lane grid, dark cooling basins, pale sand under the mirrors, the town's faded grass + old streets ----
 const PAV=cv('#42433E'),LANE=cv('#323438'),BSN=cv('#232A31'),SND=cv('#56524A'),SOL=cv('#3C403E'),GR=cv('#4A4E3C'),OST=cv('#56524C'),DRT=cv('#5A5044'),fr=(x,p)=>Math.abs(((x/p)%1+1)%1-.5)*p;
 E.ground(NR?76:56,R*1.6,(x,z,c)=>{const rr=Math.hypot(x,z),a=Math.atan2(z,x),ro=rOut(a),n1=vn(x*.5+5,z*.5-3),n2=vn(x*1.2,z*1.2),au=x*u[0]+z*u[1],av=x*v[0]+z*v[1],td=townD(x,z),hd=helD(x,z);
  let col=rr/ro>.74?mx(PAV,SOL,.5):PAV;if(fr(au-PA/2,PA)<.2||fr(av-PB/2,PB)<.17)col=mx(col,LANE,.85);   // lanes between the cells
  for(const b of BAS){const ba=(x-b[0])*u[0]+(z-b[1])*u[1],bb=(x-b[0])*v[0]+(z-b[1])*v[1];if(Math.abs(ba)<PA*.46&&Math.abs(bb)<.22)col=BSN;}
  if(hd<HR+.6)col=mx(col,SND,1-smooth(HR-.4,HR+.6,hd));if(hd<.9)col=PAV;
  if(railD(x,z)<.5)col=mx(col,LANE,.7);
  const tw=1-smooth(TR*.7,TR+1.3,td*(1+.15*(n1-.5)));if(tw>0){let tc=mx(GR,DRT,.35*n2);const t1=(x-TX)*tu[0]+(z-TZ)*tu[1],t2=(x-TX)*tv[0]+(z-TZ)*tv[1];if(Math.abs(t2)<.3||fr(t1,2.4)<.16)tc=OST;
   for(const q of DEM){const dq=Math.hypot(x-q[0],z-q[1]);if(dq<q[2]){tc=mx(tc,DRT,.75*(1-smooth(.4,1,dq/q[2])));break;}}
   const enc=smooth(.6,-.6,((x-TX)*TO[0]+(z-TZ)*TO[1])/TR);if(fr(au-PA/2,PA)<.12||fr(av-PB/2,PB)<.1)tc=mx(tc,LANE,.8*enc);   // the machine lane grid already runs into the town from the machine side
   col=mx(col,tc,tw);}
  if(au>0&&Math.abs(av)<.42&&td>TR*.6)col=OST;   // the old road from the town to the edge
  const f=.9+.18*n1;c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;const q=Math.min(rr/ro,td/(TR+1.6)+.25)*(1+.1*(n1-.5));c[3]=1-smooth(.8,1.03,Math.min(rr/ro*(1+.1*(n1-.5)),q+.2));});
 E.anchors.town={x:TX,y:H(TX,TZ),z:TZ};E.info.cells=cells.length;E.info.banks=BAS.length;E.info.town=town.length;});}};
})();
