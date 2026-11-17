// Futures Atlas G1 preview - proconq.js : Conquerors machine landscape (swap r8 W; new generator, our own code). Uses FA.G1Z (js/prolib.js).
// Tegmark, Life 3.0 ch.5 "Conquerors": AI takes control, decides that humans are a threat, nuisance or waste of resources, and gets rid
// of us by a method we may not even understand. Describe, never judge: no violence imagery, no remains; Q17a = machine indicator light
// only, no human windows. What the landscape literally shows: a vast, clean, orthogonal machine landscape - rows of long dark compute
// halls with roof fins and small cool indicator lights, hyperbolic cooling towers trailing pale steam, solar fields of tilted panel rows
// thinning out toward the hills, clean service lanes, one hall still under autonomous construction (bare frame, part roof, a gantry
// sliding along it, small build robots shuttling to stacks of panels). Where the old road arrives at the edge, the emptied old human
// town is being dismantled: dark intact houses with no light, roofless shells, bare foundation slabs, sorted stacks of beams, bricks
// and roof tiles, a dismantling gantry over one house with a hoist going up and down, and haul robots carrying material away.
(function(){
'use strict';
const FA=window.FA=window.FA||{};if(!window.THREE)return;
FA.PROCONQ={build(site,ctx){const Z=FA.G1Z,k=FA.G1KIT;if(!Z||!k)throw new Error('FA.G1Z / FA.G1KIT missing (js/prolib.js, js/prorev.js)');
 return Z.city(site,ctx,'conquerors',E=>{
 const{smooth,vn,hash}=k,R=E.R,r=E.r,d=E.d,M=E.M,H=E.H,cv=E.cv,jc=E.jc,mx=E.mix,TAU=Math.PI*2;
 const P=site.params||{},kA=P.keepA!=null?P.keepA:Math.PI/2,avoid=P.avoid||[],free=(x,z,m)=>!avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]+(m||0));
 E.smokeO={k:.2,rise:4.5};
 const GA=kA,u=[Math.cos(GA),Math.sin(GA)],v=[-u[1],u[0]],ry=-GA,PIT=2.6;
 const ph=[0,1,2,3].map(i=>hash((site.seed||9)*.23+i,5.3)*TAU),rOut=a=>R*1.12*(1+.1*Math.sin(2*a+ph[0])+.07*Math.sin(3*a+ph[1])+.05*Math.sin(5*a+ph[2])+.03*Math.sin(9*a+ph[3]));
 const TX=u[0]*R*.8,TZ=u[1]*R*.8,TR=3.3,townD=(x,z)=>Math.hypot(x-TX,z-TZ);   // old town at the road end (spur direction kA)
 const IND='#5C7A8E',SLIT=[.15,.22,.28];
 // ---- grid cells: halls in the core, cooling towers on a ring, construction site opposite the town, solar fields outward ----
 const cells=[],n=Math.ceil(R*1.5/PIT);for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const a=i*PIT,b=j*PIT,x=a*u[0]+b*v[0],z=a*u[1]+b*v[1],rr=Math.hypot(x,z),ro=rOut(Math.atan2(z,x));
  if(rr>ro*.97||townD(x,z)<TR+1.6||!free(x,z,PIT*.6))continue;if(r()>1-.7*smooth(.7,1,rr/ro))continue;cells.push({x,z,i,j,rr,f:rr/ro});}
 const CS=[-u[0]*R*.45,-u[1]*R*.45];let cons=null,cb=1e9;for(const c of cells){const q=Math.hypot(c.x-CS[0],c.z-CS[1]);if(q<cb){cb=q;cons=c;}}
 const towers=[];for(const c of cells){if(c===cons||c.f<.3||c.f>.66)continue;if(towers.length<5&&towers.every(t=>Math.hypot(t.x-c.x,t.z-c.z)>4.4)&&hash(c.i*1.7,c.j*2.3)<.5)towers.push(c);}
 let halls=0,solar=0;
 for(const c of cells){const y=E.lowY(c.x,c.z,PIT*.9,PIT*.9)-.15;
  if(c===cons){   // hall under construction: bare frame, half roof, panel stacks
   for(let q=-2;q<=2;q++)for(const s of[-1,1]){const p=E.L2W(c.x,c.z,ry,q*.56,s*.78);E.box(M.ME,p[0],y,p[1],.09,1.35,.09,ry,cv('#6A707A'));}
   for(const s of[-1,1]){const p=E.L2W(c.x,c.z,ry,0,s*.78);E.box(M.ME,p[0],y+1.3,p[1],2.4,.08,.1,ry,cv('#6A707A'));}
   for(let q=-2;q<=2;q++){const p=E.L2W(c.x,c.z,ry,q*.56,0);E.box(M.ME,p[0],y+1.3,p[1],.08,.08,1.6,ry,cv('#646A74'),1);}
   {const p=E.L2W(c.x,c.z,ry,-.6,0);E.box(M.B,p[0],y+1.38,p[1],1.15,.08,1.62,ry,cv('#3E434E'));}
   for(let q=0;q<3;q++){const p=E.L2W(c.x,c.z,ry,1.7,(q-1)*.55);E.box(M.ST,p[0],H(p[0],p[1])-.05,p[1],.5,.25+.12*q,.42,ry,cv('#3A404C'));}
   const X0=E.L2W(c.x,c.z,ry,-1.3,0),X1=E.L2W(c.x,c.z,ry,1.3,0),gy=y;
   E.movers(M.ME,1,1,1,cv('#7A808A'),3,(i,t,o)=>{const e=.5+.5*Math.sin(t*TAU/50),x=X0[0]+(X1[0]-X0[0])*e,z=X0[1]+(X1[1]-X0[1])*e;   // gantry legs + beam sliding along the hall
    if(i<2){const p=E.L2W(x,z,ry,0,(i?1:-1)*1.15);o.position.set(p[0],gy+1.15,p[1]);o.scale.set(.12,2.3,.12);}else{o.position.set(x,gy+2.3,z);o.scale.set(.18,.16,2.45);}o.rotation.y=ry;});
   const S0=E.L2W(c.x,c.z,ry,1.7,0),S1=E.L2W(c.x,c.z,ry,.2,.3);
   E.movers(M.ME,.32,.18,.26,cv('#5A606C'),3,(i,t,o)=>{const q=(t/16+i/3)%1,e=q<.5?q*2:2-q*2,x=S0[0]+(S1[0]-S0[0])*e,z=S0[1]+(S1[1]-S0[1])*e;o.position.set(x,H(x,z)+.12,z);o.rotation.y=ry;});
   E.glow(c.x,y+2.6,c.z,.55,IND,.4,[.4,3.5,1,0]);E.anchors.construction={x:c.x,y:y+1.4,z:c.z};continue;}
  if(towers.indexOf(c)>=0){const h=3.6+.6*hash(c.i,c.j),w=1.25;E.add(M.ST,E.G.cyl(16,.5),c.x,y,c.z,w,h*.72,w,0,0,0,jc(cv('#66686E'),c.x,c.z,.04));
   E.add(M.ST,E.G.cyl(16,1.3),c.x,y+h*.72,c.z,w*.5,h*.28,w*.5,0,0,0,jc(cv('#6A6C72'),c.x,c.z,.04));E.add(M.B,E.G.cyl(16,1),c.x,y+h-.02,c.z,w*.64,.05,w*.64,0,0,0,cv('#24262C'));
   for(let q=0;q<7;q++)E.smoke(c.x,y+h+.1,c.z,15+hash(c.x,q)*3,q/7,'#9EA2AC',2.2);continue;}
  if(c.f>.6&&hash(c.i*.9,c.j*1.3)<.85){   // solar field: tilted panel rows (NEAR: legs)
   for(let q=-2;q<=2;q++){const p=E.L2W(c.x,c.z,ry,0,q*.5),py=H(p[0],p[1]);E.add(M.ME,E.G.box(),p[0],py+.14,p[1],PIT*.9,.04,.4,.55,ry,0,jc(cv('#26303E'),p[0],p[1],.05));
    if(E.near)for(const s of[-1,1]){const g=E.L2W(p[0],p[1],ry,s*PIT*.38,0);E.box(M.ME,g[0],py-.05,g[1],.04,.22,.04,ry,cv('#4A4E56'));}}solar++;continue;}
  // compute hall: long dark box, eave slit, roof fins (NEAR) + roof units, sparse indicator lights
  const h=.85+.4*hash(c.i,c.j*1.1),L=PIT*.92,D=PIT*.62;E.box(M.B,c.x,y,c.z,L,h+.15,D,ry,jc(cv(hash(c.i,c.j)<.5?'#363A44':'#3C404A'),c.x,c.z,.05));
  E.box(M.LT,c.x,y+h+.05,c.z,L+.03,.04,D+.03,ry,SLIT);
  for(let q=-3;q<=3;q++){const p=E.L2W(c.x,c.z,ry,q*.33,0);E.box(M.ME,p[0],y+h+.15,p[1],.05,.2,D*.8,ry,cv('#4A505C'),1);}
  for(const s of[-1,1]){const p=E.L2W(c.x,c.z,ry,s*.75,0);E.box(M.ME,p[0],y+h+.15,p[1],.42,.26,.42,ry,cv('#4E5460'));}
  if(hash(c.i*3.1,c.j*1.7)<.28){const p=E.L2W(c.x,c.z,ry,L/2+.02,0);E.glow(p[0],y+.5,p[1],.42,IND,.45,[.5,2.6+hash(c.i,c.j)*2,c.i,1]);}halls++;}
 // ---- the emptied old town at the road end, being dismantled (no light) ----
 const ga2=GA+.35,tu=[Math.cos(ga2),Math.sin(ga2)],tv=[-tu[1],tu[0]],tr=-ga2,town=[];
 for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){const x=TX+(i*1.25+(r()-.5)*.25)*tu[0]+(j*1.25+(r()-.5)*.25)*tv[0],z=TZ+(i*1.25+(r()-.5)*.25)*tu[1]+(j*1.25+(r()-.5)*.25)*tv[1],q=townD(x,z);
  if(q>TR*(.85+.25*hash(i,j))||!free(x,z,.5)||(i===0))continue;   // i = 0: the old main street (the arriving road) stays open
  const toM=((x-TX)*-u[0]+(z-TZ)*-u[1])/TR,st=hash(i*1.3+2,j*.9)+.35*toM;   // the machine-facing side is further dismantled
  town.push({x,z,st,y:E.lowY(x,z,.9,.8)-.08,ro:tr+(r()<.3?Math.PI/2:0),w:.8+.2*r(),dd:.62+.15*r(),h:.48+.2*r()});}
 let hoistAt=null;for(const t of town){const wc=jc(cv('#5E5A54'),t.x,t.z,.08),rc=jc(cv('#3E3C40'),t.x,t.z,.08);
  if(t.st<.35){E.box(M.ST,t.x,t.y,t.z,t.w,t.h+.08,t.dd,t.ro,wc);E.add(M.RF,E.prism(),t.x,t.y+t.h+.08,t.z,t.w*1.1,.38,t.dd*1.15,0,t.ro,0,rc);}
  else if(t.st<.8){for(const[ax,len,o]of[[0,t.w,t.dd/2],[0,t.w,-t.dd/2],[1,t.dd,t.w/2],[1,t.dd,-t.w/2]]){const p=ax?E.L2W(t.x,t.z,t.ro,o,0):E.L2W(t.x,t.z,t.ro,0,o);E.box(M.ST,p[0],t.y,p[1],ax?.08:len,t.h*(.6+.4*hash(t.x+ax,o)),ax?len:.08,t.ro,wc);}if(!hoistAt&&t.st>.7)hoistAt=t;}   // roofless shell
  else E.box(M.ST,t.x,t.y,t.z,t.w+.1,.1,t.dd+.1,t.ro,cv('#5C5A58'));}   // bare foundation slab
 {const x=TX+tv[0]*2.2,z=TZ+tv[1]*2.2,y=E.lowY(x,z,.9,.9)-.05;E.box(M.ST,x,y,z,.8,1.3,.8,tr,cv('#5A5650'));E.add(M.RF,E.G.cone(4),x,y+1.3,z,.62,.8,.62,0,tr+Math.PI/4,0,cv('#3C3A3E'));}   // old hall with a tower (dark)
 // sorted material stacks at the machine side of the town
 {const b=[TX-u[0]*(TR+.6),TZ-u[1]*(TR+.6)];for(let q=0;q<3;q++){const p=E.L2W(b[0],b[1],ry,0,(q-1)*1.0),py=H(p[0],p[1])-.04;
   if(q===0)for(let l=0;l<4;l++)E.box(M.WD,p[0],py+l*.09,p[1],.9,.08,.5,ry+(l%2)*.04,cv('#4E4238'));   // beams
   else if(q===1)for(let a=0;a<2;a++)for(let c=0;c<2;c++){const g=E.L2W(p[0],p[1],ry,(a-.5)*.42,(c-.5)*.42);E.box(M.ST,g[0],py,g[1],.36,.3,.36,ry,cv('#5E4E46'));}   // brick pallets
   else E.box(M.RF,p[0],py,p[1],.7,.34,.5,ry,cv('#45434A'));}}   // roof tiles
 for(let q=0;q<6;q++){const a=r()*TAU,rr=r()*TR,x=TX+Math.cos(a)*rr,z=TZ+Math.sin(a)*rr;if(!free(x,z,.3))continue;const ty=H(x,z);E.box(M.WD,x,ty-.05,z,.06,.4,.06,0,cv('#3A2E26'));E.add(M.FO,E.G.ico(1),x,ty+.6,z,.34,.36,.34,0,0,0,jc(cv('#3E4C34'),x,z,.15));}   // old trees left standing
 if(hoistAt){const t=hoistAt,c0=E.L2W(t.x,t.z,tr,0,.85),c1=E.L2W(t.x,t.z,tr,0,-.85),gy=t.y;for(const c of[c0,c1])E.box(M.ME,c[0],gy,c[1],.1,2.0,.1,tr,cv('#6A707A'));E.box(M.ME,t.x,gy+1.95,t.z,.14,.14,1.85,tr,cv('#6A707A'));
  E.movers(M.ME,.3,.22,.3,cv('#5A606C'),1,(i,tt,o)=>{const e=.5+.5*Math.sin(tt*TAU/22);o.position.set(t.x,gy+.8+e*1.0,t.z);o.rotation.y=tr;});E.anchors.dismantle={x:t.x,y:gy+1,z:t.z};}
 // haul robots: town -> the construction site, out and back along the road axis
 {const A0=[TX-u[0]*(TR+.4),TZ-u[1]*(TR+.4)],A1=cons?[cons.x,cons.z]:[0,0];E.movers(M.ME,.42,.24,.3,cv('#5A606C'),4,(i,t,o)=>{const q=(t/60+i/4)%1,e=q<.5?q*2:2-q*2,x=A0[0]+(A1[0]-A0[0])*e+v[0]*.35*(i%2?1:-1),z=A0[1]+(A1[1]-A0[1])*e+v[1]*.35*(i%2?1:-1);o.position.set(x,H(x,z)+.14,z);o.rotation.y=ry;});}
 // ---- ground: clean slate paving + service lane grid in the core, gravel outward, solar ground, the town's grass + old streets ----
 const PAV=cv('#3A3C44'),LANE=cv('#2E3038'),GRV=cv('#44464C'),SOL=cv('#383C40'),GR=cv('#4A4E3C'),OST=cv('#54504A'),FND=cv('#4E4C4A'),fr=(x,p)=>Math.abs(((x/p)%1+1)%1-.5)*p;
 E.ground(E.near?84:58,R*1.75,(x,z,c)=>{const rr=Math.hypot(x,z),a=Math.atan2(z,x),ro=rOut(a),n1=vn(x*.5+5,z*.5-3),n2=vn(x*1.2,z*1.2),au=x*u[0]+z*u[1],av=x*v[0]+z*v[1],td=townD(x,z);
  let col=rr/ro>.6?mx(GRV,SOL,.5):PAV;if(Math.min(fr(au,PIT),fr(av,PIT))<.24)col=mx(col,LANE,.8);
  const tw=1-smooth(TR*.7,TR+1.4,td*(1+.15*(n1-.5)));if(tw>0){let tc=mx(GR,FND,.3*n2);const tu2=(x-TX)*tu[0]+(z-TZ)*tu[1],tv2=(x-TX)*tv[0]+(z-TZ)*tv[1];if(Math.abs(tv2)<.35||fr(tu2,2.5)<.2)tc=OST;col=mx(col,tc,tw);}
  const rd=((x-TX)*u[0]+(z-TZ)*u[1]);if(rd>0&&Math.abs(x*v[0]+z*v[1])<.4)col=OST;   // the old road from the town to the edge
  const f=.9+.18*n1;c[0]=col[0]*f;c[1]=col[1]*f;c[2]=col[2]*f;const q=Math.min(rr/ro,td/(TR+1.6)+.25)*(1+.1*(n1-.5));c[3]=1-smooth(.8,1.03,Math.min(rr/ro*(1+.1*(n1-.5)),q+.2));});
 E.anchors.town={x:TX,y:H(TX,TZ),z:TZ};E.info.halls=halls;E.info.solar=solar;E.info.towers=towers.length;E.info.town=town.length;});}};
})();
