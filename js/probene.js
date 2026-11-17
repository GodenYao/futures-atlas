// Futures Atlas G1 preview - probene.js : Benevolent Dictator sector city (swap r8 W, quality r9 Q2; our own code). Uses FA.G1Z (js/prolib.js).
// Tegmark, Life 3.0 ch.5 "Benevolent dictator": everybody knows that an AI runs society and enforces strict rules, but most people see
// this as a good thing; society is organised into sectors with different lifestyles, and people choose the sector they live in.
// Describe, never judge. What the city literally shows: the AI core = a stepped stone ziggurat (dark risers, pale lit treads, lit stair
// edges, a dark top shrine with a dim slate slit) on a dark square plaza with four slim sensor masts, inside a ring park (trees, lawns,
// ponds, a pavilion). Six straight pale boulevards with a tree row on each side run out from the park and divide six dense, tidy
// sectors, each with ONE building type: rows of terraced houses with back gardens, identical slab blocks with window bands, domed halls
// and colonnades on stone squares, farms (barns + silos, greenhouses, orchards, strip fields), sports pitches with a pool and pavilions,
// and a quiet water-garden sector with stacked-roof pavilions. Each sector has an entry arch from the park; slim sensor masts with small
// dim heads pulse slowly along the boulevards. Night grade muted (no halo, no gold): sparse warm-neutral window light only.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
FA.PROBENE={build(site,ctx){const Z=FA.G1Z,k=FA.G1KIT;if(!Z||!k)throw new Error('FA.G1Z / FA.G1KIT missing (js/prolib.js, js/prorev.js)');
 return Z.city(site,ctx,'benevolent',E=>{
 const{smooth,vn,hash}=k,R=E.R,r=E.r,d=E.d,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,TAU=Math.PI*2;
 const P=site.params||{},kA=P.keepA!=null?P.keepA:Math.PI/2,avoid=P.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const wrap=a=>((a%TAU)+TAU)%TAU,NS=6,BW=TAU/NS,bA=i=>kA+i*BW;   // boulevard i at kA + i*60deg (boulevard 0 = the road's)
 const TH=['terrace','slab','hall','farm','leisure','quiet'],RF0=[1.08,1.08,1.02,1.18,1.1,1.04];
 const ph=[0,1,2].map(i=>hash((site.seed||5)*.19+i,4.1)*TAU),secOf=(x,z)=>Math.floor(wrap(Math.atan2(z,x)-kA)/BW)%NS;
 const rOut=a=>{const s=Math.floor(wrap(a-kA)/BW)%NS;return R*RF0[s]*(1+.05*Math.sin(3*a+ph[0])+.04*Math.sin(7*a+ph[1])+.02*Math.sin(11*a+ph[2]));};
 const bvD=(x,z)=>{let b=1e9;for(let i=0;i<NS;i++){const a=bA(i),c=Math.cos(a),s=Math.sin(a),t=x*c+z*s;if(t>3.4)b=Math.min(b,Math.abs(-x*s+z*c));}return b;};
 const PK0=4.3,PK1=5.8,park=(x,z)=>{const rr=Math.hypot(x,z),w=.35*(vn(x*.4+7,z*.4)-.5);return rr>PK0+w&&rr<PK1+w;};
 const BVW=.66,BVT=.98;   // boulevard paving half-width, tree-row offset
 const ry0=-kA;   // plaza / ziggurat aligned to the road axis
 // ---- ziggurat (AI core): five tiers = dark stone risers + pale lit treads; lit stair edges on the two road-axis faces; dark top
 //      shrine with a dim slate slit (no halo, no glow sprite) ----
 {const y=E.lowY(0,0,5,5)-.2,TW=[5.2,4.2,3.3,2.5,1.8],TH0=.8;let yy=y;
  TW.forEach((w,i)=>{E.box(M.ST,0,yy,0,w,TH0,w,ry0,jc(cv(i%2?'#3A3940':'#403E46'),i,1,.03));
   E.box(M.ST,0,yy+TH0-.05,0,w+.08,.09,w+.08,ry0,cv('#9A9488'));   // pale tread / cornice (catches the scene light)
   E.box(M.LT,0,yy+TH0+.035,0,w+.1,.025,w+.1,ry0,[.32,.33,.34],1);   // thin neutral edge line (NEAR)
   yy+=TH0;});
  const Ht=yy-y;for(const sgn of[1,-1]){const n=E.near?14:5,dz=2.7/n;for(let s=0;s<n;s++){const f=(s+.5)/n,lz=sgn*(3.45-2.7*f),p=E.L2W(0,0,ry0,0,lz),hs=Ht*f+.08;
   E.box(M.ST,p[0],y,p[1],1.0,hs,dz+.02,ry0,cv('#8C877C'));
   const e=E.L2W(0,0,ry0,0,lz+sgn*dz*.5);E.box(M.LT,e[0],y+hs,e[1],1.02,.03,.05,ry0,[.44,.42,.38],1);}   // lit step edges (NEAR)
   for(const sd of[-1,1]){const p=E.L2W(0,0,ry0,sd*.58,sgn*2.1);E.box(M.ST,p[0],y,p[1],.12,Ht*.55,2.7,ry0,cv('#2E2D33'));}}   // dark stair cheeks
  E.box(M.ST,0,yy,0,1.15,1.0,1.15,ry0,cv('#2C2B32'));   // shrine
  for(const sgn of[1,-1]){const p=E.L2W(0,0,ry0,0,sgn*.585);E.box(M.LT,p[0],yy+.18,p[1],.16,.62,.03,ry0,[.15,.2,.26]);}   // dim slate slit
  E.box(M.ST,0,yy+1.0,0,1.4,.12,1.4,ry0,cv('#8A857A'));E.box(M.ST,0,yy+1.12,0,.8,.1,.8,ry0,cv('#3A3940'));
  for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(0,0,ry0,s[0]*.62,s[1]*.62);E.box(M.ST,p[0],yy,p[1],.14,1.0,.14,ry0,cv('#55534E'),1);}
  E.anchors.core={x:0,y:yy+1.2,z:0};
  // plaza corner masts (slim, below the shrine top so the marker plane stays at the ziggurat)
  for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(0,0,ry0,s[0]*3.5,s[1]*3.5),my=H(p[0],p[1])-.1;E.box(M.ME,p[0],my,p[1],.09,3.4,.09,0,cv('#5A606A'));E.box(M.ME,p[0],my+3.4,p[1],.28,.16,.28,ry0,cv('#4A505A'));E.glow(p[0],my+3.62,p[1],.45,'#7E92A6',.34,[.35,7,s[0]+2*s[1],0]);}
  // low clipped hedges along the plaza edge (frame the dark plaza)
  for(const s of[0,1,2,3]){const a=s*Math.PI/2;for(let q=-3;q<=3;q++){if(q===0)continue;const p=E.L2W(0,0,ry0+a,q*.95,3.75);E.box(M.FO,p[0],H(p[0],p[1])-.05,p[1],.7,.28,.28,ry0+a,cv('#34452C'));}}}
 // ---- ring park: trees, pavilion by a pond ----
 for(let t=0;t<300;t++){const a=r()*TAU,rr=PK0+.25+r()*(PK1-PK0-.4),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(!park(x,z)||Math.max(Math.abs(x*Math.cos(kA)+z*Math.sin(kA)),Math.abs(-x*Math.sin(kA)+z*Math.cos(kA)))<4.05||bvD(x,z)<BVW+.15||!free(x,z,.3)||r()<.4)continue;const ty=H(x,z),ts=.7+.4*r();
  E.box(M.WD,x,ty-.05,z,.07,ts*.55,.07,0,cv('#3A2E26'));E.add(M.FO,E.G.ico(1),x,ty+ts*.75,z,.36*ts,.4*ts,.36*ts,0,0,0,jc(cv('#36492C'),x,z,.15));}
 {const a=kA+BW*2.5,x=Math.cos(a)*5.1,z=Math.sin(a)*5.1,y=H(x,z)-.05;E.box(M.ST,x,y,z,.8,.35,.8,0,cv('#6A665E'));E.add(M.RF,E.G.cone(4),x,y+.35,z,.75,.45,.75,0,Math.PI/4,0,cv('#4E4E56'));}
 // ---- boulevards: pale paving, a dense tree row on each side, dark kerbs; sensor masts at the park edge and the sector rim ----
 const MAST=[];for(let i=0;i<NS;i++){const a=bA(i),c=Math.cos(a),s=Math.sin(a),nx=-s,nz=c,L0=PK1+.1,L1=rOut(a)*.97;
  for(let t=L0;t<L1;t+=.75){const j=Math.round((t-L0)/.75);if(!E.near&&j%2)continue;for(const sg of[-1,1]){const x=c*t+nx*BVT*sg,z=s*t+nz*BVT*sg;if(!free(x,z,.2))continue;const ty=H(x,z);
   E.box(M.WD,x,ty-.05,z,.06,.4,.06,0,cv('#3A2E26'));E.add(M.FO,E.G.ico(1),x,ty+.62,z,.4,.42,.4,0,0,0,jc(cv('#42592F'),x,z,.06));}}
  for(const t of[L1*.9]){const x=c*t+nx*1.55,z=s*t+nz*1.55;if(!free(x,z,.2))continue;const my=H(x,z)-.1;MAST.push([x,z,my]);E.box(M.ME,x,my,z,.07,3.0,.07,0,cv('#5A606A'));E.box(M.ME,x,my+3.0,z,.24,.14,.24,-a,cv('#4A505A'));
   E.glow(x,my+3.2,z,.42,'#7E92A6',.36,[.35,7,i*1.1+t,0]);}}
 // ---- sectors: one uniform building type each, dense rows aligned to the sector axis (pitch along the radial axis u / across v) ----
 const PIT={terrace:[1.45,1.2],slab:[1.55,1.15],hall:[2.1,2.1],farm:[2.0,2.0],leisure:[2.5,2.5],quiet:[1.9,1.9]};
 const wins=[],NL=[0,0,0,0,0,0];
 for(let sI=0;sI<NS;sI++){const th=TH[sI],am=bA(sI)+BW/2,u=[Math.cos(am),Math.sin(am)],v=[-u[1],u[0]],ry=-am,pu=PIT[th][0],pv=PIT[th][1],nu=Math.ceil(R*1.3/pu),nv=Math.ceil(R*1.3/pv);
  for(let i=1;i<=nu;i++)for(let j=-nv;j<=nv;j++){const a0=i*pu,b0=j*pv,x=a0*u[0]+b0*v[0],z=a0*u[1]+b0*v[1],rr=Math.hypot(x,z);if(rr<PK1+.6||secOf(x,z)!==sI)continue;
   const ro=rOut(Math.atan2(z,x));if(rr>ro*.95||bvD(x,z)<BVT+.25+Math.min(pu,pv)*.3||!free(x,z,Math.min(pu,pv)*.45))continue;if(r()>1-.3*smooth(.75,1,rr/ro))continue;const y=E.lowY(x,z,pu*.7,pv*.7)-.1;NL[sI]++;
   if(th==='terrace'){E.box(M.ST,x,y,z,1.38,.74,.6,ry,jc(cv('#7A6656'),x,z,.05));E.add(M.RF,E.prism(),x,y+.74,z,1.44,.36,.7,0,ry,0,cv('#3E3E48'));
    for(const q of[-.46,.46]){const p=E.L2W(x,z,ry,q,0);E.box(M.ST,p[0],y+.74,p[1],.1,.2,.12,ry,cv('#5A4C44'),1);}   // small chimneys
    if(E.near)for(let q=-1;q<=1;q++){const p=E.L2W(x,z,ry,q*.44,.305);if(d()<.55)E.box(M.LT,p[0],y+.34,p[1],.13,.13,.03,ry,[.46,.4,.3]);}
    {const g=E.L2W(x,z,ry,0,-.52);E.box(M.FO,g[0],H(g[0],g[1])-.04,g[1],1.3,.14,.36,ry,cv('#3E4C2C'));}   // back gardens
    if(hash(x,z)<.22)wins.push([x,y+.4,z]);}
   else if(th==='slab'){E.box(M.B,x,y,z,1.4,1.9,.8,ry,jc(cv('#76767C'),x,z,.03));E.bands(x,y,z,1.4,.8,ry,1.9,.42,[.36,.34,.3],.8);
    E.box(M.ME,x,y+1.9,z,1.46,.1,.86,ry,cv('#3E424A'));
    if(hash(x,z)<.3)wins.push([x,y+2,z]);}
   else if(th==='hall'){if(((i+j)&1)===0){E.box(M.ST,x,y,z,1.7,.7,1.7,ry,cv('#847E74'));E.add(M.ST,E.G.ico(1),x,y+.7,z,.78,.64,.78,0,0,0,cv('#56666A'));E.box(M.ST,x,y+.62,z,1.76,.1,1.76,ry,cv('#9A948A'));}
    else{E.box(M.ST,x,y,z,1.8,.18,1.1,ry,cv('#6E6A62'));E.box(M.ST,x,y+.95,z,1.95,.12,1.25,ry,cv('#5A585C'));for(let q=-2;q<=2;q++)for(const s of[-1,1]){const p=E.L2W(x,z,ry,q*.4,s*.5);E.box(M.ST,p[0],y,p[1],.09,.95,.09,ry,cv('#948E82'));}}   // colonnade (both tiers)
    if(hash(x,z)<.4)wins.push([x,y+.5,z]);}
   else if(th==='farm'){const hf=hash(x*.7,z);if(hf<.3){E.box(M.WD,x,y,z,1.2,.66,.74,ry,cv('#6A4E40'));E.add(M.RF,E.prism(),x,y+.66,z,1.3,.48,.84,0,ry,0,cv('#3E3A40'));const sp=E.L2W(x,z,ry,.82,.2);E.add(M.ST,E.G.cyl(10,1),sp[0],y,sp[1],.22,1.1,.22,0,0,0,cv('#6E6A64'));}   // barn + silo
    else if(hf<.6){for(const s of[-1,1]){const p=E.L2W(x,z,ry,0,s*.45);E.box(M.ST,p[0],y,p[1],1.8,.34,.62,ry,cv('#56625E'));E.add(M.ST,E.prism(),p[0],y+.34,p[1],1.8,.26,.64,0,ry,0,cv('#6E7C76'));}}   // greenhouse pair
    else for(let q=-1;q<=1;q++)for(let w=-1;w<=1;w++){if(!E.near&&(q+w)&1)continue;const p=E.L2W(x,z,ry,q*.65,w*.65);E.add(M.FO,E.G.ico(0),p[0],H(p[0],p[1])+.28,p[1],.27,.3,.27,0,0,0,cv('#3C5030'));}}   // orchard rows
   else if(th==='leisure'){if(hash(x,z)<.28){E.box(M.ST,x,y,z,1.3,.45,.7,ry,cv('#7A766C'));E.box(M.ST,x,y+.45,z,1.5,.07,.9,ry,cv('#56545A'));wins.push([x,y+.3,z]);}
    else{if(hash(x*1.7,z)<.4)for(const s of[-1,1]){const p=E.L2W(x,z,ry,0,s*1.0);E.box(M.ST,p[0],H(p[0],p[1])-.05,p[1],1.9,.22,.22,ry,cv('#5E5C58'));}}}   // low stands beside the pitches
   else{const pv2=hash(x*1.1,z)<.5;if(pv2){let yy=y;for(const s of[[.82,.4],[.62,.32],[.44,.28]]){E.box(M.WD,x,yy,z,s[0]*.8,s[1],s[0]*.8,ry,cv('#5A4A42'));E.box(M.RF,x,yy+s[1],z,s[0]*1.3,.07,s[0]*1.3,ry,cv('#3E3C44'));yy+=s[1]+.07;}wins.push([x,y+.3,z]);}
    for(let q=0;q<1;q++){const p=E.L2W(x,z,ry,(hash(x+q,z)-.5)*1.8,(hash(x,z+q)-.5)*1.8),ty=H(p[0],p[1]);if(!pv2||q){E.add(M.FO,E.G.ico(1),p[0],ty+.45,p[1],.34,.38,.34,0,0,0,jc(cv('#38502E'),p[0],p[1],.15));E.box(M.WD,p[0],ty-.05,p[1],.06,.3,.06,0,cv('#3A2E26'),1);}}}}}
 for(const w of wins)E.glow(w[0],w[1],w[2],.42,'#C2B49A',.34,null);
 // service drones gliding slowly out and back along the boulevards (off by default)
 if(P.drones)E.movers(M.LT,.26,.08,.26,[.32,.38,.44],NS,(i,t,o)=>{const a=bA(i),L0=PK1+.5,L1=rOut(a)*.9,q=(t/48+i*.17)%1,e=q<.5?q*2:2-q*2,s=L0+(L1-L0)*(e*e*(3-2*e)),x=Math.cos(a)*s,z=Math.sin(a)*s;o.position.set(x,H(x,z)+2.6,z);o.rotation.y=-a;});
 // ---- ground: dark plaza, ring park + ponds, pale boulevards with dark kerbs, one distinct ground per sector; feathered rim ----
 const PLZ=cv('#5E5A52'),PRK=cv('#3A4C30'),PND=cv('#222C42'),BV=cv('#7A7468'),KRB=cv('#2E302C'),
  ST2={terrace:cv('#485838'),slab:cv('#525256'),hall:cv('#5E574C'),farm:cv('#56603A'),leisure:cv('#466438'),quiet:cv('#3C4C38')};
 const FLD=[cv('#5E6838'),cv('#6A6040'),cv('#44582E')],fr=(v,p)=>Math.abs(((v/p)%1+1)%1-.5)*p,uk=[Math.cos(kA),Math.sin(kA)];
 E.ground(E.near?96:64,R*1.5,(x,z,c)=>{const rr=Math.hypot(x,z),a=Math.atan2(z,x),ro=rOut(a),n1=vn(x*.5+1,z*.5+4),n2=vn(x*1.3,z*1.3),s=secOf(x,z),th=TH[s],am=bA(s)+BW/2,au=x*Math.cos(am)+z*Math.sin(am),av=-x*Math.sin(am)+z*Math.cos(am);
  const pa=x*uk[0]+z*uk[1],pb=-x*uk[1]+z*uk[0];let col;
  if(Math.max(Math.abs(pa),Math.abs(pb))<3.85){col=PLZ;if(fr(pa,1.0)<.05||fr(pb,1.0)<.05)col=mx(col,cv('#3E3B37'),.6);}
  else if(rr<PK0||park(x,z)){col=PRK;if(vn(x*.6+11,z*.6)>.72)col=PND;}
  else{col=ST2[th];const pu=PIT[th][0],pv=PIT[th][1];
   if(th==='farm'&&rr>PK1+1)col=FLD[(((Math.floor(av/1.2)%3)+3)%3)];
   if(th==='leisure'){const ca=fr(au,2.9),cb=fr(av,2.9);if(ca<1.2&&cb<.85)col=cv('#527040');if(Math.abs(ca-1.2)<.05&&cb<.85)col=cv('#66745A');if(hash(Math.round(au/2.9),Math.round(av/2.9))<.15&&ca<.9&&cb<.6)col=PND;}
   if(th==='quiet'&&vn(x*.7+3,z*.7+9)>.62)col=PND;
   if(th==='terrace'&&fr(av,pv)<.1)col=mx(col,cv('#5A5446'),.7);   // lanes between the house rows
   if(th==='slab'||th==='hall'){if(fr(au,pu)<.14||fr(av,pv)<.14)col=mx(col,cv('#635E54'),.6);}}
  const bd=bvD(x,z);if(rr>PK1-.4){if(bd<BVW)col=BV;else if(bd<BVW+.14)col=KRB;}
  const f=.9+.18*n1;c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;const q=rr/ro*(1+.08*(n1-.5)+.04*(n2-.5));c[3]=1-smooth(.82,1.04,q);});
 E.info.masts=MAST.length;E.info.wins=wins.length;E.info.lots=NL;});}};
})();
