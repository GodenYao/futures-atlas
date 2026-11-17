// Futures Atlas G1 preview - probene.js : Benevolent Dictator sector city (r10 V rebuild; our own code). Uses FA.G1Z (js/prolib.js).
// Tegmark, Life 3.0 ch.5 "Benevolent dictator": everybody knows that an AI runs society and enforces strict rules, but most people see
// this as a good thing; poverty, disease and crime are gone; a surveillance-and-enforcement system is everywhere; the world is divided
// into sectors so people can choose the lifestyle they like (knowledge, art, hedonistic, pious, wildlife, traditional, gaming/virtual,
// and a prison sector for rule-breakers), with universal rules everywhere plus local sector rules. Describe, never judge.
// What the city literally shows (cues C1-C5 in PREVIEW_NOTES 'benevolent r10 (V)'):
//  - centre: a pale octagonal tiered monolith (the AI core) standing in a round reflecting pool, a pale paved ring, a ring boulevard with
//    evenly spaced lamps and a mown lawn ring of clipped trees;
//  - eight petal-shaped sectors separated by radial boulevards (pale paving, a canal on one side, a clipped tree row on the other) and low
//    hedges; every sector is entered through the same slim gate;
//  - one fine sensor network: identical slender masts with tiny cool heads at every gate, along every boulevard and inside every sector,
//    and thin cool light lines in the paving from the pool out into all sectors; slow autonomous movers on the ring and boulevards;
//  - sectors: knowledge (domed library with peristyle + portico, campus halls around a quad, small domed pavilions), art (open-air
//    amphitheatre facing the core, cantilevered white gallery blocks, sculpture lawn), hedonistic (pools with pale decks, flat-roof
//    pavilions, a round pleasure garden), virtual (windowless ellipsoid immersion pods on a paved precinct + covered walkways), prison
//    (a small walled compound at the far edge: low blocks, a yard, an evenly lit wall), wildlife (forest reserve, pond, meadows, no
//    buildings), traditional (pitched-roof village on a lane, fields with hedgerows, barn + silo, orchard), pious (square cloister with a
//    courtyard, temple with a slim tower, meditation garden).
//  - light: many small evenly spaced cool-neutral lamps, warm accents only in the hedonistic / traditional / pious sectors; no halo.
// No base slab: buildings stand on the feathered terrain-coloured ground; paving / water are .1 u thin inlays.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
const TAU=Math.PI*2,D2R=Math.PI/180,GC={};
const gc=(key,mk)=>GC[key]||(GC[key]=mk());
const OCT=rt=>gc('oct'+rt,()=>{const g=new THREE.CylinderGeometry(rt,1,1,8,1).toNonIndexed();g.translate(0,.5,0);g.computeVertexNormals();return g;});   // flat-shaded octagonal frustum
const DISC=n=>gc('disc'+n,()=>{const g=new THREE.CylinderGeometry(1,1,1,n,1).toNonIndexed();g.translate(0,.5,0);return g;});
const HEMI=(w,h)=>gc('hemi'+w+'_'+h,()=>new THREE.SphereGeometry(1,w,h,0,TAU,0,Math.PI/2).toNonIndexed());
const CROWN=()=>gc('crown',()=>new THREE.SphereGeometry(1,7,4).toNonIndexed());   // 42-tri rounded tree crown (NEAR)
const TORUS=n=>gc('tor'+n,()=>new THREE.TorusGeometry(1,.16,5,n).toNonIndexed());
FA.PROBENE={build(site,ctx){const Z=FA.G1Z,k=FA.G1KIT;if(!Z||!k)throw new Error('FA.G1Z / FA.G1KIT missing (js/prolib.js, js/prorev.js)');
 return Z.city(site,ctx,'benevolent',E=>{
 const{smooth,vn,hash}=k,R=E.R,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,N=E.near,G=E.G,CRW=()=>N?CROWN():G.ico(0);
 const PP=site.params||{},kA=PP.keepA!=null?PP.keepA:Math.PI/2,avoid=PP.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const wrap=a=>((a%TAU)+TAU)%TAU,wr2=a=>{a=wrap(a);return a>Math.PI?a-TAU:a;};
 // ---- plan: 8 sectors (degrees) counter-clockwise from the arriving road (boulevard 0 = the road's); prison on the far side ----
 const SEC=[['knowledge',50],['art',45],['hedonic',50],['virtual',40],['prison',25],['wildlife',60],['traditional',50],['pious',40]];
 let acc=0;const S=SEC.map(([id,w])=>{const o={id,a0:kA+acc*D2R,span:w*D2R,c0:acc};o.am=o.a0+o.span/2;acc+=w;return o;});
 const SI={};S.forEach((s,i)=>SI[s.id]=s);const BV=S.map(s=>s.a0);
 const secI=a=>{const d=wrap(a-kA)/D2R;for(let i=0;i<S.length;i++)if(d<S[i].c0+SEC[i][1])return i;return S.length-1;};
 const RS={knowledge:.97,art:.95,hedonic:.96,virtual:.93,prison:.93,wildlife:.98,traditional:.97,pious:.94};
 const rOut=a=>{const s=S[secI(a)],f=Math.min(1,Math.max(0,wrap(a-s.a0)/s.span)),b=Math.pow(Math.sin(Math.PI*f),.55);return R*(.84+(RS[s.id]-.84)*b);};   // petal outline
 const hw=(s,rr)=>Math.max(0,s.span/2-1.2/rr);   // usable half-angle inside a sector (clear of the boulevard buffers)
 const at=(s,rr,f)=>{const a=s.am+f*hw(s,rr);return{x:Math.cos(a)*rr,z:Math.sin(a)*rr,a,ry:-a};};   // ry=-a: local x = radial, local z = tangential
 const GZ=[];   // ground inlays (circles) read by the ground pass: {x,z,r,c}
 // ---- palette: one material family ----
 const C={stone:cv('#A8A398'),stoneD:cv('#97928A'),cer:cv('#B6B3AC'),dome:cv('#8A96A0'),glass:cv('#2E3844'),slate:cv('#55575F'),
  water:cv('#4A6476'),pool:cv('#4C8290'),lawn:cv('#3E5232'),hedge:cv('#33452C'),pine:cv('#2C4030'),trunk:cv('#3A2E26'),metal:cv('#6A707A'),
  mastH:cv('#4E545E'),bronze:cv('#7A6A52'),pave:cv('#9A958A')};
 const LINE=[.17,.23,.29],WARMW=[.44,.39,.31];
 // ---- small helpers ----
 const strip=(mat,a,r0,r1,off,w,h,c,lvl,seg)=>{const ca=Math.cos(a),sa=Math.sin(a),n=Math.max(1,Math.ceil((r1-r0)/(seg||1.4))),L=(r1-r0)/n;
  for(let i=0;i<n;i++){const t=r0+(i+.5)*L,x=ca*t-sa*off,z=sa*t+ca*off;if(!free(x,z,.1))continue;E.box(mat,x,H(x,z)-.03,z,L*1.003,h,w,-a,c,lvl);}};
 const arcSeg=(mat,rr,a0,a1,w,h,c,lvl,segL)=>{const n=Math.max(1,Math.round((a1-a0)*rr/(segL||.8))),da=(a1-a0)/n;
  for(let i=0;i<n;i++){const a=a0+(i+.5)*da,x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(!free(x,z,.1))continue;E.box(mat,x,H(x,z)-.03,z,w,h,2*rr*Math.sin(da/2)*1.03,-a,c,lvl);}};
 const tree=(x,z,s,c)=>{if(!free(x,z,.3))return;const y=H(x,z)-.04;E.box(M.WD,x,y,z,.05*s,.38*s,.05*s,0,C.trunk,1);
  E.add(M.FO,CRW(),x,y+.56*s,z,.26*s,.3*s,.26*s,0,0,0,jc(c||C.lawn,x,z,.08));};   // clipped round crown on a clean stem
 const pine=(x,z,s)=>{if(!free(x,z,.3))return;const y=H(x,z)-.05,c=jc(C.pine,x,z,.14),ro=hash(x,z)*3;E.add(M.FO,G.cone(6),x,y+.12*s,z,.32*s,.8*s,.32*s,0,ro,0,c);
  E.add(M.FO,G.cone(6),x,y+.5*s,z,.22*s,.62*s,.22*s,0,ro+.5,0,c,1);};
 const MAST=[];const mast=(x,z,h,ph)=>{if(!free(x,z,.2))return;const y=H(x,z)-.05;h*=.72;E.box(M.ME,x,y,z,.034,h,.034,0,C.metal);E.add(M.ST,DISC(8),x,y+h,z,.07,.035,.07,0,0,0,C.cer);
  E.add(M.LT,DISC(8),x,y+h+.035,z,.035,.03,.035,0,0,0,[.3,.38,.46],1);E.glow(x,y+h+.08,z,.26,'#9CAEC0',.24,[.3,8,ph,0]);MAST.push([x,z]);};   // slim pole, ceramic cap, tiny cool sensor
 const LAMPS=[];const lamp=(x,z,hex,kk)=>{if(!free(x,z,.1))return;const y=H(x,z)-.04;E.box(M.ME,x,y,z,.028,.46,.028,0,C.metal,1);E.add(M.ST,DISC(8),x,y+.46,z,.055,.025,.055,0,0,0,C.cer,1);
  E.glow(x,y+.49,z,.24,hex||'#CFCBC0',kk||.24,null);LAMPS.push(1);};
 const win=(x,y,z,hex,kk,sz)=>E.glow(x,y,z,sz||.32,hex||'#CBC3B2',kk||.24,null);
 // ======================= centre: reflecting pool + AI core monolith =======================
 {const y0=E.lowY(0,0,4,4);
  E.add(M.ST,DISC(N?64:32),0,y0-.06,0,3.02,.1,3.02,0,0,0,C.stone);   // pale coping ring around the pool (shows as a .17 u band)
  E.add(M.LT,DISC(N?64:32),0,y0-.05,0,2.85,.125,2.85,0,0,0,C.water);   // still water
  for(let q=0;q<24;q++){const t=(q+.5)/24*TAU;E.glow(Math.cos(t)*2.94,y0+.12,Math.sin(t)*2.94,.2,'#B4C2CE',.2,null);}   // evenly spaced rim lights
  const TI=[[1.55,.94,.45,'#9E998F'],[1.3,.9,1.35,'#B3B0A9'],[1.04,.88,1.25,'#B6B3AC'],[.78,.85,1.05,'#B8B5AE']];let yy=y0+.075;
  TI.forEach(([r0,rt,h,c],i)=>{E.add(M.ST,OCT(rt),0,yy,0,r0,h,r0,0,0,0,cv(c));const rT=r0*rt;
   E.add(M.ST,OCT(1),0,yy+h,0,rT*.9,.11,rT*.9,0,0,0,cv('#33373E'));   // shadow reveal between tiers
   E.add(M.LT,OCT(1),0,yy+h+.11,0,rT*.95,.022,rT*.95,0,0,0,[.22,.28,.34]);   // thin cool step line
   if(i>0){const ap=Math.cos(Math.PI/8),tl=Math.atan((r0-rT)*ap/h);for(let q=0;q<8;q++){if(!N&&q%2)continue;const th=(q+.5)*Math.PI/4,f=.18/h,rf=(r0+(rT-r0)*f)*ap+.012;
    E.add(M.LT,G.box(),Math.sin(th)*rf,yy+.18,Math.cos(th)*rf,.04,(h-.36)/Math.cos(tl),.02,-tl,th,0,LINE);}}   // vertical cool seams on the facets
   yy+=h+.13;});
  E.add(M.ST,OCT(.03),0,yy,0,.6,1.25,.6,0,0,0,cv('#BAB7B0'));   // spire
  E.glow(0,yy+1.3,0,.42,'#A9B8C6',.26,[.25,9,0,0]);E.anchors.core={x:0,y:yy+1.3,z:0};
  // eight slim masts on the pool coping (at the sector mid-angles, off the boulevards)
  S.forEach((s,i)=>mast(Math.cos(s.am)*3.3,Math.sin(s.am)*3.3,1.9,i*.8));
  // eight stone benches on the paved ring, facing the pool (NEAR)
  if(N)S.forEach(s=>{const a=s.am+.18,x=Math.cos(a)*3.35,z=Math.sin(a)*3.35;E.box(M.ST,x,H(x,z)-.02,z,.16,.12,.5,-a,C.stoneD);});}
 // ring boulevard + lamps + light line, mown lawn ring with clipped trees and low hedges
 arcSeg(M.ST,3.86,0,TAU,.62,.11,C.pave,0,1.0);arcSeg(M.LT,3.86,0,TAU,.03,.125,LINE,1,1.0);
 for(let i=0;i<32;i++){const a=(i+.5)/32*TAU;lamp(Math.cos(a)*4.27,Math.sin(a)*4.27,'#CBCBC6',.22);}
 const nearBv=(a,rr,m)=>BV.some(b=>Math.abs(wr2(a-b))*rr<m);
 for(let i=0;i<48;i++){const a=(i+.5)/48*TAU;if(nearBv(a,4.85,.75))continue;tree(Math.cos(a)*4.85,Math.sin(a)*4.85,.8);}
 for(const s of S){const g0=s.a0+.95/5.55,g1=s.a0+s.span-.95/5.55,gm=s.am,gw=.62/5.55;arcSeg(M.FO,5.55,g0,gm-gw,.16,.22,C.hedge,0,.7);arcSeg(M.FO,5.55,gm+gw,g1,.16,.22,C.hedge,0,.7);
  // soft gate: two slim ceramic pylons + a thin lintel with a cool line
  const g=at(s,5.55,0);for(const sg of[-1,1]){const p=E.L2W(g.x,g.z,g.ry,0,sg*.5);E.box(M.ST,p[0],H(p[0],p[1])-.04,p[1],.16,.86,.16,g.ry,C.cer);}
  E.box(M.ST,g.x,H(g.x,g.z)+.8,g.z,.16,.12,1.16,g.ry,C.cer);E.box(M.LT,g.x,H(g.x,g.z)+.77,g.z,.05,.03,.84,g.ry,LINE,1);
  }
 // ======================= radial boulevards: paving, light line, canal, clipped tree row, lamps, masts, movers =======================
 const BVE=[];for(let i=0;i<BV.length;i++){const a=BV[i],rE=i===0?R*.9:R*.8;BVE.push(rE);
  strip(M.ST,a,4.17,rE,0,.68,.11,C.pave);strip(M.LT,a,3.0,rE,0,.035,.125,LINE,1);   // the light line starts at the pool coping (core -> all sectors)
  strip(M.LT,a,5.75,rE-.35,.64,.3,.1,C.water);strip(M.ST,a,5.75,rE-.35,.84,.07,.13,C.stone,1);strip(M.ST,a,5.75,rE-.35,.45,.06,.125,C.stone,1);   // canal + pale copings
  const ca=Math.cos(a),sa=Math.sin(a);
  for(let t=5.95;t<rE-.4;t+=1.1)tree(ca*t+sa*.74,sa*t-ca*.74,.78);
  for(let t=6.4;t<rE-.4;t+=1.3)lamp(ca*t-sa*1.0,sa*t+ca*1.0);
  for(const t of[rE-.7]){mast(ca*t+sa*1.08,sa*t-ca*1.08,1.7,i+t);}}
 E.movers(M.ME,.26,.1,.15,cv('#B2B0AA'),6,(i,t,o)=>{const dr=i%2?1:-1,a=dr*t*TAU/84+i*TAU/6,rr=3.86+.15*dr,x=Math.cos(a)*rr,z=Math.sin(a)*rr;o.position.set(x,H(x,z)+.13,z);o.rotation.y=-a-Math.PI/2;},1);
 E.movers(M.ME,.26,.1,.15,cv('#B2B0AA'),BV.length,(i,t,o)=>{const a=BV[i],q=(t/56+i*.137)%1,e=q<.5?q*2:2-q*2,s=4.6+(BVE[i]-5.2)*(e*e*(3-2*e)),x=Math.cos(a)*s+Math.sin(a)*.15,z=Math.sin(a)*s-Math.cos(a)*.15;o.position.set(x,H(x,z)+.13,z);o.rotation.y=-a;},1);
 // short pale spine path from every gate into its sector
 const SPN={knowledge:7.4,art:6.7,hedonic:6.2,virtual:11.4,prison:9.6,wildlife:6.0,traditional:6.0,pious:7.1};
 for(const s of S)strip(M.ST,s.am,5.6,SPN[s.id],0,.24,.105,C.pave);
 const NB={};
 // ======================= knowledge: domed library + campus quad =======================
 {const s=SI.knowledge,L=at(s,8.9,0),y=E.lowY(L.x,L.z,2.6,2.6)-.08,nd=N?28:16;
  if(free(L.x,L.z,1.6)){E.add(M.ST,DISC(nd),L.x,y,L.z,1.12,.92,1.12,0,0,0,C.stoneD);
   const nc=N?16:8;for(let q=0;q<nc;q++){const t=q/nc*TAU;E.box(M.ST,L.x+Math.cos(t)*1.32,y,L.z+Math.sin(t)*1.32,.09,.86,.09,-t,C.cer);}   // peristyle
   E.add(M.ST,DISC(nd),L.x,y+.86,L.z,1.42,.1,1.42,0,0,0,C.stone);E.add(M.ST,DISC(nd),L.x,y+.96,L.z,1.0,.28,1.0,0,0,0,C.stoneD);
   E.add(M.RF,HEMI(N?24:12,N?9:5),L.x,y+1.22,L.z,.98,.82,.98,0,0,0,C.dome);
   E.add(M.ST,DISC(8),L.x,y+2.0,L.z,.13,.24,.13,0,0,0,C.cer);E.add(M.ST,G.cone(8),L.x,y+2.24,L.z,.15,.16,.15,0,0,0,C.slate);
   E.box(M.LT,L.x,y+.42,L.z,2.36,.05,2.36,0,WARMW,1);   // (hidden inside the peristyle except between the columns)
   // portico facing the core
   for(const lz of[-.45,-.15,.15,.45]){const p=E.L2W(L.x,L.z,L.ry,-1.72,lz);E.box(M.ST,p[0],y,p[1],.09,.84,.09,L.ry,C.cer);}
   {const p=E.L2W(L.x,L.z,L.ry,-1.6,0);E.box(M.ST,p[0],y+.84,p[1],.5,.08,1.16,L.ry,C.stone);E.add(M.ST,E.prism(),p[0],y+.92,p[1],.5,.26,1.16,0,L.ry+Math.PI/2,0,C.stone);
    win(p[0],y+.4,p[1],'#D5C6A8',.26,.4);}
   NB.knowledge=1;}
  for(const f of[-.82,.82])for(const rr of[6.25,7.6,8.95,10.3]){const h=at(s,rr,f);if(!free(h.x,h.z,.8))continue;const hy=E.lowY(h.x,h.z,1.2,.7)-.08;
   E.box(M.B,h.x,hy,h.z,1.15,.8,.62,h.ry,jc(C.stone,h.x,h.z,.03));E.bands(h.x,hy,h.z,1.15,.62,h.ry,.8,.32,WARMW,.8);E.box(M.ME,h.x,hy+.8,h.z,1.2,.06,.67,h.ry,cv('#5C6068'));
   if(hash(h.x,h.z)<.5)win(h.x,hy+.4,h.z);NB.knowledge++;}
  for(const f of[-.5,.5]){const p=at(s,11.2,f);if(!free(p.x,p.z,.6))continue;const py=E.lowY(p.x,p.z,.8,.8)-.08;E.box(M.ST,p.x,py,p.z,.8,.55,.8,p.ry,C.stoneD);E.add(M.RF,HEMI(N?16:8,N?6:3),p.x,py+.55,p.z,.4,.32,.4,0,0,0,C.dome);NB.knowledge++;}
  mast(at(s,10.9,0).x,at(s,10.9,0).z,1.6,1.3);}
 // ======================= art: amphitheatre, galleries, sculpture lawn =======================
 {const s=SI.art,Cn=at(s,7.25,0),cy=E.lowY(Cn.x,Cn.z,2.4,2.4)-.06,ns=N?9:5;NB.art=0;
  if(free(Cn.x,Cn.z,1.8)){E.add(M.ST,DISC(20),Cn.x,cy,Cn.z,.5,.12,.5,0,0,0,C.stoneD);   // stage
   for(let i=0;i<5;i++){const rho=.95+.31*i;for(let j=0;j<ns;j++){const ph=(-76+(j+.5)/ns*152)*D2R,aw=Cn.a+ph,x=Cn.x+Math.cos(aw)*rho,z=Cn.z+Math.sin(aw)*rho;
    E.box(M.ST,x,cy,z,.3,.1+.1*i,2*rho*Math.sin(76*D2R/ns)*1.02,-aw,jc(i%2?C.cer:C.stone,x,z,.02));}}   // seating tiers rise away from the core
   for(const sg of[-1,1]){const p=E.L2W(Cn.x,Cn.z,Cn.ry,-.2,sg*.75);lamp(p[0],p[1],'#CFC6B4',.22);}NB.art++;}
  const GAL=[[10.1,-.55,.32],[10.4,.6,-.28],[11.6,0,.12]];
  for(const[rr,f,rot]of GAL){const g=at(s,rr,f);if(!free(g.x,g.z,1))continue;const gy=E.lowY(g.x,g.z,1.4,1.4)-.08,r1=g.ry+rot;
   E.box(M.B,g.x,gy,g.z,1.25,.62,.82,r1,C.cer);E.box(M.LT,g.x,gy+.6,g.z,1.27,.07,.84,r1,WARMW);
   const p=E.L2W(g.x,g.z,r1,.22,.1);E.box(M.B,p[0],gy+.67,p[1],1.45,.48,.6,r1-.34,jc(C.cer,p[0],p[1],.03));
   E.box(M.ME,p[0],gy+1.15,p[1],1.47,.04,.62,r1-.34,cv('#8A8882'),1);win(g.x,gy+.62,g.z,'#D2C2A4',.24,.36);NB.art++;}
  // sculpture lawn between gate and amphitheatre
  const SC=[[6.05,-.72,0],[6.25,.7,1],[5.95,.35,2],[6.5,-.3,3],[5.95,-.25,4],[6.45,.42,0]];
  for(const[rr,f,t]of SC){const p=at(s,rr,f);if(!free(p.x,p.z,.3))continue;const y=H(p.x,p.z)-.03;
   if(t===0)E.add(M.ME,TORUS(N?16:8),p.x,y+.32,p.z,.27,.27,.27,0,p.ry+.6,0,C.bronze);
   else if(t===1)E.box(M.ST,p.x,y,p.z,.07,.95,.07,p.ry,C.cer);
   else if(t===2)E.add(M.ME,G.ico(0),p.x,y+.16,p.z,.2,.18,.2,0,hash(p.x,p.z)*3,0,C.bronze);
   else if(t===3){E.box(M.ST,p.x,y,p.z,.22,.22,.22,.4,C.cer);E.box(M.ST,p.x,y+.22,p.z,.16,.16,.16,1.2,C.cer);}
   else E.add(M.ME,G.cone(4),p.x,y,p.z,.14,.6,.14,0,.3,0,C.bronze);}
  mast(at(s,9.0,.55).x,at(s,9.0,.55).z,1.6,2.1);}
 // ======================= hedonistic: pools + decks, pavilions, pleasure garden =======================
 {const s=SI.hedonic;NB.hedonic=0;
  const pool=(g,rect,w,d)=>{const y=H(g.x,g.z)-.03;if(rect){E.box(M.ST,g.x,y,g.z,w+.5,.1,d+.5,g.ry,C.stone);E.box(M.LT,g.x,y,g.z,w,.118,d,g.ry,C.pool);}
   else{E.add(M.ST,DISC(N?28:14),g.x,y,g.z,w+.28,.1,w+.28,0,0,0,C.stone);E.add(M.LT,DISC(N?28:14),g.x,y,g.z,w,.118,w,0,0,0,C.pool);}NB.hedonic++;};
  {const g=at(s,7.6,-.25);if(free(g.x,g.z,1.4)){pool(g,1,1.0,2.1);if(N)for(let q=0;q<6;q++){const p=E.L2W(g.x,g.z,g.ry,.66,-.85+q*.34);E.box(M.ST,p[0],H(p[0],p[1])+.07,p[1],.24,.04,.11,g.ry,C.cer);}
   for(let q=0;q<5;q++){const p=E.L2W(g.x,g.z,g.ry,-.78,-.9+q*.45);win(p[0],H(p[0],p[1])+.45,p[1],'#D6B68E',.2,.22);}}}
  {const g=at(s,10.1,.38);if(free(g.x,g.z,1.2))pool(g,0,.82);}
  {const g=at(s,11.35,-.4);if(free(g.x,g.z,.9))pool(g,1,.7,1.2);}
  for(const[rr,f]of[[9.0,-.62],[8.7,.62],[6.45,.58],[11.3,.55]]){const g=at(s,rr,f);if(!free(g.x,g.z,.8))continue;const y=E.lowY(g.x,g.z,1,1)-.05;
   for(const c of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(g.x,g.z,g.ry,c[0]*.32,c[1]*.32);E.box(M.ST,p[0],y,p[1],.05,.62,.05,g.ry,C.cer);}
   E.box(M.ST,g.x,y+.62,g.z,.82,.08,.82,g.ry,C.stone);E.box(M.WD,g.x,y,g.z,.5,.14,.36,g.ry,cv('#6E5E52'),1);win(g.x,y+.5,g.z,'#D8B48A',.28,.42);NB.hedonic++;}
  {const g=at(s,6.45,-.5);if(free(g.x,g.z,.9)){GZ.push({x:g.x,z:g.z,r:.5,c:cv('#6A5056')});E.add(M.LT,DISC(14),g.x,H(g.x,g.z)-.03,g.z,.16,.12,.16,0,0,0,C.pool);
   for(let q=0;q<8;q++){const t=q/8*TAU,x=g.x+Math.cos(t)*.72,z=g.z+Math.sin(t)*.72;if(free(x,z,.1))E.add(M.FO,CRW(),x,H(x,z)+.1,z,.17,.17,.17,0,0,0,jc(C.lawn,x,z,.1));}NB.hedonic++;}}
  for(const[rr,f]of[[10.8,.95],[7.0,.95]])tree(at(s,rr,f).x,at(s,rr,f).z,.85);
  mast(at(s,9.3,0).x,at(s,9.3,0).z,1.6,3.2);}
 // ======================= virtual: windowless immersion pods on a paved precinct =======================
 {const s=SI.virtual;NB.virtual=0;const ROWS=[[6.9,[0]],[8.3,[-.64,0,.64]],[9.7,[-.64,0,.64]],[11.05,[-.55,.55]]];
  for(const[rr,fs]of ROWS)for(const f of fs){const g=at(s,rr,f);if(!free(g.x,g.z,.6))continue;const y=H(g.x,g.z)-.1;
   E.add(M.B,G.ico(N?2:1),g.x,y,g.z,.55,.45,.42,0,g.ry,0,jc(cv('#8A8E96'),g.x,g.z,.03));
   E.add(M.LT,DISC(16),g.x,y+.1,g.z,.555,.025,.425,0,g.ry,0,LINE,1);   // base seam
   const d=E.L2W(g.x,g.z,g.ry,-.5,0);E.glow(d[0],y+.2,d[1],.18,'#9FB2C4',.22,[.25,6,rr+f,0]);NB.virtual++;}
  for(const f of[-.32,.32]){const a=s.am+f*hw(s,9);strip(M.ME,a,6.5,11.2,0,.24,.26,cv('#7C8088'),0,1.2);strip(M.LT,a,6.5,11.2,0,.05,.265,LINE,1,1.2);}   // covered walkways
  mast(at(s,7.6,0).x,at(s,7.6,0).z,1.6,4.4);}
 // ======================= prison: small walled compound at the far edge =======================
 {const s=SI.prison,c=at(s,10.75,0),ry=c.ry;NB.prison=0;
  if(free(c.x,c.z,1.4)){const y=E.lowY(c.x,c.z,2.2,2.2)-.06,WH=.55,WC=cv('#A29D93');
   const wall=(lx,lz,sx,sz)=>{const p=E.L2W(c.x,c.z,ry,lx,lz);E.box(M.ST,p[0],y,p[1],sx,WH,sz,ry,WC);E.box(M.ST,p[0],y+WH,p[1],sx+.03,.035,sz+.03,ry,C.stone,1);};
   wall(1.0,0,.1,2.0);wall(0,.95,2.1,.1);wall(0,-.95,2.1,.1);wall(-1.0,.6,.1,.8);wall(-1.0,-.6,.1,.8);   // gate gap faces the core
   {const p=E.L2W(c.x,c.z,ry,-1.25,0);E.box(M.ST,p[0],y,p[1],.32,.42,.52,ry,C.stoneD);E.box(M.ME,p[0],y+.42,p[1],.36,.04,.56,ry,C.slate);}
   for(const[lx,lz]of[[-.35,.45],[.35,.45],[.35,-.45]]){const p=E.L2W(c.x,c.z,ry,lx,lz);E.box(M.B,p[0],y,p[1],.46,.36,.62,ry,cv('#8E8A84'));E.box(M.ME,p[0],y+.36,p[1],.5,.04,.66,ry,C.slate);
    E.bands(p[0],y,p[1],.46,.62,ry,.36,.2,[.3,.3,.3],.4);}
   for(const[lx,lz]of[[1,.95],[1,-.95],[-1,.95],[-1,-.95],[1,0],[0,.95],[0,-.95]]){const p=E.L2W(c.x,c.z,ry,lx,lz);E.box(M.ME,p[0],y+WH,p[1],.04,.14,.04,0,C.metal,1);E.glow(p[0],y+WH+.17,p[1],.2,'#B6BEC6',.2,null);}
   GZ.push({x:E.L2W(c.x,c.z,ry,-.35,-.45)[0],z:E.L2W(c.x,c.z,ry,-.35,-.45)[1],r:.42,c:cv('#6E6A62')});NB.prison=1;}
  for(const rr of[6.4,7.6])for(const f of[-.7,.7])tree(at(s,rr,f).x,at(s,rr,f).z,.85);
  arcSeg(M.FO,9.25,s.am-hw(s,9.25),s.am+hw(s,9.25),.16,.22,C.hedge,0,.6);
  {const p=E.L2W(c.x,c.z,ry,1.0,1.35);mast(p[0],p[1],1.7,5.5);}}
 // ======================= wildlife: forest reserve, pond, meadows - no buildings =======================
 {const s=SI.wildlife,pc=at(s,9.3,.3);NB.wildlife=0;GZ.push({x:pc.x,z:pc.z,r:1.05,c:C.water,pond:1});
  E.add(M.LT,DISC(N?24:12),pc.x,H(pc.x,pc.z)-.03,pc.z,1.0,.11,.72,0,pc.ry+.3,0,C.water);
  for(let rr=5.95;rr<12.6;rr+=.46){const n=Math.ceil(s.span*rr/.48);for(let j=0;j<n;j++){const a=s.a0+(j+.5+(hash(rr,j)-.5)*.6)/n*s.span,r2=rr+(hash(j,rr)-.5)*.35;
   if(Math.abs(wr2(a-s.am))>hw(s,r2)+.02||r2>rOut(a)-.55)continue;const x=Math.cos(a)*r2,z=Math.sin(a)*r2;
   if(Math.hypot(x-pc.x,z-pc.z)<1.35||vn(x*.38+20,z*.38-4)>.76)continue;const h=hash(x*1.7,z*1.3),sz=.85+.5*hash(z,x);
   if(h<.7)pine(x,z,sz);else{if(!free(x,z,.3))continue;const y=H(x,z)-.04;E.box(M.WD,x,y,z,.05,.3*sz,.05,0,C.trunk,1);E.add(M.FO,CRW(),x,y+.5*sz,z,.33*sz,.36*sz,.33*sz,0,h*5,0,jc(cv('#3A4E30'),x,z,.15));}NB.wildlife++;}}
  {const p=at(s,8.0,-.85);mast(p.x,p.z,1.6,6.6);}}
 // ======================= traditional: village on a lane, fields, hedgerows, barn, orchard =======================
 {const s=SI.traditional;NB.traditional=0;const lane=rr=>.22*Math.sin((rr-5.6)*.85);   // tangential offset (u) of the lane
  const WL=['#9A8C78','#A29682','#8E8274','#A08A72'].map(h=>cv(h)),RF=['#5E4C44','#55504E','#6A5446'].map(h=>cv(h));
  const house=(rr,off)=>{const a=s.am+(lane(rr)+off)/rr,x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(!free(x,z,.5))return;const ry=-a+(hash(x,z)-.5)*.22+(Math.abs(off)>1.2?Math.PI/2:0),y=E.lowY(x,z,.7,.6)-.06,hh=hash(z,x);
   E.box(M.ST,x,y,z,.62,.4,.48,ry,jc(WL[(hh*4)|0],x,z,.05));E.add(M.RF,E.prism(),x,y+.4,z,.68,.32,.56,0,ry,0,jc(RF[(hh*3)|0],x,z,.05));
   {const p=E.L2W(x,z,ry,.2,.08);E.box(M.ST,p[0],y+.5,p[1],.08,.2,.08,ry,cv('#6A5C50'),1);}
   if(N)for(const sg of[-1,1]){const p=E.L2W(x,z,ry,(hh-.5)*.2,sg*.245);E.box(M.LT,p[0],y+.16,p[1],.1,.1,.02,ry,hh<.55?[.5,.4,.27]:[.12,.12,.13]);}
   if(hh<.45)win(x,y+.24,z,'#D6A672',.26,.3);NB.traditional++;};
  for(let rr=6.15;rr<9.5;rr+=.82){house(rr,.72);house(rr+.4,-.72);}
  for(let rr=6.7;rr<9.1;rr+=1.05){house(rr,1.55);house(rr+.5,-1.55);}
  // fields beyond the village: hedgerows on radial + tangential lines, barn + silo, orchard
  for(const f of[-.62,0,.62]){const a=s.am+f*hw(s,10.8);strip(M.FO,a,9.85,rOut(a)-.6,0,.12,.2,C.hedge,0,.9);}
  arcSeg(M.FO,9.75,s.am-hw(s,9.75),s.am+hw(s,9.75),.12,.2,C.hedge,0,.7);arcSeg(M.FO,11.2,s.am-hw(s,11.2),s.am+hw(s,11.2),.12,.2,C.hedge,0,.7);
  {const b=at(s,10.5,.32);if(free(b.x,b.z,.8)){const y=E.lowY(b.x,b.z,1,.7)-.06;E.box(M.WD,b.x,y,b.z,.9,.5,.6,b.ry,cv('#6E5444'));E.add(M.RF,E.prism(),b.x,y+.5,b.z,.96,.36,.68,0,b.ry,0,cv('#4E4A4C'));
   const p=E.L2W(b.x,b.z,b.ry,.15,.55);E.add(M.ST,DISC(10),p[0],y,p[1],.18,.95,.18,0,0,0,cv('#8C887E'));E.add(M.ST,G.cone(10),p[0],y+.95,p[1],.19,.16,.19,0,0,0,C.slate);NB.traditional++;}}
  {const o=at(s,10.55,-.33);for(let q=-1;q<=1;q++)for(let w=-1;w<=1;w++){const p=E.L2W(o.x,o.z,o.ry,q*.45,w*.45);if(free(p[0],p[1],.2))E.add(M.FO,CRW(),p[0],H(p[0],p[1])+.2,p[1],.18,.2,.18,0,0,0,jc(cv('#405232'),p[0],p[1],.1));}}
  {const p=at(s,8.0,.9);mast(p.x,p.z,1.6,7.7);}}
 // ======================= pious: cloister + temple with slim tower + meditation garden =======================
 {const s=SI.pious,c=at(s,8.45,0),ry=c.ry;NB.pious=0;
  if(free(c.x,c.z,1.6)){const y=E.lowY(c.x,c.z,2.6,2.6)-.07,WC=jc(C.stone,c.x,c.z,.02),RC=cv('#585A62');
   for(const sg of[-1,1]){let p=E.L2W(c.x,c.z,ry,sg*1.15,0);E.box(M.ST,p[0],y,p[1],.5,.55,2.8,ry,WC);E.add(M.RF,E.prism(),p[0],y+.55,p[1],2.86,.3,.6,0,ry+Math.PI/2,0,RC);
    p=E.L2W(c.x,c.z,ry,0,sg*1.15);E.box(M.ST,p[0],y,p[1],1.8,.55,.5,ry,WC);E.add(M.RF,E.prism(),p[0],y+.55,p[1],1.8,.3,.6,0,ry,0,RC);}
   if(N)for(const sg of[-1,1])for(let q=-3;q<=3;q++){let p=E.L2W(c.x,c.z,ry,sg*.84,q*.27);E.box(M.ST,p[0],y,p[1],.05,.42,.05,ry,C.cer);p=E.L2W(c.x,c.z,ry,q*.27,sg*.84);E.box(M.ST,p[0],y,p[1],.05,.42,.05,ry,C.cer);}   // inner arcades
   E.box(M.LT,c.x,y+.06,c.z,.42,.07,.42,ry,C.pool);{const p=E.L2W(c.x,c.z,ry,.38,.38);tree(p[0],p[1],.8);}
   win(c.x,y+.35,c.z,'#D2AA7C',.18,.5);NB.pious++;}
  {const t=at(s,10.9,0),y=E.lowY(t.x,t.z,1.6,1)-.07;if(free(t.x,t.z,1)){E.box(M.ST,t.x,y,t.z,1.5,.75,.8,t.ry,C.stone);E.add(M.RF,E.prism(),t.x,y+.75,t.z,1.54,.55,.86,0,t.ry,0,cv('#55575F'));
   const p=E.L2W(t.x,t.z,t.ry,-.98,0);E.box(M.ST,p[0],y,p[1],.34,1.65,.34,t.ry,C.cer);E.box(M.LT,p[0],y+1.3,p[1],.36,.12,.36,t.ry,[.36,.31,.24]);E.add(M.RF,G.cone(4),p[0],y+1.65,p[1],.27,.55,.27,0,t.ry+Math.PI/4,0,C.slate);
   win(p[0],y+.25,p[1],'#D2AA7C',.22,.36);NB.pious++;}}
  {const g=at(s,6.45,0);GZ.push({x:g.x,z:g.z,r:.62,c:cv('#8A867C')});for(let q=0;q<5;q++){const t=q/5*TAU+.4,x=g.x+Math.cos(t)*.32*(.6+hash(q,2)),z=g.z+Math.sin(t)*.32*(.6+hash(2,q));E.add(M.ST,G.ico(0),x,H(x,z)+.02,z,.09,.07,.09,0,q,0,cv('#5A5852'));}
   for(const sg of[-1,1]){let p=E.L2W(g.x,g.z,g.ry,.8,sg*.45);E.box(M.FO,p[0],H(p[0],p[1])-.04,p[1],.16,.24,.7,g.ry,C.hedge);p=E.L2W(g.x,g.z,g.ry,0,sg*.85);E.box(M.FO,p[0],H(p[0],p[1])-.04,p[1],1.5,.24,.16,g.ry,C.hedge);}}
  for(const f of[-.75,.75])tree(at(s,10.6,f).x,at(s,10.6,f).z,.8);
  {const p=at(s,9.8,.9);mast(p.x,p.z,1.6,8.8);}}
 // ======================= ground: pool, paving rings, lawn ring, sectors; petal-feathered rim =======================
 const PV=cv('#9A958A'),RD=cv('#8C877D'),LW=cv('#4E5E3C'),FLD=[cv('#6E7640'),cv('#7A7048'),cv('#56663A')];
 const BASE={knowledge:cv('#4E5E3E'),art:cv('#505E40'),hedonic:cv('#56683F'),virtual:cv('#807D76'),prison:cv('#4C583C'),wildlife:cv('#2E3C28'),traditional:cv('#56603A'),pious:cv('#4E5A42')};
 const fr=(v,p)=>Math.abs(((v/p)%1+1)%1-.5)*p;
 E.ground(N?74:42,R*1.08,(x,z,c)=>{const rr=Math.hypot(x,z),a=Math.atan2(z,x),ro=rOut(a),n1=vn(x*.5+1,z*.5+4),i=secI(a),s=S[i];let col;
  const au=x*Math.cos(s.am)+z*Math.sin(s.am),av=-x*Math.sin(s.am)+z*Math.cos(s.am),fN=wr2(a-s.am)/Math.max(.01,hw(s,Math.max(rr,1)));
  if(rr<3.0)col=C.water;else if(rr<3.58){col=PV;if(fr(a*rr,1.1)<.05)col=mx(col,cv('#6E6A62'),.6);}
  else if(rr<4.18)col=RD;else if(rr<5.6){col=LW;if(N&&fr(rr,.7)<.17)col=mx(col,cv('#56663F'),.5);}
  else{col=BASE[s.id];const id=s.id;
   if(id==='wildlife'){if(vn(x*.38+20,z*.38-4)>.76)col=cv('#56603E');else col=mx(col,cv('#2E3C28'),n1*.5);}
   else if(id==='traditional'){if(rr>9.75)col=FLD[(((Math.floor(rr/.72)+Math.round(fN*1.5))%3)+3)%3];else if(Math.abs(av-lane(rr))<.16&&rr<9.6)col=cv('#857F72');}
   else if(id==='virtual'){if(Math.abs(fN)<1.05&&rr>6.2){if(fr(au,.7)<.025||fr(av,.7)<.025)col=mx(col,cv('#5E5C58'),.6);}else col=LW;}
   else{if(N&&fr(au,1.2)<.3)col=mx(col,cv('#56663F'),.35);   // mown stripes (formal sectors)
    if(id==='knowledge'&&rr>6&&rr<10.6&&Math.abs(fN)<.62)col=mx(col,cv('#58683F'),.5);}
   for(const g of GZ){const dd=Math.hypot(x-g.x,z-g.z);if(dd<g.r*(g.pond?1.2:1))col=g.c;}}
  function lane(r2){return .22*Math.sin((r2-5.6)*.85);}
  for(let b=0;b<BV.length;b++){const ca=Math.cos(BV[b]),sa=Math.sin(BV[b]),t=x*ca+z*sa,o=-x*sa+z*ca;if(t>4.1&&t<BVE[b]){if(Math.abs(o)<.4)col=PV;else if(t>5.7&&o>.45&&o<.85)col=C.water;}}
  const f=.92+.16*n1;c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;const q=rr/ro*(1+.06*(n1-.5));c[3]=1-smooth(.9,1.04,q);});
 E.info.masts=MAST.length;E.info.lamps=LAMPS.length;E.info.lots=NB;E.info.glowsN=E.glows.length;});}};
})();
