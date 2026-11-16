// Futures Atlas v4.5 PILOT - proenslaved.js : site generator for 'enslaved' (Enslaved God, Tegmark Life 3.0 ch. 5).
// Ending text (src_v44/fa4_data.js): "A superintelligent AI is confined by its human controllers, who use it to produce technology
// and wealth beyond imagination; whether that is good or bad depends entirely on who the controllers are."
// Layout restores the live v4.4 two-camp reading (fa4_scenes.js enslaved(): Bloc A and Bloc B citadels at X -/+ TWIN, each with a
// caged obedient AI core, a walled ridge of mutual deterrence between them) as a contemporary militarised-industrial miniature:
//  - plan frame: x across the divide (Bloc A at x<0, cool slate; Bloc B at x>0, warm sand), z along it; site.rot applied by an
//    inner group (far geoms baked), the engine only translates (parallel_contract_v2.md).
//  - divide = no-man's strip (gravel band, two fence lines, dragon's-teeth rows, a central wall line with watchtowers).
//  - each bloc: its own town massing (A: rectilinear slab grid; B: rotated grid of courtyard blocks + sawtooth halls), a facing
//    defence belt (berm, bunkers, launcher pads, radar), a patrol road, and the contained AI compute core = sealed windowless vault
//    inside a cage, inner fence, polygonal wall with guard towers, no gate (skybridge from the controllers' ops tower only),
//    power line in from the plant (cooling towers) and an output line to the logistics yard (containers, gantry crane).
// Close-up cues (from the ending text): sealed vault + cage, guard ring, controllers' tower, power in / output out, two facing blocs.
// Describes, does not judge: identical treatment of both blocs, no country names, no flag colours, uniform warm window light (Q17a).
// Materials: only the engine families (ctx.mats: building, metal, light, foliage) + a feathered ground material with the SAME
// parameters as protown's pt_ground_feather, so no new shader programs are compiled on the lazy build (programs are warmed at boot).
// Animated parts (radars, patrol vehicles, power/output beads) are plain non-instanced meshes whose vertices are rewritten in anim().
// Standalone: defines only FA.PROENSLAVED; no camera / DOM / engine globals. Classic script, ES2017. Apache-2.0. Independently written.
(function(){
'use strict';
const root=typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:{});
root.FA=root.FA||{};
const TAU=Math.PI*2,PI=Math.PI,ST=.32;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const ss=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
const now=()=>(root.performance&&root.performance.now)?root.performance.now():Date.now();
function perr(m){try{(root.__errs=root.__errs||[]).push('proenslaved: '+m);}catch(e){}}
function safe(n,f){try{return f();}catch(e){perr(n+': '+(e&&e.message?e.message:e));return null;}}
function mulberry32(a){a=a>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function hash2(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
const HEXC={};
function hex(h,k){let c=HEXC[h];if(!c){const n=parseInt(h.slice(1),16),f=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  c=HEXC[h]=[f(n>>16&255),f(n>>8&255),f(n&255)];}k=k==null?1:k;return[c[0]*k,c[1]*k,c[2]*k];}
const tone=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];

// ---- palettes: neutral contrasting tones, identical structure for both blocs ----
const BLOC={
 A:{name:'Bloc A',walls:['#5F6F82','#6E7E91','#56657A','#7C8A9C','#65758A'],roof:'#3E4855',roof2:'#4A5564',ground:'#535B66',ind:'#566476',
  cont:['#5E6E7E','#77838F','#4E5C6A','#8A949E','#6A7480'],veh:'#55616B',core:'#8FD8EE',grid:{blk:1.5,ry:0,sw:.3}},
 B:{name:'Bloc B',walls:['#B89C74','#C8AE86','#A88C66','#D2BA92','#BEA078'],roof:'#7A6248','roof2':'#8A7052',ground:'#776A55',ind:'#9A8262',
  cont:['#9C8466','#B29A78','#86705A','#C0AC8C','#A48C6C'],veh:'#7A6A54',core:'#E2A6E6',grid:{blk:1.32,ry:.23,sw:.28}}};
const PAL={strip:'#7A776E',gravel:'#8C887D',asph:'#34363B',kerb:'#8E8A82',earth:'#5D5444',concrete:'#8E8A84',concL:'#A39F97',dark:'#2E3136',
 steel:'#7C8086',warm:'#FFC890',glassD:'#2A3038',vault:'#4C5158',cable:'#22252A',foliage:'#3E5238',trunk:'#5A4A3A',cool:'#DCE8F2'};

// ======================= site context =======================
function mkSite(site,ctx){site=site||{};ctx=ctx||{};const THREE=ctx.THREE||root.THREE;
 const R=site.radius>0?+site.radius:15.8,rot=+site.rot||0,cr=Math.cos(rot),sr=Math.sin(rot),sx=+site.x||0,sz=+site.z||0;
 const hA=typeof ctx.heightAt==='function'?ctx.heightAt:null;let y0=0;
 if(hA){y0=site.y!=null?+site.y:+hA(sx,sz);if(!isFinite(y0))y0=0;}
 const seed=(site.seed==null?1:site.seed)>>>0,rnd=mulberry32(seed^0x5E1A7ED);
 const T={THREE,site,ctx,R,rot,seed,rnd,mood:site.mood==='day'?'day':'blue',q:({low:.5,mid:.75,high:1})[site.q]||1,
  toLocal:(x,z)=>[x*cr+z*sr,-x*sr+z*cr],
  yl:hA?function(x,z){const v=hA(sx+x*cr+z*sr,sz-x*sr+z*cr)-y0;return isFinite(v)?v:0;}:function(){return 0;}};
 T.A=T.mood==='day'?1:.84;T.day=T.mood==='day';
 // two-lobe, noise-warped boundary (wider across the divide than along it): never a round plate
 const q1=hash2(seed*.131,1.7)*TAU,q2=hash2(seed*.317,4.1)*TAU,q3=hash2(seed*.513,8.3)*TAU;
 T.rb=a=>clamp(R*(.80+.16*Math.pow(Math.abs(Math.cos(a)),1.5)+.05*Math.sin(3*a+q1)+.035*Math.sin(5*a+q2)+.02*Math.sin(7*a+q3)),R*.62,R*.99);
 T.bAt=(x,z)=>T.rb(Math.atan2(z,x));
 T.fa=(x,z)=>{const r=Math.hypot(x,z),b=T.bAt(x,z);return 1-ss(b*.84,b*1.03,r);};
 T.hw=R*.07;   // half width of the no-man's strip
 return T;}

// ======================= geometry emit (non-indexed soup: position, normal, colour [+ alpha]) =======================
function buf(af){return{p:[],n:[],c:[],af:af||null,a:af?[]:null};}
const nT=b=>b.p.length/9;
function tri(b,p0,p1,p2,col){const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2];
 let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz);if(!(l>1e-12))return;nx/=l;ny/=l;nz/=l;
 if(b.af)b.a.push(b.af(p0[0],p0[2]),b.af(p1[0],p1[2]),b.af(p2[0],p2[2]));
 b.p.push(p0[0],p0[1],p0[2],p1[0],p1[1],p1[2],p2[0],p2[1],p2[2]);
 for(let i=0;i<3;i++){b.n.push(nx,ny,nz);b.c.push(col[0],col[1],col[2]);}}
function quad(b,p0,p1,p2,p3,col){tri(b,p0,p1,p2,col);tri(b,p0,p2,p3,col);}
function quadUp(b,p0,p1,p2,p3,col){const ux=p1[0]-p0[0],uz=p1[2]-p0[2],vx=p3[0]-p0[0],vz=p3[2]-p0[2];
 if(uz*vx-ux*vz>=0)quad(b,p0,p1,p2,p3,col);else quad(b,p0,p3,p2,p1,col);}
function triUp(b,p0,p1,p2,col){const ux=p1[0]-p0[0],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vz=p2[2]-p0[2];
 if(uz*vx-ux*vz>=0)tri(b,p0,p1,p2,col);else tri(b,p0,p2,p1,col);}
function wall(b,ax,az,bx,bz,y0,y1,col){quad(b,[ax,y0,az],[bx,y0,bz],[bx,y1,bz],[ax,y1,az],col);}
function rectPts(x,z,w,d,ry){const hx=w/2,hz=d/2,c=Math.cos(ry||0),s=Math.sin(ry||0),o=[[hx,-hz],[-hx,-hz],[-hx,hz],[hx,hz]];
 for(let i=0;i<4;i++){const lx=o[i][0],lz=o[i][1];o[i]=[x+lx*c+lz*s,z-lx*s+lz*c];}return o;}
// regular polygon in the same winding as rectPts (decreasing angle)
function polyPts(x,z,r,n,a0){const o=[];for(let i=0;i<n;i++){const a=(a0||0)-i*TAU/n;o.push([x+Math.cos(a)*r,z+Math.sin(a)*r]);}return o;}
function prism(b,pts,y0,y1,col,top){const n=pts.length;for(let i=0;i<n;i++){const a=pts[i],c=pts[(i+1)%n];wall(b,a[0],a[1],c[0],c[1],y0,y1,col);}
 if(top!==false){const tc=top||col;for(let i=1;i<n-1;i++)tri(b,[pts[0][0],y1,pts[0][1]],[pts[i][0],y1,pts[i][1]],[pts[i+1][0],y1,pts[i+1][1]],tc);}}
function box(b,x,y0,z,w,h,d,ry,col,top){prism(b,rectPts(x,z,w,d,ry),y0,y0+h,col,top);}
function cyl(b,x,y0,z,r0,r1,h,n,col,cap){const y1=y0+h;
 for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
  quad(b,[x+c1*r0,y0,z+s1*r0],[x+c0*r0,y0,z+s0*r0],[x+c0*r1,y1,z+s0*r1],[x+c1*r1,y1,z+s1*r1],col);
  if(cap&&r1>0)tri(b,[x,y1,z],[x+c1*r1,y1,z+s1*r1],[x+c0*r1,y1,z+s0*r1],cap===true?col:cap);}}
function cylIn(b,x,y0,z,r0,r1,h,n,col){const y1=y0+h;   // inner surface (seen from inside: open cooling-tower shells)
 for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
  quad(b,[x+c0*r0,y0,z+s0*r0],[x+c1*r0,y0,z+s1*r0],[x+c1*r1,y1,z+s1*r1],[x+c0*r1,y1,z+s0*r1],col);}}
function strut(b,a,e,r,col){let dx=e[0]-a[0],dy=e[1]-a[1],dz=e[2]-a[2];const L=Math.hypot(dx,dy,dz);if(L<1e-5)return;dx/=L;dy/=L;dz/=L;
 let ux,uy,uz;if(Math.abs(dy)<.9){ux=-dz;uy=0;uz=dx;}else{ux=1;uy=0;uz=0;}
 const k=ux*dx+uy*dy+uz*dz;ux-=dx*k;uy-=dy*k;uz-=dz*k;const ul=Math.hypot(ux,uy,uz)||1;ux/=ul;uy/=ul;uz/=ul;
 const vx=dy*uz-dz*uy,vy=dz*ux-dx*uz,vz=dx*uy-dy*ux,o=[];
 for(let i=0;i<3;i++){const t=i*TAU/3,c=Math.cos(t)*r,s=Math.sin(t)*r;o.push([ux*c+vx*s,uy*c+vy*s,uz*c+vz*s]);}
 for(let i=0;i<3;i++){const p=o[i],q=o[(i+1)%3];
  quad(b,[a[0]+p[0],a[1]+p[1],a[2]+p[2]],[a[0]+q[0],a[1]+q[1],a[2]+q[2]],[e[0]+q[0],e[1]+q[1],e[2]+q[2]],[e[0]+p[0],e[1]+p[1],e[2]+p[2]],col);}}
function cum(pts){const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return c;}
function polyAt(pts,c,t){let i=1;while(i<pts.length-1&&c[i]<t)i++;const a=pts[i-1],e=pts[i],l=(c[i]-c[i-1])||1e-6,k=clamp((t-c[i-1])/l,0,1);
 return[a[0]+(e[0]-a[0])*k,a[1]+(e[1]-a[1])*k,(e[0]-a[0])/l,(e[1]-a[1])/l];}
function resample(pts,step){const c=cum(pts),L=c[c.length-1],n=Math.max(1,Math.ceil(L/step)),o=[];for(let i=0;i<=n;i++)o.push(polyAt(pts,c,L*i/n));return o;}
function ribbon(b,T,pts,w,col,lift,step){const rs=resample(pts,step||.7),h=w/2;let pl=null,pr=null;lift=lift==null?.02:lift;
 for(let i=0;i<rs.length;i++){const s=rs[i],nx=-s[3],nz=s[2],lx=s[0]+nx*h,lz=s[1]+nz*h,rx=s[0]-nx*h,rz=s[1]-nz*h;
  const l=[lx,T.yl(lx,lz)+lift,lz],r=[rx,T.yl(rx,rz)+lift,rz];if(pl)quadUp(b,pl,pr,r,l,col);pl=l;pr=r;}}
function disc(b,T,x,z,r,nr,ns,col,lift){const P3=(rad,a)=>{const px=x+Math.cos(a)*rad,pz=z+Math.sin(a)*rad;return[px,T.yl(px,pz)+lift,pz];};
 for(let i=0;i<nr;i++){const ra=r*i/nr,rb=r*(i+1)/nr;for(let j=0;j<ns;j++){const a0=j*TAU/ns,a1=(j+1)*TAU/ns;
  if(i===0)triUp(b,P3(0,0),P3(rb,a0),P3(rb,a1),col);else quadUp(b,P3(ra,a0),P3(rb,a0),P3(rb,a1),P3(ra,a1),col);}}}
function rectGrid(b,T,x,z,w,d,ry,nx,nz,col,lift){const c=Math.cos(ry||0),s=Math.sin(ry||0);
 const P3=(i,j)=>{const lx=(i/nx-.5)*w,lz=(j/nz-.5)*d,px=x+lx*c+lz*s,pz=z-lx*s+lz*c;return[px,T.yl(px,pz)+lift,pz];};
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)quadUp(b,P3(i,j),P3(i+1,j),P3(i+1,j+1),P3(i,j+1),col);}
function seat(T,pts){let lo=1e9,hi=-1e9,sx=0,sz=0;for(const p of pts){const y=T.yl(p[0],p[1]);if(y<lo)lo=y;if(y>hi)hi=y;sx+=p[0];sz+=p[1];}
 const yc=T.yl(sx/pts.length,sz/pts.length);return{lo:Math.min(lo,yc),hi:Math.max(hi,yc)};}

// ======================= layout =======================
function koHit(L,x,z,r){for(const k of L.ko)if(Math.hypot(x-k.x,z-k.z)<k.r+r)return true;return false;}
// pull a footprint centre inwards until its circle fits inside the warped boundary
function fit(T,x,z,r,k){for(let i=0;i<12;i++){const d=Math.hypot(x,z);if(d+r<=T.bAt(x,z)*(k||.9)||d<.5)break;x*=.94;z*=.94;}return[x,z];}
function blocRegion(T,s,x,z,m){return s*x>T.hw+2.1+(m||0)&&Math.hypot(x,z)<T.bAt(x,z)*.92;}
function* layoutGen(T){const R=T.R,rnd=T.rnd,hw=T.hw;
 const L={blocs:[],lots:[],streets:[],ko:[],solids:[],trees:[],lamps:[],lines:[],patrols:[],radars:[],labels:[]};
 const zs=[T.rb(PI/2),T.rb(-PI/2)];L.zWall=[-zs[1]*.92,zs[0]*.92];
 for(const s of[-1,1]){const P=s<0?BLOC.A:BLOC.B,K={s,P,key:s<0?'A':'B'};L.blocs.push(K);
  const cz0=(hash2(T.seed*.71,s*3.3)-.5)*R*.22,crr=R*.13;let c=fit(T,s*R*.5,cz0,crr+.8,.88);
  K.core={x:c[0],z:c[1],r:crr};L.ko.push({x:c[0],z:c[1],r:crr+.8,n:'core'+K.key});
  const sg=K.core.z>=0?1:-1;   // which z side the core leans to
  K.ops={x:K.core.x,z:K.core.z-sg*(crr+1.15),w:1.4,d:1.0,st:9};L.ko.push({x:K.ops.x,z:K.ops.z,r:1.0,n:'ops'+K.key});
  c=fit(T,s*R*.45,sg*R*.55,1.8,.9);K.plant={x:c[0],z:c[1],r:1.7};L.ko.push({x:c[0],z:c[1],r:1.8,n:'plant'+K.key});
  c=fit(T,s*R*.62,-sg*R*.5,1.8,.9);K.yard={x:c[0],z:c[1],r:1.7};L.ko.push({x:c[0],z:c[1],r:1.75,n:'yard'+K.key});
  K.belt=s*(hw+.95);K.patrol=s*(hw+1.85);
  // patrol road along the divide (clipped to the boundary)
  const pr=[];for(let z=-R;z<=R;z+=.5){const x=K.patrol;if(Math.hypot(x,z)<T.bAt(x,z)*.9)pr.push([x,z]);}
  if(pr.length>2){L.streets.push({pts:pr,w:.5,kind:'patrol',s});L.patrols.push({pts:pr,s});}
  // compound patrol ring inside the wall
  K.ring=polyPts(K.core.x,K.core.z,crr*.9,16,0).concat([[K.core.x+crr*.9,K.core.z]]);
  L.solids.push({n:'core'+K.key,x:K.core.x,z:K.core.z,r:crr},{n:'ops'+K.key,x:K.ops.x,z:K.ops.z,w:K.ops.w,d:K.ops.d,ry:0},
   {n:'plant'+K.key,x:K.plant.x,z:K.plant.z,r:K.plant.r},{n:'yard'+K.key,x:K.yard.x,z:K.yard.z,r:K.yard.r});
  L.labels.push({text:P.name,x:s*R*.52,z:K.core.z+sg*0});
  yield 1;}
 // town grids (own massing per bloc)
 for(const K of L.blocs){const s=K.s,G=K.P.grid,p=G.blk+G.sw,c=Math.cos(G.ry),sn=Math.sin(G.ry),ou=s*(hw+2.3),ov=hash2(T.seed,s)*p;
  const toP=(u,v)=>[u*c+v*sn,-u*sn+v*c];K.lots0=L.lots.length;
  for(let i=-1;i<=12;i++)for(let j=-9;j<=9;j++){const u=ou+s*(i+.5)*p,v=ov+(j+.5)*p,q=toP(u,v),x=q[0],z=q[1],r=Math.hypot(x,z),b=T.bAt(x,z);
   const D=(L.dbg=L.dbg||{ko:0,bd:0,thin:0,gr:0,cells:0});D.cells++;
   if(!(s*x>hw+2.2+p*.38)||r+p*.4>b*.98){D.bd++;continue;}if(koHit(L,x,z,p*.25)){D.ko++;continue;}
   const h=hash2(x*1.37+T.seed*.01,z*2.11);
   if(h>1-ss(b*.7,b*.97,r)*.98){D.thin++;if(r<b*.95&&rnd()<.75)L.trees.push({x,z,n:1+(rnd()*3|0),s:.8+rnd()*.4});continue;}   // thinning edge -> trees
   if(hash2(x*.3+3.1,z*.7)<.07){D.gr++;L.trees.push({x,z,n:4,s:1});continue;}   // small greens
   cellLots(T,L,K,x,z,G,h,r/b);if(L.lots.length>420)break;}
  // grid streets, clipped to the bloc region and stopped at the compounds
  for(const dir of[0,1])for(let k=-9;k<=13;k++){if(!dir&&k<-1)continue;const run=[];const flush=()=>{if(run.length>3)L.streets.push({pts:run.slice(),w:G.sw,kind:'road',s});run.length=0;};
   for(let t=-2*T.R;t<=2*T.R;t+=.5){const q=dir?toP(ou+t,ov+k*p):toP(ou+s*k*p,t),x=q[0],z=q[1];
    if(blocRegion(T,s,x,z,0)&&!koHit(L,x,z,.15))run.push([x,z]);else flush();}flush();}
  yield 1;}
 // lamps along the patrol roads, radars in the belts and on the ops towers
 for(const K of L.blocs){const s=K.s;for(let z=-T.R;z<=T.R;z+=1.7){const x=K.patrol+s*.38;if(Math.hypot(x,z)<T.bAt(x,z)*.86)L.lamps.push({x,z,s});}
  L.radars.push({x:K.belt+s*.2,z:(K.core.z>=0?-1:1)*T.R*.22,y:2.15,k:1,ph:hash2(s,T.seed)*TAU,w:.55*(s<0?1:-1)});
  L.radars.push({x:K.ops.x+.35,z:K.ops.z,y:K.ops.st*ST+.42,k:.8,ph:hash2(s*2,T.seed)*TAU,w:-.8});}
 return L;}
// lots inside one grid cell: A = slab pairs / point towers / small courts; B = courtyard rings / sawtooth halls / slabs
function cellLots(T,L,K,x,z,G,h,rr){const ry=G.ry,b=G.blk,A=K.key==='A',hh=hash2(h*91.7,x+z),k=hash2(x*3.7,z*1.9);
 const at=(lx,lz)=>[x+lx*Math.cos(ry)+lz*Math.sin(ry),z-lx*Math.sin(ry)+lz*Math.cos(ry)];
 const tall=1-.55*ss(.35,.95,rr);   // massing steps down towards the edge
 const add=(lx,lz,w,d,st,kind,yr)=>{const q=at(lx,lz),rad=Math.hypot(w,d)/2;if(Math.hypot(q[0],q[1])+rad>T.bAt(q[0],q[1])*.97||koHit(L,q[0],q[1],rad*.8))return;
  L.lots.push({x:q[0],z:q[1],w,d,ry:ry+(yr||0),st:Math.max(1,Math.round(st*(kind==='hall'?1:tall))),kind,bloc:K.key,seed:(hash2(q[0]*7.1,q[1]*3.3)*1e6)|0});};
 if(A){if(k<.58){const st=5+Math.round(hh*4);add(0,-b*.24,b*.9,b*.34,st,'slab');add(0,b*.24,b*.9,b*.34,st-1+Math.round(hh*2),'slab');}
  else if(k<.74){add(0,0,b*.52,b*.52,11+Math.round(hh*5),'tower');add(b*.3,b*.3,b*.3,b*.3,2,'annex');}
  else if(k<.86)add(0,0,b*.88,b*.7,2,'hall');
  else{for(const[a,c]of[[-1,-1],[1,-1],[-1,1],[1,1]])add(a*b*.23,c*b*.23,b*.4,b*.4,4+Math.round(hash2(a+hh,c)*2),'block');}}
 else{if(k<.42){const st=2+Math.round(hh*2);add(0,-b*.3,b*.86,b*.24,st,'block');add(0,b*.3,b*.86,b*.24,st,'block');add(-b*.3,0,b*.24,b*.36,st-1,'block');add(b*.3,0,b*.24,b*.36,st+1,'block');}
  else if(k<.68)add(0,0,b*.88,b*.74,2,'saw');
  else if(k<.88){const st=3+Math.round(hh*2);add(0,-b*.22,b*.84,b*.32,st,'slab',.0);add(-b*.05,b*.24,b*.7,b*.3,st+1,'slab');}
  else{add(0,0,b*.48,b*.48,6+Math.round(hh*2),'tower');}}}

// ======================= materials (engine families; feathered ground = protown's pt_ground_feather parameters) =======================
function makeMats(T){const THREE=T.THREE,cm=T.ctx.mats||{},used={},M={};
 const std=o=>new THREE.MeshStandardMaterial(Object.assign({color:0xffffff,vertexColors:true},o));
 const pick=(k,mk)=>{if(cm[k]&&cm[k].isMaterial){used[k]='ctx';return cm[k];}used[k]='own';const m=mk();m.name='pe_'+k;return m;};
 M.building=pick('building',()=>std({roughness:.84,metalness:0}));
 M.metal=pick('metal',()=>std({roughness:.42,metalness:.6}));
 M.light=pick('light',()=>new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true}));
 M.foliage=pick('foliage',()=>std({roughness:.9,metalness:0}));
 M.ground=std({roughness:.95,metalness:0,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});M.ground.name='pe_ground_feather';
 used.ground='own feather (vertex alpha)';return{M,used};}

// ======================= build state =======================
function newBuild(T,L,MM){const fa=T.fa,mk=()=>({ground:buf(fa),building:buf(),metal:buf(),light:buf(),foliage:buf()});
 return{T,L,M:MM.M,used:MM.used,N:mk(),D:mk(),F:{building:buf(),light:buf()},dynM:[],dynL:[],lights:[],movers:[],anims:[],casters:[],farTris:0,
  lit:T.day?.28:.36,warm:hex(PAL.warm,T.day?.32:1)};}
const winCol=(B,h)=>tone(B.warm,.5+.55*h);
function lightPt(B,x,y,z,col,i,d){if(B.lights.length<12)B.lights.push({x,y,z,color:col,intensity:i,dist:d});}

// ---- buildings with ribbon-window bands (lit = light family, dark = glass tone on the wall family) ----
function emitLot(B,l,S,mid){const T=B.T,P=BLOC[l.bloc],pts=rectPts(l.x,l.z,l.w,l.d,l.ry),s=seat(T,pts),yb=s.lo-.12,h=l.st*ST,y1=s.hi+h;
 const wc=hex(P.walls[l.seed%P.walls.length],T.A*(.92+.16*hash2(l.seed,.3))),rc=hex(l.seed%3?P.roof:P.roof2,T.A),dg=hex(PAL.glassD,1);
 const saw=l.kind==='saw';prism(S.building,pts,yb,y1,wc,saw?hex(P.roof,T.A*.9):rc);
 const hall=l.kind==='hall'||saw;
 for(let f=0;f<4;f++){const a=pts[f],c=pts[(f+1)%4],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz);if(len<.3)continue;
  const ox=-dz/len*.014,oz=dx/len*.014,segs=mid?1:Math.max(1,Math.round(len/(hall?1.6:1.0))),stp=mid?2:1,nst=hall?1:l.st;
  for(let k=0;k<nst;k+=stp){const ya=s.hi+k*ST+(hall?.12:.1),yt=ya+(hall?.07:mid?.15:.12);
   for(let g=0;g<segs;g++){const hv=hash2(l.seed*.0137+f*13.1+g*.37,k*7.3+g*1.9),on=hv<B.lit*(hall?.6:1);if(mid&&!on)continue;
    const t0=(g+.1)/segs,t1=(g+.9)/segs,e0=[a[0]+dx*t0+ox,a[1]+dz*t0+oz],e1=[a[0]+dx*t1+ox,a[1]+dz*t1+oz];
    quad(on?S.light:S.building,[e0[0],ya,e0[1]],[e1[0],ya,e1[1]],[e1[0],yt,e1[1]],[e0[0],yt,e0[1]],on?winCol(B,hash2(hv,k)):dg);}}}
 if(saw){const n=Math.max(2,Math.round(l.w/.55)),c=Math.cos(l.ry),sn=Math.sin(l.ry),P3=(lx,y,lz)=>[l.x+lx*c+lz*sn,y,l.z-lx*sn+lz*c],rh=.26;
  for(let i=0;i<n;i++){const xa=-l.w/2+i*l.w/n,xb=xa+l.w/n,zd=l.d/2,lit=!mid&&hash2(l.seed*.01,i)<.5;
   quad(S.building,P3(xa,y1,-zd),P3(xa,y1,zd),P3(xb,y1+rh,zd),P3(xb,y1+rh,-zd),rc);   // sloped roof
   quad(lit?S.light:S.building,P3(xb,y1,-zd),P3(xb,y1+rh,-zd),P3(xb,y1+rh,zd),P3(xb,y1,zd),lit?winCol(B,.4):tone(dg,1.4));   // north-light glazing
   if(!mid){tri(S.building,P3(xa,y1,-zd),P3(xb,y1+rh,-zd),P3(xb,y1,-zd),wc);tri(S.building,P3(xa,y1,zd),P3(xb,y1,zd),P3(xb,y1+rh,zd),wc);}}}
 if(!mid){const m=hex(PAL.steel,.7*T.A);
  if(l.kind==='slab'||l.kind==='tower'||l.kind==='block'){const n=l.kind==='tower'?2:1;for(let i=0;i<n;i++){const u=(hash2(l.seed,i+1)-.5)*l.w*.5,v=(hash2(i+2,l.seed)-.5)*l.d*.4,c=Math.cos(l.ry),sn=Math.sin(l.ry);
    box(S.metal,l.x+u*c+v*sn,y1,l.z-u*sn+v*c,.22+.1*i,.14,.18,l.ry,m);}}
  if(l.kind==='tower'){const c=Math.cos(l.ry),sn=Math.sin(l.ry);strut(S.metal,[l.x,y1,l.z],[l.x,y1+.7,l.z],.018,m);box(S.light,l.x,y1+.68,l.z,.05,.04,.05,0,hex('#FFB070',T.day?.3:1.4));}
  if(l.kind==='hall'){for(let i=0;i<3;i++){const u=(i-1)*l.w*.28,c=Math.cos(l.ry),sn=Math.sin(l.ry);cyl(S.metal,l.x+u*c,y1,l.z-u*sn,.07,.07,.16,6,m,true);}}}}

// ---- ground: feathered two-tone underlay following the warped boundary, strip band, streets ----
function* groundGen(B,S,mid){const T=B.T,L=B.L,R=T.R,hw=T.hw,NR=mid?5:11,NS=mid?36:72,cA=hex(BLOC.A.ground,T.A),cB=hex(BLOC.B.ground,T.A),cS=hex(PAL.strip,T.A);
 const V=(i,j)=>{const a=j*TAU/NS,r=Math.min(T.rb(a)*1.04,R*1.02)*i/NR,x=Math.cos(a)*r,z=Math.sin(a)*r;return[x,T.yl(x,z)-.03,z];};
 const col=p=>{const t=ss(hw*.6,hw*1.7,Math.abs(p[0]));const c=p[0]<0?cA:cB;return[lerp(cS[0],c[0],t),lerp(cS[1],c[1],t),lerp(cS[2],c[2],t)];};
 for(let i=0;i<NR;i++){for(let j=0;j<NS;j++){const p0=V(i,j),p1=V(i+1,j),p2=V(i+1,j+1),p3=V(i,j+1),c=col([(p0[0]+p2[0])/2]);
   if(i===0)triUp(S.ground,p0,p1,p2,c);else quadUp(S.ground,p0,p1,p2,p3,c);}if(!mid&&i%3===2)yield 1;}
 yield 1;
 // no-man's strip: raked gravel band, two worn patrol tracks
 const zA=L.zWall[0]/.92*.98,zB=L.zWall[1]/.92*.98;rectGrid(S.ground,T,0,(zA+zB)/2,hw*2,zB-zA,0,mid?1:3,mid?6:22,hex(PAL.gravel,T.A*.9),.012);
 yield 1;
 // compounds: dark concrete pads
 for(const K of L.blocs){disc(S.ground,T,K.core.x,K.core.z,K.core.r*1.06,mid?2:4,mid?14:28,hex(PAL.concrete,.62*T.A),.016);
  disc(S.ground,T,K.plant.x,K.plant.z,K.plant.r,mid?1:3,mid?12:22,hex(PAL.concrete,.7*T.A),.014);
  disc(S.ground,T,K.yard.x,K.yard.z,K.yard.r,mid?1:3,mid?12:22,hex(K.P.ind,.66*T.A),.014);
  if(!mid)ribbon(S.ground,T,K.ring,.34,hex(PAL.asph,T.A),.024,.6);}
 yield 1;
 const KERB=hex(PAL.kerb,.95*T.A),AS=hex(PAL.asph,T.A);
 for(const st of L.streets){if(mid&&st.kind!=='patrol'&&st.pts.length<14)continue;const step=mid?2.2:.7;
  ribbon(S.ground,T,st.pts,st.w+(mid?.25:.22),KERB,.01,step);ribbon(S.ground,T,st.pts,st.w,AS,.02,step);}
 yield 1;}

// ---- the divide: central wall line + watchtowers, fences, dragon's teeth ----
function divide(B,S,mid){const T=B.T,L=B.L,hw=T.hw,z0=L.zWall[0],z1=L.zWall[1],cc=hex(PAL.concL,.86*T.A),cd=hex(PAL.concrete,.66*T.A),dk=hex(PAL.dark,T.A),st=hex(PAL.steel,.7*T.A);
 const segL=mid?2.4:.9;for(let z=z0;z<z1-.05;z+=segL){const e=Math.min(z1,z+segL),y=T.yl(0,(z+e)/2),j=(Math.round(z/segL)&1)?1:.93;
  box(S.building,0,y-.15,(z+e)/2,.24,1.3,e-z-(mid?0:.03),0,tone(cc,j*.82),tone(cd,1));if(!mid)box(S.building,0,y+1.15,(z+e)/2,.32,.06,e-z,0,cd);}
 const K=5;for(let k=0;k<K;k++){const z=lerp(z0*.84,z1*.84,k/(K-1)),y=T.yl(0,z);
  box(S.building,0,y-.1,z,.42,2.0,.42,0,cc,cd);box(S.building,0,y+1.9,z,.68,.36,.68,0,hex(PAL.glassD,1.2),dk);box(S.building,0,y+2.26,z,.8,.06,.8,0,cd);
  box(S.light,0,y+1.92,z,.7,.05,.7,0,hex(PAL.cool,T.day?.3:1.25),false);
  if(!mid){strut(S.metal,[0,y+2.3,z],[0,y+2.75,z],.015,st);lightPt(B,0,y+2.1,z,'#DCE8F2',.35,5);}}
 if(mid)return;
 const q=T.q;for(const s of[-1,1]){const x=s*hw*.74,zf0=z0*.95,zf1=z1*.95,stp=.5/Math.max(.6,q);let pv=null;
  for(let z=zf0;z<=zf1;z+=stp){const y=T.yl(x,z);strut(S.metal,[x,y-.02,z],[x,y+.48,z],.018,st);if(pv)for(const hy of[.16,.3,.44])strut(S.metal,[x,pv[1]+hy,pv[0]],[x,y+hy,z],.006,st);pv=[z,y];}
  const xt=s*hw*.36;let i=0;for(let z=z0*.92;z<=z1*.92;z+=.42/Math.max(.6,q)){const x2=xt+((i++&1)?.16:-.16)*s,y=T.yl(x2,z);
   const a=[x2-.09,y,z-.09],b=[x2+.09,y,z-.09],c=[x2,y,z+.1],t=[x2,y+.2,z];tri(S.building,a,b,t,cd);tri(S.building,b,c,t,cd);tri(S.building,c,a,t,cd);}}}

// ---- one bloc: core compound (sealed vault + cage + guard ring), ops tower + skybridge, plant, yard, defence belt ----
function core(B,S,K,mid){const T=B.T,c=K.core,cx=c.x,cz=c.z,r=c.r,y=T.yl(cx,cz),cc=hex(PAL.concL,.84*T.A),cd=hex(PAL.concrete,.6*T.A),dk=hex(PAL.dark,T.A),
 vc=hex(PAL.vault,T.A),st=hex(PAL.steel,.6*T.A),glow=hex(K.P.core,T.day?.5:2.3),glowS=hex(K.P.core,T.day?.4:1.2),n=14;
 // polygonal wall (no gate) + coping, guard towers on every other vertex
 const W=polyPts(cx,cz,r,n,.11);for(let i=0;i<n;i++){const a=W[i],e=W[(i+1)%n],mx=(a[0]+e[0])/2,mz=(a[1]+e[1])/2,len=Math.hypot(e[0]-a[0],e[1]-a[1]),ry=Math.atan2(-(e[1]-a[1]),e[0]-a[0]),yy=T.yl(mx,mz);
  box(S.building,mx,yy-.15,mz,len+.06,.95,.2,ry,cc,cd);if(!mid)box(S.building,mx,yy+.8,mz,len+.06,.06,.28,ry,cd);}
 for(let i=0;i<n;i+=2){const a=W[i],yy=T.yl(a[0],a[1]);
  if(mid)box(S.building,a[0],yy-.1,a[1],.36,1.6,.36,0,cc);
  else{cyl(S.building,a[0],yy-.1,a[1],.17,.15,1.5,6,cc);box(S.building,a[0],yy+1.4,a[1],.46,.3,.46,0,hex(PAL.glassD,1.2),dk);box(S.building,a[0],yy+1.7,a[1],.56,.05,.56,0,cd);}
  box(S.light,a[0],yy+1.42,a[1],.48,.04,.48,0,hex(PAL.cool,T.day?.3:1.1),false);}
 // inner fence
 if(!mid){const F=polyPts(cx,cz,r*.78,28,0);for(let i=0;i<F.length;i++){const a=F[i],e=F[(i+1)%F.length],ya=T.yl(a[0],a[1]),ye=T.yl(e[0],e[1]);
   strut(S.metal,[a[0],ya,a[1]],[a[0],ya+.42,a[1]],.014,st);for(const hy of[.2,.4])strut(S.metal,[a[0],ya+hy,a[1]],[e[0],ye+hy,e[1]],.006,st);}}
 // sealed vault: windowless octagon, battered roof, thin glowing seam; the core inside a cage on top
 const vr=r*.4,vh=1.05;prism(S.building,polyPts(cx,cz,vr,8,PI/8),y-.12,y+vh,vc,false);cyl(S.building,cx,y+vh,cz,vr*1.0,vr*.72,.32,8,tone(vc,1.1),tone(vc,.8));
 cyl(S.light,cx,y+vh*.55,cz,vr+.012,vr+.012,.05,8,glowS);
 const hy=y+vh+.32,cr2=vr*.62,ch=1.35;
 cyl(S.light,cx,hy+.15,cz,.08,.36,.45,4,glow);cyl(S.light,cx,hy+.6,cz,.36,.06,.45,4,glow,true);   // the core: a bright diamond held in the cage
 const nC=mid?4:8;for(let i=0;i<nC;i++){const a=i*TAU/nC,px=cx+Math.cos(a)*cr2,pz=cz+Math.sin(a)*cr2;strut(S.metal,[px,hy,pz],[px,hy+ch,pz],mid?.04:.03,dk);}
 for(const k of(mid?[1]:[.35,.7,1])){const P=polyPts(cx,cz,cr2,nC,0);for(let i=0;i<nC;i++){const a=P[i],e=P[(i+1)%nC];strut(S.metal,[a[0],hy+ch*k,a[1]],[e[0],hy+ch*k,e[1]],mid?.035:.025,dk);}}
 if(!mid){for(let i=0;i<4;i++){const a=i*TAU/4+PI/4,px=cx+Math.cos(a)*cr2,pz=cz+Math.sin(a)*cr2;strut(S.metal,[px,hy+ch,pz],[cx,hy+ch+.35,cz],.022,dk);}
  // radiator banks + floodlight masts inside the fence, heavy ground cables vault -> wall
  for(const sd of[-1,1]){for(let i=0;i<6;i++)box(S.metal,cx+sd*r*.6,y,cz+(i-2.5)*.2,.36,.34,.05,0,st);}
  for(let i=0;i<4;i++){const a=i*TAU/4+.4,px=cx+Math.cos(a)*r*.62,pz=cz+Math.sin(a)*r*.62,yy=T.yl(px,pz);strut(S.metal,[px,yy,pz],[px,yy+1.3,pz],.02,st);box(S.light,px,yy+1.28,pz,.12,.05,.12,0,hex(PAL.cool,T.day?.3:1.3));}
  lightPt(B,cx,hy+.5,cz,K.P.core,.9,9);}
 const cab=hex(PAL.cable,1);for(const t of[K.ops,K.plant,K.yard]){const a=Math.atan2(t.z-cz,t.x-cx);ribbon(S.ground,T,[[cx+Math.cos(a)*vr,cz+Math.sin(a)*vr],[cx+Math.cos(a)*r*.98,cz+Math.sin(a)*r*.98]],.16,cab,.03,.5);}
 // controllers' ops tower outside the wall + glazed skybridge over it into the vault
 const o=K.ops,op=rectPts(o.x,o.z,o.w,o.d,0),os=seat(T,op),oh=o.st*ST,wc=hex(K.P.walls[1],T.A);
 prism(S.building,op,os.lo-.12,os.hi+oh,wc,hex(K.P.roof,T.A));
 for(let f=0;f<4;f++){const a=op[f],e=op[(f+1)%4],dx=e[0]-a[0],dz=e[1]-a[1],len=Math.hypot(dx,dz),ox=-dz/len*.014,oz=dx/len*.014;
  for(let k=0;k<o.st;k+=(mid?2:1)){const ya=os.hi+k*ST+.09,yt=ya+.15,on=hash2(f+k*.37,K.s)<.55;if(mid&&!on)continue;
   quad(on?S.light:S.building,[a[0]+dx*.06+ox,ya,a[1]+dz*.06+oz],[e[0]-dx*.06+ox,ya,e[1]-dz*.06+oz],[e[0]-dx*.06+ox,yt,e[1]-dz*.06+oz],[a[0]+dx*.06+ox,yt,a[1]+dz*.06+oz],on?winCol(B,.7):hex(PAL.glassD,1));}}
 const sg=Math.sign(cz-o.z)||1,bz0=o.z+sg*o.d/2,bz1=cz-sg*vr*.95,bl=Math.abs(bz1-bz0);
 box(S.building,cx,y+1.25,(bz0+bz1)/2,.34,.3,bl,0,tone(wc,.85),cd);box(S.light,cx+.175,y+1.36,(bz0+bz1)/2,.01,.08,bl*.9,0,winCol(B,.5),false);box(S.light,cx-.175,y+1.36,(bz0+bz1)/2,.01,.08,bl*.9,0,winCol(B,.5),false);
 if(!mid){const m=hex(PAL.steel,.7*T.A);strut(S.metal,[o.x+.35,os.hi+oh,o.z],[o.x+.35,os.hi+oh+.42,o.z],.02,m);lightPt(B,o.x,os.hi+oh+.1,o.z,PAL.warm,.4,5);}}
function plant(B,S,K,mid){const T=B.T,p=K.plant,y=T.yl(p.x,p.z),cw=hex('#9C9890',.9*T.A),ci=hex('#55524E',T.A),st=hex(PAL.steel,.7*T.A),n=mid?10:18;
 const prof=[[0,.86],[1.3,.62],[2.25,.52],[2.9,.6]];
 for(const sd of[-1,1]){const tx=p.x-K.s*.45,tz=p.z+sd*.86;
  for(let i=0;i<prof.length-1;i++){const a=prof[i],e=prof[i+1];cyl(S.building,tx,y+a[0]-.05,tz,a[1],e[1],e[0]-a[0]+.05,n,cw);if(!mid)cylIn(S.building,tx,y+a[0],tz,a[1]-.04,e[1]-.04,e[0]-a[0],n,ci);}
  if(!mid)cyl(S.building,tx,y+2.88,tz,.61,.61,.04,n,tone(cw,.8));}
 const hx=p.x+K.s*.95;box(S.building,hx,y-.1,p.z,.8,.95,1.6,0,hex(K.P.ind,T.A),hex(K.P.roof,T.A));
 cyl(S.building,hx,y+.8,p.z+.55,.13,.1,2.6,mid?6:10,hex(PAL.concL,.85*T.A));box(S.light,hx,y+3.32,p.z+.55,.08,.05,.08,0,hex('#FFB070',T.day?.3:1.4));
 if(!mid){for(let i=0;i<3;i++){const wx=hx-K.s*.34;quad(S.light,[wx,y+.5,p.z-.7+i*.6],[wx,y+.5,p.z-.4+i*.6],[wx,y+.6,p.z-.4+i*.6],[wx,y+.6,p.z-.7+i*.6],winCol(B,.6));}
  for(let i=0;i<4;i++)for(let j=0;j<2;j++){const bx=p.x+K.s*(.2+j*.45),bz=p.z-1.75+i*.32;box(S.metal,bx,y,bz,.2,.22,.16,0,st);}}}
function yard(B,S,K,mid){const T=B.T,Y=K.yard,y=T.yl(Y.x,Y.z),cols=K.P.cont,st=hex(PAL.steel,.7*T.A),rnd=mulberry32((T.seed^(K.s>0?77:33))>>>0);
 // two warehouses + container rows + a gantry crane over them (the output side of the core)
 box(S.building,Y.x+K.s*.9,y-.1,Y.z-.7,1.0,.62,1.4,0,hex(K.P.ind,T.A),hex(K.P.roof2,T.A));
 for(let i=0;i<4;i++){const cx0=Y.x-K.s*.35+(i-1.5)*.42*K.s*0,cz0=Y.z+.25+(i-1.5)*.42;
  for(let j=0;j<5;j++){const cx=Y.x-K.s*(1.2-j*.36),h=1+(rnd()*3|0);if(mid){box(S.building,cx,y,cz0,.3,h*.17,.32,0,hex(cols[(i+j)%cols.length],T.A));continue;}
   for(let k=0;k<h;k++)box(S.building,cx,y+k*.17,cz0,.3,.16,.32,0,hex(cols[(i*3+j+k)%cols.length],T.A*(.9+.2*rnd())));}}
 if(!mid){const gz0=Y.z-.5,gz1=Y.z+1.1,gx=Y.x-K.s*.45;for(const dx of[-1,1]){strut(S.metal,[gx+dx*1.0,y,gz0],[gx+dx*1.0,y+1.1,gz0],.025,st);strut(S.metal,[gx+dx*1.0,y,gz1],[gx+dx*1.0,y+1.1,gz1],.025,st);
   strut(S.metal,[gx+dx*1.0,y+1.1,gz0],[gx+dx*1.0,y+1.1,gz1],.03,st);}strut(S.metal,[gx-1.0,y+1.1,(gz0+gz1)/2],[gx+1.0,y+1.1,(gz0+gz1)/2],.04,hex('#8A7A5A',.8*T.A));}}
function belt(B,S,K,mid){const T=B.T,L=B.L,s=K.s,x0=K.belt,er=hex(PAL.earth,T.A),erT=hex(PAL.earth,1.12*T.A),cd=hex(PAL.concrete,.72*T.A),dk=hex(PAL.dark,T.A),st=hex(PAL.steel,.65*T.A);
 // earth berm along the divide side (trapezoid section), clipped to the boundary
 const zs=[];for(let z=-T.R;z<=T.R;z+=mid?1.6:.8)if(Math.hypot(x0,z)<T.bAt(x0,z)*.88)zs.push(z);
 const sec=z=>{const xi=x0-s*.36,xo=x0+s*.36,xc0=x0-s*.08,xc1=x0+s*.08;return[[xi,T.yl(xi,z)-.02,z],[xc0,T.yl(x0,z)+.2,z],[xc1,T.yl(x0,z)+.2,z],[xo,T.yl(xo,z)-.02,z]];};
 for(let i=1;i<zs.length;i++){const a=sec(zs[i-1]),b=sec(zs[i]);for(let k=0;k<3;k++){const p=[a[k],b[k],b[k+1],a[k+1]];const col=k===1?erT:er;
   const ux=p[1][0]-p[0][0],uy=p[1][1]-p[0][1],uz=p[1][2]-p[0][2],vx=p[3][0]-p[0][0],vy=p[3][1]-p[0][1],vz=p[3][2]-p[0][2];if(uz*vx-ux*vz>=0)quad(S.building,p[0],p[1],p[2],p[3],col);else quad(S.building,p[0],p[3],p[2],p[1],col);}}
 if(zs.length<3)return;const zA=zs[0],zB=zs[zs.length-1];
 // bunkers facing the divide (slit on the divide side), launcher pads, radar mast
 for(let i=0;i<4;i++){const z=lerp(zA*.8,zB*.8,i/3),bx=x0+s*.95,y=T.yl(bx,z);cyl(S.building,bx,y-.05,z,.44,.25,.32,mid?6:10,cd,tone(cd,.9));
  if(!mid)box(S.building,bx-s*.3,y+.14,z,.06,.05,.3,0,dk);}
 for(const f of[.35,-.35]){const z=lerp(zA,zB,.5+f),lx=x0+s*1.55,y=T.yl(lx,z);box(S.building,lx,y-.05,z,.9,.12,.6,0,cd);
  if(!mid)for(let i=0;i<3;i++){const zz=z-.18+i*.18;strut(S.metal,[lx+s*.25,y+.12,zz],[lx-s*.3,y+.5,zz],.05,st);}
  else box(S.metal,lx,y+.07,z,.5,.2,.5,0,st);}
 const rd=L.radars.find(r=>Math.sign(r.x)===s&&r.k===1);if(rd){const y=T.yl(rd.x,rd.z);
  if(mid)box(S.metal,rd.x,y,rd.z,.12,rd.y,.12,0,st);
  else{const H=rd.y-.1;for(const[a,b]of[[1,1],[-1,1],[-1,-1],[1,-1]])strut(S.metal,[rd.x+a*.22,y,rd.z+b*.22],[rd.x+a*.05,y+H,rd.z+b*.05],.016,st);
   for(let k=1;k<4;k++){const h=H*k/4,w=lerp(.22,.05,k/4);const P=[[w,w],[-w,w],[-w,-w],[w,-w]];for(let i=0;i<4;i++)strut(S.metal,[rd.x+P[i][0],y+h,rd.z+P[i][1]],[rd.x+P[(i+1)%4][0],y+h,rd.z+P[(i+1)%4][1]],.01,st);}}}
 // floodlight poles along the patrol road
 if(!mid)for(const l of L.lamps){if(l.s!==s)continue;const y=T.yl(l.x,l.z);strut(S.metal,[l.x,y,l.z],[l.x,y+.68,l.z],.016,st);box(S.light,l.x-s*.06,y+.64,l.z,.12,.04,.07,0,tone(B.warm,.9));}}
// ---- power line in (plant -> core) and output line out (core -> yard) on pylons: geometry + bead paths ----
function lines(B,S,K,mid){const T=B.T,c=K.core,st=hex(PAL.steel,.6*T.A),cab=hex(PAL.cable,1);
 for(const[t,kind]of[[K.plant,'in'],[K.yard,'out']]){const a=Math.atan2(t.z-c.z,t.x-c.x),ax=c.x+Math.cos(a)*(c.r+.15),az=c.z+Math.sin(a)*(c.r+.15),bx=t.x-Math.cos(a)*(t.r*.55),bz=t.z-Math.sin(a)*(t.r*.55);
  const len=Math.hypot(bx-ax,bz-az),np=Math.max(1,Math.round(len/2.2)),H=1.45,pts=[];
  const pyl=[];for(let i=0;i<=np;i++){const f=i/np,x=lerp(ax,bx,f),z=lerp(az,bz,f);pyl.push([x,T.yl(x,z),z]);}
  for(const p of pyl){if(mid){box(S.metal,p[0],p[1],p[2],.07,H,.07,0,st);continue;}
   for(const[u,v]of[[1,1],[-1,1],[-1,-1],[1,-1]])strut(S.metal,[p[0]+u*.14,p[1],p[2]+v*.14],[p[0]+u*.03,p[1]+H,p[2]+v*.03],.012,st);
   const nx=-Math.sin(a),nz=Math.cos(a);strut(S.metal,[p[0]-nx*.3,p[1]+H-.08,p[2]-nz*.3],[p[0]+nx*.3,p[1]+H-.08,p[2]+nz*.3],.016,st);}
  const nx=-Math.sin(a),nz=Math.cos(a),wires=mid?[0]:[-.26,0,.26];
  for(let i=1;i<pyl.length;i++){const p=pyl[i-1],q=pyl[i],K2=mid?2:5;let prev=null;
   for(let k=0;k<=K2;k++){const f=k/K2,x=lerp(p[0],q[0],f),z=lerp(p[2],q[2],f),y=lerp(p[1],q[1],f)+H-.1-.2*4*f*(1-f);
    if(i===1||k>0)pts.push([x,y,z]);
    if(prev)for(const w of wires)strut(S.metal,[prev[0]+nx*w,prev[1],prev[2]+nz*w],[x+nx*w,y,z+nz*w],mid?.012:.007,cab);prev=[x,y,z];}}
  if(!mid)B.L.lines.push({pts,kind,s:K.s,col:kind==='in'?PAL.warm:K.P.core});}}
function trees(B,S,mid){const T=B.T,fc=hex(PAL.foliage,T.A),tk=hex(PAL.trunk,.7*T.A),rnd=mulberry32((T.seed*31+7)>>>0);
 for(const t of B.L.trees){for(let i=0;i<t.n;i++){const x=t.x+(rnd()-.5)*1.1,z=t.z+(rnd()-.5)*1.1,s=t.s*(.6+rnd()*.35),y=T.yl(x,z);if(Math.hypot(x,z)>T.bAt(x,z)*.98)continue;
  if(mid){cyl(S.foliage,x,y,z,.26*s,0,.75*s,4,fc);continue;}
  cyl(S.foliage,x,y,z,.035*s,.03*s,.25*s,4,tk);cyl(S.foliage,x,y+.18*s,z,.3*s,0,.8*s,6,tone(fc,.85+.3*rnd()));}}}

// ---- animated parts: templates rewritten in anim() (no instancing -> no extra programs) ----
function tmpl(fill){const b=buf();fill(b);return{p:new Float32Array(b.p),n:new Float32Array(b.n),c:new Float32Array(b.c)};}
function dynMesh(B,name,items,mat){const THREE=B.T.THREE;let nv=0;for(const it of items)nv+=it.t.p.length/3;if(!nv)return null;
 const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*3);let o=0;for(const it of items){it.o=o;C.set(it.t.c,o);o+=it.t.p.length;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));
 g.attributes.position.setUsage(THREE.DynamicDrawUsage);g.attributes.normal.setUsage(THREE.DynamicDrawUsage);
 const m=new THREE.Mesh(g,mat);m.name=name;m.frustumCulled=false;m.receiveShadow=mat!==B.M.light;
 const upd=t=>{for(const it of items){const q=it.at(t),x=q[0],y=q[1],z=q[2],c=Math.cos(q[3]),s=Math.sin(q[3]),tp=it.t.p,tn=it.t.n;
   for(let i=0;i<tp.length;i+=3){const lx=tp[i],lz=tp[i+2],nx=tn[i],nz=tn[i+2],j=it.o+i;P[j]=x+lx*c+lz*s;P[j+1]=y+tp[i+1];P[j+2]=z-lx*s+lz*c;N[j]=nx*c+nz*s;N[j+1]=tn[i+1];N[j+2]=-nx*s+nz*c;}}
  g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true;};
 upd(0);g.computeBoundingSphere();B.anims.push(upd);return m;}
function pathFn(pts){const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2]));
 const L=c[c.length-1]||1e-6;return{L,at(d){d=clamp(d,0,L);let i=1;while(i<pts.length-1&&c[i]<d)i++;const a=pts[i-1],e=pts[i],k=clamp((d-c[i-1])/((c[i]-c[i-1])||1e-6),0,1);
  return[a[0]+(e[0]-a[0])*k,a[1]+(e[1]-a[1])*k,a[2]+(e[2]-a[2])*k,Math.atan2(-(e[2]-a[2]),e[0]-a[0])];}};}
function dynParts(B){const T=B.T,L=B.L,st=hex(PAL.steel,.75*T.A),dk=hex(PAL.dark,T.A),itM=[],itL=[];
 const dish=tmpl(b=>{cyl(b,0,-.05,0,.03,.03,.12,4,st);box(b,0,.07,0,.06,.06,.06,0,st);
  const P=(u,v)=>[.06+u*.04*0+(1-v*v)*.0,.12+u,v];for(let i=0;i<6;i++){const v0=-.32+i*.107,v1=v0+.107,u0=.22*(1-Math.min(1,Math.abs(v0)/.33)),u1=.22*(1-Math.min(1,Math.abs(v1)/.33));
   quad(b,[.08,.1-u0*.6,v0],[.08,.1-u1*.6,v1],[.14,.1+u1+.04,v1],[.14,.1+u0+.04,v0],st);quad(b,[.14,.1+u0+.04,v0],[.14,.1+u1+.04,v1],[.08,.1-u1*.6,v1],[.08,.1-u0*.6,v0],tone(st,.7));}});
 for(const r of L.radars){const y=T.yl(r.x,r.z)+r.y,k=r.k;const tt=k===1?dish:dish;itM.push({t:tt,at:t=>[r.x,y,r.z,r.ph+t*r.w]});
  B.movers.push({x:r.x,y,z:r.z,r:.5,n:1});}
 for(const P of L.patrols){const K=L.blocs.find(b=>b.s===P.s),col=hex(K.P.veh,T.A),pts=P.pts.map(p=>[p[0]-P.s*.11,T.yl(p[0],p[1])+.02,p[1]]),pf=pathFn(pts);
  const car=tmpl(b=>{box(b,0,0,0,.36,.12,.17,0,col,tone(col,.9));box(b,-.03,.12,0,.17,.08,.15,0,hex(PAL.glassD,1.3));});
  for(let i=0;i<3;i++){const off=(i/3+hash2(i,P.s)*.2)*pf.L*2,spd=.55+.1*i;itM.push({t:car,at:t=>{const d=((t*spd+off)%(2*pf.L)+2*pf.L)%(2*pf.L),fw=d<pf.L,q=pf.at(fw?d:2*pf.L-d);if(!fw)q[3]+=PI;return q;}});}
  const ring=K.ring.map(p=>[p[0],T.yl(p[0],p[1])+.03,p[1]]),rf=pathFn(ring);itM.push({t:car,at:t=>rf.at(((t*.35+P.s)%rf.L+rf.L)%rf.L)});
  B.movers.push({x:K.core.x,y:.5,z:K.core.z,r:K.core.r,n:1});}
 for(const ln of L.lines){const pf=pathFn(ln.pts),bd=tmpl(b=>box(b,0,-.045,0,.09,.09,.09,0,hex(ln.col,T.day?.6:2.0)));const n=Math.max(3,Math.round(pf.L/.9));
  for(let i=0;i<n;i++){const ph=i/n;itL.push({t:bd,at:t=>{let u=(t*.06+ph)%1;if(ln.kind==='in')u=1-u;return pf.at(u*pf.L);}});}}
 return{itM,itL};}

// ======================= merge: near (chunked jobs), mid, far =======================
const CHUNK=6000;
function geomRange(T,b,t0,t1,rot){const THREE=T.THREE,g=new THREE.BufferGeometry(),a=t0*9,n=(t1-t0)*9,P=new Float32Array(n),N=new Float32Array(n);
 for(let i=0;i<n;i++){P[i]=b.p[a+i];N[i]=b.n[a+i];}
 if(rot)for(let i=0;i<n;i+=3){let q=T.toLocal(P[i],P[i+2]);P[i]=q[0];P[i+2]=q[1];q=T.toLocal(N[i],N[i+2]);N[i]=q[0];N[i+2]=q[1];}
 let C;if(b.a){C=new Float32Array((t1-t0)*12);for(let v=t0*3,j=0;v<t1*3;v++,j+=4){C[j]=b.c[v*3];C[j+1]=b.c[v*3+1];C[j+2]=b.c[v*3+2];C[j+3]=b.a[v];}}
 else{C=new Float32Array(n);for(let i=0;i<n;i++)C[i]=b.c[a+i];}
 g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('color',new THREE.BufferAttribute(C,b.a?4:3));
 g.computeBoundingSphere();return g;}
function wrap(T,name){const THREE=T.THREE,g=new THREE.Group(),inner=new THREE.Group();g.name=name;inner.name=name+'_rot';inner.rotation.y=T.rot;g.add(inner);return{g,inner};}
function famJobs(B,W,bufs,prefix,cast,ck){const THREE=B.T.THREE,jobs=[];
 for(const k of['ground','building','metal','light','foliage']){const b=bufs[k],nt=b?nT(b):0;if(!nt)continue;const CK=k==='ground'?Math.min(ck,4500):ck;
  for(let t=0;t<nt;t+=CK){const t0=t,t1=Math.min(nt,t+CK),sfx=nt>CK?'_'+(t0/CK):'';
   jobs.push(()=>{const m=new THREE.Mesh(geomRange(B.T,b,t0,t1,false),B.M[k]);m.name=prefix+k+sfx;m.receiveShadow=k!=='light';
    if(k==='ground')m.renderOrder=1+t0/CK*.001;if(cast&&(k==='building'||k==='metal')){m.castShadow=true;B.casters.push(m);}W.inner.add(m);});}}
 return jobs;}
function mergeFar(B){const T=B.T,L=B.L,F=B.F,lots=L.lots.slice().sort((a,b)=>b.w*b.d*b.st-a.w*a.d*a.st).slice(0,150);
 for(const l of lots){const P=BLOC[l.bloc],s=seat(T,rectPts(l.x,l.z,l.w,l.d,l.ry));box(F.building,l.x,s.lo-.1,l.z,l.w,s.hi-s.lo+.1+l.st*ST,l.d,l.ry,hex(P.walls[l.seed%P.walls.length],T.A),hex(P.roof,T.A));}
 for(const K of L.blocs){const c=K.core,y=T.yl(c.x,c.z);prism(F.building,polyPts(c.x,c.z,c.r,10,.11),y-.15,y+.8,hex(PAL.concL,.84*T.A));
  prism(F.building,polyPts(c.x,c.z,c.r*.4,8,PI/8),y-.1,y+1.37,hex(PAL.vault,T.A));cyl(F.light,c.x,y+1.4,c.z,.3,.05,.9,4,hex(K.P.core,1.6),true);
  const o=K.ops;box(F.building,o.x,y-.1,o.z,o.w,o.st*ST+.1,o.d,0,hex(K.P.walls[1],T.A),hex(K.P.roof,T.A));
  for(const sd of[-1,1])cyl(F.building,K.plant.x-K.s*.45,y-.05,K.plant.z+sd*.86,.86,.55,2.9,8,hex('#9C9890',.9*T.A));}
 for(let z=L.zWall[0];z<L.zWall[1];z+=3){const e=Math.min(L.zWall[1],z+3);box(F.building,0,T.yl(0,z)-.15,(z+e)/2,.24,1.0,e-z,0,hex(PAL.concL,.86*T.A));}
 const out=[];let tris=0;for(const k of['building','light']){const b=F[k];if(!nT(b))continue;tris+=nT(b);out.push({geom:geomRange(T,b,0,nT(b),true),family:k});}
 B.far=out;B.farTris=tris;}
function trisOf(o){let n=0,d=0;if(o)o.traverse(m=>{if(m.isMesh){const g=m.geometry,c=g.index?g.index.count:g.attributes.position.count;n+=c/3*(m.isInstancedMesh?m.count:1);d++;}});return[Math.round(n),d];}

// ======================= result, buildSteps, build =======================
function emptyResult(msg){perr(msg);return{near:null,mid:null,far:[],casters:[],movers:[],lights:[],anim(){},uniforms:{uT:{value:0}},anchors:{},keepOut:[],footprints:null,stats:{nearTris:0,midTris:0,steps:[]}};}
function finalize(B,steps,ms){const T=B.T,L=B.L,an=B.anims,U={uT:{value:0}},P3=(x,z,y)=>{const q=T.toLocal(x,z);return{x:q[0],y:y==null?T.yl(x,z):y,z:q[1]};};
 const nt=trisOf(B.near),mt=trisOf(B.mid),bl=L.blocs;
 const res={near:B.near,mid:B.mid,far:B.far||[],casters:B.casters,
  movers:B.movers.map(m=>{const q=T.toLocal(m.x,m.z);return{x:q[0],y:m.y,z:q[1],r:m.r,n:m.n};}),
  lights:B.lights.slice(0,12).map(l=>{const q=T.toLocal(l.x,l.z);return{x:q[0],y:l.y,z:q[1],color:l.color,intensity:l.intensity*(B.T.day?.3:1),dist:l.dist};}),
  anim(t){t=+t||0;U.uT.value=t;for(let i=0;i<an.length;i++)an[i](t);},uniforms:U,
  anchors:{square:P3(0,0),seam:P3(0,0),entries:[],divide:{a:P3(0,L.zWall[0]),b:P3(0,L.zWall[1])},
   blocA:P3(bl[0].core.x,bl[0].core.z),blocB:P3(bl[1].core.x,bl[1].core.z),coreA:P3(bl[0].core.x,bl[0].core.z,1.6),coreB:P3(bl[1].core.x,bl[1].core.z,1.6),
   labels:L.labels.map(l=>Object.assign({text:l.text},P3(l.x,l.z,.4)))},
  keepOut:L.ko.map(k=>{const q=T.toLocal(k.x,k.z);return{x:q[0],z:q[1],r:k.r};}).concat([P3(0,0)].map(p=>({x:p.x,z:p.z,r:T.hw}))),
  footprints:{frame:'layout',lots:L.lots.map(l=>[l.x,l.z,l.w,l.d,l.ry,0]),solids:L.solids.slice()},
  stats:{tris:nt[0],ms:Math.round(ms*10)/10,nearTris:nt[0],midTris:mt[0],farTris:B.farTris,nearDraws:nt[1],midDraws:mt[1],lots:L.lots.length,steps},
  ending:'enslaved',matsUsed:B.used,__dbg:Object.assign({streets:L.streets.length,trees:L.trees.length,lamps:L.lamps.length},L.dbg||{})};
 safe('anim(0)',()=>res.anim(0));PE.info.last={stats:res.stats};return res;}
function* buildSteps(site,ctx){const steps=[];let ts=now(),total=0;const SL=site&&+site.sliceMs>0?+site.sliceMs:3.5;
 const mark=n=>{const ms=now()-ts;total+=ms;const o={step:n,ms:Math.round(ms*100)/100};steps.push(o);ts=now();return o;};
 const run=function*(name,gen){let t0=now(),any=false;for(;;){let r;try{r=gen.next();}catch(e){perr(name+': '+(e&&e.message?e.message:e));break;}
  if(r.done)break;any=true;if(now()-t0>=SL){yield mark(name);t0=now();any=false;}}if(any)yield mark(name);};
 const each=function*(arr,fn){for(let i=0;i<arr.length;i++){const a=arr[i];safe('unit',()=>fn(a,i));yield 1;}};
 if(site&&site.ending&&site.ending!=='enslaved')perr('preset "'+site.ending+'" is not enslaved; building enslaved');
 const T=safe('site',()=>mkSite(site,ctx));if(!T||!T.THREE)return emptyResult('THREE not available');
 const LG=layoutGen(T);let L=null;for(;;){let r;try{r=LG.next();}catch(e){return emptyResult('layout: '+(e&&e.message?e.message:e));}if(r.done){L=r.value;break;}yield mark('layout');}
 const MM=safe('materials',()=>makeMats(T));if(!MM)return emptyResult('materials failed');const B=newBuild(T,L,MM);yield mark('materials');
 yield* run('ground',groundGen(B,B.N,false));
 safe('divide',()=>divide(B,B.N,false));yield mark('divide');
 for(const K of L.blocs){safe('core',()=>core(B,B.N,K,false));yield mark('core'+K.key);safe('plant',()=>{plant(B,B.N,K,false);yard(B,B.N,K,false);});yield mark('plant'+K.key);
  safe('belt',()=>{belt(B,B.N,K,false);lines(B,B.N,K,false);});yield mark('belt'+K.key);}
 yield* run('buildings',each(L.lots,l=>emitLot(B,l,B.N,false)));
 safe('trees',()=>trees(B,B.N,false));yield mark('trees');
 const W=wrap(T,'pe_near');B.casters=[];const J=famJobs(B,W,B.N,'pe_',true,CHUNK);yield mark('merge:prep');
 for(const j of J){safe('merge near',j);yield mark('merge:near');}
 safe('dyn',()=>{const D=dynParts(B);const a=dynMesh(B,'pe_dyn_metal',D.itM,B.M.metal),b=dynMesh(B,'pe_dyn_light',D.itL,B.M.light);if(a)W.inner.add(a);if(b)W.inner.add(b);});
 B.near=W.g;yield mark('merge:dyn');
 yield* run('mid:ground',groundGen(B,B.D,true));
 safe('mid parts',()=>{divide(B,B.D,true);for(const K of L.blocs){core(B,B.D,K,true);plant(B,B.D,K,true);yard(B,B.D,K,true);belt(B,B.D,K,true);lines(B,B.D,K,true);}});yield mark('mid:parts');
 yield* run('mid:buildings',each(L.lots,l=>emitLot(B,l,B.D,true)));
 safe('mid trees',()=>trees(B,B.D,true));
 const WM=wrap(T,'pe_mid');for(const j of famJobs(B,WM,B.D,'pe_mid_',false,1e9))safe('merge mid',j);B.mid=WM.g;yield mark('merge:mid');
 safe('far',()=>mergeFar(B));yield mark('merge:far');
 const res=safe('finalize',()=>finalize(B,steps,total));return res||emptyResult('finalize failed');}
function build(site,ctx){const it=buildSteps(site,ctx);let r=it.next();while(!r.done)r=it.next();return r.value;}
const PE={version:1,build,buildSteps,info:{version:1,ending:'enslaved',last:null},blocs:{A:BLOC.A.name,B:BLOC.B.name}};
root.FA.PROENSLAVED=PE;
})();
