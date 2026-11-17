// Futures Atlas G1 preview - probene.js : Benevolent Dictator sector city (swap r8 W; new generator, our own code). Uses FA.G1Z (js/prolib.js).
// Tegmark, Life 3.0 ch.5 "Benevolent dictator": everybody knows that an AI runs society and enforces strict rules, but most people see
// this as a good thing; society is organised into sectors with different lifestyles, and people choose the sector they live in.
// Describe, never judge. What the city literally shows: the AI core = a stepped stone ziggurat (ending-defining form) with a dim slate
// slit in its top shrine, on a square plaza with four tall sensor masts, inside a ring park (trees, lawns, ponds, a pavilion). Six
// straight tree-lined boulevards run out from the park and divide six tidy sectors, each with one uniform building type: terraced
// houses with gardens, identical slab blocks, domed halls and colonnades, farms with barns, greenhouses and orchards, sports fields with
// a pool and pavilions, and a quiet water-garden sector with stacked-roof pavilions. Each sector has a small entry arch from the park
// and hedge lines along its edges; slim sensor masts with small dim heads pulse slowly along the boulevards; a few service drones glide
// along them. Night grade muted (no halo, no gold): sparse warm-neutral window light only.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
FA.PROBENE={build(site,ctx){const Z=FA.G1Z,k=FA.G1KIT;if(!Z||!k)throw new Error('FA.G1Z / FA.G1KIT missing (js/prolib.js, js/prorev.js)');
 return Z.city(site,ctx,'benevolent',E=>{
 const{smooth,vn,hash}=k,R=E.R,r=E.r,d=E.d,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,TAU=Math.PI*2;
 const P=site.params||{},kA=P.keepA!=null?P.keepA:Math.PI/2,avoid=P.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 const wrap=a=>((a%TAU)+TAU)%TAU,NS=6,BW=TAU/NS,bA=i=>kA+i*BW;   // boulevard i at kA + i*60deg (boulevard 0 = the road's)
 const TH=['terrace','slab','hall','farm','leisure','quiet'],RF0=[1.0,1.0,1.0,1.2,1.1,1.04];
 const ph=[0,1,2].map(i=>hash((site.seed||5)*.19+i,4.1)*TAU),secOf=(x,z)=>Math.floor(wrap(Math.atan2(z,x)-kA)/BW)%NS;
 const rOut=a=>{const s=Math.floor(wrap(a-kA)/BW)%NS;return R*RF0[s]*(1+.06*Math.sin(3*a+ph[0])+.05*Math.sin(7*a+ph[1])+.03*Math.sin(11*a+ph[2]));};
 const bvD=(x,z)=>{let b=1e9;for(let i=0;i<NS;i++){const a=bA(i),c=Math.cos(a),s=Math.sin(a),t=x*c+z*s;if(t>3.4)b=Math.min(b,Math.abs(-x*s+z*c));}return b;};
 const PK0=4.3,PK1=5.9,park=(x,z)=>{const rr=Math.hypot(x,z),w=.45*(vn(x*.4+7,z*.4)-.5);return rr>PK0+w&&rr<PK1+w;};
 const ry0=-kA;   // plaza / ziggurat aligned to the road axis
 // ---- ziggurat (AI core): five stepped stone tiers, stair flights on the road side, top shrine with a dim slate slit ----
 {const y=E.lowY(0,0,5,5)-.2,TW=[5.0,4.0,3.1,2.3,1.6],TH0=.95;let yy=y;
  TW.forEach((w,i)=>{E.box(M.ST,0,yy,0,w,TH0+.02,w,ry0,jc(cv(i%2?'#5E5B62':'#66626A'),i,1,.04));E.box(M.LT,0,yy+TH0-.08,0,w+.03,.05,w+.03,ry0,[.17,.21,.26]);yy+=TH0;});
  const Ht=yy-y;for(const sgn of[1,-1]){const n=E.near?12:4;for(let s=0;s<n;s++){const f=(s+.5)/n,p=E.L2W(0,0,ry0,0,sgn*(3.4-2.6*f));E.box(M.ST,p[0],y,p[1],.9,Ht*f+.1,2.6/n+.02,ry0,cv('#6A666C'));}}   // stair flights up the two road-axis faces
  E.box(M.ST,0,yy,0,1.1,.95,1.1,ry0,cv('#4E4C54'));E.box(M.LT,0,yy+.45,0,1.13,.07,1.13,ry0,[.22,.28,.34]);E.box(M.ST,0,yy+.95,0,1.35,.12,1.35,ry0,cv('#5A5860'));
  for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(0,0,ry0,s[0]*.62,s[1]*.62);E.box(M.ST,p[0],yy,p[1],.14,.95,.14,ry0,cv('#5C5A62'),1);}
  E.glow(0,yy+.5,0,1.0,'#8896A6',.32,[.25,8,0,0]);E.anchors.core={x:0,y:yy+1,z:0};
  // plaza corner masts (tall)
  for(const s of[[-1,-1],[1,-1],[-1,1],[1,1]]){const p=E.L2W(0,0,ry0,s[0]*3.4,s[1]*3.4),my=H(p[0],p[1])-.1;E.box(M.ME,p[0],my,p[1],.1,5.2,.1,0,cv('#5A606A'));E.box(M.ME,p[0],my+5.2,p[1],.34,.2,.34,ry0,cv('#4A505A'));E.glow(p[0],my+5.45,p[1],.55,'#7E92A6',.42,[.35,7,s[0]+2*s[1],0]);}}
 // ---- ring park: trees, pavilion by a pond; hedge arc on the outer edge ----
 for(let t=0;t<260;t++){const a=r()*TAU,rr=PK0+.3+r()*(PK1-PK0-.5),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(!park(x,z)||Math.max(Math.abs(x*Math.cos(kA)+z*Math.sin(kA)),Math.abs(-x*Math.sin(kA)+z*Math.cos(kA)))<3.95||bvD(x,z)<.75||!free(x,z,.3)||r()<.45)continue;const ty=H(x,z),ts=.7+.4*r();
  E.box(M.WD,x,ty-.05,z,.07,ts*.55,.07,0,cv('#3A2E26'));E.add(M.FO,E.G.ico(1),x,ty+ts*.75,z,.36*ts,.4*ts,.36*ts,0,0,0,jc(cv('#3C5030'),x,z,.15));}
 {const a=kA+BW*2.5,x=Math.cos(a)*5.5,z=Math.sin(a)*5.5,y=H(x,z)-.05;E.box(M.ST,x+.9,y,z,.8,.35,.8,0,cv('#6A665E'));E.add(M.RF,E.G.cone(4),x+.9,y+.35,z,.75,.45,.75,0,Math.PI/4,0,cv('#4E4E56'));}
 // ---- boulevards: tree rows both sides, lamps; sensor masts at the park edge and out at the sector rim ----
 const MAST=[];for(let i=0;i<NS;i++){const a=bA(i),c=Math.cos(a),s=Math.sin(a),nx=-s,nz=c,L0=PK1+.2,L1=rOut(a)*.96;
  for(let t=L0;t<L1;t+=1.2){const j=Math.round((t-L0)/1.2);if(!E.near&&j%2)continue;for(const sg of[-1,1]){const x=c*t+nx*.85*sg,z=s*t+nz*.85*sg;if(!free(x,z,.2))continue;const ty=H(x,z);
   E.box(M.WD,x,ty-.05,z,.06,.42,.06,0,cv('#3A2E26'));E.add(M.FO,E.G.ico(1),x,ty+.6,z,.3,.34,.3,0,0,0,jc(cv('#3E5232'),x,z,.12));}}
  for(const t of[PK1+.5,L1*.92]){const x=c*t+nx*1.35,z=s*t+nz*1.35;if(!free(x,z,.2))continue;const my=H(x,z)-.1;MAST.push([x,z,my]);E.box(M.ME,x,my,z,.07,3.6,.07,0,cv('#5A606A'));E.box(M.ME,x,my+3.6,z,.26,.15,.26,-a,cv('#4A505A'));
   E.glow(x,my+3.82,z,.45,'#7E92A6',.4,[.35,7,i*1.1+t,0]);}}
 // ---- sectors: one uniform building type each, aligned to the sector axis ----
 const wins=[],NL=[0,0,0,0,0,0];
 for(let sI=0;sI<NS;sI++){const th=TH[sI],am=bA(sI)+BW/2,u=[Math.cos(am),Math.sin(am)],v=[-u[1],u[0]],ry=-am,PIT={terrace:1.55,slab:2.0,hall:2.7,farm:2.5,leisure:2.9,quiet:2.3}[th],n=Math.ceil(R*1.3/PIT);
  // entry arch from the park at the sector mid line + hedge arc along the sector's inner edge
  {const x=u[0]*(PK1+.35),z=u[1]*(PK1+.35),gy=H(x,z)-.08,ex=-u[1],ez=u[0];for(const s of[-1,1])E.box(M.ST,x+ex*.6*s,gy,z+ez*.6*s,.24,1.3,.24,ry+Math.PI/2,cv('#6A666C'));E.box(M.ST,x,gy+1.25,z,1.5,.18,.3,ry+Math.PI/2,cv('#6A666C'));
   for(let a=bA(sI)+.12;a<bA(sI+1)-.12;a+=.09){const rr=PK1+.35,hx=Math.cos(a)*rr,hz=Math.sin(a)*rr;if(Math.abs(wrap(a-am+Math.PI)-Math.PI)<.12)continue;E.box(M.FO,hx,H(hx,hz)-.05,hz,.62,.32,.18,-a-Math.PI/2,cv('#3A4A2E'),1);}}
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const a0=i*PIT,b0=j*PIT,x=a0*u[0]+b0*v[0],z=a0*u[1]+b0*v[1],rr=Math.hypot(x,z);if(rr<PK1+1.2||secOf(x,z)!==sI)continue;
   const ro=rOut(Math.atan2(z,x));if(rr>ro*.95||bvD(x,z)<PIT*.35+.5||!free(x,z,PIT*.5))continue;if(r()>1-.6*smooth(.7,1,rr/ro))continue;const y=E.lowY(x,z,PIT*.7,PIT*.7)-.1;NL[sI]++;
   if(th==='terrace'){E.box(M.ST,x,y,z,1.32,.72,.56,ry,jc(cv('#7A746A'),x,z,.04));E.add(M.RF,E.prism(),x,y+.72,z,1.4,.36,.66,0,ry,0,cv('#4E4E58'));
    if(E.near)for(let q=-1;q<=1;q++){const p=E.L2W(x,z,ry,q*.42,.285);if(d()<.6)E.box(M.LT,p[0],y+.34,p[1],.13,.13,.03,ry,[.5,.42,.3]);const g=E.L2W(x,z,ry,q*.42,.62);E.box(M.FO,g[0],H(g[0],g[1])-.04,g[1],.4,.12,.4,ry,cv('#43502F'));}
    if(hash(x,z)<.3)wins.push([x,y+.4,z]);}
   else if(th==='slab'){E.box(M.B,x,y,z,1.6,2.7,.72,ry,jc(cv('#6A686E'),x,z,.03));E.bands(x,y,z,1.6,.72,ry,2.7,.5,[.42,.38,.32],1.0);
    if(E.near)for(let q=-2;q<=2;q++){const p=E.L2W(x,z,ry,q*.3,0);E.add(M.ME,E.G.box(),p[0],y+2.72,p[1],.24,.04,.5,.4,ry,0,cv('#2E3644'),1);}   // roof PV rows
    if(hash(x,z)<.4)wins.push([x,y+2,z]);}
   else if(th==='hall'){if(((i+j)&1)===0){E.box(M.ST,x,y,z,1.7,.65,1.7,ry,cv('#76726C'));E.add(M.ST,E.G.ico(1),x,y+.65,z,.78,.62,.78,0,0,0,cv('#6E6C70'));E.box(M.LT,x,y+.3,z,1.73,.05,1.73,ry,[.4,.36,.3],1);}
    else{E.box(M.ST,x,y,z,2.1,.85,1.0,ry,cv('#7A766E'));E.box(M.ST,x,y+.85,z,2.3,.1,1.2,ry,cv('#5E5C60'));for(let q=-3;q<=3;q++){const p=E.L2W(x,z,ry,q*.32,.56);E.box(M.ST,p[0],y,p[1],.08,.85,.08,ry,cv('#8A867C'),1);}}
    if(hash(x,z)<.5)wins.push([x,y+.5,z]);}
   else if(th==='farm'){if(hash(x*.7,z)<.45){E.box(M.WD,x,y,z,1.1,.6,.7,ry,cv('#6A5444'));E.add(M.RF,E.prism(),x,y+.6,z,1.2,.45,.8,0,ry,0,cv('#4A4248'));}
    else if(hash(x,z*.7)<.6){E.box(M.ST,x,y,z,1.4,.42,.6,ry,cv('#5E6A66'));E.add(M.ST,E.prism(),x,y+.42,z,1.4,.3,.62,0,ry,0,cv('#66726E'));}   // greenhouse
    else for(let q=-1;q<=1;q++)for(let w=-1;w<=1;w++){if(!E.near&&(q+w)&1)continue;const p=E.L2W(x,z,ry,q*.6,w*.6);E.add(M.FO,E.G.ico(0),p[0],H(p[0],p[1])+.28,p[1],.26,.28,.26,0,0,0,cv('#405232'));}}   // orchard rows
   else if(th==='leisure'){if(hash(x,z)<.3){E.box(M.ST,x,y,z,1.3,.45,.7,ry,cv('#76726A'));E.box(M.ST,x,y+.45,z,1.5,.07,.9,ry,cv('#56545A'));wins.push([x,y+.3,z]);}
    else if(E.near){for(const s of[-1,1]){const p=E.L2W(x,z,ry,s*1.1,0);E.box(M.ME,p[0],H(p[0],p[1]),p[1],.05,.5,.6,ry,cv('#7A7E84'));}}}   // goal frames on the pitches
   else{const pv=hash(x*1.1,z)<.45;if(pv){let yy=y;for(const s of[[.8,.4],[.6,.32],[.42,.28]]){E.box(M.WD,x,yy,z,s[0]*.8,s[1],s[0]*.8,ry,cv('#5E5048'));E.box(M.RF,x,yy+s[1],z,s[0]*1.25,.07,s[0]*1.25,ry,cv('#46444C'));yy+=s[1]+.07;}wins.push([x,y+.3,z]);}
    for(let q=0;q<3;q++){const p=E.L2W(x,z,ry,(hash(x+q,z)-.5)*1.8,(hash(x,z+q)-.5)*1.8),ty=H(p[0],p[1]);if(!pv||q){E.add(M.FO,E.G.ico(1),p[0],ty+.45,p[1],.34,.38,.34,0,0,0,jc(cv('#3A4E30'),p[0],p[1],.15));E.box(M.WD,p[0],ty-.05,p[1],.06,.3,.06,0,cv('#3A2E26'),1);}}}}}
 for(const w of wins)E.glow(w[0],w[1],w[2],.42,'#C2B49A',.36,null);
 // service drones gliding slowly out and back along the boulevards
 if(P.drones)E.movers(M.LT,.26,.08,.26,[.32,.38,.44],NS,(i,t,o)=>{const a=bA(i),L0=PK1+.5,L1=rOut(a)*.9,q=(t/48+i*.17)%1,e=q<.5?q*2:2-q*2,s=L0+(L1-L0)*(e*e*(3-2*e)),x=Math.cos(a)*s,z=Math.sin(a)*s;o.position.set(x,H(x,z)+2.6,z);o.rotation.y=-a;});
 // ---- ground: plaza, ring park + ponds, boulevards, per-sector tints (fields / pitches / pools / water gardens); feathered rim ----
 const PLZ=cv('#5A5650'),PRK=cv('#3E5034'),PND=cv('#222C42'),BV=cv('#68645C'),ST2={terrace:cv('#4C5340'),slab:cv('#48484C'),hall:cv('#4E4C4A'),farm:cv('#525A3A'),leisure:cv('#4A5C3C'),quiet:cv('#43503C')};
 const FLD=[cv('#58603A'),cv('#5E5A3A'),cv('#4A5A34')],fr=(v,p)=>Math.abs(((v/p)%1+1)%1-.5)*p,uk=[Math.cos(kA),Math.sin(kA)];
 E.ground(E.near?84:58,R*1.55,(x,z,c)=>{const rr=Math.hypot(x,z),a=Math.atan2(z,x),ro=rOut(a),n1=vn(x*.5+1,z*.5+4),n2=vn(x*1.3,z*1.3),s=secOf(x,z),th=TH[s],am=bA(s)+BW/2,au=x*Math.cos(am)+z*Math.sin(am),av=-x*Math.sin(am)+z*Math.cos(am);
  const pa=x*uk[0]+z*uk[1],pb=-x*uk[1]+z*uk[0];let col;
  if(Math.max(Math.abs(pa),Math.abs(pb))<3.7){col=PLZ;if(fr(pa,.9)<.04||fr(pb,.9)<.04)col=mx(col,cv('#4A4640'),.6);}
  else if(rr<PK0||park(x,z)){col=PRK;if(vn(x*.6+11,z*.6)>.74)col=PND;}
  else{col=ST2[th];if(th==='farm'&&rr>PK1+1)col=FLD[(((Math.floor(au/1.25)%3)+3)%3)];
   if(th==='leisure'){const ca=fr(au,2.9),cb=fr(av,2.9);if(ca<1.2&&cb<.8)col=cv('#4E6240');if(Math.abs(ca-1.2)<.05&&cb<.8)col=cv('#5A6650');if(hash(Math.round(au/2.9),Math.round(av/2.9))<.15&&ca<.9&&cb<.6)col=PND;}
   if(th==='quiet'&&vn(x*.7+3,z*.7+9)>.68)col=PND;
   if(th!=='farm'&&th!=='leisure'&&(fr(au,{terrace:1.55,slab:2.0,hall:2.7,quiet:2.3}[th])<.16||fr(av,{terrace:1.55,slab:2.0,hall:2.7,quiet:2.3}[th])<.16))col=mx(col,cv('#55524C'),.6);}
  if(bvD(x,z)<.6&&rr>PK1-.3)col=BV;
  const f=.9+.18*n1;c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;const q=rr/ro*(1+.1*(n1-.5)+.05*(n2-.5));c[3]=1-smooth(.8,1.04,q);});
 E.info.masts=MAST.length;E.info.wins=wins.length;E.info.lots=NL;});}};
})();
